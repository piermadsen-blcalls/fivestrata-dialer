// Watch sync progress from a second session: counts recent STG_ insert
// statements for this user via INFORMATION_SCHEMA.QUERY_HISTORY_BY_USER.
// Prints statement counts and timings only — never data.
// Run: npx tsx scripts/snowflake-activity.ts
import { connect, destroy, exec, readSnowflakeEnv } from './snowflake-common.js';

const conn = await connect(readSnowflakeEnv());
const rows = await exec(
  conn,
  `SELECT COUNT(*) AS N,
          SUM(IFF(execution_status = 'RUNNING', 1, 0)) AS RUNNING,
          MIN(start_time) AS FIRST_SEEN,
          MAX(start_time) AS LAST_SEEN
     FROM TABLE(INFORMATION_SCHEMA.QUERY_HISTORY_BY_USER(RESULT_LIMIT => 10000))
    WHERE query_text ILIKE 'INSERT INTO STG_CALL_EVENTS%'
      AND start_time > DATEADD(hour, -2, CURRENT_TIMESTAMP())`,
);
const r = rows[0];
console.log(
  `STG_CALL_EVENTS inserts (last 2h): ${r.N} statements, ${r.RUNNING} running now, ` +
    `first ${String(r.FIRST_SEEN ?? '-')}, last ${String(r.LAST_SEEN ?? '-')}`,
);
const merge = await exec(
  conn,
  `SELECT COUNT(*) AS N
     FROM TABLE(INFORMATION_SCHEMA.QUERY_HISTORY_BY_USER(RESULT_LIMIT => 10000))
    WHERE query_text ILIKE 'MERGE INTO CALL_EVENTS%'
      AND start_time > DATEADD(hour, -2, CURRENT_TIMESTAMP())`,
);
console.log(`CALL_EVENTS merges (last 2h): ${merge[0].N}`);
await destroy(conn);
