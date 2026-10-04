const { execFileSync } = require('node:child_process');
const { rmSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const esbuild = require('esbuild');
const root = join(__dirname, '..');

async function build() {
  rmSync(join(root, 'dist'), { recursive: true, force: true });
  execFileSync(process.execPath, [require.resolve('typescript/bin/tsc')], { cwd: root, stdio: 'inherit' });
  const nodeOnly = {
    name: 'node-only-modules',
    setup(build) {
      build.onResolve({ filter: /^(?:node:)?(?:os|crypto)$/ }, args => ({ path: args.path, namespace: 'node-only' }));
      build.onLoad({ filter: /.*/, namespace: 'node-only' }, args => ({
        contents: `function unavailable() { throw new Error(${JSON.stringify(args.path + ' requires Node.js.')}); } module.exports = { networkInterfaces: unavailable, randomBytes: unavailable, createHash: unavailable };`,
        loader: 'js',
      }));
      build.onResolve({ filter: /^events$/ }, () => ({ path: require.resolve('events/') }));
    },
  };
  const options = { entryPoints: [join(root, 'src/index.ts')], bundle: true, platform: 'browser', target: 'es2020', plugins: [nodeOnly] };
  await esbuild.build({ ...options, format: 'esm', outfile: join(root, 'dist/browser.mjs') });
  await esbuild.build({ ...options, format: 'iife', globalName: 'HybridIDGeneratorLib', outfile: join(root, 'dist/hybrid-id-generator.global.js') });
  writeFileSync(join(root, 'dist/browser.d.mts'), "export * from './index.js';\n");
}
build().catch(error => { console.error(error); process.exitCode = 1; });
