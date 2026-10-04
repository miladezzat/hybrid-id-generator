const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkRelease } = require('../scripts/check-release');
const { verifyRelease } = require('../scripts/verify-release');
const pkg = { name: 'hybrid-id-generator', version: '3.2.0' };
const response = (version, status = 200) => ({ ok: status === 200, status, json: async () => ({ name: pkg.name, version }) });
test('release gate publishes newer versions and skips existing ones', async () => {
  assert.equal(await checkRelease(pkg, async () => response('3.1.2')), true);
  assert.equal(await checkRelease(pkg, async () => response('3.2.0')), false);
});
test('release gate fails on downgrade, lookup failure, and package mismatch', async () => {
  await assert.rejects(checkRelease(pkg, async () => response('3.3.0')), /older/);
  await assert.rejects(checkRelease(pkg, async () => response('', 503)), /503/);
  await assert.rejects(checkRelease(pkg, async () => ({ ok: true, json: async () => ({ name: 'another', version: '3.1.2' }) })), /different package/);
  await assert.rejects(checkRelease({ ...pkg, version: '3.2.0-rc.1' }), /stable/);
});
test('release verification retries registry propagation without publishing again', async () => {
  let reads = 0;
  let time = 0;
  const result = await verifyRelease(pkg, {
    fetchRegistry: async () => ++reads < 3 ? response('', 404) : { ok: true, json: async () => ({ ...pkg, dist: { integrity: 'sha512-YWJjZA==' } }) },
    wait: async ms => { time += ms; }, now: () => time, log: () => {},
  });
  assert.equal(reads, 3);
  assert.equal(result.version, pkg.version);
});
test('release verification fails on invalid metadata and permanent registry errors', async () => {
  await assert.rejects(verifyRelease(pkg, { fetchRegistry: async () => ({ ok: true, json: async () => ({ ...pkg, dist: {} }) }) }), /invalid release metadata/);
  await assert.rejects(verifyRelease(pkg, { fetchRegistry: async () => response('', 403) }), /403/);
});
test('release verification times out with a useful recovery message', async () => {
  let time = 0;
  await assert.rejects(verifyRelease(pkg, { fetchRegistry: async () => response('', 404), now: () => time, wait: async ms => { time += ms; }, timeoutMs: 100, log: () => {} }), /Check npm before/);
});
