import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Service-role client. BYPASSES Row Level Security.
 * Only use on the server for trusted operations (creating orders, Telegram webhook, seeding).
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
