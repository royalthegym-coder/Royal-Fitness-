
import React, { useState, useEffect, useRef } from 'react';
import { GYM_INFO } from '../../constants';
import { UserIcon } from './icons/UserIcon';
import { LockIcon } from './icons/LockIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { FingerPrintIcon } from './icons/FingerPrintIcon';
import BrandLogo from './common/BrandLogo';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon'; 
import { BotIcon } from './icons/BotIcon';

interface LoginScreenProps {
    onLogin: (identifier: string, pass: string | null, role: 'admin' | 'member', method: 'password' | 'otp' | 'biometric') => Promise<boolean>;
    onBack?: () => void;
}

const MatrixRain = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const columns = Math.floor(canvas.width / 20);
        const drops: number[] = Array(columns).fill(1);
        const chars = "ROYALGYM01ABCDEFΩΣπμ"; // Vedic/Greek mix

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#0F0'; // Hacker Green
            ctx.font = '15px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * 20, drops[i] * 20);

                if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const interval = setInterval(draw, 50);
        return () => clearInterval(interval);
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-20 pointer-events-none" />;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onBack }) => {
    const [role, setRole] = useState<'admin' | 'member'>('member'); 
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    
    // Security & Animation States
    const [authStage, setAuthStage] = useState<'idle' | 'scanning' | 'handshake' | 'success' | 'failed'>('idle');
    const [scanMessage, setScanMessage] = useState('');
    const [handshakeProgress, setHandshakeProgress] = useState(0);
    
    // Typing effect for system logs
    const [systemLogs, setSystemLogs] = useState<string[]>([]);
    
    const addSystemLog = async (msg: string) => {
        setSystemLogs(prev => [...prev, `> ${msg}`].slice(-5));
        await new Promise(r => setTimeout(r, 400));
    };

    const runNeuralHandshake = async () => {
        setAuthStage('handshake');
        for (let i = 0; i <= 100; i += 10) {
            setHandshakeProgress(i);
            await new Promise(r => setTimeout(r, 100));
        }
    };

    const runSecurityScan = async () => {
        setAuthStage('scanning');
        setSystemLogs([]);
        
        await addSystemLog("Initializing Neural Bio-Identity Gateway...");
        await addSystemLog(`Geo-Lock: ${GYM_INFO.coordinates.latitude.toFixed(4)} | ${GYM_INFO.coordinates.longitude.toFixed(4)}`);
        await addSystemLog("Verifying Digital Signature...");
        await addSystemLog("Encrypting Handshake (AES-256)...");
        await addSystemLog("Syncing with Future-Tech Node...");
        
        await runNeuralHandshake();
        return true;
    };

    const handleBiometricAuth = async () => {
        await runSecurityScan();
        // Simulate processing
        setTimeout(async () => {
            const success = await onLogin('9876543210', null, 'member', 'biometric'); 
            if (!success) {
                setAuthStage('failed');
                setScanMessage("Bio-Identity Mismatch. Access Denied.");
            } else {
                setAuthStage('success');
            }
        }, 500);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await runSecurityScan();

        try {
            const success = await onLogin(
                identifier, 
                password || null, 
                role, 
                password ? 'password' : 'otp'
            );

            if (!success) {
                setAuthStage('failed');
                setScanMessage("Credentials Invalid. Neural Link Broken.");
            } else {
                setAuthStage('success');
            }
        } catch (err) {
            setAuthStage('failed');
            setScanMessage("System Error. Handshake Failed.");
        }
    };

    return (
        <div className="min-h-screen w-screen flex flex-col justify-center items-center relative overflow-hidden bg-[#020202] font-sans selection:bg-amber-500/30">
            <MatrixRain />
            
            {/* Vignette & Scanlines */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_90%)] z-10 pointer-events-none"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20"></div>

            {/* --- SCANNING OVERLAY --- */}
            {(authStage === 'scanning' || authStage === 'handshake') && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
                    <div className="text-center w-full max-w-md p-6">
                        {/* Pulse Animation */}
                        <div className="relative w-32 h-32 mx-auto mb-8">
                            <div className="absolute inset-0 border-4 border-t-cyan-500 border-r-transparent border-b-cyan-500 border-l-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-4 border-2 border-cyan-400/50 rounded-full animate-ping"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <ShieldCheckIcon className="w-10 h-10 text-cyan-400" />
                            </div>
                        </div>
                        
                        {authStage === 'handshake' && (
                            <div className="mb-6 w-full max-w-xs mx-auto">
                                <div className="flex justify-between text-xs text-cyan-500 mb-1 font-mono">
                                    <span>NEURAL UPLINK</span>
                                    <span>{handshakeProgress}%</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                                    <div className="h-full bg-cyan-500 transition-all duration-100" style={{ width: `${handshakeProgress}%` }}></div>
                                </div>
                            </div>
                        )}

                        <div className="font-mono text-xs text-cyan-500 text-left bg-black/50 p-4 rounded border border-cyan-500/30 h-40 overflow-hidden flex flex-col justify-end shadow-2xl relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/50 animate-scan-fast"></div>
                            {systemLogs.map((log, i) => (
                                <div key={i} className="animate-fade-in">{log}</div>
                            ))}
                            <div className="w-2 h-4 bg-cyan-500 animate-pulse inline-block ml-1"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MAIN LOGIN CARD --- */}
            <div className="z-20 w-full max-w-md px-4 flex flex-col items-center">
                
                <div className="mb-8 text-center transform hover:scale-105 transition-transform duration-500 group cursor-default">
                     <BrandLogo size="2xl" />
                     <div className="mt-2 flex items-center justify-center gap-2">
                        <div className="h-1 w-1 bg-green-500 rounded-full animate-ping"></div>
                        <p className="text-gray-500 text-[10px] font-bold tracking-[0.4em] uppercase group-hover:text-green-500 transition-colors">ROYAL NEURAL OS 2.5</p>
                     </div>
                </div>

                <div className="w-full bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-1 shadow-2xl relative overflow-hidden group">
                    {/* Border Glow Animation */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
                    
                    <div className="bg-[#0a0a0a] rounded-[1.3rem] p-8 relative z-10 h-full">
                        
                        {/* Role Tabs */}
                        <div className="flex bg-gray-800/50 rounded-xl p-1 mb-8 border border-white/5">
                            <button 
                                onClick={() => { setRole('member'); setAuthStage('idle'); setIdentifier(''); }}
                                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${role === 'member' ? 'bg-amber-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                <UserIcon className="w-4 h-4" /> Agent
                            </button>
                            <button 
                                onClick={() => { setRole('admin'); setAuthStage('idle'); setIdentifier(''); }}
                                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${role === 'admin' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                <LockIcon className="w-4 h-4" /> Admin
                            </button>
                        </div>

                        {/* Biometric Button (Member Only) */}
                        {role === 'member' && (
                            <div className="mb-6 relative group/bio">
                                <button 
                                    onClick={handleBiometricAuth}
                                    className="w-full h-24 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex flex-col items-center justify-center transition-all hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                                    <FingerPrintIcon className="w-10 h-10 text-gray-500 group-hover/bio:text-amber-500 transition-colors mb-2 relative z-10" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover/bio:text-white relative z-10">Scan Bio-Print</span>
                                </button>
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-amber-500/50 blur-sm transform scale-x-0 group-hover/bio:scale-x-100 transition-transform duration-500"></div>
                            </div>
                        )}

                        <div className="flex items-center gap-4 my-6 opacity-50">
                            <div className="h-px bg-gray-700 flex-1"></div>
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Manual Override</span>
                            <div className="h-px bg-gray-700 flex-1"></div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="group/input">
                                <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 ml-2 block group-hover/input:text-cyan-500 transition-colors">Identifier</label>
                                <div className="relative">
                                    <input 
                                        type={role === 'admin' ? "text" : "tel"} 
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        className="w-full bg-black/50 border border-gray-700 rounded-xl px-5 py-4 text-white text-sm focus:outline-none focus:border-cyan-500 transition-all pl-12 placeholder-gray-700"
                                        placeholder={role === 'admin' ? "Enter Admin Pulse" : "Mobile Number"}
                                    />
                                    <div className="absolute left-4 top-4 text-gray-600 group-hover/input:text-white transition-colors">
                                        {role === 'admin' ? <BotIcon className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                                    </div>
                                </div>
                            </div>

                            <div className="group/input">
                                <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 ml-2 block group-hover/input:text-cyan-500 transition-colors">Passcode</label>
                                <div className="relative">
                                    <input 
                                        type="password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-black/50 border border-gray-700 rounded-xl px-5 py-4 text-white text-sm focus:outline-none focus:border-cyan-500 transition-all pl-12 placeholder-gray-700 font-mono tracking-widest"
                                        placeholder="••••••••"
                                    />
                                    <div className="absolute left-4 top-4 text-gray-600 group-hover/input:text-white transition-colors">
                                        <LockIcon className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>

                            {authStage === 'failed' && (
                                <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-lg flex items-center justify-center animate-shake">
                                    <ShieldCheckIcon className="w-4 h-4 text-red-500 mr-2" />
                                    <p className="text-xs text-red-400 font-bold uppercase tracking-wide">{scanMessage}</p>
                                </div>
                            )}

                            <button 
                                type="submit"
                                disabled={authStage === 'scanning' || authStage === 'handshake'}
                                className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 relative overflow-hidden group/btn mt-4 ${
                                    role === 'admin' 
                                    ? 'bg-cyan-800 hover:bg-cyan-700 text-white' 
                                    : 'bg-white text-black hover:bg-gray-200'
                                }`}
                            >
                                <div className="absolute inset-0 bg-white/20 skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                                {authStage === 'scanning' || authStage === 'handshake' ? (
                                    <>
                                        <SparkleIcon className="w-4 h-4 animate-spin" /> 
                                        NEURAL SCAN ACTIVE...
                                    </>
                                ) : (
                                    <>
                                        {role === 'admin' ? 'INITIALIZE CORE' : 'ESTABLISH LINK'}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="mt-8 flex flex-col items-center gap-2 opacity-40 hover:opacity-80 transition-opacity cursor-pointer">
                    <div className="flex gap-4 text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                        <span className="flex items-center"><ShieldCheckIcon className="w-3 h-3 mr-1"/> ENCRYPTED CHANNEL</span>
                        <span>•</span>
                        <span className="flex items-center"><BotIcon className="w-3 h-3 mr-1"/> SENTINEL AI</span>
                    </div>
                    {onBack && (
                        <button onClick={onBack} className="text-gray-500 hover:text-white text-[10px] underline tracking-wider mt-2">
                            ABORT LOGIN
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
