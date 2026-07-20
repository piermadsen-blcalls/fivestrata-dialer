# Schema `techss_RV`

Revived Inventory — the working set of revived leads/inventory plus daily/weekly state and timing views.

**87 tables** — dimension: 64, fact: 3, view: 20

## `AllRVInvtyBatch`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(40) | N |  |
| `RU` | varchar(10) | N |  |
| `state` | varchar(2) | N |  |
| `zip` | varchar(5) | N |  |
| `VT` | varchar(5) | Y |  |
| `revivable` | tinyint | Y |  |
| `liveZipSL` | tinyint | Y |  |
| `liveZipHW` | tinyint | Y |  |
| `liveZipWI` | tinyint | Y |  |
| `liveZipBR` | tinyint | Y |  |
| `liveZipRF` | tinyint | Y |  |
| `liveZipCR` | tinyint | Y |  |
| `liveZipHS` | tinyint | Y |  |
| `batchSL` | tinyint | Y |  |
| `batchHW` | tinyint | Y |  |
| `batchWI` | tinyint | Y |  |
| `batchBR` | tinyint | Y |  |
| `batchRF` | tinyint | Y |  |
| `batchCR` | tinyint | Y |  |
| `batchHS` | tinyint | Y |  |
| `callSL` | tinyint | Y |  |
| `callHW` | tinyint | Y |  |
| `callWI` | tinyint | Y |  |
| `callBR` | tinyint | Y |  |
| `callRF` | tinyint | Y |  |
| `callCR` | tinyint | Y |  |
| `callHS` | tinyint | Y |  |
| `f1` | tinyint | Y |  |
| `f2` | tinyint | Y |  |
| `f3` | tinyint | Y |  |
| `f4` | tinyint | Y |  |
| `f5` | tinyint | Y |  |
| `decimus` | decimal(1,0) | N |  |
| `lastRevived` | date | N |  |
| `rvnw14` | tinyint | Y |  |
| `rvnw29` | tinyint | Y |  |
| `rvnw43` | tinyint | Y |  |
| `rvnw59` | tinyint | Y |  |
| `rvDUPE` | int | N |  |
| `insertionDate` | timestamp | N |  |
| `ID` | binary(0) | Y |  |

## `AllRevivedInventory`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `RU` | varchar(10) | N |  |
| `year` | int unsigned | Y |  |
| `month` | int | Y |  |
| `state` | varchar(2) | N |  |
| `zip` | varchar(5) | N |  |
| `VT` | varchar(5) | Y |  |
| `callable` | tinyint | Y |  |
| `calllead` | tinyint | Y |  |
| `batchSL` | tinyint | Y |  |
| `batchHW` | tinyint | Y |  |
| `batchWI` | tinyint | Y |  |
| `batchBR` | tinyint | Y |  |
| `batchRF` | tinyint | Y |  |
| `batchCR` | tinyint | Y |  |
| `batchHS` | tinyint | Y |  |
| `callSL` | tinyint | Y |  |
| `callHW` | tinyint | Y |  |
| `callWI` | tinyint | Y |  |
| `callBR` | tinyint | Y |  |
| `callRF` | tinyint | Y |  |
| `callCR` | tinyint | Y |  |
| `callHS` | tinyint | Y |  |
| `f1` | tinyint | Y |  |
| `f2` | tinyint | Y |  |
| `f3` | tinyint | Y |  |
| `f4` | tinyint | Y |  |
| `f5` | tinyint | Y |  |
| `leads` | bigint | N |  |
| `lastRevived` | date | N |  |
| `rvnw14` | tinyint | Y |  |
| `rvwk14` | tinyint | Y |  |
| `rvnw29` | tinyint | Y |  |
| `rvwk29` | tinyint | Y |  |
| `rvnw43` | tinyint | Y |  |
| `rvwk43` | tinyint | Y |  |
| `rvnw59` | tinyint | Y |  |
| `rvwk59` | tinyint | Y |  |
| `rvlive` | int | N |  |
| `ID` | varbinary(0) | Y |  |

## `AllRevivedInventoryBatch`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `RU` | varchar(10) | N |  |
| `year` | int | Y |  |
| `month` | int | Y |  |
| `state` | varchar(2) | N |  |
| `zip` | varchar(5) | N |  |
| `VT` | varchar(5) | Y |  |
| `callable` | tinyint | Y |  |
| `batchSL` | tinyint | Y |  |
| `batchHW` | tinyint | Y |  |
| `batchWI` | tinyint | Y |  |
| `batchBR` | tinyint | Y |  |
| `batchRF` | tinyint | Y |  |
| `batchCR` | tinyint | Y |  |
| `batchHS` | tinyint | Y |  |
| `f1` | tinyint | Y |  |
| `f2` | tinyint | Y |  |
| `f3` | tinyint | Y |  |
| `f4` | tinyint | Y |  |
| `f5` | tinyint | Y |  |
| `leads` | bigint | N |  |
| `lastRevived` | date | N |  |
| `rvnw29` | tinyint | Y |  |
| `rvwk29` | tinyint | Y |  |
| `rvnw43` | tinyint | Y |  |
| `rvwk43` | tinyint | Y |  |
| `rvnw59` | tinyint | Y |  |
| `rvwk59` | tinyint | Y |  |
| `rvlive` | int | N |  |
| `ID` | binary(0) | Y |  |

## `AllRevivedInventoryCallable`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `RU` | varchar(10) | N |  |
| `year` | int | Y |  |
| `month` | int | Y |  |
| `state` | varchar(2) | N |  |
| `zip` | varchar(5) | N |  |
| `VT` | varchar(5) | Y |  |
| `callable` | tinyint | Y |  |
| `callSL` | tinyint | Y |  |
| `callHW` | tinyint | Y |  |
| `callWI` | tinyint | Y |  |
| `callBR` | tinyint | Y |  |
| `callRF` | tinyint | Y |  |
| `callCR` | tinyint | Y |  |
| `callHS` | tinyint | Y |  |
| `f1` | tinyint | Y |  |
| `f2` | tinyint | Y |  |
| `f3` | tinyint | Y |  |
| `f4` | tinyint | Y |  |
| `f5` | tinyint | Y |  |
| `leads` | bigint | N |  |
| `lastRevived` | date | N |  |
| `rvnw29` | tinyint | Y |  |
| `rvwk29` | tinyint | Y |  |
| `rvnw43` | tinyint | Y |  |
| `rvwk43` | tinyint | Y |  |
| `rvnw59` | tinyint | Y |  |
| `rvwk59` | tinyint | Y |  |
| `rvlive` | int | N |  |
| `ID` | binary(0) | Y |  |

