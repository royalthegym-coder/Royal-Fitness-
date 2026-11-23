import { encryptData as unifiedEncrypt, decryptData as unifiedDecrypt } from '../encryption';

export const encryptData = (data: any, customSecret?: string): string => {
  return unifiedEncrypt(data, customSecret);
};

export const decryptData = (ciphertext: any, customSecret?: string): any => {
  return unifiedDecrypt(ciphertext, customSecret);
};
