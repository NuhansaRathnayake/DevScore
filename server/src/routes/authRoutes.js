import { Router } from 'express';
import passport from 'passport';
import { isGoogleOAuthConfigured, env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { googleCallback, me, logout } from '../controllers/authController.js';

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

export default router;
