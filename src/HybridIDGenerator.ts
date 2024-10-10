import { EventEmitter } from 'events';
import { generateRandomBits, obfuscateTimestamp, encodeBase62, decodeBase62 } from './utils';


export type HybridID = bigint & { __brand__: 'HybridID' };

export interface HybridIDGeneratorOptions {
    sequenceBits?: number;
    randomBits?: number;
    entropyBits?: number;
    useCrypto?: boolean;
    maskTimestamp?: boolean;
    enableEventEmission?: boolean;
    machineIdBits?: number;
}

export interface HybridIDInfo { 
    timestamp: bigint; 
    machineId: number; 
    randomBits: number; 
    sequence: number; 
    masked: boolean; 
}

export class HybridIDGenerator extends EventEmitter {
    private machineId: number;
    private sequence: number = 0;
    private lastTimestamp: bigint = BigInt(-1);
    private sequenceBits: number;
    private randomBits: number;
    private entropyBits: number;
    private useCrypto: boolean;
    private maskTimestamp: boolean;
    private enableEventEmission: boolean;
    private maxSequence: number;
    private maxMachineId: number;
    private machineIdBits: number;

    constructor(machineId: number, options: HybridIDGeneratorOptions = {}) {
        super();
        this.sequenceBits = options.sequenceBits || 12;
        this.randomBits = options.randomBits || 10;
        this.entropyBits = options.entropyBits || 5;
        this.useCrypto = options.useCrypto || false;
        this.maskTimestamp = options.maskTimestamp || false;
        this.enableEventEmission = options.enableEventEmission || false;
        this.machineIdBits = options.machineIdBits || 12;
        this.maxMachineId = (1 << this.machineIdBits) - 1;

        if (machineId < 0 || machineId > this.maxMachineId) {
            throw new Error(`Machine ID must be between 0 and ${this.maxMachineId}.`);
        }

        this.machineId = machineId & this.maxMachineId;
        this.maxSequence = (1 << this.sequenceBits) - 1;
    }

    nextId(): HybridID {
        let timestamp = this.getTimestamp();
        if (this.maskTimestamp) {
            timestamp = obfuscateTimestamp(timestamp);
        }

        if (timestamp === this.lastTimestamp) {
            this.sequence = (this.sequence + 1) & this.maxSequence;
            if (this.sequence === 0) {
                while (timestamp <= this.lastTimestamp) {
                    timestamp = this.getTimestamp();
                }
            }
        } else {
            this.sequence = 0;
        }

        this.lastTimestamp = timestamp;
        const randomBits = generateRandomBits(this.randomBits, this.useCrypto);
        const hybridId = (timestamp << BigInt(this.sequenceBits + this.randomBits + this.entropyBits + this.machineIdBits)) |
            (BigInt(this.machineId) << BigInt(this.sequenceBits + this.randomBits + this.entropyBits)) |
            (BigInt(randomBits) << BigInt(this.sequenceBits)) |
            BigInt(this.sequence);

        if (this.enableEventEmission) {
            this.emit('idGenerated', hybridId);
        }

        return hybridId as HybridID;
    }

    getTimestamp(): bigint {
        return BigInt(process.hrtime.bigint());
    }

    isIdExpired(id: bigint, expiryDurationInMillis: number): boolean {
        const timestamp = id >> BigInt(this.sequenceBits + this.randomBits + this.entropyBits + this.machineIdBits);
        const currentTimestamp = BigInt(process.hrtime.bigint());
        return (currentTimestamp - timestamp) > BigInt(expiryDurationInMillis * 1_000_000);
    }

    toBase62(id: bigint): string {
        return encodeBase62(id);
    }

    fromBase62(encodedId: string): bigint {
        return decodeBase62(encodedId);
    }

    isValidateId(id: bigint | string): boolean {
        if (typeof id === 'string') {
            // Check if the string contains only valid Base62 characters
            if (!/^[0-9a-zA-Z]+$/.test(id)) {
                return false;  // Invalid characters for Base62
            }
            try {
                id = this.fromBase62(id);
            } catch (e) {
                return false;  // Return false if decoding throws an error
            }
        }
    
        const totalBits = this.sequenceBits + this.randomBits + this.entropyBits + this.machineIdBits;
    
        const timestamp = id >> BigInt(totalBits);
        if (timestamp < 0) return false;  // Timestamp must be non-negative
    
        const machineIdShift = this.sequenceBits + this.randomBits + this.entropyBits;
        const machineId = Number((id >> BigInt(machineIdShift)) & BigInt((1 << this.machineIdBits) - 1));
        if (machineId < 0 || machineId > this.maxMachineId) return false;  // Check valid machine ID range
    
        const randomBits = Number((id >> BigInt(this.sequenceBits)) & BigInt((1 << this.randomBits) - 1));
        if (randomBits < 0 || randomBits >= (1 << this.randomBits)) return false;  // Valid range for random bits
    
        const sequence = Number(id & BigInt(this.maxSequence));
        if (sequence < 0 || sequence > this.maxSequence) return false;  // Valid sequence range
    
        return true;
    }
    

    info(id: HybridID | bigint | string): HybridIDInfo {

        // check if the id is vaiid
        if (!this.isValidateId(id)) {
            throw new Error('Invalid ID');
        }

        if (typeof id === 'string') {
            id = this.fromBase62(id);  // Convert to bigint if the ID is in Base62 format.
        }

        const totalBits = this.sequenceBits + this.randomBits + this.entropyBits + this.machineIdBits;

        // Extract timestamp (shift right to remove the other components)
        let timestamp = id >> BigInt(totalBits);

        // If timestamp is masked, we can't reverse obfuscation, but we can flag it
        let masked = this.maskTimestamp;

        // Extract the machine ID
        const machineIdShift = this.sequenceBits + this.randomBits + this.entropyBits;
        const machineId = Number((id >> BigInt(machineIdShift)) & BigInt((1 << this.machineIdBits) - 1));

        // Extract random bits
        const randomBits = Number((id >> BigInt(this.sequenceBits)) & BigInt((1 << this.randomBits) - 1));

        // Extract sequence
        const sequence = Number(id & BigInt(this.maxSequence));

        return {
            timestamp: masked ? BigInt(-1) : timestamp,  // Return -1 if the timestamp is masked
            machineId,
            randomBits,
            sequence,
            masked,
        };
    }

}

export default HybridIDGenerator;
