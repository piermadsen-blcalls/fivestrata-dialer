# Schema `techss_dl`

Lead Distribution — clients, ZIP coverage, bids/prices, transfer priorities, dialer/staging logs, and many distribution views.

**174 tables** — dimension: 127, fact: 25, view: 22

## `OLD_callcenter_zip_filters`  ·  dimension · ~6,705 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `FSCode1` | varchar(40) | N | MUL |
| `Zip` | varchar(5) | N |  |
| `callCenterId` | int | N |  |
| `callCenterAbbr` | varchar(3) | N |  |
| `campaignId` | varchar(50) | Y | MUL |
| `listId` | varchar(10) | Y | MUL |
| `VT` | varchar(20) | Y | MUL |
| `PD` | varchar(20) | Y |  |
| `CH` | varchar(20) | Y |  |
| `SC` | varchar(20) | Y | MUL |
| `CP` | varchar(20) | Y |  |

## `OLD_client_lead_prices`  ·  dimension · ~724 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientId` | int | N | MUL |
| `leadType` | varchar(5) | N | MUL |
| `capType` | int | N | MUL |
| `leadPrice` | decimal(6,2) | N |  |
| `startDate` | date | N |  |
| `endDate` | date | Y |  |

## `OLD_client_price_types`  ·  dimension · ~5 rows · InnoDB
PK: `leadType`

| column | type | null | key |
|---|---|---|---|
| `leadType` | varchar(5) | N | PRI |
| `typeName` | varchar(80) | Y |  |

## `OLD_process_dispos`  ·  dimension · ~80 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `fullDispo` | varchar(125) | Y | MUL |
| `callDispo` | varchar(40) | Y |  |
| `callDispoExtended` | varchar(80) | Y |  |
| `dispoGroup` | varchar(30) | Y | MUL |
| `dispoRank` | smallint | Y | MUL |
| `Contact` | tinyint | Y |  |
| `Complete` | tinyint | Y |  |
| `App` | tinyint | Y |  |
| `NQ` | tinyint | Y |  |

## `OLD_zcwlt_staging_log`  ·  fact · ~12,741,513 rows · InnoDB
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

## `RVInvtyRevive`  ·  dimension · ~2,120 rows · InnoDB
PK: `FSCode1`, `callCenter`, `RU`

| column | type | null | key |
|---|---|---|---|
| `FSCode1` | varchar(150) | N | PRI |
| `callCenter` | varchar(20) | N | PRI |
| `RU` | varchar(10) | N | PRI |
| `revive` | bit(1) | Y |  |

## `RVInvtyRevive_import_temp`  ·  dimension · ~1,600 rows · InnoDB
PK: `FSCode1`, `callCenter`, `RU`

| column | type | null | key |
|---|---|---|---|
| `FSCode1` | varchar(150) | N | PRI |
| `callCenter` | varchar(20) | N | PRI |
| `RU` | varchar(10) | N | PRI |
| `revive` | bit(1) | Y |  |

## `States`  ·  dimension · ~51 rows · InnoDB
PK: `state`

| column | type | null | key |
|---|---|---|---|
| `state` | varchar(5) | N | PRI |
| `state_name` | varchar(50) | Y | MUL |

## `UniqueCallableZips`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `Zip` | varchar(5) | N |  |

## `affiliate_blocked_subsources`  ·  dimension · ~287 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `Client` | varchar(10) | Y | MUL |
| `Campaign` | varchar(10) | Y |  |
| `SA` | varchar(50) | Y |  |
| `SS` | varchar(50) | Y |  |

## `affiliate_caps`  ·  dimension · ~3 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `dailyLimit` | int | N |  |
| `VT` | varchar(3) | N | MUL |
| `SC` | varchar(3) | N |  |
| `CP` | varchar(10) | N |  |
| `num` | int | N |  |
| `date` | date | N |  |

## `affiliate_live_zips`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `VT` | varchar(5) | N |  |
| `SC` | varchar(25) | N |  |
| `CP` | varchar(20) | N |  |
| `leadType` | varchar(5) | N |  |
| `Zip` | varchar(5) | N |  |
| `effectiveDate` | timestamp | N |  |

## `affiliate_phone_fscode`  ·  dimension · ~2 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `phone` | varchar(12) | N | MUL |
| `FSCode1` | varchar(50) | N | MUL |
| `FSCode2` | varchar(50) | N |  |

## `affiliate_zip_list`  ·  fact · ~1,089,612 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `Vertical` | varchar(5) | N |  |
| `Zip` | varchar(5) | N | MUL |
| `Aff_ID` | varchar(25) | N | MUL |
| `State` | varchar(15) | Y |  |
| `lead_type` | varchar(5) | N |  |
| `campaign` | varchar(20) | N |  |
| `effective_date` | timestamp | N |  |

## `affiliate_zip_list_import_temp`  ·  fact · ~477,994 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `Vertical` | varchar(5) | N |  |
| `Zip` | varchar(5) | N | MUL |
| `Aff_ID` | varchar(25) | N | MUL |
| `State` | varchar(15) | Y |  |
| `lead_type` | varchar(5) | N |  |
| `campaign` | varchar(20) | N |  |
| `effective_date` | timestamp | N |  |

## `affiliates`  ·  dimension · ~42 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `name` | varchar(50) | N |  |
| `code` | varchar(3) | N | MUL |
| `sourceId` | varchar(50) | N |  |
| `active` | tinyint | Y | MUL |

## `app_client_integration_settings`  ·  dimension · ~11 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientId` | int | N | MUL |
| `appType` | varchar(15) | Y |  |
| `capType` | int | N | MUL |
| `typeVal` | varchar(40) | Y | MUL |
| `integrationType` | varchar(15) | N |  |
| `integrationKey` | varchar(125) | N |  |

## `awbpo_active_zips`  ·  dimension · ~2 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientId` | int | N | MUL |
| `zip` | varchar(5) | N |  |

## `awbpo_clients`  ·  dimension · ~4 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientId` | int | Y | MUL |
| `name` | varchar(45) | N |  |
| `phone` | varchar(10) | Y | UNI |
| `address` | varchar(100) | Y |  |
| `city` | varchar(45) | Y |  |
| `state` | varchar(2) | Y |  |
| `zipcode` | varchar(5) | Y |  |
| `website` | varchar(100) | Y |  |
| `detail1` | varchar(255) | Y |  |
| `detail2` | varchar(255) | Y |  |
| `script_detail1` | varchar(255) | Y |  |
| `script_detail2` | varchar(255) | Y |  |
| `script_detail3` | varchar(255) | Y |  |
| `script_detail4` | varchar(255) | Y |  |

## `branding_partners`  ·  dimension · ~5,234 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `VT` | varchar(5) | Y | MUL |
| `company` | varchar(100) | N |  |
| `shortList` | int | N |  |
| `dateAdded` | timestamp | N |  |

## `callcenter_API_log`  ·  fact · ~628,755 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `callcenter` | varchar(20) | N | MUL |
| `VT` | varchar(20) | Y | MUL |
| `url` | varchar(100) | N |  |
| `request` | mediumtext | N |  |
| `response` | mediumtext | N |  |
| `timestamp` | timestamp | N | MUL |

## `callcenter_API_log_arc`  ·  dimension · ~11,772 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `callcenter` | varchar(20) | N | MUL |
| `VT` | varchar(20) | Y | MUL |
| `url` | varchar(100) | N |  |
| `request` | mediumtext | N |  |
| `response` | mediumtext | N |  |
| `timestamp` | timestamp | N | MUL |

## `callcenter_API_setup`  ·  dimension · ~31 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | bigint unsigned | N | PRI |
| `callcenter` | varchar(10) | N | MUL |
| `cluster` | varchar(10) | N |  |
| `vertical` | varchar(2) | N |  |
| `group_key` | int | Y |  |
| `module_key` | varchar(20) | N |  |
| `url` | text | N |  |
| `config` | json | N |  |
| `active_at` | timestamp | Y |  |
| `created_at` | timestamp | Y |  |
| `updated_at` | timestamp | Y |  |

## `callcenter_DIDs`  ·  dimension · ~5,863 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `phone` | varchar(10) | N | UNI |
| `areaCode` | int | N |  |
| `callcenter` | varchar(3) | N |  |
| `vertical` | varchar(3) | N |  |
| `dateAdded` | date | N |  |
| `dateRetired` | date | N |  |

## `callcenter_active_ramp_zips_log`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `cazId` | int | N | MUL |
| `clientId` | int | N | MUL |
| `state` | varchar(2) | N | MUL |
| `area` | varchar(20) | N | MUL |
| `timestamp` | timestamp | N |  |
| `zips` | mediumtext | N |  |

## `callcenter_active_zips`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `vertical` | varchar(5) | N | MUL |
| `zip` | varchar(5) | N | MUL |
| `state` | varchar(20) | N | MUL |
| `area` | varchar(20) | N | MUL |
| `timestamp` | timestamp | N |  |

## `callcenter_active_zips_archive`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `vertical` | varchar(5) | N | MUL |
| `zip` | varchar(5) | N | MUL |
| `state` | varchar(20) | N | MUL |
| `area` | varchar(20) | N | MUL |
| `timestamp` | timestamp | N |  |

## `callcenter_active_zips_log`  ·  dimension · ~15 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `timestamp` | timestamp | N |  |
| `zips` | mediumtext | N |  |

## `callcenter_brandings`  ·  dimension · ~106 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `value` | text | N |  |
| `description` | text | Y |  |
| `brandId` | int | Y | UNI |
| `timestamp` | timestamp | N |  |

