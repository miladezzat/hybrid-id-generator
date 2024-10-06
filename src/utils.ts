import crypto from 'crypto';
import { Base62Chars } from './constants';

// Generate random bits
export function generateRandomBits(randomBits: number, useCrypto: boolean): number {
    if (useCrypto) {
        const randomBytes = crypto.randomBytes(Math.ceil(randomBits / 8));
        let randomNum = 0;
        for (let i = 0; i < randomBytes.length; i++) {
            randomNum = (randomNum << 8) | randomBytes[i];
        }
        return randomNum & ((1 << randomBits) - 1);
    } else {
        return Math.floor(Math.random() * (1 << randomBits));
    }
}

// Obfuscate timestamp using hashing
export function obfuscateTimestamp(timestamp: bigint): bigint {
    const hash = crypto.createHash('sha256');
    hash.update(timestamp.toString());
    return BigInt('0x' + hash.digest('hex').slice(0, 16)); // First 16 characters of hash
}

// Encode bigint to Base62
export function encodeBase62(num: bigint): string {
    let encoded = '';
    while (num > 0) {
        encoded = Base62Chars[Number(num % BigInt(62))] + encoded;
        num = num / BigInt(62);
    }
    return encoded || '0';
}

// Decode Base62 to bigint
export function decodeBase62(encoded: string): bigint {
    let num = BigInt(0);
    for (let i = 0; i < encoded.length; i++) {
        num = num * BigInt(62) + BigInt(Base62Chars.indexOf(encoded[i]));
    }
    return num;
}
