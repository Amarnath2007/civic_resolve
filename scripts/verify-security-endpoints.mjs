import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

async function getFirebaseToken(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return await cred.user.getIdToken();
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      return await cred.user.getIdToken();
    }
    throw err;
  }
}

async function runSecurityAudit() {
  console.log('=== SECTION 5: SECURITY & AUTHORIZATION INVARIANT TESTING ===\n');

  console.log('Authenticating genuine Firebase accounts...');
  const citizenToken = await getFirebaseToken('citizen@civicresolve.org', 'CivicResolve2026!');
  const adminToken = await getFirebaseToken('admin@civicresolve.gov', 'CivicResolve2026!');
  const otherCitizenEmail = `other_citizen_${Date.now()}@civicresolve.org`;
  const otherCitizenToken = await getFirebaseToken(otherCitizenEmail, 'CivicResolve2026!');
  console.log('Genuine Firebase tokens acquired.\n');

  const results = {};

  // 1. Citizen attempting to access Admin Stats endpoint (/api/admin/stats)
  console.log('1. Testing: Unauthorized /api/admin/stats access...');
  const resNoToken = await fetch(`${BASE_URL}/api/admin/stats`);
  console.log(`   -> Without auth header: HTTP ${resNoToken.status} (Expected: 401)`);
  results.adminStatsNoAuth = resNoToken.status === 401;

  const resCitizen = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${citizenToken}` },
  });
  console.log(`   -> With genuine citizen token: HTTP ${resCitizen.status} (Expected: 403 Forbidden)`);
  results.adminStatsCitizenForbidden = resCitizen.status === 403;

  const resAdmin = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`   -> With genuine admin token: HTTP ${resAdmin.status} (Expected: 200 OK)`);
  results.adminStatsAuthorized = resAdmin.status === 200;

  // 2. Citizen attempting to update a complaint via PATCH (/api/reports/[id])
  console.log('\n2. Testing: Unauthorized PATCH /api/reports/[id] status modification...');
  const resPatch = await fetch(`${BASE_URL}/api/reports/cr-rep-001`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${citizenToken}`,
    },
    body: JSON.stringify({ status: 'Resolved' }),
  });
  console.log(`   -> Citizen PATCH attempt: HTTP ${resPatch.status} (Expected: 403 Forbidden)`);
  results.unauthorizedStatusUpdateForbidden = resPatch.status === 403;

  // 3. Citizen attempting to reassign department
  console.log('\n3. Testing: Unauthorized department reassignment...');
  const resDept = await fetch(`${BASE_URL}/api/reports/cr-rep-001`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${citizenToken}`,
    },
    body: JSON.stringify({ finalDepartment: 'Sanitation & Solid Waste' }),
  });
  console.log(`   -> Citizen department reassign attempt: HTTP ${resDept.status} (Expected: 403 Forbidden)`);
  results.unauthorizedDeptReassignForbidden = resDept.status === 403;

  // 4. Cross-user private image access via /api/reports/[id]/image
  console.log('\n4. Testing: Cross-user private evidence image access (/api/reports/[id]/image)...');
  const resImgUnauth = await fetch(`${BASE_URL}/api/reports/cr-rep-001/image`);
  console.log(`   -> Unauthenticated image access: HTTP ${resImgUnauth.status} (Expected: 401)`);
  results.imageAccessUnauthenticated = resImgUnauth.status === 401;

  const resImgOtherCitizen = await fetch(`${BASE_URL}/api/reports/cr-rep-001/image`, {
    headers: { Authorization: `Bearer ${otherCitizenToken}` },
  });
  console.log(`   -> Non-owner citizen image access: HTTP ${resImgOtherCitizen.status} (Expected: 403 Forbidden)`);
  results.imageAccessOtherCitizenForbidden = resImgOtherCitizen.status === 403;

  // 5. Cross-user private complaint list access
  console.log('\n5. Testing: Cross-user complaint list access (GET /api/reports?reporterUid=victim)...');
  const resNoAuthList = await fetch(`${BASE_URL}/api/reports?reporterUid=victim-uid`);
  console.log(`   -> Unauthenticated reporterUid inspection: HTTP ${resNoAuthList.status} (Expected: 401)`);
  results.crossUserNoAuthBlocked = resNoAuthList.status === 401;

  const resCrossUserReports = await fetch(`${BASE_URL}/api/reports?reporterUid=victim-uid`, {
    headers: { Authorization: `Bearer ${otherCitizenToken}` },
  });
  console.log(`   -> Other citizen reporterUid inspection: HTTP ${resCrossUserReports.status} (Expected: 403 Forbidden)`);
  results.crossUserReportListForbidden = resCrossUserReports.status === 403;

  // 6. Duplicate support votes
  console.log('\n6. Testing: Duplicate support vote prevention...');
  const vote1 = await fetch(`${BASE_URL}/api/reports/cr-rep-001/support`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${otherCitizenToken}` },
  });
  const data1 = await vote1.json();
  console.log(`   -> Vote 1 status: HTTP ${vote1.status}, success: ${data1.success}`);

  const vote2 = await fetch(`${BASE_URL}/api/reports/cr-rep-001/support`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${otherCitizenToken}` },
  });
  const data2 = await vote2.json();
  console.log(`   -> Vote 2 (Duplicate) status: HTTP ${vote2.status}, success: ${data2.success}, message: "${data2.message}"`);
  results.duplicateVotePrevented = data2.success === false && data2.message.includes('already supported');

  // 7. Invalid image formats
  console.log('\n7. Testing: Invalid image format rejection (.svg / executable fake mime)...');
  const resInvalidFormat = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${citizenToken}`,
    },
    body: JSON.stringify({
      title: 'Invalid format test complaint',
      description: 'Testing if backend rejects SVG or executable files pretending to be images.',
      locality: 'RS Puram',
      imageBase64: Buffer.from('<svg></svg>').toString('base64'),
      imageMimeType: 'image/svg+xml',
    }),
  });
  console.log(`   -> Invalid MIME type submission: HTTP ${resInvalidFormat.status} (Expected: 422 Unprocessable)`);
  results.invalidMimeRejected = resInvalidFormat.status === 422;

  // 8. Oversized image uploads (>5 MB)
  console.log('\n8. Testing: Oversized image payload rejection (>5 MB)...');
  const oversizedBuffer = Buffer.alloc(5.5 * 1024 * 1024, 'a');
  const resOversized = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${citizenToken}`,
    },
    body: JSON.stringify({
      title: 'Oversized file test complaint',
      description: 'Testing if backend rejects 5.5MB payload exceeding 5MB limit.',
      locality: 'RS Puram',
      imageBase64: oversizedBuffer.toString('base64'),
      imageMimeType: 'image/jpeg',
    }),
  });
  console.log(`   -> Oversized upload submission: HTTP ${resOversized.status} (Expected: 422 Unprocessable)`);
  results.oversizedRejected = resOversized.status === 422;

  console.log('\n=== SECURITY INVARIANTS AUDIT SUMMARY ===');
  console.log(JSON.stringify(results, null, 2));

  const allPassed = Object.values(results).every(Boolean);
  console.log(`\nOVERALL SECURITY INVARIANTS: ${allPassed ? 'ALL PASS (100%)' : 'SOME FAILED'}`);
}

runSecurityAudit().catch(console.error);
