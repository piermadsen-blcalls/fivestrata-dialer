# Schema `techss_all_leads`

THE LEAD CORE. Raw and revived lead records, validation, LeadConduit/TrustedForm/Jornaya tokens, DNC, affiliate, call-center, and transfer data. Largest and most PII-sensitive schema (~1.9B rows).

**130 tables** — dimension: 48, fact: 56, view: 26

## `CTD_Suppression_List`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `phone` | varchar(20) | N |  |

## `CTD_Suppression_List_dummy`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `phone` | int | N |  |

## `FreshSL`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(100) | N |  |
| `DateReceived` | varchar(50) | Y |  |
| `ZipCode` | varchar(5) | Y |  |

## `HWSuppressionList`  ·  fact · ~471,195 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `phone` | bigint | N | MUL |
| `type` | varchar(10) | N | MUL |
| `insertionDate` | timestamp | N | MUL |

## `OLD_prismReserve`  ·  dimension · ~23,625 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | Y | MUL |
| `Zip` | varchar(5) | Y | MUL |
| `VT` | varchar(5) | Y |  |
| `ClientId` | int | Y | MUL |
| `callDispo` | varchar(40) | Y |  |
| `callDispoExtended` | varchar(80) | Y |  |
| `RA` | varchar(5) | Y | MUL |
| `PastProcessId` | int | Y |  |
| `insertionDate` | timestamp | Y | MUL |
| `Sent` | datetime | Y |  |

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

## `ReusedSL`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(100) | N |  |
| `DateRevived` | date | Y |  |
| `ReuseOccurrence` | varchar(40) | N |  |
| `CallCenter` | varchar(40) | N |  |
| `ReuseType` | varchar(5) | N |  |
| `ReuseVertical` | varchar(2) | N |  |
| `batchId` | varchar(40) | N |  |

## `Test-View`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `OLeadID` | varchar(40) | N |  |

## `active_leads`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `OLeadID` | varchar(40) | N |  |
| `firstName` | varchar(50) | N |  |
| `lastName` | varchar(50) | N |  |
| `email` | varchar(100) | N |  |
| `phone` | varchar(15) | N |  |
| `address` | varchar(100) | N |  |
| `city` | varchar(50) | N |  |
| `state` | varchar(2) | N |  |
| `postalCode` | varchar(5) | N |  |
| `dob` | varchar(20) | Y |  |
| `ipAddress` | varchar(45) | N |  |
| `homeowner` | varchar(3) | Y |  |
| `creditScore` | varchar(10) | Y |  |
| `insertionDate` | timestamp | N |  |
| `FSCode3` | varchar(150) | Y |  |
| `vertical` | varchar(20) | Y |  |
| `leadType` | varchar(10) | Y |  |
| `multiplied` | varchar(5) | Y |  |
| `clientId` | int | Y |  |
| `client` | varchar(255) | Y |  |
| `market` | varchar(50) | Y |  |
| `clientLeadId` | varchar(20) | Y |  |
| `pingVal` | float | Y |  |
| `leadConduitId` | varchar(50) | Y |  |
| `captureDate` | varchar(80) | Y |  |

## `affiliateData`  ·  fact · ~58,725,388 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `source` | mediumtext | Y |  |
| `timestampAffiliate` | varchar(50) | Y |  |
| `timestampAffiliateDate` | date | Y |  |
| `affiliateLeadId` | varchar(40) | Y | MUL |
| `VTO` | varchar(20) | Y | MUL |
| `VT` | varchar(20) | Y | MUL |
| `PD` | varchar(20) | Y |  |
| `CH` | varchar(20) | Y |  |
| `SC` | varchar(20) | Y | MUL |
| `CP` | varchar(20) | Y |  |
| `SS` | varchar(20) | Y |  |
| `SA` | varchar(20) | Y |  |
| `C0` | varchar(20) | Y |  |
| `FSCode1` | varchar(150) | Y | MUL |
| `FSCode2` | varchar(150) | Y |  |
| `accepted` | varchar(5) | Y | MUL |
| `rejectedReason` | varchar(255) | Y |  |
| `insertionDate` | timestamp | N | MUL |

## `affiliateDataLeadDemand`  ·  fact · ~118,817 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `source` | mediumtext | Y |  |
| `timestampAffiliate` | varchar(50) | Y |  |
| `timestampAffiliateDate` | date | Y |  |
| `affiliateLeadId` | varchar(40) | Y | MUL |
| `VTO` | varchar(20) | Y | MUL |
| `VT` | varchar(20) | Y | MUL |
| `PD` | varchar(20) | Y |  |
| `CH` | varchar(20) | Y |  |
| `SC` | varchar(20) | Y | MUL |
| `CP` | varchar(20) | Y |  |
| `SS` | varchar(20) | Y |  |
| `SA` | varchar(20) | Y |  |
| `C0` | varchar(20) | Y |  |
| `FSCode1` | varchar(150) | Y | MUL |
| `FSCode2` | varchar(150) | Y |  |
| `accepted` | varchar(5) | Y | MUL |
| `rejectedReason` | varchar(255) | Y |  |
| `insertionDate` | timestamp | N | MUL |

## `affiliateData_DupBK`  ·  fact · ~451,693 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | N | MUL |
| `source` | mediumtext | Y |  |
| `timestampAffiliate` | varchar(50) | Y |  |
| `FSCode1` | varchar(150) | Y | MUL |
| `FSCode2` | varchar(150) | Y |  |
| `accepted` | varchar(5) | Y | MUL |
| `rejectedReason` | varchar(255) | Y |  |
| `insertionDate` | timestamp | N | MUL |

## `affiliateData_DupIDs`  ·  fact · ~986,345 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | N | MUL |
| `isDone` | int | N | MUL |

## `affiliateData_arc`  ·  fact · ~16,015,500 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `source` | mediumtext | Y |  |
| `timestampAffiliate` | varchar(50) | Y |  |
| `timestampAffiliateDate` | date | Y |  |
| `affiliateLeadId` | varchar(40) | Y | MUL |
| `VTO` | varchar(20) | Y | MUL |
| `VT` | varchar(20) | Y | MUL |
| `PD` | varchar(20) | Y |  |
| `CH` | varchar(20) | Y |  |
| `SC` | varchar(20) | Y | MUL |
| `CP` | varchar(20) | Y |  |
| `SS` | varchar(20) | Y |  |
| `SA` | varchar(20) | Y |  |
| `C0` | varchar(20) | Y |  |
| `FSCode1` | varchar(150) | Y | MUL |
| `FSCode2` | varchar(150) | Y |  |
| `accepted` | varchar(5) | Y | MUL |
| `rejectedReason` | varchar(255) | Y |  |
| `insertionDate` | timestamp | N | MUL |

## `affiliateData_structure`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | N | MUL |
| `source` | mediumtext | Y |  |
| `timestampAffiliate` | varchar(50) | Y |  |
| `FSCode1` | varchar(150) | Y | MUL |
| `FSCode2` | varchar(150) | Y |  |
| `accepted` | varchar(5) | Y | MUL |
| `rejectedReason` | varchar(255) | Y |  |
| `insertionDate` | timestamp | N | MUL |

## `affiliateData_toDelete`  ·  fact · ~80,278 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `source` | mediumtext | Y |  |
| `timestampAffiliate` | varchar(50) | Y |  |
| `timestampAffiliateDate` | date | Y |  |
| `VT` | varchar(20) | Y | MUL |
| `PD` | varchar(20) | Y |  |
| `CH` | varchar(20) | Y |  |
| `SC` | varchar(20) | Y | MUL |
| `CP` | varchar(20) | Y |  |
| `SS` | varchar(20) | Y |  |
| `SA` | varchar(20) | Y |  |
| `FSCode1` | varchar(150) | Y | MUL |
| `FSCode2` | varchar(150) | Y |  |
| `accepted` | varchar(5) | Y | MUL |
| `rejectedReason` | varchar(255) | Y |  |
| `insertionDate` | timestamp | N | MUL |

## `appData`  ·  dimension · ~11,914 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `VT` | varchar(5) | N | MUL |
| `clientid` | int | Y |  |
| `client` | varchar(30) | Y |  |
| `appTime` | timestamp | N |  |
| `data` | json | Y |  |
| `hashedData` | char(32) | Y | MUL |
| `insertionDate` | timestamp | N |  |