## `callcenter_dispos`  ·  dimension · ~159 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `ccCode` | varchar(10) | Y | MUL |
| `callDispo` | varchar(50) | Y | MUL |
| `callDispoExtended` | varchar(80) | Y | MUL |
| `qualified` | tinyint | Y | MUL |
| `revivable` | tinyint | Y | MUL |
| `contact` | tinyint | Y |  |
| `complete` | tinyint | Y |  |
| `sale` | tinyint | Y |  |
| `abandon` | tinyint | Y |  |
| `almostsale` | tinyint | Y |  |
| `lostsale` | tinyint | Y |  |
| `tAtt` | tinyint | Y |  |
| `tAgree` | tinyint | Y |  |
| `tSucc` | tinyint | Y |  |

## `callcenter_market_pause`  ·  dimension · ~22,368 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `constraintId` | int | N |  |
| `type` | varchar(20) | N | MUL |
| `value` | mediumtext | N |  |
| `temporary` | tinyint(1) | N |  |
| `vertical` | varchar(3) | N | MUL |
| `system` | varchar(20) | N |  |
| `filter` | varchar(20) | N | MUL |
| `insertionDate` | timestamp | N |  |
| `removeDate` | timestamp | N | MUL |

## `callcenter_settings`  ·  dimension · ~2 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `field` | varchar(100) | N | MUL |
| `value` | text | N |  |
| `description` | text | Y |  |
| `brandId` | int | Y |  |
| `timestamp` | timestamp | N |  |

## `callcenter_uri_endpoint`  ·  dimension · ~24 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `VT` | varchar(5) | N | MUL |
| `callCenter` | varchar(5) | N | MUL |
| `submissionUrl` | varchar(150) | Y |  |
| `isTest` | tinyint(1) | N |  |

## `callcenter_vertical`  ·  dimension · ~24 rows · InnoDB
PK: `vertical`, `callCenter`

| column | type | null | key |
|---|---|---|---|
| `vertical` | varchar(5) | N | PRI |
| `callCenter` | varchar(5) | N | PRI |
| `keyValue` | varchar(40) | Y | UNI |
| `supportPhone` | varchar(20) | Y |  |
| `supportEmail` | varchar(100) | Y |  |
| `perfectForm` | tinyint | Y |  |
| `silentTransfer` | tinyint | Y |  |

## `callcenter_zip_filters`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `fscode1` | varchar(150) | N |  |
| `zip` | varchar(5) | N |  |
| `callcenterid` | int | N |  |
| `callcenterabbr` | varchar(3) | N |  |
| `campaignid` | varchar(50) | Y |  |
| `listid` | varchar(10) | Y |  |
| `vt` | varchar(20) | Y |  |
| `pd` | varchar(20) | Y |  |
| `ch` | varchar(20) | Y |  |
| `sc` | varchar(20) | Y |  |
| `cp` | varchar(20) | Y |  |
| `split` | tinyint | Y |  |

## `callcenter_zip_filters_dtl`  ·  dimension · ~8,053 rows · InnoDB
PK: `FSCode1`, `callCenterAbbr`, `Zip`

| column | type | null | key |
|---|---|---|---|
| `FSCode1` | varchar(150) | N | PRI |
| `callCenterAbbr` | varchar(3) | N | PRI |
| `Zip` | varchar(5) | N | PRI |

## `callcenter_zip_filters_hdr`  ·  dimension · ~7 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `FSCode1` | varchar(150) | N | MUL |
| `callCenterId` | int | N |  |
| `callCenterAbbr` | varchar(3) | N |  |
| `campaignId` | varchar(50) | Y | MUL |
| `listId` | varchar(10) | Y | MUL |
| `VT` | varchar(20) | Y | MUL |
| `PD` | varchar(20) | Y |  |
| `CH` | varchar(20) | Y |  |
| `SC` | varchar(20) | Y | MUL |
| `CP` | varchar(20) | Y |  |
| `split` | tinyint | Y |  |

## `callcenter_zip_filters_log`  ·  fact · ~1,213,021 rows · InnoDB
PK: `actionID`

| column | type | null | key |
|---|---|---|---|
| `actionID` | int | N | PRI |
| `actionUserID` | int | N |  |
| `actionDate` | timestamp | N |  |
| `ID` | int | N |  |
| `FSCode1` | varchar(40) | N |  |
| `Zip` | varchar(5) | N |  |
| `callCenterId` | int | N |  |
| `callCenterAbbr` | varchar(3) | N |  |

## `cap_types`  ·  dimension · ~3 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `name` | varchar(40) | N |  |
| `priority` | int | N |  |

## `client_CapsLog`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `transferCode` | varchar(30) | N |  |
| `clientid` | int | N | MUL |
| `state` | varchar(5) | N |  |
| `cap_running` | tinyint | N |  |
| `cap_limit` | tinyint | N |  |
| `delivered` | tinyint | N |  |
| `results` | tinyint | N |  |
| `insertionDate` | timestamp | N |  |

## `client_active_zips`  ·  fact · ~472,807 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `ClientID` | int | N | MUL |
| `Zip` | varchar(5) | N | MUL |
| `State` | varchar(2) | N | MUL |
| `County` | varchar(40) | Y |  |
| `Area` | varchar(20) | Y | MUL |
| `Live` | tinyint(1) | N |  |
| `Callable` | tinyint(1) | N | MUL |
| `Target` | tinyint(1) | N |  |
| `Batch` | tinyint | Y | MUL |
| `Brand` | tinyint(1) | N |  |
| `Remarks` | varchar(150) | N |  |
| `activeDate` | varchar(40) | N |  |
| `insertionDate` | timestamp | N |  |

## `client_active_zips_HW_log`  ·  fact · ~380,108 rows · InnoDB
PK: `actionID`

| column | type | null | key |
|---|---|---|---|
| `actionID` | int | N | PRI |
| `actionUserID` | int | N |  |
| `actionDate` | timestamp | N |  |
| `ID` | int | N |  |
| `ClientID` | int | N |  |
| `Zip` | varchar(5) | N |  |
| `State` | varchar(2) | N |  |
| `County` | varchar(40) | Y |  |
| `Market` | varchar(20) | Y |  |
| `Live` | tinyint(1) | N |  |
| `Callable` | tinyint(1) | N |  |
| `Target` | tinyint(1) | N |  |
| `Brand` | tinyint(1) | N |  |
| `Remarks` | varchar(150) | N |  |
| `activeDate` | varchar(40) | N |  |
| `insertionDate` | timestamp | Y |  |

## `client_active_zips_VT`  ·  fact · ~186,869 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `ClientID` | int | N | MUL |
| `Zip` | varchar(5) | N | MUL |
| `State` | varchar(2) | N | MUL |
| `vertical` | varchar(3) | N |  |
| `County` | varchar(40) | Y |  |
| `Market` | varchar(20) | Y | MUL |
| `Live` | tinyint(1) | N |  |
| `Callable` | tinyint(1) | N | MUL |
| `Target` | tinyint(1) | N |  |
| `Brand` | tinyint(1) | N |  |
| `Remarks` | varchar(150) | N |  |
| `activeDate` | varchar(40) | N |  |
| `insertionDate` | timestamp | N |  |

## `client_active_zips_WI`  ·  dimension · ~4,809 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `ClientID` | int | N | MUL |
| `Zip` | varchar(5) | N | MUL |
| `State` | varchar(2) | N | MUL |
| `County` | varchar(40) | Y |  |
| `Market` | varchar(20) | Y | MUL |
| `Live` | tinyint(1) | N |  |
| `Callable` | tinyint(1) | N | MUL |
| `Target` | tinyint(1) | N |  |
| `Brand` | tinyint(1) | N |  |
| `Remarks` | varchar(150) | N |  |
| `activeDate` | varchar(40) | N |  |
| `insertionDate` | timestamp | N |  |

## `client_active_zips_WI_log`  ·  dimension · ~15,100 rows · InnoDB
PK: `actionID`

| column | type | null | key |
|---|---|---|---|
| `actionID` | int | N | PRI |
| `actionUserID` | int | N |  |
| `actionDate` | timestamp | N |  |
| `ID` | int | N |  |
| `ClientID` | int | N |  |
| `Zip` | varchar(5) | N |  |
| `State` | varchar(2) | N |  |
| `County` | varchar(40) | Y |  |
| `Market` | varchar(20) | Y |  |
| `Live` | tinyint(1) | N |  |
| `Callable` | tinyint(1) | N |  |
| `Target` | tinyint(1) | N |  |
| `Brand` | tinyint(1) | N |  |
| `Remarks` | varchar(150) | N |  |
| `activeDate` | varchar(40) | N |  |
| `insertionDate` | timestamp | Y |  |

## `client_active_zips_archive`  ·  fact · ~3,632,736 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `ClientID` | int | N | MUL |
| `Zip` | varchar(5) | N | MUL |
| `State` | varchar(2) | N | MUL |
| `County` | varchar(40) | Y |  |
| `Market` | varchar(20) | Y | MUL |
| `Area` | varchar(20) | Y | MUL |
| `Live` | tinyint(1) | N |  |
| `Callable` | tinyint(1) | N |  |
| `Target` | tinyint(1) | N |  |
| `Batch` | tinyint | Y | MUL |
| `Remarks` | varchar(150) | N |  |
| `activeDate` | varchar(20) | N |  |

## `client_active_zips_import_temp`  ·  dimension · ~4 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `ClientID` | int | N | MUL |
| `Zip` | varchar(5) | N | MUL |
| `State` | varchar(2) | N | MUL |
| `County` | varchar(40) | Y |  |
| `Area` | varchar(20) | Y | MUL |
| `Live` | tinyint(1) | N |  |
| `Callable` | tinyint(1) | N | MUL |
| `Target` | tinyint(1) | N |  |
| `Batch` | tinyint | Y | MUL |
| `Brand` | tinyint(1) | N |  |
| `Remarks` | varchar(150) | N |  |
| `activeDate` | varchar(40) | N |  |
| `insertionDate` | timestamp | N |  |

