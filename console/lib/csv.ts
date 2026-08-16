/**
 * Dependency-free CSV parsing + NANP phone normalization.
 * toDigits() MUST stay in sync with the SQL phone_digits() function
 * (supabase/migrations/0004): strip non-digits; 11 digits starting with 1 -> drop the 1.
 */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) {
    row.push(field);
    if (row.length > 1 || row[0] !== '') rows.push(row);
  }
  return rows;
}

export function toDigits(phone: string): string {
  const d = (phone ?? '').replace(/\D/g, '');
  return d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
}

export function isValidNanp(phone: string): boolean {
  const d = toDigits(phone);
  return d.length === 10 && d[0] >= '2' && d[3] >= '2';
}

/** Canonical lead fields the wizard can map a CSV column onto. */
export const CANONICAL_FIELDS = [
  { key: 'phone', label: 'Phone (required)', required: true },
  { key: 'first_name', label: 'First name' },
  { key: 'last_name', label: 'Last name' },
  { key: 'address1', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'postal_code', label: 'ZIP' },
  { key: 'email', label: 'Email' },
  { key: 'external_lead_id', label: 'External lead id' },
  { key: 'source', label: 'Source label' },
  { key: 'acquisition_cost', label: 'Cost per lead' },
] as const;

const HEADER_HINTS: Record<string, RegExp> = {
  phone: /phone|cell|mobile|number/i,
  first_name: /first/i,
  last_name: /last|surname/i,
  address1: /addr|street/i,
  city: /city|town/i,
  state: /^st$|state|province/i,
  postal_code: /zip|postal/i,
  email: /mail/i,
  external_lead_id: /lead.?id|record.?id|^id$|oleadid/i,
  source: /source|origin|list.?name/i,
  acquisition_cost: /cost|price|cpl/i,
};

/** header -> canonical key, 'payload' (kept as extra data) — auto-suggestion. */
export function suggestMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const taken = new Set<string>();
  for (const h of headers) {
    let hit = 'payload';
    for (const [key, re] of Object.entries(HEADER_HINTS)) {
      if (!taken.has(key) && re.test(h.trim())) {
        hit = key;
        taken.add(key);
        break;
      }
    }
    mapping[h] = hit;
  }
  return mapping;
}