## `callCenterData`  ·  fact · ~37,364,553 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | N | MUL |
| `timestampCallCenter` | varchar(50) | Y |  |
| `CDLeadId` | varchar(20) | Y |  |
| `callCenter` | varchar(20) | Y | MUL |
| `repId` | varchar(40) | Y |  |
| `consent` | varchar(3) | Y |  |
| `callDispo` | varchar(40) | Y | MUL |
| `callDispoExtended` | varchar(80) | Y |  |
| `WTClient` | varchar(50) | Y |  |
| `brandId` | int | Y |  |
| `BT` | varchar(100) | Y | MUL |
| `insertionDate` | timestamp | N | MUL |

## `callCenterDataPseudo`  ·  dimension · ~11,995 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | N | MUL |
| `timestampCallCenter` | varchar(50) | Y |  |
| `CDLeadId` | varchar(20) | Y |  |
| `callCenter` | varchar(20) | Y | MUL |
| `repId` | varchar(40) | Y |  |
| `consent` | varchar(3) | Y |  |
| `callDispo` | varchar(40) | Y | MUL |
| `callDispoExtended` | varchar(40) | Y |  |
| `WTClient` | varchar(50) | Y |  |
| `brandId` | int | Y |  |
| `insertionDate` | timestamp | N | MUL |

## `callCenterData_arc`  ·  fact · ~13,233,416 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `timestampCallCenter` | varchar(50) | Y |  |
| `CDLeadId` | varchar(20) | Y |  |
| `callCenter` | varchar(20) | Y | MUL |
| `repId` | varchar(40) | Y |  |
| `consent` | varchar(3) | Y |  |
| `callDispo` | varchar(40) | Y | MUL |
| `callDispoExtended` | varchar(80) | Y |  |
| `WTClient` | varchar(50) | Y |  |
| `brandId` | int | Y |  |
| `BT` | varchar(100) | Y | MUL |
| `insertionDate` | timestamp | N | MUL |

## `callCenterData_dup_ID`  ·  dimension · ~518 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |

## `callCenterData_preserved`  ·  dimension · ~11 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | N | MUL |
| `timestampCallCenter` | varchar(50) | Y |  |
| `CDLeadId` | varchar(20) | Y |  |
| `callCenter` | varchar(20) | Y | MUL |
| `repId` | varchar(40) | Y |  |
| `consent` | varchar(3) | Y |  |
| `callDispo` | varchar(40) | Y | MUL |
| `callDispoExtended` | varchar(80) | Y |  |
| `WTClient` | varchar(50) | Y |  |
| `brandId` | int | Y |  |
| `BT` | varchar(100) | Y | MUL |
| `insertionDate` | timestamp | N | MUL |

## `callcenter_branding_audit`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `Date` | date | Y |  |
| `firstName` | varchar(50) | N |  |
| `phone` | varchar(15) | N |  |
| `state` | varchar(2) | N |  |
| `postalCode` | varchar(5) | N |  |
| `homeowner` | varchar(3) | Y |  |
| `currentProvider` | varchar(150) | Y |  |
| `currentProviderOther` | varchar(150) | Y |  |
| `electricBill` | varchar(20) | Y |  |
| `creditScore` | varchar(10) | Y |  |
| `repId` | varchar(40) | Y |  |
| `callDispo` | varchar(40) | Y |  |
| `callDispoExtended` | varchar(80) | Y |  |
| `FSCode3` | varchar(150) | Y |  |
| `WTClient` | varchar(50) | N |  |
| `consent` | varchar(3) | Y |  |
| `APIBrandId` | int | N |  |
| `callCenter` | varchar(20) | Y |  |

## `callcenter_branding_audit_mismatch`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `Date` | date | Y |  |
| `firstName` | varchar(50) | N |  |
| `phone` | varchar(15) | N |  |
| `state` | varchar(2) | N |  |
| `postalCode` | varchar(5) | N |  |
| `homeowner` | varchar(3) | Y |  |
| `currentProvider` | varchar(150) | Y |  |
| `currentProviderOther` | varchar(150) | Y |  |
| `electricBill` | varchar(20) | Y |  |
| `creditScore` | varchar(10) | Y |  |
| `repId` | varchar(40) | Y |  |
| `callDispo` | varchar(40) | Y |  |
| `callDispoExtended` | varchar(80) | Y |  |
| `FSCode3` | varchar(150) | Y |  |
| `WTClient` | varchar(50) | N |  |
| `consent` | varchar(3) | Y |  |
| `brandId` | int | Y |  |
| `APIBrandId` | int | N |  |
| `OLeadID` | varchar(100) | N |  |
| `callCenter` | varchar(20) | Y |  |

## `clientPortalData`  ·  fact · ~213,381 rows · InnoDB
PK: `ID`, `clientid`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `state` | varchar(5) | Y |  |
| `market` | varchar(20) | Y |  |
| `area` | varchar(20) | Y |  |
| `monthnum` | tinyint | Y | MUL |
| `yearnum` | int | Y | MUL |
| `weeknum` | tinyint | Y |  |
| `doweek` | date | Y | MUL |
| `calldispoextended` | varchar(80) | Y | MUL |
| `billable` | tinyint | Y | MUL |
| `clientid` | int | N | PRI |
| `submitted` | int | Y |  |
| `accepted` | int | Y |  |
| `transfers` | int | Y |  |
| `leadprice` | decimal(6,2) | Y |  |

