# HybridID

`HybridID` wraps a non-negative bigint. Decimal strings are normalized immediately, so comparison and hexadecimal conversion use integer semantics.

## constructor

`new HybridID(id: bigint | string)` accepts a non-negative bigint or a decimal digit string. Negative values, blank strings, hexadecimal strings, and fractional values throw.

## Conversions

| Method | Result |
| --- | --- |
| `toBigInt(): bigint` | Raw integer |
| `toString(): string` | Decimal digits |
| `valueOf(): bigint` | Raw integer for numeric coercion |
| `toHex(): string` | Hex digits without a prefix |
| `toBase62(): string` | Base62 integer digits |
| `toBase32(): string` | Base32 integer digits |
| `toBase64(): string` | Base64 integer digits, without padding |

See [encoding and storage](../encoding.md) for alphabets and precision rules.

## Factories

`HybridID.fromBase62(text)`, `fromBase32(text)`, `fromBase64(text)`, and `fromHex(text)` each return a new `HybridID` and reject empty or invalid input. `fromHex` expects digits without a `0x` prefix.

## Comparison

`isEqual(other)`, `isLessThan(other)`, and `isGreaterThan(other)` compare underlying numeric values and return booleans. They work consistently whether IDs were constructed from bigint values or decimal strings.

## Validation

`HybridID.isValidBase62(text)`, `isValidBase32(text)`, and `isValidBase64(text)` check non-empty strings against the corresponding integer alphabet. `=` padding is not allowed. These helpers check syntax, without checking a generator's configured layout.

## serialize

`serialize(): string` returns JSON with a decimal string ID, such as `'{"id":"123"}'`.

## deserialize

`HybridID.deserialize(serialized: string): HybridID` parses JSON and validates the `id` string. Malformed JSON, missing IDs, non-string values, and invalid decimal values throw.

## generateRandom

`HybridID.generateRandom(): HybridID` uses cryptographic randomness to produce a **32-bit** random value. This helper has a much smaller collision space than a full generator ID and does not encode the timestamp/machine layout.
