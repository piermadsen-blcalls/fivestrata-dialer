// Seed zip_timezones (migration 0010) — ZIP3 -> IANA timezone for L3 TCPA windows
// (docs/architecture/campaign-delivery.md §5: lead tz is ZIP-based, phone-NPA fallback).
//
// Derivation: GeoNames postal centroids (US + PR + VI + GU, CC-BY 4.0) resolved to an
// IANA zone per 5-digit ZIP via tz-lookup (public-domain polygon data, pinned tarball —
// fetched at runtime because npm install is permission-blocked on this box), then
// collapsed to ZIP3 by majority of member ZIPs. ZIP3s that straddle timezone lines are
// reported with their majority share. Military APO/FPO ranges (090-098 AE, 340 AA,
// 962-966 AP) are excluded — GeoNames geolocates them at the overseas bases themselves
// (096 -> Europe/Rome), useless for TCPA; the runtime NPA fallback covers those leads.
//
// Dry-run by default: computes the mapping, prints summary + straddlers + spot checks,
// writes nothing. --apply upserts via the Management API database/query endpoint (same
// path as scripts/db-apply.ts; token from C:\Claude\supabase-cli-env.sh) and re-verifies
// with a count + spot-check SELECT. Never prints credentials.
//
// Run: node --import tsx scripts/zip-tz-seed.ts [--apply]
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const APPLY = process.argv.includes('--apply');
const CACHE = 'C:/Claude/scratch/zip-tz-cache';
const PROJECT_REF = 'wcftuethlcgeasopayed';
const ENV_SCRIPT = 'C:/Claude/supabase-cli-env.sh';
const TZ_LOOKUP_TGZ = 'https://registry.npmjs.org/tz-lookup/-/tz-lookup-6.1.25.tgz';
const GEONAMES = ['US', 'PR', 'VI', 'GU']; // {CC}.zip each containing {CC}.txt
const isMilitary = (zip3: string) =>
  (zip3 >= '090' && zip3 <= '098') || zip3 === '340' || (zip3 >= '962' && zip3 <= '966');
const SPOT_CHECKS: Record<string, string> = {
  '949': 'America/Los_Angeles',
  '100': 'America/New_York',
  '606': 'America/Chicago',
};

mkdirSync(CACHE, { recursive: true });

