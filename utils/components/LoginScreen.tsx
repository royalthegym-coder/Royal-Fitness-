
import React, { useState, useEffect } from 'react';
import { GYM_INFO } from '../../constants';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { MailIcon } from './icons/MailIcon';
import { sendWhatsAppOTP } from '../../lib/whatsapp';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { FacebookIcon, InstagramIcon, TwitterIcon } from './icons/SocialIcons';
import { UserIcon } from './icons/UserIcon';
import { LockIcon } from './icons/LockIcon';
import Card from './common/Card';

interface LoginScreenProps {
    onLogin: (identifier: string, pass: string | null, role: 'admin' | 'member', method: 'password' | 'otp') => boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [loginMethod, setLoginMethod] = useState<'password' | 'otp' | 'email'>('otp');
    const [role, setRole] = useState<'admin' | 'member'>('admin');
    
    // Form State
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [otpInput, setOtpInput] = useState('');
    
    // Logic State
    const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [timer, setTimer] = useState(0);
    const [consent, setConsent] = useState(false);

    // Validators
    const isValidPhone = (phone: string) => /^[6-9]\d{9}$/.test(phone);
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // Timer Countdown
    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleSendOTP = async () => {
        setError('');
        
        // Validation based on method
        if (loginMethod === 'otp' && !isValidPhone(identifier)) {
            setError('Please enter a valid 10-digit mobile number.');
            return;
        }
        if (loginMethod === 'email' && !isValidEmail(identifier)) {
            setError('Please enter a valid email address.');
            return;
        }

        setIsLoading(true);
        
        // Generate secure 6-digit OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        try {
            // Simulate API Latency
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (loginMethod === 'otp') {
                await sendWhatsAppOTP(identifier, code);
                // For demo/final stage testing purposes, we alert the OTP so the user can login
                // In production, this alert would be removed.
                alert(`[SECURE SMS GATEWAY]\nOTP for ${identifier}: ${code}`); 
            } else {
                alert(`[SECURE EMAIL GATEWAY]\nOTP sent to ${identifier}: ${code}`);
            }

            setGeneratedOtp(code);
            setIsOtpSent(true);
            setTimer(60); // 60 seconds cooldown
        } catch (e) {
            setError('Gateway Error: Could not send OTP. Try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAndLogin = () => {
        if (!consent) {
            setError("Please accept the Terms & Privacy Policy.");
            return;
        }

        setIsLoading(true);
        setError('');

        setTimeout(() => {
            if (loginMethod === 'password') {
                // Password Login Flow
                if (!identifier || !password) {
                    setError("All fields are required.");
                    setIsLoading(false);
                    return;
                }
                const success = onLogin(identifier, password, role, 'password');
                if (!success) setError("Invalid Credentials. Access Denied.");
            } else {
                // OTP Login Flow
                if (otpInput === generatedOtp) {
                    const success = onLogin(identifier, null, role, 'otp');
                    if (!success) {
                        setError(role === 'admin' ? "Access Denied: Not an Admin Account." : "Member not found. Contact Gym Admin.");
                        setIsOtpSent(false); // Reset to allow retry with different number
                        setOtpInput('');
                        setGeneratedOtp(null);
                    }
                } else {
                    setError("Incorrect OTP. Please check and try again.");
                }
            }
            setIsLoading(false);
        }, 1000);
    };

    const handleSwitchRole = (newRole: 'admin' | 'member') => {
        setRole(newRole);
        setIdentifier('');
        setPassword('');
        setOtpInput('');
        setGeneratedOtp(null);
        setIsOtpSent(false);
        setError('');
        // Default methods per role preference
        setLoginMethod(newRole === 'admin' ? 'email' : 'otp');
    };

    return (
        <div className="min-h-screen w-screen flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans bg-gray-900">
            {/* Background */}
            <div 
                className="absolute top-0 left-0 w-full h-full z-0 bg-cover bg-center"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop')` }}
            >
                <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm"></div>
            </div>
            <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/10 via-gray-900 to-black opacity-30"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-50"></div>

            {/* Brand Header */}
            <div className="text-center mb-8 z-10 animate-fade-in-up">
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-black/60 backdrop-blur-md border border-amber-500/30 mb-4 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                    <div className="mr-3 bg-amber-500 rounded-full p-2">
                        <ShieldCheckIcon className="w-6 h-6 text-black" />
                    </div>
                    <div className="text-left">
                        <h1 className="text-2xl font-black text-white tracking-tighter leading-none">ROYAL</h1>
                        <span className="text-amber-500 text-[10px] font-bold tracking-[0.3em] uppercase block">The Gym</span>
                    </div>
                </div>
                <p className="text-gray-400 text-xs tracking-widest uppercase font-semibold">Secure Access Portal v4.2</p>
            </div>

            {/* Main Card */}
            <Card className="w-full max-w-md bg-gray-900/50 backdrop-blur-2xl border-white/10 p-0">
                {/* Role Tabs */}
                <div className="flex border-b border-white/10">
                    <button 
                        onClick={() => handleSwitchRole('admin')}
                        className={`flex-1 py-4 text-sm font-bold transition-all flex items-center justify-center ${role === 'admin' ? 'bg-amber-600/20 text-amber-400 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                    >
                        <LockIcon className="w-4 h-4 mr-2" /> ADMIN
                    </button>
                    <button 
                        onClick={() => handleSwitchRole('member')}
                        className={`flex-1 py-4 text-sm font-bold transition-all flex items-center justify-center ${role === 'member' ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                    >
                        <UserIcon className="w-4 h-4 mr-2" /> MEMBER
                    </button>
                </div>

                <div className="p-8">
                    {/* Method Selector */}
                    <div className="flex justify-center space-x-2 mb-6 bg-gray-800/50 p-1 rounded-lg">
                        <button onClick={() => { setLoginMethod('otp'); setError(''); }} className={`flex-1 text-xs py-2 rounded-md font-bold transition-all ${loginMethod === 'otp' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>WhatsApp</button>
                        <button onClick={() => { setLoginMethod('email'); setError(''); }} className={`flex-1 text-xs py-2 rounded-md font-bold transition-all ${loginMethod === 'email' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>Email OTP</button>
                        <button onClick={() => { setLoginMethod('password'); setError(''); }} className={`flex-1 text-xs py-2 rounded-md font-bold transition-all ${loginMethod === 'password' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>Password</button>
                    </div>

                    <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
                        
                        {/* INPUT FIELDS */}
                        {!isOtpSent ? (
                            <div className="space-y-4 animate-fade-in">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
                                        {loginMethod === 'otp' ? 'WhatsApp Number' : loginMethod === 'email' ? 'Registered Email' : 'User ID / Email'}
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            {loginMethod === 'otp' ? <WhatsAppIcon className="h-5 w-5 text-green-500"/> : <MailIcon className="h-5 w-5 text-blue-500"/>}
                                        </div>
                                        <input
                                            type={loginMethod === 'otp' ? "tel" : "text"}
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            className="block w-full pl-12 pr-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-800/50 text-white placeholder-gray-500 transition-all outline-none"
                                            placeholder={loginMethod === 'otp' ? "9876543210" : "name@example.com"}
                                        />
                                    </div>
                                    {loginMethod === 'password' && (
                                        <div className="relative group mt-4">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <LockIcon className="h-5 w-5 text-gray-500"/>
                                            </div>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="block w-full pl-12 pr-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-800/50 text-white placeholder-gray-500 transition-all outline-none"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    )}
                                </div>

                                {loginMethod !== 'password' && (
                                    <button
                                        onClick={handleSendOTP}
                                        disabled={isLoading}
                                        className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold rounded-lg transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:scale-100 flex justify-center items-center"
                                    >
                                        {isLoading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : 'Send Verification Code'}
                                    </button>
                                )}
                            </div>
                        ) : (
                            // OTP VERIFICATION STATE
                            <div className="space-y-4 animate-fade-in">
                                <div className="text-center mb-4">
                                    <p className="text-gray-400 text-xs">Enter code sent to</p>
                                    <p className="text-white font-mono text-sm">{identifier}</p>
                                    <button onClick={() => { setIsOtpSent(false); setOtpInput(''); }} className="text-amber-500 text-xs underline mt-1 hover:text-amber-400">Edit</button>
                                </div>

                                <div className="flex justify-center">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otpInput}
                                        onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                                        className="w-48 text-center text-3xl tracking-[0.3em] font-mono bg-transparent border-b-2 border-amber-500 text-white focus:outline-none pb-2"
                                        placeholder="••••••"
                                        autoFocus
                                    />
                                </div>

                                <div className="text-center text-xs text-gray-500 mt-2">
                                    {timer > 0 ? `Resend in ${timer}s` : <button onClick={handleSendOTP} className="text-blue-400 hover:underline">Resend Code</button>}
                                </div>
                            </div>
                        )}

                        {/* ERROR DISPLAY */}
                        {error && (
                            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-3 animate-shake">
                                <span className="text-red-500 font-bold">!</span>
                                <p className="text-red-200 text-xs leading-relaxed">{error}</p>
                            </div>
                        )}

                        {/* SUBMIT BUTTON (For Password or OTP Verify) */}
                        {(loginMethod === 'password' || isOtpSent) && (
                            <div className="pt-2">
                                <div className="flex items-center mb-4">
                                    <input id="terms" type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-amber-500 focus:ring-amber-500" />
                                    <label htmlFor="terms" className="ml-2 text-xs text-gray-400">I agree to Privacy Policy & Terms of Service</label>
                                </div>
                                <button
                                    onClick={handleVerifyAndLogin}
                                    disabled={isLoading}
                                    className={`w-full py-3 font-bold rounded-lg transition-all transform hover:scale-[1.02] shadow-lg flex justify-center items-center ${role === 'admin' ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                                >
                                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Secure Login'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </Card>

            {/* Hint for Demo purposes - In production remove this */}
            <div className="mt-6 text-[10px] text-gray-600 max-w-sm text-center z-10">
                <p className="mb-1">DEMO CREDENTIALS:</p>
                <p>Admin: admin@royal.com / 9785300123</p>
                <p>Member: Any email/phone from database (e.g. 9876543210)</p>
            </div>

            <div className="mt-8 flex justify-center space-x-6 z-10 opacity-50 hover:opacity-100 transition-opacity">
                <a href={GYM_INFO.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors"><InstagramIcon className="w-5 h-5" /></a>
                <a href={GYM_INFO.socials.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors"><FacebookIcon className="w-5 h-5" /></a>
                <a href={GYM_INFO.socials.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors"><TwitterIcon className="w-5 h-5" /></a>
            </div>
        </div>
    );
};

export default LoginScreen;
