import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Issue a signed session JWT (FR 7 / FR 17). The `jti` claim links the token
 * to its server-side OAuthSession record so it can be revoked.
 */
export function signSessionToken({ userId, role, tokenId }) {
  return jwt.sign({ sub: userId, role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    jwtid: tokenId,
  });
}

/** Verify a session JWT, returning its decoded payload or throwing. */
export function verifySessionToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

/** Generate a random opaque session identifier (jti). */
export function newTokenId() {
  return crypto.randomUUID();
}

/** Compute an absolute expiry Date from the configured JWT lifetime. */
export function sessionExpiryDate() {
  const decoded = jwt.decode(
    jwt.sign({}, env.jwtSecret, { expiresIn: env.jwtExpiresIn }),
  );
  return new Date(decoded.exp * 1000);
}
