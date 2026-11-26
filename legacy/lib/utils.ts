
export const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result?.toString().split(',')[1];
            if (base64) resolve(base64);
            else reject(new Error("Failed to convert to base64"));
        };
        reader.onerror = (error) => reject(error);
    });
};

export const simulateNetworkDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const decode = (base64: string): ArrayBuffer => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

export const decodeAudioData = async (audioContext: AudioContext, buffer: ArrayBuffer): Promise<AudioBuffer> => {
    return new Promise((resolve, reject) => {
        audioContext.decodeAudioData(buffer, resolve, reject);
    });
};
