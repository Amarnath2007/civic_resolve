import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

function cleanEnv(val?: string): string {
  if (!val) return '';
  let cleaned = val.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

// Free Spark Plan: Cloud Firestore and Firebase Authentication only.
// Firebase Storage dependencies have been completely removed.
const firebaseConfig = {
  apiKey: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) || 'demo-api-key',
  authDomain: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) || 'demo-project.firebaseapp.com',
  projectId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || 'demo-project',
  messagingSenderId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || '1234567890',
  appId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID) || '1:1234567890:web:abcdef',
};

export const isFirebaseClientConfigured = Boolean(
  cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) &&
  cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
  cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) !== 'demo-api-key'
);

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (getApps().length > 0) {
  app = getApp();
} else {
  app = initializeApp(firebaseConfig);
}

auth = getAuth(app);
db = getFirestore(app);

export { app, auth, db };
