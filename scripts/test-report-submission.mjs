import { readFileSync } from 'fs';
import { resolve } from 'path';

// Parse .env directly to get FIREBASE_API_KEY
const envText = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
const env = {};
for (const line of envText.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq > 0) {
    const k = trimmed.substring(0, eq).trim();
    let v = trimmed.substring(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
}

const API_KEY = env.NEXT_PUBLIC_FIREBASE_API_KEY || env.FIREBASE_API_KEY;
if (!API_KEY) {
  console.error('FIREBASE_API_KEY missing in .env');
  process.exit(1);
}

// 1x1 transparent PNG as base64 test image
const SAMPLE_BASE64_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function getFirebaseIdToken(email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Firebase Auth failed: ${data.error?.message || JSON.stringify(data)}`);
  }
  return data.idToken;
}

async function runTests() {
  console.log('--- Testing 1: Anonymous text-only complaint submission ---');
  const textOnlyRes = await fetch('http://localhost:3000/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Water pipe leak near central junction',
      description: 'Drinking water pipeline ruptured and water is flooding the street for two days.',
      category: 'Water Supply & Drainage',
      locality: 'Gandhipuram',
      streetOrLandmark: '7th Cross Cut Road',
      sharePublicly: true,
    }),
  });

  const textOnlyData = await textOnlyRes.json();
  console.log('Text-only status:', textOnlyRes.status);
  if (!textOnlyRes.ok) {
    console.error('Text-only submission failed:', textOnlyData);
    process.exit(1);
  }
  console.log('Text-only tracking code:', textOnlyData.report?.trackingCode);
  console.log('Text-only department:', textOnlyData.report?.finalDepartment);
  console.log('Text-only priority:', textOnlyData.report?.finalPriority);

  console.log('\n--- Testing 2: Unauthenticated complaint WITH image (Must be rejected with 401) ---');
  const rejectedRes = await fetch('http://localhost:3000/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Unauthenticated image submission attempt',
      description: 'Attempting to attach a photo without citizen auth header.',
      locality: 'RS Puram',
      imageBase64: SAMPLE_BASE64_PNG,
      imageMimeType: 'image/png',
    }),
  });
  const rejectedData = await rejectedRes.json();
  console.log('Rejected status:', rejectedRes.status);
  console.log('Rejected message:', rejectedData.error);
  if (rejectedRes.status !== 401) {
    console.error('Expected 401 status for unauthenticated photo upload!');
    process.exit(1);
  }

  console.log('\n--- Testing 3: Authenticated Citizen complaint WITH image (Must succeed end-to-end) ---');
  const citizenToken = await getFirebaseIdToken('citizen@civicresolve.org', 'CivicResolve2026!');
  console.log('Obtained real Firebase ID token for citizen (length:', citizenToken.length, ')');

  const photoRes = await fetch('http://localhost:3000/api/reports', {
    method: 'POST',
    signal: AbortSignal.timeout(60000),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${citizenToken}`,
    },
    body: JSON.stringify({
      title: 'Deep pothole causing traffic hazards on Avinashi Road',
      description: 'A massive 2-foot pothole has opened up near the bus stop, posing serious hazard to two-wheelers at night.',
      category: 'Roads & Footpaths',
      locality: 'Peelamedu',
      streetOrLandmark: 'Near PSG Tech main gate',
      sharePublicly: true,
      imageBase64: SAMPLE_BASE64_PNG,
      imageMimeType: 'image/png',
    }),
  });

  const photoData = await photoRes.json();
  console.log('Photo complaint status:', photoRes.status);
  if (!photoRes.ok) {
    console.error('Photo complaint submission failed:', photoData);
    process.exit(1);
  }

  const r = photoData.report;
  console.log('Photo complaint tracking code:', r.trackingCode);
  console.log('Reporter UID:', r.reporterUid);
  console.log('Reporter Email:', r.reporterEmail);
  console.log('Final Department:', r.finalDepartment);
  console.log('Final Priority:', r.finalPriority);
  console.log('AI Priority Score:', r.aiPriorityScore);
  console.log('AI Summary:', r.aiSummary);
  console.log('Image Metadata Public ID:', r.imageMetadata?.publicId);
  console.log('Signed Image URL:', r.imageUrl ? 'Available' : 'None');

  console.log('\nALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
