import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (privateKey) {
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');
}

const apps = getApps();
const app = apps.length ? apps[0] : initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
});

const auth = getAuth(app);

const demoAccounts = [
  {
    email: 'citizen@civicresolve.org',
    password: 'CivicResolve2026!',
    displayName: 'Priya Raman',
  },
  {
    email: 'admin@civicresolve.gov',
    password: 'CivicResolve2026!',
    displayName: 'Municipal Operations Desk',
  },
];

for (const acc of demoAccounts) {
  try {
    const existing = await auth.getUserByEmail(acc.email);
    console.log(`User ${acc.email} already exists with UID: ${existing.uid}`);
    // Update password to ensure it matches
    await auth.updateUser(existing.uid, {
      password: acc.password,
      displayName: acc.displayName,
    });
    console.log(`Updated user ${acc.email} credentials.`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      const created = await auth.createUser({
        email: acc.email,
        password: acc.password,
        displayName: acc.displayName,
        emailVerified: true,
      });
      console.log(`Created user ${acc.email} with UID: ${created.uid}`);
    } else {
      console.error(`Error with ${acc.email}:`, err.message);
    }
  }
}

console.log('Finished checking/creating demo users.');
