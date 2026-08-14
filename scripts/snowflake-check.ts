// Verify the Snowflake wiring end to end without printing any secret.
// Checks: key-pair auth connects · role/warehouse/db context resolve ·
// the four AICC.RAW target tables exist (row count + high-water mark each).
// Run: npx tsx scripts/snowflake-check.ts
import { connect, destroy, exec, readSnowflakeEnv } from './snowflake-common.js';

const TABLES: Array<{ name: string; watermark: string }> = [
  { name: 'LEADS', watermark: 'UPDATED_AT' },
  { name: 'CALLS', watermark: 'CREATED_AT' },
  { name: 'CALL_TURNS', watermark: 'ID' },
  { name: 'CALL_EVENTS', watermark: 'ID' },
];

let failed = false;

let env;
try {
  env = readSnowflakeEnv();
} catch (e) {
  console.log(`SNOWFLAKE_ENV       FAIL  ${(e as Error).message}`);
  process.exit(1);
}

try {
  const conn = await connect(env);
  const [ctx] = await exec(
    conn,
    `SELECT CURRENT_USER() AS U, CURRENT_ROLE() AS R, CURRENT_WAREHOUSE() AS W,
            CURRENT_DATABASE() AS D, CURRENT_SCHEMA() AS S,
            CURRENT_ORGANIZATION_NAME() || '-' || CURRENT_ACCOUNT_NAME() AS A`,
  );
  console.log(
    `SNOWFLAKE_CONN      OK    ${ctx.U} as ${ctx.R} on ${ctx.A}, warehouse ${ctx.W}, ${ctx.D}.${ctx.S}`,
  );

  for (const t of TABLES) {
    try {
      const [row] = await exec(
        conn,
        `SELECT COUNT(*) AS N, MAX(${t.watermark}) AS WM FROM ${t.name}`,
      );
      const wm = row.WM == null ? 'empty' : `high-water ${t.watermark}=${String(row.WM)}`;
      console.log(`${t.name.padEnd(19)} OK    ${row.N} rows, ${wm}`);
    } catch (e) {
      console.log(`${t.name.padEnd(19)} FAIL  ${(e as Error).message}`);
      failed = true;
    }
  }
  await destroy(conn);
} catch (e) {
  console.log(`SNOWFLAKE_CONN      FAIL  ${(e as Error).message}`);
  console.log(
    '                          (hints: account identifier format ORG-ACCOUNT; setup SQL run yet?;' +
      ' account-level network policy may need to allow this IP or exempt AICC_SVC)',
  );
  failed = true;
}

process.exit(failed ? 1 : 0);
