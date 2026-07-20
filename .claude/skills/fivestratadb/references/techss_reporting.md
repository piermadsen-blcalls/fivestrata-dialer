# Schema `techss_reporting`

> **Warning (2026-07-08):** all `TD_*` call-center mirror tables in this schema (every vertical, live and `_arc`) were empty, and `CC_BehindMaster` showed NULL secondsBehind for TD sources — the TD ingestion pipeline is dormant. Verify before using any TD_* table. `CC_BehindMaster` = call-center replica source monitor (host, VT, CC, dbname, secondsBehind). `_shane` tables are ad-hoc analyst copies.

Reporting layer — dashboards, conversion views, intake facts, and many reporting dimensions.

**150 tables** — dimension: 121, fact: 8, view: 21

## `B1_DataRaw`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `fullName` | varchar(100) | Y |  |
| `contactId` | int | Y | MUL |
| `dealId` | int | Y |  |
| `StateName` | varchar(50) | Y |  |
| `fdaSigned` | date | Y |  |
| `paid` | date | Y |  |
| `Amt` | decimal(12,2) | Y |  |

## `B1_DataStg`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `fullName` | varchar(100) | Y |  |
| `contactId` | int | Y | MUL |
| `dealId` | int | Y |  |
| `StateName` | varchar(50) | Y |  |
| `fdaSigned` | varchar(20) | Y |  |
| `paid` | varchar(20) | Y |  |
| `Amt` | decimal(12,2) | Y |  |

## `B_DataRaw`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadId` | varchar(40) | Y | MUL |
| `ContactId` | int | Y | MUL |
| `LeadId` | varchar(40) | Y |  |
| `email` | varchar(100) | Y | MUL |
| `firstName` | varchar(50) | Y |  |
| `lastName` | varchar(50) | Y |  |
| `phone` | varchar(15) | Y | MUL |
| `zip` | varchar(5) | Y | MUL |
| `state` | varchar(20) | Y |  |
| `address` | varchar(100) | Y |  |
| `city` | varchar(50) | Y |  |
| `leadSource` | varchar(50) | Y |  |
| `leadDetail` | varchar(50) | Y |  |
| `leadLevel` | varchar(10) | Y |  |
| `leadStatus` | varchar(20) | Y |  |
| `createDate` | date | Y |  |
| `addedOn` | date | Y |  |
| `appDate` | date | Y |  |
| `demoDate` | date | Y |  |
| `bookDate` | date | Y |  |
| `soldDate` | date | Y |  |
| `NQReason` | varchar(100) | Y |  |
| `leadPrice` | decimal(12,2) | Y |  |
| `vendorId` | varchar(50) | Y | MUL |
| `projectStatus` | varchar(50) | Y |  |
| `appOutcome` | varchar(50) | Y |  |
| `withInvoice` | tinyint | Y |  |
| `revshrAmt` | decimal(12,2) | Y |  |

## `B_DataStg`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `ContactId` | int | Y | MUL |
| `LeadId` | varchar(40) | Y |  |
| `email` | varchar(100) | Y | MUL |
| `firstName` | varchar(50) | Y |  |
| `lastName` | varchar(50) | Y |  |
| `phone` | varchar(30) | Y | MUL |
| `zip` | varchar(5) | Y | MUL |
| `state` | varchar(20) | Y |  |
| `address` | varchar(100) | Y |  |
| `city` | varchar(50) | Y |  |
| `leadSource` | varchar(50) | Y |  |
| `leadDetail` | varchar(50) | Y |  |
| `leadLevel` | varchar(10) | Y |  |
| `leadStatus` | varchar(20) | Y |  |
| `createDate` | varchar(20) | Y |  |
| `addedOn` | varchar(20) | Y |  |
| `appDate` | varchar(20) | Y |  |
| `demoDate` | varchar(20) | Y |  |
| `bookDate` | varchar(20) | Y |  |
| `soldDate` | varchar(20) | Y |  |
| `NQReason` | varchar(100) | Y |  |
| `leadPrice` | decimal(12,2) | Y |  |
| `vendorId` | varchar(50) | Y | MUL |
| `projectStatus` | varchar(50) | Y |  |
| `appOutcome` | varchar(50) | Y |  |

## `CC_BehindMaster`  ·  dimension · ~5 rows · InnoDB
PK: `ipAddress`, `VT`, `CC`

| column | type | null | key |
|---|---|---|---|
| `ipAddress` | varchar(100) | N | PRI |
| `VT` | varchar(5) | N | PRI |
| `CC` | varchar(5) | N | PRI |
| `userid` | varchar(50) | N |  |
| `dbname` | varchar(50) | Y |  |
| `secondsBehind` | int | Y |  |
| `lastUpdate` | timestamp | Y |  |

## `CC_DailyDashboard`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `CC` | varchar(5) | N | MUL |
| `VT` | varchar(5) | N | MUL |
| `Campaign` | varchar(60) | Y |  |
| `List` | varchar(10) | Y |  |
| `FSCode1` | varchar(150) | Y |  |
| `state` | varchar(5) | Y |  |
| `area` | varchar(20) | Y |  |
| `dial_date` | date | N | MUL |
| `dhours` | decimal(10,4) | Y |  |
| `phonetime` | decimal(10,4) | Y |  |
| `dial` | int | Y |  |
| `sale` | int | Y |  |
| `contact` | int | Y |  |
| `complete` | int | Y |  |
| `lapsed` | int | Y |  |
| `abandon` | int | Y |  |
| `almostsale` | int | Y |  |
| `lostsale` | int | Y |  |
| `tatt` | int | Y |  |
| `tagree` | int | Y |  |
| `tsucc` | int | Y |  |

## `CC_EIS`  ·  dimension · ~63 rows · InnoDB
PK: `CC`, `VT`, `list`

| column | type | null | key |
|---|---|---|---|
| `CC` | varchar(5) | N | PRI |
| `VT` | varchar(5) | N | PRI |
| `list` | varchar(10) | N | PRI |

## `CC_EIS_State`  ·  dimension · ~0 rows · InnoDB
PK: `CC`

| column | type | null | key |
|---|---|---|---|
| `CC` | varchar(5) | N | PRI |
| `eisOn` | tinyint | N |  |

## `CC_WeeklyDashboard`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `CC` | varchar(5) | N | MUL |
| `VT` | varchar(5) | N | MUL |
| `ReceivedDate` | date | Y | MUL |
| `List` | varchar(10) | Y |  |
| `FSCode1` | varchar(150) | Y | MUL |
| `state` | varchar(5) | Y |  |
| `market` | varchar(20) | Y |  |
| `Attempts` | int | Y |  |
| `dials` | int | Y |  |
| `received` | int | Y |  |
| `Contact` | int | Y |  |
| `Complete` | int | Y |  |
| `Lapsed` | int | Y |  |
| `Sale` | int | Y |  |
| `Abandon` | int | Y |  |
| `AlmostSale` | int | Y |  |
| `LostSale` | int | Y |  |
| `tAtt` | int | Y |  |
| `tSucc` | int | Y |  |
| `TAgree` | int | Y |  |

## `CC_dispos`  ·  dimension · ~68 rows · InnoDB
PK: `dispoCode`

| column | type | null | key |
|---|---|---|---|
| `dispoCode` | varchar(10) | N | PRI |
| `detail` | varchar(80) | Y |  |
| `callcenter` | varchar(5) | N | MUL |
| `contact` | int | N |  |
| `complete` | int | N |  |
| `sale` | int | N |  |
| `abandon` | int | N |  |
| `almostsale` | int | N |  |
| `lostsale` | int | N |  |
| `tAtt` | int | N |  |
| `tAgree` | int | N |  |
| `tSucc` | int | N |  |

## `E_DataRaw`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `persAcctId` | varchar(40) | Y |  |
| `appId` | varchar(40) | Y |  |
| `leadSourceId` | varchar(40) | Y |  |
| `leadId` | varchar(40) | Y |  |
| `marketSegment` | varchar(30) | Y |  |
| `sourceType` | varchar(20) | Y |  |
| `sourceName` | varchar(40) | Y |  |
| `leadSourceName` | varchar(60) | Y |  |
| `phone` | varchar(15) | Y | MUL |
| `appName` | varchar(100) | Y |  |
| `appDate` | date | Y |  |
| `createDate` | date | Y |  |
| `zip` | varchar(15) | Y |  |
| `setOn` | date | Y |  |
| `confirmedOn` | date | Y |  |
| `assignedOn` | date | Y |  |
| `prodCategory` | varchar(30) | Y |  |
| `uSet` | tinyint | Y |  |
| `confirm` | tinyint | Y |  |
| `issued` | tinyint | Y |  |
| `demo` | tinyint | Y |  |
| `sold` | tinyint | Y |  |
| `netSale` | tinyint | Y |  |
| `grossAmt` | decimal(12,2) | Y |  |
| `netAmt` | decimal(12,2) | Y |  |
| `Results` | varchar(30) | Y |  |
| `ResultsDetail` | varchar(30) | Y |  |
| `status` | varchar(20) | Y |  |
| `statusDetails` | varchar(30) | Y |  |
| `numActivities` | tinyint | Y |  |
| `latestCallResults` | varchar(30) | Y |  |
| `oleadid` | varchar(40) | Y | MUL |

## `E_DataStg`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `persAcctId` | varchar(40) | Y |  |
| `appId` | varchar(40) | Y |  |
| `leadSourceId` | varchar(40) | Y |  |
| `leadId` | varchar(40) | Y |  |
| `marketSegment` | varchar(30) | Y |  |
| `sourceType` | varchar(20) | Y |  |
| `sourceName` | varchar(40) | Y |  |
| `leadSourceName` | varchar(60) | Y |  |
| `phone` | varchar(30) | Y | MUL |
| `appName` | varchar(100) | Y |  |
| `appDate` | varchar(20) | Y |  |
| `createDate` | varchar(20) | Y |  |
| `zip` | varchar(15) | Y |  |
| `setOn` | varchar(20) | Y |  |
| `confirmedOn` | varchar(20) | Y |  |
| `assignedOn` | varchar(20) | Y |  |
| `prodCategory` | varchar(30) | Y |  |
| `uSet` | tinyint | Y |  |
| `confirm` | tinyint | Y |  |
| `issued` | tinyint | Y |  |
| `demo` | tinyint | Y |  |
| `sold` | tinyint | Y |  |
| `netSale` | tinyint | Y |  |
| `grossAmt` | decimal(12,2) | Y |  |
| `netAmt` | decimal(12,2) | Y |  |
| `Results` | varchar(30) | Y |  |
| `ResultsDetail` | varchar(30) | Y |  |
| `status` | varchar(20) | Y |  |
| `statusDetails` | varchar(30) | Y |  |
| `numActivities` | tinyint | Y |  |
| `latestCallResults` | varchar(30) | Y |  |

## `K_DataRaw`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `Idno` | int | Y |  |
| `customer` | varchar(100) | Y |  |
| `phone` | varchar(15) | Y | MUL |
| `entryDate` | date | Y | MUL |
| `dispo` | varchar(50) | Y | MUL |
| `uState` | varchar(10) | Y |  |
| `uSet` | tinyint | Y |  |
| `uIssue` | tinyint | Y |  |
| `uDemo` | tinyint | Y |  |
| `noCalls` | smallint | Y |  |
| `grossAmt` | decimal(12,2) | Y |  |
| `netAmt` | decimal(12,2) | Y |  |
| `jobStatus` | varchar(80) | Y |  |
| `OLeadId` | varchar(40) | Y | MUL |

## `K_DataStg`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `Idno` | int | Y |  |
| `customer` | varchar(100) | Y |  |
| `phone` | varchar(20) | Y | MUL |
| `entryDate` | varchar(20) | Y |  |
| `dispo` | varchar(50) | Y | MUL |
| `uState` | varchar(10) | Y |  |
| `uSet` | tinyint | Y |  |
| `uIssue` | tinyint | Y |  |
| `uDemo` | tinyint | Y |  |
| `noCalls` | smallint | Y |  |
| `grossAmt` | decimal(12,2) | Y |  |
| `netAmt` | decimal(12,2) | Y |  |
| `jobStatus` | varchar(80) | Y |  |

