# Changelog

## 3.2.0 (unreleased)

- Add `HID` as a compatible named alias of `HybridIDGenerator`, with identical constructor and instance behavior.

- Replace Compodoc with organized VitePress guides, API reference, local search, mobile navigation, and legacy link redirects; retain the development/docs GitHub Pages deployment.
- Fix Base32/Base64 zero encoding, Base64 round trips, invalid encoding input, numeric string comparison, serialization validation, and HybridID wrapper validation.
- Honor zero-bit fields, support 32-bit fields without signed overflow, and validate options, batches, machine IDs, and expiry durations.
- Eliminate clock and masked sequence-overflow busy-waits; retain logical time during rollback and read the clock for every batch ID.
- Use milliseconds consistently for monotonic generation and expiry; reject timestamp overflow instead of truncating it.
- Add native Node ES module and bundled browser ES module/global entries, TypeScript package metadata, and installed-package/browser checks.
- Upgrade development dependencies and use npm trusted publishing with a version gate and registry propagation verification.

See the migration guide for stricter validation, zero encodings, monotonic ID compatibility, and logical clock behavior.


All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [3.1.2](https://github.com/miladezzat/hybrid-id-generator/compare/v3.1.1...v3.1.2) (2026-01-31)

### [3.1.1](https://github.com/miladezzat/hybrid-id-generator/compare/v3.0.6...v3.1.1) (2026-01-31)

### [3.0.6](https://github.com/miladezzat/hybrid-id-generator/compare/v3.0.5...v3.0.6) (2026-01-31)

### [3.0.5](https://github.com/miladezzat/hybrid-id-generator/compare/v3.0.4...v3.0.5) (2026-01-31)

### [3.0.4](https://github.com/miladezzat/hybrid-id-generator/compare/v3.0.3...v3.0.4) (2026-01-31)


### Bug Fixes

* timestamp default, machine ID providers, entropy, validation, browser support; README comparison and release docs ([1ffe1de](https://github.com/miladezzat/hybrid-id-generator/commit/1ffe1deb04b79e172af356dce020899e16b620d1))

### [3.0.3](https://github.com/miladezzat/hybrid-id-generator/compare/v3.0.2...v3.0.3) (2024-10-11)

### [3.0.2](https://github.com/miladezzat/hybrid-id-generator/compare/v3.0.1...v3.0.2) (2024-10-11)


### Bug Fixes

* 🐛 resolve issue with nextId with this.emit ([dc7576c](https://github.com/miladezzat/hybrid-id-generator/commit/dc7576ccaec64065fb967898902daa0835d014ce))

### [3.0.1](https://github.com/miladezzat/hybrid-id-generator/compare/v3.0.0...v3.0.1) (2024-10-11)

## [3.0.0](https://github.com/miladezzat/hybrid-id-generator/compare/v2.4.0...v3.0.0) (2024-10-11)

## 2.4.0 (2024-10-11)


### Features

* 🎸 add info method to get the id info ,fix isValidateId ([2d528af](https://github.com/miladezzat/hybrid-id-generator/commit/2d528af2c2265c4bf5ea7ae18d4bb926f86b9798))
* 🎸 Update the generate id functionality to extend it ([12e122f](https://github.com/miladezzat/hybrid-id-generator/commit/12e122fe5b5e439f486e5d5e197109d3af52deae))


### Bug Fixes

* test ([5453f04](https://github.com/miladezzat/hybrid-id-generator/commit/5453f0472f499ae02b16a944efae0dbced9fb466))
* timestamp ([f497a81](https://github.com/miladezzat/hybrid-id-generator/commit/f497a81fc3bdaa7ff1ce1435e5e6003a0a595935))
