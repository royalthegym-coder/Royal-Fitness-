import { getCurrencySymbol } from '../store/useCurrencyStore';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Check, Activity, ShieldCheck, Zap, Sparkles, Building, ChevronRight, User, Mail, Phone, ArrowLeft, RefreshCw, CheckCircle2, Image as ImageIcon, MapPin, Link2, CreditCard, MessageSquare, Briefcase, PenTool, Navigation, Trash2 } from 'lucide-react';
import { useData } from '../context/DataProvider';
import { useGym, tenantToGymConfig } from '../context/GymProvider';
import { useTenantStore } from '../store/useTenantStore';
import { compressImageFile, normalizeSafeExternalUrl } from '../imageUpload';

interface GymRegistrationFlowProps {
    onComplete: (adminDetails: any) => void;
    onCancel: () => void;
}

export const GymRegistrationFlow: React.FC<GymRegistrationFlowProps> = ({ onComplete, onCancel }) => {
    const { setOSSubscription } = useData();
    const { registerGymConfig } = useGym();
    
    // Steps: 1 = Plans, 2 = Payment Processing, 3 = Details Form
    const [step, setStep] = useState<1 | 2 | 3>(1);
    
    // Form Details
    const [gymName, setGymName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    
    // Additional Automations & Profiles
    const [gymLogo, setGymLogo] = useState<string | null>(null);
    const [ownerSignature, setOwnerSignature] = useState<string | null>(null);
    const [gymAddress, setGymAddress] = useState('');
    const [googleLocationUrl, setGoogleLocationUrl] = useState('');
    const [upiId, setUpiId] = useState('');
    const [razorpayConnected, setRazorpayConnected] = useState(false);
    const [googleBusinessConnected, setGoogleBusinessConnected] = useState(false);
    const [whatsappBusinessConnected, setWhatsappBusinessConnected] = useState(false);
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [uploadError, setUploadError] = useState('');

    // Subscription
    const [billingCycle, setBillingCycle] = useState<'Monthly' | 'Yearly'>('Monthly');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedTier, setSelectedTier] = useState<'Basic' | 'Premium' | 'Elite' | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    const plans = [
        {
            name: 'Basic OS',
            monthlyPrice: 5000,
            yearlyPrice: 4000,
            icon: <ShieldCheck className="w-8 h-8 text-cyan-400" />,
            tagline: 'Start Your Digital Journey',
            desc: 'The perfect foundation. Transition from paper to a fully digitized, lightning-fast gym management system.',
            marketingText: 'Stop losing money to manual errors. Basic OS digitizes your entire facility, giving you crystal clear visibility into your members, billing, and staff.',
            features: [
                'Digital Member Management',
                'Billing & Auto-Invoicing',
                'Integrated Point of Sale (POS)',
                'Live Attendance Logs',
                'Staff & Expense Tracking',
                'Standard Diet & Workout Engine',
                'Core Analytics Dashboard'
            ]
        },
        {
            name: 'Premium OS',
            monthlyPrice: 8000,
            yearlyPrice: 6400,
            icon: <Zap className="w-8 h-8 text-fuchsia-400" />,
            tagline: 'Dominate Your Market',
            desc: 'Unleash advanced AI automation to market your gym, retain members, and predict revenue on autopilot.',
            marketingText: 'Why work in your business when the AI can work for you? Premium OS automates your WhatsApp marketing, tracks biometric attendance, and predicts your next month\'s revenue.',
            features: [
                'Everything in Basic OS',
                'AI WhatsApp bot & Reminders',
                'Fitness Future Pay Wallet',
                'Custom EMI Payment Plans',
                'AI Sleep & Fitness Tracking',
                'Lead CRM & Revenue Oracle',
                'Bio-Pass Face ID Integration'
            ],
            popular: true
        },
        {
            name: 'Elite OS',
            monthlyPrice: 12000,
            yearlyPrice: 9600,
            icon: <Crown className="w-8 h-8 text-amber-500" />,
            tagline: 'The Absolute FitnessFutureMatrix',
            desc: 'The ultimate, no-compromise AI ecosystem. Futuristic computer vision and autonomous agents run your gym.',
            marketingText: 'Make your gym famous. Elite OS brings Iron-Man level technology to your facility. From Real-time Form Correction to 3D Digital Twins of your members.',
            features: [
                'Everything in Premium OS',
                'Autonomous Automated AI',
                'Real-Time Form Analyzer',
                '3D Digital Twin Tracking',
                'Virtual AI Bio-Analyst & Injury Oracle',
                'Gym Metaverse & Visual Social',
                'Smart Command Center'
            ]
        }
    ];

    const handleSelectPlan = (tier: 'Basic' | 'Premium' | 'Elite', price: number) => {
        setSelectedTier(tier);
        setStep(2);
        
        // Process payment gateway delay
        setTimeout(() => {
            setPaymentSuccess(true);
            
            // Wait a moment before going to details form
            setTimeout(() => {
                const newSub = {
                    tier,
                    billingCycle,
                    price: billingCycle === 'Yearly' ? price * 12 : price,
                    expiryDate: new Date(Date.now() + (billingCycle === 'Yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
                };
                setOSSubscription(newSub);
                localStorage.setItem('fitness_future_os_sub', JSON.stringify(newSub));
                setStep(3);
            }, 1500);
            
        }, 3000);
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setUploadError('');
            const compressed = await compressImageFile(file, { maxWidth: 420, maxHeight: 420, preserveAlpha: true });
            setGymLogo(compressed);
        } catch (err: any) {
            setUploadError(err?.message || 'Failed to upload logo image.');
        }
    };

    const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setUploadError('');
            const compressed = await compressImageFile(file, { maxWidth: 520, maxHeight: 200, preserveAlpha: true });
            setOwnerSignature(compressed);
        } catch (err: any) {
            setUploadError(err?.message || 'Failed to upload owner signature.');
        }
    };

    const simulateAuth = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
        setTimeout(() => {
            setter(true);
        }, 800);
    };

    const handleSubmitDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        const normalizedMapsUrl = normalizeSafeExternalUrl(googleLocationUrl);
        const themeColor = selectedTier === 'Basic' ? 'cyan' : selectedTier === 'Premium' ? 'fuchsia' : 'amber';

        const tenant = await useTenantStore.getState().registerTenant({
            gymName,
            ownerName: adminName,
            adminName,
            email,
            phoneNumber: phone,
            location: gymAddress || 'Location Setup Pending',
            googleLocationUrl: normalizedMapsUrl,
            logoUrl: gymLogo || '',
            signatureUrl: ownerSignature || '',
            whatsappPhoneId: whatsappNumber || phone,
            upiId: upiId || '',
            planCycle: billingCycle,
            planName: `${selectedTier || 'Elite'} OS`,
        });

        if (tenant) {
            registerGymConfig({
                ...tenantToGymConfig(tenant),
                themeColor,
            });
        } else {
            registerGymConfig({
                gymId: 'new_gym_' + Date.now(),
                gymName,
                ownerName: adminName,
                logoUrl: gymLogo || '',
                signatureUrl: ownerSignature || '',
                themeColor,
                upiId: upiId || '',
                address: gymAddress || 'Location Setup Pending',
                googleLocationUrl: normalizedMapsUrl,
                phone,
                email,
                whatsappNumber: whatsappNumber || phone,
                secretKey: 'secret_' + Date.now(),
                isSetupComplete: true,
            });
        }

        setIsProcessing(false);
        onComplete({ type: 'admin', email, name: adminName, gymId: tenant?.gym_id });
    };

    return (
        <div className="absolute inset-0 z-[200] bg-[#050505] text-white flex flex-col items-center justify-center overflow-y-auto font-sans selection:bg-fuchsia-500/30 w-full min-h-screen pb-12">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <img src={gymLogo || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80"} alt="Gym Logo Preview" className="w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/80 via-transparent to-[#050505]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-fuchsia-500/10 via-transparent to-transparent"></div>
            </div>

            {step === 1 && (
                <button 
                    onClick={onCancel}
                    className="absolute top-6 left-6 z-50 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors backdrop-blur-md border border-white/10"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-400" />
                </button>
            )}

            <div className={`relative z-10 w-full max-w-6xl mx-auto px-4 ${step === 1 ? 'mt-32' : 'mt-12'}`}>
                
                {step === 1 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full"
                    >
                        <div className="text-center space-y-4 mb-12">
                            <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">Select Subscription <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">Plan</span></h2>
                            <p className="text-zinc-400 text-sm md:text-base font-medium max-w-2xl mx-auto">Choose the revolutionary AI Smart System that fits your ambition. From basic management onwards, we have the precise operational framework for your facility.</p>
                            
                            <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-full inline-flex p-1.5 mt-8 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                <button 
                                    onClick={() => setBillingCycle('Monthly')}
                                    className={`px-8 py-3 rounded-full text-sm font-black uppercase tracking-widest transition-all ${billingCycle === 'Monthly' ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    Monthly
                                </button>
                                <button 
                                    onClick={() => setBillingCycle('Yearly')}
                                    className={`px-8 py-3 rounded-full text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 ${billingCycle === 'Yearly' ? 'bg-fuchsia-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.4)]' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    Yearly <span className="bg-amber-400 text-black text-[10px] px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]">Save 20%</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch pt-4">
                            {plans.map((plan) => (
                                <div key={plan.name} className={`relative p-1 rounded-3xl transition-transform duration-500 hover:-translate-y-2 ${plan.popular ? 'bg-gradient-to-b from-fuchsia-500 via-fuchsia-500/20 to-black scale-105 z-10' : 'bg-white/10'}`}>
                                    {plan.popular && (
                                        <div className="absolute -top-5 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-black text-[10px] uppercase tracking-[0.2em] px-6 py-2 left-1/2 -translate-x-1/2 shadow-[0_0_20px_rgba(217,70,239,0.5)] flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-amber-300" /> RECOMMENDED
                                        </div>
                                    )}
                                    <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[22px] h-full flex flex-col hover:bg-[#0f0f0f] transition-colors relative overflow-hidden group">
                                        
                                        <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full mix-blend-screen transition-opacity ${plan.popular ? 'bg-fuchsia-500/30 opacity-100' : 'bg-cyan-500/20 opacity-0 group-hover:opacity-100'}`}></div>

                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className="flex items-start gap-4 mb-6">
                                                <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md`}>
                                                    {plan.icon}
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-white tracking-widest uppercase">{plan.name}</h3>
                                                    <p className="text-xs text-zinc-400 font-medium tracking-wide mt-1">{plan.tagline}</p>
                                                </div>
                                            </div>
                                            
                                            <p className="text-sm text-zinc-400 mb-4 min-h-[60px]">{plan.desc}</p>
                                            
                                            <div className="bg-white/5 border left-0 border-white/10 rounded-xl p-4 mb-6 relative overflow-hidden">
                                                 <div className={`absolute top-0 right-0 w-16 h-16 blur-[30px] rounded-full mix-blend-screen transition-opacity ${plan.popular ? 'bg-fuchsia-500/30' : 'bg-cyan-500/20'}`}></div>
                                                 <p className="text-xs text-zinc-300 font-medium italic relative z-10 leading-relaxed">&ldquo;{plan.marketingText}&rdquo;</p>
                                            </div>

                                            <div className="my-6 pb-6 border-b border-white/10">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-5xl font-black text-white italic tracking-tighter">{getCurrencySymbol()}{billingCycle === 'Yearly' ? plan.yearlyPrice.toLocaleString() : plan.monthlyPrice.toLocaleString()}</span>
                                                    <span className="text-zinc-500 font-medium">/month</span>
                                                </div>
                                                {billingCycle === 'Yearly' && (
                                                    <div className="text-sm font-bold text-emerald-400 mt-2 flex items-center gap-1">
                                                        Billed {getCurrencySymbol()}{(plan.yearlyPrice * 12).toLocaleString()} yearly
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-h-[220px]">
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Core Capabilities</p>
                                                <ul className="space-y-4 mb-10">
                                                    {plan.features.map((feature, i) => (
                                                        <li key={i} className="flex items-start gap-3 group/item">
                                                            <div className="mt-0.5 w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover/item:bg-cyan-500/30 transition-colors shrink-0">
                                                                <Check className="w-3 h-3 text-cyan-400" />
                                                            </div>
                                                            <span className="text-zinc-300 font-medium text-sm leading-tight">{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <button 
                                                onClick={() => handleSelectPlan(plan.name.replace(' OS', '') as 'Basic'|'Premium'|'Elite', billingCycle === 'Yearly' ? plan.yearlyPrice : plan.monthlyPrice)}
                                                className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all md:absolute bottom-8 left-8 right-8 ${
                                                    plan.popular 
                                                        ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-[0_0_30px_rgba(217,70,239,0.3)] hover:shadow-[0_0_40px_rgba(217,70,239,0.5)]' 
                                                        : 'bg-white/10 hover:bg-white/20 text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                                                }`}
                                                style={{ width: 'calc(100% - 4rem)' }}
                                            >
                                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                                                <span className="relative flex items-center justify-center gap-2">
                                                    Proceed to Payment
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md mx-auto bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-[0_0_100px_rgba(0,0,0,1)] text-center relative overflow-hidden"
                    >
                         <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 rounded-[3rem] blur opacity-30"></div>
                         <div className="relative z-10 flex flex-col items-center">
                            {!paymentSuccess ? (
                                <>
                                    <RefreshCw className="w-16 h-16 text-cyan-400 animate-spin mb-6" />
                                    <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Processing Payment...</h3>
                                    <p className="text-sm text-zinc-400">Securely routing Razorpay mandate authorization.</p>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce mb-6" />
                                    <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Payment Successful!</h3>
                                    <p className="text-sm text-zinc-400 mb-6">Subscription active. Routing to Gym details form.</p>
                                    <div className="w-full bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-left">
                                        <p className="text-xs text-emerald-400 font-mono">TNX_ID: RZP_{Math.floor(Math.random()*1000000)}</p>
                                        <p className="text-xs text-emerald-400 font-mono">TIER: {selectedTier} OS Matrix</p>
                                    </div>
                                </>
                            )}
                         </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl mx-auto bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-[0_0_100px_rgba(0,0,0,1)] relative"
                    >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 rounded-[3rem] blur opacity-30"></div>
                        <div className="relative z-10">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white mb-2">Gym <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">Information</span></h1>
                                <p className="text-xs text-zinc-400 uppercase tracking-widest">Provide the institutional details for OS deployment</p>
                            </div>

                            <form onSubmit={handleSubmitDetails} className="space-y-5">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Gym Name</label>
                                    <div className="relative">
                                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                                        <input 
                                            type="text" required value={gymName} onChange={e => setGymName(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                            placeholder="e.g. Golds Gym"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Gym Owner Name *</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                                            <input 
                                                type="text" required value={adminName} onChange={e => setAdminName(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                                placeholder="e.g. Vikram Sharma"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Owner Email ID *</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                                            <input 
                                                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                                placeholder="owner@yourgym.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Mobile Number *</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                                            <input 
                                                type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                                placeholder="+91 9876543210"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">UPI ID *</label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                                            <input 
                                                type="text" required value={upiId} onChange={e => setUpiId(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                                placeholder="yourgym@okaxis"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Gym Address *</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                                        <input 
                                            type="text" required value={gymAddress} onChange={e => setGymAddress(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                            placeholder="Full physical address for receipts & maps"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Google Location Link (Google Maps URL) *</label>
                                    <div className="relative">
                                        <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                                        <input 
                                            type="text" required value={googleLocationUrl} onChange={e => setGoogleLocationUrl(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                            placeholder="https://maps.app.goo.gl/... or Google Maps URL"
                                        />
                                    </div>
                                </div>
                                {uploadError && (
                                    <p className="text-xs text-red-400 font-semibold">{uploadError}</p>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Gym Logo Upload *</label>
                                        <div className="relative border-2 border-dashed border-white/10 rounded-xl p-4 text-center hover:border-cyan-500/50 transition-colors cursor-pointer bg-black/50">
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                required={!gymLogo}
                                            />
                                            {gymLogo ? (
                                                <div className="flex items-center justify-center gap-3">
                                                    <img src={gymLogo} alt="Gym Logo" className="w-12 h-12 rounded-xl object-contain bg-white p-1 border border-amber-500/30" />
                                                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Logo Uploaded ✓</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-500 flex flex-col items-center justify-center gap-1">
                                                    <ImageIcon className="w-5 h-5 text-cyan-500" /> 
                                                    <span>Upload Gym Logo</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Gym Owner Signature Upload *</label>
                                        <div className="relative border-2 border-dashed border-white/10 rounded-xl p-4 text-center hover:border-fuchsia-500/50 transition-colors cursor-pointer bg-black/50">
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                onChange={handleSignatureUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                required={!ownerSignature}
                                            />
                                            {ownerSignature ? (
                                                <div className="flex items-center justify-center gap-3">
                                                    <div className="h-12 w-24 rounded-lg bg-white p-1 flex items-center justify-center">
                                                        <img src={ownerSignature} alt="Owner Signature" className="max-h-full max-w-full object-contain" />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Signature ✓</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-500 flex flex-col items-center justify-center gap-1">
                                                    <PenTool className="w-5 h-5 text-fuchsia-400" /> 
                                                    <span>Upload Owner Signature</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="pt-2">
                                    <h3 className="text-sm font-black text-white italic tracking-tighter uppercase mb-3 flex items-center gap-2"><Link2 className="w-4 h-4 text-fuchsia-500"/> Connect Automations</h3>
                                    <div className="space-y-3">
                                        {/* Razorpay & UPI */}
                                        <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-500/10 rounded-lg"><CreditCard className="w-5 h-5 text-blue-400"/></div>
                                                <div>
                                                    <p className="text-xs font-bold text-white uppercase tracking-widest">Payments (Razorpay/UPI)</p>
                                                    <p className="text-[10px] text-gray-500">Automate fee collection & receipts</p>
                                                </div>
                                            </div>
                                            <div className="flex w-full sm:w-auto items-center gap-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Enter UPI ID"
                                                    value={upiId}
                                                    onChange={e => setUpiId(e.target.value)}
                                                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 w-full sm:w-32"
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => simulateAuth(setRazorpayConnected)}
                                                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${razorpayConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                                                >
                                                    {razorpayConnected ? 'Connected ✓' : 'Connect'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* WhatsApp Business */}
                                        <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-500/10 rounded-lg"><MessageSquare className="w-5 h-5 text-emerald-400"/></div>
                                                <div>
                                                    <p className="text-xs font-bold text-white uppercase tracking-widest">WhatsApp Business</p>
                                                    <p className="text-[10px] text-gray-500">Automate member reminders & alerts</p>
                                                </div>
                                            </div>
                                            <div className="flex w-full sm:w-auto items-center gap-2">
                                                <input 
                                                    type="tel" 
                                                    placeholder="WhatsApp Mobile No"
                                                    value={whatsappNumber}
                                                    onChange={e => setWhatsappNumber(e.target.value)}
                                                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 w-full sm:w-36"
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => simulateAuth(setWhatsappBusinessConnected)}
                                                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${whatsappBusinessConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                                                >
                                                    {whatsappBusinessConnected ? 'Verified ✓' : 'Verify'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Google Business */}
                                        <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-rose-500/10 rounded-lg"><Briefcase className="w-5 h-5 text-rose-400"/></div>
                                                <div>
                                                    <p className="text-xs font-bold text-white uppercase tracking-widest">Google Business</p>
                                                    <p className="text-[10px] text-gray-500">Sync reviews, ratings & maps info</p>
                                                </div>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => simulateAuth(setGoogleBusinessConnected)}
                                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors w-full sm:w-auto ${googleBusinessConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-white hover:bg-gray-200 text-black'}`}
                                            >
                                                {googleBusinessConnected ? 'Connected ✓' : 'Login via Google'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button disabled={isProcessing} type="submit" className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex justify-center items-center gap-2">
                                        {isProcessing ? <Activity className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                        {isProcessing ? 'Deploying OS & Automations...' : 'Initialize OS Platform'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default GymRegistrationFlow;
