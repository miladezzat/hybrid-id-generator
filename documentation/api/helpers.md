# Utilities and types

## Integer encoding helpers

These named exports accept non-negative bigint values or decimal strings and return integer digit strings:

```ts
encodeBase62(input: bigint | string): string
encodeBase32(input: bigint | string): string
encodeBase64(input: bigint | string): string
```

Their decoders accept a non-empty string in the corresponding alphabet and return bigint:

```ts
decodeBase62(encoded: string): bigint
decodeBase32(encoded: string): bigint
decodeBase64(encoded: string): bigint
```

Invalid characters and negative integers throw. The named `utils` export groups these functions with the helpers below.

## generateRandomBits

`generateRandomBits(randomBits: number, useCrypto: boolean): number` accepts an integer bit width from 0 to 32. A zero-width field returns zero. Other widths return values in `[0, 2 ** randomBits)`.

With `useCrypto: false`, it uses `Math.random()`. With true, it uses Web Crypto or Node crypto and throws if neither is available.

## obfuscateTimestamp

`obfuscateTimestamp(timestamp: bigint): bigint` hashes the decimal timestamp with SHA-256 and returns the first 64 hash bits. The generator truncates that value to its configured timestamp width. Node only; this is irreversible hashing, with possible truncation collisions.

## validateMachineId

`validateMachineId(strategy: string | undefined, machineId: number | string | undefined, maxMachineId: number): number` resolves numeric machine IDs for the generator. Omitted strategy and ID select a random value; explicit values and the `random` strategy require an integer in the configured range. `env` and `network` are resolved separately through providers.

## HybridIDGeneratorOptions

The exported options interface is documented in the [configuration table](../configuration.md#options).

## HybridIDInfo

```ts
interface HybridIDInfo {
  timestamp: bigint;
  machineId: number;
  randomBits: number;
  entropy: number;
  sequence: number;
  masked: boolean;
}
```

## MachineIDStrategy and MachineIDProvider

```ts
type MachineIDStrategy = 'env' | 'network' | 'random' | undefined;
interface MachineIDProvider { getMachineId(): number; }
```

`MachineIDProvider` is a TypeScript interface, not a runtime class. See [providers](./providers.md) for runtime constructors.
