import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env, isGoogleOAuthConfigured } from './env.js';
import { findByProviderId, findByEmail, createUser, ROLES } from '../models/User.js';

/**
 * Resolve a Google profile to a DevScore user (FR 3–5):
 *  - detect an existing account by provider id (existing-user login),
 *  - or an existing account with the same email under a different sign-in
 *    method (local password, GitHub) — same person, same verified email,
 *    so log into that account rather than crashing on the email's unique
 *    constraint (mirrors the GitHub-login flow's existing-user check),
 *  - or create a new account with the default Student role.
 */
async function upsertGoogleUser(profile) {
  const email = profile.emails?.[0]?.value?.toLowerCase();
  if (!email) {
    throw new Error('Google account did not return an email address');
  }

  const existing = await findByProviderId('google', profile.id);
  if (existing) return existing;

  const byEmail = await findByEmail(email);
  if (byEmail) return byEmail;

  return createUser({
    email,
    firstName: profile.name?.givenName || '',
    lastName: profile.name?.familyName || '',
    avatarUrl: profile.photos?.[0]?.value || '',
    role: ROLES.STUDENT, // FR 8 — default role; admins are provisioned separately
    oauthProvider: 'google',
    oauthId: profile.id,
  });
}

/**
 * Register the Google OAuth strategy. Uses a stateless flow (no server-side
 * passport session) — we mint our own JWT after the callback, so
 * `session: false` is used everywhere.
 */
export function configurePassport() {
  if (!isGoogleOAuthConfigured) {
    console.warn(
      '[auth] GOOGLE_CLIENT_ID/SECRET not set — Google login routes will ' +
        'return 503 until configured (see server/.env.example).',
    );
    return passport;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.google.clientId,
        clientSecret: env.google.clientSecret,
        callbackURL: env.google.callbackUrl,
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await upsertGoogleUser(profile);
          done(null, user);
        } catch (err) {
          done(err);
        }
      },
    ),
  );

  return passport;
}
