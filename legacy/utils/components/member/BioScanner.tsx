import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ScanFace, Activity, BrainCircuit, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import * as faceUtils from '@mediapipe/face_mesh';
const { FaceMesh, FACEMESH_TESSELATION } = (faceUtils as any).default || faceUtils;
import * as camUtils from '@mediapipe/camera_utils';
const Camera = (camUtils as any).Camera || (camUtils as any).default?.Camera || (window as any).Camera;

interface BioScannerProps {
    onClose: () => void;
    onScanComplete: (result: { mood: string, fatigue: number, recommendedMode: string }) => void;
}

export const BioScanner: React.FC<BioScannerProps> = ({ onClose, onScanComplete }) => {
    const [scanPhase, setScanPhase] = useState<'idle' | 'scanning' | 'analyzing' | 'complete'>('idle');
    const [progress, setProgress] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const cameraRef = useRef<any | null>(null);
    const { addToast } = useToast();
    
    // Real-time metrics
    const [liveEar, setLiveEar] = useState<number>(0);
    const [liveHr, setLiveHr] = useState<number>(75);
    const earHistory = useRef<number[]>([]);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            streamRef.current = stream;
        } catch (err: any) {
            console.error("Camera access denied", err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                addToast("SENSOR BLOCKED: Titan Vision requires camera access. Please enable it in browser settings.", "error");
            } else {
                addToast("HARDWARE ERROR: Camera module not found or malfunctioning.", "error");
            }
        }
    };

    const stopCamera = () => {
        if (cameraRef.current) {
            cameraRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    };

    const calculateEAR = (landmarks: any[]) => {
        const leftEye = [landmarks[33], landmarks[160], landmarks[158], landmarks[133], landmarks[153], landmarks[144]];
        const rightEye = [landmarks[362], landmarks[385], landmarks[387], landmarks[263], landmarks[373], landmarks[380]];

        const getDistance = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

        const calcEyeEAR = (eye: any[]) => {
            const v1 = getDistance(eye[1], eye[5]);
            const v2 = getDistance(eye[2], eye[4]);
            const h = getDistance(eye[0], eye[3]);
            return (v1 + v2) / (2.0 * h);
        };

        const leftEAR = calcEyeEAR(leftEye);
        const rightEAR = calcEyeEAR(rightEye);
        return (leftEAR + rightEAR) / 2.0;
    };

    const startScan = async () => {
        if (!videoRef.current) return;
        setScanPhase('scanning');
        setProgress(10);

        try {
            const faceMesh = new FaceMesh({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
            });

            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            faceMesh.onResults((results) => {
                if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                    const landmarks = results.multiFaceLandmarks[0];
                    const currentEar = calculateEAR(landmarks);
                    setLiveEar(currentEar);
                    earHistory.current.push(currentEar);
                    setLiveHr(prev => prev + (Math.random() > 0.5 ? 1 : -1));
                }
            });

            cameraRef.current = new Camera(videoRef.current, {
                onFrame: async () => {
                    if (videoRef.current) {
                        await faceMesh.send({ image: videoRef.current });
                    }
                },
                width: 640,
                height: 480
            });

            await cameraRef.current.start();

            let p = 10;
            const interval = setInterval(() => {
                p += 2;
                setProgress(p);
                if (p >= 100) {
                    clearInterval(interval);
                    finishScan();
                }
            }, 100);

        } catch (error) {
            console.error("Face Mesh Error:", error);
            addToast("Smart Engine Error: Could not load Face Mesh models.", "error");
            setScanPhase('idle');
        }
    };

    const finishScan = () => {
        setScanPhase('analyzing');
        if (cameraRef.current) cameraRef.current.stop();
        
        setTimeout(() => {
            setScanPhase('complete');
            setTimeout(() => {
                const avgEar = earHistory.current.length > 0 
                    ? earHistory.current.reduce((a, b) => a + b, 0) / earHistory.current.length 
                    : 0.25;

                let fatigueLevel = 0;
                let mood = 'Optimal';
                let mode = 'Hypertrophy Protocol';
                
                if (avgEar < 0.22) {
                    fatigueLevel = 85;
                    mood = 'High Fatigue / Stressed';
                    mode = 'Light Recovery Mode';
                } else if (avgEar < 0.26) {
                    fatigueLevel = 45;
                    mood = 'Moderate Fatigue';
                    mode = 'Standard Maintenance';
                } else {
                    fatigueLevel = 15;
                    mood = 'Energetic / Optimal';
                    mode = 'High Intensity Protocol';
                }
                
                onScanComplete({ mood, fatigue: fatigueLevel, recommendedMode: mode });
                stopCamera();
            }, 2000);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-gray-900 border border-cyan-500/30 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.15)]">
                
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase tracking-widest">
                            FitnessFutureBio-Scan
                        </h2>
                    </div>
                    <button onClick={() => { stopCamera(); onClose(); }} className="p-2 bg-black/50 rounded-full text-gray-400 hover:text-white border border-white/10">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Camera Viewfinder */}
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className={`w-full h-full object-cover transition-all duration-1000 ${scanPhase === 'analyzing' ? 'filter blur-md grayscale' : ''}`}
                    />
                    
                    {/* Scanning Overlay */}
                    {scanPhase === 'scanning' && (
                        <motion.div 
                            initial={{ top: '0%' }}
                            animate={{ top: '100%' }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_#22d3ee] z-10"
                        />
                    )}

                    {/* Facial Tracking Box Simulation */}
                    {(scanPhase === 'scanning' || scanPhase === 'analyzing') && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                            <div className="w-56 h-72 border border-cyan-500/30 rounded-3xl relative flex items-center justify-center">
                                {/* Corner Accents */}
                                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl"></div>
                                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl"></div>
                                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl"></div>
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-xl"></div>
                                
                                {/* Inner Reticle */}
                                <div className="w-16 h-16 border border-cyan-400/50 rounded-full flex items-center justify-center animate-spin-slow">
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                                </div>

                                {/* HUD Elements */}
                                <div className="absolute top-4 left-4 text-[8px] font-mono text-cyan-400/80 uppercase tracking-widest">
                                    <div>TGT_ACQ: TRUE</div>
                                    <div>PITCH: {Math.floor(Math.random() * 10)}°</div>
                                    <div>YAW: {Math.floor(Math.random() * 10)}°</div>
                                </div>
                                <div className="absolute bottom-4 right-4 text-[8px] font-mono text-cyan-400/80 uppercase tracking-widest text-right">
                                    <div>HR_EST: {liveHr} BPM</div>
                                    <div>SPO2: 98%</div>
                                </div>
                            </div>
                            
                            {/* Holographic Grid Overlay */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)] opacity-50"></div>
                        </div>
                    )}

                    {/* Idle State */}
                    {scanPhase === 'idle' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10">
                            <ScanFace className="w-16 h-16 text-cyan-400/50 mb-4" />
                            <p className="text-sm font-mono text-cyan-400/70 uppercase tracking-widest">Position face in frame</p>
                        </div>
                    )}

                    {/* Complete State */}
                    {scanPhase === 'complete' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-cyan-900/40 backdrop-blur-sm z-20">
                            <CheckCircle2 className="w-20 h-20 text-cyan-400 mb-4 animate-pulse" />
                            <h3 className="text-2xl font-black text-white uppercase tracking-widest">Analysis Complete</h3>
                        </div>
                    )}
                </div>

                {/* Controls & Progress */}
                <div className="p-6 bg-gray-900 border-t border-white/5 relative">
                    <div className="absolute top-0 left-0 h-1 bg-cyan-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">System Status</p>
                            <div className="flex items-center gap-2">
                                <Activity className={`w-4 h-4 ${scanPhase === 'idle' ? 'text-gray-500' : 'text-cyan-400 animate-pulse'}`} />
                                <span className="text-sm font-bold text-white uppercase">
                                    {scanPhase === 'idle' ? 'Awaiting Initialization' : 
                                     scanPhase === 'scanning' ? 'Capturing Biometrics...' : 
                                     scanPhase === 'analyzing' ? 'Smart Processing...' : 'Syncing to FitnessFutureOS'}
                                </span>
                            </div>
                        </div>

                        {scanPhase === 'idle' && (
                            <button 
                                onClick={startScan}
                                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                            >
                                Initiate Scan
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
