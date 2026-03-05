import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Fingerprint, Lock, Mail, Phone, ArrowRight, Activity, ScanFace, ShieldAlert } from 'lucide-react';
import { useData } from '../context/DataProvider';

interface LoginScreenProps {
    onLogin: (user: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const { members } = useData();
    const [activeTab, setActiveTab] = useState<'member' | 'admin'>('member');
    
    // Member State
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState(''); // Added
    const [isDeviceRegistered, setIsDeviceRegistered] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState('');

    // Admin State
    const [adminId, setAdminId] = useState('');
    const [adminPass, setAdminPass] = useState('');
    const [adminStep, setAdminStep] = useState<1 | 2>(1); // 1: Credentials, 2: 2FA/Biometric

    useEffect(() => {
        // Check if device is registered for a member
        const registeredMemberId = localStorage.getItem('registered_device_member_id');
        if (registeredMemberId) {
            setIsDeviceRegistered(true);
        }
    }, []);

    const generateRandomBuffer = (length: number) => {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return array;
    };

    const handleMemberSignupLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsAuthenticating(true);

        // Trim inputs to avoid whitespace issues
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPhone = phone.trim();
        const trimmedPass = password.trim();

        const member = members.find(m => 
            ((m.email && m.email.toLowerCase() === trimmedEmail) || 
            (m.phone && m.phone === trimmedPhone)) &&
            m.password === trimmedPass
        );
        
        if (member) {
            try {
                if (window.PublicKeyCredential) {
                    const challenge = generateRandomBuffer(32);
                    const userId = generateRandomBuffer(16);
                    
                    const credential = await navigator.credentials.create({
                        publicKey: {
                            challenge,
                            rp: { name: "Royal The Gym", id: window.location.hostname },
                            user: {
                                id: userId,
                                name: member.email || member.phone || 'member',
                                displayName: member.name
                            },
                            pubKeyCredParams: [
                                { type: "public-key", alg: -7 },
                                { type: "public-key", alg: -257 }
                            ],
                            authenticatorSelection: {
                                authenticatorAttachment: "platform",
                                userVerification: "required"
                            },
                            timeout: 60000,
                            attestation: "none"
                        }
                    });
                    
                    if (credential) {
                        const rawId = new Uint8Array((credential as PublicKeyCredential).rawId);
                        const base64Id = btoa(Array.from(rawId).map(b => String.fromCharCode(b)).join(''));
                        localStorage.setItem('webauthn_credential_id', base64Id);
                    }
                }
            } catch (e) {
                console.warn("WebAuthn not supported or failed, falling back to simple binding", e);
            }

            // Register device
            localStorage.setItem('registered_device_member_id', member.id.toString());
            setIsDeviceRegistered(true);
            setIsAuthenticating(false);
        } else {
            setError('Invalid Email or Registered Mobile Number.');
            setIsAuthenticating(false);
        }
    };

    const handleMemberBiometricLogin = async () => {
        setError('');
        setIsAuthenticating(true);
        
        const registeredMemberId = localStorage.getItem('registered_device_member_id');
        const credentialIdStr = localStorage.getItem('webauthn_credential_id');
        
        if (registeredMemberId) {
            if (credentialIdStr && window.PublicKeyCredential) {
                try {
                    const challenge = generateRandomBuffer(32);
                    const credentialId = Uint8Array.from(atob(credentialIdStr), c => c.charCodeAt(0));
                    
                    const assertion = await navigator.credentials.get({
                        publicKey: {
                            challenge,
                            rpId: window.location.hostname,
                            allowCredentials: [{
                                type: "public-key",
                                id: credentialId
                            }],
                            userVerification: "required",
                            timeout: 60000
                        }
                    });
                    
                    if (assertion) {
                        const member = members.find(m => m.id.toString() === registeredMemberId);
                        if (member) {
                            onLogin({ type: 'member', id: member.id, name: member.name, avatar: member.avatar });
                            return;
                        }
                    }
                } catch (e) {
                    console.error("Biometric login failed", e);
                    setError('Biometric authentication failed. Please try again.');
                    setIsAuthenticating(false);
                    return;
                }
            }
            
            // Fallback if WebAuthn not used or failed
            setTimeout(() => {
                const member = members.find(m => m.id.toString() === registeredMemberId);
                if (member) {
                    onLogin({ type: 'member', id: member.id, name: member.name, avatar: member.avatar });
                } else {
                    setError('Member data not found. Please re-register device.');
                    localStorage.removeItem('registered_device_member_id');
                    localStorage.removeItem('webauthn_credential_id');
                    setIsDeviceRegistered(false);
                }
                setIsAuthenticating(false);
            }, 1000);
        } else {
            setError('Device not registered.');
            setIsAuthenticating(false);
        }
    };

