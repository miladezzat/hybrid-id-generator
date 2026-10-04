import { EventEmitter } from 'events';
import { generateRandomBits, obfuscateTimestamp, encodeBase62, decodeBase62, validateMachineId } from './utils';
import { MachineIDStrategy, MachineIDProviderFactory } from './MachineIDProvider';
import { HybridID } from './HybridID';

export interface HybridIDGeneratorOptions {
    sequenceBits?: number;
    randomBits?: number;
    entropyBits?: number;
    useCrypto?: boolean;
    maskTimestamp?: boolean;
    enableEventEmission?: boolean;
    machineIdBits?: number;
    machineId?: number | string;
    machineIdStrategy?: 'env' | 'network' | 'random';
    /** Timestamp width in bits. Defaults to 42. */
    timestampBits?: number;
    /** Wall-clock milliseconds by default; false selects Node monotonic milliseconds. */
    useWallClock?: boolean;
}

export interface HybridIDInfo {
    timestamp: bigint;
    machineId: number;
    randomBits: number;
    entropy: number;
    sequence: number;
    masked: boolean;
}

/** Listener overloads retain general EventEmitter events and infer generated IDs. */
export interface HybridIDGenerator {
    on(eventName: 'idGenerated', listener: (id: HybridID) => void): this;
    on(eventName: string | symbol, listener: (...args: any[]) => void): this;
    once(eventName: 'idGenerated', listener: (id: HybridID) => void): this;
    once(eventName: string | symbol, listener: (...args: any[]) => void): this;
    addListener(eventName: 'idGenerated', listener: (id: HybridID) => void): this;
    addListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
    prependListener(eventName: 'idGenerated', listener: (id: HybridID) => void): this;
    prependListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
    prependOnceListener(eventName: 'idGenerated', listener: (id: HybridID) => void): this;
    prependOnceListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
}

function bitWidth(name: string, value: number, minimum = 0, maximum = 32): number {
    if (!Number.isInteger(value) || value < minimum || value > maximum) {
        throw new Error(`${name} must be an integer between ${minimum} and ${maximum}.`);
    }
    return value;
}

/** Generates IDs with a timestamp, machine ID, entropy, random value, and sequence. */
export class HybridIDGenerator extends EventEmitter {
    private machineId: number;
    private sequence = 0;
    private lastTimestamp = -1n;
    private sequenceBits: number;
    private randomBits: number;
    private entropyBits: number;
    private useCrypto: boolean;
    private maskTimestamp: boolean;
    private enableEventEmission: boolean;
    private maxSequence: number;
    private maxMachineId: number;
    private machineIdBits: number;
    private machineIdStrategy: MachineIDStrategy;
    private timestampBits: number;
    private useWallClock: boolean;
    private maxTimestamp: bigint;
    private maxEncodedLength: number;

    constructor(options: HybridIDGeneratorOptions = {}) {
        super();
        this.sequenceBits = bitWidth('sequenceBits', options.sequenceBits ?? 12);
        this.randomBits = bitWidth('randomBits', options.randomBits ?? 10);
        this.entropyBits = bitWidth('entropyBits', options.entropyBits ?? 5);
        this.machineIdBits = bitWidth('machineIdBits', options.machineIdBits ?? 12);
        this.timestampBits = bitWidth('timestampBits', options.timestampBits ?? 42, 1, 64);
        this.useCrypto = options.useCrypto ?? false;
        this.maskTimestamp = options.maskTimestamp ?? false;
        this.enableEventEmission = options.enableEventEmission ?? false;
        this.useWallClock = options.useWallClock ?? true;
        for (const name of ['useCrypto', 'maskTimestamp', 'enableEventEmission', 'useWallClock'] as const) {
            if (typeof this[name] !== 'boolean') throw new Error(`${name} must be a boolean.`);
        }
        this.maxMachineId = 2 ** this.machineIdBits - 1;
        this.maxSequence = 2 ** this.sequenceBits - 1;
        this.maxTimestamp = (1n << BigInt(this.timestampBits)) - 1n;
        const layoutBits = this.timestampBits + this.machineIdBits + this.entropyBits + this.randomBits + this.sequenceBits;
        this.maxEncodedLength = encodeBase62((1n << BigInt(layoutBits)) - 1n).length;
        this.machineIdStrategy = options.machineIdStrategy;

        if (this.machineIdStrategy === 'env' || this.machineIdStrategy === 'network') {
            if (typeof process === 'undefined' || !process.versions?.node) {
                throw new Error(`${this.machineIdStrategy} machine ID strategy requires Node.js.`);
            }
            if (this.machineIdStrategy === 'env' && options.machineId !== undefined && typeof options.machineId !== 'string') {
                throw new Error('Environment machineId must be an environment variable name.');
            }
            const value = this.machineIdStrategy === 'env' ? options.machineId as string | undefined : undefined;
            const provider = MachineIDProviderFactory.createMachineIDProvider(this.machineIdStrategy, value);
            const resolved = provider.getMachineId();
            // MAC-derived IDs are hashes; fold them into the configured field width.
            // Explicit environment IDs must fit without colliding through remapping.
            this.machineId = validateMachineId(undefined,
                this.machineIdStrategy === 'network' ? resolved % (this.maxMachineId + 1) : resolved,
                this.maxMachineId);
        } else {
            this.machineId = validateMachineId(this.machineIdStrategy, options.machineId, this.maxMachineId);
        }
    }

