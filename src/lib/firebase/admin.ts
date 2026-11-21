import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';

let adminApp: App | null = null;
let isFirebaseAdminInitialized = false;

export function getFirebaseAdmin(): {
  isConfigured: boolean;
  firestore: Firestore | null;
  storage: Storage | null;
  auth: Auth | null;
} {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Correctly handle escaped newlines when stored in environment variables
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  const hasCredentials = Boolean(projectId && clientEmail && privateKey);

  if (!hasCredentials) {
    return {
      isConfigured: false,
      firestore: null,
      storage: null,
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
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      isFirebaseAdminInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      return {
        isConfigured: false,
        firestore: null,
        storage: null,
        auth: null,
      };
    }
  } else {
    adminApp = apps[0];
  }

  return {
    isConfigured: true,
    firestore: getFirestore(adminApp),
    storage: getStorage(adminApp),
    auth: getAuth(adminApp),
  };
}

export { isFirebaseAdminInitialized };
