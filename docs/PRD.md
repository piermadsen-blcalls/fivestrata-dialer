# CV AI Call Center: platform plan

Status: draft. This is the merged plan, written from Pier's and Sean's earlier
drafts plus the scoping sessions and design notes. It is written in plain language
on purpose, so anyone can read it without knowing the tech or the industry. The
nuts-and-bolts specs (exact data fields, phone-provider settings, cost tables)
live in the design notes listed at the end; this document is the plan, not the
wiring diagram.

Owners: Pier (final say on the design), Sean (co-builder). The build-level detail
lives in this repo's design notes (see Section 13). `SPEC.md`, in the CV AI Call
Center repo, describes the system as it runs today.

---

## 1. What we're building

An outbound AI call center that turns leads the company already owns into sales.

A "sale" happens when the AI gets an interested person on the phone and connects
them to a company that buys those calls. We judge the platform on two numbers: how
many sales we get per hour of calling, and how much each sale costs.

Two things make this more than a single call center:

- **It's self-serve.** A team sets up and runs its own calling efforts without an
  engineer in the loop. They build the calls, load the people, manage the phone
  numbers, test versions against each other, and read the results themselves.
- **It's shared across the company.** Several business units use the same platform,
  each in its own sealed-off space. CV is first. Others (AutoWeb, Buyerlink Autos,
  Buyerlink Home Services) follow. To each team it looks like their own private
  platform.

Underneath the calling, the platform keeps a full record of every call it ever
makes. That record is worth as much as the calls themselves: it lets us see what
works, improve over time, and eventually compare our AI floor against the human
call centers on the same measures. Comparing against the outside human floors is a
later goal, but we design the record now so it can support that when the time comes.

---

## 2. Why we're rebuilding

There was a version one. It worked, and it taught us the one lesson that shapes
everything here.

Version one cost about $157 per sale. The human call centers do the same work for
$25 to $35. The reason for the gap was simple: version one had the AI speak every
word out loud, live, on every call, and that live speech was 83% of the cost. It
ran up charges even on calls nobody answered.

Version two fixes exactly that. The AI plays polished pre-recorded lines for almost
everything a call needs, and only speaks freely for the rare moment the script
doesn't cover. Pre-recorded audio costs almost nothing to play. That single change
is what closes the cost gap.

Everything else version one proved out carries forward: the line of people waiting
to be called, the safety checks, and the plumbing that talks to our partner. We're
building version two fresh rather than patching version one, because starting clean
is faster than untangling something that was hard-wired for a single use.

We build the whole platform now, not a small pilot, because AI-assisted development
makes the full build a matter of weeks rather than a quarter. What ramps up slowly
is how many calls we make and how visible we are to clients, not how much of the
platform is finished. Every feature has to earn its place the same way: it either
makes money directly, or it teaches a lesson that makes the human floors better.

---

## 3. Who uses it

Everyone logs in as themselves. There's no shared password. This work touches
rules about who can be called and when, so every change has to trace back to a
specific person.

There are three kinds of access:

- **Admin.** Runs the whole platform. This is Pier. Can change anything and can add
  or remove team members.
- **Operator.** A team member who runs calling efforts day to day. Controls the
  settings in Section 8.
- **Viewer.** Can see everything but change nothing.

One record-keeping rule sits underneath all three: once something (a calling
effort, a script, a phone number) has been used on a real call, it can be switched
off but never erased, so there is always a record of what happened. Only the Admin
can erase things that were never used on a live call. Section 8 spells out exactly
who can change what.

---

## 4. The Campaign

A Campaign is the one thing a team member sets up to make calls happen. Everything
else in the platform is either a setting inside a Campaign or a report about how a
Campaign is doing.

The easiest way to picture a Campaign is as a single calling effort with a goal.
For example: "call the people who asked about a bathroom remodel in the last year,
and connect anyone who's interested to a company that wants to buy those calls."
That whole effort, start to finish, is one Campaign.

A Campaign holds five things in one place:

1. **Who to call.** The group of people this Campaign works through.
2. **What the call sounds like.** The script the caller follows, the voice it uses,
   and whether it plays pre-recorded lines or speaks freely.
