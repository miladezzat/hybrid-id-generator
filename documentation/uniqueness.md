# Uniqueness and clocks

## Within one generator

An unmasked generator never reuses its timestamp/sequence pair while that instance remains alive. When the clock moves backwards, it retains the last logical timestamp and advances the sequence. When sequence capacity is exhausted, it advances logical time by one millisecond.

This avoids blocking the event loop while waiting for the physical clock. A fixed or heavily loaded clock can leave the logical timestamp ahead of real time. Expiry uses the physical clock, so such IDs start aging when real time catches up. A timestamp that cannot fit the configured field throws instead of wrapping.

Random and entropy fields sit above the sequence field. IDs in the same millisecond are **not guaranteed to increase numerically**. The timestamp groups IDs chronologically; the random fields also prevent Base62 strings from being a reliable lexicographic time index.

## Across generators and restarts

Assign unique machine IDs to concurrent instances and ensure your deployment does not duplicate assignments. Machine IDs derived from network interfaces are hashes and can collide. Random selection cannot guarantee unique assignments.

The library does not persist generator state. Restarting a generator with the same machine ID can reuse timestamp/sequence pairs. Random bits reduce collision probability but do not eliminate it. Use a unique database constraint and application retry policy when absolute uniqueness matters.

## Wall-clock and monotonic time

The default uses Unix milliseconds from `Date.now()`. The 42-bit default timestamp stores values through `2 ** 42 - 1` milliseconds since the epoch.

`useWallClock: false` uses Node's `process.hrtime.bigint()` converted to milliseconds. Its origin is not a portable creation date. Do not mix clocks, decode monotonic IDs as dates, or compare their age on another host. [Migration notes](./migration.md) cover older nanosecond-based IDs.

## Choosing a standard

| Requirement | Hybrid ID |
| --- | --- |
| Custom machine field | Configurable, 12 bits by default |
| Storage size | 81 bits by default; exceeds a 64-bit integer |
| Standard UUID format | Custom integer format; not a UUID |
| Creation time and age | Wall-clock IDs with masking disabled |
| Portable layout discovery | Keep configuration separately |
| Authorization or secret tokens | Use application authorization and a separate secret-token design |

Choose a standard UUID when required by your database, tooling, or interoperability contract.
