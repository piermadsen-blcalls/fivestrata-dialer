// D4: screening step — reputation check on every 'screening' DID before first dial.
// Built screening-ready, degrades gracefully (Sean 8/17): while Number Reputation
// is deferred (D8d), numbers pass through to 'warming' tagged {"unscreened":true};
// on enablement day run with --all to retro-screen the whole live pool.
//
// Flagged numbers -> 'quarantined' (never dialed). Telnyx release of quarantined
// numbers stays MANUAL/guarded (D10 sweep territory) — this script never deletes.
//
// Run: node --import tsx scripts/did-screen.ts [--all]
import 'dotenv/config';

const API = 'https://api.telnyx.com/v2';
const WARMUP_DAYS = 7;

const apiKey = process.env.TELNYX_API_KEY ?? '';
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!apiKey || !supabaseUrl || !supabaseKey) { console.error('Need TELNYX_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY in .env'); process.exit(1); }

const tHeaders = { Authorization: `Bearer ${apiKey}` };
const sb = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };
const all = process.argv.includes('--all');

const scope = all ? 'status=not.in.(retired)' : 'status=eq.screening';
const dids: any[] = (await fetch(`${supabaseUrl}/rest/v1/dids?select=id,phone_number,status&${scope}`, { headers: sb }).then(r => r.json()))
  .filter((d: any) => !d.phone_number.startsWith('+1555')); // demo rows never screen
if (!dids.length) { console.log(`No DIDs in scope (${all ? 'all live' : 'status=screening'}).`); process.exit(0); }
console.log(`${dids.length} DID(s) in scope (${all ? 'retro-screen all live' : 'screening'}).`);

// Is Number Reputation live on this account?
const enterprises = (await fetch(`${API}/enterprises`, { headers: tHeaders }).then(r => r.json()))?.data ?? [];
let enterprise: any = null;
for (const e of enterprises) {
  const rep = await fetch(`${API}/enterprises/${e.id}/reputation`, { headers: tHeaders }).then(r => r.json()).catch(() => ({}));
  if (String(rep?.data?.status ?? '').toLowerCase() === 'approved') { enterprise = e; break; }
}

const patch = async (id: string, body: any) =>
  fetch(`${supabaseUrl}/rest/v1/dids?id=eq.${id}`, { method: 'PATCH', headers: { ...sb, Prefer: 'return=minimal' }, body: JSON.stringify(body) });
const warmupUntil = new Date(Date.now() + WARMUP_DAYS * 864e5).toISOString();

if (!enterprise) {
  // ---- Deferred mode: pass through unscreened -----------------------------------
  console.log('Number Reputation NOT enabled (D8d deferred) — passing through UNSCREENED.');
  for (const d of dids.filter(x => x.status === 'screening')) {
    await patch(d.id, { status: 'warming', warmup_until: warmupUntil, reputation_flags: { unscreened: true } });
    console.log(`  ***${d.phone_number.slice(-4)}  screening -> warming (unscreened, warmup ${WARMUP_DAYS}d)`);
  }
  console.log('\nEnablement day: run did-reputation-enable.ts, then re-run this with --all to retro-screen.');
  process.exit(0);
}

// ---- Live mode: associate (idempotent, 100/batch) then read reputation ------------
console.log(`Number Reputation live (enterprise ${enterprise.id}) — screening for real.`);
for (let i = 0; i < dids.length; i += 100) {
  const chunk = dids.slice(i, i + 100).map(d => d.phone_number);
  const r = await fetch(`${API}/enterprises/${enterprise.id}/reputation/numbers`, {
    method: 'POST', headers: { ...tHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_numbers: chunk }),
  });
  if (!r.ok && r.status !== 409 && r.status !== 422) console.error(`  associate batch -> ${r.status} (continuing; may already be associated)`);
}

let kept = 0, flagged = 0;
for (const d of dids) {
  const r = await fetch(`${API}/enterprises/${enterprise.id}/reputation/numbers/${encodeURIComponent(d.phone_number)}`, { headers: tHeaders }).then(x => x.json()).catch(() => ({}));
  const rep = r?.data?.reputation_data ?? {};
  const risk = String(rep.spam_risk ?? 'unknown').toLowerCase();
  const bad = risk === 'high' || risk === 'medium';
  const now = new Date().toISOString();
  if (bad) {
    flagged++;
    await patch(d.id, { status: 'quarantined', screened_at: now, reputation_checked_at: now, reputation_flags: rep });
    console.log(`  ***${d.phone_number.slice(-4)}  FLAGGED (${risk}/${rep.spam_category ?? '-'}) -> quarantined`);
  } else {
    kept++;
    const move = d.status === 'screening' ? { status: 'warming', warmup_until: warmupUntil } : {};
    await patch(d.id, { ...move, screened_at: now, reputation_checked_at: now, reputation_flags: rep });
    console.log(`  ***${d.phone_number.slice(-4)}  clean (${risk})${d.status === 'screening' ? ' -> warming' : ''}`);
  }
}
console.log(`\nKeep rate: ${kept}/${kept + flagged} (${((100 * kept) / Math.max(1, kept + flagged)).toFixed(0)}%) — the real number behind the "~80% kept" claim.`);
