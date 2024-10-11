import {  HybridIDGenerator } from "../src";
import { once } from 'events';

describe('HybridIDGenerator', () => {
    let generator: HybridIDGenerator;

    beforeEach(() => {
        generator = new HybridIDGenerator({
            sequenceBits: 12,
            randomBits: 10,
            entropyBits: 5,
            useCrypto: true,
            maskTimestamp: false,
            machineIdBits: 12,
        });
    });

    it('should generate unique IDs', () => {
        const id1 = generator.nextId();
        const id2 = generator.nextId();        
        expect(id1).not.toEqual(id2);
    });

    it('should generate IDs in batch', () => {
        const ids = generator.nextIds(5);        
        expect(ids.length).toBe(5);
        expect(new Set(ids).size).toBe(5); // Ensure all are unique
    });

    it('should throw an error if batch size is zero or negative', () => {
        expect(() => generator.nextIds(0)).toThrow("Batch size must be greater than 0");
        expect(() => generator.nextIds(-5)).toThrow("Batch size must be greater than 0");
    });

    it('should obfuscate timestamp if maskTimestamp is true', () => {
        const maskedGenerator = new HybridIDGenerator({ maskTimestamp: true });
        const id = maskedGenerator.nextId();    
        expect(maskedGenerator.isHybridID(id)).toBe(true);
        const info = maskedGenerator.info(id);
        expect(info.timestamp).toBe(BigInt(-1)); // Timestamp should be masked
        expect(info.masked).toBe(true); // Masked flag should be true
    });
    

    it('should validate ID correctly', () => {
        const id = generator.nextId();
        expect(generator.isHybridID(id)).toBe(true);
    });

    it('should validate a corrupt ID', () => {
        const invalidId = BigInt('12345678901234567890'); // A random big number        
        expect(generator.validateID(invalidId)).toEqual({ valid: true });
    });

    it('should return correct info from an ID', () => {
        const id = generator.nextId();
        const info = generator.info(id);
        expect(info).toHaveProperty('timestamp');
        expect(info).toHaveProperty('machineId');
        expect(info).toHaveProperty('randomBits');
        expect(info).toHaveProperty('sequence');
        expect(info.masked).toBe(false);
    });

    it('should correctly encode and decode Base62', () => {
        const id = generator.nextId();
        const encodedId = generator.toBase62(id.toBigInt());
        const decodedId = generator.fromBase62(encodedId);
        console.log(encodedId);
        
        expect(decodedId).toBe(id.toBigInt());
    });

    it('should emit idGenerated event when an ID is generated', async () => {
        const emitter = new HybridIDGenerator({ enableEventEmission: true });
        const idPromise = once(emitter, 'idGenerated');
        emitter.nextId();
        const [id] = await idPromise;
        expect(generator.isHybridID(id)).toBe(true); // Ensure ID is valid
    });

    it('should correctly determine if an ID is expired', () => {
        const id = generator.nextId();
        const notExpired = generator.isIdExpired(id, 1000); // Assume 1 second expiry
        expect(notExpired).toBe(false); // ID should not be expired immediately
    });

    it('should detect expired IDs after a given duration', async () => {
        const id = generator.nextId();
        await new Promise((resolve) => setTimeout(resolve, 10)); // Wait for 10ms
        const expired = generator.isIdExpired(id, 1); // 1ms expiry
        expect(expired).toBe(true);
    });

    it('should respect machine ID strategies', () => {
        const envGen = new HybridIDGenerator({ machineIdStrategy: 'env', machineId: 'MY_MACHINE_ID_ENV' });
        const networkGen = new HybridIDGenerator({ machineIdStrategy: 'network' });
        const randomGen = new HybridIDGenerator({ machineIdStrategy: 'random', machineId: 999 });

        const envId = envGen.nextId();
        const networkId = networkGen.nextId();
        const randomId = randomGen.nextId();        

        expect(envGen.info(envId).machineId).toBeDefined();
        expect(networkGen.info(networkId).machineId).toBeDefined();
        expect(randomGen.info(randomId).machineId).toBeDefined();

        expect(envGen.isHybridID(envId)).toBe(true);
        expect(networkGen.isHybridID(networkId)).toBe(true);
        expect(randomGen.isHybridID(randomId)).toBe(true);
    });

    it('should throw error for invalid machine ID', () => {
        expect(() => {
            new HybridIDGenerator({ machineId: -1 });
        }).toThrow('Machine ID must be between 0 and 4095');

        expect(() => {
            new HybridIDGenerator({ machineId: 999999 });
        }).toThrow('Machine ID must be between 0 and 4095');
    });

    it('should reset sequence when the timestamp changes', () => {
        const id1 = generator.nextId();
        const id2 = generator.nextId();

        expect(generator.info(id1).sequence).toBeLessThanOrEqual(generator.options.maxSequence);
        expect(generator.info(id2).sequence).toBeLessThanOrEqual(generator.options.maxSequence);
    });
});
