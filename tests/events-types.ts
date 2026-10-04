import { HID, HybridID } from '../dist';
const generator = new HID({ machineId: 1 });
generator.on('idGenerated', id => {
    const value: HybridID = id;
    value.toBase62();
    // @ts-expect-error Event arguments are HybridID, not any.
    id.toUpperCase();
});
generator.once('idGenerated', id => {
    id.toBigInt();
    // @ts-expect-error Event arguments are HybridID, not any.
    id.toUpperCase();
});
generator.addListener('idGenerated', id => {
    id.toHex();
    // @ts-expect-error Event arguments are HybridID, not any.
    id.toUpperCase();
});
generator.prependListener('idGenerated', id => {
    id.serialize();
    // @ts-expect-error Event arguments are HybridID, not any.
    id.toUpperCase();
});
generator.prependOnceListener('idGenerated', id => {
    id.toBase32();
    // @ts-expect-error Event arguments are HybridID, not any.
    id.toUpperCase();
});
generator.on('custom', value => console.log(value));
generator.once(Symbol('custom'), value => console.log(value));
