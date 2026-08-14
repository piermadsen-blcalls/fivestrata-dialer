-- AICC Snowflake scaffolding --paste-once worksheet script (idempotent).
-- Approved by Sean 2026-08-14. Creates everything the results-DB sync needs:
--   role AICC_LOADER +warehouse AICC_WH (X-Small, auto-suspend 60s)
--   database AICC +schema RAW +target tables mirroring Supabase
--   service user AICC_SVC (key-pair auth only --no password)
-- Everything is prefixed AICC_ so it is easy to audit and easy to drop.
--
-- Requires ACCOUNTADMIN (or split: SECURITYADMIN for the user/role block,
-- SYSADMIN for objects). If your role lacks these, forward this file to the
-- account owner (Shelly Teh) --it is self-contained.
--
-- After running: the final SELECT prints the account identifier to paste
-- into .env as SNOWFLAKE_ACCOUNT. Verify from the repo with:
--   npx tsx scripts/snowflake-check.ts
--
-- Possible post-setup failure mode: if the account has an account-level
-- network policy, AICC_SVC may need to be exempted or the laptop IP allowed --
-- snowflake-check.ts will surface this as a connection error.

USE ROLE ACCOUNTADMIN;

-- ---------------------------------------------------------------------------
-- Role, warehouse, database, schema
-- ---------------------------------------------------------------------------
CREATE ROLE IF NOT EXISTS AICC_LOADER
  COMMENT = 'AICC dialer results-DB sync (Supabase -> Snowflake). Owner: Sean Stott.';
GRANT ROLE AICC_LOADER TO ROLE SYSADMIN;  -- keep the role hierarchy clean

CREATE WAREHOUSE IF NOT EXISTS AICC_WH
  WAREHOUSE_SIZE = XSMALL
  AUTO_SUSPEND = 60
  AUTO_RESUME = TRUE
  INITIALLY_SUSPENDED = TRUE
  COMMENT = 'AICC nightly sync + light analytics. X-Small, suspends after 60s idle.';

CREATE DATABASE IF NOT EXISTS AICC
  COMMENT = 'AI call center results DB: every dial + every turn, 5-yr retention.';
CREATE SCHEMA IF NOT EXISTS AICC.RAW
  COMMENT = 'Landing tables mirroring the Supabase operational schema.';

GRANT USAGE ON WAREHOUSE AICC_WH TO ROLE AICC_LOADER;
GRANT USAGE ON DATABASE AICC TO ROLE AICC_LOADER;
GRANT USAGE, CREATE TABLE ON SCHEMA AICC.RAW TO ROLE AICC_LOADER;  -- CREATE TABLE: temp staging tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA AICC.RAW TO ROLE AICC_LOADER;
GRANT SELECT, INSERT, UPDATE, DELETE ON FUTURE TABLES IN SCHEMA AICC.RAW TO ROLE AICC_LOADER;

-- ---------------------------------------------------------------------------
-- Service user --key-pair (JWT) auth only; TYPE=SERVICE exempts it from
-- human MFA policies. Public key generated 2026-08-14 on Sean's machine;
-- private half lives outside any repo (C:\Claude\snowflake-keys\).
-- ---------------------------------------------------------------------------
CREATE USER IF NOT EXISTS AICC_SVC
  TYPE = SERVICE
  DEFAULT_ROLE = AICC_LOADER
  DEFAULT_WAREHOUSE = AICC_WH
  DEFAULT_NAMESPACE = 'AICC.RAW'
  COMMENT = 'AICC dialer sync service user. Key-pair auth only. Owner: Sean Stott.';

ALTER USER AICC_SVC SET RSA_PUBLIC_KEY =
'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxYNy7obd1odEp2wRYiHDnacyDHeTL1sgwswHaCNHPA/LQeU0qpPrIVk2gngMUQ82xL9B64rU5BDWKaBw0MMg9OXU7pKDMAHCpe7TcOcxcKyBd2WbKuT6lRQQXUZWOiOoIo1aX/m/mMtfJ8C9ZEkYz6qhcwyAiaFBe+Bq7y3l8jAxAnZXoT4yL+79lARaMU0Ct1GpePipdE/VoHzRz1HE+VRaczoelVE0Y5dollXYeqkJszfAKbY7os2Suso+NDuC1tQ7Qv3u6iW3ahw9t6AmQA3BgK2MyaobipI+HKqaFLxrcsOLkeRcqsOw75PUZ7lpDOzGLQHTsh0DJXoCcg7NFQIDAQAB';