## `AllRevivedInventoryInsDate`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `RU` | varchar(10) | N |  |
| `year` | int unsigned | Y |  |
| `month` | int | Y |  |
| `state` | varchar(2) | N |  |
| `zip` | varchar(5) | N |  |
| `VT` | varchar(5) | Y |  |
| `callable` | tinyint | Y |  |
| `calllead` | tinyint | Y |  |
| `batchSL` | tinyint | Y |  |
| `batchHW` | tinyint | Y |  |
| `batchWI` | tinyint | Y |  |
| `batchBR` | tinyint | Y |  |
| `batchRF` | tinyint | Y |  |
| `batchCR` | tinyint | Y |  |
| `batchHS` | tinyint | Y |  |
| `callSL` | tinyint | Y |  |
| `callHW` | tinyint | Y |  |
| `callWI` | tinyint | Y |  |
| `callBR` | tinyint | Y |  |
| `callRF` | tinyint | Y |  |
| `callCR` | tinyint | Y |  |
| `callHS` | tinyint | Y |  |
| `f1` | tinyint | Y |  |
| `f2` | tinyint | Y |  |
| `f3` | tinyint | Y |  |
| `f4` | tinyint | Y |  |
| `f5` | tinyint | Y |  |
| `leads` | bigint | N |  |
| `lastRevived` | date | N |  |
| `insertionDate` | date | Y |  |
| `rvnw14` | tinyint | Y |  |
| `rvwk14` | tinyint | Y |  |
| `rvnw29` | tinyint | Y |  |
| `rvwk29` | tinyint | Y |  |
| `rvnw43` | tinyint | Y |  |
| `rvwk43` | tinyint | Y |  |
| `rvnw59` | tinyint | Y |  |
| `rvwk59` | tinyint | Y |  |
| `rvlive` | int | N |  |
| `ID` | varbinary(0) | Y |  |

## `BatchRuntimes`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ssId` | bigint unsigned | N |  |
| `jobtype` | varchar(6) | N |  |
| `buslogic` | varchar(60) | Y |  |
| `batchdate` | date | Y |  |
| `responseTime` | decimal(54,0) | Y |  |

## `DRVInventory`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `lastCallDispo` | varchar(50) | Y |  |
| `phone` | bigint | Y | MUL |
| `postalCode` | varchar(5) | Y | MUL |
| `state` | varchar(2) | Y | MUL |
| `FSCode1` | varchar(150) | Y | MUL |
| `VT` | varchar(5) | Y | MUL |
| `liveZip` | int | Y | MUL |
| `insertionDate` | timestamp | Y | MUL |
| `liveZipSL` | int | N | MUL |
| `liveZipHW` | int | N | MUL |
| `liveZipWI` | int | Y | MUL |
| `isDNC` | int | N | MUL |
| `f1` | tinyint | Y |  |
| `f2` | tinyint | Y | MUL |
| `f3` | tinyint | Y |  |
| `f4` | tinyint | Y |  |
| `f5` | tinyint | Y |  |
| `RU1` | datetime | Y | MUL |
| `RU2` | datetime | Y | MUL |
| `RU3` | datetime | Y | MUL |
| `RU4` | datetime | Y | MUL |
| `RU5` | datetime | Y | MUL |
| `RU6` | datetime | Y | MUL |
| `RU7` | datetime | Y | MUL |
| `RU8` | datetime | Y | MUL |
| `RU9` | datetime | Y | MUL |
| `RU10` | datetime | Y | MUL |
| `RU11` | datetime | Y | MUL |
| `RU12` | datetime | Y | MUL |
| `RU13` | datetime | Y | MUL |
| `RU14` | datetime | Y | MUL |
| `RU15` | datetime | Y | MUL |
| `RU16` | datetime | Y | MUL |
| `RU17` | datetime | Y | MUL |
| `RU18` | datetime | Y | MUL |
| `RU19` | datetime | Y | MUL |
| `RU20` | datetime | Y | MUL |
| `aRU1` | datetime | Y | MUL |
| `aRU2` | datetime | Y | MUL |
| `aRU3` | datetime | Y | MUL |

## `DRVInventory_arc`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `phone` | varchar(15) | N | MUL |
| `insertionDate` | timestamp | N | MUL |
| `insDate` | date | N | MUL |

## `DRVInvtyPhoneMaxDT`  ·  dimension · ~0 rows · InnoDB
PK: `ID`, `phone`, `maxdt`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `phone` | varchar(15) | N | PRI |
| `maxdt` | timestamp | N | PRI |

## `DRVInvtyTokens`  ·  dimension · ~0 rows · InnoDB
PK: `OLeadID`, `tokens`

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(40) | N | PRI |
| `tokens` | tinyint | N | PRI |

## `DmsAllRVInvtyBatch`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(100) | N |  |
| `RU` | varchar(27) | N |  |
| `FSCode1` | varchar(150) | Y |  |
| `state` | varchar(2) | Y |  |
| `zip` | varchar(5) | Y |  |
| `VT` | varchar(5) | Y |  |
| `liveZip` | int | Y |  |
| `liveZipSL` | int | N |  |
| `liveZipHW` | int | N |  |
| `liveZipWI` | int | Y |  |
| `liveZipBR` | int | Y |  |
| `liveZipRF` | tinyint | Y |  |
| `liveZipCR` | tinyint | Y |  |
| `liveZipHS` | tinyint | Y |  |
| `batchSL` | int | N |  |
| `batchHW` | int | N |  |
| `batchWI` | int | N |  |
| `batchBR` | int | N |  |
| `batchRF` | int | N |  |
| `batchCR` | int | N |  |
| `batchHS` | int | N |  |
| `callSL` | int | N |  |
| `callHW` | int | N |  |
| `callWI` | int | N |  |
| `callBR` | int | N |  |
| `callRF` | int | N |  |
| `callCR` | int | N |  |
| `callHS` | int | N |  |
| `f1` | int | N |  |
| `f2` | int | N |  |
| `f3` | int | N |  |
| `f4` | int | N |  |
| `f5` | int | N |  |
| `decimus` | int | N |  |
| `revivable` | int | N |  |
| `calllead` | int | N |  |
| `duplicate` | int | N |  |
| `rvDUPE` | tinyint | Y |  |
| `lastRevived` | date | Y |  |
| `rvnw14` | bigint | N |  |
| `rvwk14` | bigint | Y |  |
| `rvnw29` | bigint | N |  |
| `rvwk29` | bigint | Y |  |
| `rvnw43` | bigint | N |  |
| `rvwk43` | bigint | Y |  |
| `rvnw59` | bigint | N |  |
| `rvwk59` | bigint | Y |  |
| `insertionDate` | timestamp | Y |  |
| `ID` | int | N |  |

