/**
 * Web-based alternative to OpenCV's CLAHE for real-time video enhancement.
 * Since running full CLAHE pixel-by-pixel in JavaScript at 60FPS is too slow,
 * we use hardware-accelerated Canvas 2D filters to achieve a similar 
 * contrast and brightness enhancement for low-light conditions.
 */

export function enhanceFrame(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement): string {
    const ctx = canvasElement.getContext('2d');
    if (!ctx) return '';

    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    // Apply hardware-accelerated filters to simulate CLAHE/Low-light enhancement
    // 1. Brightness: Boost overall light
    // 2. Contrast: Increase difference between dark and light areas
    // 3. Saturate: Recover colors lost in low light
    ctx.filter = 'brightness(1.2) contrast(1.3) saturate(1.2)';
    
    // Draw the video frame onto the canvas with the filter applied
    ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    
    // Reset filter
    ctx.filter = 'none';

    // Return base64 image for AI analysis
    return canvasElement.toDataURL('image/jpeg', 0.8).split(',')[1];
}

/**
 * For MediaPipe processing, if we want to send an enhanced frame instead of the raw video.
 * Note: MediaPipe is usually robust to lighting, but if it fails, we can pass this canvas.
 */
export function getEnhancedCanvas(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement): HTMLCanvasElement {
    const ctx = canvasElement.getContext('2d');
    if (!ctx) return canvasElement;

    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    // Simulate CLAHE
    ctx.filter = 'brightness(1.2) contrast(1.3) saturate(1.2)';
    ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    ctx.filter = 'none';

    return canvasElement;
}
