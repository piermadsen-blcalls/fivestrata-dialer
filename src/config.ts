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
    apiKey: required('TELNYX_API_KEY'),
    publicKey: required('TELNYX_PUBLIC_KEY'),
  },

  vicidial: {
    baseUrl: required('VICIDIAL_BASE_URL'),
    user: required('VICIDIAL_API_USER'),
    pass: required('VICIDIAL_API_PASS'),
    source: process.env.VICIDIAL_SOURCE ?? 'ccai',
  },
} as const;

export type Config = typeof config;
