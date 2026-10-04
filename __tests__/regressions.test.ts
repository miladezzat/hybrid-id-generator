import { HybridID, HybridIDGenerator, EnvMachineIDProvider, RandomMachineIDProvider,
    generateRandomBits, encodeBase32, decodeBase32, encodeBase62, decodeBase62,
    encodeBase64, decodeBase64 } from '../src';

const encodings = [
    { name: 'Base32', encode: encodeBase32, decode: decodeBase32, zero: 'A' },
    { name: 'Base62', encode: encodeBase62, decode: decodeBase62, zero: '0' },
    { name: 'Base64', encode: encodeBase64, decode: decodeBase64, zero: 'A' },
];

afterEach(() => jest.restoreAllMocks());

describe('integer encodings and HybridID values', () => {
    for (const { name, encode, decode, zero } of encodings) {
        test.each([0n, 1n, 31n, 63n, 64n, (1n << 81n) - 1n])(`${name} round trip: %s`, (value) => {
            const encoded = encode(value);
            expect(decode(encoded)).toBe(value);
            const id = (HybridID as any)[`from${name}`](encoded);
            expect(id.toBigInt()).toBe(value);
        });
        test(`${name} uses its alphabet for zero and rejects invalid input`, () => {
            expect(encode(0n)).toBe(zero);
            expect(() => encode(-1n)).toThrow();
            for (const value of ['', '!', '=']) expect(() => decode(value)).toThrow();
        });
    }
    test('decimal strings use numeric comparison, equality, and hex conversion', () => {
        expect(new HybridID('10').isLessThan(new HybridID('2'))).toBe(false);
        expect(new HybridID('10').isEqual(new HybridID(10n))).toBe(true);
        expect(new HybridID('255').toHex()).toBe('ff');
        expect(new HybridID('10').valueOf()).toBe(10n);
    });
    test.each([-1n, '-1', '', '1.5', '0xff'])('rejects invalid decimal ID %s', (value) => {
        expect(() => new HybridID(value)).toThrow();
    });
    test.each(['null', '{}', '{"id":1}', '{"id":false}'])('rejects malformed serialized ID %s', (value) => {
        expect(() => HybridID.deserialize(value)).toThrow();
    });
    test('serialized large IDs round trip without losing precision', () => {
        const id = new HybridID((1n << 81n) - 1n);
        expect(HybridID.deserialize(id.serialize()).isEqual(id)).toBe(true);
    });
});

