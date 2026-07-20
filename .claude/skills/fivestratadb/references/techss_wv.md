# Schema `techss_wv`

Web Verify — visual-verification, review, return, and transfer scripts/providers plus dialer-lead views.

**49 tables** — dimension: 26, fact: 8, view: 15

## `auto_messages`  ·  dimension · ~5 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `type` | int | N |  |
| `triggerType` | int | N |  |
| `triggerParameters` | varchar(255) | N |  |
| `content` | mediumtext | N |  |

## `auto_messages_triggers`  ·  dimension · ~4 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `name` | varchar(40) | N |  |
| `filters` | varchar(255) | N |  |

## `auto_messages_types`  ·  dimension · ~2 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `name` | varchar(40) | N |  |

## `dialer_leads_agent`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `leadId` | int | N | UNI |
| `agentId` | int | N |  |
| `used` | int | N |  |
| `dateCreated` | timestamp | N |  |

## `dialer_leads_agent_archive`  ·  fact · ~143,022 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `leadId` | int | N |  |
| `agentId` | int | N |  |
| `used` | int | N |  |
| `dateCreated` | timestamp | N |  |

## `dialer_phone_blocklist`  ·  dimension · ~7 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `phone` | varchar(10) | N | UNI |
| `reason` | mediumtext | Y |  |
| `dateCreated` | timestamp | N |  |

## `dialer_phone_numbers`  ·  dimension · ~275 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `phoneId` | varchar(50) | N |  |
| `phone` | varchar(10) | N | UNI |
| `state` | varchar(2) | N |  |
| `market` | varchar(20) | N |  |
| `defaultNumber` | int | N |  |

## `dispositions`  ·  dimension · ~28 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `display_order` | int | N |  |
| `disposition` | varchar(100) | N |  |
| `explanation` | mediumtext | N |  |

## `home_security_leads`  ·  dimension · ~84 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `first_name` | varchar(50) | N |  |
| `last_name` | varchar(50) | N |  |
| `email` | varchar(100) | N |  |
| `emailResponse` | varchar(150) | Y |  |
| `phone` | varchar(15) | N |  |
| `phoneResponse` | varchar(150) | Y |  |
| `address` | varchar(100) | N |  |
| `addressResponse` | varchar(150) | Y |  |
| `city` | varchar(50) | N |  |
| `state` | varchar(2) | N |  |
| `postal_code` | varchar(5) | N |  |
| `ip_address` | varchar(50) | N |  |
| `homeowner` | varchar(3) | N |  |
| `credit_score` | varchar(150) | Y |  |
| `Rep_ID` | varchar(50) | Y |  |
| `source` | mediumtext | N |  |
| `Aff_ID` | varchar(50) | Y |  |
| `Sub_ID` | varchar(50) | Y |  |
| `FSCode1` | varchar(150) | Y |  |
| `FSCode2` | varchar(150) | Y |  |
| `FSCode3` | varchar(255) | Y |  |
| `timestamp_affiliate` | varchar(50) | N |  |
| `OLeadID` | varchar(30) | N |  |
| `leadID` | varchar(10) | N |  |
| `callDispo` | varchar(255) | N |  |
| `timestamp_CallCenter_Dispositioned` | varchar(30) | N |  |
| `response` | mediumtext | N |  |
| `additional` | longtext | N |  |
| `priorityOne` | varchar(10) | Y |  |
| `priorityTwo` | varchar(10) | Y |  |
| `priorityThree` | varchar(10) | Y |  |
| `Call_Count` | int | Y |  |
| `xxTrustedFormCertUrl` | varchar(100) | Y |  |
| `xxTrustedFormToken` | varchar(100) | Y |  |
| `leadIdToken` | varchar(100) | Y |  |

## `home_security_providers`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `code` | varchar(10) | N |  |
| `name` | varchar(100) | N |  |

## `home_security_scripts`  ·  dimension · ~2 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `type` | varchar(20) | N |  |
| `text` | mediumtext | N |  |

