import React, { useEffect, useRef, useState } from 'react';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { X, Activity, Target, Zap, ShieldCheck } from 'lucide-react';

interface TitanVisionProps {
    isOpen: boolean;
    onClose: () => void;
    exerciseType: 'Bicep Curl' | 'Squat';
}

const TitanVision: React.FC<TitanVisionProps> = ({ isOpen, onClose, exerciseType }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [repCount, setRepCount] = useState(0);
    const [feedback, setFeedback] = useState('Position yourself in frame');
    const [stage, setStage] = useState<'down' | 'up'>('down');
    
    // Angle calculation helper
    const calculateAngle = (a: any, b: any, c: any) => {
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);
        if (angle > 180.0) angle = 360 - angle;
        return angle;
    };

    useEffect(() => {
        if (!isOpen || !videoRef.current || !canvasRef.current) return;

        const pose = new Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        pose.onResults((results) => {
            if (!canvasRef.current || !videoRef.current) return;
            const canvasCtx = canvasRef.current.getContext('2d');
            if (!canvasCtx) return;

            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

            if (results.poseLandmarks) {
                // Draw skeleton with "Heatmap" style colors
                drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
                drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2, radius: 4 });

                // Logic for Bicep Curl (using left arm for demo)
                if (exerciseType === 'Bicep Curl') {
                    const shoulder = results.poseLandmarks[11];
                    const elbow = results.poseLandmarks[13];
                    const wrist = results.poseLandmarks[15];

                    if (shoulder && elbow && wrist) {
                        const angle = calculateAngle(shoulder, elbow, wrist);
                        
                        // Visualize angle
                        canvasCtx.fillStyle = '#00FFFF';
                        canvasCtx.font = '24px Arial';
                        canvasCtx.fillText(Math.round(angle).toString(), elbow.x * canvasRef.current.width, elbow.y * canvasRef.current.height);

                        if (angle > 160) {
                            setStage('down');
                            setFeedback('Good extension. Now curl up.');
                        }
                        if (angle < 30 && stage === 'down') {
                            setStage('up');
                            setRepCount(prev => prev + 1);
                            setFeedback('Great squeeze! Lower slowly.');
                        }
                    }
                } else if (exerciseType === 'Squat') {
                    const hip = results.poseLandmarks[23];
                    const knee = results.poseLandmarks[25];
                    const ankle = results.poseLandmarks[27];

                    if (hip && knee && ankle) {
                        const angle = calculateAngle(hip, knee, ankle);
                        
                        if (angle > 160) {
                            setStage('up');
                            setFeedback('Descend slowly.');
                        }
                        if (angle < 90 && stage === 'up') {
                            setStage('down');
                            setRepCount(prev => prev + 1);
                            setFeedback('Good depth! Drive up.');
                        }
                    }
                }
            } else {
                setFeedback('No pose detected. Step back.');
            }
            canvasCtx.restore();
        });

        const camera = new Camera(videoRef.current, {
            onFrame: async () => {
                if (videoRef.current) {
                    await pose.send({ image: videoRef.current });
                }
            },
            width: 640,
            height: 480
        });

        camera.start().then(() => setIsLoaded(true));

        return () => {
            camera.stop();
            pose.close();
        };
    }, [isOpen, exerciseType, stage]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-xl animate-fade-in">
            {/* Header */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/20 rounded-xl border border-cyan-500/50">
                        <Activity className="w-6 h-6 text-cyan-400 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-widest">Titan Vision</h2>
                        <p className="text-cyan-400 text-xs font-mono uppercase tracking-widest">Aether Zenith Engine Active</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-3 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all border border-red-500/50">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Main Camera View */}
            <div className="relative w-full max-w-4xl aspect-video bg-gray-900 rounded-[3rem] overflow-hidden border-4 border-cyan-500/30 shadow-[0_0_100px_rgba(6,182,212,0.2)]">
                {!isLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20">
                        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-cyan-400 font-mono uppercase tracking-widest animate-pulse">Initializing MediaPipe Core...</p>
                    </div>
                )}
                
                <video ref={videoRef} className="hidden" playsInline></video>
                <canvas ref={canvasRef} className="w-full h-full object-cover transform scale-x-[-1]"></canvas>
                
                {/* HUD Overlays */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Corner Brackets */}
                    <div className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 border-cyan-500/50"></div>
                    <div className="absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 border-cyan-500/50"></div>
                    <div className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-cyan-500/50"></div>
                    <div className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 border-cyan-500/50"></div>
                    
                    {/* Rep Counter */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-10 py-4 rounded-[2rem] border border-cyan-500/50 flex flex-col items-center">
                        <p className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.3em] mb-1">Live Rep Count</p>
                        <p className="text-6xl font-black text-white italic tracking-tighter leading-none">{repCount}</p>
                    </div>

                    {/* Feedback Panel */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex items-center gap-3">
                        <Target className="w-5 h-5 text-amber-500" />
                        <p className="text-sm font-bold text-white uppercase tracking-widest">{feedback}</p>
                    </div>

                    {/* Mode Indicator */}
                    <div className="absolute bottom-8 right-8 bg-cyan-950/80 backdrop-blur-md px-4 py-2 rounded-xl border border-cyan-500/30 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-mono text-cyan-400 uppercase">{exerciseType} Mode</span>
                    </div>
                </div>
            </div>

            {/* Bottom Info */}
            <div className="mt-8 flex items-center gap-4 text-gray-500 text-xs font-mono uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>AI Form Correction Active • 33-Point Skeletal Tracking</span>
            </div>
        </div>
    );
};

export default TitanVision;
