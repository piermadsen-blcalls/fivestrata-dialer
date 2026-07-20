# Schema overview

FiveStrata MySQL database (server 8.4.7). Schemas in scope:

| schema | tables | classifications | approx rows | purpose |
|---|---|---|---|---|
| `darwin_poc` | 7 | dimension:2, fact:5 | ~12,222,508 | Proof-of-concept / experimental dataset (Darwin). Two large fact tables; treat as non-production unless confirmed. |
| `techss_QA` | 7 | dimension:6, view:1 | ~9,546 | QA fixtures and call-center audit sampling. Small. |
| `techss_RIB` | 52 | dimension:41, view:11 | ~4 | RV Inventory Batch — mostly views over revived-inventory batch state and timing. |
| `techss_RV` | 87 | dimension:64, fact:3, view:20 | ~12,382,031 | Revived Inventory — the working set of revived leads/inventory plus daily/weekly state and timing views. |
| `techss_all_leads` | 130 | dimension:48, fact:56, view:26 | ~1,889,485,665 | THE LEAD CORE. Raw and revived lead records, validation, LeadConduit/TrustedForm/Jornaya tokens, DNC, affiliate, call-center, and transfer data. Largest and most PII-sensitive schema (~1.9B rows). |
| `techss_audit` | 20 | dimension:15, fact:5 | ~70,241,349 | Audit trails and staging/temp audit tables tying URLs/roots to lead ids. |
| `techss_call_center_data` | 1 | dimension:1 | ~144 | Single small call-center reference table. |
| `techss_clientportal` | 7 | dimension:7 | ~3,831 | Client-portal app tables (small). |
| `techss_dl` | 174 | dimension:127, fact:25, view:22 | ~130,410,138 | Lead Distribution — clients, ZIP coverage, bids/prices, transfer priorities, dialer/staging logs, and many distribution views. |
| `techss_dwh` | 25 | dimension:22, fact:3 | ~3,068,130 | Data warehouse. Includes the Meridius sent-leads dataset, client rate overrides, and holiday calendar. |
| `techss_experiments` | 9 | dimension:5, fact:4 | ~3,909,772 | Experiment / A-B test data sets. |
| `techss_log` | 27 | dimension:20, fact:7 | ~51,420,948 | Operational logs, including (un)revive lead batch logs. |
| `techss_partners` | 7 | dimension:7 | ~54 | Partner reference data (small). |
| `techss_phone_system` | 14 | dimension:10, fact:4 | ~1,108,961 | Phone/dialer system tables and call facts. |
| `techss_prism` | 9 | dimension:9 | ~166 | Prism configuration/reference (small). |
| `techss_reporting` | 150 | dimension:121, fact:8, view:21 | ~57,270,737 | Reporting layer — dashboards, conversion views, intake facts, and many reporting dimensions. |
| `techss_system` | 32 | dimension:29, fact:3 | ~1,171,014 | System/application configuration, including navigation menus. |
| `techss_wv` | 49 | dimension:26, fact:8, view:15 | ~1,238,568 | Web Verify — visual-verification, review, return, and transfer scripts/providers plus dialer-lead views. |

Empty schemas (0 tables profiled): `admin`, `innodb`, `techss_lead_inventory`, `tmp`