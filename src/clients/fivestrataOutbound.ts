// FiveStrata outbound API clients — the Call Center → FiveStrata half of the
// integration contract (docs/integrations/callcenter-integration-guide.md §4):
//
//   preAuthorize()      §4.1 Transfer Client API — form-POST, per-vertical key,
//                       FAIL CLOSED: any error/timeout/ambiguity means "do not
//                       transfer or dial".
//   postDisposition()   §4.2 Lead Intake — JSON POST, per-vertical HTTP Basic,
//                       2xx = success, anything else = retryable (the outbox
//                       owns retries; this client never retries itself).
//
// Hardened per adversarial review 2026-08-21: strict transfer-field coercion
// (PHP falsy sentinels like false/0/"null" must not authorize), deny-listed
// `result` values fail closed even when transfer fields are present,
// redirect: 'error' on both fetches (a 3xx would leak the key/PII body on
// 307/308 and fake a delivered dispo on 301→GET→200), body-read failures
// mapped to timeout/error, vertical keys redacted from anything persisted,
// env numerics validated.
//
// ⚠ Endpoint URLs default to the documented values but the 8/18 shareout
// flagged some documented URLs as wrong, and a new AUTHED Lead Intake endpoint
// is replacing the unauthed one — verify actuals with Joseph before live use
// (override via FS_TRANSFER_CLIENT_URL / FS_LEAD_INTAKE_URL).
//
// Credentials: username + one key per vertical (the key doubles as the §4.1
// `key=` value and the §4.2 Basic-Auth password). Loaded from FS_CC_* env vars
// when present, else parsed from C:\Claude\fivestrata-cc-env.sh (outside all
// repos). Values are never logged or persisted. Node-only module (Buffer,
// node:fs) — use btoa()/lazy imports before reusing in an edge function.
import { existsSync, readFileSync } from 'node:fs';

export type VerticalCode = 'BR' | 'HW' | 'SL' | 'WI';

/** Canonical vertical names (leads.vertical / programs.vertical) → FiveStrata codes. */
const VERTICAL_CODES: Record<string, VerticalCode> = {
  bathroom: 'BR',
  home_warranty: 'HW',
  solar: 'SL',
  windows: 'WI',
  // Already-coded inputs pass through.
  BR: 'BR',
  HW: 'HW',
  SL: 'SL',
  WI: 'WI',
};

export function verticalCode(vertical: string): VerticalCode {
  const code = VERTICAL_CODES[vertical.trim()] ?? VERTICAL_CODES[vertical.trim().toUpperCase()];
  if (!code) throw new Error(`unknown vertical: ${vertical}`);
  return code;
}

/** Positive finite number from env, else fallback ('' and garbage both fall back). */
export function numFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// --- Credentials -------------------------------------------------------------

export interface FsCcCredentials {
  username: string;
  keys: Partial<Record<VerticalCode, string>>;
}

let cachedCreds: FsCcCredentials | null = null;

/**
 * Env vars win (lets tests inject fakes and deployments avoid the file);
 * otherwise parse the export-format env.sh. Missing verticals are tolerated
 * at load and rejected at use, so a single-vertical deployment works.
 */
