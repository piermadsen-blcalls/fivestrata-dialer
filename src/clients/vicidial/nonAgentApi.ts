import { config } from '../../config.js';
import type { AddLeadParams, UpdateLeadParams, VicidialResponse } from './types.js';

/**
 * VICIdial Non-Agent API — /vicidial/non_agent_api.php
 *
 * Server-to-server operations: lead management, lists, hopper, reporting.
 * VICIdial has no official SDK; this is a thin typed wrapper over its HTTP GET
 * interface, which returns pipe-delimited plain text.
 */

async function call(fn: string, params: Record<string, string | undefined>): Promise<VicidialResponse> {
  const url = new URL('/vicidial/non_agent_api.php', config.vicidial.baseUrl);
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

export const nonAgentApi = {
  /** Check API connectivity and credentials. */
  version: () => call('version', {}),

  /** Insert a lead into a list. Set vendor_lead_code to the ccai lead UUID. */
  addLead: (params: AddLeadParams) => call('add_lead', { ...params }),

  updateLead: (params: UpdateLeadParams) => call('update_lead', { ...params }),

  /** Create a new dialing list under a campaign. */
  addList: (listId: string, listName: string, campaignId: string, active: 'Y' | 'N' = 'Y') =>
    call('add_list', {
      list_id: listId,
      list_name: listName,
      campaign_id: campaignId,
      active,
    }),

  /** Pull recording info for a lead/date range (stage: csv|tab|pipe). */
  recordingLookup: (params: { lead_id?: string; date?: string; uniqueid?: string }) =>
    call('recording_lookup', { ...params, stage: 'pipe' }),

  /** Hourly/daily call counts per campaign — feeds SPH/dials-per-hour KPIs. */
  callStatusStats: (params: { query_date: string; campaigns?: string; statuses?: string }) =>
    call('call_status_stats', { ...params }),

  /** Escape hatch for the ~100 functions not yet wrapped. */
  raw: call,
};
