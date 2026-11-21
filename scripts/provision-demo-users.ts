import * as fs from 'fs';
import * as path from 'path';

// Safely load environment variables for standalone execution
if (fs.existsSync(path.resolve('.env'))) {
  const envContent = fs.readFileSync(path.resolve('.env'), 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

import { getFirebaseAdmin } from '../src/lib/firebase/admin';

export async function provisionDemoUsers() {
  console.log('=== CIVICRESOLVE DEMO USERS PROVISIONING ===');

  const { auth, firestore, isConfigured } = getFirebaseAdmin();
  if (!isConfigured || !auth || !firestore) {
    throw new Error('Firebase Admin SDK is not properly configured. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.');
  }

  const citizenEmail = process.env.DEMO_CITIZEN_EMAIL || 'citizen@civicresolve.org';
  const citizenPassword = process.env.DEMO_CITIZEN_PASSWORD || 'CivicResolve2026!';
  const citizenName = 'Priya Raman';

  const adminEmail = process.env.DEMO_ADMIN_EMAIL || 'admin@civicresolve.gov';
  const adminPassword = process.env.DEMO_ADMIN_PASSWORD || 'CivicResolve2026!';
  const adminName = 'Municipal Operations Desk';

  // 1. Provision / Update Citizen Account
  let citizenUid: string;
  try {
    const existingCitizen = await auth.getUserByEmail(citizenEmail);
    citizenUid = existingCitizen.uid;
    console.log(`[Citizen Account]: Found existing user (${citizenEmail}, UID: ${citizenUid})`);
    // Ensure display name is set
    await auth.updateUser(citizenUid, {
      displayName: citizenName,
      password: citizenPassword,
    });
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      const newCitizen = await auth.createUser({
        email: citizenEmail,
        password: citizenPassword,
        displayName: citizenName,
        emailVerified: true,
      });
      citizenUid = newCitizen.uid;
      console.log(`[Citizen Account]: Created new user (${citizenEmail}, UID: ${citizenUid})`);
    } else {
      throw err;
    }
  }

  // Set Citizen Custom Claims
  await auth.setCustomUserClaims(citizenUid, {
    role: 'citizen',
    admin: false,
  });
  console.log(`[Citizen Account]: Assigned custom claims { role: 'citizen', admin: false }`);

  // Create/Update Citizen Firestore Profile
  await firestore.collection('users').doc(citizenUid).set({
    uid: citizenUid,
    email: citizenEmail,
    displayName: citizenName,
    role: 'citizen',
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  console.log(`[Citizen Account]: Synchronized Firestore user profile doc (/users/${citizenUid})`);

  // 2. Provision / Update Admin Account
  let adminUid: string;
  try {
    const existingAdmin = await auth.getUserByEmail(adminEmail);
    adminUid = existingAdmin.uid;
    console.log(`[Admin Account]: Found existing user (${adminEmail}, UID: ${adminUid})`);
    await auth.updateUser(adminUid, {
      displayName: adminName,
      password: adminPassword,
    });
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      const newAdmin = await auth.createUser({
        email: adminEmail,
        password: adminPassword,
        displayName: adminName,
        emailVerified: true,
      });
      adminUid = newAdmin.uid;
      console.log(`[Admin Account]: Created new user (${adminEmail}, UID: ${adminUid})`);
    } else {
      throw err;
    }
  }

  // Set Admin Custom Claims
  await auth.setCustomUserClaims(adminUid, {
    role: 'admin',
    admin: true,
  });
  console.log(`[Admin Account]: Assigned custom claims { role: 'admin', admin: true }`);

  // Create/Update Admin Firestore Profile
  await firestore.collection('users').doc(adminUid).set({
    uid: adminUid,
    email: adminEmail,
    displayName: adminName,
    role: 'admin',
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  console.log(`[Admin Account]: Synchronized Firestore user profile doc (/users/${adminUid})`);

  console.log('=== PROVISIONING COMPLETED SUCCESSFULLY ===\n');
  return { citizenUid, adminUid };
}

// Execute directly if run as CLI script
if (require.main === module || process.argv[1]?.includes('provision-demo-users')) {
  provisionDemoUsers().catch((err) => {
    console.error('Provisioning failed:', err.message);
    process.exit(1);
  });
}
