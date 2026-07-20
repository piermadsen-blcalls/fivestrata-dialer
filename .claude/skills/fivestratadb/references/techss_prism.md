# Schema `techss_prism`

Prism configuration/reference (small).

**9 tables** — dimension: 9

## `fsdb_events_log`  ·  dimension · ~0 rows · InnoDB
PK: `eventName`, `eventStart`

| column | type | null | key |
|---|---|---|---|
| `eventName` | varchar(150) | N | PRI |
| `eventStart` | timestamp | N | PRI |
| `eventEnd` | timestamp | Y | MUL |
| `userId` | varchar(100) | Y |  |
| `params` | varchar(40) | Y |  |

## `mpdbRds`  ·  dimension · ~0 rows · InnoDB
PK: `rdsInstance`, `ractive`

| column | type | null | key |
|---|---|---|---|
| `rdsInstance` | varchar(30) | N | PRI |
| `ractive` | tinyint | N | PRI |

## `mpdbSteps`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `logTimestamp` | datetime | Y | MUL |
| `OLeadId` | varchar(40) | Y | MUL |
| `RA` | varchar(5) | Y |  |
| `ProcessId` | int | Y |  |
| `ProcessGroup` | varchar(50) | Y | MUL |
| `ProcessGroupOLD` | varchar(50) | Y |  |
| `VT` | varchar(5) | Y |  |
| `clientId` | int | Y |  |
| `clientName` | varchar(255) | Y |  |
| `state` | varchar(2) | Y |  |
| `postalCode` | varchar(5) | Y |  |
| `FSCode1` | varchar(150) | Y |  |
| `FSCode2` | varchar(150) | Y |  |
| `SequenceNo` | smallint | Y |  |
| `ModuleId` | varchar(20) | Y |  |
| `phone` | varchar(15) | Y | MUL |
| `ani` | varchar(15) | Y |  |
| `dnis` | varchar(15) | Y |  |
| `results` | longtext | Y |  |
| `callDispo` | varchar(100) | Y |  |
| `conferences` | varchar(20) | Y |  |
| `abandoned` | varchar(20) | Y |  |
| `callDate` | date | Y |  |
| `callTime` | time | Y |  |
| `Priority` | smallint | Y |  |
| `listName` | varchar(10) | Y |  |
| `campaign` | varchar(30) | Y |  |
| `callType` | varchar(20) | Y |  |
| `agentName` | varchar(100) | Y |  |
| `ivrTime` | time | Y |  |
| `dialTime` | time | Y |  |
| `talkTime` | time | Y |  |
| `afterCallWorkTime` | time | Y |  |
| `sipResponseCode` | varchar(20) | Y |  |
| `dialResult` | varchar(20) | Y |  |
| `plcallDispo` | varchar(40) | Y |  |
| `plcallDispoExt` | varchar(80) | Y |  |
| `finalDispo` | varchar(40) | Y |  |
| `finalDispoExt` | varchar(80) | Y |  |
| `Complete` | tinyint | Y |  |

## `prismTimezone`  ·  dimension · ~51 rows · InnoDB
PK: `state`

| column | type | null | key |
|---|---|---|---|
| `state` | varchar(2) | N | PRI |
| `ttimezone` | varchar(20) | Y |  |

## `processGroupConsolidate`  ·  dimension · ~10 rows · InnoDB
PK: `ProcessGroupSource`, `RA`, `ProcessGroupDest`

| column | type | null | key |
|---|---|---|---|
| `ProcessGroupSource` | varchar(50) | N | PRI |
| `RA` | varchar(5) | N | PRI |
| `ProcessGroupDest` | varchar(50) | N | PRI |

## `process_disposExt`  ·  dimension · ~98 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `callDispo` | varchar(40) | Y | MUL |
| `callDispoExt` | varchar(100) | Y |  |
| `dispoRank` | smallint | Y | MUL |
| `Contact` | tinyint | Y |  |
| `Complete` | tinyint | Y |  |
| `App` | tinyint | Y |  |
| `NQ` | tinyint | Y |  |
| `NI` | tinyint | Y |  |
| `DNC` | tinyint | Y |  |
| `UB` | tinyint | Y |  |
| `EvrPending` | tinyint | Y |  |
| `CallBack` | tinyint | Y |  |
| `Opps` | tinyint | Y |  |
| `Candi` | tinyint | Y |  |

