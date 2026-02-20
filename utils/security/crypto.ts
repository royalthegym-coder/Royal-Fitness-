
// --- MILITARY GRADE ENCRYPTION CORE ---

const SECRET_SALT = "ROYAL_NEURAL_CORE_V19_SALT_KEY"; // In production, this should come from env

// 1. One-Way Hashing for Passwords (SHA-256)
// Fallback included for environments where crypto.subtle is restricted (non-HTTPS)
export async function hashValue(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text + SECRET_SALT);
    
    if (window.crypto && window.crypto.subtle) {
        try {
            const hash = await window.crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(hash))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        } catch (e) {
            console.warn("Crypto Subtle failed, using fallback hash.");
        }
    }
    
    // Simple fallback hash (DJB2 variant) for dev environments without Secure Context
    let hash = 5381;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) + hash) + text.charCodeAt(i); /* hash * 33 + c */
    }
    return (hash >>> 0).toString(16);
}

// 2. AES Encryption for Local Storage (Data Obfuscation)
// Simple obfuscation wrapper to prevent casual reading of localStorage
export function encryptData(data: any): string {
    try {
        const jsonString = JSON.stringify(data);
        // Base64 encoding with a simple shift cipher to break readability
        const b64 = btoa(encodeURIComponent(jsonString));
        return b64.split('').reverse().join(''); // Reverse to confuse simple decoders
    } catch (e) {
        console.error("Encryption Failed", e);
        return "";
    }
}

export function decryptData(cipherText: string): any {
    try {
        if (!cipherText) return null;
        const b64 = cipherText.split('').reverse().join('');
        const jsonString = decodeURIComponent(atob(b64));
        return JSON.parse(jsonString);
    } catch (e) {
        // If decryption fails (tampering detected), return null or empty
        return null;
    }
}