## `leads`  ·  fact · ~53,747 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `first_name` | varchar(50) | N |  |
| `last_name` | varchar(50) | N |  |
| `email` | varchar(100) | N |  |
| `emailResponse` | varchar(150) | Y |  |
| `phone` | varchar(15) | N |  |
| `phoneResponse` | varchar(150) | Y |  |
| `address` | varchar(100) | N |  |
| `addressResponse` | varchar(150) | Y |  |
| `city` | varchar(50) | N |  |
| `state` | varchar(2) | N |  |
| `postal_code` | varchar(5) | N |  |
| `ip_address` | varchar(50) | N |  |
| `homeowner` | varchar(3) | N |  |
| `current_provider` | varchar(150) | N |  |
| `electric_bill` | varchar(15) | N |  |
| `source` | mediumtext | N |  |
| `Aff_ID` | varchar(150) | N |  |
| `Sub_ID` | varchar(100) | N |  |
| `FSCode1` | varchar(150) | Y | MUL |
| `FSCode2` | varchar(150) | Y |  |
| `FSCode3` | varchar(255) | Y |  |
| `timestamp_affiliate` | varchar(50) | N |  |
| `roof_shade` | varchar(50) | Y |  |
| `credit_score` | varchar(50) | Y |  |
| `leadType` | varchar(20) | Y |  |
| `appointment` | varchar(50) | Y |  |
| `OLeadID` | varchar(30) | N |  |
| `leadID` | varchar(10) | N |  |
| `callDispo` | varchar(255) | N |  |
| `timestamp_CallCenter_Dispositioned` | varchar(30) | N |  |
| `response` | mediumtext | N |  |
| `additional` | longtext | N |  |
| `priorityOne` | varchar(10) | Y |  |
| `priorityTwo` | varchar(10) | Y |  |
| `priorityThree` | varchar(10) | Y |  |
| `Call_Count` | int | Y |  |
| `xxTrustedFormToken` | varchar(100) | Y |  |
| `xxTrustedFormCertUrl` | varchar(255) | Y |  |
| `leadIdToken` | varchar(100) | Y |  |
| `captureDate` | timestamp | N |  |

## `providers`  ·  dimension · ~21 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `code` | varchar(10) | N |  |
| `name` | varchar(100) | N |  |

## `return_leads`  ·  dimension · ~18,931 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `first_name` | varchar(50) | N |  |
| `last_name` | varchar(50) | N |  |
| `email` | varchar(100) | N |  |
| `emailResponse` | varchar(150) | Y |  |
| `phone` | varchar(15) | N |  |
| `phoneResponse` | varchar(150) | Y |  |
| `address` | varchar(100) | N |  |
| `addressResponse` | varchar(150) | Y |  |
| `city` | varchar(50) | N |  |
| `state` | varchar(2) | N |  |
| `postal_code` | varchar(5) | N |  |
| `ip_address` | varchar(50) | N |  |
| `homeowner` | varchar(3) | N |  |
| `current_provider` | varchar(150) | N |  |
| `electric_bill` | varchar(15) | N |  |
| `source` | mediumtext | N |  |
| `Aff_ID` | varchar(150) | N |  |
| `Sub_ID` | varchar(100) | N |  |
| `FSCode1` | varchar(150) | Y | MUL |
| `FSCode2` | varchar(150) | Y |  |
| `FSCode3` | varchar(255) | Y |  |
| `timestamp_affiliate` | varchar(50) | N |  |
| `roof_shade` | varchar(50) | Y |  |
| `credit_score` | varchar(50) | Y |  |
| `appointment` | varchar(50) | Y |  |
| `OLeadID` | varchar(30) | N | MUL |
| `leadID` | varchar(10) | N |  |
| `callDispo` | varchar(255) | Y |  |
| `timestamp_CallCenter_Dispositioned` | varchar(30) | Y |  |
| `response` | mediumtext | N |  |
| `additional` | longtext | N |  |
| `priorityOne` | varchar(10) | Y |  |
| `priorityTwo` | varchar(10) | Y |  |
| `priorityThree` | varchar(10) | Y |  |
| `Call_Count` | int | Y |  |
| `xxTrustedFormToken` | varchar(100) | Y |  |
| `xxTrustedFormCertUrl` | varchar(255) | Y |  |
| `leadIdToken` | varchar(100) | Y |  |
| `leadType` | varchar(10) | Y |  |
| `manually_approved` | varchar(20) | N |  |
| `redistribute` | varchar(3) | Y |  |
| `dnc` | varchar(3) | Y |  |
| `report_to_qa` | varchar(3) | Y |  |
| `report_to_it` | varchar(3) | Y |  |
| `it_notes` | varchar(255) | Y |  |
| `notes` | varchar(255) | N |  |
| `masterRejectionReason` | varchar(255) | N |  |
| `rejectionReason` | varchar(255) | Y |  |
| `otherRejectionReason` | varchar(255) | Y |  |
| `submitterEmail` | varchar(100) | Y |  |
| `submitterName` | varchar(100) | Y |  |
| `clientId` | int | Y |  |
| `client` | varchar(100) | Y |  |
| `rejector` | varchar(40) | Y |  |
| `reviewInstruction` | varchar(100) | N |  |
| `captureDate` | varchar(80) | Y |  |
| `dateCaptured` | date | Y |  |
| `insertionDate` | timestamp | N |  |

