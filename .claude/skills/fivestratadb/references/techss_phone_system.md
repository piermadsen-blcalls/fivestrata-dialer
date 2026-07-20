# Schema `techss_phone_system`

Phone/dialer system tables and call facts.

**14 tables** — dimension: 10, fact: 4

## `debtrelief_call_log`  ·  dimension · ~10,471 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `phone` | varchar(20) | N | MUL |
| `systemPhone` | varchar(10) | N |  |
| `oLeadId` | varchar(30) | N | MUL |
| `callId` | varchar(100) | N |  |
| `callDirection` | varchar(20) | N |  |
| `callRecording` | varchar(255) | Y |  |
| `duration` | int | Y |  |
| `callStatus` | varchar(20) | N | MUL |
| `callDispo` | varchar(20) | N |  |
| `notes` | varchar(255) | N |  |
| `log` | text | N |  |
| `insertionDate` | timestamp | N |  |

## `debtrelief_transfer_calls`  ·  dimension · ~77 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `callId` | varchar(50) | N | UNI |
| `customerPhone` | varchar(10) | N | MUL |
| `clientPhone` | varchar(10) | N | MUL |
| `callStatus` | varchar(20) | N |  |
| `WTClient` | varchar(20) | N |  |
| `insertionDate` | timestamp | N |  |

## `dispatch`  ·  dimension · ~5 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `campaign` | varchar(20) | Y |  |
| `tier` | varchar(20) | Y |  |
| `phone` | varchar(20) | N | MUL |
| `digits` | int | Y |  |

## `homewarranty_call_log`  ·  fact · ~58,320 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `phone` | varchar(20) | N | MUL |
| `systemPhone` | varchar(10) | N |  |
| `oLeadId` | varchar(40) | N | MUL |
| `callId` | varchar(100) | N |  |
| `callDirection` | varchar(20) | N |  |
| `callRecording` | varchar(255) | Y |  |
| `duration` | int | Y |  |
| `callStatus` | varchar(20) | N | MUL |
| `callDispo` | varchar(20) | N |  |
| `notes` | varchar(255) | N |  |
| `log` | text | N |  |
| `insertionDate` | timestamp | N |  |

## `released_phone_numbers`  ·  dimension · ~88 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `phoneType` | varchar(20) | N |  |
| `phone` | varchar(12) | N | UNI |
| `twilioId` | varchar(50) | N |  |
| `dateCreated` | datetime | N |  |
| `lastUsedDate` | datetime | N |  |
| `deleteDate` | timestamp | N |  |

## `sms_logs`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | Y | MUL |
| `phone` | varchar(15) | Y | MUL |
| `sms_data` | longblob | Y |  |
| `sms_hist` | longblob | Y |  |
| `lastUpdate` | timestamp | Y | MUL |

## `solar_call_log`  ·  fact · ~743,904 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `phone` | varchar(20) | N | MUL |
| `systemPhone` | varchar(10) | N |  |
| `oLeadId` | varchar(40) | N | MUL |
| `callId` | varchar(100) | N |  |
| `callDirection` | varchar(20) | N |  |
| `callRecording` | varchar(255) | Y |  |
| `duration` | int | Y |  |
| `callStatus` | varchar(20) | N | MUL |
| `callDispo` | varchar(20) | N |  |
| `notes` | varchar(255) | N |  |
| `log` | text | N |  |
| `insertionDate` | timestamp | N | MUL |

## `solar_call_log_arc`  ·  fact · ~57,778 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `phone` | varchar(20) | N | MUL |
| `systemPhone` | varchar(10) | N |  |
| `oLeadId` | varchar(40) | N | MUL |
| `callId` | varchar(100) | N |  |
| `callDirection` | varchar(20) | N |  |
| `callRecording` | varchar(255) | Y |  |
| `duration` | int | Y |  |
| `callStatus` | varchar(20) | N | MUL |
| `callDispo` | varchar(20) | N |  |
| `notes` | varchar(255) | N |  |
| `log` | text | N |  |
| `insertionDate` | timestamp | N |  |

## `solar_is_attempt_rules`  ·  dimension · ~14 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `attempt` | int | N | MUL |
| `attemptType` | int | N |  |
| `minBreak` | int | N |  |