## `clientPortalDataLeads`  ·  fact · ~1,059,248 rows · InnoDB
PK: `ID`, `clientid`, `OLeadID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `state` | varchar(5) | Y |  |
| `market` | varchar(20) | Y |  |
| `area` | varchar(20) | Y |  |
| `monthnum` | tinyint | Y | MUL |
| `yearnum` | int | Y | MUL |
| `weeknum` | tinyint | Y |  |
| `doweek` | date | Y | MUL |
| `calldispo` | varchar(40) | Y |  |
| `calldispoextended` | varchar(80) | Y | MUL |
| `clientid` | int | N | PRI |
| `OLeadID` | varchar(40) | N | PRI |
| `sumryType` | char(1) | Y | MUL |
| `billable` | tinyint | Y |  |
| `leadprice` | decimal(6,2) | Y |  |
| `exclude` | tinyint | Y |  |

## `clientPortalDataStg`  ·  fact · ~256,980 rows · InnoDB
PK: `ID`, `clientid`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `state` | varchar(5) | Y |  |
| `market` | varchar(20) | Y |  |
| `area` | varchar(20) | Y |  |
| `monthnum` | tinyint | Y | MUL |
| `yearnum` | int | Y | MUL |
| `weeknum` | tinyint | Y |  |
| `doweek` | date | Y | MUL |
| `calldispo` | varchar(40) | Y |  |
| `calldispoextended` | varchar(80) | Y | MUL |
| `billable` | tinyint | Y | MUL |
| `clientid` | int | N | PRI |
| `submitted` | int | Y |  |
| `accepted` | int | Y |  |
| `transfers` | int | Y |  |
| `leadprice` | decimal(6,2) | Y |  |

## `clientRejectionData`  ·  dimension · ~31,093 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `phone` | varchar(15) | N | MUL |
| `clientId` | int | Y |  |
| `clientName` | varchar(30) | Y | MUL |
| `RejectionReason` | varchar(100) | Y | MUL |
| `leadConduitEventID` | varchar(50) | N |  |
| `insertionDate` | timestamp | N | MUL |

## `dailyLeadSummaryByOLeadID`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(40) | Y |  |
| `phone` | varchar(15) | Y |  |
| `state` | varchar(2) | Y |  |
| `postalCode` | varchar(5) | Y |  |
| `client` | varchar(255) | Y |  |
| `leadType` | varchar(10) | Y |  |
| `captureDate` | varchar(80) | Y |  |
| `market` | varchar(50) | Y |  |
| `dispo` | varchar(121) | Y |  |
| `CC` | varchar(20) | Y |  |
| `vt` | varchar(20) | Y |  |
| `datecaptured` | date | Y |  |

## `dailyLeadSummaryByStateMarket`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `Client` | varchar(255) | Y |  |
| `State` | varchar(2) | N |  |
| `Market` | varchar(50) | Y |  |
| `Count` | bigint | N |  |
| `vt` | varchar(20) | Y |  |

## `debtReliefData`  ·  dimension · ~47,574 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | N | MUL |
| `debtAmount` | int | N |  |
| `creditCardDebt` | int | N |  |
| `medicalDebt` | int | N |  |
| `studentDebt` | int | N |  |
| `loanDebt` | int | N |  |
| `makingPayments` | varchar(3) | N |  |
| `hasIncome` | varchar(3) | N |  |
| `insertionDate` | timestamp | N |  |

## `dncDate`  ·  fact · ~255,571,207 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | int | N | PRI |
| `phone` | varchar(15) | N | UNI |
| `lastUpdate` | date | N | MUL |
| `action` | varchar(1) | N |  |

## `dncDateUpdate`  ·  dimension · ~5 rows · InnoDB
PK: `dncDate_year`

| column | type | null | key |
|---|---|---|---|
| `dncDate_year` | smallint | N | PRI |
| `dncDate_count` | int | Y |  |
| `is_pending` | tinyint | Y |  |
| `is_running` | tinyint | Y |  |
| `lastId` | int | Y |  |
| `startTs` | timestamp | Y |  |
| `endTs` | timestamp | Y |  |

## `dncDateUpdateError`  ·  dimension · ~2 rows · InnoDB
PK: `created_at`

| column | type | null | key |
|---|---|---|---|
| `created_at` | timestamp | N | PRI |
| `log` | mediumtext | Y |  |

## `dncEmailList`  ·  dimension · ~324 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `email` | varchar(100) | N | MUL |
| `type` | varchar(10) | N | MUL |
| `source` | varchar(30) | Y | MUL |
| `insertionDate` | timestamp | N | MUL |

## `dncList`  ·  fact · ~10,571,706 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `phone` | bigint | N | UNI |
| `type` | varchar(10) | N | MUL |
| `source` | varchar(30) | Y | MUL |
| `insertionDate` | timestamp | N | MUL |

## `dncListNew`  ·  fact · ~3,557,654 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `phone` | bigint | N | UNI |
| `type` | varchar(10) | N | MUL |
| `insertionDate` | timestamp | N | MUL |

## `dncList_leadData`  ·  dimension · ~0 rows · InnoDB
PK: `OLeadID`, `dncdate`

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(40) | N | PRI |
| `firstName` | varchar(50) | N |  |
| `lastName` | varchar(50) | N |  |
| `email` | varchar(100) | N |  |
| `phone` | varchar(15) | N | MUL |
| `address` | varchar(100) | N |  |
| `city` | varchar(50) | N |  |
| `state` | varchar(2) | N |  |
| `postalCode` | varchar(5) | N |  |
| `dob` | varchar(20) | Y |  |
| `ipAddress` | varchar(45) | N |  |
| `homeowner` | varchar(3) | Y |  |
| `creditScore` | varchar(10) | Y |  |
| `insertionDate` | timestamp | N |  |
| `dncdate` | date | N | PRI |

## `dncList_leadData_audit`  ·  fact · ~2,098,266 rows · InnoDB
PK: `OLeadID`, `dncdate`

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(40) | N | PRI |
| `firstName` | varchar(50) | N |  |
| `lastName` | varchar(50) | N |  |
| `email` | varchar(100) | N |  |
| `phone` | varchar(15) | N | MUL |
| `address` | varchar(100) | N |  |
| `city` | varchar(50) | N |  |
| `state` | varchar(2) | N |  |
| `postalCode` | varchar(5) | N |  |
| `dob` | varchar(20) | Y |  |
| `ipAddress` | varchar(45) | N |  |
| `homeowner` | varchar(3) | Y |  |
| `creditScore` | varchar(10) | Y |  |
| `insertionDate` | timestamp | N |  |
| `dncdate` | date | N | PRI |

## `dncList_reOptin`  ·  fact · ~417,490 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `phone` | bigint | N | MUL |
| `type` | varchar(10) | N | MUL |
| `insertionDate` | timestamp | N | MUL |
| `unDncDate` | timestamp | N | MUL |

## `dp_revivedLeadsBatches`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `OLeadID` | varchar(100) | N |  |
| `batchId` | varchar(40) | N |  |
| `RU` | varchar(10) | N |  |
| `notes` | varchar(255) | N |  |
| `reviveDate` | datetime | Y |  |
| `revivedDate` | datetime | Y |  |

## `dp_solarData`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `OLeadID` | varchar(100) | N |  |
| `currentProvider` | varchar(150) | Y |  |
| `currentProviderOther` | varchar(150) | Y |  |
| `electricBill` | varchar(15) | Y |  |
| `roofShade` | varchar(50) | Y |  |
| `roofType` | varchar(100) | Y |  |
| `originalCurrentProvider` | varchar(50) | Y |  |
| `originalElectricBill` | varchar(20) | Y |  |
| `insertionDate` | timestamp | N |  |
| `shade` | varchar(50) | Y |  |
| `title` | varchar(3) | Y |  |
| `alternateContact` | varchar(50) | Y |  |
| `averageElectricBill` | int | Y |  |
| `utilityProvider` | varchar(50) | Y |  |
| `creditScore` | varchar(20) | Y |  |
| `bankruptcies` | varchar(20) | Y |  |
| `client` | varchar(20) | Y |  |
| `clientId` | varchar(20) | Y |  |
| `appointmentTime` | timestamp | Y |  |
| `appointmentType` | varchar(20) | Y |  |
| `notes` | varchar(255) | Y |  |

## `dp_validationData_arc`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `OLeadID` | varchar(40) | N |  |
| `source` | varchar(2) | Y |  |
| `leadIdToken` | varchar(50) | Y |  |
| `leadIdClaimed` | tinyint | Y |  |
| `trustedFormURL` | varchar(255) | Y |  |
| `trustedFormClaimed` | tinyint | Y |  |
| `insertionDate` | timestamp | Y |  |

## `es_leads`  ·  dimension · ~630 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | Y | MUL |
| `first_name` | varchar(50) | Y |  |
| `last_name` | varchar(50) | Y |  |
| `email` | varchar(100) | Y |  |
| `phone` | varchar(15) | Y | MUL |
| `phoneInbound` | varchar(20) | N | MUL |
| `address` | varchar(100) | Y |  |
| `city` | varchar(50) | Y |  |
| `state` | varchar(2) | Y |  |
| `zip_code` | varchar(10) | Y |  |
| `homeowner` | varchar(3) | Y |  |
| `timestampInbound` | varchar(50) | Y |  |
| `campaign` | varchar(100) | Y |  |
| `callDate` | date | Y |  |
| `callDuration` | int | Y |  |
| `callStatus` | varchar(50) | Y |  |
| `callSource` | varchar(50) | Y |  |
| `ctmId` | varchar(50) | Y |  |
| `callSourceSId` | varchar(255) | Y |  |
| `callRecording` | varchar(255) | Y |  |
| `FSCode1` | varchar(150) | Y |  |
| `FSCode2` | varchar(255) | Y |  |
| `FSCode3` | varchar(255) | Y |  |
| `status` | varchar(40) | Y |  |
| `statusReason` | varchar(255) | Y |  |
| `leadType` | varchar(10) | Y |  |
| `trackingNumber` | varchar(255) | Y |  |
| `rep_ID` | varchar(255) | Y |  |
| `WTClient` | varchar(50) | Y |  |
| `client` | varchar(30) | Y |  |
| `clientLeadId` | varchar(20) | Y |  |
| `lossType` | varchar(255) | Y |  |
| `otherLossType` | varchar(255) | Y |  |
| `lossSourceLocation` | varchar(255) | Y |  |
| `lossSource` | varchar(255) | Y |  |
| `otherLossSource` | varchar(255) | Y |  |
| `lossDamageLocation` | varchar(255) | Y |  |
| `lossSqFootage` | varchar(255) | Y |  |
| `lossLevels` | varchar(255) | Y |  |
| `lossRooms` | varchar(255) | Y |  |
| `homeAge` | varchar(255) | Y |  |
| `notes` | varchar(255) | Y |  |
| `specialInstructions` | varchar(255) | Y |  |
| `lossDate` | varchar(255) | Y |  |
| `accessInstructions` | varchar(255) | Y |  |
| `verifyFirst` | varchar(255) | Y |  |
| `sourceStopped` | varchar(255) | Y |  |
| `waterDepth` | varchar(255) | Y |  |
| `floorType` | varchar(255) | Y |  |
| `category` | varchar(255) | Y |  |
| `visibleMold` | varchar(255) | Y |  |
| `surfacesAffected` | varchar(255) | Y |  |
| `fireSourceNear` | varchar(255) | Y |  |
| `liveElectricity` | varchar(255) | Y |  |
| `fireDepartmentDispatched` | varchar(255) | Y |  |
| `rodentType` | varchar(255) | Y |  |
| `rodentLocation` | varchar(255) | Y |  |
| `otherRodentLocation` | varchar(255) | Y |  |
| `rodentsExterminated` | varchar(255) | Y |  |
| `rodentDamage` | varchar(255) | Y |  |
| `leadId0` | varchar(12) | N |  |
| `leadStatus0` | varchar(15) | N |  |
| `leadStatusDetail0` | varchar(100) | Y |  |
| `captureDateAndTime0` | varchar(80) | N |  |

## `excludedDispos`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(100) | N |  |
| `insertionDate` | timestamp | N |  |

## `feedbackData`  ·  dimension · ~60 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int unsigned | N | PRI |
| `OLeadID` | varchar(30) | N |  |
| `phone` | varchar(15) | N |  |
| `callCenter` | varchar(100) | Y |  |
| `Client` | varchar(100) | Y |  |
| `issue` | varchar(100) | N |  |
| `otherIssue` | text | N |  |
| `notes` | text | N |  |
| `insertionDate` | timestamp | N |  |

## `five9List`  ·  fact · ~137,733 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `vt` | varchar(5) | Y | MUL |
| `phone` | varchar(15) | N | MUL |
| `lastDispo` | varchar(100) | Y |  |
| `lastDispoDateTime` | datetime | Y |  |
| `system_attempts` | int | Y |  |
| `oleadid` | varchar(40) | Y | MUL |
| `createDateTime` | timestamp | N | MUL |
| `nonCallable` | tinyint unsigned | Y |  |
| `RA` | varchar(5) | Y |  |
| `FSKey` | varchar(50) | Y | UNI |
| `procId` | int | Y |  |
| `modId` | varchar(50) | Y | MUL |
| `seqNo` | smallint | Y |  |
| `priority` | smallint | Y |  |
| `clientId` | int | Y | MUL |
| `isDNC` | tinyint | N |  |

## `fsdb_events_log`  ·  dimension · ~821 rows · InnoDB
PK: `eventName`, `eventStart`

| column | type | null | key |
|---|---|---|---|
| `eventName` | varchar(150) | N | PRI |
| `eventStart` | timestamp | N | PRI |
| `eventEnd` | timestamp | Y | MUL |
| `userId` | varchar(100) | Y |  |
| `params` | varchar(40) | Y |  |

## `hashData`  ·  fact · ~35,125,188 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `phoneHash` | varchar(32) | N | MUL |
| `zipHash` | varchar(32) | N |  |
| `insertionDate` | timestamp | N | MUL |

## `homeWarrantyData`  ·  fact · ~79,033 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | N | MUL |
| `under5kSqFt` | varchar(10) | N |  |
| `replacedAppliances` | varchar(10) | N |  |
| `seeBenefits` | varchar(10) | N |  |
| `insertionDate` | timestamp | N |  |

## `hotLeadsSources`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `oleadid` | varchar(40) | N |  |
| `fscode1` | varchar(150) | Y |  |
| `sc` | varchar(20) | Y |  |
| `datecaptured` | date | Y |  |
| `vertical` | varchar(20) | N |  |
| `client` | varchar(255) | Y |  |
| `area` | varchar(50) | Y |  |
| `market` | varchar(50) | Y |  |
| `leadtype` | varchar(10) | Y |  |
| `insertiondate` | timestamp | N |  |

## `leadBadgeTokens`  ·  dimension · ~0 rows · InnoDB
PK: `badgeID`, `OLeadID`

| column | type | null | key |
|---|---|---|---|
| `badgeID` | char(8) | N | PRI |
| `OLeadID` | varchar(40) | N | PRI |
| `brandID` | int | Y | MUL |
| `repID` | varchar(20) | Y | MUL |
| `insertionDate` | timestamp | N | MUL |

## `leadBadgeTokens_hist`  ·  dimension · ~319 rows · InnoDB
PK: `badgeID`, `OLeadID`

| column | type | null | key |
|---|---|---|---|
| `badgeID` | char(8) | N | PRI |
| `OLeadID` | varchar(40) | N | PRI |
| `brandID` | int | Y | MUL |
| `repID` | varchar(20) | Y | MUL |
| `insertionDate` | timestamp | N | MUL |
| `completed` | tinyint | Y | MUL |

## `leadConduitData`  ·  fact · ~81,345,058 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `campaign` | varchar(100) | Y | MUL |
| `leadId` | varchar(50) | N | MUL |
| `leadStatus` | varchar(15) | N |  |
| `leadDetail` | varchar(100) | N |  |
| `captureDate` | varchar(80) | N |  |
| `insertionDate` | timestamp | N | MUL |

## `leadConduitData_arc`  ·  fact · ~85,479,628 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | N | MUL |
| `campaign` | varchar(100) | Y | MUL |
| `leadId` | varchar(50) | N | MUL |
| `leadStatus` | varchar(15) | N |  |
| `leadDetail` | varchar(100) | Y |  |
| `captureDate` | varchar(80) | N |  |
| `insertionDate` | timestamp | N | MUL |

## `leadConduitData_toDelete`  ·  fact · ~69,434 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `campaign` | varchar(100) | Y | MUL |
| `leadId` | varchar(50) | N | MUL |
| `leadStatus` | varchar(15) | N |  |
| `leadDetail` | varchar(100) | N |  |
| `captureDate` | varchar(80) | N |  |
| `insertionDate` | timestamp | N | MUL |

## `leadData`  ·  fact · ~60,509,974 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `firstName` | varchar(50) | N |  |
| `lastName` | varchar(50) | N |  |
| `email` | varchar(100) | N | MUL |
| `phone` | varchar(15) | N | MUL |
| `address` | varchar(100) | N |  |
| `city` | varchar(50) | N |  |
| `state` | varchar(2) | N | MUL |
| `postalCode` | varchar(5) | N | MUL |
| `dob` | varchar(20) | Y |  |
| `ipAddress` | varchar(45) | N |  |
| `homeowner` | varchar(3) | Y |  |
| `creditScore` | varchar(10) | Y |  |
| `insertionDate` | timestamp | N | MUL |

## `leadData_Deleted`  ·  fact · ~115,431 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(30) | N | MUL |
| `firstName` | varchar(50) | N |  |
| `lastName` | varchar(50) | N |  |
| `email` | varchar(100) | N |  |
| `phone` | varchar(15) | N | MUL |
| `address` | varchar(100) | N |  |
| `city` | varchar(50) | N |  |
| `state` | varchar(2) | N | MUL |
| `postalCode` | varchar(5) | N | MUL |
| `dob` | varchar(20) | Y |  |
| `ipAddress` | varchar(45) | N |  |
| `homeowner` | varchar(3) | Y |  |
| `creditScore` | varchar(10) | Y |  |
| `insertionDate` | timestamp | N | MUL |

## `leadData_hist`  ·  fact · ~83,246 rows · InnoDB
PK: `ID`, `OLeadID`, `updateDate`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | PRI |
| `firstName` | varchar(50) | N |  |
| `lastName` | varchar(50) | N |  |
| `email` | varchar(100) | N | MUL |
| `phone` | varchar(15) | N | MUL |
| `address` | varchar(100) | N |  |
| `city` | varchar(50) | N |  |
| `state` | varchar(2) | N | MUL |
| `postalCode` | varchar(5) | N | MUL |
| `dob` | varchar(20) | Y |  |
| `ipAddress` | varchar(45) | N |  |
| `homeowner` | varchar(3) | Y |  |
| `creditScore` | varchar(10) | Y |  |
| `insertionDate` | timestamp | N | MUL |
| `dmlOp` | varchar(10) | Y | MUL |
| `updateDate` | datetime | N | PRI |
| `deletedOn` | timestamp | Y | MUL |

## `leadData_preserved`  ·  dimension · ~449 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `firstName` | varchar(50) | N |  |
| `lastName` | varchar(50) | N |  |
| `email` | varchar(100) | N | MUL |
| `phone` | varchar(15) | N | MUL |
| `address` | varchar(100) | N |  |
| `city` | varchar(50) | N |  |
| `state` | varchar(2) | N | MUL |
| `postalCode` | varchar(5) | N | MUL |
| `dob` | varchar(20) | Y |  |
| `ipAddress` | varchar(45) | N |  |
| `homeowner` | varchar(3) | Y |  |
| `creditScore` | varchar(10) | Y |  |
| `insertionDate` | timestamp | N | MUL |

## `leadProcessingStg`  ·  dimension · ~327 rows · InnoDB
PK: `phone`

| column | type | null | key |
|---|---|---|---|
| `phone` | varchar(15) | N | PRI |
| `insertionDate` | timestamp | Y | MUL |

## `leadQA`  ·  dimension · ~1,647 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(30) | N | MUL |
| `customerNumber` | varchar(10) | N | MUL |
| `trackingNumber` | varchar(10) | N | UNI |
| `auditClient` | varchar(30) | N | MUL |
| `auditClientID` | int | N | MUL |
| `auditType` | varchar(10) | N | MUL |
| `insertionDate` | timestamp | N |  |

## `leadQALog`  ·  fact · ~137,599 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `fromNumber` | varchar(10) | N |  |
| `duration` | int | N |  |
| `result` | varchar(50) | N |  |
| `callId` | varchar(50) | N | UNI |
| `callRecording` | varchar(255) | N |  |
| `clientID` | varchar(30) | N | MUL |
| `insertionDate` | timestamp | N |  |

## `leadTokens`  ·  fact · ~40,630,180 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `phone` | varchar(15) | Y | MUL |
| `origin` | varchar(5) | Y | MUL |
| `auditToken` | varchar(50) | Y | MUL |
| `auditAuthentic` | tinyint | Y |  |
| `dataIntegrity` | varchar(255) | Y |  |
| `approvedUrl` | tinyint | Y | MUL |
| `insertionDate` | timestamp | N | MUL |

## `leadTokensResponse`  ·  fact · ~40,935,767 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `auditToken` | varchar(50) | N | MUL |
| `fullResponse` | json | Y |  |
| `insertedOn` | date | N | MUL |

## `leadTrustedForms`  ·  fact · ~85,674,021 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `phone` | varchar(15) | Y | MUL |
| `origin` | varchar(5) | Y | MUL |
| `shareURL` | varchar(650) | Y |  |
| `trustedFormURL` | varchar(255) | Y |  |
| `certToken` | varchar(255) | Y | MUL |
| `masked` | tinyint | Y |  |
| `maskedCertUrl` | varchar(150) | Y |  |
| `fullUrl` | varchar(255) | Y |  |
| `approvedUrl` | tinyint | Y | MUL |
| `insertionDate` | timestamp | N | MUL |

## `leadTrustedFormsResponse`  ·  fact · ~46,263,721 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `certToken` | varchar(255) | N | MUL |
| `fullResponse` | json | Y |  |
| `insertedOn` | date | N | MUL |

## `leadsIssues`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `issueDetail` | varchar(100) | Y |  |
| `issueDate` | date | Y |  |
| `insertionDate` | timestamp | N |  |
| `OLeadid` | varchar(40) | N |  |
| `VT` | varchar(5) | N |  |

## `leadsIssues_dtl`  ·  fact · ~91,416 rows · InnoDB
PK: `ID`, `OLeadID`, `VT`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | PRI |
| `VT` | varchar(5) | N | PRI |

## `leadsIssues_hdr`  ·  dimension · ~4 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `issueDetail` | varchar(100) | Y |  |
| `issueDate` | date | Y |  |
| `insertionDate` | timestamp | N | MUL |

## `leads_archive`  ·  fact · ~23,545,115 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | N | MUL |
| `first_name` | varchar(50) | N |  |
| `last_name` | varchar(50) | N |  |
| `email` | varchar(100) | N |  |
| `phone` | varchar(15) | N | MUL |
| `address` | varchar(100) | N |  |
| `city` | varchar(50) | N |  |
| `state` | varchar(2) | N | MUL |
| `postal_code` | varchar(5) | N |  |
| `age` | varchar(20) | Y |  |
| `ip_address` | varchar(45) | N |  |
| `homeowner` | varchar(3) | Y |  |
| `current_provider` | varchar(150) | Y |  |
| `electric_bill` | varchar(15) | Y |  |
| `roof_shade` | varchar(50) | Y |  |
| `roof_type` | varchar(100) | Y |  |
| `credit_score` | varchar(10) | Y |  |
| `source` | text | Y |  |
| `timestamp_affiliate` | varchar(50) | N |  |
| `timestamp_CallCenter_Dispositioned` | varchar(50) | Y |  |
| `FSCode1` | varchar(150) | Y |  |
| `FSCode2` | varchar(150) | Y |  |
| `FSCode3` | varchar(150) | Y |  |
| `DistributionLogic2` | longtext | Y |  |
| `CD_leadId` | varchar(20) | Y |  |
| `callDispo` | varchar(40) | Y |  |
| `callDispo_ext` | varchar(40) | Y |  |
| `vertical` | varchar(20) | Y | MUL |
| `leadType` | varchar(10) | Y |  |
| `deliveryLeadType` | varchar(10) | Y |  |
| `multiplied` | varchar(5) | Y |  |
| `leadIdToken` | varchar(50) | Y |  |
| `TrustedFormURL` | varchar(150) | Y |  |
| `WTClient` | varchar(50) | Y |  |
| `client` | varchar(30) | Y |  |
| `market` | varchar(50) | Y | MUL |
| `clientLeadId` | varchar(20) | Y |  |
| `pingVal` | float | Y |  |
| `leadId0` | varchar(30) | N |  |
| `leadStatus0` | varchar(15) | N |  |
| `leadStatusDetail0` | varchar(100) | Y |  |
| `captureDateAndTime0` | varchar(80) | N |  |
| `leadId1` | varchar(30) | Y |  |
| `leadStatus1` | varchar(15) | Y |  |
| `leadStatusDetail1` | varchar(100) | Y |  |
| `captureDateAndTime1` | varchar(80) | Y |  |
| `leadId2` | varchar(30) | Y |  |
| `leadStatus2` | varchar(15) | Y |  |
| `leadStatusDetail2` | varchar(100) | Y |  |
| `captureDateAndTime2` | varchar(80) | Y |  |
| `zEstimate` | int | N |  |
| `tEstimate` | int | N |  |
| `approved_zip` | int | Y |  |

## `pLeads`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `OLeadID` | varchar(40) | N |  |
| `first_name` | varchar(50) | N |  |
| `last_name` | varchar(50) | N |  |
| `email` | varchar(100) | N |  |
| `phone` | varchar(15) | N |  |
| `address` | varchar(100) | N |  |
| `city` | varchar(50) | N |  |
| `state` | varchar(2) | N |  |
| `postal_code` | varchar(5) | N |  |
| `age` | varchar(20) | Y |  |
| `ip_address` | varchar(45) | N |  |
| `homeowner` | varchar(3) | Y |  |
| `current_provider` | varchar(150) | Y |  |
| `electric_bill` | varchar(15) | Y |  |
| `roof_shade` | varchar(50) | Y |  |
| `roof_type` | varchar(100) | Y |  |
| `credit_score` | varchar(10) | Y |  |
| `source` | mediumtext | Y |  |
| `timestamp_affiliate` | varchar(50) | Y |  |
| `FSCode1` | varchar(150) | Y |  |
| `FSCode2` | varchar(150) | Y |  |
| `leadIdToken` | varchar(50) | Y |  |
| `TrustedFormURL` | varchar(255) | Y |  |
| `captureDateAndTime0` | timestamp | N |  |

## `prismQueue`  ·  fact · ~2,043,492 rows · InnoDB
PK: `OLeadID`, `RA`, `ProcessId`, `SequenceNo`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | MUL |
| `OLeadID` | varchar(40) | N | PRI |
| `RA` | varchar(5) | N | PRI |
| `phone` | varchar(15) | Y | MUL |
| `ProcessId` | int | N | PRI |
| `SequenceNo` | smallint | N | PRI |
| `ModuleId` | varchar(20) | Y |  |
| `leadConduitId` | varchar(50) | Y |  |
| `sentLeadConduitId` | varchar(50) | Y |  |
| `addDate` | timestamp | Y | MUL |
| `dueDate` | datetime | Y |  |
| `Sent` | tinyint | Y | MUL |

## `prismReserve`  ·  fact · ~99,060 rows · InnoDB
PK: `OLeadID`, `RA`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | MUL |
| `OLeadID` | varchar(40) | N | PRI |
| `Zip` | varchar(5) | Y | MUL |
| `VT` | varchar(5) | Y |  |
| `ClientId` | int | Y | MUL |
| `callDispo` | varchar(40) | Y |  |
| `callDispoExtended` | varchar(80) | Y |  |
| `RA` | varchar(5) | N | PRI |
| `PastProcessId` | int | Y |  |
| `insertionDate` | timestamp | Y | MUL |
| `Sent` | datetime | Y |  |

## `prismReserveArc`  ·  dimension · ~23,639 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | Y | MUL |
| `Zip` | varchar(5) | Y | MUL |
| `VT` | varchar(5) | Y |  |
| `ClientId` | int | Y | MUL |
| `callDispo` | varchar(40) | Y |  |
| `callDispoExtended` | varchar(80) | Y |  |
| `RA` | varchar(5) | Y | MUL |
| `PastProcessId` | int | Y |  |
| `insertionDate` | timestamp | Y | MUL |
| `Sent` | tinyint | Y |  |

## `prismReserveArc2`  ·  dimension · ~23,069 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | Y | MUL |
| `Zip` | varchar(5) | Y | MUL |
| `VT` | varchar(5) | Y |  |
| `ClientId` | int | Y | MUL |
| `callDispo` | varchar(40) | Y |  |
| `callDispoExtended` | varchar(80) | Y |  |
| `RA` | varchar(5) | Y | MUL |
| `PastProcessId` | int | Y |  |
| `insertionDate` | timestamp | Y | MUL |
| `Sent` | tinyint | Y |  |

## `remove_from_db`  ·  dimension · ~49,782 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(30) | N | UNI |

## `revivedLeads`  ·  fact · ~23,789,535 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | N | MUL |
| `batchId` | varchar(40) | N | MUL |
| `RU` | varchar(10) | N | MUL |
| `notes` | varchar(255) | N |  |
| `reviveDate` | timestamp | N | MUL |

## `revivedLeadsBatches`  ·  fact · ~639,387,704 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | N | MUL |
| `phone` | varchar(15) | Y | MUL |
| `batchId` | varchar(40) | N | MUL |
| `RU` | varchar(10) | N | MUL |
| `notes` | varchar(255) | N |  |
| `reviveDate` | datetime | N | MUL |
| `revivedDate` | datetime | N | MUL |

## `revivedLeadsBatchesPhones`  ·  dimension · ~0 rows · InnoDB
PK: `phone`

| column | type | null | key |
|---|---|---|---|
| `phone` | varchar(15) | N | PRI |

## `revivedLeadsBatchesUndo`  ·  fact · ~214,320 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | N | MUL |
| `batchId` | varchar(40) | N | MUL |
| `RU` | varchar(10) | N | MUL |
| `notes` | varchar(255) | N |  |
| `reviveDate` | datetime | N | MUL |
| `revivedDate` | datetime | N |  |

## `revivedLeadsBatches_arc`  ·  fact · ~15,869,149 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | N | MUL |
| `phone` | varchar(15) | Y | MUL |
| `batchId` | varchar(40) | N | MUL |
| `RU` | varchar(10) | N | MUL |
| `notes` | varchar(255) | N |  |
| `reviveDate` | datetime | N | MUL |
| `revivedDate` | datetime | N | MUL |

## `revivedLeadsBatches_stg`  ·  fact · ~198,952 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | N | MUL |
| `phone` | varchar(15) | Y | MUL |
| `batchId` | varchar(40) | N | MUL |
| `RU` | varchar(10) | N | MUL |
| `notes` | varchar(255) | N |  |
| `reviveDate` | datetime | N | MUL |
| `revivedDate` | datetime | N | MUL |

## `revivedLeads_archive`  ·  dimension · ~162 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadId` | varchar(30) | N | MUL |
| `batchId` | varchar(40) | N | MUL |
| `notes` | varchar(255) | N |  |
| `reviveDate` | timestamp | N |  |