## `recipeDashboard`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadId` | varchar(40) | Y | MUL |
| `ProcessId` | int | Y |  |
| `RA` | varchar(5) | Y |  |
| `ProcessGroup` | varchar(50) | Y | MUL |
| `ProcessGroupOLD` | varchar(50) | Y |  |
| `RaType` | varchar(20) | Y |  |
| `clientId` | int | Y | MUL |
| `clientName` | varchar(255) | Y |  |
| `logTimestamp` | timestamp | Y | MUL |
| `VT` | varchar(5) | Y |  |
| `fullName` | varchar(100) | Y |  |
| `phone` | varchar(15) | Y | MUL |
| `zip` | varchar(5) | Y |  |
| `state` | varchar(2) | Y |  |
| `email` | varchar(100) | Y |  |
| `FSCode1` | varchar(150) | Y |  |
| `FSCode2` | varchar(150) | Y |  |
| `PD` | varchar(10) | Y |  |
| `CH` | varchar(10) | Y |  |
| `SC` | varchar(10) | Y |  |
| `CP` | varchar(10) | Y |  |
| `SS` | varchar(10) | Y |  |
| `SA` | varchar(10) | Y |  |
| `S1` | varchar(30) | Y |  |
| `ddate` | date | Y |  |
| `ttime` | time | Y |  |
| `yyear` | smallint | Y |  |
| `mmonth` | varchar(20) | Y |  |
| `wweek` | tinyint | Y |  |
| `dday` | varchar(20) | Y |  |
| `hhour` | tinyint | Y |  |
| `mmins` | tinyint | Y |  |
| `mingrp` | varchar(3) | Y |  |
| `timezn` | varchar(20) | Y |  |
| `firstCall` | varchar(30) | Y |  |
| `mintocall` | smallint | Y |  |
| `speed2lead` | varchar(50) | Y |  |
| `supplier` | varchar(10) | Y |  |
| `source` | varchar(10) | Y |  |
| `isLead` | tinyint | Y |  |
| `contact` | tinyint | Y |  |
| `callContact` | smallint | Y |  |
| `recipeCall` | smallint | Y |  |
| `callDispo` | varchar(40) | Y |  |
| `callDispoExt` | varchar(80) | Y |  |
| `finalDispo` | varchar(40) | Y |  |
| `finalDispoExt` | varchar(80) | Y |  |
| `apps` | tinyint | Y |  |
| `Complete` | tinyint | Y |  |
| `lastUpdate` | timestamp | Y |  |

## `resultsDashboard`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadId` | varchar(40) | Y | MUL |
| `ProcessId` | int | Y |  |
| `RA` | varchar(5) | Y |  |
| `ProcessGroup` | varchar(50) | Y | MUL |
| `ProcessGroupOLD` | varchar(50) | Y |  |
| `RaType` | varchar(20) | Y |  |
| `clientId` | int | Y | MUL |
| `clientName` | varchar(255) | Y |  |
| `logTimestamp` | timestamp | Y | MUL |
| `VT` | varchar(5) | Y |  |
| `fullName` | varchar(100) | Y |  |
| `phone` | varchar(15) | Y | MUL |
| `zip` | varchar(5) | Y |  |
| `state` | varchar(2) | Y |  |
| `email` | varchar(100) | Y |  |
| `FSCode1` | varchar(150) | Y |  |
| `FSCode2` | varchar(150) | Y |  |
| `PD` | varchar(10) | Y |  |
| `CH` | varchar(10) | Y |  |
| `SC` | varchar(10) | Y |  |
| `CP` | varchar(10) | Y |  |
| `SS` | varchar(10) | Y |  |
| `SA` | varchar(10) | Y |  |
| `S1` | varchar(30) | Y |  |
| `ddate` | date | Y |  |
| `ttime` | time | Y |  |
| `yyear` | smallint | Y |  |
| `mmonth` | varchar(20) | Y |  |
| `wweek` | tinyint | Y |  |
| `dday` | varchar(20) | Y |  |
| `hhour` | tinyint | Y |  |
| `mmins` | tinyint | Y |  |
| `mingrp` | varchar(3) | Y |  |
| `timezn` | varchar(20) | Y |  |
| `firstCall` | varchar(30) | Y |  |
| `mintocall` | smallint | Y |  |
| `speed2lead` | varchar(50) | Y |  |
| `supplier` | varchar(10) | Y |  |
| `source` | varchar(10) | Y |  |
| `isLead` | tinyint | Y |  |
| `contact` | tinyint | Y |  |
| `callContact` | smallint | Y |  |
| `recipeCall` | smallint | Y |  |
| `callDispo` | varchar(40) | Y |  |
| `callDispoExt` | varchar(80) | Y |  |
| `finalDispo` | varchar(40) | Y |  |
| `finalDispoExt` | varchar(80) | Y |  |
| `apps` | tinyint | Y |  |
| `Complete` | tinyint | Y |  |
| `SequenceNo` | smallint | Y |  |
| `ModuleId` | varchar(20) | Y |  |
| `agentName` | varchar(100) | Y |  |
| `calls` | tinyint | Y |  |
| `NIs` | tinyint | Y |  |
| `DQs` | tinyint | Y |  |
| `Opps` | tinyint | Y |  |
| `Candi` | tinyint | Y |  |
| `EvrPending` | tinyint | Y |  |
| `App` | tinyint | Y |  |
| `lastUpdate` | timestamp | Y |  |

## `speed2Lead`  ·  dimension · ~7 rows · InnoDB
PK: `minStart`, `minEnd`

| column | type | null | key |
|---|---|---|---|
| `minStart` | smallint | N | PRI |
| `minEnd` | smallint | N | PRI |
| `s2lead` | varchar(50) | Y |  |
