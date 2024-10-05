import { EventEmitter } from 'events';
import crypto from 'crypto';

const Base62Chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface HybridIDGeneratorOptions {
    sequenceBits?: number;
    randomBits?: number;
    entropyBits?: number;
    useCrypto?: boolean;
    maskTimestamp?: boolean;
    enableEventEmission?: boolean; // New option to toggle event emission
    machineIdBits?: number; // New option for machine ID scalability
}

class HybridIDGenerator extends EventEmitter {
    private machineId: number;
    private sequence: number = 0;
    private lastTimestamp: bigint = BigInt(-1); // Use BigInt for sub-millisecond precision
    private sequenceBits: number;
    private randomBits: number;
    private entropyBits: number;
    private useCrypto: boolean;
    private maskTimestamp: boolean;
    private enableEventEmission: boolean;
    private maxSequence: number;
    private maxMachineId: number;
    private machineIdBits: number; // Number of bits for machine ID

    constructor(machineId: number, options: HybridIDGeneratorOptions = {}) {
        super();

        this.sequenceBits = options.sequenceBits || 12;
        this.randomBits = options.randomBits || 10;
        this.entropyBits = options.entropyBits || 5;
        this.useCrypto = options.useCrypto || false;
        this.maskTimestamp = options.maskTimestamp || false;
        this.enableEventEmission = options.enableEventEmission || false;

        // Allow flexibility in the number of machine ID bits (default is 12)
        this.machineIdBits = options.machineIdBits || 12;
        this.maxMachineId = (1 << this.machineIdBits) - 1;

        // Validate machine ID within the new range
        if (machineId < 0 || machineId > this.maxMachineId) {
            throw new Error(`Machine ID must be a number between 0 and ${this.maxMachineId}.`);
        }

        this.machineId = machineId & this.maxMachineId;

        // Pre-compute the maximum sequence number based on the bits
        this.maxSequence = (1 << this.sequenceBits) - 1;
    }

    nextId(): bigint {
        let timestamp = this.getTimestamp();

        // Mask the timestamp if needed
        if (this.maskTimestamp) {
            timestamp = this.obfuscateTimestamp(timestamp);
        }

        // Handle sequence overflow in high-throughput environments
        if (timestamp === this.lastTimestamp) {
            this.sequence = (this.sequence + 1) & this.maxSequence;

            if (this.sequence === 0) {
                // Wait for the next nanosecond to avoid overflow
                while (timestamp <= this.lastTimestamp) {
                    timestamp = this.getTimestamp();
                }
            }
        } else {
            this.sequence = 0; // Reset sequence for a new timestamp
        }

        this.lastTimestamp = timestamp;

        const randomBits = this.generateRandomBits();
        const hybridId = (timestamp << BigInt(this.sequenceBits + this.randomBits + this.entropyBits + this.machineIdBits)) |
                        (BigInt(this.machineId) << BigInt(this.sequenceBits + this.randomBits + this.entropyBits)) |
                        (BigInt(randomBits) << BigInt(this.sequenceBits)) |
                        BigInt(this.sequence);

        if (this.enableEventEmission) {
            this.emit('idGenerated', hybridId); // Emit event for ID generation (if enabled)
        }

        return hybridId;
    }

    getTimestamp(): bigint {
        // Use nanoseconds for finer precision in high-throughput environments
        return BigInt(process.hrtime.bigint());
    }

    isIdExpired(id: bigint, expiryDurationInMillis: number): boolean {
        const timestamp = id >> BigInt(this.sequenceBits + this.randomBits + this.entropyBits + this.machineIdBits);
        const currentTimestamp = BigInt(process.hrtime.bigint());
        return (currentTimestamp - timestamp) > BigInt(expiryDurationInMillis * 1_000_000); // Convert milliseconds to nanoseconds
    }

    encodeBase62(num: bigint): string {
        let encoded = '';
        while (num > 0) {
            encoded = Base62Chars[Number(num % BigInt(62))] + encoded;
            num = num / BigInt(62);
        }
        return encoded || '0';
    }

    decodeBase62(encoded: string): bigint {
        let num = BigInt(0);
        for (let i = 0; i < encoded.length; i++) {
            num = num * BigInt(62) + BigInt(Base62Chars.indexOf(encoded[i]));
        }
        return num;
    }

    toBase62(id: bigint): string {
        return this.encodeBase62(id);
    }

    fromBase62(encodedId: string): bigint {
        return this.decodeBase62(encodedId);
    }

    private generateRandomBits(): number {
        if (this.useCrypto) {
            const randomBytes = crypto.randomBytes(Math.ceil(this.randomBits / 8));
            let randomNum = 0;
            for (let i = 0; i < randomBytes.length; i++) {
                randomNum = (randomNum << 8) | randomBytes[i];
            }
            return randomNum & ((1 << this.randomBits) - 1);
        } else {
            return Math.floor(Math.random() * (1 << this.randomBits));
        }
    }

    private obfuscateTimestamp(timestamp: bigint): bigint {
        // Use a secure hashing approach to obfuscate the timestamp
        const hash = crypto.createHash('sha256');
        hash.update(timestamp.toString());
        return BigInt('0x' + hash.digest('hex').slice(0, 16)); // Use first 16 characters of the hash
    }
}

export default HybridIDGenerator;