## `return_providers`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `code` | varchar(10) | N |  |
| `name` | varchar(100) | N |  |

## `return_scripts`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `type` | varchar(20) | N |  |
| `text` | mediumtext | N |  |

## `review_leads`  ·  dimension · ~312 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `first_name` | varchar(50) | N |  |
| `last_name` | varchar(50) | N |  |
| `email` | varchar(100) | N |  |
| `emailResponse` | varchar(150) | Y |  |
| `phone` | varchar(15) | N |  |
| `phoneResponse` | varchar(150) | Y |  |
| `address` | varchar(100) | N |  |
| `addressResponse` | varchar(150) | Y |  |
| `city` | varchar(50) | N |  |
| `state` | varchar(2) | N |  |
| `postal_code` | varchar(5) | N |  |
| `ip_address` | varchar(50) | N |  |
| `homeowner` | varchar(3) | N |  |
| `current_provider` | varchar(150) | N |  |
| `electric_bill` | varchar(15) | N |  |
| `source` | mediumtext | N |  |
| `Aff_ID` | varchar(150) | N |  |
| `Sub_ID` | varchar(100) | N |  |
| `FSCode1` | varchar(150) | Y | MUL |
| `FSCode2` | varchar(150) | Y |  |
| `FSCode3` | varchar(255) | Y |  |
| `leadType` | varchar(5) | Y |  |
| `timestamp_affiliate` | varchar(50) | N |  |
| `roof_shade` | varchar(50) | Y |  |
| `credit_score` | varchar(50) | Y |  |
| `appointment` | varchar(50) | Y |  |
| `OLeadID` | varchar(30) | N |  |
| `leadID` | varchar(10) | N |  |
| `callDispo` | varchar(255) | N |  |
| `timestamp_CallCenter_Dispositioned` | varchar(30) | N |  |
| `response` | mediumtext | N |  |
| `additional` | longtext | N |  |
| `priorityOne` | varchar(10) | Y |  |
| `priorityTwo` | varchar(10) | Y |  |
| `priorityThree` | varchar(10) | Y |  |
| `Call_Count` | int | Y |  |
| `xxTrustedFormToken` | varchar(100) | Y |  |
| `xxTrustedFormCertUrl` | varchar(255) | Y |  |
| `leadIdToken` | varchar(100) | Y |  |
| `zEstimate` | int | N |  |
| `tEstimate` | int | N |  |

## `review_providers`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `code` | varchar(10) | N |  |
| `name` | varchar(100) | N |  |

## `review_scripts`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `type` | varchar(20) | N |  |
| `text` | mediumtext | N |  |

## `scripts`  ·  dimension · ~15 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `type` | varchar(20) | N |  |
| `portal` | varchar(20) | N |  |
| `text` | mediumtext | N |  |

## `settings`  ·  dimension · ~6 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `URL` | varchar(255) | N |  |
| `tablePrefix` | varchar(20) | N | UNI |
| `accountID` | varchar(20) | N |  |
| `campaignID` | varchar(30) | N |  |
| `title` | varchar(50) | N |  |
| `fields` | mediumtext | N |  |

## `status`  ·  dimension · ~31 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `type` | varchar(20) | N |  |
| `subtype` | int | N |  |
| `statusOrder` | int | N |  |
| `value` | varchar(40) | N |  |
| `red` | int | N |  |
| `green` | int | N |  |
| `blue` | int | N |  |
| `setComplete` | int | N |  |
| `setSettable` | int | N |  |
| `setContact` | int | N |  |
| `setApp` | int | N |  |
| `setSet` | int | N |  |
| `closeContact` | int | N |  |
| `closePitch` | int | N |  |
| `closeSale` | int | N |  |

