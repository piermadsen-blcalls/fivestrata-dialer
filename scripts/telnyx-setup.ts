// Provision the Telnyx-side objects for the dialer, per the architecture docs:
// - Call Control Application (the "connection" outbound calls originate through),
//   webhooks pointed at the platform's /webhooks/telnyx route (src/routes/webhooks/telnyx.ts)
// - Outbound Voice Profile with a conservative dev concurrency cap
//   (docs/architecture/concurrency-queueing.md: caps are config, never baked in)
//
// Idempotent: finds existing objects by name before creating. Prints IDs only —
// never key material. Run: npx tsx scripts/telnyx-setup.ts
import 'dotenv/config';

const API = 'https://api.telnyx.com/v2';
const APP_NAME = 'fivestrata-dialer';
const PROFILE_NAME = 'fivestrata-dialer-dev';
// Dev safety cap — production concurrency is a pacing_config row per the
// concurrency doc, raised by purchase/UPDATE, not by editing this script.
const DEV_CONCURRENT_CALL_LIMIT = 10;

const apiKey = process.env.TELNYX_API_KEY ?? '';
if (!apiKey) {
  console.error('TELNYX_API_KEY is blank in .env — run scripts/telnyx-check.ts first.');
  process.exit(1);
}
// Until the public endpoint exists (tunnel/deploy — see open-questions), the
// webhook URL is a well-formed placeholder carrying the real route shape.
// Set TELNYX_WEBHOOK_URL in .env when the endpoint lands, then re-run this script.
const webhookUrl =
  process.env.TELNYX_WEBHOOK_URL ?? 'https://dialer-pending.fivestrata.invalid/webhooks/telnyx';

const headers = {
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
};

async function telnyx(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${API}${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = body?.errors?.[0];
    throw new Error(
      `${init?.method ?? 'GET'} ${path} -> HTTP ${res.status} ${e?.code ?? ''} ${e?.title ?? ''}${e?.detail ? ` — ${e.detail}` : ''}`,
    );
  }
  return body;
}

// --- Outbound Voice Profile (find-or-create) --------------------------------
const profiles = await telnyx(
  `/outbound_voice_profiles?filter[name][contains]=${encodeURIComponent(PROFILE_NAME)}`,
);
let profile = profiles.data?.find((p: any) => p.name === PROFILE_NAME);
if (profile) {
  console.log(`Outbound Voice Profile  EXISTS  ${profile.id} (${PROFILE_NAME})`);
} else {
  const created = await telnyx('/outbound_voice_profiles', {
    method: 'POST',
    body: JSON.stringify({
      name: PROFILE_NAME,
      traffic_type: 'conversational',
      service_plan: 'global',
      concurrent_call_limit: DEV_CONCURRENT_CALL_LIMIT,
      enabled: true,
    }),
  });
  profile = created.data;
  console.log(`Outbound Voice Profile  CREATED ${profile.id} (${PROFILE_NAME})`);
}
console.log(
  `  concurrent_call_limit: ${profile.concurrent_call_limit ?? 'unlimited (account cap governs)'}`,
);

// --- Call Control Application (find-or-create, then converge settings) ------
const apps = await telnyx(
  `/call_control_applications?filter[application_name][contains]=${encodeURIComponent(APP_NAME)}`,
);
let app = apps.data?.find((a: any) => a.application_name === APP_NAME);
const desired = {
  application_name: APP_NAME,
  webhook_event_url: webhookUrl,
  webhook_api_version: '2',
  active: true,
  outbound: { outbound_voice_profile_id: profile.id },
};
if (app) {
  app = (
    await telnyx(`/call_control_applications/${app.id}`, {
      method: 'PATCH',
      body: JSON.stringify(desired),
    })
  ).data;
  console.log(`Call Control App        UPDATED ${app.id} (${APP_NAME})`);
} else {
  app = (
    await telnyx('/call_control_applications', {
      method: 'POST',
      body: JSON.stringify(desired),
    })
  ).data;
  console.log(`Call Control App        CREATED ${app.id} (${APP_NAME})`);
}
console.log(`  webhook_event_url: ${app.webhook_event_url}`);
console.log(`  webhook_api_version: ${app.webhook_api_version}, active: ${app.active}`);

// --- What the operator does next --------------------------------------------
console.log('\nAdd (or update) these lines in .env:');
console.log(`  TELNYX_CONNECTION_ID=${app.id}`);
console.log('  # TELNYX_WEBHOOK_URL=<public endpoint>/webhooks/telnyx   (set when tunnel/deploy lands, re-run this script)');
console.log('\nStill needed before a live call: a DID assigned to this connection (purchase).');