## `L_DataRaw`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadId` | varchar(40) | Y | MUL |
| `leadSource` | tinyint | Y |  |
| `appSet` | tinyint | Y |  |
| `createDate` | date | Y |  |
| `acctName` | varchar(100) | Y |  |
| `address` | varchar(100) | Y |  |
| `city` | varchar(50) | Y |  |
| `state` | varchar(2) | Y | MUL |
| `zip` | varchar(5) | Y | MUL |
| `phone` | varchar(15) | Y | MUL |
| `appDate` | date | Y |  |
| `setByName` | varchar(100) | Y |  |
| `appCpl` | tinyint | Y |  |
| `appIssue` | tinyint | Y |  |
| `appDemo` | tinyint | Y |  |
| `appSold` | tinyint | Y |  |
| `soldOn` | date | Y |  |
| `soldPrice` | decimal(12,2) | Y |  |
| `appWorking` | tinyint | Y |  |
| `workingAmt` | decimal(12,2) | Y |  |
| `appCancelOn` | date | Y |  |
| `bankTurnDown` | tinyint | Y |  |
| `bankTurnDownAmt` | decimal(12,2) | Y |  |
| `rescinded` | tinyint | Y |  |
| `rescindedAmt` | decimal(12,2) | Y |  |
| `appNet` | tinyint | Y |  |
| `appNetOn` | date | Y |  |
| `appNetAmt` | decimal(12,2) | Y |  |
| `appTakenOn` | date | Y |  |
| `marketSegment` | varchar(20) | Y |  |
| `interestCat` | varchar(20) | Y |  |

## `L_DataStg`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `leadSource` | tinyint | Y |  |
| `appSet` | tinyint | Y |  |
| `createDate` | varchar(20) | Y |  |
| `acctName` | varchar(100) | Y |  |
| `address` | varchar(100) | Y |  |
| `city` | varchar(50) | Y |  |
| `state` | varchar(2) | Y | MUL |
| `zip` | varchar(5) | Y | MUL |
| `phone` | varchar(30) | Y | MUL |
| `appDate` | varchar(20) | Y |  |
| `setByName` | varchar(100) | Y |  |
| `appCpl` | tinyint | Y |  |
| `appIssue` | tinyint | Y |  |
| `appDemo` | tinyint | Y |  |
| `appSold` | tinyint | Y |  |
| `soldOn` | varchar(20) | Y |  |
| `soldPrice` | decimal(12,2) | Y |  |
| `appWorking` | tinyint | Y |  |
| `workingAmt` | decimal(12,2) | Y |  |
| `appCancelOn` | varchar(20) | Y |  |
| `bankTurnDown` | tinyint | Y |  |
| `bankTurnDownAmt` | decimal(12,2) | Y |  |
| `rescinded` | tinyint | Y |  |
| `rescindedAmt` | decimal(12,2) | Y |  |
| `appNet` | tinyint | Y |  |
| `appNetOn` | varchar(20) | Y |  |
| `appNetAmt` | decimal(12,2) | Y |  |
| `appTakenOn` | varchar(20) | Y |  |
| `marketSegment` | varchar(20) | Y |  |
| `interestCat` | varchar(20) | Y |  |

## `M_DataRaw`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `tstamp` | datetime | Y | MUL |
| `uLeadId` | varchar(100) | Y | MUL |
| `firstName` | varchar(50) | Y |  |
| `lastName` | varchar(50) | Y |  |
| `uState` | varchar(10) | Y |  |
| `market` | varchar(50) | Y |  |
| `phone` | varchar(20) | Y | MUL |
| `email` | varchar(100) | Y |  |
| `appDate` | date | Y | MUL |
| `results` | varchar(50) | Y |  |
| `notes` | varchar(50) | Y |  |
| `OLeadId` | varchar(40) | Y | MUL |

## `M_DataStg`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `tstamp` | varchar(50) | Y |  |
| `uLeadId` | varchar(100) | Y | MUL |
| `firstName` | varchar(50) | Y |  |
| `lastName` | varchar(50) | Y |  |
| `uState` | varchar(10) | Y |  |
| `market` | varchar(50) | Y |  |
| `phone` | varchar(20) | Y | MUL |
| `email` | varchar(100) | Y |  |
| `appDate` | varchar(50) | Y |  |
| `results` | varchar(50) | Y |  |
| `notes` | varchar(50) | Y |  |

## `P_DataRaw`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadId` | varchar(40) | Y | MUL |
| `groupedBy` | varchar(20) | Y |  |
| `groupedId` | int | Y |  |
| `lastName` | varchar(20) | Y |  |
| `phone` | varchar(15) | Y | MUL |
| `productId` | varchar(10) | Y |  |
| `grossAmt` | decimal(12,2) | Y |  |
| `contractId` | varchar(10) | Y |  |
| `subSource` | varchar(40) | Y |  |
| `sourceId` | varchar(40) | Y |  |
| `netAmt` | decimal(12,2) | Y |  |
| `dspId` | varchar(10) | Y |  |
| `entryDate` | date | Y |  |
| `salesRepName` | varchar(100) | Y |  |
| `brnId` | varchar(10) | Y |  |
| `promoterName` | varchar(50) | Y |  |
| `jobStatusDesc` | varchar(50) | Y |  |
| `everSet` | tinyint | Y |  |
| `everConfirmed` | tinyint | Y |  |
| `everIssued` | tinyint | Y |  |
| `everNetIssued` | tinyint | Y |  |
| `everSat` | tinyint | Y |  |
| `everSold` | tinyint | Y |  |
| `fullName` | varchar(100) | Y |  |
| `xBrnId` | varchar(10) | Y |  |
| `xUseColor` | tinyint | Y |  |
| `xSDate` | date | Y |  |
| `xEDate` | date | Y |  |
| `xsrsId` | smallint | Y |  |
| `xsaleOnly` | tinyint | Y |  |
| `xSourceSubDesc` | varchar(50) | Y |  |
| `xgroupedBy` | varchar(20) | Y |  |
| `currentDate` | date | Y |  |
| `currentTime` | time | Y |  |
| `useColor` | tinyint | Y |  |
| `xProductId` | varchar(10) | Y |  |

## `P_DataStg`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `groupedBy` | varchar(20) | Y |  |
| `groupedId` | int | Y |  |
| `lastName` | varchar(20) | Y |  |
| `phone` | varchar(30) | Y | MUL |
| `productId` | varchar(10) | Y |  |
| `grossAmt` | decimal(12,2) | Y |  |
| `contractId` | varchar(10) | Y |  |
| `subSource` | varchar(40) | Y |  |
| `sourceId` | varchar(40) | Y |  |
| `netAmt` | decimal(12,2) | Y |  |
| `dspId` | varchar(10) | Y |  |
| `entryDate` | varchar(20) | Y |  |
| `salesRepName` | varchar(100) | Y |  |
| `brnId` | varchar(10) | Y |  |
| `promoterName` | varchar(50) | Y |  |
| `jobStatusDesc` | varchar(50) | Y |  |
| `everSet` | tinyint | Y |  |
| `everConfirmed` | tinyint | Y |  |
| `everIssued` | tinyint | Y |  |
| `everNetIssued` | tinyint | Y |  |
| `everSat` | tinyint | Y |  |
| `everSold` | tinyint | Y |  |
| `fullName` | varchar(100) | Y |  |
| `xBrnId` | varchar(10) | Y |  |
| `xUseColor` | tinyint | Y |  |
| `xSDate` | varchar(20) | Y |  |
| `xEDate` | varchar(20) | Y |  |
| `xsrsId` | smallint | Y |  |
| `xsaleOnly` | tinyint | Y |  |
| `xSourceSubDesc` | varchar(50) | Y |  |
| `xgroupedBy` | varchar(20) | Y |  |
| `currentDateTime` | varchar(30) | Y |  |
| `useColor` | tinyint | Y |  |
| `xProductId` | varchar(10) | Y |  |

## `Pin_DataRaw`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `prospectId` | int | Y |  |
| `firstName` | varchar(50) | Y |  |
| `lastName` | varchar(50) | Y |  |
| `phone` | varchar(15) | Y | MUL |
| `everSet` | tinyint | Y |  |
| `everIssued` | tinyint | Y |  |
| `everDemo` | tinyint | Y |  |
| `nsa` | decimal(12,2) | Y |  |
| `gsa` | decimal(12,2) | Y |  |
| `lastResult` | varchar(20) | Y |  |
| `dispo` | varchar(20) | Y |  |
| `appDate` | date | Y |  |
| `entryDate` | date | Y |  |
| `market` | varchar(20) | Y |  |
| `oleadid` | varchar(40) | Y | MUL |

## `Pin_DataStg`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `prospectId` | int | Y |  |
| `logNumber` | varchar(10) | Y |  |
| `firstName` | varchar(50) | Y |  |
| `lastName` | varchar(50) | Y |  |
| `phone` | varchar(30) | Y | MUL |
| `productId` | varchar(10) | Y |  |
| `everSet` | tinyint | Y |  |
| `everIssued` | tinyint | Y |  |
| `everDemo` | tinyint | Y |  |
| `sold` | tinyint | Y |  |
| `creditDeclined` | tinyint | Y |  |
| `netJob` | tinyint | Y |  |
| `nsa` | decimal(12,2) | Y |  |
| `gsa` | decimal(12,2) | Y |  |
| `lastResult` | varchar(20) | Y |  |
| `dispo` | varchar(20) | Y |  |
| `appDate` | varchar(20) | Y |  |
| `entryDate` | varchar(20) | Y |  |
| `market` | varchar(20) | Y |  |

## `TD_AU_dial_logs`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `dial_date` | datetime | N | MUL |
| `VT` | varchar(3) | N | MUL |
| `list` | varchar(10) | N | MUL |
| `fscode1` | varchar(50) | N | MUL |
| `state` | varchar(2) | N | MUL |
| `market` | varchar(20) | N | MUL |
| `area` | varchar(20) | Y |  |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `call_status` | varchar(10) | N | MUL |
| `dial` | int | N |  |
| `inbound` | tinyint | N |  |

## `TD_AU_dial_logs_arc`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `dial_date` | datetime | N | MUL |
| `VT` | varchar(3) | N | MUL |
| `list` | varchar(10) | N | MUL |
| `fscode1` | varchar(50) | N | MUL |
| `state` | varchar(2) | N | MUL |
| `market` | varchar(20) | N | MUL |
| `area` | varchar(20) | Y |  |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `call_status` | varchar(10) | N | MUL |
| `dial` | int | N |  |
| `inbound` | tinyint | N |  |

## `TD_AU_vicidial_agent_log`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `agentLogId` | int | N |  |
| `uniqueId` | varchar(20) | Y | MUL |
| `leadId` | int | N |  |
| `event_time` | datetime | N | MUL |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `callStatus` | varchar(10) | N | MUL |
| `inbound` | tinyint | N |  |
| `campaign_id` | varchar(10) | Y | MUL |
| `VT` | varchar(5) | Y | MUL |

## `TD_AU_vicidial_agent_log_arc`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `agentLogId` | int | Y |  |
| `uniqueId` | varchar(20) | Y | MUL |
| `leadId` | int | N |  |
| `event_time` | datetime | N | MUL |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `callStatus` | varchar(10) | N | MUL |
| `inbound` | tinyint | N |  |
| `campaign_id` | varchar(10) | Y | MUL |
| `VT` | varchar(5) | Y | MUL |