## `template_messages`  ·  dimension · ~54 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `type` | int | N |  |
| `featured` | tinyint | N |  |
| `name` | varchar(50) | N |  |
| `content` | mediumtext | N |  |

## `tmp_dialer_leads`  ·  dimension · ~909 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `leadId` | int | N |  |
| `OLeadID` | varchar(40) | N | MUL |
| `postalCode` | varchar(5) | N | MUL |
| `callbackTime` | datetime | N |  |
| `lastServed` | datetime | N |  |
| `currentStatus` | int | N |  |
| `dialableDispos` | varchar(20) | N |  |
| `activeCallBack` | int | N |  |
| `activeBonusAttempt` | int | N |  |
| `expiredFresh` | int | N |  |
| `fresh` | int | N |  |
| `totalAttempts` | int | N |  |
| `recycled` | int | N |  |
| `recycledAttemptMin` | int | N |  |
| `insertionDate` | datetime | N |  |
| `maxAttempts` | int | N |  |
| `maxDailyAttempts` | int | N |  |
| `bonusAttempts` | int | N |  |
| `bonusHour` | time | N |  |
| `callAllowanceMinutes` | int | N |  |
| `todayAttempts` | int | N |  |
| `lastAttempt` | datetime | N |  |
| `attemptRest` | int | N |  |

## `transfer_call_log`  ·  fact · ~311,180 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `phone` | varchar(20) | N | MUL |
| `systemPhone` | varchar(10) | N |  |
| `agent` | varchar(30) | N | MUL |
| `oLeadId` | varchar(30) | Y | MUL |
| `callId` | varchar(100) | N | UNI |
| `callDirection` | varchar(20) | N |  |
| `callRecording` | varchar(255) | Y |  |
| `duration` | int | Y |  |
| `callStatus` | varchar(20) | N | MUL |
| `callDispo` | varchar(20) | N |  |
| `notes` | varchar(255) | N |  |
| `log` | mediumtext | N |  |
| `insertionDate` | timestamp | N | MUL |

## `transfer_leads`  ·  fact · ~66,500 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `insertionDate` | timestamp | N |  |
| `lastServed` | datetime | N |  |
| `recycleable` | datetime | N | MUL |
| `first_name` | varchar(50) | N |  |
| `last_name` | varchar(50) | N |  |
| `email` | varchar(100) | N |  |
| `emailResponse` | varchar(150) | Y |  |
| `phone` | varchar(15) | N |  |
| `alternate_contact` | varchar(50) | N |  |
| `alternate_phone` | varchar(15) | N |  |
| `alternate_email` | varchar(50) | N |  |
| `phoneResponse` | varchar(150) | Y |  |
| `address` | varchar(100) | N |  |
| `addressResponse` | varchar(150) | Y |  |
| `city` | varchar(50) | N |  |
| `state` | varchar(2) | N |  |
| `postal_code` | varchar(5) | N |  |
| `ip_address` | varchar(50) | N |  |
| `area` | varchar(50) | N |  |
| `market` | varchar(20) | Y |  |
| `leadType` | varchar(20) | Y |  |
| `homeowner` | varchar(3) | N |  |
| `current_provider` | varchar(150) | N |  |
| `electric_bill` | varchar(15) | N |  |
| `average_bill` | varchar(40) | N |  |
| `source` | mediumtext | N |  |
| `Aff_ID` | varchar(150) | N |  |
| `Sub_ID` | varchar(100) | N |  |
| `FSCode1` | varchar(150) | Y | MUL |
| `FSCode2` | varchar(150) | Y |  |
| `FSCode3` | varchar(255) | Y |  |
| `timestamp_affiliate` | varchar(50) | N |  |
| `income` | varchar(30) | N |  |
| `home_ownership_time` | varchar(20) | Y |  |
| `roof_age` | varchar(20) | Y |  |
| `roof_condition` | varchar(30) | Y |  |
| `roof_type` | varchar(30) | N |  |
| `roof_shade` | varchar(50) | Y |  |
| `credit_score` | varchar(50) | Y |  |
| `credit_score_num` | int | Y |  |
| `bankruptcy` | varchar(25) | Y |  |
| `HOA` | varchar(30) | N |  |
| `title` | varchar(3) | N |  |
| `callback_time` | datetime | N |  |
| `appointment` | varchar(50) | Y |  |
| `setClient` | varchar(30) | N |  |
| `setDate` | date | N |  |
| `OLeadID` | varchar(30) | N |  |
| `leadID` | varchar(10) | N |  |
| `callDispo` | varchar(255) | N | MUL |
| `freshCallDispo` | varchar(255) | N |  |
| `timestamp_CallCenter_Dispositioned` | varchar(30) | N |  |
| `response` | mediumtext | N |  |
| `additional` | longtext | N |  |
| `priorityOne` | varchar(10) | Y |  |
| `priorityTwo` | varchar(10) | Y |  |
| `priorityThree` | varchar(10) | Y |  |
| `Call_Count` | int | Y |  |
| `xxTrustedFormToken` | varchar(100) | Y |  |
| `xxTrustedFormCertUrl` | varchar(255) | Y |  |
| `leadIdToken` | varchar(100) | Y |  |
| `status1` | varchar(20) | N |  |
| `notes` | mediumtext | N |  |
| `system_size` | decimal(10,2) | N |  |
| `system_cost` | decimal(10,2) | N |  |
| `system_incentives` | decimal(10,2) | N |  |
| `system_downpayment` | decimal(10,2) | N |  |
| `years_in_home` | int | N |  |
| `date_of_birth` | date | N |  |
| `mortgage_payment` | int | N |  |
| `employer` | varchar(40) | N |  |
| `years_with_employer` | int | N |  |
| `annual_salary` | int | N |  |
| `files` | longtext | Y |  |
| `solar_contract` | longtext | Y |  |
| `credit_contract` | longtext | Y |  |
| `client_agent_name` | varchar(50) | N |  |

