import { supabase } from '../config/db.js';

/**
 * User data-access module — Member 1 database ownership (Users; OAuth sessions).
 * Backed by the Supabase `users` table (see server/supabase/schema.sql).
 */

/** Roles enforced across the system (SRS §1.1.1 primary actors). */
export const ROLES = Object.freeze({
  STUDENT: 'student',
  RECRUITER: 'recruiter',
  ADMIN: 'admin',
});

/** Map a DB row (snake_case) to the public shape returned to the client. */
export function toPublicUser(row) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: `${row.first_name} ${row.last_name}`.trim(),
    avatarUrl: row.avatar_url,
    role: row.role,
    createdAt: row.created_at,
  };
}

/** Detect an existing account by provider identity (FR 4/6). */
export async function findByProviderId(provider, oauthId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('oauth_provider', provider)
    .eq('oauth_id', oauthId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Look up a user by primary key. */
export async function findById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Create a new user account (FR 5). Accepts camelCase input. */
export async function createUser({
  email,
  firstName = '',
  lastName = '',
  avatarUrl = '',
  role = ROLES.STUDENT,
  oauthProvider,
  oauthId,
}) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      first_name: firstName,
      last_name: lastName,
      avatar_url: avatarUrl,
      role,
      oauth_provider: oauthProvider,
      oauth_id: oauthId,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