## `TD_AU_vicidial_log`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `uniqueId` | varchar(20) | N | MUL |
| `leadId` | int | Y |  |
| `campaign` | varchar(20) | N | MUL |
| `dialing_date` | datetime | N | MUL |
| `list` | int | N | MUL |
| `oleadid` | varchar(50) | Y |  |
| `wait_sec` | int | Y |  |
| `talk_sec` | int | Y |  |
| `dispo_sec` | int | Y |  |
| `status` | varchar(10) | Y | MUL |
| `fscode1` | varchar(50) | Y | MUL |
| `vt` | varchar(3) | Y | MUL |
| `sc` | varchar(5) | Y | MUL |
| `cp` | varchar(20) | Y |  |
| `ostate` | varchar(2) | Y | MUL |
| `state` | varchar(2) | Y | MUL |
| `market` | varchar(100) | Y | MUL |
| `area` | varchar(20) | Y |  |
| `zip` | varchar(5) | Y | MUL |

## `TD_AU_vicidial_log_arc`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `uniqueId` | varchar(20) | N | MUL |
| `leadId` | int | Y |  |
| `campaign` | varchar(20) | N | MUL |
| `dialing_date` | datetime | N | MUL |
| `list` | int | N | MUL |
| `oleadid` | varchar(50) | Y |  |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `status` | varchar(10) | Y | MUL |
| `fscode1` | varchar(50) | Y | MUL |
| `vt` | varchar(3) | Y | MUL |
| `sc` | varchar(5) | Y | MUL |
| `cp` | varchar(20) | Y |  |
| `ostate` | varchar(2) | Y | MUL |
| `state` | varchar(2) | Y | MUL |
| `market` | varchar(100) | Y | MUL |
| `area` | varchar(20) | Y |  |
| `zip` | varchar(5) | N | MUL |

## `TD_BR_dial_logs`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `dial_date` | datetime | N | MUL |
| `VT` | varchar(3) | N | MUL |
| `list` | varchar(10) | N | MUL |
| `fscode1` | varchar(50) | N | MUL |
| `state` | varchar(2) | N | MUL |
| `market` | varchar(20) | N | MUL |
| `area` | varchar(20) | Y |  |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `call_status` | varchar(10) | N | MUL |
| `dial` | int | N |  |
| `inbound` | tinyint | N |  |

## `TD_BR_dial_logs_arc`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `dial_date` | datetime | N | MUL |
| `VT` | varchar(3) | N | MUL |
| `list` | varchar(10) | N | MUL |
| `fscode1` | varchar(50) | N | MUL |
| `state` | varchar(2) | N | MUL |
| `market` | varchar(20) | N | MUL |
| `area` | varchar(20) | Y |  |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `call_status` | varchar(10) | N | MUL |
| `dial` | int | N |  |
| `inbound` | tinyint | N |  |

## `TD_BR_vicidial_agent_log`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `agentLogId` | int | N |  |
| `uniqueId` | varchar(20) | Y | MUL |
| `leadId` | int | N |  |
| `event_time` | datetime | N | MUL |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `callStatus` | varchar(10) | N | MUL |
| `inbound` | tinyint | N |  |
| `campaign_id` | varchar(10) | Y | MUL |
| `VT` | varchar(5) | Y | MUL |

## `TD_BR_vicidial_agent_log_arc`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `agentLogId` | int | Y |  |
| `uniqueId` | varchar(20) | Y | MUL |
| `leadId` | int | N |  |
| `event_time` | datetime | N | MUL |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `callStatus` | varchar(10) | N | MUL |
| `inbound` | tinyint | N |  |
| `campaign_id` | varchar(10) | Y | MUL |
| `VT` | varchar(5) | Y | MUL |

## `TD_BR_vicidial_log`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `uniqueId` | varchar(20) | N | MUL |
| `leadId` | int | Y |  |
| `campaign` | varchar(20) | N | MUL |
| `dialing_date` | datetime | N | MUL |
| `list` | int | N | MUL |
| `oleadid` | varchar(50) | Y |  |
| `wait_sec` | int | Y |  |
| `talk_sec` | int | Y |  |
| `dispo_sec` | int | Y |  |
| `status` | varchar(10) | Y | MUL |
| `fscode1` | varchar(50) | Y | MUL |
| `vt` | varchar(3) | Y | MUL |
| `sc` | varchar(5) | Y | MUL |
| `cp` | varchar(20) | Y |  |
| `ostate` | varchar(2) | Y | MUL |
| `state` | varchar(2) | Y | MUL |
| `market` | varchar(100) | Y | MUL |
| `area` | varchar(20) | Y |  |
| `zip` | varchar(5) | Y | MUL |

## `TD_BR_vicidial_log_arc`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `uniqueId` | varchar(20) | N | MUL |
| `leadId` | int | Y |  |
| `campaign` | varchar(20) | N | MUL |
| `dialing_date` | datetime | N | MUL |
| `list` | int | N | MUL |
| `oleadid` | varchar(50) | Y |  |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `status` | varchar(10) | Y | MUL |
| `fscode1` | varchar(50) | Y | MUL |
| `vt` | varchar(3) | Y | MUL |
| `sc` | varchar(5) | Y | MUL |
| `cp` | varchar(20) | Y |  |
| `ostate` | varchar(2) | Y | MUL |
| `state` | varchar(2) | Y | MUL |
| `market` | varchar(100) | Y | MUL |
| `area` | varchar(20) | Y |  |
| `zip` | varchar(5) | N | MUL |

## `TD_DailyDashboard`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `VT` | varchar(5) | N |  |
| `Campaign` | varchar(60) | Y |  |
| `List` | varchar(10) | Y |  |
| `FSCode1` | varchar(150) | Y |  |
| `state` | varchar(5) | Y |  |
| `area` | varchar(20) | Y |  |
| `dial_date` | date | N |  |
| `dhours` | decimal(10,4) | Y |  |
| `phonetime` | decimal(10,4) | Y |  |
| `dial` | int | Y |  |
| `sale` | int | Y |  |
| `contact` | int | Y |  |
| `complete` | int | Y |  |
| `abandon` | int | Y |  |
| `almostsale` | int | Y |  |
| `lostsale` | int | Y |  |
| `tatt` | int | Y |  |
| `tagree` | int | Y |  |
| `tsucc` | int | Y |  |

## `TD_HW_dial_logs`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `dial_date` | datetime | N | MUL |
| `VT` | varchar(3) | N | MUL |
| `list` | varchar(10) | N | MUL |
| `fscode1` | varchar(50) | N | MUL |
| `state` | varchar(2) | N | MUL |
| `market` | varchar(20) | N | MUL |
| `area` | varchar(20) | Y |  |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `call_status` | varchar(10) | N | MUL |
| `dial` | int | N |  |
| `inbound` | tinyint | N |  |

## `TD_HW_dial_logs_arc`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `dial_date` | datetime | N | MUL |
| `VT` | varchar(3) | N | MUL |
| `list` | varchar(10) | N | MUL |
| `fscode1` | varchar(50) | N | MUL |
| `state` | varchar(2) | N | MUL |
| `market` | varchar(20) | N | MUL |
| `area` | varchar(20) | Y |  |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `call_status` | varchar(10) | N | MUL |
| `dial` | int | N |  |
| `inbound` | tinyint | N |  |

## `TD_HW_dial_logs_shane`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `dial_date` | datetime | N | MUL |
| `VT` | varchar(3) | N | MUL |
| `list` | varchar(10) | N | MUL |
| `fscode1` | varchar(50) | N | MUL |
| `state` | varchar(2) | N | MUL |
| `market` | varchar(20) | N | MUL |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `call_status` | varchar(10) | N | MUL |
| `dial` | int | N |  |

## `TD_HW_vicidial_agent_log`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `agentLogId` | int | N |  |
| `uniqueId` | varchar(20) | Y | MUL |
| `leadId` | int | N |  |
| `event_time` | datetime | N | MUL |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `callStatus` | varchar(10) | N | MUL |
| `inbound` | tinyint | N |  |
| `campaign_id` | varchar(10) | Y | MUL |
| `VT` | varchar(5) | Y | MUL |

## `TD_HW_vicidial_agent_log_arc`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `agentLogId` | int | Y |  |
| `uniqueId` | varchar(20) | Y | MUL |
| `leadId` | int | N |  |
| `event_time` | datetime | N | MUL |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `callStatus` | varchar(10) | N | MUL |
| `inbound` | tinyint | N |  |
| `campaign_id` | varchar(10) | Y | MUL |
| `VT` | varchar(5) | Y | MUL |

## `TD_HW_vicidial_agent_log_shane`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `uniqueId` | varchar(20) | Y | MUL |
| `leadId` | int | N |  |
| `event_time` | datetime | N | MUL |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `callStatus` | varchar(10) | N | MUL |

## `TD_HW_vicidial_log`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `uniqueId` | varchar(20) | N | MUL |
| `leadId` | int | Y |  |
| `campaign` | varchar(20) | N | MUL |
| `dialing_date` | datetime | N | MUL |
| `list` | int | N | MUL |
| `oleadid` | varchar(50) | Y |  |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `status` | varchar(10) | Y | MUL |
| `fscode1` | varchar(50) | Y | MUL |
| `vt` | varchar(3) | Y | MUL |
| `sc` | varchar(5) | Y | MUL |
| `cp` | varchar(20) | Y |  |
| `ostate` | varchar(2) | Y | MUL |
| `state` | varchar(2) | Y | MUL |
| `market` | varchar(100) | Y | MUL |
| `area` | varchar(20) | Y |  |
| `zip` | varchar(5) | N | MUL |

## `TD_HW_vicidial_log_arc`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `uniqueId` | varchar(20) | N | MUL |
| `leadId` | int | Y |  |
| `campaign` | varchar(20) | N | MUL |
| `dialing_date` | datetime | N | MUL |
| `list` | int | N | MUL |
| `oleadid` | varchar(50) | Y |  |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `status` | varchar(10) | Y | MUL |
| `fscode1` | varchar(50) | Y | MUL |
| `vt` | varchar(3) | Y | MUL |
| `sc` | varchar(5) | Y | MUL |
| `cp` | varchar(20) | Y |  |
| `ostate` | varchar(2) | Y | MUL |
| `state` | varchar(2) | Y | MUL |
| `market` | varchar(100) | Y | MUL |
| `area` | varchar(20) | Y |  |
| `zip` | varchar(5) | N | MUL |

## `TD_SL_dial_logs`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `dial_date` | datetime | N | MUL |
| `VT` | varchar(3) | N | MUL |
| `list` | varchar(10) | N | MUL |
| `fscode1` | varchar(50) | N | MUL |
| `state` | varchar(2) | N | MUL |
| `market` | varchar(20) | N | MUL |
| `area` | varchar(20) | Y |  |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `call_status` | varchar(10) | N | MUL |
| `dial` | int | N |  |
| `inbound` | tinyint | N |  |

## `TD_SL_dial_logs_arc`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `dial_date` | datetime | N | MUL |
| `VT` | varchar(3) | N | MUL |
| `list` | varchar(10) | N | MUL |
| `fscode1` | varchar(50) | N | MUL |
| `state` | varchar(2) | N | MUL |
| `market` | varchar(20) | N | MUL |
| `area` | varchar(20) | Y |  |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `call_status` | varchar(10) | N | MUL |
| `dial` | int | N |  |
| `inbound` | tinyint | N |  |

## `TD_SL_vicidial_agent_log`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `agentLogId` | int | N |  |
| `uniqueId` | varchar(20) | Y | MUL |
| `leadId` | int | N |  |
| `event_time` | datetime | N | MUL |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `callStatus` | varchar(10) | N | MUL |
| `inbound` | tinyint | N |  |
| `campaign_id` | varchar(10) | Y | MUL |
| `VT` | varchar(5) | Y | MUL |

## `TD_SL_vicidial_agent_log_arc`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `agentLogId` | int | Y |  |
| `uniqueId` | varchar(20) | Y | MUL |
| `leadId` | int | N |  |
| `event_time` | datetime | N | MUL |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `callStatus` | varchar(10) | N | MUL |
| `inbound` | tinyint | N |  |
| `campaign_id` | varchar(10) | Y | MUL |
| `VT` | varchar(5) | Y | MUL |

