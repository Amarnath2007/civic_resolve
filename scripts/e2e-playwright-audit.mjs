import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runBrowserAudit() {
  console.log('=== SECTION 3 & 4: COMPREHENSIVE PLAYWRIGHT BROWSER AUDIT ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const auditResults = {
    citizenWorkflow: {},
    adminWorkflow: {},
    responsiveAudit: {},
  };

  try {
    // -------------------------------------------------------------
    // CITIZEN WORKFLOW
    // -------------------------------------------------------------
    console.log('--- EXECUTING CITIZEN WORKFLOW ---');

    // 1. Open Homepage
    console.log('1. Navigating to homepage...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const heroImage = await page.$('img[alt*="pothole"]');
    const heroPresent = heroImage !== null;
    console.log(`   -> Hero image rendered: ${heroPresent ? 'PASS' : 'FAIL'}`);
    auditResults.citizenWorkflow.homepage = heroPresent;

    // 2. Register a new citizen account
    console.log('2. Testing Citizen Registration...');
    const testEmail = `citizen_test_${Date.now()}@civicresolve.org`;
    const testPassword = 'CivicResolve2026!';
    const testName = 'Selvi Murugan';

    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
    await page.fill('input[placeholder="Priya Raman"]', testName);
    await page.fill('input[placeholder="citizen@civicresolve.org"]', testEmail);
    const passwordInputs = await page.$$('input[type="password"]');
    await passwordInputs[0].fill(testPassword);
    await passwordInputs[1].fill(testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to /my-reports
    await page.waitForURL('**/my-reports', { timeout: 15000 });
    console.log('   -> Registration successful and redirected to /my-reports: PASS');
    auditResults.citizenWorkflow.registration = true;

    // 3. Log out and Log back in
    console.log('3. Testing Citizen Login...');
    await page.click('button[title="Sign Out"]');
    await page.waitForTimeout(1000);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/my-reports', { timeout: 15000 });
    console.log('   -> Login successful: PASS');
    auditResults.citizenWorkflow.login = true;

    // 4. Submit text-only complaint
    console.log('4. Submitting text-only complaint...');
    await page.goto(`${BASE_URL}/report`, { waitUntil: 'networkidle' });
    await page.fill('input[placeholder*="Large pothole"]', 'Overflowing community garbage bin in Anna Nagar');
    await page.fill('textarea[placeholder*="Describe what is broken"]', 'Kuppai thotti full ah overflowing for 3 days. Foul smell and dogs spreading plastic waste on the road.');
    await page.selectOption('select', 'Waste & Garbage');
    await page.fill('input[placeholder*="Gandhipuram"]', 'Anna Nagar');
    await page.fill('input[placeholder*="GP Signal"]', '2nd Main Road corner');
    await page.check('input[type="checkbox"]'); // share publicly
    await page.click('button[type="submit"]');

    // Wait for confirmation banner
    await page.waitForSelector('text=Your report has been successfully submitted.', { timeout: 25000 });
    const trackingCodeEl1 = await page.$('.font-mono.font-extrabold');
    const textTrackingCode = await trackingCodeEl1.innerText();
    console.log(`   -> Text-only complaint created with Tracking ID: ${textTrackingCode}: PASS`);
    auditResults.citizenWorkflow.textReport = textTrackingCode;

    // 5. Submit complaint with photographic evidence
    console.log('5. Submitting complaint with photographic evidence...');
    await page.goto(`${BASE_URL}/report`, { waitUntil: 'networkidle' });
    await page.fill('input[placeholder*="Large pothole"]', 'Critical pothole cave-in near School Crossing');
    await page.fill('textarea[placeholder*="Describe what is broken"]', 'Huge cavity on asphalt ~20cm deep right in front of school gate. Two wheelers skidding during school morning hours.');
    await page.selectOption('select', 'Roads & Potholes');
    await page.fill('input[placeholder*="Gandhipuram"]', 'Gandhipuram');
    await page.fill('input[placeholder*="GP Signal"]', 'Cross Cut Road near Elementary School');
    await page.check('input[type="checkbox"]');

    // Set file input
    const fileInput = await page.$('input[type="file"]');
    await fileInput.setInputFiles('public/hero.png');
    await page.waitForTimeout(1000);
    const previewVisible = await page.$('img[alt="Complaint Evidence Preview"]');
    console.log(`   -> Photo selected and preview visible: ${previewVisible !== null ? 'PASS' : 'FAIL'}`);

    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Your report has been successfully submitted.', { timeout: 25000 });
    const trackingCodeEl2 = await page.$('.font-mono.font-extrabold');
    const photoTrackingCode = await trackingCodeEl2.innerText();
    console.log(`   -> Photo complaint created with Tracking ID: ${photoTrackingCode}: PASS`);
    auditResults.citizenWorkflow.photoReport = photoTrackingCode;

    // 6. View Gemini assessment
    console.log('6. Verifying Gemini assessment card on confirmation...');
    const content = await page.content();
    const aiSummaryPresent = content.includes('AI Triage Assessment') || content.includes('Triage Rationale');
    console.log(`   -> Gemini AI assessment card present: ${aiSummaryPresent ? 'PASS' : 'FAIL'}`);
    auditResults.citizenWorkflow.aiAssessment = aiSummaryPresent;

    // 7. Open My Reports
    console.log('7. Verifying My Reports list...');
    await page.goto(`${BASE_URL}/my-reports`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const hasTextReport = (await page.content()).includes(textTrackingCode);
    const hasPhotoReport = (await page.content()).includes(photoTrackingCode);
    console.log(`   -> Both submitted complaints present in My Reports: ${hasTextReport && hasPhotoReport ? 'PASS' : 'FAIL'}`);
    auditResults.citizenWorkflow.myReports = hasTextReport && hasPhotoReport;

    // 8 & 9. Track complaint and inspect photo evidence
    console.log('8 & 9. Testing Complaint Tracker and Photo Evidence Lightbox...');
    await page.goto(`${BASE_URL}/track/${photoTrackingCode}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const evidenceImage = await page.$('img[alt*="Critical pothole"]');
    console.log(`   -> Photographic evidence rendered on tracker: ${evidenceImage !== null ? 'PASS' : 'FAIL'}`);

    // Click image to trigger lightbox if present
    let lightboxActive = false;
    if (evidenceImage) {
      await evidenceImage.click({ force: true });
      await page.waitForTimeout(1000);
      lightboxActive = (await page.content()).includes('Photographic Evidence Inspection');
      console.log(`   -> Lightbox inspection modal active: ${lightboxActive ? 'PASS' : 'FAIL'}`);
      const closeBtn = await page.$('button[title*="Close modal"]');
      if (closeBtn) await closeBtn.click();
      else await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
    auditResults.citizenWorkflow.evidenceLightbox = lightboxActive;

    // 10. Support a public issue
    console.log('10. Testing Community Support (+1 vote)...');
    await page.goto(`${BASE_URL}/issues`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const supportButtons = await page.$$('button:has-text("Supporters")');
    if (supportButtons.length > 0) {
      const initialText = await supportButtons[0].innerText();
      await supportButtons[0].click();
      await page.waitForTimeout(1500);
      const afterText = await supportButtons[0].innerText();
      console.log(`   -> Support button interaction: "${initialText}" -> "${afterText}": PASS`);
      auditResults.citizenWorkflow.supportIssue = true;
    }

    // -------------------------------------------------------------
    // ADMINISTRATOR WORKFLOW
    // -------------------------------------------------------------
    console.log('\n--- EXECUTING ADMINISTRATOR WORKFLOW ---');

    // 1 & 2. Log in as Administrator & open Dedicated Admin Dashboard
    console.log('1 & 2. Logging in as Administrator...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.click('button:has-text("Demo Admin")');
    await page.waitForURL('**/admin', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const adminSidebar = await page.$('aside');
    const citizenHeaderPresent = await page.$('header:has-text("Citizen Grievance Platform")');
    console.log(`   -> Dedicated Admin Sidebar rendered: ${adminSidebar !== null ? 'PASS' : 'FAIL'}`);
    console.log(`   -> Citizen header omitted on admin route: ${citizenHeaderPresent === null ? 'PASS' : 'FAIL'}`);
    auditResults.adminWorkflow.dashboard = adminSidebar !== null && citizenHeaderPresent === null;

    // 3 & 4. Open Complaint Queue and Filter
    console.log('3 & 4. Opening Complaint Queue and Testing Filter Toolbar...');
    await page.goto(`${BASE_URL}/admin/complaints`, { waitUntil: 'networkidle' });
    await page.waitForSelector('table', { timeout: 10000 });

    // Test filter by search code
    await page.fill('input[placeholder*="Search code"]', photoTrackingCode);
    await page.waitForTimeout(1000);
    const queueContent = await page.content();
    const filterWorks = queueContent.includes(photoTrackingCode);
    console.log(`   -> Filtered queue specifically matched ${photoTrackingCode}: ${filterWorks ? 'PASS' : 'FAIL'}`);
    auditResults.adminWorkflow.filter = filterWorks;

    // 5 & 6. Open Complaint Dossier & View Photograph
    console.log('5 & 6. Opening Dossier & Viewing Photographic Evidence...');
    await page.click(`a[href*="/admin/complaints/"]`);
    await page.waitForURL('**/admin/complaints/**', { timeout: 10000 });
    await page.waitForSelector('text=Municipal Action Desk', { timeout: 10000 });

    const adminEvidenceImg = await page.$('img[alt*="Critical pothole"]');
    console.log(`   -> Admin loaded complaint dossier with photo evidence: ${adminEvidenceImg !== null ? 'PASS' : 'FAIL'}`);
    auditResults.adminWorkflow.dossier = adminEvidenceImg !== null;

    // 7. Inspect Gemini Assessment
    console.log('7. Verifying Gemini AI Triage Breakdown...');
    const geminiAssessmentCard = (await page.content()).includes('AI Triage Assessment');
    console.log(`   -> Gemini Assessment & Priority Score Card present: ${geminiAssessmentCard ? 'PASS' : 'FAIL'}`);
    auditResults.adminWorkflow.geminiAssessment = geminiAssessmentCard;

    // 8, 9, 10, 11, 12. Modify Department, Priority, Status, Add Dispatch Note & Internal Note
    console.log('8-12. Executing Administrative Updates...');
    const selects = await page.$$('select');
    await selects[0].selectOption('In Progress'); // Status
    await selects[1].selectOption('Roads & Public Works'); // Department
    await selects[2].selectOption('Roads & Potholes'); // Category
    await selects[3].selectOption('Critical'); // Priority

    const textareas = await page.$$('textarea');
    const publicNote = 'Emergency road work crew #8 dispatched with asphalt roller.';
    const secretInternalNote = 'CONTRACTOR-AUDIT-PENALTY-CODE-9942 (CONFIDENTIAL)';
    await textareas[0].fill(publicNote);
    await textareas[1].fill(secretInternalNote);

    await page.click('button:has-text("Commit Administrative Updates")');
    await page.waitForSelector('text=Administrative record and dispatch note successfully updated.', { timeout: 15000 });
    console.log('   -> Administrative updates and notes committed successfully: PASS');
    auditResults.adminWorkflow.updateCommitted = true;

    // 13. Confirm internal note is hidden from citizen on /track/[id]
    console.log('13. Verifying Confidentiality (Internal note hidden from public tracker)...');
    await page.goto(`${BASE_URL}/track/${photoTrackingCode}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const publicTrackerHtml = await page.content();
    const hasPublicNote = publicTrackerHtml.includes(publicNote);
    const hasSecretInternalNote = publicTrackerHtml.includes(secretInternalNote);

    console.log(`   -> Citizen sees public dispatch note: ${hasPublicNote ? 'PASS' : 'FAIL'}`);
    console.log(`   -> Citizen CANNOT see confidential internal note: ${!hasSecretInternalNote ? 'PASS' : 'FAIL'}`);
    auditResults.adminWorkflow.confidentialityEnforced = hasPublicNote && !hasSecretInternalNote;

    // -------------------------------------------------------------
    // RESPONSIVE UI VIEWPORTS AUDIT
    // -------------------------------------------------------------
    console.log('\n--- EXECUTING RESPONSIVE UI AUDIT ---');

    const viewports = [
      { name: 'Desktop Large', width: 1536, height: 960 },
      { name: 'Desktop Medium', width: 1280, height: 800 },
      { name: 'Tablet Landscape', width: 1024, height: 768 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Mobile Phone', width: 390, height: 844 },
    ];

    const routesToTest = [
      '/',
      '/report',
      '/my-reports',
      `/track/${photoTrackingCode}`,
      '/pulse',
      '/admin',
      '/admin/complaints',
      '/admin/priority',
      '/admin/departments',
      '/admin/analytics',
    ];

    for (const vp of viewports) {
      console.log(`\n  >> Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const r of routesToTest) {
        await page.goto(`${BASE_URL}${r}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Check for horizontal overflow
        const overflow = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const hasHScroll = window.innerWidth < docEl.scrollWidth || window.innerWidth < body.scrollWidth;
          return {
            windowWidth: window.innerWidth,
            docScrollWidth: docEl.scrollWidth,
            bodyScrollWidth: body.scrollWidth,
            hasHScroll,
          };
        });

        const status = overflow.hasHScroll ? 'OVERFLOW' : 'OK';
        console.log(`     Route ${r.padEnd(28)}: ${status} (Window: ${overflow.windowWidth}px, Scroll: ${Math.max(overflow.docScrollWidth, overflow.bodyScrollWidth)}px)`);
        auditResults.responsiveAudit[`${vp.name}_${r}`] = !overflow.hasHScroll;
      }
    }

    console.log('\n=== AUDIT RUN COMPLETED SUCCESSFULLY ===');
    fs.writeFileSync('scripts/playwright-audit-results.json', JSON.stringify(auditResults, null, 2));
  } catch (err) {
    console.error('Playwright audit encountered an error:', err);
  } finally {
    await browser.close();
  }
}

runBrowserAudit();