3. **When we call, and how often.** The hours it's allowed to call, and how many
   times it tries someone who doesn't pick up before giving up.
4. **Which phone numbers the calls come from.** The set of numbers the Campaign
   dials out on.
5. **Where an interested person goes.** The sales line we hand the call to when
   someone wants to move forward.

Bundling all five into one object is the point. A team member sets up a Campaign
once and it runs on its own, instead of someone having to wire those five things
together by hand every time.

### How people get into a Campaign

A team sends us their list of people to call. Every person on that list arrives
with a label attached that says which group they belong to (for example, "bathroom
remodel, revived leads"). A team builds a Campaign on one of those labels.

From then on, the team never has to hand us a list again. Any new person who shows
up carrying that same label is picked up by the Campaign automatically. The team
pushes their people to us once, and the right Campaign keeps adopting new arrivals
on its own.

If a group of people has arrived but no Campaign has been built for their label
yet, they simply wait. Nobody gets called until someone sets up a Campaign for them.

### Creating a Campaign

Setting up a Campaign is filling out a form, not a technical project. The person
creating it provides the product details, the script, the hours it can call, where
interested people should be sent, and a few rules about how often to try someone.
When they save it, the Campaign exists and can start working. No engineer has to be
involved.

### One business unit, many Campaigns

Each part of the company that uses the platform (for example, CV, or AutoWeb) is
its own space with its own login. Inside that space, a team can run as many
Campaigns as it wants at the same time, one per calling effort.

The spaces are sealed off from each other. One business unit can never see
another's people, Campaigns, or results. They share the same underlying system, but
to each team it looks and feels like their own private platform.

---

## 5. What happens on a call, start to finish

This is the core loop the whole platform exists to run. It's the same every time.

1. **Someone becomes due to call.** A person in a Campaign reaches the moment
   they're supposed to be tried, either for the first time or as a follow-up.

2. **Three safety checks run before anything dials.** Is it a legal hour where this
   person lives? Are we allowed to call their area? And most important, has the
   buyer's system confirmed this person can actually be sold and given us a live
   sales line to send them to? If any check fails, or the buyer's system is slow or
   silent, we stop right there and don't call. We would rather skip a call than make
   a wrong one.

3. **A phone number is chosen.** The system picks a healthy number in the person's
   own area, since people are far more likely to answer a local number. It spreads
   calls across many numbers so no single one gets worn out.

4. **The call is placed, and we figure out who picked up.** The moment someone
   answers, the system works out whether it's a real person, a voicemail, or one of
   those phone screening robots that ask who's calling. This matters for two
   reasons. It keeps our numbers on the right side of a real answer rate, and it
   means the expensive part (the AI) never switches on for a voicemail. No real
   person, no AI cost.

5. **The AI runs the conversation.** For a real person, the AI greets them, works
   through the script, answers common questions, and handles pushback. Most of what
   it says is polished, pre-recorded audio. It only speaks freely in the rare moment
   the script doesn't cover, and even then it can't say anything off-limits. Every
   choice it makes during the call is written down, so we can later see which lines
   work and which lose people.

6. **An interested person is handed to a buyer.** If the person qualifies and wants
   to move forward, the call is connected to the buyer's sales line while the AI
   briefly introduces them, so the handoff feels warm rather than a cold dump. We
   track this in three stages: we attempted a handoff, the handoff connected, and
   the buyer accepted it.

7. **Everything is recorded and reported back.** The outcome of the call is saved,
   the recording is stored, and the result is sent back to the partner's system so
   their existing reports keep working. Nothing about a call gets lost.

A few things branch off this main path:

- **"Call me later."** If someone asks to be reached another time, the Campaign
  schedules it and tries again then.
- **"Take me off your list."** If someone asks not to be called again, that's
  honored everywhere, immediately, across every Campaign.
- **Nobody home.** If there's no answer, the person goes back in line to be tried
  again later, up to the limit the Campaign set, then is left alone.

---

## 6. Features: what teams can see and do

The Campaign settings in Section 8 are the dials a team turns. These are the
screens and tools they actually work in.

**Watching calls happen**
- **Live board.** A real-time view of what's being called this second: how many
  calls are in progress, how many people are waiting, and how hard we're pushing
  against our limits. If the platform is at capacity and people are waiting, the
  team sees exactly that instead of a mysterious slowdown.

**Looking back at calls**
- **Call history.** Every completed call, searchable, with its outcome, its cost,
  and a link to the recording.
- **Recordings library.** Every call is recorded and kept for five years. A team
  can listen back and, over time, even search recordings by what was actually said
  on them ("show me every call where the person mentioned price").

**Understanding performance**
- **Reports.** How Campaigns are doing on the numbers that matter: sales per hour of
  talking, cost per sale, and how often calls reach a real person. The team can
  slice these by Campaign, by voice, by area, by buyer, and by script version, so a
  high-level number can always be broken down to find what's driving it.
- **The handoff funnel.** How many interested calls actually made it to a buyer and
  were accepted, at each of the three stages, so a drop-off is easy to spot.
- **Real answers vs fake ones.** A trustworthy count of how often we reached an
  actual human, separated from voicemails and phone screening robots, which
  otherwise make the numbers look better than they are.

**Fixing problems**
- **Diagnostics.** Follow a single person through the whole process and see exactly
  where and why something went wrong. If a call never happened, this says whether it
  was the hour, the area, the buyer's approval, or something else.
- **Alerts.** The platform flags when something needs attention: a Campaign has
  stalled, we've hit our call ceiling, or a batch of numbers is going bad.

**Building the calls**
- **Campaign builder.** Set up a calling effort (covered in Section 4).
- **Script and voice builder.** Write what the caller says, choose the voice, and
  create variations of individual lines so the same call doesn't sound identical
  every time. No engineer needed.
- **Split testing.** Run two versions against each other and compare them live
  (covered in Section 8).

**Managing the plumbing**
- **Phone number manager.** See the pool of numbers, each one's health, and let the
  system retire and replace the bad ones automatically.
- **Cost tracking.** See what each call costs, broken down by its parts, so the team
  knows where the money goes and can compare against what the human floors cost
  today.
- **Buyers and priorities.** Manage who interested calls get sent to, and in what
  order when several buyers want the same one.

**Getting leads in**
- **Lead intake.** Two ways in, both first-class. A partner can send people to us
  automatically as they come, or a team member can upload a file by hand. Either way
  the people land in the right place and get picked up by the matching Campaign.

**The learning loop**
- **Overnight suggestions.** Each night the platform studies the day's calls and
  comes back with suggestions the team can act on: which phone numbers to drop, the
  best times to reach certain groups, and which script version is winning. These are
  suggestions the platform applies going forward, not a report someone has to read
  and re-enter by hand.

---

## 7. How it's built (the backend)

The platform is four connected systems, each with one job. Keeping them separate is
deliberate: the part that makes calls is never slowed down by the part that crunches
reports.

**1. The operational brain** (built on a database service called Supabase)
This is the always-on engine. It holds the line of people waiting to be called, runs
the three safety checks before every call, decides who to dial next, and keeps every
setting from Section 8. It also keeps the recent history (roughly the last month) so
the live screens are instant. Think of it as the part that's actually running the
call center minute to minute.

**2. The voice and phone layer** (a provider called Telnyx)
This actually places the calls, provides the AI voice, works out who picked up, and
connects the handoffs to buyers. We rent this rather than building phone
infrastructure ourselves. We already confirmed it can do everything we need,
including detecting voicemails and phone screening robots.

**3. The long-term memory and analysis** (a data warehouse called Snowflake, plus
cheap file storage for recordings)
This keeps every call for five years, stores all the recordings, and runs the heavy
overnight analysis that produces the suggestions in Section 6. It never touches a
live call. If this system went down for a week, calling would carry on normally and
nobody on a call would notice.

**4. The control panel** (a website built with Next.js, hosted on Netlify)
This is what the team logs into. It's where every feature in Section 6 lives. It
reads live information from the brain and reports from the long-term memory.

### How the four connect

- **Leads come in** two ways: a partner sends them to an address we give them, or a
  team member uploads a file. Both land in the operational brain, tagged so the
  right Campaign adopts them.
- **Calls run** through the phone layer, and results flow straight back into the
  brain as they happen, so the live board and reports are current within seconds.
- **Every night**, the day's calls are copied from the brain into long-term memory.
  This is a one-way copy, and it's built so we can later make it more frequent than
  nightly without rebuilding anything.
- **Suggestions flow back** from the analysis into a kind of inbox in the brain. The
  engine checks that inbox and uses a suggestion if it's there, or falls back to its
  normal setting if it isn't. The brain never waits on the analysis to make a call.
- **Recordings** are saved to cheap storage and catalogued so they can be found
  later.
- **Results are sent back** to the partner's own system after every call, so all
  their existing reports and dashboards keep working exactly as before.

### A few build rules that hold everything together

- **Each business unit is sealed off from the others.** They share one underlying
  database, but the system enforces that no unit can ever see another's people or
  results. To each team it looks like their own private platform.
- **The safety checks fail closed.** If a check can't be completed, the answer is
  "don't call," never "call anyway." This is the single most important rule in the
  build.
- **Passwords and secret keys are never stored in the code.** They live in a
  separate, protected place, so nothing sensitive ends up in a file someone could
  copy.
- **We're building version two fresh, not patching version one.** The first version
  proved the idea works but was hard-wired for a single use. Rather than untangle it,
  we start clean. A first piece of the new brain already exists.

### Handling a lot of calls at once

The phone layer can only run so many calls at the same time, and that limit is
something we buy more of when we need it. The engine is built to run right up to
that limit and hold a tidy line of people waiting when we hit it, instead of
hammering the system. When we're at the limit, the team sees it plainly on the live
board. The goal is to scale all the way to tens of millions of calls a month by
raising that limit, which is a purchasing decision, not a rebuild.

---

## 8. What teams can control (and the few things they can't)

The whole reason this platform exists is to hand control to the team running the
calls, instead of hiding those choices inside code that only an engineer can change.
So the rule we build to is simple: almost everything about how a Campaign runs is a
setting a team member can change, and each setting ships with a sensible starting
value so nobody has to be an expert to get going.

A small number of things are locked. They're locked only because the law or basic
safety requires it, and we call those out plainly at the end so there's no confusion
about what's off-limits and why.

There are three kinds of control:

- **Open.** The team sets it up from scratch. There's no "default" that matters,
  because the setting only exists once someone fills it in (the script, for example).
- **Adjustable.** It comes with a starting value that works out of the box, and the
  team can change it whenever they want.
- **Locked.** Nobody turns it off, because doing so would break the law or put us at
  risk.

And three kinds of people:

- **Admin.** Runs the whole platform (Pier). Can change anything, add or remove team
  members, and set what each one is allowed to do.
- **Operator.** A team member who runs Campaigns day to day. Controls the settings
  below.
- **Viewer.** Can look at everything but change nothing.

### Who we call, and in what order

| Setting | What it does | Starting value | Who changes it | Applies to |
|---|---|---|---|---|
| The group a Campaign calls | Picks which people this Campaign works through | Open (set when the Campaign is built) | Operator | One Campaign |
| Calling order | Whether to call the newest people first or the oldest first | Newest first for fresh lists, oldest first for older lists | Operator | One Campaign |
| Skip the least likely to answer | Leaves out people the system has learned probably won't pick up, to save effort | Off at first (turns on once we've learned enough) | Operator | One Campaign |

