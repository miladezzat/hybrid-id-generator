import { HID, encodeBase62, decodeBase62 } from '../src';
import * as utils from '../src/utils';

afterEach(() => jest.restoreAllMocks());

test('oversized generator inputs never reach bigint decoding', () => {
    const generator = new HID({ machineId: 1 });
    const decode = jest.spyOn(utils, 'decodeBase62');
    const input = 'Z'.repeat(200_000);
    expect(generator.isHybridID(input)).toBe(false);
    expect(generator.validateID(input)).toEqual({ valid: false, reason: 'Invalid Hybrid ID' });
    expect(() => generator.info(input)).toThrow('Invalid ID');
    expect(decode).not.toHaveBeenCalled();
});

test.each([
    { machineId: 0, timestampBits: 1, machineIdBits: 0, entropyBits: 0, randomBits: 0, sequenceBits: 0 },
    { machineId: 1 },
    { machineId: 0, timestampBits: 64, machineIdBits: 32, entropyBits: 32, randomBits: 32, sequenceBits: 32 },
])('accepts layout boundaries and rejects the next integer', options => {
    const generator = new HID(options);
    const state = generator.options;
    const bits = state.timestampBits + state.machineIdBits! + state.entropyBits! + state.randomBits! + state.sequenceBits!;
    const maximum = (1n << BigInt(bits)) - 1n;
    expect(generator.isHybridID(encodeBase62(maximum))).toBe(true);
    expect(generator.isHybridID(encodeBase62(maximum + 1n))).toBe(false);
    expect(generator.info('0'.repeat(200_000) + encodeBase62(maximum)).timestamp).toBe(state.maxTimestamp);
    expect(generator.info('0'.repeat(200_000)).timestamp).toBe(0n);
});

test('retains invalid-input behavior and decodes valid info only once', () => {
    const generator = new HID({ machineId: 1 });
    for (const value of ['', '000!', '-1', ' 0']) expect(generator.isHybridID(value)).toBe(false);
    const text = generator.nextId().toBase62();
    const decode = jest.spyOn(utils, 'decodeBase62');
    expect(generator.info(text).machineId).toBe(1);
    expect(decode).toHaveBeenCalledTimes(1);
});

test('general-purpose encoding remains unrestricted by generator layout', () => {
    const value = (1n << 4096n) - 1n;
    expect(decodeBase62(encodeBase62(value))).toBe(value);
});