## `sentData`  ·  fact · ~1,318,280 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `FSCode3` | varchar(150) | Y | MUL |
| `vertical` | varchar(20) | N | MUL |
| `leadType` | varchar(10) | Y | MUL |
| `multiplied` | varchar(5) | Y |  |
| `clientId` | int | N | MUL |
| `client` | varchar(255) | Y |  |
| `subClientId` | int | Y | MUL |
| `subClient` | varchar(90) | Y | MUL |
| `tokens` | tinyint | Y |  |
| `Area` | varchar(50) | Y | MUL |
| `market` | varchar(50) | Y | MUL |
| `clientLeadId` | varchar(20) | Y |  |
| `pingVal` | float | Y |  |
| `leadConduitId` | varchar(50) | N | MUL |
| `captureDate` | varchar(80) | N | MUL |
| `dateCaptured` | date | Y | MUL |
| `insertionDate` | timestamp | N | MUL |

## `sentDataRM`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `OLeadID` | varchar(40) | N |  |
| `FSCode3` | varchar(150) | Y |  |
| `vertical` | varchar(20) | N |  |
| `leadType` | varchar(10) | Y |  |
| `multiplied` | varchar(5) | Y |  |
| `clientId` | int | N |  |
| `client` | varchar(255) | Y |  |
| `subClientId` | int | Y |  |
| `subClient` | varchar(90) | Y |  |
| `tokens` | tinyint | Y |  |
| `Area` | varchar(50) | Y |  |
| `market` | varchar(50) | Y |  |
| `clientLeadId` | varchar(20) | Y |  |
| `pingVal` | float | Y |  |
| `leadConduitId` | varchar(50) | N |  |
| `captureDate` | varchar(80) | N |  |
| `dateCaptured` | date | Y |  |
| `insertionDate` | timestamp | N |  |
| `rm` | int | N |  |

