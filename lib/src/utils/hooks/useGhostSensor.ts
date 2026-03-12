import React, { useEffect, useRef, useState } from 'react';
import { FaceMesh, Results } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

export const useGhostSensor = (videoRef: React.RefObject<HTMLVideoElement | null>) => {
    const [heartRate, setHeartRate] = useState<number | null>(null);
    const [stressLevel, setStressLevel] = useState<'Low' | 'Moderate' | 'High' | 'Critical' | null>(null);
    const [isDetecting, setIsDetecting] = useState<boolean>(false);
    
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const signalBuffer = useRef<number[]>([]);
    const timeBuffer = useRef<number[]>([]);
    const faceMeshRef = useRef<FaceMesh | null>(null);
    const cameraRef = useRef<Camera | null>(null);
    
    // Forehead landmarks in MediaPipe Face Mesh
    const FOREHEAD_LANDMARKS = [10, 107, 66, 105, 104, 103, 67, 109, 338, 337, 336, 334, 296, 336, 9];

    useEffect(() => {
        if (!videoRef.current) return;

        canvasRef.current = document.createElement('canvas');
        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });

        const onResults = (results: Results) => {
            if (!ctx || !canvasRef.current || !videoRef.current) return;
            
            setIsDetecting(true);
            
            const video = videoRef.current;
            if (canvasRef.current.width !== video.videoWidth) {
                canvasRef.current.width = video.videoWidth;
                canvasRef.current.height = video.videoHeight;
            }

            ctx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                const landmarks = results.multiFaceLandmarks[0];
                
                // Calculate bounding box for forehead
                let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
                
                FOREHEAD_LANDMARKS.forEach(index => {
                    const lm = landmarks[index];
                    const x = lm.x * canvasRef.current!.width;
                    const y = lm.y * canvasRef.current!.height;
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                });

                // Add some padding
                minX = Math.max(0, minX - 10);
                minY = Math.max(0, minY - 10);
                maxX = Math.min(canvasRef.current!.width, maxX + 10);
                maxY = Math.min(canvasRef.current!.height, maxY + 10);
                
                const width = maxX - minX;
                const height = maxY - minY;

                if (width > 0 && height > 0) {
                    const frameData = ctx.getImageData(minX, minY, width, height);
                    const data = frameData.data;

                    // Extract Green Channel Average
                    let greenSum = 0;
                    for (let i = 1; i < data.length; i += 4) {
                        greenSum += data[i];
                    }
                    const greenAverage = greenSum / (data.length / 4);

                    const now = performance.now();
                    signalBuffer.current.push(greenAverage);
                    timeBuffer.current.push(now);

                    // Keep ~10 seconds of data for better HRV calculation (assuming ~30fps -> 300 frames)
                    if (timeBuffer.current.length > 300) {
                        signalBuffer.current.shift();
                        timeBuffer.current.shift();
                    }

                    // Calculate BPM every 30 frames (~1 second)
                    if (signalBuffer.current.length % 30 === 0 && signalBuffer.current.length >= 150) {
                        calculateVitals();
                    }
                }
            } else {
                setIsDetecting(false);
            }
        };

        const calculateVitals = () => {
            const signal = signalBuffer.current;
            const times = timeBuffer.current;

            // 1. Detrending & Smoothing
            const smoothedSignal = [];
            const windowSize = 5;
            for (let i = 0; i < signal.length - windowSize; i++) {
                const avg = signal.slice(i, i + windowSize).reduce((a, b) => a + b, 0) / windowSize;
                smoothedSignal.push(avg);
            }

            // 2. Peak Detection
            const peakIndices: number[] = [];
            for (let i = 1; i < smoothedSignal.length - 1; i++) {
                if (smoothedSignal[i] > smoothedSignal[i - 1] && smoothedSignal[i] > smoothedSignal[i + 1]) {
                    const localMean = smoothedSignal.slice(Math.max(0, i-15), Math.min(smoothedSignal.length, i+15)).reduce((a,b)=>a+b,0) / 30;
                    if (smoothedSignal[i] > localMean * 1.005) { // Slightly higher threshold
                        peakIndices.push(i);
                    }
                }
            }

            if (peakIndices.length < 2) return;

            // 3. Calculate BPM
            const timeSpanSeconds = (times[times.length - 1] - times[0]) / 1000;
            const calculatedBPM = Math.round((peakIndices.length / timeSpanSeconds) * 60);

            if (calculatedBPM > 40 && calculatedBPM < 220) {
                setHeartRate(calculatedBPM);
            }

            // 4. Calculate HRV (SDNN - Standard Deviation of NN intervals) for Stress Level
            const nnIntervals = [];
            for (let i = 1; i < peakIndices.length; i++) {
                const interval = times[peakIndices[i]] - times[peakIndices[i-1]];
                nnIntervals.push(interval);
            }

            if (nnIntervals.length > 0) {
                const meanNN = nnIntervals.reduce((a, b) => a + b, 0) / nnIntervals.length;
                const squaredDiffs = nnIntervals.map(nn => Math.pow(nn - meanNN, 2));
                const sdnn = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / nnIntervals.length);

                // Simple Stress Mapping based on SDNN (Lower HRV = Higher Stress)
                // Note: These are highly simplified thresholds for demonstration
                if (sdnn < 20) {
                    setStressLevel('Critical');
                } else if (sdnn < 40) {
                    setStressLevel('High');
                } else if (sdnn < 70) {
                    setStressLevel('Moderate');
                } else {
                    setStressLevel('Low');
                }
            }
        };

        // Initialize MediaPipe Face Mesh
        faceMeshRef.current = new FaceMesh({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });

        faceMeshRef.current.setOptions({
            maxNumFaces: 1,
            refineLandmarks: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        faceMeshRef.current.onResults(onResults);

        if (videoRef.current) {
            cameraRef.current = new Camera(videoRef.current, {
                onFrame: async () => {
                    if (videoRef.current && faceMeshRef.current) {
                        await faceMeshRef.current.send({ image: videoRef.current });
                    }
                },
                width: 640,
                height: 480
            });
            cameraRef.current.start();
        }

        return () => {
            if (cameraRef.current) {
                cameraRef.current.stop();
            }
            if (faceMeshRef.current) {
                faceMeshRef.current.close();
            }
        };
    }, [videoRef]);

    return { heartRate, stressLevel, isDetecting };
};
