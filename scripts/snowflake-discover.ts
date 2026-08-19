// Minimal-credential discovery probe: connects with account + user + key ONLY
// (no role/warehouse/database — works before Cesar's scoped role lands, and is
// how we detect it landing: the new role/schema appear in the output).
// Prints names only — never data. Run: npx tsx scripts/snowflake-discover.ts
import 'dotenv/config';
import dotenv from 'dotenv';
import snowflake from 'snowflake-sdk';

dotenv.config({ path: 'env.template' });

const account = process.env.SNOWFLAKE_ACCOUNT ?? '';
const username = process.env.SNOWFLAKE_USER ?? '';
const privateKeyPath = process.env.SNOWFLAKE_PRIVATE_KEY_PATH ?? '';
if (!account || !username || !privateKeyPath) {
  console.log('DISCOVER FAIL  need SNOWFLAKE_ACCOUNT / SNOWFLAKE_USER / SNOWFLAKE_PRIVATE_KEY_PATH');
  process.exit(1);
}

snowflake.configure({ logLevel: 'ERROR' });
const conn = snowflake.createConnection({
  account,
  username,
  authenticator: 'SNOWFLAKE_JWT',
  privateKeyPath,
});

function exec(sqlText: string): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText,
      complete: (err, _stmt, rows) => (err ? reject(err) : resolve(rows ?? [])),
    });
  });
}

try {
  await new Promise<void>((resolve, reject) => {
    conn.connect((err) => (err ? reject(err) : resolve()));
  });
} catch (e) {
  console.log(`DISCOVER FAIL  connect: ${(e as Error).message}`);
  console.log('               (JWT invalid usually means the ALTER USER ... RSA_PUBLIC_KEY statement has not run yet)');
  process.exit(1);
}

const [ctx] = await exec(
  'SELECT CURRENT_USER() AS U, CURRENT_ROLE() AS R, CURRENT_AVAILABLE_ROLES() AS ROLES',
);
console.log(`CONNECTED   ${ctx.U} (active role ${ctx.R})`);
console.log(`ROLES       ${ctx.ROLES}`);

try {
  const warehouses = await exec('SHOW WAREHOUSES');
  console.log(`WAREHOUSES  ${warehouses.map((w) => w.name).join(', ') || '(none visible)'}`);
} catch (e) {
  console.log(`WAREHOUSES  FAIL ${(e as Error).message}`);
}

try {
  const dbs = await exec('SHOW DATABASES');
  console.log(`DATABASES   ${dbs.map((d) => d.name).join(', ') || '(none visible)'}`);
} catch (e) {
  console.log(`DATABASES   FAIL ${(e as Error).message}`);
}

try {
  const schemas = await exec("SHOW SCHEMAS LIKE 'FIVESTRATADIALER' IN ACCOUNT");
  if (schemas.length) {
    for (const s of schemas) {
      console.log(`SCHEMA      FOUND: ${s.database_name}.${s.name} (owner role ${s.owner})`);
    }
  } else {
    console.log('SCHEMA      FIVESTRATADIALER not visible yet (ticket not landed, or no grant yet)');
  }
} catch (e) {
  console.log(`SCHEMA      FAIL ${(e as Error).message}`);
}

conn.destroy(() => process.exit(0));