## `sentDataRS`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `OLeadID` | varchar(40) | N |  |
| `FSCode3` | varchar(150) | Y |  |
| `vertical` | varchar(20) | N |  |
| `leadType` | varchar(10) | Y |  |
| `multiplied` | varchar(5) | Y |  |
| `clientId` | int | N |  |
| `client` | varchar(255) | Y |  |
| `subClientId` | int | Y |  |
| `subClient` | varchar(90) | Y |  |
| `tokens` | tinyint | Y |  |
| `Area` | varchar(50) | Y |  |
| `market` | varchar(50) | Y |  |
| `clientLeadId` | varchar(20) | Y |  |
| `pingVal` | float | Y |  |
| `leadConduitId` | varchar(50) | N |  |
| `captureDate` | varchar(80) | N |  |
| `dateCaptured` | date | Y |  |
| `insertionDate` | timestamp | N |  |
| `rs` | int | N |  |

## `sentData_backup`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | N | MUL |
| `FSCode3` | varchar(150) | Y | MUL |
| `vertical` | varchar(20) | N | MUL |
| `leadType` | varchar(10) | Y | MUL |
| `multiplied` | varchar(5) | Y |  |
| `clientId` | int | N | MUL |
| `client` | varchar(30) | Y |  |
| `market` | varchar(50) | Y | MUL |
| `clientLeadId` | varchar(20) | Y |  |
| `pingVal` | float | Y |  |
| `leadConduitId` | varchar(50) | Y | MUL |
| `captureDate` | varchar(80) | N | MUL |
| `insertionDate` | timestamp | N |  |

