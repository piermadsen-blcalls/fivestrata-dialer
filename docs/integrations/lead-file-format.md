# Lead file format — batch intake contract (fresh + revive)

**Provenance:** Sample production lead file shared by Sean (screenshot, 2026-08-14). Per org
policy this doc records the **column layout only** — no lead rows, names, phones, or other
consumer PII ever land in this repo. Sample values below are described by *shape*, not value.

**Where this fits:** the PRD (§6, "Getting leads in") commits to two first-class intake paths —
an automatic partner feed and a by-hand file upload. This doc is the concrete contract for the
**file path**; the automatic path is specced by Joseph's integration guide
(`callcenter-integration-guide.md` §3.2, lead ingestion API). In
`tenant-program-onboarding.md` terms these are the `batch_file` and `leadconduit`/`http_webhook`
transports of a `lead_intake` connection.

## Design directives (➤ Sean, 2026-08-14)

1. **Two lead sources — fresh and revived — and the intake must accommodate either.**
   Consistent with quasi-decided #5 (revive-first pilot, fresh/revive switch from day one).
   The file itself carries no fresh/revive column — `lead_type` is **batch-level metadata**
   supplied at upload time (mirrors how the human floors get it: FSCode3 `|BT:…|CC:…|` batch
   provenance is stamped by the distribution process, not by the affiliate file).
2. **API integrations might supersede this file format.** Consequence: the file layout is an
   *adapter*, never the internal model. Both transports normalize into one canonical inbound
   lead record whose field set is the **union** of this file and the API §3.2 payload; adding
   or swapping a transport must not touch the queue/router/engine.

## Column dictionary (18 columns, as delivered)

| # | Column | Shape | Canonical field | Notes |
|---|---|---|---|---|
| A | `lead_date` | datetime `M/D/YYYY H:MM` | `originated_at` *(new)* | When the affiliate generated the lead — distinct from our `created_at` (ingest time). Echoed outbound as `timestamp_affilliate_fives` in the dispo post. In a revive file this is the *original* lead date |
| B | `first` | text | `first_name` | |
| C | `last` | text | `last_name` | |
| D | `address` | text | `address1` | |
| E | `city` | text | `city` | |
| F | `state` | 2-letter | `state` | |
| G | `zip` | 5-digit | `postal_code` | Store as text — leading zeros die in Excel round-trips |
| H | `phone` | 10-digit | `phone_number` | Arrives as a number; Excel renders scientific notation (`5.09E+09`). Ingest raw CSV as text, normalize to E.164 |
| I | `email` | text | `email` | |
| J | `lead_id` | ~9-digit integer | `oleadid` ❓ | Presumed ≡ OLeadID (the cross-system key). Confirm with Joseph — the API payload carries both `oleadid` and `vendor_lead_code` |
| K | `ip_address` | IPv4 | `ip_address` *(new)* | Lead-source IP; the outbound dispo contract has an `ip_address` field we should echo |
| L | `birth_date` | date | `birth_date` *(new)* | PII, qualification-relevant (age gates). Not in the current `leads` schema |
| M | `fscode1` | `\|VT:…\|PD:…\|CH:…\|SC:…\|CP:…\|` | `fscode1` *(new — today only `sub_source` exists)* | Acquisition identity / media taxonomy (F4). Echo verbatim in the dispo post |
| N | `fscode2` | `\|SS:…\|SA:…\|` | `fscode2` (today's `sub_source`) | Sub-source detail. Echo verbatim in the dispo post |
| O | `trustedform` | `https://cert.trustedform.com/…` cert URL | `trustedform_cert_url` *(new)* | TCPA/consent compliance artifact — must persist with the lead for the 5-yr window |
| P | `universal_lead_id` | 32-char hex | `universal_lead_id` *(new)* | Jornaya LeadiD or ActiveProspect universal id ❓ confirm which |
| Q | `site` | domain | `site` *(new; relates to `source`)* | Origin website the consumer filled out |
| R | `zip_list` | integer | ❓ | Truncated in the sample; meaning unknown — list assignment? zip-derived routing key? Ask Joseph/Alex |

## Union with the API payload (what "API supersedes" implies)

Fields the **API** (§3.2) has that the **file** lacks: `phone_code`, `country_code`,
`address3`, `vendor_lead_code`, **`max_attempts`** (per-lead cadence directive — already a
logged migration TODO). Fields the **file** has that the API §3.2 example lacks: `lead_date`,
`ip_address`, `birth_date`, `trustedform`, `universal_lead_id`, `site`, `zip_list`. The
canonical `leads` record carries all of them, nullable per transport; §3.2 is explicitly
negotiable at onboarding, so the extra file fields can be added to the API payload when the
automatic feed is wired ("FiveStrata adapts to a mutually agreed payload format").

**Schema TODOs this adds** (join the migration list already opened by the integration guide
§8): `originated_at`, `birth_date`, `ip_address`, `fscode1`/`fscode2` as first-class columns
(replacing/alongside `sub_source`), `trustedform_cert_url`, `universal_lead_id`, `site`.

## File-handling requirements

- **Never trust an Excel round-trip.** The sample shows phone and lead_id in scientific
  notation and zip at risk of leading-zero loss. The uploader must ingest the raw CSV/XLSX
  with all columns as text, then normalize (E.164 phone, 5-char zip, ISO dates).
- **Batch metadata at upload time** (not in the file): `lead_type` (fresh/revive), program
  (vertical), and a batch id for provenance — the platform's equivalent of FSCode3's
  `|BT:batch|CC:center|` stamp. The upload UI/CLI collects these; the file never has to.
- **No vertical column in the file** — program resolution comes from the upload's program
  binding (per `tenant-program-onboarding.md`: every lead arrives on a program-keyed surface).
- **DNC is not in the file.** Whether batches arrive pre-scrubbed (today's LeadOps constraint:
  split upstream *after* DNC validation) or we scrub at ingest is the open T11 question;
  either way the pop-time DNC check from the integration guide still applies.

## Open questions

- ❓ Do fresh and revive files share this exact layout, or does the revive extract differ?
  The one sample provided has `lead_date` values ~13 months old, which reads revive-shaped —
  confirm with Sean/Joseph which flavor it was.
- ❓ `zip_list` semantics (col R).
- ❓ `lead_id` ≡ OLeadID? And `universal_lead_id` — Jornaya vs ActiveProspect?
- ❓ Sample `site` values are insurance-shaded domains — is an insurance vertical in scope for
  the pilot's lead supply, or was the sample just what was handy?
- ❓ Delivery mechanics for the file path: who uploads (Ashley/Alex?), from where (the same
  extracts that feed TD's FTP / Joseph's KB bulk-upload?), expected batch sizes (KB precedent:
  100K rows).