## `DmsInventoryBatchAll`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(40) | N | MUL |
| `RU` | varchar(10) | N |  |
| `FSCode1` | varchar(150) | N | MUL |
| `state` | varchar(2) | N |  |
| `zip` | varchar(5) | N | MUL |
| `VT` | varchar(5) | Y | MUL |
| `liveZip` | int | Y | MUL |
| `liveZipSL` | int | N |  |
| `liveZipHW` | int | N |  |
| `liveZipWI` | int | Y | MUL |
| `liveZipBR` | int | Y | MUL |
| `liveZipRF` | tinyint | Y | MUL |
| `liveZipCR` | tinyint | Y | MUL |
| `liveZipHS` | tinyint | Y | MUL |
| `batchSL` | tinyint | Y | MUL |
| `batchHW` | tinyint | Y | MUL |
| `batchWI` | tinyint | Y | MUL |
| `batchBR` | tinyint | Y | MUL |
| `batchRF` | tinyint | Y | MUL |
| `batchCR` | tinyint | Y | MUL |
| `batchHS` | tinyint | Y | MUL |
| `callSL` | tinyint | Y | MUL |
| `callHW` | tinyint | Y | MUL |
| `callWI` | tinyint | Y | MUL |
| `callBR` | tinyint | Y | MUL |
| `callRF` | tinyint | Y |  |
| `callCR` | tinyint | Y |  |
| `callHS` | tinyint | Y | MUL |
| `f1` | tinyint | Y |  |
| `f2` | tinyint | Y |  |
| `f3` | tinyint | Y |  |
| `f4` | tinyint | Y |  |
| `f5` | tinyint | Y |  |
| `decimus` | bit(1) | N | MUL |
| `revivable` | tinyint | Y | MUL |
| `calllead` | tinyint | Y | MUL |
| `duplicate` | tinyint | Y | MUL |
| `rvDUPE` | tinyint | Y | MUL |
| `lastRevived` | date | N |  |
| `rvnw14` | tinyint | Y | MUL |
| `rvwk14` | tinyint | Y | MUL |
| `rvnw29` | tinyint | Y | MUL |
| `rvwk29` | tinyint | Y | MUL |
| `rvnw43` | tinyint | Y | MUL |
| `rvwk43` | tinyint | Y | MUL |
| `rvnw59` | tinyint | Y | MUL |
| `rvwk59` | tinyint | Y | MUL |
| `insertionDate` | timestamp | N | MUL |
| `ID` | int | N | PRI |

## `DmsRVInvtyPhoneMaxDT`  ·  dimension · ~0 rows · InnoDB
PK: `ID`, `phone`, `maxdt`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `phone` | varchar(15) | N | PRI |
| `maxdt` | timestamp | N | PRI |

## `DrevivedLeadsBatches`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `batchId` | varchar(40) | N | MUL |
| `RU` | varchar(10) | N | MUL |
| `notes` | varchar(255) | N |  |
| `reviveDate` | datetime | N | MUL |
| `revivedDate` | datetime | N | MUL |
| `rv` | tinyint | Y |  |

## `DrevivedLeadsBatches_arc`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `batchId` | varchar(40) | N | MUL |
| `RU` | varchar(10) | N | MUL |
| `notes` | varchar(255) | N |  |
| `reviveDate` | datetime | N | MUL |
| `revivedDate` | datetime | N | MUL |
| `rv` | tinyint | Y | MUL |
| `rw` | tinyint | Y | MUL |
| `dreviveDate` | date | Y | MUL |

## `DrevivedLeadsDays`  ·  dimension · ~0 rows · InnoDB
PK: `reviveDate`

| column | type | null | key |
|---|---|---|---|
| `yearnum` | smallint | N | MUL |
| `reviveDate` | date | N | PRI |
| `dowk` | tinyint | Y |  |
| `rstatus` | tinyint | Y |  |

## `DrevivedLeadsRV`  ·  dimension · ~0 rows · InnoDB
PK: `reviveDate`

| column | type | null | key |
|---|---|---|---|
| `reviveDate` | date | N | PRI |

## `RBBInventoryAll`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `YEAR` | int | N |  |
| `MONTH` | int | N |  |
| `RU1` | decimal(32,0) | Y |  |
| `RU2` | decimal(32,0) | Y |  |
| `RU3` | decimal(32,0) | Y |  |
| `grand_total` | decimal(32,0) | Y |  |

## `RBBLastRevived`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `OLeadId` | varchar(40) | N | MUL |
| `RBBlastRevived` | datetime | Y |  |
| `lastRevived` | date | Y | MUL |
| `RBBDupeDays` | smallint | Y |  |

## `RIBDashboard`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `VT` | varchar(5) | Y | MUL |
| `reportType` | tinyint | Y |  |
| `runDate` | date | Y | MUL |
| `month` | date | Y |  |
| `state` | varchar(5) | Y | MUL |
| `RU1` | int | Y |  |
| `RU2` | int | Y |  |
| `RU3` | int | Y |  |
| `RU4` | int | Y |  |
| `RU5` | int | Y |  |
| `RU6` | int | Y |  |
| `RU7` | int | Y |  |
| `RU8` | int | Y |  |
| `RU9` | int | Y |  |
| `RU10` | int | Y |  |
| `RU11` | int | Y |  |
| `RU12` | int | Y |  |
| `RU13` | int | Y |  |
| `RU14` | int | Y |  |
| `RU15` | int | Y |  |
| `RU16` | int | Y |  |
| `RU17` | int | Y |  |
| `RU18` | int | Y |  |
| `RU19` | int | Y |  |
| `RU20` | int | Y |  |

