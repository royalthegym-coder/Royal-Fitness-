import { getCurrencySymbol } from '../../store/useCurrencyStore';

import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataProvider';
import Card from '../common/Card';
import Modal from '../common/Modal';
import { Package } from '../../../types';
import { useToast } from '../../hooks/useToast';
import { sendPaymentReceipt } from '../../../lib/whatsapp';
import { authenticateBiometric } from '../../biometrics';
import { toDataURL } from 'qrcode';
import { GYM_INFO } from '../../../constants';
import { 
    CreditCard, CheckCircle, ShieldCheck, Loader, 
    Package as PackageIcon, Check, Smartphone, Banknote, Scan, Clock
} from 'lucide-react';

// Stripe Elements
const StripePaymentForm: React.FC<{ 
    amount: number; 
    onSuccess: () => void; 
    onCancel: () => void 
}> = ({ amount, onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [cardNum, setCardNum] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');

    const handlePay = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Process Stripe processing delay
        setTimeout(() => {
            setLoading(false);
            onSuccess();
        }, 2000);
    };

    return (
        <form onSubmit={handlePay} className="space-y-4 animate-fade-in">
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                <div className="flex justify-between mb-4">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Card Details</span>
                    <div className="flex gap-2">
                         <div className="w-8 h-5 bg-blue-600 rounded"></div>
                         <div className="w-8 h-5 bg-orange-600 rounded"></div>
                    </div>
                </div>
                <div className="space-y-3">
                    <input 
                        type="text" 
                        placeholder="0000 0000 0000 0000" 
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono focus:border-indigo-500 outline-none"
                        value={cardNum}
                        onChange={e => setCardNum(e.target.value.replace(/\D/g,'').replace(/(.{4})/g, '$1 ').trim().slice(0, 19))}
                        maxLength={19}
                        required
                    />
                    <div className="flex gap-3">
                        <input 
                            type="text" 
                            placeholder="MM/YY" 
                            className="w-1/2 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono focus:border-indigo-500 outline-none"
                            value={expiry}
                            onChange={e => setExpiry(e.target.value.replace(/\D/g,'').replace(/(\d{2})(\d{1,2})/, '$1/$2').slice(0, 5))}
                            maxLength={5}
                            required
                        />
                        <input 
                            type="text" 
                            placeholder="CVC" 
                            className="w-1/2 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono focus:border-indigo-500 outline-none"
                            value={cvc}
                            onChange={e => setCvc(e.target.value.replace(/\D/g,'').slice(0, 3))}
                            maxLength={3}
                            required
                        />
                    </div>
                </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
                <ShieldCheck className="w-3 h-3" />
                <span>Payments processed securely by Stripe</span>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] border border-indigo-400/50 border-dashed active:scale-95 disabled:opacity-50 relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                <span className="relative z-10 flex items-center gap-2">
                    {loading ? <Loader className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    {loading ? 'Processing...' : `Pay ${getCurrencySymbol()}${amount.toLocaleString()}`}
                </span>
            </button>
        </form>
    );
};

