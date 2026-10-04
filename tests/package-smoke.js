const assert = require('node:assert/strict');
const { HID, HybridIDGenerator, HybridID, encodeBase64, decodeBase64, RandomMachineIDProvider } = require('../dist');
assert.equal(HID, HybridIDGenerator);
const generator = new HID({ machineId: 1, useCrypto: true });
const eventGenerator = new HID({ machineId: 1, enableEventEmission: true });
let emitted;
eventGenerator.once('idGenerated', id => { emitted = id; });
assert.equal(eventGenerator.nextId(), emitted);
const ids = generator.nextIds(10000);
assert.equal(new Set(ids.map(id => id.toString())).size, ids.length);
assert.equal(generator.info(ids[0]).machineId, 1);
assert.ok(Number.isInteger(generator.info(ids[0]).entropy));
assert.equal(HybridID.fromBase62(ids[0].toBase62()).toBigInt(), ids[0].toBigInt());
assert.equal(HybridID.fromBase64(ids[0].toBase64()).toBigInt(), ids[0].toBigInt());
assert.equal(decodeBase64(encodeBase64(0n)), 0n);
assert.equal(HybridID.deserialize(ids[0].serialize()).isEqual(ids[0]), true);
assert.ok(new RandomMachineIDProvider(7).getMachineId() <= 7);
assert.equal(Array.from(generator.iterateIds(3)).length, 3);
console.log('Built package smoke checks passed');
require('node:child_process').execFileSync(process.execPath, [
  require.resolve('typescript/bin/tsc'), '--target', 'ES2020', '--module', 'Node16',
  '--moduleResolution', 'Node16', '--strict', '--types', 'node', '--noEmit',
  require('node:path').join(__dirname, 'events-types.ts'),
], { stdio: 'inherit' });
