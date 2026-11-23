
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Card from '../common/Card';
import { 
    Activity, Wind, Zap, Mic, Square, RefreshCw, 
    Droplets, Cpu, BrainCircuit, TrendingUp, Volume2, MicOff,
    Timer, Play, Pause, Thermometer, Gauge, Flame, Scale, Infinity
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, YAxis, Tooltip } from 'recharts';
import { generateTextToSpeech, getComplexResponse } from '../../../lib/core_ai';
import { decode, decodeAudioData } from '../../audio';
import { useToast } from '../../hooks/useToast';
import { BotIcon } from '../icons/BotIcon';
import { useData } from '../../context/DataProvider';

// --- CELLULAR RESPIRATION VISUALIZER (Fitness Future Engine - Reactive) ---
const CellularVisualizer: React.FC<{ active: boolean; volume: number }> = ({ active, volume }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<any[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Initialize particles if empty
        if (particlesRef.current.length === 0) {
            for (let i = 0; i < 80; i++) {
                particlesRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    r: Math.random() * 2 + 1,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    life: Math.random(),
                    color: Math.random() > 0.5 ? '16, 185, 129' : '6, 182, 212' // Emerald or Cyan
                });
            }
        }

        let animationFrame: number;

        const render = () => {
            // Clear with trail effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const excitement = active ? 1 + (volume / 20) : 1; 

            particlesRef.current.forEach(p => {
                p.x += p.vx * excitement;
                p.y += p.vy * excitement;

                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * (excitement * 0.8), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color}, ${p.life})`;
                ctx.fill();
                
                // Connect particles if close
                particlesRef.current.forEach(p2 => {
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < 60 * excitement) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(${p.color}, ${0.1 * excitement})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                });
            });

            animationFrame = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(animationFrame);
    }, [active, volume]);

    return <canvas ref={canvasRef} width={600} height={600} className="w-full h-full absolute inset-0 z-0 opacity-60" />;
};

const MetabolicTracker: React.FC<{ memberId?: number }> = ({ memberId }) => {
    const { addToast } = useToast();
    const { members, connectedDevice, liveHealthData } = useData();
    
    // Find current member for BMR Calcs
    const member = members.find(m => m.id === memberId) || members[0]; 

    // --- MODE STATE ---
    const [mode, setMode] = useState<'RER_SCAN' | 'BOLT_TEST'>('RER_SCAN');
    
    // RER Scan State
    const [isScanning, setIsScanning] = useState(false);
    const [breathRate, setBreathRate] = useState(16);
    const [volumeLevel, setVolumeLevel] = useState(0); 
    
    // BOLT Test State
    const [boltState, setBoltState] = useState<'Idle' | 'Prepare' | 'Holding' | 'Result'>('Idle');
    const [boltTimer, setBoltTimer] = useState(0);
    const [boltScore, setBoltScore] = useState(0);

    // AI & System
    const [aiVerdict, setAiVerdict] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    // Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const rafRef = useRef<number | null>(null);

    // --- CALCULATIONS (Original Features Integration) ---
    const bmr = useMemo(() => {
        if (!member) return 1600;
        // Mifflin-St Jeor Equation
        const w = member.physical_metrics.weight || 70;
        const h = member.physical_metrics.height || 170;
        const a = member.bio_age || 25;
        // Assume Male (+5) for simplicity if gender not present, else -161
        return Math.round((10 * w) + (6.25 * h) - (5 * a) + 5);
    }, [member]);

    const tdee = useMemo(() => {
        // Use live active calories from wearable if present
        if (connectedDevice && liveHealthData.caloriesBurned > 500) {
            return Math.round(bmr + liveHealthData.caloriesBurned);
        }
        return Math.round(bmr * 1.55);
    }, [bmr, liveHealthData.caloriesBurned, connectedDevice]);

    const rerValue = useMemo(() => parseFloat((0.7 + (Math.max(0, breathRate - 10) / 100) * 1.5).toFixed(2)), [breathRate]);
    
    const fuelSplit = useMemo(() => {
        const fatP = Math.max(0, Math.min(100, ((1 - rerValue) / 0.3) * 100));
        return { fat: fatP, carbs: 100 - fatP };
    }, [rerValue]);

    // --- AUDIO / MIC ENGINE ---
    const startMic = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioCtx.createAnalyser();
            const microphone = audioCtx.createMediaStreamSource(stream);
            
            microphone.connect(analyser);
            analyser.fftSize = 256;
            
            audioContextRef.current = audioCtx;
            analyserRef.current = analyser;
            microphoneRef.current = microphone;
            
            setIsScanning(true);
            analyzeAudio(); 
            
            addToast("Cloud Node: Respiratory Sync Active.", "success");
            speak("Metabolic link established. Breathe normally into the sensor.");
        } catch (e) {
            addToast("Mic Access Denied.", "error");
        }
    };

    const stopMic = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (microphoneRef.current) microphoneRef.current.disconnect();
        if (audioContextRef.current) audioContextRef.current.close();
        setIsScanning(false);
        setVolumeLevel(0);
    };

    const analyzeAudio = () => {
        if (!analyserRef.current) return;
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const avg = sum / bufferLength;
        
        setVolumeLevel(avg); 

        if (avg > 30) { 
             setBreathRate(prev => Math.min(45, prev + 0.1));
        } else {
             setBreathRate(prev => Math.max(10, prev - 0.05));
        }

        rafRef.current = requestAnimationFrame(analyzeAudio);
    };

    // --- BOLT TEST ENGINE ---
    useEffect(() => {
        let interval: any;
        if (boltState === 'Holding') {
            interval = setInterval(() => {
                setBoltTimer(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [boltState]);

    const handleBoltAction = () => {
        if (boltState === 'Idle') {
            setBoltState('Prepare');
            speak("Exhale fully. Then tap Hold to begin.");
        } else if (boltState === 'Prepare') {
            setBoltState('Holding');
            setBoltTimer(0);
        } else if (boltState === 'Holding') {
            setBoltState('Result');
            setBoltScore(boltTimer);
            speak(`Test complete. Score: ${boltTimer} seconds.`);
        } else {
            setBoltState('Idle');
            setBoltTimer(0);
        }
    };

    const speak = async (text: string) => {
        if (isMuted) return;
        try {
            const audioData = await generateTextToSpeech(text);
            if (audioData) {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1); 
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start();
            }
        } catch (e) { console.error(e); }
    };

    const handleAudit = async () => {
        setIsAnalyzing(true);
        setAiVerdict(null);

        try {
            const context = mode === 'RER_SCAN' 
                ? { breathRate: Math.round(breathRate), rerValue, type: 'RER Analysis', bmr, tdee, device: connectedDevice?.name }
                : { boltScore, type: 'CO2 Tolerance (BOLT)', bmr, tdee, device: connectedDevice?.name };

            const prompt = `
                ACT AS "MITOCHONDRIA AI" (FITNESS FUTURE FitnessFutureMatrix).
                ANALYZE: ${JSON.stringify(context)}.
                
                PROVIDE A METABOLIC AUDIT IN STRICT JSON FORMAT:
                {
                    "verdict": "2-sentence elite performance analysis.",
                    "fuel_source": "Fat Adapted" or "Glycolytic" or "Metabolic Flexible" or "CO2 Tolerant",
                    "recovery_hack": "1 specific bio-hack (e.g. 'Sodium Bicarb Loading', 'Box Breathing')"
                }
            `;

            const res = await getComplexResponse(prompt);
            const cleanJson = res.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            
            setAiVerdict(parsed);
            
            addToast("Bio-Logic Report Ready.", "success");
            if (parsed?.verdict) speak(parsed.verdict);

        } catch (e) {
            console.error(e);
            addToast("Audit Interrupted. Smart Link Unstable.", "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-24">
            {/* Sovereign Header */}
            <div className="bg-[#020308] p-10 rounded-[4rem] border border-green-500/30 relative overflow-hidden shadow-[0_0_120px_rgba(34,197,94,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="px-5 py-2 bg-green-600 text-white rounded-full flex items-center gap-3 shadow-[0_0_30px_rgba(34,197,94,0.5)] border border-green-400">
                                <Infinity className="w-5 h-5 animate-spin-slow" />
                                <span className="text-xs font-black uppercase tracking-[0.2em]">Mitochondrial Core Fitness Future</span>
                            </div>
                            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">STATUS: {mode}</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                            Metabolic <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Metrix</span>
                        </h1>
                    </div>
                    
                    <div className="flex gap-2 bg-gray-900/60 p-2 rounded-3xl border border-white/10 backdrop-blur-md">
                        <button onClick={() => setMode('RER_SCAN')} className={`relative px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all group overflow-hidden ${mode === 'RER_SCAN' ? 'bg-gradient-to-r from-green-900/40 to-green-800/40 backdrop-blur-xl border border-dashed border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-transparent border border-transparent text-gray-500 hover:text-white hover:border-gray-600/50 hover:bg-gray-800/40'}`}>
                            <div className={`absolute inset-0 bg-white/5 translate-y-full transition-transform duration-300 ease-in-out ${mode !== 'RER_SCAN' ? 'group-hover:translate-y-0' : ''}`}></div>
                            <span className="relative z-10">Fuel Scanner</span>
                        </button>
                        <button onClick={() => setMode('BOLT_TEST')} className={`relative px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all group overflow-hidden ${mode === 'BOLT_TEST' ? 'bg-gradient-to-r from-cyan-900/40 to-cyan-800/40 backdrop-blur-xl border border-dashed border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-transparent border border-transparent text-gray-500 hover:text-white hover:border-gray-600/50 hover:bg-gray-800/40'}`}>
                            <div className={`absolute inset-0 bg-white/5 translate-y-full transition-transform duration-300 ease-in-out ${mode !== 'BOLT_TEST' ? 'group-hover:translate-y-0' : ''}`}></div>
                            <span className="relative z-10">CO2 Tolerance</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 1. BIO-REACTOR VIEWPORT */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <Card className="bg-black border-white/5 flex-grow relative overflow-hidden flex flex-col items-center justify-center p-0 min-h-[600px] rounded-[4rem] shadow-2xl">
                         
                         <CellularVisualizer active={isScanning || boltState === 'Holding'} volume={volumeLevel} />

                         {mode === 'RER_SCAN' && (
                             <div className="relative z-10 w-full flex flex-col items-center">
                                 {!isScanning ? (
                                     <div className="text-center space-y-8 animate-fade-in">
                                         <div className="w-40 h-40 bg-gray-900 rounded-full flex items-center justify-center mx-auto border-4 border-gray-800 shadow-2xl relative group cursor-pointer hover:border-green-500 transition-colors" onClick={startMic}>
                                             <Activity className="w-16 h-16 text-gray-700 group-hover:text-green-500 transition-colors" />
                                         </div>
                                         <div>
                                            <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">Initialize Link</h3>
                                            <p className="text-gray-500 font-mono text-xs mt-2 uppercase tracking-widest">Mic Input Required</p>
                                         </div>
                                     </div>
                                 ) : (
                                     <div className="text-center w-full px-12 animate-fade-in">
                                         <div className="relative w-72 h-72 mx-auto mb-8 flex items-center justify-center">
                                             {/* Radial Gauge */}
                                             <svg className="w-full h-full transform -rotate-90">
                                                 <circle cx="144" cy="144" r="130" stroke="#111" strokeWidth="15" fill="none" />
                                                 <circle 
                                                    cx="144" cy="144" r="130" 
                                                    stroke={fuelSplit.fat > 50 ? '#22c55e' : '#f59e0b'} 
                                                    strokeWidth="15" fill="none" 
                                                    strokeDasharray="816" 
                                                    strokeDashoffset={816 - (816 * (Math.min(45, Math.max(10, breathRate)) / 50))} 
                                                    strokeLinecap="round" 
                                                    className="transition-all duration-300" 
                                                />
                                             </svg>
                                             <div className="absolute flex flex-col items-center">
                                                 <span className="text-8xl font-black text-white italic tracking-tighter tabular-nums">{Math.round(breathRate)}</span>
                                                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">RESP / MIN</span>
                                             </div>
                                         </div>
                                         <button onClick={stopMic} className="relative bg-gradient-to-r from-red-900/40 to-red-800/40 hover:from-red-800/60 hover:to-red-700/60 backdrop-blur-xl text-red-500 border border-dashed border-red-500/50 hover:border-red-400 font-black px-10 py-4 rounded-2xl uppercase tracking-widest text-[10px] hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] group overflow-hidden">
                                             <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                             <div className="relative z-10 flex items-center gap-2">
                                                <Square className="w-4 h-4 group-hover:scale-110 transition-transform duration-500" /> 
                                                <span>Stop Sync</span>
                                             </div>
                                         </button>
                                     </div>
                                 )}
                             </div>
                         )}

                         {mode === 'BOLT_TEST' && (
                             <div className="relative z-10 text-center animate-fade-in w-full max-w-md">
                                 <div className={`w-48 h-48 mx-auto rounded-full border-8 flex items-center justify-center mb-8 shadow-2xl transition-all duration-500 ${boltState === 'Holding' ? 'border-cyan-500 bg-cyan-900/20 scale-110' : 'border-gray-800 bg-black'}`}>
                                     {boltState === 'Result' ? (
                                         <div>
                                             <span className="text-6xl font-black text-white">{boltScore}</span>
                                             <p className="text-xs font-bold text-gray-500 uppercase">Seconds</p>
                                         </div>
                                     ) : (
                                        <Timer className={`w-20 h-20 ${boltState === 'Holding' ? 'text-cyan-400 animate-pulse' : 'text-gray-600'}`} />
                                     )}
                                 </div>
                                 <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-2">
                                     {boltState === 'Idle' ? 'CO2 Tolerance Test' : boltState === 'Prepare' ? 'Exhale Fully...' : boltState === 'Holding' ? 'HOLD BREATH' : 'Test Complete'}
                                 </h3>
                                 <button 
                                    onClick={handleBoltAction}
                                    className={`relative w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 group overflow-hidden ${boltState === 'Holding' ? 'bg-gradient-to-r from-red-900/40 to-red-800/40 hover:from-red-800/60 hover:to-red-700/60 backdrop-blur-xl border border-dashed border-red-500/50 hover:border-red-400 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-gradient-to-r from-cyan-900/40 to-cyan-800/40 hover:from-cyan-800/60 hover:to-cyan-700/60 backdrop-blur-xl border border-dashed border-cyan-500/50 hover:border-cyan-400 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]'}`}
                                 >
                                     <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                     <span className="relative z-10">{boltState === 'Idle' ? 'Start Protocol' : boltState === 'Prepare' ? 'I Have Exhaled' : boltState === 'Holding' ? 'Stop Timer' : 'Reset'}</span>
                                 </button>
                             </div>
                         )}

                         <div className="absolute bottom-0 w-full p-6 bg-black/80 border-t border-white/5 flex justify-between items-center backdrop-blur-3xl">
                             <div className="flex items-center gap-6">
                                 <span className="text-[10px] font-mono text-gray-500 flex items-center gap-2"><Cpu className="w-4 h-4"/> KRNL: FitnessFuture_STABLE</span>
                                 <div className="h-4 w-px bg-white/10"></div>
                                 <span className={`text-[10px] font-mono flex items-center gap-2 ${connectedDevice ? 'text-green-500 animate-pulse' : 'text-gray-600'}`}>
                                    <TrendingUp className="w-4 h-4"/> {connectedDevice ? `${connectedDevice.name} LINKED` : 'SENSOR_OFFLINE'}
                                 </span>
                             </div>
                             <button onClick={() => setIsMuted(!isMuted)} className={`relative p-2 rounded-lg backdrop-blur-xl border border-dashed transition-all group overflow-hidden ${isMuted ? 'bg-gradient-to-r from-red-900/40 to-red-800/40 hover:from-red-800/60 hover:to-red-700/60 text-red-500 border-red-500/50 hover:border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-gradient-to-r from-gray-900/40 to-gray-800/40 hover:from-gray-800/60 hover:to-gray-700/60 text-gray-500 hover:text-white border-white/10 hover:border-white/30 shadow-[0_0_10px_rgba(0,0,0,0.5)]'}`}>
                                 <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                 <div className="relative z-10 group-hover:scale-110 transition-transform duration-500">
                                     {isMuted ? <MicOff className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>}
                                 </div>
                             </button>
                         </div>
                    </Card>
                </div>

                {/* 2. DATA MATRIX & AI */}
                <div className="lg:col-span-4 space-y-6">
                    {/* BMR/TDEE CARD */}
                    <Card title="Base Metabolic Matrix" className="bg-gray-950 border-white/5 p-8 rounded-[3rem]">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Flame className="w-5 h-5 text-orange-500" />
                                    <span className="text-xs font-bold text-gray-300">BMR (Rest)</span>
                                </div>
                                <span className="text-xl font-black text-white italic">{bmr}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Activity className="w-5 h-5 text-green-500" />
                                    <span className="text-xs font-bold text-gray-300">TDEE (Active)</span>
                                </div>
                                <span className="text-xl font-black text-white italic">{tdee}</span>
                            </div>
                        </div>
                    </Card>

                    {mode === 'RER_SCAN' ? (
                        <Card title="Fuel Matrix" className="bg-gray-950 border-white/5 p-8 rounded-[3rem]">
                             <div className="space-y-8">
                                 <div>
                                     <div className="flex justify-between items-center mb-2">
                                         <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Fat Oxidation</span>
                                         <span className="text-xs font-bold text-green-400">{fuelSplit.fat.toFixed(0)}%</span>
                                     </div>
                                     <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden border border-white/5">
                                         <div className="h-full bg-green-500 shadow-[0_0_10px_#22c55e]" style={{ width: `${fuelSplit.fat}%` }}></div>
                                     </div>
                                 </div>
                                 <div className="bg-gray-900/50 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                                     <span className="text-[10px] font-bold text-gray-400 uppercase">RER Index</span>
                                     <span className="text-2xl font-black text-white">{rerValue}</span>
                                 </div>
                             </div>
                        </Card>
                    ) : (
                        <Card title="BOLT Benchmarks" className="bg-gray-950 border-white/5 p-8 rounded-[3rem]">
                             <div className="space-y-4">
                                 <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                     <span className="text-xs text-gray-400">Elite</span>
                                     <span className="text-green-400 font-bold">&gt; 40s</span>
                                 </div>
                                 <div className="mt-4 p-4 bg-gray-900 rounded-2xl border border-white/5 text-[10px] text-gray-500 italic leading-relaxed">
                                     "Low BOLT scores indicate poor CO2 tolerance, leading to breathlessness during exercise."
                                 </div>
                             </div>
                        </Card>
                    )}

                    <Card title="Sovereign AI Audit" className="bg-[#05050a] border-green-500/20 p-8 rounded-[3rem] relative overflow-hidden flex-1 flex flex-col min-h-[350px]">
                        <div className="absolute top-0 right-0 p-6 opacity-5"><BrainCircuit className="w-24 h-24 text-green-400" /></div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {isAnalyzing ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-4 py-10 animate-pulse">
                                    <BotIcon className="w-12 h-12 text-green-400" />
                                    <p className="text-[10px] font-black text-green-400 uppercase tracking-[0.5em]">De-Coding Biology...</p>
                                </div>
                            ) : aiVerdict ? (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <h4 className="text-xl font-black text-white italic uppercase tracking-tight mb-1">{aiVerdict.verdict}</h4>
                                        <span className="text-[10px] bg-green-900/20 text-green-400 border border-green-500/30 px-3 py-0.5 rounded-full font-bold uppercase tracking-widest">{aiVerdict.fuel_source || 'Metabolic Analysis'}</span>
                                    </div>
                                    <div className="p-4 bg-indigo-900/10 border border-indigo-500/30 rounded-2xl">
                                        <p className="text-[9px] text-indigo-400 font-bold uppercase mb-2 flex items-center gap-2"><Zap className="w-3 h-3"/> Bio-Hack</p>
                                        <p className="text-xs text-indigo-100 italic">"{aiVerdict.recovery_hack}"</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-40">
                                    <p className="text-xs font-mono uppercase tracking-widest text-gray-500">Awaiting Data Stream...</p>
                                </div>
                            )}
                        </div>

                        {((mode === 'RER_SCAN' && breathRate > 0) || (mode === 'BOLT_TEST' && boltScore > 0)) && !isAnalyzing && (
                            <button onClick={handleAudit} className="relative w-full bg-gradient-to-r from-gray-900/40 to-gray-800/40 hover:from-gray-800/60 hover:to-gray-700/60 backdrop-blur-xl border border-dashed border-white/10 hover:border-white/30 text-white font-black py-4 rounded-2xl mt-6 uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] group overflow-hidden">
                                <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                <BotIcon className="w-4 h-4 relative z-10 group-hover:scale-110 transition-transform duration-500"/> 
                                <span className="relative z-10">Run Metabolic Audit</span>
                            </button>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MetabolicTracker;
