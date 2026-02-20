
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataProvider';
// Removed getComplexResponse import to stop API calls
import { 
    Activity, Trophy, Clock, Thermometer, Users, 
    ScanLine, Zap, Flame, Calendar, MousePointer2,
    Crown, Sparkles, Music, Disc, Dumbbell, Wind, Droplets,
    Wifi, Radio, Swords
} from 'lucide-react';
import { toDataURL } from 'qrcode';
import { GYM_INFO } from '../../constants';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Member } from '../../types';

const VisualLaunch: React.FC = () => {
    const { members, activeMemberCount } = useData();
    
    // --- STATE ---
    const [currentTime, setCurrentTime] = useState(new Date());
    const [aiTicker, setAiTicker] = useState("Welcome to Royal The Gym. Train Hard, Recover Smart.");
    const [qrCode, setQrCode] = useState('');
    const [weather, setWeather] = useState({ temp: 24, humidity: 45, aqi: 42 });
    const [prAlert, setPrAlert] = useState<{ member: Member, exercise: string, record: string } | null>(null);
    const [gymPulseData, setGymPulseData] = useState<any[]>([]);
    
    // New Music & WOD State
    const [currentTrack, setCurrentTrack] = useState({ title: "NEON BLADE", artist: "MoonDeity", cover: "https://i.scdn.co/image/ab67616d0000b27376c9b3127db8751515f4586d" });
    const [audioData, setAudioData] = useState<any[]>([]);

    // --- LIVE CLOCK & SIMULATION ---
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        
        const envTimer = setInterval(() => {
            setWeather(prev => ({
                temp: 22 + Math.floor(Math.random() * 3),
                humidity: 40 + Math.floor(Math.random() * 10),
                aqi: 35 + Math.floor(Math.random() * 15)
            }));
            
            // Pulse Data (Simulating Gym Energy)
            setGymPulseData(prev => {
                const newData = [...prev, { time: Date.now(), value: Math.random() * 80 + 20 }];
                return newData.slice(-30); // Keep last 30 points
            });
            
            // Audio Visualizer Sim
            const newAudio = Array(16).fill(0).map(() => ({ val: Math.random() * 100 }));
            setAudioData(newAudio);

        }, 1000);

        // WiFi QR Code
        toDataURL(`WIFI:S:${GYM_INFO.name};T:WPA;P:RoyalFit2024;;`, { width: 300, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
            .then(url => setQrCode(url));

        return () => { clearInterval(timer); clearInterval(envTimer); };
    }, []);

    // --- LOCAL TICKER & PR SIMULATIONS ---
    useEffect(() => {
        // Rotate Tracks
        const tracks = [
            { title: "NEON BLADE", artist: "MoonDeity" },
            { title: "SICKO MODE", artist: "Travis Scott" },
            { title: "Till I Collapse", artist: "Eminem" },
            { title: "Way Down We Go", artist: "Kaleo" },
            { title: "Sahara", artist: "Hensonn" }
        ];
        
        const trackInterval = setInterval(() => {
            setCurrentTrack(tracks[Math.floor(Math.random() * tracks.length)] as any);
        }, 30000); 

        // AI Ticker Update - USING LOCAL ARRAY TO SAVE COST
        const updateTicker = () => {
            const quotes = [
                "Pain is temporary, Pride is forever.",
                "Sovereign State: Optimal.",
                "Hydration Levels in Zone A: Low.",
                "Next Class: Power Yoga @ 6:00 PM.",
                "New Equipment Arriving Soon.",
                "Discipline is the bridge between goals and accomplishment.",
                "Your only limit is you.",
                "Eat clean, train dirty."
            ];
            setAiTicker(quotes[Math.floor(Math.random() * quotes.length)]);
        };
        const tickerInterval = setInterval(updateTicker, 15000);

        // PR Alert Simulation (The "Holographic Intercept")
        const prInterval = setInterval(() => {
            if (prAlert) return; 
            if (members.length > 0) {
                const randomMember = members[Math.floor(Math.random() * members.length)];
                const exercises = ['Deadlift', 'Bench Press', 'Squat', 'Clean & Jerk'];
                const exercise = exercises[Math.floor(Math.random() * exercises.length)];
                const record = `${Math.floor(Math.random() * 50 + 100)}kg`;
                
                // Trigger Alert
                setPrAlert({ member: randomMember, exercise, record });
                
                // Clear Alert
                setTimeout(() => setPrAlert(null), 8000); 
            }
        }, 60000); // Every 60s

        return () => { clearInterval(tickerInterval); clearInterval(prInterval); clearInterval(trackInterval); };
    }, [members, prAlert]);

    const topMembers = useMemo(() => {
        return [...members].sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 4);
    }, [members]);

    const occupancyPercent = Math.min(100, (activeMemberCount / 50) * 100);

    // --- COMPONENTS ---
    // (Rest of the component remains strictly UI, no logic changes needed for cost)
    
    const PrAlertOverlay: React.FC<{ alert: { member: Member, exercise: string, record: string } }> = ({ alert }) => (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center animate-scale-in p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#f59e0b_0%,_transparent_60%)] opacity-20 animate-pulse"></div>
            <div className="w-full max-w-5xl bg-[#0a0a0a] border-y-4 border-amber-500 rounded-[4rem] p-16 relative overflow-hidden shadow-[0_0_150px_rgba(245,158,11,0.6)] flex items-center gap-16">
                <div className="relative">
                    <div className="absolute inset-0 bg-amber-500 rounded-full blur-3xl opacity-40 animate-pulse"></div>
                    <img src={alert.member.avatar} className="w-64 h-64 rounded-full object-cover border-8 border-amber-500 shadow-2xl relative z-10 grayscale contrast-125" alt={alert.member.name} />
                    <div className="absolute -top-10 -right-10 text-amber-400 animate-bounce-slow">
                        <Crown className="w-32 h-32 fill-current" />
                    </div>
                </div>
                <div className="flex-1 space-y-4">
                    <div className="inline-flex items-center gap-3 px-6 py-2 bg-amber-500 text-black rounded-full mb-4 shadow-lg shadow-amber-500/50">
                        <Trophy className="w-6 h-6 fill-black" />
                        <span className="text-xl font-black uppercase tracking-widest">New Gym Record</span>
                    </div>
                    <h2 className="text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                        {alert.member.name}
                    </h2>
                    <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-transparent"></div>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-gray-400 font-mono text-xl uppercase tracking-[0.3em]">Protocol</p>
                            <p className="text-4xl font-bold text-white mt-1">{alert.exercise}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 font-mono text-xl uppercase tracking-[0.3em]">Load</p>
                            <p className="text-7xl font-black text-amber-500 italic tracking-tighter">{alert.record}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] bg-[#050505] text-white font-sans overflow-hidden cursor-none">
            {prAlert && <PrAlertOverlay alert={prAlert} />}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.08)_0%,_transparent_60%)] animate-spin-slow duration-[120s]"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-scan z-20 shadow-[0_0_50px_cyan]"></div>
            </div>
            <div className="relative z-10 grid grid-cols-12 grid-rows-6 h-full p-8 gap-6">
                <div className="col-span-3 row-span-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><Wind className="w-32 h-32 text-cyan-400" /></div>
                    <div>
                        <h2 className="text-8xl font-black text-white tracking-tighter leading-none font-mono">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </h2>
                        <div className="flex items-center gap-3 mt-2">
                             <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                             <p className="text-xl text-gray-400 font-bold uppercase tracking-widest">
                                {currentTime.toLocaleDateString([], { weekday: 'long' }).substring(0,3).toUpperCase()} {currentTime.getDate()}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                             <div className="flex items-center gap-2 mb-1 text-cyan-400">
                                 <Thermometer className="w-4 h-4" /> <span className="text-[10px] font-black uppercase">Temp</span>
                             </div>
                             <p className="text-2xl font-bold text-white">{weather.temp}°</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                             <div className="flex items-center gap-2 mb-1 text-blue-400">
                                 <Droplets className="w-4 h-4" /> <span className="text-[10px] font-black uppercase">Hum</span>
                             </div>
                             <p className="text-2xl font-bold text-white">{weather.humidity}%</p>
                        </div>
                    </div>
                </div>
                <div className="col-span-5 row-span-2 bg-gradient-to-r from-gray-900 to-black backdrop-blur-xl border-l-4 border-cyan-500 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-5"><Dumbbell className="w-48 h-48 text-white" /></div>
                     <div className="relative z-10">
                         <div className="flex items-center gap-3 mb-4">
                             <span className="px-3 py-1 bg-cyan-500 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-cyan-500/50">Daily Protocol</span>
                         </div>
                         <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">Spartan <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">300</span></h2>
                         <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">Endurance & Power Focus</p>
                     </div>
                     <div className="grid grid-cols-4 gap-4 relative z-10">
                         {[{l:'Pullups',v:'25'}, {l:'Deadlifts',v:'50'}, {l:'Pushups',v:'50'}, {l:'Box Jumps',v:'50'}].map((item, i) => (
                             <div key={i} className="text-center">
                                 <p className="text-3xl font-black text-cyan-400 italic">{item.v}</p>
                                 <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{item.l}</p>
                             </div>
                         ))}
                     </div>
                </div>
                <div className="col-span-4 row-span-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col justify-between">
                     <div className="absolute inset-0 bg-indigo-900/10 mix-blend-overlay"></div>
                     <div className="flex items-center gap-6 relative z-10">
                         <div className="w-24 h-24 rounded-full border-4 border-indigo-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)] animate-spin-slow">
                             <Disc className="w-12 h-12 text-indigo-400" />
                         </div>
                         <div>
                             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-2"><Music className="w-3 h-3"/> Sonic Pulse</span>
                             <h3 className="text-2xl font-black text-white leading-tight line-clamp-1">{currentTrack.title}</h3>
                             <p className="text-sm text-gray-400 uppercase tracking-wide font-medium">{currentTrack.artist}</p>
                         </div>
                     </div>
                     <div className="h-20 flex items-end justify-between gap-1 relative z-10">
                         {audioData.map((bar, i) => (
                             <div key={i} className="flex-1 bg-indigo-500 rounded-t-sm transition-all duration-150 ease-in-out shadow-[0_0_10px_#6366f1]" style={{ height: `${bar.val}%`, opacity: 0.6 + (i/32) }}></div>
                         ))}
                     </div>
                </div>
                <div className="col-span-4 row-span-4 bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30">
                            <Trophy className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Apex Warriors</h3>
                            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em]">Live XP Ranking</p>
                        </div>
                    </div>
                    <div className="space-y-4 flex-1">
                        {topMembers.map((m, i) => (
                            <div key={m.id} className="flex items-center gap-5 p-4 bg-black/40 rounded-3xl border border-white/5 relative overflow-hidden group">
                                <div className={`text-4xl font-black italic w-12 text-center ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-700' : 'text-gray-600'}`}>
                                    {i+1}
                                </div>
                                <img src={m.avatar} className="w-14 h-14 rounded-2xl object-cover border-2 border-white/10 shadow-lg grayscale group-hover:grayscale-0 transition-all" alt={m.name} />
                                <div className="flex-1">
                                    <h4 className="text-lg font-bold text-white uppercase tracking-tight">{m.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                         <span className="text-[9px] font-black bg-white/10 px-2 py-0.5 rounded text-gray-400 uppercase">{m.achievements[0] || 'Warrior'}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                     <p className="text-xl font-mono font-bold text-cyan-400">{m.xp}</p>
                                     <p className="text-[8px] text-gray-600 uppercase font-black">XP</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="col-span-5 row-span-4 flex flex-col gap-6">
                    <div className="flex-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 flex items-center justify-between relative overflow-hidden">
                         <div className="relative z-10">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 flex items-center gap-2"><Users className="w-4 h-4"/> Live Occupancy</p>
                             <div className="flex items-baseline gap-2">
                                 <span className="text-7xl font-black text-white italic tracking-tighter">{activeMemberCount}</span>
                                 <span className="text-xl font-bold text-gray-600">/ 100</span>
                             </div>
                             <p className="text-xs text-green-400 font-bold uppercase mt-2 flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Comfortable</p>
                         </div>
                         <div className="relative w-40 h-40">
                             <svg className="w-full h-full transform -rotate-90">
                                 <circle cx="80" cy="80" r="70" stroke="#1f2937" strokeWidth="12" fill="none" />
                                 <circle cx="80" cy="80" r="70" stroke={occupancyPercent > 80 ? '#ef4444' : '#22c55e'} strokeWidth="12" fill="none" strokeDasharray="440" strokeDashoffset={440 - (440 * occupancyPercent) / 100} strokeLinecap="round" className="transition-all duration-1000 shadow-[0_0_20px_currentColor]" />
                             </svg>
                         </div>
                    </div>
                    <div className="flex-[1.5] bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-900/20 rounded-lg text-red-500"><Activity className="w-5 h-5"/></div>
                                <h3 className="text-lg font-black text-white uppercase italic">Gym Heartbeat</h3>
                            </div>
                            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">LIVE INTENSITY</span>
                        </div>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={gymPulseData}>
                                    <defs>
                                        <linearGradient id="pulseGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={3} fill="url(#pulseGrad)" isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <div className="col-span-3 row-span-4 flex flex-col gap-6">
                    <div className="flex-1 bg-gradient-to-br from-indigo-900/30 to-black border border-white/10 rounded-[2.5rem] p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><Swords className="w-32 h-32 text-white"/></div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Upcoming Session</p>
                        <h3 className="text-3xl font-black text-white uppercase italic leading-none mb-2">Power Yoga</h3>
                        <div className="flex items-center gap-2 mb-6">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-xl font-mono font-bold text-white">18:00</span>
                        </div>
                        <div className="flex -space-x-3">
                             {[1,2,3,4,5].map(i => <div key={i} className="w-8 h-8 rounded-full bg-gray-800 border-2 border-black"></div>)}
                             <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-black flex items-center justify-center text-[9px] font-bold text-white">+12</div>
                        </div>
                    </div>
                    <div className="flex-1 bg-white rounded-[2.5rem] p-6 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
                        <img src={qrCode} className="w-32 h-32 mix-blend-multiply mb-4" alt="WiFi" />
                        <div className="space-y-1">
                            <h4 className="text-black font-black uppercase text-sm tracking-widest">Free High-Speed WiFi</h4>
                            <p className="text-gray-500 text-xs font-mono">Network: RoyalFit_5G</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#f59e0b] flex items-center overflow-hidden z-20 shadow-[0_-10px_40px_rgba(245,158,11,0.3)]">
                <div className="whitespace-nowrap animate-marquee flex items-center">
                    <span className="text-black font-black text-xl mx-8 uppercase italic flex items-center gap-3"><Sparkles className="w-5 h-5 fill-black" /> {aiTicker}</span>
                    <span className="text-black/40 text-2xl mx-6">///</span>
                    <span className="text-black font-black text-xl mx-8 uppercase italic">Reminder: Re-rack your weights</span>
                    <span className="text-black/40 text-2xl mx-6">///</span>
                    <span className="text-black font-black text-xl mx-8 uppercase italic">Supplements Restocked: Whey Isolate Available</span>
                    <span className="text-black/40 text-2xl mx-6">///</span>
                </div>
            </div>
            <div className="absolute top-0 left-0 w-20 h-20 z-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={() => window.location.reload()} className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">EXIT TV</button>
            </div>
        </div>
    );
};

export default VisualLaunch;
