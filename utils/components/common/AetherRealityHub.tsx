
import React, { useState, useEffect, useRef } from 'react';
import Card from './Card';
import { AetherIcon } from '../icons/AetherIcon';
import { 
    AlertTriangle, Crosshair, Ghost, Layers, User, Zap, 
    RefreshCcw, Activity, ScanLine, Scale, Eye, ShieldAlert, 
    Cpu, Move, Maximize2, Play, Grid, Trophy
} from 'lucide-react';

// --- TYPES ---
type ARMode = 'titan_vision' | 'ghost_competitor' | 'posing_room';

const AetherRealityHub: React.FC = () => {
    const [mode, setMode] = useState<ARMode>('titan_vision');

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="bg-black/90 p-8 rounded-[3rem] border border-purple-500/30 relative overflow-hidden shadow-[0_0_80px_rgba(168,85,247,0.15)]">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="absolute top-0 right-0 p-10 opacity-10 animate-spin-slow">
                    <AetherIcon className="w-64 h-64 text-purple-400" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none flex items-center gap-4">
                            Titan <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-500">Vision</span>
                        </h1>
                        <p className="text-purple-500/60 text-[10px] font-mono tracking-[0.6em] mt-3 uppercase italic leading-none font-bold">
                            Apex-Continuum v31.0 X-Ray Core
                        </p>
                    </div>

                    <div className="flex bg-gray-900/80 p-2 rounded-2xl border border-white/10 backdrop-blur-md overflow-x-auto no-scrollbar max-w-full">
                        {[
                            { id: 'titan_vision', label: 'Bio-Scan (X-Ray)', icon: <Layers className="w-4 h-4" /> },
                            { id: 'ghost_competitor', label: 'Ghost Race', icon: <Ghost className="w-4 h-4" /> },
                            { id: 'posing_room', label: 'Holo-Pose', icon: <User className="w-4 h-4" /> },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setMode(tab.id as ARMode)}
                                className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
                                    mode === tab.id 
                                    ? 'bg-purple-500 text-black shadow-[0_0_20px_rgba(168,85,247,0.5)]' 
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="min-h-[700px] relative">
                {mode === 'titan_vision' && <TitanVisionAR />}
                {mode === 'ghost_competitor' && <GhostCompetitorMode />}
                {mode === 'posing_room' && <VirtualPosingRoom />}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Titan Vision AR (X-Ray v31.0) ---
const TitanVisionAR: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameIdRef = useRef<number>(0);
    const [isScanning, setIsScanning] = useState(false);
    const [viewMode, setViewMode] = useState<'Thermal' | 'X-Ray' | 'Fiber'>('X-Ray');
    
    // Apex Stats
    const [activation, setActivation] = useState({ quads: 0, glutes: 0, chest: 0, shoulders: 0 });
    const [symmetry, setSymmetry] = useState(50); // 0 (Left) - 100 (Right)
    const [injuryRisk, setInjuryRisk] = useState<'Safe' | 'Warning' | 'Critical'>('Safe');
    const [jointStress, setJointStress] = useState({ knee: 0, shoulder: 0, spine: 0 });
    
    // Camera State
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: mode } 
            });
            if (videoRef.current) videoRef.current.srcObject = stream;
            setIsScanning(true);
        } catch(e) { console.error(e); }
    };

    const toggleCamera = () => {
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);
        if (isScanning) {
            setIsScanning(false);
            setTimeout(() => startCamera(newMode), 200);
        }
    };

    // Simulate Bio-Mechanics
    useEffect(() => {
        if(!isScanning) return;
        const interval = window.setInterval(() => {
            const time = Date.now() / 1000;
            // Dynamic load simulation
            setActivation({
                quads: Math.abs(Math.sin(time * 1.5)) * 100,
                glutes: Math.abs(Math.cos(time * 1.5)) * 100,
                chest: Math.abs(Math.sin(time * 2)) * 100,
                shoulders: Math.abs(Math.cos(time * 2.5)) * 100
            });
            
            // Joint Stress Simulation
            const kStress = Math.abs(Math.sin(time * 0.8)) * 100;
            setJointStress({
                knee: kStress,
                shoulder: Math.abs(Math.cos(time)) * 80,
                spine: Math.abs(Math.sin(time * 0.5)) * 60
            });

            if (kStress > 85) setInjuryRisk('Critical');
            else if (kStress > 60) setInjuryRisk('Warning');
            else setInjuryRisk('Safe');

            // Symmetry Drift
            const drift = Math.sin(time * 0.5) * 15;
            setSymmetry(50 + drift);
        }, 50);
        return () => window.clearInterval(interval);
    }, [isScanning]);

    // Draw Overlay Engine
    useEffect(() => {
        if(!isScanning || !canvasRef.current) return;

        const render = () => {
            const ctx = canvasRef.current?.getContext('2d');
            if(ctx && canvasRef.current) {
                const w = canvasRef.current.width;
                const h = canvasRef.current.height;
                ctx.clearRect(0,0,w,h);

                const cx = w/2;
                const cy = h/2;
                const scale = h / 900; // Responsive scaling

                // --- MODE 1: THERMAL HEATMAP ---
                if (viewMode === 'Thermal') {
                    const drawBlob = (x: number, y: number, intensity: number, colorBase: string) => {
                        const gradient = ctx.createRadialGradient(x, y, 10 * scale, x, y, 100 * scale);
                        const alpha = Math.min(1, intensity / 80); 
                        gradient.addColorStop(0, `rgba(${colorBase}, ${alpha})`); 
                        gradient.addColorStop(1, 'rgba(0,0,0,0)');
                        
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(x, y, 100 * scale, 0, Math.PI * 2);
                        ctx.fill();
                    };

                    drawBlob(cx, cy - 80 * scale, activation.chest, '255, 50, 50');
                    drawBlob(cx - 100 * scale, cy - 120 * scale, activation.shoulders, '255, 140, 0');
                    drawBlob(cx + 100 * scale, cy - 120 * scale, activation.shoulders, '255, 140, 0');
                    drawBlob(cx - 60 * scale, cy + 200 * scale, activation.quads, '255, 215, 0');
                    drawBlob(cx + 60 * scale, cy + 200 * scale, activation.quads, '255, 215, 0');
                    drawBlob(cx - 60 * scale, cy + 100 * scale, activation.glutes, '50, 205, 50');
                    drawBlob(cx + 60 * scale, cy + 100 * scale, activation.glutes, '50, 205, 50');
                }

                // --- MODE 2: X-RAY SKELETON ---
                if (viewMode === 'X-Ray' || viewMode === 'Fiber') {
                    const drawBone = (x1: number, y1: number, x2: number, y2: number, stress: number) => {
                        ctx.strokeStyle = stress > 80 ? '#ef4444' : stress > 50 ? '#f59e0b' : '#a855f7';
                        ctx.lineWidth = viewMode === 'Fiber' ? 2 * scale : 8 * scale;
                        ctx.lineCap = 'round';
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = ctx.strokeStyle;
                        
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                    };

                    // Simulated Spine
                    drawBone(cx, cy - 200 * scale, cx, cy + 50 * scale, jointStress.spine);
                    // Shoulders
                    drawBone(cx - 80 * scale, cy - 150 * scale, cx + 80 * scale, cy - 150 * scale, jointStress.shoulder);
                    // Legs
                    drawBone(cx - 40 * scale, cy + 50 * scale, cx - 60 * scale, cy + 300 * scale, jointStress.knee);
                    drawBone(cx + 40 * scale, cy + 50 * scale, cx + 60 * scale, cy + 300 * scale, jointStress.knee);
                    // Arms
                    drawBone(cx - 80 * scale, cy - 150 * scale, cx - 120 * scale, cy + 50 * scale, 20);
                    drawBone(cx + 80 * scale, cy - 150 * scale, cx + 120 * scale, cy + 50 * scale, 20);
                }

                // --- HUD ELEMENTS ---
                // Symmetry Bar
                const barW = 200 * scale;
                const barH = 10 * scale;
                ctx.fillStyle = '#1f2937';
                ctx.fillRect(cx - barW/2, h - 50 * scale, barW, barH);
                ctx.fillStyle = Math.abs(symmetry - 50) < 10 ? '#22c55e' : '#ef4444';
                const symX = cx - barW/2 + (symmetry / 100) * barW;
                ctx.fillRect(symX - 2, h - 55 * scale, 4, 20 * scale);

                // Grid
                ctx.strokeStyle = 'rgba(168, 85, 247, 0.15)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
                ctx.moveTo(0, cy); ctx.lineTo(w, cy);
                ctx.stroke();
                
                // Scanning Line
                const scanY = (Date.now() / 10) % h;
                ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
                ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(w, scanY); ctx.stroke();
            }
            frameIdRef.current = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(frameIdRef.current);
    }, [isScanning, viewMode, activation, jointStress, symmetry]);

    return (
        <Card className="h-[700px] p-0 overflow-hidden relative bg-black border-purple-500/30 shadow-2xl rounded-[3rem] flex flex-col">
            <div className="relative flex-grow">
                 <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60" />
                 <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" width={1280} height={720} />

                 {!isScanning && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20">
                         <div className="w-40 h-40 rounded-full border-4 border-dashed border-purple-500/30 flex items-center justify-center mb-8 animate-spin-slow">
                             <Layers className="w-16 h-16 text-purple-400" />
                         </div>
                         <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">Bio-Mechanical Uplink</h3>
                         <p className="text-gray-400 text-sm max-w-md text-center mb-10">
                             "Initializing X-Ray vision. Stand clear. System will map stress points and muscle activation in real-time."
                         </p>
                         <button onClick={() => startCamera()} className="bg-purple-600 hover:bg-purple-500 text-white font-black px-12 py-5 rounded-[2.5rem] shadow-[0_0_60px_rgba(168,85,247,0.6)] uppercase tracking-[0.2em] text-xs flex items-center gap-3 active:scale-95 transition-all">
                             <Eye className="w-5 h-5"/> Engage Optics
                         </button>
                     </div>
                 )}

                 {isScanning && (
                     <div className="absolute top-6 left-6 z-20 flex gap-4">
                         <div className="bg-black/60 backdrop-blur-xl p-2 rounded-2xl border border-white/10 flex gap-2">
                             {['X-Ray', 'Thermal', 'Fiber'].map(m => (
                                 <button 
                                    key={m} 
                                    onClick={() => setViewMode(m as any)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === m ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {m}
                                </button>
                             ))}
                         </div>
                         <button onClick={toggleCamera} className="p-3 bg-black/60 backdrop-blur-xl rounded-2xl text-purple-400 border border-purple-500/30 hover:bg-purple-900/20"><RefreshCcw className="w-5 h-5"/></button>
                     </div>
                 )}

                 {/* Warning Overlay */}
                 {injuryRisk === 'Critical' && isScanning && (
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-8 bg-red-900/90 border-4 border-red-500 rounded-[3rem] text-center backdrop-blur-xl animate-pulse z-30 shadow-[0_0_100px_rgba(220,38,38,0.8)]">
                         <ShieldAlert className="w-24 h-24 text-white mx-auto mb-4" />
                         <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Critical Load</h2>
                         <p className="text-red-200 font-mono text-xs uppercase tracking-[0.3em] mt-2">Joint Stress Exceeded</p>
                     </div>
                 )}
            </div>

            {/* Bottom Telemetry */}
            <div className="h-32 bg-[#0a0a0a] border-t border-white/10 flex items-center justify-between px-10 relative z-20">
                <div>
                     <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Active Strain</p>
                     <div className="flex items-center gap-2">
                         <Cpu className="w-4 h-4 text-purple-400" />
                         <p className="text-2xl font-black text-white italic">{(activation.quads + activation.chest) / 2}%</p>
                     </div>
                </div>
                <div className="flex-1 px-12">
                     <div className="flex justify-between text-[9px] font-black text-gray-500 uppercase mb-2">
                         <span>L-Side</span>
                         <span className={Math.abs(symmetry - 50) < 10 ? 'text-green-500' : 'text-red-500'}>Symmetry Lock</span>
                         <span>R-Side</span>
                     </div>
                     <div className="h-2 bg-gray-800 rounded-full w-full relative overflow-hidden">
                         <div className="absolute top-0 bottom-0 w-1 bg-white left-1/2 transform -translate-x-1/2 z-10"></div>
                         <div className={`absolute top-0 bottom-0 w-full bg-purple-500 transition-all duration-100 opacity-30`} style={{ left: `${symmetry - 50}%` }}></div>
                         <div className={`absolute top-0 bottom-0 w-2 h-2 rounded-full bg-white transition-all duration-100 shadow-[0_0_10px_white]`} style={{ left: `${symmetry}%` }}></div>
                     </div>
                </div>
                <div className="text-right">
                     <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Risk Profile</p>
                     <p className={`text-2xl font-black italic ${injuryRisk === 'Safe' ? 'text-green-400' : injuryRisk === 'Warning' ? 'text-amber-400' : 'text-red-500'}`}>{injuryRisk.toUpperCase()}</p>
                </div>
            </div>
        </Card>
    );
};

