import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { GoogleGenAI } from '@google/genai';
import { v2 as cloudinary } from 'cloudinary';

// Strictly verify integrations without leaking secret values
async function runVerification() {
  console.log('====================================================');
  console.log(' CivicResolve Integration Verification & Health Check');
  console.log('====================================================\n');

  const results = {
    envVars: { status: 'PENDING', details: [] },
    firebaseAuth: { status: 'PENDING', message: '' },
    firebaseAdmin: { status: 'PENDING', message: '' },
    firestore: { status: 'PENDING', message: '' },
    gemini: { status: 'PENDING', message: '' },
    cloudinary: { status: 'PENDING', message: '' },
  };

  // 1. Check required environment variables presence
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'GEMINI_API_KEY',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];

  const missingVars = [];
  for (const v of requiredVars) {
    const val = process.env[v];
    if (!val || val.trim() === '' || val.includes('YOUR_') || val.includes('demo-')) {
      missingVars.push(v);
    }
  }

  if (missingVars.length === 0) {
    results.envVars.status = 'PASS';
    console.log('[PASS] Environment Variables: All 10 required credentials are configured and non-empty.');
  } else {
    results.envVars.status = 'WARN';
    console.log(`[WARN] Environment Variables: Missing or placeholder values for: ${missingVars.join(', ')}`);
  }

  // 2. Firebase Admin & Auth Connectivity Check
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey) {
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Firebase Admin credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY).');
    }

    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    results.firebaseAdmin.status = 'Working';
    results.firebaseAdmin.message = `Initialized with project ID "${projectId}".`;
    console.log('[PASS] Firebase Admin SDK: Successfully initialized.');

    // Test Firebase Auth API
    const auth = getAuth(app);
    // Generating a custom token verifies the private key cryptographic signing ability
    const testToken = await auth.createCustomToken('health-check-probe');
    if (testToken && typeof testToken === 'string') {
      results.firebaseAuth.status = 'Working';
      results.firebaseAuth.message = 'Service account signature validated; custom auth token created.';
      console.log('[PASS] Firebase Authentication: Working (Service account authenticated and token minting operational).');
    } else {
      throw new Error('Failed to mint custom token from Firebase Auth.');
    }

    // 3. Cloud Firestore Connectivity Check
    const db = getFirestore(app);
    // Perform genuine connectivity check: fetch collection limit 1
    const snapshot = await db.collection('reports').limit(1).get();
    results.firestore.status = 'Working';
    results.firestore.message = `Connected successfully; query executed (${snapshot.size} documents found).`;
    console.log(`[PASS] Firestore: Working (Connected successfully; query returned ${snapshot.size} records).`);

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (results.firebaseAdmin.status !== 'Working') {
      results.firebaseAdmin.status = 'Failed';
      results.firebaseAdmin.message = errMsg;
      console.log(`[FAIL] Firebase Admin: ${errMsg}`);
    }
    if (results.firebaseAuth.status !== 'Working') {
      results.firebaseAuth.status = 'Failed';
      results.firebaseAuth.message = errMsg;
      console.log(`[FAIL] Firebase Authentication: ${errMsg}`);
    }
    if (results.firestore.status !== 'Working') {
      results.firestore.status = 'Failed';
      results.firestore.message = errMsg;
      console.log(`[FAIL] Firestore: ${errMsg}`);
    }
  }

  // 4. Gemini API Connectivity Check
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_')) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: [{ text: 'Respond with: "HEALTH_OK"' }],
      config: {
        temperature: 0.1,
      },
    });

    const reply = response.text?.trim() || '';
    if (reply.includes('HEALTH_OK') || reply.length > 0) {
      results.gemini.status = 'Working';
      results.gemini.message = `Model "${model}" operational. Response received.`;
      console.log(`[PASS] Gemini API: Working (Model: ${model}, response received successfully).`);
    } else {
      throw new Error('Empty response received from Gemini API.');
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    results.gemini.status = 'Failed';
    results.gemini.message = errMsg;
    console.log(`[FAIL] Gemini API: ${errMsg}`);
  }

  // 5. Cloudinary Connectivity Check
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Missing Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET).');
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    const pingResult = await cloudinary.api.ping();
    if (pingResult && pingResult.status === 'ok') {
      results.cloudinary.status = 'Working';
      results.cloudinary.message = `Ping successful on cloud "${cloudName}".`;
      console.log(`[PASS] Cloudinary: Working (Ping response: status ok on cloud "${cloudName}").`);
    } else {
      throw new Error(`Cloudinary ping returned unexpected status: ${JSON.stringify(pingResult)}`);
    }
  } catch (error) {
    const errMsg = error?.error?.message || (error instanceof Error ? error.message : String(error));
    results.cloudinary.status = 'Failed';
    results.cloudinary.message = errMsg;
    console.log(`[FAIL] Cloudinary: ${errMsg}`);
  }

  console.log('\n====================================================');
  console.log(' Verification Summary:');
  console.log(` - Firebase Authentication: ${results.firebaseAuth.status}`);
  console.log(` - Firebase Admin: ${results.firebaseAdmin.status}`);
  console.log(` - Firestore: ${results.firestore.status}`);
  console.log(` - Gemini API: ${results.gemini.status}`);
  console.log(` - Cloudinary: ${results.cloudinary.status}`);
  console.log('====================================================\n');

  return results;
}

runVerification().catch((err) => {
  console.error('Fatal verification runner error:', err.message);
  process.exit(1);
});
