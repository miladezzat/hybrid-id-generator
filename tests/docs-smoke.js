const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../documentation/.vitepress/dist');
const base = '/hybrid-id-generator/';
const pages = ['index', 'getting-started', 'configuration', 'uniqueness', 'encoding', 'compatibility', 'examples', 'migration', 'releasing', 'contributing', 'changelog', 'license', 'api/generator', 'api/id', 'api/providers', 'api/helpers'];
for (const page of pages) {
  const html = fs.readFileSync(path.join(root, `${page}.html`), 'utf8');
  assert.ok(html.includes('VitePress'), `Missing VitePress markup: ${page}`);
  const editLinks = [...html.matchAll(/href="(https:\/\/github\.com\/miladezzat\/hybrid-id-generator\/edit\/[^\"]+)"/g)];
  for (const [, link] of editLinks) {
    assert.equal(link, `https://github.com/miladezzat/hybrid-id-generator/edit/main/documentation/${page}.md`, `${page}: invalid edit link`);
  }
  if (page !== 'index') assert.ok(editLinks.length > 0, `${page}: missing edit link`);
  for (const match of html.matchAll(/(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)) {
    const target = match[1];
    if (/^(https?:|data:|mailto:)/.test(target)) continue;
    const resolved = new URL(target, `https://docs.invalid${base}${page}.html`).pathname;
    assert.ok(resolved.startsWith(base), `${page}: invalid base path ${target}`);
    const relative = decodeURIComponent(resolved.slice(base.length));
    const file = path.join(root, relative || 'index.html');
    assert.ok(fs.existsSync(file), `${page}: missing target ${target}`);
  }
}
assert.ok(fs.existsSync(path.join(root, '.nojekyll')));
assert.match(fs.readFileSync(path.join(root, 'classes/HybridIDGenerator.html'), 'utf8'), /\/hybrid-id-generator\/api\/generator.html/);
assert.match(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), /https:\/\/miladezzat.github.io\/hybrid-id-generator\//);
for (const [legacy, fragment, expected] of [
  ['classes/HybridID.html', '#toBase62', 'api/id.html#conversions'],
  ['classes/HybridID.html', '#fromHex', 'api/id.html#factories'],
  ['classes/HybridID.html', '#isEqual', 'api/id.html#comparison'],
  ['classes/HybridID.html', '#isValidBase64', 'api/id.html#validation'],
  ['classes/HybridID.html', '#deserialize', 'api/id.html#deserialize'],
  ['classes/EnvMachineIDProvider.html', '#getMachineId', 'api/providers.html#envmachineidprovider'],
  ['classes/NetworkMachineIDProvider.html', '#constructor', 'api/providers.html#networkmachineidprovider'],
  ['classes/RandomMachineIDProvider.html', '#getMachineId', 'api/providers.html#randommachineidprovider'],
  ['classes/MachineIDProviderFactory.html', '#createMachineIDProvider', 'api/providers.html#machineidproviderfactory'],
  ['interfaces/HybridIDGeneratorOptions.html', '#entropyBits', 'configuration.html#options'],
  ['interfaces/HybridIDInfo.html', '#timestamp', 'api/helpers.html#hybrididinfo'],
  ['miscellaneous/functions.html', '#encodeBase62', 'api/helpers.html#integer-encoding-helpers'],
  ['miscellaneous/typealiases.html', '#MachineIDStrategy', 'api/helpers.html#machineidstrategy-and-machineidprovider'],
  ['classes/HybridIDGenerator.html', '#%6EextId', 'api/generator.html#nextid'],
  ['classes/HybridIDGenerator.html', '#missing', 'api/generator.html'],
  ['classes/EnvMachineIDProvider.html', '#%', 'api/providers.html#envmachineidprovider'],
  ['classes/HybridID.html', '#__proto__', 'api/id.html'],
]) {
  const script = fs.readFileSync(path.join(root, legacy), 'utf8').match(/<script>(.*?)<\/script>/s)[1];
  let destination;
  require('node:vm').runInNewContext(script, { location: { hash: fragment, replace: value => { destination = value; } } });
  assert.equal(destination, base + expected, `${legacy}${fragment}: incorrect redirect`);
  const [page, section] = expected.split('#');
  if (section) assert.ok(fs.readFileSync(path.join(root, page), 'utf8').includes(`id="${section}"`), `Missing destination anchor ${expected}`);
}
console.log(`Generated documentation: ${pages.length} pages and internal asset/link checks passed`);
