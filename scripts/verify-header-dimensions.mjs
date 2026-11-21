import { chromium } from 'playwright';

async function main() {
  console.log('=== VERIFYING HEADER DIMENSIONS ACROSS 8 VIEWPORTS ===\n');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Sign in as Citizen so /my-reports has full user profile rendered
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.click('button:has-text("Demo Citizen")');
  await page.waitForURL('**/my-reports', { timeout: 15000 });
  console.log('✓ Successfully logged in as Priya Raman (Demo Citizen)\n');

  const viewports = [
    { name: 'Full HD Desktop', width: 1920, height: 1080 },
    { name: 'QHD / Wide Desktop', width: 1600, height: 900 },
    { name: 'MacBook Pro 16 / Large', width: 1536, height: 960 },
    { name: 'MacBook Pro 14 / WXGA', width: 1440, height: 900 },
    { name: 'Standard Desktop', width: 1280, height: 800 },
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Tablet Portrait (iPad)', width: 768, height: 1024 },
    { name: 'Mobile (iPhone 14)', width: 390, height: 844 },
  ];

  const routes = ['/', '/my-reports'];
  let allPass = true;

  for (const vp of viewports) {
    console.log(`--- Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    await page.setViewportSize({ width: vp.width, height: vp.height });

    for (const route of routes) {
      await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      const metrics = await page.evaluate(() => {
        const docEl = document.documentElement;
        const body = document.body;
        const winW = window.innerWidth;
        const docScrollW = docEl.scrollWidth;
        const bodyScrollW = body.scrollWidth;

        // Find the visible Report Issue CTA button in header
        const reportBtns = Array.from(document.querySelectorAll('header a')).filter(
          (btn) => btn.textContent?.includes('Report Issue')
        );
        const visibleBtn = reportBtns.find((btn) => {
          const rect = btn.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && window.getComputedStyle(btn).display !== 'none';
        });

        const btnMetrics = visibleBtn
          ? {
              found: true,
              text: visibleBtn.textContent?.trim(),
              left: Math.round(visibleBtn.getBoundingClientRect().left),
              right: Math.round(visibleBtn.getBoundingClientRect().right),
              width: Math.round(visibleBtn.getBoundingClientRect().width),
              isClipped: visibleBtn.getBoundingClientRect().right > winW,
            }
          : { found: false };

        return {
          winW,
          docScrollW,
          bodyScrollW,
          hasHScroll: docScrollW > winW || bodyScrollW > winW,
          btnMetrics,
        };
      });

      const routeOk = !metrics.hasHScroll && metrics.btnMetrics.found && !metrics.btnMetrics.isClipped;
      if (!routeOk) allPass = false;

      console.log(
        `  ${route.padEnd(12)} | Scroll: ${metrics.docScrollW}px / ${metrics.winW}px | CTA: ${metrics.btnMetrics.found ? `Right=${metrics.btnMetrics.right}px (Width=${metrics.btnMetrics.width}px, Margin=${metrics.winW - metrics.btnMetrics.right}px)` : 'NOT FOUND'} | Result: ${routeOk ? 'PASS' : 'FAIL'}`
      );
    }
  }

  // Verify Mobile Drawer interaction at 390px
  console.log('\n--- Verifying Mobile Drawer on 390px ---');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/my-reports', { waitUntil: 'networkidle' });

  const hamburger = await page.$('button[aria-label="Toggle navigation menu"]');
  if (hamburger) {
    await hamburger.click();
    await page.waitForTimeout(400);
    const drawerOpen = (await page.content()).includes('Fast Demo Roles');
    console.log(`  Mobile Drawer Opens Cleanly: ${drawerOpen ? 'PASS' : 'FAIL'}`);
    if (!drawerOpen) allPass = false;
  }

  console.log(`\n=== OVERALL HEADER VERIFICATION: ${allPass ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'} ===`);
  await browser.close();

  if (!allPass) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
