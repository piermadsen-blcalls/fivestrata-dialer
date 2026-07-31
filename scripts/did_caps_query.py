#!/usr/bin/env python3
"""did_caps_query.py -- max intraday dials per outbound DID on a VICIdial replica.

Answers the 7/29 open question: do DIDs exceed ~1,500 dials/day on the human floors?

Usage (PowerShell):
    $env:CCDB_TOPDIAL_USER = "..."
    $env:CCDB_TOPDIAL_PASS = "..."
    $env:CCDB_TOPDIAL_HOST = "116.202.196.60"   # td-windows; 142.132.197.142 = td-bathroom
    $env:CCDB_TOPDIAL_DB   = "asterisk"
    python scripts/did_caps_query.py

Read-only. Results saved as CSVs under C:\\Claude\\scratch\\did-caps\\<host>\\ and small
result sets are echoed to stdout. No credentials are stored or written anywhere.
Queries are MariaDB 10.1-safe (no window functions). Replica data is T-1 (snapshots ~2pm PDT).
"""
import csv
import os
import sys

import pymysql

USER = os.environ.get("CCDB_TOPDIAL_USER")
PASS = os.environ.get("CCDB_TOPDIAL_PASS")
HOST = os.environ.get("CCDB_TOPDIAL_HOST")
DB = os.environ.get("CCDB_TOPDIAL_DB")

if not all([USER, PASS, HOST, DB]):
    sys.exit("Set CCDB_TOPDIAL_USER, CCDB_TOPDIAL_PASS, CCDB_TOPDIAL_HOST, CCDB_TOPDIAL_DB first.")

OUT_DIR = os.path.join(r"C:\Claude\scratch\did-caps", HOST)
os.makedirs(OUT_DIR, exist_ok=True)

DID_EXPR = (
    "COALESCE(NULLIF(SUBSTRING_INDEX(SUBSTRING_INDEX(outbound_cid,'<',-1),'>',1),''), outbound_cid)"
)

QUERIES = {
    # How far back does the live dial log go? (archives aggressively on some boxes)
    "0_window": (
        "SELECT MIN(call_date) AS oldest, MAX(call_date) AS newest, COUNT(*) AS rows_live "
        "FROM vicidial_dial_log"
    ),
    # Peak dials per DID per day, last 14 days
    "1_top_did_days": (
        f"SELECT dial_day, did, dials FROM ("
        f"  SELECT DATE(call_date) AS dial_day, {DID_EXPR} AS did, COUNT(*) AS dials"
        f"  FROM vicidial_dial_log"
        f"  WHERE call_date >= CURDATE() - INTERVAL 14 DAY"
        f"  GROUP BY dial_day, did"
        f") t ORDER BY dials DESC LIMIT 40"
    ),
    # Daily verdict: DIDs used, max per DID, DID-days at/over 1000 and 1500
    "2_daily_verdict": (
        f"SELECT dial_day, COUNT(*) AS dids_used, MAX(dials) AS max_per_did,"
        f"       SUM(dials >= 1500) AS did_days_1500_plus,"
        f"       SUM(dials >= 1000) AS did_days_1000_plus"
        f" FROM ("
        f"  SELECT DATE(call_date) AS dial_day, {DID_EXPR} AS did, COUNT(*) AS dials"
        f"  FROM vicidial_dial_log"
        f"  WHERE call_date >= CURDATE() - INTERVAL 14 DAY"
        f"  GROUP BY dial_day, did"
        f") t GROUP BY dial_day ORDER BY dial_day"
    ),
    # VICIdial's own per-CID daily counter (partial day at replication time)
    "3_cid_counter": (
        "SELECT campaign_id, areacode, outbound_cid, call_count_today "
        "FROM vicidial_campaign_cid_areacodes ORDER BY call_count_today DESC LIMIT 25"
    ),
}


def main():
    conn = pymysql.connect(
        host=HOST, port=3306, user=USER, password=PASS, database=DB,
        charset="utf8mb4", read_timeout=600, connect_timeout=15,
    )
    try:
        for name, sql in QUERIES.items():
            with conn.cursor() as cur:
                cur.execute(sql)
                cols = [d[0] for d in cur.description]
                rows = cur.fetchall()

            path = os.path.join(OUT_DIR, f"{name}.csv")
            with open(path, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(cols)
                writer.writerows(rows)
            print(f"\n== {name}: {len(rows)} rows -> {path}")

            if len(rows) <= 40:
                print("  " + " | ".join(str(c) for c in cols))
                for row in rows:
                    print("  " + " | ".join(str(v) for v in row))
    finally:
        conn.close()
    print(f"\nDone. Results in {OUT_DIR}")


if __name__ == "__main__":
    main()