## `RIBDashboardState`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `VT` | varchar(5) | Y | MUL |
| `reportType` | tinyint | Y |  |
| `runDate` | date | Y | MUL |
| `state` | varchar(5) | Y |  |
| `RU1` | int | Y |  |
| `RU2` | int | Y |  |
| `RU3` | int | Y |  |
| `RU4` | int | Y |  |
| `RU5` | int | Y |  |
| `RU6` | int | Y |  |
| `RU7` | int | Y |  |
| `RU8` | int | Y |  |
| `RU9` | int | Y |  |
| `RU10` | int | Y |  |
| `RU11` | int | Y |  |
| `RU12` | int | Y |  |
| `RU13` | int | Y |  |
| `RU14` | int | Y |  |
| `RU15` | int | Y |  |
| `RU16` | int | Y |  |
| `RU17` | int | Y |  |
| `RU18` | int | Y |  |
| `RU19` | int | Y |  |
| `RU20` | int | Y |  |

## `RVInventory`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | N | MUL |
| `lastCallDispo` | varchar(50) | Y |  |
| `phone` | varchar(15) | Y | MUL |
| `postalCode` | varchar(5) | Y | MUL |
| `state` | varchar(2) | Y | MUL |
| `FSCode1` | varchar(150) | Y | MUL |
| `VT` | varchar(5) | Y | MUL |
| `liveZip` | int | Y | MUL |
| `insertionDate` | timestamp | Y | MUL |
| `liveZipSL` | int | N | MUL |
| `liveZipHW` | int | N | MUL |
| `liveZipWI` | int | Y | MUL |
| `liveZipBR` | int | Y | MUL |
| `liveZipRF` | tinyint | Y | MUL |
| `liveZipCR` | tinyint | Y | MUL |
| `liveZipHS` | tinyint | Y | MUL |
| `isDNC` | int | N | MUL |
| `disposition` | tinyint | Y | MUL |
| `rvDUPE` | tinyint | Y | MUL |
| `rvRND` | tinyint | Y | MUL |
| `rvX` | tinyint | Y | MUL |
| `batchSL` | tinyint | Y | MUL |
| `batchHW` | tinyint | Y | MUL |
| `batchWI` | tinyint | Y | MUL |
| `batchBR` | tinyint | Y | MUL |
| `batchRF` | tinyint | Y | MUL |
| `batchCR` | tinyint | Y | MUL |
| `batchHS` | tinyint | Y | MUL |
| `callSL` | tinyint | Y | MUL |
| `callHW` | tinyint | Y | MUL |
| `callWI` | tinyint | Y | MUL |
| `callBR` | tinyint | Y | MUL |
| `callRF` | tinyint | Y |  |
| `callCR` | tinyint | Y |  |
| `callHS` | tinyint | Y | MUL |
| `f1` | tinyint | Y | MUL |
| `f2` | tinyint | Y | MUL |
| `f3` | tinyint | Y | MUL |
| `f4` | tinyint | Y | MUL |
| `f5` | tinyint | Y | MUL |
| `RU1` | datetime | Y | MUL |
| `RU2` | datetime | Y | MUL |
| `RU3` | datetime | Y | MUL |
| `RU4` | datetime | Y | MUL |
| `RU5` | datetime | Y | MUL |
| `RU6` | datetime | Y | MUL |
| `RU7` | datetime | Y | MUL |
| `RU8` | datetime | Y | MUL |
| `RU9` | datetime | Y | MUL |
| `RU10` | datetime | Y | MUL |
| `RU11` | datetime | Y | MUL |
| `RU12` | datetime | Y | MUL |
| `RU13` | datetime | Y | MUL |
| `RU14` | datetime | Y | MUL |
| `RU15` | datetime | Y | MUL |
| `RU16` | datetime | Y | MUL |
| `RU17` | datetime | Y | MUL |
| `RU18` | datetime | Y | MUL |
| `RU19` | datetime | Y | MUL |
| `RU20` | datetime | Y | MUL |
| `aRU1` | datetime | Y |  |
| `aRU2` | datetime | Y |  |
| `aRU3` | datetime | Y |  |

## `RVInventoryAll`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `RU` | varchar(10) | N | MUL |
| `year` | int | N | MUL |
| `month` | int | N | MUL |
| `state` | varchar(2) | N | MUL |
| `zip` | varchar(5) | N | MUL |
| `VT` | varchar(5) | Y | MUL |
| `callable` | int | N | MUL |
| `calllead` | tinyint | Y | MUL |
| `batchSL` | tinyint | Y | MUL |
| `batchHW` | tinyint | Y | MUL |
| `batchWI` | tinyint | Y | MUL |
| `batchBR` | tinyint | Y | MUL |
| `batchRF` | tinyint | Y | MUL |
| `batchCR` | tinyint | Y | MUL |
| `batchHS` | tinyint | Y | MUL |
| `callSL` | tinyint | Y | MUL |
| `callHW` | tinyint | Y | MUL |
| `callWI` | tinyint | Y | MUL |
| `callBR` | tinyint | Y | MUL |
| `callRF` | tinyint | Y |  |
| `callCR` | tinyint | Y |  |
| `callHS` | tinyint | Y | MUL |
| `f1` | tinyint | N |  |
| `f2` | tinyint | N |  |
| `f3` | tinyint | N |  |
| `f4` | tinyint | Y |  |
| `f5` | tinyint | Y |  |
| `leads` | int | Y |  |
| `lastRevived` | date | N |  |
| `rvnw14` | tinyint | Y |  |
| `rvwk14` | tinyint | Y |  |
| `rvnw29` | tinyint | Y |  |
| `rvwk29` | tinyint | Y |  |
| `rvnw43` | tinyint | Y |  |
| `rvwk43` | tinyint | Y |  |
| `rvnw59` | tinyint | Y |  |
| `rvwk59` | tinyint | Y |  |
| `rvlive` | tinyint | Y |  |
| `ID` | int | N | PRI |

