# Schema `techss_call_center_data`

Single small call-center reference table.

**1 tables** — dimension: 1

## `temp_table_pc_send`  ·  dimension · ~144 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `send_id` | int | Y |  |
| `date` | date | Y |  |
| `OLeadID` | varchar(100) | Y |  |
| `client` | varchar(30) | Y |  |
| `clientId` | int | Y |  |
| `phone` | varchar(15) | N |  |
| `captureDate` | varchar(80) | Y |  |
