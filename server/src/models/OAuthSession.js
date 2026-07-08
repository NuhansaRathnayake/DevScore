import { supabase } from '../config/db.js';

/**
 * OAuth session data-access module (FR 7 — "Generate and manage secure session
 * tokens server side"). One row per issued session token, enabling server-side
 * revocation and a basic audit trail (SDS §4.7.5). Backed by the Supabase
 * `oauth_sessions` table.
 *
 * The GitHub OAuth access token (FR 10) is stored via the `secureToken`
 * utility; AES-256 encryption-at-rest is Member 5's responsibility.
 */

/** Persist a new session record. Accepts camelCase input. */
export async function createSession({
  userId,
  provider,
  tokenId,
  encryptedAccessToken = null,
  userAgent = '',
  ip = '',
  expiresAt,
}) {
  const { data, error } = await supabase
    .from('oauth_sessions')
    .insert({
      user_id: userId,
      provider,
      token_id: tokenId,
      encrypted_access_token: encryptedAccessToken,
      user_agent: userAgent,
      ip,
      expires_at:
        expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Fetch a session by its opaque token id (JWT jti). */
export async function findByTokenId(tokenId) {
  const { data, error } = await supabase
    .from('oauth_sessions')
    .select('*')
    .eq('token_id', tokenId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** True if the session is neither revoked nor expired. */
export function isSessionActive(row) {
  return !row.revoked_at && new Date(row.expires_at).getTime() > Date.now();
}

/** Revoke a session (logout). */
export async function revokeSession(tokenId) {
  const { error } = await supabase
    .from('oauth_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token_id', tokenId);
  if (error) throw new Error(error.message);
}

/**
 * Find the user's most recent active session for a provider (e.g. the
 * linked GitHub token, FR 9/10). Used to report connection status and to
 * supply the encrypted access token to later GitHub API calls.
 */
export async function findActiveByUserAndProvider(userId, provider) {
  const { data, error } = await supabase
    .from('oauth_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data && !isSessionActive(data)) return null;
  return data;
}

/** Revoke every active session for a user under a given provider (reconnect/disconnect). */
export async function revokeAllForUserProvider(userId, provider) {
  const { error } = await supabase
    .from('oauth_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('provider', provider)
    .is('revoked_at', null);
  if (error) throw new Error(error.message);
}
