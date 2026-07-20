# Schema `techss_dwh`

Data warehouse. Includes the Meridius sent-leads dataset, client rate overrides, and holiday calendar.

**25 tables** — dimension: 22, fact: 3

## `cat_callDispo`  ·  dimension · ~22 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `callDispo` | varchar(80) | Y | MUL |
| `tAttempt` | tinyint | Y |  |
| `tAgree` | tinyint | Y |  |
| `tSuccess` | tinyint | Y |  |

## `cat_campaignType`  ·  dimension · ~21 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `campaignVT` | varchar(10) | N |  |
| `campaign` | varchar(15) | N |  |

## `cat_ccLaborRate`  ·  dimension · ~10 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `cc` | varchar(5) | N |  |
| `lRate` | decimal(6,2) | Y |  |

## `cat_convertedVT`  ·  dimension · ~16 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `VT` | varchar(5) | N |  |
| `finalVT` | varchar(5) | N |  |

## `dim_callCenter`  ·  dimension · ~7 rows · InnoDB
PK: `cc_Id`

| column | type | null | key |
|---|---|---|---|
| `cc_Id` | int | N | PRI |
| `cc_Name` | varchar(30) | Y |  |
| `full_Name` | varchar(30) | Y |  |

## `dim_campaign`  ·  dimension · ~132 rows · InnoDB
PK: `campaign_Id`

| column | type | null | key |
|---|---|---|---|
| `campaign_Id` | int | N | PRI |
| `campaign_Name` | varchar(30) | Y |  |
| `full_Name` | varchar(30) | Y |  |

## `dim_client`  ·  dimension · ~36 rows · InnoDB
PK: `client_Id`

| column | type | null | key |
|---|---|---|---|
| `client_Id` | int | N | PRI |
| `client_Name` | varchar(100) | Y |  |
| `full_Name` | varchar(150) | Y |  |

## `dim_date`  ·  dimension · ~79 rows · InnoDB
PK: `date_Id`

| column | type | null | key |
|---|---|---|---|
| `date_Id` | int | N | PRI |
| `mDate` | date | Y |  |
| `mmonth` | tinyint | Y |  |
| `mday` | tinyint | Y |  |
| `myear` | smallint | Y |  |
| `mweek` | tinyint | Y |  |
| `mquarter` | tinyint | Y |  |
| `mdayname` | varchar(15) | Y |  |
| `mweekday` | varchar(15) | Y |  |

## `dim_partner`  ·  dimension · ~57 rows · InnoDB
PK: `partner_Id`

| column | type | null | key |
|---|---|---|---|
| `partner_Id` | int | N | PRI |
| `partner_Name` | varchar(30) | Y |  |
| `full_Name` | varchar(80) | Y |  |

## `dim_product`  ·  dimension · ~0 rows · InnoDB
PK: `product_Id`

| column | type | null | key |
|---|---|---|---|
| `product_Id` | int | N | PRI |
| `product_Name` | varchar(30) | Y |  |
| `full_Name` | varchar(50) | Y |  |

## `dim_ruType`  ·  dimension · ~2 rows · InnoDB
PK: `ru_Id`

| column | type | null | key |
|---|---|---|---|
| `ru_Id` | int | N | PRI |
| `ru_Name` | varchar(20) | Y |  |
| `full_Name` | varchar(20) | Y |  |

## `dim_state`  ·  dimension · ~63 rows · InnoDB
PK: `state_Id`

| column | type | null | key |
|---|---|---|---|
| `state_Id` | int | N | PRI |
| `state_Name` | varchar(30) | Y |  |
| `full_Name` | varchar(30) | Y |  |

## `dim_vertical`  ·  dimension · ~7 rows · InnoDB
PK: `vertical_Id`

| column | type | null | key |
|---|---|---|---|
| `vertical_Id` | int | N | PRI |
| `vertical_Name` | varchar(30) | Y |  |
| `full_Name` | varchar(30) | Y |  |

## `facts_callCenter`  ·  dimension · ~6 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `date_Id` | int | Y | MUL |
| `cc_Id` | int | N | MUL |
| `vertical_Id` | int | N | MUL |
| `mHours` | decimal(9,2) | Y |  |
| `SPH` | decimal(9,2) | Y |  |
| `lCost` | decimal(9,2) | Y |  |
| `sales` | smallint | Y |  |
| `netSales` | smallint | Y |  |

Foreign keys: `date_Id` → techss_dwh.dim_date.date_Id; `cc_Id` → techss_dwh.dim_callCenter.cc_Id; `vertical_Id` → techss_dwh.dim_vertical.vertical_Id

