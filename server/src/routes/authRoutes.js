import { Router } from 'express';
import passport from 'passport';
import { isGoogleOAuthConfigured, isGithubOAuthConfigured, env } from '../config/env.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { googleCallback, me, logout } from '../controllers/authController.js';
import {
  githubConnect,
  githubCallback,
  githubStatus,
  githubDisconnect,
} from '../controllers/githubController.js';

const router = Router();

/** Guard OAuth routes when credentials are not configured. */
function ensureGoogleConfigured(req, res, next) {
  if (!isGoogleOAuthConfigured) {
    return res.status(503).json({
      error: 'Google OAuth is not configured on this server',
    });
  }
  return next();
}

function ensureGithubConfigured(req, res, next) {
  if (!isGithubOAuthConfigured) {
    return res.status(503).json({
      error: 'GitHub OAuth is not configured on this server',
    });
  }
  return next();
}

// FR 1 / FR 2 / FR 11 / FR 12 — begin Google OAuth (sign up & log in share the flow).
router.get(
  '/google',
  ensureGoogleConfigured,
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
);

// FR 3–5 — OAuth callback: validate, detect/create user, issue session.
router.get(
  '/google/callback',
  ensureGoogleConfigured,
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${env.clientUrl}/?error=oauth_failed`,
  }),
  googleCallback,
);

// FR 8 — current user (client uses this to route to the role dashboard).
router.get('/me', requireAuth, me);

router.post('/logout', requireAuth, logout);

// FR 9/10 — Student connects a GitHub account via GitHub OAuth; role-gated
// (RBAC, FR 6) since only students may link GitHub evidence to their profile.
router.get(
  '/github/connect',
  requireAuth,
  requireRole('student'),
  ensureGithubConfigured,
  githubConnect,
);

// Public callback endpoint: GitHub redirects here with no DevScore session,
// so the linked user is recovered from the signed `state` param instead.
router.get('/github/callback', ensureGithubConfigured, githubCallback);

router.get('/github/status', requireAuth, requireRole('student'), githubStatus);

router.post(
  '/github/disconnect',
  requireAuth,
  requireRole('student'),
  githubDisconnect,
);

export default router;
