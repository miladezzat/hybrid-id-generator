const fs = require('node:fs');
const pkg = require('../package.json');

function stableVersion(value) {
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)) throw new Error('Release version must be a stable major.minor.patch');
  return value.split('.').map(BigInt);
}

async function checkRelease({ name, version }, fetchRegistry = fetch) {
  const local = stableVersion(version);
  const response = await fetchRegistry(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`, {
    signal: AbortSignal.timeout(15000),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Registry lookup failed: HTTP ${response.status}`);
  const published = await response.json();
  if (published.name !== name) throw new Error('Registry returned a different package');
  const latest = stableVersion(published.version);
  let newer = false;
  for (let index = 0; index < 3; index += 1) {
    if (local[index] < latest[index]) throw new Error('Local version is older than npm latest');
    if (local[index] > latest[index]) { newer = true; break; }
  }
  if (!newer) return false;
  // A mutable latest tag can lag or be moved independently of immutable versions.
  const exact = await fetchRegistry(`https://registry.npmjs.org/${encodeURIComponent(name)}/${encodeURIComponent(version)}`, {
    signal: AbortSignal.timeout(15000),
    cache: 'no-store', headers: { 'Cache-Control': 'no-cache' },
  });
  if (exact.status === 404) return true;
  if (!exact.ok) throw new Error(`Exact version lookup failed: HTTP ${exact.status}`);
  const existing = await exact.json();
  if (existing.name !== name || existing.version !== version) throw new Error('Registry returned mismatched exact version metadata');
  return false;
}

if (require.main === module) {
  checkRelease(pkg).then((publish) => {
    console.log(`${pkg.name}@${pkg.version}: ${publish ? 'publish new version' : 'already published; skip'}`);
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `publish=${publish}\n`);
  }).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { checkRelease };
