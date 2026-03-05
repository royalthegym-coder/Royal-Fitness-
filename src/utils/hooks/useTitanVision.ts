import React, { useEffect, useRef, useState } from 'react';

// 2. Skeleton Drift Solution: EMA Filter (Exponential Moving Average)
// यह क्लास शीशे (mirrors) या ख़राब रोशनी के कारण होने वाले 'Jitter' (हड्डियों के खिसकने) को रोकेगी।
class PoseSmoother {
    private alpha: number;
    private prevPoints: Map<number, { x: number, y: number, z: number }>;

    constructor(alpha = 0.5) {
        this.alpha = alpha; // 0.0 से 1.0 के बीच (कम वैल्यू = ज्यादा स्मूथ, लेकिन थोड़ा डिले)
        this.prevPoints = new Map();
    }

    smooth(landmarkIndex: number, currentPoint: { x: number, y: number, z: number }) {
        const prev = this.prevPoints.get(landmarkIndex);
        if (!prev) {
            this.prevPoints.set(landmarkIndex, currentPoint);
            return currentPoint;
        }

        // पुराना पॉइंट और नए पॉइंट का औसत (EMA Filter)
        const smoothed = {
            x: (this.alpha * currentPoint.x) + ((1 - this.alpha) * prev.x),
            y: (this.alpha * currentPoint.y) + ((1 - this.alpha) * prev.y),
            z: (this.alpha * currentPoint.z) + ((1 - this.alpha) * prev.z),
        };
        
        this.prevPoints.set(landmarkIndex, smoothed);
        return smoothed;
    }
}

export const useTitanVision = (videoElementRef: React.RefObject<HTMLVideoElement | null>) => {
    const [isReady, setIsReady] = useState(false);
    const smootherRef = useRef(new PoseSmoother(0.4)); 
    const workerRef = useRef<Worker | null>(null);
    const animationFrameRef = useRef<number>(0);

    useEffect(() => {
        let stream: MediaStream | null = null;

        // 1. Web Worker for Parallel Processing (Avoid UI Freezing)
        // React में हम Isolate की जगह Web Workers का उपयोग करते हैं।
        /*
        workerRef.current = new Worker(new URL('../workers/poseWorker.ts', import.meta.url));
        workerRef.current.onmessage = (event) => {
            const rawLandmarks = event.data;
            
            // Apply smoothing to prevent Skeleton Drift
            const smoothedLandmarks = rawLandmarks.map((lm: any, idx: number) => 
                smootherRef.current.smooth(idx, lm)
            );
            
            // Update UI with smoothedLandmarks...
        };
        */

        const startCamera = async () => {
            if (videoElementRef.current) {
                try {
                    // Frame Rate Optimization: 30 FPS की जगह 15 FPS का अनुरोध करें ताकि बैटरी बचे
                    stream = await navigator.mediaDevices.getUserMedia({ 
                        video: { 
                            width: { ideal: 640 }, 
                            height: { ideal: 480 }, 
                            frameRate: { ideal: 15 } 
                        } 
                    });
                    videoElementRef.current.srcObject = stream;
                    setIsReady(true);
                } catch (err) {
                    console.error("Titan Vision: Camera access denied or failed.", err);
                }
            }
        };

        startCamera();

        // 3. Memory Leak Solution: Proper Cleanup (Garbage Collection)
        // जब कंपोनेंट अनमाउंट होगा, तो यह क्लीनअप फंक्शन चलेगा
        return () => {
            console.log("Disposing Titan Vision resources to prevent Memory Leaks...");
            
            // कैमरा हार्डवेयर को पूरी तरह बंद करें
            if (stream) {
                stream.getTracks().forEach(track => {
                    track.stop(); 
                });
            }
            
            // बैकग्राउंड वर्कर को खत्म करें
            if (workerRef.current) {
                workerRef.current.terminate(); 
            }
            
            // एनीमेशन लूप रोकें
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            
            // MediaPipe इंस्टेंस को बंद करने का कोड यहाँ आएगा
            // mediaPipeEngine?.close();
        };
    }, [videoElementRef]);

    return { isReady };
};