## `client_active_zips_log`  ·  fact · ~35,270,519 rows · InnoDB
PK: `actionID`

| column | type | null | key |
|---|---|---|---|
| `actionID` | int | N | PRI |
| `actionUserID` | int | N |  |
| `actionDate` | timestamp | N |  |
| `ID` | int | N |  |
| `ClientID` | int | N |  |
| `Zip` | varchar(5) | N | MUL |
| `State` | varchar(2) | N |  |
| `County` | varchar(40) | Y |  |
| `Area` | varchar(20) | Y |  |
| `market` | varchar(20) | Y | MUL |
| `Live` | tinyint(1) | N |  |
| `Callable` | tinyint(1) | N |  |
| `Target` | tinyint(1) | N |  |
| `Batch` | tinyint | Y | MUL |
| `Brand` | tinyint(1) | N |  |
| `Remarks` | varchar(150) | N |  |
| `activeDate` | varchar(40) | N |  |
| `insertionDate` | timestamp | Y |  |

## `client_approved_urls`  ·  dimension · ~550 rows · InnoDB
PK: `clientId`, `url`

| column | type | null | key |
|---|---|---|---|
| `clientId` | int | N | PRI |
| `url` | varchar(255) | N | PRI |
| `startDate` | timestamp | N | MUL |

## `client_bid_static_active_zip`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `ClientID` | int unsigned | N |  |
| `state` | varchar(10) | Y |  |
| `bid` | int | N |  |
| `zip` | varchar(5) | N |  |

## `client_bid_static_ping`  ·  dimension · ~70 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `ClientID` | int unsigned | N |  |
| `state` | varchar(10) | Y |  |
| `bid` | int | N |  |

## `client_blacklist_zip`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `ClientId` | int | N |  |
| `Zip` | varchar(5) | N |  |
| `Reason` | varchar(255) | N |  |
| `Requestor` | varchar(50) | N |  |
| `Notes` | text | N |  |
| `UserID` | int | N |  |
| `timestamp` | timestamp | N |  |

## `client_blacklist_zip_log`  ·  dimension · ~66 rows · InnoDB
PK: `actionID`

| column | type | null | key |
|---|---|---|---|
| `actionID` | int | N | PRI |
| `actionUserID` | int | N |  |
| `actionDate` | timestamp | N |  |
| `ID` | int | N |  |
| `ClientId` | int | N |  |
| `Zip` | varchar(5) | N |  |
| `Reason` | varchar(255) | N |  |
| `Requestor` | varchar(50) | N |  |
| `Notes` | text | N |  |
| `UserID` | int | N |  |
| `timestamp` | datetime | N |  |

## `client_blocked_fscodes`  ·  dimension · ~255 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientId` | int | N | MUL |
| `FSCode1` | varchar(50) | N | UNI |
| `SC` | varchar(5) | N | MUL |
| `CP` | varchar(10) | N | MUL |
| `approved` | tinyint(1) | N | MUL |
| `startDate` | date | N |  |

## `client_budgets`  ·  dimension · ~2,864 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientId` | int | N | MUL |
| `budgetType` | tinyint | Y |  |
| `term` | varchar(20) | Y |  |
| `budgetVolume` | int | N |  |
| `budgetVolumeCushion` | int | N |  |
| `budgetSpend` | decimal(9,2) | N |  |
| `budgetSpendCushion` | decimal(9,2) | N |  |
| `state` | varchar(2) | Y |  |
| `area` | varchar(100) | Y |  |
| `startDate` | date | N | MUL |
| `endDate` | date | Y | MUL |
| `last_userid` | varchar(100) | Y |  |
| `lastUpdate` | timestamp | N |  |

## `client_filters`  ·  dimension · ~8 rows · InnoDB
PK: `filter`

| column | type | null | key |
|---|---|---|---|
| `filter` | tinyint | N | PRI |
| `filter_value` | varchar(30) | N |  |
| `filter_desc` | varchar(60) | Y |  |

## `client_lead_contract`  ·  dimension · ~9 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientID` | int | N | MUL |
| `product` | char(1) | N | MUL |
| `frequency` | char(1) | N |  |
| `volume` | int | Y |  |
| `volumeCap` | int | Y |  |
| `spend` | decimal(9,2) | Y |  |
| `state` | varchar(2) | Y | MUL |
| `area` | varchar(20) | Y | MUL |
| `startDate` | date | N | MUL |
| `endDate` | date | Y | MUL |
| `owner` | varchar(100) | Y |  |
| `userid` | varchar(100) | Y |  |
| `lastUpdate` | timestamp | N |  |

## `client_lead_prices`  ·  dimension · ~1,466 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientId` | int | N | MUL |
| `state` | varchar(2) | Y | MUL |
| `area` | varchar(20) | Y | MUL |
| `callDispo` | varchar(50) | Y | MUL |
| `callDispoExtended` | varchar(80) | Y | MUL |
| `leadPrice` | decimal(6,2) | N |  |
| `scrub` | decimal(6,3) | Y |  |
| `uSet` | tinyint | Y |  |
| `uIssue` | tinyint | Y |  |
| `uDemo` | tinyint | Y |  |
| `uGrossSale` | tinyint | Y |  |
| `uNetSale` | tinyint | Y |  |
| `startDate` | date | N |  |
| `endDate` | date | Y |  |

## `client_lead_type`  ·  dimension · ~2 rows · InnoDB
PK: `leadType`

| column | type | null | key |
|---|---|---|---|
| `leadType` | int | N | PRI |
| `type_value` | varchar(20) | Y |  |

## `client_live_zips`  ·  fact · ~539,352 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `ClientId` | int | N | MUL |
| `Zip` | varchar(5) | N | MUL |
| `State` | varchar(2) | N | MUL |
| `County` | varchar(40) | Y |  |
| `Area` | varchar(20) | Y | MUL |
| `Live` | tinyint | N | MUL |
| `Callable` | tinyint | N |  |
| `Target` | tinyint | N |  |
| `Batch` | tinyint | Y | MUL |
| `Remarks` | varchar(150) | N |  |
| `activeDate` | date | N |  |
| `lastUsed` | date | N | MUL |

## `client_live_zips_log`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `whitelist` | mediumtext | N |  |
| `throttle` | mediumtext | N |  |
| `throttleQuery` | mediumtext | N |  |
| `insertionDate` | timestamp | N |  |

## `client_live_zips_staging`  ·  dimension · ~0 rows · InnoDB
PK: `ClientId`, `Zip`, `State`

| column | type | null | key |
|---|---|---|---|
| `ClientId` | int | N | PRI |
| `Zip` | varchar(5) | N | PRI |
| `State` | varchar(2) | N | PRI |
| `County` | varchar(40) | Y |  |
| `Area` | varchar(20) | Y |  |
| `market` | varchar(20) | Y | MUL |
| `Live` | tinyint | Y |  |
| `Callable` | tinyint | Y |  |
| `Target` | tinyint | Y |  |
| `Batch` | tinyint | Y | MUL |
| `Remarks` | varchar(150) | Y |  |
| `activeDate` | date | Y |  |
| `lastUsed` | date | Y |  |

## `client_live_zips_staging_log`  ·  dimension · ~42,305 rows · InnoDB
PK: `ClientId`, `Zip`, `State`, `runDate`

| column | type | null | key |
|---|---|---|---|
| `ClientId` | int | N | PRI |
| `Zip` | varchar(5) | N | PRI |
| `State` | varchar(2) | N | PRI |
| `County` | varchar(40) | Y |  |
| `Area` | varchar(20) | Y |  |
| `market` | varchar(20) | Y | MUL |
| `Live` | tinyint | Y |  |
| `Callable` | tinyint | Y |  |
| `Target` | tinyint | Y |  |
| `Batch` | tinyint | Y | MUL |
| `Remarks` | varchar(150) | Y |  |
| `activeDate` | date | Y |  |
| `lastUsed` | date | Y |  |
| `runDate` | datetime | N | PRI |

## `client_live_zips_staging_log_arc`  ·  fact · ~2,829,770 rows · InnoDB
PK: `ClientId`, `Zip`, `State`, `runDate`

| column | type | null | key |
|---|---|---|---|
| `ClientId` | int | N | PRI |
| `Zip` | varchar(5) | N | PRI |
| `State` | varchar(2) | N | PRI |
| `County` | varchar(40) | Y |  |
| `Area` | varchar(20) | Y |  |
| `market` | varchar(20) | Y | MUL |
| `Live` | tinyint | Y |  |
| `Callable` | tinyint | Y |  |
| `Target` | tinyint | Y |  |
| `Batch` | tinyint | Y | MUL |
| `Remarks` | varchar(150) | Y |  |
| `activeDate` | date | Y |  |
| `lastUsed` | date | Y |  |
| `runDate` | datetime | N | PRI |

## `client_market_caps`  ·  dimension · ~193 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientId` | int | N | MUL |
| `state` | varchar(2) | N | MUL |
| `area` | varchar(30) | N | MUL |
| `ramp` | int | N |  |
| `rampStartTime` | datetime | N |  |
| `throttle` | decimal(10,3) | N |  |
| `dailyCap` | int | N | MUL |
| `weeklyCap` | int | N |  |
| `lastNotified` | datetime | N | MUL |
| `notifyLeadId` | varchar(25) | N |  |
| `logged` | varchar(2) | Y | MUL |
| `meridiusDate` | date | Y | MUL |

## `client_market_caps_HW`  ·  dimension · ~2 rows · InnoDB
PK: `clientId`