export function loadFsCcCredentials(): FsCcCredentials {
  if (cachedCreds) return cachedCreds;
  const fromEnv = (code: VerticalCode): string => process.env[`FS_CC_KEY_${code}`] ?? '';
  const creds: FsCcCredentials = {
    username: process.env.FS_CC_USERNAME ?? '',
    keys: { BR: fromEnv('BR'), HW: fromEnv('HW'), SL: fromEnv('SL'), WI: fromEnv('WI') },
  };
  const missingAny = !creds.username || Object.values(creds.keys).some((k) => !k);
  if (missingAny) {
    const file = process.env.FS_CC_ENV_FILE ?? 'C:/Claude/fivestrata-cc-env.sh';
    if (existsSync(file)) {
      const text = readFileSync(file, 'utf8');
      const grab = (name: string): string =>
        text
          .match(new RegExp(`^export ${name}=(.+)$`, 'm'))?.[1]
          ?.trim()
          .replace(/^['"]|['"]$/g, '') ?? '';
      creds.username ||= grab('FS_CC_USERNAME');
      for (const code of ['BR', 'HW', 'SL', 'WI'] as VerticalCode[]) {
        creds.keys[code] ||= grab(`FS_CC_KEY_${code}`);
      }
    }
  }
  cachedCreds = creds;
  return creds;
}

/** Test hook: clear the credential cache (e.g. after mutating process.env). */
export function resetFsCcCredentialsCache(): void {
  cachedCreds = null;
}

function keyForVertical(vertical: string): { username: string; key: string; code: VerticalCode } {
  const code = verticalCode(vertical);
  const creds = loadFsCcCredentials();
  const key = creds.keys[code] ?? '';
  if (!creds.username || !key) {
    throw new Error(`missing FiveStrata credentials for vertical ${code}`);
  }
  return { username: creds.username, key, code };
}

// --- §4.1 Pre-call / pre-transfer authorization -------------------------------

export const DEFAULT_TRANSFER_CLIENT_URL = 'https://techsolarsolutions.com/API/transfer-client.php';

export interface PreAuthInput {
  oleadid: string;
  zip: string;
  phone: string;
  vertical: string;
}

export interface PreAuthClient {
  clientId: string | null;
  clientName: string | null;
  transferCode: string | null;
  transferPhone: string | null;
  vertical: string | null;
  state: string | null;
  area: string | null;
  zip: string | null;
  brandId: string | null;
  result: string | null;
}

export interface PreAuthResult {
  /**
   * authorized — genuine 2xx JSON with a usable transferCode AND transferPhone
   *              and no deny-ish `result`: dial/transfer using them.
   * no_client  — 2xx without usable transfer fields, or a deny-ish `result`
   *              even when fields are present (ambiguity fails closed; the
   *              conflict is flagged in `error` for calibration): do not dial.
   * error/timeout — FAIL CLOSED: do not transfer or dial (guide).
   *
   * The guide's `result` vocabulary is undocumented; until calibrated against
   * live responses (preauth_log.raw), presence of the two fields the guide
   * says to "proceed using" is the authorization signal, gated by the deny
   * list. `result` passes through verbatim.
   */
  outcome: 'authorized' | 'no_client' | 'error' | 'timeout';
  client: PreAuthClient | null;
  httpStatus: number | null;
  latencyMs: number;
  error: string | null;
  raw: unknown;
}

const s = (v: unknown): string | null => {
  const t = v == null ? '' : String(v).trim();
  return t === '' ? null : t;
};

// PHP endpoints emit falsy sentinels (false, 0, "null") for empty fields;
// String()-coercing those would authorize a dial with transferPhone "false".
// Transfer-critical fields accept genuine strings only.
const FALSY_SENTINELS = new Set(['0', 'false', 'null', 'undefined', 'n/a', 'none', '[object object]']);
const strictField = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (t === '' || FALSY_SENTINELS.has(t.toLowerCase())) return null;
  return t;
};
const strictPhoneField = (v: unknown): string | null => {
  const t = strictField(v);
  if (!t || t.replace(/\D/g, '').length < 7) return null;
  return t;
};

// Deny-ish `result` values fail closed even when transfer fields are present
// (stale/echoed fields alongside an explicit denial must not authorize).
const RESULT_DENY_RE = /error|fail|denied|invalid|unauthoriz|no[ _-]?(eligible|client)|\bnone\b/i;

export async function preAuthorize(
  input: PreAuthInput,
  opts: { url?: string; timeoutMs?: number } = {},
): Promise<PreAuthResult> {
  const url = opts.url ?? process.env.FS_TRANSFER_CLIENT_URL ?? DEFAULT_TRANSFER_CLIENT_URL;
  const timeoutMs = opts.timeoutMs ?? numFromEnv('FS_PREAUTH_TIMEOUT_MS', 5000);
  const { key } = keyForVertical(input.vertical);
  // The key travels in the request body; anything we persist gets it scrubbed.
  const redact = (t: string): string => t.split(key).join('[KEY]');

  const body = new URLSearchParams({
    key,
    zips: input.zip,
    OLeadID: input.oleadid,
    phone: input.phone,
  });

  const started = Date.now();
  let text: string;
  let status: number;
  let httpOk: boolean;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      // A redirect would re-send the key-bearing body (307/308) or convert to
      // a body-less GET (301/302) — either way, not the endpoint we authorized
      // against. Fail closed instead.
      redirect: 'error',
      signal: AbortSignal.timeout(timeoutMs),
    });
    status = res.status;
    httpOk = res.ok;
    // The abort signal also covers the body read — a stalled body must land
    // in the same fail-closed paths, not escape as an exception.
    text = await res.text();
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'TimeoutError';
    return {
      outcome: timedOut ? 'timeout' : 'error',
      client: null,
      httpStatus: null,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? redact(`${err.name}: ${err.message}`) : 'unknown error',
      raw: null,
    };
  }
  const latencyMs = Date.now() - started;

  if (!httpOk) {
    return {
      outcome: 'error',
      client: null,
      httpStatus: status,
      latencyMs,
      error: `HTTP ${status}`,
      raw: redact(text.slice(0, 2000)),
    };
  }

  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    return {
      outcome: 'error',
      client: null,
      httpStatus: status,
      latencyMs,
      error: 'non-JSON response',
      raw: redact(text.slice(0, 2000)),
    };
  }

  const client: PreAuthClient = {
    clientId: s(json?.ClientID),
    clientName: s(json?.clientName),
    transferCode: strictField(json?.transferCode),
    transferPhone: strictPhoneField(json?.transferPhone),
    vertical: s(json?.vertical),
    state: s(json?.State),
    area: s(json?.Area),
    zip: s(json?.Zip),
    brandId: s(json?.brandId),
    result: s(json?.result),
  };

  const fieldsPresent = Boolean(client.transferCode && client.transferPhone);
  const resultDenies = Boolean(client.result && RESULT_DENY_RE.test(client.result));
  const authorized = fieldsPresent && !resultDenies;
  return {
    outcome: authorized ? 'authorized' : 'no_client',
    client,
    httpStatus: status,
    latencyMs,
    error:
      fieldsPresent && resultDenies
        ? `result "${client.result}" denies despite transfer fields — failed closed (calibration flag)`
        : null,
    raw: JSON.parse(redact(JSON.stringify(json))),
  };
}

