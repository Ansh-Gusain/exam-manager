import { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, clearToken, getStoredUser, setStoredUser } from './api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
    setLoading(false);
  }, []);

  const signInWithCredentials = async (identifier, password) => {
    const data = await api.auth.login(identifier, password);
    setToken(data.token);
    setStoredUser(data.user);
    setUser(data.user);
    return data.user;
  };

  const signUpWithCredentials = async (name, email, password, role) => {
    const data = await api.auth.signup(name, email, password, role);
    setToken(data.token);
    setStoredUser(data.user);
    setUser(data.user);
    return data.user;
  };

  const signInWithGoogle = async (credential) => {
    const data = await api.auth.googleAuth(credential);
    setToken(data.token);
    setStoredUser(data.user);
    setUser(data.user);
    return data.user;
  };

  const signOut = async () => {
    try { await api.auth.logout(); } catch { /* ignore */ }
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, signInWithCredentials, signUpWithCredentials, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
