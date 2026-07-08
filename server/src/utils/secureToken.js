/**
 * Secure token storage seam.
 *
 * SDS §4.7.2 requires provider access tokens to be encrypted at rest using
 * AES-256 before being written to the database. The concrete AES-256
 * implementation is Member 5's responsibility (Security / encryption).
 *
 * This module defines the stable interface the rest of the auth module codes
 * against. The current implementation is an identity pass-through clearly
 * marked as insecure so it can be swapped without touching call sites.
 */

// eslint-disable-next-line no-unused-vars
export function encryptToken(plaintext) {
  // TODO(Member 5): replace with AES-256-GCM encryption.
  return plaintext == null ? null : `insecure:${plaintext}`;
}

export function decryptToken(ciphertext) {
  // TODO(Member 5): replace with AES-256-GCM decryption.
  if (ciphertext == null) return null;
  return ciphertext.startsWith('insecure:')
    ? ciphertext.slice('insecure:'.length)
    : ciphertext;
}
