# Schema `techss_log`

> **Clarification (2026-07-08):** `call_center_import_logs` = per-lead outcomes of manual/CSV call-center imports (keyed by call_center, OLeadID, vertical, outcome, reason, csv_file_id) — the audit for partner pulls. `fs_db_import_log` = JSON write-audit of FS app table changes (json_data snapshots + tableName + uuid), NOT call-center ingestion.

Operational logs, including (un)revive lead batch logs.

**27 tables** — dimension: 20, fact: 7

## `api_log`  ·  dimension · ~3 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `url` | varchar(100) | N | MUL |
| `get` | varchar(255) | N |  |
| `post` | varchar(255) | N |  |
| `insertionDate` | timestamp | N | MUL |

## `auditLog`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `userid` | varchar(100) | Y |  |
| `hosts` | varchar(100) | Y | MUL |
| `usrtable` | varchar(50) | Y |  |
| `usroperation` | varchar(30) | Y |  |
| `insertiondate` | timestamp | Y | MUL |

## `call_center_import_logs`  ·  dimension · ~0 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | bigint | N | PRI |
| `call_center` | varchar(20) | N | MUL |
| `OLeadID` | varchar(255) | Y |  |
| `phone_number` | varchar(15) | N | MUL |
| `vertical` | varchar(5) | N | MUL |
| `outcome` | varchar(10) | N | MUL |
| `reason` | text | Y |  |
| `csv_row_id` | bigint | Y |  |
| `csv_file_id` | bigint | Y | MUL |
| `created_at` | timestamp | Y | MUL |

## `client_live_zips`  ·  fact · ~212,036 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `ClientId` | int | N | MUL |
| `Zip` | varchar(5) | N | MUL |
| `State` | varchar(2) | N | MUL |
| `County` | varchar(40) | Y |  |
| `Market` | varchar(20) | Y | MUL |
| `Live` | tinyint | N | MUL |
| `Callable` | tinyint | N |  |
| `Target` | tinyint | N |  |
| `Remarks` | varchar(150) | N |  |
| `activeDate` | date | N |  |
| `lastUsed` | date | N | MUL |

## `client_live_zips_staging`  ·  dimension · ~0 rows · InnoDB
PK: `ClientId`, `Zip`, `State`

| column | type | null | key |
|---|---|---|---|
| `ClientId` | int | N | PRI |
| `Zip` | varchar(5) | N | PRI |
| `State` | varchar(2) | N | PRI |
| `County` | varchar(40) | Y |  |
| `Market` | varchar(20) | Y |  |
| `Live` | tinyint | Y |  |
| `Callable` | tinyint | Y |  |
| `Target` | tinyint | Y |  |
| `Remarks` | varchar(150) | Y |  |
| `activeDate` | date | Y |  |
| `lastUsed` | date | Y |  |

## `client_live_zips_staging_log`  ·  dimension · ~0 rows · InnoDB
PK: `ClientId`, `Zip`, `State`, `runDate`

| column | type | null | key |
|---|---|---|---|
| `ClientId` | int | N | PRI |
| `Zip` | varchar(5) | N | PRI |
| `State` | varchar(2) | N | PRI |
| `County` | varchar(40) | Y |  |
| `Market` | varchar(20) | Y |  |
| `Live` | tinyint | Y |  |
| `Callable` | tinyint | Y |  |
| `Target` | tinyint | Y |  |
| `Remarks` | varchar(150) | Y |  |
| `activeDate` | date | Y |  |
| `lastUsed` | date | Y |  |
| `runDate` | datetime | N | PRI |

## `csv_files`  ·  dimension · ~0 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | bigint unsigned | N | PRI |
| `file_path` | varchar(255) | N |  |
| `config` | json | Y |  |
| `created_at` | timestamp | Y |  |
| `updated_at` | timestamp | Y |  |

## `csv_rows`  ·  dimension · ~0 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | bigint unsigned | N | PRI |
| `file_id` | bigint unsigned | N | MUL |
| `row_data` | json | N |  |
| `status` | tinyint | Y | MUL |

