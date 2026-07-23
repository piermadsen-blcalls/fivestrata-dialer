# Call scripts — soundboard workbook format

Production call-center script workbooks (Ashley Smith is the source; sent via Teams 2026-07-22). These are the operational script format the call centers run — and the direct precursor of AICC's voice-pack/clip model: each named cell block below is a **clip** a soundboard operator (today: human hotkeys; AICC: the AI) fires per turn.

| File | What it is |
|---|---|
| `Windows -CD 7.7.26.xlsx` | Windows vertical script (most recent template revision, 2026-07-07) |
| `Bathrooms - 02-12-26 (2).xlsx` | Bathrooms vertical (2026-02-12) — richest variant: transfer stalls, TCPA unclear-yes confirms, R3/R5/R7/R8/R11/R13–R19/R26 rebuttals the Windows file dropped |
| `Flooring - Premier Home Pros 7.22.26.xlsx` | Flooring script converted 2026-07-22 (by Claude/Sean) from prospective client Premier Home Pros' appointment-setting doc ([source Google Doc](https://docs.google.com/document/d/1z6htzNau4_UwtQ_nNPZQKFyj5c5BACnm3C-uajI6Y4s)) into this format |

## Workbook anatomy (identical across verticals)

Two sheets: **`<Vertical> Script`** and **`Hot Keys`**.

**Script sheet** — columns: A = internal clip label (e.g. `Survey - Own & Live/Long RP`), B/C = display clip name row + script text row beneath (C used for secondary/repeat variants). Sections in fixed order:

1. **Company Information block** (F4:G11): Avatar Name, Company Brand, Call Center Name, Call Center Location, Inbound/Customer Service #s, Email, Website. **Branding lines throughout the sheet are Excel formulas referencing these cells** (`="Hi, this is, "&G4&", calling on behalf of "&G5&"…"`), so re-branding a script = editing this block.
2. **Common Pathways** (I3:J9): hotkey map — `1 Yes · 2 No · 3 Repeat-Long · 4 Repeat-Short · 5 Not Interested · 6 Hesitant · 9 Repeat · 0 Pause`.
3. **Greeting** (Not Home 1/2, Gatekeeper 1/2, Wrong Number) → **Introduction** (Intro 1 Default; Intro 2 for AK/KY/LA/MA/ND/WY — call-center self-ID states; Intro 3 Repeat; how-are-you responses) → **Pitch** (Full / Long Repeat / Short Repeat) → **Survey** (qualifying Qs; every question has Long-Repeat + Short-Repeat + Not-Qualify exit clips; benefits/overcome-negative variants for hesitant answers) → **Client Branding/Recap** (Full / Long / Short) → **TCPA Consent** (Full / Long Repeat / Quick Repeat — autodial + DNC-override consent, "no obligation") → **Transfer Attempt** (generic ask, stalls: sports/weather/shows, delay, failed, handoff line to the receiving agent) → **Rebuttals & FAQ**: numbered `R1.0–R39` codes with `.1/.2` escalation rounds (stable code → meaning across verticals: R1 why-info, R2 not interested, R4 min requirements, R6 what companies, R10 how much, R21 caller-ID, R22 your name, R24 how-get-number, R26 DNC, R27 who's calling, R33 hesitant, R35 don't-need-now, R36 next steps, R37 deferment rounds 2–5, R38/39 pleasantries).

**Hot Keys sheet** — flat A/B list of instant-fire filler clips, most with `[1]/[2]/[3]` phrasing variants (Agree, Busy, Clarification, Gratitude, Hello, I understand, Laugh, Make spell, Okay, Repeat, Sorry, Training, Uh huh, Who, Xfer to LIVE, Yes/No, Zinger…). This variant structure is exactly AICC's planned canned-clip pool.

## Conventions worth knowing

- Brand ("Superior Home") is a white-label front; the call center (LeafTel = KB-side avatar "Matt", CanadaDirect = "Brian Lee") is only disclosed on direct questions (R27), which is scripted verbatim including spell-outs.
- Scripts are cloned between verticals — the Windows file still carried a `the-solar-project.com` hyperlink from an earlier solar version. Cloning + shared-string rewrite is the house method (used for the Flooring conversion).
- Repeat discipline: every substantive clip has Long and Short repeat forms (hotkeys 3/4) — a core telemetry hook for AICC's canned-vs-TTS and clip-choice logging.
- Flooring conversion specifics (Premier Home Pros is appointment-setting, not lead-transfer): Survey = scope/rooms/size → own-and-live-in → full replacement → insurance claim (check-in-hand required); Recap offers 9am/12pm/3pm/6pm slots; the transfer slot became a Confirmation Close (address verify, gate code, Y-to-confirm text, alt number); Hot Keys gained Address Verify, Gate Code, Decision Maker, $250 Assumptive Close, Cross-Sell Bathrooms, Alt Number, Confirm Appt, Busy, DNC. Client's "DO NOT ASK what's on their floors now" rule respected — no such question exists. Unverified placeholders: `premierhomepros.com` / `info@premierhomepros.com`, avatar kept as Matt/LeafTel.
