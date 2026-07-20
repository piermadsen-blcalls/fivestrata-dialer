# Schema `techss_audit`

Audit trails and staging/temp audit tables tying URLs/roots to lead ids.

**20 tables** — dimension: 15, fact: 5

## `dupe_leads_leadData1`  ·  dimension · ~449 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `oleadid` | varchar(40) | Y | MUL |
| `firstname` | varchar(50) | Y |  |
| `lastname` | varchar(50) | Y |  |
| `email` | varchar(100) | Y |  |
| `phone` | varchar(15) | Y | MUL |
| `insertionDate` | timestamp | Y | MUL |
| `ncnt` | smallint | Y |  |

## `dupe_leads_leadData2`  ·  dimension · ~1,338 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `oleadid` | varchar(40) | Y | MUL |
| `firstname` | varchar(50) | Y |  |
| `lastname` | varchar(50) | Y |  |
| `email` | varchar(100) | Y |  |
| `phone` | varchar(15) | Y | MUL |
| `insertionDate` | timestamp | Y | MUL |
| `ncnt` | smallint | Y |  |

## `runRvAudit`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `auditDate` | date | Y | MUL |
| `auditStatus` | tinyint | Y |  |

## `spcallfreq`  ·  dimension · ~3,178 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `callDate` | date | Y | MUL |
| `spName` | varchar(100) | Y |  |
| `numExec` | int | Y |  |

## `sptmp_affectedtables`  ·  dimension · ~19 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `dbname` | varchar(100) | Y | MUL |
| `tbname` | varchar(100) | Y | MUL |
| `altertb` | tinyint | Y | MUL |
| `alterdone` | tinyint | Y | MUL |

## `sptmp_callcenter_API_log_args`  ·  dimension · ~27 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | int | N | PRI |
| `userid` | varchar(60) | Y |  |
| `hostname` | varchar(150) | Y |  |
| `dbname` | varchar(60) | Y |  |
| `tbname` | varchar(60) | Y |  |
| `minval` | int | Y |  |
| `maxval` | int | Y |  |
| `commitat` | int | Y |  |
| `status` | tinyint | Y | MUL |

## `sptmp_domainstats`  ·  fact · ~922,737 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `domainname` | varchar(80) | Y | MUL |
| `ncnt` | smallint | Y |  |

## `sptmp_fiveNineCallLog_STG`  ·  dimension · ~81 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `callId` | int | Y | MUL |
| `callDate` | date | Y | MUL |
| `callTime` | time | Y |  |
| `FSKey` | varchar(60) | Y |  |
| `OLeadID` | varchar(40) | Y | MUL |
| `RA` | varchar(5) | Y |  |
| `ProcessId` | int | Y |  |
| `ModuleId` | varchar(20) | Y |  |
| `SequenceNo` | smallint | Y |  |
| `Priority` | smallint | Y |  |
| `customerName` | varchar(100) | Y | MUL |
| `ani` | varchar(15) | Y |  |
| `dnis` | varchar(15) | Y |  |
| `phone` | varchar(15) | Y | MUL |
| `campaign` | varchar(30) | Y | MUL |
| `campaignType` | varchar(10) | Y |  |
| `callType` | varchar(20) | Y |  |
| `listName` | varchar(10) | Y |  |
| `agentName` | varchar(100) | Y | MUL |
| `callDispo` | varchar(100) | Y | MUL |
| `conferences` | varchar(20) | Y |  |
| `abandoned` | varchar(20) | Y |  |
| `ivrTime` | time | Y |  |
| `dialTime` | time | Y |  |
| `talkTime` | time | Y |  |
| `afterCallWorkTime` | time | Y |  |
| `sipResponseCode` | varchar(20) | Y |  |
| `dialResult` | varchar(20) | Y |  |

## `sptmp_fixC0_on_ad`  ·  fact · ~4,770,279 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `id` | int | Y | MUL |
| `oleadid` | varchar(40) | Y | MUL |
| `fscode1` | varchar(150) | Y |  |
| `fscode2` | varchar(150) | Y |  |
| `vt` | varchar(5) | Y |  |
| `pd` | varchar(20) | Y |  |
| `ch` | varchar(20) | Y |  |
| `sc` | varchar(20) | Y |  |
| `cp` | varchar(20) | Y |  |
| `ss` | varchar(20) | Y |  |
| `sa` | varchar(20) | Y |  |
| `c0` | varchar(20) | Y |  |
| `insertiondate` | timestamp | Y | MUL |

