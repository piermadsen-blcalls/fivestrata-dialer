import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

// Service-role client for server-side use only — bypasses RLS. Never expose to a browser.
export const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: { persistSession: false },
});
