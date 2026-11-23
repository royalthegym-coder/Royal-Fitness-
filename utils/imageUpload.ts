/**
 * Client-side image compression and safe URL utilities for Gym Logos and Owner Signatures.
 * Keeps uploaded images lightweight (<80KB) for smooth Firestore & localStorage persistence.
 */

export interface ImageCompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  preserveAlpha?: boolean;
}

const MAX_INPUT_BYTES = 10 * 1024 * 1024; // 10 MB safety cap

export const compressImageFile = (
  file: File,
  options: ImageCompressOptions = {}
): Promise<string> => {
  const {
    maxWidth = 420,
    maxHeight = 420,
    quality = 0.85,
    preserveAlpha = false,
  } = options;

  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file (PNG, JPG, WebP).'));
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      reject(new Error('Image file is too large. Please upload an image under 10 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid or corrupted image file.'));
      img.onload = () => {
        let { width, height } = img;
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        width = Math.max(1, Math.round(width * ratio));
        height = Math.max(1, Math.round(height * ratio));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        if (!preserveAlpha) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = preserveAlpha ? 'image/png' : 'image/webp';
        let compressed = canvas.toDataURL(mimeType, quality);
        // Fallback to JPEG if browser does not encode WebP
        if (!preserveAlpha && !compressed.startsWith('data:image/webp')) {
          compressed = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(compressed);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Validates and normalizes an external URL (e.g. Google Maps location link) to prevent unsafe protocols.
 */
export const normalizeSafeExternalUrl = (rawUrl?: string | null): string => {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^(maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google\.|www\.google\.com\/maps|g\.page\/)/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  // Treat plain coordinates or search terms as a safe Google Maps search link
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
};
