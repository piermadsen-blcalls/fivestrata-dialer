import { config } from '../../config.js';
import type { ExternalDialParams, VicidialResponse } from './types.js';

/**
 * VICIdial Agent API — /agc/api.php
 *
 * Controls a live agent session: place calls, set dispositions, transfer,
 * park, hangup. Used by the platform to drive/observe agent (or AI-agent)
 * sessions programmatically.
 */

async function call(fn: string, params: Record<string, string | undefined>): Promise<VicidialResponse> {
  const url = new URL('/agc/api.php', config.vicidial.baseUrl);
  url.searchParams.set('source', config.vicidial.source);
  url.searchParams.set('user', config.vicidial.user);
  url.searchParams.set('pass', config.vicidial.pass);
  url.searchParams.set('function', fn);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }

  const res = await fetch(url);
  const raw = (await res.text()).trim();
  return {
    ok: raw.startsWith('SUCCESS'),
    raw,
    fields: raw.split('|').slice(1),
  };
}

export const agentApi = {
  /** Place an outbound call on a logged-in agent's session. */
  externalDial: (params: ExternalDialParams) => call('external_dial', { ...params }),

  /** Set the disposition for the agent's current/last call. */
  externalStatus: (agentUser: string, status: string) =>
    call('external_status', { agent_user: agentUser, value: status }),

  /** Hang up the agent's current call. */
  externalHangup: (agentUser: string) =>
    call('external_hangup', { agent_user: agentUser, value: '1' }),

  /**
   * Transfer the current call — the client-handoff step after qualification.
   * e.g. value: 'DIAL_WITH_CUSTOMER' + phone_number for a warm transfer.
   */
  transferConference: (params: {
    agent_user: string;
    value: string;
    phone_number?: string;
  }) => call('transfer_conference', { ...params }),

  /** Pause/resume the agent ('PAUSE' | 'RESUME'). */
  externalPause: (agentUser: string, value: 'PAUSE' | 'RESUME') =>
    call('external_pause', { agent_user: agentUser, value }),

  /** Escape hatch for unwrapped functions. */
  raw: call,
};
