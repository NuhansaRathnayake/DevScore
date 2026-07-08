import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../lib/api.js';

const AuthContext = createContext(null);

/** Landing route for each role (FR 8 / FR 18 — role-appropriate dashboard). */
export const ROLE_HOME = {
  student: '/student',
  recruiter: '/recruiter',
  admin: '/admin',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authed | guest

  /** Loads the profile over the session cookie. Returns the user, or null. */
  const loadUser = useCallback(async () => {
    try {
      const { user: me } = await authApi.me();
      setUser(me);
      setStatus('authed');
      return me;
    } catch {
      setUser(null);
      setStatus('guest');
      return null;
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* revoke best-effort */
    }
    setUser(null);
    setStatus('guest');
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, loadUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
