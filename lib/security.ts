import CryptoJS from 'crypto-js';
import { encryptData as unifiedEncrypt, decryptData as unifiedDecrypt } from '../utils/encryption';

const ENCRYPTION_SECRET = 'fitness-fitness-secure-key-2026';

export const encryptData = (data: any, customSecret?: string): string => {
  return unifiedEncrypt(data, customSecret);
};

export const decryptData = (encryptedText: any, customSecret?: string): any => {
  return unifiedDecrypt(encryptedText, customSecret);
};

const toBase64Url = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Generates a Base64URL-encoded client session token for local sync telemetry.
 */
export const generateMockJWT = (payload: any): string => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 }));

  const signature = CryptoJS.HmacSHA256(`${encodedHeader}.${encodedPayload}`, ENCRYPTION_SECRET)
    .toString(CryptoJS.enc.Base64)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

/**
 * Optimizes the payload by stripping out unnecessary large data (like base64 images)
 * before sending it to the cloud, saving bandwidth and improving security.
 */
export const optimizePayloadForCloud = (memberData: any): any => {
  const optimized = { ...memberData };

  if (optimized.avatar && optimized.avatar.length > 1000) {
    optimized.avatar = 'URL_OR_REFERENCE_ONLY';
  }

  if (optimized.live_data) {
    optimized.live_data = {
      hrv: optimized.live_data.hrv,
      health_score: optimized.live_data.health_score
    };
  }

  return optimized;
};
