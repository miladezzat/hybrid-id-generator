import crypto from 'crypto';
import { Base32Chars, Base62Chars, Base64Chars } from './constants';

/**
 * Generates random bits with an option to use either cryptographic or non-cryptographic random number generation.
 *
 * @param {number} randomBits - The number of random bits to generate.
 * @param {boolean} useCrypto - Whether to use cryptographic random number generation (true) or non-cryptographic (false).
 * @returns {number} A random number within the range defined by the specified number of bits.
 */
export function generateRandomBits(randomBits: number, useCrypto: boolean): number {
    if (useCrypto) {
        const randomBytes = crypto.randomBytes(Math.ceil(randomBits / 8));
        let randomNum = 0;
        for (const byte of randomBytes) {
            randomNum = (randomNum << 8) | byte;
        }
        return randomNum & ((1 << randomBits) - 1);
    } else {
        // Non-crypto RNG optimization for better performance
        const maxRandomValue = (1 << randomBits) - 1;
        return Math.floor(Math.random() * (maxRandomValue + 1));
    }
}

/**
 * Obfuscates a timestamp using SHA-256 hashing.
 * The first 16 characters of the hash are used to create a bigint representation.
 *
 * @param {bigint} timestamp - The timestamp in bigint format to be obfuscated.
 * @returns {bigint} A bigint representation of the obfuscated timestamp.
 */
export function obfuscateTimestamp(timestamp: bigint): bigint {
    const hash = crypto.createHash('sha256');
    hash.update(timestamp.toString());
    return BigInt('0x' + hash.digest('hex').slice(0, 16)); // First 16 characters of hash
}

/**
 * Validates and returns a machine ID based on the specified strategy.
 *
 * @param {string | undefined} machineIdStrategy - The strategy for generating or retrieving the machine ID ('env', 'random', or undefined).
 * @param {number | string | undefined} machineId - The machine ID to validate, based on the strategy.
 * @param {number} maxMachineId - The maximum valid value for the machine ID.
 * @returns {number} A validated machine ID.
 * @throws {Error} If the machine ID is invalid based on the strategy.
 */
export function validateMachineId(machineIdStrategy: string | undefined, machineId: number | string | undefined, maxMachineId: number): number {
    if (machineIdStrategy === 'env') {
        // Machine ID must be provided and must be a string
        if (typeof machineId !== 'string') {
            throw new Error("When machineIdStrategy is 'env', machineId must be provided as a string.");
        }
        // For 'env' strategy, return a default or hashed numeric representation of the machine ID string
        return machineId.length; // Example: convert string to a numeric value (replace with your logic)
    } else if (machineIdStrategy === 'random') {
        // Machine ID must be provided and must be a number
        if (typeof machineId !== 'number') {
            throw new Error("When machineIdStrategy is 'random', machineId must be provided as a number.");
        }
        if (machineId < 0 || machineId > maxMachineId) {
            throw new Error(`Machine ID must be between 0 and ${maxMachineId}.`);
        }
        return machineId;
    } else {
        // Default behavior for other cases or when machineIdStrategy is not provided
        if (typeof machineId === 'number') {
            // Ensure the machine ID is within valid bounds
            if (machineId < 0 || machineId > maxMachineId) {
                throw new Error(`Machine ID must be between 0 and ${maxMachineId}.`);
            }
            return machineId;
        } else {
            // If no valid machineId is provided, return a random value or use a fallback
            return Math.floor(Math.random() * maxMachineId);
        }
    }
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
