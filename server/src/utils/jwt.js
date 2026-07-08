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

/**
 * Short-lived, purpose-scoped state token for the GitHub OAuth connect flow
 * (FR 9/10). The user is already authenticated via the session cookie when
 * `/auth/github/connect` is hit, but GitHub's redirect back to our callback
 * carries no session — this signed `state` param is how the callback learns
 * which user to link the GitHub identity to, and guards against CSRF.
 */
export function signGithubConnectState(userId) {
  return jwt.sign({ purpose: 'github_connect', sub: userId }, env.jwtSecret, {
    expiresIn: '10m',
  });
}

/** Verify the GitHub connect state token, returning the user id it names. */
export function verifyGithubConnectState(state) {
  const payload = jwt.verify(state, env.jwtSecret);
  if (payload.purpose !== 'github_connect' || !payload.sub) {
    throw new Error('Invalid state token');
  }
  return payload.sub;
}
