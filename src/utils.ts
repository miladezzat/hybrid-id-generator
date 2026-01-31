import { Base32Chars, Base62Chars, Base64Chars } from './constants';

function getNodeCrypto(): typeof import('crypto') | null {
    if (typeof process !== 'undefined' && process.versions?.node) {
        try {
            return require('crypto');
        } catch {
            return null;
        }
    }
    return null;
}

/**
 * Generates random bits with an option to use either cryptographic or non-cryptographic random number generation.
 * When useCrypto is true: uses globalThis.crypto.getRandomValues (browser/Node 19+) or Node crypto.randomBytes.
 *
 * @param {number} randomBits - The number of random bits to generate.
 * @param {boolean} useCrypto - Whether to use cryptographic random number generation (true) or non-cryptographic (false).
 * @returns {number} A random number within the range defined by the specified number of bits.
 */
export function generateRandomBits(randomBits: number, useCrypto: boolean): number {
    if (useCrypto) {
        const byteCount = Math.ceil(randomBits / 8);
        if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
            const arr = new Uint8Array(byteCount);
            globalThis.crypto.getRandomValues(arr);
            let randomNum = 0;
            for (let i = 0; i < arr.length; i++) {
                randomNum = (randomNum << 8) | arr[i];
            }
            return randomNum & ((1 << randomBits) - 1);
        }
        const nodeCrypto = getNodeCrypto();
        if (nodeCrypto) {
            const randomBytes = nodeCrypto.randomBytes(byteCount);
            let randomNum = 0;
            for (let i = 0; i < randomBytes.length; i++) {
                randomNum = (randomNum << 8) | randomBytes[i];
            }
            return randomNum & ((1 << randomBits) - 1);
        }
    }
    const maxRandomValue = (1 << randomBits) - 1;
    return Math.floor(Math.random() * (maxRandomValue + 1));
}

/**
 * Obfuscates a timestamp using SHA-256 hashing (Node.js crypto only).
 * The first 16 characters of the hash are used to create a bigint representation.
 *
 * @param {bigint} timestamp - The timestamp in bigint format to be obfuscated.
 * @returns {bigint} A bigint representation of the obfuscated timestamp.
 * @throws {Error} When run outside Node.js (requires Node crypto module).
 */
export function obfuscateTimestamp(timestamp: bigint): bigint {
    const crypto = getNodeCrypto();
    if (!crypto) {
        throw new Error('obfuscateTimestamp requires Node.js (crypto module).');
    }
    const hash = crypto.createHash('sha256');
    hash.update(timestamp.toString());
    return BigInt('0x' + hash.digest('hex').slice(0, 16)); // First 16 characters of hash
}

/**
 * Validates and returns a machine ID for explicit numeric use.
 * Used when no strategy is set, or when strategy is 'random' (number required).
 * For 'env' and 'network' strategies, HybridIDGenerator uses MachineIDProviderFactory instead.
 *
 * @param {string | undefined} machineIdStrategy - The strategy ('random' or undefined).
 * @param {number | string | undefined} machineId - The machine ID to validate (number when strategy is 'random').
 * @param {number} maxMachineId - The maximum valid value for the machine ID.
 * @returns {number} A validated machine ID.
 * @throws {Error} If the machine ID is invalid based on the strategy.
 */
export function validateMachineId(machineIdStrategy: string | undefined, machineId: number | string | undefined, maxMachineId: number): number {
    if (machineIdStrategy === 'random') {
        if (typeof machineId !== 'number') {
            throw new Error("When machineIdStrategy is 'random', machineId must be provided as a number.");
        }
        if (machineId < 0 || machineId > maxMachineId) {
            throw new Error(`Machine ID must be between 0 and ${maxMachineId}.`);
        }
        return machineId;
    }
    if (typeof machineId === 'number') {
        if (machineId < 0 || machineId > maxMachineId) {
            throw new Error(`Machine ID must be between 0 and ${maxMachineId}.`);
        }
        return machineId;
    }
    return Math.floor(Math.random() * (maxMachineId + 1));
}

// Helper function to convert input to bigint
/**
 * Converts the input to a bigint.
 *
 * @param {bigint | string} input - The input to convert, which can be either a bigint or a string.
 * @returns {bigint} The converted bigint.
 */
function toBigInt(input: bigint | string): bigint {
    return typeof input === 'bigint' ? input : BigInt(input);
}

/**
 * Encodes a bigint or string input to a Base62 string.
 *
 * @param {bigint | string} input - The bigint or string to encode.
 * @returns {string} The Base62 encoded string.
 */
export function encodeBase62(input: bigint | string): string {
    let num = toBigInt(input);
    let encoded = '';
    while (num > 0) {
        encoded = Base62Chars[Number(num % BigInt(62))] + encoded;
        num = num / BigInt(62);
    }
    return encoded || '0';
}

/**
 * Decodes a Base62 encoded string to a bigint.
 *
 * @param {string} encoded - The Base62 encoded string to decode.
 * @returns {bigint} The decoded bigint.
 */
export function decodeBase62(encoded: string): bigint {
    let num = BigInt(0);
    for (let i = 0; i < encoded.length; i++) {
        num = num * BigInt(62) + BigInt(Base62Chars.indexOf(encoded[i]));
    }
    return num;
}

/**
 * Encodes a bigint or string input to a Base32 string.
 *
 * @param {bigint | string} input - The bigint or string to encode.
 * @returns {string} The Base32 encoded string.
 */
export function encodeBase32(input: bigint | string): string {
    let num = toBigInt(input);
    let encoded = '';
    while (num > 0) {
        encoded = Base32Chars[Number(num % BigInt(32))] + encoded;
        num = num / BigInt(32);
    }
    return encoded || '0';
}

/**
 * Decodes a Base32 encoded string to a bigint.
 *
 * @param {string} encoded - The Base32 encoded string to decode.
 * @returns {bigint} The decoded bigint.
 */
export function decodeBase32(encoded: string): bigint {
    let num = BigInt(0);
    for (let i = 0; i < encoded.length; i++) {
        num = num * BigInt(32) + BigInt(Base32Chars.indexOf(encoded[i]));
    }
    return num;
}

/**
 * Decodes a Base64 encoded string to a bigint.
 *
 * @param {string} encoded - The Base64 encoded string to decode.
 * @returns {bigint} The decoded bigint.
 */
export function decodeBase64(encoded: string): bigint {
    let num = BigInt(0);
    for (let i = 0; i < encoded.length; i++) {
        num = num * BigInt(64) + BigInt(Base64Chars.indexOf(encoded[i]));
    }
    return num;
}

/**
 * Encodes a bigint or string input to a Base64 string.
 *
 * @param {bigint | string} input - The bigint or string to encode.
 * @returns {string} The Base64 encoded string.
 */
export function encodeBase64(input: bigint | string): string {
    let num = toBigInt(input);
    let encoded = '';
    while (num > 0) {
        encoded = Base64Chars[Number(num % BigInt(64))] + encoded;
        num = num / BigInt(64);
    }
    return encoded || '0';
}


export default {
    generateRandomBits,
    obfuscateTimestamp,
    validateMachineId,
    encodeBase62,
    decodeBase62,
    encodeBase32,
    decodeBase32,
    decodeBase64,
    encodeBase64
}