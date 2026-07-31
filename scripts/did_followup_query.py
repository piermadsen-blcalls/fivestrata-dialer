#!/usr/bin/env python3
"""did_followup_query.py -- three fix-up queries after did_deepdive_query.py findings.

1. E2: the answer-rate decay curve stratified BY CAMPAIGN (the v1 curve conflated the
   WINDOW revive campaign (~5% answered) with WIFRESH (~70%) -- campaign mix confounds it).
2. F2: hourly dial/slot pattern from the ARCHIVE (14d) -- the live vicidial_log window was
   ~2 days and cut mid-day by replication.
3. H2: worst DIDs by carrier DECLINE share -- v1 checked Q.850 cause 21; this box logs SIP
   response codes, so the spam-block signal is 603 Decline (+403 Forbidden, 503 shown too).

Same env vars as did_caps_query.py. Results -> ...\\did-caps\\<host>\\deepdive\\ alongside v1.
"""
import csv
import os
import sys
import time

import pymysql

USER = os.environ.get("CCDB_TOPDIAL_USER")
PASS = os.environ.get("CCDB_TOPDIAL_PASS")
HOST = os.environ.get("CCDB_TOPDIAL_HOST")
DB = os.environ.get("CCDB_TOPDIAL_DB")

if not all([USER, PASS, HOST, DB]):
    sys.exit("Set CCDB_TOPDIAL_USER, CCDB_TOPDIAL_PASS, CCDB_TOPDIAL_HOST, CCDB_TOPDIAL_DB first.")

OUT_DIR = os.path.join(r"C:\Claude\scratch\did-caps", HOST, "deepdive")
os.makedirs(OUT_DIR, exist_ok=True)

DID = "COALESCE(NULLIF(SUBSTRING_INDEX(SUBSTRING_INDEX(dl.outbound_cid,'<',-1),'>',1),''), dl.outbound_cid)"
ANSWERED = "CASE WHEN COALESCE(vcs.human_answered, vs.human_answered) = 'Y' THEN 1 ELSE 0 END"
STATUS_JOINS = (
    " LEFT JOIN vicidial_campaign_statuses vcs"
    "   ON vcs.status = vl.status AND vcs.campaign_id = vl.campaign_id"
    " LEFT JOIN vicidial_statuses vs ON vs.status = vl.status"
)

QUERIES = {
    # Decay curve per campaign: does answer rate fall with dials/DID/day *within* a campaign?
    "E2_decay_by_campaign_21d": (
        f"SELECT campaign_id, bucket, COUNT(*) AS did_days, SUM(dials) AS dials,"
        f"       SUM(answered) AS answered,"
        f"       ROUND(SUM(answered) / SUM(dials) * 100, 2) AS answer_pct"
        f" FROM ("
        f"   SELECT t.campaign_id, t.did, t.dial_day, t.dials, t.answered,"
        f"     CASE WHEN t.dials <= 10 THEN '01: 1-10' WHEN t.dials <= 25 THEN '02: 11-25'"
        f"          WHEN t.dials <= 50 THEN '03: 26-50' WHEN t.dials <= 100 THEN '04: 51-100'"
        f"          WHEN t.dials <= 200 THEN '05: 101-200' ELSE '06: 200+' END AS bucket"
        f"   FROM ("
        f"     SELECT vl.campaign_id, {DID} AS did, DATE(dl.call_date) AS dial_day,"
        f"            COUNT(*) AS dials, SUM({ANSWERED}) AS answered"
        f"     FROM vicidial_dial_log_archive dl"
        f"     JOIN vicidial_log_archive vl ON vl.uniqueid = dl.uniqueid"
        f"       AND vl.call_date >= CURDATE() - INTERVAL 22 DAY"
        f"     {STATUS_JOINS}"
        f"     WHERE dl.call_date >= CURDATE() - INTERVAL 21 DAY"
        f"     GROUP BY vl.campaign_id, did, dial_day"
        f"   ) t"
        f" ) x GROUP BY campaign_id, bucket ORDER BY campaign_id, bucket"
    ),

    # Hourly pattern from the archive, 14 days (server-local time; TD = MST)
    "F2_hourly_slot_archive_14d": (
        f"SELECT HOUR(vl.call_date) AS hr, COUNT(*) AS dials,"
        f"       ROUND(AVG(vl.length_in_sec), 1) AS avg_slot_sec,"
        f"       SUM({ANSWERED}) AS answered,"
        f"       ROUND(AVG(CASE WHEN COALESCE(vcs.human_answered, vs.human_answered) = 'Y'"
        f"                      THEN vl.length_in_sec END), 1) AS avg_sec_answered"
        f" FROM vicidial_log_archive vl"
        f" {STATUS_JOINS}"
        f" WHERE vl.call_date >= CURDATE() - INTERVAL 14 DAY"
        f" GROUP BY hr ORDER BY hr"
    ),

    # Worst DIDs by carrier-decline share, 30 days, min 300 dials (SIP codes, not Q.850)
    "H2_worst_dids_declines_30d": (
        f"SELECT {DID} AS did, COUNT(*) AS dials,"
        f"       SUM(dl.sip_hangup_cause = 603) AS declined_603,"
        f"       SUM(dl.sip_hangup_cause = 403) AS forbidden_403,"
        f"       SUM(dl.sip_hangup_cause = 503) AS unavail_503,"
        f"       ROUND(SUM(dl.sip_hangup_cause IN (403, 603)) / COUNT(*) * 100, 2) AS decline_pct"
        f" FROM vicidial_dial_log_archive dl"
        f" WHERE dl.call_date >= CURDATE() - INTERVAL 30 DAY"
        f" GROUP BY did HAVING dials >= 300 ORDER BY decline_pct DESC LIMIT 40"
    ),
}


def main():
    conn = pymysql.connect(
        host=HOST, port=3306, user=USER, password=PASS, database=DB,
        charset="utf8mb4", read_timeout=1800, connect_timeout=15,
    )
    failures = []
    try:
        for name, sql in QUERIES.items():
            start = time.time()
            print(f"\n== {name} ...", flush=True)
            try:
                with conn.cursor() as cur:
                    cur.execute(sql)
                    cols = [d[0] for d in cur.description]
                    rows = cur.fetchall()
            except Exception as exc:
                print(f"   FAILED after {time.time() - start:.0f}s: {exc}")
                failures.append(name)
                continue

            path = os.path.join(OUT_DIR, f"{name}.csv")
            with open(path, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(cols)
                writer.writerows(rows)
            print(f"   {len(rows)} rows in {time.time() - start:.0f}s -> {path}")

            if len(rows) <= 45:
                print("   " + " | ".join(str(c) for c in cols))
                for row in rows:
                    print("   " + " | ".join(str(v) for v in row))
    finally:
        conn.close()

    print(f"\nDone. Results in {OUT_DIR}")
    if failures:
        print(f"Failed queries: {', '.join(failures)}")


if __name__ == "__main__":
    main()
