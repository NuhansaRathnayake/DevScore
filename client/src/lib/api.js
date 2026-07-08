/**
 * Thin API client for the DevScore backend. The session travels only as an
 * httpOnly cookie (SDS §4.7.2) — never store the session token in JS-readable
 * storage. `credentials: 'include'` is what actually authenticates requests.
 */
async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      /* non-JSON error */
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return res.status === 204 ? null : res.json();
}

export const authApi = {
  /** Full-page redirect that begins the Google OAuth flow (FR 1/2). */
  startGoogleLogin: () => {
    window.location.href = '/api/auth/google';
  },
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
};

export const githubApi = {
  /** Full-page redirect that begins the GitHub OAuth connect flow (FR 9/10). */
  startConnect: () => {
    window.location.href = '/api/auth/github/connect';
  },
  status: () => request('/auth/github/status'),
  disconnect: () => request('/auth/github/disconnect', { method: 'POST' }),
};
