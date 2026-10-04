# Encoding and storage

Keep IDs as `HybridID` objects or `bigint` in memory. For JSON or database transport, use strings; direct JSON serialization of a JavaScript bigint throws.

## Round-trip an ID

```ts
import { HybridID } from 'hybrid-id-generator';

const id = new HybridID('123456789012345678901234');
const restored = HybridID.fromBase62(id.toBase62());
console.log(restored.isEqual(id)); // true
console.log(HybridID.deserialize(id.serialize()).toString());
```

## Alphabets

| Encoding | Alphabet | Encoded zero |
| --- | --- | --- |
| Base62 | `0-9`, `a-z`, `A-Z` | `0` |
| Base32 | `A-Z`, `2-7` | `A` |
| Base64 | `A-Z`, `a-z`, `0-9`, `+`, `/` | `A` |

These are **positional integer encodings**. Base32 and Base64 use familiar alphabets, but they do not encode a byte array using RFC 4648. They have variable-length digits and no `=` padding. Use the matching package decoder, not `atob()` or `Buffer.from(text, 'base64')`.

All decoders reject empty strings and invalid characters. Encoders reject negative integers. Base62 is convenient for URL paths; Base64 includes `/` and `+`, so URL-encode it when needed.

## Strings have different meanings

`new HybridID('123')` interprets its input as **decimal**. `generator.info('123')` interprets a string as **Base62**. Make conversions explicit:

```ts
const decimalID = new HybridID('123');
const base62ID = HybridID.fromBase62('123');
```

## Storage and comparison

The default 81-bit ID cannot fit a signed 64-bit database integer. Store decimal text, encoded text, binary data, or a sufficiently large numeric column. Size the column for your configured widths.

Use `isEqual()`, `isLessThan()`, or `isGreaterThan()` for numeric comparison. String sorting, including decimal strings of different lengths, does not match numeric order.

`serialize()` returns a JSON string containing `{ "id": "decimal digits" }`. `deserialize()` validates the string field and retains bigint precision.
