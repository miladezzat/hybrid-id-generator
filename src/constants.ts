// src/constants.ts

/**
 * Characters used for Base62 encoding (0-9, a-z, A-Z).
 */
export const Base62Chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Characters used for Base32 encoding (A-Z, 2-7).
 * RFC 4648 standard.
 */
export const Base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Characters used for Base64 encoding (A-Z, a-z, 0-9, +, /).
 */
export const Base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
