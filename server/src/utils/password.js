import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

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