    /** A snapshot of the configuration and the generator's current state. */
    get options(): HybridIDGeneratorOptions & {
        sequence: number; lastTimestamp: bigint; maxSequence: number; maxMachineId: number;
        timestampBits: number; useWallClock: boolean; maxTimestamp: bigint;
    } {
        return {
            sequenceBits: this.sequenceBits, randomBits: this.randomBits, entropyBits: this.entropyBits,
            useCrypto: this.useCrypto, maskTimestamp: this.maskTimestamp, enableEventEmission: this.enableEventEmission,
            machineIdBits: this.machineIdBits, machineId: this.machineId, machineIdStrategy: this.machineIdStrategy,
            timestampBits: this.timestampBits, useWallClock: this.useWallClock, maxTimestamp: this.maxTimestamp,
            sequence: this.sequence, lastTimestamp: this.lastTimestamp,
            maxSequence: this.maxSequence, maxMachineId: this.maxMachineId,
        };
    }

    /**
     * Generate one ID. Rollbacks retain the last timestamp; sequence exhaustion
     * advances logical time by one millisecond without blocking the event loop.
     * Masking applies only to the stored timestamp, after sequence accounting.
     */
    nextId(): HybridID {
        const clock = this.getTimestamp();
        let timestamp = clock < this.lastTimestamp ? this.lastTimestamp : clock;
        let sequence = timestamp === this.lastTimestamp ? this.sequence + 1 : 0;
        if (sequence > this.maxSequence) {
            timestamp += 1n;
            sequence = 0;
        }
        if (timestamp > this.maxTimestamp) throw new Error('Timestamp exceeds the configured bit range.');
        const storedTimestamp = this.maskTimestamp ? obfuscateTimestamp(timestamp) & this.maxTimestamp : timestamp;
        const randomValue = generateRandomBits(this.randomBits, this.useCrypto);
        const entropyValue = generateRandomBits(this.entropyBits, this.useCrypto);
        const id = new HybridID(
            (storedTimestamp << BigInt(this.sequenceBits + this.randomBits + this.entropyBits + this.machineIdBits)) |
            (BigInt(this.machineId) << BigInt(this.sequenceBits + this.randomBits + this.entropyBits)) |
            (BigInt(entropyValue) << BigInt(this.sequenceBits + this.randomBits)) |
            (BigInt(randomValue) << BigInt(this.sequenceBits)) | BigInt(sequence));
        this.sequence = sequence;
        this.lastTimestamp = timestamp;
        if (this.enableEventEmission) this.emit('idGenerated', id);
        return id;
    }

    /** Generate 1 to 1,000,000 IDs, using the same clock and sequence path as nextId. */
    nextIds(batchSize: number): HybridID[] {
        if (!Number.isSafeInteger(batchSize) || batchSize <= 0 || batchSize > 1_000_000) {
            throw new Error('Batch size must be greater than 0 and an integer no larger than 1000000.');
        }
        return Array.from({ length: batchSize }, () => this.nextId());
    }

