# Node.js and browsers

CI checks Node.js 22 and 24. Browser builds require BigInt support and ES2020. Cryptographic randomness requires Web Crypto in a secure context.

## Node.js

```js
const { HID } = require('hybrid-id-generator');
const generator = new HID({ machineId: 1 });
console.log(generator.nextId().toBase62());
```

Node also supports named ES imports. Environment/network machine strategies, timestamp masking, and monotonic clocks use Node APIs.

## Browser bundlers

```ts
import { HID } from 'hybrid-id-generator';
const generator = new HID({ machineId: 1, useCrypto: true });
document.body.textContent = generator.nextId().toBase62();
```

The package's `browser` export provides a bundled ES module with event support. Node built-ins are isolated so you do not need crypto, OS, or event polyfills in your application.

## Script tag

For production, pin your package version:

```html
<script src="https://cdn.jsdelivr.net/npm/hybrid-id-generator@3.2.0/dist/hybrid-id-generator.global.js"></script>
<script>
  const { HID } = HybridIDGeneratorLib;
  const generator = new HID({ machineId: 1, useCrypto: true });
  document.body.textContent = generator.nextId().toBase62();
</script>
```

The CDN example becomes available after version 3.2.0 is published. See the [release guide](./releasing.md).

## Feature support

| Feature | Node | Browser |
| --- | --- | --- |
| Explicit/random numeric machine ID | Yes | Yes |
| Base32/Base62/Base64 and serialization | Yes | Yes |
| `idGenerated` events | Yes | Yes |
| Cryptographic random fields | Node crypto or Web Crypto | Web Crypto in a secure context |
| Environment/network machine strategy | Yes | Throws a Node-required error |
| Timestamp masking | Yes | Throws a Node-required error |
| Monotonic clock | Yes | Throws a Node-required error |

When `useCrypto: true`, missing cryptographic support throws instead of silently using `Math.random()`. A separate `RandomMachineIDProvider` also requires a cryptographic source. `HybridID.generateRandom()` returns only a random 32-bit value; it does not produce the generator's full layout.
