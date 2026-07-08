import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { authApi } from '../lib/api.js';
import { useAuth, ROLE_HOME } from '../context/AuthContext.jsx';

/** Google "G" mark for the sign-in button. */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

/**
 * Welcome / authentication entry screen (SRS §1.4.1/1.4.2, FR 1/2/11/12).
 * Registration and login share a single "Sign in with Google" action per the
 * business rule "Registration allowed only via Google OAuth".
 */
export default function Welcome() {
  const { user, status } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const oauthFailed = params.get('error') === 'oauth_failed';

  // Already signed in → straight to the role dashboard.
  useEffect(() => {
    if (status === 'authed' && user) {
      navigate(ROLE_HOME[user.role] || '/student', { replace: true });
    }
  }, [status, user, navigate]);

  return (
    <div className="auth-screen">
      <div className="auth-card card">
        <span className="brand">
          <Logo showText subtitle="AI Job Readiness Scoring" />
        </span>

        <h1>Welcome to DevScore</h1>
        <p>
          Verify your software engineering skills with evidence from your
          resume and GitHub activity. Sign in to get started.
        </p>

        {oauthFailed && (
          <div className="auth-error">
            Google sign-in was cancelled or failed. Please try again.
          </div>
        )}

        <button
          type="button"
          className="btn-primary btn-google"
          onClick={authApi.startGoogleLogin}
        >
          <GoogleIcon />
          Sign in with Google
        </button>

        <p className="auth-fineprint">
          Registration is available only via Google OAuth. By continuing you
          agree to the Informed Consent and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
