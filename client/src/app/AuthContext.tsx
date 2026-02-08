import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { app as firebaseApp } from '../utils/firebase';
import { api } from '../api/client';

export type Role = 'OWNER' | 'EMPLOYEE' | 'WHOLESALER';

export interface AppUser {
  id: string;
  email: string;
  displayName?: string;
  role: Role;
  wholesalerId?: string;
}

export interface AuthError {
  code: string;
  message: string;
}

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  appUser: AppUser | null;
  loading: boolean;
  authError: AuthError | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAppUser: () => Promise<AppUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<AuthError | null>(null);

  const parseAuthError = (err: unknown): AuthError | null => {
    const error = err as { response?: { data?: { error?: { code?: string; message?: string } } } };
    const code = error?.response?.data?.error?.code;
    const message = error?.response?.data?.error?.message;
    if (code && message) return { code, message };
    return null;
  };

  const refreshAppUser = useCallback(async (): Promise<AppUser | null> => {
    const auth = getAuth(firebaseApp);
    const user = auth.currentUser;
    if (!user) {
      setAppUser(null);
      setAuthError(null);
      return null;
    }
    try {
      const token = await user.getIdToken();
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const res = await api.get<{ success: boolean; data: AppUser }>('/me');
      if (res.data.success && res.data.data) {
        setAppUser(res.data.data);
        setAuthError(null);
        return res.data.data;
      }
      setAppUser(null);
      return null;
    } catch (err) {
      setAppUser(null);
      setAuthError(parseAuthError(err));
      return null;
      }
  }, []);

  useEffect(() => {
    const auth = getAuth(firebaseApp);
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setAppUser(null);
        setAuthError(null);
        setLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await api.get<{ success: boolean; data: AppUser }>('/me');
        if (res.data.success && res.data.data) {
          setAppUser(res.data.data);
          setAuthError(null);
        } else {
          setAppUser(null);
        }
      } catch (err) {
        setAppUser(null);
        setAuthError(parseAuthError(err));
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signOut = useCallback(async () => {
    const auth = getAuth(firebaseApp);
    await firebaseSignOut(auth);
    setAppUser(null);
    setAuthError(null);
    delete api.defaults.headers.common['Authorization'];
  }, []);

  useEffect(() => {
    const handler = () => {
      signOut();
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [signOut]);

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getAuth(firebaseApp);
    await signInWithEmailAndPassword(auth, email, password);
    const user = await refreshAppUser();
    if (!user) {
      throw new Error('Your account is authenticated but not registered in the system. Contact the Owner/Admin.');
    }
  }, [refreshAppUser]);

  const value: AuthContextValue = {
    firebaseUser,
    appUser,
    loading,
    authError,
    signIn,
    signOut,
    refreshAppUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
