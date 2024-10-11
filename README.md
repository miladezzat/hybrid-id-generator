# Hybrid ID Generator

![npm](https://img.shields.io/npm/v/hybrid-id-generator) ![npm](https://img.shields.io/npm/l/hybrid-id-generator)
![npm](https://img.shields.io/npm/dw/hybrid-id-generator)![GitHub stars](https://img.shields.io/github/stars/miladezzat/hybrid-id-generator)

The **Hybrid ID Generator** is a powerful TypeScript-based library designed to produce unique identifiers by seamlessly combining timestamps, machine identifiers, sequence numbers, and random bits. This innovative approach ensures that each generated ID is unique and highly resilient against collisions, making it ideal for distributed systems.

This package is optimized for versatility and can be effortlessly utilized in both client-side and server-side environments, offering flexibility for a wide range of applications—from web development to microservices architecture.

Whether you are building a high-performance application that requires unique identifiers for database entries or need to track events in real-time, the Hybrid ID Generator provides a reliable solution that meets your needs.

## Features
- **Unique ID Generation**: Generates unique IDs based on a combination of timestamp, machine ID, random bits, and sequence number, ensuring uniqueness across different instances.
- **Base62 Encoding/Decoding**: Supports encoding and decoding of IDs to and from Base62 format, facilitating easier storage and transmission.
- **Event Emission**: Emits events upon ID generation, allowing seamless integration with other application components and real-time tracking of ID creation.
- **ID Expiration Check**: Provides functionality to check if an ID has expired based on a specified duration, ensuring IDs are valid only for a predetermined time.
- **Timestamp Obfuscation**: Offers timestamp obfuscation to enhance security and prevent reverse engineering of ID generation.
- **ID Validation**: Includes methods to validate the format and structure of generated IDs.
- **Configuration Options**: Allows customization of parameters such as machine identifiers, sequence numbers, and random bit lengths for flexible use cases.
- **Cross-Platform Support**: Designed to work seamlessly in both client-side and server-side environments, making it versatile for various applications.

## Installation

You can install the package via npm:

```bash
npm install hybrid-id-generator
```

## Usage
**Importing the Package**
You can use the package in both CommonJS and ES Module formats:
```ts
import { HybridIDGenerator } from 'hybrid-id-generator';

const idGenerator = new HybridIDGenerator({
    machineId: 1, // Unique identifier for the machine
    randomBits: 10, // Number of random bits
});

// Generate a single ID
const uniqueId = idGenerator.nextId();
console.log(`Generated ID: ${uniqueId}`);

// Check if an ID is valid
const isValid = idGenerator.isHybridID(uniqueId);
console.log(`Is valid ID: ${isValid}`);

// Decode an ID
const decodedId = idGenerator.decode(uniqueId);
console.log(`Decoded ID:`, decodedId);
```
### Example
Here’s a quick example of how to use the HybridIDGenerator:

**Server-Side Example**
```js
import { HybridIDGenerator } from 'hybrid-id-generator';

// Initialize the ID generator with a machine identifier and configuration options.
const idGenerator = new HybridIDGenerator({
  sequenceBits: 12,
  randomBits: 10,
});

// Generate a new unique ID.
const id: number = idGenerator.nextId();
console.log(`Generated ID: ${id}`);
```

**Client-Side Example**
```js
import HybridIDGenerator from 'hybrid-id-generator'; // Adjust the path as necessary

// Initialize the ID generator with configuration options.
const idGenerator = new HybridIDGenerator({
  sequenceBits: 12,
  randomBits: 10,
  useCrypto: true, // Assuming this option is supported in your implementation
});

// Generate a new unique ID.
const newId: number = idGenerator.nextId();
console.log(`Generated ID: ${newId.toString()}`);
```

## API
# HybridIDGenerator API Documentation

## Interfaces

### HybridIDGeneratorOptions

Options for configuring the `HybridIDGenerator`.

| Property               | Type                 | Default | Description                                                                                     |
|-----------------------|----------------------|---------|-------------------------------------------------------------------------------------------------|
| `sequenceBits`        | `number`             | `12`    | The number of bits for the sequence component.                                                 |
| `randomBits`          | `number`             | `10`    | The number of bits for the random component.                                                   |
| `entropyBits`         | `number`             | `5`     | The number of bits for the entropy component.                                                  |
| `useCrypto`           | `boolean`            | `false` | Whether to use cryptographic functions for random generation.                                   |
| `maskTimestamp`       | `boolean`            | `false` | Whether to mask the timestamp during ID generation.                                           |
| `enableEventEmission` | `boolean`            | `false` | Whether to enable event emission for ID generation.                                            |
| `machineIdBits`       | `number`             | `12`    | The number of bits for the machine ID component.                                              |
| `machineIdStrategy`   | `'env' | 'network' | 'random'` | Strategy used for generating the machine ID.                                                   |
| `machineId`           | `number | string`    | -       | The initial machine ID to use (must be validated).                                            |

### HybridIDInfo

Information about the generated Hybrid ID.

| Property     | Type    | Description                                         |
|--------------|---------|-----------------------------------------------------|
| `timestamp`  | `bigint`| The timestamp portion of the Hybrid ID.            |
| `machineId`  | `number`| The machine ID portion of the Hybrid ID.           |
| `randomBits` | `number`| The random bits portion of the Hybrid ID.          |
| `sequence`   | `number`| The sequence number of the Hybrid ID.              |
| `masked`     | `boolean`| Indicates whether the timestamp is masked.         |

## Class: HybridIDGenerator

### Constructor

```typescript
constructor(options: HybridIDGeneratorOptions = {})
```
Initializes a new instance of `HybridIDGenerator` with the specified options.


### Properties
- **options**: HybridIDGeneratorOptions & { sequence: number; lastTimestamp: bigint; maxSequence: number; maxMachineId: number; }
    - Gets the current options and state of the Hybrid ID generator.

## Events
`idGenerated`

   - Emitted whenever a new ID is generated. You can listen for this event as follows:
```js
idGenerator.on('idGenerated', (id) => {
    console.log(`New ID generated: ${id}`);
});
idGenerator.nextId();
```

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.