const GhostCompetitorMode: React.FC = () => {
    const [raceStatus, setRaceStatus] = useState<'Idle' | 'Racing' | 'Finished'>('Idle');
    const [userProgress, setUserProgress] = useState(0);
    const [ghostProgress, setGhostProgress] = useState(0);
    const [winner, setWinner] = useState<'You' | 'Ghost' | null>(null);

    const startRace = () => {
        setRaceStatus('Racing');
        setUserProgress(0);
        setGhostProgress(0);
        setWinner(null);
    };

    useEffect(() => {
        if (raceStatus !== 'Racing') return;
        
        const interval = setInterval(() => {
            setUserProgress(prev => {
                if (prev >= 100) return 100;
                // User has slight random advantage
                return Math.min(100, prev + Math.random() * 2);
            });
            setGhostProgress(prev => {
                if (prev >= 100) return 100;
                // Ghost is consistent
                return Math.min(100, prev + 1.2);
            });
        }, 100);

        return () => clearInterval(interval);
    }, [raceStatus]);

    useEffect(() => {
        if (userProgress >= 100 && ghostProgress < 100 && !winner) {
            setWinner('You');
            setRaceStatus('Finished');
        } else if (ghostProgress >= 100 && userProgress < 100 && !winner) {
            setWinner('Ghost');
            setRaceStatus('Finished');
        }
    }, [userProgress, ghostProgress, winner]);

    return (
        <Card className="flex flex-col items-center justify-center h-[700px] bg-black rounded-[3rem] border border-cyan-500/30 relative overflow-hidden shadow-2xl p-0">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#083344_0%,_#000_100%)] opacity-50"></div>
             
             <div className="relative z-10 w-full max-w-2xl p-8">
                 <div className="text-center mb-12">
                     <div className="w-32 h-32 bg-cyan-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-cyan-500/30 shadow-[0_0_60px_cyan]">
                         <Ghost className="w-16 h-16 text-cyan-400 animate-pulse" />
                     </div>
                     <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-2">Ghost Race Engine</h2>
                     <p className="text-cyan-200/60 font-mono text-xs tracking-[0.4em] uppercase">Beat Your Previous Best</p>
                 </div>

                 {raceStatus !== 'Idle' && (
                     <div className="space-y-8 bg-black/40 p-8 rounded-[2rem] border border-white/5 backdrop-blur-md">
                         <div>
                             <div className="flex justify-between text-xs font-black uppercase text-white mb-2">
                                 <span>You (Current)</span>
                                 <span>{Math.round(userProgress)}%</span>
                             </div>
                             <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-white/10">
                                 <div className="h-full bg-green-500 transition-all duration-100 shadow-[0_0_20px_#22c55e]" style={{ width: `${userProgress}%` }}></div>
                             </div>
                         </div>
                         <div>
                             <div className="flex justify-between text-xs font-black uppercase text-cyan-400 mb-2">
                                 <span>Ghost (PR)</span>
                                 <span>{Math.round(ghostProgress)}%</span>
                             </div>
                             <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-white/10">
                                 <div className="h-full bg-cyan-500 transition-all duration-100 shadow-[0_0_20px_#06b6d4]" style={{ width: `${ghostProgress}%` }}></div>
                             </div>
                         </div>
                     </div>
                 )}

                 {raceStatus === 'Finished' && (
                     <div className="mt-8 text-center animate-scale-in">
                         <Trophy className={`w-20 h-20 mx-auto mb-4 ${winner === 'You' ? 'text-yellow-400' : 'text-gray-600'}`} />
                         <h3 className="text-4xl font-black text-white uppercase italic">{winner === 'You' ? 'NEW RECORD SET!' : 'GHOST WINS'}</h3>
                     </div>
                 )}

                 {raceStatus !== 'Racing' && (
                     <button onClick={startRace} className="w-full mt-10 bg-white text-black font-black px-8 py-5 rounded-[2rem] uppercase tracking-widest text-xs hover:bg-cyan-400 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3">
                         {raceStatus === 'Finished' ? 'REMATCH' : 'INITIATE RACE'} <Play className="w-5 h-5 fill-current"/>
                     </button>
                 )}
             </div>
        </Card>
    );
};