## `transfer_leads_owner`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `leadId` | int | N | MUL |
| `userId` | int | N | MUL |
| `assignedDate` | int | N |  |

## `transfer_leads_save_log`  ·  fact · ~227,189 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `OLeadID` | varchar(50) | N | MUL |
| `data` | longtext | N |  |
| `submissionTime` | timestamp | N |  |

## `transfer_leads_status`  ·  fact · ~235,293 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `leadId` | int | N | MUL |
| `OLeadID` | varchar(30) | N | MUL |
| `status` | varchar(100) | N |  |
| `statusId` | int | N | MUL |
| `setClient` | varchar(30) | N |  |
| `userId` | int | N | MUL |
| `updateTime` | timestamp | N |  |

## `transfer_scripts`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `type` | varchar(20) | N |  |
| `text` | mediumtext | N |  |

## `transfer_sms_client_log`  ·  dimension · ~7 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientId` | int | N |  |
| `phone` | varchar(20) | N | MUL |
| `systemPhone` | varchar(10) | N |  |
| `oLeadId` | varchar(30) | Y | MUL |
| `messageId` | varchar(100) | N |  |
| `direction` | varchar(20) | N |  |
| `content` | mediumtext | N |  |
| `attachments` | mediumtext | N |  |
| `log` | mediumtext | N |  |
| `insertionDate` | timestamp | N |  |

## `transfer_sms_client_phones`  ·  dimension · ~2 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientId` | int | N |  |
| `phone` | varchar(20) | N | UNI |
| `insertionDate` | timestamp | N |  |

## `transfer_sms_client_template_messages`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `clientId` | int | N |  |
| `type` | int | N |  |
| `featured` | tinyint | N |  |
| `name` | varchar(50) | N |  |
| `content` | mediumtext | N |  |

## `transfer_sms_log`  ·  fact · ~99,297 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `phone` | varchar(20) | N | MUL |
| `systemPhone` | varchar(10) | N |  |
| `oLeadId` | varchar(30) | Y | MUL |
| `messageId` | varchar(100) | N |  |
| `direction` | varchar(20) | N |  |
| `content` | mediumtext | N |  |
| `attachments` | mediumtext | N |  |
| `log` | mediumtext | N |  |
| `insertionDate` | timestamp | N |  |

