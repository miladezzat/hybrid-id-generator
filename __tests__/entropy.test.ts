import { HID } from '../src';

afterEach(() => jest.restoreAllMocks());

test.each([
    [0, 0],
    [3, 6],
    [32, 3221225472],
])('exposes the entropy field with width %s', (entropyBits, expected) => {
    jest.spyOn(Math, 'random').mockReturnValue(0.75);
    const generator = new HID({ machineId: 7, entropyBits, randomBits: 2, sequenceBits: 1 });
    const id = generator.nextId();
    for (const input of [id, id.toBigInt(), id.toBase62()]) {
        const info = generator.info(input);
        expect(info.entropy).toBe(expected);
        expect(info.randomBits).toBe(3);
        expect(info.machineId).toBe(7);
        expect(info.sequence).toBe(0);
    }
});

test('entropy remains inspectable with masked timestamps', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.75);
    const generator = new HID({ machineId: 1, entropyBits: 3, maskTimestamp: true });
    const info = generator.info(generator.nextId());
    expect(info.entropy).toBe(6);
    expect(info.masked).toBe(true);
    expect(info.timestamp).toBe(-1n);
});
