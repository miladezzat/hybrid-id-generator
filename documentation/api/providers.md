# Machine ID providers

The package exports the `MachineIDProvider` interface and three provider classes. A provider implements `getMachineId(): number`.

## EnvMachineIDProvider

`new EnvMachineIDProvider(envVarName = 'MACHINE_ID')` reads a Node environment variable and caches its numeric value. Values must contain decimal digits and fit a non-negative safe integer. A generator additionally checks that the value fits `machineIdBits`; explicit environment IDs are never silently remapped.

```ts
import { EnvMachineIDProvider } from 'hybrid-id-generator';
const provider = new EnvMachineIDProvider('MACHINE_ID');
console.log(provider.getMachineId());
```

Missing or malformed values throw. This provider requires Node.js.

## NetworkMachineIDProvider

`new NetworkMachineIDProvider(interfaceName?: string)` chooses a non-zero MAC address from a named interface or the available interfaces. It converts the MAC to an integer modulo 1024 and caches the result. Missing usable interfaces throw.

The generator folds this hash into smaller machine fields when needed. Network hashes can collide across hosts; coordinate assignments if you need distinct values. Node only.

## RandomMachineIDProvider

`new RandomMachineIDProvider(maxMachineId = 1023)` accepts an integer from `0` through `4294967295`. Each `getMachineId()` call draws a new cryptographic value from `0` through that maximum, using rejection sampling to avoid modulo bias.

The provider does not cache or coordinate machine IDs. The generator's default random selection chooses a value once at construction; it is separate from this exported provider.

## MachineIDProviderFactory

`MachineIDProviderFactory.createMachineIDProvider(strategy, value?)` constructs a provider:

| Strategy | Optional value |
| --- | --- |
| `env` | Environment variable name; defaults to `MACHINE_ID` |
| `network` | Unused; uses available interfaces |
| `random` | Maximum machine ID; defaults to `1023` |

The generator preserves the existing `machineIdStrategy: 'random'` behavior: it requires a numeric `machineId` and uses that value as its resolved machine ID. To request automatic machine selection in a generator, omit both strategy and machine ID.