## `sentTokens`  ·  dimension · ~4 rows · InnoDB
PK: `tokens`

| column | type | null | key |
|---|---|---|---|
| `tokens` | tinyint | N | PRI |
| `tokens_desc` | varchar(40) | N |  |

## `sent_data_client_today`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `OLeadID` | varchar(40) | N |  |
| `FSCode3` | varchar(150) | Y |  |
| `vertical` | varchar(20) | N |  |
| `leadType` | varchar(10) | Y |  |
| `multiplied` | varchar(5) | Y |  |
| `clientId` | int | N |  |
| `client` | varchar(255) | Y |  |
| `market` | varchar(50) | Y |  |
| `clientLeadId` | varchar(20) | Y |  |
| `pingVal` | float | Y |  |
| `leadConduitId` | varchar(50) | N |  |
| `captureDate` | varchar(80) | N |  |
| `insertionDate` | timestamp | N |  |
| `state` | varchar(2) | Y |  |
| `postalCode` | varchar(5) | Y |  |

## `sent_data_client_today_lead`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `OLeadID` | varchar(40) | N |  |
| `FSCode3` | varchar(150) | Y |  |
| `vertical` | varchar(20) | N |  |
| `leadType` | varchar(10) | Y |  |
| `multiplied` | varchar(5) | Y |  |
| `clientId` | int | N |  |
| `client` | varchar(255) | Y |  |
| `market` | varchar(50) | Y |  |
| `clientLeadId` | varchar(20) | Y |  |
| `pingVal` | float | Y |  |
| `leadConduitId` | varchar(50) | N |  |
| `captureDate` | varchar(80) | N |  |
| `insertionDate` | timestamp | N |  |
| `state` | varchar(2) | Y |  |
| `postalCode` | varchar(5) | Y |  |
| `countLead` | bigint | N |  |

## `sent_data_client_today_market`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `OLeadID` | varchar(40) | N |  |
| `FSCode3` | varchar(150) | Y |  |
| `vertical` | varchar(20) | N |  |
| `leadType` | varchar(10) | Y |  |
| `multiplied` | varchar(5) | Y |  |
| `clientId` | int | N |  |
| `client` | varchar(255) | Y |  |
| `market` | varchar(50) | Y |  |
| `clientLeadId` | varchar(20) | Y |  |
| `pingVal` | float | Y |  |
| `leadConduitId` | varchar(50) | N |  |
| `captureDate` | varchar(80) | N |  |
| `insertionDate` | timestamp | N |  |
| `state` | varchar(2) | Y |  |
| `postalCode` | varchar(5) | Y |  |
| `countMarket` | bigint | N |  |