## `solar_is_settings`  ·  dimension · ~1 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `maxDailyAttempts` | int | N |  |
| `maxAttempts` | int | N |  |
| `maxRecycleAttempts` | int | N |  |
| `freshExpireDays` | int | N |  |
| `recycleExpireDays` | int | N |  |
| `bonusHour` | time | N |  |
| `bonusAttempts` | int | N |  |
| `callAllowanceMinutes` | int | N |  |
| `dialableDispositions` | varchar(100) | N | MUL |
| `recycleMaxAttempts` | int | N |  |
| `recycleDispositions` | varchar(50) | N |  |
| `dialerQueueLastUpdate` | datetime | N |  |

## `solar_responses`  ·  dimension · ~1,806 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(30) | Y | MUL |
| `callID` | varchar(50) | N | UNI |
| `toPhone` | varchar(20) | Y | MUL |
| `fromPhone` | varchar(20) | Y |  |
| `callRecording` | varchar(255) | Y |  |
| `callTime` | timestamp | N |  |
| `fullPost` | blob | Y |  |
| `areThere` | varchar(255) | Y |  |
| `areThere_calculated` | varchar(40) | Y |  |
| `howAreYou` | varchar(255) | Y |  |
| `howAreYou_calculated` | varchar(40) | Y |  |
| `aFewMinutesOkay` | varchar(255) | Y |  |
| `aFewMinutesOkay_calculated` | varchar(40) | Y |  |
| `ownHome` | varchar(255) | Y |  |
| `ownHome_calculated` | varchar(40) | Y |  |
| `singleFamilyHome` | varchar(255) | Y |  |
| `singleFamilyHome_calculated` | varchar(40) | Y |  |
| `stickBuilt` | varchar(255) | Y |  |
| `stickBuilt_calculated` | varchar(40) | Y |  |
| `electricBill` | varchar(255) | Y |  |
| `electricBill_calculated` | varchar(40) | Y |  |
| `electricAssistance` | varchar(255) | Y |  |
| `electricAssistance_calculated` | varchar(40) | Y |  |
| `creditScore` | varchar(255) | Y |  |
| `creditScore_calculated` | varchar(40) | Y |  |
| `electricProvider` | varchar(255) | Y |  |
| `electricProvider_calculated` | varchar(40) | Y |  |
| `TCPA` | varchar(255) | Y |  |
| `TCPA_calculated` | varchar(40) | Y |  |
| `finalDisposition` | varchar(50) | Y |  |

## `transfer_initiation_call_log`  ·  fact · ~234,324 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `fromPhone` | varchar(20) | N | MUL |
| `toPhone` | varchar(20) | N | MUL |
| `callID` | varchar(100) | Y | MUL |
| `callDate` | timestamp | N |  |

## `transfer_phone`  ·  dimension · ~5 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `twilioPhone` | varchar(12) | N | UNI |
| `name` | varchar(50) | Y |  |
| `transferPhones` | varchar(100) | N |  |
| `log` | tinyint(1) | N |  |
| `shuffle` | tinyint(1) | N |  |
| `overrideUri` | varchar(255) | Y |  |
| `insertionDate` | timestamp | N |  |

## `twilio_phone_cleanup`  ·  dimension · ~2,168 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `sid` | varchar(50) | N | UNI |
| `phoneNumber` | varchar(15) | N | MUL |
| `friendlyName` | varchar(100) | N | MUL |
| `smsUrl` | varchar(100) | Y | MUL |
| `voiceUrl` | varchar(100) | Y | MUL |
| `smsApplicationSid` | varchar(50) | Y | MUL |
| `voiceApplicationSid` | varchar(50) | Y | MUL |
| `dateCreated` | datetime | N | MUL |
| `dateUpdated` | datetime | N | MUL |
| `lastCall` | datetime | Y | MUL |
| `lastSms` | datetime | Y | MUL |
| `deleteFlag` | tinyint(1) | N | MUL |
| `isSaved` | tinyint(1) | N | MUL |
| `isDeleted` | tinyint(1) | N | MUL |
| `actionKey` | varchar(5) | Y | MUL |
