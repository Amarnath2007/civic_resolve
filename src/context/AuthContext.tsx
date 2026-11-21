'use client';

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, isFirebaseClientConfigured } from '@/lib/firebase/client';

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
  loginDemo: (role: 'citizen' | 'admin') => void;
  isFirebaseActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to determine admin status
  const checkIsAdmin = (email?: string | null) => {
    if (!email) return false;
    const lower = email.toLowerCase();
    return lower.includes('admin') || lower.endsWith('.gov');
  };

  useEffect(() => {
    // Check local storage for persistent demo session
    const savedDemoUser = localStorage.getItem('civicresolve_demo_user');
    if (savedDemoUser) {
      try {
        const parsed = JSON.parse(savedDemoUser);
        setUser(parsed);
        setIdToken(`demo-token:${encodeURIComponent(parsed.email)}:${parsed.uid}`);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('civicresolve_demo_user');
      }
    }

    if (!isFirebaseClientConfigured) {
      // Default initial state: Demo Citizen pre-loaded for frictionless testing
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
        setFirebaseUser(fUser);
        if (fUser && fUser.email) {
          const token = await fUser.getIdToken();
          setIdToken(token);
          setUser({
            uid: fUser.uid,
            email: fUser.email,
            displayName: fUser.displayName || fUser.email.split('@')[0],
            isAdmin: checkIsAdmin(fUser.email),
          });
        } else {
          setUser(null);
          setIdToken(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    if (!isFirebaseClientConfigured) {
      // Offline Demo Mode authentication
      const isAdmin = checkIsAdmin(email);
      const demoUser = {
        uid: `demo-${email.split('@')[0]}`,
        email,
        displayName: email.split('@')[0],
        isAdmin,
      };
      setUser(demoUser);
      const token = `demo-token:${encodeURIComponent(email)}:${demoUser.uid}`;
      setIdToken(token);
      localStorage.setItem('civicresolve_demo_user', JSON.stringify(demoUser));
      return { success: true };
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const token = await cred.user.getIdToken();
      setIdToken(token);
      setUser({
        uid: cred.user.uid,
        email: cred.user.email || email,
        displayName: cred.user.displayName || email.split('@')[0],
        isAdmin: checkIsAdmin(cred.user.email),
      });
      localStorage.removeItem('civicresolve_demo_user');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to sign in.' };
    }
  };

  const register = async (email: string, pass: string, name?: string) => {
    if (!isFirebaseClientConfigured) {
      const isAdmin = checkIsAdmin(email);
      const demoUser = {
        uid: `demo-${Date.now()}`,
        email,
        displayName: name || email.split('@')[0],
        isAdmin,
      };
      setUser(demoUser);
      const token = `demo-token:${encodeURIComponent(email)}:${demoUser.uid}`;
      setIdToken(token);
      localStorage.setItem('civicresolve_demo_user', JSON.stringify(demoUser));
      return { success: true };
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const token = await cred.user.getIdToken();
      setIdToken(token);
      setUser({
        uid: cred.user.uid,
        email: cred.user.email || email,
        displayName: name || email.split('@')[0],
        isAdmin: checkIsAdmin(cred.user.email),
      });
      localStorage.removeItem('civicresolve_demo_user');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create account.' };
    }
  };

  const logout = async () => {
    localStorage.removeItem('civicresolve_demo_user');
    setUser(null);
    setIdToken(null);
    if (isFirebaseClientConfigured) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('Sign out error:', err);
      }
    }
  };

  const loginDemo = (role: 'citizen' | 'admin') => {
    const isAdm = role === 'admin';
    const email = isAdm ? 'admin@civicresolve.gov' : 'citizen@civicresolve.org';
    const demoUser = {
      uid: isAdm ? 'demo-admin-master' : 'demo-citizen-1',
      email,
      displayName: isAdm ? 'Municipal Operations Desk' : 'Priya Raman',
      isAdmin: isAdm,
    };
    setUser(demoUser);
    const token = `demo-token:${encodeURIComponent(email)}:${demoUser.uid}`;
    setIdToken(token);
    localStorage.setItem('civicresolve_demo_user', JSON.stringify(demoUser));
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
