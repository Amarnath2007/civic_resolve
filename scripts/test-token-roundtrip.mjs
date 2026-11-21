import { initializeApp, getApps } from 'firebase/app';
import { getAuth as getClientAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp as initAdmin, cert, getApps as getAdminApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const clientApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const clientAuth = getClientAuth(clientApp);

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey) {
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
  privateKey = privateKey.replace(/\\n/g, '\n');
}

const adminApp = getAdminApps().length ? getAdminApps()[0] : initAdmin({
  credential: cert({ projectId, clientEmail, privateKey }),
});
const adminAuth = getAdminAuth(adminApp);

// 1. Sign in citizen
const cred = await signInWithEmailAndPassword(clientAuth, 'citizen@civicresolve.org', 'CivicResolve2026!');
const token = await cred.user.getIdToken();

// 2. Verify with Admin
const decoded = await adminAuth.verifyIdToken(token);
console.log('Verified citizen token successfully!');
console.log('Decoded UID:', decoded.uid);
console.log('Decoded email:', decoded.email);

// 3. Sign in admin
const adminCred = await signInWithEmailAndPassword(clientAuth, 'admin@civicresolve.gov', 'CivicResolve2026!');
const adminToken = await adminCred.user.getIdToken();
const decodedAdmin = await adminAuth.verifyIdToken(adminToken);
console.log('Verified admin token successfully!');
console.log('Decoded Admin UID:', decodedAdmin.uid);
console.log('Decoded Admin email:', decodedAdmin.email);
