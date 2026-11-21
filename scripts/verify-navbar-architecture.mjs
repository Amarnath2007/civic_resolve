import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { name: '1920px_UltraWide', width: 1920, height: 1080 },
  { name: '1600px_LargeDesktop', width: 1600, height: 900 },
  { name: '1536px_MacBookPro16', width: 1536, height: 864 },
  { name: '1440px_MacBookPro14', width: 1440, height: 900 },
  { name: '1280px_StandardDesktop', width: 1280, height: 800 },
  { name: '1024px_MediumDesktop', width: 1024, height: 768 },
  { name: '768px_TabletPortrait', width: 768, height: 1024 },
  { name: '390px_MobilePhone', width: 390, height: 844 },
];

const SCREENSHOT_DIR = path.resolve('test-results/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function doBoxesIntersect(b1, b2, tolerance = 1) {
  // If either box has 0 dimensions, they don't intersect
  if (b1.width <= 0 || b1.height <= 0 || b2.width <= 0 || b2.height <= 0) return false;
  return !(
    b1.x + b1.width - tolerance <= b2.x ||
    b2.x + b2.width - tolerance <= b1.x ||
    b1.y + b1.height - tolerance <= b2.y ||
    b2.y + b2.height - tolerance <= b1.y
  );
}

async function runAudit() {
  console.log('================================================================');
  console.log('       CIVICRESOLVE NAVBAR ARCHITECTURE PLAYWRIGHT AUDIT        ');
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];
  let overallPassed = true;

  // Test both unauthenticated and authenticated states
  const states = [
    { label: 'Unauthenticated', login: false },
    { label: 'Authenticated_Citizen', login: true },
  ];

  for (const state of states) {
    console.log(`\n================ STATE: ${state.label} ================`);

    if (state.login) {
      await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
      await page.click('button:has-text("Demo Citizen")');
      await page.waitForURL('**/my-reports', { timeout: 15000 });
      await page.waitForTimeout(1000);
      console.log('✓ Signed in as Priya Raman (Demo Citizen)');
    } else {
      // Clear cookies / storage
      await context.clearCookies();
      await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    }

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      // Save screenshot
      const shotPath = path.join(SCREENSHOT_DIR, `navbar-${vp.width}px-${state.label}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });

      // Run DOM evaluation
      const audit = await page.evaluate((width) => {
        const isDesktop = width >= 1024;
        const winW = window.innerWidth;
        const docScrollW = document.documentElement.scrollWidth;
        const bodyScrollW = document.body.scrollWidth;
        const hasHOverflow = docScrollW > winW || bodyScrollW > winW;

        const header = document.querySelector('header');
        if (!header) return { error: 'Header not found' };

        // 1. Report Issue CTA
        const ctaBtns = Array.from(header.querySelectorAll('a')).filter((a) =>
          a.textContent?.includes('Report Issue')
        );
        const visibleCta = ctaBtns.find((b) => {
          const r = b.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && window.getComputedStyle(b).display !== 'none';
        });

        const ctaRect = visibleCta ? visibleCta.getBoundingClientRect() : null;
        const ctaValid =
          ctaRect !== null &&
          ctaRect.right <= winW + 2 && // within viewport
          ctaRect.left >= 0 &&
          ctaRect.width > 0;

        // 2. Navigation items
        const expectedLabels = [
          'Home',
          'Report an Issue',
          'Track Complaint',
          'Neighbourhood Pulse',
          'My Reports',
        ];

        const navLinks = [];
        let allNavVisible = true;
        let myReportsRect = null;

        if (isDesktop) {
          // Check desktop nav links
          const desktopNav = header.querySelector('nav');
          if (!desktopNav) {
            allNavVisible = false;
          } else {
            const links = Array.from(desktopNav.querySelectorAll('a'));
            for (const expected of expectedLabels) {
              const el = links.find((l) => l.textContent?.trim() === expected);
              if (!el) {
                allNavVisible = false;
                navLinks.push({ label: expected, found: false });
              } else {
                const r = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                const visible =
                  r.width > 0 &&
                  r.height > 0 &&
                  style.visibility !== 'hidden' &&
                  style.display !== 'none';
                if (!visible) allNavVisible = false;
                if (expected === 'My Reports') myReportsRect = r;
                navLinks.push({
                  label: expected,
                  found: true,
                  visible,
                  rect: { x: r.left, y: r.top, width: r.width, height: r.height },
                });
              }
            }
          }
        } else {
          // Mobile: Check hamburger button is visible
          const hamburger = header.querySelector('button[aria-label="Toggle navigation menu"]');
          const hRect = hamburger ? hamburger.getBoundingClientRect() : null;
          allNavVisible =
            hRect !== null &&
            hRect.width > 0 &&
            hRect.height > 0 &&
            window.getComputedStyle(hamburger).display !== 'none';
        }

        // 3. Overlap check on desktop
        const overlaps = [];
        if (isDesktop && navLinks.length > 0) {
          // Check nav links don't overlap with each other
          for (let i = 0; i < navLinks.length; i++) {
            for (let j = i + 1; j < navLinks.length; j++) {
              const b1 = navLinks[i].rect;
              const b2 = navLinks[j].rect;
              if (b1 && b2) {
                if (
                  !(
                    b1.x + b1.width <= b2.x ||
                    b2.x + b2.width <= b1.x ||
                    b1.y + b1.height <= b2.y ||
                    b2.y + b2.height <= b1.y
                  )
                ) {
                  overlaps.push({
                    type: 'nav-link-collision',
                    item1: navLinks[i].label,
                    item2: navLinks[j].label,
                  });
                }
              }
            }
          }

          // Check "My Reports" does NOT overlap with any right-side element
          if (myReportsRect) {
            // Find all right-side buttons/links
            const rightControls = Array.from(header.querySelectorAll('button, a')).filter((el) => {
              const r = el.getBoundingClientRect();
              return (
                r.left >= myReportsRect.left + myReportsRect.width - 2 &&
                r.width > 0 &&
                r.height > 0 &&
                window.getComputedStyle(el).display !== 'none'
              );
            });

            // Check if any right element overlaps myReports
            for (const el of header.querySelectorAll('button, a')) {
              if (el.textContent?.trim() === 'My Reports') continue;
              // Check if inside nav
              if (el.closest('nav')) continue;
              const r = el.getBoundingClientRect();
              if (r.width > 0 && r.height > 0 && window.getComputedStyle(el).display !== 'none') {
                if (
                  !(
                    myReportsRect.right <= r.left ||
                    r.right <= myReportsRect.left ||
                    myReportsRect.bottom <= r.top ||
                    r.bottom <= myReportsRect.top
                  )
                ) {
                  overlaps.push({
                    type: 'my-reports-collision',
                    collidedWith: el.textContent?.trim() || el.getAttribute('aria-label') || 'Element',
                  });
                }
              }
            }
          }
        }

        return {
          winW,
          hasHOverflow,
          docScrollW,
          ctaValid,
          ctaRight: ctaRect?.right,
          allNavVisible,
          navLinksCount: navLinks.length,
          myReportsFound: myReportsRect !== null,
          overlaps,
        };
      }, vp.width);

      const pass =
        !audit.hasHOverflow &&
        audit.ctaValid &&
        audit.allNavVisible &&
        audit.overlaps.length === 0;

      if (!pass) overallPassed = false;

      console.log(
        `[${vp.width}px] ${vp.name.padEnd(24)} | H-Scroll: ${audit.hasHOverflow ? 'FAIL' : 'OK'} | CTA in Viewport: ${audit.ctaValid ? 'OK' : 'FAIL'} | Nav Visible: ${audit.allNavVisible ? 'OK' : 'FAIL'} | Overlaps: ${audit.overlaps.length === 0 ? 'NONE (OK)' : JSON.stringify(audit.overlaps)} | -> ${pass ? 'PASS' : 'FAIL'}`
      );

      results.push({
        viewport: vp.width,
        state: state.label,
        pass,
        audit,
      });
    }
  }

  // Mobile Drawer Interaction Test
  console.log('\n--- VERIFYING MOBILE DRAWER INTERACTION (390px) ---');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  const hamburger = page.locator('button[aria-label="Toggle navigation menu"]');
  await hamburger.click();
  await page.waitForTimeout(500);

  const drawerShot = path.join(SCREENSHOT_DIR, 'navbar-390px-drawer-open.png');
  await page.screenshot({ path: drawerShot });

  const drawerVisible = await page.evaluate(() => {
    const labels = ['Home', 'Report an Issue', 'Track Complaint', 'Neighbourhood Pulse', 'My Reports'];
    const drawer = document.querySelector('.lg\\:hidden.fixed');
    if (!drawer) return false;
    const text = drawer.textContent || '';
    return labels.every((l) => text.includes(l)) && text.includes('Fast Demo Roles');
  });

  console.log(`Mobile Drawer contains all links & Fast Demo Roles: ${drawerVisible ? 'PASS' : 'FAIL'}`);
  if (!drawerVisible) overallPassed = false;

  await browser.close();

  console.log('\n================================================================');
  console.log(`FINAL RESULT: ${overallPassed ? 'ALL VIEWPORT ARCHITECTURE TESTS PASSED!' : 'SOME TESTS FAILED'}`);
  console.log('================================================================\n');

  if (!overallPassed) process.exit(1);
}

runAudit().catch((err) => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