## `TD_SL_vicidial_log`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `uniqueId` | varchar(20) | N | MUL |
| `leadId` | int | Y |  |
| `campaign` | varchar(20) | N | MUL |
| `dialing_date` | datetime | N | MUL |
| `list` | int | N | MUL |
| `oleadid` | varchar(50) | Y |  |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `status` | varchar(10) | Y | MUL |
| `fscode1` | varchar(50) | Y | MUL |
| `vt` | varchar(3) | Y | MUL |
| `sc` | varchar(5) | Y | MUL |
| `cp` | varchar(20) | Y |  |
| `ostate` | varchar(2) | Y | MUL |
| `state` | varchar(2) | Y | MUL |
| `market` | varchar(100) | Y | MUL |
| `area` | varchar(20) | Y |  |
| `zip` | varchar(5) | N | MUL |

## `TD_SL_vicidial_log_arc`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `uniqueId` | varchar(20) | N | MUL |
| `leadId` | int | Y |  |
| `campaign` | varchar(20) | N | MUL |
| `dialing_date` | datetime | N | MUL |
| `list` | int | N | MUL |
| `oleadid` | varchar(50) | Y |  |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `status` | varchar(10) | Y | MUL |
| `fscode1` | varchar(50) | Y | MUL |
| `vt` | varchar(3) | Y | MUL |
| `sc` | varchar(5) | Y | MUL |
| `cp` | varchar(20) | Y |  |
| `ostate` | varchar(2) | Y | MUL |
| `state` | varchar(2) | Y | MUL |
| `market` | varchar(100) | Y | MUL |
| `area` | varchar(20) | Y |  |
| `zip` | varchar(5) | N | MUL |

## `TD_WI_dial_logs`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `dial_date` | datetime | N | MUL |
| `VT` | varchar(3) | N | MUL |
| `list` | varchar(10) | N | MUL |
| `fscode1` | varchar(50) | N | MUL |
| `state` | varchar(2) | N | MUL |
| `market` | varchar(20) | N | MUL |
| `area` | varchar(20) | Y |  |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `call_status` | varchar(10) | N | MUL |
| `dial` | int | N |  |
| `inbound` | tinyint | N |  |

## `TD_WI_dial_logs_arc`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `dial_date` | datetime | N | MUL |
| `VT` | varchar(3) | N | MUL |
| `list` | varchar(10) | N | MUL |
| `fscode1` | varchar(50) | N | MUL |
| `state` | varchar(2) | N | MUL |
| `market` | varchar(20) | N | MUL |
| `area` | varchar(20) | Y |  |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `call_status` | varchar(10) | N | MUL |
| `dial` | int | N |  |
| `inbound` | tinyint | N |  |

## `TD_WI_vicidial_agent_log`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `agentLogId` | int | N |  |
| `uniqueId` | varchar(20) | Y | MUL |
| `leadId` | int | N |  |
| `event_time` | datetime | N | MUL |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `callStatus` | varchar(10) | N | MUL |
| `inbound` | tinyint | N |  |
| `campaign_id` | varchar(10) | Y | MUL |
| `VT` | varchar(5) | Y | MUL |

## `TD_WI_vicidial_agent_log_arc`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `agentLogId` | int | Y |  |
| `uniqueId` | varchar(20) | Y | MUL |
| `leadId` | int | N |  |
| `event_time` | datetime | N | MUL |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `callStatus` | varchar(10) | N | MUL |
| `inbound` | tinyint | N |  |
| `campaign_id` | varchar(10) | Y | MUL |
| `VT` | varchar(5) | Y | MUL |

## `TD_WI_vicidial_log`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `uniqueId` | varchar(20) | N | MUL |
| `leadId` | int | Y |  |
| `campaign` | varchar(20) | N | MUL |
| `dialing_date` | datetime | N | MUL |
| `list` | int | N | MUL |
| `oleadid` | varchar(50) | Y |  |
| `wait_sec` | int | Y |  |
| `talk_sec` | int | Y |  |
| `dispo_sec` | int | Y |  |
| `status` | varchar(10) | Y | MUL |
| `fscode1` | varchar(50) | Y | MUL |
| `vt` | varchar(3) | Y | MUL |
| `sc` | varchar(5) | Y | MUL |
| `cp` | varchar(20) | Y |  |
| `ostate` | varchar(2) | Y | MUL |
| `state` | varchar(2) | Y | MUL |
| `market` | varchar(100) | Y | MUL |
| `area` | varchar(20) | Y |  |
| `zip` | varchar(5) | Y | MUL |

## `TD_WI_vicidial_log_arc`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `uniqueId` | varchar(20) | N | MUL |
| `leadId` | int | Y |  |
| `campaign` | varchar(20) | N | MUL |
| `dialing_date` | datetime | N | MUL |
| `list` | int | N | MUL |
| `oleadid` | varchar(50) | Y |  |
| `wait_sec` | int | N |  |
| `talk_sec` | int | N |  |
| `dispo_sec` | int | N |  |
| `status` | varchar(10) | Y | MUL |
| `fscode1` | varchar(50) | Y | MUL |
| `vt` | varchar(3) | Y | MUL |
| `sc` | varchar(5) | Y | MUL |
| `cp` | varchar(20) | Y |  |
| `ostate` | varchar(2) | Y | MUL |
| `state` | varchar(2) | Y | MUL |
| `market` | varchar(100) | Y | MUL |
| `area` | varchar(20) | Y |  |
| `zip` | varchar(5) | N | MUL |

## `TD_WeeklyDashboard`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `VT` | varchar(5) | N |  |
| `weekno` | int | Y |  |
| `ReceivedDate` | date | Y |  |
| `List` | varchar(10) | Y |  |
| `FSCode1` | varchar(150) | Y |  |
| `state` | varchar(5) | Y |  |
| `market` | varchar(20) | Y |  |
| `Attempts` | int | Y |  |
| `dials` | int | Y |  |
| `received` | int | Y |  |
| `Contact` | int | Y |  |
| `Complete` | int | Y |  |
| `Sale` | int | Y |  |
| `Abandon` | int | Y |  |
| `AlmostSale` | int | Y |  |
| `LostSale` | int | Y |  |
| `tAtt` | int | Y |  |
| `tSucc` | int | Y |  |
| `TAgree` | int | Y |  |

## `TD_dispos`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `dispoCode` | varchar(10) | N |  |
| `detail` | varchar(80) | Y |  |
| `callcenter` | varchar(5) | N |  |
| `contact` | int | N |  |
| `complete` | int | N |  |
| `sale` | int | N |  |
| `abandon` | int | N |  |
| `almostsale` | int | N |  |
| `lostsale` | int | N |  |
| `tAtt` | int | N |  |
| `tAgree` | int | N |  |
| `tSucc` | int | N |  |

## `TD_vici_archiving`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `arcDate` | date | N | MUL |
| `ustate` | tinyint | Y |  |
| `startTs` | timestamp | Y |  |
| `endTs` | timestamp | Y |  |

## `Z_DataRaw`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadId` | varchar(40) | Y | MUL |
| `createDate` | date | Y |  |
| `prospectName` | varchar(100) | Y |  |
| `email` | varchar(100) | Y | MUL |
| `phone` | varchar(15) | Y | MUL |
| `market` | varchar(20) | Y |  |
| `prospectCount` | tinyint | Y |  |
| `NQ` | varchar(10) | Y |  |
| `NQReason` | varchar(100) | Y |  |
| `qualifiedLeads` | varchar(20) | Y |  |
| `prospectNamex` | varchar(100) | Y |  |
| `saleName` | varchar(20) | Y |  |
| `appDate` | date | Y |  |
| `results` | varchar(20) | Y |  |
| `resultsDetail` | varchar(60) | Y |  |
| `appSet` | tinyint | Y |  |
| `appIssue` | tinyint | Y |  |
| `appCancel` | tinyint | Y |  |
| `appDemo` | tinyint | Y |  |
| `appOneLeg` | tinyint | Y |  |
| `appNotDemo` | tinyint | Y |  |
| `appNoShow` | tinyint | Y |  |
| `appCancelled` | tinyint | Y |  |
| `appSold` | tinyint | Y |  |
| `appNet` | tinyint | Y |  |
| `appStatus` | varchar(40) | Y |  |
| `soldPrice` | decimal(12,2) | Y |  |
| `cancelAmt` | decimal(12,2) | Y |  |
| `declineAmt` | decimal(12,2) | Y |  |
| `rescinded` | decimal(12,2) | Y |  |
| `forecastNet` | decimal(12,2) | Y |  |

## `Z_DataStg`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `createDate` | varchar(20) | Y |  |
| `prospectName` | varchar(100) | Y |  |
| `email` | varchar(100) | Y | MUL |
| `phone` | varchar(30) | Y | MUL |
| `market` | varchar(20) | Y |  |
| `prospectCount` | tinyint | Y |  |
| `NQ` | varchar(10) | Y |  |
| `NQReason` | varchar(100) | Y |  |
| `qualifiedLeads` | varchar(20) | Y |  |
| `prospectNamex` | varchar(100) | Y |  |
| `saleName` | varchar(20) | Y |  |
| `appDate` | varchar(20) | Y |  |
| `results` | varchar(20) | Y |  |
| `resultsDetail` | varchar(60) | Y |  |
| `appSet` | tinyint | Y |  |
| `appIssue` | tinyint | Y |  |
| `appCancel` | tinyint | Y |  |
| `appDemo` | tinyint | Y |  |
| `appOneLeg` | tinyint | Y |  |
| `appNotDemo` | tinyint | Y |  |
| `appNoShow` | tinyint | Y |  |
| `appCancelled` | tinyint | Y |  |
| `appSold` | tinyint | Y |  |
| `appNet` | tinyint | Y |  |
| `appStatus` | varchar(40) | Y |  |
| `soldPrice` | decimal(12,2) | Y |  |
| `cancelAmt` | decimal(12,2) | Y |  |
| `declineAmt` | decimal(12,2) | Y |  |
| `rescinded` | decimal(12,2) | Y |  |
| `forecastNet` | decimal(12,2) | Y |  |

## `acceptedLeads`  ·  dimension · ~4,492 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `state` | varchar(5) | Y | MUL |
| `market` | varchar(20) | Y |  |
| `clientid` | int | Y |  |
| `clientname` | varchar(150) | Y |  |
| `ownerid` | int | Y |  |
| `calldispo` | varchar(40) | Y |  |
| `calldispoextended` | varchar(80) | Y |  |
| `vt` | varchar(5) | Y |  |
| `accepted` | int | Y |  |
| `leadprice` | decimal(9,2) | Y |  |
| `lastupdate` | timestamp | Y | MUL |

## `agentDBaretel_STG`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `DialingDate` | varchar(30) | Y |  |
| `SourceID` | varchar(20) | Y |  |
| `FSCode1` | varchar(150) | Y |  |
| `uState` | varchar(2) | Y |  |
| `uUser` | varchar(30) | Y |  |
| `UserGroup` | varchar(30) | Y |  |
| `Seconds` | int | Y |  |
| `Dials` | int | Y |  |
| `Contact` | tinyint | Y |  |
| `Complete` | tinyint | Y |  |
| `Sale` | tinyint | Y |  |
| `Abandon` | tinyint | Y |  |
| `AlmostSale` | tinyint | Y |  |
| `LostSale` | tinyint | Y |  |
| `tAtt` | tinyint | Y |  |
| `tSucc` | tinyint | Y |  |
| `tAgree` | tinyint | Y |  |

## `agentDTopDial_STG`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `CallDate` | varchar(30) | Y |  |
| `List` | varchar(30) | Y |  |
| `FSCode1` | varchar(150) | Y |  |
| `uState` | varchar(2) | Y |  |
| `Market` | varchar(30) | Y |  |
| `uUser` | varchar(30) | Y |  |
| `Team` | varchar(30) | Y |  |
| `Seconds` | int | Y |  |
| `Dials` | int | Y |  |
| `Contact` | tinyint | Y |  |
| `Complete` | tinyint | Y |  |
| `Sale` | tinyint | Y |  |
| `Abandon` | tinyint | Y |  |
| `AlmostSale` | tinyint | Y |  |
| `LostSale` | tinyint | Y |  |
| `tAtt` | tinyint | Y |  |
| `tSucc` | tinyint | Y |  |
| `tAgree` | tinyint | Y |  |

