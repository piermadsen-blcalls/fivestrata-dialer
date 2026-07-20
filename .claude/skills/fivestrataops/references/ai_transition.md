# FiveStrata AI Transition — KomBea ProtoCall AI Level 4 project dashboard (Google Sheet)

Profiled 2026-07-13 via Drive connector; live-readable. Sheet ID `13DCdrxjCvs1Muuwx__eSOvKjjIzzmTOiu5YIZ0GWs7k`, title "Internal Use: FiveStrata AI Transition", owner `kinsey@buyerlink.com`. Shared by Kinsey in the FiveStrata Teams group chat 5/13–5/14/2026. NO financial values recorded here by policy (the sheet's overview block carries savings/CPA targets — read the live sheet for those). **Last modified 2026-05-14** — a planning snapshot, not a live tracker; status cells have not moved since mid-May.

## Role in the business

Project dashboard for the **ProtoCall AI "Level 4" adoption** — the KomBea (KB) initiative to convert the dialer floor from human-agented Level 2 machines to AI-driven Level 4 machines over 52 weeks (Jan 1 – Dec 31, 2026). Sponsor: Ashley Smith (COO); PM: Nathan Bezzant (KomBea); decision maker: Kinsey Jackson (CEO). Scope: ~313 machines / 125 agents today → 250 L4 machines with a small monitoring + Level 2 closer crew; phased campaign cutovers per vertical × Fresh/Revive; phase-out of the Teddy BPO. Precursor/context doc: KomBea's "Self-Hosting VAMs" PDF (2/17/2026) in Ashley's and Kinsey's Teams chat files. This is the plan-of-record for why KB agent counts, hours, and cost-per-hour should fall through 2026 — the realized numbers land in the MDB Hours tab and the cost-analysis sheet, not here.

## Tabs

At least two tabs; profiled via the Drive connector's text renderer (tab 1 complete, tab 2 partial — see caveat below).

### Summary Dashboard (~116 rows × 6 cols)
Five stacked labeled blocks, headers in col A:

1. **PROJECT OVERVIEW** — label:value pairs in two column-pairs: Client, Project Sponsor, Project Manager, Decision Maker | Project Duration, Estimated Annual Savings, Target CPA, Target Margin Improvement (financial cells — not recorded here).
2. **CURRENT STATE / TARGET STATE** — side-by-side counts: Total Machines, Level 2 Machines, Total Agents, BPOs (freeform: `611 (80m), EIS (20m), Teddy (150m)`) vs Level 4 Machines, Level 2 Machines, Monitoring Agents, Level 2 Closer Agents.
3. **KEY MILESTONES** (9 rows) — Milestone | Target Date (week-number convention: `Week 4` … `Week 52`) | Status. Status values: `Complete`, `Not Started`. Milestones include Track 1/Track 2 gates and `Teddy BPO Phase-Out Complete`.
4. **CAMPAIGN ROLLOUT STATUS** (8 rows) — Campaign | Track 1 Status | Track 1 Week | Track 2 Status | Track 2 Week. Campaigns = vertical × lead type: `Windows Replacement / Bathroom Remodel / Home Warranty / Solar Installation` × `Fresh / Revive` (maps to WI/BR/HW/SL × FR/RV in vocab_map.md; note the Roofing/RF vertical is absent). Status values: `In Progress`, `Not Started`. Track 1 = agent-assisted rollout, Track 2 = later full-AI pass (inferred from milestone names).
5. **WEEKLY DEPLOYMENT TRACKER** (52 rows, `Week 1`…`Week 52`) — New L4 Machines, Cumulative L4, Remaining L2, Total Agents, Approval Status (empty at snapshot).

### GANTT Chart (partial profile)
Columns: `Task ID, Task Name, Owner, Category, Start Week, Duration, End Week, Dependencies, Status, Date, W1…W52` (week cells hold `█` bar characters). One row per task; phase header rows (Task ID `1`, `2`, … `9`) with dotted subtasks (`1.1`, `2.3`, …); Dependencies reference Task IDs. Rows are ordered by the `Date` column (task start date, `M/D/YYYY`, earliest 12/15/2025), **not** by Task ID. Phases observed: 1 Project Initiation & Planning, 2 Infrastructure Setup, 3 Training Development, 9 Ongoing Activities (phases 4–8 not captured — presumably the per-campaign rollouts, machine deployment, and BPO phase-out). Owner values seen: Ashley Smith, Nathan Bezzant, Kinsey Jackson, KomBea Tech, KomBea Trainers. Category values seen: Critical, Infrastructure, Training, Ongoing. Status values seen: Complete.

## Known copies — do not re-profile

- `18yjxQfXzvSXPZSvXcVQ4AC1XTSw-iUTDEpce3ggY7jw` — "Copy of FiveStrata AI Transition", owner `ashley.smith@buyerlink.com`, created and last modified 5/14/2026. Structurally identical scenario copy with two assumption cells changed (Monitoring Agents 50→42 and the savings figure; Total Agents column recomputes downstream). Ashley shared it in Teams 5/14 13:01Z; Kinsey immediately re-pointed the group to the original ("I shared this one with everyone yesterday"). Treat the Kinsey original as canonical; the copy is a stale one-off.

## Quirks

- **Stale statuses**: by today (week ~28 of the plan) most milestones still read `Not Started` and the sheet hasn't been edited since 5/14 — do not read Status columns as current project state; ask Ashley/Kinsey or check KB agent counts in the MDB Hours tab for reality.
- **Weekly Deployment Tracker is internally inconsistent**: `Cumulative L4` is not the running sum of `New L4 Machines` (e.g. Week 2 shows 0 new but cumulative 10), and `New L4` is non-monotonic in an odd sawtooth. Reads as template/planning placeholder numbers, not actuals.
- Timeline mismatch: overview says Jan 1 – Dec 31 but GANTT start dates begin 12/15/2025.
- Week-number date convention throughout (`Week N`, `Weeks N–M`); GANTT `Date` column is `M/D/YYYY`.
- BPO block freeform `611 (80m), EIS (20m), Teddy (150m)` — parenthetical unit unconfirmed (minutes? seats?); note EIS also appears in the cost-analysis sheet (`EIS at TD Cost Per Hour`).

## Profiling caveat

Full-workbook export exceeds the Drive connector's transfer limit and the connector's text renderer truncates after tab 1, so: tab 1 is complete, the GANTT tab is profiled from a partial render, and tabs beyond these two (if any) are unconfirmed. Re-profile from a user-provided xlsx export if GANTT detail or hidden tabs matter.

## How it connects

- Explains planned trajectory of **KB agent counts / hours / SPH** (MDB Hours tab, KB report emails — live_fetch.md §5–6) and the **Kombea + India labor lines** in cost_analysis.md; the CPA target in the overview block is the project's success metric against MDB CPL/COGS.
- Campaign rollout rows use the vertical × Fresh/Revive vocabulary (vocab_map.md); rollout status may explain per-campaign dialer changes visible in callcenterdb (KB servers fsbr/fsbrv/fshw/fswn/fswr).
- "Teddy BPO Phase-Out" and the BPO roster are context for TD/EIS hours questions (live_fetch.md §7).

## Open questions

- Is this dashboard being maintained anywhere else (KomBea-side tracker?), or was it a one-time announcement artifact for the 5/13 leadership share?
- What do Track 1 vs Track 2 mean precisely per campaign (agent-assisted vs autonomous?)?
- Meaning of the BPO parentheticals (`80m/20m/150m`) and the `611` BPO name.
- Actual current L4 machine count vs plan — no realized-actuals column exists in the sheet.
