//src/HybridID.ts
import { Base62Chars, Base32Chars, Base64Chars } from "./constants";
import { encodeBase62, encodeBase32, encodeBase64, decodeBase62, decodeBase32, decodeBase64 } from "./utils";

export class HybridID {
    /**
     * Creates an instance of HybridID.
     * @param id - The ID value as a bigint or string.
     */
    constructor(private id: bigint | string) { }

    /**
     * Converts the ID to a Base62 encoded string.
     * @returns The Base62 encoded string representation of the ID.
     */
    toBase62(): string {
        return encodeBase62(this.id);
    }

    /**
     * Converts the ID to a Base32 encoded string.
     * @returns The Base32 encoded string representation of the ID.
     */
    toBase32(): string {
        return encodeBase32(this.id);
    }

    /**
     * Converts the ID to a Base64 encoded string.
     * @returns The Base64 encoded string representation of the ID.
     */
    toBase64(): string {
        return encodeBase64(this.id);
    }

    /**
     * Creates a HybridID instance from a Base62 encoded string.
     * @param encoded - The Base62 encoded string.
     * @returns A new HybridID instance.
     * @throws Error if the encoded string is invalid.
     */
    static fromBase62(encoded: string): HybridID {
        if (!this.isValidBase62(encoded)) {
            throw new Error('Invalid Base62 encoded string');
        }
        const decodedId = decodeBase62(encoded);
        return new HybridID(decodedId);
    }

    /**
     * Creates a HybridID instance from a Base32 encoded string.
     * @param encoded - The Base32 encoded string.
     * @returns A new HybridID instance.
     * @throws Error if the encoded string is invalid.
     */
    static fromBase32(encoded: string): HybridID {
        if (!this.isValidBase32(encoded)) {
            throw new Error('Invalid Base32 encoded string');
        }
        const decodedId = decodeBase32(encoded);
        return new HybridID(decodedId);
    }

    /**
     * Creates a HybridID instance from a Base64 encoded string.
     * @param encoded - The Base64 encoded string.
     * @returns A new HybridID instance.
     * @throws Error if the encoded string is invalid.
     */
    static fromBase64(encoded: string): HybridID {
        if (!this.isValidBase64(encoded)) {
            throw new Error('Invalid Base64 encoded string');
        }
        const decodedId = decodeBase64(encoded);
        return new HybridID(decodedId);
    }

    /**
     * Converts the ID to a hexadecimal string.
     * @returns The hexadecimal representation of the ID.
     */
    toHex(): string {
        return this.id.toString(16);
    }

    /**
     * Creates a HybridID instance from a hexadecimal string.
     * @param hex - The hexadecimal string.
     * @returns A new HybridID instance.
     */
    static fromHex(hex: string): HybridID {
        return new HybridID(BigInt('0x' + hex));
    }

    /**
     * Converts the ID to a string.
     * @returns The string representation of the ID.
     */
    toString(): string {
        return this.id.toString();
    }

    /**
     * Converts the ID to a bigint.
     * @returns The ID as a bigint.
     */
    toBigInt(): bigint {
        return BigInt(this.id);
    }

    /**
     * Returns the ID value as a bigint or string.
     * @returns The ID value.
     */
    valueOf(): bigint | string {
        return this.id;
    }

    /**
     * Checks if the current HybridID is equal to another.
     * @param other - The other HybridID to compare with.
     * @returns True if equal, false otherwise.
     */
    isEqual(other: HybridID): boolean {
        return this.id === other.id;
    }

    /**
     * Checks if the current HybridID is greater than another.
     * @param other - The other HybridID to compare with.
     * @returns True if greater, false otherwise.
     */
    isGreaterThan(other: HybridID): boolean {
        return this.id > other.id;
    }

    /**
     * Checks if the current HybridID is less than another.
     * @param other - The other HybridID to compare with.
     * @returns True if less, false otherwise.
     */
    isLessThan(other: HybridID): boolean {
        return this.id < other.id;
    }

    /**
     * Validates if a Base62 encoded string is valid.
     * @param encoded - The Base62 encoded string to validate.
     * @returns True if valid, false otherwise.
     */
    static isValidBase62(encoded: string): boolean {
        const escapedChars = Base62Chars.replace(/[-\/\\^$.*+?()[\]{}|]/g, '\\$&'); // Escape special regex characters
        const regex = new RegExp(`^[${escapedChars}]+$`);
        return regex.test(encoded);
    }
    
    /**
     * Validates if a Base32 encoded string is valid.
     * @param encoded - The Base32 encoded string to validate.
     * @returns True if valid, false otherwise.
     */
    static isValidBase32(encoded: string): boolean {
        // Create a regex for valid Base32 characters
        const escapedChars = Base32Chars.replace(/[-\/\\^$.*+?()[\]{}|]/g, '\\$&'); // Escape special regex characters
        const regex = new RegExp(`^[${escapedChars}]+$`);
        return regex.test(encoded);
    }
    
    /**
     * Validates if a Base64 encoded string is valid.
     * @param encoded - The Base64 encoded string to validate.
     * @returns True if valid, false otherwise.
     */
    static isValidBase64(encoded: string): boolean {
        // Create a regex for valid Base64 characters
        const escapedChars = Base64Chars.replace(/[-\/\\^$.*+?()[\]{}|]/g, '\\$&'); // Escape special regex characters
        const regex = new RegExp(`^[${escapedChars}]*={0,2}$`); // Allow 0 to 2 '=' padding at the end
    
        // Check for valid characters and padding
        if (!regex.test(encoded)) {
            return false; // Invalid character found or padding format is incorrect
        }
    
        // Check if the string is in valid Base64 format without padding issues
        const base64WithoutPadding = encoded.replace(/=+$/, ''); // Remove padding
        return /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/.test(base64WithoutPadding);
    }    

    /**
     * Serializes the HybridID instance to a JSON string.
     * @returns The serialized JSON string representation of the HybridID.
     */
    serialize(): string {
        return JSON.stringify({ id: this.id.toString() });
    }

    /**
     * Deserializes a JSON string to create a HybridID instance.
     * @param serialized - The serialized JSON string.
     * @returns A new HybridID instance.
     */
    static deserialize(serialized: string): HybridID {
        const data = JSON.parse(serialized);
        return new HybridID(BigInt(data.id));
    }

    /**
     * Generates a random HybridID instance.
     * @returns A new HybridID instance with a random ID.
     */
    static generateRandom(): HybridID {
        const randomId = BigInt(crypto.getRandomValues(new Uint32Array(1))[0]);
        return new HybridID(randomId);
    }
}


export default HybridID;