## `cv3_failure`  ·  dimension · ~16,076 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | Y | MUL |
| `leadId` | varchar(50) | Y | MUL |
| `phone` | varchar(15) | Y | MUL |
| `message` | varchar(150) | Y |  |
| `source` | varchar(10) | Y | MUL |
| `fixedAt` | timestamp | Y |  |
| `cancelledAt` | timestamp | Y |  |
| `insertionDate` | timestamp | Y |  |

## `delay_db_process_log_queue`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `uuid` | varchar(100) | N | MUL |
| `pKeys` | json | N |  |

## `failed_jobs`  ·  dimension · ~32 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | bigint unsigned | N | PRI |
| `connection` | text | N |  |
| `queue` | text | N |  |
| `payload` | longtext | N |  |
| `exception` | longtext | N |  |
| `failed_at` | timestamp | N |  |

## `fs_db_import_log`  ·  fact · ~82,020 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `json_data` | text | N |  |
| `userID` | int | N |  |
| `tableName` | varchar(255) | N | MUL |
| `uuid` | varchar(100) | N | MUL |
| `createdAt` | timestamp | N |  |

## `fs_db_import_log_arc`  ·  fact · ~3,841,050 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `json_data` | text | N |  |
| `userID` | int | N |  |
| `tableName` | varchar(255) | N | MUL |
| `uuid` | varchar(100) | N | MUL |
| `createdAt` | timestamp | N |  |

## `fs_log`  ·  fact · ~152,610 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `uuid` | varchar(100) | N | MUL |
| `server` | varchar(100) | N |  |
| `ip` | varchar(20) | N |  |
| `url` | mediumtext | N |  |
| `httpUrl` | varchar(255) | Y | MUL |
| `method` | varchar(10) | N |  |
| `request` | mediumtext | Y |  |
| `response` | mediumtext | Y |  |
| `httpCode` | varchar(3) | Y | MUL |
| `responseTime` | float | Y |  |
| `createdAt` | timestamp | N | MUL |

## `fs_log_arc`  ·  fact · ~6,332,903 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `uuid` | varchar(100) | N | MUL |
| `server` | varchar(100) | N |  |
| `ip` | varchar(20) | N |  |
| `url` | mediumtext | N |  |
| `httpUrl` | varchar(255) | Y | MUL |
| `method` | varchar(10) | N |  |
| `request` | mediumtext | Y |  |
| `response` | mediumtext | Y |  |
| `httpCode` | varchar(3) | Y | MUL |
| `responseTime` | float | Y |  |
| `createdAt` | timestamp | N | MUL |

## `fsdb_events_log`  ·  dimension · ~136 rows · InnoDB
PK: `eventName`, `eventStart`

| column | type | null | key |
|---|---|---|---|
| `eventName` | varchar(150) | N | PRI |
| `eventStart` | timestamp | N | PRI |
| `eventEnd` | timestamp | Y | MUL |
| `userId` | varchar(100) | Y |  |
| `params` | varchar(40) | Y |  |

## `job_batches`  ·  dimension · ~4,558 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | varchar(255) | N | PRI |
| `name` | varchar(255) | N |  |
| `total_jobs` | int | N |  |
| `pending_jobs` | int | N |  |
| `failed_jobs` | int | N |  |
| `failed_job_ids` | text | N |  |
| `options` | mediumtext | Y |  |
| `cancelled_at` | int | Y |  |
| `created_at` | int | N |  |
| `finished_at` | int | Y |  |

## `lc_api_log`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `groupId` | varchar(150) | Y | MUL |
| `requestTime` | timestamp | N | MUL |
| `request` | text | Y |  |
| `requestHeaders` | text | Y |  |
| `requestMethod` | varchar(5) | Y |  |
| `sentUrl` | text | Y |  |
| `sentTime` | timestamp | N | MUL |
| `responseTime` | timestamp | N | MUL |
| `response` | text | Y |  |
| `responseStatusCode` | int | Y |  |
| `logTime` | timestamp | N | MUL |
| `phone` | varchar(10) | Y | MUL |
| `httpUrl` | text | Y |  |
| `insertionDate` | timestamp | N | MUL |

