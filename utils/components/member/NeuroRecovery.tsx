
import React, { useState, useEffect, useRef } from 'react';
import Card from '../common/Card';
import { 
    Play, Pause, Wind, Thermometer, Lightbulb, Settings, 
    Volume2, Radio, Zap, Activity, Waves, X, 
    Moon, Sun, Headphones, BrainCircuit, CheckCircle,
    RefreshCw, ShieldCheck, Infinity, Signal, Speaker,
    Fan, Disc, Power
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { getComplexResponse, generateTextToSpeech, generateNeuroProtocol } from '../../../lib/gemini';
import { decode, decodeAudioData } from '../../audio';
import { BotIcon } from '../icons/BotIcon';
import { useData } from '../../context/DataProvider';

interface TherapyMode {
    id: string;
    name: string;
    wave: string;
    freqLeft: number;
    freqRight: number;
    colorFrom: string;
    colorTo: string;
    description: string;
    icon: React.ReactNode;
    mantra?: string;
    isoPulse?: number; // Isochronic Pulse Rate (Hz)
}

const MODES: TherapyMode[] = [
    { 
        id: 'deep_repair', 
        name: 'Deep Tissue Repair', 
        wave: 'Delta (2Hz)', 
        freqLeft: 100, 
        freqRight: 102, 
        isoPulse: 2,
        colorFrom: '#020617', 
        colorTo: '#1e3a8a',   
        description: 'Slowest waves for deep sleep and HGH release.',
        icon: <Moon className="w-5 h-5 text-blue-400" />,
        mantra: "Every cell in my body is healing. My strength returns deeper than before. I am whole."
    },
    { 
        id: 'cns_reset', 
        name: 'CNS System Reset', 
        wave: 'Theta (6Hz)', 
        freqLeft: 200, 
        freqRight: 206, 
        isoPulse: 6,
        colorFrom: '#312e81', 
        colorTo: '#581c87',   
        description: 'Reduces cortisol. Best for post-heavy lifting.',
        icon: <Wind className="w-5 h-5 text-purple-400" />,
        mantra: "I am releasing the burden of effort. My mind is drifting into complete safety. I am calm."
    },
    { 
        id: 'focus_flow', 
        name: 'Zen Focus', 
        wave: 'Alpha (10Hz)', 
        freqLeft: 300, 
        freqRight: 310, 
        isoPulse: 10,
        colorFrom: '#451a03', 
        colorTo: '#b45309',   
        description: 'Calm alertness. Ideal for Yoga and Flow zones.',
        icon: <Sun className="w-5 h-5 text-amber-400" />,
        mantra: "Focus is sharp. Movement is fluid. We are in flow."
    },
    { 
        id: 'power_surge', 
        name: 'Gamma Overdrive', 
        wave: 'Gamma (40Hz)', 
        freqLeft: 400, 
        freqRight: 440, 
        isoPulse: 40,
        colorFrom: '#7f1d1d', 
        colorTo: '#ef4444',   
        description: 'Peak mental state. High intensity output.',
        icon: <Zap className="w-5 h-5 text-red-500" />,
        mantra: "Power is limitless. Energy is boundless. Dominate the lift."
    }
];

const SonicFrequencyTuner: React.FC = () => {
    const { addToast } = useToast();
    const { liveHealthData, addRoutineLog, members } = useData();
    
    // Member context
    const memberId = members[0]?.id;

    // State
    const [activeMode, setActiveMode] = useState<TherapyMode>(MODES[1]); 
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [isIsochronic, setIsIsochronic] = useState(false); 
    const [bioSync, setBioSync] = useState(false); 
    const [timer, setTimer] = useState(900); 
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
    const [userStateInput, setUserStateInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    // IoT Simulation State
    const [activeColor, setActiveColor] = useState('#581c87'); // Chromatherapy
    const [oxygenLevel, setOxygenLevel] = useState(21); // 21% is normal
    const [hapticIntensity, setHapticIntensity] = useState(0); // 0-3
    const [podTemp, setPodTemp] = useState(22.0);

    // Audio Context Refs
    const audioCtxRef = useRef<AudioContext | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);
    const isoGainRef = useRef<GainNode | null>(null);
    const lfoRef = useRef<OscillatorNode | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number>(0);
    const pulseRef = useRef<HTMLDivElement>(null);

    // --- BIO-SYNC AUTO-ADJUSTMENT ---
    useEffect(() => {
        if (bioSync && liveHealthData.heartRate.hrv) {
            const hrv = liveHealthData.heartRate.hrv;
            // If HRV is low (<50 indicates stress), switch to Deep Repair
            if (hrv < 50 && activeMode.id !== 'deep_repair') {
                setActiveMode(MODES[0]);
                addToast("Bio-Sync: High Stress Detected. Switching to Delta Waves.", "info");
            } 
            // If HRV is optimal (>70), switch to Alpha for focus
            else if (hrv > 70 && activeMode.id !== 'focus_flow') {
                setActiveMode(MODES[2]);
                addToast("Bio-Sync: Recovery Optimal. Switching to Alpha Waves.", "success");
            }
        }
    }, [bioSync, liveHealthData.heartRate.hrv]);

    // Update active color when mode changes
    useEffect(() => {
        setActiveColor(activeMode.colorTo);
    }, [activeMode]);

    const initAudio = async () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioCtxRef.current = ctx;

            // Master Output
            const masterGain = ctx.createGain();
            masterGain.gain.value = volume;
            masterGain.connect(ctx.destination);
            masterGainRef.current = masterGain;

            // Analyser for Visuals
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 2048;
            masterGain.connect(analyser); // Connect master to analyser
            analyserRef.current = analyser;

            // Helper for Panner (Safari compatibility)
            const createPanner = (panValue: number) => {
                if (ctx.createStereoPanner) {
                    const panner = ctx.createStereoPanner();
                    panner.pan.value = panValue;
                    return panner;
                } else {
                    const panner = ctx.createPanner();
                    panner.panningModel = 'equalpower';
                    panner.setPosition(panValue, 0, 1 - Math.abs(panValue));
                    return panner;
                }
            };

            // --- 1. BINAURAL BEATS ENGINE ---
            const oscL = ctx.createOscillator();
            const pL = createPanner(-1);
            oscL.frequency.value = activeMode.freqLeft;
            oscL.connect(pL);
            
            const oscR = ctx.createOscillator();
            const pR = createPanner(1);
            oscR.frequency.value = activeMode.freqRight;
            oscR.connect(pR);

            // --- 2. ISOCHRONIC MODULATOR ---
            const isoGain = ctx.createGain();
            isoGain.gain.value = 1;
            isoGainRef.current = isoGain;
            
            // Route Oscillators -> IsoGain -> MasterGain
            pL.connect(isoGain);
            pR.connect(isoGain);
            isoGain.connect(masterGain);

            if (isIsochronic && activeMode.isoPulse) {
                const lfo = ctx.createOscillator();
                lfo.type = 'square'; // Sharp pulse
                lfo.frequency.value = activeMode.isoPulse;
                const lfoGain = ctx.createGain();
                lfoGain.gain.value = 1; // Modulation depth
                lfo.connect(lfoGain);
                lfoGain.connect(isoGain.gain); // Modulate volume
                lfo.start();
                lfoRef.current = lfo;
            }

            oscL.start(); 
            oscR.start();

            // --- 3. SUBLIMINAL MANTRA LAYER ---
            if (activeMode.mantra) {
                try {
                    const audioBase64 = await generateTextToSpeech(activeMode.mantra);
                    if (audioBase64) {
                        const buffer = await decodeAudioData(decode(audioBase64), ctx, 24000, 1);
                        const source = ctx.createBufferSource();
                        source.buffer = buffer;
                        source.loop = true;
                        
                        const whisperGain = ctx.createGain();
                        whisperGain.gain.value = 0.15; // Low volume for subliminal effect
                        
                        // Low pass filter to make it sound "internal"
                        const lowPass = ctx.createBiquadFilter();
                        lowPass.type = 'lowpass';
                        lowPass.frequency.value = 600;

                        source.connect(lowPass);
                        lowPass.connect(whisperGain);
                        whisperGain.connect(masterGain);
                        source.start();
                    }
                } catch (speechErr) {
                    console.warn("TTS generation failed, continuing without mantra layer.", speechErr);
                }
            }
            
            setIsPlaying(true);
        } catch (e) {
            console.error(e);
            setIsPlaying(false);
            addToast("Audio Hardware Error. Please try another browser.", "error");
        }
    };

    const stopAudio = () => {
        if (audioCtxRef.current) audioCtxRef.current.close();
        audioCtxRef.current = null;
        
        // Log Session
        if (memberId) {
            addRoutineLog({
                log_id: `NEURO_${Date.now()}`,
                member_id: memberId,
                task_type: 'Bio-Hack',
                task_desc: `${activeMode.name} Session (15m)`,
                task_time: new Date().toLocaleTimeString(),
                is_done: true
            });
        }
    };

    const toggleSession = () => {
        if (isPlaying) {
            stopAudio();
            setIsPlaying(false);
            setIsFullScreen(false);
            cancelAnimationFrame(animationFrameRef.current);
        } else {
            addToast("Sovereign Link: Audio Context Armed.", "info");
            initAudio();
            setIsPlaying(true);
            setIsFullScreen(true);
        }
    };

    // Breathing Logic (4-4-4-4)
    useEffect(() => {
        if (!isPlaying) return;
        let t = 0;
        const interval = setInterval(() => {
            t++;
            const cycle = t % 12;
            if (cycle < 4) setBreathPhase('Inhale');
            else if (cycle < 8) setBreathPhase('Hold');
            else setBreathPhase('Exhale');
            setTimer(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [isPlaying]);

    // Volume Control Live Update
    useEffect(() => {
        if (masterGainRef.current) masterGainRef.current.gain.value = volume;
    }, [volume]);

    // Restart audio if mode changes while playing
    useEffect(() => {
        if (isPlaying) {
            stopAudio();
            setTimeout(initAudio, 100);
        }
    }, [activeMode, isIsochronic]);

    // --- VISUALIZER LOOP ---
    useEffect(() => {
        if (!isPlaying || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const render = () => {
            animationFrameRef.current = requestAnimationFrame(render);
            if (!analyserRef.current) return;

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserRef.current.getByteFrequencyData(dataArray); // Frequency data for mandala

            const w = canvasRef.current!.width;
            const h = canvasRef.current!.height;
            const cx = w / 2;
            const cy = h / 2;
            const radius = Math.min(w, h) / 3;

            // Dynamic Background based on audio energy
            const energy = dataArray[10] / 255;
            ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + energy * 0.1})`; // Trails effect
            ctx.fillRect(0, 0, w, h);

            // Draw Radial Visualizer
            ctx.lineWidth = 2;
            ctx.strokeStyle = activeColor; // Use active IoT color
            
            const bars = 120; // Smoother
            const step = (Math.PI * 2) / bars;

            for (let i = 0; i < bars; i++) {
                const val = dataArray[i * 2] / 255.0;
                const barH = val * radius * 0.8;
                const angle = i * step;
                
                // Draw mirrored lines for symmetry
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                
                // Outer point
                const x = cx + Math.cos(angle) * (radius + barH);
                const y = cy + Math.sin(angle) * (radius + barH);
                
                // Inner point (create a ring effect)
                const xInner = cx + Math.cos(angle) * (radius * 0.5);
                const yInner = cy + Math.sin(angle) * (radius * 0.5);

                ctx.moveTo(xInner, yInner);
                ctx.lineTo(x, y);
                ctx.stroke();
            }

            // Center Pulse
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 0.9 + (energy * 20), 0, Math.PI * 2);
            ctx.fillStyle = `${activeColor}44`; // Semi-transparent fill
            ctx.fill();

            // VISUAL ENTRAINMENT (Strobe Effect)
            if (isIsochronic && activeMode.isoPulse && pulseRef.current) {
                // Calculate strobe based on time to match Hz
                const now = Date.now() / 1000;
                // Simple square wave opacity
                const strobe = Math.sin(now * activeMode.isoPulse * Math.PI * 2) > 0 ? 0.1 : 0;
                pulseRef.current.style.opacity = strobe.toString();
            }
        };
        render();
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [isPlaying, activeMode, isIsochronic, activeColor]);

    // AI Generator
    const handleGenerateCustom = async () => {
        if (!userStateInput.trim()) return;
        setIsThinking(true);
        try {
            const jsonStr = await generateNeuroProtocol(userStateInput);
            const data = JSON.parse(jsonStr.replace(/```json|```/g, '').trim());
            const customMode: TherapyMode = {
                id: `ai_${Date.now()}`,
                name: data.name || "Custom Neuro",
                wave: data.wave || "Alpha",
                freqLeft: data.freqLeft || 300,
                freqRight: data.freqRight || 310,
                colorFrom: data.colorFrom || "#000",
                colorTo: data.colorTo || "#fff",
                description: data.description || "AI Generated Protocol",
                icon: <Zap className="w-5 h-5 text-indigo-400" />,
                mantra: data.mantra,
                isoPulse: data.isoPulse || 4 
            };
            setActiveMode(customMode);
            setActiveColor(data.colorTo || '#fff');
            addToast("Neural Architect: Protocol Generated.", "success");
        } catch (e) {
            addToast("Logic Drift Detected. Using defaults.", "error");
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            {isFullScreen && (
                <div 
                    className="fixed inset-0 z-[300] flex flex-col items-center justify-center transition-all duration-[4000ms] ease-in-out overflow-hidden"
                    style={{ background: `linear-gradient(to bottom right, ${activeMode.colorFrom}, ${activeMode.colorTo})` }}
                >
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl"></div>
                    
                    {/* Visual Entrainment Pulse Layer */}
                    <div ref={pulseRef} className="absolute inset-0 bg-white pointer-events-none transition-opacity duration-75" style={{ opacity: 0 }}></div>

                    {/* Visualizer Background Layer */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-50 pointer-events-none">
                         <canvas ref={canvasRef} width={1200} height={1200} className="w-full h-full max-w-[1200px] max-h-[1200px]" />
                    </div>

                    <div className="relative z-10 text-center space-y-12">
                        <div className="animate-pulse">
                            <Headphones className="w-20 h-20 text-white/40 mx-auto mb-6" />
                            <h2 className="text-6xl font-black text-white uppercase italic tracking-widest">{activeMode.name}</h2>
                            <p className="text-white/60 font-mono mt-4 uppercase tracking-[0.5em]">{activeMode.wave}</p>
                        </div>
                        <div className="relative w-80 h-80 mx-auto flex items-center justify-center">
                            <div className={`absolute rounded-full border-4 border-white/20 transition-all duration-[4000ms] ease-in-out ${breathPhase === 'Inhale' ? 'w-full h-full opacity-60' : breathPhase === 'Hold' ? 'w-full h-full opacity-100' : 'w-20 h-20 opacity-20'}`}></div>
                            <div className="text-center">
                                <p className="text-4xl font-black text-white uppercase italic tracking-widest">{breathPhase}</p>
                                <p className="text-6xl font-mono text-white/40 mt-4">{Math.floor(timer/60)}:{(timer%60).toString().padStart(2,'0')}</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center gap-6 bg-black/40 px-10 py-4 rounded-full border border-white/10 backdrop-blur-md">
                                <Volume2 className="w-5 h-5 text-white/50" />
                                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-64 h-1 bg-white/20 rounded-full appearance-none accent-white cursor-pointer" />
                            </div>
                            
                            <button onClick={toggleSession} className="bg-white/10 hover:bg-white/20 text-white p-6 rounded-full border border-white/10 transition-all active:scale-95 group">
                                <X className="w-10 h-10 group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="lg:col-span-8">
                <Card className="bg-black/60 border-white/5 p-10 rounded-[3.5rem] relative overflow-hidden flex flex-col justify-center h-full shadow-2xl">
                    <div className="absolute top-0 right-0 p-10 opacity-5"><Waves className="w-64 h-64 text-indigo-400" /></div>
                    <div className="relative z-10 w-full max-w-xl mx-auto space-y-10">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-full bg-indigo-600/20 border-2 border-indigo-500/50 flex items-center justify-center">
                                {activeMode.icon}
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">{activeMode.name}</h3>
                                <div className="flex items-center gap-4 mt-2">
                                    <p className="text-indigo-400 font-mono text-sm tracking-widest">{activeMode.wave}</p>
                                    <label className="flex items-center gap-2 cursor-pointer bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                        <input type="checkbox" checked={isIsochronic} onChange={e => setIsIsochronic(e.target.checked)} className="accent-indigo-500" />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Isochronic Pulse</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <BotIcon className="w-6 h-6 text-amber-500" />
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Neural Architect v31.0</p>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                     <span className={`text-[10px] font-black uppercase tracking-widest ${bioSync ? 'text-green-400' : 'text-gray-600'}`}>Bio-Sync (HRV)</span>
                                     <input type="checkbox" checked={bioSync} onChange={e => setBioSync(e.target.checked)} className="accent-green-500" />
                                </label>
                            </div>
                            <div className="flex gap-2">
                                <input 
                                   type="text" 
                                   placeholder="How do you feel? (e.g. Brain Fog, Muscle Soreness)" 
                                   value={userStateInput}
                                   onChange={(e) => setUserStateInput(e.target.value)}
                                   onKeyPress={(e) => e.key === 'Enter' && handleGenerateCustom()}
                                   className="flex-1 bg-black border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-indigo-500"
                                />
                                <button 
                                   onClick={handleGenerateCustom}
                                   disabled={isThinking}
                                   className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-500 disabled:opacity-50 transition-all"
                                >
                                    {isThinking ? <RefreshCw className="animate-spin w-5 h-5"/> : <Zap className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-600 mt-4 italic leading-relaxed">"{activeMode.description}"</p>
                        </div>

                        <button 
                           onClick={toggleSession}
                           className="w-full bg-white text-black font-black py-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:bg-indigo-400 transition-all uppercase tracking-widest text-xs italic flex items-center justify-center gap-4"
                        >
                            <Headphones className="w-5 h-5" /> Initiate Recovery Sequence
                        </button>
                    </div>
                </Card>
            </div>

            {/* IoT Control Panel */}
            <div className="lg:col-span-4 space-y-6">
                <Card title="Pod IoT Terminal" className="bg-gray-950 border-white/5 p-8 rounded-[3rem]">
                    <div className="space-y-8">
                        <div className="p-6 bg-black rounded-3xl border border-white/5 relative overflow-hidden">
                             <div className="absolute inset-0 opacity-10 bg-indigo-500 animate-pulse"></div>
                             <div className="relative z-10">
                                 <div className="flex justify-between items-center mb-4">
                                     <div>
                                         <p className="text-[10px] text-gray-500 uppercase font-bold">Atmosphere</p>
                                         <p className="text-2xl font-black text-white italic">{podTemp.toFixed(1)}°C</p>
                                     </div>
                                     <Thermometer className="w-8 h-8 text-indigo-400" />
                                 </div>
                                 <input 
                                    type="range" min="16" max="30" step="0.5" 
                                    value={podTemp} onChange={(e) => setPodTemp(Number(e.target.value))}
                                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                             </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Lightbulb className="w-4 h-4"/> Chromatherapy
                            </p>
                            <div className="flex gap-4">
                                {['#312e81', '#581c87', '#b45309', '#064e3b', '#ef4444'].map(color => (
                                    <div 
                                        key={color} 
                                        onClick={() => setActiveColor(color)}
                                        className={`w-12 h-12 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform shadow-lg ${activeColor === color ? 'border-white ring-2 ring-indigo-500 ring-offset-2 ring-offset-black' : 'border-white/10'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5 space-y-6">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-300 flex items-center gap-2"><Wind className="w-4 h-4 text-cyan-400"/> Smart Oxygen</span>
                                    <span className="text-[10px] font-black text-cyan-500">{oxygenLevel}%</span>
                                </div>
                                <input 
                                    type="range" min="18" max="25" step="1" 
                                    value={oxygenLevel} onChange={(e) => setOxygenLevel(Number(e.target.value))}
                                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-300 flex items-center gap-2"><Disc className="w-4 h-4 text-purple-400"/> Haptics</span>
                                    <span className="text-[10px] font-black text-purple-500">{['OFF', 'LOW', 'MED', 'HIGH'][hapticIntensity]}</span>
                                </div>
                                <div className="flex gap-2">
                                    {[0, 1, 2, 3].map(lvl => (
                                        <button 
                                            key={lvl}
                                            onClick={() => setHapticIntensity(lvl)}
                                            className={`flex-1 h-8 rounded-lg transition-all ${hapticIntensity === lvl ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                                        ></button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="p-6 bg-indigo-900/10 border border-indigo-500/20 rounded-[2.5rem] flex items-start gap-4 shadow-xl">
                    <BrainCircuit className="w-10 h-10 text-indigo-400 animate-pulse shrink-0" />
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">CNS Insight</p>
                        <p className="text-gray-400 text-xs italic leading-relaxed">
                            "v31.0 Protocol utilizes Isochronic pulsing for faster entrainment. Combined with Bio-Sync, expect 20% faster sympathetic withdrawal."
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="lg:col-span-12 space-y-4">
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] pl-4">Standard Presets</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {MODES.map(mode => (
                        <div 
                            key={mode.id} 
                            onClick={() => !isPlaying && setActiveMode(mode)}
                            className={`p-6 rounded-3xl border cursor-pointer transition-all ${activeMode.id === mode.id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-gray-950 border-white/5 hover:border-white/10'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-black rounded-2xl">{mode.icon}</div>
                                <div>
                                    <p className="text-white font-bold">{mode.name}</p>
                                    <p className="text-[10px] text-gray-500 uppercase">{mode.wave} {mode.isoPulse ? `• ${mode.isoPulse}Hz Pulse` : ''}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const NeuroSyncHubWrapper: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in pb-24">
            <div className="bg-[#05050a] p-8 rounded-[3rem] border border-indigo-500/30 relative overflow-hidden shadow-[0_0_80px_rgba(79,70,229,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-5 py-2 bg-indigo-500 text-white rounded-full flex items-center gap-3 shadow-lg font-black uppercase tracking-[0.2em] text-[10px]">
                                <Infinity className="w-3 h-3 animate-spin-slow" /> Synaptic Core v31.0
                            </div>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-2">Cerebral Cortex Online</p>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                            Neuro <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Recovery</span>
                        </h1>
                    </div>
                </div>
            </div>
            <SonicFrequencyTuner />
        </div>
    );
};

export default NeuroSyncHubWrapper;
