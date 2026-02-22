/**
 * Identity Guardian
 * Protects Dipanshu Maheshwari's credit and admin identity.
 * Do NOT modify this file without authorization.
 */

/* eslint-disable */

// ── djb2 hash (fast, non-cryptographic, sufficient as a deterrent) ──
function _h(s) {
    let hash = 5381;
    for (let i = 0; i < s.length; i++) {
        hash = ((hash << 5) + hash) ^ s.charCodeAt(i);
        hash = hash >>> 0; // unsigned 32-bit
    }
    return hash;
}

// ── Obfuscated references (char codes, not plaintext) ──────────────
// These decode to the protected strings so they are not grep-able.
const _creatorText = String.fromCharCode(87, 101, 98, 115, 105, 116, 101, 32, 67, 114, 101, 97, 116, 101, 100, 32, 98, 121, 32, 68, 105, 112, 97, 110, 115, 104, 117, 32, 77, 97, 104, 101, 115, 104, 119, 97, 114, 105);
const _creatorEmail = String.fromCharCode(100, 105, 112, 97, 110, 115, 104, 117, 109, 97, 104, 101, 115, 104, 119, 97, 114, 105, 55, 51, 54, 57, 56, 64, 103, 109, 97, 105, 108, 46, 99, 111, 109);
const _creatorName = String.fromCharCode(68, 105, 112, 97, 110, 115, 104, 117, 32, 77, 97, 104, 101, 115, 104, 119, 97, 114, 105);

// ── Pre-computed hashes (stored as numbers, not strings) ───────────
const _CTH = _h(_creatorText);   // hash of expected creator text
const _CEH = _h(_creatorEmail);  // hash of creator email
const _PWH = _h(String.fromCharCode(68, 64, 57, 105, 112, 97, 110, 115, 104, 117)); // hash of password

// ── Public API ─────────────────────────────────────────────────────

/** Returns true if the displayed creator text has not been tampered with */
export const verifyCreatorText = (text) => _h(text) === _CTH;

/** Returns true if the email matches the protected creator email */
export const verifyCreatorEmail = (email) => _h(email) === _CEH;

/** Returns true if the supplied password is correct */
export const verifyPassword = (pwd) => _h(pwd) === _PWH;

/** The expected creator display text (for rendering — locked behind hash) */
export const EXPECTED_LINE1 = String.fromCharCode(87, 101, 98, 115, 105, 116, 101, 32, 67, 114, 101, 97, 116, 101, 100, 32, 98, 121);
export const EXPECTED_LINE2 = _creatorName;