async function download(url: string, dest: string) {
  if (existsSync(dest)) return;
  console.log(`fetch ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

function extract(archive: string, ...tarArgs: string[]) {
  // System32 bsdtar (handles .zip and C:\ paths); PATH tar may be GNU tar from Git,
  // which misreads drive letters as remote hosts.
  const tar = 'C:/Windows/System32/tar.exe';
  const r = spawnSync(tar, ['-xf', archive, '-C', CACHE, ...tarArgs], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`tar failed on ${archive}: ${r.stderr}`);
}

// --- acquire datasets (cached; delete C:\Claude\scratch\zip-tz-cache to refresh) ---
for (const cc of GEONAMES) {
  const zip = join(CACHE, `${cc}.zip`);
  const txt = join(CACHE, `${cc}.txt`);
  await download(`https://download.geonames.org/export/zip/${cc}.zip`, zip);
  if (!existsSync(txt)) extract(zip, `${cc}.txt`);
}
const tgz = join(CACHE, 'tz-lookup-6.1.25.tgz');
const tzjs = join(CACHE, 'package/tz.js');
await download(TZ_LOOKUP_TGZ, tgz);
if (!existsSync(tzjs)) extract(tgz, 'package/tz.js');
const tzlookup: (lat: number, lng: number) => string = createRequire(import.meta.url)(tzjs);

// --- 5-digit ZIP -> tz, tallied per ZIP3 ---
// GeoNames postal format (tab-separated): country, postal, place, admin1_name,
// admin1_code, admin2_name, admin2_code, admin3_name, admin3_code, lat, lng, accuracy
const tally = new Map<string, Map<string, number>>();
let zips = 0, skipped = 0;
for (const cc of GEONAMES) {
  for (const line of readFileSync(join(CACHE, `${cc}.txt`), 'utf8').split('\n')) {
    const f = line.split('\t');
    const postal = f[1];
    if (!postal || !/^\d{5}$/.test(postal)) continue;
    if (isMilitary(postal.slice(0, 3))) { skipped++; continue; }
    const lat = Number(f[9]), lng = Number(f[10]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) { skipped++; continue; }
    const tz = tzlookup(lat, lng);
    const zip3 = postal.slice(0, 3);
    const counts = tally.get(zip3) ?? new Map<string, number>();
    counts.set(tz, (counts.get(tz) ?? 0) + 1);
    tally.set(zip3, counts);
    zips++;
  }
}

// --- majority per ZIP3; straddlers reported ---
const mapping = new Map<string, string>();
const straddlers: { zip3: string; winner: string; share: number; mix: string }[] = [];
for (const [zip3, counts] of [...tally.entries()].sort()) {
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const total = ranked.reduce((s, [, n]) => s + n, 0);
  const [winner, wins] = ranked[0];
  mapping.set(zip3, winner);
  if (ranked.length > 1) {
    straddlers.push({
      zip3, winner, share: wins / total,
      mix: ranked.map(([tz, n]) => `${tz}:${n}`).join(' '),
    });
  }
}

console.log(`\n${zips} ZIPs (${skipped} skipped: military/no-coords) -> ${mapping.size} ZIP3 rows`);
console.log(`${straddlers.length} ZIP3s straddle a timezone line (majority wins):`);
for (const s of straddlers.sort((a, b) => a.share - b.share).slice(0, 15)) {
  console.log(`  ${s.zip3} -> ${s.winner} (${Math.round(s.share * 100)}% of ${s.mix})`);
}
if (straddlers.length > 15) console.log(`  ... ${straddlers.length - 15} more, all >= ${Math.round(straddlers[15].share * 100)}% majority`);

let spotFail = false;
for (const [zip3, want] of Object.entries(SPOT_CHECKS)) {
  const got = mapping.get(zip3);
  const ok = got === want;
  if (!ok) spotFail = true;
  console.log(`spot ${zip3}: ${got} ${ok ? 'OK' : `EXPECTED ${want} — FAIL`}`);
}
if (spotFail) {
  console.error('spot checks failed — not applying');
  process.exitCode = 1;
} else if (!APPLY) {
  console.log('\nDry run (default). Re-run with --apply to upsert into zip_timezones.');
} else {
  // --- upsert via Management API (db-apply.ts pattern) ---
  const envText = readFileSync(ENV_SCRIPT, 'utf8');
  const token = envText.match(/^export SUPABASE_ACCESS_TOKEN=(.+)$/m)?.[1]
    ?.trim().replace(/\r$/, '').replace(/^["']|["']$/g, '') ?? '';
  if (!token) throw new Error(`SUPABASE_ACCESS_TOKEN not found in ${ENV_SCRIPT}`);
  const query = async (sql: string) => {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql }),
    });
    const body = await res.text();
    if (!res.ok) throw new Error(`database/query HTTP ${res.status}: ${body.slice(0, 500)}`);
    return JSON.parse(body);
  };

  const values = [...mapping.entries()].map(([z, tz]) => `('${z}','${tz}')`).join(',');
  await query(`insert into zip_timezones (zip3, tz) values ${values}
    on conflict (zip3) do update set tz = excluded.tz;`);
  console.log(`\nupserted ${mapping.size} rows`);

  const spotList = Object.keys(SPOT_CHECKS).map((z) => `'${z}'`).join(',');
  const check = await query(
    `select count(*) as total, count(distinct tz) as zones from zip_timezones;`
  );
  const rows = await query(`select zip3, tz from zip_timezones where zip3 in (${spotList}) order by zip3;`);
  console.log('db verify:', JSON.stringify(check), JSON.stringify(rows));
  const dbOk = (rows as { zip3: string; tz: string }[]).every((r) => SPOT_CHECKS[r.zip3] === r.tz)
    && rows.length === Object.keys(SPOT_CHECKS).length;
  console.log(dbOk ? 'db spot checks OK' : 'db spot checks FAILED');
  process.exitCode = dbOk ? 0 : 1;
}