## `appFinalResults`  ·  fact · ~110,320 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `RA` | varchar(5) | Y | MUL |
| `ProcessId` | int | Y | MUL |
| `SequenceNo` | int | Y |  |
| `uPath` | varchar(255) | Y |  |
| `finalDispo` | varchar(40) | Y |  |
| `finalDispoExt` | varchar(80) | Y |  |
| `Complete` | tinyint | Y |  |
| `updateTimestamp` | timestamp | N | MUL |

## `appSpeedToLead`  ·  fact · ~356,267 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | Y | MUL |
| `RA` | varchar(5) | Y | MUL |
| `ProcessId` | int | Y | MUL |
| `SequenceNo` | int | Y |  |
| `ModuleId` | varchar(50) | Y | MUL |
| `Priority` | int | Y |  |
| `CampaignId` | varchar(20) | Y |  |
| `SystemAttempts` | int | Y |  |
| `CallDuration` | int | Y |  |
| `StartTime` | time | Y |  |
| `DialTime` | time | Y |  |
| `FSCode1` | varchar(150) | Y |  |
| `Zip` | varchar(5) | Y |  |
| `insertionDate` | timestamp | Y | MUL |

## `callCenter_CampaignId`  ·  dimension · ~9 rows · InnoDB
PK: `callCenter`, `VT`, `campaign_id`

| column | type | null | key |
|---|---|---|---|
| `callCenter` | varchar(5) | N | PRI |
| `VT` | varchar(5) | N | PRI |
| `campaign_id` | varchar(10) | N | PRI |

## `callCenter_ListId`  ·  dimension · ~4 rows · InnoDB
PK: `callCenter`, `VT`, `list_id`

| column | type | null | key |
|---|---|---|---|
| `callCenter` | varchar(5) | N | PRI |
| `VT` | varchar(5) | N | PRI |
| `list_id` | varchar(10) | N | PRI |

## `cc_callablezip`  ·  dimension · ~0 rows · InnoDB
PK: `refId`, `cc`, `sent_ts`, `vt`, `zip`

| column | type | null | key |
|---|---|---|---|
| `refId` | int | N | PRI |
| `cc` | varchar(5) | N | PRI |
| `sent_ts` | timestamp | N | PRI |
| `vt` | varchar(5) | N | PRI |
| `zip` | varchar(5) | N | PRI |
| `f1` | varchar(5) | Y |  |
| `f2` | varchar(5) | Y |  |
| `f3` | varchar(5) | Y |  |
| `f4` | varchar(5) | Y |  |
| `f5` | varchar(5) | Y |  |

## `cc_vicidial_pulls`  ·  dimension · ~0 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | bigint unsigned | N | PRI |
| `setup_id` | int | N | MUL |
| `report_date` | date | N | MUL |
| `pulled_at` | timestamp | N |  |

## `cc_vicidial_setup`  ·  dimension · ~0 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | bigint unsigned | N | PRI |
| `cc_source` | varchar(10) | Y |  |
| `callcenter` | varchar(5) | Y | MUL |
| `vertical` | varchar(2) | Y |  |
| `campaign` | varchar(20) | Y |  |
| `connection` | varchar(255) | Y |  |
| `config` | json | Y |  |
| `starts_at` | date | Y |  |
| `priority` | int | N | MUL |
| `disabled_at` | datetime | Y | MUL |
| `updated_at` | timestamp | N |  |

## `clientBudgets`  ·  dimension · ~401 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `clientid` | int | Y | MUL |
| `clientname` | varchar(150) | Y |  |
| `term` | varchar(40) | Y |  |
| `budgettype` | tinyint | Y |  |
| `budget` | decimal(12,2) | Y |  |
| `lastupdate` | timestamp | Y |  |

## `client_compliance_dashboard`  ·  dimension · ~39,286 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `ID` | int | Y |  |
| `OLeadID` | varchar(50) | Y | MUL |
| `RecordDate` | timestamp | Y |  |
| `firstName` | varchar(50) | Y |  |
| `lastName` | varchar(50) | Y |  |
| `phone` | varchar(15) | Y |  |
| `state` | varchar(2) | Y |  |
| `postalCode` | varchar(5) | Y |  |
| `callCenter` | varchar(5) | Y |  |
| `sentDate` | datetime | Y |  |
| `client` | varchar(30) | Y |  |
| `clientId` | int | Y |  |
| `CallDate` | timestamp | Y |  |
| `callDispo` | varchar(40) | Y |  |
| `callDispoExtended` | varchar(40) | Y |  |
| `WTClient` | varchar(50) | Y |  |
| `CallCenterBrandId` | int | Y |  |
| `FiveStrataBrandId` | int | Y |  |
| `runDate` | timestamp | N |  |

## `clients_DataRaw`  ·  dimension · ~0 rows · InnoDB
PK: `clientid`

| column | type | null | key |
|---|---|---|---|
| `clientid` | int | N | PRI |
| `tbname` | varchar(20) | Y | MUL |
| `ukey` | varchar(10) | N |  |

## `cv_accepted`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `Year` | int | N |  |
| `state` | varchar(10) | Y |  |
| `SC` | varchar(3) | N |  |
| `CP` | varchar(10) | Y |  |
| `Jan` | decimal(41,0) | Y |  |
| `Feb` | decimal(41,0) | Y |  |
| `Mar` | decimal(41,0) | Y |  |
| `Apr` | decimal(41,0) | Y |  |
| `May` | decimal(41,0) | Y |  |
| `Jun` | decimal(41,0) | Y |  |
| `Jul` | decimal(41,0) | Y |  |
| `Aug` | decimal(41,0) | Y |  |
| `Sep` | decimal(41,0) | Y |  |
| `Oct` | decimal(41,0) | Y |  |
| `Nov` | decimal(41,0) | Y |  |
| `Dec` | decimal(41,0) | Y |  |
| `Accepted` | decimal(41,0) | Y |  |
| `RU0Sent` | decimal(54,0) | Y |  |

## `cv_data_cp`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `year` | int | N |  |
| `month` | int | N |  |
| `vt` | varchar(3) | N |  |
| `cp` | varchar(10) | Y |  |
| `Accepted` | decimal(41,0) | Y |  |
| `Sent` | decimal(54,0) | Y |  |
| `ru0sentp` | decimal(45,2) | Y |  |
| `sentp` | decimal(57,2) | Y |  |

## `cv_data_cp_state`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `year` | int | N |  |
| `month` | int | N |  |
| `state` | varchar(10) | Y |  |
| `vt` | varchar(3) | N |  |
| `cp` | varchar(10) | Y |  |
| `Accepted` | decimal(41,0) | Y |  |
| `Sent` | decimal(54,0) | Y |  |
| `ru0sentp` | decimal(45,2) | Y |  |
| `sentp` | decimal(57,2) | Y |  |

## `cv_data_export`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `Year` | int | N | MUL |
| `Month` | int | N |  |
| `State` | varchar(10) | Y |  |
| `FSCode1` | varchar(100) | N |  |
| `VT` | varchar(3) | N |  |
| `SC` | varchar(3) | N |  |
| `CP` | varchar(10) | Y |  |
| `SS` | varchar(255) | Y |  |
| `SA` | varchar(255) | Y |  |
| `Accepted` | bigint | N |  |
| `Sent` | decimal(32,0) | Y |  |
| `SentVT` | varchar(5) | Y |  |
| `C0` | varchar(3) | N |  |
| `CC` | varchar(3) | N |  |
| `RU` | varchar(5) | Y | MUL |

## `cv_data_sc`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `year` | int | N |  |
| `month` | int | N |  |
| `vt` | varchar(3) | N |  |
| `sc` | varchar(3) | N |  |
| `Accepted` | decimal(41,0) | Y |  |
| `Sent` | decimal(54,0) | Y |  |
| `ru0sentp` | decimal(45,2) | Y |  |
| `sentp` | decimal(57,2) | Y |  |

## `cv_data_sc_state`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `year` | int | N |  |
| `month` | int | N |  |
| `state` | varchar(10) | Y |  |
| `vt` | varchar(3) | N |  |
| `sc` | varchar(3) | N |  |
| `Accepted` | decimal(41,0) | Y |  |
| `Sent` | decimal(54,0) | Y |  |
| `ru0sentp` | decimal(45,2) | Y |  |
| `sentp` | decimal(57,2) | Y |  |

## `cv_data_year`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `year` | int | N |  |
| `vt` | varchar(3) | N |  |
| `Accepted` | decimal(41,0) | Y |  |
| `Sent` | decimal(54,0) | Y |  |
| `ru0sentp` | decimal(45,2) | Y |  |
| `sentp` | decimal(57,2) | Y |  |

## `cv_data_year_state`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `year` | int | N |  |
| `state` | varchar(10) | Y |  |
| `vt` | varchar(3) | N |  |
| `Accepted` | decimal(41,0) | Y |  |
| `Sent` | decimal(54,0) | Y |  |
| `ru0sentp` | decimal(45,2) | Y |  |
| `sentp` | decimal(57,2) | Y |  |

## `cv_data_yearmonth`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `year` | int | N |  |
| `month` | int | N |  |
| `vt` | varchar(3) | N |  |
| `sc` | varchar(3) | N |  |
| `cp` | varchar(10) | Y |  |
| `ss` | varchar(255) | Y |  |
| `sa` | varchar(255) | Y |  |
| `cc` | varchar(3) | N |  |
| `c0` | varchar(3) | N |  |
| `Accepted` | decimal(41,0) | Y |  |
| `Sent` | decimal(54,0) | Y |  |
| `ru0sentp` | decimal(45,2) | Y |  |
| `sentp` | decimal(57,2) | Y |  |

## `cv_data_yearmonth_state`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `year` | int | N |  |
| `month` | int | N |  |
| `vt` | varchar(3) | N |  |
| `sc` | varchar(3) | N |  |
| `cp` | varchar(10) | Y |  |
| `ss` | varchar(255) | Y |  |
| `sa` | varchar(255) | Y |  |
| `cc` | varchar(3) | N |  |
| `c0` | varchar(3) | N |  |
| `state` | varchar(10) | Y |  |
| `Accepted` | decimal(41,0) | Y |  |
| `Sent` | decimal(54,0) | Y |  |
| `ru0sentp` | decimal(45,2) | Y |  |
| `sentp` | decimal(57,2) | Y |  |

## `cv_ru0sent_accepted`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `Year` | int | N |  |
| `SC` | varchar(3) | N |  |
| `CP` | varchar(10) | Y |  |
| `JanSent` | decimal(54,0) | Y |  |
| `FebSent` | decimal(54,0) | Y |  |
| `MarSent` | decimal(54,0) | Y |  |
| `AprSent` | decimal(54,0) | Y |  |
| `MaySent` | decimal(54,0) | Y |  |
| `JunSent` | decimal(54,0) | Y |  |
| `JulSent` | decimal(54,0) | Y |  |
| `AugSent` | decimal(54,0) | Y |  |
| `SepSent` | decimal(54,0) | Y |  |
| `OctSent` | decimal(54,0) | Y |  |
| `NovSent` | decimal(54,0) | Y |  |
| `DecSent` | decimal(54,0) | Y |  |
| `JanAccepted` | decimal(41,0) | Y |  |
| `FebAccepted` | decimal(41,0) | Y |  |
| `MarAccepted` | decimal(41,0) | Y |  |
| `AprAccepted` | decimal(41,0) | Y |  |
| `MayAccepted` | decimal(41,0) | Y |  |
| `JunAccepted` | decimal(41,0) | Y |  |
| `JulAccepted` | decimal(41,0) | Y |  |
| `AugAccepted` | decimal(41,0) | Y |  |
| `SepAccepted` | decimal(41,0) | Y |  |
| `OctAccepted` | decimal(41,0) | Y |  |
| `NovAccepted` | decimal(41,0) | Y |  |
| `DecAccepted` | decimal(41,0) | Y |  |
| `Accepted` | decimal(41,0) | Y |  |
| `RU0Sent` | decimal(54,0) | Y |  |

