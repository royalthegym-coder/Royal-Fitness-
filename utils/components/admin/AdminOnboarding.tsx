import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, ShieldCheck, Mail, Phone, MapPin, CheckCircle, ArrowRight, Activity, Globe } from 'lucide-react';
import { useData } from '../../context/DataProvider';

export const AdminOnboarding = ({ onComplete }: { onComplete: () => void }) => {
    const { updateAdminProfile } = useData() as any;
    const [step, setStep] = useState(1);
    const [profile, setProfile] = useState({
        gymName: '',
        ownerName: '',
        email: '',
        phone: '',
        address: '',
        subscriptionLevel: 'none',
        onboarded: true
    });

    const handleNext = () => {
        if (step === 3) {
            updateAdminProfile(profile);
            onComplete();
        } else {
            setStep(step + 1);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] top-0 left-0"></div>
                <div className="absolute w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:20px_20px] opacity-20"></div>
            </div>

            <div className="relative z-10 w-full max-w-2xl bg-black/60 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
                <div className="mb-10 text-center">
                    <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        className="w-20 h-20 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    >
                        <Cpu className="w-10 h-10 text-cyan-400" />
                    </motion.div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter">Fitness Future <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">FitnessFutureOS</span></h1>
                    <p className="text-xs text-gray-400 mt-2 uppercase tracking-widest font-mono">Initialization & Verification Sequence</p>
                </div>

                <div className="flex justify-between items-center mb-8 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/10 -z-10"></div>
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${step >= s ? 'bg-cyan-500 border-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-black border-white/20 text-gray-500'}`}>
                            {s}
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <h2 className="text-xl font-bold">Identity Matrix Setup</h2>
                            <p className="text-sm text-gray-400 mb-6">Enter your gym's official name to initialize the quantum ledger. This name will propagate globally through the OS.</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Gym / Facility Name</label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input 
                                            type="text" 
                                            value={profile.gymName}
                                            onChange={e => setProfile({...profile, gymName: e.target.value})}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors" 
                                            placeholder="e.g. FitnessFuture"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Owner Name</label>
                                        <input 
                                            type="text" 
                                            value={profile.ownerName}
                                            onChange={e => setProfile({...profile, ownerName: e.target.value})}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 transition-colors" 
                                            placeholder="Owner's Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Facility Location</label>
                                        <input 
                                            type="text" 
                                            value={profile.address}
                                            onChange={e => setProfile({...profile, address: e.target.value})}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 transition-colors" 
                                            placeholder="City or Area"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <h2 className="text-xl font-bold">Security Uplink</h2>
                            <p className="text-sm text-gray-400 mb-6">Configure your primary administrative contact details and security credentials. These are required for biometrics and communication.</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input 
                                            type="email" 
                                            value={profile.email}
                                            onChange={e => setProfile({...profile, email: e.target.value})}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors" 
                                            placeholder="admin@neuralomni.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Secure Password</label>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input 
                                            type="password" 
                                            onChange={() => {}}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors" 
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">Encrypted via FitnessFutureKey Distribution (QKD)</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Mobile Number (WhatsApp Enabled)</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input 
                                            type="tel" 
                                            value={profile.phone}
                                            onChange={e => setProfile({...profile, phone: e.target.value})}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors" 
                                            placeholder="+91 9876543210"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <h2 className="text-xl font-bold">Smart OS Subscription Tier</h2>
                            <p className="text-sm text-gray-400 mb-6">Select your gym's operating capacity. Your features and modules will scale based on the selected tier.</p>
                            
                            <div className="grid grid-cols-1 gap-4 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {[
                                    {
                                        id: 'starter',
                                        name: 'Core Base',
                                        price: '₹1,999/mo',
                                        icon: <Activity className="w-6 h-6" />,
                                        color: 'text-zinc-400',
                                        bg: 'bg-zinc-500/10',
                                        border: 'border-zinc-500/30',
                                        desc: 'Essential digitisation for growing gyms.',
                                        features: ['Up to 500 Active Members', 'Basic Billing & Receipts', 'Standard Diet Assignments', 'Manual WhatsApp Alerts']
                                    },
                                    {
                                        id: 'premium',
                                        name: 'Pro Engine',
                                        price: '₹3,499/mo',
                                        icon: <ShieldCheck className="w-6 h-6" />,
                                        color: 'text-blue-400',
                                        bg: 'bg-blue-500/10',
                                        border: 'border-blue-500/30',
                                        desc: 'Automated growth with hardware integrations.',
                                        popular: true,
                                        features: ['Unlimited Members', 'Biometric / QR Access Control', 'Automated Razorpay Billing', 'Deep Member Progress Tracking']
                                    },
                                    {
                                        id: 'elite',
                                        name: 'AI Elite Cortex',
                                        price: '₹5,999/mo',
                                        icon: <Cpu className="w-6 h-6" />,
                                        color: 'text-cyan-400',
                                        bg: 'bg-cyan-500/10',
                                        border: 'border-cyan-500/30',
                                        desc: 'Full intelligence suite with generative capabilities.',
                                        features: ['Everything in Pro Engine', 'AI Diet & Workout Generations', 'Live Crowd Heatmaps', 'Predictive Retention Engine']
                                    },
                                    {
                                        id: 'quantum',
                                        name: 'OS Quantum',
                                        price: 'Custom',
                                        icon: <Globe className="w-6 h-6" />,
                                        color: 'text-fuchsia-400',
                                        bg: 'bg-fuchsia-500/10',
                                        border: 'border-fuchsia-500/30',
                                        desc: 'Dedicated enterprise infrastructure.',
                                        features: ['Multi-branch Central OS Dashboard', 'White-labeled Member Apps', 'Dedicated API Webhooks', 'Priority Neural Support Node']
                                    }
                                ].map((tier) => (
                                    <div 
                                        key={tier.id}
                                        onClick={() => setProfile({...profile, subscriptionLevel: tier.id})}
                                        className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-3 overflow-hidden ${profile.subscriptionLevel === tier.id ? `bg-black/60 ${tier.border}` : 'bg-black/20 border-white/5 hover:border-white/15'}`}
                                    >
                                        {tier.popular && (
                                            <div className="absolute top-0 right-0 bg-blue-500 text-black text-[9px] font-bold px-3 py-1 uppercase tracking-widest rounded-bl-xl">
                                                Most Recommended
                                            </div>
                                        )}
                                        {profile.subscriptionLevel === tier.id && (
                                            <div className={`absolute inset-0 opacity-10 blur-xl ${tier.bg}`}></div>
                                        )}
                                        
                                        <div className="flex items-start justify-between relative z-10">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${profile.subscriptionLevel === tier.id ? `${tier.bg} ${tier.color}` : 'bg-white/5 text-gray-500'}`}>
                                                    {tier.icon}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                                                        {tier.name} 
                                                        {profile.subscriptionLevel === tier.id && <CheckCircle className={`w-4 h-4 ${tier.color}`} />}
                                                    </h3>
                                                    <p className="text-xs text-gray-400">{tier.desc}</p>
                                                </div>
                                            </div>
                                            <div className={`font-mono font-bold tracking-tight ${profile.subscriptionLevel === tier.id ? tier.color : 'text-gray-400'}`}>
                                                {tier.price}
                                            </div>
                                        </div>
                                        
                                        <div className="relative z-10 grid grid-cols-2 gap-2 mt-2">
                                            {tier.features.map((feat, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-[10px] text-gray-400">
                                                    <CheckCircle className={`w-3 h-3 ${profile.subscriptionLevel === tier.id ? tier.color : 'text-gray-600'}`} />
                                                    <span>{feat}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center">
                    <button 
                        onClick={() => setStep(Math.max(1, step - 1))}
                        className={`text-sm text-gray-400 hover:text-white transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    >
                        Back
                    </button>
                    
                    <button 
                        onClick={handleNext}
                        disabled={step === 1 && !profile.gymName}
                        className="bg-cyan-500 text-black px-8 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-cyan-400 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {step === 3 ? 'Deploy OS' : 'Proceed'} <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
