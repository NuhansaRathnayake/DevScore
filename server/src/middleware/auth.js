import { verifySessionToken } from '../utils/jwt.js';
import { findByTokenId, isSessionActive } from '../models/OAuthSession.js';
import { findById } from '../models/User.js';

/** Extract a bearer token from the Authorization header or session cookie. */
function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return req.cookies?.devscore_session || null;
}

/**
 * requireAuth — validates the session JWT (FR 3), confirms the server-side
 * session is still active (FR 7, supports revocation), and attaches the user.
 */
export async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifySessionToken(token);

    const session = await findByTokenId(payload.jti);
    if (!session || !isSessionActive(session)) {
      return res.status(401).json({ error: 'Session expired or revoked' });
    }

    const user = await findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    req.user = user;
    req.authSession = session;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * requireRole — role-based access control (FR 6). Usage:
 *   router.get('/admin', requireAuth, requireRole('admin'), handler)
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: 'You do not have access to this resource' });
    }
    return next();
  };
}
