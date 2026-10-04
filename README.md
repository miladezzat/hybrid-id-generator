# Hybrid ID Generator

[![npm version](https://img.shields.io/npm/v/hybrid-id-generator)](https://www.npmjs.com/package/hybrid-id-generator)
[![MIT license](https://img.shields.io/npm/l/hybrid-id-generator)](LICENSE)

Configurable bigint identifiers with a timestamp, machine ID, random fields, and sequence number. Supports Node.js and bundled browser builds, integer encodings, events, and ID age checks.

**[Documentation](https://miladezzat.github.io/hybrid-id-generator/)** · **[API reference](https://miladezzat.github.io/hybrid-id-generator/api/generator.html)** · **[Migration notes](documentation/migration.md)**

```bash
npm install hybrid-id-generator
```

```ts
import { HID, HybridID } from 'hybrid-id-generator';

const generator = new HID({ machineId: 1, useCrypto: true });
const id: HybridID = generator.nextId();

console.log(id.toBase62());
console.log(generator.info(id));
console.log(generator.isIdExpired(id, 60_000));
```

CommonJS uses `const { HID } = require('hybrid-id-generator')`. The package root has named exports. IDs are `HybridID` objects, not JavaScript numbers; use bigint or strings to retain precision.

The default format is **81 bits**: timestamp 42 + machine 12 + entropy 5 + random 10 + sequence 12. Assign distinct machine IDs to concurrent generators. Sequence state prevents timestamp/sequence reuse within an unmasked instance; restarts, duplicate machine assignments, and timestamp masking need application-level collision handling. See [uniqueness and clocks](documentation/uniqueness.md).

Base32/Base64 use positional integer alphabets without byte padding. Use the package decoders. IDs are identifiers; application authorization controls access to records.

## Development

```bash
npm ci
npx playwright install chromium
npm run verify
```

`npm run docs:serve` previews the VitePress source. `npm run docs` builds `documentation/.vitepress/dist/`. GitHub Actions builds, tests, and deploys that artifact from `main`; generated files do not need to be committed.

npm publishing runs on `main` using a configured npm trusted publisher, with a version gate and post-publish registry verification. See [releasing and deployment](documentation/releasing.md).

MIT License · Milad Fahmy
