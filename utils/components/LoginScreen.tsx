import React, { useState, useEffect } from 'react';
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

    const handleMemberSignupLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsAuthenticating(true);

        setTimeout(() => {
            const member = members.find(m => m.email === email && m.phone === phone);
            if (member) {
                // Register device
                localStorage.setItem('registered_device_member_id', member.id.toString());
                setIsDeviceRegistered(true);
                setIsAuthenticating(false);
                // Proceed to biometric
            } else {
                setError('Invalid Email or Registered Mobile Number.');
                setIsAuthenticating(false);
            }
        }, 1500);
    };

    const handleMemberBiometricLogin = () => {
        setError('');
        setIsAuthenticating(true);
        
        setTimeout(() => {
            const registeredMemberId = localStorage.getItem('registered_device_member_id');
            if (registeredMemberId) {
                const member = members.find(m => m.id.toString() === registeredMemberId);
                if (member) {
                    onLogin({ type: 'member', id: member.id, name: member.name, avatar: member.avatar });
                } else {
                    setError('Member data not found. Please re-register device.');
                    localStorage.removeItem('registered_device_member_id');
                    setIsDeviceRegistered(false);
                }
            } else {
                setError('Device not registered.');
            }
            setIsAuthenticating(false);
        }, 2000);
    };

    const handleAdminLoginStep1 = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsAuthenticating(true);

        setTimeout(() => {
            if (adminId === 'admin' && adminPass === 'royal123') {
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
            onLogin({ type: 'admin', name: 'Super Admin', avatar: 'https://i.ibb.co/6800735/Royal-The-Gym.png' });
            setIsAuthenticating(false);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden font-sans selection:bg-indigo-500/30">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 blur-[120px] rounded-full mix-blend-screen"></div>
            </div>

            <div className="relative z-10 w-full max-w-md p-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl">
                <div className="flex justify-center mb-8">
                    <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                        <ShieldCheck className="w-12 h-12 text-indigo-400" />
                    </div>
                </div>
                
                <h1 className="text-3xl font-black text-center italic uppercase tracking-tighter mb-2">Apex Security</h1>
                <p className="text-xs text-center text-gray-400 font-mono uppercase tracking-widest mb-8">Identity Verification</p>

                {/* Tabs */}
                <div className="flex p-1 bg-black/50 rounded-xl mb-8 border border-white/5">
                    <button 
                        onClick={() => { setActiveTab('member'); setError(''); }}
                        className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'member' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        Member
                    </button>
                    <button 
                        onClick={() => { setActiveTab('admin'); setError(''); }}
                        className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'admin' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        Admin
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500">
                        <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                        <p className="text-xs font-medium">{error}</p>
                    </div>
                )}

                {/* Member Tab */}
                {activeTab === 'member' && (
                    <div>
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
                                            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
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
                                            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                            placeholder="+91 9876543210"
                                        />
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isAuthenticating}
                                    className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isAuthenticating ? <Activity className="w-4 h-4 animate-spin" /> : 'Bind Device & Login'}
                                </button>
                            </form>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6">
                                <p className="text-xs text-green-400 mb-8 text-center font-mono uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> Device Bound Securely
                                </p>
                                <button 
                                    onClick={handleMemberBiometricLogin}
                                    disabled={isAuthenticating}
                                    className="w-32 h-32 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center hover:bg-indigo-500/20 hover:scale-105 transition-all group relative disabled:opacity-50"
                                >
                                    {isAuthenticating ? (
                                        <ScanFace className="w-12 h-12 text-indigo-400 animate-pulse" />
                                    ) : (
                                        <Fingerprint className="w-12 h-12 text-indigo-400 group-hover:scale-110 transition-transform" />
                                    )}
                                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/0 group-hover:border-indigo-500/50 group-hover:animate-ping"></div>
                                </button>
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
                    </div>
                )}

                {/* Admin Tab */}
                {activeTab === 'admin' && (
                    <div>
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
                                            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
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
                                            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isAuthenticating}
                                    className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-xl uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isAuthenticating ? <Activity className="w-4 h-4 animate-spin" /> : <>Next Step <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            </form>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6">
                                <p className="text-xs text-cyan-400 mb-8 text-center font-mono uppercase tracking-widest flex items-center gap-2">
                                    <Lock className="w-4 h-4" /> Level 2 Clearance Required
                                </p>
                                <button 
                                    onClick={handleAdminBiometric}
                                    disabled={isAuthenticating}
                                    className="w-32 h-32 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center hover:bg-cyan-500/20 hover:scale-105 transition-all group relative disabled:opacity-50"
                                >
                                    {isAuthenticating ? (
                                        <ScanFace className="w-12 h-12 text-cyan-400 animate-pulse" />
                                    ) : (
                                        <ScanFace className="w-12 h-12 text-cyan-400 group-hover:scale-110 transition-transform" />
                                    )}
                                    <div className="absolute inset-0 rounded-full border-2 border-cyan-500/0 group-hover:border-cyan-500/50 group-hover:animate-ping"></div>
                                </button>
                                <p className="mt-6 text-xs text-gray-400 uppercase tracking-widest">Retina / Face Scan</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginScreen;
