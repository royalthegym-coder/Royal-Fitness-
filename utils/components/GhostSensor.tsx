import React, { useRef, useEffect, useState } from 'react';
import { Eye, Heart, Activity, ScanFace, Waves } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const GhostSensor: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [bpmData, setBpmData] = useState<any[]>([]);
    const [currentBpm, setCurrentBpm] = useState(72);
    const [stressLevel, setStressLevel] = useState(25);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Camera access denied:", err);
            }
        };
        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    useEffect(() => {
        if (!isScanning) return;
        
        const interval = setInterval(() => {
            const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: 'numeric', minute: 'numeric', second: 'numeric' });
            // Simulate rPPG data (fluctuating BPM)
            const newBpm = Math.max(60, Math.min(180, currentBpm + (Math.random() * 10 - 5)));
            const newStress = Math.max(10, Math.min(100, stressLevel + (Math.random() * 5 - 2.5)));
            
            setCurrentBpm(Math.round(newBpm));
            setStressLevel(Math.round(newStress));

            setBpmData(prev => {
                const newData = [...prev, { time, bpm: Math.round(newBpm), stress: Math.round(newStress) }];
                if (newData.length > 30) newData.shift();
                return newData;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isScanning, currentBpm, stressLevel]);

    return (
        <div className="h-full flex flex-col animate-fade-in space-y-6">
            <div className="flex items-center justify-between bg-black/40 p-6 rounded-[2rem] border border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.1)] backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-cyan-500/20 rounded-2xl border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                        <Eye className="w-8 h-8 text-cyan-400 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-widest italic flex items-center gap-3">
                            rPPG Vitals <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Monitor</span>
                        </h1>
                        <p className="text-xs font-mono text-cyan-400/70 uppercase tracking-[0.3em]">The Ghost Sensor (DeepPhys)</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsScanning(!isScanning)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-full border transition-all ${isScanning ? 'bg-red-900/40 border-red-500/50 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-cyan-900/40 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]'}`}
                >
                    <ScanFace className={`w-4 h-4 ${isScanning ? 'animate-pulse text-red-400' : 'text-cyan-400'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{isScanning ? 'Stop Scan' : 'Start Scan'}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                {/* Camera Feed */}
                <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-6 relative overflow-hidden flex flex-col items-center justify-center group min-h-[400px]">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    
                    <div className="relative w-full max-w-md aspect-video bg-gray-900 rounded-3xl overflow-hidden border-2 border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)]">
                        {stream ? (
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600 font-mono text-xs uppercase tracking-widest">
                                Camera Offline
                            </div>
                        )}
                        
                        {/* Scanning Overlay */}
                        {isScanning && (
                            <>
                                <div className="absolute inset-0 bg-cyan-500/10 mix-blend-overlay"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-cyan-400/50 rounded-xl">
                                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
                                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
                                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>
                                    
                                    {/* Scanning line */}
                                    <div className="w-full h-0.5 bg-cyan-400/80 shadow-[0_0_10px_#22d3ee] animate-[scan_2s_ease-in-out_infinite]"></div>
                                </div>
                                
                                {/* Micro-blood flow visualization */}
                                <div className="absolute bottom-4 left-4 flex items-center gap-2 text-[10px] font-mono text-cyan-400 bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-md">
                                    <Waves className="w-3 h-3 animate-pulse" /> Extracting rPPG Signal
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Telemetry */}
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-6 rounded-3xl border transition-colors ${currentBpm > 160 ? 'bg-red-900/20 border-red-500/50' : 'bg-black/40 border-white/5'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Heart Rate</p>
                                <Heart className={`w-5 h-5 ${currentBpm > 160 ? 'text-red-500 animate-ping' : 'text-red-400 animate-pulse'}`} />
                            </div>
                            <p className={`text-5xl font-black italic ${currentBpm > 160 ? 'text-red-400' : 'text-white'}`}>{isScanning ? currentBpm : '--'} <span className="text-sm text-gray-500">BPM</span></p>
                        </div>
                        
                        <div className={`p-6 rounded-3xl border transition-colors ${stressLevel > 80 ? 'bg-amber-900/20 border-amber-500/50' : 'bg-black/40 border-white/5'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Stress Level</p>
                                <Activity className={`w-5 h-5 ${stressLevel > 80 ? 'text-amber-500 animate-pulse' : 'text-cyan-400'}`} />
                            </div>
                            <p className={`text-5xl font-black italic ${stressLevel > 80 ? 'text-amber-400' : 'text-white'}`}>{isScanning ? stressLevel : '--'} <span className="text-sm text-gray-500">%</span></p>
                        </div>
                    </div>

                    {currentBpm > 160 && (
                        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl flex items-start gap-4 animate-pulse">
                            <Heart className="w-6 h-6 text-red-500 shrink-0" />
                            <div>
                                <h4 className="text-red-400 font-black uppercase text-sm tracking-widest">Tachycardia Alert</h4>
                                <p className="text-red-300/70 text-xs mt-1">"रुको महेश, आपका दिल बहुत तेज़ धड़क रहा है, ३० सेकंड का ब्रेक लो।" (Heart rate exceeds 160 BPM).</p>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 bg-black/40 border border-white/5 rounded-[2.5rem] p-6 min-h-[250px]">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Activity className="w-3 h-3" /> Live Photoplethysmography (PPG) Waveform
                        </h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={bpmData}>
                                <defs>
                                    <linearGradient id="colorBpm" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" hide />
                                <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '12px', fontSize: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="bpm" stroke="#ef4444" fillOpacity={1} fill="url(#colorBpm)" strokeWidth={3} isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes scan {
                    0% { top: 0; }
                    50% { top: 100%; }
                    100% { top: 0; }
                }
            `}</style>
        </div>
    );
};

export default GhostSensor;
