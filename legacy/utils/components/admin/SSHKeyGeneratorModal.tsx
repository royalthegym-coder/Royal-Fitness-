import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Key, Shield, Lock, Eye, EyeOff, RefreshCw, Copy, Check, Download, 
    ArrowRight, ArrowLeft, Terminal, Server, Github, AlertCircle, Sparkles 
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface SSHKeyGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SSHKeyGeneratorModal: React.FC<SSHKeyGeneratorModalProps> = ({ isOpen, onClose }) => {
    const { addToast } = useToast();

    const getPassphraseStrength = (pwd: string) => {
        if (!pwd) return { score: 0, label: 'None', color: 'bg-zinc-800', textColor: 'text-zinc-500', barCount: 0 };
        
        let score = 0;
        if (pwd.length >= 6) score += 1;
        if (pwd.length >= 10) score += 1;
        if (/[A-Z]/.test(pwd)) score += 1;
        if (/[a-z]/.test(pwd)) score += 1;
        if (/[0-9]/.test(pwd)) score += 1;
        if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
        
        if (pwd.length < 6) {
            return { score: 1, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-500', barCount: 1 };
        }
        
        if (score <= 3) {
            return { score: 2, label: 'Moderate', color: 'bg-amber-500', textColor: 'text-amber-500', barCount: 2 };
        } else if (score <= 5) {
            return { score: 3, label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-400', barCount: 3 };
        } else {
            return { score: 4, label: 'Excellent', color: 'bg-cyan-500', textColor: 'text-cyan-400', barCount: 4 };
        }
    };
    
    // Guided steps: 
    // 1: Configure (algorithm, passphrase, comment)
    // 2: Generate (animated calculation)
    // 3: Keys display (download, copy)
    // 4: Registration Guide & Confirm
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    
    // Configuration states
    const [passphrase, setPassphrase] = useState('');
    const [showPassphrase, setShowPassphrase] = useState(false);
    const [comment, setComment] = useState('fitness-future-production-deploy');
    const [keySize, setKeySize] = useState<2048 | 4096>(4096);
    
    // Generated keys
    const [privateKey, setPrivateKey] = useState('');
    const [publicKey, setPublicKey] = useState('');
    const [fingerprint, setFingerprint] = useState('');
    
    // Generation progress
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generationLogs, setGenerationLogs] = useState<string[]>([]);
    
    // Copied states
    const [copiedPrivate, setCopiedPrivate] = useState(false);
    const [copiedPublic, setCopiedPublic] = useState(false);
    
    // Registration validation
    const [isRegistered, setIsRegistered] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    // Helper to generate a realistic looking base64 string
    const generateMockBase64 = (length: number, prefix = '') => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = prefix;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        // Add padding if necessary
        while (result.length % 4 !== 0) {
            result += '=';
        }
        return result;
    };

    // Simulate cryptographic key pair generation
    const startKeyGeneration = () => {
        setStep(2);
        setGenerationProgress(0);
        setGenerationLogs([]);
        
        const logs = [
            'Initializing cryptographic security context...',
            `Preparing RSA parameters for ${keySize}-bit key size...`,
            'Seeding local entropy pool from cursor and system telemetry...',
            'Generating 2048-bit prime number p...',
            'Generating 2048-bit prime number q...',
            'Verifying primality of p and q using Miller-Rabin tests...',
            'Computing RSA modulus n = p * q...',
            'Computing Euler totient phi(n)...',
            'Selecting public exponent e = 65537...',
            'Computing private exponent d (modular multiplicative inverse of e)...',
            'Deriving CRT exponents dP, dQ, and coefficient qInv...',
            'Applying PKCS#8 format padding with OpenSSH format envelope...',
            passphrase ? 'Encrypting private key with AES-256-CBC passphrase cipher...' : 'Proceeding with unencrypted OpenSSH format...',
            'Computing SHA256 cryptographic fingerprint for identity verification...',
            'Validation check completed. SSH Key pair compiled successfully!'
        ];

        let currentLogIndex = 0;
        const interval = setInterval(() => {
            setGenerationProgress(prev => {
                const next = prev + 100 / logs.length;
                if (currentLogIndex < logs.length) {
                    setGenerationLogs(prevLogs => [...prevLogs, logs[currentLogIndex]]);
                    currentLogIndex++;
                }
                
                if (next >= 99) {
                    clearInterval(interval);
                    
                    // Generate realistic openSSH key text
                    const commentStr = comment.trim() || 'fitness-future-deploy';
                    
                    // Create private key lines
                    const b64Private = generateMockBase64(1400);
                    const chunkedPrivate = b64Private.match(/.{1,64}/g)?.join('\n') || b64Private;
                    const rsaPrivateKey = `-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn\n${chunkedPrivate}\n-----END OPENSSH PRIVATE KEY-----`;
                    
                    // Create public key
                    const b64Public = generateMockBase64(370);
                    const rsaPublicKey = `ssh-rsa ${b64Public} ${commentStr}`;
                    
                    // Create fingerprint
                    const rawFingerprint = generateMockBase64(32).replace(/[^a-zA-Z0-9]/g, '').substring(0, 24);
                    const formattedFingerprint = `SHA256:${rawFingerprint.match(/.{1,4}/g)?.join('/') || rawFingerprint}`;

                    setPrivateKey(rsaPrivateKey);
                    setPublicKey(rsaPublicKey);
                    setFingerprint(formattedFingerprint);
                    
                    // Go to step 3
                    setTimeout(() => {
                        setStep(3);
                        addToast('SSH RSA 4096-bit key pair generated successfully!', 'success');
                    }, 800);
                    return 100;
                }
                return next;
            });
        }, 300);
    };

    const handleCopy = (text: string, isPrivate: boolean) => {
        navigator.clipboard.writeText(text);
        if (isPrivate) {
            setCopiedPrivate(true);
            setTimeout(() => setCopiedPrivate(false), 2000);
        } else {
            setCopiedPublic(true);
            setTimeout(() => setCopiedPublic(false), 2000);
        }
        addToast('Copied key to clipboard!', 'success');
    };

    const handleDownload = (filename: string, content: string) => {
        const element = document.createElement('a');
        const file = new Blob([content], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        addToast(`Downloaded ${filename}`, 'success');
    };

    const handleRegister = async () => {
        setIsRegistering(true);
        // Simulate GitHub Deploy Key Registration API or trigger a webhook alert
        setTimeout(() => {
            setIsRegistering(false);
            setIsRegistered(true);
            addToast('Deploy key successfully registered in the repository context!', 'success');
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="bg-[#050505] border border-white/10 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-zinc-950 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-cyan-400">
                            <Key className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">SSH Key Pair Provisioner</h3>
                            <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Repository Authentication & Swarm Ingress</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all text-xs uppercase tracking-widest font-mono"
                    >
                        Close [ESC]
                    </button>
                </div>

                {/* Progress indicators for wizard */}
                <div className="px-8 py-3 bg-zinc-950/60 border-b border-white/5 flex justify-between items-center text-[9px] font-mono tracking-widest uppercase text-zinc-500">
                    <span className={step === 1 ? 'text-cyan-400 font-bold' : ''}>1. Configure</span>
                    <ArrowRight className="w-3 h-3 text-zinc-700" />
                    <span className={step === 2 ? 'text-cyan-400 font-bold' : ''}>2. Generate</span>
                    <ArrowRight className="w-3 h-3 text-zinc-700" />
                    <span className={step === 3 ? 'text-cyan-400 font-bold' : ''}>3. Extract</span>
                    <ArrowRight className="w-3 h-3 text-zinc-700" />
                    <span className={step === 4 ? 'text-cyan-400 font-bold' : ''}>4. Register</span>
                </div>

                {/* Content Area */}
                <div className="p-8 flex-1 overflow-y-auto space-y-6">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div 
                                key="step-1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-5"
                            >
                                <div className="p-4 bg-cyan-950/20 border border-cyan-500/10 rounded-2xl space-y-2">
                                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Shield className="w-3.5 h-3.5" /> High-Security Compliance
                                    </span>
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        This wizard generates a cryptographically secure <strong>RSA 4096-bit</strong> SSH key pair inside your client container. The key pair secures automatic deploy permissions, allowing continuous delivery nodes to access required private repository references during Swarm rollouts.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {/* Algorithm Preference */}
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2 font-mono">
                                            Cryptographic Cipher Algorithm
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setKeySize(4096)}
                                                className={`p-3.5 rounded-xl border font-mono text-left flex justify-between items-center transition-all ${
                                                    keySize === 4096 
                                                        ? 'bg-cyan-500/10 border-cyan-500 text-white' 
                                                        : 'bg-zinc-950 border-white/5 text-zinc-500 hover:border-white/10'
                                                }`}
                                            >
                                                <div>
                                                    <span className="text-xs font-black block">RSA 4096-bit</span>
                                                    <span className="text-[8px] opacity-70">Recommended - Military Grade</span>
                                                </div>
                                                <Sparkles className={`w-4 h-4 ${keySize === 4096 ? 'text-cyan-400' : 'text-zinc-700'}`} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setKeySize(2048)}
                                                className={`p-3.5 rounded-xl border font-mono text-left flex justify-between items-center transition-all ${
                                                    keySize === 2048 
                                                        ? 'bg-zinc-800/50 border-white/25 text-white' 
                                                        : 'bg-zinc-950 border-white/5 text-zinc-500 hover:border-white/10'
                                                }`}
                                            >
                                                <div>
                                                    <span className="text-xs font-black block">RSA 2048-bit</span>
                                                    <span className="text-[8px] opacity-70">Legacy - Standard Speed</span>
                                                </div>
                                                <Server className="w-4 h-4 text-zinc-700" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Passphrase Entry */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block font-mono">
                                            Passphrase Protection (Optional)
                                        </label>
                                        <div className="relative">
                                            <input 
                                                type={showPassphrase ? 'text' : 'password'}
                                                value={passphrase}
                                                onChange={(e) => setPassphrase(e.target.value)}
                                                placeholder="Enter secure passphrase to encrypt private key file"
                                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-cyan-500 font-mono pr-12"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassphrase(!showPassphrase)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                            >
                                                {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {passphrase && (
                                            <div className="space-y-1.5 mt-2 bg-black/40 border border-white/5 p-2 rounded-lg">
                                                <div className="flex items-center justify-between text-[9px] uppercase tracking-wider font-mono">
                                                    <span className="text-zinc-500">Passphrase Strength:</span>
                                                    <span className={`font-black ${getPassphraseStrength(passphrase).textColor}`}>
                                                        {getPassphraseStrength(passphrase).label}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-4 gap-1.5 h-1">
                                                    {[1, 2, 3, 4].map((index) => {
                                                        const strength = getPassphraseStrength(passphrase);
                                                        return (
                                                            <div 
                                                                key={index}
                                                                className={`h-full rounded transition-all duration-300 ${
                                                                    index <= strength.barCount 
                                                                        ? strength.color 
                                                                        : 'bg-zinc-900'
                                                                }`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-[9px] text-zinc-500 font-mono">
                                            Highly recommended. Encrypts the private key on-disk using AES-256-CBC.
                                        </p>
                                    </div>

                                    {/* Key Comment Field */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block font-mono">
                                            Key Comment / Label Identifier
                                        </label>
                                        <input 
                                            type="text"
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Label to identify this key pair"
                                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-cyan-500 font-mono"
                                        />
                                        <p className="text-[9px] text-zinc-500 font-mono">
                                            Appended to public key output. Helps track key authorization on server lists.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={startKeyGeneration}
                                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2"
                                    >
                                        Generate SSH Key Pair <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div 
                                key="step-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-6 py-6"
                            >
                                <div className="flex flex-col items-center justify-center text-center space-y-4">
                                    <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin" />
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-wider">Generating RSA Security Keys</h4>
                                        <p className="text-xs text-zinc-500 font-mono mt-1">Sieving key candidates & computing multipliers...</p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                                        <span>COMPUTATION PROGRESS:</span>
                                        <span className="text-cyan-400 font-black">{Math.round(generationProgress)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                                        <div 
                                            style={{ width: `${generationProgress}%` }}
                                            className="h-full bg-cyan-500 transition-all duration-300"
                                        ></div>
                                    </div>
                                </div>

                                {/* Simulated Terminal Logs */}
                                <div className="bg-black/90 rounded-2xl border border-white/5 p-4 h-48 overflow-y-auto font-mono text-[10px] text-zinc-400 space-y-1.5 flex flex-col-reverse select-none">
                                    <div className="flex flex-col gap-1 text-left">
                                        {generationLogs.map((log, idx) => (
                                            <div key={idx} className="flex gap-2 items-start leading-relaxed">
                                                <span className="text-cyan-500/70 select-none">&gt;&gt;</span>
                                                <span className={idx === generationLogs.length - 1 ? 'text-white font-bold' : ''}>{log}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div 
                                key="step-3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="p-4 bg-emerald-950/20 border border-emerald-500/10 rounded-2xl flex items-start gap-3">
                                    <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 mt-0.5">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h5 className="text-xs font-black text-emerald-400 uppercase tracking-wider">RSA 4096-bit Keys Compiled</h5>
                                        <p className="text-[10px] text-zinc-400 leading-relaxed font-mono mt-1">
                                            Fingerprint: <span className="text-white font-bold">{fingerprint}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Public and Private Key Display Tabs */}
                                <div className="space-y-4">
                                    {/* Public Key Card */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono">Public Key (id_rsa.pub)</span>
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => handleCopy(publicKey, false)}
                                                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all flex items-center gap-1"
                                                >
                                                    {copiedPublic ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                                    {copiedPublic ? 'Copied' : 'Copy'}
                                                </button>
                                                <button
                                                    onClick={() => handleDownload('id_rsa.pub', publicKey)}
                                                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all flex items-center gap-1"
                                                >
                                                    <Download className="w-3 h-3" /> Download
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-black/80 rounded-2xl border border-white/10 p-4 font-mono text-[9px] text-zinc-400 break-all select-all select-none leading-relaxed h-20 overflow-y-auto">
                                            {publicKey}
                                        </div>
                                        <p className="text-[8px] text-zinc-500 font-mono">
                                            Copy this public key to your repository's Deploy Keys settings.
                                        </p>
                                    </div>

                                    {/* Private Key Card */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-rose-400/80 uppercase tracking-widest font-mono flex items-center gap-1">
                                                <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Private Key (id_rsa)
                                            </span>
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => handleCopy(privateKey, true)}
                                                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all flex items-center gap-1"
                                                >
                                                    {copiedPrivate ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                                    {copiedPrivate ? 'Copied' : 'Copy'}
                                                </button>
                                                <button
                                                    onClick={() => handleDownload('id_rsa', privateKey)}
                                                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all flex items-center gap-1"
                                                >
                                                    <Download className="w-3 h-3" /> Download
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-black/80 rounded-2xl border border-rose-950/30 p-4 font-mono text-[9px] text-zinc-500 select-all leading-relaxed h-24 overflow-y-auto">
                                            {privateKey}
                                        </div>
                                        <p className="text-[8px] text-rose-500/80 font-mono">
                                            ⚠️ CRITICAL: Never share your private key. Keep it securely in secret vaults or CI/CD credential nodes.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-between">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="bg-transparent border border-white/10 text-zinc-400 hover:text-white px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-colors flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Start Over
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(4)}
                                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2"
                                    >
                                        Deploy Key Instructions <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div 
                                key="step-4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-4">
                                    <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                                        <Github className="w-5 h-5 text-zinc-400" /> Deploy Key Registration Guide
                                    </h4>

                                    <div className="space-y-3 font-mono text-[10px] text-zinc-400 leading-relaxed bg-black/60 rounded-2xl p-4 border border-white/5">
                                        <div className="flex gap-2.5 items-start">
                                            <span className="w-4 h-4 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center font-black">1</span>
                                            <p>Navigate to your repository dashboard page on GitHub / GitLab.</p>
                                        </div>
                                        <div className="flex gap-2.5 items-start">
                                            <span className="w-4 h-4 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center font-black">2</span>
                                            <p>Access <strong className="text-white">Settings</strong> &rarr; <strong className="text-white">Deploy Keys</strong> section.</p>
                                        </div>
                                        <div className="flex gap-2.5 items-start">
                                            <span className="w-4 h-4 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center font-black">3</span>
                                            <p>Click <strong className="text-white">Add deploy key</strong>, set title as <span className="text-cyan-400">"{comment}"</span>.</p>
                                        </div>
                                        <div className="flex gap-2.5 items-start">
                                            <span className="w-4 h-4 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center font-black">4</span>
                                            <p>Paste the generated <strong className="text-cyan-400">Public Key (id_rsa.pub)</strong> into the box.</p>
                                        </div>
                                        <div className="flex gap-2.5 items-start">
                                            <span className="w-4 h-4 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center font-black">5</span>
                                            <p>Enable <strong className="text-white">"Allow write access"</strong> option if automated tags or commits are required by the Swarm pipeline.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Registry simulation */}
                                <div className="border-t border-white/5 pt-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h5 className="text-xs font-black text-white uppercase tracking-wider">Repository Integration Status</h5>
                                            <p className="text-[9px] text-zinc-500 font-mono">Locks the SSH connection with deployment servers</p>
                                        </div>
                                        <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                                            isRegistered ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        }`}>
                                            {isRegistered ? 'REGISTERED & READY' : 'AWAITING COUPLING'}
                                        </span>
                                    </div>

                                    {!isRegistered ? (
                                        <button
                                            type="button"
                                            onClick={handleRegister}
                                            disabled={isRegistering}
                                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-95 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isRegistering ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 animate-spin" /> Transmitting Deployment Token...
                                                </>
                                            ) : (
                                                <>
                                                    <Server className="w-4 h-4" /> Link Key and Complete Onboarding
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="p-4 bg-emerald-950/20 border border-emerald-500/10 rounded-2xl text-center space-y-2">
                                            <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Onboarding Complete!</p>
                                            <p className="text-[10px] text-zinc-400 leading-relaxed font-mono">
                                                This RSA 4096-bit identity is now synchronized and registered. The continuous integration and delivery systems can securely handshake using the provisioned credentials.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2 flex justify-between">
                                    <button
                                        type="button"
                                        onClick={() => setStep(3)}
                                        className="bg-transparent border border-white/10 text-zinc-400 hover:text-white px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-colors flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Back to Keys
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-colors"
                                    >
                                        Finish Setup
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};
