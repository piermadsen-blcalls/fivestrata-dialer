/** Dumps the structure (tables + columns/types) PostgREST exposes. Read-only. */
import 'dotenv/config';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;

const res = await fetch(`${url}/rest/v1/`, {
  headers: { apikey: key, authorization: `Bearer ${key}` },
});
const spec = (await res.json()) as {
  definitions?: Record<string, { properties?: Record<string, { type?: string; format?: string; description?: string }>; required?: string[] }>;
};

for (const [table, def] of Object.entries(spec.definitions ?? {})) {
  console.log(`\n== ${table}`);
  for (const [col, p] of Object.entries(def.properties ?? {})) {
    const req = def.required?.includes(col) ? ' NOT NULL' : '';
    const pk = p.description?.includes('Primary Key') ? ' PK' : '';
    console.log(`  ${col}: ${p.format ?? p.type}${req}${pk}`);
  }
}
