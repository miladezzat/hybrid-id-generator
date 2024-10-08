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
        expect(typeof newId).toBe('bigint'); // Ensure ID is a number
    });

    test('should correctly encode and decode Base62 IDs', () => {
        const originalId = idGenerator.nextId();
        const base62Id = idGenerator.toBase62(originalId);
        const decodedId = idGenerator.fromBase62(base62Id);
        expect(originalId).toBe(decodedId); // Ensure original ID is same as decoded ID
    });

    test('should generate IDs as bigint', () => {
        const newId = idGenerator.nextId();
        expect(typeof newId).toBe('bigint'); // Ensure ID is a bigint
    });

    test('should generate unique IDs', () => {
        const id1 = idGenerator.nextId();
        const id2 = idGenerator.nextId();
        expect(id1).not.toBe(id2); // Ensure the IDs are unique
    });

    test('should correctly encode and decode Base62 IDs', () => {
        const originalId = idGenerator.nextId();
        const base62Id = idGenerator.toBase62(originalId);
        const decodedId = idGenerator.fromBase62(base62Id);
        expect(originalId).toBe(decodedId); // Ensure original ID is same as decoded ID
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
    })

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
});
