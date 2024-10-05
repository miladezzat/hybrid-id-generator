import HybridIDGenerator from '../src/hybrid-id-generator'; // Adjust the path as needed

jest.useFakeTimers();

describe('HybridIDGenerator', () => {
    test('should generate unique IDs', () => {
        const idGenerator = new HybridIDGenerator(512);
        const ids = new Set<number>();
        for (let i = 0; i < 1000; i++) {
            ids.add(idGenerator.nextId());
            jest.advanceTimersByTime(1); // Simulate waiting for the next millisecond
        }
        expect(ids.size).toBe(1000); // Ensure all IDs are unique
    });

    test('should generate IDs with correct format', () => {
        const idGenerator = new HybridIDGenerator(512);
        const newId = idGenerator.nextId();
        expect(typeof newId).toBe('number'); // Ensure ID is a number
    });

    test('should correctly encode and decode Base62 IDs', () => {
        const idGenerator = new HybridIDGenerator(512);
        const originalId = idGenerator.nextId();
        const base62Id = idGenerator.toBase62(originalId);
        const decodedId = idGenerator.fromBase62(base62Id);
        expect(originalId).toBe(decodedId); // Ensure original ID is same as decoded ID
    });
});
