//src/HybridIDGenerator.ts

import { EventEmitter } from 'events';
import { generateRandomBits, obfuscateTimestamp, encodeBase62, decodeBase62, validateMachineId } from './utils';
import { MachineIDStrategy, MachineIDProviderFactory } from "./MachineIDProvider";
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
    machineIdStrategy?: 'env' | 'network' | 'random'; // this is the machine id provider strategy
    /** Number of bits for timestamp (default 42 = ms since Unix epoch, ~139 years). */
    timestampBits?: number;
    /** If true, use wall-clock time (Date.now()) for chronological order and expiry; if false, use process.hrtime.bigint() (monotonic, process-specific). Default true. */
    useWallClock?: boolean;
}

export interface HybridIDInfo {
    timestamp: bigint;
    machineId: number;
    randomBits: number;
    sequence: number;
    masked: boolean;
}

export class HybridIDGenerator extends EventEmitter {
    /**
     * The machine ID used for generating unique Hybrid IDs.
     * @private
     * @type {number}
     */
    private machineId: number;

    /**
     * The current sequence number for ID generation.
     * This resets to 0 when the timestamp changes.
     * @private
     * @type {number}
     * @default 0
     */
    private sequence: number = 0;

    /**
     * The last generated timestamp in BigInt format.
     * This is used to determine if a new timestamp is needed
     * during ID generation.
     * @private
     * @type {bigint}
     * @default -1n
     */
    private lastTimestamp: bigint = BigInt(-1);

    /**
     * The number of bits allocated for the sequence component of the Hybrid ID.
     * @private
     * @type {number}
     */
    private sequenceBits: number;

    /**
     * The number of bits allocated for random bits in the Hybrid ID.
     * @private
     * @type {number}
     */
    private randomBits: number;

    /**
     * The number of bits allocated for entropy in the Hybrid ID.
     * @private
     * @type {number}
     */
    private entropyBits: number;

    /**
     * Flag indicating whether to use cryptographic functions for random number generation.
     * @private
     * @type {boolean}
     */
    private useCrypto: boolean;

    /**
     * Flag indicating whether the timestamp should be masked during ID generation.
     * @private
     * @type {boolean}
     */
    private maskTimestamp: boolean;

    /**
     * Flag indicating whether event emission is enabled for ID generation events.
     * @private
     * @type {boolean}
     */
    private enableEventEmission: boolean;

    /**
     * The maximum value for the sequence component based on the number of bits allocated.
     * @private
     * @type {number}
     */
    private maxSequence: number;

    /**
     * The maximum value for the machine ID based on the number of bits allocated.
     * @private
     * @type {number}
     */
    private maxMachineId: number;

    /**
     * The number of bits allocated for the machine ID component of the Hybrid ID.
     * @private
     * @type {number}
     */
    private machineIdBits: number;

    /**
     * The strategy used for generating the machine ID.
     * @private
     * @type {MachineIDStrategy}
     */
    private machineIdStrategy: MachineIDStrategy;

    /**
     * The number of bits allocated for the timestamp component (default 42 = ms since Unix epoch).
     * @private
     */
    private timestampBits: number;

    /**
     * If true, use wall-clock time (Date.now()) for chronological order and expiry.
     * @private
     */
    private useWallClock: boolean;

    /**
     * Maximum timestamp value (2^timestampBits - 1) for capping.
     * @private
     */
    private maxTimestamp: bigint;


