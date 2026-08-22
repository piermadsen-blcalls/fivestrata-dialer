// Disposition outbox — the contract's "exactly once per call" (guide §4.2/§5)
// as idempotent-enqueue + at-least-once delivery:
//
//   enqueueDisposition()  freezes the payload and inserts one row per
//                         dedupe_key (upsert-ignore) — enqueue as many times
//                         as you like, one delivery pipeline entry results.
//                         A duplicate call_id under a different dedupe key is
//                         also absorbed as an idempotent no-op.
//   drainOutbox()         claims due rows atomically (dispo_claim RPC:
//                         SKIP LOCKED + lease), POSTs, marks delivered, or
//                         schedules a backoff retry. Contract: retry only on
//                         network failure or non-2xx; 'failed' after
//                         max_attempts is an escalation flag, never a silent
//                         drop.
//
// Hardened per adversarial review 2026-08-21: the lease is auto-sized to
// cover the whole sequential batch (limit × timeout + slack) so a slow batch
// can't expire mid-run and double-deliver; finalization updates are fenced on
// (id, state, attempts) so a stale lease-holder no-ops instead of clobbering
// a reclaimer; the delivered-mark (the most valuable write in the pipeline)
// retries before giving up.
//
// Run the drain from anywhere (dial engine tick, cron, scripts/dispo-drain.ts).
import { supabase } from '../clients/supabase.js';
import {
  buildDispositionPayload,
  numFromEnv,
  postDisposition,
  type DispositionFields,
} from '../clients/fivestrataOutbound.js';

export interface EnqueueInput extends DispositionFields {
  /** Idempotency key — use the call id when one exists. */
  dedupeKey: string;
  vertical: string;
  callId?: string | null;
  leadId?: string | null;
}

export interface EnqueueResult {
  enqueued: boolean; // false = row already existed (idempotent no-op)
  id: number | null;
}

export async function enqueueDisposition(input: EnqueueInput): Promise<EnqueueResult> {
  const payload = buildDispositionPayload(input); // throws on missing required fields
  const { data, error } = await supabase
    .from('dispo_outbox')
    .upsert(
      {
        dedupe_key: input.dedupeKey,
        call_id: input.callId ?? null,
        lead_id: input.leadId ?? null,
        oleadid: input.oleadid,
        vertical: input.vertical,
        payload,
      },
      { onConflict: 'dedupe_key', ignoreDuplicates: true },
    )
    .select('id');
  if (error) {
    // 23505 here can only be dispo_outbox_call_uniq (the dedupe_key conflict
    // is absorbed by the upsert): same call under a different dedupe key —
    // still "already have a live dispo for this call", still idempotent.
    if (error.code === '23505') return { enqueued: false, id: null };
    throw new Error(`dispo_outbox enqueue failed: ${error.message}`);
  }
  const row = data?.[0];
  return { enqueued: Boolean(row), id: row?.id ?? null };
}

/** Exponential backoff, capped: 1m, 4m, 16m, ~1h, ~4h, then 6h flat. */
export function backoffSeconds(attempts: number): number {
  return Math.min(6 * 3600, 60 * 4 ** Math.max(0, attempts - 1));
}

export interface DrainOptions {
  limit?: number;
  /** Test hooks. */
  url?: string;
  timeoutMs?: number;
  leaseSeconds?: number;
}

export interface DrainResult {
  claimed: number;
  delivered: number;
  retried: number;
  failed: number; // rows that crossed max_attempts this pass
  lostLease: number; // rows another worker reclaimed before we could finalize
}

/**
 * Fenced finalization: only update the row if we still hold the claim
 * (state='delivering' AND attempts unchanged since our claim). Returns
 * 'done' | 'lost' (someone reclaimed it) | 'error' (update failed).
 */
async function finalize(
  rowId: number,
  claimedAttempts: number,
  patch: Record<string, unknown>,
  retries: number,
): Promise<'done' | 'lost' | 'error'> {
  for (let i = 0; i <= retries; i++) {
    const { data, error } = await supabase
      .from('dispo_outbox')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', rowId)
      .eq('state', 'delivering')
      .eq('attempts', claimedAttempts)
      .select('id');
    if (!error) return (data?.length ?? 0) > 0 ? 'done' : 'lost';
    console.error(`dispo_outbox ${rowId} finalize failed (try ${i + 1}):`, error.message);
    if (i < retries) await new Promise((r) => setTimeout(r, 500 * (i + 1)));
  }
  return 'error';
}

export async function drainOutbox(opts: DrainOptions = {}): Promise<DrainResult> {
  const limit = Number.isInteger(opts.limit) && (opts.limit ?? 0) > 0 ? (opts.limit as number) : 10;
  const timeoutMs = opts.timeoutMs ?? numFromEnv('FS_DISPO_TIMEOUT_MS', 15_000);
  // The lease covers the WHOLE sequential batch: a batch of `limit` posts can
  // take limit × timeout in the worst case; expiring mid-batch would let a
  // concurrent drain double-deliver the tail rows.
  const batchWorstCaseSec = Math.ceil((limit * timeoutMs) / 1000) + 30;
  const leaseSeconds = Math.max(opts.leaseSeconds ?? 120, batchWorstCaseSec);

  const { data: rows, error } = await supabase.rpc('dispo_claim', {
    p_limit: limit,
    p_lease_seconds: leaseSeconds,
  });
  if (error) throw new Error(`dispo_claim failed: ${error.message}`);

  const result: DrainResult = {
    claimed: rows?.length ?? 0,
    delivered: 0,
    retried: 0,
    failed: 0,
    lostLease: 0,
  };

  for (const row of rows ?? []) {
    const post = await postDisposition(row.payload, row.vertical, { url: opts.url, timeoutMs });

    if (post.ok) {
      // The POST succeeded — this mark is the most valuable write in the
      // pipeline (an unmarked success gets re-POSTed at lease expiry).
      const outcome = await finalize(
        row.id,
        row.attempts,
        {
          state: 'delivered',
          last_status: post.httpStatus,
          last_error: null,
          delivered_at: new Date().toISOString(),
        },
        3,
      );
      if (outcome === 'done') result.delivered++;
      else {
        result.lostLease++;
        console.error(
          `dispo_outbox ${row.id} (oleadid ${row.oleadid}) POSTed OK but delivered-mark ${outcome} — may re-deliver at lease expiry; investigate`,
        );
      }
      continue;
    }

    const exhausted = row.attempts >= row.max_attempts;
    const outcome = await finalize(
      row.id,
      row.attempts,
      {
        state: exhausted ? 'failed' : 'pending',
        last_status: post.httpStatus,
        last_error: post.error,
        next_attempt_at: new Date(Date.now() + backoffSeconds(row.attempts) * 1000).toISOString(),
      },
      1,
    );
    if (outcome !== 'done') {
      result.lostLease++;
      continue;
    }
    if (exhausted) {
      console.error(
        `dispo_outbox ${row.id} (oleadid ${row.oleadid}) FAILED after ${row.attempts} attempts — needs human attention`,
      );
      result.failed++;
    } else {
      result.retried++;
    }
  }

  return result;
}
