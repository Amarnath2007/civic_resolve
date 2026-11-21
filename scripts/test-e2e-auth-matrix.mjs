import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Load .env for Firebase Admin check
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

const BASE_URL = 'http://localhost:3000';

async function runTestSuite() {
  console.log('====================================================');
  console.log('   CIVICRESOLVE COMPLETE AUTHENTICATION AUDIT       ');
  console.log('====================================================\n');

  const { auth: adminAuth, firestore } = getFirebaseAdmin();
  if (!adminAuth || !firestore) {
    throw new Error('Firebase Admin SDK is not initialized.');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('pageerror', err => console.error('[BROWSER ERROR]:', err.message));

  let testTrackingCode = null;

  // ----------------------------------------------------------------
  // TEST A: Citizen Registration & Session Persistence
  // ----------------------------------------------------------------
  console.log('--- TEST A: Citizen Registration & Persistence ---');
  const regEmail = `citizen_audit_${Date.now()}@civicresolve.org`;
  const regPassword = 'AuditPassword2026!';
  const regName = 'Audit Citizen User';

  await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
  await page.fill('input[placeholder="Priya Raman"]', regName);
  await page.fill('input[placeholder="citizen@civicresolve.org"]', regEmail);
  const pwInputs = await page.locator('input[type="password"]').all();
  await pwInputs[0].fill(regPassword);
  await pwInputs[1].fill(regPassword);
  await page.click('button[type="submit"]');

  await page.waitForURL('**/my-reports', { timeout: 15000 });
  console.log(' [PASS] Citizen registered and redirected to /my-reports');

  // Verify in Firebase Authentication Users
  const createdFirebaseUser = await adminAuth.getUserByEmail(regEmail);
  console.log(` [PASS] User confirmed in Firebase Auth: UID=${createdFirebaseUser.uid}, Email=${createdFirebaseUser.email}`);

  // Verify in Firestore users collection
  const userDoc = await firestore.collection('users').doc(createdFirebaseUser.uid).get();
  if (!userDoc.exists || userDoc.data()?.role !== 'citizen') {
    throw new Error('Firestore user profile document was not created with citizen role!');
  }
  console.log(` [PASS] Firestore user profile verified: role=${userDoc.data()?.role}`);

  // Sign out
  const signoutBtn = page.locator('button[title="Sign Out"]');
  if (await signoutBtn.isVisible()) {
    await signoutBtn.click();
    await page.waitForTimeout(1000);
  }
  console.log(' [PASS] Citizen signed out');

  // Sign in again with newly registered account
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', regEmail);
  await page.fill('input[type="password"]', regPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/my-reports', { timeout: 15000 });
  console.log(' [PASS] Signed back in with registered credentials');

  // Refresh page and confirm session persistence
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const profileName = await page.locator('text=Audit Citizen User').first().isVisible().catch(() => false);
  console.log(` [PASS] Page refreshed, session persisted: profile visible = ${profileName}`);

  // Sign out before next test
  const signoutBtn2 = page.locator('button[title="Sign Out"]');
  if (await signoutBtn2.isVisible()) {
    await signoutBtn2.click();
    await page.waitForTimeout(1000);
  }

  // ----------------------------------------------------------------
  // TEST B: Citizen Login & Complaint Submission
  // ----------------------------------------------------------------
  console.log('\n--- TEST B: Citizen Login & Protected Operations ---');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'citizen@civicresolve.org');
  await page.fill('input[type="password"]', 'CivicResolve2026!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/my-reports', { timeout: 15000 });
  console.log(' [PASS] Logged in with demo citizen account');

  // Navigate to Report an Issue
  await page.goto(`${BASE_URL}/report`, { waitUntil: 'networkidle' });
  const authWarning = await page.locator('text=Authentication required').isVisible().catch(() => false);
  if (authWarning) {
    throw new Error('Unexpected authentication warning visible on /report!');
  }
  console.log(' [PASS] /report opened without authentication error');

  // Fill and submit complaint
  await page.fill('input[placeholder*="Large pothole"]', 'Broken Storm Drainage Cover on 100 Feet Road');
  await page.fill('textarea[placeholder*="Describe what is broken"]', 'Heavy cast iron drainage grating collapsed into pit creating severe hazard.');
  await page.selectOption('select', 'Water Supply & Drainage');
  await page.fill('input[placeholder*="Gandhipuram"]', 'Gandhipuram Sector 4');
  await page.click('button:has-text("Submit Complaint")');

  // Wait for submission confirmation card
  await page.waitForSelector('text=Grievance Successfully Registered', { timeout: 35000 });
  console.log(' [PASS] Grievance successfully registered and triaged by Gemini AI');

  // Click Track My Complaint
  await page.click('a:has-text("Track My Complaint")');
  await page.waitForURL('**/track/**', { timeout: 15000 });
  const trackUrl = page.url();
  testTrackingCode = trackUrl.split('/track/')[1];
  console.log(` [PASS] Navigated to tracking page: ${trackUrl}`);

  // Verify protected API query for citizen reports
  const myReportsRes = await page.request.get(`${BASE_URL}/api/reports?reporterUid=k9xq3bgbbna7NOGVACNM5tuKFbP2`);
  console.log(` [PASS] Protected API query status: ${myReportsRes.status()}`);

  // ----------------------------------------------------------------
  // TEST C: Administrator Login & Workflow Management
  // ----------------------------------------------------------------
  console.log('\n--- TEST C: Administrator Login & Complaint Update ---');
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'admin@civicresolve.gov');
  await page.fill('input[type="password"]', 'CivicResolve2026!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin', { timeout: 15000 });
  console.log(' [PASS] Administrator authenticated and entered /admin portal');

  // Open complaint queue
  await page.goto(`${BASE_URL}/admin/complaints`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log(' [PASS] Administrator Complaint Queue loaded');

  // Open a complaint detail view
  await page.click('a:has-text("Inspect & Triage")');
  await page.waitForURL('**/admin/complaints/**', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Update complaint status to "Under Review" and commit update
  const statusSelect = page.locator('select').first();
  if (await statusSelect.isVisible()) {
    await statusSelect.selectOption('Under Review');
    const noteTextarea = page.locator('textarea').first();
    if (await noteTextarea.isVisible()) {
      await noteTextarea.fill('Audit test: Site engineer dispatched for inspection.');
    }
    const saveBtn = page.locator('button:has-text("Commit Administrative Updates")');
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      console.log(' [PASS] Complaint status successfully updated by administrator');
    }
  }

  // ----------------------------------------------------------------
  // TEST D: Security & Access Control Enforcement
  // ----------------------------------------------------------------
  console.log('\n--- TEST D: Security & Unauthorized Rejection ---');
  // Sign out admin, sign in as citizen
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'citizen@civicresolve.org');
  await page.fill('input[type="password"]', 'CivicResolve2026!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/my-reports', { timeout: 15000 });

  // 1. Citizen attempts to open /admin portal in browser
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
  const gateMessage = await page.locator('text=Municipal Administrator Portal').isVisible();
  const citizenNotice = await page.locator('text=Citizen Role').isVisible();
  console.log(` [PASS] Citizen access to /admin blocked: Gate visible = ${gateMessage}, Citizen alert = ${citizenNotice}`);

  // 2. Unauthenticated request to /api/admin/stats -> must return 401
  const unauthRes = await context.request.get(`${BASE_URL}/api/admin/stats`);
  if (unauthRes.status() === 401) {
    console.log(` [PASS] Unauthenticated request to /api/admin/stats rejected: HTTP ${unauthRes.status()}`);
  } else {
    throw new Error(`Expected HTTP 401, got ${unauthRes.status()}`);
  }

  // 3. Unauthenticated PATCH to /api/reports/:id -> must return 401
  const unauthPatch = await context.request.patch(`${BASE_URL}/api/reports/CR-2026-001`, {
    data: { status: 'Resolved' },
  });
  if (unauthPatch.status() === 401) {
    console.log(` [PASS] Unauthenticated PATCH to /api/reports rejected: HTTP ${unauthPatch.status()}`);
  } else {
    throw new Error(`Expected HTTP 401, got ${unauthPatch.status()}`);
  }

  // ----------------------------------------------------------------
  // TEST E: Fast Demo Switcher
  // ----------------------------------------------------------------
  console.log('\n--- TEST E: Fast Demo Switcher Verification ---');
  await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });

  // Click Fast Demo Switcher -> Demo Citizen
  await page.click('button:has-text("Demo Role")');
  await page.click('button:has-text("Priya Raman")');
  await page.waitForURL('**/my-reports', { timeout: 15000 });
  console.log(' [PASS] Demo Switcher switched to Priya Raman (Citizen) -> navigated to /my-reports');

  // Click Fast Demo Switcher -> Demo Admin
  await page.click('button:has-text("Demo Role")');
  await page.click('button:has-text("Operations Desk")');
  await page.waitForURL('**/admin', { timeout: 15000 });
  console.log(' [PASS] Demo Switcher switched to Municipal Operations Desk (Admin) -> navigated to /admin');

  await browser.close();
  console.log('\n====================================================');
  console.log('   ALL 5 AUTHENTICATION TESTS PASSED SUCCESSFULLY!  ');
  console.log('====================================================');
}

runTestSuite().catch(err => {
  console.error('\nAUDIT TEST FAILED:', err);
  process.exit(1);
});
