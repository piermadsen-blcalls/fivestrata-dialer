/**
 * Curated dialer_config surface. Everything not listed here is invisible to the
 * console: call_state:* rows are engine-internal, and secret keys must never be
 * selected, rendered, or edited.
 */
export type KeySpec = {
  label: string;
  description: string;
  type: 'boolean' | 'text';
  allowed?: string[];
};

export const EDITABLE_KEYS: Record<string, KeySpec> = {
  inbound_ip_enforce: {
    label: 'Inbound IP allowlist enforcement',
    description:
      "When 'true', the fivestrata-inbound APIs only accept calls from the 9 whitelisted " +
      'FiveStrata IPs. Keep off until go-live with Joseph.',
    type: 'boolean',
  },
  persona_next: {
    label: 'Next synthetic persona',
    description:
      'Test bench: persona the agent adopts when Claire dials her own DID (empty = none). ' +
      'One of the 7 personas, e.g. butch, hobby_litigator.',
    type: 'text',
  },
};

/** Shown as "set / not set" only — values are never fetched. */
export const SECRET_KEYS = ['inbound_api_key', 'telnyx_api_key', 'telnyx_public_key'];
