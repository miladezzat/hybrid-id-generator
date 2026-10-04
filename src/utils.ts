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
    if (!Number.isInteger(randomBits) || randomBits < 0 || randomBits > 32) {
        throw new Error('randomBits must be an integer between 0 and 32.');
    }
    if (randomBits === 0) return 0;
    const range = 2 ** randomBits;
    if (!useCrypto) return Math.floor(Math.random() * range);

    const bytes = new Uint8Array(Math.ceil(randomBits / 8));
    if (globalThis.crypto?.getRandomValues) {
        globalThis.crypto.getRandomValues(bytes);
    } else {
        const nodeCrypto = getNodeCrypto();
        if (!nodeCrypto) throw new Error('Cryptographic randomness is unavailable in this environment.');
        bytes.set(nodeCrypto.randomBytes(bytes.length));
    }
    let value = 0;
    for (const byte of bytes) value = value * 256 + byte;
    return value % range;
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
    if (!Number.isInteger(maxMachineId) || maxMachineId < 0 || maxMachineId > 4294967295) {
        throw new Error('Maximum machine ID must be an integer between 0 and 4294967295.');
    }
    if (machineIdStrategy !== undefined && machineIdStrategy !== 'random') {
        throw new Error(`Invalid machine ID strategy: ${machineIdStrategy}`);
    }
    if (machineId === undefined && machineIdStrategy === undefined) {
        return generateRandomBits(32, false) % (maxMachineId + 1);
    }
    if (typeof machineId !== 'number' || !Number.isSafeInteger(machineId) || machineId < 0 || machineId > maxMachineId) {
        throw new Error(`Machine ID must be between 0 and ${maxMachineId} and must be an integer.`);
    }
    return machineId;
}

/** Encode non-negative integers using positional digits, without byte padding. */
function encodeInteger(input: bigint | string, alphabet: string): string {
    if (typeof input !== 'bigint' && (typeof input !== 'string' || !/^[0-9]+$/.test(input))) {
        throw new Error('ID must be a non-negative integer or decimal string.');
    }
    let value = BigInt(input);
    if (value < 0n) throw new Error('ID must be a non-negative integer.');
    const base = BigInt(alphabet.length);
    let encoded = '';
    do {
        encoded = alphabet[Number(value % base)] + encoded;
        value /= base;
    } while (value > 0n);
    return encoded;
}

function decodeInteger(encoded: string, alphabet: string): bigint {
    if (typeof encoded !== 'string' || encoded.length === 0) throw new Error('Encoded ID must be a non-empty string.');
    let value = 0n;
    const base = BigInt(alphabet.length);
    for (const character of encoded) {
        const digit = alphabet.indexOf(character);
        if (digit < 0) throw new Error('Invalid character in encoded ID.');
        value = value * base + BigInt(digit);
    }
    return value;
}

export function encodeBase62(input: bigint | string): string { return encodeInteger(input, Base62Chars); }
export function decodeBase62(encoded: string): bigint { return decodeInteger(encoded, Base62Chars); }
export function encodeBase32(input: bigint | string): string { return encodeInteger(input, Base32Chars); }
export function decodeBase32(encoded: string): bigint { return decodeInteger(encoded, Base32Chars); }
export function encodeBase64(input: bigint | string): string { return encodeInteger(input, Base64Chars); }
export function decodeBase64(encoded: string): bigint { return decodeInteger(encoded, Base64Chars); }

export default { generateRandomBits, obfuscateTimestamp, validateMachineId,
    encodeBase62, decodeBase62, encodeBase32, decodeBase32, encodeBase64, decodeBase64 };
