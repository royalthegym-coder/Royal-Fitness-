
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataProvider';
import Card from '../common/Card';
import Modal from '../common/Modal';
import { toDataURL } from 'qrcode';
import { GYM_INFO } from '../../../constants';
import { Invoice, Transaction, InvoiceItem } from '../../../types';
import { sendPaymentReceipt } from '../../../lib/whatsapp';
import ReceiptTemplate from '../common/ReceiptTemplate';
import { 
    Smartphone, CreditCard, Banknote, ArrowRight, ShieldCheck, 
    Zap, Lock, Wallet, History, Cpu, RefreshCw, CheckCircle, 
    Receipt, AlertTriangle, Binary, Fingerprint, ShieldAlert,
    TrendingUp, Activity, Download, ShoppingBag, Dumbbell, Package as PackageIcon, Pill, Clock
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const MemberPayments: React.FC<{ memberId: number }> = ({ memberId }) => {
    const { invoices = [], updateInvoiceStatus, addTransaction, members = [], addAuditLog, addInvoice } = useData();
    const { addToast } = useToast();
    
    // --- CORE STATES ---
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processStep, setProcessStep] = useState<'idle' | 'encrypting' | 'handshake' | 'finalizing'>('idle');
    const [showReceipt, setShowReceipt] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Cash'>('UPI');
    const [historyInvoice, setHistoryInvoice] = useState<Invoice | null>(null);
    
    // Verification Success State
    const [verificationSent, setVerificationSent] = useState(false);

    const member = members.find(m => m.id === memberId);

    // Filter Logic
    const myInvoices = useMemo(() => 
        invoices.filter(inv => inv.memberId === memberId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    , [invoices, memberId]);

    const pendingInvoices = useMemo(() => myInvoices.filter(i => i.status !== 'Paid' && i.status !== 'Verification Pending'), [myInvoices]);
    const paidInvoices = useMemo(() => myInvoices.filter(i => i.status === 'Paid'), [myInvoices]);
    const verifyingInvoices = useMemo(() => myInvoices.filter(i => i.status === 'Verification Pending'), [myInvoices]);
    
    const pendingTotal = useMemo(() => pendingInvoices.reduce((acc, curr) => acc + curr.amount, 0), [pendingInvoices]);
    const lifetimeInvested = useMemo(() => paidInvoices.reduce((acc, curr) => acc + curr.amount, 0), [paidInvoices]);

    const trustScore = useMemo(() => {
        if (myInvoices.length === 0) return 100;
        const overdueCount = myInvoices.filter(i => i.status === 'Overdue').length;
        let score = 100 - (overdueCount * 25);
        if (paidInvoices.length > 5 && overdueCount === 0) score = 100;
        return Math.max(10, score);
    }, [myInvoices, paidInvoices]);

    // QR Generation
    useEffect(() => {
        if (selectedInvoice && paymentMethod === 'UPI') {
            const upiUri = `upi://pay?pa=${GYM_INFO.upiIds.gpay1}&pn=${encodeURIComponent(GYM_INFO.name)}&am=${selectedInvoice.amount.toFixed(2)}&cu=INR&tn=RoyalID_${memberId}_Inv_${selectedInvoice.id}`;
            toDataURL(upiUri, { width: 400, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
                .then(url => setQrCodeUrl(url));
        }
    }, [selectedInvoice, paymentMethod, memberId]);

    const handleOpenPayment = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setPaymentMethod('UPI');
        setProcessStep('idle');
        setVerificationSent(false);
    };

    const handleVerifyPayment = async () => {
        if (!selectedInvoice) return;
        
        setIsProcessing(true);
        setProcessStep('encrypting');
        await new Promise(r => setTimeout(r, 1000));
        setProcessStep('handshake');
        
        // INSTEAD OF MARKING PAID, MARK AS VERIFICATION PENDING
        updateInvoiceStatus(selectedInvoice.id, 'Verification Pending');

        addAuditLog({
            member_id: memberId,
            action: 'PAYMENT_SUBMITTED',
            details: `Member submitted payment for Invoice #${selectedInvoice.id} via ${paymentMethod}. Waiting Admin Approval.`
        });

        setIsProcessing(false);
        setProcessStep('idle');
        setVerificationSent(true);
        
        // Close modal after delay
        setTimeout(() => {
             setSelectedInvoice(null);
             setVerificationSent(false);
             addToast("Payment submitted for verification.", "info");
        }, 3000);
    };

    if (selectedInvoice && !showReceipt) {
        return (
            <div className="animate-fade-in pb-24">
                 <Card className="bg-black border-white/5 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden h-full flex flex-col">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
                        
                        {isProcessing ? (
                            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                                <div className="relative">
                                     <div className="w-32 h-32 border-8 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                     <div className="absolute inset-0 flex items-center justify-center">
                                         <RefreshCw className="w-12 h-12 text-amber-500 animate-pulse" />
                                     </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-2xl font-black text-white uppercase italic tracking-widest">{
                                        processStep === 'encrypting' ? 'ENCRYPTING LINK...' : 'CONNECTING...'
                                    }</p>
                                </div>
                            </div>
                        ) : verificationSent ? (
                            <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center animate-scale-in">
                                <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500 shadow-[0_0_30px_#f59e0b]">
                                    <Clock className="w-12 h-12 text-amber-500" />
                                </div>
                                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Verification Pending</h3>
                                <p className="text-gray-400 max-w-sm">
                                    Your payment proof has been sent to the Admin Console. Once verified, your invoice will be marked as paid and receipt generated.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="text-center mb-10">
                                    <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.3)]">
                                        <Lock className="w-8 h-8 text-amber-500" />
                                    </div>
                                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Secure Gateway</h3>
                                    <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">ID: {selectedInvoice.id}</p>
                                </div>

                                <div className="bg-gray-900/50 p-2 rounded-2xl border border-white/10 flex mb-8">
                                    {['UPI', 'Card', 'Cash'].map(m => (
                                        <button 
                                            key={m} 
                                            onClick={() => setPaymentMethod(m as any)}
                                            className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === m ? 'bg-amber-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>

                                {paymentMethod === 'UPI' && (
                                    <div className="flex-1 flex flex-col items-center justify-center mb-8 bg-white rounded-[2.5rem] p-6 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-white"></div>
                                        <img src={qrCodeUrl} className="w-48 h-48 object-contain mix-blend-multiply relative z-10" alt="QR" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                            <div className="text-center">
                                                <Smartphone className="w-8 h-8 text-black mb-2 mx-auto" />
                                                <p className="text-[10px] font-black text-black uppercase tracking-widest">Scan to Pay</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {paymentMethod !== 'UPI' && (
                                    <div className="flex-1 flex flex-col items-center justify-center mb-8 border-2 border-dashed border-white/10 rounded-[2.5rem] bg-gray-900/30">
                                        {paymentMethod === 'Card' ? <CreditCard className="w-24 h-24 text-gray-600" /> : <Banknote className="w-24 h-24 text-gray-600" />}
                                        <p className="text-xs text-gray-500 font-black uppercase tracking-widest mt-4">Proceed at Counter</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                     <div className="flex justify-between items-center text-sm px-4">
                                         <span className="text-gray-400 font-bold uppercase tracking-wide">Total Payable</span>
                                         <span className="text-2xl font-black text-white italic">₹{selectedInvoice.amount}</span>
                                     </div>
                                     <button 
                                        onClick={handleVerifyPayment}
                                        className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-6 rounded-[2.5rem] uppercase tracking-[0.2em] text-xs shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                                     >
                                        <ShieldCheck className="w-4 h-4"/> SUBMIT FOR VERIFICATION
                                     </button>
                                </div>
                            </>
                        )}
                    </Card>
            </div>
        );
    }
    
    return (
        <div className="space-y-8 animate-fade-in pb-32">
            <div className="bg-[#020308] p-10 rounded-[4rem] border border-amber-500/30 relative overflow-hidden shadow-[0_0_120px_rgba(245,158,11,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-15"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-amber-600 text-black rounded-[3rem] shadow-[0_0_60px_rgba(234,88,12,0.5)] border border-amber-400 group-hover:rotate-12 transition-transform duration-700">
                            <Wallet className="w-16 h-16" />
                        </div>
                        <div>
                             <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Apex <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">Treasury</span>
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* STATS DECK */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className={`p-8 rounded-[2.5rem] border transition-all ${pendingTotal > 0 ? 'bg-red-950/20 border-red-500/30' : 'bg-green-950/20 border-green-500/30'}`}>
                     <div className="flex items-start justify-between">
                        <p className="text-5xl font-black text-white italic">₹{pendingTotal.toLocaleString()}</p>
                        <ShieldAlert className={`w-8 h-8 ${pendingTotal > 0 ? 'text-red-500 animate-pulse' : 'text-green-500'}`} />
                     </div>
                     <p className="text-xs font-black uppercase tracking-widest mt-3 text-gray-500">Pending Dues</p>
                 </div>
                 <div className="p-8 rounded-[2.5rem] border bg-gray-950 border-white/5">
                     <div className="flex items-start justify-between">
                        <p className="text-5xl font-black text-white italic">₹{(lifetimeInvested / 1000).toFixed(1)}k</p>
                        <TrendingUp className="w-8 h-8 text-cyan-400" />
                     </div>
                     <p className="text-xs font-black uppercase tracking-widest mt-3 text-gray-500">Lifetime Invested</p>
                 </div>
                 <div className="p-8 rounded-[2.5rem] border bg-gray-950 border-white/5">
                     <div className="flex items-start justify-between">
                        <p className={`text-5xl font-black italic ${trustScore >= 90 ? 'text-green-400' : 'text-amber-400'}`}>{trustScore}</p>
                        <ShieldCheck className="w-8 h-8 text-green-400" />
                     </div>
                     <p className="text-xs font-black uppercase tracking-widest mt-3 text-gray-500">Sovereign Trust Score</p>
                 </div>
            </div>

            {verifyingInvoices.length > 0 && (
                <div className="bg-amber-900/10 border border-amber-500/20 p-6 rounded-[2rem]">
                    <h3 className="text-lg font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5"/> Processing Approvals
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {verifyingInvoices.map(inv => (
                            <div key={inv.id} className="bg-black/40 p-4 rounded-xl border border-white/5">
                                <p className="text-white font-bold">{inv.packageName}</p>
                                <p className="text-xs text-gray-400">₹{inv.amount} • {inv.date}</p>
                                <p className="text-[10px] text-amber-400 font-mono mt-1 uppercase">Awaiting Admin Verification</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* PENDING INVOICES */}
                <div className="space-y-6">
                     <h3 className="text-xl font-black text-white italic uppercase tracking-widest pl-4">Open Credit Shards</h3>
                     {pendingInvoices.length === 0 ? (
                        <div className="bg-gray-900/50 p-12 rounded-[2.5rem] text-center border border-white/5">
                             <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                             <p className="text-sm text-gray-400">Ledger is clear. All credits synchronized.</p>
                        </div>
                     ) : (
                        pendingInvoices.map(inv => (
                             <Card 
                                key={inv.id} 
                                onClick={() => handleOpenPayment(inv)}
                                className={`cursor-pointer group relative overflow-hidden rounded-[2.5rem] ${inv.status === 'Overdue' ? 'border-red-500/30 bg-red-950/10' : 'border-white/10 bg-[#0c0c0c] hover:border-amber-500/30'}`}
                             >
                                 <div className="p-8 flex flex-col gap-4">
                                     <div className="flex justify-between items-start">
                                         <div>
                                            <h4 className="text-lg font-black text-white uppercase italic">{inv.packageName}</h4>
                                            <p className={`text-[10px] font-black uppercase mt-1 ${inv.status === 'Overdue' ? 'text-red-500' : 'text-amber-400'}`}>{inv.status}</p>
                                         </div>
                                         <p className="text-3xl font-black text-white italic">₹{inv.amount}</p>
                                     </div>
                                 </div>
                             </Card>
                        ))
                     )}
                </div>

                {/* TRANSACTION HISTORY */}
                <div className="space-y-6">
                    <h3 className="text-xl font-black text-white italic uppercase tracking-widest pl-4">Transaction Archive</h3>
                     <div className="bg-gray-950 border-white/5 p-8 rounded-[2.5rem] h-[400px] flex flex-col shadow-2xl">
                         <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                             {paidInvoices.map(inv => (
                                 <div key={inv.id} className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5 group">
                                     <div className="flex items-center gap-4">
                                         <div className="p-3 bg-gray-800 rounded-2xl text-green-500"><CheckCircle className="w-4 h-4"/></div>
                                         <div>
                                             <p className="text-xs font-bold text-white uppercase">{inv.packageName}</p>
                                             <p className="text-[9px] text-gray-500 font-mono">{inv.date}</p>
                                         </div>
                                     </div>
                                     <div className="flex items-center gap-4">
                                         <p className="text-sm font-black text-gray-300">₹{inv.amount}</p>
                                         <button onClick={() => { setHistoryInvoice(inv); setShowReceipt(true); }} className="p-2 bg-gray-800 rounded-xl text-gray-500 hover:text-white transition-colors">
                                             <Receipt className="w-4 h-4" />
                                         </button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                    </div>
                </div>
            </div>

            {showReceipt && (historyInvoice || selectedInvoice) && (
                <ReceiptTemplate 
                    invoiceId={historyInvoice?.id.toString() || selectedInvoice?.id.toString() || ''}
                    memberName={historyInvoice?.memberName || selectedInvoice?.memberName || ''}
                    memberPhone={member?.phone || ''}
                    amount={historyInvoice?.amount || selectedInvoice?.amount || 0}
                    date={historyInvoice?.date || selectedInvoice?.date || ''}
                    method={historyInvoice ? 'History' : paymentMethod} 
                    items={historyInvoice?.items || selectedInvoice?.items}
                    onClose={() => { setShowReceipt(false); setHistoryInvoice(null); }}
                />
            )}
        </div>
    );
};

export default MemberPayments;
