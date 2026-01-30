
import React, { useState, useRef, useEffect } from 'react';
import Card from './common/Card';
import { CameraIcon } from './icons/CameraIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { generateTextToSpeech } from '../../lib/gemini';
import { decode, decodeAudioData } from '../audio';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { SpeedIcon } from './icons/SpeedIcon';

const AIPostureCorrection = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [feedback, setFeedback] = useState("Align your body in frame");
    const [status, setStatus] = useState<'Good' | 'Correction Needed' | 'Idle'>('Idle');
    const [metrics, setMetrics] = useState<{ knee: number, hip: number, velocity: number }>({ knee: 0, hip: 0, velocity: 0 });
    
    // Config
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
    const [debugMode, setDebugMode] = useState(false); 
    const frameIdRef = useRef<number>(0);
    const lastYRef = useRef<number>(0); // For velocity calculation

    // Camera Lifecycle
    useEffect(() => {
        if (isScanning) {
            startCamera();
            renderLoop();
        } else {
            stopCamera();
            cancelAnimationFrame(frameIdRef.current);
        }
        return () => {
            cancelAnimationFrame(frameIdRef.current);
            stopCamera();
        };
    }, [isScanning]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            setFeedback("Camera access denied.");
        }
    };

    const stopCamera = () => {
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(t => t.stop());
    };

    // --- BIOMECHANICAL ANALYTICS ENGINE (Simulated MediaPipe) ---
    const renderLoop = () => {
        if (!canvasRef.current || !videoRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const width = videoRef.current.videoWidth;
        const height = videoRef.current.videoHeight;
        
        if (width && height) {
            canvasRef.current.width = width;
            canvasRef.current.height = height;
            ctx.clearRect(0, 0, width, height);

            // 1. Draw HUD
            drawHUD(ctx, width, height);
            
            // 2. Simulate Skeleton Tracking
            const skeleton = simulateSkeleton(width, height);
            drawSkeleton(ctx, skeleton);

            // 3. Calculate Biomechanics
            const kneeAngle = calculateAngle(skeleton.hip, skeleton.knee, skeleton.ankle);
            const hipAngle = calculateAngle(skeleton.shoulder, skeleton.hip, skeleton.knee);
            
            // Velocity Calculation (Pixels per frame, smoothed)
            const currentY = skeleton.hip.y;
            const velocity = Math.abs(currentY - lastYRef.current);
            lastYRef.current = currentY;
            
            setMetrics({ 
                knee: Math.round(kneeAngle), 
                hip: Math.round(hipAngle),
                velocity: parseFloat((velocity * 0.1).toFixed(2)) // Normalized Power
            });

            // 4. Real-time Form Logic
            analyzeFormFrame(skeleton, kneeAngle);
        }
        
        frameIdRef.current = requestAnimationFrame(renderLoop);
    };

    const calculateAngle = (a: any, b: any, c: any) => {
        return 180 - Math.abs(Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)) * 180 / Math.PI;
    };

    const lastVoiceTime = useRef(0);
    
    const analyzeFormFrame = (skeleton: any, kneeAngle: number) => {
        const now = Date.now();
        let currentFeedback = "Hold Position";
        let currentStatus: any = "Good";

        // --- KNEE VALGUS DETECTION (Simulated) ---
        // In real MediaPipe: Check if Knee X position is inside Ankle X position relative to Hip
        // Simulation: We randomly trigger it for demo purposes when squatting deep
        const isSquatting = kneeAngle < 100;
        const kneeValgus = isSquatting && Math.random() > 0.98; // Rare random trigger for demo

        if (kneeValgus) {
             currentFeedback = "⚠ DRIVE KNEES OUT!";
             currentStatus = "Correction Needed";
             if (now - lastVoiceTime.current > 4000 && isVoiceEnabled) {
                 playVoiceFeedback("Drive your knees out!");
                 lastVoiceTime.current = now;
             }
        } else if (kneeAngle < 90) {
            currentFeedback = "Good Depth!";
            currentStatus = "Good";
        } else if (kneeAngle > 140) {
            currentFeedback = "Start Descent";
            currentStatus = "Idle";
        }

        setFeedback(currentFeedback);
        setStatus(currentStatus);
    };

    const drawHUD = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        // Corners
        ctx.strokeStyle = status === 'Correction Needed' ? '#ef4444' : '#22d3ee';
        ctx.lineWidth = 4;
        const len = 40;
        ctx.beginPath(); ctx.moveTo(20, 20 + len); ctx.lineTo(20, 20); ctx.lineTo(20 + len, 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(width - 20 - len, 20); ctx.lineTo(width - 20, 20); ctx.lineTo(width - 20, 20 + len); ctx.stroke();
        
        // Velocity Bar
        ctx.fillStyle = '#00000080';
        ctx.fillRect(width - 60, height / 2 - 100, 20, 200);
        ctx.fillStyle = '#10b981'; // Green
        const barHeight = Math.min(200, metrics.velocity * 50);
        ctx.fillRect(width - 60, height / 2 + 100 - barHeight, 20, barHeight);
    };

    const simulateSkeleton = (w: number, h: number) => {
        const t = Date.now() / 1000;
        const squatDepth = Math.sin(t * 2) * 0.2 + 0.5; // Oscillate squat
        
        const cx = w / 2;
        const cy = h / 2;
        
        return {
            shoulder: { x: cx, y: cy - 100 * squatDepth },
            hip: { x: cx, y: cy + 20 },
            knee: { x: cx + 40, y: cy + 100 - (50 * squatDepth) },
            ankle: { x: cx + 40, y: cy + 180 }
        };
    };

    const drawSkeleton = (ctx: CanvasRenderingContext2D, s: any) => {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        
        // Bones
        ctx.beginPath(); ctx.moveTo(s.shoulder.x, s.shoulder.y); ctx.lineTo(s.hip.x, s.hip.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s.hip.x, s.hip.y); ctx.lineTo(s.knee.x, s.knee.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s.knee.x, s.knee.y); ctx.lineTo(s.ankle.x, s.ankle.y); ctx.stroke();
        
        // Joints
        ctx.fillStyle = '#22d3ee';
        [s.shoulder, s.hip, s.knee, s.ankle].forEach(p => {
            ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI*2); ctx.fill();
        });
    };

    const playVoiceFeedback = async (text: string) => {
        try {
            const audioBase64 = await generateTextToSpeech(text);
            if (audioBase64) {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const audioBytes = decode(audioBase64);
                const buffer = await decodeAudioData(audioBytes, ctx, 24000);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start();
            }
        } catch (e) { console.error(e); }
    };

    return (
        <Card className="relative overflow-hidden border-2 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)] bg-gray-900">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-cyan-400 flex items-center">
                    <VideoCameraIcon className="w-6 h-6 mr-2" /> 
                    Biomechanical Guardian
                </h3>
                <div className="flex gap-2">
                     <button onClick={() => setDebugMode(!debugMode)} className="px-2 py-1 text-[10px] border border-cyan-500 rounded text-cyan-400">
                        DEBUG
                    </button>
                    <button onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} className={`p-2 rounded-lg border ${isVoiceEnabled ? 'bg-cyan-900/50 border-cyan-500' : 'bg-gray-800'}`}>
                        <SpeakerIcon className="w-5 h-5 text-cyan-400"/>
                    </button>
                </div>
            </div>
            
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4 border border-gray-700 shadow-inner">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
                
                {isScanning && (
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <div className="bg-black/80 px-3 py-1 rounded border border-green-500/50 text-green-400 text-xs font-mono">
                            ● VISION AGENT ACTIVE
                        </div>
                        <div className="bg-black/80 px-3 py-2 rounded border border-cyan-500/50 text-cyan-400 text-[10px] font-mono">
                            <p>Knee Flexion: {metrics.knee}°</p>
                            <div className="flex items-center mt-1">
                                <SpeedIcon className="w-3 h-3 mr-1" />
                                Velocity: {metrics.velocity} m/s
                            </div>
                        </div>
                    </div>
                )}

                {isScanning && feedback && (
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                        <div className={`px-6 py-3 rounded-full border shadow-2xl backdrop-blur-xl ${status === 'Correction Needed' ? 'bg-red-900/90 border-red-500 text-red-200' : 'bg-cyan-900/90 border-cyan-500 text-cyan-200'}`}>
                            <p className="font-bold text-lg flex items-center gap-2">
                                {status === 'Correction Needed' && <span className="animate-ping">⚠</span>}
                                {feedback}
                            </p>
                        </div>
                    </div>
                )}

                {!isScanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                        <CameraIcon className="w-16 h-16 text-cyan-500 mb-4 animate-pulse" />
                        <p className="text-white font-bold text-lg">Agentic Vision System</p>
                        <p className="text-gray-400 text-sm">Real-time form tracking, velocity metrics & audio cues.</p>
                    </div>
                )}
            </div>

            <button 
                onClick={() => setIsScanning(!isScanning)}
                className={`w-full py-4 font-black uppercase tracking-widest rounded-xl transition-all shadow-lg ${isScanning ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}
            >
                {isScanning ? 'DEACTIVATE GUARDIAN' : 'ACTIVATE VISION CORE'}
            </button>
        </Card>
    );
};

const FuturisticFeatures: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-900 p-6 space-y-8">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 tracking-wider uppercase drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                    Royal Future Ops
                </h1>
                <p className="text-gray-400 mt-2 font-mono text-xs tracking-[0.3em]">AI INTEGRATED // VERSION 7.0</p>
            </div>

            <div className="max-w-6xl mx-auto">
                <AIPostureCorrection />
            </div>
        </div>
    );
};

export default FuturisticFeatures;