## `RVInventoryAllInsDate`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `RU` | varchar(10) | N |  |
| `year` | int | N |  |
| `month` | int | N |  |
| `state` | varchar(2) | N |  |
| `zip` | varchar(5) | N |  |
| `VT` | varchar(5) | Y |  |
| `callable` | int | N |  |
| `calllead` | tinyint | Y |  |
| `batchSL` | tinyint | Y |  |
| `batchHW` | tinyint | Y |  |
| `batchWI` | tinyint | Y |  |
| `batchBR` | tinyint | Y |  |
| `batchRF` | tinyint | Y |  |
| `batchCR` | tinyint | Y |  |
| `batchHS` | tinyint | Y |  |
| `callSL` | tinyint | Y |  |
| `callHW` | tinyint | Y |  |
| `callWI` | tinyint | Y |  |
| `callBR` | tinyint | Y |  |
| `callRF` | tinyint | Y |  |
| `callCR` | tinyint | Y |  |
| `callHS` | tinyint | Y |  |
| `f1` | tinyint | N |  |
| `f2` | tinyint | N |  |
| `f3` | tinyint | N |  |
| `f4` | tinyint | Y |  |
| `f5` | tinyint | Y |  |
| `leads` | int | Y |  |
| `lastRevived` | date | N |  |
| `insertionDate` | date | Y |  |
| `rvnw14` | tinyint | Y |  |
| `rvwk14` | tinyint | Y |  |
| `rvnw29` | tinyint | Y |  |
| `rvwk29` | tinyint | Y |  |
| `rvnw43` | tinyint | Y |  |
| `rvwk43` | tinyint | Y | MUL |
| `rvnw59` | tinyint | Y |  |
| `rvwk59` | tinyint | Y |  |
| `rvlive` | tinyint | Y |  |
| `ID` | int | N | PRI |

## `RVInventoryBatchAll`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(40) | N | MUL |
| `RU` | varchar(10) | N |  |
| `state` | varchar(2) | N |  |
| `zip` | varchar(5) | N | MUL |
| `VT` | varchar(5) | Y |  |
| `liveZip` | int | Y | MUL |
| `liveZipSL` | int | N |  |
| `liveZipHW` | int | N |  |
| `liveZipWI` | int | Y | MUL |
| `liveZipBR` | int | Y | MUL |
| `liveZipRF` | tinyint | Y | MUL |
| `liveZipCR` | tinyint | Y | MUL |
| `liveZipHS` | tinyint | Y | MUL |
| `batchSL` | tinyint | Y | MUL |
| `batchHW` | tinyint | Y | MUL |
| `batchWI` | tinyint | Y | MUL |
| `batchBR` | tinyint | Y | MUL |
| `batchRF` | tinyint | Y | MUL |
| `batchCR` | tinyint | Y | MUL |
| `batchHS` | tinyint | Y | MUL |
| `callSL` | tinyint | Y | MUL |
| `callHW` | tinyint | Y | MUL |
| `callWI` | tinyint | Y | MUL |
| `callBR` | tinyint | Y | MUL |
| `callRF` | tinyint | Y |  |
| `callCR` | tinyint | Y |  |
| `callHS` | tinyint | Y | MUL |
| `f1` | tinyint | Y |  |
| `f2` | tinyint | N |  |
| `f3` | tinyint | Y |  |
| `f4` | tinyint | Y |  |
| `f5` | tinyint | Y |  |
| `decimus` | tinyint | Y |  |
| `lastRevived` | date | N |  |
| `rvnw14` | tinyint | Y | MUL |
| `rvnw29` | tinyint | Y | MUL |
| `rvnw43` | tinyint | Y | MUL |
| `rvnw59` | tinyint | Y | MUL |
| `rvDUPE` | tinyint | Y | MUL |
| `insertionDate` | timestamp | N | MUL |
| `ID` | int | N | PRI |

## `RVInventoryBatchLog`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `jobname` | varchar(10) | N | MUL |
| `runDate` | date | N |  |
| `weekno` | tinyint | N |  |
| `rvInfo` | json | Y |  |
| `rvData` | json | Y |  |

## `RVInventoryDailyState`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `runDate` | date | N |  |
| `status` | tinyint | N |  |

## `RVInventoryDailyState_arc`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `runDate` | date | N |  |
| `status` | tinyint | N |  |

## `RVInventoryDnc_tmp`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `id` | int | N | PRI |
| `RVInventory_id` | int | N | UNI |
| `OLeadID` | varchar(45) | N |  |
| `phone` | varchar(15) | N |  |

## `RVInventoryEmails`  ·  dimension · ~28 rows · InnoDB
PK: `toolName`, `emailaddr`

| column | type | null | key |
|---|---|---|---|
| `toolName` | varchar(30) | N | PRI |
| `emailaddr` | varchar(100) | N | PRI |

## `RVInventoryMinMax`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `minv` | int | N |  |
| `maxv` | int | N |  |

## `RVInventoryPeriod`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `dateStart` | date | Y | MUL |
| `dateEnd` | date | Y |  |

## `RVInventoryRUDT`  ·  dimension · ~0 rows · InnoDB
PK: `RU`, `lastRevived`

| column | type | null | key |
|---|---|---|---|
| `RU` | varchar(10) | N | PRI |
| `lastRevived` | date | N | PRI |

## `RVInventoryRvNw`  ·  dimension · ~0 rows · InnoDB
PK: `active`

| column | type | null | key |
|---|---|---|---|
| `ribweeks` | smallint | Y |  |
| `active` | tinyint | N | PRI |

## `RVInventoryState`  ·  dimension · ~0 rows · InnoDB
PK: `jobname`, `runDate`

| column | type | null | key |
|---|---|---|---|
| `jobname` | varchar(10) | N | PRI |
| `runDate` | date | N | PRI |
| `status` | tinyint | N |  |
| `rreport` | tinyint | Y | MUL |

## `RVInventoryStateRvNw`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ribweek` | smallint | Y |  |
| `active` | tinyint | N |  |

## `RVInventoryState_arc`  ·  dimension · ~0 rows · InnoDB
PK: `jobname`, `runDate`

| column | type | null | key |
|---|---|---|---|
| `jobname` | varchar(10) | N | PRI |
| `runDate` | date | N | PRI |
| `status` | tinyint | N |  |
| `rreport` | tinyint | Y | MUL |