describe('generator bounds and clock behavior', () => {
    test('supports explicit zero-bit components', () => {
        const generator = new HybridIDGenerator({ machineId: 0, sequenceBits: 0, randomBits: 0, entropyBits: 0, machineIdBits: 0 });
        expect(generator.options.randomBits).toBe(0);
        expect(generator.options.maxMachineId).toBe(0);
        expect(generator.info(generator.nextId()).machineId).toBe(0);
    });
    test.each(['sequenceBits', 'randomBits', 'entropyBits', 'machineIdBits', 'timestampBits'])('rejects invalid %s', (key) => {
        for (const value of [-1, 0.5, NaN, Infinity, 65]) {
            expect(() => new HybridIDGenerator({ [key]: value })).toThrow();
        }
    });
    test('supports 32-bit fields without signed integer overflow', () => {
        const generator = new HybridIDGenerator({ machineIdBits: 32, machineId: 4294967295, randomBits: 32, sequenceBits: 32 });
        expect(generator.info(generator.nextId()).machineId).toBe(4294967295);
        expect(generator.options.maxSequence).toBe(4294967295);
        jest.spyOn(Math, 'random').mockReturnValue(0.75);
        expect(generateRandomBits(32, false)).toBe(3221225472);
    });
    test.each([NaN, Infinity, 1.5, '12'])('rejects invalid explicit machine ID %s', (machineId) => {
        expect(() => new HybridIDGenerator({ machineId: machineId as any })).toThrow();
    });
    test('rejects unknown machine ID strategy', () => {
        expect(() => new HybridIDGenerator({ machineIdStrategy: 'invalid' as any })).toThrow();
    });
    test('does not reuse timestamp/sequence after a clock rollback', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0);
        const generator = new HybridIDGenerator({ machineId: 1 });
        jest.spyOn(generator, 'getTimestamp').mockReturnValueOnce(1000n).mockReturnValueOnce(999n).mockReturnValueOnce(1000n);
        const ids = [generator.nextId(), generator.nextId(), generator.nextId()];
        expect(new Set(ids.map(id => id.toString())).size).toBe(3);
        expect(ids.map(id => generator.info(id).timestamp)).toEqual([1000n, 1000n, 1000n]);
    });
    test.each([false, true])('sequence overflow is bounded, including masking=%s', (maskTimestamp) => {
        const generator = new HybridIDGenerator({ machineId: 1, sequenceBits: 1, maskTimestamp });
        let reads = 0;
        jest.spyOn(generator, 'getTimestamp').mockImplementation(() => {
            if (++reads > 8) throw new Error('Sequence overflow entered an unbounded wait');
            return 1000n;
        });
        const ids = generator.nextIds(6);
        expect(new Set(ids.map(id => id.toString())).size).toBe(6);
        expect(reads).toBe(6);
        expect(generator.options.lastTimestamp).toBe(1002n);
    });
    test('batch generation reads the clock for every ID', () => {
        const generator = new HybridIDGenerator({ machineId: 1 });
        jest.spyOn(generator, 'getTimestamp').mockReturnValueOnce(1000n).mockReturnValueOnce(1001n);
        expect(generator.nextIds(2).map(id => generator.info(id).timestamp)).toEqual([1000n, 1001n]);
    });
    test.each([NaN, Infinity, 1.5, 0, -1])('rejects invalid batch size %s', (value) => {
        expect(() => new HybridIDGenerator().nextIds(value)).toThrow();
    });
    test('timestamp exhaustion fails rather than wrapping', () => {
        jest.spyOn(Date, 'now').mockReturnValue(1024);
        expect(() => new HybridIDGenerator({ timestampBits: 10 }).nextId()).toThrow(/Timestamp/);
    });
    test('monotonic timestamps and expiry use milliseconds at long uptimes', () => {
        jest.spyOn(process.hrtime, 'bigint').mockReturnValue(12345678000000n);
        const generator = new HybridIDGenerator({ machineId: 1, useWallClock: false });
        const id = generator.nextId();
        expect(generator.info(id).timestamp).toBe(12345678n);
        expect(generator.isIdExpired(id, 1000)).toBe(false);
        jest.spyOn(process.hrtime, 'bigint').mockReturnValue(12347678000000n);
        expect(generator.isIdExpired(id, 1000)).toBe(true);
    });
    test('validates HybridID wrappers against the configured layout', () => {
        const generator = new HybridIDGenerator({ machineId: 1 });
        const outsideLayout = new HybridID(1n << 81n);
        expect(generator.isHybridID(outsideLayout)).toBe(false);
        expect(() => generator.info(outsideLayout)).toThrow('Invalid ID');
        expect(generator.isHybridID(null as any)).toBe(false);
    });
    test('fromBase62 unwraps HybridID directly instead of parsing its decimal string', () => {
        expect(new HybridIDGenerator().fromBase62(new HybridID(10n))).toBe(10n);
    });
    test('expiry rejects malformed IDs and invalid durations', () => {
        const generator = new HybridIDGenerator();
        expect(() => generator.isIdExpired(-1n, 100)).toThrow();
        for (const duration of [-1, Infinity, NaN, 1.5]) {
            expect(() => generator.isIdExpired(generator.nextId(), duration)).toThrow();
        }
    });
});

describe('cryptographic bit generation', () => {
    test('preserves all 32 bits from a deterministic crypto source', () => {
        const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
        try {
            Object.defineProperty(globalThis, 'crypto', { configurable: true, value: {
                getRandomValues: (bytes: Uint8Array) => { bytes.fill(255); return bytes; },
            } });
            expect(generateRandomBits(32, true)).toBe(4294967295);
            expect(generateRandomBits(31, true)).toBe(2147483647);
            expect(generateRandomBits(0, true)).toBe(0);
        } finally {
            if (original) Object.defineProperty(globalThis, 'crypto', original);
            else delete (globalThis as any).crypto;
        }
    });
});

describe('machine providers', () => {
    test.each(['12oops', '1.5', '9007199254740992'])('rejects malformed environment value %s', (value) => {
        const original = process.env.HYBRID_REGRESSION_MACHINE_ID;
        try {
            process.env.HYBRID_REGRESSION_MACHINE_ID = value;
            expect(() => new EnvMachineIDProvider('HYBRID_REGRESSION_MACHINE_ID').getMachineId()).toThrow();
        } finally {
            if (original === undefined) delete process.env.HYBRID_REGRESSION_MACHINE_ID;
            else process.env.HYBRID_REGRESSION_MACHINE_ID = original;
        }
    });
    test('rejects an environment machine ID outside configured range without silently remapping', () => {
        const original = process.env.HYBRID_REGRESSION_MACHINE_ID;
        try {
            process.env.HYBRID_REGRESSION_MACHINE_ID = '8';
            expect(() => new HybridIDGenerator({ machineIdBits: 3, machineIdStrategy: 'env', machineId: 'HYBRID_REGRESSION_MACHINE_ID' })).toThrow();
        } finally {
            if (original === undefined) delete process.env.HYBRID_REGRESSION_MACHINE_ID;
            else process.env.HYBRID_REGRESSION_MACHINE_ID = original;
        }
    });
    test.each([-1, 1.5, NaN, Infinity, 4294967296])('rejects invalid random machine ID maximum %s', (value) => {
        expect(() => new RandomMachineIDProvider(value)).toThrow();
    });
});