GRANT ROLE AICC_LOADER TO USER AICC_SVC;

-- ---------------------------------------------------------------------------
-- Target tables --mirror supabase/migrations/0001_init.sql column-for-column,
-- plus _SYNCED_AT. Types: uuid->VARCHAR, timestamptz->TIMESTAMP_TZ,
-- jsonb->VARIANT. Primary keys are informational in Snowflake (unenforced);
-- the sync's MERGE provides the real idempotency.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS AICC.RAW.LEADS (
  ID               VARCHAR NOT NULL,
  OLEADID          VARCHAR,
  PHONE_NUMBER     VARCHAR,
  FIRST_NAME       VARCHAR,
  LAST_NAME        VARCHAR,
  ADDRESS1         VARCHAR,
  CITY             VARCHAR,
  STATE            VARCHAR,
  POSTAL_CODE      VARCHAR,
  EMAIL            VARCHAR,
  VERTICAL         VARCHAR,
  LEAD_TYPE        VARCHAR,
  SOURCE           VARCHAR,
  SUB_SOURCE       VARCHAR,
  STATUS           VARCHAR,
  DNC              BOOLEAN,
  VICIDIAL_LEAD_ID VARCHAR,
  CREATED_AT       TIMESTAMP_TZ,
  UPDATED_AT       TIMESTAMP_TZ,
  _SYNCED_AT       TIMESTAMP_TZ,
  PRIMARY KEY (ID)
);

CREATE TABLE IF NOT EXISTS AICC.RAW.CALLS (
  ID                     VARCHAR NOT NULL,
  LEAD_ID                VARCHAR,
  SCRIPT_ID              VARCHAR,
  VOICE_PACK_ID          VARCHAR,
  DID_ID                 VARCHAR,
  TELNYX_CALL_CONTROL_ID VARCHAR,
  TELNYX_CALL_SESSION_ID VARCHAR,
  VICIDIAL_UNIQUEID      VARCHAR,
  CAMPAIGN_ID            VARCHAR,
  AGENT_ID               VARCHAR,
  DIRECTION              VARCHAR,
  STARTED_AT             TIMESTAMP_TZ,
  ANSWERED_AT            TIMESTAMP_TZ,
  ENDED_AT               TIMESTAMP_TZ,
  DURATION_SEC           NUMBER(10,0),
  DISPOSITION            VARCHAR,
  CONTACT_QUALITY        VARCHAR,
  TRANSFERRED_CLIENT_ID  VARCHAR,
  RECORDING_URL          VARCHAR,
  CANNED_SECONDS         NUMBER(12,3),
  TTS_SECONDS            NUMBER(12,3),
  CREATED_AT             TIMESTAMP_TZ,
  _SYNCED_AT             TIMESTAMP_TZ,
  PRIMARY KEY (ID)
);

CREATE TABLE IF NOT EXISTS AICC.RAW.CALL_TURNS (
  ID          NUMBER(38,0) NOT NULL,
  CALL_ID     VARCHAR,
  TURN_INDEX  NUMBER(10,0),
  CONTEXT     VARIANT,
  SOURCE      VARCHAR,
  CLIP_ID     VARCHAR,
  TTS_TEXT    VARCHAR,
  AUDIO_SEC   NUMBER(12,3),
  OUTCOME     VARCHAR,
  OCCURRED_AT TIMESTAMP_TZ,
  _SYNCED_AT  TIMESTAMP_TZ,
  PRIMARY KEY (ID)
);

CREATE TABLE IF NOT EXISTS AICC.RAW.CALL_EVENTS (
  ID              NUMBER(38,0) NOT NULL,
  CALL_ID         VARCHAR,
  CALL_CONTROL_ID VARCHAR,
  CALL_SESSION_ID VARCHAR,
  EVENT_TYPE      VARCHAR,
  OCCURRED_AT     TIMESTAMP_TZ,
  PAYLOAD         VARIANT,
  CREATED_AT      TIMESTAMP_TZ,
  _SYNCED_AT      TIMESTAMP_TZ,
  PRIMARY KEY (ID)
);

-- ---------------------------------------------------------------------------
-- Done. Paste this value into .env as SNOWFLAKE_ACCOUNT:
-- ---------------------------------------------------------------------------
SELECT CURRENT_ORGANIZATION_NAME() || '-' || CURRENT_ACCOUNT_NAME() AS SNOWFLAKE_ACCOUNT_FOR_ENV;
