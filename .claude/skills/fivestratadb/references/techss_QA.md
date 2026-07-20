# Schema `techss_QA`

QA fixtures and call-center audit sampling. Small.

**7 tables** — dimension: 6, view: 1

## `auditType`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `name` | varchar(50) | N |  |
| `auditTable` | varchar(30) | N |  |
| `auditFields` | varchar(255) | N |  |

## `audit_transferFailed`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `oLeadID` | varchar(30) | N | MUL |
| `date` | date | N |  |
| `client` | varchar(20) | N | MUL |
| `callDispo` | varchar(20) | N | MUL |
| `failureReason` | varchar(20) | N | MUL |
| `attemptOne` | int | N |  |
| `attemptTwo` | int | N |  |
| `notes` | varchar(255) | N |  |
| `updateTime` | timestamp | N |  |

## `callCenterAuditLeads`  ·  dimension · ~296 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `auditType` | varchar(20) | N | MUL |
| `OLeadID` | varchar(100) | N | MUL |
| `firstName` | varchar(50) | N |  |
| `lastName` | varchar(50) | N |  |
| `email` | varchar(100) | N |  |
| `phone` | varchar(15) | N | MUL |
| `twilioPhoneId` | varchar(30) | N |  |
| `address` | varchar(100) | N |  |
| `city` | varchar(50) | N |  |
| `state` | varchar(2) | N | MUL |
| `postalCode` | varchar(5) | N | MUL |
| `dob` | varchar(20) | Y |  |
| `ipAddress` | varchar(45) | N |  |
| `homeowner` | varchar(3) | Y |  |
| `creditScore` | varchar(10) | Y |  |
| `FSCode1` | varchar(40) | N |  |
| `FSCode2` | varchar(40) | N |  |
| `insertionDate` | timestamp | N | MUL |

## `callCenterAuditLeadsCallLog`  ·  dimension · ~9,247 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `phone` | varchar(20) | N |  |
| `auditPhone` | varchar(10) | N | MUL |
| `oLeadId` | varchar(30) | N | MUL |
| `callId` | varchar(100) | N |  |
| `callDirection` | varchar(20) | N |  |
| `content` | varchar(255) | Y |  |
| `duration` | int | Y |  |
| `callStatus` | varchar(20) | N | MUL |
| `callDispo` | varchar(20) | N |  |
| `notes` | varchar(255) | N |  |
| `log` | mediumtext | N |  |
| `insertionDate` | timestamp | N |  |

## `call_center_audit_calls`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `auditType` | varchar(20) | N |  |
| `callCenter` | varchar(40) | N |  |
| `OLeadID` | varchar(100) | N |  |
| `fromNumber` | varchar(20) | N |  |
| `customerNumber` | varchar(10) | N |  |
| `callRecording` | varchar(255) | Y |  |
| `postalCode` | varchar(5) | N |  |
| `callId` | varchar(100) | N |  |
| `leadDate` | datetime | Y |  |
| `callDate` | datetime | Y |  |

## `clientAuditSettings`  ·  dimension · ~3 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientId` | int | N | MUL |
| `auditTypeId` | int | N | MUL |
| `auditDays` | varchar(150) | N |  |
| `percent` | int | N |  |
| `updateTimestamp` | timestamp | N |  |

## `transferFailed_reasons`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `reason` | varchar(30) | N |  |
| `callCenterFault` | int | N |  |
| `clientFault` | int | N |  |
| `customerFault` | int | N |  |
