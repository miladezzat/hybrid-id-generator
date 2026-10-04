const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
const { serve } = require('./static-server');
(async () => {
  const { server, url } = await serve(path.resolve(__dirname, '..'));
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${url}examples/browser-basic.html`);
    assert.deepEqual(errors, []);
    assert.match(await page.locator('#output').innerText(), /^[a-zA-Z0-9]+$/);
    const results = await page.evaluate(async () => {
      const lib = await import('/dist/browser.mjs');
      if (lib.HID !== lib.HybridIDGenerator || HybridIDGeneratorLib.HID !== HybridIDGeneratorLib.HybridIDGenerator) throw new Error('Browser alias mismatch');
      const generator = new lib.HID({ machineId: 7, useCrypto: true, enableEventEmission: true, sequenceBits: 1 });
      let events = 0;
      generator.on('idGenerated', () => { events++; });
      const ids = generator.nextIds(10);
      const id = ids[0];
      const throws = callback => { try { callback(); return false; } catch { return true; } };
      return {
        events, unique: new Set(ids.map(id => id.toString())).size,
        machine: generator.info(id).machineId,
        entropy: Number.isInteger(generator.info(id).entropy),
        base32: lib.HybridID.fromBase32(id.toBase32()).isEqual(id),
        base64: lib.HybridID.fromBase64(id.toBase64()).isEqual(id),
        zero: lib.HybridID.fromBase64(new lib.HybridID(0n).toBase64()).toString(),
        random: lib.HybridID.generateRandom().toBigInt() >= 0n,
        env: throws(() => new lib.HybridIDGenerator({ machineIdStrategy: 'env' })),
        mask: throws(() => new lib.HybridIDGenerator({ maskTimestamp: true }).nextId()),
        monotonic: throws(() => new lib.HybridIDGenerator({ useWallClock: false }).nextId()),
      };
    });
    assert.deepEqual(results, { events: 10, unique: 10, machine: 7, entropy: true, base32: true, base64: true, zero: '0', random: true, env: true, mask: true, monotonic: true });
    assert.deepEqual(errors, []);
    console.log('Chromium ES module/global bundle, events, encoding, and runtime guards passed');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
