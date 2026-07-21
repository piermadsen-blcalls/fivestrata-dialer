import { supabase } from '../clients/supabase.js';
import { nonAgentApi } from '../clients/vicidial/nonAgentApi.js';

export interface InboundLead {
  /** FiveStrata OLeadID — the cross-system key for techss_ write-back */
  oleadid?: string;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  address1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  email?: string;
  /** bathroom | windows | home_warranty | ... */
  vertical?: string;
  lead_type?: 'fresh' | 'revive';
  source?: string;
  /** FS code — required for the sub-source slicing the team asked for */
  sub_source?: string;
}

export interface RouteResult {
  accepted: boolean;
  lead_id?: string;
  reason?: string;
}

/**
 * Intake pipeline: persist -> (TODO: DNC check) -> push to a VICIdial list.
 *
 * v1 starts with revive leads on a single vertical; the fresh/revive switch is
 * just the lead_type field plus which lists we activate. List/campaign
 * assignment per vertical is TODO pending VICIdial campaign design.
 */
export async function routeLead(lead: InboundLead): Promise<RouteResult> {
  const { data, error } = await supabase
    .from('leads')
    .insert({
      oleadid: lead.oleadid,
      phone_number: lead.phone_number,
      first_name: lead.first_name,
      last_name: lead.last_name,
      address1: lead.address1,
      city: lead.city,
      state: lead.state,
      postal_code: lead.postal_code,
      email: lead.email,
      vertical: lead.vertical,
      lead_type: lead.lead_type ?? 'revive',
      source: lead.source,
      sub_source: lead.sub_source,
      status: 'received',
    })
    .select('id')
    .single();

  if (error) {
    return { accepted: false, reason: `persist failed: ${error.message}` };
  }

  // TODO: DNC validation — in the current LeadOps flow this happens after
  // call-center selection, so leads routed to ccai must be checked here.

  // TODO: replace hardcoded list with per-vertical list/campaign mapping.
  // Lead persistence must survive a dead/unreachable dialer (async-always):
  // the lead stays in 'vici_error' for later re-queue rather than being lost.
  let vici;
  try {
    vici = await nonAgentApi.addLead({
      phone_number: lead.phone_number,
      list_id: '999',
      first_name: lead.first_name,
      last_name: lead.last_name,
      postal_code: lead.postal_code,
      vendor_lead_code: data.id,
      duplicate_check: 'DUPLIST',
    });
  } catch (err) {
    vici = { ok: false, raw: `vicidial unreachable: ${(err as Error).message}`, fields: [] };
  }

  if (!vici.ok) {
    await supabase.from('leads').update({ status: 'vici_error' }).eq('id', data.id);
    return { accepted: false, lead_id: data.id, reason: vici.raw };
  }

  await supabase.from('leads').update({ status: 'queued' }).eq('id', data.id);
  return { accepted: true, lead_id: data.id };
}

/**
 * Client selection for a qualified lead — the transfer-priority piece.
 *
 * Agreed pattern (Joseph): pre-authenticate a default client before dialing,
 * re-request at qualification, fall back to the default if the re-request is
 * slow or errors. TODO: integrate with the existing Command Center /
 * transfer-priority endpoint; interim implementation reads the
 * transfer_priorities table by vertical + zip.
 */
export async function selectClient(vertical: string, postalCode: string) {
  const { data, error } = await supabase
    .from('transfer_priorities')
    .select('client_id, weight, clients(name, active)')
    .eq('vertical', vertical)
    .eq('postal_code', postalCode)
    .order('weight', { ascending: false });

  if (error || !data?.length) return null;
  return data[0];
}
