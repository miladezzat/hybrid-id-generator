const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hybrid-id-install-'));
const npmEnv = { ...process.env, npm_config_cache: path.join(temp, 'cache') };
try {
  const packed = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', temp], { cwd: root, encoding: 'utf8', env: npmEnv }))[0];
  assert.ok(packed.files.some(file => file.path === 'dist/index.d.ts'));
  assert.ok(packed.files.some(file => file.path === 'dist/browser.mjs'));
  assert.ok(packed.files.every(file => file.path.startsWith('dist/') || ['package.json', 'README.md', 'LICENSE'].includes(file.path)));
  fs.writeFileSync(path.join(temp, 'package.json'), '{"private":true}');
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--offline', path.join(temp, packed.filename)], { cwd: temp, stdio: 'pipe', env: npmEnv });
  const script = `const assert = require('node:assert/strict'); const {HID,HybridIDGenerator}=require('hybrid-id-generator'); assert.equal(HID,HybridIDGenerator); const g=new HID({machineId:1}); assert.equal(g.info(g.nextId()).machineId,1);`;
  execFileSync(process.execPath, ['-e', script], { cwd: temp, stdio: 'inherit' });
  execFileSync(process.execPath, ['--input-type=module', '-e', "import {HID,HybridIDGenerator,HybridID} from 'hybrid-id-generator'; if(HID!==HybridIDGenerator) throw Error('Alias mismatch'); const g=new HID({machineId:2}); if (!(g.nextId() instanceof HybridID)) throw Error('Invalid ESM export');"], { cwd: temp, stdio: 'inherit' });
  const fixture = path.join(temp, 'fixture.ts');
  fs.writeFileSync(fixture, "import {HID,HybridID,HybridIDGeneratorOptions} from 'hybrid-id-generator'; const opts:HybridIDGeneratorOptions={machineId:1}; const id:HybridID=new HID(opts).nextId(); id.toBase62();\n");
  execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--target', 'ES2020', '--module', 'Node16', '--moduleResolution', 'Node16', '--strict', '--skipLibCheck', '--noEmit', fixture], { cwd: temp, stdio: 'inherit' });
  console.log(`Packed CommonJS, ESM, and TypeScript install passed (${packed.files.length} files)`);
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