## `facts_recordIntake`  ·  fact · ~74,318 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `date_Id` | int | Y | MUL |
| `state_Id` | int | N | MUL |
| `partner_Id` | int | N | MUL |
| `vertical_Id` | int | N | MUL |
| `product_Id` | int | N | MUL |
| `campaign_Id` | int | N | MUL |
| `cc_Id` | int | N | MUL |
| `accepted` | int | Y |  |
| `sent` | int | Y |  |
| `final_mCost` | decimal(9,4) | Y |  |
| `mtdSent` | decimal(9,4) | Y |  |
| `cpr` | decimal(6,3) | Y |  |

Foreign keys: `date_Id` → techss_dwh.dim_date.date_Id; `state_Id` → techss_dwh.dim_state.state_Id; `partner_Id` → techss_dwh.dim_partner.partner_Id; `vertical_Id` → techss_dwh.dim_vertical.vertical_Id; `product_Id` → techss_dwh.dim_product.product_Id; `campaign_Id` → techss_dwh.dim_campaign.campaign_Id; `cc_Id` → techss_dwh.dim_callCenter.cc_Id

## `facts_sentLeads`  ·  dimension · ~6,888 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `date_Id` | int | Y | MUL |
| `state_Id` | int | N | MUL |
| `vertical_Id` | int | N | MUL |
| `campaign_Id` | int | N | MUL |
| `cc_Id` | int | N | MUL |
| `client_Id` | int | N | MUL |
| `ru_Id` | int | N | MUL |
| `RPL` | decimal(9,2) | Y |  |
| `finalRPL` | decimal(9,2) | Y |  |
| `mLeads` | int | Y |  |
| `mSent` | int | Y |  |
| `mReturns` | int | Y |  |
| `tAttempt` | int | Y |  |
| `tAgree` | int | Y |  |
| `tSuccess` | int | Y |  |

Foreign keys: `date_Id` → techss_dwh.dim_date.date_Id; `state_Id` → techss_dwh.dim_state.state_Id; `vertical_Id` → techss_dwh.dim_vertical.vertical_Id; `campaign_Id` → techss_dwh.dim_campaign.campaign_Id; `cc_Id` → techss_dwh.dim_callCenter.cc_Id; `client_Id` → techss_dwh.dim_client.client_Id; `ru_Id` → techss_dwh.dim_ruType.ru_Id

## `fsdb_events_log`  ·  dimension · ~110 rows · InnoDB
PK: `eventName`, `eventStart`

| column | type | null | key |
|---|---|---|---|
| `eventName` | varchar(150) | N | PRI |
| `eventStart` | timestamp | N | PRI |
| `eventEnd` | timestamp | Y | MUL |
| `userId` | varchar(100) | Y |  |
| `params` | varchar(40) | Y |  |
| `jparams` | json | Y |  |

## `mRecordIntake`  ·  fact · ~2,870,470 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `VT` | varchar(5) | Y |  |
| `VTO` | varchar(5) | Y |  |
| `mDate` | date | Y | MUL |
| `weekNo` | tinyint | Y |  |
| `state` | varchar(5) | Y |  |
| `zip` | varchar(5) | Y |  |
| `PD` | varchar(20) | Y |  |
| `CH` | varchar(20) | Y |  |
| `SC` | varchar(20) | Y |  |
| `CP` | varchar(20) | Y |  |
| `C0` | varchar(20) | Y |  |
| `FSMarket` | varchar(50) | Y |  |
| `Accepted` | smallint | Y |  |
| `SentLeads` | smallint | Y |  |
| `mCost` | decimal(6,2) | Y |  |
| `geoCPR` | tinyint | Y |  |
| `finalmCost` | decimal(6,2) | Y |  |
| `finalVT` | varchar(5) | Y |  |
| `partner` | varchar(20) | Y |  |
| `cmd_cpr` | decimal(6,3) | Y |  |
| `insertionDate` | timestamp | Y |  |

## `mSentLeads`  ·  dimension · ~11,759 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `VT` | varchar(5) | Y |  |
| `OLeadId` | varchar(40) | Y |  |
| `mClient` | varchar(150) | Y | MUL |
| `leadType` | varchar(10) | Y |  |
| `mDate` | date | Y | MUL |
| `phone` | varchar(15) | Y |  |
| `state` | varchar(5) | Y |  |
| `zip` | varchar(5) | Y |  |
| `FSCode1` | varchar(150) | Y |  |
| `FSCode2` | varchar(150) | Y |  |
| `FSCode3` | varchar(150) | Y |  |
| `FSMarket` | varchar(50) | Y |  |
| `ClientArea` | varchar(80) | Y |  |
| `callDispo` | varchar(40) | Y |  |
| `callDispoExt` | varchar(80) | Y |  |
| `RPL` | decimal(6,2) | Y |  |
| `Scrub` | decimal(6,2) | Y |  |
| `nRPL` | decimal(6,2) | Y |  |
| `finalRPL` | decimal(6,2) | Y |  |
| `productType` | varchar(20) | Y |  |
| `ruType` | varchar(10) | Y |  |
| `ccVT` | varchar(20) | Y |  |
| `ruTypeEdited` | varchar(20) | Y |  |
| `mMonth` | tinyint | Y |  |
| `mWeek` | tinyint | Y |  |
| `CC` | varchar(20) | Y |  |
| `SC` | varchar(20) | Y |  |
| `CP` | varchar(20) | Y |  |
| `CTDRS` | tinyint | Y |  |
| `mLeads` | tinyint | Y |  |
| `mSent` | tinyint | Y |  |
| `mReturns` | tinyint | Y |  |
| `tAttempt` | tinyint | Y |  |
| `tAgree` | tinyint | Y |  |
| `tSuccess` | tinyint | Y |  |
| `Client2` | varchar(150) | Y |  |
| `legacyAP` | tinyint | Y |  |
| `revenueTrend` | decimal(6,2) | Y |  |
| `insertionDate` | timestamp | Y |  |

