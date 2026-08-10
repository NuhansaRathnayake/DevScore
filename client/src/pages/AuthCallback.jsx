import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '../context/AuthContext.jsx';

/**
 * OAuth callback landing (FR 8 / FR 18). The server has already set the
 * session as an httpOnly cookie (see authController.googleCallback); this
 * page just loads the profile over that cookie and routes by role.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { loadUser } = useAuth();
  const [error, setError] = useState('');
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    (async () => {
      const me = await loadUser();
      if (!me) {
        setError('Sign-in did not complete. Please try again.');
        return;
      }
      navigate(ROLE_HOME[me.role] || '/student', { replace: true });
    })();
  }, [loadUser, navigate]);

  if (error) {
    return (
      <div className="centered-status">
        {error} <a href="/login">Return to sign in</a>
      </div>
    );
  }
  return <div className="centered-status">Signing you in…</div>;
}
