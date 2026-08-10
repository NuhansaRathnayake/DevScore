import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { authApi } from '../lib/api.js';
import { useAuth, ROLE_HOME } from '../context/AuthContext.jsx';

/** Google "G" mark. */
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

/** GitHub "octocat" mark, single-color. */
function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="#181717" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

const ERROR_MESSAGES = {
  oauth_failed: 'Google sign-in was cancelled or failed. Please try again.',
  github_failed: 'GitHub sign-in was cancelled or failed. Please try again.',
  github_permission_denied: 'GitHub access was denied. Please try again.',
  github_invalid_callback: 'GitHub sign-in could not be completed. Please try again.',
  github_invalid_state: 'That GitHub sign-in link expired. Please try again.',
  github_email_required:
    'Your GitHub account has no public email. Add one in GitHub settings, or sign up with email/password instead.',
  github_login_failed: 'GitHub sign-in failed. Please try again.',
};

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

/**
 * Login / registration screen. Supports email + password (local accounts)
 * alongside "Sign in with Google" and "Sign in with GitHub" (SRS §1.4.1/
 * 1.4.2, FR 1/2/11/12).
 */
export default function Login() {
  const { user, status, loadUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const queryError = params.get('error');

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Already signed in → straight to the role dashboard.
  useEffect(() => {
    if (status === 'authed' && user) {
      navigate(ROLE_HOME[user.role] || '/student', { replace: true });
    }
  }, [status, user, navigate]);

  function updateField(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function switchMode(next) {
    setMode(next);
    setFormError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (mode === 'signup') {
      if (!form.firstName.trim()) {
        return setFormError('First name is required.');
      }
      if (form.password.length < 8) {
        return setFormError('Password must be at least 8 characters.');
      }
      if (form.password !== form.confirmPassword) {
        return setFormError('Passwords do not match.');
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'signup') {
        await authApi.register({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
        });
      } else {
        await authApi.login({ email: form.email, password: form.password });
      }
      const me = await loadUser();
      navigate(ROLE_HOME[me?.role] || '/student', { replace: true });
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const bannerError = formError || (queryError && (ERROR_MESSAGES[queryError] || ERROR_MESSAGES.oauth_failed));

  return (
    <div className="auth-screen">
      <Link to="/" className="auth-back">
        &larr; Back to home
      </Link>
      <div className="auth-card card auth-card--wide">
        <span className="brand">
          <Logo showText subtitle="AI Job Readiness Scoring" />
        </span>

        <h1>Welcome to DevScore</h1>
        <p>
          Verify your software engineering skills with evidence from your
          resume and GitHub activity.
        </p>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            className={`auth-tab ${mode === 'signin' ? 'is-active' : ''}`}
            onClick={() => switchMode('signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={`auth-tab ${mode === 'signup' ? 'is-active' : ''}`}
            onClick={() => switchMode('signup')}
          >
            Sign up
          </button>
        </div>

        {bannerError && <div className="auth-error">{bannerError}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="auth-form__row">
              <label className="auth-field">
                <span>First name</span>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={updateField('firstName')}
                  autoComplete="given-name"
                  required
                />
              </label>
              <label className="auth-field">
                <span>Last name</span>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={updateField('lastName')}
                  autoComplete="family-name"
                />
              </label>
            </div>
          )}

          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={updateField('email')}
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={updateField('password')}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={mode === 'signup' ? 8 : undefined}
              required
            />
          </label>

          {mode === 'signup' && (
            <label className="auth-field">
              <span>Confirm password</span>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={updateField('confirmPassword')}
                autoComplete="new-password"
                required
              />
            </label>
          )}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting
              ? 'Please wait…'
              : mode === 'signup'
                ? 'Create account'
                : 'Sign in'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        <div className="auth-providers">
          <button
            type="button"
            className="btn-primary btn-google"
            onClick={authApi.startGoogleLogin}
          >
            <GoogleIcon />
            Google
          </button>
          <button
            type="button"
            className="btn-primary btn-github"
            onClick={authApi.startGithubLogin}
          >
            <GithubIcon />
            GitHub
          </button>
        </div>

        <p className="auth-fineprint">
          By continuing you agree to the Informed Consent and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
