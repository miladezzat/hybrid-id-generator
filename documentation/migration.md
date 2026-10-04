# Migration notes

## Existing default IDs

The default unmasked layout stays at 42 timestamp + 12 machine + 5 entropy + 10 random + 12 sequence bits. Existing positive IDs retain their field positions. Earlier documentation described the default as 87 bits; the implemented default is **81 bits**.

## Shorter generator name

Use `import { HID } from 'hybrid-id-generator'` for the short name. `HID` is an alias of the existing class, so `HID === HybridIDGenerator` and existing imports and `instanceof` checks continue to work. The package name remains `hybrid-id-generator`.

## Correct imports and values

Use `import { HybridIDGenerator } from 'hybrid-id-generator'` or the equivalent CommonJS named import. `nextId()` returns `HybridID`, not a JavaScript number. Use `info(id)` to inspect fields; there is no `decode()` method on the generator.

Decimal strings passed to `HybridID` now normalize to bigint. `valueOf()` returns bigint. Negative, blank, and malformed values are rejected instead of being stored unchecked. Numeric equality and ordering no longer depend on whether input was a string or bigint.

## Encoding zero and Base64 validation

Base32 and Base64 integer zero now encode as `A`, their first alphabet digit. Older encoders returned `0`: Base32 rejected it, and Base64 interpreted it as the value 52. There is no safe automatic way to distinguish a legacy Base64 zero from an actual encoded 52. Regenerate legacy zero values from their known decimal source.

Base64 integer strings of any length now round-trip through `HybridID.fromBase64()`. Empty strings, invalid digits, and `=` padding are rejected. These strings are not byte-array Base64.

## Clock changes

Monotonic timestamps now use **milliseconds**, consistently with expiry durations. Older monotonic IDs encoded truncated nanoseconds; do not mix those values with the new clock. Retain their old reader or migrate with independently stored creation timestamps. Default wall-clock IDs are unaffected.

Sequence exhaustion advances logical time by one millisecond. Clock rollback retains the last logical timestamp. Generation no longer busy-waits. Timestamp overflow throws instead of wrapping.

## Stricter configuration

Bit widths must be integers in their documented ranges; explicit zero-bit fields are honored. Numeric and environment machine IDs must be integral and in range. Environment values are no longer silently truncated or remapped. Batch size is bounded at 1,000,000. Unknown strategies and invalid expiry durations throw.

## Package and deployment

The npm package includes built outputs, declarations, README, and license. Use the package root rather than source-tree deep imports. Browser bundlers use the browser ES module; script tags use the new global bundle.

Documentation source now lives in `documentation/`, and VitePress generates `docs/` for GitHub Pages. Legacy Compodoc class/interface links redirect to the matching API pages.
