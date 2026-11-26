import React, { useState, useEffect } from 'react';
import { 
    Crown, CheckCircle2, Clock, ShieldCheck, CreditCard, 
    Sparkles, ArrowRight, RefreshCw, Zap, Star, Shield, 
    Gift, QrCode, Wallet, Check, AlertCircle, ChevronRight, X
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { getCurrencySymbol } from '../../store/useCurrencyStore';
import { useData } from '../../context/DataProvider';
import { GYM_INFO } from '../../../constants';
import { toDataURL } from 'qrcode';

export interface MembershipPlan {
    id: number;
    name: string;
    durationLabel: string;
    durationMonths: number;
    price: number;
    originalPrice?: number;
    badge?: string;
    isPopular?: boolean;
    tier: 'monthly' | 'quarterly' | 'annual' | 'vip';
    description: string;
    features: { label: string; included: boolean }[];
}

const MEMBERSHIP_PLANS: MembershipPlan[] = [
    {
        id: 1,
        name: 'Quantum Monthly',
        durationLabel: '1 Month',
        durationMonths: 1,
        price: 1499,
        originalPrice: 1999,
        tier: 'monthly',
        description: 'Ideal foundational plan for gym floor, free weights, and core strength machines.',
        features: [
            { label: 'Gym Floor & Free Weights Access', included: true },
            { label: 'Locker & Shower Facility', included: true },
            { label: 'WhatsApp Digital Invoices & Auto-Reminders', included: true },
            { label: 'Basic AI Nutrition & Diet Sheet', included: true },
            { label: 'Unlimited Group Classes (Yoga, Zumba, HIIT)', included: false },
            { label: 'Personal Training (1-on-1 Sessions)', included: false },
            { label: 'Steam Bath & Recovery Sauna', included: false },
            { label: 'VIP 24/7 Biometric Night Access', included: false }
        ]
    },
    {
        id: 2,
        name: 'Titan Quarterly',
        durationLabel: '3 Months',
        durationMonths: 3,
        price: 3999,
        originalPrice: 4497,
        badge: 'SAVE ₹498',
        tier: 'quarterly',
        description: '3-month transformation commitment including group classes and 1 complimentary PT session.',
        features: [
            { label: 'Gym Floor & Free Weights Access', included: true },
            { label: 'Locker & Shower Facility', included: true },
            { label: 'WhatsApp Digital Invoices & Auto-Reminders', included: true },
            { label: 'Basic AI Nutrition & Diet Sheet', included: true },
            { label: 'Unlimited Group Classes (Yoga, Zumba, HIIT)', included: true },
            { label: '1 Free Personal Training Session', included: true },
            { label: 'Steam Bath & Recovery Sauna', included: false },
            { label: 'VIP 24/7 Biometric Night Access', included: false }
        ]
    },
    {
        id: 3,
        name: 'Sovereign Annual',
        durationLabel: '12 Months',
        durationMonths: 12,
        price: 11999,
        originalPrice: 17988,
        badge: 'MOST POPULAR (33% OFF)',
        isPopular: true,
        tier: 'annual',
        description: 'Complete athletic freedom: 24/7 biometric access, 5 complimentary PT sessions, and steam bath.',
        features: [
            { label: 'Gym Floor & Free Weights Access', included: true },
            { label: 'Locker & Shower Facility', included: true },
            { label: 'WhatsApp Digital Invoices & Auto-Reminders', included: true },
            { label: 'Basic AI Nutrition & Diet Sheet', included: true },
            { label: 'Unlimited Group Classes (Yoga, Zumba, HIIT)', included: true },
            { label: '5 Free Personal Training Sessions', included: true },
            { label: 'Steam Bath & Recovery Sauna Unlimited', included: true },
            { label: 'VIP 24/7 Biometric Night Access', included: true }
        ]
    },
    {
        id: 4,
        name: 'VIP Black-Card Premium',
        durationLabel: '12 Months VIP',
        durationMonths: 12,
        price: 19999,
        originalPrice: 24999,
        badge: 'ULTIMATE FITNESS FUTURE PASS',
        tier: 'vip',
        description: 'Our most elite membership tier: dedicated personal coach, protein bar access, and guest passes.',
        features: [
            { label: 'Gym Floor & Free Weights Access', included: true },
            { label: 'Locker & Shower Facility', included: true },
            { label: 'WhatsApp Digital Invoices & Auto-Reminders', included: true },
            { label: 'Custom Bio-Hacking & DNA Nutrition Plan', included: true },
            { label: 'Unlimited Group Classes (Yoga, Zumba, HIIT)', included: true },
            { label: 'Dedicated Senior Coach (Unlimited Sessions)', included: true },
            { label: 'Steam Bath, Cold Plunge & Sauna', included: true },
            { label: '10 Complimentary Guest Passes for Friends', included: true }
        ]
    }
];

export const GymMembershipManager: React.FC<{ memberId: number }> = ({ memberId }) => {
    const { members, updateMember, addInvoice, addTransaction } = useData();
    const { addToast } = useToast();

    const currentMember = members.find(m => m.id === memberId) || members[0];
    
    // Determine active plan
    const activePlan = MEMBERSHIP_PLANS.find(p => p.id === currentMember?.packageId) || MEMBERSHIP_PLANS[2];

    // State for modal
    const [selectedActionPlan, setSelectedActionPlan] = useState<MembershipPlan | null>(null);
    const [actionType, setActionType] = useState<'renew' | 'upgrade' | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'upi' | 'wallet' | 'card'>('upi');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Days remaining simulation
    const daysRemaining = 24;
    const expiryDateStr = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Generate QR code for checkout
    useEffect(() => {
        if (selectedActionPlan && actionType) {
            const amountToPay = actionType === 'upgrade' 
                ? Math.max(500, selectedActionPlan.price - activePlan.price) 
                : selectedActionPlan.price;
            
            const upiString = `upi://pay?pa=${GYM_INFO.upiIds.gpay1}&pn=${encodeURIComponent(GYM_INFO.name)}&am=${amountToPay}&cu=INR&tn=Gym_${actionType}_Plan_${selectedActionPlan.id}`;
            toDataURL(upiString, { width: 280, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
                .then(url => setQrCodeUrl(url))
                .catch(err => console.error('QR code generation failed:', err));
        }
    }, [selectedActionPlan, actionType, activePlan]);

    // Handle checkout completion
    const handleCompleteCheckout = async () => {
        if (!selectedActionPlan || !actionType) return;
        setIsProcessing(true);
        addToast(`Verifying transaction with payment gateway... (${actionType === 'renew' ? 'Renewal' : 'Upgrade'})`, 'info');

        await new Promise(resolve => setTimeout(resolve, 1400));

        const amountPaid = actionType === 'upgrade'
            ? Math.max(500, selectedActionPlan.price - activePlan.price)
            : selectedActionPlan.price;

        const txnId = `TXN-MEM-${Date.now().toString().slice(-6)}`;

        // Update local member
        if (updateMember && currentMember) {
            updateMember({
                ...currentMember,
                packageId: selectedActionPlan.id,
                status: 'Active'
            });
        }

        // Add invoice record
        if (addInvoice && currentMember) {
            addInvoice({
                id: Date.now(),
                memberId: currentMember.id,
                memberName: currentMember.name,
                packageId: selectedActionPlan.id,
                packageName: `${selectedActionPlan.name} (${actionType.toUpperCase()})`,
                amount: amountPaid,
                date: new Date().toISOString().split('T')[0],
                status: 'Paid',
                paymentMethod: paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'wallet' ? 'Future Pay' : 'Card',
                items: [{
                    description: `Membership ${actionType === 'renew' ? 'Renewal' : 'Upgrade'} - ${selectedActionPlan.name}`,
                    amount: amountPaid,
                    type: 'Membership'
                }]
            } as any);
        }

        if (addTransaction && currentMember) {
            addTransaction({
                id: txnId,
                memberName: currentMember.name,
                amount: amountPaid,
                date: new Date().toISOString().split('T')[0],
                method: paymentMethod === 'upi' ? 'QR Code' : 'Credit Card'
            } as any);
        }

        setIsProcessing(false);
        const actionLabel = actionType === 'renew' ? 'Renewal' : 'Upgrade';
        addToast(`🎉 Congratulations! Your gym membership ${actionLabel} is complete. Active Plan: ${selectedActionPlan.name}`, 'success');
        setSelectedActionPlan(null);
        setActionType(null);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-gray-950 via-amber-950/30 to-black p-8 rounded-[2.5rem] border border-amber-500/30 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Crown className="w-56 h-56 text-amber-400" />
                </div>
                <div className="relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-widest mb-3">
                        <Crown className="w-3.5 h-3.5" />
                        Fitness Future Membership Command Hub
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter">
                        Gym Membership <span className="text-amber-400">Management System</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-2 leading-relaxed font-sans">
                        View your current membership plan, renew in 1-click before expiration, or upgrade to a higher tier to unlock personal training sessions, steam bath, and 24/7 biometric access.
                    </p>
                </div>
            </div>

            {/* CURRENT ACTIVE MEMBERSHIP DASHBOARD CARD */}
            <div className="bg-gradient-to-b from-gray-900/90 to-black/90 border-2 border-amber-500/40 rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.15)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black flex items-center justify-center font-black shadow-[0_0_20px_rgba(245,158,11,0.5)] shrink-0">
                            <Crown className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Active Membership
                                </span>
                                <span className="text-xs font-mono text-gray-500">ID: #{currentMember?.id || 1}</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tight mt-1">
                                {activePlan.name}
                            </h2>
                            <p className="text-xs text-gray-400 font-sans mt-0.5">
                                Member: <strong className="text-white">{currentMember?.name || 'Fitness Future Super Admin'}</strong> | Phone: +91 {currentMember?.phone || '9800000000'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => {
                                setSelectedActionPlan(activePlan);
                                setActionType('renew');
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Renew Plan
                        </button>

                        <button
                            onClick={() => {
                                const nextPlan = MEMBERSHIP_PLANS.find(p => p.id === activePlan.id + 1) || MEMBERSHIP_PLANS[3];
                                setSelectedActionPlan(nextPlan);
                                setActionType('upgrade');
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-mono text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
                        >
                            <Sparkles className="w-4 h-4" />
                            Upgrade Plan
                        </button>
                    </div>
                </div>

                {/* Validity & Benefits Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                    {/* Expiry countdown */}
                    <div className="bg-black/60 border border-white/5 rounded-2xl p-5 space-y-2">
                        <div className="text-[10px] font-mono uppercase text-gray-500 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            Validity Countdown
                        </div>
                        <div className="text-3xl font-black text-amber-400 font-mono">
                            {daysRemaining} Days Left
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                            Expiry Date: <strong className="text-white">{expiryDateStr}</strong>
                        </div>
                    </div>

                    {/* Plan features unlocked */}
                    <div className="bg-black/60 border border-white/5 rounded-2xl p-5 space-y-2 md:col-span-2">
                        <div className="text-[10px] font-mono uppercase text-gray-500 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            Current Plan Privileges
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {activePlan.features.slice(0, 6).map((feat, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs font-sans">
                                    {feat.included ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    ) : (
                                        <span className="w-3.5 h-3.5 rounded-full border border-gray-700 flex items-center justify-center text-[8px] text-gray-600 shrink-0">✕</span>
                                    )}
                                    <span className={feat.included ? 'text-gray-200' : 'text-gray-500 line-through'}>
                                        {feat.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* MEMBERSHIP PLANS SHOWCASE */}
            <div className="space-y-6">
                <div className="text-center space-y-1">
                    <h3 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tight">
                        All Membership Tiers
                    </h3>
                    <p className="text-xs text-gray-400">Select the right package for your fitness goals or upgrade instantly</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {MEMBERSHIP_PLANS.map(plan => {
                        const isCurrent = plan.id === activePlan.id;
                        return (
                            <div
                                key={plan.id}
                                className={`rounded-3xl p-6 flex flex-col justify-between space-y-6 transition-all duration-300 relative ${
                                    plan.isPopular
                                        ? 'bg-gradient-to-b from-amber-950/40 via-black to-black border-2 border-amber-500/60 shadow-[0_0_40px_rgba(245,158,11,0.2)]'
                                        : isCurrent
                                        ? 'bg-black/80 border-2 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                                        : 'bg-black/60 border border-white/10 hover:border-white/30'
                                }`}
                            >
                                {plan.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[10px] font-mono font-black uppercase tracking-wider shadow-md">
                                        {plan.badge}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono uppercase text-gray-500">{plan.durationLabel}</span>
                                            {isCurrent && (
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold border border-emerald-500/40">
                                                    Current Plan
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-xl font-black text-white tracking-tight">{plan.name}</h4>
                                        <p className="text-xs text-gray-400 leading-relaxed font-sans">{plan.description}</p>
                                    </div>

                                    <div className="pt-2 border-t border-white/10">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-black text-white font-mono">
                                                {getCurrencySymbol()}{plan.price.toLocaleString()}
                                            </span>
                                            {plan.originalPrice && (
                                                <span className="text-xs font-mono text-gray-500 line-through">
                                                    {getCurrencySymbol()}{plan.originalPrice.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-mono text-gray-400">All Taxes Included (GST)</span>
                                    </div>

                                    {/* Features Checklist */}
                                    <div className="space-y-2 pt-2 border-t border-white/5">
                                        {plan.features.map((feat, fIdx) => (
                                            <div key={fIdx} className="flex items-start gap-2 text-xs font-sans">
                                                {feat.included ? (
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                                ) : (
                                                    <span className="w-3.5 h-3.5 rounded-full border border-gray-800 flex items-center justify-center text-[8px] text-gray-600 shrink-0 mt-0.5">✕</span>
                                                )}
                                                <span className={feat.included ? 'text-gray-300' : 'text-gray-600'}>
                                                    {feat.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/10">
                                    {isCurrent ? (
                                        <button
                                            onClick={() => {
                                                setSelectedActionPlan(plan);
                                                setActionType('renew');
                                            }}
                                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            Renew Plan
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setSelectedActionPlan(plan);
                                                setActionType('upgrade');
                                            }}
                                            className={`w-full py-3 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg ${
                                                plan.isPopular
                                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:scale-105'
                                                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                                            }`}
                                        >
                                            <Sparkles className="w-3.5 h-3.5" />
                                            Upgrade Plan
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* CHECKOUT / PAYMENT MODAL */}
            {selectedActionPlan && actionType && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#090d16] border border-amber-500/40 rounded-[2.5rem] w-full max-w-lg p-6 md:p-8 space-y-6 relative shadow-[0_0_50px_rgba(245,158,11,0.25)] animate-scale-up">
                        <button
                            onClick={() => {
                                setSelectedActionPlan(null);
                                setActionType(null);
                            }}
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div>
                            <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">
                                Membership Checkout Gateway
                            </div>
                            <h2 className="text-2xl font-black text-white italic uppercase tracking-tight mt-1">
                                {actionType === 'renew' ? 'Membership Renewal' : 'Membership Upgrade'}
                            </h2>
                            <p className="text-xs text-gray-400 mt-1">
                                Target Plan: <strong className="text-white">{selectedActionPlan.name}</strong>
                            </p>
                        </div>

                        {/* Payment Breakdown Card */}
                        <div className="bg-black/60 border border-white/10 rounded-2xl p-4 space-y-2.5 font-mono text-xs">
                            <div className="flex justify-between items-center text-gray-400">
                                <span>Plan Duration:</span>
                                <span className="text-white font-bold">{selectedActionPlan.durationLabel}</span>
                            </div>

                            <div className="flex justify-between items-center text-gray-400">
                                <span>Plan Price:</span>
                                <span className="text-white font-bold">{getCurrencySymbol()}{selectedActionPlan.price}</span>
                            </div>

                            {actionType === 'upgrade' && (
                                <div className="flex justify-between items-center text-emerald-400 border-t border-white/5 pt-2">
                                    <span>Current Plan Pro-Rata Credit:</span>
                                    <span>- {getCurrencySymbol()}{Math.min(activePlan.price, selectedActionPlan.price - 500)}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center border-t border-white/10 pt-2 text-sm">
                                <span className="text-gray-200 font-bold">Total Payable:</span>
                                <span className="text-amber-400 font-black text-lg">
                                    {getCurrencySymbol()}
                                    {actionType === 'upgrade' 
                                        ? Math.max(500, selectedActionPlan.price - activePlan.price) 
                                        : selectedActionPlan.price}
                                </span>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="space-y-2">
                            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                                Select Payment Mode
                            </span>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('upi')}
                                    className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                        paymentMethod === 'upi'
                                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                                            : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <QrCode className="w-3.5 h-3.5" /> UPI QR
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('wallet')}
                                    className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                        paymentMethod === 'wallet'
                                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                            : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <Wallet className="w-3.5 h-3.5" /> Future Pay
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('card')}
                                    className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                        paymentMethod === 'card'
                                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                                            : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <CreditCard className="w-3.5 h-3.5" /> Card
                                </button>
                            </div>
                        </div>

                        {/* QR Box */}
                        {paymentMethod === 'upi' && (
                            <div className="bg-black/80 border border-white/10 rounded-2xl p-4 text-center space-y-2">
                                {qrCodeUrl ? (
                                    <img
                                        src={qrCodeUrl}
                                        alt="UPI QR Code"
                                        className="w-40 h-40 mx-auto rounded-xl p-2 bg-white shadow-lg"
                                    />
                                ) : (
                                    <div className="w-40 h-40 mx-auto rounded-xl bg-gray-900 animate-pulse flex items-center justify-center text-xs text-gray-500">
                                        Loading QR Code...
                                    </div>
                                )}
                                <div className="text-[11px] font-mono text-gray-300">
                                    Merchant UPI: <strong className="text-amber-400">{GYM_INFO.upiIds.gpay1}</strong>
                                </div>
                                <p className="text-[10px] text-gray-500 font-sans">
                                    Scan with Google Pay, PhonePe, Paytm, or BHIM
                                </p>
                            </div>
                        )}

                        <button
                            onClick={handleCompleteCheckout}
                            disabled={isProcessing}
                            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-black font-mono text-xs font-black uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {isProcessing ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                                    Activating Membership...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="w-4 h-4 text-black" />
                                    Complete Payment & Activate Membership
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