## `visual_verify_leads`  ·  fact · ~64,442 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `first_name` | varchar(50) | N |  |
| `last_name` | varchar(50) | N |  |
| `email` | varchar(100) | N |  |
| `emailResponse` | varchar(150) | Y |  |
| `phone` | varchar(15) | N |  |
| `phoneResponse` | varchar(150) | Y |  |
| `address` | varchar(100) | N |  |
| `addressResponse` | varchar(150) | Y |  |
| `city` | varchar(50) | N |  |
| `state` | varchar(2) | N |  |
| `postal_code` | varchar(5) | N |  |
| `ip_address` | varchar(50) | N |  |
| `homeowner` | varchar(3) | N |  |
| `current_provider` | varchar(150) | Y |  |
| `electric_bill` | varchar(50) | Y |  |
| `source` | mediumtext | N |  |
| `Aff_ID` | varchar(50) | N |  |
| `Sub_ID` | varchar(50) | N |  |
| `FSCode1` | varchar(150) | Y |  |
| `FSCode2` | varchar(150) | Y |  |
| `FSCode3` | varchar(255) | Y |  |
| `timestamp_affiliate` | varchar(50) | N |  |
| `roof_shade` | varchar(50) | Y |  |
| `credit_score` | varchar(50) | Y |  |
| `appointment` | varchar(50) | Y |  |
| `OLeadID` | varchar(30) | N |  |
| `leadID` | varchar(10) | N |  |
| `callDispo` | varchar(255) | Y |  |
| `timestamp_CallCenter_Dispositioned` | varchar(30) | Y |  |
| `response` | mediumtext | N |  |
| `additional` | longtext | N |  |
| `priorityOne` | varchar(10) | Y |  |
| `priorityTwo` | varchar(10) | Y |  |
| `priorityThree` | varchar(100) | Y |  |
| `Call_Count` | int | Y |  |
| `leadIdToken` | varchar(100) | Y |  |
| `xxTrustedFormCertUrl` | varchar(255) | Y |  |
| `xxTrustedFormToken` | varchar(100) | Y |  |

## `visual_verify_providers`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `code` | varchar(10) | N |  |
| `name` | varchar(100) | N |  |

## `visual_verify_scripts`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `type` | varchar(20) | N |  |
| `text` | mediumtext | N |  |

## `vv_revived_leads`  ·  dimension · ~10,855 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `first_name` | varchar(50) | N |  |
| `last_name` | varchar(50) | N |  |
| `email` | varchar(100) | N |  |
| `emailResponse` | varchar(150) | Y |  |
| `phone` | varchar(15) | N |  |
| `phoneResponse` | varchar(150) | Y |  |
| `address` | varchar(100) | N |  |
| `addressResponse` | varchar(150) | Y |  |
| `city` | varchar(50) | N |  |
| `state` | varchar(2) | N |  |
| `postal_code` | varchar(5) | N |  |
| `ip_address` | varchar(50) | N |  |
| `homeowner` | varchar(3) | N |  |
| `current_provider` | varchar(150) | Y |  |
| `electric_bill` | varchar(50) | Y |  |
| `source` | mediumtext | N |  |
| `Aff_ID` | varchar(50) | N |  |
| `Sub_ID` | varchar(50) | N |  |
| `FSCode1` | varchar(150) | Y |  |
| `FSCode2` | varchar(150) | Y |  |
| `FSCode3` | varchar(255) | N |  |
| `timestamp_affiliate` | datetime | N |  |
| `roof_shade` | varchar(50) | Y |  |
| `credit_score` | varchar(50) | Y |  |
| `appointment` | varchar(50) | Y |  |
| `OLeadID` | varchar(30) | N |  |
| `leadID` | varchar(10) | N |  |
| `callDispo` | varchar(255) | Y |  |
| `timestamp_CallCenter_Dispositioned` | varchar(30) | Y |  |
| `response` | mediumtext | N |  |
| `additional` | longtext | N |  |
| `priorityOne` | varchar(10) | Y |  |
| `priorityTwo` | varchar(10) | Y |  |
| `priorityThree` | varchar(100) | Y |  |
| `Call_Count` | int | Y |  |
| `leadIdToken` | varchar(100) | Y |  |
| `xxTrustedFormCertUrl` | varchar(255) | Y |  |
| `xxTrustedFormToken` | varchar(100) | Y |  |

## `vv_revived_providers`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `code` | varchar(10) | N |  |
| `name` | varchar(100) | N |  |