## `sptmp_hashData_args`  ·  dimension · ~4,293 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | int | N | PRI |
| `userid` | varchar(60) | Y |  |
| `hostname` | varchar(150) | Y |  |
| `dbname` | varchar(60) | Y |  |
| `tbname` | varchar(60) | Y |  |
| `minval` | int | Y |  |
| `maxval` | int | Y |  |
| `commitat` | int | Y |  |
| `status` | tinyint | Y | MUL |

## `sptmp_leadConduitData_args`  ·  dimension · ~20,010 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | int | N | PRI |
| `userid` | varchar(60) | Y |  |
| `hostname` | varchar(150) | Y |  |
| `dbname` | varchar(60) | Y |  |
| `tbname` | varchar(60) | Y |  |
| `minval` | int | Y |  |
| `maxval` | int | Y |  |
| `commitat` | int | Y |  |
| `status` | tinyint | Y | MUL |

## `sptmp_rintake`  ·  fact · ~1,195,981 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(40) | Y | MUL |
| `VT` | varchar(5) | Y | MUL |
| `VTO` | varchar(5) | Y |  |
| `ddate` | date | Y |  |
| `weekno` | tinyint | Y |  |
| `state` | varchar(2) | Y |  |
| `postalCode` | varchar(5) | Y |  |
| `PD` | varchar(20) | Y |  |
| `CH` | varchar(20) | Y |  |
| `SC` | varchar(20) | Y |  |
| `CP` | varchar(20) | Y |  |
| `C0` | varchar(20) | Y |  |
| `Accepted` | int | Y |  |
| `SentLeads` | int | Y |  |

## `sptmp_urlroot`  ·  dimension · ~17 rows · InnoDB
PK: `rooturl`

| column | type | null | key |
|---|---|---|---|
| `rooturl` | varchar(60) | N | PRI |
| `ddate` | date | N |  |
| `ddone` | tinyint | Y |  |

## `sptmp_urlroot_oleadid`  ·  fact · ~63,148,294 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | int | N | PRI |
| `oleadid` | varchar(40) | N |  |
| `approvedUrl` | tinyint | Y |  |
| `domainName` | varchar(255) | Y | MUL |
| `ddone` | tinyint | Y | MUL |

## `sptmp_verticalData_args`  ·  dimension · ~1,407 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | int | N | PRI |
| `userid` | varchar(60) | Y |  |
| `hostname` | varchar(150) | Y |  |
| `dbname` | varchar(60) | Y |  |
| `tbname` | varchar(60) | Y |  |
| `minval` | int | Y |  |
| `maxval` | int | Y |  |
| `commitat` | int | Y |  |
| `status` | tinyint | Y | MUL |

## `sptmp_wrk_process_log`  ·  dimension · ~115 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `OLeadId` | varchar(40) | N | MUL |
| `RA` | varchar(5) | Y | MUL |
| `ProcessId` | int | Y | MUL |
| `SequenceNo` | smallint | Y |  |
| `ModuleId` | varchar(20) | Y |  |
| `results` | longtext | Y |  |
| `callDispo` | varchar(40) | Y | MUL |
| `callDispoExt` | varchar(80) | Y |  |
| `tsStr` | varchar(30) | Y |  |

## `ttemptt_sc_source`  ·  dimension · ~122 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `sc` | varchar(50) | Y | MUL |
| `ncnt` | int | Y |  |

## `zztmp_KBleads_completed`  ·  fact · ~164,008 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `oleadid` | varchar(40) | Y | MUL |
| `phone` | varchar(15) | Y | MUL |
| `status` | varchar(10) | Y |  |
| `campaignid` | varchar(10) | Y |  |
| `calltime` | varchar(20) | Y |  |
| `calltime_ts` | timestamp | Y | MUL |
| `updated` | tinyint | Y | MUL |
| `ccdispos_ID` | smallint | Y |  |
| `for_update` | smallint | Y |  |

## `zztmp_awl_delete_20230131`  ·  dimension · ~427 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `oleadid` | varchar(40) | Y | MUL |
| `phone` | varchar(15) | Y | MUL |
| `fscode1` | varchar(150) | Y | MUL |
| `cp` | varchar(20) | Y |  |

## `zztmp_awl_update_20230131`  ·  dimension · ~8,567 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `oleadid` | varchar(40) | Y | MUL |
| `fscode1` | varchar(150) | Y | MUL |
| `cp` | varchar(20) | Y | MUL |