    /** Produce a finite sequence lazily, without allocating the full batch. */
    iterateIds(count: number): IterableIterator<HybridID> {
        if (!Number.isSafeInteger(count) || count <= 0) {
            throw new Error('Count must be a positive safe integer.');
        }
        const generator = this;
        return (function* () {
            for (let index = 0; index < count; index += 1) yield generator.nextId();
        })();
    }

    /** Read milliseconds from the selected clock; timestamps never silently wrap. */
    getTimestamp(useHighResTime?: boolean): bigint {
        const useWall = useHighResTime === undefined ? this.useWallClock : !useHighResTime;
        let timestamp: bigint;
        if (useWall) timestamp = BigInt(Date.now());
        else {
            if (typeof process === 'undefined' || typeof process.hrtime?.bigint !== 'function') {
                throw new Error('Monotonic time requires Node.js.');
            }
            timestamp = process.hrtime.bigint() / 1_000_000n;
        }
        if (timestamp < 0n || timestamp > this.maxTimestamp) throw new Error('Timestamp exceeds the configured bit range.');
        return timestamp;
    }

    /** Check age in milliseconds. Masked timestamps do not support expiry. */
    isIdExpired(id: bigint | HybridID, expiryDurationInMillis: number): boolean {
        if (!Number.isSafeInteger(expiryDurationInMillis) || expiryDurationInMillis < 0) {
            throw new Error('Expiry duration must be a non-negative safe integer in milliseconds.');
        }
        const info = this.info(id);
        if (info.masked) return false;
        // Age follows the physical clock, not the generator's logical timestamp.
        return this.getTimestamp() - info.timestamp > BigInt(expiryDurationInMillis);
    }

    toBase62(id: bigint | HybridID): string {
        return encodeBase62(id instanceof HybridID ? id.toBigInt() : id);
    }

    fromBase62(encodedId: string | HybridID): bigint {
        return encodedId instanceof HybridID ? encodedId.toBigInt() : decodeBase62(encodedId);
    }

    private decodeInput(id: string | bigint | HybridID): bigint | null {
        if (id instanceof HybridID) id = id.toBigInt();
        if (typeof id === 'string') {
            if (id.length === 0) return null;
            // Leading zeroes do not change the integer. Only layout-sized values
            // reach the general-purpose decoder, avoiding growing bigint work.
            const significant = id.replace(/^0+/, '');
            if (significant.length > this.maxEncodedLength) return null;
            try { return decodeBase62(significant || '0'); } catch { return null; }
        }
        return typeof id === 'bigint' ? id : null;
    }

    /** Validate the configured bit range. This checks structure, not authenticity. */
    isHybridID(id: string | bigint | HybridID): boolean {
        const value = this.decodeInput(id);
        if (value === null || value < 0n) return false;
        const totalBits = this.sequenceBits + this.randomBits + this.entropyBits + this.machineIdBits;
        return (value >> BigInt(totalBits)) <= this.maxTimestamp;
    }

    validateID(id: bigint | string | HybridID): { valid: boolean; reason?: string } {
        return this.isHybridID(id) ? { valid: true } : { valid: false, reason: 'Invalid Hybrid ID' };
    }

    /** Decode with the same layout and masking configuration used to generate the ID. */
    info(id: HybridID | bigint | string): HybridIDInfo {
        const value = this.decodeInput(id);
        if (value === null || !this.isHybridID(value)) throw new Error('Invalid ID');
        const totalBits = this.sequenceBits + this.randomBits + this.entropyBits + this.machineIdBits;
        return {
            timestamp: this.maskTimestamp ? -1n : value >> BigInt(totalBits),
            machineId: Number((value >> BigInt(this.sequenceBits + this.randomBits + this.entropyBits)) & BigInt(this.maxMachineId)),
            randomBits: Number((value >> BigInt(this.sequenceBits)) & ((1n << BigInt(this.randomBits)) - 1n)),
            entropy: Number((value >> BigInt(this.sequenceBits + this.randomBits)) & ((1n << BigInt(this.entropyBits)) - 1n)),
            sequence: Number(value & BigInt(this.maxSequence)),
            masked: this.maskTimestamp,
        };
    }
}

export default HybridIDGenerator;
