import { env } from '../config/env.js';
import {
  signGithubConnectState,
  verifyGithubConnectState,
  newTokenId,
} from '../utils/jwt.js';
import { encryptToken } from '../utils/secureToken.js';
import {
  createSession,
  findActiveByUserAndProvider,
  revokeAllForUserProvider,
  revokeSession,
} from '../models/OAuthSession.js';
import { setGithubProfile, clearGithubProfile } from '../models/User.js';

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_API = 'https://api.github.com/user';

// GitHub OAuth app tokens don't expire on their own; we still record an
// expiry so oauth_sessions' NOT NULL/audit semantics (SDS §4.7.5) hold, and
// so a stale connection eventually falls out of "active" if never renewed.
const GITHUB_TOKEN_TTL_DAYS = 365;

/**
 * Begin the GitHub OAuth connect flow (FR 9). Only students who are already
 * logged in via the DevScore session may reach this route (requireAuth +
 * requireRole('student') in the route definition). We can't rely on a
 * server-side session for the redirect round-trip, so the current user id is
 * carried in a short-lived signed `state` param instead (verified in the
 * callback, and doubling as CSRF protection).
 */
export function githubConnect(req, res) {
  const state = signGithubConnectState(req.user.id);

  const params = new URLSearchParams({
    client_id: env.github.clientId,
    redirect_uri: env.github.callbackUrl,
    // Read-only, public-data scopes only (SDS §4.7.4 — minimum viable permissions).
    scope: 'read:user public_repo',
    state,
    allow_signup: 'false',
  });

  res.redirect(`${GITHUB_AUTHORIZE_URL}?${params.toString()}`);
}

/**
 * GitHub OAuth callback (FR 9/10). Exchanges the authorization code for an
 * access token, fetches the GitHub username, encrypts and stores the token
 * (via the oauth_sessions audit table), and records the linked username on
 * the user profile.
 */
export async function githubCallback(req, res) {
  const { code, state, error: githubError } = req.query;
  const redirectBack = (query) =>
    res.redirect(`${env.clientUrl}/student/github?${new URLSearchParams(query)}`);

  if (githubError) {
    return redirectBack({ error: 'github_permission_denied' });
  }
  if (!code || !state) {
    return redirectBack({ error: 'github_invalid_callback' });
  }

  let userId;
  try {
    userId = verifyGithubConnectState(state);
  } catch {
    return redirectBack({ error: 'github_invalid_state' });
  }

  try {
    const tokenRes = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: env.github.clientId,
        client_secret: env.github.clientSecret,
        code,
        redirect_uri: env.github.callbackUrl,
      }),
    });
    const tokenBody = await tokenRes.json();

    if (!tokenRes.ok || !tokenBody.access_token) {
      return redirectBack({ error: 'github_token_exchange_failed' });
    }
    const accessToken = tokenBody.access_token;

    const profileRes = await fetch(GITHUB_USER_API, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'DevScore-App',
      },
    });
    if (!profileRes.ok) {
      return redirectBack({ error: 'github_profile_fetch_failed' });
    }
    const profile = await profileRes.json();

    // One active GitHub connection per student — revoke any prior one before storing the new session.
    await revokeAllForUserProvider(userId, 'github');

    const expiresAt = new Date(
      Date.now() + GITHUB_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    await createSession({
      userId,
      provider: 'github',
      tokenId: newTokenId(),
      encryptedAccessToken: encryptToken(accessToken),
      userAgent: req.headers['user-agent'] || '',
      ip: req.ip,
      expiresAt,
    });

    await setGithubProfile(userId, profile.login);

    return redirectBack({ connected: '1' });
  } catch {
    return redirectBack({ error: 'github_connection_failed' });
  }
}

/** Report whether the current student has an active GitHub connection. */
export async function githubStatus(req, res) {
  const session = await findActiveByUserAndProvider(req.user.id, 'github');
  res.json({
    connected: Boolean(session),
    username: req.user.github_username || null,
    connectedAt: req.user.github_connected_at || null,
  });
}

/** Disconnect the student's linked GitHub account. */
export async function githubDisconnect(req, res) {
  const session = await findActiveByUserAndProvider(req.user.id, 'github');
  if (session) {
    await revokeSession(session.token_id);
  }
  await clearGithubProfile(req.user.id);
  res.json({ ok: true });
}
