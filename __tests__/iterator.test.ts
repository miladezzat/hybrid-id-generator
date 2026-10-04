import { HID } from '../src';

test.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('validates count eagerly: %s', count => {
    expect(() => new HID({ machineId: 1 }).iterateIds(count)).toThrow(/positive safe integer/);
});

test('a large iterator generates only consumed IDs and can stop early', () => {
    const generator = new HID({ machineId: 1 });
    const next = jest.spyOn(generator, 'nextId');
    const ids = generator.iterateIds(Number.MAX_SAFE_INTEGER);
    expect(next).not.toHaveBeenCalled();
    expect(generator.options.lastTimestamp).toBe(-1n);
    expect(ids.next().value.toBigInt()).toBeGreaterThanOrEqual(0n);
    expect(next).toHaveBeenCalledTimes(1);
    ids.return?.();
    expect(ids.next().done).toBe(true);
    expect(next).toHaveBeenCalledTimes(1);
});

test('interleaved iterators and nextId share clock, sequence, and events', () => {
    const generator = new HID({ machineId: 1, enableEventEmission: true, sequenceBits: 1 });
    jest.spyOn(generator, 'getTimestamp').mockReturnValue(1000n);
    const emitted: string[] = [];
    generator.on('idGenerated', id => emitted.push(id.toString()));
    const first = generator.iterateIds(2);
    const second = generator.iterateIds(2);
    const ids = [first.next().value, second.next().value, generator.nextId(), first.next().value, second.next().value];
    expect(new Set(ids.map(id => id.toString())).size).toBe(5);
    expect(emitted).toEqual(ids.map(id => id.toString()));
    expect(ids.map(id => generator.info(id).timestamp)).toEqual([1000n, 1000n, 1001n, 1001n, 1002n]);
    expect(first.next().done).toBe(true);
    expect(second.next().done).toBe(true);
});

test('lazy generation reads the clock when each item is requested', () => {
    const generator = new HID({ machineId: 1 });
    const clock = jest.spyOn(generator, 'getTimestamp').mockReturnValueOnce(1000n).mockReturnValueOnce(1001n);
    const ids = generator.iterateIds(2);
    expect(clock).not.toHaveBeenCalled();
    expect(generator.info(ids.next().value).timestamp).toBe(1000n);
    expect(generator.info(ids.next().value).timestamp).toBe(1001n);
});
