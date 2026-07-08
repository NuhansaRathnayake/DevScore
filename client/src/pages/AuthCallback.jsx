import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStore } from '../lib/api.js';
import { useAuth, ROLE_HOME } from '../context/AuthContext.jsx';

/**
 * OAuth callback landing (FR 8 / FR 18). The server redirects here with the
 * session token in the URL fragment; we persist it, load the profile, then
 * route to the role-appropriate dashboard.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { loadUser } = useAuth();
  const [error, setError] = useState('');
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get('token');

    if (!token) {
      setError('No session token was returned.');
      return;
    }

    tokenStore.set(token);
    window.history.replaceState(null, '', window.location.pathname);

    (async () => {
      await loadUser();
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        navigate(ROLE_HOME[payload.role] || '/student', { replace: true });
      } catch {
        navigate('/student', { replace: true });
      }
    })();
  }, [loadUser, navigate]);

  if (error) {
    return (
      <div className="centered-status">
        {error} <a href="/">Return to sign in</a>
      </div>
    );
  }
  return <div className="centered-status">Signing you in…</div>;
}
