import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, tokenStore } from '../lib/api.js';

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

  const loadUser = useCallback(async () => {
    if (!tokenStore.get()) {
      setStatus('guest');
      return;
    }
    try {
      const { user: me } = await authApi.me();
      setUser(me);
      setStatus('authed');
    } catch {
      tokenStore.clear();
      setUser(null);
      setStatus('guest');
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
    tokenStore.clear();
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
