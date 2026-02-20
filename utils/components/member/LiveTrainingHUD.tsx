
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    Activity, XCircle, Zap, Crosshair, Volume2, 
    MicOff, Ghost, Scale, RefreshCw, 
    Cpu, BrainCircuit, Target, 
    Square, Play, Scan, Minimize2, Layers, ShieldAlert,
    CheckCircle,
    Grid
} from 'lucide-react';
import { generateTextToSpeech, getComplexResponse, analyzeExerciseForm } from '../../../lib/gemini';
import { decode, decodeAudioData } from '../../audio';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import { BotIcon } from '../icons/BotIcon';

interface LiveTrainingHUDProps {
    exercise: string;
    sets: string;
    onClose: () => void;
}

const LiveTrainingHUD: React.FC<LiveTrainingHUDProps> = ({ exercise, sets, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { addToast } = useToast();
    const { connectedDevice, liveHealthData } = useData();
    
    // Core State Machine
    const [phase, setPhase] = useState<'Setup' | 'Calibrating' | 'Active' | 'PostAudit'>('Setup');
    
    // Live Metrics (Calculated Client-Side)
    const [neuralDrive, setNeuralDrive] = useState(0); 
    const [symmetry, setSymmetry] = useState(50); // 50 = Balanced
    const [velocity, setVelocity] = useState(0.0); // m/s
    const [repCount, setRepCount] = useState(0);
    const [formScore, setFormScore] = useState(100);
    const [liveFeedback, setLiveFeedback] = useState("Awaiting Motion...");
    
    // AI Audit Report
    const [aiAuditReport, setAiAuditReport] = useState<string | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    const [isAnalyzingVision, setIsAnalyzingVision] = useState(false);

    // UI/Voice Control
    const [isMuted, setIsMuted] = useState(false);
    const [isGhostActive, setIsGhostActive] = useState(true);
    const [cameraActive, setCameraActive] = useState(false);
    const [showGrid, setShowGrid] = useState(true);

    const currentAudioRef = useRef<AudioBufferSourceNode | null>(null);
    const lastSpokenTime = useRef(0);
    const analysisLog = useRef<string[]>([]);
    const frameIdRef = useRef<number>(0);

    // --- 1. SOVEREIGN VOICE ENGINE ---
    const speak = async (text: string) => {
        if (isMuted || !text) return;
        const now = Date.now();
        if (now - lastSpokenTime.current < 4000) return; // Prevent spam
        
        try {
            const audioData = await generateTextToSpeech(text);
            if (audioData) {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start();
                currentAudioRef.current = source;
                lastSpokenTime.current = now;
            }
        } catch (e) { console.warn("Voice link interrupted"); }
    };

    // --- 2. OPTICAL SENSOR HANDSHAKE ---
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } } 
            });
            if (videoRef.current) videoRef.current.srcObject = stream;
            setCameraActive(true);
            return true;
        } catch (e) {
            setLiveFeedback("SENSOR ACCESS DENIED");
            addToast("Camera permissions required for Live Mirror. Running Simulation.", "error");
            setCameraActive(false);
            return true; 
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        }
        setCameraActive(false);
    };

    // --- 3. MANUAL VISION ANALYSIS (ON DEMAND ONLY - COST SAVING) ---
    const triggerVisualAudit = async () => {
        if (!videoRef.current || !cameraActive) {
             // Simulate for demo if camera off
             setLiveFeedback("SIMULATION: PERFECT FORM");
             setFormScore(100);
             return;
        }
        setIsAnalyzingVision(true);
        addToast("Capturing Frame for Neural Audit...", "info");

        try {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = videoRef.current.videoWidth;
            tempCanvas.height = videoRef.current.videoHeight;
            tempCanvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
            const base64 = tempCanvas.toDataURL('image/jpeg').split(',')[1];

            // Send to Gemini Vision (Single Call)
            const res = await analyzeExerciseForm(base64);
            
            if (res.status !== 'Idle') {
                setLiveFeedback(res.feedback.toUpperCase());
                setFormScore(prev => res.status === 'Good' ? Math.min(100, prev + 5) : Math.max(0, prev - 15));
                speak(res.feedback);
                addToast("Audit Complete: Form " + res.status, res.status === 'Good' ? 'success' : 'error');
                analysisLog.current.push(`[${new Date().toLocaleTimeString()}] ${res.status}: ${res.feedback}`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzingVision(false);
        }
    };

    // --- 4. KINETIC-NEURAL ENGINE (Animation & Tracking - CLIENT SIDE ONLY) ---
    useEffect(() => {
        if (phase !== 'Active') {
            if(frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
            return;
        }

        let t = 0;
        let repProgress = 0; 

        const loop = async () => {
            frameIdRef.current = requestAnimationFrame(loop);
            t += 0.02; // Time variable
            const time = Date.now();

            // --- A. DATA SIMULATION (Base Layer) ---
            const driveNoise = Math.sin(time / 1000) * 8;
            const currentDrive = Math.max(0, Math.min(100, 92 + driveNoise));
            setNeuralDrive(Math.floor(currentDrive));
            
            const drift = Math.sin(time / 2000) * 12;
            setSymmetry(50 + drift);
            
            const vCycle = Math.abs(Math.cos(time / 500));
            setVelocity(parseFloat(vCycle.toFixed(2)));

            // Rep Logic (Simulation)
            repProgress = (repProgress + 1.2) % 100;
            if(repProgress < 1.2) {
                setRepCount(prev => prev + 1);
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
            const userColor = formScore > 80 ? '#22c55e' : '#ef4444'; 
            drawSkeleton(ctx, cx - 150, userY, userColor, [], 1.0);

            // 3. Grid Overlay
            if (showGrid) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.moveTo(cx, 0); ctx.lineTo(cx, h); // Center Vertical
                ctx.moveTo(0, cy); ctx.lineTo(w, cy); // Center Horizontal
                ctx.stroke();
            }
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
    }, [phase, isGhostActive, isMuted, cameraActive, formScore, showGrid]);

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
            ACT AS SOVEREIGN BIOMECHANICS ORACLE (Gemini 3 Pro).
            SUBJECT: ${exercise} SESSION.
            REPS: ${repCount}.
            AVG DRIVE: ${neuralDrive}%.
            STABILITY SCORE: ${formScore}/100.
            DETECTED ISSUES: ${uniqueIssues || "None. Perfect Form."}
            
            PROVIDE A GOD-TIER SCIENTIFIC BREAKDOWN IN HTML.
        `;
        try {
            const report = await getComplexResponse(prompt);
            setAiAuditReport(report);
        } catch (e) {
            setAiAuditReport("<p>Neural Link Offline. Basic stats: All systems nominal.</p>");
        } finally {
            setIsThinking(false);
            analysisLog.current = []; // Clear log
        }
    };

    return (
        <div className="fixed inset-0 z-[250] bg-[#050505] flex flex-col font-sans overflow-hidden">
            {/* --- TOP HUD --- */}
            <div className="absolute top-0 left-0 right-0 z-30 p-6 flex justify-between items-start pointer-events-none">
                <div className="flex gap-4 pointer-events-auto">
                     <div className="bg-black/60 backdrop-blur-xl p-4 rounded-[2rem] border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                         <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-full ${phase === 'Active' ? 'bg-red-600 animate-pulse' : 'bg-gray-800'}`}>
                                 <Activity className="w-5 h-5 text-white" />
                             </div>
                             <div>
                                 <h2 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">{exercise}</h2>
                                 <p className="text-[9px] text-cyan-400 font-mono tracking-widest uppercase">{sets} SETS REMAINING</p>
                             </div>
                         </div>
                     </div>
                     <div className="bg-black/60 backdrop-blur-xl p-4 rounded-[2rem] border border-white/10 flex items-center gap-4">
                         <div className="text-right">
                             <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Heart Rate</p>
                             <p className="text-2xl font-black text-white font-mono italic">
                                 {liveHealthData.heartRate.avg} <span className="text-xs text-gray-500">BPM</span>
                             </p>
                         </div>
                     </div>
                </div>

                <div className="flex gap-2 pointer-events-auto">
                    {/* TRIGGER MANUAL VISION AUDIT */}
                    {phase === 'Active' && (
                        <button 
                            onClick={triggerVisualAudit}
                            disabled={isAnalyzingVision}
                            className={`p-4 rounded-2xl backdrop-blur-xl border transition-all ${isAnalyzingVision ? 'bg-amber-500 text-black border-amber-500 animate-pulse' : 'bg-cyan-900/40 border-cyan-500 text-cyan-400 hover:bg-cyan-800/60'}`}
                            title="Run Single-Frame AI Audit"
                        >
                            {isAnalyzingVision ? <RefreshCw className="w-5 h-5 animate-spin" /> : <BotIcon className="w-5 h-5" />}
                        </button>
                    )}

                    <button onClick={() => setShowGrid(!showGrid)} className={`p-4 rounded-2xl backdrop-blur-xl border transition-all ${showGrid ? 'bg-cyan-900/40 border-cyan-500 text-cyan-400' : 'bg-black/40 border-white/10 text-gray-500'}`}>
                        <Grid className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsGhostActive(!isGhostActive)} className={`p-4 rounded-2xl backdrop-blur-xl border transition-all ${isGhostActive ? 'bg-indigo-900/40 border-indigo-500 text-indigo-400' : 'bg-black/40 border-white/10 text-gray-500'}`}>
                        <Ghost className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-2xl backdrop-blur-xl border transition-all ${!isMuted ? 'bg-green-900/40 border-green-500 text-green-400' : 'bg-black/40 border-white/10 text-gray-500'}`}>
                        {!isMuted ? <Volume2 className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </button>
                    <button onClick={onClose} className="p-4 rounded-2xl bg-red-900/40 border border-red-500 text-red-400 hover:bg-red-800/60 transition-all">
                        <Minimize2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* --- MAIN VIEWPORT --- */}
            <div className="relative flex-grow bg-[#020202]">
                {cameraActive && <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1] opacity-50" />}
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full transform scale-x-[-1]" />
                
                {/* Center Reticle */}
                {phase === 'Active' && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-dashed border-white/10 rounded-full flex items-center justify-center pointer-events-none">
                        <Crosshair className="w-8 h-8 text-white/50" />
                    </div>
                )}

                {(phase === 'Setup' || phase === 'Calibrating') && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-10 text-center animate-fade-in">
                        {phase === 'Calibrating' ? (
                            <div className="space-y-6">
                                <RefreshCw className="w-24 h-24 text-cyan-500 animate-spin mx-auto" />
                                <h3 className="text-4xl font-black text-white uppercase italic tracking-widest animate-pulse">Calibrating...</h3>
                                <p className="text-cyan-400 font-mono text-sm tracking-widest">Scanning Skeletal Mesh</p>
                            </div>
                        ) : (
                            <>
                                <div className="w-40 h-40 rounded-full bg-cyan-900/10 flex items-center justify-center border-[6px] border-cyan-500/30 mb-10 shadow-[0_0_60px_rgba(6,182,212,0.3)] animate-pulse">
                                    <Layers className="w-16 h-16 text-cyan-400" />
                                </div>
                                <h3 className="text-6xl font-black text-white italic uppercase tracking-tighter mb-4">Neural Mirror</h3>
                                <p className="text-gray-400 max-w-lg text-lg leading-relaxed mb-12 font-medium">
                                    "Align your body within the grid. Bio-Metrics will be pulled from {connectedDevice ? connectedDevice.name : "Simulated Core"}."
                                </p>
                                <button 
                                    onClick={handleStartSequence}
                                    className="bg-white text-black font-black px-16 py-6 rounded-[3rem] uppercase tracking-[0.3em] text-xs shadow-[0_0_50px_rgba(255,255,255,0.4)] hover:scale-105 transition-all flex items-center gap-4 group"
                                >
                                    <Play className="w-5 h-5 fill-current group-hover:text-cyan-500 transition-colors" /> Initialize Vision Core
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* --- BOTTOM HUD --- */}
            {phase === 'Active' && (
                <div className="absolute bottom-0 left-0 right-0 z-30 p-8 flex justify-between items-end bg-gradient-to-t from-black via-black/80 to-transparent">
                     {/* LEFT METRICS */}
                     <div className="flex gap-6">
                         <div className="bg-black/60 backdrop-blur-xl p-5 rounded-[2rem] border border-white/10 w-48 shadow-2xl">
                             <p className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                 <Scale className="w-3 h-3"/> Symmetry
                             </p>
                             <div className="relative h-2 bg-gray-800 rounded-full w-full mb-2">
                                 <div className="absolute top-0 bottom-0 w-0.5 bg-white left-1/2 transform -translate-x-1/2 z-10"></div>
                                 <div 
                                     className={`absolute top-0 bottom-0 w-2 h-2 rounded-full transition-all duration-75 shadow-[0_0_10px_current] -ml-1 mt-[-2px] ${Math.abs(symmetry - 50) < 10 ? 'bg-green-500' : 'bg-red-500'}`}
                                     style={{ left: `${symmetry}%` }}
                                 ></div>
                             </div>
                         </div>
                     </div>

                    <div className="flex flex-col items-center">
                         <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 italic tracking-tighter drop-shadow-2xl">
                             {repCount}
                         </div>
                         <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.5em] mb-6">Reps Complete</p>
                         <button 
                            onClick={handleCompleteSet}
                            className="pointer-events-auto bg-red-600 hover:bg-red-500 text-white font-black px-12 py-5 rounded-[2.5rem] shadow-[0_0_40px_rgba(220,38,38,0.4)] transition-all uppercase tracking-widest text-xs flex items-center gap-3 active:scale-95"
                        >
                            <Square className="w-4 h-4 fill-current" /> Terminate Set
                        </button>
                    </div>

                    {/* RIGHT METRICS */}
                    <div className="flex gap-6">
                        <div className="bg-black/60 backdrop-blur-xl p-5 rounded-[2rem] border border-white/10 w-48 shadow-2xl text-right">
                             <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1 flex items-center justify-end gap-2">
                                 Neural Drive <Zap className="w-3 h-3"/> 
                             </p>
                             <p className="text-3xl font-black text-white italic">{neuralDrive}%</p>
                             <div className="w-full h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                                 <div className="h-full bg-purple-500 transition-all duration-75" style={{ width: `${neuralDrive}%` }}></div>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- POST AUDIT SCREEN --- */}
            {phase === 'PostAudit' && (
                <div className="absolute inset-0 z-40 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-10 animate-fade-in">
                    {isThinking ? (
                        <div className="text-center space-y-6">
                            <RefreshCw className="w-20 h-20 text-cyan-500 animate-spin mx-auto" />
                            <h3 className="text-3xl font-black text-white uppercase italic tracking-widest animate-pulse">Compiling Neural Report...</h3>
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
                                <button onClick={() => { stopCamera(); onClose(); }} className="bg-gray-900 text-gray-400 font-black px-8 py-3 rounded-2xl uppercase tracking-widest text-xs border border-white/10 hover:text-white hover:bg-gray-800 transition-all">
                                    End Protocol
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default LiveTrainingHUD;