## `vv_revived_scripts`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `type` | varchar(20) | N |  |
| `text` | mediumtext | N |  |

## `vw_dialer_leads`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `leadId` | int | N |  |
| `OLeadID` | varchar(30) | N |  |
| `phone` | varchar(15) | N |  |
| `postalCode` | varchar(5) | N |  |
| `callbackTime` | datetime | N |  |
| `lastServed` | datetime | N |  |
| `currentStatus` | int | N |  |
| `dialableDispos` | varchar(100) | Y |  |
| `insertionDate` | timestamp | N |  |
| `maxDailyAttempts` | int | Y |  |
| `maxAttempts` | int | Y |  |
| `bonusAttempts` | int | Y |  |
| `bonusHour` | time | Y |  |
| `callAllowanceMinutes` | int | Y |  |
| `leadType` | varchar(20) | Y |  |
| `timezoneOffsetHoursMT` | int | Y |  |
| `timezoneOffsetMT` | datetime | Y |  |
| `activeCallBack` | int | Y |  |
| `activeBonusAttempt` | int | Y |  |
| `expiredFresh` | int | Y |  |
| `fresh` | int | N |  |
| `totalAttempts` | decimal(23,0) | N |  |
| `todayAttempts` | decimal(23,0) | N |  |
| `lastAttempt` | timestamp | Y |  |
| `attemptRest` | int | Y |  |

## `vw_dialer_leads2_temp1`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | Y |  |
| `OLeadID` | varchar(30) | Y |  |
| `postal_code` | varchar(5) | Y |  |
| `callback_time` | datetime | Y |  |
| `lastServed` | datetime | Y |  |
| `statusId` | int | N |  |
| `dialableDispositions` | varchar(100) | Y |  |
| `activeCallback` | int | Y |  |
| `activeBonusAttempt` | int | Y |  |
| `expiredFresh` | int | Y |  |
| `fresh` | int | Y |  |
| `totalAttempts` | bigint | Y |  |
| `insertionDate` | timestamp | Y |  |
| `maxAttempts` | int | Y |  |
| `maxDailyAttempts` | int | Y |  |
| `bonusAttempts` | int | Y |  |
| `bonusHour` | time | Y |  |
| `callAllowanceMinutes` | int | Y |  |
| `todayAttempts` | bigint | Y |  |
| `lastAttempt` | timestamp | Y |  |
| `attemptRest` | bigint | Y |  |
| `timezoneOffsetHoursMT` | int | Y |  |

## `vw_dialer_leads_temp01`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `OLeadID` | varchar(30) | N |  |
| `phone` | varchar(15) | N |  |
| `postal_code` | varchar(5) | N |  |
| `callback_time` | datetime | N |  |
| `lastServed` | datetime | N |  |
| `statusId` | int | N |  |
| `dialableDispositions` | varchar(100) | Y |  |
| `insertionDate` | timestamp | N |  |
| `maxAttempts` | int | Y |  |
| `maxDailyAttempts` | int | Y |  |
| `bonusAttempts` | int | Y |  |
| `bonusHour` | time | Y |  |
| `callAllowanceMinutes` | int | Y |  |
| `leadType` | varchar(20) | Y |  |
| `timezoneOffsetHoursMT` | int | Y |  |
| `timezoneOffsetMT` | datetime | Y |  |

## `vw_dialer_leads_temp02`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `OLeadID` | varchar(30) | N |  |
| `phone` | varchar(15) | N |  |
| `postal_code` | varchar(5) | N |  |
| `callback_time` | datetime | N |  |
| `lastServed` | datetime | N |  |
| `statusId` | int | N |  |
| `dialableDispositions` | varchar(100) | Y |  |
| `insertionDate` | timestamp | N |  |
| `maxAttempts` | int | Y |  |
| `maxDailyAttempts` | int | Y |  |
| `bonusAttempts` | int | Y |  |
| `bonusHour` | time | Y |  |
| `callAllowanceMinutes` | int | Y |  |
| `leadType` | varchar(20) | Y |  |
| `timezoneOffsetHoursMT` | int | Y |  |
| `timezoneOffsetMT` | datetime | Y |  |
| `activeBonusAttempt` | int | Y |  |
| `expiredFresh` | int | Y |  |
| `fresh` | int | N |  |
| `totalAttempts` | decimal(23,0) | N |  |
| `todayAttempts` | decimal(23,0) | N |  |
| `lastAttempt` | timestamp | Y |  |
| `activeCallback` | int | Y |  |

