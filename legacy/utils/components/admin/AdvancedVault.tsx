import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Lock, ShieldCheck, Database, Key, FileText, Upload, Download, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { encryptData, decryptData } from '../../../lib/encryption';

export const FitnessFutureVault: React.FC = () => {
    const { addToast } = useToast();
    const [isLocked, setIsLocked] = useState(true);
    const [passkey, setPasskey] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState([
        { id: 1, name: 'Member_Genomes_Q3.enc', size: '1.2 GB', type: 'DNA Sequence', date: '2026-04-08', content: '' },
        { id: 2, name: 'Financial_Ledger_2026.enc', size: '45 MB', type: 'Blockchain Ledger', date: '2026-04-09', content: '' },
        { id: 3, name: 'Staff_Biometrics.enc', size: '210 MB', type: 'Biometric Data', date: '2026-04-01', content: '' },
    ]);

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (passkey === 'admin') {
            setIsLocked(false);
            addToast("FitnessFutureVault Unlocked. AES-256-GCM Decryption Active.", "success");
        } else {
            addToast("Invalid Passkey. Access Denied.", "error");
        }
        setPasskey('');
    };

    const handleLock = () => {
        setIsLocked(true);
        addToast("FitnessFutureVault Locked. Data Encrypted.", "info");
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const content = event.target?.result as string;
                // Encrypt the content
                const encryptedContent = await encryptData(content);
                
                const newFile = {
                    id: Date.now(),
                    name: `${file.name}.enc`,
                    size: `${(file.size / 1024).toFixed(2)} KB`,
                    type: 'Encrypted Document',
                    date: new Date().toISOString().split('T')[0],
                    content: encryptedContent
                };
                
                setFiles(prev => [newFile, ...prev]);
                addToast(`${file.name} encrypted and stored in Vault.`, "success");
            };
            reader.readAsText(file);
        } catch (error) {
            addToast("Failed to encrypt file.", "error");
        }
    };

    const handleDecryptFile = async (file: any) => {
        if (!file.content) {
            addToast("This is a simulated system file.", "info");
            return;
        }
        try {
            const decrypted = await decryptData(file.content);
            addToast(`Decrypted Content: ${decrypted.substring(0, 50)}...`, "success");
        } catch (error) {
            addToast("Decryption failed.", "error");
        }
    };

    if (isLocked) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
                <div className="bg-black/60 border border-red-500/30 p-10 rounded-[3rem] shadow-2xl backdrop-blur-xl max-w-md w-full text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                            <Lock className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">FitnessFutureVault</h2>
                        <p className="text-xs text-red-400 mb-8">Client-Side Encrypted Storage. Enter Passkey to Decrypt.</p>

                        <form onSubmit={handleUnlock} className="space-y-4">
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                <input 
                                    type="password" 
                                    value={passkey}
                                    onChange={(e) => setPasskey(e.target.value)}
                                    placeholder="Enter Master Passkey (admin)"
                                    className="w-full bg-black border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-red-500 transition-colors"
                                />
                            </div>
                            <button type="submit" className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-widest rounded-xl transition-colors">
                                Decrypt & Access
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                        <Database className="w-8 h-8 text-emerald-400" />
                        Fitness Future<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Vault</span>
                    </h2>
                    <p className="text-emerald-400/60 text-xs font-mono uppercase tracking-widest mt-1">Client-Side Encryption Active (AES-256-GCM)</p>
                </div>
                <button onClick={handleLock} className="px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-red-500/30 transition-colors flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Lock Vault
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-black/40 border border-emerald-500/30 rounded-3xl p-6 flex items-center gap-4">
                    <div className="p-4 bg-emerald-500/20 rounded-2xl">
                        <ShieldCheck className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Encryption Status</p>
                        <p className="text-xl font-black text-white">Fully Secured</p>
                    </div>
                </div>
                <div className="bg-black/40 border border-white/10 rounded-3xl p-6 flex items-center gap-4">
                    <div className="p-4 bg-blue-500/20 rounded-2xl">
                        <Database className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Storage Used</p>
                        <p className="text-xl font-black text-white">1.45 GB</p>
                    </div>
                </div>
                <div className="bg-black/40 border border-white/10 rounded-3xl p-6 flex items-center gap-4">
                    <div className="p-4 bg-purple-500/20 rounded-2xl">
                        <Key className="w-8 h-8 text-purple-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Keys</p>
                        <p className="text-xl font-black text-white">3 (RSA-4096)</p>
                    </div>
                </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-3xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Encrypted Files</h3>
                    <input 
                        type="file" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-cyan-500/30"
                    >
                        <Upload className="w-4 h-4" /> Upload & Encrypt
                    </button>
                </div>
                
                <div className="space-y-3">
                    {files.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-black rounded-xl">
                                    <FileText className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{file.name}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] text-gray-500 uppercase">{file.type}</span>
                                        <span className="text-[10px] text-gray-500">{file.size}</span>
                                        <span className="text-[10px] text-gray-500">{file.date}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleDecryptFile(file)}
                                    className="p-2 bg-black/50 text-gray-400 hover:text-cyan-400 rounded-lg border border-white/10 transition-colors"
                                    title="Decrypt & View"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button className="p-2 bg-black/50 text-gray-400 hover:text-cyan-400 rounded-lg border border-white/10 transition-colors">
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
