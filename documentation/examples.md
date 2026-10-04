# Examples

Build the package before running the repository examples:

```bash
npm ci
npm run build
node examples/node-basic.js
```

## Generate and store

<<< ../examples/node-basic.js

Use a unique database constraint on the persisted ID. Decide how your application retries a collision or handles generator restarts.

## Emit events

```ts
import { HID } from 'hybrid-id-generator';

const generator = new HID({ machineId: 2, enableEventEmission: true });
generator.on('idGenerated', id => console.log(id.toString()));
generator.nextIds(3);
```

Events fire synchronously, after the generator commits its timestamp/sequence state. Exceptions thrown by event listeners propagate to the caller. A failed batch may already have generated IDs and emitted events.

## Use an environment machine ID

```bash
MACHINE_ID=42 node examples/node-basic.js
```

To read that value in your own code:

```ts
const generator = new HID({
  machineIdStrategy: 'env',
  machineId: 'MACHINE_ID',
});
```

## Browser example

Serve the repository over localhost and open `examples/browser-basic.html`. Its script uses the built global bundle, so no CDN or polyfill is required.

```bash
python3 -m http.server 3103
```

[Runtime compatibility](./compatibility.md) covers bundler and CDN setup.