| column | type | null | key |
|---|---|---|---|
| `clientId` | int | N | PRI |
| `dailyCap` | int | N |  |
| `dailyHardCap` | int | N |  |

## `client_market_caps_arc`  ·  dimension · ~2,698 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `runDate` | date | N | MUL |
| `clientId` | int | N | MUL |
| `state` | varchar(2) | N | MUL |
| `area` | varchar(30) | N | MUL |
| `ramp` | int | N |  |
| `rampStartTime` | datetime | N |  |
| `throttle` | decimal(10,3) | N |  |
| `dailyCap` | int | N | MUL |
| `weeklyCap` | int | N |  |
| `lastNotified` | datetime | N | MUL |
| `notifyLeadId` | varchar(25) | N |  |
| `logged` | varchar(2) | Y | MUL |
| `meridiusDate` | date | Y | MUL |

## `client_market_caps_hist`  ·  fact · ~239,469 rows · InnoDB
PK: `ID`, `clientId`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientId` | int | N | PRI |
| `state` | varchar(2) | N | MUL |
| `area` | varchar(30) | N | MUL |
| `throttle` | decimal(10,3) | N |  |
| `dailyCap` | int | N | MUL |
| `weeklyCap` | int | N |  |
| `capReached` | tinyint | Y | MUL |
| `lastNotified` | datetime | Y | MUL |
| `loggedOn` | timestamp | Y | MUL |
| `logged` | varchar(2) | Y | MUL |

## `client_market_caps_import_temp`  ·  dimension · ~191 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientId` | int | N | MUL |
| `state` | varchar(2) | N | MUL |
| `area` | varchar(30) | N | MUL |
| `ramp` | int | N |  |
| `rampStartTime` | datetime | N |  |
| `throttle` | decimal(10,3) | N |  |
| `dailyCap` | int | N | MUL |
| `weeklyCap` | int | N |  |
| `lastNotified` | datetime | N | MUL |
| `notifyLeadId` | varchar(25) | N |  |
| `logged` | varchar(2) | Y | MUL |

## `client_market_caps_throttle_log`  ·  fact · ~174,545 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientId` | int | N | MUL |
| `state` | varchar(2) | N | MUL |
| `area` | varchar(20) | Y |  |
| `throttle` | decimal(10,3) | N |  |
| `oldThrottle` | decimal(10,3) | N |  |
| `userid` | varchar(100) | Y | MUL |
| `lastUpdate` | timestamp | Y | MUL |
| `applied` | tinyint | Y | MUL |
| `appliedOn` | timestamp | Y | MUL |

## `client_price_types`  ·  dimension · ~44 rows · InnoDB
PK: `leadType`

| column | type | null | key |
|---|---|---|---|
| `leadType` | int | N | PRI |
| `typeName` | varchar(80) | Y | MUL |

## `client_return_rules_mapping`  ·  dimension · ~142 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `MasterID` | int | N |  |
| `MasterReason` | varchar(150) | N |  |
| `ReturnPortalReason` | varchar(150) | N |  |
| `ClientID` | int | N |  |
| `ClientName` | varchar(50) | N |  |
| `ClientIOName` | varchar(50) | N |  |
| `ClientReturnReason` | varchar(50) | N |  |
| `Billable` | tinyint(1) | N |  |

## `client_time_test`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `clientName` | int | N |  |
| `clientNotes` | int | N |  |
| `vertical` | int | N |  |
| `type` | int | N |  |
| `branding` | int | N |  |
| `clientCode` | int | N |  |
| `LeadConduitCode` | int | N |  |
| `acceptRate` | int | N |  |
| `disputableReturns` | int | N |  |
| `transferCode` | int | N |  |
| `transferPhone` | int | N |  |
| `transferDays` | int | N |  |
| `transferStartHour` | int | N |  |
| `transferEndHour` | int | N |  |
| `openMarket` | int | N |  |
| `openState` | int | N |  |
| `officeTime` | int | N |  |
| `officeTimeDelay` | int | N |  |
| `transferStartHourTime` | int | N |  |
| `transferEndHourTime` | int | N |  |

## `client_type`  ·  dimension · ~2 rows · InnoDB
PK: `type`

| column | type | null | key |
|---|---|---|---|
| `type` | tinyint | N | PRI |
| `type_desc` | varchar(20) | N |  |

## `client_vertical`  ·  dimension · ~12 rows · InnoDB
PK: `vertical`

| column | type | null | key |
|---|---|---|---|
| `vertical` | varchar(5) | N | PRI |
| `vt_desc` | varchar(40) | N |  |
| `priority` | tinyint | Y | MUL |
| `tier` | tinyint | Y | MUL |

## `client_zip_branding`  ·  fact · ~203,825 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `zip` | varchar(5) | N | MUL |
| `state` | varchar(3) | N |  |
| `brandId` | int | N | MUL |
| `VT` | varchar(5) | Y | MUL |
| `clientId` | int | N | MUL |
| `client1` | int | N |  |
| `client2` | int | N |  |
| `client3` | int | N |  |
| `client4` | int | Y |  |

## `client_zip_branding_backup_041625`  ·  fact · ~292,978 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `zip` | varchar(5) | N |  |
| `state` | varchar(3) | N |  |
| `brandId` | int | N |  |
| `VT` | varchar(5) | Y |  |
| `clientId` | int | N |  |
| `client1` | int | N |  |
| `client2` | int | N |  |
| `client3` | int | N |  |
| `client4` | int | Y |  |

## `client_zip_branding_import_temp`  ·  fact · ~83,371 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `zip` | varchar(5) | N | MUL |
| `state` | varchar(3) | N |  |
| `brandId` | int | N | MUL |
| `VT` | varchar(5) | Y | MUL |
| `clientId` | int | N | MUL |
| `client1` | int | N |  |
| `client2` | int | N |  |
| `client3` | int | N |  |
| `client4` | int | Y |  |

## `client_zip_branding_import_temp_02`  ·  fact · ~68,380 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `zip` | varchar(5) | N |  |
| `state` | varchar(3) | N |  |
| `brandId` | int | N |  |
| `VT` | varchar(5) | Y |  |
| `clientId` | int | N |  |
| `client1` | int | N |  |
| `client2` | int | N |  |
| `client3` | int | N |  |
| `client4` | int | Y |  |

## `client_zip_redirection`  ·  dimension · ~887 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `zip` | varchar(5) | N | MUL |
| `fromClient` | int | N | MUL |
| `toClient` | int | N |  |
| `callDispo` | varchar(20) | N | MUL |

## `clients`  ·  dimension · ~480 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientName` | varchar(255) | Y |  |
| `clientNotes` | varchar(255) | N |  |
| `vertical` | varchar(5) | N |  |
| `type` | varchar(20) | Y |  |
| `leadType` | int | Y |  |
| `ownerUserId` | varchar(100) | Y | MUL |
| `branding` | varchar(50) | Y |  |
| `auditRate` | int | N |  |
| `clientCode` | varchar(20) | Y |  |
| `LeadConduitCode` | varchar(50) | N |  |
| `clientThrottle` | decimal(10,3) | N |  |
| `acceptRate` | decimal(10,3) | Y |  |
| `disputableReturns` | int | N |  |
| `filters` | tinyint | Y |  |
| `silentTransfer` | tinyint | Y |  |
| `transferCode` | varchar(20) | Y | MUL |
| `transferPhone` | varchar(12) | N |  |
| `transferDays` | varchar(150) | N |  |
| `transferStartHour` | time | N |  |
| `transferEndHour` | time | N |  |
| `calendar` | longtext | Y |  |
| `active` | tinyint | Y | MUL |
| `defaultIBModuleId` | varchar(20) | Y |  |
| `defaultOBModuleId` | varchar(20) | Y |  |

## `clients_archive`  ·  dimension · ~26 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientName` | varchar(50) | Y |  |
| `clientNotes` | varchar(100) | N |  |
| `vertical` | varchar(5) | N | MUL |
| `type` | varchar(20) | Y |  |
| `branding` | varchar(50) | Y |  |
| `auditRate` | int | N |  |
| `clientCode` | varchar(20) | Y |  |
| `LeadConduitCode` | varchar(20) | N |  |
| `clientThrottle` | decimal(10,3) | N |  |
| `acceptRate` | decimal(10,3) | Y |  |
| `disputableReturns` | int | N |  |
| `transferCode` | varchar(20) | Y |  |
| `transferPhone` | varchar(12) | N |  |
| `transferDays` | varchar(100) | N |  |
| `transferStartHour` | time | N |  |
| `transferEndHour` | time | N |  |

## `clients_open`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `clientName` | varchar(255) | Y |  |
| `clientNotes` | varchar(255) | N |  |
| `vertical` | varchar(5) | N |  |
| `type` | varchar(20) | Y |  |
| `branding` | varchar(50) | Y |  |
| `clientCode` | varchar(20) | Y |  |
| `LeadConduitCode` | varchar(50) | N |  |
| `acceptRate` | decimal(10,3) | Y |  |
| `disputableReturns` | int | N |  |
| `transferCode` | varchar(20) | Y |  |
| `transferPhone` | varchar(12) | N |  |
| `transferDays` | varchar(150) | N |  |
| `transferStartHour` | time | N |  |
| `transferEndHour` | time | N |  |
| `openMarket` | int | Y |  |
| `openState` | int | Y |  |
| `officeTime` | time | Y |  |
| `transferStartHourTime` | time | Y |  |
| `transferEndHourTime` | time | Y |  |
| `clientOpen` | int | Y |  |

