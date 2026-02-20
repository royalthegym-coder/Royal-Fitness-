
import React, { useState, useEffect } from 'react';
import { 
    ShieldCheck, Fingerprint, RefreshCw, Key, User, 
    AlertTriangle, CheckCircle, BrainCircuit, Dna, 
    Users, ChevronRight, SkipForward, ScanFace, Infinity, Orbit
} from 'lucide-react';
import { useToast } from './utils/hooks/useToast';

interface LoginScreenProps {
    onLogin: (identifier: string, pass: string | null, role: 'admin' | 'member', method: string) => Promise<boolean>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const { addToast } = useToast();
    const [phase, setPhase] = useState<'boot' | 'onboarding' | 'credentials' | 'success'>('boot');
    const [role, setRole] = useState<'admin' | 'member'>('member');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isBioLoading, setIsBioLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    
    // Onboarding State
    const [slideIndex, setSlideIndex] = useState(0);

    const slides = [
        {
            id: 1,
            title: "Apex Continuum",
            desc: "The living digital organism. Immutable logic. Infinite scalability.",
            icon: <Orbit className="w-32 h-32 text-indigo-400 animate-spin-slow" />,
            color: "text-indigo-400",
            bg: "bg-indigo-500/10",
            border: "border-indigo-500/30"
        },
        {
            id: 2,
            title: "Entangled State",
            desc: "Every data point is universally connected. Zero latency. Zero error.",
            icon: <Infinity className="w-32 h-32 text-cyan-400" />,
            color: "text-cyan-400",
            bg: "bg-cyan-500/10",
            border: "border-cyan-500/30"
        },
        {
            id: 3,
            title: "Self-Evolution",
            desc: "The system monitors, patches, and upgrades itself in real-time.",
            icon: <BrainCircuit className="w-32 h-32 text-purple-400 animate-pulse" />,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            border: "border-purple-500/30"
        }
    ];

    useEffect(() => {
        const bootSequence = [
            "Initializing Apex-Continuum v31.0...",
            "Establishing Immutable Ledger...",
            "Entangling Data Nodes...",
            "Activating Self-Evolution Engine...",
            "Sovereign Gateway Ready."
        ];
        let i = 0;
        const interval = setInterval(() => {
            if (i < bootSequence.length) {
                setLogs(prev => [`> ${bootSequence[i]}`, ...prev].slice(0, 4));
                i++;
            } else {
                clearInterval(interval);
                setTimeout(() => setPhase('onboarding'), 500);
            }
        }, 400);

        return () => clearInterval(interval);
    }, []);

    const handleNextSlide = () => {
        if (slideIndex < slides.length - 1) {
            setSlideIndex(prev => prev + 1);
        } else {
            setPhase('credentials');
        }
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        
        const success = await onLogin(identifier, password, role, 'Password');
        if (!success) {
            setError("Identity Verification Failed.");
            setIsLoading(false);
            addToast("Access Denied: Invalid Shards.", "error");
        } else {
            setPhase('success');
            addToast("Continuum Uplink Established.", "success");
        }
    };

    const handleBiometricAuth = async () => {
        setIsBioLoading(true);
        setTimeout(async () => {
            addToast("Biometric Identity Verified.", "success");
            const bioIdentifier = role === 'admin' ? 'admin@royal.com' : '9785300123'; 
            const success = await onLogin(bioIdentifier, null, role, 'Biometric');
            if(success) setPhase('success');
            setIsBioLoading(false);
        }, 1000);
    };