    /**
     * Constructs a new Hybrid ID generator with the specified options.
     *
     * The constructor initializes various properties related to ID generation,
     * including bit allocation for the sequence, random bits, and entropy,
     * as well as the machine ID and options for masking and event emission.
     *
     * @param {HybridIDGeneratorOptions} [options={}] - The configuration options for the ID generator.
     * @param {number} [options.sequenceBits=12] - The number of bits for the sequence component (default: 12).
     * @param {number} [options.randomBits=10] - The number of bits for the random component (default: 10).
     * @param {number} [options.entropyBits=5] - The number of bits for the entropy component (default: 5).
     * @param {boolean} [options.useCrypto=false] - Whether to use cryptographic functions for random generation (default: false).
     * @param {boolean} [options.maskTimestamp=false] - Whether to mask the timestamp (default: false).
     * @param {boolean} [options.enableEventEmission=false] - Whether to enable event emission for ID generation (default: false).
     * @param {number} [options.machineIdBits=12] - The number of bits for the machine ID component (default: 12).
     * @param {MachineIDStrategy} [options.machineIdStrategy] - The strategy used for generating the machine ID.
     * @param {number} [options.machineId] - The initial machine ID to use (must be validated).
     * @param {number} [options.timestampBits=42] - The number of bits for the timestamp (default: 42, ms since Unix epoch).
     * @param {boolean} [options.useWallClock=true] - Use wall-clock time (Date.now()) for ordering and expiry (default: true).
     */
    constructor(options: HybridIDGeneratorOptions = {}) {
        super();

        this.sequenceBits = options.sequenceBits || 12;
        this.randomBits = options.randomBits || 10;
        this.entropyBits = options.entropyBits || 5;
        this.useCrypto = options.useCrypto || false;
        this.maskTimestamp = options.maskTimestamp || false;
        this.enableEventEmission = options.enableEventEmission || false;
        this.machineIdBits = options.machineIdBits || 12;
        this.maxMachineId = (1 << this.machineIdBits) - 1;
        this.machineIdStrategy = options.machineIdStrategy;
        this.timestampBits = options.timestampBits ?? 42;
        this.useWallClock = options.useWallClock !== false;
        this.maxTimestamp = (BigInt(1) << BigInt(this.timestampBits)) - BigInt(1);

        // Resolve machine ID: use providers for env/network, validateMachineId for random or explicit numeric
        if (this.machineIdStrategy === 'env' || this.machineIdStrategy === 'network') {
            const value = this.machineIdStrategy === 'env' ? options.machineId as string : undefined;
            const provider = MachineIDProviderFactory.createMachineIDProvider(this.machineIdStrategy, value);
            let resolved = provider.getMachineId();
            if (resolved < 0 || resolved > this.maxMachineId) {
                resolved = ((resolved % (this.maxMachineId + 1)) + (this.maxMachineId + 1)) % (this.maxMachineId + 1);
            }
            this.machineId = resolved;
        } else {
            this.machineId = validateMachineId(this.machineIdStrategy, options.machineId, this.maxMachineId);
        }

        this.maxSequence = (1 << this.sequenceBits) - 1;
    }



    /**
     * Gets the current options of the Hybrid ID generator.
     *
     * This getter returns an object containing the configuration settings
     * and state variables of the Hybrid ID generator, including the number 
     * of bits used for different components, the current sequence number, 
     * last generated timestamp, maximum sequence, and maximum machine ID.
     *
     * @returns {HybridIDGeneratorOptions & {
    *   sequence: number;
    *   lastTimestamp: bigint;
    *   maxSequence: number;
    *   maxMachineId: number;
    * }} The current options and state of the Hybrid ID generator.
    */
    get options(): HybridIDGeneratorOptions & {
        sequence: number;
        lastTimestamp: bigint;
        maxSequence: number;
        maxMachineId: number;
        timestampBits: number;
        useWallClock: boolean;
        maxTimestamp: bigint;
    } {
        return {
            sequenceBits: this.sequenceBits,
            randomBits: this.randomBits,
            entropyBits: this.entropyBits,
            useCrypto: this.useCrypto,
            maskTimestamp: this.maskTimestamp,
            enableEventEmission: this.enableEventEmission,
            machineIdBits: this.machineIdBits,
            machineId: this.machineId,
            machineIdStrategy: this.machineIdStrategy as HybridIDGeneratorOptions['machineIdStrategy'],
            timestampBits: this.timestampBits,
            useWallClock: this.useWallClock,
            maxTimestamp: this.maxTimestamp,
            sequence: this.sequence,
            lastTimestamp: this.lastTimestamp,
            maxSequence: this.maxSequence,
            maxMachineId: this.maxMachineId,
        };
    }