## `cvd_accepted`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `Year` | smallint | Y |  |
| `state` | varchar(5) | Y | MUL |
| `SC` | varchar(20) | Y |  |
| `CP` | varchar(20) | Y |  |
| `Jan` | int | Y |  |
| `Feb` | int | Y |  |
| `Mar` | int | Y |  |
| `Apr` | int | Y |  |
| `May` | int | Y |  |
| `Jun` | int | Y |  |
| `Jul` | int | Y |  |
| `Aug` | int | Y |  |
| `Sep` | int | Y |  |
| `Oct` | int | Y |  |
| `Nov` | int | Y |  |
| `Dec` | int | Y |  |
| `Accepted` | int | Y |  |
| `RU0Sent` | int | Y |  |

## `cvd_data_yearmonth`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `Year` | smallint | Y |  |
| `Month` | tinyint | Y |  |
| `VT` | varchar(5) | Y |  |
| `SC` | varchar(20) | Y |  |
| `CP` | varchar(20) | Y |  |
| `SS` | varchar(20) | Y |  |
| `SA` | varchar(20) | Y |  |
| `CC` | varchar(20) | Y |  |
| `C0` | varchar(20) | Y |  |
| `Accepted` | int | Y |  |
| `Sent` | int | Y |  |
| `ru0sentp` | int | Y |  |
| `sentp` | int | Y |  |

## `cvd_data_yearmonth_state`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `Year` | smallint | Y |  |
| `Month` | tinyint | Y |  |
| `VT` | varchar(5) | Y |  |
| `SC` | varchar(20) | Y |  |
| `CP` | varchar(20) | Y |  |
| `SS` | varchar(20) | Y |  |
| `SA` | varchar(20) | Y |  |
| `CC` | varchar(20) | Y |  |
| `C0` | varchar(20) | Y |  |
| `state` | varchar(20) | Y |  |
| `Accepted` | int | Y |  |
| `Sent` | int | Y |  |
| `ru0sentp` | int | Y |  |
| `sentp` | int | Y |  |

## `cvd_ru0sent_accepted`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `Year` | smallint | Y |  |
| `SC` | varchar(20) | Y |  |
| `CP` | varchar(20) | Y |  |
| `JanSent` | int | Y |  |
| `FebSent` | int | Y |  |
| `MarSent` | int | Y |  |
| `AprSent` | int | Y |  |
| `MaySent` | int | Y |  |
| `JunSent` | int | Y |  |
| `JulSent` | int | Y |  |
| `AugSent` | int | Y |  |
| `SepSent` | int | Y |  |
| `OctSent` | int | Y |  |
| `NovSent` | int | Y |  |
| `DecSent` | int | Y |  |
| `RU0Sent` | int | Y |  |
| `JanAccepted` | int | Y |  |
| `FebAccepted` | int | Y |  |
| `MarAccepted` | int | Y |  |
| `AprAccepted` | int | Y |  |
| `MayAccepted` | int | Y |  |
| `JunAccepted` | int | Y |  |
| `JulAccepted` | int | Y |  |
| `AugAccepted` | int | Y |  |
| `SepAccepted` | int | Y |  |
| `OctAccepted` | int | Y |  |
| `NovAccepted` | int | Y |  |
| `DecAccepted` | int | Y |  |
| `Accepted` | int | Y |  |

## `darwinOutputData`  ·  dimension · ~0 rows · InnoDB
PK: `runDate`, `Zip`, `SC`, `CP`

| column | type | null | key |
|---|---|---|---|
| `runDate` | date | N | PRI |
| `Zip` | varchar(5) | N | PRI |
| `State` | varchar(5) | Y | MUL |
| `County` | varchar(20) | Y |  |
| `omentum` | smallint | Y |  |
| `SC` | varchar(5) | N | PRI |
| `CP` | varchar(5) | N | PRI |
| `BReS` | decimal(6,2) | Y |  |
| `WIeS` | decimal(6,2) | Y |  |
| `RFeS` | decimal(6,2) | Y |  |
| `SLeS` | decimal(6,2) | Y |  |
| `HWeS` | decimal(6,2) | Y |  |
| `BRRPL` | decimal(9,2) | Y |  |
| `WIRPL` | decimal(9,2) | Y |  |
| `RFRPL` | decimal(9,2) | Y |  |
| `SLRPL` | decimal(9,2) | Y |  |
| `HWRPL` | decimal(9,2) | Y |  |
| `BRHPA` | decimal(6,3) | Y |  |
| `WIHPA` | decimal(6,3) | Y |  |
| `RFHPA` | decimal(6,3) | Y |  |
| `SLHPA` | decimal(6,3) | Y |  |
| `HWHPA` | decimal(6,3) | Y |  |
| `BRMaxCPR` | decimal(6,2) | Y |  |
| `WIMaxCPR` | decimal(6,2) | Y |  |
| `RFMaxCPR` | decimal(6,2) | Y |  |
| `SLMaxCPR` | decimal(6,2) | Y |  |
| `HWMaxCPR` | decimal(6,2) | Y |  |
| `minimum` | smallint | Y |  |
| `BRmPR` | decimal(9,2) | Y |  |
| `WImPR` | decimal(9,2) | Y |  |
| `RFmPR` | decimal(9,2) | Y |  |
| `SLmPR` | decimal(9,2) | Y |  |
| `HWmPR` | decimal(9,2) | Y |  |
| `TopVT` | varchar(5) | Y |  |
| `MAXmPR` | decimal(9,2) | Y |  |
| `mCPR` | decimal(9,2) | Y |  |
| `Needed_BRRPL` | decimal(9,2) | Y |  |
| `Needed_WIRPL` | decimal(9,2) | Y |  |
| `Needed_RFRPL` | decimal(9,2) | Y |  |
| `Needed_SLRPL` | decimal(9,2) | Y |  |

## `darwin_data`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int unsigned | N | PRI |
| `OLeadID` | varchar(36) | N | MUL |
| `State` | varchar(10) | Y |  |
| `Zip` | varchar(5) | Y | MUL |
| `County` | varchar(100) | Y |  |
| `VT` | varchar(3) | Y | MUL |
| `SC` | varchar(3) | Y |  |
| `CP` | varchar(10) | Y |  |
| `C0` | varchar(3) | Y |  |
| `CC` | varchar(3) | Y |  |
| `insertionDate` | datetime | N |  |

## `darwin_data_export`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int unsigned | N | PRI |
| `State` | varchar(10) | Y |  |
| `County` | varchar(100) | Y |  |
| `SC` | varchar(3) | Y |  |
| `CP` | varchar(10) | Y |  |
| `Month` | int | N |  |
| `C0CD` | int | N |  |
| `C0KB` | int | N |  |
| `CCCD` | int | N |  |
| `CCKB` | int | N |  |
| `CCTD` | int | N |  |
| `CC?` | int | N |  |
| `total` | int | N |  |

## `darwin_data_export_br`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int unsigned | N | PRI |
| `State` | varchar(10) | Y |  |
| `County` | varchar(100) | Y |  |
| `SC` | varchar(3) | Y |  |
| `CP` | varchar(10) | Y |  |
| `Month` | int | N |  |
| `C0TD` | int | Y |  |
| `CCTD` | int | N |  |
| `CC?` | int | N |  |
| `total` | int | N |  |

## `darwin_data_export_hw`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int unsigned | N | PRI |
| `State` | varchar(10) | Y |  |
| `County` | varchar(100) | Y |  |
| `SC` | varchar(3) | Y |  |
| `CP` | varchar(10) | Y |  |
| `Month` | int | N |  |
| `C0TD` | int | Y |  |
| `CCTD` | int | N |  |
| `CC?` | int | N |  |
| `total` | int | N |  |

## `darwin_data_export_sl`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int unsigned | N | PRI |
| `State` | varchar(10) | Y |  |
| `County` | varchar(100) | Y |  |
| `SC` | varchar(3) | Y |  |
| `CP` | varchar(10) | Y |  |
| `Month` | int | N |  |
| `C0CD` | int | N |  |
| `C0KB` | int | N |  |
| `CCCD` | int | N |  |
| `CCKB` | int | N |  |
| `CCTD` | int | N |  |
| `CC?` | int | N |  |
| `total` | int | N |  |

## `darwin_data_export_wi`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int unsigned | N | PRI |
| `State` | varchar(10) | Y |  |
| `County` | varchar(100) | Y |  |
| `SC` | varchar(3) | Y |  |
| `CP` | varchar(10) | Y |  |
| `Month` | int | N |  |
| `C0TD` | int | Y |  |
| `CCTD` | int | N |  |
| `C0KB` | int | Y |  |
| `CCKB` | int | Y |  |
| `CC?` | int | N |  |
| `total` | int | N |  |

## `fiveNineCallLog`  ·  fact · ~945,810 rows · InnoDB
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

## `fiveNineCallLog_apitest`  ·  dimension · ~0 rows · InnoDB
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

## `fs_value_attribution`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `issuerank` | tinyint | Y | MUL |
| `issueId` | varchar(15) | Y | MUL |
| `issueSumry` | varchar(100) | Y |  |
| `assignee` | varchar(100) | Y | MUL |
| `storyPoints` | decimal(6,2) | Y |  |
| `startDate` | date | Y | MUL |
| `endDate` | date | Y |  |
| `rootSprint` | varchar(50) | Y |  |
| `currentSprint` | varchar(50) | Y |  |
| `issueStatus` | char(2) | Y | MUL |
| `remarks` | varchar(255) | Y |  |

## `fsdb_events_log`  ·  dimension · ~94 rows · InnoDB
PK: `eventName`, `eventStart`

| column | type | null | key |
|---|---|---|---|
| `eventName` | varchar(150) | N | PRI |
| `eventStart` | timestamp | N | PRI |
| `eventEnd` | timestamp | Y | MUL |
| `userId` | varchar(100) | Y |  |
| `params` | varchar(40) | Y |  |
| `jparams` | json | Y |  |

## `invalid_ListId`  ·  dimension · ~4 rows · InnoDB
PK: `list_id`

| column | type | null | key |
|---|---|---|---|
| `list_id` | varchar(10) | N | PRI |

## `leadSummary`  ·  fact · ~515,167 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | Y |  |
| `phone` | varchar(15) | Y | MUL |
| `state` | varchar(2) | Y | MUL |
| `zip` | varchar(5) | Y | MUL |
| `client` | varchar(255) | Y | MUL |
| `leadType` | varchar(10) | Y | MUL |
| `captureDate` | timestamp | Y |  |
| `market` | varchar(50) | Y |  |
| `area` | varchar(50) | Y |  |
| `calldisposition` | varchar(80) | Y |  |
| `callcenter` | varchar(20) | Y |  |
| `vertical` | varchar(5) | Y |  |
| `datecaptured` | date | Y | MUL |

## `leadSummaryLeadTypes`  ·  dimension · ~4 rows · InnoDB
PK: `strpred`

| column | type | null | key |
|---|---|---|---|
| `strpred` | varchar(10) | N | PRI |

## `mapDashboard`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientId` | int | Y | MUL |
| `oleadid` | varchar(40) | Y | MUL |
| `createDate` | date | Y | MUL |
| `phone` | varchar(15) | Y | MUL |
| `email` | varchar(100) | Y |  |
| `fullName` | varchar(100) | Y |  |
| `uSet` | int | Y |  |
| `uIssue` | int | Y |  |
| `uCancel` | int | Y |  |
| `uDQ` | int | Y |  |
| `uDemo` | int | Y |  |
| `uGrossSale` | int | Y |  |
| `uNetSale` | int | Y |  |
| `uGrossAmt` | decimal(12,2) | Y |  |
| `uNetAmt` | decimal(12,2) | Y |  |
| `uRevShare` | decimal(9,2) | Y |  |
| `uSetDate` | date | Y |  |
| `uIssueDate` | date | Y |  |
| `uDemoDate` | date | Y |  |
| `uGrossSaleDate` | date | Y |  |
| `uNetSaleDate` | date | Y |  |
| `lastUpdate` | timestamp | Y |  |

