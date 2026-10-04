import { HID, HybridID } from '../src';

test('listener registration infers HybridID and preserves event behavior', () => {
    const generator = new HID({ machineId: 1, enableEventEmission: true });
    const persistent: HybridID[] = [];
    const once: HybridID[] = [];
    generator.on('idGenerated', id => {
        persistent.push(id);
        if (false) {
            // @ts-expect-error Generated IDs are not strings.
            id.toUpperCase();
        }
    });
    generator.once('idGenerated', id => once.push(id));
    generator.addListener('idGenerated', id => id.toBase62());
    generator.prependListener('idGenerated', id => id.toBigInt());
    generator.prependOnceListener('idGenerated', id => id.toHex());
    const ids = generator.nextIds(2);
    expect(persistent).toEqual(ids);
    expect(once).toEqual([ids[0]]);
    const custom = jest.fn();
    generator.on('custom', custom);
    generator.emit('custom', 42);
    expect(custom).toHaveBeenCalledWith(42);
    const symbol = Symbol('custom');
    generator.once(symbol, custom);
    generator.emit(symbol, 'symbol value');
    expect(custom).toHaveBeenLastCalledWith('symbol value');
});
