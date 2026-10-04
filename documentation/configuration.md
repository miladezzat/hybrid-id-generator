# Format and configuration

The ID stores fields in this order, from most significant to least significant:

```text
Timestamp | Machine ID | Entropy | Random | Sequence
   42     |     12     |    5    |   10   |    12     = 81 bits
```

The format has no embedded version or layout metadata. Decode an ID using the same bit widths and masking policy that generated it. Save that configuration with your application schema.

## Options

| Option | Default | Accepted values and behavior |
| --- | --- | --- |
| `timestampBits` | `42` | Integer from 1 to 64. The selected clock must fit; out-of-range values throw. |
| `machineIdBits` | `12` | Integer from 0 to 32. Maximum machine ID is `2 ** machineIdBits - 1`. |
| `sequenceBits` | `12` | Integer from 0 to 32. Determines IDs per logical millisecond. |
| `randomBits` | `10` | Integer from 0 to 32. Random component width. |
| `entropyBits` | `5` | Integer from 0 to 32. A second independently generated random field. |
| `machineId` | Random value | Numeric machine ID, or the environment variable name for the `env` strategy. |
| `machineIdStrategy` | Unset | `env`, `network`, or `random`. See [providers](./api/providers.md). |
| `useCrypto` | `false` | Boolean. Use cryptographic randomness for random and entropy fields. |
| `maskTimestamp` | `false` | Boolean. Store a truncated SHA-256 timestamp hash. Node only. |
| `enableEventEmission` | `false` | Boolean. Emit `idGenerated` after committing generator state. |
| `useWallClock` | `true` | Boolean. Use Unix milliseconds; false selects Node monotonic milliseconds. |

Zero-bit fields are allowed except for the timestamp. A zero-bit machine field requires machine ID `0`. Smaller sequence fields advance logical time sooner under load.

## Configure a generator

```ts
import { HID } from 'hybrid-id-generator';

const generator = new HID({
  machineId: 7,
  timestampBits: 42,
  machineIdBits: 12,
  sequenceBits: 12,
  randomBits: 10,
  entropyBits: 5,
  useCrypto: true,
});
console.log(generator.options);
```

`options` returns a snapshot with the resolved machine ID, last logical timestamp, current sequence, and field maxima. Mutating the snapshot does not reconfigure the generator.

## Timestamp masking

`maskTimestamp: true` hashes the logical timestamp before storing it. `info()` returns `timestamp: -1n` and `masked: true`; `isIdExpired()` returns false because the original timestamp cannot be recovered.

Truncated hashes can collide. Masking removes chronological ordering and weakens uniqueness guarantees across different logical timestamps. It does not encrypt the ID, hide every field, or turn an ID into an access token.
