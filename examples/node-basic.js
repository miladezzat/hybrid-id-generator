const { HID, HybridID } = require('../dist');
const generator = new HID({ machineId: 1, useCrypto: true });
const id = generator.nextId();
const stored = id.toBase62();
console.log('Base62:', stored);
console.log('Fields:', generator.info(id));
console.log('Expired:', generator.isIdExpired(id, 60_000));
console.log('Round trip:', HybridID.fromBase62(stored).isEqual(id));
