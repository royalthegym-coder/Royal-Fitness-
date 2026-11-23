import React, { useEffect, useRef, useState } from 'react';
import * as poseUtils from '@mediapipe/pose';
const { Pose, POSE_CONNECTIONS } = (poseUtils as any).default || poseUtils;
import * as camUtils from '@mediapipe/camera_utils';
const Camera = (camUtils as any).Camera || (camUtils as any).default?.Camera || (window as any).Camera;
import * as drawUtils from '@mediapipe/drawing_utils';
const { drawConnectors, drawLandmarks } = (drawUtils as any).default || drawUtils;
import { X, Activity, Target, Zap, ShieldCheck, AlertTriangle, Focus, Battery, Volume2, VolumeX, Moon, MonitorOff, Monitor } from 'lucide-react';

interface TitanVisionProps {
    isOpen: boolean;
    onClose: () => void;
    exerciseType: 'Bicep Curl' | 'Squat';
}

const TitanVision: React.FC<TitanVisionProps> = ({ isOpen, onClose, exerciseType }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cameraRef = useRef<any>(null);
    
    const [isLoaded, setIsLoaded] = useState(false);
    
    // UI States
    const [repCount, setRepCount] = useState(0);
    const [feedback, setFeedback] = useState('Position yourself in frame');
    const [lowLightWarning, setLowLightWarning] = useState(false);
    const [centerWarning, setCenterWarning] = useState(false);
    
    // Eco-Mode & Voice Coach States
    const [isResting, setIsResting] = useState(false);
    const [restTime, setRestTime] = useState(60);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
    const [isDimmed, setIsDimmed] = useState(false);
    
    // Mutable refs for high-frequency updates & closures
    const stageRef = useRef<'down' | 'up'>('down');
    const repCountRef = useRef(0);
    const lowLightRef = useRef(false);
    const centerRef = useRef(false);
    const isVoiceEnabledRef = useRef(true);
    const lastSpokenRef = useRef<string>('');
    
    // Voice Coach Helper
    const speak = (text: string) => {
        if (!isVoiceEnabledRef.current) return;
        if (lastSpokenRef.current === text) return;
        
        window.speechSynthesis.cancel(); // Interrupt previous speech for real-time feedback
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
        lastSpokenRef.current = text;
        
        // Clear the ref after a few seconds so the same phrase can be spoken again later
        setTimeout(() => {
            if (lastSpokenRef.current === text) {
                lastSpokenRef.current = '';
            }
        }, 3000);
    };

    const toggleVoice = () => {
        setIsVoiceEnabled(prev => {
            const newState = !prev;
            isVoiceEnabledRef.current = newState;
            if (newState) speak("Voice coach activated.");
            else window.speechSynthesis.cancel();
            return newState;
        });
    };

    const toggleRestMode = () => {
        setIsResting(prev => {
            const newState = !prev;
            if (newState) {
                speak("Eco mode activated. Resting. Screen dimmed to save battery.");
                cameraRef.current?.stop();
                setRestTime(60); // Default rest time
            } else {
                speak("Rest over. Camera active. Let's go.");
                cameraRef.current?.start();
            }
            return newState;
        });
    };

    const toggleDimMode = () => {
        setIsDimmed(prev => {
            const newState = !prev;
            if (newState) {
                speak("Screen dimmed. Relying on voice coach.");
            } else {
                speak("Screen brightness restored.");
            }
            return newState;
        });
    };

    // Rest Timer Countdown
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isResting && restTime > 0) {
            interval = setInterval(() => {
                setRestTime(prev => {
                    if (prev === 11) speak("10 seconds left. Get ready.");
                    if (prev <= 1) {
                        setIsResting(false);
                        speak("Rest time is up. Let's get back to work.");
                        cameraRef.current?.start();
                        return 60;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isResting, restTime]);

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
            const canvasCtx = canvasRef.current.getContext('2d', { willReadFrequently: true });
            if (!canvasCtx) return;

            const width = canvasRef.current.width;
            const height = canvasRef.current.height;

            canvasCtx.save();
            canvasCtx.clearRect(0, 0, width, height);
            canvasCtx.drawImage(results.image, 0, 0, width, height);

            // 1. Low-Light Detection (Brightness Check)
            const imageData = canvasCtx.getImageData(0, 0, width, height);
            const data = imageData.data;
            let colorSum = 0;
            let count = 0;
            for (let i = 0; i < data.length; i += 400) {
                colorSum += (data[i] + data[i + 1] + data[i + 2]) / 3;
                count++;
            }
            const brightness = colorSum / count;
            const isLowLight = brightness < 35;

            if (isLowLight !== lowLightRef.current) {
                lowLightRef.current = isLowLight;
                setLowLightWarning(isLowLight);
                if (isLowLight) speak("Low light detected. Please move to a brighter area.");
            }

            let isCentered = true;

            if (results.poseLandmarks) {
                // 2. Multi-Person Filtering (Bounding Box Lock)
                const landmarks = results.poseLandmarks;
                let minX = 1, maxX = 0;
                landmarks.forEach(lm => {
                    if (lm.x < minX) minX = lm.x;
                    if (lm.x > maxX) maxX = lm.x;
                });
                const centerX = (minX + maxX) / 2;
                
                isCentered = centerX > 0.25 && centerX < 0.75;
                
                if (!isCentered !== centerRef.current) {
                    centerRef.current = !isCentered;
                    setCenterWarning(!isCentered);
                    if (!isCentered) speak("Please stand in the center of the screen.");
                }

                if (isCentered && !isLowLight) {
                    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
                    drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2, radius: 4 });

                    if (exerciseType === 'Bicep Curl') {
                        const shoulder = results.poseLandmarks[11];
                        const elbow = results.poseLandmarks[13];
                        const wrist = results.poseLandmarks[15];

                        if (shoulder && elbow && wrist) {
                            const angle = calculateAngle(shoulder, elbow, wrist);
                            
                            canvasCtx.fillStyle = '#00FFFF';
                            canvasCtx.font = '24px Arial';
                            canvasCtx.fillText(Math.round(angle).toString() + '°', elbow.x * width, elbow.y * height);

                            if (angle > 160) {
                                stageRef.current = 'down';
                                const msg = 'Good extension. Now curl up.';
                                setFeedback(msg);
                                speak(msg);
                            }
                            if (angle < 30 && stageRef.current === 'down') {
                                stageRef.current = 'up';
                                repCountRef.current += 1;
                                setRepCount(repCountRef.current);
                                const msg = 'Great squeeze! Lower slowly.';
                                setFeedback(msg);
                                speak(msg);
                            }
                        }
                    } else if (exerciseType === 'Squat') {
                        const hip = results.poseLandmarks[23];
                        const knee = results.poseLandmarks[25];
                        const ankle = results.poseLandmarks[27];

                        if (hip && knee && ankle) {
                            const angle = calculateAngle(hip, knee, ankle);
                            
                            if (angle > 160) {
                                stageRef.current = 'up';
                                const msg = 'Descend slowly.';
                                setFeedback(msg);
                                speak(msg);
                            }
                            if (angle < 90 && stageRef.current === 'up') {
                                stageRef.current = 'down';
                                repCountRef.current += 1;
                                setRepCount(repCountRef.current);
                                const msg = 'Good depth! Drive up.';
                                setFeedback(msg);
                                speak(msg);
                            }
                        }
                    }
                } else {
                    canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    canvasCtx.fillRect(0, 0, width, height);
                }
            } else {
                if (!isLowLight) {
                    setFeedback('No pose detected. Step back.');
                }
            }
            
            canvasCtx.strokeStyle = (isCentered && !isLowLight) ? 'rgba(0, 255, 0, 0.4)' : 'rgba(255, 0, 0, 0.4)';
            canvasCtx.lineWidth = 2;
            canvasCtx.setLineDash([15, 15]);
            canvasCtx.strokeRect(width * 0.25, height * 0.1, width * 0.5, height * 0.8);
            canvasCtx.setLineDash([]);

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
        
        cameraRef.current = camera;
        camera.start().then(() => setIsLoaded(true));

        return () => {
            camera.stop();
            pose.close();
            window.speechSynthesis.cancel();
        };
    }, [isOpen, exerciseType]);

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
                        <p className="text-cyan-400 text-xs font-mono uppercase tracking-widest">Cloud Zenith Engine Active</p>
                    </div>
                </div>
                <button onClick={onClose} className="relative p-3 bg-gradient-to-r from-red-900/40 to-red-800/40 hover:from-red-800/60 hover:to-red-700/60 backdrop-blur-xl text-red-500 rounded-full hover:text-white transition-all border border-dashed border-red-500/50 hover:border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] group overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                    <X className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform duration-500" />
                </button>
            </div>

            {/* Warnings Overlay */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 flex flex-col gap-3 z-30 w-full max-w-md">
                {lowLightWarning && !isResting && (
                    <div className="bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl border border-red-400 shadow-2xl flex items-center gap-3 animate-bounce">
                        <AlertTriangle className="w-6 h-6 shrink-0" />
                        <p className="text-sm font-bold">Low light detected. Please choose a well-lit area for Titan Vision.</p>
                    </div>
                )}
                
                {centerWarning && !lowLightWarning && !isResting && (
                    <div className="bg-amber-500/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl border border-amber-400 shadow-2xl flex items-center gap-3 animate-pulse">
                        <Focus className="w-6 h-6 shrink-0" />
                        <p className="text-sm font-bold">Please stand exactly in the center of the screen.</p>
                    </div>
                )}
            </div>

            {/* Main Camera View */}
            <div className="relative w-full max-w-4xl aspect-video bg-gray-900 rounded-[3rem] overflow-hidden border-4 border-cyan-500/30 shadow-[0_0_100px_rgba(6,182,212,0.2)]">
                
                {/* Eco-Mode / Screen Dimming Overlay */}
                {isResting && (
                    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center rounded-[3rem]">
                        <Moon className="w-16 h-16 text-cyan-500 mb-4 animate-pulse" />
                        <h3 className="text-3xl font-black text-white tracking-widest uppercase mb-2">Eco-Mode Active</h3>
                        <p className="text-cyan-400 font-mono mb-8">Camera & AI Sleeping to save battery</p>
                        <div className="text-8xl font-black text-white tracking-tighter mb-8">
                            00:{restTime.toString().padStart(2, '0')}
                        </div>
                        <button 
                            onClick={toggleRestMode}
                            className="relative px-8 py-4 bg-gradient-to-r from-cyan-900/40 to-cyan-800/40 hover:from-cyan-800/60 hover:to-cyan-700/60 backdrop-blur-xl border border-dashed border-cyan-500/50 hover:border-cyan-400 text-white font-bold rounded-full uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                            <span className="relative z-10">Wake Up Now</span>
                        </button>
                    </div>
                )}

                {/* Dim Mode Overlay during workout */}
                {isDimmed && !isResting && (
                    <div className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center pointer-events-none rounded-[3rem] backdrop-blur-sm">
                        <MonitorOff className="w-12 h-12 text-cyan-500/50 mb-4 animate-pulse" />
                        <p className="text-cyan-500/70 font-mono uppercase tracking-widest text-sm text-center px-8">
                            Screen Dimmed to Save Battery<br/>
                            <span className="text-xs opacity-70">Listen to Voice Coach</span>
                        </p>
                    </div>
                )}

                {!isLoaded && !isResting && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20">
                        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-cyan-400 font-mono uppercase tracking-widest animate-pulse">Initializing MediaPipe Core...</p>
                    </div>
                )}
                
                <video ref={videoRef} className="hidden" playsInline></video>
                <canvas ref={canvasRef} className="w-full h-full object-cover transform scale-x-[-1]"></canvas>
                
                {/* HUD Overlays */}
                {!isResting && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 border-cyan-500/50"></div>
                        <div className="absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 border-cyan-500/50"></div>
                        <div className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-cyan-500/50"></div>
                        <div className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 border-cyan-500/50"></div>
                        
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-10 py-4 rounded-[2rem] border border-cyan-500/50 flex flex-col items-center">
                            <p className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.3em] mb-1">Live Rep Count</p>
                            <p className="text-6xl font-black text-white italic tracking-tighter leading-none">{repCount}</p>
                        </div>

                        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex items-center gap-3">
                            <Target className="w-5 h-5 text-amber-500" />
                            <p className="text-sm font-bold text-white uppercase tracking-widest">{feedback}</p>
                        </div>

                        <div className="absolute bottom-8 right-8 bg-cyan-950/80 backdrop-blur-md px-4 py-2 rounded-xl border border-cyan-500/30 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs font-mono text-cyan-400 uppercase">{exerciseType} Mode</span>
                        </div>
                    </div>
                )}

                {/* Controls (Voice & Eco Mode) */}
                <div className="absolute bottom-8 left-8 flex gap-3 z-50">
                    <button 
                        onClick={toggleVoice}
                        className={`relative p-3 rounded-full backdrop-blur-xl border border-dashed transition-all group overflow-hidden ${isVoiceEnabled ? 'bg-gradient-to-r from-cyan-900/40 to-cyan-800/40 hover:from-cyan-800/60 hover:to-cyan-700/60 border-cyan-500/50 hover:border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]' : 'bg-gradient-to-r from-gray-900/40 to-gray-800/40 hover:from-gray-800/60 hover:to-gray-700/60 border-gray-600/50 hover:border-gray-500 text-gray-400 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]'}`}
                        title={isVoiceEnabled ? "Mute Voice Coach" : "Enable Voice Coach"}
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                        <div className="relative z-10 group-hover:scale-110 transition-transform duration-500">
                            {isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        </div>
                    </button>
                    <button 
                        onClick={toggleDimMode}
                        className={`relative p-3 rounded-full backdrop-blur-xl border border-dashed transition-all group overflow-hidden ${isDimmed ? 'bg-gradient-to-r from-cyan-900/40 to-cyan-800/40 hover:from-cyan-800/60 hover:to-cyan-700/60 border-cyan-500/50 hover:border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]' : 'bg-gradient-to-r from-gray-900/40 to-gray-800/40 hover:from-gray-800/60 hover:to-gray-700/60 border-gray-600/50 hover:border-gray-500 text-gray-400 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]'}`}
                        title={isDimmed ? "Restore Screen Brightness" : "Dim Screen (Voice Only)"}
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                        <div className="relative z-10 group-hover:scale-110 transition-transform duration-500">
                            {isDimmed ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                        </div>
                    </button>
                    <button 
                        onClick={toggleRestMode}
                        className={`relative p-3 rounded-full backdrop-blur-xl border border-dashed transition-all group overflow-hidden ${isResting ? 'bg-gradient-to-r from-amber-900/40 to-amber-800/40 hover:from-amber-800/60 hover:to-amber-700/60 border-amber-500/50 hover:border-amber-400 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]' : 'bg-gradient-to-r from-gray-900/40 to-gray-800/40 hover:from-gray-800/60 hover:to-gray-700/60 border-gray-600/50 hover:border-gray-500 text-gray-400 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]'}`}
                        title="Eco Mode (Rest)"
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                        <Battery className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform duration-500" />
                    </button>
                </div>
            </div>

            {/* Bottom Info */}
            <div className="mt-8 flex items-center gap-4 text-gray-500 text-xs font-mono uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>AI Form Correction Active • 33-Point Skeletal Tracking • Eco-Mode Ready</span>
            </div>
        </div>
    );
};

export default TitanVision;
