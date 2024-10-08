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

    isValidateId(id: bigint | string): id is HybridID {
        // check if the id is hybrid id correctly
        // add logic to check if the id is valid
        const decodedId = this.fromBase62(id.toString()); // Decode from Base62
        // Check if the decoded ID is a valid hybrid ID (non-negative)
        return decodedId >= BigInt(0);

    }
}

export default HybridIDGenerator;
