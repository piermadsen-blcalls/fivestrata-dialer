# Query cookbook — read-only VICI queries, parameterized by server

MariaDB note: fsbr, fsbrv, fswn run MariaDB 10.1 — **no window functions** (`OVER ()` fails); stick to GROUP BY aggregates for queries that must run everywhere. KB servers are EST/EDT, TD servers MST — CURDATE() means server-local.

Conventions: run against a specific replica from `references/servers.md` (creds from env, see SKILL.md). All queries are read-only and PII-lean — they return aggregates or non-PII columns. Replace `:from`/`:to` with dates. Because all 7 servers share the schema, every query here works on any of them; the *meaning* of results depends on which server (business line, fresh/revive) you hit.

## Daily call volume by campaign and status
```sql
SELECT campaign_id, status, DATE(call_date) AS d, COUNT(*) AS calls,
       ROUND(AVG(length_in_sec),1) AS avg_sec
FROM vicidial_log
WHERE call_date >= :from AND call_date < :to
GROUP BY campaign_id, status, d
ORDER BY d, campaign_id, calls DESC;
```

## Disposition mix yesterday (with human-readable names)
```sql
SELECT vl.status,
       COALESCE(vcs.status_name, vs.status_name, '(unnamed)') AS status_name,
       COUNT(*) AS calls
FROM vicidial_log vl
LEFT JOIN vicidial_campaign_statuses vcs
       ON vcs.status = vl.status AND vcs.campaign_id = vl.campaign_id
LEFT JOIN vicidial_statuses vs ON vs.status = vl.status
WHERE vl.call_date >= CURDATE() - INTERVAL 1 DAY AND vl.call_date < CURDATE()
GROUP BY vl.status, status_name
ORDER BY calls DESC;
```

## Agent performance (talk/pause/wait/dispo time)
```sql
SELECT user, COUNT(*) AS interactions,
       SUM(talk_sec) AS talk, SUM(pause_sec) AS pause,
       SUM(wait_sec) AS wait, SUM(dispo_sec) AS dispo
FROM vicidial_agent_log
WHERE event_time >= :from AND event_time < :to
GROUP BY user ORDER BY talk DESC;
```

## List penetration / lead-status funnel (no PII)
```sql
SELECT list_id, status, COUNT(*) AS leads,
       ROUND(AVG(called_count),2) AS avg_calls_per_lead
FROM vicidial_list
GROUP BY list_id, status
ORDER BY list_id, leads DESC;
```

## Lists and their meaning (find fresh/revive segmentation on TD)
```sql
SELECT l.list_id, l.list_name, l.campaign_id, l.active, COUNT(vl.lead_id) AS leads
FROM vicidial_lists l LEFT JOIN vicidial_list vl ON vl.list_id = l.list_id
GROUP BY l.list_id, l.list_name, l.campaign_id, l.active
ORDER BY leads DESC;
```

## Transfers in a window
```sql
SELECT campaign_id, DATE(xfer_date) AS d, COUNT(*) AS transfers
FROM vicidial_xfer_log
WHERE xfer_date >= :from AND xfer_date < :to
GROUP BY campaign_id, d ORDER BY d;
```

## Inbound (closer) volume and queue times
```sql
SELECT campaign_id, DATE(call_date) AS d, COUNT(*) AS calls,
       ROUND(AVG(queue_seconds),1) AS avg_queue_sec, SUM(xfercount) AS xfers
FROM vicidial_closer_log
WHERE call_date >= :from AND call_date < :to
GROUP BY campaign_id, d ORDER BY d;
```

## Data recency / retention check (run when validating a replica)
```sql
SELECT MIN(call_date) AS oldest, MAX(call_date) AS newest, COUNT(*) AS total
FROM vicidial_log;
```

## Cross-server aggregation pattern

To answer "all bathroom activity": run the same query on `fsbr`, `fsbrv`, `td-bathroom`, tag each result set with the server alias and lead_type from servers.md, then union in pandas/Excel. Do NOT try federated joins across replicas; move aggregates, not rows. A python loop over `scripts/servers.json` using the same connection helper as the profiler is the standard pattern:

```python
from scripts.profile_server import iter_servers, connect  # reuses env-var creds
for center_name, cfg, srv in iter_servers(center=None):    # or center="baretel"
    conn = connect(cfg, srv)
    ...  # run query, tag rows with srv["alias"]; conn.close()
```

## Looking up a specific lead (PII discipline)

When you must inspect a lead row, select only the columns needed, e.g. `lead_id, status, list_id, called_count, last_local_call_time, vendor_lead_code` — leave name/address/email/phone out unless the task requires them, and never persist them into this skill or chat artifacts.
