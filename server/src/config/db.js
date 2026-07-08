import { createClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from './env.js';

/**
 * Data Tier client (Supabase / Postgres). Uses the service-role key, so it
 * bypasses row-level security and must never be exposed to the browser.
 * Null until Supabase credentials are configured.
 */
export const supabase = isSupabaseConfigured
  ? createClient(env.supabase.url, env.supabase.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

/**
 * Verify connectivity by issuing a trivial query. Rejects if Supabase is not
 * configured or the schema/migration has not been applied.
 */
export async function verifyDatabaseConnection() {
  if (!supabase) {
    throw new Error('Supabase is not configured (set SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  }
  const { error } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true });
  if (error) throw new Error(error.message);
  console.log(`[db] connected to Supabase at ${env.supabase.url}`);
}
