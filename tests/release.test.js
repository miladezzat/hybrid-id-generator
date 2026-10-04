const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkRelease } = require('../scripts/check-release');
const { verifyRelease } = require('../scripts/verify-release');
const pkg = { name: 'hybrid-id-generator', version: '3.2.0' };
const response = (version, status = 200) => ({ ok: status === 200, status, json: async () => ({ name: pkg.name, version }) });
const registry = (latest, exact = response('', 404)) => async url => url.endsWith('/latest') ? response(latest) : exact;
test('release gate publishes newer versions and skips existing ones', async () => {
  assert.equal(await checkRelease(pkg, registry('3.1.2')), true);
  assert.equal(await checkRelease(pkg, registry('3.2.0')), false);
});
test('release gate skips an existing version when latest lags or was retagged', async () => {
  const requests = [];
  assert.equal(await checkRelease(pkg, async url => {
    requests.push(url);
    return url.endsWith('/latest') ? response('3.1.2') : response('3.2.0');
  }), false);
  assert.deepEqual(requests, [
    'https://registry.npmjs.org/hybrid-id-generator/latest',
    'https://registry.npmjs.org/hybrid-id-generator/3.2.0',
  ]);
});
test('release gate fails closed on exact-version errors and mismatched metadata', async () => {
  await assert.rejects(checkRelease(pkg, registry('3.1.2', response('', 503))), /503/);
  await assert.rejects(checkRelease(pkg, registry('3.1.2', response('3.1.2'))), /exact version metadata/);
  await assert.rejects(checkRelease(pkg, registry('3.1.2', { ok: true, json: async () => ({ name: 'another', version: pkg.version }) })), /exact version metadata/);
});
test('release gate does not perform an exact lookup for equal or older candidates', async () => {
  for (const latest of ['3.2.0', '3.3.0']) {
    const fetchRegistry = async url => {
      assert.ok(url.endsWith('/latest'));
      return response(latest);
    };
    if (latest === pkg.version) assert.equal(await checkRelease(pkg, fetchRegistry), false);
    else await assert.rejects(checkRelease(pkg, fetchRegistry), /older/);
  }
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
