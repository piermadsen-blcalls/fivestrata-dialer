// Incremental watermark sync: Supabase (hot operational store) -> Snowflake
// (results DB). Per docs/architecture/snowflake-value.md: idempotent MERGE
// upserts keyed by row id, "everything since the last high-water mark", so
// nightly -> hourly -> streaming is a scheduling change, never a rewrite.
//
// Portability (the pipe may move accounts): the watermark is DERIVED FROM THE
// TARGET (MAX(watermark) per Snowflake table), never stored locally. Pointing
// .env at a fresh account backfills from zero with this same script, as long
// as Supabase still retains the history. No state to migrate.
//
// Watermark strategy per table:
//   leads       ts  updated_at, 2h lookback   (mutable; has updated_at)
//   calls       ts  created_at, 7d lookback   (mutable — dispositions/ended_at
//               land after insert and there is no updated_at column, so we
//               re-MERGE a trailing window every run; MERGE makes that free)
//   call_turns  id  keyset on bigint identity (append-only)
//   call_events id  keyset on bigint identity (append-only)
//
// Load path: rows -> session temp table (all VARCHAR) via bulk array binds ->
// MERGE with TRY_* casts into the typed target. Fine for nightly pilot
// volumes; at scale this becomes files on an S3 stage + COPY/Snowpipe with
// the same extract logic (Phase B, needs the AWS half of T8).
//
// Run: npx tsx scripts/snowflake-sync.ts            (all tables)
//      npx tsx scripts/snowflake-sync.ts calls      (one table)
// Prints counts only — never row contents (org policy: no lead data in chat/repo).
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { connect, destroy, exec, readSnowflakeEnv, type SfConnection } from './snowflake-common.js';

type ColType = 'text' | 'ts' | 'num' | 'bool' | 'json';

interface TableSpec {
  table: string; // same name in Supabase (lowercase) and Snowflake (uppercase)
  appendOnly: boolean;
  watermark:
    | { kind: 'id'; column: string }
    | { kind: 'ts'; column: string; lookbackHours: number };
  columns: Array<[string, ColType]>; // id first
}

const SPECS: TableSpec[] = [
  {
    table: 'leads',
    appendOnly: false,
    watermark: { kind: 'ts', column: 'updated_at', lookbackHours: 2 },
    columns: [
      ['id', 'text'], ['oleadid', 'text'], ['phone_number', 'text'],
      ['first_name', 'text'], ['last_name', 'text'], ['address1', 'text'],
      ['city', 'text'], ['state', 'text'], ['postal_code', 'text'],
      ['email', 'text'], ['vertical', 'text'], ['lead_type', 'text'],
      ['source', 'text'], ['sub_source', 'text'], ['status', 'text'],
      ['dnc', 'bool'], ['vicidial_lead_id', 'text'],
      ['created_at', 'ts'], ['updated_at', 'ts'],
    ],
  },
  {
    table: 'calls',
    appendOnly: false,
    watermark: { kind: 'ts', column: 'created_at', lookbackHours: 24 * 7 },
    columns: [
      ['id', 'text'], ['lead_id', 'text'], ['script_id', 'text'],
      ['voice_pack_id', 'text'], ['did_id', 'text'],
      ['telnyx_call_control_id', 'text'], ['telnyx_call_session_id', 'text'],
      ['vicidial_uniqueid', 'text'], ['campaign_id', 'text'], ['agent_id', 'text'],
      ['direction', 'text'], ['started_at', 'ts'], ['answered_at', 'ts'],
      ['ended_at', 'ts'], ['duration_sec', 'num'], ['disposition', 'text'],
      ['contact_quality', 'text'], ['transferred_client_id', 'text'],
      ['recording_url', 'text'], ['canned_seconds', 'num'], ['tts_seconds', 'num'],
      ['created_at', 'ts'],
    ],
  },
  {
    table: 'call_turns',
    appendOnly: true,
    watermark: { kind: 'id', column: 'id' },
    columns: [
      ['id', 'num'], ['call_id', 'text'], ['turn_index', 'num'],
      ['context', 'json'], ['source', 'text'], ['clip_id', 'text'],
      ['tts_text', 'text'], ['audio_sec', 'num'], ['outcome', 'text'],
      ['occurred_at', 'ts'],
    ],
  },
  {
    table: 'call_events',
    appendOnly: true,
    watermark: { kind: 'id', column: 'id' },
    columns: [
      ['id', 'num'], ['call_id', 'text'], ['call_control_id', 'text'],
      ['call_session_id', 'text'], ['event_type', 'text'],
      ['occurred_at', 'ts'], ['payload', 'json'],
      ['created_at', 'ts'],
    ],
  },
];

