const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../docs');
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
console.log(`Generated documentation: ${pages.length} pages and internal asset/link checks passed`);