## `sent_data_client_today_state`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `OLeadID` | varchar(40) | N |  |
| `FSCode3` | varchar(150) | Y |  |
| `vertical` | varchar(20) | N |  |
| `leadType` | varchar(10) | Y |  |
| `multiplied` | varchar(5) | Y |  |
| `clientId` | int | N |  |
| `client` | varchar(255) | Y |  |
| `market` | varchar(50) | Y |  |
| `clientLeadId` | varchar(20) | Y |  |
| `pingVal` | float | Y |  |
| `leadConduitId` | varchar(50) | N |  |
| `captureDate` | varchar(80) | N |  |
| `insertionDate` | timestamp | N |  |
| `state` | varchar(2) | Y |  |
| `postalCode` | varchar(5) | Y |  |
| `countState` | bigint | N |  |

## `sent_data_today`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `OLeadID` | varchar(40) | N |  |
| `FSCode3` | varchar(150) | Y |  |
| `vertical` | varchar(20) | N |  |
| `leadType` | varchar(10) | Y |  |
| `multiplied` | varchar(5) | Y |  |
| `clientId` | int | N |  |
| `client` | varchar(255) | Y |  |
| `market` | varchar(50) | Y |  |
| `clientLeadId` | varchar(20) | Y |  |
| `pingVal` | float | Y |  |
| `leadConduitId` | varchar(50) | N |  |
| `captureDate` | varchar(80) | N |  |
| `insertionDate` | timestamp | N |  |
| `state` | varchar(2) | Y |  |
| `postalCode` | varchar(5) | Y |  |

## `sent_data_today_20220513`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `OLeadID` | varchar(40) | N |  |
| `FSCode3` | varchar(150) | Y |  |
| `vertical` | varchar(20) | N |  |
| `leadType` | varchar(10) | Y |  |
| `multiplied` | varchar(5) | Y |  |
| `clientId` | int | N |  |
| `client` | varchar(255) | Y |  |
| `market` | varchar(50) | Y |  |
| `clientLeadId` | varchar(20) | Y |  |
| `pingVal` | float | Y |  |
| `leadConduitId` | varchar(50) | N |  |
| `captureDate` | varchar(80) | N |  |
| `insertionDate` | timestamp | N |  |
| `state` | varchar(2) | Y |  |
| `postalCode` | varchar(5) | Y |  |

## `sent_data_today_count`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `clientId` | int | N |  |
| `clientName` | varchar(255) | Y |  |
| `state` | varchar(2) | Y |  |
| `market` | varchar(50) | Y |  |
| `countMarket` | bigint | N |  |
| `countState` | bigint | N |  |
| `countLead` | bigint | N |  |

## `solarData`  ·  fact · ~1,265,084 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | N | MUL |
| `currentProvider` | varchar(150) | Y |  |
| `currentProviderOther` | varchar(150) | Y |  |
| `electricBill` | varchar(15) | Y |  |
| `roofShade` | varchar(50) | Y |  |
| `roofType` | varchar(100) | Y |  |
| `originalCurrentProvider` | varchar(50) | Y |  |
| `originalElectricBill` | varchar(20) | Y |  |
| `shade` | varchar(50) | Y |  |
| `title` | varchar(3) | Y |  |
| `alternateContact` | varchar(50) | Y |  |
| `averageElectricBill` | int | Y |  |
| `utilityProvider` | varchar(50) | Y |  |
| `creditScore` | varchar(20) | Y |  |
| `bankruptcies` | varchar(20) | Y |  |
| `client` | varchar(20) | Y |  |
| `clientId` | varchar(20) | Y |  |
| `appointmentTime` | timestamp | Y |  |
| `appointmentType` | varchar(20) | Y |  |
| `notes` | varchar(255) | Y |  |
| `insertionDate` | timestamp | N |  |

## `tableMaint`  ·  dimension · ~4 rows · InnoDB
PK: `tableName`, `maintDate`

| column | type | null | key |
|---|---|---|---|
| `tableName` | varchar(60) | N | PRI |
| `maintDate` | date | N | PRI |
| `status` | tinyint | N | MUL |

## `tableMaintKeyID`  ·  dimension · ~40,331 rows · InnoDB
PK: `tableName`, `maintDate`, `ID`, `OLeadID`, `tranType`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | PRI |
| `tokenData` | varchar(255) | Y | MUL |
| `tableName` | varchar(60) | N | PRI |
| `maintDate` | date | N | PRI |
| `tranType` | char(1) | N | PRI |

## `temp_work_prismQueue`  ·  dimension · ~4,729 rows · InnoDB
PK: `OLeadID`, `RA`, `ProcessId`, `SequenceNo`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | MUL |
| `OLeadID` | varchar(40) | N | PRI |
| `RA` | varchar(5) | N | PRI |
| `phone` | varchar(15) | Y | MUL |
| `ProcessId` | int | N | PRI |
| `SequenceNo` | smallint | N | PRI |
| `ModuleId` | varchar(20) | Y |  |
| `leadConduitId` | varchar(50) | Y |  |
| `sentLeadConduitId` | varchar(50) | Y |  |
| `dueDate` | datetime | Y |  |
| `Sent` | tinyint | Y | MUL |
| `addDate` | timestamp | Y | MUL |

## `tmp_affiliateData`  ·  fact · ~58,020 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `source` | mediumtext | Y |  |
| `timestampAffiliate` | varchar(50) | Y |  |
| `timestampAffiliateDate` | date | Y |  |
| `affiliateLeadId` | varchar(40) | Y |  |
| `VTO` | varchar(20) | Y |  |
| `VT` | varchar(20) | Y |  |
| `PD` | varchar(20) | Y |  |
| `CH` | varchar(20) | Y |  |
| `SC` | varchar(20) | Y |  |
| `CP` | varchar(20) | Y |  |
| `SS` | varchar(20) | Y |  |
| `SA` | varchar(20) | Y |  |
| `C0` | varchar(20) | Y |  |
| `FSCode1` | varchar(150) | Y |  |
| `FSCode2` | varchar(150) | Y |  |
| `accepted` | varchar(5) | Y |  |
| `rejectedReason` | varchar(255) | Y |  |
| `insertionDate` | timestamp | N |  |

## `transferData`  ·  fact · ~49,123,996 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `WTClient` | varchar(50) | N |  |
| `timestamp_CallCenter_Dispositioned` | varchar(50) | N |  |
| `callDispo` | varchar(40) | N |  |
| `callDispo_ext` | varchar(40) | N |  |
| `sentTime` | datetime | N |  |
| `responseTime` | datetime | Y |  |
| `leadId` | varchar(40) | Y | UNI |
| `outcome` | varchar(30) | Y |  |
| `reason` | varchar(255) | Y |  |
| `insertionDate` | timestamp | N | MUL |

## `ttmp_affiliateData`  ·  dimension · ~42 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `source` | mediumtext | Y |  |
| `timestampAffiliate` | varchar(50) | Y |  |
| `VTO` | varchar(20) | Y |  |
| `FSCode1` | varchar(150) | Y |  |
| `FSCode2` | varchar(150) | Y |  |
| `accepted` | varchar(5) | Y |  |
| `insertionDate` | varchar(50) | Y |  |

## `unique_FSCode1`  ·  dimension · ~370 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `ukey` | varchar(5) | Y | MUL |
| `uvalue` | varchar(20) | Y | MUL |

## `unique_FSCodes`  ·  dimension · ~489 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `ukey` | varchar(5) | Y | MUL |
| `uvalueA` | varchar(20) | Y | MUL |
| `uvalueB` | varchar(20) | Y | MUL |

## `unreviveLeadsBatches`  ·  dimension · ~0 rows · InnoDB
PK: `OLeadID`, `batchId`

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(40) | N | PRI |
| `batchId` | varchar(40) | N | PRI |

## `vDataCert`  ·  fact · ~4,420,008 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(40) | Y | MUL |
| `domainName` | varchar(100) | Y |  |
| `dotcount` | tinyint | Y |  |
| `first_dot` | varchar(100) | Y |  |
| `first_slash` | varchar(100) | Y |  |
| `derived_domainname` | varchar(100) | Y |  |
| `derived_approvedUrl` | tinyint | Y |  |

## `validationData`  ·  fact · ~168,902,575 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `source` | varchar(2) | Y | MUL |
| `leadIdToken` | varchar(50) | Y | MUL |
| `leadIdClaimed` | tinyint | Y |  |
| `trustedFormURL` | varchar(255) | Y | MUL |
| `trustedFormClaimed` | tinyint | Y |  |
| `domainName` | varchar(100) | Y | MUL |
| `approvedUrl` | tinyint | Y | MUL |
| `insertionDate` | timestamp | N | MUL |
| `lastUpdate` | timestamp | Y | MUL |