## `RVInventoryTimes`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `jobType` | varchar(30) | Y | MUL |
| `jobStep` | varchar(150) | Y |  |
| `jobState` | tinyint | Y |  |
| `responseTime` | int | Y |  |
| `buslogic` | varchar(60) | Y | MUL |
| `batchDate` | date | Y | MUL |

## `RVInventoryTrigger`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `jobName` | varchar(10) | N |  |
| `runDate` | date | N | MUL |
| `purpose` | varchar(100) | Y |  |
| `outcome` | tinyint | Y |  |
| `reason` | varchar(60) | Y |  |
| `updateTs` | timestamp | Y |  |

## `RVInventoryWeek`  ·  dimension · ~0 rows · InnoDB
PK: `runDate`, `weekno`

| column | type | null | key |
|---|---|---|---|
| `runDate` | date | N | PRI |
| `weekno` | smallint | N | PRI |

## `RVInventoryWeekState`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `runDate` | date | N |  |
| `status` | tinyint | N |  |

## `RVInventoryWeekState_arc`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `runDate` | date | N |  |
| `status` | tinyint | N |  |

## `RVInvtyApprvdUrl`  ·  dimension · ~0 rows · InnoDB
PK: `OLeadID`, `approvedUrl`

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(40) | N | PRI |
| `approvedUrl` | tinyint | N | PRI |

## `RVInvtyBatchAllF2`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `zip` | varchar(5) | N | MUL |
| `f2` | int | Y |  |

## `RVInvtyCaz`  ·  dimension · ~0 rows · InnoDB
PK: `VT`, `zip`

| column | type | null | key |
|---|---|---|---|
| `zip` | varchar(5) | N | PRI |
| `VT` | varchar(5) | N | PRI |
| `batch` | tinyint | Y |  |
| `callable` | tinyint | Y |  |

## `RVInvtyCaz_audit`  ·  dimension · ~0 rows · InnoDB
PK: `VT`, `zip`, `auditWeekNo`

| column | type | null | key |
|---|---|---|---|
| `zip` | varchar(5) | N | PRI |
| `VT` | varchar(5) | N | PRI |
| `batch` | tinyint | Y |  |
| `callable` | tinyint | Y |  |
| `auditWeekNo` | smallint | N | PRI |

## `RVInvtyCaz_audit_arc`  ·  dimension · ~0 rows · InnoDB
PK: `ayear`, `auditWeekNo`, `VT`, `zip`

| column | type | null | key |
|---|---|---|---|
| `zip` | varchar(5) | N | PRI |
| `VT` | varchar(5) | N | PRI |
| `batch` | tinyint | Y |  |
| `callable` | tinyint | Y |  |
| `auditWeekNo` | smallint | N | PRI |
| `ayear` | smallint | N | PRI |

## `RVInvtyClients`  ·  dimension · ~0 rows · InnoDB
PK: `clientid`

| column | type | null | key |
|---|---|---|---|
| `clientid` | int | N | PRI |
| `filter` | tinyint | N |  |
| `filter_value` | varchar(30) | Y |  |
| `f1` | tinyint | Y |  |
| `f2` | tinyint | Y |  |
| `f3` | tinyint | Y |  |
| `f4` | tinyint | Y |  |
| `f5` | tinyint | Y |  |
| `VT` | varchar(5) | Y |  |

## `RVInvtyClients_audit`  ·  dimension · ~0 rows · InnoDB
PK: `clientid`, `auditWeekNo`

| column | type | null | key |
|---|---|---|---|
| `clientid` | int | N | PRI |
| `filter` | tinyint | N |  |
| `filter_value` | varchar(30) | Y |  |
| `f1` | tinyint | Y |  |
| `f2` | tinyint | Y |  |
| `f3` | tinyint | Y |  |
| `f4` | tinyint | Y |  |
| `f5` | tinyint | Y |  |
| `VT` | varchar(5) | Y |  |
| `auditWeekNo` | smallint | N | PRI |

## `RVInvtyClients_audit_arc`  ·  dimension · ~0 rows · InnoDB
PK: `ayear`, `auditWeekNo`, `clientid`

| column | type | null | key |
|---|---|---|---|
| `clientid` | int | N | PRI |
| `filter` | tinyint | N |  |
| `filter_value` | varchar(30) | Y |  |
| `f1` | tinyint | Y |  |
| `f2` | tinyint | Y |  |
| `f3` | tinyint | Y |  |
| `f4` | tinyint | Y |  |
| `f5` | tinyint | Y |  |
| `VT` | varchar(5) | Y |  |
| `auditWeekNo` | smallint | N | PRI |
| `ayear` | smallint | N | PRI |

## `RVInvtyDecimus`  ·  dimension · ~0 rows · InnoDB
PK: `FSCode1`, `callCenter`, `RU`

| column | type | null | key |
|---|---|---|---|
| `FSCode1` | varchar(150) | N | PRI |
| `callCenter` | varchar(20) | N | PRI |
| `RU` | varchar(10) | N | PRI |
| `revive` | bit(1) | Y |  |
| `VT` | varchar(5) | Y |  |

## `RVInvtyDecimus_audit`  ·  dimension · ~0 rows · InnoDB
PK: `FSCode1`, `callCenter`, `RU`, `auditWeekNo`

| column | type | null | key |
|---|---|---|---|
| `FSCode1` | varchar(150) | N | PRI |
| `callCenter` | varchar(20) | N | PRI |
| `RU` | varchar(10) | N | PRI |
| `revive` | bit(1) | Y |  |
| `VT` | varchar(5) | Y |  |
| `auditWeekNo` | smallint | N | PRI |

## `RVInvtyDecimus_audit_arc`  ·  dimension · ~0 rows · InnoDB
PK: `ayear`, `auditWeekNo`, `FSCode1`, `callCenter`, `RU`

| column | type | null | key |
|---|---|---|---|
| `FSCode1` | varchar(150) | N | PRI |
| `callCenter` | varchar(20) | N | PRI |
| `RU` | varchar(10) | N | PRI |
| `revive` | bit(1) | Y |  |
| `VT` | varchar(5) | Y |  |
| `auditWeekNo` | smallint | N | PRI |
| `ayear` | smallint | N | PRI |