    const handleAdminLoginStep1 = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsAuthenticating(true);

        setTimeout(() => {
            if (adminId === 'admin' && adminPass === 'royal2026') {
                setAdminStep(2);
            } else {
                setError('Invalid Admin Credentials.');
            }
            setIsAuthenticating(false);
        }, 1000);
    };

    const handleAdminBiometric = () => {
        setError('');
        setIsAuthenticating(true);

        setTimeout(() => {
            onLogin({ type: 'admin', name: 'Super Admin', avatar: 'https://www.gravatar.com/avatar/64867450709077977977977977977977?d=https://i.ibb.co/6800735/Royal-The-Gym.png' });
            setIsAuthenticating(false);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center relative overflow-hidden font-sans selection:bg-amber-500/30">
            {/* 3D Wallpaper / Background */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1920" 
                    alt="Gym Background" 
                    className="w-full h-full object-cover opacity-40 scale-110 animate-pulse-slow"
                    referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent"></div>
            </div>

            {/* Floating 3D Elements */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-10 left-10 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full animate-blob"></div>
                <div className="absolute bottom-10 right-10 w-64 h-64 bg-orange-600/10 blur-[100px] rounded-full animate-blob animation-delay-2000"></div>
                
                {/* 3D Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md p-10 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] transform transition-all hover:scale-[1.01] duration-500 group"
            >
                {/* 3D Inner Glow */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-orange-600/20 rounded-[3rem] blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-center mb-10">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-amber-500/20 rounded-full blur-xl animate-pulse"></div>
                            <div className="relative p-6 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md">
                                <ShieldCheck className="w-14 h-14 text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                            </div>
                        </div>
                    </div>
                    
                    <h1 className="text-5xl font-black text-center italic uppercase tracking-[-0.05em] mb-10 leading-none">
                        <span className="text-white">Royal</span>
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 drop-shadow-2xl">The Gym</span>
                    </h1>

                    {/* Tabs */}
                    <div className="flex p-1.5 bg-white/5 rounded-2xl mb-10 border border-white/10 shadow-inner relative">
                        <button 
                            onClick={() => { setActiveTab('member'); setError(''); }}
                            className={`flex-1 py-3 text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 relative z-10 ${activeTab === 'member' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
                        >
                            Member
                        </button>
                        <button 
                            onClick={() => { setActiveTab('admin'); setError(''); }}
                            className={`flex-1 py-3 text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 relative z-10 ${activeTab === 'admin' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
                        >
                            Admin
                        </button>
                        <motion.div 
                            layoutId="activeTab"
                            className="absolute inset-1.5 w-[calc(50%-6px)] bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-[0_10px_20px_rgba(245,158,11,0.3)]"
                            animate={{ x: activeTab === 'member' ? 0 : '100%' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    </div>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 overflow-hidden"
                        >
                            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                            <p className="text-xs font-medium">{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {/* Member Tab */}
                    {activeTab === 'member' && (
                        <motion.div
                            key="memberTab"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {!isDeviceRegistered ? (
                                <form onSubmit={handleMemberSignupLogin} className="space-y-4">
                                    <p className="text-xs text-gray-400 mb-4 text-center">Register this device to your account.</p>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input 
                                                type="email" 
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-amber-500 transition-colors"
                                                placeholder="member@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Registered Mobile</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input 
                                                type="tel" 
                                                required
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-amber-500 transition-colors"
                                                placeholder="+91 9876543210"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Secure Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input 
                                                type="password" 
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-amber-500 transition-colors"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <motion.button 
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit" 
                                        disabled={isAuthenticating}
                                        className="w-full mt-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-3.5 rounded-xl uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-amber-900/20"
                                    >
                                        {isAuthenticating ? <Activity className="w-4 h-4 animate-spin" /> : 'Bind Device & Login'}
                                    </motion.button>
                                </form>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6">
                                    <p className="text-xs text-green-400 mb-8 text-center font-mono uppercase tracking-widest flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4" /> Device Bound Securely
                                    </p>
                                    <motion.button 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleMemberBiometricLogin}
                                        disabled={isAuthenticating}
                                        className="w-32 h-32 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center hover:bg-amber-500/20 transition-all group relative disabled:opacity-50"
                                    >
                                        {isAuthenticating ? (
                                            <ScanFace className="w-12 h-12 text-amber-400 animate-pulse" />
                                        ) : (
                                            <Fingerprint className="w-12 h-12 text-amber-400 group-hover:scale-110 transition-transform" />
                                        )}
                                        <div className="absolute inset-0 rounded-full border-2 border-amber-500/0 group-hover:border-amber-500/50 group-hover:animate-ping"></div>
                                    </motion.button>
                                    <p className="mt-6 text-xs text-gray-400 uppercase tracking-widest">Scan Biometric to Enter</p>
                                    
                                    <button 
                                        onClick={() => {
                                            localStorage.removeItem('registered_device_member_id');
                                            setIsDeviceRegistered(false);
                                        }}
                                        className="mt-8 text-[10px] text-gray-500 hover:text-white underline underline-offset-4"
                                    >
                                        Reset Device Binding
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Admin Tab */}
                    {activeTab === 'admin' && (
                        <motion.div
                            key="adminTab"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {adminStep === 1 ? (
                                <form onSubmit={handleAdminLoginStep1} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Admin ID</label>
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input 
                                                type="text" 
                                                required
                                                value={adminId}
                                                onChange={(e) => setAdminId(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500 transition-colors"
                                                placeholder="Enter Admin ID"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Secure Passcode</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input 
                                                type="password" 
                                                required
                                                value={adminPass}
                                                onChange={(e) => setAdminPass(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500 transition-colors"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <motion.button 
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit" 
                                        disabled={isAuthenticating}
                                        className="w-full mt-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-3.5 rounded-xl uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-orange-900/20"
                                    >
                                        {isAuthenticating ? <Activity className="w-4 h-4 animate-spin" /> : <>Next Step <ArrowRight className="w-4 h-4" /></>}
                                    </motion.button>
                                </form>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6">
                                    <p className="text-xs text-orange-400 mb-8 text-center font-mono uppercase tracking-widest flex items-center gap-2">
                                        <Lock className="w-4 h-4" /> Level 2 Clearance Required
                                    </p>
                                    <motion.button 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleAdminBiometric}
                                        disabled={isAuthenticating}
                                        className="w-32 h-32 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center hover:bg-orange-500/20 transition-all group relative disabled:opacity-50"
                                    >
                                        {isAuthenticating ? (
                                            <ScanFace className="w-12 h-12 text-orange-400 animate-pulse" />
                                        ) : (
                                            <ScanFace className="w-12 h-12 text-orange-400 group-hover:scale-110 transition-transform" />
                                        )}
                                        <div className="absolute inset-0 rounded-full border-2 border-orange-500/0 group-hover:border-orange-500/50 group-hover:animate-ping"></div>
                                    </motion.button>
                                    <p className="mt-6 text-xs text-gray-400 uppercase tracking-widest">Retina / Face Scan</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginScreen;