## `mapDashboardRunState`  ·  dimension · ~0 rows · InnoDB
PK: `running`

| column | type | null | key |
|---|---|---|---|
| `running` | tinyint | N | PRI |

## `mapDataRaw`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `sourceName` | varchar(10) | Y | MUL |
| `timets` | datetime | Y |  |
| `leadId` | varchar(40) | Y |  |
| `firstName` | varchar(50) | Y |  |
| `lastName` | varchar(50) | Y |  |
| `state` | varchar(2) | Y |  |
| `market` | varchar(20) | Y |  |
| `phone` | varchar(20) | Y |  |
| `email` | varchar(100) | Y |  |
| `appDate` | date | Y |  |
| `dispo` | varchar(50) | Y |  |
| `notes` | varchar(100) | Y |  |
| `details` | varchar(200) | Y |  |
| `OLeadId` | varchar(40) | Y | MUL |

## `mapDataStg`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `sourceName` | varchar(10) | Y | MUL |
| `timets` | varchar(20) | Y |  |
| `leadId` | varchar(40) | Y |  |
| `firstName` | varchar(50) | Y |  |
| `lastName` | varchar(50) | Y |  |
| `state` | varchar(2) | Y |  |
| `market` | varchar(20) | Y |  |
| `phone` | varchar(20) | Y |  |
| `email` | varchar(100) | Y |  |
| `appDate` | varchar(20) | Y |  |
| `dispo` | varchar(50) | Y |  |
| `notes` | varchar(100) | Y |  |
| `details` | varchar(200) | Y |  |

## `mapDispoResult`  ·  dimension · ~0 rows · InnoDB
PK: `dispo`

| column | type | null | key |
|---|---|---|---|
| `dispo` | varchar(30) | N | PRI |
| `uSet` | tinyint | Y |  |
| `uIssue` | tinyint | Y |  |
| `uDemo` | tinyint | Y |  |
| `uGrossSale` | tinyint | Y |  |
| `uNetSale` | tinyint | Y |  |

## `nsp_inventory`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `RU` | int | Y | MUL |
| `dyear` | int | Y |  |
| `dmonth` | int | Y |  |
| `state` | varchar(2) | Y |  |
| `postalCode` | varchar(5) | Y |  |
| `Callable` | int | Y |  |
| `totnumleads` | int | Y |  |

## `partner_file_reports`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `fileId` | int | N | MUL |
| `vertical` | varchar(5) | N |  |
| `sc` | varchar(3) | N |  |
| `result` | varchar(10) | N |  |
| `reason` | text | Y |  |
| `numLeads` | int | N |  |

## `partner_files`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `file` | text | N |  |
| `affiliateID` | int | N | MUL |
| `count` | int | N |  |
| `createdAt` | timestamp | N |  |

## `rawDataDashboard`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `clientId` | int | Y |  |
| `oleadid` | varchar(40) | Y |  |
| `phone` | varchar(15) | Y |  |
| `email` | varchar(100) | Y |  |
| `fullName` | varchar(100) | Y |  |
| `uSet` | int | Y |  |
| `uIssue` | int | Y |  |
| `uCancel` | int | Y |  |
| `uDQ` | int | Y |  |
| `uDemo` | int | Y |  |
| `uGrossSale` | int | Y |  |
| `uNetSale` | int | Y |  |
| `uGrossAmt` | decimal(12,2) | Y |  |
| `uNetAmt` | decimal(12,2) | Y |  |
| `uRevShare` | decimal(9,2) | Y |  |

## `rawDataIndex`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientId` | int | Y | MUL |
| `tbname` | varchar(20) | Y | MUL |
| `ukey` | varchar(10) | N | MUL |
| `uSet` | varchar(300) | Y |  |
| `uIssue` | varchar(300) | Y |  |
| `uCancel` | varchar(300) | Y |  |
| `uDQ` | varchar(300) | Y |  |
| `uDemo` | varchar(300) | Y |  |
| `uGrossSale` | varchar(300) | Y |  |
| `uNetSale` | varchar(300) | Y |  |
| `uGrossAmt` | varchar(300) | Y |  |
| `uNetAmt` | varchar(300) | Y |  |
| `uRevShare` | varchar(300) | Y |  |
| `uactive` | tinyint | Y |  |

## `rawDataLoad`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `stgDate` | date | Y | MUL |
| `staging` | tinyint | Y |  |
| `loaded` | tinyint | Y | MUL |

## `record_intake`  ·  fact · ~54,408,290 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `VT` | varchar(5) | N | MUL |
| `OLeadID` | varchar(40) | N | MUL |
| `phone` | varchar(15) | N | MUL |
| `state` | varchar(2) | N |  |
| `postalCode` | varchar(5) | N |  |
| `FSCode1` | varchar(150) | N |  |
| `FSCode2` | varchar(150) | N |  |
| `FSCode3` | varchar(150) | N |  |
| `le_FSCode1` | varchar(150) | N |  |
| `insertionDate` | timestamp | N | MUL |

## `rejectedLeads`  ·  fact · ~64,868 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | MUL |
| `callCenter` | varchar(20) | Y | MUL |
| `callDispo` | varchar(40) | Y |  |
| `callDispoExtended` | varchar(80) | Y |  |
| `insertionDate` | date | Y | MUL |
| `intendedClient` | varchar(255) | Y |  |
| `sentClient` | varchar(255) | Y |  |
| `WTClient` | varchar(50) | Y | MUL |
| `sentLeads` | int | Y |  |
| `rejectedLeads` | int | Y |  |
| `rejectedPert` | decimal(6,3) | Y |  |
| `undeliveredLeads` | int | Y |  |
| `undeliveredPert` | decimal(6,3) | Y |  |
| `lastupdate` | timestamp | Y | MUL |

## `report_leads_weekly`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(100) | N | PRI |
| `phone` | varchar(15) | Y |  |
| `email` | varchar(100) | Y |  |
| `lastName` | varchar(50) | Y |  |
| `FSCode1` | varchar(150) | Y |  |
| `FSCode2` | varchar(150) | Y |  |
| `vertical` | varchar(2) | Y |  |
| `timestamp` | datetime | Y |  |

## `reservedCCListId`  ·  dimension · ~176 rows · InnoDB
PK: `callCenter`, `VT`, `listId`

| column | type | null | key |
|---|---|---|---|
| `callCenter` | varchar(5) | N | PRI |
| `VT` | varchar(5) | N | PRI |
| `listId` | int | N | PRI |
| `campaignId` | varchar(5) | Y |  |
| `fsType` | varchar(60) | Y |  |

## `reservedCampaign`  ·  dimension · ~8 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `campaignId` | varchar(5) | N |  |
| `campaign` | varchar(60) | Y |  |
| `sRU` | tinyint | Y |  |

## `reservedDashbCCDials`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `runDate` | date | N | MUL |
| `callcenter` | varchar(5) | N | MUL |
| `vt` | varchar(5) | N |  |
| `state` | varchar(5) | Y | MUL |
| `talktime` | decimal(9,2) | Y |  |
| `phonetime` | decimal(9,2) | Y |  |
| `contact` | mediumint | Y |  |
| `complete` | mediumint | Y |  |
| `sale` | mediumint | Y |  |
| `abandon` | mediumint | Y |  |
| `almostsale` | mediumint | Y |  |
| `lostsale` | mediumint | Y |  |
| `tatt` | mediumint | Y |  |
| `tsucc` | mediumint | Y |  |
| `tagree` | mediumint | Y |  |

## `reservedDashbCaz`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `runDate` | date | N | MUL |
| `clientid` | int | N | MUL |
| `zip` | varchar(5) | Y | MUL |
| `state` | varchar(5) | Y |  |
| `callable` | tinyint | Y |  |

## `reservedDashbCazCampaign`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `callcenter` | varchar(5) | Y |  |
| `vt` | varchar(5) | Y | MUL |
| `clientid` | int | Y |  |
| `zip` | varchar(5) | Y | MUL |
| `state` | varchar(5) | Y | MUL |
| `market` | varchar(20) | Y |  |
| `callable` | tinyint | Y |  |
| `Fresh` | int | Y |  |
| `Uknown` | int | Y |  |
| `Revived` | int | Y |  |
| `Reincarnate` | int | Y |  |
| `RU_Total` | int | Y |  |

## `reservedDashbCazFresh`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `callcenter` | varchar(5) | N |  |
| `vt` | varchar(5) | N |  |
| `runDate` | date | N | MUL |
| `state` | varchar(5) | Y | MUL |
| `callable_1` | int | Y |  |
| `callable_0` | int | Y |  |

## `reservedDashbCazHist`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `callcenter` | varchar(5) | Y | MUL |
| `vt` | varchar(5) | Y | MUL |
| `state` | varchar(5) | Y | MUL |
| `2023_09_24__0` | int | Y |  |
| `2023_09_24__1` | int | Y |  |
| `2023_10_01__0` | int | Y |  |
| `2023_10_01__1` | int | Y |  |
| `2023_10_08__0` | int | Y |  |
| `2023_10_08__1` | int | Y |  |

## `reservedDashbDataCCHours`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `runDate` | date | N | MUL |
| `callcenter` | varchar(5) | Y | MUL |
| `vt` | varchar(5) | Y | MUL |
| `state` | varchar(5) | Y | MUL |
| `cph` | decimal(9,2) | Y |  |
| `hours` | decimal(9,2) | Y |  |

## `reservedDashbReserve`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `runDate` | date | N | MUL |
| `callcenter` | varchar(5) | N | MUL |
| `vt` | varchar(5) | N |  |
| `state` | varchar(5) | Y | MUL |
| `optimal` | decimal(9,2) | Y |  |
| `current_inventory` | decimal(9,2) | Y |  |
| `inventory_difference` | decimal(9,2) | Y |  |
| `percentage` | decimal(9,2) | Y |  |

## `reservedDashbSource`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `callCenter` | varchar(5) | N | MUL |
| `VT` | varchar(5) | N |  |
| `runDate` | date | N | MUL |
| `zip` | varchar(5) | Y | MUL |
| `listId` | int | Y | MUL |
| `receiveDate` | date | Y |  |
| `maxAttempts` | tinyint | Y |  |
| `attempts` | tinyint | Y |  |
| `leads` | smallint | Y |  |
| `state` | varchar(5) | Y | MUL |
| `campaign` | varchar(60) | Y |  |
| `fsType` | varchar(60) | Y |  |
| `market` | varchar(20) | Y | MUL |
| `expired` | tinyint | Y |  |
| `remaining` | smallint | Y |  |
| `callable` | tinyint | Y |  |

## `reservedLeadsCCVTZips`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `zip` | varchar(15) | N |  |
| `state` | varchar(5) | N |  |
| `market` | varchar(20) | N |  |
| `county` | varchar(100) | N |  |
| `CC` | varchar(5) | N |  |
| `VT` | varchar(5) | N |  |
| `noleads` | decimal(32,0) | Y |  |

## `reservedLeadsCCZips`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `zip` | varchar(15) | N |  |
| `state` | varchar(5) | N |  |
| `market` | varchar(20) | N |  |
| `county` | varchar(100) | N |  |
| `CC` | varchar(5) | N |  |
| `noleads` | decimal(32,0) | Y |  |

## `reservedLeadsData`  ·  dimension · ~0 rows · InnoDB
PK: `zip`, `VT`, `CC`, `f1`, `f2`, `f3`, `f4`, `f5`

