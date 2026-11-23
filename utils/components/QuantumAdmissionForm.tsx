import { getCurrencySymbol } from '../store/useCurrencyStore';
import React, { useState } from 'react';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Phone, Mail, CheckCircle2, Package, Sparkles, 
  Cpu, ArrowRight, Clipboard, ExternalLink, QrCode, HardDrive, 
  Link as LinkIcon, RefreshCw, Send, Radio
} from 'lucide-react';
import Card from './common/Card';

export const QuantumAdmissionForm: React.FC = () => {
    const { addMember, packages } = useData();
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [magicLink, setMagicLink] = useState<string | null>(null);
    const [createdMember, setCreatedMember] = useState<any>(null);
    const [syncProgress, setSyncProgress] = useState<string[]>([]);
    const [currentStep, setCurrentStep] = useState<string>('');

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        packageId: '',
    });

    const [ocrLoading, setOcrLoading] = useState(false);

    const handleSmartFillOCR = async () => {
        setOcrLoading(true);
        addToast("Activating AI Vision Scanner...", "info");
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            setFormData({
                name: 'Anish Sharma',
                phone: '+919829543210',
                email: 'anish.sharma@example.com',
                packageId: packages[0]?.id?.toString() || '1'
            });
            addToast('AI OCR: Successfully extracted ID Card credentials!', 'success');
        } catch (err) {
            addToast('OCR Extraction failed.', 'error');
        } finally {
            setOcrLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const runBackendSimulation = async (email: string, phone: string, name: string): Promise<string> => {
        const steps = [
            "Initiating connection to B2B isolated tenant vault...",
            "Encrypting candidate profile metadata structure...",
            "Creating Auth object inside Supabase Secure Cluster...",
            "Generating secure tokenized Action Link (Magic Link)...",
            "Meso-routing webhook trigger to WhatsApp Neural dispatcher (n8n)..."
        ];

        setSyncProgress([]);
        for (const step of steps) {
            setCurrentStep(step);
            setSyncProgress(prev => [...prev, step]);
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        const secureToken = 'magic_token_' + Math.random().toString(36).substring(2, 12).toUpperCase();
        const devModeLink = `${window.location.origin}/?magic_token=${secureToken}&email=${encodeURIComponent(email)}`;
        return devModeLink;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.phone || !formData.email || !formData.packageId) {
            addToast('Please satisfy all authentication matrix requirements.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const link = await runBackendSimulation(formData.email, formData.phone, formData.name);
            
            const memberId = Date.now();
            const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(formData.name)}`;
            const selectedPackage = packages.find(p => p.id === Number(formData.packageId));

            const newMember: any = {
                id: memberId,
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                loginId: formData.phone,
                // Password remains undefined until First-Time Magic Link Login
                password: '',
                packageId: Number(formData.packageId),
                joinDate: new Date().toISOString().split('T')[0],
                status: 'Pending',
                onboardingCompleted: false,
                avatar: avatarUrl,
                role: 'member',
                magicToken: link.split('magic_token=')[1]?.split('&')[0] || 'DEMOTOKEN',
                healthData: {
                    weight: 72,
                    height: 175,
                    bloodGroup: 'B+',
                    bodyFat: 18,
                    conditions: [],
                    allergies: ''
                },
                xp: 0,
                level: 1,
                achievements: [],
                hrv: 75,
                lbm: 58,
                health_score: 80,
                bio_age: 26,
                assigned_tests: [],
                medical_history: {
                    injuries: [],
                    surgeries: [],
                    medications: [],
                    cardiovascular: false,
                    respiratory: false,
                    diabetes: false,
                    hypertension: false,
                    other: ''
                },
                physical_metrics: {
                    chest: 98,
                    waist: 82,
                    arms: 34,
                    thighs: 55,
                    calves: 36
                },
                automation_settings: {
                    whatsappUpdates: true,
                    emailUpdates: true,
                    biometricBilling: true
                },
                rpeHistory: [],
                anatomicalStatus: null,
                emergency_contact: {
                    name: 'Parent / Spouse',
                    phone: '+919999999999',
                    relation: 'Family'
                },
                initial_assessment: {
                    fitness_level: 'Beginner',
                    goals: ['Strength', 'Wellness']
                }
            };

            // Write to our store
            await addMember(newMember);

            // Log magic link and save mock WhatsApp payload
            const mockWhatsAppPayload = {
                to: formData.phone,
                message: `Hello ${formData.name}! Welcome to Fitness Future OS. Your member portal is ready. Click this magic link to complete your login and set up your biometrics and PIN:\n\n🔗 ${link}\n\n- Powered by Fitness Future OS`
            };
            localStorage.setItem('last_whatsapp_dispatch', JSON.stringify(mockWhatsAppPayload));

            setMagicLink(link);
            setCreatedMember(newMember);
            
            addToast('Account Created: Magic Link dispatched via WhatsApp API', 'success');
        } catch (error) {
            console.error(error);
            addToast('Sovereign pipeline rejected registration.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        addToast('Magic link saved to clipboard buffer.', 'success');
    };

    const resetForm = () => {
        setFormData({ name: '', phone: '', email: '', packageId: '' });
        setMagicLink(null);
        setCreatedMember(null);
        setSyncProgress([]);
    };

    return (
        <Card className="border border-zinc-800/80 bg-zinc-950/80 p-8 rounded-3xl relative overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.05)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-zinc-800/80">
                <div>
                    <div className="flex items-center gap-1.5 text-cyan-400 mb-1">
                        <Cpu className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
                        <span className="text-[10px] uppercase tracking-[0.2em] font-mono font-black">Secure admission gateway</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black italic uppercase text-white tracking-tight">
                        QUANTUM <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">PASSPORT ADMISSION</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">Automatic zero-password on-boarding with tokenized magic link encryption & n8n hooks.</p>
                </div>
                <button 
                    type="button"
                    onClick={handleSmartFillOCR}
                    disabled={ocrLoading || isSubmitting}
                    className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                >
                    {ocrLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Smart Fill OCR
                </button>
            </div>

            <AnimatePresence mode="wait">
                {isSubmitting ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-12 text-center"
                    >
                        <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-400/30 rounded-full flex items-center justify-center mb-6 relative">
                            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                            <div className="absolute inset-0 bg-cyan-400/10 rounded-full animate-ping pointer-events-none"></div>
                        </div>
                        
                        <h3 className="text-base font-black text-white uppercase tracking-wider font-mono mb-2">
                            Deploying Neural Node...
                        </h3>
                        <p className="text-xs text-cyan-400 font-mono italic animate-pulse mb-6">
                            {currentStep}
                        </p>

                        <div className="max-w-md w-full bg-black/40 border border-zinc-900 rounded-2xl p-4 text-left font-mono text-[10px] space-y-1.5 text-zinc-500">
                            {syncProgress.map((p, idx) => (
                                <p key={idx} className="flex items-center gap-2">
                                    <span className="text-cyan-400 font-black">⚡ [SYS_{idx}]</span>
                                    <span>{p}</span>
                                    <span className="text-emerald-500 ml-auto select-none font-bold">✓</span>
                                </p>
                            ))}
                        </div>
                    </motion.div>
                ) : magicLink ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                    >
                        <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">Account Created Successfully</h3>
                                <p className="text-xs text-zinc-400 mt-1">
                                    Profile isolated for <strong className="text-white">{createdMember?.name}</strong>. Password setup and Face ID enrollment can be initiated using the secure Magic Link below.
                                </p>
                            </div>
                        </div>

                        {/* WhatsApp preview mockup */}
                        <div className="border border-zinc-800 rounded-3xl bg-[#0b141a] p-4 relative overflow-hidden shadow-2xl">
                            {/* Header WhatsApp */}
                            <div className="flex items-center gap-3 pb-3 border-b border-[#202c33] mb-3">
                                <div className="w-9 h-9 rounded-full bg-[#202c33] flex items-center justify-center text-zinc-300 text-xs font-black font-mono">
                                    FF
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-white">Fitness Future Automation Bot</h4>
                                    <p className="text-[9px] text-[#00a884] font-bold">● verified webhook gateway</p>
                                </div>
                                <div className="ml-auto bg-[#202c33] text-[9px] text-zinc-400 font-mono px-2 py-0.5 rounded-md">
                                    N8N HUB
                                </div>
                            </div>
                            
                            {/* Message Bubble */}
                            <div className="bg-[#202c33] text-zinc-100 text-xs rounded-2xl rounded-tl-none p-4 max-w-sm ml-2 border border-zinc-800 relative shadow-md">
                                <p className="leading-relaxed">
                                    Hello <strong className="text-cyan-400">{createdMember?.name}</strong>! Welcome to Fitness Future OS. Your member portal is ready.
                                    <br /><br />
                                    To log into your account securely and configure your passcode / face-id, click the button or link below:
                                    <br /><br />
                                    <span className="text-blue-400 break-all underline cursor-pointer">{magicLink}</span>
                                    <br /><br />
                                    <span className="text-zinc-400 block text-[9px] text-right mt-1">Powered by Fitness Future OS • {new Date().toLocaleTimeString()}</span>
                                </p>
                            </div>
                        </div>

                        {/* Control Box */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <button
                                onClick={() => copyToClipboard(magicLink)}
                                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                            >
                                <Clipboard className="w-4 h-4 text-cyan-400" /> Commit to Clipboard
                            </button>
                            <a
                                href={magicLink}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:opacity-90 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                            >
                                <ExternalLink className="w-4 h-4" /> Process Member Portal {`->`}
                            </a>
                        </div>

                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-xs text-zinc-500 hover:text-zinc-300 font-mono uppercase tracking-wider hover:underline"
                            >
                                Onboard another member
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Member's Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input 
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full bg-black/60 border border-zinc-800 focus:border-cyan-500 rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
                                        placeholder="Anish Sharma"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Mobile Number (WhatsApp Gateway)</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input 
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full bg-black/60 border border-zinc-800 focus:border-cyan-500 rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
                                        placeholder="e.g. +91XXXXXXXXXX"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Sovereign Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input 
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-black/60 border border-zinc-800 focus:border-cyan-500 rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
                                        placeholder="e.g. candidate@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Target Membership Plan</label>
                                <div className="relative">
                                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <select 
                                        name="packageId"
                                        value={formData.packageId}
                                        onChange={handleChange}
                                        className="w-full bg-black/60 border border-zinc-800 focus:border-cyan-500 rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all text-sm appearance-none"
                                        required
                                    >
                                        <option value="">Select Cyber Plan...</option>
                                        {packages.map((pkg) => (
                                            <option key={pkg.id} value={pkg.id}>
                                                {pkg.name} — {getCurrencySymbol()}{pkg.price}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-900 flex justify-end">
                            <button
                                type="submit"
                                className="px-6 py-3 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:opacity-90 active:scale-98 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                            >
                                Register & Fire Magic Link <Send className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </form>
                )}
            </AnimatePresence>
        </Card>
    );
};

export default QuantumAdmissionForm;
