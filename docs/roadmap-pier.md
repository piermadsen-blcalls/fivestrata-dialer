# CV AI Call Center: roadmap

Status: draft (Pier's version). Built straight from `PRD-pier.md`.

The PRD says what we're building. This says the order we build it in, and roughly
when. We build the whole platform first, then start making real calls a few at a
time, then open it up to other business units. The first four steps are the build
order from the PRD. The last two turn on real calls and open the platform up.

The dates are rough targets, not promises. Step 2 waits on a company credit card,
and every step after it moves if that one moves.

---

## Step 1: Lock the standard call record

**Target: done (early August).**

What we build: one standard format for everything we save on a call (the
`call_result` format).

Done when: the format is locked and a practice run fills the live reports with test
calls.

## Step 2: Get one real call working

**Target: about a week after the company credit card arrives (roughly the week of
August 10).**

What we build: a single real call, end to end. An endpoint receives the lead, the
call goes out from the correct "from" number, the three safety checks run (legal
hours, allowed area, buyer approval; see PRD-pier.md Section 5), and the call runs on either
the correct soundboard or a selected existing Telnyx AI agent, then follows the
call-completion rules.

Done when: an endpoint receives a hit; the call runs from the correct "from" number;
the correct soundboard is used and works, or an AI agent is selected and works; and
the call-completion rules are followed correctly.

Waiting on: the company credit card, which unlocks API access to Telnyx and lets us
buy test numbers.

## Step 3: Build the whole system and run it privately

**Target: about a week later (week of August 17).**

What we build: the full platform, running on our own test numbers only, so no real
people get called yet. This is where the backend and the feature list get built out.

- Backend (PRD-pier.md Section 7): the operational brain (the waiting line, the safety
  checks, the dial decisions, the settings, recent history), the link to the phone
  layer, the long-term storage wiring, and the control panel.
- Feature list (PRD-pier.md Section 6): lead intake, the Campaign builder and calling rules,
  phone-number management, real-vs-voicemail detection, the handoff to a buyer, the
  reports, the live board, diagnostics, A/B testing, and the emergency stop buttons.
- We define the standard way a business unit sends us leads and builds campaigns. We
  set the format; we do not wait on theirs.

Done when: the feature list is built out for this version, and a full call runs
through every step on test numbers where we can watch it live and trace what it did.

Waiting on: the buyer's pre-call approval format (Joseph); the rule for when a
handoff counts as a sale (Kinsey).

## Step 4: Make the results trustworthy

**Target: week of August 24.**

What we build: every call is saved in the standard `call_result` format and copied
into long-term storage each night. Results are sent back into the business unit's own
system so their existing reports keep working. The team checks that our numbers match
what they already know.

Done when: the team agrees the reports are right, and a result makes it all the way
back into the business unit's system.

Waiting on: the long-term storage setup (Shelly Teh); the results write-back format
(Joseph, Cromwel); sign-off on the running costs (Sam, Tatevik).

## Step 5: Start calling real leads

**Target: week of August 31.**

What we build: start calling real leads on one product, at a controlled pace.

Done when: calls are being executed successfully at volume, and A/B testing is built
out so we can start optimizing the system.

Waiting on: the final script for the pilot product (Ashley); switching on our share
of the incoming leads.

## Step 6: Open to other business units

**Target: September.**

What we build: open the platform up for other business units to send us leads and
build their own campaigns, with no new engineering.

Done when: a second business unit sends leads and runs a campaign within days of
finishing its setup, with no engineering.

Waiting on: the business unit's setup details, which they can start filling out now.

---

## How another business unit sets up

A business unit comes on by answering the campaign setup questions. The answers
become settings, not new code.

| Setup question | Needed? | What the business unit gives |
|---|---|---|
| What are you selling? | Yes | The offer and the basic talking points |
| The script | Yes | At least one call script, with any legally required lines marked so a test never changes them |
| Which outcomes to track | Yes | The results they want recorded, or our ready-made list for a fast start |
| Extra details on their leads | Only if they have them | The field names, so we can check the leads coming in |
| Where leads come in, where interested people go | Yes | A source for leads in, and a sales line or results feed out |
| Calling rules | Yes | Calling hours, do-not-call handling, any states to avoid |
| Expected numbers | Helpful | Their expected answer and sale rates, so their reports start with something to compare against |

---

## Things we still need to decide

| Open item | Owner | Due by | Starting answer if unresolved |
|---|---|---|---|
| The phone provider's negotiated pricing and the handoff fee | Pier | Step 4 | Use the provider's list pricing |
| The buyer's pre-call approval format | Joseph | Step 3 | Copy today's call-center setup exactly |
| Do-not-call: clean leads only, or do we re-check ourselves? | Joseph | Step 3 | We re-check when leads come in, as a backstop |
| The standard format for sending results back | Joseph, Cromwel, Brandon | Step 4 | Create one standard `call_result` format that every business unit uses |
| What happens when a buyer doesn't pick up a handoff | Kinsey | Step 3 | The AI saves the requested callback time to a field; the business unit re-sends that lead to be dialed again at that time |
| What counts as success | Pier, Sean, Payam | Start of Step 5 | A functional call center that handles outbound at scale, supports A/B testing for optimization, and supports multiple business units |
| How long recent calls stay in fast storage before moving to long-term | Sean | Step 4 | About 90 days |
| How many phone numbers to start with | Sean, Ashley | Step 3 | Start with 50 to 100, drop the bad ones from day one, and always keep a backup group of numbers |
