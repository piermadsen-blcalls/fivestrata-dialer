import { supabase } from '../clients/supabase.js';

/**
 * Granular call logging — the core data asset. Every Telnyx event is kept
 * raw in call_events; calls is the one-row-per-call rollup that reporting
 * (SPH, contact rate, completes, sub-source/geo slicing) builds on.
 */

interface TelnyxEvent {
  data?: {
    event_type?: string;
    occurred_at?: string;
    payload?: {
      call_control_id?: string;
      call_session_id?: string;
      [key: string]: unknown;
    };
  };
}

export async function recordCallEvent(event: TelnyxEvent): Promise<void> {
  const data = event.data;
  if (!data?.event_type) return;

  const { error } = await supabase.from('call_events').insert({
    event_type: data.event_type,
    call_control_id: data.payload?.call_control_id,
    call_session_id: data.payload?.call_session_id,
    occurred_at: data.occurred_at ?? new Date().toISOString(),
    payload: data.payload ?? {},
  });

  if (error) {
    // Don't throw — webhook route must still 200. Surface via logs/monitoring.
    console.error('call_events insert failed:', error.message);
  }

  // TODO: upsert the calls rollup row on call.initiated / call.answered /
  // call.hangup, and join back to leads via vendor_lead_code from VICIdial.
}
