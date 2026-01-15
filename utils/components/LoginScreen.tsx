
import React, { useState } from 'react';
import { GYM_INFO } from '../../constants';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { MailIcon } from './icons/MailIcon';
import { sendWhatsAppOTP } from '../../lib/whatsapp';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { FacebookIcon, InstagramIcon, TwitterIcon } from './icons/SocialIcons';

interface LoginScreenProps {
    onLogin: (identifier: string, pass: string | null, role: 'admin' | 'member', method?: 'password' | 'otp') => boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [loginMethod, setLoginMethod] = useState<'password' | 'otp' | 'email'>('otp');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [role, setRole] = useState<'admin' | 'member'>('admin');
    
    // GDPR Consent
    const [consent, setConsent] = useState(false);

    const handleSendWhatsAppOTP = async () => {
        if (!identifier || identifier.length < 10) {
            setError('Please enter a valid phone number.');
            return;
        }
        setError('');
        setIsLoading(true);
        
        // Generate a random 6-digit OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(code);
        
        try {
            await sendWhatsAppOTP(identifier, code);
            setIsOtpSent(true);
            alert(`[DEMO] WhatsApp OTP Sent: ${code}`); // For demo purposes as user can't receive actual WA
        } catch (e) {
            setError('Failed to send OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendEmailOTP = async () => {
        if (!identifier || !identifier.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }
        setError('');
        setIsLoading(true);
        
        // Generate a random 6-digit OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(code);
        
        // Simulate email sending delay
        setTimeout(() => {
            setIsOtpSent(true);
            setIsLoading(false);
            alert(`[DEMO] Email OTP Sent to ${identifier}: ${code}`);
        }, 1500);
    };

    const handleVerifyOTP = () => {
        if (!consent) {
            setError("You must agree to the Privacy Policy & Terms.");
            return;
        }
        if (otp === generatedOtp || otp === '123456') { // Backdoor for demo
            const success = onLogin(identifier, null, role, 'otp');
            if (!success) setError('Account not found for this identifier.');
        } else {
            setError('Invalid OTP. Please try again.');
        }
    };

    const handleSubmitPassword = () => {
        if (!consent) {
            setError("You must agree to the Privacy Policy & Terms.");
            return;
        }
        setError('');
        const success = onLogin(identifier, password, role, 'password');
        if (!success) {
            setError('Invalid credentials.');
        }
    };

    // Reset state when switching methods
    const switchMethod = (method: 'password' | 'otp' | 'email') => {
        setLoginMethod(method);
        setIdentifier('');
        setPassword('');
        setOtp('');
        setIsOtpSent(false);
        setError('');
        setGeneratedOtp(null);
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
            {/* 3D Cinematic Background */}
            <div 
                className="absolute top-0 left-0 w-full h-full z-0"
                style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                {/* Dark Overlay for readability */}
                <div className="absolute inset-0 bg-gray-900/80 bg-gradient-to-t from-black via-gray-900/60 to-black/80 backdrop-blur-[2px]"></div>
            </div>

            {/* Floating Particles/Glow (Simulated 3D) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
            </div>

            <div className="text-center mb-8 z-10 animate-fade-in-up">
                <div className="inline-block p-4 rounded-full bg-black/40 backdrop-blur-md border border-amber-500/30 mb-4 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600 tracking-tighter drop-shadow-sm">
                        ROYAL
                    </h1>
                    <span className="text-white text-xs font-bold tracking-[0.5em] uppercase block mt-1">The Gym</span>
                </div>
                <p className="text-gray-300 text-sm tracking-widest uppercase font-medium drop-shadow-md">Elite Fitness Management System</p>
            </div>

            <div className="w-full max-w-md bg-black/40 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/10 z-10 relative overflow-hidden group">
                {/* Glass Shine Effect */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

                {/* Role Switcher */}
                <div className="flex bg-black/50 rounded-xl p-1 mb-8 border border-white/5 relative z-20">
                    <button 
                        onClick={() => { setRole('admin'); switchMethod(loginMethod); }}
                        className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${role === 'admin' ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        ADMIN PANEL
                    </button>
                    <button 
                        onClick={() => { setRole('member'); switchMethod(loginMethod); }}
                        className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${role === 'member' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        MEMBER ZONE
                    </button>
                </div>

                {/* Login Method Tabs */}
                <div className="flex justify-center space-x-4 mb-8 border-b border-white/10 pb-1 relative z-20 overflow-x-auto">
                    <button onClick={() => switchMethod('otp')} className={`text-xs sm:text-sm font-bold pb-3 transition-all relative whitespace-nowrap ${loginMethod === 'otp' ? 'text-white' : 'text-gray-500'}`}>
                        WhatsApp OTP
                        {loginMethod === 'otp' && <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-green-500 shadow-[0_0_10px_#22c55e]"></span>}
                    </button>
                    <button onClick={() => switchMethod('email')} className={`text-xs sm:text-sm font-bold pb-3 transition-all relative whitespace-nowrap ${loginMethod === 'email' ? 'text-white' : 'text-gray-500'}`}>
                        Email OTP
                        {loginMethod === 'email' && <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-purple-500 shadow-[0_0_10px_#a855f7]"></span>}
                    </button>
                    <button onClick={() => switchMethod('password')} className={`text-xs sm:text-sm font-bold pb-3 transition-all relative whitespace-nowrap ${loginMethod === 'password' ? 'text-white' : 'text-gray-500'}`}>
                        Password
                        {loginMethod === 'password' && <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_10px_#3b82f6]"></span>}
                    </button>
                </div>

                <form onSubmit={(e) => e.preventDefault()} className="space-y-6 relative z-20">
                    {(loginMethod === 'otp' || loginMethod === 'email') ? (
                        <>
                            {!isOtpSent ? (
                                <div className="animate-fade-in">
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
                                        {loginMethod === 'otp' ? 'Mobile Number' : 'Email Address'}
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            {loginMethod === 'otp' ? (
                                                <WhatsAppIcon className="h-5 w-5 text-green-500 group-focus-within:text-green-400 transition-colors" />
                                            ) : (
                                                <MailIcon className="h-5 w-5 text-purple-500 group-focus-within:text-purple-400 transition-colors" />
                                            )}
                                        </div>
                                        <input
                                            type={loginMethod === 'otp' ? "tel" : "email"}
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            className="block w-full pl-12 pr-4 py-4 border border-white/10 rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-black/50 text-white placeholder-gray-600 transition-all outline-none backdrop-blur-sm"
                                            placeholder={loginMethod === 'otp' ? "9876543210" : "member@example.com"}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={loginMethod === 'otp' ? handleSendWhatsAppOTP : handleSendEmailOTP}
                                        disabled={isLoading}
                                        className={`mt-6 w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(22,163,74,0.3)] text-sm font-bold text-white transition-all disabled:opacity-50 transform hover:scale-[1.02] ${
                                            loginMethod === 'otp' 
                                            ? 'bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500' 
                                            : 'bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500'
                                        }`}
                                    >
                                        {isLoading ? 'Sending...' : 'Get Access Code'}
                                    </button>
                                </div>
                            ) : (
                                <div className="animate-fade-in">
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Security Code</label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="block w-full px-4 py-4 border border-white/10 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 bg-black/50 text-white text-center text-3xl tracking-[0.5em] font-mono shadow-inner outline-none"
                                        placeholder="••••••"
                                        maxLength={6}
                                    />
                                    <div className="flex justify-between items-center mt-3">
                                        <button type="button" onClick={() => setIsOtpSent(false)} className="text-xs text-gray-400 hover:text-white transition-colors">Change Contact</button>
                                        <span className="text-xs text-amber-500/80">Resend available</span>
                                    </div>
                                    
                                    <button
                                        type="button"
                                        onClick={handleVerifyOTP}
                                        className="mt-6 w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] text-sm font-bold text-gray-900 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 transition-all transform hover:scale-[1.02]"
                                    >
                                        Verify & Enter
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="animate-fade-in space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">ID / Email</label>
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="block w-full px-4 py-4 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-black/50 text-white outline-none backdrop-blur-sm transition-all"
                                    placeholder={role === 'admin' ? 'admin@royal.com' : 'user@example.com'}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full px-4 py-4 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-black/50 text-white outline-none backdrop-blur-sm transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleSubmitPassword}
                                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] text-sm font-bold text-white bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 transition-all transform hover:scale-[1.02]"
                            >
                                Authenticate
                            </button>
                        </div>
                    )}

                    {error && <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/30 text-red-200 text-xs font-bold text-center animate-shake backdrop-blur-md">{error}</div>}

                    {/* GDPR Consent */}
                    <div className="flex items-start pt-2">
                        <div className="flex items-center h-5">
                            <input
                                id="consent"
                                type="checkbox"
                                checked={consent}
                                onChange={(e) => setConsent(e.target.checked)}
                                className="focus:ring-amber-500 h-4 w-4 text-amber-500 border-gray-600 rounded bg-gray-800"
                            />
                        </div>
                        <div className="ml-3 text-xs">
                            <label htmlFor="consent" className="font-medium text-gray-400 hover:text-gray-300 transition-colors cursor-pointer">
                                I agree to the Privacy Policy & Terms.
                            </label>
                        </div>
                    </div>
                </form>
            </div>
            
            {/* Social Links Footer */}
            <div className="mt-8 flex flex-col items-center space-y-4 z-10">
                <div className="flex justify-center space-x-6 bg-black/30 p-3 rounded-full backdrop-blur-sm border border-white/5">
                    <a href={GYM_INFO.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors transform hover:scale-110">
                        <InstagramIcon className="w-5 h-5" />
                    </a>
                    <a href={GYM_INFO.socials.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors transform hover:scale-110">
                        <FacebookIcon className="w-5 h-5" />
                    </a>
                    <a href={GYM_INFO.socials.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors transform hover:scale-110">
                        <TwitterIcon className="w-5 h-5" />
                    </a>
                </div>
                
                <div className="flex items-center justify-center space-x-2 text-gray-500 text-[10px] font-mono tracking-widest uppercase">
                    <ShieldCheckIcon className="w-3 h-3" />
                    <span>Secured by Royal Core v4.0</span>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