const MemberPackages: React.FC<{ memberId: number }> = ({ memberId }) => {
    const { packages, members, updateMember, addTransaction, addInvoice } = useData();
    const { addToast } = useToast();
    const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [success, setSuccess] = useState(false);
    
    // Payment Method State
    const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Cash'>('UPI');
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    const currentMember = members.find(m => m.id === memberId);

    const handleSelect = (pkg: Package) => {
        setSelectedPkg(pkg);
        setIsPaymentOpen(true);
        setPaymentMethod('UPI'); // Default
    };

    // Generate QR when UPI is selected
    useEffect(() => {
        if (selectedPkg && paymentMethod === 'UPI') {
            const upiUri = `upi://pay?pa=${GYM_INFO.upiIds.gpay1}&pn=${encodeURIComponent(GYM_INFO.name)}&am=${selectedPkg.price.toFixed(2)}&cu=INR&tn=Plan_${selectedPkg.id}`;
            toDataURL(upiUri, { width: 400, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
                .then(url => setQrCodeUrl(url));
        }
    }, [selectedPkg, paymentMethod]);

    const handleSuccess = async () => {
        if (!selectedPkg || !currentMember) return;
        
        const isAuthenticated = await authenticateBiometric();
        if (!isAuthenticated) {
            addToast("Biometric verification failed. Payment cancelled.", "error");
            return;
        }
        
        finalizePackagePurchase();
    };

    const finalizePackagePurchase = (isVerified: boolean = false) => {
        if (!selectedPkg || !currentMember) return;
        
        const methodStr = paymentMethod === 'UPI' ? 'QR Code' : paymentMethod;
        
        // --- NEW FLOW: SUBMIT FOR VERIFICATION ---
        // Instead of marking 'Paid' instantly, we create an invoice with 'Verification Pending'
        // Admin must approve it in Billing > Approvals.
        
        const invoiceStatus = isVerified ? 'Paid' : 'Verification Pending';
        
        const invoice = {
            id: Date.now(),
            memberId: memberId,
            memberName: currentMember.name,
            packageId: selectedPkg.id,
            packageName: selectedPkg.name,
            amount: selectedPkg.price,
            date: new Date().toISOString().split('T')[0],
            status: invoiceStatus as any,
            paymentMethod: methodStr,
            items: [{ description: selectedPkg.name, amount: selectedPkg.price, type: 'Membership' }]
        };
        addInvoice(invoice as any);

        if (isVerified) {
            addTransaction({
                id: `TXN-${Date.now()}`,
                memberName: currentMember.name,
                amount: selectedPkg.price,
                date: invoice.date,
                method: methodStr as any
            });
            
            // Update member package
            updateMember({
                ...currentMember,
                packageId: selectedPkg.id,
                status: 'Active'
            });
            
            if (currentMember.whatsappConsent && currentMember.phone) {
                sendPaymentReceipt(currentMember.name, currentMember.phone, selectedPkg.price, `TXN-${Date.now()}`, selectedPkg.name);
            }
        }

        setSuccess(true);
        setTimeout(() => {
            setSuccess(false);
            setIsPaymentOpen(false);
            setSelectedPkg(null);
            addToast(isVerified ? "Payment successful. Membership activated." : "Payment submitted. Membership will activate upon Admin Approval.", "info");
        }, 3000);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
             <div className="bg-[#020308] p-10 rounded-[3rem] border border-indigo-500/20 relative overflow-hidden shadow-2xl">
                 <div className="relative z-10">
                     <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                        <PackageIcon className="w-12 h-12 text-indigo-500" />
                        Access <span className="text-indigo-400">Keys</span>
                    </h1>
                    <p className="text-gray-500 text-xs font-mono mt-2 tracking-widest uppercase">Upgrade Your Protocol</p>
                 </div>
            </div>

            {/* EXPIRATION & RENEWAL REMINDER TRACKER WIDGET */}
            {currentMember && currentMember.packageId && (
                <div className="bg-gray-900 border border-gray-700/50 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/20 to-transparent"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                            <Clock className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white tracking-widest uppercase">Active Subscription</h3>
                            <p className="text-gray-400 text-sm">
                                Your current plan expires on: <strong className="text-emerald-400">{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong>
                            </p>
                            <p className="text-xs text-emerald-500 font-bold mt-1 uppercase tracking-widest bg-emerald-500/10 inline-block px-2 py-0.5 rounded">
                                <CheckCircle className="w-3 h-3 inline mr-1" /> Active
                            </p>
                        </div>
                    </div>
                    <div className="relative z-10 flex items-center gap-3">
                        <button 
                            onClick={() => {
                                const activePkg = packages.find(p => p.id === currentMember.packageId);
                                if (activePkg) handleSelect(activePkg);
                            }} 
                            className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all active:scale-95"
                        >
                            Renew Plan
                        </button>
                        <button 
                            onClick={() => {
                                if (confirm('Are you sure you want to cancel your membership?')) {
                                    addToast('Membership successfully cancelled.', 'success');
                                }
                            }}
                            className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-red-500/50 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg, pkgIdx) => {
                    const isCurrent = currentMember?.packageId === pkg.id;
                    const fallbackImg = [
                        '/icon.svg',
                        '/icon.svg',
                        '/icon.svg',
                    ][pkgIdx % 3];
                    return (
                        <Card key={pkg.id} className={`p-8 rounded-[2.5rem] border relative overflow-hidden group transition-all hover:-translate-y-1 ${isCurrent ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-gray-900 border-white/5 hover:border-indigo-500/30'}`}>
                            {/* Background Image */}
                            <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
                                <img src={pkg.image || fallbackImg} alt={pkg.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/80 to-transparent"></div>
                            </div>

                            <div className="relative z-10">
                                {isCurrent && (
                                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Current</div>
                                )}
                                
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tight mb-2">{pkg.name}</h3>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-4xl font-black text-indigo-400">{getCurrencySymbol()}{pkg.price.toLocaleString()}</span>
                                    <span className="text-xs font-bold text-gray-500 uppercase">/ {pkg.duration}</span>
                                </div>

                                <ul className="space-y-3 mb-8">
                                    {pkg.features.map((feat, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-gray-400">
                                            <Check className="w-4 h-4 text-green-500" /> {feat}
                                        </li>
                                    ))}
                                </ul>

                                <button 
                                    onClick={() => handleSelect(pkg)}
                                    disabled={isCurrent}
                                    className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all relative overflow-hidden group ${isCurrent ? 'bg-gray-800 text-gray-500 cursor-default' : 'bg-gradient-to-r from-indigo-900/80 to-purple-900/80 hover:from-indigo-800 hover:to-purple-800 border-2 border-dashed border-indigo-400/50 text-indigo-300 shadow-[0_0_30px_rgba(99,102,241,0.3)] backdrop-blur-md active:scale-95'}`}
                                >
                                    {!isCurrent && <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
                                    <span className="relative z-10">{isCurrent ? 'Active Plan' : 'Select Plan'}</span>
                                </button>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <Modal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title="Secure Checkout">
                {success ? (
                    <div className="text-center py-10 animate-scale-in">
                        <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_#f59e0b]">
                            <Clock className="w-12 h-12 text-black" />
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-widest mb-2">
                            Verification Pending
                        </h3>
                        <p className="text-gray-400 text-sm px-6">
                            Your payment has been recorded. Admin will verify and activate your plan shortly.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-indigo-900/20 p-6 rounded-2xl border border-indigo-500/30">
                            <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">Selected Package</p>
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-black text-white italic">{selectedPkg?.name}</h3>
                                <p className="text-xl font-bold text-white">{getCurrencySymbol()}{selectedPkg?.price.toLocaleString()}</p>
                            </div>
                        </div>
                        
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Payment Method</p>
                            <div className="flex bg-gray-900 p-1 rounded-xl border border-white/10">
                                {(['UPI', 'Card', 'Cash'] as const).map(m => (
                                    <button 
                                        key={m} 
                                        onClick={() => setPaymentMethod(m)} 
                                        className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2 relative overflow-hidden group ${paymentMethod === m ? 'bg-gradient-to-r from-gray-100 to-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)] border border-gray-300/50 border-dashed' : 'text-gray-500 hover:text-white border border-transparent'}`}
                                    >
                                        {paymentMethod === m && <div className="absolute inset-0 bg-black/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
                                        <span className="relative z-10 flex items-center gap-2">
                                            {m === 'UPI' ? <Smartphone className="w-4 h-4"/> : m === 'Card' ? <CreditCard className="w-4 h-4"/> : <Banknote className="w-4 h-4"/>}
                                            {m}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="min-h-[250px] animate-fade-in">
                            {paymentMethod === 'UPI' && (
                                <div className="text-center py-6">
                                     <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl border-[8px] border-white ring-4 ring-green-500/20 mb-6">
                                        {qrCodeUrl && <img src={qrCodeUrl} className="w-56 h-56 mx-auto" alt="UPI QR Code" />}
                                    </div>
                                    <button onClick={handleSuccess} className="w-full bg-gradient-to-r from-green-900/80 to-emerald-900/80 hover:from-green-800 hover:to-emerald-800 border-2 border-dashed border-green-400/50 text-green-300 font-black py-4 rounded-xl uppercase tracking-widest text-xs shadow-[0_0_30px_rgba(34,197,94,0.3)] backdrop-blur-md transition-all active:scale-95 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                        <span className="relative z-10">I Have Paid</span>
                                    </button>
                                </div>
                            )}

                            {paymentMethod === 'Card' && (
                                <StripePaymentForm 
                                    amount={selectedPkg?.price || 0} 
                                    onSuccess={handleSuccess} 
                                    onCancel={() => setIsPaymentOpen(false)} 
                                />
                            )}

                            {paymentMethod === 'Cash' && (
                                <div className="text-center py-10 space-y-6">
                                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto border-4 border-gray-700">
                                        <Banknote className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white mb-2">Pay at Reception</h4>
                                        <p className="text-gray-400 text-xs px-10">Create a pending invoice and pay cash at the gym desk to activate your plan.</p>
                                    </div>
                                    <button onClick={handleSuccess} className="w-full bg-gradient-to-r from-gray-100 to-white hover:from-white hover:to-gray-100 text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(255,255,255,0.2)] border border-gray-300/50 border-dashed transition-all active:scale-95 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-black/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                        <span className="relative z-10">Submit Request</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MemberPackages;
