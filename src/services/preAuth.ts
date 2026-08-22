// Pre-auth with fact-stream logging: every Transfer Client ping lands in
// preauth_log (per-dial grain) regardless of outcome — the `raw` response is
// kept verbatim so the authorized/no_client classifier can be calibrated
// against FiveStrata's real (undocumented) `result` vocabulary.
//
// The dial engine's rule stays the guide's rule: only outcome === 'authorized'
// may dial/transfer; everything else fails closed.
import { supabase } from '../clients/supabase.js';
import { preAuthorize, type PreAuthInput, type PreAuthResult } from '../clients/fivestrataOutbound.js';

function canonicalDigits(phone: string): string {
  // Mirrors SQL phone_digits(): digits only, NANP country prefix stripped.
  let d = phone.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
  return d;
}

export interface PreAuthLogContext {
  leadId?: string | null;
  callId?: string | null;
}

export async function preAuthorizeAndLog(
  input: PreAuthInput,
  ctx: PreAuthLogContext = {},
  opts: { url?: string; timeoutMs?: number } = {},
): Promise<PreAuthResult> {
  let result: PreAuthResult;
  try {
    result = await preAuthorize(input, opts);
  } catch (err) {
    // Config-class throws (missing creds, unknown vertical) still fail closed
    // AND still land in the fact stream — misconfiguration is exactly the
    // class of ping you want visible in preauth_log.
    result = {
      outcome: 'error',
      client: null,
      httpStatus: null,
      latencyMs: 0,
      error: err instanceof Error ? err.message : String(err),
      raw: null,
    };
  }

  const { error } = await supabase.from('preauth_log').insert({
    lead_id: ctx.leadId ?? null,
    call_id: ctx.callId ?? null,
    oleadid: input.oleadid,
    vertical: input.vertical,
    zip: input.zip,
    phone_digits: canonicalDigits(input.phone),
    outcome: result.outcome,
    result: result.client?.result ?? null,
    fs_client_id: result.client?.clientId ?? null,
    client_name: result.client?.clientName ?? null,
    transfer_code: result.client?.transferCode ?? null,
    transfer_phone: result.client?.transferPhone ?? null,
    brand_id: result.client?.brandId ?? null,
    http_status: result.httpStatus,
    latency_ms: result.latencyMs,
    error: result.error,
    raw: result.raw ?? null,
  });
  // Logging failure must not flip an authorization decision — but it must be
  // loud: the log is the calibration data AND the brandId provenance chain.
  if (error) console.error('preauth_log insert failed:', error.message);

  return result;
}