## `clients_per_zip`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `Zip` | varchar(5) | N |  |
| `State` | varchar(2) | N |  |
| `Market` | char(0) | N |  |
| `area` | varchar(20) | Y |  |
| `ClientId` | int | N |  |
| `Otherclients` | longtext | N |  |
| `numOtherClients` | decimal(11,0) | N |  |
| `Client0` | int | N |  |
| `Client1` | longtext | Y |  |
| `Client2` | longtext | Y |  |
| `Client3` | longtext | Y |  |
| `Client4` | longtext | Y |  |
| `Client5` | longtext | Y |  |
| `VT` | varchar(5) | N |  |

## `clients_phone`  ·  dimension · ~112 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientID` | int | N | MUL |
| `phone` | varchar(12) | N | MUL |
| `phoneName` | varchar(50) | Y |  |
| `days` | varchar(150) | N |  |
| `state` | text | N |  |
| `area` | text | Y |  |
| `startHour` | time | N | MUL |
| `endHour` | time | N | MUL |

## `clients_time`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `clientName` | varchar(255) | Y |  |
| `clientNotes` | varchar(255) | N |  |
| `vertical` | varchar(5) | N |  |
| `type` | varchar(20) | Y |  |
| `branding` | varchar(50) | Y |  |
| `clientCode` | varchar(20) | Y |  |
| `LeadConduitCode` | varchar(50) | N |  |
| `acceptRate` | decimal(10,3) | Y |  |
| `disputableReturns` | int | N |  |
| `transferCode` | varchar(20) | Y |  |
| `transferPhone` | varchar(12) | N |  |
| `transferDays` | varchar(150) | N |  |
| `transferStartHour` | time | N |  |
| `transferEndHour` | time | N |  |
| `openMarket` | int | Y |  |
| `openState` | int | Y |  |
| `officeTime` | time | Y |  |
| `officeTimeDelay` | time | Y |  |
| `transferStartHourTime` | time | Y |  |
| `transferEndHourTime` | time | Y |  |

## `clients_time_open`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `clientName` | varchar(255) | Y |  |
| `clientNotes` | varchar(255) | N |  |
| `vertical` | varchar(5) | N |  |
| `type` | varchar(20) | Y |  |
| `branding` | varchar(50) | Y |  |
| `clientCode` | varchar(20) | Y |  |
| `LeadConduitCode` | varchar(50) | N |  |
| `acceptRate` | decimal(10,3) | Y |  |
| `disputableReturns` | int | N |  |
| `transferCode` | varchar(20) | Y |  |
| `transferPhone` | varchar(12) | N |  |
| `transferDays` | varchar(150) | N |  |
| `transferStartHour` | time | N |  |
| `transferEndHour` | time | N |  |
| `openMarket` | int | Y |  |
| `openState` | int | Y |  |
| `officeTime` | time | Y |  |
| `transferStartHourTime` | time | Y |  |
| `transferEndHourTime` | time | Y |  |
| `clientOpen` | int | Y |  |

## `clients_time_open_test`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `clientName` | int | N |  |
| `clientNotes` | int | N |  |
| `vertical` | int | N |  |
| `type` | int | N |  |
| `branding` | int | N |  |
| `clientCode` | int | N |  |
| `LeadConduitCode` | int | N |  |
| `acceptRate` | int | N |  |
| `disputableReturns` | int | N |  |
| `transferCode` | int | N |  |
| `transferPhone` | int | N |  |
| `transferDays` | int | N |  |
| `transferStartHour` | int | N |  |
| `transferEndHour` | int | N |  |
| `openMarket` | int | N |  |
| `openState` | int | N |  |
| `officeTime` | int | N |  |
| `transferStartHourTime` | int | N |  |
| `transferEndHourTime` | int | N |  |
| `clientOpen` | int | N |  |

## `clients_time_test`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `clientName` | int | N |  |
| `clientNotes` | int | N |  |
| `vertical` | int | N |  |
| `type` | int | N |  |
| `branding` | int | N |  |
| `clientCode` | int | N |  |
| `LeadConduitCode` | int | N |  |
| `acceptRate` | int | N |  |
| `disputableReturns` | int | N |  |
| `transferCode` | int | N |  |
| `transferPhone` | int | N |  |
| `transferDays` | int | N |  |
| `transferStartHour` | int | N |  |
| `transferEndHour` | int | N |  |
| `openMarket` | int | N |  |
| `openState` | int | N |  |
| `officeTime` | int | N |  |
| `officeTimeDelay` | int | N |  |
| `transferStartHourTime` | int | N |  |
| `transferEndHourTime` | int | N |  |

## `cost_per_record`  ·  dimension · ~359 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `VT` | varchar(20) | Y | MUL |
| `PD` | varchar(20) | Y |  |
| `CH` | varchar(20) | Y |  |
| `SC` | varchar(20) | Y |  |
| `CP` | varchar(20) | Y |  |
| `price` | decimal(6,3) | N |  |
| `start_date` | timestamp | Y |  |
| `end_date` | timestamp | Y |  |

## `cpl_ping_values`  ·  dimension · ~20,606 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `leadType` | varchar(5) | Y |  |
| `state` | varchar(3) | Y |  |
| `region` | varchar(15) | Y |  |
| `county` | varchar(40) | Y |  |
| `zip` | varchar(5) | Y | MUL |
| `client` | varchar(20) | Y |  |
| `frpl` | decimal(10,2) | Y |  |
| `clientCode` | varchar(10) | Y |  |
| `frplLow` | decimal(10,2) | N |  |

## `debt_amount`  ·  dimension · ~32 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `debt` | varchar(50) | N | MUL |
| `amount` | int | N |  |
| `isActive` | tinyint(1) | N |  |
| `insertionDate` | timestamp | N |  |

## `distribution_maxAttempts`  ·  dimension · ~3,123 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `CC` | varchar(3) | N | MUL |
| `VT` | varchar(5) | N | MUL |
| `SC` | varchar(5) | N | MUL |
| `CP` | varchar(5) | N | MUL |
| `state` | varchar(3) | N | MUL |
| `RU` | varchar(3) | N | MUL |
| `freshMaxAttempts` | int | N |  |
| `freshExpireDays` | int | N |  |

## `distribution_maxAttempts_import_temp`  ·  dimension · ~3,123 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `CC` | varchar(3) | N | MUL |
| `VT` | varchar(5) | N | MUL |
| `SC` | varchar(5) | N | MUL |
| `CP` | varchar(5) | N | MUL |
| `state` | varchar(3) | N | MUL |
| `RU` | varchar(3) | N | MUL |
| `freshMaxAttempts` | int | N |  |
| `freshExpireDays` | int | N |  |

## `distribution_maxAttempts_v2_import_temp`  ·  dimension · ~212 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `CC` | varchar(3) | N | MUL |
| `VT` | varchar(5) | N | MUL |
| `SC` | varchar(5) | N | MUL |
| `CP` | varchar(5) | N | MUL |
| `state` | varchar(3) | N | MUL |
| `RU` | varchar(3) | N | MUL |
| `freshMaxAttempts` | int | N |  |
| `freshExpireDays` | int | N |  |

## `distribution_settings`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `QANumLimit` | int | N |  |
| `QANumLimitDays` | int | N |  |
| `updateTime` | timestamp | N |  |

## `dynamic_utility_providers`  ·  fact · ~2,099,533 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `Zip` | varchar(5) | N | MUL |
| `Provider` | varchar(150) | N |  |
| `Utility Bill` | varchar(15) | N |  |
| `Low Bill` | int | N |  |

## `external_zips`  ·  dimension · ~0 rows · InnoDB
PK: `zip`, `origin`

| column | type | null | key |
|---|---|---|---|
| `origin` | varchar(5) | N | PRI |
| `zip` | varchar(15) | N | PRI |
| `updatedOn` | timestamp | Y |  |

## `fsdb_events_log`  ·  dimension · ~207 rows · InnoDB
PK: `eventName`, `eventStart`

| column | type | null | key |
|---|---|---|---|
| `eventName` | varchar(150) | N | PRI |
| `eventStart` | timestamp | N | PRI |
| `eventEnd` | timestamp | Y | MUL |
| `userId` | varchar(100) | Y |  |
| `params` | varchar(40) | Y |  |

## `manually_paused_areas`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `constraintId` | int | N |  |
| `type` | varchar(20) | N |  |
| `value` | mediumtext | N |  |
| `temporary` | tinyint(1) | N |  |
| `vertical` | varchar(3) | N |  |
| `system` | varchar(20) | N |  |
| `filter` | varchar(20) | N |  |
| `insertionDate` | timestamp | N |  |
| `removeDate` | timestamp | N |  |

## `master_US_zip_list`  ·  dimension · ~42,778 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `zip` | varchar(5) | N | UNI |
| `type` | varchar(100) | N |  |
| `primary_city` | varchar(100) | N |  |
| `acceptable_cities` | varchar(254) | N |  |
| `county` | varchar(100) | N | MUL |
| `state` | varchar(5) | N | MUL |
| `market` | varchar(20) | N | MUL |
| `utility_provider` | varchar(100) | N |  |
| `time_zone` | varchar(20) | N |  |
| `appr_time_zone` | varchar(20) | N |  |
| `utc_offset` | varchar(15) | Y |  |
| `utc_offset_dst` | varchar(15) | Y |  |

## `perfect_form_content`  ·  dimension · ~1 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `phone` | varchar(15) | Y | MUL |
| `email` | varchar(100) | Y | MUL |
| `sms_content` | text | Y |  |
| `email_subject` | varchar(50) | Y | MUL |
| `email_content` | text | Y |  |
| `insertionDate` | timestamp | Y | MUL |

## `process`  ·  dimension · ~62 rows · InnoDB
PK: `ProcessId`