## `ncc_logs`  ·  dimension · ~22 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | bigint unsigned | N | PRI |
| `uuid` | varchar(255) | N | MUL |
| `auth_guard` | varchar(255) | N | MUL |
| `user` | varchar(255) | N | MUL |
| `user_ip` | varchar(255) | N |  |
| `connection_name` | varchar(255) | N |  |
| `database_name` | varchar(255) | N | MUL |
| `table_name` | varchar(255) | N | MUL |
| `table_pk` | varchar(255) | N |  |
| `json_data` | json | Y |  |
| `action` | varchar(255) | N | MUL |
| `action_at` | timestamp | N | MUL |

## `ncc_logs_arc`  ·  dimension · ~7,010 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | bigint unsigned | N | PRI |
| `uuid` | varchar(255) | N | MUL |
| `auth_guard` | varchar(255) | N | MUL |
| `user` | varchar(255) | N | MUL |
| `user_ip` | varchar(255) | N |  |
| `connection_name` | varchar(255) | N |  |
| `database_name` | varchar(255) | N | MUL |
| `table_name` | varchar(255) | N | MUL |
| `table_pk` | varchar(255) | N |  |
| `json_data` | json | Y |  |
| `action` | varchar(255) | N | MUL |
| `action_at` | timestamp | N | MUL |

## `step_process`  ·  dimension · ~2,314 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | bigint unsigned | N | PRI |
| `uuid` | varchar(255) | N | UNI |
| `groupId` | varchar(255) | Y | MUL |
| `steps` | json | Y |  |
| `info` | json | Y |  |
| `isDone` | tinyint(1) | N |  |
| `isCancelled` | tinyint(1) | N |  |
| `created_at` | timestamp | Y |  |
| `updated_at` | timestamp | Y |  |

## `unreviveLeadsBatches`  ·  fact · ~40,688,975 rows · InnoDB
PK: `OLeadID`, `batchId`

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(40) | N | PRI |
| `batchId` | varchar(40) | N | PRI |
| `done` | tinyint | Y | MUL |
| `insertionDate` | timestamp | N | MUL |

## `unreviveLeadsBatches_log`  ·  dimension · ~0 rows · InnoDB
PK: `OLeadID`, `batchid`

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(40) | N | PRI |
| `batchid` | varchar(40) | N | PRI |
| `RU` | varchar(10) | N | MUL |
| `RUDate` | date | N | MUL |
| `rv` | tinyint | N | MUL |

## `zcwlt_staging`  ·  dimension · ~21,139 rows · InnoDB
PK: `ClientId`, `Zip`, `State`, `Callable`, `VT`

| column | type | null | key |
|---|---|---|---|
| `ClientId` | int | N | PRI |
| `Zip` | varchar(5) | N | PRI |
| `State` | varchar(2) | N | PRI |
| `filter_value` | varchar(30) | Y |  |
| `Callable` | tinyint | N | PRI |
| `VT` | varchar(5) | N | PRI |
| `lastUpdate` | timestamp | Y | MUL |

## `zcwlt_staging_log`  ·  fact · ~60,064 rows · InnoDB
PK: `ClientId`, `Zip`, `State`, `Callable`, `VT`, `runDate`

| column | type | null | key |
|---|---|---|---|
| `ClientId` | int | N | PRI |
| `Zip` | varchar(5) | N | PRI |
| `State` | varchar(2) | N | PRI |
| `filter_value` | varchar(30) | Y |  |
| `Callable` | tinyint | N | PRI |
| `VT` | varchar(5) | N | PRI |
| `runDate` | datetime | N | PRI |

## `zztmp_api_log`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `url` | varchar(100) | Y | MUL |
| `get` | varchar(255) | N |  |
| `post` | varchar(255) | N |  |
| `insertionDate` | timestamp | N | MUL |

## `zztmp_lc_api_log`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `groupId` | varchar(150) | Y | MUL |
| `requestTime` | timestamp | N | MUL |
| `request` | text | Y |  |
| `requestHeaders` | text | Y |  |
| `requestMethod` | varchar(5) | Y |  |
| `sentUrl` | text | Y |  |
| `sentTime` | timestamp | N | MUL |
| `responseTime` | timestamp | N | MUL |
| `response` | text | Y |  |
| `responseStatusCode` | int | Y |  |
| `logTime` | timestamp | N | MUL |
| `phone` | varchar(10) | Y | MUL |
| `httpUrl` | text | Y |  |
| `insertionDate` | timestamp | N | MUL |
