# Hybrid ID Generator

![npm](https://img.shields.io/npm/v/hybrid-id-generator) ![npm](https://img.shields.io/npm/l/hybrid-id-generator)

A TypeScript-based Hybrid ID Generator that produces unique IDs combining timestamps, machine identifiers, sequences, and random bits. This package is designed for both client-side and server-side use.

Read more about this package on [This](./purpose.md)

## Features

- Generates unique IDs based on timestamp, machine ID, random bits, and sequence number.
- Supports encoding and decoding of IDs to/from Base62 format.
- Emits events upon ID generation.
- Checks if an ID has expired based on a specified duration.

## Installation

You can install the package via npm:

```bash
npm install hybrid-id-generator
```

## Usage
**Importing the Package**
You can use the package in both CommonJS and ES Module formats:
    - CommonJS
  ```js
  const HybridIDGenerator = require('hybrid-id-generator');
  ```
    - ES Module
  ```ts
  import HybridIDGenerator from 'hybrid-id-generator';
  ```
### Example
Here’s a quick example of how to use the HybridIDGenerator:

**Server-Side Example**
```js
const HybridIDGenerator = require('hybrid-id-generator');

const idGenerator = new HybridIDGenerator(512, { sequenceBits: 12, randomBits: 10 });

const id = idGenerator.nextId();
console.log(`Generated ID: ${id}`);

const base62Id = idGenerator.toBase62(id);
console.log(`Base62 Encoded ID: ${base62Id}`);

const decodedId = idGenerator.fromBase62(base62Id);
console.log(`Decoded ID: ${decodedId}`);

const isExpired = idGenerator.isIdExpired(id, 1000);
console.log(`Is ID expired? ${isExpired}`);
```

**Client-Side Example**
```js
import HybridIDGenerator from 'hybrid-id-generator'; // Adjust the path as necessary

const idGenerator = new HybridIDGenerator(512, { useCrypto: true });

const newId = idGenerator.nextId();
console.log(`Generated ID: ${newId.toString()}`);

const base62Id = idGenerator.toBase62(newId);
console.log(`Base62 Encoded ID: ${base62Id}`);

const decodedId = idGenerator.fromBase62(base62Id);
console.log(`Decoded ID: ${decodedId}`);

const isExpired = idGenerator.isIdExpired(newId, 1000);
console.log(`Is ID expired? ${isExpired}`);
```

## API
1. `constructor(machineId: number, options?: Object)`
   - `machineId`: A number between 0 and 1023.
   - `options`: Optional configuration object.
     - `sequenceBits`: Number of bits for the sequence (default: 12).
     - `randomBits`: Number of bits for the random part (default: 10).
2. `nextId(): number`
   - Generates and returns a unique ID.
3. `toBase62(id: number): string`
   - Converts the given ID to a Base62 encoded string.
4. `fromBase62(encodedId: string): number`
   - Decodes a Base62 encoded string back to the original ID.
5. `isIdExpired(id: number, expiryDurationInMillis: number): boolean`
   - Checks if the given ID has expired based on the provided duration in milliseconds.

## Events
`idGenerated`

   - Emitted whenever a new ID is generated. You can listen for this event as follows:
```js
idGenerator.on('idGenerated', (id) => {
    console.log(`New ID generated: ${id}`);
});
```

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.