| column | type | null | key |
|---|---|---|---|
| `ProcessId` | int | N | PRI |
| `ProcessName` | varchar(50) | N |  |
| `Details` | varchar(255) | Y |  |
| `ProcessGroup` | varchar(50) | Y | MUL |
| `active` | tinyint | Y | MUL |

## `process_assignments`  ·  fact · ~132,239 rows · InnoDB
PK: `OLeadId`, `RA`

| column | type | null | key |
|---|---|---|---|
| `ProcessId` | int | N |  |
| `OLeadId` | varchar(40) | N | PRI |
| `RA` | varchar(5) | N | PRI |
| `clientId` | int | N |  |
| `VT` | varchar(5) | Y | MUL |
| `filterId` | int | Y |  |
| `timestamp` | timestamp | Y | MUL |

## `process_dispos`  ·  dimension · ~67 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `callDispo` | varchar(40) | Y | MUL |
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

## `process_dispos_20250317`  ·  dimension · ~44 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `callDispo` | varchar(40) | Y | MUL |
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

## `process_filters`  ·  dimension · ~22 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `VTO` | varchar(5) | Y |  |
| `VT` | varchar(5) | Y | MUL |
| `PD` | varchar(20) | Y |  |
| `CH` | varchar(20) | Y |  |
| `SC` | varchar(20) | Y |  |
| `CP` | varchar(20) | Y |  |
| `State` | varchar(2) | Y | MUL |
| `callDispo` | varchar(40) | Y | MUL |
| `callDispoExt` | varchar(80) | Y |  |
| `clientId` | int | Y |  |
| `RA` | varchar(5) | Y | MUL |
| `ProcessId` | int | Y | MUL |
| `split` | int | Y |  |
| `OLeadId` | varchar(40) | Y | MUL |
| `ModuleId` | varchar(20) | Y | MUL |
| `results` | longtext | Y |  |

## `process_filters_arc`  ·  dimension · ~97 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `VTO` | varchar(5) | Y |  |
| `VT` | varchar(5) | Y | MUL |
| `PD` | varchar(20) | Y |  |
| `CH` | varchar(20) | Y |  |
| `SC` | varchar(20) | Y |  |
| `CP` | varchar(20) | Y |  |
| `State` | varchar(2) | Y | MUL |
| `callDispo` | varchar(40) | Y | MUL |
| `callDispoExt` | varchar(80) | Y |  |
| `clientId` | int | Y |  |
| `RA` | varchar(5) | Y | MUL |
| `ProcessId` | int | Y | MUL |
| `split` | int | Y |  |
| `OLeadId` | varchar(40) | Y | MUL |
| `ModuleId` | varchar(20) | Y | MUL |
| `results` | longtext | Y |  |

## `process_log`  ·  fact · ~1,486,170 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadId` | varchar(40) | N | MUL |
| `RA` | varchar(5) | Y | MUL |
| `ProcessId` | int | Y | MUL |
| `SequenceNo` | smallint | Y |  |
| `ModuleId` | varchar(20) | Y |  |
| `interactionId` | varchar(80) | Y |  |
| `results` | longtext | Y |  |
| `callDispo` | varchar(40) | Y | MUL |
| `callDispoExt` | varchar(80) | Y |  |
| `timestamp` | timestamp | N | MUL |
| `logTimestamp` | timestamp | Y | MUL |

## `process_methods`  ·  dimension · ~4 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `ProcessName` | varchar(20) | N |  |

## `process_modules`  ·  dimension · ~115 rows · InnoDB
PK: `Method`, `Goal`, `Version`

| column | type | null | key |
|---|---|---|---|
| `ModuleId` | varchar(50) | Y | MUL |
| `CHAUId` | varchar(50) | N |  |
| `Method` | int | N | PRI |
| `Goal` | varchar(20) | N | PRI |
| `Version` | int | N | PRI |
| `delay` | int | Y |  |
| `timeOfDay` | time | Y |  |
| `weekDayOnly` | tinyint | Y |  |
| `timeout` | int | Y |  |
| `clientId` | int | Y | MUL |
| `VT` | varchar(5) | Y |  |
| `content` | text | Y |  |

## `process_reserve_rules`  ·  dimension · ~38 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `VTO` | varchar(5) | Y |  |
| `VT` | varchar(5) | Y | MUL |
| `PD` | varchar(20) | Y |  |
| `CH` | varchar(20) | Y |  |
| `SC` | varchar(20) | Y |  |
| `CP` | varchar(20) | Y |  |
| `State` | varchar(2) | Y | MUL |
| `callDispo` | varchar(40) | Y | MUL |
| `callDispoExtended` | varchar(80) | Y |  |
| `clientId` | int | Y |  |
| `RA` | varchar(5) | Y | MUL |
| `ProcessId` | int | Y | MUL |
| `RestDays` | int | Y |  |
| `Active` | tinyint | Y |  |

## `process_steps`  ·  dimension · ~2,050 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `ProcessId` | int | N | MUL |
| `SequenceNo` | smallint | N |  |
| `ModuleId` | varchar(20) | N |  |

## `ramp_periods`  ·  dimension · ~14 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `name` | varchar(30) | N |  |
| `value` | int | N |  |
| `priority` | int | N |  |

## `return_rules`  ·  dimension · ~44 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `ReturnReason` | varchar(150) | N |  |
| `InitialAction` | varchar(50) | N |  |
| `DistributionAction` | varchar(50) | N |  |
| `Destination` | varchar(20) | N |  |
| `ReuseType` | varchar(20) | N |  |

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

## `revShareRank`  ·  dimension · ~5 rows · InnoDB
PK: `revRank`

| column | type | null | key |
|---|---|---|---|
| `revName` | varchar(30) | N |  |
| `revRank` | tinyint | N | PRI |

## `revive_batch_builder_config_runs`  ·  dimension · ~480 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | bigint unsigned | N | PRI |
| `config_id` | bigint unsigned | Y | MUL |
| `log_id` | bigint unsigned | Y | MUL |
| `status` | varchar(20) | N | MUL |
| `started_at` | timestamp | Y |  |
| `finished_at` | timestamp | Y |  |
| `error_message` | text | Y |  |
| `batch_id` | varchar(255) | Y |  |
| `request_json` | longtext | Y |  |
| `setting_json` | longtext | Y |  |
| `created_at` | timestamp | Y |  |
| `updated_at` | timestamp | Y |  |

## `revive_batch_builder_configs`  ·  dimension · ~83 rows · InnoDB
PK: `id`

| column | type | null | key |
|---|---|---|---|
| `id` | bigint unsigned | N | PRI |
| `name` | varchar(255) | Y |  |
| `description` | text | Y |  |
| `is_active` | tinyint(1) | N | MUL |
| `priority` | int | N |  |
| `static_user_id` | bigint unsigned | Y | MUL |
| `request_json` | longtext | N |  |
| `setting_json` | longtext | Y |  |
| `lock_until` | timestamp | Y | MUL |
| `lock_owner` | varchar(255) | Y |  |
| `last_run_at` | timestamp | Y |  |
| `last_status` | varchar(20) | Y |  |
| `last_error` | text | Y |  |
| `last_log_id` | bigint unsigned | Y |  |
| `completed_cycle_at` | timestamp | Y |  |
| `created_at` | timestamp | N |  |
| `updated_at` | timestamp | N |  |

## `sms_content`  ·  dimension · ~13 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `content` | varchar(255) | N |  |
| `active` | tinyint | N |  |
| `lastUsed` | timestamp | N |  |

## `sms_phone`  ·  dimension · ~13 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `phone` | varchar(11) | N |  |
| `smsgroup` | varchar(50) | N |  |
| `state` | varchar(2) | N | MUL |
| `area` | varchar(40) | N | MUL |
| `active` | tinyint | N |  |
| `lastUsed` | timestamp | N |  |

## `sms_series`  ·  dimension · ~12 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `series` | varchar(50) | N |  |
| `active` | tinyint | N |  |
| `lastUsed` | timestamp | N |  |

## `solar_partners`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `company` | varchar(100) | N |  |
| `shortList` | int | N |  |
| `dateAdded` | timestamp | N |  |

## `solar_partners_watermark`  ·  dimension · ~3 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `name` | varchar(255) | N |  |
| `content` | varchar(255) | N |  |
| `size` | int | Y |  |
| `opacity` | int | Y |  |

## `solar_state_market`  ·  dimension · ~81 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `State` | varchar(2) | N | MUL |
| `Area` | varchar(20) | N | MUL |

## `spzztmp_client_active_zips_market`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `ID` | int | Y | MUL |
| `ClientID` | int | Y |  |
| `Zip` | varchar(5) | Y |  |
| `State` | varchar(2) | Y |  |
| `County` | varchar(40) | Y |  |
| `Market` | varchar(20) | Y |  |
| `Area` | varchar(20) | Y | MUL |
| `Live` | tinyint(1) | Y |  |
| `Callable` | tinyint(1) | Y |  |
| `Target` | tinyint(1) | Y |  |
| `Batch` | tinyint | Y | MUL |
| `Brand` | tinyint(1) | Y |  |
| `Remarks` | varchar(150) | Y |  |
| `activeDate` | varchar(40) | Y |  |
| `insertionDate` | timestamp | Y |  |
| `lastUsed` | date | Y |  |

## `spzztmp_client_active_zips_overall`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `ID` | int | Y | MUL |
| `ClientID` | int | Y |  |
| `Zip` | varchar(5) | Y |  |
| `State` | varchar(2) | Y |  |
| `County` | varchar(40) | Y |  |
| `Market` | varchar(20) | Y |  |
| `Area` | varchar(20) | Y | MUL |
| `Live` | tinyint(1) | Y |  |
| `Callable` | tinyint(1) | Y |  |
| `Target` | tinyint(1) | Y |  |
| `Batch` | tinyint | Y | MUL |
| `Brand` | tinyint(1) | Y |  |
| `Remarks` | varchar(150) | Y |  |
| `activeDate` | varchar(40) | Y |  |
| `insertionDate` | timestamp | Y |  |
| `lastUsed` | date | Y |  |

