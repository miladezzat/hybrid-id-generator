# Getting started

Install the package in your Node.js application or browser bundler:

```bash
npm install hybrid-id-generator
```

## Generate and inspect

```ts
import { HID, HybridID } from 'hybrid-id-generator';

const generator = new HID({ machineId: 1, useCrypto: true });
const id: HybridID = generator.nextId();
const text = id.toBase62();

console.log(text);
console.log(generator.info(id));
console.log(generator.isIdExpired(id, 60_000));
console.log(HybridID.fromBase62(text).isEqual(id));
```

`nextId()` returns a `HybridID` object. Use `toBigInt()` for arithmetic or `toString()` for a decimal representation. Avoid converting IDs to JavaScript `number`: the default layout exceeds its exact integer range.

## CommonJS

```js
const { HID } = require('hybrid-id-generator');
const generator = new HID({ machineId: 1 });
console.log(generator.nextId().toString());
```

`HID` is an alias of `HybridIDGenerator`: both exports refer to the same class. Existing imports keep working. The package root uses **named exports**. There is no package-root default export.

## Plan machine IDs

Assign a different `machineId` to each active generator that shares your ID namespace. The default 12-bit field accepts integers from `0` through `4095`.

When omitted, the generator selects a random machine ID once. This is convenient for experimentation, but independent generators can pick the same machine value. See [uniqueness and clocks](./uniqueness.md) before using the package in a distributed system.

## Next steps

- [Browser setup](./compatibility.md#browser-bundlers)
- [Runnable examples](./examples.md)
- [Configure the layout](./configuration.md)
- [Complete generator API](./api/generator.md)
