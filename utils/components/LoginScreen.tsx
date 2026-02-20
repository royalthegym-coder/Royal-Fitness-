
import React, { useState, useEffect, useRef } from 'react';
import { 
    ShieldCheck, Fingerprint, RefreshCw, Key, User, 
    AlertTriangle, CheckCircle, BrainCircuit, Dna, 
    ChevronRight, ScanFace, Infinity, Orbit, Smartphone,
    Lock, Unlock, Mail, ArrowRight, X, ShieldAlert, Crown
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import BrandLogo from './common/BrandLogo';
import { useData } from '../context/DataProvider';

interface LoginScreenProps {
    onLogin: (identifier: string, pass: string | null, role: 'admin' | 'member', method: string) => Promise<boolean>;
}

// 4 Main Modes of the Login Interface
type AuthMode = 'bio' | 'credentials' | 'signup' | 'recovery' | 'otp_verify' | 'recovery_verify';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const { addToast } = useToast();
    const { signupMember, members } = useData();
    
    // Core State
    const [mode, setMode] = useState<AuthMode>('bio');
    const [role, setRole] = useState<'admin' | 'member'>('member');
    
    // Inputs
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    
    // Signup specific
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newEmail, setNewEmail] = useState('');
    
    // Loading States
    const [isLoading, setIsLoading] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);

    // Boot & Bio Check
    useEffect(() => {
        // Check if biometric is enabled (simulated)
        const bioEnabled = localStorage.getItem('royal_bio_enabled') === 'true';
        if (!bioEnabled) {
            setMode('credentials');
        }
    }, []);

    // --- BIO-METRIC ENGINE ---
    const handleBiometricScan = () => {
        if (isLocked) {
            addToast("System Locked. Initiate Recovery.", "error");
            return;
        }
        
        setIsLoading(true);
        setScanProgress(0);

        const interval = setInterval(() => {
            setScanProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 5;
            });
        }, 80);

        setTimeout(async () => {
            // Simulation: 90% chance of success if not locked
            const success = Math.random() > 0.1; 
            
            if (success) {
                // Auto-login logic (simulated user)
                const bioUser = role === 'admin' ? 'admin@royal.com' : '9785300123';
                const loginSuccess = await onLogin(bioUser, null, role, 'Biometric');
                
                if (loginSuccess) {
                    addToast("Identity Matrix Verified.", "success");
                    setFailedAttempts(0);
                } else {
                    handleFailedAttempt("Bio-Mismatch");
                }
            } else {
                handleFailedAttempt("Biometric Scan Failed");
                setScanProgress(0);
            }
            setIsLoading(false);
        }, 2000);
    };

    const handleFailedAttempt = (reason: string) => {
        const newFailCount = failedAttempts + 1;
        setFailedAttempts(newFailCount);
        
        if (newFailCount >= 3) {
            setIsLocked(true);
            setMode('recovery');
            addToast("SECURITY LOCKDOWN: Multi-Factor Recovery Required.", "error");
        } else {
            addToast(`${reason}. Retries left: ${3 - newFailCount}`, "error");
        }
    };

    // --- CREDENTIAL LOGIN ---
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLocked) return;

        setIsLoading(true);
        
        // Check for Pending Status BEFORE logging in
        const targetMember = members.find(m => m.email === identifier || m.phone === identifier);
        
        if (targetMember && targetMember.status === 'Pending') {
            setIsLoading(false);
            addToast("Access Denied: Clearance Pending by Admin.", "info");
            return;
        }

        const success = await onLogin(identifier, password, role, 'Password');
        
        if (!success) {
            handleFailedAttempt("Invalid Shards");
        } else {
            localStorage.setItem('royal_bio_enabled', 'true'); // Enable bio for next time
            addToast("Continuum Uplink Established.", "success");
        }
        setIsLoading(false);
    };

    // --- SIGNUP FLOW ---
    const handleSignupStart = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newEmail || !newPhone) {
            addToast("All fields required for genetic profiling.", "error");
            return;
        }
        
        setIsLoading(true);
        // Simulate OTP Send
        setTimeout(() => {
            setIsLoading(false);
            setMode('otp_verify');
            addToast("OTP Sent to Mobile. (Sim: 1234)", "info");
        }, 1500);
    };

    const handleOtpVerify = async () => {
        if (otp !== '1234') {
            addToast("Invalid OTP Sequence.", "error");
            return;
        }
        
        setIsLoading(true);
        await signupMember({ name: newName, email: newEmail, phone: newPhone });
        
        setIsLoading(false);
        setMode('credentials');
        addToast("Profile Created. Status: PENDING ADMIN APPROVAL.", "success");
        setOtp('');
    };

    // --- RECOVERY FLOW ---
    const handleRecoveryInit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate sending dual-factor auth
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setMode('recovery_verify');
            addToast("Dual-Factor OTPs Sent to Email & Mobile.", "info");
        }, 2000);
    };

    const handleRecoveryFinalize = (e: React.FormEvent) => {
        e.preventDefault();
        if (otp === '1234') { // Simulating Mobile + Email combo success
            setIsLocked(false);
            setFailedAttempts(0);
            setMode('credentials');
            addToast("Lockdown Lifted. Identity Restored.", "success");
        } else {
            addToast("Incorrect Recovery Codes.", "error");
        }
    };

    return (
        <div className="min-h-screen w-screen bg-[#020202] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            
            {/* LUXURY BACKGROUND IMAGE & OVERLAY */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2560&auto=format&fit=crop" 
                    alt="Luxury Gym" 
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40"></div>
                
                {/* Animated Particles */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-amber-600/20 blur-[100px] rounded-full animate-pulse"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-600/20 blur-[120px] rounded-full animate-pulse delay-700"></div>
                </div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* BRAND HEADER & MOTIVATION */}
                <div className="text-center mb-10 animate-fade-in relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-cyan-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    
                    <div className="relative">
                        <div className={`w-24 h-24 rounded-[2rem] mx-auto mb-6 flex items-center justify-center shadow-2xl border-2 backdrop-blur-xl transform group-hover:scale-105 transition-all duration-500 ${isLocked ? 'bg-red-950/40 border-red-500' : 'bg-black/40 border-white/10'}`}>
                            {isLocked ? <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse" /> : <Crown className="w-10 h-10 text-amber-500" />}
                        </div>
                        
                        <h2 className="text-sm font-bold text-amber-500 tracking-[0.3em] uppercase mb-2 animate-pulse">Welcome To</h2>
                        <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-4 drop-shadow-lg">
                            Royal <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">The Gym</span>
                        </h1>
                        <p className={`text-[10px] font-mono tracking-[0.4em] uppercase font-bold ${isLocked ? 'text-red-500' : 'text-gray-300'}`}>
                            {isLocked ? 'SECURITY LOCKDOWN ACTIVE' : 'WHERE LEGENDS ARE FORGED'}
                        </p>
                    </div>
                </div>

                <div className={`backdrop-blur-xl border rounded-[3rem] p-8 shadow-[0_0_60px_rgba(0,0,0,0.5)] overflow-hidden relative transition-all duration-500 ${isLocked ? 'bg-red-950/20 border-red-500/30' : 'bg-black/60 border-white/10'}`}>
                    
                    {/* MODE: BIOMETRIC SCANNER */}
                    {mode === 'bio' && (
                        <div className="text-center py-6 animate-scale-in">
                            <div 
                                onClick={handleBiometricScan}
                                className="w-40 h-40 mx-auto bg-black/40 rounded-full border-4 border-cyan-500/30 flex items-center justify-center cursor-pointer hover:border-cyan-400 hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] transition-all group relative overflow-hidden"
                            >
                                {isLoading ? (
                                    <>
                                        <ScanFace className="w-20 h-20 text-cyan-500 animate-pulse" />
                                        <div className="absolute bottom-0 left-0 w-full bg-cyan-500/20 transition-all duration-100" style={{ height: `${scanProgress}%` }}></div>
                                        <div className="absolute top-0 w-full h-1 bg-cyan-400 shadow-[0_0_20px_cyan] animate-scan"></div>
                                    </>
                                ) : (
                                    <Fingerprint className="w-20 h-20 text-gray-400 group-hover:text-white transition-colors" />
                                )}
                            </div>
                            
                            <h3 className="text-white font-black uppercase text-lg mt-8 mb-2 tracking-widest">
                                {isLoading ? 'Verifying DNA...' : 'Touch to Enter'}
                            </h3>
                            <p className="text-gray-400 text-xs font-mono">Secure Biometric Uplink</p>

                            <div className="mt-8 flex justify-center gap-4">
                                <button onClick={() => setMode('credentials')} className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider flex items-center gap-2 transition-colors">
                                    <Key className="w-3 h-3" /> Passcode
                                </button>
                                <span className="text-gray-600">|</span>
                                <button onClick={() => setMode('signup')} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider flex items-center gap-2 transition-colors">
                                    New User
                                </button>
                            </div>
                        </div>
                    )}

                    {/* MODE: CREDENTIALS */}
                    {mode === 'credentials' && (
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
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-12 py-4 text-white focus:border-indigo-500 outline-none transition-all placeholder-gray-600 font-bold text-sm"
                                            placeholder="Neural ID (Email/Phone)"
                                        />
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
                                    </div>
                                    <div className="group relative">
                                        <input 
                                            type="password" value={password} onChange={e => setPassword(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-12 py-4 text-white focus:border-indigo-500 outline-none transition-all placeholder-gray-600 font-bold text-sm"
                                            placeholder="Cipher Key"
                                        />
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
                                    </div>
                                </div>
                                
                                <button disabled={isLoading} className="w-full bg-white text-black font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-400 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 mt-4">
                                     {isLoading ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Lock className="w-4 h-4" />}
                                     {isLoading ? 'DECRYPTING...' : 'INITIATE UPLINK'}
                                </button>
                            </form>

                            <div className="mt-6 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                <button onClick={() => setMode('bio')} className="hover:text-white flex items-center gap-1 transition-colors"><Fingerprint className="w-3 h-3"/> Bio-Scan</button>
                                <button onClick={() => setMode('recovery')} className="text-red-400 hover:text-red-300 transition-colors">Forgot Cipher?</button>
                            </div>
                        </div>
                    )}

                    {/* MODE: SIGNUP */}
                    {mode === 'signup' && (
                        <div className="animate-slide-up">
                            <h3 className="text-xl font-black text-white italic uppercase mb-6">Initialize New Node</h3>
                            <form onSubmit={handleSignupStart} className="space-y-4">
                                <input required type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold outline-none focus:border-cyan-500" placeholder="Full Designation" />
                                <input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold outline-none focus:border-cyan-500" placeholder="Comms Channel (Email)" />
                                <input required type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold outline-none focus:border-cyan-500" placeholder="Signal Frequency (Phone)" />
                                
                                <button disabled={isLoading} className="w-full bg-cyan-600 text-black font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[10px] hover:bg-cyan-500 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50">
                                     {isLoading ? <RefreshCw className="w-4 h-4 animate-spin"/> : <ArrowRight className="w-4 h-4" />}
                                     {isLoading ? 'GENERATING OTP...' : 'REQUEST ACCESS'}
                                </button>
                            </form>
                            <button onClick={() => setMode('bio')} className="mt-6 w-full text-[10px] font-bold text-gray-500 uppercase hover:text-white transition-colors">Cancel</button>
                        </div>
                    )}

                    {/* MODE: OTP VERIFY (SIGNUP) */}
                    {mode === 'otp_verify' && (
                        <div className="text-center animate-fade-in">
                            <Smartphone className="w-16 h-16 text-cyan-400 mx-auto mb-6 animate-pulse" />
                            <h3 className="text-xl font-black text-white italic uppercase mb-2">Verify Signal</h3>
                            <p className="text-gray-500 text-xs mb-6">Enter the One-Time-Protocol sent to your device.</p>
                            
                            <input 
                                type="text" 
                                value={otp} 
                                onChange={e => setOtp(e.target.value)} 
                                className="w-full bg-black/40 border border-cyan-500/50 rounded-2xl p-4 text-center text-2xl text-white font-mono tracking-[0.5em] outline-none focus:border-cyan-400 mb-6" 
                                maxLength={4}
                                placeholder="----"
                            />
                            
                            <button onClick={handleOtpVerify} disabled={isLoading} className="w-full bg-cyan-600 text-black font-black py-4 rounded-2xl uppercase tracking-[0.2em] text-[10px] hover:bg-cyan-500 transition-all shadow-lg">
                                {isLoading ? 'FINALIZING...' : 'CONFIRM UPLINK'}
                            </button>
                        </div>
                    )}

                    {/* MODE: RECOVERY (LOCKED) */}
                    {(mode === 'recovery' || mode === 'recovery_verify') && (
                        <div className="animate-shake">
                            <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-2xl mb-6 flex items-center gap-4">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                                <div>
                                    <h4 className="text-red-500 font-black uppercase text-sm">Security Lockdown</h4>
                                    <p className="text-red-300 text-[10px] font-mono">Dual-Key Authentication Required</p>
                                </div>
                            </div>
                            
                            {mode === 'recovery' ? (
                                <form onSubmit={handleRecoveryInit} className="space-y-4">
                                    <p className="text-gray-400 text-xs text-center mb-4">Provide identity vectors to initiate system restore.</p>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"/>
                                        <input type="email" required className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-sm font-bold outline-none focus:border-red-500" placeholder="Registered Email" />
                                    </div>
                                    <div className="relative">
                                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"/>
                                        <input type="tel" required className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-sm font-bold outline-none focus:border-red-500" placeholder="Registered Mobile" />
                                    </div>
                                    <button disabled={isLoading} className="w-full bg-red-600 text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[10px] hover:bg-red-500 transition-all shadow-red-900/50 shadow-lg flex items-center justify-center gap-2">
                                        {isLoading ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Unlock className="w-4 h-4"/>}
                                        SEND RECOVERY CODES
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleRecoveryFinalize} className="space-y-4">
                                    <p className="text-gray-400 text-xs text-center mb-2">Enter the combined code sent to both devices.</p>
                                    <input 
                                        type="text" 
                                        value={otp} 
                                        onChange={e => setOtp(e.target.value)} 
                                        className="w-full bg-black/40 border border-red-500/50 rounded-2xl p-4 text-center text-2xl text-red-500 font-mono tracking-[0.5em] outline-none mb-4" 
                                        maxLength={4}
                                        placeholder="----"
                                    />
                                    <input 
                                        type="password" 
                                        required 
                                        placeholder="Set New Cipher Key" 
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold outline-none focus:border-red-500" 
                                    />
                                    <button className="w-full bg-white text-black font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[10px] hover:bg-red-500 hover:text-white transition-all shadow-lg">
                                        OVERRIDE LOCKDOWN
                                    </button>
                                </form>
                            )}
                            
                            {!isLocked && mode === 'recovery' && (
                                <button onClick={() => setMode('bio')} className="mt-6 w-full text-[10px] font-bold text-gray-500 uppercase hover:text-white transition-colors">Cancel Recovery</button>
                            )}
                        </div>
                    )}

                </div>

                <div className="mt-8 text-center text-[10px] font-black text-gray-600 uppercase tracking-widest italic opacity-60">
                    Sovereign Federation // Node Jhunjhunu-01
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