## `spzztmp_client_active_zips_state`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `ID` | int | Y | MUL |
| `ClientID` | int | Y |  |
| `Zip` | varchar(5) | Y |  |
| `State` | varchar(2) | Y |  |
| `County` | varchar(40) | Y |  |
| `Market` | varchar(20) | Y |  |
| `Area` | varchar(20) | Y | MUL |
| `Live` | tinyint(1) | Y |  |
| `Callable` | tinyint(1) | Y |  |
| `Target` | tinyint(1) | Y |  |
| `Batch` | tinyint | Y | MUL |
| `Brand` | tinyint(1) | Y |  |
| `Remarks` | varchar(150) | Y |  |
| `activeDate` | varchar(40) | Y |  |
| `insertionDate` | timestamp | Y |  |
| `lastUsed` | date | Y |  |

## `spzztmp_clzips_market_staging`  ·  dimension · ~0 rows · InnoDB
PK: `ClientId`, `Zip`, `State`, `Callable`

| column | type | null | key |
|---|---|---|---|
| `ClientId` | int | N | PRI |
| `Zip` | varchar(5) | N | PRI |
| `State` | varchar(2) | N | PRI |
| `filter_value` | varchar(30) | Y |  |
| `Callable` | tinyint | N | PRI |
| `lastUsed` | date | Y |  |
| `ID` | int | Y |  |

## `spzztmp_clzips_overall_staging`  ·  dimension · ~1,473 rows · InnoDB
PK: `ClientId`, `Zip`, `State`, `Callable`

| column | type | null | key |
|---|---|---|---|
| `ClientId` | int | N | PRI |
| `Zip` | varchar(5) | N | PRI |
| `State` | varchar(2) | N | PRI |
| `filter_value` | varchar(30) | Y |  |
| `Callable` | tinyint | N | PRI |
| `lastUsed` | date | Y |  |
| `ID` | int | Y |  |

## `spzztmp_clzips_state_staging`  ·  dimension · ~0 rows · InnoDB
PK: `ClientId`, `Zip`, `State`, `Callable`

| column | type | null | key |
|---|---|---|---|
| `ClientId` | int | N | PRI |
| `Zip` | varchar(5) | N | PRI |
| `State` | varchar(2) | N | PRI |
| `filter_value` | varchar(30) | Y |  |
| `Callable` | tinyint | N | PRI |
| `lastUsed` | date | Y |  |
| `ID` | int | Y |  |

## `spzztmp_debugvt`  ·  dimension · ~1 rows · InnoDB
PK: `VT`

| column | type | null | key |
|---|---|---|---|
| `VT` | varchar(5) | N | PRI |

## `spzztmp_netthrottles`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `clientid` | int | N | MUL |
| `throttle` | decimal(7,4) | Y |  |
| `vt` | varchar(5) | Y |  |
| `filter_value` | varchar(30) | Y |  |
| `state` | varchar(3) | Y |  |
| `market` | varchar(20) | Y |  |
| `Area` | varchar(20) | Y | MUL |
| `netthrottle` | decimal(9,6) | Y |  |
| `zips` | int | Y |  |
| `openZips` | int | Y |  |
| `reservedZips` | int | Y |  |
| `rZips` | tinyint | Y |  |
| `ignoreZipLimits` | tinyint | Y |  |
| `clientZips` | int | Y |  |
| `lastnotified` | timestamp | Y |  |

## `spzztmp_netthrottles_caps`  ·  dimension · ~2 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `clientid` | int | N | MUL |
| `throttle` | decimal(7,4) | Y |  |
| `vt` | varchar(5) | Y |  |
| `filter_value` | varchar(30) | Y |  |
| `state` | varchar(3) | Y |  |
| `market` | varchar(20) | Y |  |
| `Area` | varchar(20) | Y | MUL |
| `netthrottle` | decimal(9,6) | Y |  |
| `zips` | int | Y |  |
| `openZips` | int | Y |  |
| `reservedZips` | int | Y |  |
| `rZips` | tinyint | Y |  |
| `ignoreZipLimits` | tinyint | Y |  |
| `clientZips` | int | Y |  |
| `lastnotified` | timestamp | Y |  |

## `spzztmp_zcwlt_caps_log`  ·  dimension · ~1,496 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `params` | varchar(40) | N |  |
| `execDate` | date | Y | MUL |
| `executionStartTs` | timestamp | N | MUL |
| `executionEndTs` | timestamp | Y | MUL |
| `userid` | varchar(100) | Y |  |

## `spzztmp_zcwlt_client_zips`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `clientid` | int | Y | MUL |
| `typeval` | varchar(30) | Y |  |
| `zips` | int | Y |  |

## `spzztmp_zcwlt_client_zips_caps`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `clientid` | int | Y | MUL |
| `typeval` | varchar(30) | Y |  |
| `zips` | int | Y |  |

## `spzztmp_zcwlt_staging_client_log`  ·  dimension · ~285 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientid` | int | N | MUL |
| `execDate` | date | N | MUL |

## `spzztmp_zcwlt_staging_log`  ·  dimension · ~2,767 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `params` | varchar(40) | N |  |
| `execDate` | date | Y | MUL |
| `executionStartTs` | timestamp | N | MUL |
| `executionEndTs` | timestamp | Y | MUL |
| `userid` | varchar(100) | Y |  |

## `subClient`  ·  dimension · ~316 rows · InnoDB
PK: `subClientId`

| column | type | null | key |
|---|---|---|---|
| `subClientId` | int | N | PRI |
| `subClientName` | varchar(90) | N |  |
| `clientid` | int | Y | MUL |
| `gcalendarUrl` | varchar(150) | Y |  |
| `gsheetUrl` | varchar(150) | Y |  |
| `phone` | varchar(15) | N |  |
| `State` | text | Y |  |
| `Area` | text | Y |  |
| `transferDays` | varchar(150) | Y |  |
| `startTime` | time | Y |  |
| `endTime` | time | Y |  |
| `email` | varchar(100) | Y | MUL |
| `insertionDate` | timestamp | Y |  |

## `sunrun_zip_list`  ·  dimension · ~5,870 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `state` | varchar(2) | N | MUL |
| `metroArea` | varchar(40) | N |  |
| `county` | varchar(50) | N |  |
| `city` | varchar(50) | N |  |
| `utilityCompany` | varchar(50) | N |  |
| `zip` | varchar(5) | N | UNI |

## `sysLastValue`  ·  dimension · ~0 rows · InnoDB
PK: `tableName`

| column | type | null | key |
|---|---|---|---|
| `tableName` | varchar(60) | N | PRI |
| `lastValue` | int | N |  |

## `temp_work_process_filters`  ·  dimension · ~6 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `VTO` | varchar(5) | Y |  |
| `VT` | varchar(5) | Y | MUL |
| `PD` | varchar(20) | Y |  |
| `CH` | varchar(20) | Y |  |
| `SC` | varchar(20) | Y |  |
| `CP` | varchar(20) | Y |  |
| `State` | varchar(2) | Y | MUL |
| `clientId` | int | Y |  |
| `RA` | varchar(5) | Y | MUL |
| `ProcessId` | int | Y | MUL |
| `split` | int | Y |  |
| `OLeadId` | varchar(40) | Y | MUL |
| `ModuleId` | varchar(20) | Y | MUL |
| `results` | longtext | Y |  |
| `callDispo` | varchar(40) | Y | MUL |
| `callDispoExt` | varchar(80) | Y |  |

## `tf_tcpa`  ·  dimension · ~13 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `value` | text | N |  |
| `description` | text | Y |  |
| `brandId` | int | Y | UNI |
| `timestamp` | timestamp | N |  |

## `throttle_options`  ·  dimension · ~101 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `name` | varchar(30) | N |  |
| `value` | decimal(10,3) | N | UNI |
| `priority` | int | N |  |

## `transfer_client_log`  ·  fact · ~4,453,991 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `url` | varchar(255) | N |  |
| `result` | text | N |  |
| `OLeadID` | varchar(40) | N | MUL |
| `phone` | varchar(10) | N | MUL |
| `lookup` | varchar(20) | N | MUL |
| `callcenter` | varchar(15) | N | MUL |
| `zip` | varchar(5) | N |  |
| `transferclient` | varchar(50) | N |  |
| `brandId` | int | N |  |
| `processingTime` | varchar(255) | N |  |
| `newResult` | text | N |  |
| `newTransferclient` | varchar(50) | N |  |
| `newProcessingtime` | int | N |  |
| `timestamp` | timestamp | N | MUL |
| `ipAddress` | varchar(130) | N | MUL |

## `transfer_client_log_arc`  ·  fact · ~289,585 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `url` | varchar(255) | N |  |
| `result` | text | N |  |
| `OLeadID` | varchar(40) | N | MUL |
| `phone` | varchar(10) | N | MUL |
| `lookup` | varchar(20) | N | MUL |
| `callcenter` | varchar(15) | N | MUL |
| `zip` | varchar(5) | N |  |
| `transferclient` | varchar(50) | N |  |
| `brandId` | int | N |  |
| `processingTime` | varchar(255) | N |  |
| `newResult` | text | N |  |
| `newTransferclient` | varchar(50) | N |  |
| `newProcessingtime` | int | N |  |
| `timestamp` | timestamp | N | MUL |
| `ipAddress` | varchar(130) | N | MUL |