    return (
        <div className="min-h-screen w-screen bg-[#000000] flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Continuum Atmosphere */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 blur-[120px] rounded-full animate-pulse delay-1000"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10 animate-fade-in">
                    <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-cyan-600 rounded-[2rem] mx-auto mb-4 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.3)] border-2 border-indigo-300/20 transform hover:rotate-12 transition-transform duration-500">
                        <Orbit className="w-10 h-10 text-white animate-spin-slow" />
                    </div>
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
                        Royal Apex
                    </h1>
                    <p className="text-gray-500 text-[10px] font-mono tracking-[0.6em] mt-2 uppercase font-bold">Continuum v31.0</p>
                </div>

                <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 shadow-2xl overflow-hidden relative min-h-[500px] flex flex-col justify-center">
                    {(isLoading || isBioLoading) && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-scan z-20"></div>
                    )}

                    {phase === 'boot' && (
                        <div className="py-10 space-y-4">
                            {logs.map((log, i) => (
                                <div key={i} className="font-mono text-[10px] text-indigo-400/70 animate-fade-in-right italic">{log}</div>
                            ))}
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-indigo-500 animate-pulse"></span>
                            </div>
                        </div>
                    )}

                    {phase === 'onboarding' && (
                        <div className="flex flex-col items-center text-center animate-fade-in h-full justify-between py-4">
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className={`p-8 rounded-[3rem] mb-8 border-2 ${slides[slideIndex].bg} ${slides[slideIndex].border} shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all duration-500`}>
                                    {slides[slideIndex].icon}
                                </div>
                                <h2 className={`text-2xl font-black uppercase italic tracking-wider mb-4 ${slides[slideIndex].color}`}>
                                    {slides[slideIndex].title}
                                </h2>
                                <p className="text-gray-400 text-sm leading-relaxed max-w-xs font-medium">
                                    {slides[slideIndex].desc}
                                </p>
                            </div>

                            <div className="w-full mt-8">
                                <div className="flex justify-center gap-2 mb-8">
                                    {slides.map((_, idx) => (
                                        <div key={idx} className={`h-1 rounded-full transition-all duration-300 ${idx === slideIndex ? `w-8 ${slides[slideIndex].color.replace('text-', 'bg-')}` : 'w-2 bg-gray-700'}`}></div>
                                    ))}
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setPhase('credentials')}
                                        className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                                    >
                                        Skip <SkipForward className="w-4 h-4"/>
                                    </button>
                                    <button 
                                        onClick={handleNextSlide}
                                        className={`flex-[2] py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-black transition-all shadow-xl flex items-center justify-center gap-2 ${slides[slideIndex].color.replace('text-', 'bg-')} hover:scale-105 active:scale-95`}
                                    >
                                        {slideIndex === slides.length - 1 ? 'Enter Hub' : 'Next'} <ChevronRight className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {phase === 'credentials' && (
                         <div className="animate-slide-up">
                            <div className="flex bg-gray-900/50 p-1 rounded-2xl border border-white/5 mb-6">
                                <button onClick={() => setRole('member')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${role === 'member' ? 'bg-white text-black shadow-xl' : 'text-gray-500 hover:text-white'}`}>Athlete</button>
                                <button onClick={() => setRole('admin')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${role === 'admin' ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}>Command</button>
                            </div>
                             <form onSubmit={handleLoginSubmit} className="space-y-4">
                                <div className="space-y-4">
                                    <div className="group relative">
                                        <input 
                                            type="text" value={identifier} onChange={e => setIdentifier(e.target.value)}
                                            className="w-full bg-gray-900/50 border border-white/10 rounded-2xl px-12 py-4 text-white focus:border-indigo-500/50 outline-none transition-all placeholder-gray-700 font-bold"
                                            placeholder="Neural ID (Email/Phone)"
                                        />
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-indigo-500 transition-colors" />
                                    </div>
                                    <div className="group relative">
                                        <input 
                                            type="password" value={password} onChange={e => setPassword(e.target.value)}
                                            className="w-full bg-gray-900/50 border border-white/10 rounded-2xl px-12 py-4 text-white focus:border-indigo-500/50 outline-none transition-all placeholder-gray-700 font-bold"
                                            placeholder="Cipher Key"
                                        />
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-indigo-500 transition-colors" />
                                    </div>
                                </div>
                                {error && <div className="text-red-500 text-xs font-bold text-center">{error}</div>}
                                <button disabled={isLoading} className="w-full bg-white text-black font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-400 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 mt-2">
                                     {isLoading ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Fingerprint className="w-4 h-4" />}
                                     {isLoading ? 'DECRYPTING...' : 'INITIATE UPLINK'}
                                </button>
                                <button type="button" onClick={handleBiometricAuth} className="w-full bg-indigo-900/20 hover:bg-indigo-500/20 border border-indigo-500/50 text-indigo-400 font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[10px] transition-all shadow-[0_0_20px_rgba(99,102,241,0.15)] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50">
                                    {isBioLoading ? <RefreshCw className="w-4 h-4 animate-spin"/> : <ScanFace className="w-4 h-4" />}
                                    {isBioLoading ? 'SCANNING BIOMETRICS...' : 'BIO-METRIC UPLINK'}
                                </button>
                             </form>
                         </div>
                    )}
                    
                    {phase === 'success' && (
                        <div className="text-center py-10 animate-scale-in flex flex-col items-center justify-center h-full">
                            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_#22c55e] border-4 border-white">
                                <CheckCircle className="w-12 h-12 text-black" />
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-widest">Authorized</h2>
                            <p className="text-gray-500 font-mono text-[10px] mt-2 uppercase tracking-widest">Constructing Workspace...</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center text-[10px] font-black text-gray-600 uppercase tracking-widest italic opacity-50">
                    Sovereign Federation // Node Jhunjhunu-01
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