const VirtualPosingRoom: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [cameraActive, setCameraActive] = useState(false);
    
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
            setCameraActive(true);
        } catch(e) { console.error(e); }
    };

    return (
         <Card className="h-[700px] bg-black rounded-[3rem] border border-purple-500/30 relative overflow-hidden p-0 shadow-2xl flex flex-col">
             <div className="relative flex-grow bg-[#050505] flex items-center justify-center">
                 {cameraActive ? (
                     <div className="relative w-full h-full">
                         <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                         {/* Symmetry Grid Overlay */}
                         <div className="absolute inset-0 pointer-events-none opacity-30">
                             <div className="w-full h-full border-2 border-purple-500/50 flex flex-col">
                                 <div className="flex-1 border-b border-purple-500/30 flex">
                                     <div className="flex-1 border-r border-purple-500/30"></div>
                                     <div className="flex-1 border-r border-purple-500/30"></div>
                                 </div>
                                 <div className="flex-1 border-b border-purple-500/30 flex">
                                     <div className="flex-1 border-r border-purple-500/30"></div>
                                     <div className="flex-1 border-r border-purple-500/30"></div>
                                 </div>
                                 <div className="flex-1 flex">
                                     <div className="flex-1 border-r border-purple-500/30"></div>
                                     <div className="flex-1 border-r border-purple-500/30"></div>
                                 </div>
                             </div>
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[600px] border-2 border-dashed border-purple-400 rounded-[50%]"></div>
                             <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-purple-500"></div>
                         </div>
                         <div className="absolute top-4 left-4 bg-purple-900/80 backdrop-blur px-4 py-2 rounded-xl border border-purple-500/50 text-purple-200 text-xs font-mono">
                             GOLDEN_RATIO_GRID: ACTIVE
                         </div>
                     </div>
                 ) : (
                     <div className="text-center p-10 z-10">
                         <div className="w-32 h-32 bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-purple-500/30 shadow-[0_0_60px_purple] animate-pulse">
                             <User className="w-16 h-16 text-purple-400" />
                         </div>
                         <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">Holo-Pose Studio</h2>
                         <p className="text-gray-400 text-sm max-w-md mx-auto mb-8">
                             Activate the symmetry grid to perfect your mandatories. AI alignment guides included.
                         </p>
                         <button onClick={startCamera} className="bg-purple-600 text-white font-black px-10 py-5 rounded-[2.5rem] uppercase tracking-widest text-xs hover:bg-purple-500 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 mx-auto">
                             <Grid className="w-4 h-4"/> Activate Grid
                         </button>
                     </div>
                 )}
             </div>
        </Card>
    );
};

export default AetherRealityHub;
