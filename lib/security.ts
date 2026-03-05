import CryptoJS from 'crypto-js';

// In a real app, this secret should be securely stored in environment variables
// and NEVER exposed to the client. For E2E encryption, the key should be derived
// from the user's password or a secure key exchange mechanism.
const ENCRYPTION_SECRET = import.meta.env.VITE_ENCRYPTION_SECRET || 'royal_fitness_super_secret_key_2026';

/**
 * Encrypts sensitive health and payment data before sending to the server or saving locally.
 * (End-to-End Encryption Simulation)
 */
export const encryptData = (data: any): string => {
    try {
        const jsonString = JSON.stringify(data);
        return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_SECRET).toString();
    } catch (e) {
        console.error("Encryption failed:", e);
        return "";
    }
};

/**
 * Decrypts sensitive data received from the server or local storage.
 */
export const decryptData = (encryptedText: string): any => {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_SECRET);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decryptedString);
    } catch (e) {
        console.error("Decryption failed:", e);
        return null;
    }
};

/**
 * Simulates generating a JWT token for secure API communication.
 * In a real app, this happens on the backend.
 */
export const generateMockJWT = (payload: any): string => {
    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify({ ...payload, exp: Date.now() + 3600000 })); // 1 hour expiry
    
    const signature = CryptoJS.HmacSHA256(`${encodedHeader}.${encodedPayload}`, ENCRYPTION_SECRET).toString(CryptoJS.enc.Base64);
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
};

/**
 * Optimizes the payload by stripping out unnecessary large data (like base64 images)
 * before sending it to the cloud, saving bandwidth and improving security.
 */
export const optimizePayloadForCloud = (memberData: any): any => {
    const optimized = { ...memberData };
    
    // Remove heavy or non-essential data before syncing
    if (optimized.avatar && optimized.avatar.length > 1000) {
        optimized.avatar = "URL_OR_REFERENCE_ONLY"; // Don't sync raw base64 images
    }
    
    // Only send essential health metrics to the cloud, keep raw sensor data local
    if (optimized.live_data) {
        optimized.live_data = {
            hrv: optimized.live_data.hrv,
            health_score: optimized.live_data.health_score
            // Strip out high-frequency raw ECG/PPG data
        };
    }
    
    return optimized;
};
