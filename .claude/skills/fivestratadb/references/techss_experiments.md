# Schema `techss_experiments`

Experiment / A-B test data sets.

**9 tables** — dimension: 5, fact: 4

## `KB_expired`  ·  fact · ~1,184,506 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `List` | int | N | MUL |
| `OLeadID` | varchar(100) | N | MUL |
| `phone` | varchar(10) | N | MUL |
| `received` | datetime | N | MUL |
| `type` | varchar(10) | N |  |
| `completed` | date | N | MUL |

## `api_events`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `url` | varchar(100) | N | MUL |
| `timestamp` | varchar(50) | N | MUL |

## `cv_data`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `Month` | int | N | MUL |
| `State` | varchar(10) | Y |  |
| `FSCode1` | varchar(100) | N |  |
| `VT` | varchar(3) | N |  |
| `SC` | varchar(3) | N |  |
| `CP` | varchar(10) | Y |  |
| `SS` | varchar(255) | Y |  |
| `SA` | varchar(255) | Y |  |
| `Sent` | int | N | MUL |

## `darwin_data`  ·  fact · ~61,753 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int unsigned | N | PRI |
| `OLeadID` | varchar(36) | N |  |
| `State` | varchar(10) | Y |  |
| `Zip` | varchar(5) | N |  |
| `County` | varchar(100) | N |  |
| `VT` | varchar(3) | N |  |
| `SC` | varchar(3) | N |  |
| `CP` | varchar(10) | Y |  |
| `C0` | varchar(3) | N |  |
| `CC` | varchar(3) | N |  |

## `discounts`  ·  dimension · ~0 rows · InnoDB
PK: `leadId`

| column | type | null | key |
|---|---|---|---|
| `leadId` | varchar(255) | N | PRI |
| `leadStatus` | varchar(255) | N |  |
| `leadStatusDetail` | varchar(255) | N |  |
| `captureDate` | date | N |  |
| `captureDateAndTime` | datetime | N |  |
| `first_name` | varchar(255) | N |  |
| `last_name` | varchar(255) | N |  |
| `email` | varchar(255) | N |  |
| `phone` | varchar(255) | N |  |
| `address` | varchar(255) | N |  |
| `city` | varchar(255) | N |  |
| `state` | varchar(255) | N |  |
| `postal_code` | varchar(255) | N |  |
| `dob` | varchar(255) | N |  |
| `ip_address` | varchar(255) | N |  |
| `homeowner` | varchar(255) | N |  |
| `LeadConduitID` | varchar(255) | N |  |
| `electric_bill` | varchar(255) | N |  |
| `current_provider` | varchar(255) | N |  |
| `solar_electric` | varchar(255) | N |  |
| `roof_type` | varchar(255) | N |  |
| `credit_score` | varchar(255) | N |  |
| `source` | varchar(255) | N |  |
| `Aff_ID` | varchar(255) | N |  |
| `Sub_ID` | varchar(255) | N |  |
| `timestamp_affiliate` | varchar(255) | N |  |
| `OLeadID` | varchar(255) | N |  |
| `enhancementStatus` | varchar(255) | N |  |
| `priorityTwo` | varchar(255) | N |  |
| `priorityThree` | varchar(255) | N |  |
| `priorityFour` | varchar(255) | N |  |
| `priorityFive` | varchar(255) | N |  |
| `addressValidation` | varchar(255) | N |  |
| `phoneValidation` | varchar(255) | N |  |
| `emailValidation` | varchar(255) | N |  |
| `approved_zip` | varchar(255) | N |  |
| `root_Aff_ID` | varchar(255) | N |  |
| `FSCode1` | varchar(255) | N |  |
| `FSCode2` | varchar(255) | N |  |
| `FSCode3` | varchar(255) | N |  |
| `filler` | varchar(255) | N |  |
| `universal_leadid` | varchar(255) | N |  |
| `campaign` | varchar(255) | N |  |
| `leadType` | varchar(255) | N |  |
| `freshMaxAttempts` | varchar(255) | N |  |
| `zE` | varchar(255) | N |  |
| `tE` | varchar(255) | N |  |
| `failureReason` | varchar(255) | N |  |
| `updatedFSCode2` | varchar(255) | N |  |
| `updatedFSCode1` | varchar(255) | N |  |
| `market` | varchar(255) | N |  |

## `liveZipFilters`  ·  dimension · ~0 rows · InnoDB
PK: `zip`

| column | type | null | key |
|---|---|---|---|
| `zip` | varchar(15) | N | PRI |
| `f1` | tinyint | Y |  |
| `f2` | tinyint | Y |  |
| `f3` | tinyint | Y |  |
| `f4` | tinyint | Y |  |
| `f5` | tinyint | Y |  |

## `solarData`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(100) | N | MUL |
| `currentProvider` | varchar(150) | Y |  |
| `electricBill` | varchar(15) | Y |  |
| `roofShade` | varchar(50) | Y |  |
| `roofType` | varchar(100) | Y |  |
| `originalCurrentProvider` | varchar(50) | Y |  |
| `originalElectricBill` | varchar(20) | Y |  |
| `insertionDate` | timestamp | N |  |

## `token_claim_api`  ·  fact · ~2,541,302 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `leadIdToken` | varchar(50) | Y |  |
| `leadIdClaimed` | tinyint | Y |  |
| `trustedFormURL` | varchar(150) | Y |  |
| `trustedFormClaimed` | tinyint | Y |  |
| `callDate` | timestamp | N |  |

## `zztmp_CTD_FIF_leads`  ·  fact · ~122,211 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `OLeadID` | varchar(40) | N | MUL |
| `phone` | varchar(15) | N | PRI |
| `email` | varchar(100) | N | MUL |
| `FSCode1` | varchar(150) | N | MUL |
| `FSCode2` | varchar(150) | N |  |
| `newFSCode1` | varchar(150) | N |  |
| `nowFSCode1` | varchar(150) | N |  |