// --- §4.2 Post-call disposition (Lead Intake) ---------------------------------

export const DEFAULT_LEAD_INTAKE_URL =
  'https://api.fivestrata.com/api/call-center/lead-disposition';

const TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

/**
 * Format a Date as the contract's YYYY-MM-DD HH:MM:SS in the given IANA
 * timezone. ❓ The guide doesn't state a timezone; default UTC until Joseph
 * confirms (FS_DISPO_TIMEZONE overrides).
 */
export function formatDispoTimestamp(when: Date, timeZone?: string): string {
  const tz = timeZone ?? process.env.FS_DISPO_TIMEZONE ?? 'UTC';
  // en-CA yields YYYY-MM-DD date ordering; h23 forbids the "24:xx" rendering.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(when);
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '';
  // Belt over the h23 suspenders (ICU keeps the calendar date either way).
  const hour = get('hour') === '24' ? '00' : get('hour');
  return `${get('year')}-${get('month')}-${get('day')} ${hour}:${get('minute')}:${get('second')}`;
}

export interface DispositionFields {
  /** Required by the contract. */
  oleadid: string;
  calldispoFives: string;
  dispositionedAt: Date;
  /**
   * Optional contract fields. Semantics: `undefined` = omit from the payload
   * (FiveStrata applies its documented default); explicit `null` = send JSON
   * null (the guide's "send ext as null" option).
   */
  calldispoExtFives?: string | null;
  brandIdFives?: string | null;
  wtclientFives?: string | null;
  repidFives?: string | null;
  consentFives?: 'Yes' | 'No' | '' | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
  address1?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  fscode1?: string | null;
  fscode2?: string | null;
  fscode3Fives?: string | null;
  homeownerFives?: 'Yes' | 'No' | '' | null;
  creditScore?: 'Average' | 'Good' | 'Excellent' | 'Fair' | 'Poor' | '' | null;
  attemptedTransferFives?: 'Yes' | 'No' | '' | null;
  leadTypeFives?: string | null;
  /** Contract parameter is misspelled by FiveStrata: new_contruction_fives (sic). */
  newContructionFives?: string | null;
  /** Contract parameter is misspelled by FiveStrata: timestamp_affilliate_fives (sic). */
  timestampAffilliateFives?: string | null;
  ipAddress?: string | null;
  /** HW/BR vertical-specific set. */
  under5kSqftFives?: string | null;
  replacedAppliancesFives?: string | null;
  seeBenefitsFives?: string | null;
  walkinTubFives?: 'Yes' | 'No' | '' | null;
  /** Escape hatch for onboarding-negotiated extras, passed through as-is. */
  extra?: Record<string, string | null>;
}

