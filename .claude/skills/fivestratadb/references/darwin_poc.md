# Schema `darwin_poc`

Proof-of-concept / experimental dataset (Darwin). Two large fact tables; treat as non-production unless confirmed.

**7 tables** — dimension: 2, fact: 5

## `darwin_data`  ·  fact · ~9,488,871 rows · InnoDB
PK: `ID`

| column | type | null | key |
|---|---|---|---|
| `ID` | int unsigned | N | PRI |
| `OLeadID` | varchar(36) | N | MUL |
| `State` | varchar(10) | Y | MUL |
| `Zip` | varchar(5) | Y | MUL |
| `County` | varchar(100) | Y |  |
| `VT` | varchar(3) | Y | MUL |
| `SC` | varchar(3) | Y |  |
| `CP` | varchar(10) | Y |  |
| `C0` | varchar(3) | Y |  |
| `CC` | varchar(3) | Y |  |
| `insertionDate` | datetime | N | MUL |

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

## `darwin_data_export_br`  ·  fact · ~212,490 rows · InnoDB
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

## `darwin_data_export_hw`  ·  fact · ~181,637 rows · InnoDB
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

## `darwin_data_export_sl`  ·  dimension · ~988 rows · InnoDB
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

## `darwin_data_export_wi`  ·  fact · ~172,665 rows · InnoDB
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

## `results_20260601`  ·  fact · ~2,165,857 rows · InnoDB

| column | type | null | key |
|---|---|---|---|
| `Zip` | varchar(5) | N |  |
| `State` | varchar(5) | Y |  |
| `County` | varchar(100) | Y |  |
| `SC` | varchar(3) | Y |  |
| `CP` | varchar(10) | Y |  |
| `sent_pct_br` | decimal(27,4) | N |  |
| `sent_pct_wi` | decimal(27,4) | N |  |
| `sent_pct_sl` | decimal(27,4) | N |  |
| `sent_pct_hw` | decimal(27,4) | N |  |
| `rpl_br` | decimal(7,2) | N |  |
| `rpl_wi` | decimal(7,2) | N |  |
| `rpl_sl` | decimal(7,2) | N |  |
| `rpl_hw` | decimal(7,2) | N |  |
| `hpa_br` | decimal(65,30) | Y |  |
| `hpa_wi` | decimal(65,30) | Y |  |
| `hpa_sl` | decimal(65,30) | Y |  |
| `hpa_hw` | decimal(65,30) | Y |  |
| `mcpr` | decimal(8,4) | N |  |
| `max_cpr_br` | decimal(40,4) | Y |  |
| `max_cpr_wi` | decimal(40,4) | Y |  |
| `max_cpr_sl` | decimal(40,4) | Y |  |
| `max_cpr_hw` | decimal(40,4) | Y |  |
| `mpr_br` | decimal(40,4) | Y |  |
| `mpr_wi` | decimal(40,4) | Y |  |
| `mpr_sl` | decimal(40,4) | Y |  |
| `mpr_hw` | decimal(40,4) | Y |  |
| `top_vt` | varchar(2) | Y |  |
| `max_cpr_top` | decimal(40,4) | Y |  |
| `target_flag` | int | N |  |
| `needed_rpl_br` | decimal(40,4) | Y |  |
| `needed_rpl_wi` | decimal(40,4) | Y |  |
| `needed_rpl_sl` | decimal(40,4) | Y |  |
| `needed_rpl_hw` | decimal(40,4) | Y |  |
