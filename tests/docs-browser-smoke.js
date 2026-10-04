const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { serve } = require('./static-server');
(async () => {
  const { server, url } = await serve(path.resolve(__dirname, '../docs'), '/hybrid-id-generator/');
  let browser;
  try {
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();
    const errors = []; const failedAssets = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400 && /\.(js|css|svg|woff2)(\?|$)/.test(response.url())) failedAssets.push(response.url()); });
    await page.goto(url);
    await page.getByRole('link', { name: 'Get started', exact: true }).click();
    await page.waitForURL('**/getting-started.html');
    await page.locator('.vp-doc button.copy').first().click();
    assert.match(await page.evaluate(() => navigator.clipboard.readText()), /npm install hybrid-id-generator/);
    const theme = page.getByRole('switch', { name: /dark theme|light theme/i });
    const dark = await page.locator('html').evaluate(el => el.classList.contains('dark'));
    await theme.click();
    await page.waitForFunction(value => document.documentElement.classList.contains('dark') !== value, dark);
    await page.reload();
    assert.equal(await page.locator('html').evaluate(el => el.classList.contains('dark')), !dark);
    await page.getByRole('button', { name: /search/i }).click();
    await page.locator('#localsearch-input').fill('nextIds');
    const result = page.locator('.VPLocalSearchBox a[href*="api/generator.html#nextids"]').first();
    await result.waitFor();
    await result.click();
    await page.waitForURL('**/api/generator.html#nextids');
    await page.getByRole('heading', { name: /^nextIds/, level: 2 }).waitFor();
    await page.goto(`${url}classes/HybridIDGenerator.html#nextId`);
    await page.waitForURL('**/api/generator.html#nextid');
    await page.getByRole('heading', { name: /^nextId(?:\s|$)/, level: 2 }).waitFor();
    await page.goto(`${url}classes/EnvMachineIDProvider.html`);
    await page.waitForURL('**/api/providers.html#envmachineidprovider');
    await page.goto(`${url}classes/EnvMachineIDProvider.html#getMachineId`);
    await page.waitForURL('**/api/providers.html#envmachineidprovider');
    await page.goto(`${url}classes/HybridID.html#toBase62`);
    await page.waitForURL('**/api/id.html#conversions');
    await page.getByRole('heading', { name: 'Conversions', level: 2 }).waitFor();
    const mobile = await context.newPage();
    await mobile.setViewportSize({ width: 390, height: 844 });
    await mobile.goto(`${url}getting-started.html`);
    await mobile.getByRole('button', { name: /menu/i }).first().click();
    await mobile.locator('.VPSidebar').getByRole('link', { name: 'Format and configuration', exact: true }).click();
    await mobile.waitForURL('**/configuration.html');
    await mobile.getByRole('heading', { name: 'Format and configuration', level: 1 }).waitFor();
    assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    if (process.env.DOCS_SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.DOCS_SCREENSHOT_DIR, { recursive: true });
      await page.goto(url); await page.getByRole('switch', { name: /dark theme|light theme/i }).click();
      await page.screenshot({ path: path.join(process.env.DOCS_SCREENSHOT_DIR, 'docs-desktop.png'), fullPage: true });
      await mobile.goto(url);
      await mobile.screenshot({ path: path.join(process.env.DOCS_SCREENSHOT_DIR, 'docs-mobile.png'), fullPage: true });
    }
    assert.deepEqual(errors, []); assert.deepEqual(failedAssets, []);
    console.log('Documentation browser navigation, search, copy, theme, redirects, and mobile layout passed');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
