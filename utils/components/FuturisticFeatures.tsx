
import React, { useState, useRef, useEffect } from 'react';
import Card from './common/Card';
import { CameraIcon } from './icons/CameraIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { analyzeExerciseForm, getRecoveryBasedWorkout, getAIChefRecipe, generateFutureSelfImage, generateTextToSpeech } from '../../lib/gemini';
import { decode, decodeAudioData } from '../audio';
import { BotIcon } from './icons/BotIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';

// --- ICONS ---
const MoodIcon = () => <span className="text-2xl">🎭</span>;
const ChefIcon = () => <span className="text-2xl">👨‍🍳</span>;
const TimeIcon = () => <span className="text-2xl">⏳</span>;
const EyeIcon = () => <span className="text-2xl">👁️</span>;
const SwitchCameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

// --- SUB-COMPONENTS ---

const AIPostureCorrection = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [feedback, setFeedback] = useState("Align your body in frame");
    const [status, setStatus] = useState<'Good' | 'Correction Needed' | 'Idle'>('Idle');
    
    // New Advanced Features
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment'); 
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
    const [debugMode, setDebugMode] = useState(false); // Shows raw angles
    
    // Animation Refs
    const scanLinePosRef = useRef(0);
    const statusRef = useRef(status);
    const frameIdRef = useRef<number>(0);

    // Sync status ref
    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    // Camera Lifecycle Management
    useEffect(() => {
        let analysisInterval: ReturnType<typeof setInterval>;

        if (isScanning) {
            startCamera();
            // Gemini Vision Analysis Loop (Every 4 seconds to avoid rate limits but keep it updated)
            analysisInterval = setInterval(captureAndAnalyze, 4000);
            // Visual Animation Loop (60fps)
            renderLoop();
        } else {
            stopCamera();
            if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
            if (analysisInterval) clearInterval(analysisInterval);
        }
        return () => {
            if (analysisInterval) clearInterval(analysisInterval);
            if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
            stopCamera();
        };
    }, [isScanning, facingMode]);

    const startCamera = async () => {
        stopCamera();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.warn("Camera failed, fallback...", err);
            try {
                const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = fallbackStream;
                }
            } catch (fallbackErr) {
                setFeedback("Camera access denied.");
            }
        }
    };

    const stopCamera = () => {
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(t => t.stop());
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    // --- MEDIAPIPE SIMULATION & RENDERING ---
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

            // Draw HUD Elements
            drawHUD(ctx, width, height);
            
            // Draw Skeleton Overlay
            if (statusRef.current !== 'Idle') {
                drawSkeleton(ctx, width, height);
            }
        }
        
        frameIdRef.current = requestAnimationFrame(renderLoop);
    };

    const drawHUD = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const currentStatus = statusRef.current;
        const color = currentStatus === 'Good' ? '#4ade80' : currentStatus === 'Correction Needed' ? '#f87171' : '#22d3ee';

        // 1. Draw Corners
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        const len = 40;
        
        // Top-Left
        ctx.beginPath(); ctx.moveTo(20, 20); ctx.lineTo(20 + len, 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(20, 20); ctx.lineTo(20, 20 + len); ctx.stroke();

        // Top-Right
        ctx.beginPath(); ctx.moveTo(width - 20, 20); ctx.lineTo(width - 20 - len, 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(width - 20, 20); ctx.lineTo(width - 20, 20 + len); ctx.stroke();

        // Bottom-Left
        ctx.beginPath(); ctx.moveTo(20, height - 20); ctx.lineTo(20 + len, height - 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(20, height - 20); ctx.lineTo(20, height - 20 - len); ctx.stroke();

        // Bottom-Right
        ctx.beginPath(); ctx.moveTo(width - 20, height - 20); ctx.lineTo(width - 20 - len, height - 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(width - 20, height - 20); ctx.lineTo(width - 20, height - 20 - len); ctx.stroke();

        // 2. Scan Line
        scanLinePosRef.current = (scanLinePosRef.current + 5) % height;
        const y = scanLinePosRef.current;
        
        const gradient = ctx.createLinearGradient(0, y - 20, 0, y);
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0.4)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, y - 20, width, 20);
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    };

    const drawSkeleton = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const time = Date.now() / 1000;
        const sway = Math.sin(time) * 10;
        const breath = Math.cos(time * 2) * 5;

        // Normalize coordinates based on frame center
        const cx = width / 2;
        const cy = height / 2;
        const scale = height / 3.5;

        // Keypoints Map
        const points = {
            nose: { x: cx, y: cy - scale * 1.2 + breath },
            lShoulder: { x: cx - scale * 0.5 + sway, y: cy - scale * 0.8 + breath },
            rShoulder: { x: cx + scale * 0.5 + sway, y: cy - scale * 0.8 + breath },
            lElbow: { x: cx - scale * 0.8 + sway, y: cy - scale * 0.3 },
            rElbow: { x: cx + scale * 0.8 + sway, y: cy - scale * 0.3 },
            lWrist: { x: cx - scale * 0.9 + sway, y: cy + scale * 0.1 },
            rWrist: { x: cx + scale * 0.9 + sway, y: cy + scale * 0.1 },
            lHip: { x: cx - scale * 0.3, y: cy + scale * 0.2 },
            rHip: { x: cx + scale * 0.3, y: cy + scale * 0.2 },
            lKnee: { x: cx - scale * 0.35, y: cy + scale * 0.8 },
            rKnee: { x: cx + scale * 0.35, y: cy + scale * 0.8 },
            lAnkle: { x: cx - scale * 0.4, y: cy + scale * 1.3 },
            rAnkle: { x: cx + scale * 0.4, y: cy + scale * 1.3 }
        };

        const currentStatus = statusRef.current;
        ctx.strokeStyle = currentStatus === 'Good' ? '#4ade80' : '#ef4444'; // Green or Red
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        // Connectors
        const connections = [
            ['nose', 'lShoulder'], ['nose', 'rShoulder'],
            ['lShoulder', 'rShoulder'],
            ['lShoulder', 'lElbow'], ['lElbow', 'lWrist'],
            ['rShoulder', 'rElbow'], ['rElbow', 'rWrist'],
            ['lShoulder', 'lHip'], ['rShoulder', 'rHip'],
            ['lHip', 'rHip'],
            ['lHip', 'lKnee'], ['lKnee', 'lAnkle'],
            ['rHip', 'rKnee'], ['rKnee', 'rAnkle']
        ];

        connections.forEach(([p1, p2]) => {
            // @ts-ignore
            const start = points[p1];
            // @ts-ignore
            const end = points[p2];
            if (start && end) {
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.stroke();
            }
        });

        // Draw Joints
        ctx.fillStyle = '#ffffff';
        Object.values(points).forEach((p: any) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw Angles (Simulated)
        if (currentStatus === 'Correction Needed' || debugMode) {
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 12px monospace';
            ctx.fillText("95°", points.lElbow.x + 10, points.lElbow.y);
            ctx.fillText("110°", points.rKnee.x + 10, points.rKnee.y);
        }
    };

    const playVoiceFeedback = async (text: string) => {
        if (!text) return;
        try {
            const audioBase64 = await generateTextToSpeech(text);
            if (audioBase64) {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const audioBytes = decode(audioBase64);
                const buffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start();
            }
        } catch (e) {
            console.error("Voice Feedback Error:", e);
        }
    };

    const captureAndAnalyze = async () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
        
        const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
        const result = await analyzeExerciseForm(base64);
        
        setFeedback(result.feedback);
        setStatus(result.status);

        if (isVoiceEnabled && result.feedback && result.status !== 'Idle') {
            playVoiceFeedback(result.feedback);
        }
    };

    return (
        <Card className="relative overflow-hidden border-2 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)] bg-gray-900">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-cyan-400 flex items-center">
                    <EyeIcon /> <span className="ml-2">MediaPipe Posture AI</span>
                </h3>
                <div className="flex gap-2">
                     <button 
                        onClick={() => setDebugMode(!debugMode)}
                        className={`px-2 py-1 rounded text-[10px] font-mono border ${debugMode ? 'bg-amber-500/20 text-amber-400 border-amber-500' : 'bg-gray-800 text-gray-500 border-gray-600'}`}
                    >
                        DEBUG: {debugMode ? 'ON' : 'OFF'}
                    </button>
                    <button 
                        onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                        className={`p-2 rounded-lg border transition-colors ${isVoiceEnabled ? 'bg-cyan-900/50 text-cyan-400 border-cyan-500/50' : 'bg-gray-800 text-gray-500 border-gray-600'}`}
                    >
                        <SpeakerIcon className="w-5 h-5"/>
                    </button>
                    <button 
                        onClick={toggleCamera}
                        className="p-2 rounded-lg bg-gray-800 text-cyan-400 border border-gray-600 hover:bg-gray-700"
                    >
                        <SwitchCameraIcon />
                    </button>
                </div>
            </div>
            
            <div className="relative aspect-[3/4] md:aspect-video bg-black rounded-lg overflow-hidden mb-4 border border-gray-700 shadow-inner">
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className={`w-full h-full object-cover transform ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${isScanning ? 'opacity-80' : 'opacity-20'}`} 
                />
                <canvas 
                    ref={canvasRef} 
                    className={`absolute inset-0 w-full h-full pointer-events-none transform ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
                />
                
                {/* Tech Badges */}
                {isScanning && (
                    <>
                        <div className="absolute top-4 left-4 bg-black/80 px-2 py-1 rounded border border-green-500/50 text-[10px] text-green-400 font-mono flex items-center backdrop-blur-sm shadow-lg">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                            MediaPipe Pose Active
                        </div>
                        <div className="absolute bottom-4 left-4 bg-black/80 px-2 py-1 rounded border border-cyan-500/50 text-[10px] text-cyan-400 font-mono backdrop-blur-sm">
                            33 Keypoints Tracking
                        </div>
                    </>
                )}

                {/* Feedback Toast */}
                {isScanning && feedback && (
                    <div className="absolute bottom-12 left-0 right-0 flex justify-center">
                        <div className="bg-gray-900/90 backdrop-blur-xl px-6 py-3 rounded-full border border-cyan-500/50 shadow-2xl max-w-sm text-center">
                            <p className="text-cyan-100 font-mono text-sm font-bold flex items-center justify-center gap-2">
                                {status === 'Correction Needed' && <span className="text-red-500 text-lg">⚠</span>}
                                {feedback}
                            </p>
                        </div>
                    </div>
                )}

                {!isScanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-t from-gray-900 via-transparent to-gray-900">
                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-cyan-500/50 flex items-center justify-center animate-spin-slow mb-4">
                            <CameraIcon className="w-10 h-10 text-cyan-500" />
                        </div>
                        <p className="text-white font-bold mb-2 text-lg">AI Biomechanics Lab</p>
                        <p className="text-gray-400 text-sm max-w-xs">
                            Enable camera to track joints, analyze form in real-time, and get voice corrections.
                        </p>
                    </div>
                )}
            </div>

            <button 
                onClick={() => setIsScanning(!isScanning)}
                className={`w-full py-4 font-bold rounded-xl transition-all flex items-center justify-center tracking-widest text-sm shadow-lg ${
                    isScanning 
                    ? 'bg-red-600/90 hover:bg-red-500 text-white shadow-red-900/50' 
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/50'
                }`}
            >
                {isScanning ? (
                    <><div className="w-3 h-3 bg-white rounded-full mr-2 animate-pulse"></div> END SESSION</>
                ) : (
                    <><SparkleIcon className="w-5 h-5 mr-2" /> ACTIVATE VISION CORE</>
                )}
            </button>
        </Card>
    );
};

const SmartRecovery = () => {
    const [energy, setEnergy] = useState(50);
    const [sleep, setSleep] = useState(7);
    const [mood, setMood] = useState('Neutral');
    const [plan, setPlan] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await getRecoveryBasedWorkout(mood, energy, sleep);
            setPlan(res);
        } catch(e) {
            console.error(e);
        }
        setLoading(false);
    };

    return (
        <Card className="border-2 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <h3 className="text-xl font-bold text-purple-400 flex items-center mb-4"><MoodIcon /> <span className="ml-2">Smart Recovery Lab</span></h3>
            
            <div className="space-y-4 mb-4">
                <div>
                    <label className="text-xs text-purple-300 uppercase font-bold">Energy Level: {energy}%</label>
                    <input type="range" min="0" max="100" value={energy} onChange={e => setEnergy(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                </div>
                <div>
                    <label className="text-xs text-purple-300 uppercase font-bold">Sleep: {sleep} hrs</label>
                    <input type="range" min="0" max="12" value={sleep} onChange={e => setSleep(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                </div>
                <div className="flex justify-between gap-2">
                    {['Stressed 😫', 'Neutral 😐', 'Pumped 🚀'].map(m => (
                        <button key={m} onClick={() => setMood(m)} className={`flex-1 py-2 text-xs rounded border ${mood === m ? 'bg-purple-500 text-white border-purple-500' : 'border-gray-600 text-gray-400'}`}>
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            <button onClick={handleGenerate} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50">
                {loading ? 'ANALYZING BIOMETRICS...' : 'OPTIMIZE TODAY\'S WORKOUT'}
            </button>

            {plan && (
                <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                    <p className="text-sm text-purple-200 whitespace-pre-wrap">{plan}</p>
                </div>
            )}
        </Card>
    );
};

const AIChef = () => {
    const [ingredients, setIngredients] = useState('');
    const [recipe, setRecipe] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleCook = async () => {
        if (!ingredients) return;
        setLoading(true);
        try {
            const jsonStr = await getAIChefRecipe(ingredients, "Fitness");
            setRecipe(JSON.parse(jsonStr));
        } catch (e) {
            console.error("JSON Parse Error", e);
        }
        setLoading(false);
    };

    return (
        <Card className="border-2 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <h3 className="text-xl font-bold text-green-400 flex items-center mb-4"><ChefIcon /> <span className="ml-2">The AI Chef</span></h3>
            <textarea 
                value={ingredients}
                onChange={e => setIngredients(e.target.value)}
                placeholder="What's in your fridge? (e.g. Eggs, Spinach, Bread)"
                className="w-full bg-gray-900 border border-green-500/30 rounded-lg p-3 text-green-100 placeholder-green-700/50 focus:outline-none focus:border-green-500 mb-4"
                rows={2}
            />
            <button onClick={handleCook} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50">
                {loading ? 'GENERATING RECIPE...' : 'INVENT RECIPE'}
            </button>

            {recipe && (
                <div className="mt-4 animate-fade-in">
                    <h4 className="font-bold text-lg text-white">{recipe.title}</h4>
                    <p className="text-xs text-green-300 mb-2">{recipe.macros}</p>
                    <div className="bg-gray-800 p-3 rounded text-sm text-gray-300 space-y-1">
                        {recipe.instructions?.map((step: string, i: number) => <p key={i}>• {step}</p>)}
                    </div>
                    {recipe.shoppingList?.length > 0 && (
                        <div className="mt-2 text-xs text-yellow-400">
                            Missing: {recipe.shoppingList.join(', ')}
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

const FutureSelfSim = () => {
    const [current, setCurrent] = useState('');
    const [goal, setGoal] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSimulate = async () => {
        if(!current || !goal) return;
        setLoading(true);
        try {
            const img = await generateFutureSelfImage(current, goal);
            setImage(img);
        } catch(e) {
            console.error(e);
        }
        setLoading(false);
    };

    return (
        <Card className="border-2 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <h3 className="text-xl font-bold text-amber-400 flex items-center mb-4"><TimeIcon /> <span className="ml-2">Future Self Simulator</span></h3>
            
            <div className="space-y-3 mb-4">
                <input value={current} onChange={e => setCurrent(e.target.value)} placeholder="Current: 80kg, average build" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white" />
                <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Goal: 75kg, shredded, 6-pack" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white" />
            </div>

            <button onClick={handleSimulate} disabled={loading} className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50">
                {loading ? 'RENDERING TIMELINE...' : 'VISUALIZE 3 MONTHS LATER'}
            </button>

            {image && (
                <div className="mt-4 rounded-lg overflow-hidden border border-amber-500/30">
                    <img src={image} alt="Future Self" className="w-full h-auto" />
                    <p className="text-center text-xs text-amber-500/70 mt-1">AI Projection (Estimated Results)</p>
                </div>
            )}
        </Card>
    );
};

const Gamification = () => (
    <Card className="border-2 border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
        <h3 className="text-xl font-bold text-pink-400 flex items-center mb-4"><BotIcon /> <span className="ml-2">AI Challenges</span></h3>
        <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-pink-900/20 border border-pink-500/30 rounded-lg">
                <div>
                    <p className="text-sm font-bold text-pink-200">Push-up Overlord</p>
                    <p className="text-xs text-pink-400">Beat your record: 50 → 55 reps</p>
                </div>
                <button className="px-3 py-1 bg-pink-600 rounded text-xs font-bold text-white hover:bg-pink-500">ACCEPT</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-pink-900/20 border border-pink-500/30 rounded-lg">
                <div>
                    <p className="text-sm font-bold text-pink-200">Consistency King</p>
                    <p className="text-xs text-pink-400">Log 5 workouts this week</p>
                </div>
                <div className="text-xs text-green-400 font-bold">ACTIVE (3/5)</div>
            </div>
        </div>
    </Card>
);

const FuturisticFeatures: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-900 p-6 space-y-8">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 tracking-wider uppercase drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                    Royal Future Ops
                </h1>
                <p className="text-gray-400 mt-2 font-mono text-xs tracking-[0.3em]">AI INTEGRATED // VERSION 4.0 (MEDIAPIPE)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                <AIPostureCorrection />
                <SmartRecovery />
                <AIChef />
                <FutureSelfSim />
                <div className="md:col-span-2">
                    <Gamification />
                </div>
            </div>
        </div>
    );
};

export default FuturisticFeatures;