### What the call sounds like

| Setting | What it does | Starting value | Who changes it | Applies to |
|---|---|---|---|---|
| Voice style | Whether the caller plays polished pre-recorded lines or speaks freely in the moment | Pre-recorded for busy Campaigns, free speech for small or brand-new ones | Operator | One Campaign |
| The script | What the caller actually says, step by step | Open (written when the Campaign is built) | Operator | One Campaign |
| Spoken brand name | Whether the caller names a brand on the call | Off | Operator | One Campaign |
| The voice | Which voice does the talking | Chosen from a set of ready voices | Operator | One Campaign |

### When we call, and how often

| Setting | What it does | Starting value | Who changes it | Applies to |
|---|---|---|---|---|
| Calling hours | The hours of day it's allowed to call | The legal hours for each person's location | Operator can narrow it, never widen it past the legal limit | One Campaign |
| Number of tries | How many times to call someone who doesn't answer before giving up | A set number of attempts | Operator | One Campaign |
| Gap between tries | How long to wait before calling the same person again | A set number of hours | Operator | One Campaign |
| Best time to reach someone | Nudges calls toward the times a given group tends to answer | Off (turns on once we've learned the pattern) | Operator | One Campaign |

### The phone numbers we call from

| Setting | What it does | Starting value | Who changes it | Applies to |
|---|---|---|---|---|
| Match number to area | Calls people from a number in their own area, which they're more likely to answer | On | Operator | Business unit |
| Retiring a tired number | Drops a number automatically once people stop answering it or phone carriers start blocking it | On, with starting limits for "too few answers" and "too many blocks" | Operator can adjust the limits | Business unit |
| Backup when no local number exists | What to call from when we don't own a number in someone's area | A shared set of backup numbers (never a single one, which would burn out) | Operator | Business unit |
| Size of the number pool | How many phone numbers we keep on hand | Sized to the expected call volume | Operator | Business unit |

### How many calls happen at once

| Setting | What it does | Starting value | Who changes it | Applies to |
|---|---|---|---|---|
| Most calls at the same time | The ceiling on how many calls can be running at once | Set to what we've bought from the phone provider | Admin (it costs money and is bought in advance) | Whole platform, with a share reserved per Campaign so one can't crowd out the rest |

### Where interested people go

| Setting | What it does | Starting value | Who changes it | Applies to |
|---|---|---|---|---|
| The sales line | Who an interested person gets connected to | Comes from the buyer's own system | Operator confirms it | One Campaign |
| Order of buyers | When several buyers want the same call, who gets first shot | Even split | Operator | One Campaign |

### Trying two versions against each other

| Setting | What it does | Starting value | Who changes it | Applies to |
|---|---|---|---|---|
| Split test | Runs two versions of a Campaign side by side (two scripts, two voices, two calling patterns) and sends part of the people to each, so the team can see which one wins | Off | Operator sets it up | One Campaign |

### Safety switches

| Setting | What it does | Starting value | Who changes it | Applies to |
|---|---|---|---|---|
| Stop everything | Halts all calling immediately across the platform. Calls already in progress finish normally | Off | Admin or Operator | Whole platform |
| Stop one Campaign | Halts calling for a single Campaign | Off | Operator | One Campaign |
| Stop calls to one buyer | Halts calls headed to a specific sales line, leaving the rest running | Off | Operator | One buyer |
| Stop after the first success | Pauses a brand-new Campaign the moment it connects its first person, as a safety check during testing | On while testing | Operator | One Campaign |

### Who's allowed to do what

| Setting | What it does | Starting value | Who changes it | Applies to |
|---|---|---|---|---|
| Team members and their access | Adds or removes people and sets whether each is an Admin, Operator, or Viewer | Set up by the Admin | Admin only | Whole platform |
| Deleting something that already made real calls | Once a Campaign, script, or number has been used on a live call, it can be switched off but not erased, so there's always a record | Anyone can switch things off; only Admin can erase things that were never used live | Admin for anything that touched a real call | Whole platform |

### Locked on purpose

These three are not settings. No one can turn them off, including the Admin, because
they keep us on the right side of the law and protect the business:

- We only call people during the legal calling hours for where they live.
- We never call a number that's on a Do Not Call list.
- We never connect someone to a buyer unless the buyer's system has approved that
  person first. If that approval is slow or fails, we don't make the call at all. We
  would rather miss a call than make one we shouldn't.

---

## 9. Build order

No dates. The order is driven by what depends on what.

1. **Lock the record format first.** Decide exactly what we save for every call.
   Reports, testing, and every comparison are built on top of it, so it has to be
   settled before those can be built.
2. **Prove one real call end to end.** Place a single real call as a throwaway test:
   run the safety checks, have the AI talk, connect a handoff, and save the result.
   Cheap to do, and it de-risks everything. The rest only layers on once that works.
3. **Build the calling engine and the control panel in parallel.** The engine (the
   brain plus the phone layer) can be built while the control panel starts with
   look-only screens, which carry no risk because they only read. Then add the
   screens that change things.
4. **Add the long-term memory and the overnight analysis.** Once the record format
   is locked, stand up the nightly copy into long-term memory and the suggestions
   that flow back.

A first piece of the brain already exists, so this is not starting from zero.

---

## 10. The rules we never break

- **Don't call unless it's safe.** No call goes out unless the buyer approved the
  person and gave us a live sales line. If anything about that is slow or unclear, we
  don't call.
- **Only call during legal hours** for where the person lives.
- **Honor "do not call" immediately,** everywhere, the moment someone asks.
- **Never fall back to a single worn-out number.** When we don't have a local number,
  we use a shared backup pool, never one number that would burn out.
- **Keep passwords and keys out of the code.** They live in a separate protected
  place.
- **Never write anyone's personal information into shared project files.** Summarize;
  leave the private details out.

---

## 11. How we measure success

- **Sales per hour** of talking.
- **Cost per sale,** with the goal of beating the $25 to $35 the human floors cost.
- **How often we reach a real person,** as opposed to a voicemail or a screening
  robot.
- **How much of the talking is pre-recorded** versus spoken live. More pre-recorded
  means cheaper, so this number going up is a good sign.
- **How fast a new calling effort can be set up,** measured in days, not weeks.

---

## 12. Decisions and open questions

### Decided

- The Campaign is the one main object a team works with. A business unit can run
  many at once.
- The AI mostly plays pre-recorded lines and speaks freely only for the rare gap.
  Both styles ship, and each Campaign picks which one it uses.
- Teams test two versions of a Campaign against each other by splitting who gets
  which.
- Phone numbers are managed automatically: bought in a pool, matched to the person's
  area, and retired when they go bad. Checking and retiring once a night is enough.
- The buyer's approval happens before we dial, not in the middle of a call.
- Business units are sealed off from each other on one shared system.
- Every call is kept for five years in long-term memory; recent calls also live in
  the fast brain for the live screens.
- We build version two fresh rather than patching version one.
- No human agents anywhere in a call. The AI runs the whole conversation and hands
  straight to the buyer.
- Results are sent back to the partner's system after every call, so their existing
  reports keep working.

### Still open

- **What to call from when we don't own a local number:** a nearby area code, a
  national number, or a toll-free one. Leaning toward a backup pool.
- **Whether one lead label can feed more than one Campaign.** Leaning toward one to
  one.
- **A few partner contracts we still need:** the exact format of the leads the CV
  team will send us, and the exact format for sending results back to them.
- **Recording consent** in the states that legally require telling people a call is
  recorded. Needs a clear rule before we scale.
- **How each business unit's private keys and credentials are stored** once more than
  one unit is on the platform.

---

## 13. Where the detailed specs live

This document is the plan. The build-level detail sits in this repo's design notes
so the plan itself stays readable:

- The exact data fields we save for each call: `supabase/migrations/` (the record
  format and the reporting views built on it).
- The plain design of the soundboard-style AI: `docs/architecture/soundboard-llm-interface.md`.
- Handling a lot of calls at once: `docs/architecture/concurrency-queueing.md`.
- The phone-number study behind the automatic retirement rules:
  `docs/reporting/td-windows-did-study.md`.
- The phone-provider capabilities and pricing: `docs/architecture/telnyx-capability-review.md`.
- The overnight-suggestions design: `docs/architecture/snowflake-value.md`.
- The multi-business-unit setup: `docs/architecture/tenant-program-onboarding.md`
  and `docs/architecture/multi-tenant-topology.md`.
- The version-one post-mortem (where the cost lesson comes from): `docs/architecture/v1-build.md`.
- The reporting spec the team signs off against: `docs/reporting/kb-wi-dashboard-spec.md`.
- The scoping-session and meeting notes these decisions came from: `docs/meetings/`
  and `docs/transcripts/`.
- `SPEC.md`, in the CV AI Call Center repo: the system as it runs today, and the
  contract with our partner.
