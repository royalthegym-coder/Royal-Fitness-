import React, { useState, useEffect, useRef } from 'react';
import { MonitorPlay as Headphones, Brain, Radio, Zap, Play, Square, Activity, Volume2 } from 'lucide-react';

export const NeuroAcoustic: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeMode, setActiveMode] = useState<string>('delta');
    const [volume, setVolume] = useState(0.5);
    
    const audioCtxRef = useRef<AudioContext | null>(null);
    const oscLeftRef = useRef<OscillatorNode | null>(null);
    const oscRightRef = useRef<OscillatorNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const modes = {
        delta: { name: 'Delta (Deep Recovery)', baseFreq: 100, beatFreq: 2.5, desc: 'Maximum physical recovery, HGH release, profound rest.', color: 'text-blue-500', bg: 'bg-blue-500' },
        theta: { name: 'Theta (Meditation)', baseFreq: 136.1, beatFreq: 5.5, desc: 'Deep relaxation, mental imagery, CNS reset.', color: 'text-purple-500', bg: 'bg-purple-500' },
        alpha: { name: 'Alpha (Flow State)', baseFreq: 200, beatFreq: 10, desc: 'Pre-workout visualization, calm focus, mind-muscle link.', color: 'text-cyan-500', bg: 'bg-cyan-500' },
        gamma: { name: 'Gamma (Hyper-Drive)', baseFreq: 250, beatFreq: 40, desc: 'Peak cognitive processing, extreme focus (use with caution).', color: 'text-fuchsia-500', bg: 'bg-fuchsia-500' },
    };

    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = volume;
        }
    }, [volume]);

    useEffect(() => {
        let animationId: number;
        
        const drawVisualizer = () => {
            if(!canvasRef.current) return;
            const ctx = canvasRef.current.getContext('2d');
            if(!ctx) return;
            
            const width = canvasRef.current.width;
            const height = canvasRef.current.height;
            const modeConfig = modes[activeMode as keyof typeof modes];
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, width, height);
            
            if (isPlaying) {
                const time = Date.now() / 1000;
                ctx.beginPath();
                ctx.moveTo(0, height / 2);
                
                for (let i = 0; i < width; i++) {
                    const wave1 = Math.sin(i * 0.05 + time * modeConfig.baseFreq * 0.1) * 20;
                    const wave2 = Math.sin(i * 0.05 + time * (modeConfig.baseFreq + modeConfig.beatFreq) * 0.1) * 20;
                    const combined = (wave1 + wave2) / 2;
                    ctx.lineTo(i, height / 2 + combined);
                }
                
                ctx.strokeStyle = modeConfig.color.replace('text-', '').replace('-500', ''); // basic mapping
                if(modeConfig.color === 'text-cyan-500') ctx.strokeStyle = '#06b6d4';
                if(modeConfig.color === 'text-fuchsia-500') ctx.strokeStyle = '#d946ef';
                if(modeConfig.color === 'text-purple-500') ctx.strokeStyle = '#a855f7';
                if(modeConfig.color === 'text-blue-500') ctx.strokeStyle = '#3b82f6';
                
                ctx.lineWidth = 2;
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(0, height/2);
                ctx.lineTo(width, height/2);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            
            animationId = requestAnimationFrame(drawVisualizer);
        };

        drawVisualizer();
        return () => cancelAnimationFrame(animationId);
    }, [isPlaying, activeMode]);

    const stopAudio = () => {
        if (oscLeftRef.current) { oscLeftRef.current.stop(); oscLeftRef.current.disconnect(); }
        if (oscRightRef.current) { oscRightRef.current.stop(); oscRightRef.current.disconnect(); }
        if (audioCtxRef.current) { audioCtxRef.current.close(); }
        setIsPlaying(false);
    };

    const startAudio = () => {
        stopAudio();
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        const merger = ctx.createChannelMerger(2);
        
        const oscLeft = ctx.createOscillator();
        const oscRight = ctx.createOscillator();
        
        const gainNode = ctx.createGain();
        gainNode.gain.value = volume;
        gainNodeRef.current = gainNode;

        const config = modes[activeMode as keyof typeof modes];
        
        oscLeft.type = 'sine';
        oscLeft.frequency.value = config.baseFreq;
        
        oscRight.type = 'sine';
        oscRight.frequency.value = config.baseFreq + config.beatFreq;

        oscLeft.connect(merger, 0, 0); // connect to left channel
        oscRight.connect(merger, 0, 1); // connect to right channel

        merger.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscLeft.start();
        oscRight.start();
        
        oscLeftRef.current = oscLeft;
        oscRightRef.current = oscRight;
        setIsPlaying(true);
    };

    const togglePlay = () => {
        if (isPlaying) {
            stopAudio();
        } else {
            startAudio();
        }
    };

    useEffect(() => {
        if (isPlaying) {
            startAudio();
        }
        return () => stopAudio();
    }, [activeMode]);

    return (
        <div className="font-mono text-cyan-400 p-6 max-w-5xl mx-auto space-y-8 animate-fade-in relative">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)] pointer-events-none z-0"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between bg-black border border-cyan-500/30 rounded-[3rem] p-8 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-cyan-950/30 rounded-2xl border border-cyan-500/50 relative">
                        <Brain className="w-12 h-12 text-cyan-400 animate-pulse" />
                        {isPlaying && <div className="absolute inset-0 border-2 border-cyan-400 rounded-2xl animate-ping opacity-50"></div>}
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">Neuro-Acoustic <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">Regeneration</span></h1>
                        <p className="text-xs font-black uppercase tracking-widest text-cyan-500/70 py-1">WebAudio Binaural API Active</p>
                    </div>
                </div>
                <div className="mt-6 md:mt-0 px-6 py-3 bg-black/50 border border-white/10 rounded-full flex items-center gap-3 backdrop-blur-xl">
                    <Headphones className="w-5 h-5 text-gray-400" />
                    <span className="text-xs text-gray-300 font-bold uppercase tracking-widest">Headphones Required</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                
                {/* Control Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#050505] border border-cyan-500/20 rounded-3xl p-6 shadow-xl">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-4 mb-6 flex items-center gap-3">
                            <Radio className="w-4 h-4 text-cyan-500" /> Frequency Matrix
                        </h3>
                        
                        <div className="space-y-4">
                            {Object.entries(modes).map(([key, mode]) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveMode(key)}
                                    className={`w-full text-left p-4 rounded-2xl transition-all duration-300 border ${activeMode === key ? 'bg-white/10 border-' + mode.color.split('-')[1] + '-500 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'bg-black border-white/5 hover:bg-white/5'}`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`font-black uppercase tracking-wider ${mode.color}`}>{mode.name}</span>
                                        {activeMode === key && isPlaying && <Activity className={`w-4 h-4 ${mode.color} animate-pulse`} />}
                                    </div>
                                    <div className="text-[10px] text-gray-500 mt-2 mb-2">{mode.desc}</div>
                                    <div className="flex items-center gap-3 text-[9px] font-black tracking-widest text-gray-600">
                                        <span>BASE: {mode.baseFreq}Hz</span>
                                        <span>&bull;</span>
                                        <span>BEAT: {mode.beatFreq}Hz</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Visualizer & Player */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#050505] border border-cyan-500/30 rounded-[3rem] p-8 h-[400px] flex flex-col items-center justify-between relative overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none"></div>
                        
                        <div className="flex w-full justify-between items-center z-10 px-4">
                            <div className="text-xs font-black uppercase tracking-widest text-cyan-600">L: {modes[activeMode as keyof typeof modes].baseFreq}Hz</div>
                            <div className="px-4 py-1 bg-black/80 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-black tracking-[0.3em]">
                                {isPlaying ? 'TRANSMITTING' : 'STANDBY'}
                            </div>
                            <div className="text-xs font-black uppercase tracking-widest text-fuchsia-600">R: {modes[activeMode as keyof typeof modes].baseFreq + modes[activeMode as keyof typeof modes].beatFreq}Hz</div>
                        </div>

                        <canvas 
                            ref={canvasRef} 
                            width={800} 
                            height={200} 
                            className="w-full h-[200px] z-10 opacity-80 mix-blend-screen"
                        />

                        <div className="w-full max-w-md bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl z-10 flex flex-col items-center gap-6">
                            <button 
                                onClick={togglePlay}
                                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-red-500 hover:bg-red-400 shadow-[0_0_40px_rgba(239,68,68,0.4)] text-white' : 'bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.4)] text-black'}`}
                            >
                                {isPlaying ? <Square className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-2" />}
                            </button>

                            <div className="w-full flex items-center gap-4 text-gray-400">
                                <Volume2 className="w-4 h-4" />
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.01" 
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                    className="flex-1 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/40 border border-fuchsia-500/20 p-6 rounded-3xl flex items-start gap-4">
                        <Zap className="w-6 h-6 text-fuchsia-500 shrink-0 mt-1" />
                        <p className="text-xs text-gray-400 leading-relaxed">
                            <strong className="text-fuchsia-400 uppercase tracking-widest block mb-2">Smart Entrainment Active</strong> 
                            Binaural beats create an auditory illusion in the brain stem. By presenting two slightly different frequencies to each ear, the brain processes a third frequency (the difference), artificially synchronizing brainwaves to accelerate physical recovery, deep sleep, and hyper-focus.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default NeuroAcoustic;
