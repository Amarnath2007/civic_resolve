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
import { getFirebaseErrorMessage } from '@/lib/auth/errors';

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
    role?: 'citizen' | 'admin';
  } | null;
  firebaseUser: User | null;
  idToken: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string; isAdmin?: boolean }>;
  register: (email: string, pass: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loginDemo: (role: 'citizen' | 'admin') => Promise<{ success: boolean; error?: string; isAdmin?: boolean }>;
  isFirebaseActive: boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch server-verified profile
  const fetchServerProfile = async (token: string, fallbackUser?: { uid: string; email: string; displayName?: string }) => {
    try {
      const res = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          return {
            uid: data.profile.uid,
            email: data.profile.email,
            displayName: data.profile.displayName,
            isAdmin: Boolean(data.profile.isAdmin),
            role: data.profile.role as 'citizen' | 'admin',
          };
        }
      }
    } catch (err) {
      console.warn('Could not fetch server profile, using token fallback:', err);
    }

    if (fallbackUser) {
      const email = fallbackUser.email.toLowerCase().trim();
      const isAllowedAdmin = email === 'admin@civicresolve.gov';
      return {
        uid: fallbackUser.uid,
        email: fallbackUser.email,
        displayName: fallbackUser.displayName || email.split('@')[0],
        isAdmin: isAllowedAdmin,
        role: (isAllowedAdmin ? 'admin' : 'citizen') as 'citizen' | 'admin',
      };
    }
    return null;
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
            const profile = await fetchServerProfile(token, {
              uid: fUser.uid,
              email: fUser.email,
              displayName: fUser.displayName || undefined,
            });
            setUser(profile);
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

  const refreshSession = async () => {
    if (!auth.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken(true);
      setIdToken(token);
      const profile = await fetchServerProfile(token, {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email || '',
        displayName: auth.currentUser.displayName || undefined,
      });
      setUser(profile);
    } catch (err) {
      console.error('Failed to refresh session:', err);
    }
  };

  const login = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string; isAdmin?: boolean }> => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }
    if (!pass) {
      return { success: false, error: 'Please enter your password.' };
    }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const token = await cred.user.getIdToken(true);
      setFirebaseUser(cred.user);
      setIdToken(token);

      const profile = await fetchServerProfile(token, {
        uid: cred.user.uid,
        email: cred.user.email || cleanEmail,
        displayName: cred.user.displayName || undefined,
      });

      setUser(profile);
      setLoading(false);
      return { success: true, isAdmin: profile?.isAdmin };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: getFirebaseErrorMessage(err) };
    }
  };

  const register = async (
    email: string,
    pass: string,
    name?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim();
    const cleanName = (name || '').trim();

    if (!cleanName) {
      return { success: false, error: 'Please enter your full name.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!pass || pass.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    setLoading(true);
    let createdUser: User | null = null;

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      createdUser = cred.user;

      // 1. Set display name in Firebase Auth
      await updateProfile(cred.user, { displayName: cleanName });

      // 2. Obtain token to authorize profile creation
      const token = await cred.user.getIdToken(true);

      // 3. Create user profile in Firestore via secure server endpoint
      const profileRes = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ displayName: cleanName }),
      });

      if (!profileRes.ok) {
        // Rollback Firebase user to avoid orphaned or inconsistent accounts
        try {
          await cred.user.delete();
        } catch {
          // ignore rollback failure
        }
        setLoading(false);
        return {
          success: false,
          error: 'Failed to initialize citizen profile. Please try again.',
        };
      }

      const profileData = await profileRes.json();
      const freshToken = await cred.user.getIdToken(true);

      setFirebaseUser(cred.user);
      setIdToken(freshToken);
      setUser({
        uid: cred.user.uid,
        email: cred.user.email || cleanEmail,
        displayName: cleanName,
        isAdmin: false,
        role: 'citizen',
      });

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      // If profile initialization failed after auth creation, ensure cleanup
      if (createdUser) {
        try {
          await createdUser.delete();
        } catch {
          // ignore
        }
      }
      setLoading(false);
      return { success: false, error: getFirebaseErrorMessage(err) };
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
  const loginDemo = async (
    role: 'citizen' | 'admin'
  ): Promise<{ success: boolean; error?: string; isAdmin?: boolean }> => {
    setLoading(true);
    const account = DEMO_ACCOUNTS[role];

    try {
      let cred;
      try {
        cred = await signInWithEmailAndPassword(auth, account.email, account.password);
      } catch (authErr: any) {
        // If user does not exist in Firebase yet, auto-provision via backend endpoint and retry
        if (
          authErr?.code === 'auth/user-not-found' ||
          authErr?.code === 'auth/invalid-credential'
        ) {
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

        const profile = await fetchServerProfile(token, {
          uid: cred.user.uid,
          email: cred.user.email || account.email,
          displayName: cred.user.displayName || account.displayName,
        });

        setUser(profile);
        setLoading(false);
        return { success: true, isAdmin: profile?.isAdmin };
      }

      setLoading(false);
      return { success: false, error: 'Could not obtain user credentials.' };
    } catch (err: any) {
      console.error('Demo authentication error:', err);
      setLoading(false);
      return {
        success: false,
        error: getFirebaseErrorMessage(err),
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
        refreshSession,
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
