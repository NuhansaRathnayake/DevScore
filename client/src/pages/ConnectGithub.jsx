import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { InlineLoader } from '../components/Spinner.jsx';
import { githubApi, jobsApi } from '../lib/api.js';

const ERROR_MESSAGES = {
  github_permission_denied: 'GitHub connection was cancelled — permission was not granted.',
  github_invalid_callback: 'GitHub did not return the expected authorization code.',
  github_invalid_state: 'That connection request expired or is invalid. Please try again.',
  github_token_exchange_failed: 'GitHub rejected the connection request. Please try again.',
  github_profile_fetch_failed: 'Could not read your GitHub profile. Please try again.',
  github_connection_failed: 'Something went wrong connecting your GitHub account.',
  select_role_first: 'Select a job role before connecting GitHub.',
};

/**
 * Connect GitHub Account screen (FR 9/10, use case "Connect GitHub Account").
 * Kicks off the GitHub OAuth flow and reports the resulting connection state.
 */
export default function ConnectGithub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  // Optimistic until we know otherwise, so an unrelated fetch failure (e.g.
  // job_applications not migrated yet) never flashes a false "locked" state.
  const [roleApplied, setRoleApplied] = useState(true);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const callbackError = searchParams.get('error');
  const justConnected = searchParams.get('connected') === '1';

  useEffect(() => {
    (async () => {
      const [s, a] = await Promise.allSettled([githubApi.status(), jobsApi.listApplied()]);
      if (s.status === 'fulfilled') setStatus(s.value);
      if (a.status === 'fulfilled') setRoleApplied(a.value.applications.length > 0);
      setLoading(false);
      if (callbackError || justConnected) {
        searchParams.delete('error');
        searchParams.delete('connected');
        setSearchParams(searchParams, { replace: true });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    })();
  }, []);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await githubApi.disconnect();
      setStatus(await githubApi.status());
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <DashboardLayout>
      <h1 className="page-title">Connect GitHub Account</h1>
      <p className="page-subtitle">
        Link your GitHub profile so recruiters can verify your resume claims
        against your real coding activity.
      </p>

      {callbackError && (
        <div className="alert alert--error" style={{ marginBottom: 16 }}>
          {ERROR_MESSAGES[callbackError] || 'Could not connect your GitHub account.'}
        </div>
      )}
      {justConnected && !callbackError && (
        <div className="alert alert--success" style={{ marginBottom: 16 }}>
          GitHub account linked successfully.
        </div>
      )}

      <div className="card" style={{ maxWidth: 480 }}>
        {loading ? (
          <InlineLoader label="Checking connection status…" />
        ) : status?.connected ? (
          <>
            <p>
              <strong>Connected as</strong> @{status.username}
            </p>
            <p className="muted">
              Linked{' '}
              {status.connectedAt
                ? new Date(status.connectedAt).toLocaleDateString()
                : ''}
            </p>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect GitHub'}
            </button>
          </>
        ) : !roleApplied ? (
          <>
            <p className="muted">
              Select a job role first — your GitHub evidence is reviewed against
              the roles you&rsquo;ve applied for.
            </p>
            <Link to="/student/jobs" className="btn-primary">
              Browse Job Roles
            </Link>
          </>
        ) : (
          <>
            <p className="muted">
              We only request read access to your public repositories — we
              never modify or delete your code.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={githubApi.startConnect}
            >
              Connect GitHub Account
            </button>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
