import CryptoJS from 'crypto-js';

const MASTER_KEY = 'fitness-fitness-secure-key-2026';

// Legacy keys supported for seamless backward-compatible decryption across modules
const LEGACY_KEYS = [
  MASTER_KEY,
  'fitness-fitness-secure-key-2026',
  'fitness_fitness_super_secret_key_2026',
  'future-fitness-quantum-encryption-key-2026'
];

export const encryptData = (data: any, customSecret?: string): string => {
  try {
    const jsonString = JSON.stringify(data);
    const keyToUse = customSecret || MASTER_KEY;
    return CryptoJS.AES.encrypt(jsonString, keyToUse).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return '';
  }
};

export const decryptData = (encryptedData: any, customSecret?: string): any => {
  if (!encryptedData) return null;
  if (typeof encryptedData === 'object') return encryptedData;

  const candidateKeys = customSecret
    ? [customSecret, ...LEGACY_KEYS]
    : LEGACY_KEYS;

  for (const keyToUse of candidateKeys) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, keyToUse);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      if (decryptedString) {
        return JSON.parse(decryptedString);
      }
    } catch {
      // Try next key in fallback chain
    }
  }

  // Attempt to parse if it was stored as an unencrypted JSON string
  try {
    if (typeof encryptedData === 'string') {
      if (encryptedData.startsWith('{') || encryptedData.startsWith('[')) {
        return JSON.parse(encryptedData);
      }
      return encryptedData;
    }
  } catch {}

  return encryptedData;
};
