import { createSession, revokeSession } from '../models/OAuthSession.js';
import { toPublicUser } from '../models/User.js';
import {
  signSessionToken,
  newTokenId,
  sessionExpiryDate,
} from '../utils/jwt.js';
import { env } from '../config/env.js';

const SESSION_COOKIE = 'devscore_session';

/**
 * Create a server-side session record and its signed JWT (FR 5, 7, 17).
 * Called by the OAuth callback once passport has resolved the user.
 */
async function issueSession(req, user) {
  const tokenId = newTokenId();
  const expiresAt = sessionExpiryDate();

  await createSession({
    userId: user.id,
    provider: user.oauth_provider,
    tokenId,
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip,
    expiresAt,
  });

  const token = signSessionToken({
    userId: user.id,
    role: user.role,
    tokenId,
  });

  return { token, expiresAt };
}

/**
 * Google OAuth callback handler. Passport has already authenticated the user
 * and attached it to req.user; here we mint the session and hand control back
 * to the client (FR 8 / FR 18 — role-based redirect happens client-side).
 */
export async function googleCallback(req, res, next) {
  try {
    const { token, expiresAt } = await issueSession(req, req.user);

    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'lax',
      expires: expiresAt,
    });

    // The session lives only in the httpOnly cookie now (never in the URL or
    // localStorage — see SDS §4.7.2). The SPA callback route calls /me, which
    // authenticates via the cookie, then routes by role.
    res.redirect(`${env.clientUrl}/auth/callback`);
  } catch (err) {
    next(err);
  }
}

/** Return the authenticated user's public profile (FR 8, drives role routing). */
export async function me(req, res) {
  res.json({ user: toPublicUser(req.user) });
}

/** Revoke the current server-side session (logout). */
export async function logout(req, res) {
  if (req.authSession) {
    await revokeSession(req.authSession.token_id);
  }
  res.clearCookie(SESSION_COOKIE);
  res.json({ ok: true });
}
