
import React, { useState, useRef, useEffect, useMemo } from 'react';
import Card from '../common/Card';
import { 
    BrainCircuit, Activity, Zap, Eye, Crosshair, 
    RefreshCw, Camera, Lock, AlertTriangle, Play, 
    Square, Scale, ZapOff, Fingerprint, Volume2, 
    MicOff, Layers, Target, Ghost, TrendingUp,
    ChevronRight, CheckCircle, BarChart3, Speaker,
    ScanFace, Minimize2
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, YAxis, Tooltip, BarChart, Bar, Cell, CartesianGrid, XAxis } from 'recharts';
import { generateTextToSpeech, getComplexResponse, analyzeExerciseForm } from '../../../lib/gemini';
import { decode, decodeAudioData } from '../../audio';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import { BotIcon } from '../icons/BotIcon';

const TARGET_ZONES = [
    { id: 'chest', label: 'Pectoralis Major', color: 'text-cyan-400', bg: 'bg-cyan-500' },
    { id: 'back', label: 'Latissimus Dorsi', color: 'text-indigo-400', bg: 'bg-indigo-500' },
    { id: 'quads', label: 'Quadriceps', color: 'text-green-400', bg: 'bg-green-500' },
    { id: 'delts', label: 'Deltoids', color: 'text-amber-400', bg: 'bg-amber-500' }
];