## `validationDataSources`  ·  dimension · ~4 rows · InnoDB
PK: `source`

| column | type | null | key |
|---|---|---|---|
| `source` | varchar(2) | N | PRI |
| `source_name` | varchar(30) | N |  |

## `validationData_arc`  ·  fact · ~17,574,044 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `source` | varchar(2) | Y | MUL |
| `leadIdToken` | varchar(50) | Y | MUL |
| `leadIdClaimed` | tinyint | Y |  |
| `trustedFormURL` | varchar(255) | Y | MUL |
| `trustedFormClaimed` | tinyint | Y |  |
| `domainName` | varchar(100) | Y | MUL |
| `approvedUrl` | tinyint | Y | MUL |
| `insertionDate` | timestamp | N | MUL |
| `lastUpdate` | timestamp | Y | MUL |

## `validationData_audit`  ·  fact · ~80,600 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `source` | varchar(2) | Y | MUL |
| `leadIdToken` | varchar(50) | Y |  |
| `leadIdClaimed` | tinyint | Y |  |
| `trustedFormURL` | varchar(150) | Y | MUL |
| `trustedFormClaimed` | tinyint | Y |  |
| `vr_tb` | varchar(10) | N |  |
| `updateDate` | timestamp | N | MUL |

## `validationData_toDelete`  ·  fact · ~90,021 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `source` | varchar(2) | Y | MUL |
| `leadIdToken` | varchar(50) | Y |  |
| `leadIdClaimed` | tinyint | Y |  |
| `trustedFormURL` | varchar(150) | Y | MUL |
| `trustedFormClaimed` | tinyint | Y |  |
| `insertionDate` | timestamp | N | MUL |

## `verticalData`  ·  fact · ~1,051,093 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `VT` | varchar(5) | N | MUL |
| `data` | json | Y |  |
| `hashedData` | char(32) | Y | MUL |
| `insertionDate` | timestamp | N |  |

## `verticalData_arc`  ·  fact · ~901,309 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `VT` | varchar(5) | N | MUL |
| `data` | json | Y |  |
| `hashedData` | char(32) | Y | MUL |
| `insertionDate` | timestamp | N |  |

## `weekly_DNC_List`  ·  fact · ~10,421,861 rows · InnoDB
PK: `phone`

| column | type | null | key |
|---|---|---|---|
| `phone` | varchar(50) | N | PRI |
| `vtype` | varchar(3) | N | MUL |

## `weekly_Suppression_List`  ·  fact · ~15,083,823 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `phone` | varchar(50) | N | MUL |
| `vtype` | varchar(3) | N | MUL |

## `weekly_dupe_list`  ·  fact · ~15,022,787 rows · InnoDB
PK: `phone`

| column | type | null | key |
|---|---|---|---|
| `phone` | varchar(50) | N | PRI |

## `windowsData`  ·  dimension · ~1,444 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `qualifyingHome` | varchar(3) | N |  |
| `underConstruction` | varchar(3) | N |  |
| `insertionDate` | timestamp | N | MUL |

## `workingTable`  ·  dimension · ~17,535 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(50) | N | UNI |

## `zztmp_VTLeads`  ·  fact · ~92,998 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `oleadid` | varchar(40) | Y | MUL |
| `vt` | varchar(5) | Y | MUL |
| `FSCode1` | varchar(150) | Y | MUL |
| `FSCode2` | varchar(150) | Y |  |

## `zztmp_affiliateData`  ·  dimension · ~212 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `source` | mediumtext | Y |  |
| `timestampAffiliate` | varchar(50) | Y |  |
| `timestampAffiliateDate` | date | Y |  |
| `affiliateLeadId` | varchar(40) | Y | MUL |
| `VTO` | varchar(20) | Y | MUL |
| `VT` | varchar(20) | Y | MUL |
| `PD` | varchar(20) | Y |  |
| `CH` | varchar(20) | Y |  |
| `SC` | varchar(20) | Y | MUL |
| `CP` | varchar(20) | Y |  |
| `SS` | varchar(20) | Y |  |
| `SA` | varchar(20) | Y |  |
| `C0` | varchar(20) | Y |  |
| `FSCode1` | varchar(150) | Y | MUL |
| `FSCode2` | varchar(150) | Y |  |
| `accepted` | varchar(5) | Y | MUL |
| `rejectedReason` | varchar(255) | Y |  |
| `insertionDate` | timestamp | N | MUL |

## `zztmp_affiliateData222`  ·  dimension · ~1,328 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `source` | mediumtext | Y |  |
| `timestampAffiliate` | varchar(50) | Y |  |
| `timestampAffiliateDate` | date | Y |  |
| `VT` | varchar(20) | Y | MUL |
| `PD` | varchar(20) | Y |  |
| `CH` | varchar(20) | Y |  |
| `SC` | varchar(20) | Y | MUL |
| `CP` | varchar(20) | Y |  |
| `SS` | varchar(20) | Y |  |
| `SA` | varchar(20) | Y |  |
| `FSCode1` | varchar(150) | Y | MUL |
| `FSCode2` | varchar(150) | Y |  |
| `accepted` | varchar(5) | Y | MUL |
| `rejectedReason` | varchar(255) | Y |  |
| `insertionDate` | timestamp | N | MUL |

## `zztmp_affiliateData333`  ·  dimension · ~2,076 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `source` | mediumtext | Y |  |
| `timestampAffiliate` | varchar(50) | Y |  |
| `timestampAffiliateDate` | date | Y |  |
| `VTO` | varchar(20) | Y | MUL |
| `VT` | varchar(20) | Y | MUL |
| `PD` | varchar(20) | Y |  |
| `CH` | varchar(20) | Y |  |
| `SC` | varchar(20) | Y | MUL |
| `CP` | varchar(20) | Y |  |
| `SS` | varchar(20) | Y |  |
| `SA` | varchar(20) | Y |  |
| `C0` | varchar(20) | Y |  |
| `FSCode1` | varchar(150) | Y | MUL |
| `FSCode2` | varchar(150) | Y |  |
| `accepted` | varchar(5) | Y | MUL |
| `rejectedReason` | varchar(255) | Y |  |
| `insertionDate` | timestamp | N | MUL |

## `zztmp_affiliateData444`  ·  dimension · ~1,119 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `source` | mediumtext | Y |  |
| `timestampAffiliate` | varchar(50) | Y |  |
| `timestampAffiliateDate` | date | Y |  |
| `VTO` | varchar(20) | Y | MUL |
| `VT` | varchar(20) | Y | MUL |
| `PD` | varchar(20) | Y |  |
| `CH` | varchar(20) | Y |  |
| `SC` | varchar(20) | Y | MUL |
| `CP` | varchar(20) | Y |  |
| `SS` | varchar(20) | Y |  |
| `SA` | varchar(20) | Y |  |
| `C0` | varchar(20) | Y |  |
| `FSCode1` | varchar(150) | Y | MUL |
| `FSCode2` | varchar(150) | Y |  |
| `accepted` | varchar(5) | Y | MUL |
| `rejectedReason` | varchar(255) | Y |  |
| `insertionDate` | timestamp | N | MUL |

## `zztmp_dupe_logged`  ·  dimension · ~16,837 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `oleadid` | varchar(40) | Y | MUL |

## `zztmp_dupe_logged_ad`  ·  dimension · ~626 rows · InnoDB
PK: `oleadid`, `id`

| column | type | null | key |
|---|---|---|---|
| `oleadid` | varchar(40) | N | PRI |
| `id` | int | N | PRI |

## `zztmp_extZips`  ·  dimension · ~41,525 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `zip` | varchar(5) | Y | MUL |

## `zztmp_nsp_callCenterData`  ·  dimension · ~297 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | N | MUL |
| `timestampCallCenter` | varchar(50) | Y |  |
| `callCenter` | varchar(20) | Y | MUL |
| `repId` | varchar(40) | Y |  |
| `callDispo` | varchar(40) | Y | MUL |
| `callDispoExtended` | varchar(80) | Y |  |
| `WTClient` | varchar(50) | Y |  |
| `insertionDate` | timestamp | N | MUL |

## `zztmp_revivedLeadsBatches_ulog`  ·  fact · ~20,696,240 rows · InnoDB
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

## `zztmp_vd_dupes_data`  ·  dimension · ~8,111 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(40) | Y | MUL |
| `leadIdToken` | varchar(50) | Y |  |
| `leadIdClaimed` | tinyint | Y | MUL |
| `trustedFormURL` | varchar(255) | Y |  |
| `trustedFormClaimed` | tinyint | Y | MUL |
| `insertionDt` | date | Y | MUL |
| `ncnt` | int | Y |  |
