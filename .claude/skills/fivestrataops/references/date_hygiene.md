# Date binning & hygiene — read before any cross-source aggregation

Multiple sources describe the SAME activity with DIFFERENT dates. The cardinal rule: **bin every record to its TRAFFIC DATE (the business day the calls/leads actually happened), never to the email-arrival or file-save date.** Always state which convention a number uses when reporting it.

## Canonical time base

Business days are **Pacific Time** (the ops team and MDB operate PT). Email arrival times below are UTC. The dialer side differs: KB replicas run EST/EDT, TD replicas MST, prod may differ again — convert before comparing hour-level data. Date-only comparisons are usually safe if everything is first binned to traffic date.

## Per-source date semantics

| source | arrival (UTC) | covers | how to get traffic date |
|---|---|---|---|
| MDB daily file `... - M.D.YYYY.xlsx` | saved morning PT | data through EOD the PRIOR day | filename date − 1 = last complete traffic day. Row-level tabs have real `Date` columns — trust those |
| Brandon's Teams "MDB updated" post | morning PT | same as the day's MDB file | post date − 1 |
| BT Wholesale usage email (§5) | ~08:15 | "last 24 hours" | **no date token in subject** → receivedDateTime (UTC) − 1 day ≈ traffic date; label as approximate |
| KB Daily Agent / Qualified / Hot Leads (§6) | ~08:30 / ~10:00 / ~11:30, **weekdays' traffic only** (Fri traffic arrives Sat; nothing Sun/Mon) | prior weekday | **use the YYYY-MM-DD token in the subject** — it IS the traffic date. Never use arrival date |
| KB Dialer Congestion (§6) | ~23:15 | SAME day | subject date = traffic date (the one same-day series) |
| Dialable Lead Counts (§12) | HOURLY at :15 ET | point-in-time snapshot, not a period | timestamp in body ("at YYYY-MM-DD HH:15 ET"); ET not UTC; never sum snapshots |
| KPI mailer families (§11) | various | see §11 | **mailer largely silent since ~2026-06-22 — verify liveness before use** |
| KB DID (§6) | Sundays | prior week | subject date = report date; contents span the week |
| TD Daily Non-Pause Hours (§7) | weekdays, midday | prior BUSINESS day | date in subject; Monday can deliver Thu AND Fri as two separate emails; weekends simply unreported — verify per-date coverage before summing a week |
| TD Weekly Reports / NAs (§7) | Sunday evenings | prior week | MM-DD token = week-ending marker |
| TopDial invoice (Jaintel) | daily | prior day (billing) | date in subject |
| CanadaDirect Daily/Reserve Reports (§8/§9) | ~11:15/~11:26 | prior day; Daily is Tue–Sat only | filename token; the SharePoint copy has a real `DialingDate` column — trust it over the filename |
| CanadaDirect Monday weeklies (§9) | Mon ~11:20/~11:25 | prior week (Mon–Sun) | filename token = SUNDAY week-end date |
| KB/TD replicas (callcenterdb) | refresh ~2pm PDT | T-1 snapshot | event timestamps in server-local tz (EST/MST); week-spanning queries must UNION `vicidial_agent_log` + `_archive` |
| prod `techss_*` (fivestratadb) | live | live | row timestamps; confirm tz per table before joining |
| CV Dashboard (§10) | weekly, Mondays | trailing ~12 months, monthly grain | filename date = build Monday (double-space quirk); partner-month cells change as the month accretes — cite build date |
| Call Center Cost Analysis sheet | hand-keyed | provider x CALENDAR MONTH | invoice-month granularity; lags invoices; no daily/vertical split — don't reconcile against daily sources except as monthly sums |
| FS BL Client Summary | hand-maintained + partial SF automation | monthly snapshot blocks per client | Client Performance = stacked month blocks (newest on top); MoM Revenue headers have corrupted years — trust COLUMN ORDER; sentiment Status is as-of-edit, not timestamped; SF auto-refresh was failing as of the 2026-07 snapshot |

## Binning rules

1. **Derive traffic date from the subject/filename token whenever one exists.** Arrival timestamps drift (retries, re-sends, holidays) — tokens don't.
2. **BT Wholesale is the exception** (no token): receivedDate − 1, and say so. Sanity-check against the same server's KB agent report (which HAS a token) — their volumes should co-move.
3. **Zero-days**: a report showing zero traffic (e.g. July 4th weekend) belongs to the zero traffic date, not skipped — keep the day in the series so MTD math and pace denominators stay honest.
4. **MTD windows**: state the window explicitly ("traffic dates Jul 1–10"). An MTD built from D-1 sources NEVER includes today. The MDB resets input tabs at month start; month-boundary traffic (last day of month, emailed on the 1st) belongs to the OLD month.
5. **Duplicates**: same-day re-sends exist (MDB ` -1` suffix files, occasional re-sent report emails). Dedupe by (source, server, traffic date), keeping the latest arrival.
6. **Cross-source joins**: join on (server/vertical, traffic date) only after both sides are binned; never join arrival-date to traffic-date. Fresh/revive splits: KB encodes by server+campaign, MDB Hours by VT suffix (HWF/WIFR/BRF), TD by subject tokens (FR/RV) — normalize to a common {VT, fresh|revive} pair first.
7. **DST**: UTC arrival times shift ±1h at DST changes; replica tz offsets change too. Around March/November transitions, prefer date tokens and re-verify any hour-level reconciliation.
8. **Week conventions**: MDB `WeekNum` is the workbook's own numbering — read it from the data, don't recompute with ISO weeks. TD/KB "weekly" reports are Sunday-anchored.

## Reporting hygiene

When answering any metric question, include: the traffic-date window, the source, and its lag (e.g. "traffic through Jul 9, per the 7/10 MDB"). If two sources disagree, check binning FIRST — most "discrepancies" are a one-day offset, a weekend roll-up, or an arrival-vs-traffic mix-up, in that order.
