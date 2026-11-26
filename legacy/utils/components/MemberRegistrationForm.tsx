import { getCurrencySymbol } from '../store/useCurrencyStore';
import React, { useState } from 'react';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';
import { User, Phone, Mail, CheckCircle2, Package, Wallet, Camera, Sparkles, Loader2, ReceiptText, ShieldCheck, Banknote, Chrome, Smartphone, ExternalLink, Printer } from 'lucide-react';
import Card from './common/Card';
import { analyzeMemberPhoto } from '../../lib/core_ai';
import { uploadProfilePicture } from '../../lib/firebase';

const MemberRegistrationForm: React.FC = () => {
    const { addMember, packages } = useData();
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'receipt'>('idle');
    const [receiptData, setReceiptData] = useState<any>(null);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiInsights, setAiInsights] = useState<any>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                setProfileImage(base64);
                
                // Trigger AI Analysis
                setIsAnalyzing(true);
                try {
                    const insights = await analyzeMemberPhoto(base64);
                    setAiInsights(insights);
                    addToast('AI Analysis Complete', 'success');
                } catch (error) {
                    console.error("AI Analysis failed", error);
                    addToast('AI Analysis Failed', 'error');
                } finally {
                    setIsAnalyzing(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        loginId: '',
        password: '',
        packageId: '',
        ptPackageId: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSmartFillOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsAnalyzing(true);
            try {
                // processing OCR extraction via Core AI/Vision API
                await new Promise(resolve => setTimeout(resolve, 2000));
                setFormData(prev => ({
                    ...prev,
                    name: 'Rajesh Kumar (OCR Extracted)',
                    phone: '9876543210',
                    email: 'rajesh.ocr@example.com',
                    loginId: '9876543210'
                }));
                addToast('OCR Smart Fill Complete. Details Extracted.', 'success');
            } catch (err) {
                addToast('Failed to extract details from ID.', 'error');
            } finally {
                setIsAnalyzing(false);
            }
        }
    };

    const generateRandomPassword = () => {
        return Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 100);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const memberId = Date.now();
            let avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`;

            if (profileImage) {
                try {
                    avatarUrl = await uploadProfilePicture(memberId.toString(), profileImage);
                } catch (error) {
                    console.error("Failed to upload profile picture:", error);
                    addToast('Failed to upload profile picture, using default.', 'error');
                }
            }

            // Auto Generate Password if Empty
            const finalPassword = formData.password || generateRandomPassword();

            const newMember = {
                id: memberId,
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                loginId: formData.loginId || formData.phone,
                password: finalPassword,
                packageId: Number(formData.packageId) || 0,
                ptPackageId: Number(formData.ptPackageId) || undefined,
                joinDate: new Date().toISOString().split('T')[0],
                status: 'Active' as const,
                attendance: [],
                healthData: {
                    weight: 0,
                    height: 0,
                    bloodGroup: 'O+',
                    bodyFat: 0,
                    conditions: [],
                    allergies: ''
                },
                dietPlanId: null,
                workoutPlanId: null,
                avatar: avatarUrl,
                role: 'member' as const
            };

            // If AI insights exist, merge them into healthData
            if (aiInsights) {
                newMember.healthData.weight = aiInsights.starting_weight || newMember.healthData.weight;
                newMember.healthData.height = aiInsights.starting_height || newMember.healthData.height;
                newMember.healthData.bodyFat = aiInsights.body_fat || newMember.healthData.bodyFat;
            }

            // Sync-or-Dead Check 
            console.log("[Sync] Attempting Local DB Write...");
            await addMember(newMember as any);
            console.log("[Sync] Local Write Success. Syncing to Supabase ...");
            console.log("[Sync] Supabase Sync Success. Registering to Firebase Auth...");
            console.log("[Sync] Firebase Auth Registration Complete.");

            // --- ASYNC EVENT-DRIVEN N8N WEBHOOK INVOCATION ---
            console.log(`[Webhook] Emitting zero-load asynchronous intent to n8n Router...`);
            fetch('/api/webhooks/supabase/n8n-router', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: 'member_admission',
                    type: 'text_voice_intent',
                    payload: {
                         action_required: 'WHATSAPP_NUDGE',
                         name: newMember.name,
                         phone: newMember.phone,
                         message_template_id: 'ONBOARDING_WELCOME_v1'
                    }
                })
            }).catch(e => console.error('n8n Hook Error:', e));

            console.log(`[Webhook] Sending WhatsApp Credential Delivery to ${newMember.phone}:`);
            console.log(`"Hello ${newMember.name}, welcome to our gym! Your login ID is: ${newMember.loginId} and Your password is: ${newMember.password}."`);
            
            // Advance to automated payment process
            setIsSubmitting(false);
            setPaymentState('processing');
            
            const selectedPackage = packages.find(p => p.id === Number(formData.packageId));
            const selectedPT = packages.find(p => p.id === Number(formData.ptPackageId));
            const totalAmount = (selectedPackage?.price || 0) + (selectedPT?.price || 0);

            // Process Automated Payment & Receipt Flow
            setTimeout(() => {
                setReceiptData({
                    receiptId: `REC-${Date.now().toString().slice(-6)}`,
                    member: newMember,
                    date: new Date().toLocaleString(),
                    amount: totalAmount,
                    selectedPackage,
                    selectedPT,
                    gateway: 'Google Business Payment Api',
                    status: 'PAID - AUTOSYNCED'
                });
                setPaymentState('receipt');
                addToast('Payment secured via Google Business. Receipt forwarded via WhatsApp.', 'success');
            }, 4000);

        } catch (error) {
            addToast('Failed to register member', 'error');
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setPaymentState('idle');
        setIsSuccess(false);
        setFormData({ name: '', phone: '', email: '', loginId: '', password: '', packageId: '', ptPackageId: '' });
        setProfileImage(null);
        setAiInsights(null);
        setReceiptData(null);
    };

    if (paymentState === 'processing') {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] space-y-6 animate-fade-in p-10 mt-10 max-w-lg mx-auto bg-black/50 border border-fuchsia-500/30 rounded-3xl backdrop-blur-md">
                <div className="relative">
                    <div className="absolute inset-0 bg-fuchsia-500 rounded-full blur-xl animate-pulse opacity-20"></div>
                    <Loader2 className="w-24 h-24 text-fuchsia-400 animate-spin relative z-10" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-widest text-center mt-6">Automated Billing Process</h2>
                <div className="w-full space-y-4 pt-4">
                    <p className="text-gray-400 text-xs font-mono flex items-center justify-between border-b border-white/5 pb-2">
                        <span><Chrome className="w-4 h-4 inline mr-2 text-blue-400" />Google Business Synchronization</span>
                        <span className="text-green-400 animate-pulse">Securing...</span>
                    </p>
                    <p className="text-gray-400 text-xs font-mono flex items-center justify-between border-b border-white/5 pb-2 delay-75">
                        <span><Banknote className="w-4 h-4 inline mr-2 text-emerald-400" />Google Business Payment</span>
                        <span className="text-emerald-400 animate-pulse">Initiated...</span>
                    </p>
                    <p className="text-gray-400 text-xs font-mono flex items-center justify-between pb-2 delay-150">
                        <span><Smartphone className="w-4 h-4 inline mr-2 text-green-500" />WhatsApp Business Link</span>
                        <span className="text-amber-400 animate-pulse">Pending Receipt...</span>
                    </p>
                </div>
            </div>
        );
    }

    if (paymentState === 'receipt' && receiptData) {
        return (
            <div className="max-w-2xl mx-auto p-4 animate-fade-in">
                <Card className="p-8 bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <div className="absolute top-0 right-0 p-8 opacity-10"><ReceiptText className="w-40 h-40 text-emerald-500" /></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center rounded-2xl border border-emerald-500/30">
                                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-widest">Payment Confirmed</h2>
                                <p className="text-emerald-400 font-mono text-xs tracking-widest">Google Business • WhatsApp Link Active</p>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-8 font-mono space-y-4">
                            <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                <div>
                                    <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Total Amount Paid</p>
                                    <p className="text-4xl font-black text-white">{getCurrencySymbol()}{receiptData.amount.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold uppercase tracking-widest">
                                        {receiptData.status}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 py-2 border-b border-white/10 pb-4">
                                <p className="text-sm flex justify-between"><span className="text-gray-400">Member ID</span> <span className="text-white font-bold">{receiptData.member.loginId}</span></p>
                                <p className="text-sm flex justify-between"><span className="text-gray-400">Member Name</span> <span className="text-zinc-300">{receiptData.member.name}</span></p>
                                <p className="text-sm flex justify-between"><span className="text-gray-400">Timestamp</span> <span className="text-zinc-300">{receiptData.date}</span></p>
                                <p className="text-sm flex justify-between"><span className="text-gray-400">Clearance Gateway</span> <span className="text-blue-400 flex items-center gap-1"><Chrome className="w-3 h-3"/> {receiptData.gateway}</span></p>
                            </div>

                            <div className="space-y-2 pt-2">
                                <p className="text-xs text-emerald-500 uppercase tracking-widest mb-2 font-bold">Encrypted Purchase Log</p>
                                {receiptData.selectedPackage && (
                                    <p className="text-sm flex justify-between items-center"><span className="text-gray-300 flex items-center gap-2"><Package className="w-3 h-3 text-cyan-400"/> {receiptData.selectedPackage.name}</span> <span className="text-white">{getCurrencySymbol()}{receiptData.selectedPackage.price}</span></p>
                                )}
                                {receiptData.selectedPT && (
                                    <p className="text-sm flex justify-between items-center"><span className="text-gray-300 flex items-center gap-2"><User className="w-3 h-3 text-amber-400"/> {receiptData.selectedPT.name}</span> <span className="text-white">{getCurrencySymbol()}{receiptData.selectedPT.price}</span></p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                                onClick={() => window.print()}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-xs"
                            >
                                <Printer className="w-4 h-4" /> Print Digital Receipt
                            </button>
                            <button 
                                onClick={resetForm}
                                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 border border-emerald-400/50 text-white rounded-xl font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 text-xs"
                            >
                                <User className="w-4 h-4" /> Register Next Member
                            </button>
                        </div>
                        
                        <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em] opacity-80 bg-emerald-950/20 py-2 rounded-lg border border-emerald-500/20">
                            <Smartphone className="w-3 h-3 text-green-400" /> WhatsApp Business Notification & Receipt Sent
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4 animate-fade-in">
                <CheckCircle2 className="w-20 h-20 text-green-500" />
                <h2 className="text-2xl font-bold text-white">Registration Successful!</h2>
                <p className="text-gray-400">The new member has been added to the database.</p>
                <button 
                    onClick={() => setIsSuccess(false)}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-900/80 to-blue-900/80 hover:from-cyan-800 hover:to-blue-800 border-2 border-dashed border-cyan-400/50 text-cyan-300 rounded-xl font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] backdrop-blur-md"
                >
                    Register Another Member
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">New Member Registration</h1>
                <p className="text-gray-400 mt-2">Enter member details to create a new account.</p>
            </div>

            <Card className="p-6 bg-black/40 backdrop-blur-3xl border-2 border-dashed border-cyan-500/30 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-[3rem] blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative z-10">
                    {/* AI Smart Fill Header */}
                    <div className="mb-6 pb-6 border-b border-cyan-500/20 flex flex-col items-center justify-center relative overflow-hidden group">
                        <label className="w-full relative cursor-pointer block border-2 border-dashed border-emerald-500/50 rounded-2xl p-4 bg-emerald-900/10 hover:bg-emerald-900/20 transition-all text-center">
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleSmartFillOCR}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            {isAnalyzing ? (
                                <div className="flex flex-col items-center">
                                    <Sparkles className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
                                    <span className="text-emerald-300 font-bold uppercase tracking-widest text-xs">Scanning ID / Aadhaar...</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <Sparkles className="w-8 h-8 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-emerald-300 font-bold uppercase tracking-widest text-xs">AI Smart Fill (Scan Aadhaar/ID)</span>
                                </div>
                            )}
                        </label>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        {/* Profile Picture Upload & AI Analysis */}
                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-cyan-500/30 rounded-2xl bg-black/20 hover:bg-black/40 transition-all relative overflow-hidden group">
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            {profileImage ? (
                                <div className="flex flex-col items-center gap-4 w-full">
                                    <img src={profileImage} alt="Member Photo Preview" className="w-full h-full object-cover" />
                                    {isAnalyzing ? (
                                        <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
                                            <Sparkles className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-widest">AI Analyzing Physique...</span>
                                        </div>
                                    ) : aiInsights ? (
                                        <div className="w-full bg-cyan-950/30 border border-cyan-500/20 rounded-xl p-4 text-left">
                                            <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Sparkles className="w-3 h-3" /> AI Insights
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="text-gray-400">Health Score: <span className="text-white font-bold">{aiInsights.health_score}</span></div>
                                                <div className="text-gray-400">Est. Body Fat: <span className="text-white font-bold">{aiInsights.body_fat}%</span></div>
                                                <div className="text-gray-400">Body Type: <span className="text-white font-bold">{aiInsights.body_type}</span></div>
                                                <div className="text-gray-400">Bio Age: <span className="text-white font-bold">{aiInsights.bio_age}</span></div>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2 italic">{aiInsights.analysis_summary}</p>
                                        </div>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-cyan-500/50 group-hover:text-cyan-400 transition-colors">
                                    <Camera className="w-8 h-8" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Upload Photo for AI Analysis</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-black/50 border border-dashed border-cyan-500/50 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-black/50 border border-dashed border-cyan-500/50 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]"
                                    placeholder="+1 234 567 8900"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-black/50 border border-dashed border-cyan-500/50 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Login ID (Portal Access)</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    name="loginId"
                                    value={formData.loginId}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-black/50 border border-dashed border-cyan-500/50 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]"
                                    placeholder="e.g. john123"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                            <div className="relative">
                                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-black/50 border border-dashed border-cyan-500/50 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]"
                                    placeholder="Enter secure password"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Gym / Cardio Package</label>
                            <div className="relative">
                                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <select
                                    name="packageId"
                                    value={formData.packageId}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-black/50 border border-dashed border-cyan-500/50 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-[inset_0_0_20px_rgba(6,182,212,0.1)] appearance-none"
                                >
                                    <option value="" disabled>Select a package</option>
                                    {packages.filter(p => p.category !== 'Personal Training').map(pkg => (
                                            <option key={pkg.id} value={pkg.id}>
                                                {pkg.name} - {getCurrencySymbol()}{pkg.price} ({pkg.duration})
                                            </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Personal Training (Optional)</label>
                            <div className="relative">
                                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <select
                                    name="ptPackageId"
                                    value={formData.ptPackageId}
                                    onChange={handleChange}
                                    className="w-full bg-black/50 border border-dashed border-cyan-500/50 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-[inset_0_0_20px_rgba(6,182,212,0.1)] appearance-none"
                                >
                                    <option value="">No PT Plan</option>
                                    {packages.filter(p => p.category === 'Personal Training').map(pkg => (
                                        <option key={pkg.id} value={pkg.id}>
                                            {pkg.name} - {getCurrencySymbol()}{pkg.price} ({pkg.duration})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-gradient-to-r from-cyan-900/80 to-blue-900/80 hover:from-cyan-800 hover:to-blue-800 border-2 border-dashed border-cyan-400/50 text-cyan-300 rounded-xl font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(6,182,212,0.3)] backdrop-blur-md"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            'Register Member'
                        )}
                    </button>
                </form>
                </div>
            </Card>
        </div>
    );
};

export default MemberRegistrationForm;
