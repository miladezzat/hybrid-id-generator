import HybridIDGenerator from '../src'; // Adjust the path as needed

jest.useFakeTimers();

describe('HybridIDGenerator', () => {
    let idGenerator: HybridIDGenerator;

    beforeEach(() => {
        idGenerator = new HybridIDGenerator(512);
    });

    afterEach(() => {
        jest.restoreAllMocks(); // Restore original hrtime
    });

    test('should generate IDs with correct format', () => {
        const newId = idGenerator.nextId();
        expect(typeof newId).toBe('bigint'); // Ensure ID is a bigint
    });

    test('should correctly encode and decode Base62 IDs', () => {
        const originalId = idGenerator.nextId();
        const base62Id = idGenerator.toBase62(originalId);
        const decodedId = idGenerator.fromBase62(base62Id);
        expect(originalId).toBe(decodedId); // Ensure original ID is same as decoded ID
    });

    test('should generate unique IDs', () => {
        const id1 = idGenerator.nextId();
        const id2 = idGenerator.nextId();
        expect(id1).not.toBe(id2); // Ensure the IDs are unique
    });

    test('should handle sequence overflow and generate IDs correctly', () => {
        const overflowIdGenerator = new HybridIDGenerator(512, { sequenceBits: 4 });
        for (let i = 0; i < 2; i++) {
            overflowIdGenerator.nextId();
        }
        const newId = overflowIdGenerator.nextId();
        expect(typeof newId).toBe('bigint'); // Ensure ID generation continues
    });

    test('should emit events when ID is generated', () => {
        const eventIdGenerator = new HybridIDGenerator(512, { enableEventEmission: true });
        const mockEmit = jest.spyOn(eventIdGenerator, 'emit');
        eventIdGenerator.nextId();
        expect(mockEmit).toHaveBeenCalledWith('idGenerated', expect.anything()); // Ensure event emission on ID generation
    });

    test('should correctly determine if an ID is expired', () => {
        const newId = idGenerator.nextId();
        jest.advanceTimersByTime(5000); // Simulate 5 seconds passing
        const isExpired = idGenerator.isIdExpired(newId, 4000);
        expect(isExpired).toBe(true); // Ensure ID is marked as expired
    });

    test('should validate IDs correctly', () => {
        const newId = idGenerator.nextId();
        const isValid = idGenerator.isValidateId(newId);
        expect(isValid).toBe(true); // Ensure ID is marked as valid
    });

    test('should validate Base62 IDs correctly', () => {
        const newId = idGenerator.nextId();
        const base62Id = idGenerator.toBase62(newId);
        const isValid = idGenerator.isValidateId(base62Id);
        expect(isValid).toBe(true); // Ensure Base62 ID is marked as valid
    });

    test('should validate invalid IDs correctly', () => {
        const invalidId = BigInt(-1);
        const isValid = idGenerator.isValidateId(invalidId);
        expect(isValid).toBe(false); // Ensure invalid ID is marked as invalid
    });

    // New test for `info()` method
    test('should correctly extract info from a valid ID', () => {
        const newId = idGenerator.nextId();
        const info = idGenerator.info(newId);

        expect(info).toHaveProperty('timestamp');
        expect(info).toHaveProperty('machineId');
        expect(info).toHaveProperty('randomBits');
        expect(info).toHaveProperty('sequence');
        expect(info).toHaveProperty('masked');
        
        // Check that the extracted info makes sense
        expect(info.machineId).toBe(512);  // Machine ID should be the same as the one used in the generator
        expect(info.timestamp).not.toBe(BigInt(-1));  // Timestamp should not be -1 if not masked
        expect(typeof info.randomBits).toBe('number');  // Random bits should be a number
        expect(typeof info.sequence).toBe('number');    // Sequence should be a number
        expect(info.masked).toBe(false);  // Masked should be false by default
    });

    // New test for Base62 ID info extraction
    test('should correctly extract info from a Base62 encoded ID', () => {
        const newId = idGenerator.nextId();
        const base62Id = idGenerator.toBase62(newId);
        const info = idGenerator.info(base62Id);  // Extract info from Base62 encoded ID
        console.log("toBase62", info, base62Id, newId);

        expect(info).toHaveProperty('timestamp');
        expect(info).toHaveProperty('machineId');
        expect(info).toHaveProperty('randomBits');
        expect(info).toHaveProperty('sequence');
        expect(info).toHaveProperty('masked');

        expect(info.machineId).toBe(512);  // Machine ID should match
        expect(typeof info.randomBits).toBe('number');  // Random bits should be a number
        expect(typeof info.sequence).toBe('number');    // Sequence should be a number
    });

    // New test for masked timestamp in `info()`
    test('should return masked timestamp in info if maskTimestamp is true', () => {
        const maskedIdGenerator = new HybridIDGenerator(512, { maskTimestamp: true });
        const newId = maskedIdGenerator.nextId();
        const info = maskedIdGenerator.info(newId);

        expect(info.timestamp).toBe(BigInt(-1));  // Timestamp should be -1 when masked
        expect(info.masked).toBe(true);  // Masked flag should be true
    });

    // Test for invalid ID in `info()` method
    test('should throw an error for invalid ID in info()', () => {
        const invalidId = BigInt(-1);

        expect(() => {
            idGenerator.info(invalidId);
        }).toThrow('Invalid ID');  // Ensure error is thrown for invalid ID
    });

    test('should throw an error for invalid ID in info()', () => {
        const invalidId = "invalid-id";

        expect(() => {
            idGenerator.info(invalidId);
        }).toThrow('Invalid ID');  // Ensure error is thrown for invalid ID
    });
});
