/** Parsed response from either VICIdial HTTP API (they return pipe-delimited plain text). */
export interface VicidialResponse {
  ok: boolean;
  /** e.g. "SUCCESS: add_lead LEAD HAS BEEN ADDED" or "ERROR: ..." */
  raw: string;
  /** pipe-split fields following the status line, when present */
  fields: string[];
}

export interface AddLeadParams {
  phone_number: string;
  list_id: string;
  first_name?: string;
  last_name?: string;
  address1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  email?: string;
  /** ccai lead UUID — round-trips through VICIdial so calls join back to Supabase */
  vendor_lead_code?: string;
  /** skip DNC check (leave unset — DNC filtering is a business requirement) */
  dnc_check?: 'Y' | 'N';
  duplicate_check?: 'DUPLIST' | 'DUPCAMP' | 'DUPSYS';
}

export interface UpdateLeadParams {
  lead_id?: string;
  phone_number?: string;
  vendor_lead_code?: string;
  status?: string;
  list_id?: string;
  [key: string]: string | undefined;
}

export interface ExternalDialParams {
  agent_user: string;
  phone_number: string;
  phone_code?: string;
  search: 'YES' | 'NO';
  preview: 'YES' | 'NO';
  focus: 'YES' | 'NO';
  vendor_lead_code?: string;
}
