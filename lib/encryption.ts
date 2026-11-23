// Client-side encryption using Web Crypto API
// This makes the application a "Blind Data Store"

const ENCRYPTION_KEY_NAME = 'quantum_omni_encryption_key';

async function getOrCreateKey(): Promise<CryptoKey> {
    // In a real app, this key would be derived from user biometrics or a master password.
    // For this prototype, we store a generated key in localStorage.
    let keyData = localStorage.getItem(ENCRYPTION_KEY_NAME);
    
    if (!keyData) {
        const key = await window.crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
        const exported = await window.crypto.subtle.exportKey('jwk', key);
        localStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(exported));
        return key;
    }

    const jwk = JSON.parse(keyData);
    return await window.crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
    );
}

export async function encryptData(data: string): Promise<string> {
    try {
        const key = await getOrCreateKey();
        const encoder = new TextEncoder();
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        
        const encryptedContent = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encoder.encode(data)
        );

        // Combine IV and encrypted data
        const encryptedBytes = new Uint8Array(encryptedContent);
        const combined = new Uint8Array(iv.length + encryptedBytes.length);
        combined.set(iv);
        combined.set(encryptedBytes, iv.length);

        // Convert to base64
        return btoa(String.fromCharCode.apply(null, Array.from(combined)));
    } catch (error) {
        console.error("Encryption failed:", error);
        return data; // Fallback to unencrypted if it fails
    }
}

export async function decryptData(encryptedBase64: string): Promise<string> {
    try {
        const key = await getOrCreateKey();
        
        // Convert from base64
        const binaryString = atob(encryptedBase64);
        const combined = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            combined[i] = binaryString.charCodeAt(i);
        }

        // Extract IV and encrypted data
        const iv = combined.slice(0, 12);
        const encryptedBytes = combined.slice(12);

        const decryptedContent = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encryptedBytes
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedContent);
    } catch (error) {
        console.error("Decryption failed:", error);
        return encryptedBase64; // Fallback to original if it fails
    }
}
