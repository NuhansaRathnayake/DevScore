import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;
const TEMP_PASSWORD_CHARS =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';

/** Hash a plaintext password for storage (never store plaintext, SDS §4.7). */
export function hashPassword(plainText) {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

/** Compare a plaintext password against a stored bcrypt hash. */
export function verifyPassword(plainText, hash) {
  return bcrypt.compare(plainText, hash);
}

/**
 * Minimal server-side password policy: at least 8 characters. Kept simple
 * and predictable — the client mirrors this so users don't get surprised.
 */
export function isPasswordValid(plainText) {
  return typeof plainText === 'string' && plainText.length >= 8;
}

/**
 * Generate a random one-time password for an admin-created account (FR
 * 47-50 — admin CRUD). Returned to the admin exactly once; only its hash is
 * persisted, so it cannot be recovered later — the admin must issue a new
 * one if it's lost.
 */
export function generateTempPassword(length = 12) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += TEMP_PASSWORD_CHARS[bytes[i] % TEMP_PASSWORD_CHARS.length];
  }
  return out;
}
