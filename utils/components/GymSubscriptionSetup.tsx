import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MapPin, Phone, Mail, Building, Upload, Orbit, Bot, Smartphone, Fingerprint, User, CreditCard, Navigation, PenTool, Trash2 } from 'lucide-react';
import { useGym, GymConfig, tenantToGymConfig } from '../context/GymProvider';
import { useTenantStore } from '../store/useTenantStore';
import { getComplexResponse } from '../../lib/core_ai';
import { compressImageFile, normalizeSafeExternalUrl } from '../imageUpload';

export const GymSubscriptionSetup: React.FC = () => {
    const { registerGymConfig } = useGym();
    const [step, setStep] = useState(1);
    const [uploadError, setUploadError] = useState('');

    // Gym Form State
    const [gymData, setGymData] = useState<Partial<GymConfig>>({
        gymName: '',
        ownerName: '',
        address: '',
        googleLocationUrl: '',
        phone: '',
        email: '',
        upiId: '',
        whatsappNumber: '',
        googleBusinessId: '',
        logoUrl: '',
        signatureUrl: '',
        themeColor: 'cyan',
    });

    const [isGenerating, setIsGenerating] = useState(false);

    const handleImageUpload = async (
        field: 'logoUrl' | 'signatureUrl',
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setUploadError('');
            const compressed = await compressImageFile(file, {
                maxWidth: field === 'signatureUrl' ? 520 : 420,
                maxHeight: field === 'signatureUrl' ? 200 : 420,
                preserveAlpha: true,
            });
            setGymData(prev => ({ ...prev, [field]: compressed }));
        } catch (err: any) {
            setUploadError(err?.message || 'Could not process image file.');
        }
    };

    const handleNext = async () => {
        if (step === 1 && gymData.gymName && gymData.ownerName && gymData.address) {
            setStep(2);
        } else if (step === 2 && gymData.phone && gymData.email && gymData.upiId) {
            setStep(3);
        } else if (step === 3) {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        setIsGenerating(true);
        try {
            const prompt = `Generate a modern AI fitness brand identity summary for a gym named "${gymData.gymName}" at location "${gymData.address}". Keep it under 2 sentences.`;
            await getComplexResponse(prompt);
        } catch {
            // Optional AI identity preview
        }

        const normalizedMapsUrl = normalizeSafeExternalUrl(gymData.googleLocationUrl);
        const tenant = await useTenantStore.getState().registerTenant({
            gymName: gymData.gymName || 'Fitness Future Gym',
            ownerName: gymData.ownerName || 'Gym Owner',
            adminName: gymData.ownerName || 'Gym Owner',
            email: gymData.email || '',
            phoneNumber: gymData.phone || '',
            location: gymData.address || '',
            googleLocationUrl: normalizedMapsUrl,
            logoUrl: gymData.logoUrl || '',
            signatureUrl: gymData.signatureUrl || '',
            whatsappPhoneId: gymData.whatsappNumber || gymData.phone || '',
            upiId: gymData.upiId || '',
        });

        const finalGym: GymConfig = tenant
            ? { ...tenantToGymConfig(tenant), themeColor: gymData.themeColor || 'cyan', googleBusinessId: gymData.googleBusinessId || '' }
            : {
                gymId: `tenant_${Date.now()}`,
                gymName: gymData.gymName || 'Fitness Future Gym',
                ownerName: gymData.ownerName || '',
                logoUrl: gymData.logoUrl || '',
                signatureUrl: gymData.signatureUrl || '',
                themeColor: gymData.themeColor || 'cyan',
                upiId: gymData.upiId || '',
                address: gymData.address || '',
                googleLocationUrl: normalizedMapsUrl,
                phone: gymData.phone || '',
                email: gymData.email || '',
                whatsappNumber: gymData.whatsappNumber || gymData.phone || '',
                googleBusinessId: gymData.googleBusinessId || '',
                secretKey: `tenant_secret_${Math.random().toString(36).substring(2, 10)}`,
                isSetupComplete: true,
            };

        registerGymConfig(finalGym);
        setIsGenerating(false);
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col overflow-y-auto">
            <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-cyan-900/20 rounded-full blur-[150px] pointer-events-none"></div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-2xl bg-gray-900/70 border border-cyan-500/30 p-8 md:p-10 rounded-[2.5rem] backdrop-blur-xl shadow-2xl flex flex-col items-center">
                            <Orbit className="w-16 h-16 text-cyan-400 mb-4 animate-spin-slow" />
                            <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-widest text-center mb-1 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-500">Fitness Future</h1>
                            <p className="text-gray-400 font-mono text-xs tracking-widest mb-8 text-center">New Gym Identity, Owner &amp; Google Location</p>

                            <div className="w-full space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Building className="w-4 h-4" /> Gym Name *</label>
                                        <input
                                            type="text"
                                            value={gymData.gymName}
                                            onChange={(e) => setGymData({ ...gymData, gymName: e.target.value })}
                                            className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-cyan-500 font-bold transition-all"
                                            placeholder="e.g. Titanium Fitness Hub"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-2"><User className="w-4 h-4" /> Gym Owner Name *</label>
                                        <input
                                            type="text"
                                            value={gymData.ownerName}
                                            onChange={(e) => setGymData({ ...gymData, ownerName: e.target.value })}
                                            className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-cyan-500 font-bold transition-all"
                                            placeholder="e.g. Vikram Sharma"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-2"><MapPin className="w-4 h-4" /> Gym Address *</label>
                                    <input
                                        type="text"
                                        value={gymData.address}
                                        onChange={(e) => setGymData({ ...gymData, address: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-cyan-500 font-bold transition-all"
                                        placeholder="Full gym street address for receipts"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Navigation className="w-4 h-4" /> Google Location Link (Google Maps URL)</label>
                                    <input
                                        type="text"
                                        value={gymData.googleLocationUrl}
                                        onChange={(e) => setGymData({ ...gymData, googleLocationUrl: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 font-bold transition-all"
                                        placeholder="https://maps.app.goo.gl/..."
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={!gymData.gymName || !gymData.ownerName || !gymData.address}
                                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-black uppercase tracking-widest py-4 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50 mt-4"
                                >
                                    Next: Contact &amp; UPI Setup
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full max-w-2xl bg-gray-900/70 border border-fuchsia-500/30 p-8 md:p-10 rounded-[2.5rem] backdrop-blur-xl shadow-2xl flex flex-col items-center">
                            <Bot className="w-16 h-16 text-fuchsia-400 mb-4" />
                            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-widest text-center mb-6">Owner Contact &amp; UPI ID</h2>

                            <div className="w-full space-y-5">
                                <div>
                                    <label className="text-xs font-mono text-fuchsia-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Mail className="w-4 h-4" /> Gym Owner Email ID *</label>
                                    <input
                                        type="email"
                                        value={gymData.email}
                                        onChange={(e) => setGymData({ ...gymData, email: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-fuchsia-500 font-bold transition-all"
                                        placeholder="owner@yourgym.com"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-mono text-fuchsia-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Phone className="w-4 h-4" /> Owner Mobile Number *</label>
                                        <input
                                            type="tel"
                                            value={gymData.phone}
                                            onChange={(e) => setGymData({ ...gymData, phone: e.target.value })}
                                            className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-fuchsia-500 font-bold"
                                            placeholder="+91 9876543210"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Gym UPI ID *</label>
                                        <input
                                            type="text"
                                            value={gymData.upiId}
                                            onChange={(e) => setGymData({ ...gymData, upiId: e.target.value })}
                                            className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 font-bold"
                                            placeholder="yourgym@okaxis"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-mono text-[#25D366] uppercase tracking-widest mb-2 flex items-center gap-2"><Smartphone className="w-4 h-4" /> WhatsApp Number (Optional)</label>
                                    <input
                                        type="tel"
                                        value={gymData.whatsappNumber}
                                        onChange={(e) => setGymData({ ...gymData, whatsappNumber: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-[#25D366] font-bold"
                                        placeholder="Defaults to Owner Mobile Number"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setStep(1)} className="px-6 py-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-xs font-black uppercase tracking-widest">
                                        Back
                                    </button>
                                    <button type="button" onClick={handleNext} disabled={!gymData.email || !gymData.phone || !gymData.upiId} className="flex-1 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-[0_0_30px_rgba(217,70,239,0.4)] transition-all disabled:opacity-50">
                                        Next: Upload Logo &amp; Signature
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl bg-gray-900/70 border border-green-500/30 p-8 md:p-10 rounded-[2.5rem] backdrop-blur-xl shadow-2xl flex flex-col items-center">
                            {isGenerating ? (
                                <div className="flex flex-col items-center py-16">
                                    <Sparkles className="w-20 h-20 text-green-400 mb-6 animate-pulse" />
                                    <h2 className="text-2xl font-black italic uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 mb-3 animate-pulse">Activating Gym &amp; Receipt Profile...</h2>
                                    <p className="text-gray-400 font-mono text-xs tracking-widest text-center">Binding {gymData.gymName} logo, owner signature, UPI &amp; Member Portal.</p>
                                </div>
                            ) : (
                                <>
                                    <Fingerprint className="w-16 h-16 text-green-500 mb-4" />
                                    <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-widest text-center mb-6">Logo &amp; Owner Signature</h2>

                                    {uploadError && (
                                        <p className="text-xs text-red-400 font-semibold mb-4">{uploadError}</p>
                                    )}

                                    <div className="w-full space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-mono text-green-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Upload className="w-4 h-4" /> Upload Gym Logo</label>
                                                <div className="border-2 border-dashed border-white/15 rounded-2xl p-4 bg-black/60 text-center">
                                                    {gymData.logoUrl ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <img src={gymData.logoUrl} alt="Gym Logo" className="w-16 h-16 rounded-xl object-contain bg-white p-1" />
                                                            <button type="button" onClick={() => setGymData({ ...gymData, logoUrl: '' })} className="text-[10px] text-red-400 flex items-center gap-1 hover:underline">
                                                                <Trash2 className="w-3 h-3" /> Change Logo
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label className="flex flex-col items-center py-4 cursor-pointer">
                                                            <Upload className="w-6 h-6 text-green-400 mb-1" />
                                                            <span className="text-xs font-bold text-gray-300">Select Gym Logo</span>
                                                            <span className="text-[10px] text-gray-500 mt-0.5">PNG / JPG / WebP</span>
                                                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload('logoUrl', e)} className="hidden" />
                                                        </label>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs font-mono text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-2"><PenTool className="w-4 h-4" /> Upload Owner Signature</label>
                                                <div className="border-2 border-dashed border-white/15 rounded-2xl p-4 bg-black/60 text-center">
                                                    {gymData.signatureUrl ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="h-16 w-32 rounded-xl bg-white p-1.5 flex items-center justify-center">
                                                                <img src={gymData.signatureUrl} alt="Owner Signature" className="max-h-full max-w-full object-contain" />
                                                            </div>
                                                            <button type="button" onClick={() => setGymData({ ...gymData, signatureUrl: '' })} className="text-[10px] text-red-400 flex items-center gap-1 hover:underline">
                                                                <Trash2 className="w-3 h-3" /> Change Signature
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label className="flex flex-col items-center py-4 cursor-pointer">
                                                            <PenTool className="w-6 h-6 text-amber-400 mb-1" />
                                                            <span className="text-xs font-bold text-gray-300">Select Owner Signature</span>
                                                            <span className="text-[10px] text-gray-500 mt-0.5">Printed on official receipts</span>
                                                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload('signatureUrl', e)} className="hidden" />
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button type="button" onClick={() => setStep(2)} className="px-6 py-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-xs font-black uppercase tracking-widest">
                                                Back
                                            </button>
                                            <button type="button" onClick={handleComplete} className="flex-1 bg-green-600 hover:bg-green-500 text-black font-black uppercase tracking-widest py-4 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all">
                                                Finalize Gym &amp; Activate Portal
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
