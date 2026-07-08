/**
 * Thin API client for the DevScore backend. Attaches the session token
 * (FR 7) and normalises error handling.
 */
const TOKEN_KEY = 'devscore_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request(path, options = {}) {
  const token = tokenStore.get();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
