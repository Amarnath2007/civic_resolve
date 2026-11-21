import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

console.log('Testing client sign-in for citizen@civicresolve.org...');
try {
  const cred = await signInWithEmailAndPassword(auth, 'citizen@civicresolve.org', 'CivicResolve2026!');
  const token = await cred.user.getIdToken();
  console.log('Client sign-in SUCCESS!');
  console.log('User UID:', cred.user.uid);
  console.log('Token length:', token.length);
  console.log('Token starts with:', token.slice(0, 15));
} catch (e) {
  console.error('Client sign-in error:', e.message);
}
