import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    ShieldAlert, Mic, Power, Lock, Unlock, AlertTriangle, 
    Cpu, Network, Database, Fingerprint, Activity
} from 'lucide-react';
import { useToast } from '../hooks/useToast';

export const EmergencyOverride: React.FC = () => {
    const { addToast } = useToast();
    const [isListening, setIsListening] = useState(false);
    const [voiceVerified, setVoiceVerified] = useState(false);
    const [systemState, setSystemState] = useState<'AUTONOMOUS' | 'MANUAL' | 'SHUTDOWN'>('AUTONOMOUS');
    const [countdown, setCountdown] = useState<number | null>(null);

    const subsystems = [
        { name: 'Titan Vision AI', status: systemState === 'SHUTDOWN' ? 'OFFLINE' : 'ONLINE' },
        { name: 'Nexus Auto-Pilot', status: systemState === 'AUTONOMOUS' ? 'ONLINE' : 'OFFLINE' },
        { name: 'Bio-Aether Oracle', status: systemState === 'SHUTDOWN' ? 'OFFLINE' : 'ONLINE' },
        { name: 'Financial Vault', status: 'SECURE' }, // Always secure
    ];

    const handleVoiceCommand = () => {
        setIsListening(true);
        addToast("Awaiting Voice Print...", "info");
        
        // Simulate voice verification process
        setTimeout(() => {
            setIsListening(false);
            setVoiceVerified(true);
            addToast("Voice Print Verified: Mahesh Sani. Master Access Granted.", "success");
        }, 3000);
    };

    const initiateShutdown = () => {
        if (!voiceVerified) return;
        
        setCountdown(5);
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer);
                    setSystemState('SHUTDOWN');
                    setCountdown(null);
                    addToast("PROTOCOL ZERO EXECUTED. ALL AI SYSTEMS OFFLINE.", "error");
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const toggleManualOverride = () => {
        if (!voiceVerified) return;
        
        if (systemState === 'AUTONOMOUS') {
            setSystemState('MANUAL');
            addToast("Manual Override Active. AI Auto-Pilot Suspended.", "warning");
        } else {
            setSystemState('AUTONOMOUS');
            addToast("Auto-Pilot Restored. AI resuming control.", "success");
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 animate-fade-in h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className={`p-8 rounded-[2rem] border relative overflow-hidden transition-colors duration-500 ${
                systemState === 'AUTONOMOUS' ? 'bg-gradient-to-r from-zinc-900 to-black border-white/10' :
                systemState === 'MANUAL' ? 'bg-gradient-to-r from-amber-950 to-black border-amber-500/30' :
                'bg-gradient-to-r from-red-950 to-black border-red-500/50'
            }`}>
                <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] transition-colors duration-500 ${
                    systemState === 'AUTONOMOUS' ? 'bg-indigo-500/10' :
                    systemState === 'MANUAL' ? 'bg-amber-500/10' :
                    'bg-red-500/20'
                }`}></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldAlert className={`w-5 h-5 ${
                                systemState === 'AUTONOMOUS' ? 'text-indigo-400' :
                                systemState === 'MANUAL' ? 'text-amber-400' : 'text-red-500'
                            }`} />
                            <span className={`text-xs font-mono uppercase tracking-widest ${
                                systemState === 'AUTONOMOUS' ? 'text-indigo-400' :
                                systemState === 'MANUAL' ? 'text-amber-400' : 'text-red-500'
                            }`}>Protocol Zero Command Center</span>
                        </div>
                        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Emergency Override</h1>
                        <p className="text-zinc-400 mt-2 text-sm max-w-xl">
                            Master control terminal for 'The Royal Nexus'. Use voice print to authorize manual override or initiate total AI shutdown.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-black/50 p-4 rounded-xl border border-white/5 backdrop-blur-md">
                        <div className="text-right">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">System Status</p>
                            <p className={`text-lg font-black ${
                                systemState === 'AUTONOMOUS' ? 'text-emerald-400' :
                                systemState === 'MANUAL' ? 'text-amber-400' : 'text-red-500'
                            }`}>{systemState}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                            systemState === 'AUTONOMOUS' ? 'bg-emerald-500/20 border-emerald-500/50' :
                            systemState === 'MANUAL' ? 'bg-amber-500/20 border-amber-500/50' :
                            'bg-red-500/20 border-red-500/50 animate-pulse'
                        }`}>
                            <Activity className={`w-6 h-6 ${
                                systemState === 'AUTONOMOUS' ? 'text-emerald-400' :
                                systemState === 'MANUAL' ? 'text-amber-400' : 'text-red-500'
                            }`} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                {/* Left Panel: Authentication & Controls */}
                <div className="bg-black border border-white/10 rounded-[2rem] p-8 flex flex-col relative overflow-hidden">
                    {/* Security Overlay if not verified */}
                    <AnimatePresence>
                        {!voiceVerified && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center border border-red-500/20 rounded-[2rem]"
                            >
                                <div className="relative mb-6">
                                    {isListening && (
                                        <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse"></div>
                                    )}
                                    <button 
                                        onClick={handleVoiceCommand}
                                        className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center border-2 transition-all ${
                                            isListening 
                                            ? 'bg-red-500/20 border-red-500 text-red-400 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.4)]' 
                                            : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-red-500 hover:text-red-400'
                                        }`}
                                    >
                                        <Mic className={`w-10 h-10 ${isListening ? 'animate-pulse' : ''}`} />
                                    </button>
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Voice Print Required</h3>
                                <p className="text-sm text-zinc-500 font-mono text-center max-w-xs">
                                    {isListening ? "Listening for authorization phrase..." : "Tap microphone and speak your master passphrase to unlock controls."}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <h2 className="text-lg font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
                        <Unlock className="w-5 h-5 text-emerald-400" />
                        Master Controls Unlocked
                    </h2>

                    <div className="space-y-6 flex-1 flex flex-col justify-center">
                        {/* Manual Override Button */}
                        <button 
                            onClick={toggleManualOverride}
                            className={`w-full p-6 rounded-2xl border-2 flex items-center justify-between transition-all group ${
                                systemState === 'MANUAL' 
                                ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                                : 'bg-zinc-900/50 border-white/10 text-white hover:border-amber-500/50'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${systemState === 'MANUAL' ? 'bg-amber-500/20' : 'bg-white/5 group-hover:bg-amber-500/10'}`}>
                                    <Cpu className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-black uppercase tracking-widest text-lg">Manual Override</h3>
                                    <p className="text-xs opacity-70 font-mono mt-1">Suspend AI Auto-Pilot</p>
                                </div>
                            </div>
                            <div className={`w-12 h-6 rounded-full relative transition-colors ${systemState === 'MANUAL' ? 'bg-amber-500' : 'bg-zinc-700'}`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${systemState === 'MANUAL' ? 'left-7' : 'left-1'}`}></div>
                            </div>
                        </button>

                        {/* Emergency Shutdown Button */}
                        <div className="relative">
                            {countdown !== null && (
                                <div className="absolute inset-0 z-10 bg-red-600 rounded-2xl flex items-center justify-center">
                                    <span className="text-5xl font-black text-white animate-pulse">{countdown}</span>
                                </div>
                            )}
                            <button 
                                onClick={initiateShutdown}
                                disabled={systemState === 'SHUTDOWN' || countdown !== null}
                                className={`w-full p-6 rounded-2xl border-2 flex items-center justify-between transition-all group ${
                                    systemState === 'SHUTDOWN' 
                                    ? 'bg-red-950/50 border-red-900 text-red-900 cursor-not-allowed' 
                                    : 'bg-red-950/20 border-red-500/30 text-red-500 hover:bg-red-900/40 hover:border-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${systemState === 'SHUTDOWN' ? 'bg-red-900/20' : 'bg-red-500/10 group-hover:bg-red-500/20'}`}>
                                        <Power className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-black uppercase tracking-widest text-lg">Protocol Zero</h3>
                                        <p className="text-xs opacity-70 font-mono mt-1">Total AI Shutdown</p>
                                    </div>
                                </div>
                                <AlertTriangle className="w-6 h-6 opacity-50" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Subsystem Status */}
                <div className="bg-black border border-white/10 rounded-[2rem] p-8">
                    <h2 className="text-lg font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
                        <Network className="w-5 h-5 text-indigo-400" />
                        Subsystem Status
                    </h2>

                    <div className="space-y-4">
                        {subsystems.map((sub, idx) => (
                            <div key={idx} className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Database className="w-4 h-4 text-zinc-500" />
                                    <span className="text-sm font-bold text-white tracking-wide">{sub.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${
                                        sub.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse' :
                                        sub.status === 'SECURE' ? 'bg-blue-500' : 'bg-red-500'
                                    }`}></span>
                                    <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${
                                        sub.status === 'ONLINE' ? 'text-emerald-400' :
                                        sub.status === 'SECURE' ? 'text-blue-400' : 'text-red-500'
                                    }`}>{sub.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-4 bg-zinc-900/30 border border-white/5 rounded-xl">
                        <div className="flex items-start gap-3">
                            <Fingerprint className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Audit Log</h4>
                                <p className="text-[10px] font-mono text-zinc-600 leading-relaxed">
                                    Last master login: Today, 16:45:07<br/>
                                    IP: 192.168.1.1 (Encrypted)<br/>
                                    All manual overrides are logged to the immutable Quantum Ledger.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
