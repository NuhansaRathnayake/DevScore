import { supabase } from '../config/db.js';

/**
 * A student's linked GitHub account (FR 9/10) — one row per user, in its
 * own table (see server/supabase/schema.sql). The OAuth access token itself
 * lives in oauth_sessions, not here.
 */

/** Map a DB row to the shape the client expects. */
export function toPublicGithubConnection(row) {
  if (!row) return null;
  return {
    username: row.username,
    connectedAt: row.connected_at,
  };
}

/** Fetch the current GitHub connection for a user, or null if not connected. */
export async function findByUserId(userId) {
  const { data, error } = await supabase
    .from('github_connections')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Fetch connections for many users at once (recruiter candidate list). */
export async function findByUserIds(userIds) {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from('github_connections')
    .select('*')
    .in('user_id', userIds);
  if (error) throw new Error(error.message);
  return data;
}

/** Link (or replace) a student's GitHub identity. */
export async function upsert(userId, username) {
  const { data, error } = await supabase
    .from('github_connections')
    .upsert(
      { user_id: userId, username, connected_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Remove a student's GitHub connection (disconnect). */
export async function remove(userId) {
  const { error } = await supabase.from('github_connections').delete().eq('user_id', userId);
  if (error) throw new Error(error.message);
}