## `mSentReturnLeads`  ·  dimension · ~23 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `VT` | varchar(5) | Y |  |
| `OLeadId` | varchar(40) | Y |  |
| `mClient` | varchar(150) | Y | MUL |
| `leadType` | varchar(10) | Y |  |
| `mDate` | date | Y | MUL |
| `phone` | varchar(15) | Y |  |
| `state` | varchar(5) | Y |  |
| `zip` | varchar(5) | Y |  |
| `FSCode1` | varchar(150) | Y |  |
| `FSCode2` | varchar(150) | Y |  |
| `FSCode3` | varchar(150) | Y |  |
| `FSMarket` | varchar(50) | Y |  |
| `ClientArea` | varchar(80) | Y |  |
| `callDispo` | varchar(40) | Y |  |
| `callDispoExt` | varchar(80) | Y |  |
| `RPL` | decimal(6,2) | Y |  |
| `Scrub` | decimal(6,2) | Y |  |
| `insertionDate` | timestamp | Y |  |

## `mccHours`  ·  dimension · ~11 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `CC` | varchar(5) | Y |  |
| `VT` | varchar(5) | Y |  |
| `mDate` | date | Y | MUL |
| `noHours` | decimal(6,2) | Y |  |
| `live` | tinyint | Y |  |
| `trueVT` | varchar(5) | Y |  |
| `ccVertical` | varchar(10) | Y |  |
| `leadType` | varchar(10) | Y |  |
| `dHours` | decimal(6,2) | Y |  |
| `SPH` | decimal(6,2) | Y |  |
| `lCost` | decimal(6,2) | Y |  |
| `sales` | smallint | Y |  |
| `netSales` | smallint | Y |  |
| `insertionDate` | timestamp | Y |  |

## `meridius`  ·  dimension · ~6,205 rows · InnoDB
_Meridius final data set_

| column | type | null | key |
|---|---|---|---|
| `runDate` | date | N | MUL |
| `clientId` | int | N | MUL |
| `State` | varchar(4) | N |  |
| `ClientArea` | varchar(64) | N |  |
| `dailyCap` | decimal(9,2) | Y |  |
| `throttle` | decimal(9,2) | Y |  |

## `meridius_client_rates`  ·  dimension · ~61 rows · InnoDB
_Per-(client, state, area) rate overrides. Was Inputs!S:Y on the Meridius workbook._
PK: `clientid`, `state`, `area`

| column | type | null | key |
|---|---|---|---|
| `clientid` | int | N | PRI |
| `state` | char(2) | N | PRI |
| `area` | varchar(50) | N | PRI |
| `client_name` | varchar(100) | N |  |
| `rate` | decimal(10,2) | N |  |
| `note` | varchar(255) | Y |  |
| `updated_at` | datetime | N |  |

## `meridius_holidays`  ·  dimension · ~6 rows · InnoDB
_Observed holidays excluded from workday counts. Was Inputs!C:G on the Meridius workbook._
PK: `holiday_date`

| column | type | null | key |
|---|---|---|---|
| `holiday_date` | date | N | PRI |
| `holiday_name` | varchar(50) | N |  |
| `notes` | varchar(255) | Y |  |

## `meridius_sent_facts`  ·  fact · ~97,821 rows · InnoDB
_Sent-leads fact table. Raw lead record only (was Sent!A:L). Derived values are recomputed at read time._
PK: `lead_id`

| column | type | null | key |
|---|---|---|---|
| `lead_id` | bigint | N | PRI |
| `vt` | varchar(20) | Y |  |
| `o_lead_id` | varchar(50) | Y |  |
| `client_id` | int | Y | MUL |
| `client_name` | varchar(100) | Y |  |
| `lead_type` | varchar(10) | Y |  |
| `capture_date` | datetime | N |  |
| `phone` | varchar(20) | Y |  |
| `fs_code_1` | varchar(255) | Y |  |
| `state` | char(2) | Y |  |
| `client_area` | varchar(50) | Y |  |
| `zip` | varchar(10) | Y |  |
| `inserted_at` | datetime | N |  |
