'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, isFirebaseClientConfigured } from '@/lib/firebase/client';

export const DEMO_ACCOUNTS = {
  citizen: {
    email: 'citizen@civicresolve.org',
    password: 'CivicResolve2026!',
    displayName: 'Priya Raman',
  },
  admin: {
    email: 'admin@civicresolve.gov',
    password: 'CivicResolve2026!',
    displayName: 'Municipal Operations Desk',
  },
} as const;

export interface AuthContextType {
  user: {
    uid: string;
    email: string;
    displayName: string;
    isAdmin: boolean;
  } | null;
  firebaseUser: User | null;
  idToken: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, pass: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loginDemo: (role: 'citizen' | 'admin') => Promise<{ success: boolean; error?: string }>;
  isFirebaseActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to determine administrator permissions
  const checkIsAdmin = (email?: string | null): boolean => {
    if (!email) return false;
    const lower = email.toLowerCase().trim();
    return lower === 'admin@civicresolve.gov' || lower.includes('admin') || lower.endsWith('.gov');
  };

  // Real Firebase Authentication State Listener
  useEffect(() => {
    if (!isFirebaseClientConfigured) {
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
        setFirebaseUser(fUser);
        if (fUser && fUser.email) {
          try {
            const token = await fUser.getIdToken();
            setIdToken(token);
            setUser({
              uid: fUser.uid,
              email: fUser.email,
              displayName: fUser.displayName || fUser.email.split('@')[0],
              isAdmin: checkIsAdmin(fUser.email),
            });
          } catch (tokenErr) {
            console.error('Failed to retrieve Firebase ID token:', tokenErr);
            setUser(null);
            setIdToken(null);
          }
        } else {
          setUser(null);
          setIdToken(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Firebase Auth listener error:', err);
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const token = await cred.user.getIdToken(true);
      setFirebaseUser(cred.user);
      setIdToken(token);
      setUser({
        uid: cred.user.uid,
        email: cred.user.email || email.trim(),
        displayName: cred.user.displayName || email.split('@')[0],
        isAdmin: checkIsAdmin(cred.user.email),
      });
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || 'Failed to sign in.' };
    }
  };

  const register = async (email: string, pass: string, name?: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (name && cred.user) {
        try {
          await updateProfile(cred.user, { displayName: name.trim() });
        } catch {
          // ignore profile update failure
        }
      }
      const token = await cred.user.getIdToken(true);
      setFirebaseUser(cred.user);
      setIdToken(token);
      setUser({
        uid: cred.user.uid,
        email: cred.user.email || email.trim(),
        displayName: name?.trim() || cred.user.displayName || email.split('@')[0],
        isAdmin: checkIsAdmin(cred.user.email),
      });
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || 'Failed to create account.' };
    }
  };

  const logout = async () => {
    setUser(null);
    setIdToken(null);
    setFirebaseUser(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  };

  /**
   * Genuine Firebase Authentication for Demo Accounts:
   * Uses real Firebase user credentials so the frontend obtains authentic Firebase ID tokens.
   */
  const loginDemo = async (role: 'citizen' | 'admin'): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const account = DEMO_ACCOUNTS[role];

    try {
      // First attempt genuine client sign-in
      let cred;
      try {
        cred = await signInWithEmailAndPassword(auth, account.email, account.password);
      } catch (authErr: any) {
        // If user does not exist in Firebase yet, auto-provision via backend endpoint and retry
        if (authErr?.code === 'auth/user-not-found' || authErr?.code === 'auth/invalid-credential') {
          await fetch('/api/auth/provision-demo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role }),
          });
          cred = await signInWithEmailAndPassword(auth, account.email, account.password);
        } else {
          throw authErr;
        }
      }

      if (cred && cred.user) {
        const token = await cred.user.getIdToken(true);
        setFirebaseUser(cred.user);
        setIdToken(token);
        setUser({
          uid: cred.user.uid,
          email: cred.user.email || account.email,
          displayName: cred.user.displayName || account.displayName,
          isAdmin: checkIsAdmin(cred.user.email),
        });
      }
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('Demo authentication error:', err);
      setLoading(false);
      return {
        success: false,
        error: err.message || 'Could not authenticate demo account with Firebase.',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        idToken,
        loading,
        login,
        register,
        logout,
        loginDemo,
        isFirebaseActive: isFirebaseClientConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