## `RVInvtyDispos`  ·  dimension · ~0 rows · InnoDB
PK: `OLeadID`, `dispo`

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(40) | N | PRI |
| `dispo` | tinyint | N | PRI |

## `RVInvtyFSCode1`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(40) | Y | MUL |
| `FSCode1` | varchar(150) | Y |  |
| `VT` | varchar(20) | Y | MUL |
| `insertionDate` | date | Y |  |

## `RVInvtyFilters`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `filter` | tinyint | N | MUL |
| `filter_value` | varchar(30) | N |  |
| `filter_desc` | varchar(60) | Y |  |
| `vt` | varchar(5) | Y |  |

## `RVInvtyPhone`  ·  dimension · ~0 rows · InnoDB
PK: `phone`, `maxdt`

| column | type | null | key |
|---|---|---|---|
| `phone` | varchar(15) | N | PRI |
| `maxdt` | timestamp | N | PRI |

## `RVInvtyPhoneMaxDT`  ·  dimension · ~0 rows · InnoDB
PK: `ID`, `phone`, `maxdt`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `phone` | varchar(15) | N | PRI |
| `maxdt` | timestamp | N | PRI |

## `RVInvtySrcDt`  ·  dimension · ~0 rows · InnoDB
PK: `active`

| column | type | null | key |
|---|---|---|---|
| `startDt` | datetime | N |  |
| `active` | tinyint | N | PRI |

## `RVInvtyTimes`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `jobstep` | varchar(150) | Y |  |
| `jobstate` | tinyint | Y |  |
| `timetaken` | int | Y |  |
| `jobtype` | varchar(30) | Y |  |

## `RVInvtyTimesDaily`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `jobstep` | varchar(150) | Y |  |
| `jobstate` | bigint | Y |  |
| `timetaken` | decimal(32,0) | Y |  |

## `RVInvtyTimesWeekly`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `jobstep` | varchar(150) | Y |  |
| `jobstate` | bigint | Y |  |
| `timetaken` | decimal(32,0) | Y |  |

## `RVInvtyTimesWeeklyCont`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `jobstep` | varchar(150) | Y |  |
| `jobstate` | bigint | Y |  |
| `timetaken` | decimal(32,0) | Y |  |

## `RVInvtyTokens`  ·  dimension · ~0 rows · InnoDB
PK: `OLeadID`, `tokens`

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(40) | N | PRI |
| `tokens` | tinyint | N | PRI |

## `RVInvtyVertical`  ·  dimension · ~7 rows · InnoDB
PK: `VT`

| column | type | null | key |
|---|---|---|---|
| `VT` | varchar(5) | N | PRI |
| `decimus` | tinyint | Y |  |
| `duplicate` | tinyint | Y |  |
| `rvInvty` | tinyint | Y |  |

## `RVInvtyWeek`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `RunDate` | date | Y |  |
| `WeekendRun` | date | N |  |
| `WeekNumber` | smallint | N |  |

## `RVRndStatus`  ·  fact · ~9,978,867 rows · InnoDB
PK: `phone`

| column | type | null | key |
|---|---|---|---|
| `phone` | varchar(15) | N | PRI |
| `rnd` | varchar(10) | Y |  |
| `dateProvided` | date | Y | MUL |
| `fsInvalid` | tinyint | Y | MUL |

## `RV_TEMPLATE`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | N | MUL |
| `firstName` | varchar(50) | N |  |
| `lastName` | varchar(50) | N |  |
| `email` | varchar(100) | N |  |
| `phone` | varchar(15) | N | MUL |
| `address` | varchar(100) | N |  |
| `city` | varchar(50) | N |  |
| `state` | varchar(2) | N | MUL |
| `zip` | varchar(5) | N | MUL |
| `dob` | varchar(20) | Y |  |
| `ipAddress` | varchar(45) | N |  |
| `timestampAffiliate` | varchar(50) | N |  |
| `FSCode1` | varchar(100) | N |  |
| `FSCode2` | varchar(100) | N |  |
| `FSCode3` | varchar(100) | N |  |
| `callDispo` | varchar(40) | N | MUL |
| `batchId` | varchar(30) | N | MUL |
| `insertionDate` | timestamp | N |  |
| `title` | int | Y |  |
| `f2` | int | Y | MUL |
| `comments` | varchar(150) | Y |  |
| `RU` | varchar(10) | Y | MUL |
| `duplicate` | varchar(255) | Y | MUL |

## `ReviveDashboard`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `VT` | varchar(5) | Y | MUL |
| `reportType` | tinyint | Y |  |
| `runDate` | date | Y | MUL |
| `state` | varchar(5) | Y |  |
| `month` | date | Y |  |
| `batchSL` | tinyint | Y |  |
| `batchHW` | tinyint | Y |  |
| `batchWI` | tinyint | Y |  |
| `batchBR` | tinyint | Y |  |
| `batchRF` | tinyint | Y |  |
| `batchCR` | tinyint | Y |  |
| `batchHS` | tinyint | Y |  |
| `callSL` | tinyint | Y |  |
| `callHW` | tinyint | Y |  |
| `callWI` | tinyint | Y |  |
| `callBR` | tinyint | Y |  |
| `callRF` | tinyint | Y |  |
| `callCR` | tinyint | Y |  |
| `callHS` | tinyint | Y |  |
| `RU1` | int | Y |  |
| `RU2` | int | Y |  |
| `RU3` | int | Y |  |
| `RU4` | int | Y |  |
| `RU5` | int | Y |  |
| `RU6` | int | Y |  |
| `RU7` | int | Y |  |
| `RU8` | int | Y |  |
| `RU9` | int | Y |  |
| `RU10` | int | Y |  |
| `RU11` | int | Y |  |
| `RU12` | int | Y |  |
| `RU13` | int | Y |  |
| `RU14` | int | Y |  |
| `RU15` | int | Y |  |
| `RU16` | int | Y |  |
| `RU17` | int | Y |  |
| `RU18` | int | Y |  |
| `RU19` | int | Y |  |
| `RU20` | int | Y |  |

## `ReviveDashboardVTRU`  ·  dimension · ~100 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `VT` | varchar(5) | Y | MUL |
| `RU` | varchar(5) | Y | MUL |