## `vw_dialer_leads_temp1`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `OLeadID` | varchar(30) | N |  |
| `phone` | varchar(15) | N |  |
| `postal_code` | varchar(5) | N |  |
| `callback_time` | datetime | N |  |
| `lastServed` | datetime | N |  |
| `statusId` | int | N |  |
| `dialableDispositions` | varchar(100) | Y |  |
| `insertionDate` | timestamp | N |  |
| `maxAttempts` | int | Y |  |
| `maxDailyAttempts` | int | Y |  |
| `bonusAttempts` | int | Y |  |
| `bonusHour` | time | Y |  |
| `callAllowanceMinutes` | int | Y |  |
| `leadType` | varchar(20) | Y |  |
| `timezoneOffsetHoursMT` | int | Y |  |
| `timezoneOffsetMT` | datetime | Y |  |

## `vw_dialer_leads_temp2`  ·  view · ~0 rows · 
_VIEW_

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N |  |
| `OLeadID` | varchar(30) | N |  |
| `phone` | varchar(15) | N |  |
| `postal_code` | varchar(5) | N |  |
| `callback_time` | datetime | N |  |
| `lastServed` | datetime | N |  |
| `statusId` | int | N |  |
| `dialableDispositions` | varchar(100) | Y |  |
| `insertionDate` | timestamp | N |  |
| `maxDailyAttempts` | int | Y |  |
| `maxAttempts` | int | Y |  |
| `bonusAttempts` | int | Y |  |
| `bonusHour` | time | Y |  |
| `callAllowanceMinutes` | int | Y |  |
| `leadType` | varchar(20) | Y |  |
| `timezoneOffsetHoursMT` | int | Y |  |
| `timezoneOffsetMT` | datetime | Y |  |
| `activeCallback` | int | Y |  |
| `activeBonusAttempt` | int | Y |  |
| `expiredFresh` | int | Y |  |
| `fresh` | int | N |  |
| `totalAttempts` | decimal(23,0) | N |  |
| `todayAttempts` | decimal(23,0) | N |  |
| `lastAttempt` | timestamp | Y |  |

## `warranty_leads`  ·  dimension · ~6,346 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `first_name` | varchar(50) | N |  |
| `last_name` | varchar(50) | N |  |
| `email` | varchar(100) | N |  |
| `emailResponse` | varchar(150) | Y |  |
| `phone` | varchar(15) | N |  |
| `phoneResponse` | varchar(150) | Y |  |
| `address` | varchar(100) | N |  |
| `addressResponse` | varchar(150) | Y |  |
| `city` | varchar(50) | N |  |
| `state` | varchar(2) | N |  |
| `postal_code` | varchar(5) | N |  |
| `ip_address` | varchar(50) | N |  |
| `homeowner` | varchar(3) | N |  |
| `current_provider` | varchar(150) | Y |  |
| `electric_bill` | varchar(50) | Y |  |
| `source` | mediumtext | N |  |
| `Aff_ID` | varchar(50) | N |  |
| `Sub_ID` | varchar(50) | N |  |
| `FSCode1` | varchar(150) | Y |  |
| `FSCode2` | varchar(150) | Y |  |
| `FSCode3` | varchar(255) | Y |  |
| `timestamp_affiliate` | varchar(50) | N |  |
| `OLeadID` | varchar(30) | N |  |
| `leadID` | varchar(10) | N |  |
| `callDispo` | varchar(255) | N |  |
| `timestamp_CallCenter_Dispositioned` | varchar(30) | N |  |
| `response` | mediumtext | N |  |
| `additional` | longtext | N |  |
| `priorityOne` | varchar(10) | Y |  |
| `priorityTwo` | varchar(10) | Y |  |
| `priorityThree` | varchar(10) | Y |  |
| `leadIdToken` | varchar(100) | N |  |
| `Call_Count` | int | Y |  |

## `warranty_providers`  ·  dimension · ~0 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `code` | varchar(10) | N |  |
| `name` | varchar(100) | N |  |

## `warranty_scripts`  ·  dimension · ~2 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int | N | PRI |
| `type` | varchar(20) | N |  |
| `text` | mediumtext | N |  |
