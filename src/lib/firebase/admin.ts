import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

// Free Spark Plan: Cloud Firestore and Firebase Authentication only.
// Firebase Storage dependencies have been completely removed.
let adminApp: App | null = null;
let isFirebaseAdminInitialized = false;

export function getFirebaseAdmin(): {
  isConfigured: boolean;
  firestore: Firestore | null;
  auth: Auth | null;
} {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    // Correctly handle escaped newlines when stored in environment variables
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  const hasCredentials = Boolean(projectId && clientEmail && privateKey);

  if (!hasCredentials) {
    return {
      isConfigured: false,
      firestore: null,
      auth: null,
    };
  }

  const apps = getApps();
  if (!apps.length) {
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      isFirebaseAdminInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      return {
        isConfigured: false,
        firestore: null,
        auth: null,
      };
    }
  } else {
    adminApp = apps[0];
  }

  const firestore = getFirestore(adminApp);
  try {
    firestore.settings({ ignoreUndefinedProperties: true });
  } catch {
    // Settings already applied
  }

  return {
    isConfigured: true,
    firestore,
    auth: getAuth(adminApp),
  };
}

export { isFirebaseAdminInitialized };
