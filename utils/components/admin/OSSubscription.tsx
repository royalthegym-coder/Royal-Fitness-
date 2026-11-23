import { getCurrencySymbol } from '../../store/useCurrencyStore';
import React, { useState, useEffect } from 'react';
import { 
    Crown, Check, Shield, Zap, Sparkles, Activity, Cpu, Globe, 
    Calculator, AlertCircle, FileText, CheckCircle2, RefreshCw, Info, Lock
} from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { toDataURL } from 'qrcode';

export const OSSubscription: React.FC = () => {
    const { osSubscription, setOSSubscription } = useData();
    const [billingCycle, setBillingCycle] = useState<'Monthly' | 'Yearly'>('Monthly');
    const [isLoading, setIsLoading] = useState(false);
    
    // Modern SaaS interactive states
    const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<any | null>(null);
    const [superAdminQrCode, setSuperAdminQrCode] = useState<string>('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [signature, setSignature] = useState('');
    const [checkoutStep, setCheckoutStep] = useState<'summary' | 'processing' | 'success'>('summary');
    const [activeStepText, setActiveStepText] = useState('Initializing Sandbox Transaction...');
    const [promoCode, setPromoCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(0); // overall percentage extra discount if valid promo
    const [promoMessage, setPromoMessage] = useState('');

    // Interactive add-ons state for calculated quote
    const [addonAiBots, setAddonAiBots] = useState(false);
    const [addonPremiumForms, setAddonPremiumForms] = useState(false);

    useEffect(() => {
        if (selectedPlanForCheckout) {
            const basePrice = billingCycle === 'Yearly' ? selectedPlanForCheckout.yearlyPrice : selectedPlanForCheckout.monthlyPrice;
            const cycleMonths = billingCycle === 'Yearly' ? 12 : 1;
            const totalBasePrice = basePrice * cycleMonths;
            const discountAmount = totalBasePrice * (appliedDiscount / 100);
            const addOnCost = (addonAiBots ? 500 : 0) + (addonPremiumForms ? 300 : 0);
            const totalToPay = totalBasePrice - discountAmount + (addOnCost * cycleMonths);
            
            // Dedicated Fitness Future Licensing UPI ID for gym subscription payments
            const superAdminUpi = 'your-upi@bank';
            const note = `SaaS-${selectedPlanForCheckout.id}-${billingCycle}`.substring(0, 20);
            const uri = `upi://pay?pa=${superAdminUpi}&pn=Fitness%20Future%20Licensing&am=${totalToPay.toFixed(2)}&cu=INR&tn=${note}`;
            
            toDataURL(uri, { width: 350, margin: 1 })
                .then(setSuperAdminQrCode)
                .catch(err => console.error("UPI QR creation failed", err));
        }
    }, [selectedPlanForCheckout, billingCycle, appliedDiscount, addonAiBots, addonPremiumForms]);

    const plans = [
        {
            id: 'Basic' as const,
            name: 'Power Rise Suite',
            monthlyPrice: 3999,
            yearlyPrice: 3199, // 20% discount
            icon: <Activity className="w-6 h-6 text-blue-400" />,
            tagline: 'Strategic automation for growing studios & boutique gyms',
            marketingText: 'Take full control of your gym floor. Streamline membership onboarding, holographic ID passes, biometric access control networks, and digital billing registers.',
            border: 'border-blue-500/30',
            bg: 'bg-blue-500/5',
            glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)] border-blue-500/30',
            popular: false,
            color: 'blue',
            features: [
                'Up to 1,000 Active Members',
                'Digital Holographic ID Generator',
                'Core Billing Engine & UPI receipt nodes',
                'Basic Automated WhatsApp Alerts',
                'Custom Diet & Daily Routine Logs',
                'Standard Gym Revenue Analytics',
                'Biometric/QR Access Integration'
            ]
        },
        {
            id: 'Premium' as const,
            name: 'Fitness Future Pro Suite',
            monthlyPrice: 4999,
            yearlyPrice: 3999, // 20% discount
            icon: <Cpu className="w-6 h-6 text-emerald-400" />,
            tagline: 'Next-gen gym automation with smart member retention workflows',
            marketingText: 'Unleash elite digital credentials. Bring predictive analytics, live crowd radar maps, automated Razorpay gateways and active HIIT training HUDs to your facility.',
            border: 'border-emerald-500/50',
            bg: 'bg-emerald-500/5',
            glow: 'shadow-[0_0_30px_rgba(16,185,129,0.2)] border-emerald-500/60',
            popular: true,
            color: 'emerald',
            features: [
                'Everything in Power Rise Suite',
                'Unlimited Active Members',
                'Live Crowd Radar & Heatmap Analytics',
                'Advanced Smart Workout Planner & Trainer Logs',
                'Fully Automated Razorpay & UPI Subscriptions',
                'Customized Mobile App Branded Theme',
                'Live Training HUD + Form Analyzer'
            ]
        },
        {
            id: 'Elite' as const,
            name: 'Enterprise Network Suite',
            monthlyPrice: 9999,
            yearlyPrice: 7999, // 20% discount
            icon: <Globe className="w-6 h-6 text-fuchsia-400" />,
            tagline: 'Ultimate multi-branch enterprise network matrix',
            marketingText: 'Maximum scale for multi-city gym franchises. Access member rewards, auto-procurement inventory tracking, and interactive 3D body progress analytics.',
            border: 'border-fuchsia-500/30',
            bg: 'bg-fuchsia-500/5',
            glow: 'shadow-[0_0_25px_rgba(217,70,239,0.15)] border-fuchsia-500/30',
            popular: false,
            color: 'fuchsia',
            features: [
                'Everything in Fitness Future Pro Suite',
                'Federated Multi-branch Cloud Console',
                'Unified 3D Body Progress Simulator',
                'Automated Procurement & Stock Forecasting',
                'Member Loyalty & Rewards System',
                'Priority 24/7 Support with SLA Node',
                'Dedicated Cloud Instance with Full API Access'
            ]
        }
    ];

    const currencySymbol = getCurrencySymbol();

    const handleApplyPromo = () => {
        if (promoCode.trim().toUpperCase() === 'FITFUTURE10') {
            setAppliedDiscount(10);
            setPromoMessage('Promo Applied! Extra 10% discount loaded.');
        } else if (promoCode.trim().toUpperCase() === 'SUPERBIZ') {
            setAppliedDiscount(15);
            setPromoMessage('Promo Applied! Extra 15% discount loaded.');
        } else {
            setAppliedDiscount(0);
            setPromoMessage('Invalid promo code code.');
        }
    };

    const handleOpenCheckout = (plan: any) => {
        setSelectedPlanForCheckout(plan);
        setTermsAccepted(false);
        setSignature('');
        setPromoCode('');
        setAppliedDiscount(0);
        setPromoMessage('');
        setCheckoutStep('summary');
    };

    const triggerSystemUpgrade = async () => {
        if (!termsAccepted) {
            setPromoMessage('⚠️ Please accept the rules, terms, and conditions to proceed with licensing.');
            return;
        }
        if (!signature.trim()) {
            setPromoMessage('⚠️ Please sign using your Administrator credentials to complete the deed.');
            return;
        }

        setCheckoutStep('processing');
        
        const steps = [
            'Verifying cryptographic signature & license block...',
            'Connecting with Central PG Integration Bridge...',
            'Allocating server-side microservice cluster...',
            'Syncing client-side Firestore schemas and security nodes...',
            'Activating Fitness Future Pro automation modules...',
            'Subscription activation complete!'
        ];

        for (let i = 0; i < steps.length; i++) {
            setActiveStepText(steps[i]);
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        const basePrice = billingCycle === 'Yearly' ? selectedPlanForCheckout.yearlyPrice : selectedPlanForCheckout.monthlyPrice;
        const cycleMonths = billingCycle === 'Yearly' ? 12 : 1;
        const totalBasePrice = basePrice * cycleMonths;
        const discountAmount = totalBasePrice * (appliedDiscount / 100);
        const addOnCost = (addonAiBots ? 500 : 0) + (addonPremiumForms ? 300 : 0);
        const finalCalculatedPay = totalBasePrice - discountAmount + (addOnCost * cycleMonths);

        setOSSubscription({
            tier: selectedPlanForCheckout.id,
            billingCycle,
            price: finalCalculatedPay,
            expiryDate: new Date(Date.now() + (billingCycle === 'Yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
        });

        setCheckoutStep('success');
    };

    // Advanced dynamic interactive cost preview
    const calculateCustomCost = () => {
        let total = 0;
        const selectedBase = plans.find(p => p.id === osSubscription.tier) || plans[0];
        const basePrice = billingCycle === 'Yearly' ? selectedBase.yearlyPrice : selectedBase.monthlyPrice;
        total += basePrice;
        if (addonAiBots) total += 500;
        if (addonPremiumForms) total += 300;
        return total;
    };

    return (
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in zoom-in duration-500 select-none pb-24">
            
            {/* Header section representing advanced status */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-white/10 px-4 py-1.5 rounded-full text-xs font-semibold text-zinc-300">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Next-Gen Subscription Portal</span>
                </div>
                
                <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase sm:text-5xl">
                    Fitness Future <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-fuchsia-400 bg-clip-text text-transparent">Enterprise Licensing</span>
                </h2>
                <p className="text-zinc-400 text-sm max-w-2xl mx-auto leading-relaxed">
                    Access elite management tools, predictive metrics and advanced telemetry. Designed based on industry-leading enterprise SaaS suites to maximize your revenue and member retention.
                </p>

                {/* Billing Cycle Selector - Saving 20% highlighted elegantly */}
                <div className="bg-zinc-950 border border-white/10 rounded-full inline-flex p-1.5 mt-8 shadow-inner shadow-black relative group">
                    <div className="absolute -top-3 -right-6 animate-bounce bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg shadow-emerald-500/20">
                        Best Deal
                    </div>
                    <button 
                        onClick={() => setBillingCycle('Monthly')}
                        className={`px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${billingCycle === 'Monthly' ? 'bg-zinc-800 text-white shadow-md border border-white/5' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Monthly
                    </button>
                    <button 
                        onClick={() => setBillingCycle('Yearly')}
                        className={`px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${billingCycle === 'Yearly' ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Yearly <span className="bg-black/20 text-black text-[9px] px-2 py-0.5 rounded-full font-extrabold">Save 20%</span>
                    </button>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 mt-12 items-stretch">
                {plans.map((plan) => {
                    const isActive = osSubscription.tier === plan.id;
                    const priceToShow = billingCycle === 'Yearly' ? plan.yearlyPrice : plan.monthlyPrice;
                    const yearlyBill = plan.yearlyPrice * 12;

                    return (
                        <div 
                            key={plan.id} 
                            className={`relative rounded-3xl p-0.5 transition-all duration-300 hover:translate-y-[-4px] ${
                                plan.popular 
                                    ? 'bg-gradient-to-b from-emerald-500 via-blue-500/20 to-zinc-900 scale-[1.03] shadow-xl shadow-emerald-950/10 z-10' 
                                    : 'bg-gradient-to-b from-white/10 via-white/5 to-transparent'
                            }`}
                        >
                            {/* Glowing effect inside recommendations or active plans */}
                            <div className={`absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 ${isActive ? 'bg-cyan-500/5' : ''}`}></div>

                            {plan.popular && (
                                <span className="absolute -top-3 right-6 bg-gradient-to-r from-emerald-400 to-blue-500 text-black font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-emerald-400/25 flex items-center gap-1.5 z-25">
                                    <Sparkles className="w-3 h-3" /> Recommended Node
                                </span>
                            )}

                            {isActive && (
                                <span className="absolute -top-3 left-6 bg-cyan-400 text-black font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-cyan-400/20 z-20">
                                    ✓ Active Deployment Plan
                                </span>
                            )}

                            <div className="bg-zinc-950/95 border border-white/5 p-6 md:p-8 rounded-[22px] h-full flex flex-col items-stretch">
                                <div className="space-y-4 mb-6">
                                    <div className="flex items-center justify-between">
                                        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                                            {plan.icon}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest">Enterprise Class</span>
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">{plan.name}</h3>
                                    <p className="text-zinc-400 text-xs leading-relaxed min-h-[40px] font-medium">{plan.tagline}</p>
                                </div>

                                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-6 relative overflow-hidden">
                                    <p className="text-[11px] text-zinc-300 font-medium italic relative z-10 leading-relaxed">&ldquo;{plan.marketingText}&ldquo;</p>
                                </div>

                                <div className="mb-6 pb-6 border-b border-white/5 space-y-1">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-extrabold text-white tracking-tighter">
                                            {currencySymbol}{priceToShow.toLocaleString()}
                                        </span>
                                        <span className="text-zinc-500 text-sm font-semibold">/ month</span>
                                    </div>
                                    
                                    {billingCycle === 'Yearly' ? (
                                        <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                            <span>Billed {currencySymbol}{yearlyBill.toLocaleString()} annually</span>
                                            <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-1.5 py-0.5 rounded font-black">SAVE 20%</span>
                                        </div>
                                    ) : (
                                        <div className="text-xs font-medium text-zinc-500">
                                            {currencySymbol}{(plan.monthlyPrice * 12).toLocaleString()} / year overall total
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 flex-1 mb-8">
                                    <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Features Include:</div>
                                    <ul className="space-y-3.5">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <div className={`mt-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center border shrink-0 ${
                                                    plan.popular 
                                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                                        : 'bg-white/5 border-white/10 text-zinc-400'
                                                }`}>
                                                    <Check className="w-2 h-2" />
                                                </div>
                                                <span className="text-zinc-300 font-medium text-xs leading-tight">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button 
                                    onClick={() => handleOpenCheckout(plan)}
                                    disabled={isActive}
                                    className={`w-full py-4 rounded-xl font-bold transition-all uppercase tracking-widest text-xs mt-auto flex items-center justify-center gap-2 ${
                                        isActive
                                        ? 'bg-zinc-800 text-zinc-600 border border-zinc-700/50 cursor-not-allowed' 
                                        : plan.popular 
                                            ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-black hover:scale-95 shadow-lg shadow-emerald-500/10' 
                                            : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                    }`}
                                >
                                    {isActive ? 'Current Deployment Active' : 'Configure Upgrade'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Advanced Quotation & Interactive Cost Calculator */}
            <div className="bg-zinc-900/30 border border-white/10 rounded-3xl p-6 md:p-8 grid md:grid-cols-1 lg:grid-cols-3 gap-8 mt-12 items-center">
                <div className="space-y-3 lg:col-span-2">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-emerald-400" /> Interactive Enterprise Quote Calculator
                    </h3>
                    <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl">
                        Add extra cloud modules to your custom OS infrastructure dynamically. Select extra capabilities to scale operations and monitor your projected budget below in real-time.
                    </p>
                    
                    <div className="grid sm:grid-cols-2 gap-4 mt-4">
                        <label className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer select-none ${addonAiBots ? 'bg-blue-500/5 border-blue-500/30 text-white' : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'}`}>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    checked={addonAiBots} 
                                    onChange={(e) => setAddonAiBots(e.target.checked)}
                                    className="accent-blue-500"
                                />
                                <div className="text-left">
                                    <div className="text-xs font-bold uppercase tracking-wide">Automated WhatsApp Suite</div>
                                    <div className="text-[10px] text-zinc-500">Unlocks automated WhatsApp messaging & follow-ups</div>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-zinc-300">+{currencySymbol}500/mo</span>
                        </label>

                        <label className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer select-none ${addonPremiumForms ? 'bg-emerald-500/5 border-emerald-500/30 text-white' : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'}`}>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    checked={addonPremiumForms} 
                                    onChange={(e) => setAddonPremiumForms(e.target.checked)}
                                    className="accent-emerald-500"
                                />
                                <div className="text-left">
                                    <div className="text-xs font-bold uppercase tracking-wide">Advance Health Diagnostics</div>
                                    <div className="text-[10px] text-zinc-500">Enable medical profiling & DNA intake forms</div>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-zinc-300">+{currencySymbol}300/mo</span>
                        </label>
                    </div>
                </div>

                <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 text-center space-y-4">
                    <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Active Plan Projection</span>
                    <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-black text-white tracking-widest">{currencySymbol}{calculateCustomCost().toLocaleString()}</span>
                        <span className="text-zinc-500 text-xs">/mo</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
                        Estimated annual run: {currencySymbol}{(calculateCustomCost() * 12).toLocaleString()}
                    </div>
                    <p className="text-[10px] text-zinc-600 leading-tight">Incl. custom sandbox allocation variables & primary SLA uptime nodes.</p>
                </div>
            </div>

            {/* Static Terms & Conditions Section (Rules & Compliance) */}
            <div className="bg-zinc-950/80 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
                    <FileText className="w-5 h-5 text-amber-500" />
                    <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Fitness Future License Agreement & Compliance (Terms & Conditions)</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6 text-xs text-zinc-400 leading-relaxed">
                    <div className="space-y-4">
                        <h4 className="font-extrabold text-zinc-300 uppercase tracking-widest">1. Technical SLA & Server Commitment</h4>
                        <p>
                            Fitness Future core infrastructure commits to a minimum 99.99% system availability SLA limit. Server maintenance and pipeline integrations that require updates will occur during offline business hours (02:00 IST to 04:00 IST) with advance telemetry warnings.
                        </p>
                        <h4 className="font-extrabold text-zinc-300 uppercase tracking-widest">2. Auto-Renewal Terms</h4>
                        <p>
                            All licenses automatically renew on the scheduled expiry date. Upgrading or updating subscription cycles mid-term triggers relative credit distributions securely, directly offset in the central SaaS ledger.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-extrabold text-zinc-300 uppercase tracking-widest">3. Strict Refund & Cancellation Policy</h4>
                        <p>
                            To prevent transaction fraud and keep cloud sandboxes stable, cancellations occurring post-processing are eligible for a 24-hour grace offset. Beyond this, all sales on licenses are final.
                        </p>
                        <h4 className="font-extrabold text-zinc-300 uppercase tracking-widest">4. Data Ownership & Sovereignty</h4>
                        <p>
                            Fitness Future guarantees total sovereignty of member records, diet cards, biometrics, and telemetry. Under no circumstances are records distributed or used to feed third-party datasets.
                        </p>
                    </div>
                </div>
                
                <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 text-[11px] text-zinc-400 leading-normal flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                    <span>
                        <strong>Legal Note:</strong> Proceeding to license any package represents legal acknowledgement of these parameters. All business processes under Fitness Future system controls compile under strict secure multi-tenant isolation.
                    </span>
                </div>
            </div>

            {/* Premium Interactive Modal / Checkout Wizard */}
            {selectedPlanForCheckout && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative animate-in zoom-in duration-300">
                        
                        <div className="bg-gradient-to-r from-zinc-900 to-black p-6 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Crown className="w-5 h-5 text-amber-400" />
                                <h3 className="text-md font-black text-white uppercase tracking-wider">Checkout Configuration Matrix</h3>
                            </div>
                            <button 
                                onClick={() => setSelectedPlanForCheckout(null)}
                                className="text-zinc-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {checkoutStep === 'summary' && (
                            <div className="p-6 md:p-8 space-y-6">
                                {/* Plan Identity Snapshot */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Upgrade Class</div>
                                        <h4 className="text-xl font-bold text-white uppercase italic">{selectedPlanForCheckout.name}</h4>
                                        <p className="text-zinc-400 text-xs mt-1">{billingCycle} billing cycle license</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-white">
                                            {currencySymbol}{billingCycle === 'Yearly' 
                                                ? selectedPlanForCheckout.yearlyPrice.toLocaleString() 
                                                : selectedPlanForCheckout.monthlyPrice.toLocaleString()
                                            }<span className="text-zinc-500 text-xs">/mo</span>
                                        </div>
                                        {billingCycle === 'Yearly' && (
                                            <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-2 py-0.5 rounded font-black">20% DISCOUNTED</span>
                                        )}
                                    </div>
                                </div>

                                {/* Promo Code Module */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Apply Promo Code Code</label>
                                    <div className="flex gap-2">
                                        <input 
                                            value={promoCode} 
                                            onChange={(e) => setPromoCode(e.target.value)} 
                                            placeholder="e.g. FITFUTURE10 (10% extra) or SUPERBIZ" 
                                            className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs text-white flex-1 focus:border-cyan-400 focus:outline-none"
                                        />
                                        <button 
                                            onClick={handleApplyPromo}
                                            className="px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
                                        >
                                            Verify
                                        </button>
                                    </div>
                                    {promoMessage && (
                                        <p className={`text-[10px] font-bold ${appliedDiscount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {promoMessage}
                                        </p>
                                    )}
                                </div>

                                {/* Multi-step Cost calculation detail */}
                                <div className="space-y-2 bg-black/40 p-4 rounded-xl border border-white/5 text-xs text-zinc-300">
                                    <div className="flex justify-between">
                                        <span>License Base Charge ({billingCycle}):</span>
                                        <span>
                                            {currencySymbol}
                                            {(billingCycle === 'Yearly' 
                                                ? selectedPlanForCheckout.yearlyPrice * 12 
                                                : selectedPlanForCheckout.monthlyPrice
                                            ).toLocaleString()}
                                        </span>
                                    </div>

                                    {appliedDiscount > 0 && (
                                        <div className="flex justify-between text-emerald-400">
                                            <span>Promo Applied (-{appliedDiscount}%):</span>
                                            <span>
                                                -{currencySymbol}
                                                {((billingCycle === 'Yearly' 
                                                    ? selectedPlanForCheckout.yearlyPrice * 12 
                                                    : selectedPlanForCheckout.monthlyPrice
                                                ) * (appliedDiscount / 100)).toLocaleString()}
                                            </span>
                                        </div>
                                    )}

                                    {addonAiBots && (
                                        <div className="flex justify-between">
                                            <span>Add-on: Automated WhatsApp Suite ({billingCycle}):</span>
                                            <span>+{currencySymbol}{(500 * (billingCycle === 'Yearly' ? 12 : 1)).toLocaleString()}</span>
                                        </div>
                                    )}

                                    {addonPremiumForms && (
                                        <div className="flex justify-between">
                                            <span>Add-on: Advanced Diagnostic Cards:</span>
                                            <span>+{currencySymbol}{(300 * (billingCycle === 'Yearly' ? 12 : 1)).toLocaleString()}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between border-t border-white/10 pt-2 font-bold text-white text-sm">
                                        <span>Total Net Charge:</span>
                                        <span className="text-cyan-400">
                                            {currencySymbol}
                                            {(
                                                ((billingCycle === 'Yearly' ? selectedPlanForCheckout.yearlyPrice * 12 : selectedPlanForCheckout.monthlyPrice) * (1 - appliedDiscount / 100)) +
                                                ((addonAiBots ? 500 : 0) + (addonPremiumForms ? 300 : 0)) * (billingCycle === 'Yearly' ? 12 : 1)
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Fitness Future Licensing UPI Gateway */}
                                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 space-y-4 flex flex-col items-center">
                                    <div className="text-center">
                                        <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest block">FITNESS FUTURE LICENSING UPI PAYMENT</span>
                                        <span className="text-xs text-zinc-400 font-medium block mt-1">
                                            Scan or pay directly to this verified merchant UPI ID for gym subscription licensing
                                        </span>
                                    </div>
                                    
                                    {superAdminQrCode && (
                                         <div className="bg-white p-2.5 rounded-xl shadow-inner border border-zinc-200">
                                             <img src={superAdminQrCode} alt="Fitness Future UPI Payment QR" className="w-36 h-36" />
                                         </div>
                                    )}
                                    
                                    <div className="text-center font-mono text-xs">
                                        <span className="text-zinc-500">UPI ID:</span>{' '}
                                        <span className="text-white font-bold select-all bg-black/60 px-2 py-1 rounded">your-upi@bank</span>
                                    </div>
                                </div>

                                {/* Rules and Agreement Acceptance */}
                                <div className="space-y-4 border-t border-white/5 pt-4">
                                    <label className="flex items-start gap-3 select-none cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={termsAccepted} 
                                            onChange={(e) => setTermsAccepted(e.target.checked)}
                                            className="mt-1 accent-cyan-400"
                                        />
                                        <div className="text-zinc-400 text-[11px] leading-tight text-left">
                                            <strong>Accept Rules & Terms:</strong> I accept the 24-hr refund grace block, strict multi-tenant SLA commitments, and license renew mechanisms for <strong>Fitness Future</strong>.
                                        </div>
                                    </label>

                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Confirm Administrator Electronic Signature</label>
                                        <input 
                                            value={signature} 
                                            onChange={(e) => setSignature(e.target.value)} 
                                            placeholder="Type your Administrator Name to authenticate" 
                                            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-center text-cyan-400 font-bold placeholder-zinc-600 focus:outline-none focus:border-cyan-400 uppercase tracking-widest"
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={triggerSystemUpgrade}
                                    disabled={!termsAccepted || !signature.trim()}
                                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-400 hover:to-emerald-400 text-black font-black uppercase text-xs rounded-xl tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
                                >
                                    <Lock className="w-3.5 h-3.5" /> Deploy Strategic License
                                </button>
                            </div>
                        )}

                        {checkoutStep === 'processing' && (
                            <div className="p-12 text-center space-y-6 flex flex-col items-center">
                                <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
                                <h4 className="text-lg font-bold text-white uppercase italic tracking-wider">Syncing Multi-Tenant Core...</h4>
                                <p className="text-zinc-400 text-xs max-w-sm leading-relaxed">{activeStepText}</p>
                                <div className="w-48 h-1 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-cyan-400 rounded-full animate-pulse w-2/3"></div>
                                </div>
                            </div>
                        )}

                        {checkoutStep === 'success' && (
                            <div className="p-8 text-center space-y-6 flex flex-col items-center">
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400">
                                    <CheckCircle2 className="w-12 h-12" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-black text-white italic uppercase tracking-wider">Upgrade Action Succeeded!</h4>
                                    <p className="text-zinc-400 text-xs">
                                        Your <strong>Fitness Future</strong> deployment block has updated to the <strong>{selectedPlanForCheckout.name}</strong> matrix.
                                    </p>
                                </div>
                                
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-zinc-300 w-full text-left space-y-1.5 font-mono">
                                    <div>⚡ Deployment State: ACTIVE</div>
                                    <div>🛡️ Active Tier: {selectedPlanForCheckout.id.toUpperCase()}</div>
                                    <div>📅 Cycle Status: {billingCycle.toUpperCase()}</div>
                                    <div>🔑 Authorized Signatory: {signature.toUpperCase()}</div>
                                </div>

                                <button 
                                    onClick={() => setSelectedPlanForCheckout(null)}
                                    className="px-6 py-3 bg-white text-black font-extrabold uppercase rounded-xl text-xs tracking-widest hover:scale-95 transition-all"
                                >
                                    Return to Console
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            )}

        </div>
    );
};

export default OSSubscription;