## `client_active_zips_audit`  ·  dimension · ~0 rows · InnoDB
PK: `ID`, `auditWeekNo`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `ClientID` | int | N | MUL |
| `Zip` | varchar(5) | N | MUL |
| `State` | varchar(2) | N | MUL |
| `County` | varchar(40) | Y |  |
| `Area` | varchar(20) | Y |  |
| `Live` | tinyint(1) | N |  |
| `Callable` | tinyint(1) | N | MUL |
| `Target` | tinyint(1) | N |  |
| `Batch` | tinyint | Y | MUL |
| `Brand` | tinyint(1) | N |  |
| `activeDate` | varchar(40) | N |  |
| `insertionDate` | timestamp | N |  |
| `auditWeekNo` | smallint | N | PRI |

## `client_active_zips_audit_arc`  ·  dimension · ~0 rows · InnoDB
PK: `ayear`, `auditWeekNo`, `ClientID`, `Zip`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `ClientID` | int | N | PRI |
| `Zip` | varchar(5) | N | PRI |
| `State` | varchar(2) | N | MUL |
| `County` | varchar(40) | Y |  |
| `Area` | varchar(20) | Y |  |
| `Live` | tinyint(1) | N |  |
| `Callable` | tinyint(1) | N | MUL |
| `Target` | tinyint(1) | N |  |
| `Batch` | tinyint | Y | MUL |
| `Brand` | tinyint(1) | N |  |
| `activeDate` | varchar(40) | N |  |
| `insertionDate` | timestamp | N |  |
| `auditWeekNo` | smallint | N | PRI |
| `ayear` | smallint | N | PRI |

## `dailybatch_sqlfiles`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `conmsg` | varchar(150) | Y |  |
| `buslogic` | varchar(60) | Y | MUL |
| `sqlfile` | varchar(500) | Y |  |
| `jobState` | tinyint | Y | MUL |
| `batchDate` | date | Y | MUL |
| `ID` | int | N | PRI |
| `jobType` | char(1) | Y | MUL |
| `sendemail` | tinyint | Y |  |

## `dailybatch_sqlfiles_arc`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `conmsg` | varchar(150) | Y |  |
| `buslogic` | varchar(60) | Y | MUL |
| `sqlfile` | varchar(500) | Y |  |
| `jobState` | tinyint | Y | MUL |
| `batchDate` | date | Y | MUL |
| `ID` | int | N | MUL |
| `jobType` | char(1) | Y | MUL |
| `responseTime` | int | Y |  |

## `fsdb_events_log`  ·  dimension · ~0 rows · InnoDB
PK: `eventName`, `eventStart`

| column | type | null | key |
|---|---|---|---|
| `eventName` | varchar(150) | N | PRI |
| `eventStart` | timestamp | N | PRI |
| `eventEnd` | timestamp | Y | MUL |
| `userId` | varchar(100) | Y |  |
| `params` | varchar(40) | Y |  |

## `lastdaily`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ssId` | bigint unsigned | N |  |
| `jobtype` | varchar(6) | N |  |
| `buslogic` | varchar(60) | Y |  |
| `batchdate` | date | Y |  |
| `responseTime` | decimal(54,0) | Y |  |

## `lastweekly`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ssId` | bigint unsigned | N |  |
| `jobtype` | varchar(6) | N |  |
| `buslogic` | varchar(60) | Y |  |
| `batchdate` | date | Y |  |
| `responseTime` | decimal(54,0) | Y |  |

## `reviveBatchBuilder_OLeads`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `logId` | int | N | MUL |
| `OLeadID` | varchar(100) | Y | MUL |

## `reviveBatchBuilder_log`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `batchId` | varchar(100) | N | MUL |
| `startAt` | timestamp | N | MUL |
| `endAt` | timestamp | Y |  |
| `status` | tinyint | Y | MUL |

## `reviveBatchBuilder_steps`  ·  dimension · ~0 rows · InnoDB
PK: `logId`

| column | type | null | key |
|---|---|---|---|
| `logId` | int | N | PRI |
| `steps` | text | N |  |
| `info` | text | N |  |
| `createdAt` | timestamp | N |  |
| `batchId` | varchar(100) | N |  |
| `isDone` | tinyint | N |  |
| `isCancelled` | tinyint | N | MUL |
| `updatedAt` | timestamp | Y |  |

## `reviveBatchBuilder_zips`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `logId` | int | N | MUL |
| `zip` | varchar(5) | Y | MUL |

## `revive_sqlfiles`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `conmsg` | varchar(150) | Y |  |
| `buslogic` | varchar(60) | Y | MUL |
| `sqlfile` | varchar(500) | Y |  |
| `jobState` | tinyint | Y | MUL |
| `batchDate` | date | Y | MUL |
| `ID` | int | N | PRI |
| `sendemail` | tinyint | Y |  |

## `revive_sqlfiles_arc`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `conmsg` | varchar(150) | Y |  |
| `buslogic` | varchar(60) | Y | MUL |
| `sqlfile` | varchar(500) | Y |  |
| `jobState` | tinyint | Y | MUL |
| `batchDate` | date | Y | MUL |
| `ID` | int | N | MUL |
| `responseTime` | int | Y |  |

## `revivedLeadsBatchesPhones`  ·  dimension · ~0 rows · InnoDB
PK: `phone`

| column | type | null | key |
|---|---|---|---|
| `phone` | varchar(15) | N | PRI |

## `revivedLeadsBatches_dlog`  ·  fact · ~1,423,940 rows · InnoDB
PK: `ID`, `OLeadID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | N | PRI |
| `phone` | varchar(15) | Y | MUL |
| `batchId` | varchar(40) | N | MUL |
| `RU` | varchar(10) | N | MUL |
| `notes` | varchar(255) | N |  |
| `reviveDate` | datetime | N | MUL |
| `revivedDate` | datetime | N | MUL |

## `tttmp_phone`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `ID` | int | Y |  |
| `phone` | varchar(15) | Y | MUL |
| `insertionDate` | timestamp | Y |  |

## `zztmp_dupe_revives`  ·  fact · ~979,089 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `oleadid` | varchar(40) | N | MUL |
| `batchid` | varchar(40) | N | MUL |
| `ru` | varchar(10) | Y | MUL |
| `weekno` | int | Y |  |
| `revcnt` | int | Y |  |
| `fixed` | tinyint | Y | MUL |
