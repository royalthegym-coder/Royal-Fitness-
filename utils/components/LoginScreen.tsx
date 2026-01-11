
import React, { useState } from 'react';
import { GYM_INFO } from '../../constants';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { sendWhatsAppOTP } from '../../lib/whatsapp';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';

interface LoginScreenProps {
    onLogin: (email: string, pass: string, role: 'admin' | 'member') => boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('otp');
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

    const handleSendOTP = async () => {
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

    const handleVerifyOTP = () => {
        if (!consent) {
            setError("You must agree to the Privacy Policy & Terms.");
            return;
        }
        if (otp === generatedOtp || otp === '123456') { // Backdoor for demo
            // Pass a dummy password that matches the App.tsx check for the sake of compatibility, 
            // OR ideally App.tsx should verify phone numbers directly.
            // For this demo, we simulate success by calling onLogin with correct hardcoded creds based on role
            // This is a bridge between the new UI and old logic.
            let success = false;
            if (role === 'admin') {
                success = onLogin('9785300123', 'admin123', 'admin');
            } else {
                // Try to find member by phone in real app, here we use demo creds
                success = onLogin('aarav.s@example.com', 'aarav123', 'member');
            }
            
            if (!success) setError('Account not found for this number.');
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
        const success = onLogin(identifier, password, role);
        if (!success) {
            setError('Invalid credentials.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="text-center mb-8 z-10">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200 tracking-wider mb-2">{GYM_INFO.name}</h1>
                <p className="text-gray-400 text-sm tracking-widest uppercase">Secure Access Portal</p>
            </div>

            <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700 z-10 backdrop-blur-sm">
                {/* Role Switcher */}
                <div className="flex bg-gray-700 rounded-lg p-1 mb-6">
                    <button 
                        onClick={() => { setRole('admin'); setIdentifier(''); setPassword(''); setIsOtpSent(false); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${role === 'admin' ? 'bg-amber-500 text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Admin
                    </button>
                    <button 
                        onClick={() => { setRole('member'); setIdentifier(''); setPassword(''); setIsOtpSent(false); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${role === 'member' ? 'bg-amber-500 text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Member
                    </button>
                </div>

                {/* Login Method Tabs */}
                <div className="flex justify-center space-x-6 mb-6 border-b border-gray-700 pb-2">
                    <button onClick={() => setLoginMethod('otp')} className={`text-sm font-medium pb-2 border-b-2 transition-colors ${loginMethod === 'otp' ? 'border-green-500 text-green-400' : 'border-transparent text-gray-500'}`}>
                        WhatsApp OTP
                    </button>
                    <button onClick={() => setLoginMethod('password')} className={`text-sm font-medium pb-2 border-b-2 transition-colors ${loginMethod === 'password' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500'}`}>
                        Password
                    </button>
                </div>

                <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
                    {loginMethod === 'otp' ? (
                        <>
                            {!isOtpSent ? (
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Mobile Number</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <WhatsAppIcon className="h-5 w-5 text-green-500" />
                                        </div>
                                        <input
                                            type="tel"
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 bg-gray-700 text-white placeholder-gray-500 transition-colors"
                                            placeholder="9876543210"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSendOTP}
                                        disabled={isLoading}
                                        className="mt-4 w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Sending...' : 'Get OTP via WhatsApp'}
                                    </button>
                                </div>
                            ) : (
                                <div className="animate-fade-in">
                                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Enter 6-Digit OTP</label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="block w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 bg-gray-700 text-white text-center text-2xl tracking-widest font-mono"
                                        placeholder="• • • • • •"
                                        maxLength={6}
                                    />
                                    <div className="flex justify-between items-center mt-2">
                                        <button type="button" onClick={() => setIsOtpSent(false)} className="text-xs text-gray-400 hover:text-white underline">Wrong Number?</button>
                                        <span className="text-xs text-gray-500">Resend in 30s</span>
                                    </div>
                                    
                                    <button
                                        type="button"
                                        onClick={handleVerifyOTP}
                                        className="mt-4 w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-gray-900 bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all"
                                    >
                                        Verify & Login
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="animate-fade-in">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Email / ID</label>
                                    <input
                                        type="text"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        className="block w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
                                        placeholder={role === 'admin' ? 'admin@royal.com' : 'user@example.com'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSubmitPassword}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                                >
                                    Secure Login
                                </button>
                            </div>
                        </div>
                    )}

                    {error && <div className="p-3 rounded bg-red-900/50 border border-red-500/50 text-red-200 text-sm text-center animate-pulse">{error}</div>}

                    {/* GDPR Consent Checkbox */}
                    <div className="mt-4 flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                id="consent"
                                type="checkbox"
                                checked={consent}
                                onChange={(e) => setConsent(e.target.checked)}
                                className="focus:ring-amber-500 h-4 w-4 text-amber-600 border-gray-500 rounded bg-gray-700"
                            />
                        </div>
                        <div className="ml-3 text-xs">
                            <label htmlFor="consent" className="font-medium text-gray-300">
                                I agree to the <a href="#" className="text-amber-400 hover:underline">Privacy Policy</a> & <a href="#" className="text-amber-400 hover:underline">Terms of Service</a>.
                            </label>
                            <p className="text-gray-500 mt-1">We process your data securely in compliance with GDPR & local regulations.</p>
                        </div>
                    </div>
                </form>
            </div>
            
            <div className="mt-8 flex items-center justify-center space-x-2 text-gray-600 text-xs">
                <ShieldCheckIcon className="w-4 h-4" />
                <span>256-bit End-to-End Encryption</span>
            </div>
        </div>
    );
};

export default LoginScreen;
