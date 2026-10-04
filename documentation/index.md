---
layout: home
hero:
  name: Hybrid ID Generator
  text: Compact IDs.<br>Explicit machine fields.
  tagline: Generate configurable bigint identifiers in Node.js and browsers. Encode them for URLs, inspect their fields, and check their age.
  image:
    src: /id-layout.svg
    alt: The default 81-bit ID layout
  actions:
    - theme: brand
      text: Get started
      link: /getting-started
    - theme: alt
      text: Explore the API
      link: /api/generator
features:
  - title: Choose your layout
    details: Allocate timestamp, machine, random, entropy, and sequence fields. Defaults use 81 bits, with 4,096 machine values.
    link: /configuration
    linkText: See the format
  - title: Store without precision loss
    details: Keep the bigint in memory. Use decimal strings, Base62, Base32, or Base64 integer digits for transport and storage.
    link: /encoding
    linkText: Choose an encoding
  - title: Understand the guarantees
    details: Sequence state handles clock rollback and overflow within one generator. Coordinate machine IDs and account for process restarts.
    link: /uniqueness
    linkText: Read the guarantees
  - title: Node.js and browsers
    details: CommonJS for Node, an ES module for bundlers, and a browser global for script tags. No runtime npm dependencies.
    link: /compatibility
    linkText: Pick your runtime
---

## Generate an ID

```ts
import { HID } from 'hybrid-id-generator';

const generator = new HID({ machineId: 1, useCrypto: true });
const id = generator.nextId();
console.log(id.toBase62());
console.log(generator.info(id));
```

Use a distinct machine ID for each concurrent generator. The format is custom; choose a standard UUID when your storage or integrations require UUID compatibility. IDs identify records; application authorization controls access to them.
