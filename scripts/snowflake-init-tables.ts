// One-time DDL: create schema RAW + the 4 mirror tables inside the database
// Cesar carved out (FIVESTRATA_DIALER, role DATA_ADMIN_FIVESTRATA_DIALER).
// Same DDL as scripts/snowflake-setup.sql's table block, fully qualified.
// Idempotent (IF NOT EXISTS everywhere). Metadata-only — needs no warehouse.
// Run: npx tsx scripts/snowflake-init-tables.ts
import 'dotenv/config';
import dotenv from 'dotenv';
import snowflake from 'snowflake-sdk';

dotenv.config({ path: 'env.template' });

const DB = process.env.SNOWFLAKE_DATABASE ?? 'FIVESTRATA_DIALER';
const SCHEMA = process.env.SNOWFLAKE_SCHEMA ?? 'RAW';
const Q = `${DB}.${SCHEMA}`;

const DDL: Array<[string, string]> = [
  ['schema', `CREATE SCHEMA IF NOT EXISTS ${DB}.${SCHEMA}
    COMMENT = 'AICC landing tables mirroring the Supabase operational schema'`],
  ['LEADS', `CREATE TABLE IF NOT EXISTS ${Q}.LEADS (
    ID VARCHAR NOT NULL, OLEADID VARCHAR, PHONE_NUMBER VARCHAR, FIRST_NAME VARCHAR,
    LAST_NAME VARCHAR, ADDRESS1 VARCHAR, CITY VARCHAR, STATE VARCHAR, POSTAL_CODE VARCHAR,
    EMAIL VARCHAR, VERTICAL VARCHAR, LEAD_TYPE VARCHAR, SOURCE VARCHAR, SUB_SOURCE VARCHAR,
    STATUS VARCHAR, DNC BOOLEAN, VICIDIAL_LEAD_ID VARCHAR,
    CREATED_AT TIMESTAMP_TZ, UPDATED_AT TIMESTAMP_TZ, _SYNCED_AT TIMESTAMP_TZ,
    PRIMARY KEY (ID))`],
  ['CALLS', `CREATE TABLE IF NOT EXISTS ${Q}.CALLS (
    ID VARCHAR NOT NULL, LEAD_ID VARCHAR, SCRIPT_ID VARCHAR, VOICE_PACK_ID VARCHAR,
    DID_ID VARCHAR, TELNYX_CALL_CONTROL_ID VARCHAR, TELNYX_CALL_SESSION_ID VARCHAR,
    VICIDIAL_UNIQUEID VARCHAR, CAMPAIGN_ID VARCHAR, AGENT_ID VARCHAR, DIRECTION VARCHAR,
    STARTED_AT TIMESTAMP_TZ, ANSWERED_AT TIMESTAMP_TZ, ENDED_AT TIMESTAMP_TZ,
    DURATION_SEC NUMBER(10,0), DISPOSITION VARCHAR, CONTACT_QUALITY VARCHAR,
    TRANSFERRED_CLIENT_ID VARCHAR, RECORDING_URL VARCHAR,
    CANNED_SECONDS NUMBER(12,3), TTS_SECONDS NUMBER(12,3),
    CREATED_AT TIMESTAMP_TZ, _SYNCED_AT TIMESTAMP_TZ,
    PRIMARY KEY (ID))`],
  ['CALL_TURNS', `CREATE TABLE IF NOT EXISTS ${Q}.CALL_TURNS (
    ID NUMBER(38,0) NOT NULL, CALL_ID VARCHAR, TURN_INDEX NUMBER(10,0), CONTEXT VARIANT,
    SOURCE VARCHAR, CLIP_ID VARCHAR, TTS_TEXT VARCHAR, AUDIO_SEC NUMBER(12,3),
    OUTCOME VARCHAR, OCCURRED_AT TIMESTAMP_TZ, _SYNCED_AT TIMESTAMP_TZ,
    PRIMARY KEY (ID))`],
  ['CALL_EVENTS', `CREATE TABLE IF NOT EXISTS ${Q}.CALL_EVENTS (
    ID NUMBER(38,0) NOT NULL, CALL_ID VARCHAR, CALL_CONTROL_ID VARCHAR,
    CALL_SESSION_ID VARCHAR, EVENT_TYPE VARCHAR, OCCURRED_AT TIMESTAMP_TZ,
    PAYLOAD VARIANT, CREATED_AT TIMESTAMP_TZ, _SYNCED_AT TIMESTAMP_TZ,
    PRIMARY KEY (ID))`],
];

snowflake.configure({ logLevel: 'ERROR' });
const authenticator = (process.env.SNOWFLAKE_AUTHENTICATOR ?? 'SNOWFLAKE_JWT').toUpperCase();
const conn = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT ?? '',
  username: process.env.SNOWFLAKE_USER ?? '',
  authenticator,
  ...(authenticator === 'SNOWFLAKE_JWT'
    ? { privateKeyPath: process.env.SNOWFLAKE_PRIVATE_KEY_PATH ?? '' }
    : { clientStoreTemporaryCredential: true }),
  role: process.env.SNOWFLAKE_ROLE,
});

function exec(sqlText: string): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    conn.execute({ sqlText, complete: (err, _s, rows) => (err ? reject(err) : resolve(rows ?? [])) });
  });
}

await new Promise<void>((resolve, reject) => {
  const cb = (err: Error | undefined) => (err ? reject(err) : resolve());
  if (authenticator === 'EXTERNALBROWSER') conn.connectAsync(cb);
  else conn.connect(cb);
});

let failed = false;
for (const [label, sql] of DDL) {
  try {
    const [row] = await exec(sql);
    console.log(`${label.padEnd(12)} OK    ${String(row?.status ?? '')}`);
  } catch (e) {
    console.log(`${label.padEnd(12)} FAIL  ${(e as Error).message}`);
    failed = true;
  }
}
conn.destroy(() => process.exit(failed ? 1 : 0));
