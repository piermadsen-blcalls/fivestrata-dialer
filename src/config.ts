import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  // 127.0.0.1 avoids Windows Firewall prompts in local dev; deployments that
  // must accept external traffic (e.g. LeadConduit posts) set HOST=0.0.0.0.
  host: process.env.HOST ?? '127.0.0.1',

  supabase: {
    url: required('SUPABASE_URL'),
    // Supabase's current key naming is sb_secret_ (SUPABASE_SECRET_KEY); the
    // legacy service_role name is accepted as a fallback.
    serviceRoleKey:
      process.env.SUPABASE_SECRET_KEY ?? required('SUPABASE_SERVICE_ROLE_KEY'),
  },

  telnyx: {
    // The simulated tier never dials, and webhook signature verification
    // fails closed on a blank public key, so the server may boot without
    // these. Live dialing requires all three (connectionId comes from
    // scripts/telnyx-setup.ts).
    apiKey: process.env.TELNYX_API_KEY ?? '',
    publicKey: process.env.TELNYX_PUBLIC_KEY ?? '',
    connectionId: process.env.TELNYX_CONNECTION_ID ?? '',
  },

  vicidial: {
    // Vestigial (no ViciDial instance per the PRD decision) — never required.
    baseUrl: process.env.VICIDIAL_BASE_URL ?? '',
    user: process.env.VICIDIAL_API_USER ?? '',
    pass: process.env.VICIDIAL_API_PASS ?? '',
    source: process.env.VICIDIAL_SOURCE ?? 'ccai',
  },
} as const;

export type Config = typeof config;