/**
 * Build the §4.2 payload. Enforces the three required fields and the
 * timestamp format. Undefined fields are omitted so we never accidentally
 * overwrite FiveStrata-side defaults with blanks; explicit nulls go through.
 */
export function buildDispositionPayload(f: DispositionFields): Record<string, unknown> {
  const oleadid = s(f.oleadid);
  const dispo = s(f.calldispoFives);
  if (!oleadid) throw new Error('oleadid is required');
  if (!dispo) throw new Error('calldispo_fives is required');
  if (!(f.dispositionedAt instanceof Date) || Number.isNaN(f.dispositionedAt.getTime())) {
    throw new Error('dispositionedAt must be a valid Date');
  }
  const timestamp = formatDispoTimestamp(f.dispositionedAt);
  if (!TIMESTAMP_RE.test(timestamp)) throw new Error(`bad timestamp: ${timestamp}`);

  const payload: Record<string, unknown> = {
    oleadid,
    calldispo_fives: dispo,
    timestamp_callcenter_dispositioned_fives: timestamp,
  };
  const put = (name: string, value: string | null | undefined): void => {
    if (value !== undefined) payload[name] = value; // null passes through as JSON null
  };
  put('calldispo_ext_fives', f.calldispoExtFives);
  put('brand_id_fives', f.brandIdFives);
  put('wtclient_fives', f.wtclientFives);
  put('repid_fives', f.repidFives);
  put('consent_fives', f.consentFives);
  put('first_name', f.firstName);
  put('last_name', f.lastName);
  put('phone_1', f.phone);
  put('email', f.email);
  put('address_1', f.address1);
  put('city', f.city);
  put('state', f.state);
  put('postal_code', f.postalCode);
  put('fscode1', f.fscode1);
  put('fscode2', f.fscode2);
  put('fscode3_fives', f.fscode3Fives);
  put('homeowner_fives', f.homeownerFives);
  put('credit_score', f.creditScore);
  put('attempted_transfer_fives', f.attemptedTransferFives);
  put('lead_type_fives', f.leadTypeFives);
  put('new_contruction_fives', f.newContructionFives); // (sic — contract spelling)
  put('timestamp_affilliate_fives', f.timestampAffilliateFives); // (sic — contract spelling)
  put('ip_address', f.ipAddress);
  put('under_5k_sqft_fives', f.under5kSqftFives);
  put('replaced_appliances_fives', f.replacedAppliancesFives);
  put('see_benefits_fives', f.seeBenefitsFives);
  put('walkin_tub_fives', f.walkinTubFives);
  for (const [k, v] of Object.entries(f.extra ?? {})) put(k, v);
  return payload;
}

export interface DispoPostResult {
  ok: boolean;
  httpStatus: number | null;
  /** Contract: retry only on network failure or non-2xx — so !ok ⇒ retryable. */
  retryable: boolean;
  error: string | null;
}

export async function postDisposition(
  payload: Record<string, unknown>,
  vertical: string,
  opts: { url?: string; timeoutMs?: number } = {},
): Promise<DispoPostResult> {
  const url = opts.url ?? process.env.FS_LEAD_INTAKE_URL ?? DEFAULT_LEAD_INTAKE_URL;
  const timeoutMs = opts.timeoutMs ?? numFromEnv('FS_DISPO_TIMEOUT_MS', 15_000);
  const { username, key } = keyForVertical(vertical);
  const basic = Buffer.from(`${username}:${key}`).toString('base64');

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Basic ${basic}`,
      },
      body: JSON.stringify(payload),
      // A 301/302 would drop the body and could 200 on a landing page —
      // marking the row delivered when Lead Intake never saw it. Fail → retry.
      redirect: 'error',
      signal: AbortSignal.timeout(timeoutMs),
    });
    // Drain the body so the connection is reusable; content is not needed.
    await res.text().catch(() => '');
    if (res.ok) return { ok: true, httpStatus: res.status, retryable: false, error: null };
    return { ok: false, httpStatus: res.status, retryable: true, error: `HTTP ${res.status}` };
  } catch (err) {
    return {
      ok: false,
      httpStatus: null,
      retryable: true,
      error:
        err instanceof Error
          ? `${err.name}: ${err.message}`.split(key).join('[KEY]')
          : 'unknown error',
    };
  }
}