## `transfer_client_log_sp`  ·  fact · ~81,280 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(40) | N | MUL |
| `zip` | varchar(5) | N | MUL |
| `resultSet` | json | Y |  |
| `insertionDate` | timestamp | N | MUL |

## `transfer_client_override_settings`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `name` | varchar(50) | N |  |
| `value` | varchar(255) | N |  |
| `active` | tinyint(1) | N |  |
| `priority` | int | N |  |
| `note` | varchar(255) | N |  |

## `transfer_client_settings`  ·  dimension · ~9 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `version` | varchar(10) | N |  |
| `active` | tinyint | N | MUL |
| `query` | text | N |  |

## `transfer_client_test_settings`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `name` | varchar(50) | N |  |
| `value` | varchar(255) | N |  |
| `active` | tinyint(1) | N |  |
| `priority` | int | N |  |
| `note` | varchar(255) | N |  |

## `transfer_priorities_open`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `clientId` | int | N |  |
| `capType` | int | N |  |
| `target` | int | N |  |
| `cap` | int | N |  |
| `typeVal` | varchar(40) | Y |  |
| `lastUpdate` | timestamp | N |  |
| `clientName` | varchar(255) | Y |  |
| `vertical` | varchar(5) | N |  |
| `clientOpen` | int | Y |  |

## `transfer_priority`  ·  dimension · ~108 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientId` | int | N | MUL |
| `capType` | int | N | MUL |
| `target` | int | N | MUL |
| `cap` | int | N | MUL |
| `typeVal` | varchar(40) | Y | MUL |
| `throttle` | decimal(10,3) | N |  |
| `lastUpdate` | timestamp | N |  |

## `transfer_priority_import_temp`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientId` | int | N | MUL |
| `capType` | int | N | MUL |
| `target` | int | N | MUL |
| `cap` | int | N | MUL |
| `typeVal` | varchar(40) | Y | MUL |
| `throttle` | decimal(10,3) | N |  |
| `lastUpdate` | timestamp | N |  |

## `transfer_priority_throttle_log`  ·  dimension · ~1,292 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientId` | int | Y | MUL |
| `capType` | tinyint | Y | MUL |
| `target` | tinyint | Y | MUL |
| `typeVal` | varchar(80) | Y | MUL |
| `throttle` | decimal(10,3) | Y |  |
| `oldThrottle` | decimal(10,3) | Y |  |
| `userid` | varchar(100) | Y | MUL |
| `lastUpdate` | timestamp | Y | MUL |
| `applied` | tinyint | Y | MUL |
| `appliedOn` | timestamp | Y | MUL |

## `transfer_qualifiers_dr`  ·  dimension · ~1 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientId` | int | N | MUL |
| `amount` | int | N |  |
| `medicalDebt` | int | N |  |
| `creditCardDebt` | int | N |  |
| `studentLoanDebt` | int | N |  |
| `loanDebt` | int | N |  |
| `insertionDate` | timestamp | N |  |
| `removeDate` | timestamp | N |  |

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

## `vm_clients_cap_open`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `clientName` | varchar(255) | Y |  |
| `clientNotes` | varchar(255) | N |  |
| `vertical` | varchar(5) | N |  |
| `type` | varchar(20) | Y |  |
| `branding` | varchar(50) | Y |  |
| `clientCode` | varchar(20) | Y |  |
| `LeadConduitCode` | varchar(50) | N |  |
| `acceptRate` | decimal(10,3) | Y |  |
| `disputableReturns` | int | N |  |
| `transferCode` | varchar(20) | Y |  |
| `transferPhone` | varchar(12) | N |  |
| `transferDays` | varchar(150) | N |  |
| `transferStartHour` | time | N |  |
| `transferEndHour` | time | N |  |
| `openMarket` | int | Y |  |
| `openState` | int | Y |  |
| `officeTime` | time | Y |  |
| `officeTimeDelay` | time | Y |  |
| `transferStartHourTime` | time | Y |  |
| `transferEndHourTime` | time | Y |  |
| `open` | int | Y |  |
| `cap_type` | int | Y |  |
| `cap_name` | varchar(40) | Y |  |

## `vm_et_time_now`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `easter_time_now` | int | Y |  |

## `vm_transfer_client_current_time`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `datetime_now` | datetime | Y |  |

## `z_transfer_log_diff_today`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `url` | varchar(255) | N |  |
| `result` | text | N |  |
| `OLeadID` | varchar(40) | N |  |
| `phone` | varchar(10) | N |  |
| `lookup` | varchar(20) | N |  |
| `callcenter` | varchar(15) | N |  |
| `zip` | varchar(5) | N |  |
| `transferclient` | varchar(50) | N |  |
| `processingTime` | varchar(255) | N |  |
| `newResult` | text | N |  |
| `newTransferclient` | varchar(50) | N |  |
| `newProcessingtime` | int | N |  |
| `timestamp` | timestamp | N |  |

## `z_transfer_log_diff_today_empty`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `url` | varchar(255) | N |  |
| `result` | text | N |  |
| `OLeadID` | varchar(40) | N |  |
| `phone` | varchar(10) | N |  |
| `lookup` | varchar(20) | N |  |
| `callcenter` | varchar(15) | N |  |
| `zip` | varchar(5) | N |  |
| `transferclient` | varchar(50) | N |  |
| `processingTime` | varchar(255) | N |  |
| `newResult` | text | N |  |
| `newTransferclient` | varchar(50) | N |  |
| `newProcessingtime` | int | N |  |
| `timestamp` | timestamp | N |  |

## `zcwlt_caps_queue`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `param1` | varchar(10) | N |  |
| `param2` | varchar(10) | N |  |
| `queued_ts` | timestamp | N | MUL |
| `userid` | varchar(100) | Y | MUL |
| `attempts` | tinyint | Y |  |
| `errCode` | int | Y |  |
| `errState` | int | Y | MUL |
| `errMessage` | varchar(255) | Y |  |
| `applied` | tinyint | Y | MUL |
| `appliedOn` | timestamp | Y | MUL |

## `zcwlt_caps_state`  ·  dimension · ~0 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `readingQueue` | tinyint | Y | MUL |

## `zcwlt_conf`  ·  dimension · ~3 rows · InnoDB
PK: `confName`

| column | type | null | key |
|---|---|---|---|
| `confName` | varchar(30) | N | PRI |
| `confValue` | varchar(90) | Y |  |
| `confDesc` | varchar(150) | Y |  |
| `confActive` | tinyint | Y | MUL |
| `lastUser` | varchar(100) | Y |  |
| `lastUpdate` | timestamp | Y |  |

## `zcwlt_staging`  ·  dimension · ~39,390 rows · InnoDB
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

## `zcwlt_staging_log`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `ClientId` | int | N | MUL |
| `Zip` | varchar(5) | N |  |
| `State` | varchar(2) | N |  |
| `filter_value` | varchar(30) | Y |  |
| `Callable` | tinyint | N |  |
| `VT` | varchar(5) | N | MUL |
| `runDate` | datetime | N | MUL |

## `zcwlt_staging_tempot`  ·  dimension · ~3,776 rows · InnoDB
PK: `ClientId`, `Zip`, `State`, `Callable`

| column | type | null | key |
|---|---|---|---|
| `ClientId` | int | N | PRI |
| `Zip` | varchar(5) | N | PRI |
| `State` | varchar(2) | N | PRI |
| `filter_value` | varchar(30) | Y |  |
| `Callable` | tinyint | N | PRI |
| `lastUpdate` | timestamp | Y |  |

## `zcwlt_staging_tempot_log`  ·  fact · ~61,054,036 rows · InnoDB
PK: `ClientId`, `Zip`, `State`, `Callable`, `runDate`

| column | type | null | key |
|---|---|---|---|
| `ClientId` | int | N | PRI |
| `Zip` | varchar(5) | N | PRI |
| `State` | varchar(2) | N | PRI |
| `filter_value` | varchar(30) | Y |  |
| `Callable` | tinyint | N | PRI |
| `runDate` | datetime | N | PRI |

## `zip_holidays`  ·  dimension · ~8 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `holidayDate` | date | N | MUL |
| `restoreDate` | date | N | MUL |
| `state` | varchar(2) | N | MUL |
| `throttle` | decimal(10,3) | N |  |
| `applied` | tinyint | N | MUL |
| `restored` | tinyint | N |  |

## `zip_holidays_log`  ·  dimension · ~3,902 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientid` | int | N |  |
| `holidayDate` | date | N | MUL |
| `restoreDate` | date | N | MUL |
| `state` | varchar(2) | N | MUL |
| `newThrottle` | decimal(10,3) | N |  |
| `oldThrottle` | decimal(10,3) | N |  |
| `restored` | tinyint | N |  |
| `cmcID` | int | Y |  |
| `insertionDate` | timestamp | Y | MUL |
| `lastUpdate` | timestamp | Y | MUL |

## `zztmp_client_live_zips_shane`  ·  dimension · ~15,480 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `ClientId` | int | N | MUL |
| `Zip` | varchar(5) | N | MUL |

## `zztmp_prism_dispos`  ·  dimension · ~99 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `callDispoExtended` | varchar(100) | Y |  |
| `callDispo` | varchar(100) | Y |  |
| `urank` | tinyint | Y |  |
| `contact` | tinyint | Y |  |
| `nis` | tinyint | Y |  |
| `dqs` | tinyint | Y |  |
| `dnc` | tinyint | Y |  |
| `app` | tinyint | Y |  |
| `ub` | tinyint | Y |  |
| `evrpending` | tinyint | Y |  |
| `callback` | tinyint | Y |  |
| `opps` | tinyint | Y |  |
| `candi` | tinyint | Y |  |
| `complete` | tinyint | Y |  |