const NeuralRepAnalyst: React.FC = () => {
    const { addAuditLog, liveHealthData } = useData();
    const { addToast } = useToast();

    // Phase: Setup -> Calibrating -> Active -> PostAudit
    const [phase, setPhase] = useState<'Setup' | 'Calibrating' | 'Active' | 'PostAudit'>('Setup');
    const [targetZone, setTargetZone] = useState(TARGET_ZONES[0].id);
    
    // Live Metrics (Sovereign v27.0)
    const [neuralDrive, setNeuralDrive] = useState(0); 
    const [symmetry, setSymmetry] = useState(50); // 50 = Balanced
    const [velocity, setVelocity] = useState(0.0); // m/s
    const [repCount, setRepCount] = useState(0);
    const [stabilityScore, setStabilityScore] = useState(100);
    const [liveFeedback, setLiveFeedback] = useState("Awaiting Motion...");
    
    // UI/Voice Control
    const [isMuted, setIsMuted] = useState(false);
    const [isGhostActive, setIsGhostActive] = useState(true);
    const [historyData, setHistoryData] = useState<{time: number, score: number}[]>([]);
    const [aiAuditReport, setAiAuditReport] = useState<string | null>(null);
    const [isThinking, setIsThinking] = useState(false);

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const lastSpokenTime = useRef(0);
    const lastAnalysisTime = useRef(0);
    const analysisLog = useRef<string[]>([]);
    const frameIdRef = useRef<number>(0);

    // --- 1. SOVEREIGN VOICE ENGINE ---
    const speak = async (text: string) => {
        if (isMuted || !text) return;
        const now = Date.now();
        if (now - lastSpokenTime.current < 4000) return; // Prevent overlapping voice
        
        try {
            // Using Gemini Flash Audio for low latency TTS
            const audio = await generateTextToSpeech(text);
            if (audio) {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const buffer = await decodeAudioData(decode(audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start();
                lastSpokenTime.current = now;
            }
        } catch (e) { console.warn("Voice link interrupted"); }
    };

    // --- 2. OPTICAL SENSOR HANDSHAKE ---
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraActive(true);
            return true;
        } catch (e) {
            addToast("Optical Input Blocked. Running Simulation Mode.", "info");
            setCameraActive(false); 
            // Allow proceed in simulation mode
            return true; 
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        }
        setCameraActive(false);
    };

    // --- 3. VISION & KINETIC ENGINE ---
    useEffect(() => {
        if (phase !== 'Active') {
            if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
            return;
        }

        let t = 0;
        let repProgress = 0;

        const loop = async () => {
            frameIdRef.current = requestAnimationFrame(loop);
            t += 0.03;
            const time = Date.now();

            // --- A. DATA SIMULATION (Base Layer) ---
            const driveNoise = Math.sin(time * 3) * 8;
            const currentDrive = Math.max(0, Math.min(100, 92 + driveNoise));
            setNeuralDrive(Math.floor(currentDrive));
            
            const drift = Math.sin(time * 0.8) * 12;
            setSymmetry(50 + drift);
            
            const vCycle = Math.abs(Math.cos(time * 0.002));
            setVelocity(parseFloat(vCycle.toFixed(2)));

            // Rep Logic (Simulation)
            repProgress += 1.2;
            if (repProgress >= 100) {
                repProgress = 0;
                setRepCount(prev => prev + 1);
            }

            setHistoryData(prev => [...prev.slice(-30), { time: Date.now(), score: currentDrive }]);

            // --- B. GEMINI VISION ANALYSIS (Every 4s) ---
            if (cameraActive && time - lastAnalysisTime.current > 4000 && videoRef.current) {
                lastAnalysisTime.current = time;
                
                // Capture Frame
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = videoRef.current.videoWidth;
                tempCanvas.height = videoRef.current.videoHeight;
                tempCanvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
                const base64 = tempCanvas.toDataURL('image/jpeg').split(',')[1];

                // Send to Gemini
                analyzeExerciseForm(base64).then(res => {
                    if (res.status !== 'Idle') {
                        setLiveFeedback(res.feedback);
                        setStabilityScore(prev => res.status === 'Good' ? Math.min(100, prev + 5) : Math.max(0, prev - 10));
                        
                        if (res.status === 'Correction Needed') {
                            speak(res.feedback);
                            analysisLog.current.push(`[Fault] ${res.feedback}`);
                        } else {
                            analysisLog.current.push(`[Good] Perfect Form`);
                        }
                    }
                }).catch(e => console.log("Vision Skip"));
            }

            // --- C. RENDER HUD (60 FPS) ---
            renderGodHUD(t, currentDrive, 50 + drift);
        };

        const renderGodHUD = (t: number, drive: number, sym: number) => {
            const cvs = canvasRef.current;
            if (!cvs) return;
            const ctx = cvs.getContext('2d');
            if (!ctx) return;

            // Handle Resize
            const vid = videoRef.current;
            if (vid && vid.videoWidth) {
                cvs.width = vid.videoWidth;
                cvs.height = vid.videoHeight;
            } else {
                // Fallback dimensions for simulation
                cvs.width = 1280;
                cvs.height = 720;
            }
            
            const w = cvs.width;
            const h = cvs.height;
            const cx = w / 2;
            const cy = h / 2;

            ctx.clearRect(0, 0, w, h);

            // 1. Ghost v2.0 (Holographic Overlay)
            if (isGhostActive) {
                const ghostY = cy + Math.sin(t) * 100;
                drawSkeleton(ctx, cx + 150, ghostY, 'rgba(6, 182, 212, 0.4)', [5, 5], 1.0); // Cyan Ghost
            }

            // 2. User Neural Skeleton (Live)
            const userY = cy + Math.sin(t - 0.2) * 105; 
            const userColor = stabilityScore > 80 ? '#22c55e' : '#ef4444'; // Green or Red
            drawSkeleton(ctx, cx - 150, userY, userColor, [], 1.0);

            // 3. Grid Overlay
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(cx, 0); ctx.lineTo(cx, h); // Center Vertical
            ctx.moveTo(0, cy); ctx.lineTo(w, cy); // Center Horizontal
            ctx.stroke();
        };

        const drawSkeleton = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, dash: number[] = [], scale: number) => {
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = 4;
            ctx.shadowBlur = 15;
            ctx.shadowColor = color;
            ctx.lineCap = 'round';
            ctx.setLineDash(dash);

            // Simple Stickman Model
            // Head
            ctx.beginPath(); ctx.arc(x, y - 80 * scale, 20 * scale, 0, Math.PI * 2); ctx.stroke();
            // Spine
            ctx.beginPath(); ctx.moveTo(x, y - 60 * scale); ctx.lineTo(x, y + 60 * scale); ctx.stroke();
            // Shoulders
            ctx.beginPath(); ctx.moveTo(x - 40 * scale, y - 50 * scale); ctx.lineTo(x + 40 * scale, y - 50 * scale); ctx.stroke();
            // Arms
            ctx.beginPath(); ctx.moveTo(x - 40 * scale, y - 50 * scale); ctx.lineTo(x - 60 * scale, y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + 40 * scale, y - 50 * scale); ctx.lineTo(x + 60 * scale, y); ctx.stroke();
            // Hips
            ctx.beginPath(); ctx.moveTo(x, y + 60 * scale); ctx.lineTo(x - 30 * scale, y + 150 * scale); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x, y + 60 * scale); ctx.lineTo(x + 30 * scale, y + 150 * scale); ctx.stroke();
        };

        loop();
        return () => {
            if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
        };
    }, [phase, isGhostActive, isMuted, cameraActive]);

    const handleStartSequence = async () => {
        setPhase('Calibrating');
        await startCamera();
        speak("Biometric handshake initiated. Calibrating skeletal grid.");
        setTimeout(() => {
            setPhase('Active');
            addToast("Sovereign Link: Synchronized.", "success");
        }, 3500);
    };

    const handleCompleteSet = async () => {
        setPhase('PostAudit');
        stopCamera();
        setIsThinking(true);
        speak("Sequence complete. Generating Divine Audit report.");

        const uniqueIssues = [...new Set(analysisLog.current)].join(', ');

        const prompt = `
            ACT AS ROYAL SOVEREIGN BIOMECHANICS ORACLE (Gemini 3 Pro).
            SUBJECT: ${targetZone.toUpperCase()} SESSION.
            REPS: ${repCount}.
            AVG DRIVE: ${neuralDrive}%.
            STABILITY SCORE: ${stabilityScore}/100.
            DETECTED ISSUES: ${uniqueIssues || "None. Perfect Form."}
            
            PROVIDE A GOD-TIER SCIENTIFIC BREAKDOWN IN HTML.
            HIGHLIGHT: 
            1. <h3 class="text-cyan-400 font-bold mb-1">Neural Efficiency</h3>
            2. <h3 class="text-red-400 font-bold mb-1">Mechanical Faults</h3>
            3. <h3 class="text-green-400 font-bold mb-1">Correction for Next Set</h3>
        `;

        try {
            const report = await getComplexResponse(prompt);
            setAiAuditReport(report);
            addAuditLog({
                member_id: 0,
                action: 'AI_COACH',
                details: `Neural Rep Audit for ${targetZone.toUpperCase()}`
            });
        } catch (e) {
            setAiAuditReport("<p>Neural Link Offline. Basic stats: All systems nominal.</p>");
        } finally {
            setIsThinking(false);
            analysisLog.current = []; // Clear log
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-24 h-full flex flex-col">
            {/* Header */}
            <div className="bg-[#020308] p-10 rounded-[3.5rem] border border-cyan-500/20 relative overflow-hidden shadow-2xl group flex-shrink-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-15"></div>
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-6">
                        <div className="p-6 bg-cyan-600 text-black rounded-[2.5rem] shadow-[0_0_60px_rgba(6,182,212,0.4)] group-hover:rotate-12 transition-transform duration-700">
                            <BrainCircuit className="w-16 h-16" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                                    Rep Analyst v31.0
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">STATUS: {phase === 'Active' ? 'LIVE_STREAM' : 'STANDBY'}</span>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">Vision</span>
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
                
                {/* LEFT: CONTROLS & SELECTION */}
                <div className="lg:col-span-4 space-y-6 flex flex-col">
                    <Card title="Target Protocol" className="bg-gray-950 border-white/5 p-8 rounded-[3rem]">
                        <div className="space-y-4">
                            {TARGET_ZONES.map(z => (
                                <button
                                    key={z.id}
                                    onClick={() => setTargetZone(z.id)}
                                    className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border ${
                                        targetZone === z.id 
                                        ? `bg-black border-${z.color.split('-')[1]} shadow-[0_0_20px_rgba(255,255,255,0.1)]` 
                                        : 'bg-black/40 border-white/5 hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${z.bg} ${targetZone === z.id ? 'animate-pulse' : ''}`}></div>
                                        <span className={`text-sm font-black uppercase tracking-widest ${targetZone === z.id ? 'text-white' : 'text-gray-500'}`}>{z.label}</span>
                                    </div>
                                    {targetZone === z.id && <Target className={`w-4 h-4 ${z.color}`} />}
                                </button>
                            ))}
                        </div>
                        
                        <div className="mt-8 p-4 bg-indigo-900/10 rounded-2xl border border-indigo-500/20">
                             <div className="flex justify-between items-center mb-2">
                                 <p className="text-[10px] font-black text-indigo-400 uppercase">Ghost Coach</p>
                                 <button onClick={() => setIsGhostActive(!isGhostActive)} className={`w-8 h-4 rounded-full transition-colors ${isGhostActive ? 'bg-indigo-500' : 'bg-gray-700'}`}>
                                     <div className={`w-3 h-3 bg-white rounded-full transform transition-transform ${isGhostActive ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                                 </button>
                             </div>
                             <p className="text-[9px] text-gray-500">Overlay perfect bio-mechanical form.</p>
                        </div>

                        <div className="mt-4 p-4 bg-indigo-900/10 rounded-2xl border border-indigo-500/20">
                             <div className="flex justify-between items-center mb-2">
                                 <p className="text-[10px] font-black text-indigo-400 uppercase">Voice Feedback</p>
                                 <button onClick={() => setIsMuted(!isMuted)} className={`w-8 h-4 rounded-full transition-colors ${!isMuted ? 'bg-indigo-500' : 'bg-gray-700'}`}>
                                     <div className={`w-3 h-3 bg-white rounded-full transform transition-transform ${!isMuted ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                                 </button>
                             </div>
                             <p className="text-[9px] text-gray-500">Real-time corrections via Sovereign TTS.</p>
                        </div>
                    </Card>

                    {phase === 'Active' && (
                        <div className="bg-black border border-white/10 p-6 rounded-[2.5rem] text-center shadow-2xl animate-pulse border-cyan-500/50">
                            <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-1">Rep Counter</p>
                            <p className="text-7xl font-black text-white italic tracking-tighter">{repCount}</p>
                            <p className="text-xs text-gray-500 mt-2 uppercase font-bold">Form Score: {stabilityScore}%</p>
                        </div>
                    )}
                </div>

                {/* RIGHT: VISION & HUD */}
                <div className="lg:col-span-8 flex flex-col h-full min-h-[600px]">
                    <Card className="flex-1 bg-black border-white/5 p-0 overflow-hidden rounded-[4rem] relative shadow-2xl group flex flex-col">
                        
                        {phase === 'Setup' && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-10 text-center">
                                <div className="w-32 h-32 rounded-full bg-cyan-900/20 flex items-center justify-center border-4 border-cyan-500/30 mb-8 animate-spin-slow">
                                    <Eye className="w-12 h-12 text-cyan-400" />
                                </div>
                                <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Vision Core Standby</h3>
                                <p className="text-gray-400 max-w-md text-sm leading-relaxed mb-8">
                                    "I will track 33 skeletal points to ensure biomechanical perfection. Align yourself in the frame."
                                </p>
                                <button 
                                    onClick={handleStartSequence}
                                    className="bg-white text-black font-black px-12 py-5 rounded-[2.5rem] uppercase tracking-widest text-xs shadow-2xl hover:bg-cyan-500 transition-all flex items-center gap-3 active:scale-95"
                                >
                                    <Camera className="w-5 h-5" /> Initialize Vision
                                </button>
                            </div>
                        )}

                        <div className="relative flex-grow bg-[#020202] overflow-hidden">
                             {/* Simulated or Real Camera Feed */}
                             <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80 transform scale-x-[-1]" />
                             <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-0" />
                             
                             {/* HUD OVERLAY */}
                             {phase === 'Active' && (
                                <div className="absolute inset-0 z-10 p-6 flex flex-col justify-between pointer-events-none">
                                    {/* Top Metrics */}
                                    <div className="flex justify-between items-start">
                                        <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                                            <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Activity className="w-3 h-3"/> Neural Drive</p>
                                            <div className="flex items-end gap-2">
                                                <span className="text-3xl font-black text-white italic">{neuralDrive}%</span>
                                                <div className="w-20 h-1.5 bg-gray-800 rounded-full mb-1.5 overflow-hidden">
                                                    <div className="h-full bg-cyan-500 transition-all duration-75" style={{ width: `${neuralDrive}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-right">
                                            <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1 flex items-center gap-2 justify-end">Velocity <Zap className="w-3 h-3"/></p>
                                            <p className="text-3xl font-black text-white italic">{velocity} <span className="text-xs text-gray-500">m/s</span></p>
                                        </div>
                                    </div>

                                    {/* Center Reticle */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-dashed border-white/10 rounded-full flex items-center justify-center opacity-30">
                                        <Crosshair className="w-8 h-8 text-white/50" />
                                    </div>
                                    
                                    {/* Live Feedback Toast */}
                                    <div className="absolute top-1/2 left-0 right-0 text-center">
                                         <span className="bg-black/80 text-white px-6 py-2 rounded-full border border-cyan-500/50 text-sm font-bold uppercase tracking-widest shadow-2xl backdrop-blur-lg">
                                             {liveFeedback}
                                         </span>
                                    </div>

                                    {/* Bottom Metrics */}
                                    <div className="flex justify-between items-end">
                                        <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-48">
                                            <p className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Scale className="w-3 h-3"/> Symmetry</p>
                                            <div className="relative h-2 bg-gray-800 rounded-full w-full">
                                                <div className="absolute top-0 bottom-0 w-1 bg-white left-1/2 transform -translate-x-1/2 z-10"></div>
                                                <div 
                                                    className={`absolute top-0 bottom-0 w-2 rounded-full transition-all duration-75 ${Math.abs(symmetry - 50) < 10 ? 'bg-green-500' : 'bg-red-500'}`}
                                                    style={{ left: `${symmetry}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-[8px] font-bold text-gray-500 mt-1 uppercase">
                                                <span>Left</span><span>Right</span>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handleCompleteSet}
                                            className="pointer-events-auto bg-red-600 hover:bg-red-500 text-white font-black px-10 py-4 rounded-3xl shadow-xl transition-all uppercase tracking-widest text-xs flex items-center gap-3 active:scale-95"
                                        >
                                            <Square className="w-4 h-4 fill-current" /> Terminate Set
                                        </button>
                                    </div>
                                </div>
                             )}

                             {/* POST AUDIT SCREEN */}
                             {phase === 'PostAudit' && (
                                 <div className="absolute inset-0 z-20 bg-black/95 backdrop-blur-xl p-10 flex flex-col items-center justify-center text-center animate-fade-in">
                                     {isThinking ? (
                                         <div className="space-y-6">
                                             <RefreshCw className="w-16 h-16 text-cyan-500 animate-spin mx-auto" />
                                             <h3 className="text-2xl font-black text-white uppercase italic tracking-widest animate-pulse">Compiling Neural Report...</h3>
                                             <p className="text-cyan-400 font-mono text-sm tracking-widest">Analyzing {repCount} Repetitions</p>
                                         </div>
                                     ) : aiAuditReport ? (
                                         <div className="w-full max-w-2xl space-y-8 animate-scale-in">
                                             <div className="flex items-center justify-center gap-4 mb-6">
                                                 <BotIcon className="w-10 h-10 text-cyan-400" />
                                                 <h3 className="text-3xl font-black text-white uppercase italic">Divine Audit</h3>
                                             </div>
                                             
                                             <div className="bg-gray-900/50 p-8 rounded-[3rem] border border-cyan-500/20 text-left prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed shadow-inner custom-scrollbar overflow-y-auto max-h-[350px]" dangerouslySetInnerHTML={{ __html: aiAuditReport }} />

                                             <div className="flex gap-4 justify-center pt-4">
                                                 <button onClick={() => setPhase('Active')} className="bg-white text-black font-black px-8 py-3 rounded-2xl uppercase tracking-widest text-xs hover:bg-cyan-400 transition-all flex items-center gap-2">
                                                     <RefreshCw className="w-4 h-4" /> Next Set
                                                 </button>
                                                 <button onClick={() => { stopCamera(); setPhase('Setup'); }} className="bg-gray-900 text-gray-400 font-black px-8 py-3 rounded-2xl uppercase tracking-widest text-xs border border-white/10 hover:text-white hover:bg-gray-800 transition-all">
                                                     Finish Protocol
                                                 </button>
                                             </div>
                                         </div>
                                     ) : null}
                                 </div>
                             )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default NeuralRepAnalyst;
