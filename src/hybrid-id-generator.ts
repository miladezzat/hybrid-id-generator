import { EventEmitter } from 'events';

const Base62Chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface HybridIDGeneratorOptions {
    sequenceBits?: number;
    randomBits?: number;
}

class HybridIDGenerator extends EventEmitter {
    private machineId: number;
    private sequence: number = 0;
    private lastTimestamp: number = -1;
    private sequenceBits: number;
    private randomBits: number;
    private maxSequence: number;

    constructor(machineId: number, options: HybridIDGeneratorOptions = {}) {
        super();
        // Validate the machine ID
        if (machineId < 0 || machineId > 1023) {
            throw new Error('Machine ID must be a number between 0 and 1023.');
        }

        this.machineId = machineId & 0x3FF; // 10 bits for machine ID
        this.sequenceBits = options.sequenceBits || 12; // Default to 12 bits
        this.randomBits = options.randomBits || 10; // Default to 10 bits

        // Calculate maximum sequence number based on bits
        this.maxSequence = (1 << this.sequenceBits) - 1; // 2^sequenceBits - 1
    }

    nextId(): number {
        let timestamp = this.getTimestamp();

        // If the timestamp is the same as the last timestamp, increment the sequence
        if (timestamp === this.lastTimestamp) {
            this.sequence = (this.sequence + 1) & this.maxSequence;
            // If the sequence exceeds the maximum, wait for the next millisecond
            if (this.sequence === 0) {
                while (timestamp <= this.lastTimestamp) {
                    timestamp = this.getTimestamp();
                }
            }
        } else {
            this.sequence = 0; // Reset sequence for a new timestamp
        }

        this.lastTimestamp = timestamp;

        const randomBits = Math.floor(Math.random() * (1 << this.randomBits));
        const hybridId = ((timestamp << (this.sequenceBits + this.randomBits + 10)) |
                          (this.machineId << (this.sequenceBits + this.randomBits)) |
                          (randomBits << this.sequenceBits) |
                          this.sequence) >>> 0;

        this.emit('idGenerated', hybridId); // Emit event for ID generation
        return hybridId;
    }

    getTimestamp(): number {
        return Math.floor(Date.now()); // Current time in milliseconds
    }

    isIdExpired(id: number, expiryDurationInMillis: number): boolean {
        const timestamp = id >>> (this.sequenceBits + this.randomBits + 10); // Extract timestamp
        const currentTimestamp = Math.floor(Date.now());
        return (currentTimestamp - timestamp) > expiryDurationInMillis; // Check for expiration
    }

    encodeBase62(num: number): string {
        let encoded = '';
        while (num > 0) {
            encoded = Base62Chars[num % 62] + encoded;
            num = Math.floor(num / 62);
        }
        return encoded || '0'; // Return '0' for 0
    }

    decodeBase62(encoded: string): number {
        let num = 0;
        for (let i = 0; i < encoded.length; i++) {
            num = num * 62 + Base62Chars.indexOf(encoded[i]);
        }
        return num;
    }

    toBase62(id: number): string {
        return this.encodeBase62(id); // Convert ID to Base62
    }

    fromBase62(encodedId: string): number {
        return this.decodeBase62(encodedId); // Decode Base62 back to ID
    }
}

export default HybridIDGenerator;