| column | type | null | key |
|---|---|---|---|
| `CC` | varchar(5) | N | PRI |
| `VT` | varchar(5) | N | PRI |
| `zip` | varchar(15) | N | PRI |
| `f1` | tinyint | N | PRI |
| `f2` | tinyint | N | PRI |
| `f3` | tinyint | N | PRI |
| `f4` | tinyint | N | PRI |
| `f5` | tinyint | N | PRI |
| `noleads` | int | Y |  |

## `reservedLeadsData_KB`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `VT` | varchar(5) | Y | MUL |
| `zip` | varchar(15) | Y | MUL |
| `listid` | int | N | MUL |
| `receiveDate` | date | N | MUL |
| `maxAttemts` | tinyint | Y |  |
| `attempts` | tinyint | Y |  |
| `filter_value` | varchar(30) | Y |  |
| `f1` | tinyint | Y |  |
| `f2` | tinyint | Y |  |
| `f3` | tinyint | Y |  |
| `f4` | tinyint | Y |  |
| `f5` | tinyint | Y |  |
| `insertionDate` | timestamp | N | MUL |

## `reservedLeadsData_TD`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `VT` | varchar(5) | Y | MUL |
| `zip` | varchar(15) | Y | MUL |
| `listid` | int | N | MUL |
| `receiveDate` | date | N | MUL |
| `maxAttemts` | tinyint | Y |  |
| `attempts` | tinyint | Y |  |
| `filter_value` | varchar(30) | Y |  |
| `f1` | tinyint | Y |  |
| `f2` | tinyint | Y |  |
| `f3` | tinyint | Y |  |
| `f4` | tinyint | Y |  |
| `f5` | tinyint | Y |  |
| `insertionDate` | timestamp | N | MUL |
| `leadage` | int | Y | MUL |

## `reservedLeadsVT`  ·  dimension · ~3 rows · InnoDB
PK: `callCenter`, `listid`, `VT`

| column | type | null | key |
|---|---|---|---|
| `callCenter` | varchar(5) | N | PRI |
| `listid` | int | N | PRI |
| `VT` | varchar(5) | N | PRI |

## `reservedLeadsZipCodes`  ·  dimension · ~1,193 rows · InnoDB
PK: `zip`, `VT`, `f1`, `f2`, `f3`, `f4`, `f5`

| column | type | null | key |
|---|---|---|---|
| `zip` | varchar(15) | N | PRI |
| `VT` | varchar(5) | N | PRI |
| `f1` | tinyint | N | PRI |
| `f2` | tinyint | N | PRI |
| `f3` | tinyint | N | PRI |
| `f4` | tinyint | N | PRI |
| `f5` | tinyint | N | PRI |
| `nozips` | int | N |  |

## `reservedLeadsZips`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `zip` | varchar(15) | N |  |
| `state` | varchar(5) | N |  |
| `market` | varchar(20) | N |  |
| `county` | varchar(100) | N |  |
| `VT` | varchar(5) | N |  |
| `noleads` | decimal(32,0) | Y |  |

## `return_leads_summary`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `OLeadID` | varchar(30) | N |  |
| `phone` | varchar(15) | N |  |
| `state` | varchar(2) | N |  |
| `rejectionReason` | text | Y |  |
| `client` | varchar(255) | Y |  |
| `Approved` | varchar(20) | N |  |
| `datecaptured` | date | Y |  |

## `revShareClientPrices`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `clientId` | int | N |  |
| `state` | varchar(2) | Y |  |
| `area` | varchar(20) | Y |  |
| `callDispo` | varchar(50) | Y |  |
| `callDispoExtended` | varchar(80) | Y |  |
| `leadPrice` | decimal(6,2) | N |  |
| `scrub` | decimal(6,3) | Y |  |
| `startDate` | date | N |  |
| `endDate` | date | Y |  |
| `revName` | varchar(10) | N |  |
| `priority` | int | Y |  |

## `rintake`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
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

## `sptemp_reserves`  ·  fact · ~496,692 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(40) | N |  |
| `zip` | varchar(15) | Y |  |
| `listid` | int | N | MUL |
| `receiveDate` | varchar(30) | N |  |
| `maxAttemts` | tinyint | Y |  |
| `attempts` | tinyint | Y |  |
| `filter_value` | varchar(30) | Y |  |

## `sptempload_CC_DailyDashboard`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `CC` | varchar(5) | N | MUL |
| `VT` | varchar(5) | N | MUL |
| `Campaign` | varchar(60) | Y |  |
| `List` | varchar(10) | Y |  |
| `FSCode1` | varchar(150) | Y |  |
| `state` | varchar(5) | Y |  |
| `area` | varchar(20) | Y |  |
| `dial_date` | date | N | MUL |
| `dhours` | decimal(10,4) | Y |  |
| `phonetime` | decimal(10,4) | Y |  |
| `dial` | int | Y |  |
| `sale` | int | Y |  |
| `contact` | int | Y |  |
| `complete` | int | Y |  |
| `lapsed` | int | Y |  |
| `abandon` | int | Y |  |
| `almostsale` | int | Y |  |
| `lostsale` | int | Y |  |
| `tatt` | int | Y |  |
| `tagree` | int | Y |  |
| `tsucc` | int | Y |  |

## `sptempload_CC_WeeklyDashboard`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `CC` | varchar(5) | N | MUL |
| `VT` | varchar(5) | N | MUL |
| `ReceivedDate` | date | Y | MUL |
| `List` | varchar(10) | Y |  |
| `FSCode1` | varchar(150) | Y | MUL |
| `state` | varchar(5) | Y |  |
| `market` | varchar(20) | Y |  |
| `Attempts` | int | Y |  |
| `dials` | int | Y |  |
| `received` | int | Y |  |
| `Contact` | int | Y |  |
| `Complete` | int | Y |  |
| `Lapsed` | int | Y |  |
| `Sale` | int | Y |  |
| `Abandon` | int | Y |  |
| `AlmostSale` | int | Y |  |
| `LostSale` | int | Y |  |
| `tAtt` | int | Y |  |
| `tSucc` | int | Y |  |
| `TAgree` | int | Y |  |

## `sptmp_CC_DailyDashboard`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `CC` | varchar(5) | N | MUL |
| `VT` | varchar(5) | N | MUL |
| `Campaign` | varchar(60) | Y |  |
| `List` | varchar(10) | Y |  |
| `FSCode1` | varchar(150) | Y |  |
| `state` | varchar(5) | Y |  |
| `area` | varchar(20) | Y |  |
| `dial_date` | date | N |  |
| `dhours` | decimal(10,4) | Y |  |
| `phonetime` | decimal(10,4) | Y |  |
| `dial` | int | Y |  |
| `sale` | int | Y |  |
| `contact` | int | Y |  |
| `complete` | int | Y |  |
| `lapsed` | int | Y |  |
| `abandon` | int | Y |  |
| `almostsale` | int | Y |  |
| `lostsale` | int | Y |  |
| `tatt` | int | Y |  |
| `tagree` | int | Y |  |
| `tsucc` | int | Y |  |

## `sptmp_CC_WeeklyDashboard`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `CC` | varchar(5) | N | MUL |
| `VT` | varchar(5) | N |  |
| `ReceivedDate` | date | Y |  |
| `List` | varchar(10) | Y |  |
| `FSCode1` | varchar(150) | Y |  |
| `state` | varchar(5) | Y |  |
| `market` | varchar(20) | Y |  |
| `Attempts` | int | Y |  |
| `dials` | int | Y |  |
| `received` | int | Y |  |
| `Contact` | int | Y |  |
| `Complete` | int | Y |  |
| `Lapsed` | int | Y |  |
| `Sale` | int | Y |  |
| `Abandon` | int | Y |  |
| `AlmostSale` | int | Y |  |
| `LostSale` | int | Y |  |
| `tAtt` | int | Y |  |
| `tSucc` | int | Y |  |
| `TAgree` | int | Y |  |

## `sptmp_fiveNineCallLog_STG`  ·  dimension · ~22 rows · InnoDB
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
| `timeInterval` | smallint | Y |  |

## `sptmp_td_dates`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `dialdate` | date | Y | MUL |

## `td_vicidial_setup`  ·  dimension · ~0 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | bigint unsigned | N | PRI |
| `vertical` | varchar(2) | N | MUL |
| `campaign` | varchar(20) | Y |  |
| `connection` | varchar(255) | N |  |
| `last_request` | date | Y |  |
| `priority` | int unsigned | N |  |
| `disabled_at` | datetime | Y | MUL |
| `updated_at` | timestamp | N |  |

## `unique_FSCode1`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ukey` | varchar(5) | Y |  |
| `uvalue` | varchar(20) | Y |  |

## `unique_FSCodes`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ukey` | varchar(5) | Y |  |
| `uvalueA` | varchar(20) | Y |  |
| `uvalueB` | varchar(20) | Y |  |

## `vicidial_callData`  ·  fact · ~317,106 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `lead_id` | int | Y | MUL |
| `entry_date` | timestamp | Y | MUL |
| `modify_date` | timestamp | Y |  |
| `status` | varchar(10) | Y |  |
| `user` | varchar(15) | Y |  |
| `vendor_lead_code` | varchar(30) | Y |  |
| `source_id` | varchar(15) | Y |  |
| `list_id` | int | Y | MUL |
| `gmt_offset_now` | smallint | Y |  |
| `called_since_last_reset` | varchar(10) | Y |  |
| `phone_code` | varchar(15) | Y |  |
| `phone` | varchar(15) | Y | MUL |
| `title` | varchar(10) | Y |  |
| `first_name` | varchar(100) | Y |  |
| `middle_initial` | varchar(10) | Y |  |
| `last_name` | varchar(100) | Y |  |
| `address1` | varchar(100) | Y |  |
| `address2` | varchar(100) | Y |  |
| `address3` | varchar(100) | Y |  |
| `city` | varchar(30) | Y |  |
| `state` | varchar(2) | Y | MUL |
| `province` | varchar(30) | Y |  |
| `zip` | varchar(15) | Y | MUL |
| `country_code` | varchar(10) | Y |  |
| `gender` | varchar(5) | Y |  |
| `dob` | varchar(15) | Y |  |
| `alt_phone` | varchar(15) | Y |  |
| `email` | varchar(150) | Y |  |
| `security_phase` | varchar(15) | Y |  |
| `filter` | varchar(20) | Y |  |
| `called_count` | smallint | Y |  |
| `last_local_call_time` | varchar(20) | Y |  |
| `rank` | tinyint | Y |  |
| `owner` | varchar(5) | Y |  |
| `entry_list_id` | int | Y |  |
| `ipAddress` | varchar(150) | Y |  |
| `timestampAffiliate` | timestamp | Y |  |
| `FSCode1` | varchar(150) | Y |  |
| `FSCode2` | varchar(150) | Y |  |
| `FSCode3` | varchar(150) | Y |  |
| `callDispo` | varchar(80) | Y |  |
| `batchId` | varchar(30) | Y | MUL |
| `RU` | varchar(5) | Y | MUL |
| `market` | varchar(30) | Y |  |
| `OLeadId` | varchar(50) | Y | MUL |
| `ventry_date` | varchar(30) | Y |  |
| `vmodify_date` | varchar(30) | Y |  |
| `vtimestampAffiliate` | varchar(30) | Y |  |
| `cc` | varchar(5) | Y |  |

## `zztmp_leadReference_record_intake`  ·  dimension · ~10,364 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(40) | Y | MUL |
| `insertionDate` | timestamp | Y |  |

## `zztmp_record_intake`  ·  dimension · ~21 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `VT` | varchar(5) | N | MUL |
| `OLeadID` | varchar(40) | N | MUL |
| `phone` | varchar(15) | N | MUL |
| `state` | varchar(2) | N |  |
| `postalCode` | varchar(5) | N |  |
| `FSCode1` | varchar(150) | N |  |
| `FSCode2` | varchar(150) | N |  |
| `FSCode3` | varchar(150) | N |  |
| `le_FSCode1` | varchar(150) | N |  |
| `insertionDate` | timestamp | N |  |