    /**
     * Generates the next Hybrid ID.
     *
     * This method constructs a new Hybrid ID based on the current timestamp,
     * machine ID, random bits, and sequence number. It handles timestamp 
     * obfuscation if enabled, ensures unique ID generation by incrementing
     * the sequence number when necessary, and can emit an event upon ID 
     * generation. The final Hybrid ID is created by combining these components.
     *
     * @returns {HybridID} The newly generated Hybrid ID.
     */
    nextId(): HybridID {
        let timestamp = this.getTimestamp();
        if (this.maskTimestamp) {
            timestamp = obfuscateTimestamp(timestamp) & this.maxTimestamp;
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
        const entropyValue = generateRandomBits(this.entropyBits, this.useCrypto);
        const hybridId = (timestamp << BigInt(this.sequenceBits + this.randomBits + this.entropyBits + this.machineIdBits)) |
            (BigInt(this.machineId) << BigInt(this.sequenceBits + this.randomBits + this.entropyBits)) |
            (BigInt(entropyValue) << BigInt(this.sequenceBits + this.randomBits)) |
            (BigInt(randomBits) << BigInt(this.sequenceBits)) |
            BigInt(this.sequence);

        if (this.enableEventEmission) {
            this.emit('idGenerated', new HybridID(hybridId));
        }

        return new HybridID(hybridId);
    }


    /**
     * Generates a batch of Hybrid IDs.
     *
     * This method produces a specified number of Hybrid IDs in one call.
     * It ensures uniqueness by handling sequence numbers and timestamps.
     * The method optimizes ID generation by preallocating an array for the
     * result and managing sequence overflow correctly.
     *
     * @param {number} batchSize - The number of Hybrid IDs to generate. 
     * Must be greater than 0.
     * @throws {Error} If `batchSize` is less than or equal to 0.
     * @returns {HybridID[]} An array of generated Hybrid IDs.
     */
    nextIds(batchSize: number): HybridID[] {
        if (batchSize <= 0) {
            throw new Error("Batch size must be greater than 0");
        }

        // Preallocate the array size for optimization
        const ids = new Array<HybridID>(batchSize);

        let timestamp = this.getTimestamp();
        if (this.maskTimestamp) {
            timestamp = obfuscateTimestamp(timestamp) & this.maxTimestamp;
        }

        // Cache the last generated timestamp
        let lastTimestamp = this.lastTimestamp;

        // Loop through the batchSize to generate IDs
        for (let i = 0; i < batchSize; i++) {
            if (timestamp === lastTimestamp) {
                this.sequence = (this.sequence + 1) & this.maxSequence;
                if (this.sequence === 0) {
                    // Ensure we get a new timestamp when sequence overflows
                    while (timestamp <= lastTimestamp) {
                        timestamp = this.getTimestamp();
                    }
                }
            } else {
                this.sequence = 0; // Reset sequence for new timestamp
            }

            // Update the cached last timestamp
            lastTimestamp = timestamp;
            this.lastTimestamp = lastTimestamp; // Update the class property

            const randomBits = generateRandomBits(this.randomBits, this.useCrypto);
            const entropyValue = generateRandomBits(this.entropyBits, this.useCrypto);

            const hybridId = (timestamp << BigInt(this.sequenceBits + this.randomBits + this.entropyBits + this.machineIdBits)) |
                (BigInt(this.machineId) << BigInt(this.sequenceBits + this.randomBits + this.entropyBits)) |
                (BigInt(entropyValue) << BigInt(this.sequenceBits + this.randomBits)) |
                (BigInt(randomBits) << BigInt(this.sequenceBits)) |
                BigInt(this.sequence);

            // Store ID in the preallocated array
            ids[i] = new HybridID(hybridId);

            // Emit event if enabled
            if (this.enableEventEmission) {
                this.emit('idGenerated', new HybridID(hybridId));
            }
        }

        return ids;
    }


    /**
     * Retrieves the current timestamp, capped to timestampBits.
     * Default: wall-clock time (Date.now() in ms) for real-world chronological order and expiry.
     * Optional: process.hrtime.bigint() (monotonic, process-specific) when useWallClock is false.
     *
     * @param useHighResTime - Override: if true use process.hrtime.bigint() (when available), else Date.now() ms. Default follows options.useWallClock.
     * @returns {bigint} The current timestamp (ms if wall-clock, capped to timestampBits; else hrtime ns capped).
     */
    getTimestamp(useHighResTime?: boolean): bigint {
        const useWall = useHighResTime === undefined ? this.useWallClock : !useHighResTime;
        if (useWall) {
            const ms = BigInt(Date.now());
            return ms & this.maxTimestamp;
        }
        if (typeof process !== 'undefined' && typeof process.hrtime?.bigint === 'function') {
            const ns = process.hrtime.bigint();
            return ns & this.maxTimestamp;
        }
        const ms = BigInt(Date.now());
        return ms & this.maxTimestamp;
    }

    isIdExpired(id: bigint | HybridID, expiryDurationInMillis: number): boolean {
        if (this.maskTimestamp) {
            return false;
        }
        if (id instanceof HybridID) {
            id = (id as HybridID).toBigInt();
        }

        const totalBits = this.sequenceBits + this.randomBits + this.entropyBits + this.machineIdBits;
        const timestamp = id >> BigInt(totalBits);
        if (this.useWallClock) {
            const currentMs = BigInt(Date.now());
            const creationMs = timestamp & this.maxTimestamp;
            return (currentMs - creationMs) > BigInt(expiryDurationInMillis);
        }
        if (typeof process !== 'undefined' && typeof process.hrtime?.bigint === 'function') {
            const currentNs = process.hrtime.bigint();
            return (currentNs - timestamp) > BigInt(expiryDurationInMillis * 1_000_000);
        }
        const currentMs = BigInt(Date.now());
        const creationMs = timestamp & this.maxTimestamp;
        return (currentMs - creationMs) > BigInt(expiryDurationInMillis);
    }

    toBase62(id: bigint | HybridID): string {
        if (id instanceof HybridID) {
            id = (id as HybridID).toBigInt();
        }

        return encodeBase62(id);
    }

    fromBase62(encodedId: string | HybridID): bigint {
        if (encodedId instanceof HybridID) {
            encodedId = (encodedId as HybridID).toString();
        }

        return decodeBase62(encodedId);
    }

    /**
     * Checks whether the given ID is a valid Hybrid ID.
     *
     * This method determines if the input ID is an instance of `HybridID`, 
     * a valid Base62 encoded string, or a bigint that conforms to the 
     * Hybrid ID structure. It performs various checks on the ID's 
     * components, including the timestamp, machine ID, random bits, 
     * and sequence number.
     *
     * @param {string | bigint | HybridID} id - The ID to validate. 
     * It can be a string (Base62 encoded), a bigint, or an instance of `HybridID`.
     * 
     * @returns {id is HybridID} Returns true if the ID is a valid Hybrid ID, 
     * false otherwise.
     */
    isHybridID(id: string | bigint | HybridID): id is HybridID {
        // If the input is a HybridID, we can return true without further checks
        if (id instanceof HybridID) {
            return true;
        }

        // If the input is a string, we need to check its format and decode it
        if (typeof id === 'string') {
            // Check if the string contains only valid Base62 characters
            if (!/^[0-9a-zA-Z]+$/.test(id)) {
                return false;  // Invalid characters for Base62
            }

            try {
                // Decode and reassign id if it's valid Base62
                id = this.fromBase62(id);
            } catch {
                return false;  // Return false if decoding throws an error
            }
        }

        // At this point, `id` must be of type bigint
        const totalBits = this.sequenceBits + this.randomBits + this.entropyBits + this.machineIdBits;

        const timestamp = id >> BigInt(totalBits);
        if (timestamp < BigInt(0)) return false;  // Timestamp must be non-negative
        if (timestamp > this.maxTimestamp) return false;  // Timestamp must be within configured bit range

        const machineIdShift = this.sequenceBits + this.randomBits + this.entropyBits;
        const machineId = Number((id >> BigInt(machineIdShift)) & BigInt((1 << this.machineIdBits) - 1));
        if (machineId < 0 || machineId > this.maxMachineId) return false;  // Check valid machine ID range

        const randomBits = Number((id >> BigInt(this.sequenceBits)) & BigInt((1 << this.randomBits) - 1));
        if (randomBits < 0 || randomBits >= (1 << this.randomBits)) return false;  // Valid range for random bits

        const sequence = Number(id & BigInt(this.maxSequence));
        if (sequence < 0 || sequence > this.maxSequence) return false;  // Valid sequence range

        return true; // All checks passed, it's a valid Hybrid ID
    }


    /**
     * Validates the given ID and checks if it is a valid Hybrid ID.
     *
     * This method uses the `isHybridID` method to validate the ID. 
     * If the ID is valid, it returns an object indicating the validity 
     * of the ID. If it is invalid, it provides a reason for the failure.
     *
     * @param {bigint | string} id - The ID to validate. 
     * It can be a bigint or a Base62 encoded string.
     * 
     * @returns {{ valid: boolean; reason?: string }} An object containing:
     * - `valid` (boolean): Indicates whether the ID is valid.
     * - `reason` (string, optional): A reason for invalidation if applicable.
     */
    validateID(id: bigint | string): { valid: boolean; reason?: string } {
        if (!this.isHybridID(id)) {
            return { valid: false, reason: 'Invalid Hybrid ID' };
        }
        
        return { valid: true };
    }


    /**
     * Retrieves information about a given Hybrid ID.
     *
     * This method extracts various components from the Hybrid ID, including the 
     * timestamp, machine ID, random bits, and sequence number. If the provided 
     * ID is in Base62 format or an instance of `HybridID`, it converts it to a 
     * bigint for processing. If the ID is invalid, an error is thrown.
     *
     * @param {HybridID | bigint | string} id - The Hybrid ID to extract information from. 
     * It can be an instance of `HybridID`, a bigint, or a Base62 encoded string.
     * 
     * @returns {HybridIDInfo} An object containing the extracted information:
     * - `timestamp` (bigint): The timestamp portion of the Hybrid ID. 
     *   Returns -1 if the timestamp is masked.
     * - `machineId` (number): The machine ID extracted from the Hybrid ID.
     * - `randomBits` (number): The random bits extracted from the Hybrid ID.
     * - `sequence` (number): The sequence number extracted from the Hybrid ID.
     * - `masked` (boolean): Indicates whether the timestamp is masked.
     * 
     * @throws {Error} If the provided ID is invalid.
     */
    info(id: HybridID | bigint | string): HybridIDInfo {
        if (id instanceof HybridID) {
            id = (id as HybridID).toBigInt();
        }

        // check if the id is valid
        if (!this.isHybridID(id)) {
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