const PAGE = 1000; // PostgREST hard cap per page
const INSERT_CHUNK = 5000;

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? '';
if (!supabaseUrl || !supabaseKey) {
  console.log('SYNC FAIL  SUPABASE_URL / SUPABASE_SECRET_KEY missing in .env');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

function toStaged(v: unknown, type: ColType): string | null {
  if (v === null || v === undefined) return null;
  if (type === 'json') return JSON.stringify(v);
  if (type === 'bool') return v ? 'true' : 'false';
  return String(v);
}

function castExpr(col: string, type: ColType): string {
  const c = col.toUpperCase();
  switch (type) {
    case 'ts': return `TRY_TO_TIMESTAMP_TZ(${c})`;
    case 'num': return `TRY_TO_DOUBLE(${c})`;
    case 'bool': return `TRY_TO_BOOLEAN(${c})`;
    case 'json': return `TRY_PARSE_JSON(${c})`;
    default: return c;
  }
}

// Fetch everything past the watermark. Append-only tables use exact keyset
// pagination on the bigint id; ts tables use offset pagination ordered by
// (watermark, id) — a concurrent insert can shift pages, which the JS-side
// dedupe plus the next run's lookback window both absorb.
async function fetchRows(spec: TableSpec, watermark: unknown): Promise<Record<string, unknown>[]> {
  const cols = spec.columns.map(([c]) => c).join(',');
  const out: Record<string, unknown>[] = [];

  if (spec.watermark.kind === 'id') {
    let lastId = typeof watermark === 'number' ? watermark : Number(watermark ?? 0) || 0;
    for (;;) {
      const { data, error } = await supabase
        .from(spec.table)
        .select(cols)
        .gt(spec.watermark.column, lastId)
        .order(spec.watermark.column, { ascending: true })
        .limit(PAGE);
      if (error) throw new Error(`supabase ${spec.table}: ${error.message}`);
      const rows = (data ?? []) as unknown as Record<string, unknown>[];
      out.push(...rows);
      if (rows.length < PAGE) break;
      lastId = Number(rows[rows.length - 1][spec.watermark.column]);
    }
    return out;
  }

  const wmDate = watermark ? new Date(String(watermark)) : new Date(0);
  const since = new Date(wmDate.getTime() - spec.watermark.lookbackHours * 3_600_000).toISOString();
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase
      .from(spec.table)
      .select(cols)
      .gte(spec.watermark.column, since)
      .order(spec.watermark.column, { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`supabase ${spec.table}: ${error.message}`);
    const rows = (data ?? []) as unknown as Record<string, unknown>[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  // dedupe by id (offset pagination can double-deliver on concurrent writes)
  const seen = new Map<string, Record<string, unknown>>();
  for (const r of out) seen.set(String(r.id), r);
  return [...seen.values()];
}

async function syncTable(conn: SfConnection, spec: TableSpec): Promise<void> {
  const target = spec.table.toUpperCase();
  const wmCol = spec.watermark.column.toUpperCase();
  const [wmRow] = await exec(conn, `SELECT MAX(${wmCol}) AS WM FROM ${target}`);
  const rows = await fetchRows(spec, wmRow.WM);
  if (!rows.length) {
    console.log(`${target.padEnd(12)} OK    0 new rows (high-water ${wmCol}=${String(wmRow.WM ?? 'empty')})`);
    return;
  }

  const stg = `STG_${target}`;
  const colNames = spec.columns.map(([c]) => c.toUpperCase());
  await exec(conn, `CREATE OR REPLACE TEMPORARY TABLE ${stg} (${colNames.map((c) => `${c} VARCHAR`).join(', ')})`);

  const staged = rows.map((r) => spec.columns.map(([c, t]) => toStaged(r[c], t)));
  const placeholders = `(${spec.columns.map(() => '?').join(',')})`;
  for (let i = 0; i < staged.length; i += INSERT_CHUNK) {
    await exec(conn, `INSERT INTO ${stg} VALUES ${placeholders}`, staged.slice(i, i + INSERT_CHUNK));
  }

  const casts = spec.columns.map(([c, t]) => `${castExpr(c, t)} AS ${c.toUpperCase()}`).join(', ');
  const nonId = colNames.filter((c) => c !== 'ID');
  const updateClause = spec.appendOnly
    ? ''
    : `WHEN MATCHED THEN UPDATE SET ${nonId.map((c) => `t.${c} = s.${c}`).join(', ')}, t._SYNCED_AT = CURRENT_TIMESTAMP() `;
  const merged = await exec(
    conn,
    `MERGE INTO ${target} t USING (SELECT ${casts} FROM ${stg}) s ON t.ID = s.ID ` +
      updateClause +
      `WHEN NOT MATCHED THEN INSERT (${colNames.join(', ')}, _SYNCED_AT) ` +
      `VALUES (${colNames.map((c) => `s.${c}`).join(', ')}, CURRENT_TIMESTAMP())`,
  );
  const stats = merged[0] ?? {};
  const inserted = Number(stats['number of rows inserted'] ?? 0);
  const updated = Number(stats['number of rows updated'] ?? 0);
  console.log(`${target.padEnd(12)} OK    ${rows.length} pulled -> ${inserted} inserted, ${updated} updated`);
}

const only = process.argv[2]?.toLowerCase();
const specs = only ? SPECS.filter((s) => s.table === only) : SPECS;
if (!specs.length) {
  console.log(`SYNC FAIL  unknown table '${only}' (know: ${SPECS.map((s) => s.table).join(', ')})`);
  process.exit(1);
}

const conn = await connect(readSnowflakeEnv());
let failed = false;
for (const spec of specs) {
  try {
    await syncTable(conn, spec);
  } catch (e) {
    console.log(`${spec.table.toUpperCase().padEnd(12)} FAIL  ${(e as Error).message}`);
    failed = true;
  }
}
await destroy(conn);
process.exit(failed ? 1 : 0);
