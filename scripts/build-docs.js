const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs');
const base = '/hybrid-id-generator/';
const redirects = {
  'classes/HybridIDGenerator.html': 'api/generator.html',
  'classes/HybridID.html': 'api/id.html',
  'classes/EnvMachineIDProvider.html': 'api/providers.html#envmachineidprovider',
  'classes/NetworkMachineIDProvider.html': 'api/providers.html#networkmachineidprovider',
  'classes/RandomMachineIDProvider.html': 'api/providers.html#randommachineidprovider',
  'classes/MachineIDProviderFactory.html': 'api/providers.html#machineidproviderfactory',
  'interfaces/HybridIDGeneratorOptions.html': 'configuration.html#options',
  'interfaces/HybridIDInfo.html': 'api/helpers.html#hybrididinfo',
  'interfaces/MachineIDProvider.html': 'api/helpers.html#machineidstrategy-and-machineidprovider',
  'miscellaneous/functions.html': 'api/helpers.html',
  'miscellaneous/variables.html': 'api/helpers.html',
  'miscellaneous/typealiases.html': 'api/helpers.html',
  'overview.html': 'configuration.html',
  'modules.html': 'api/generator.html',
  'properties.html': 'api/generator.html#options',
  'coverage.html': 'contributing.html',
};
const legacyAnchors = {
  'classes/HybridID.html': {
    tobigint: 'conversions', tostring: 'conversions', valueof: 'conversions',
    tohex: 'conversions', tobase62: 'conversions', tobase32: 'conversions', tobase64: 'conversions',
    frombase62: 'factories', frombase32: 'factories', frombase64: 'factories', fromhex: 'factories',
    isequal: 'comparison', islessthan: 'comparison', isgreaterthan: 'comparison',
    isvalidbase62: 'validation', isvalidbase32: 'validation', isvalidbase64: 'validation',
  },
  'classes/HybridIDGenerator.html': {
    machineid: 'options', sequence: 'options', lasttimestamp: 'options',
    maxsequence: 'options', maxmachineid: 'options', timestampbits: 'options',
  },
  'miscellaneous/functions.html': {
    encodebase62: 'integer-encoding-helpers', decodebase62: 'integer-encoding-helpers',
    encodebase32: 'integer-encoding-helpers', decodebase32: 'integer-encoding-helpers',
    encodebase64: 'integer-encoding-helpers', decodebase64: 'integer-encoding-helpers',
  },
  'miscellaneous/typealiases.html': { machineidstrategy: 'machineidstrategy-and-machineidprovider' },
};
const staged = fs.mkdtempSync(path.join(os.tmpdir(), 'hybrid-id-docs-'));
try {
  const cli = path.join(path.dirname(require.resolve('vitepress/package.json')), 'bin/vitepress.js');
  execFileSync(process.execPath, [cli, 'build', 'documentation', '--outDir', staged], { cwd: root, stdio: 'inherit' });
  for (const [oldPath, target] of Object.entries(redirects)) {
    const destination = base + target;
    const targetHtml = fs.readFileSync(path.join(staged, target.split('#')[0]), 'utf8');
    const headings = [...targetHtml.matchAll(/<h[1-6]\b[^>]*\bid="([^"]+)"/g)].map(match => match[1]);
    const aliases = legacyAnchors[oldPath] || {};
    for (const section of [...Object.values(aliases), ...(target.includes('#') ? [target.split('#')[1]] : [])]) {
      if (!headings.includes(section)) throw new Error(`Missing redirect section ${target}: ${section}`);
    }
    const file = path.join(staged, oldPath);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const script = `const target=${JSON.stringify(destination)};const headings=${JSON.stringify(headings)};const aliases=${JSON.stringify(aliases)};let fragment='';try{fragment=decodeURIComponent(location.hash.slice(1)).toLowerCase()}catch{}const anchor=Object.prototype.hasOwnProperty.call(aliases,fragment)?aliases[fragment]:headings.includes(fragment)?fragment:'';location.replace(anchor?target.split('#')[0]+'#'+anchor:target);`;
    fs.writeFileSync(file, `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Documentation moved</title><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${destination}"><link rel="canonical" href="https://miladezzat.github.io${destination}"></head><body><p>This documentation has moved. <a href="${destination}">Continue to the new page</a>.</p><script>${script}</script></body></html>\n`);
  }
  function normalizeHtml(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) normalizeHtml(file);
      else if (entry.name.endsWith('.html')) fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/[ \t]+$/gm, ''));
    }
  }
  normalizeHtml(staged);
  // Generated assets replace the previous site only after a successful build.
  fs.rmSync(output, { recursive: true, force: true });
  fs.cpSync(staged, output, { recursive: true });
  console.log(`Created ${Object.keys(redirects).length} legacy redirects`);
} finally { fs.rmSync(staged, { recursive: true, force: true }); }
