# Server registry

All servers are MySQL (VICIdial), port **3306**, read via replica ("slave") copies. Credentials are NOT stored here — see the Credentials section of SKILL.md (env vars `CCDB_<CENTER>_USER` / `CCDB_<CENTER>_PASS`).

## BareTel (alias: KB) — 5 replicas, one per business line

Replica naming convention: `fs<line>[v]-sldb` = FiveStrata + business-line code (+`v` for revive) + "slave DB".

| alias | replica name | host | business line |
|---|---|---|---|
| `fsbr`  | fsbr-sldb  | 162.212.58.148  | Bathroom remodel — **fresh** leads |
| `fsbrv` | fsbrv-sldb | 23.29.126.231   | Bathroom remodel — **revive** leads |
| `fshw`  | fshw-sldb  | 107.155.67.132  | Home warranty — fresh AND revive combined (KB does not split HW) |
| `fswn`  | fswn-sldb  | 162.213.194.18  | Windows — **fresh** leads |
| `fswr`  | fswr-sldb  | 199.16.190.185  | Windows — **revive** leads |

Mapping confirmed with Brandon (Teams, ~2026-07): "bathroom fresh, bathroom revive, home warranty, windows fresh, windows revived — yes; we don't split HW into fresh or revived with KB."

**Email-report subject tokens (verified live 2026-07-13 via the fivestrataops skill):** BareTel's automated report subjects use per-server tokens `FSBR`, `FSBRV`, `FSHW`, `FSWR` — matching the aliases above — plus **`FSWF`** for windows in ALL report series (agent/qualified/hot-leads/congestion/reserve), while **`FSWN` appears ONLY in the "BT Wholesale - daily usage report" billing series**. Working hypothesis: FSWF and fswn label the same windows-fresh box (dialer name vs billing name), but this is UNCONFIRMED — see open questions. When matching emails to replicas, accept either token for windows and note the ambiguity.

## TopDial (alias: TD) — 2 replicas

| alias | host | business line |
|---|---|---|
| `td-bathroom` | 142.132.197.142 | Bathroom remodel **and Home Warranty** (per prod CC_BehindMaster, 2026-07) |
| `td-windows`  | 116.202.196.60  | Windows (also hosts a Solar campaign per profiling) |
| `td-solar`    | 207.188.12.153  | Solar — DORMANT: not an active business line right now (Sean, 2026-07-08). Known from CC_BehindMaster; do not profile or query unless solar resumes; separate access account when it does |

TD does not split fresh/revive across servers. Discrepancy to verify: CC_BehindMaster says HW runs on 142.132.197.142, but the profiled td-bathroom campaigns show only BR names (BRFresh/BRSafe/BREIS/BathRemo) — HW may be historical, in lists rather than campaigns, or the monitor row may be stale. Similarly td-windows carries `Solar_Re` even though a dedicated SL server exists.

## Fresh vs revive — the domain axis

"Fresh" = newly generated leads; "revive" = FiveStrata's re-marketed older leads (the core techss revive pipeline). BareTel physically separates them per server (except HW); TopDial separates by business line only. When aggregating "all bathroom revive activity," that means `fsbrv` + a filtered slice of `td-bathroom`.

## Profiled facts (2026-07-07/08)

All 7 servers are **MariaDB** (10.1.25 → 10.11.15 — see `catalogs/README.md` table), schema **`asterisk`**. KB servers run EST/EDT, TD servers MST — align timestamps accordingly. KB uses one uniform campaign scheme (`FSFRESH`/`FSREVIVE` + closer campaigns), so fresh/revive is double-encoded on KB: by server AND by campaign. TD campaigns are per-vertical (`BRFresh`/`BRSafe`/`BREIS` on bathroom; `WIFresh`/`WISafe`/`WI5S`/`Window` on windows) — and `td-windows` also hosts `Solar_Re` (a solar campaign), so don't assume that box is windows-only.

## Context from Teams history (2026-06/07)

- **KB = Kombea — CONFIRMED (Sean, 2026-07-08).** Working model: **Kombea provides the dialing software layer, sitting on top of BareTel (Bare Telecom, baretechs.com) carrier technology**. So the "KB" replicas are Kombea dialing operations on BareTel infrastructure; other call centers on BareTel infra include **CCI**. BareTel handles carrier-level concerns (DIDs, CNAM, connectivity), Kombea the dialing/agent side.
- Admin UI pattern: `fs<line>-admin.baretechs.com` (e.g. fsbr-admin.baretechs.com).
- Other vendors in the ecosystem: **Jaintel** (a VICIdial dialer vendor, cost-compared vs BareTel; ALSO acts as TopDial's billing intermediary — daily "TopDial Invoice" emails come from clarisse@jaintel.com), **CanadaDirect / CD** (NOT VICIdial — no replica; the shared-schema assumption does not extend to them). CanadaDirect is an active reporting partner (daily + weekly xlsx feeds into stratatech@buyerlink.com — see the fivestrataops skill §8/§9) and an **onboarding candidate** for this skill if a DB path ever materializes (metadata_sop.md).
- BareTel's current VICIdial setup ("Peter's code") is described as an over-engineered "sealed ecosystem" with a single-giant-list structure; **BareTel is building a replacement system in parallel, one vertical at a time** — expect KB schema/list conventions to change; re-profile as verticals migrate.

## Open questions / to confirm

- **FSWF vs fswn:** confirm with Brandon whether the FSWF email-report token = the `fswn` replica (windows fresh), then normalize both this file and the fivestrataops skill. Six email tokens exist against five registry rows.
- A Teams message tied BareTel access to an additional host `108.208.121.142` that is not one of the 5 replica IPs — possibly a jump/SSH host or admin box. Confirm with Brandon what it is and whether the 5 replicas are reached directly or through it.
- Whether the same BareTel credential works on all 5 KB replicas (assumed yes).

## Machine-readable registry

`scripts/servers.json` mirrors this table and drives the profiler. Update BOTH files when servers change (see `references/metadata_sop.md`).
