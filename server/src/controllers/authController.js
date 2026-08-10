import { createSession, revokeSession } from '../models/OAuthSession.js';
import { toPublicUser, findByEmail, createUser } from '../models/User.js';
import { hashPassword, verifyPassword, isPasswordValid } from '../utils/password.js';
import {
  signSessionToken,
  newTokenId,
  sessionExpiryDate,
} from '../utils/jwt.js';
import { env } from '../config/env.js';

const SESSION_COOKIE = 'devscore_session';

/**
 * Create a server-side session record and its signed JWT (FR 5, 7, 17).
 * `provider` records how *this* session was established (google / github /
 * local) — distinct from how the account itself was originally created.
 */
async function issueSession(req, user, provider) {
  const tokenId = newTokenId();
  const expiresAt = sessionExpiryDate();

  await createSession({
    userId: user.id,
    provider,
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

/** Set the session cookie the same way for every login path. */
function setSessionCookie(res, token, expiresAt) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    expires: expiresAt,
  });
}

/**
 * Google OAuth callback handler. Passport has already authenticated the user
 * and attached it to req.user; here we mint the session and hand control back
 * to the client (FR 8 / FR 18 — role-based redirect happens client-side).
 */
export async function googleCallback(req, res, next) {
  try {
    const { token, expiresAt } = await issueSession(req, req.user, 'google');
    setSessionCookie(res, token, expiresAt);

    // The session lives only in the httpOnly cookie now (never in the URL or
    // localStorage — see SDS §4.7.2). The SPA callback route calls /me, which
    // authenticates via the cookie, then routes by role.
    res.redirect(`${env.clientUrl}/auth/callback`);
  } catch (err) {
    next(err);
  }
}

/**
 * Email/password registration. Shares the "Student by default" business
 * rule with the OAuth flows (FR 8) — recruiters/admins are provisioned
 * separately. Responds with the user directly (this is a fetch call from
 * the login form, not a full-page redirect like the OAuth flows).
 */
export async function register(req, res, next) {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const password = req.body?.password || '';
    const firstName = (req.body?.firstName || '').trim();
    const lastName = (req.body?.lastName || '').trim();

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    if (!isPasswordValid(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!firstName) {
      return res.status(400).json({ error: 'First name is required' });
    }

    const existing = await findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({ email, firstName, lastName, passwordHash });

    const { token, expiresAt } = await issueSession(req, user, 'local');
    setSessionCookie(res, token, expiresAt);

    res.status(201).json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

/** Email/password login. */
export async function login(req, res, next) {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const password = req.body?.password || '';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await findByEmail(email);
    if (!user || !user.password_hash) {
      return res.status(401).json({
        error: 'Invalid email or password, or this account uses Google/GitHub sign-in',
      });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { token, expiresAt } = await issueSession(req, user, 'local');
    setSessionCookie(res, token, expiresAt);

    res.json({ user: toPublicUser(user) });
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
