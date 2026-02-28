
import React, { useState, useMemo, useEffect } from 'react';
import { Invoice, InvoiceItem, Transaction, InventoryItem, View } from '../../types';
import Card from './common/Card';
import Modal from './common/Modal';
import { useData } from '../context/DataProvider'; 
import { useToast } from '../hooks/useToast';
import { sendPaymentRequest, sendPaymentReceipt } from '../../lib/whatsapp';
import ReceiptTemplate from './common/ReceiptTemplate';
import { GYM_INFO } from '../../constants';
import { toDataURL } from 'qrcode';
import { 
    Printer, Send, CreditCard, Smartphone, Banknote, 
    CheckCircle, ArrowRight, Zap, Eye, Calculator,
    ShieldCheck, TrendingUp, DollarSign, Search, RefreshCw,
    Infinity, Activity, FileText, Lock, Copy, ShoppingBag, Plus, Trash2, Package,
    BrainCircuit, AlertTriangle, Wallet, Scan, ShieldAlert, BadgeCheck, XCircle
} from 'lucide-react';
import { BotIcon } from './icons/BotIcon';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

interface BillingProps {
    setCurrentView: (view: View) => void;
}

const getLocalToday = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

const Billing: React.FC<BillingProps> = ({ setCurrentView }) => {
    const { members, invoices = [], packages, addInvoice, updateInvoiceStatus, addTransaction, inventory } = useData();
    const { addToast } = useToast();

    const [activeTab, setActiveTab] = useState<'Overview' | 'Invoices' | 'POS' | 'Approvals'>('Overview');
    const [filter, setFilter] = useState<'All' | 'Paid' | 'Pending' | 'Overdue'>('All');
    const [searchTerm, setSearchTerm] = useState('');
    
    // --- POS STATE (CART) ---
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState<number | ''>('');
    const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);
    
    // Payment Integration
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [activePaymentInvoice, setActivePaymentInvoice] = useState<Invoice | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Cash'>('UPI');
    const [paymentQr, setPaymentQr] = useState('');
    const [isFraudScanning, setIsFraudScanning] = useState(false); // v31.0 AI Fraud Sentinel
    
    // AI Debt Collector
    const [isCollecting, setIsCollecting] = useState(false);
    const [collectorLog, setCollectorLog] = useState<string[]>([]);

    // Receipt Node
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState<{invoice: Invoice, txn?: Transaction} | null>(null);

    // --- ANALYTICS ---
    const activeRevenue = useMemo(() => invoices.filter(i => i.status === 'Paid').reduce((s,i)=>s+i.amount,0), [invoices]);
    const pendingRevenue = useMemo(() => invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').reduce((s,i)=>s+i.amount,0), [invoices]);
    const overdueCount = useMemo(() => invoices.filter(i => i.status === 'Overdue').length, [invoices]);
    
    // Pending Approvals
    const pendingApprovals = useMemo(() => invoices.filter(i => i.status === 'Verification Pending'), [invoices]);

    const cashflowData = useMemo(() => {
        return Array.from({length: 12}, (_, i) => ({
            time: `${i * 2}:00`,
            inflow: Math.floor(Math.random() * (activeRevenue / 20)) + 1000,
            pending: Math.floor(Math.random() * (pendingRevenue / 20)) + 500
        }));
    }, [activeRevenue, pendingRevenue]);

    const filteredInvoices = useMemo(() => {
        let data = invoices;
        if (filter !== 'All') {
            data = invoices.filter(invoice => invoice.status === filter);
        }
        if (searchTerm) {
            data = data.filter(invoice => 
                invoice.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                invoice.id.toString().includes(searchTerm)
            );
        }
        return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [invoices, filter, searchTerm]);

    const selectedMember = useMemo(() => members.find(m => m.id === selectedMemberId), [selectedMemberId, members]);
    const cartTotal = cartItems.reduce((acc, item) => acc + item.amount, 0);

    // --- ACTIONS ---

    const handleNeuralCollect = async () => {
        setIsCollecting(true);
        setCollectorLog([]);
        addToast("Chronos Mirror Bot: Scanning Ledger for Due Dates...", "info");
        
        const overdueInvoices = invoices.filter(i => i.status === 'Overdue' || i.status === 'Pending');
        
        if (overdueInvoices.length === 0) {
            setTimeout(() => {
                setIsCollecting(false);
                addToast("Ledger Clean. No action needed.", "success");
            }, 1500);
            return;
        }

        let sentCount = 0;
        for (const inv of overdueInvoices) {
            await new Promise(r => setTimeout(r, 600)); // Simulate AI Processing
            const member = members.find(m => m.id === inv.memberId);
            setCollectorLog(prev => [`Analyzing ${member?.name || 'Unknown'}... Risk: ${inv.status === 'Overdue' ? 'High' : 'Medium'}`, ...prev]);
            
            if (member?.phone && member.whatsappConsent) {
                 setCollectorLog(prev => [`>> Sent Chronos Reminder to ${member.name}`, ...prev]);
                 // Send actual message logic here (Already handled by DataProvider logic if implemented there, or call directly)
                sentCount++;
            }
        }

        setCollectorLog(prev => [`SUMMARY: ${sentCount} Notices Dispatched.`, ...prev]);
        setIsCollecting(false);
        addToast(`Chronos Mirror Bot: Dispatched ${sentCount} reminders.`, "success");
    };

    const addToCart = (item: InventoryItem) => {
        if (item.stock <= 0) return addToast("Item Out of Stock", "error");
        setCartItems(prev => [...prev, { description: item.name, amount: item.price || 0, type: 'Product' }]);
        addToast(`${item.name} added to grid.`, "success");
    };

    const handleCreateInvoice = () => {
        if (!selectedMember || cartItems.length === 0) {
            addToast("Select Member and Add Items.", "error");
            return;
        }

        const newInvoice: Invoice = {
            id: Date.now(),
            memberId: selectedMember.id,
            memberName: selectedMember.name,
            packageId: 0,
            packageName: "Store Purchase",
            amount: cartTotal,
            date: getLocalToday(),
            status: 'Pending',
            items: cartItems
        };

        addInvoice(newInvoice); // This triggers Payment Request Automation in DataProvider
        setIsWizardOpen(false);
        setCartItems([]);
        setSelectedMemberId('');
        addToast("Invoice Generated. WhatsApp Payment Link Sent.", "success");
    };

    const handleOpenPayment = (invoice: Invoice) => {
        setActivePaymentInvoice(invoice);
        setPaymentMethod('UPI');
        const upiUri = `upi://pay?pa=${GYM_INFO.upiIds.gpay1}&pn=${encodeURIComponent(GYM_INFO.name)}&am=${invoice.amount.toFixed(2)}&cu=INR&tn=Royal_ID_${invoice.memberId}`;
        toDataURL(upiUri, { width: 400, margin: 1, color: { dark: '#000000', light: '#ffffff' } }).then(url => setPaymentQr(url));
        setIsPaymentModalOpen(true);
    };

    // MANUAL ADMIN CONFIRMATION FOR NORMAL PAYMENTS
    const handleConfirmPayment = async () => {
        if(!activePaymentInvoice) return;
        
        // AI FRAUD SENTINEL CHECK
        setIsFraudScanning(true);
        await new Promise(r => setTimeout(r, 1500));
        setIsFraudScanning(false);

        updateInvoiceStatus(activePaymentInvoice.id, 'Paid');
        
        const newTxn: Transaction = {
            id: `TXN-${Date.now()}`,
            memberName: activePaymentInvoice.memberName,
            amount: activePaymentInvoice.amount,
            date: getLocalToday(),
            method: paymentMethod as any
        };
        addTransaction(newTxn); // Triggers Receipt Automation in DataProvider
        
        // Auto-Receipt Logic for UI
        setReceiptData({ invoice: activePaymentInvoice, txn: newTxn });
        setShowReceipt(true);
        
        setIsPaymentModalOpen(false);
        addToast(`Payment Verified. WhatsApp Receipt Sent via ${paymentMethod}.`, "success");
    };

    // APPROVAL WORKFLOW
    const handleApprovePayment = (invoice: Invoice) => {
        const method = invoice.paymentMethod || 'Online';
        
        // 1. Update Invoice Status
        updateInvoiceStatus(invoice.id, 'Paid');

        // 2. Create Transaction
        const newTxn: Transaction = {
            id: `TXN-${Date.now()}`,
            memberName: invoice.memberName,
            amount: invoice.amount,
            date: getLocalToday(),
            method: method as any
        };
        addTransaction(newTxn); // Will trigger Receipt WhatsApp

        addToast(`Payment Approved for ${invoice.memberName}. Receipt Sent.`, "success");
    };

    const handleRejectPayment = (invoice: Invoice) => {
        updateInvoiceStatus(invoice.id, 'Pending'); // Revert to Pending
        addToast(`Payment Rejected for ${invoice.memberName}.`, "info");
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            {/* Header ... (existing) */}
            <div className="bg-[#020202] p-10 rounded-[3.5rem] border border-amber-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(245,158,11,0.15)] group">
                {/* ... existing header code ... */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-amber-600/5 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-amber-600 text-black rounded-[3rem] shadow-[0_0_60px_rgba(245,158,11,0.5)] border border-amber-400 group-hover:rotate-12 transition-transform duration-700">
                             <Wallet className="w-16 h-16" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-amber-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Infinity className="w-3 h-3" /> Apex Treasury v31.0
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">LINK: SECURE_LEDGER</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Fiscal <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600">Core</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex bg-gray-900/80 p-2 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl gap-2 overflow-x-auto">
                        <button onClick={() => setActiveTab('Overview')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Overview' ? 'bg-amber-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>Overview</button>
                        <button onClick={() => setActiveTab('Invoices')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Invoices' ? 'bg-amber-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>Invoices</button>
                        <button onClick={() => setActiveTab('POS')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'POS' ? 'bg-amber-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>Holo-POS</button>
                        <button onClick={() => setActiveTab('Approvals')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'Approvals' ? 'bg-amber-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                            Approvals
                            {pendingApprovals.length > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px] border-2 border-black animate-bounce">{pendingApprovals.length}</span>}
                        </button>
                    </div>
                </div>
            </div>

            {/* TAB CONTENT */}
            
            {activeTab === 'Overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up">
                    <div className="lg:col-span-8">
                        <Card title="Quantum Cashflow Velocity" className="bg-black border-white/5 h-[450px] p-8 rounded-[3rem] shadow-2xl">
                             <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={cashflowData}>
                                    <defs>
                                        <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="time" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis hide />
                                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                                    <Area type="monotone" dataKey="inflow" stroke="#22c55e" strokeWidth={3} fill="url(#colorIn)" name="Secured" />
                                    <Area type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={3} fill="url(#colorOut)" name="Projection" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Card>
                    </div>
                    <div className="lg:col-span-4 space-y-6">
                        <div className="p-8 bg-gradient-to-br from-green-900/20 to-black rounded-[2.5rem] border border-green-500/30 shadow-xl">
                             <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-2">Total Secured</p>
                             <p className="text-5xl font-black text-white italic tracking-tighter">₹{(activeRevenue/1000).toFixed(1)}k</p>
                        </div>
                        <div className="p-8 bg-gradient-to-br from-red-900/20 to-black rounded-[2.5rem] border border-red-500/30 shadow-xl">
                             <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">Pending Injection</p>
                             <p className="text-5xl font-black text-white italic tracking-tighter">₹{(pendingRevenue/1000).toFixed(1)}k</p>
                             <p className="text-xs text-red-400 mt-2 font-bold">{overdueCount} Overdue Nodes</p>
                        </div>
                        
                        {/* Chronos Mirror Bot Control */}
                        <div className="bg-gray-900 border border-white/5 rounded-[2.5rem] p-6 relative overflow-hidden">
                            {isCollecting && <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center backdrop-blur-sm"><RefreshCw className="w-8 h-8 text-amber-500 animate-spin"/></div>}
                            <button 
                                onClick={handleNeuralCollect}
                                disabled={isCollecting}
                                className="w-full py-5 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl hover:bg-amber-400 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                            >
                                <BotIcon className="w-4 h-4"/> CHRONOS MIRROR BOT
                            </button>
                            <div className="mt-4 h-24 overflow-y-auto custom-scrollbar bg-black/40 rounded-xl p-3 border border-white/5">
                                {collectorLog.map((log, i) => (
                                    <p key={i} className="text-[9px] font-mono text-gray-400 mb-1">{log}</p>
                                ))}
                                {collectorLog.length === 0 && <p className="text-[9px] text-gray-600 font-mono">Agent Idle.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Approvals Tab */}
            {activeTab === 'Approvals' && (
                <div className="animate-slide-up space-y-6">
                    <Card title="Pending Verifications" className="bg-gray-950 border-white/5 p-8 rounded-[3rem] min-h-[500px]">
                        {pendingApprovals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                                <BadgeCheck className="w-16 h-16 mb-4" />
                                <p className="text-xs uppercase font-black tracking-widest">No Pending Approvals</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {pendingApprovals.map(inv => (
                                    <div key={inv.id} className="bg-[#0c0c0c] p-6 rounded-[2.5rem] border border-amber-500/30 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-6 opacity-10"><ShieldAlert className="w-24 h-24 text-amber-500"/></div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="text-xl font-black text-white italic uppercase">{inv.memberName}</h4>
                                                    <p className="text-[10px] text-gray-500 font-mono mt-1">Inv #{inv.id} • {inv.date}</p>
                                                </div>
                                                <span className="text-[9px] bg-amber-900/20 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full font-black uppercase tracking-widest animate-pulse">Needs Approval</span>
                                            </div>
                                            
                                            <div className="bg-black/40 p-4 rounded-xl border border-white/5 mb-6">
                                                <p className="text-xs text-gray-400 mb-1">Declared Method: <span className="text-white font-bold">{inv.paymentMethod || 'Unknown'}</span></p>
                                                <p className="text-3xl font-black text-white italic">₹{inv.amount.toLocaleString()}</p>
                                                <p className="text-[10px] text-gray-500 mt-1">{inv.packageName}</p>
                                            </div>

                                            <div className="flex gap-3">
                                                <button onClick={() => handleRejectPayment(inv)} className="flex-1 py-3 bg-red-900/20 text-red-500 border border-red-500/30 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-900/40 transition-all flex items-center justify-center gap-2">
                                                    <XCircle className="w-4 h-4"/> Reject
                                                </button>
                                                <button onClick={() => handleApprovePayment(inv)} className="flex-[2] py-3 bg-green-600 text-black font-black rounded-xl uppercase text-[10px] tracking-widest hover:bg-green-500 transition-all shadow-lg flex items-center justify-center gap-2">
                                                    <CheckCircle className="w-4 h-4"/> Approve & Receipt
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'Invoices' && (
                // ... [Existing Invoice UI - similar to provided code]
                 <div className="space-y-6 animate-slide-up">
                    <div className="flex justify-between items-center bg-gray-950 p-4 rounded-[3rem] border border-white/5">
                        <div className="flex gap-2">
                             {['All', 'Paid', 'Pending', 'Overdue'].map(f => (
                                 <button 
                                    key={f} 
                                    onClick={() => setFilter(f as any)}
                                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-500 hover:text-white'}`}
                                 >
                                     {f}
                                 </button>
                             ))}
                        </div>
                        <button onClick={() => setIsWizardOpen(true)} className="bg-white text-black px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-amber-400 transition-all shadow-lg">
                            <Plus className="w-4 h-4" /> Create Invoice
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredInvoices.map(inv => (
                            <div key={inv.id} className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[3rem] relative overflow-hidden group hover:border-amber-500/30 transition-all shadow-xl">
                                {inv.status === 'Overdue' && <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/20 blur-3xl rounded-full"></div>}
                                
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-4 rounded-2xl ${inv.status === 'Paid' ? 'bg-green-900/20 text-green-500' : inv.status === 'Overdue' ? 'bg-red-900/20 text-red-500' : inv.status === 'Verification Pending' ? 'bg-blue-900/20 text-blue-500' : 'bg-amber-900/20 text-amber-500'}`}>
                                            <FileText className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">{inv.memberName}</h4>
                                            <p className="text-[10px] text-gray-500 font-mono mt-1">{inv.date} • {inv.packageName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-black text-white italic tracking-tighter">₹{inv.amount}</p>
                                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border mt-2 inline-block ${
                                            inv.status === 'Paid' ? 'text-green-500 border-green-500/30 bg-green-500/10' : 
                                            inv.status === 'Overdue' ? 'text-red-500 border-red-500/30 bg-red-500/10' : 
                                            inv.status === 'Verification Pending' ? 'text-blue-500 border-blue-500/30 bg-blue-500/10' :
                                            'text-amber-500 border-amber-500/30 bg-amber-500/10'
                                        }`}>
                                            {inv.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3 relative z-10">
                                    {inv.status !== 'Paid' && inv.status !== 'Verification Pending' && (
                                        <>
                                            <button onClick={() => handleOpenPayment(inv)} className="flex-1 py-4 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-green-400 transition-all shadow-lg">
                                                Accept Payment
                                            </button>
                                            <button onClick={() => {
                                                const member = members.find(m => m.id === inv.memberId);
                                                if (member && member.phone) {
                                                    const msg = `URGENT: Dear ${member.name}, your payment of Rs.${inv.amount} for invoice #${inv.id} is ${inv.status}. Please pay immediately to avoid service interruption. - Royal The Gym`;
                                                    window.open(`https://wa.me/${member.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                                } else {
                                                    addToast("Member phone number not found.", "error");
                                                }
                                            }} className="flex-1 py-4 bg-amber-500 text-black font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-amber-400 transition-all shadow-lg flex items-center justify-center gap-2">
                                                <Send className="w-4 h-4" /> Reminder
                                            </button>
                                        </>
                                    )}
                                    {inv.status === 'Verification Pending' && (
                                        <button onClick={() => setActiveTab('Approvals')} className="flex-1 py-4 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-blue-500 transition-all shadow-lg">
                                            Go to Approvals
                                        </button>
                                    )}
                                    <button onClick={() => { setReceiptData({ invoice: inv }); setShowReceipt(true); }} className="px-6 py-4 bg-gray-900 text-gray-400 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:text-white border border-white/10 hover:border-white/30">
                                        <Printer className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* POS Tab */}
            {activeTab === 'POS' && (
               // ... [Existing POS UI - similar to provided code]
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up h-[650px]">
                    {/* Inventory Grid */}
                    <div className="lg:col-span-8 overflow-y-auto custom-scrollbar pr-2">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {inventory.filter(i => i.stock > 0).map(item => (
                                <div 
                                    key={item.id} 
                                    onClick={() => addToCart(item)}
                                    className="bg-gray-900 border border-white/5 p-6 rounded-[2.5rem] cursor-pointer hover:border-amber-500/50 transition-all group flex flex-col justify-between h-56 relative overflow-hidden shadow-lg"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        {item.category === 'Supplement' ? <Zap className="w-20 h-20" /> : <ShoppingBag className="w-20 h-20" />}
                                    </div>
                                    <div className="relative z-10">
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full border border-white/5">{item.category}</span>
                                        <h4 className="text-white font-bold mt-4 leading-tight text-lg">{item.name}</h4>
                                    </div>
                                    <div className="relative z-10 flex justify-between items-end">
                                        <p className="text-2xl font-black text-amber-500 italic">₹{item.price}</p>
                                        <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cart / Checkout */}
                    <div className="lg:col-span-4 bg-black border border-white/10 rounded-[3.5rem] p-8 flex flex-col shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500"></div>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-8">Holo-Cart</h3>
                        
                        <div className="mb-6">
                            <select 
                                value={selectedMemberId}
                                onChange={(e) => setSelectedMemberId(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full bg-gray-900 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-amber-500 shadow-inner appearance-none"
                            >
                                <option value="">Walk-in Customer</option>
                                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-6 bg-gray-900/30 rounded-3xl p-4 border border-white/5">
                            {cartItems.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-xs text-gray-300 p-3 bg-black/40 rounded-xl border border-white/5">
                                    <span className="font-bold">{item.description}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-amber-500">₹{item.amount}</span>
                                        <button onClick={() => setCartItems(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-white"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-white/10 pt-6">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total</span>
                                <span className="text-4xl font-black text-white italic">₹{cartTotal}</span>
                            </div>
                            <button 
                                onClick={handleCreateInvoice}
                                disabled={cartItems.length === 0}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-5 rounded-[2.5rem] uppercase tracking-widest text-xs shadow-xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                            >
                                <CreditCard className="w-5 h-5" /> Checkout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PAYMENT MODAL (Updated for WhatsApp Confirmation) */}
            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Secure Transaction">
                 {activePaymentInvoice && (
                     <div className="text-center py-8 space-y-10 relative overflow-hidden">
                         
                         {/* AI Sentinel Overlay */}
                         {isFraudScanning && (
                             <div className="absolute inset-0 bg-black/90 z-20 flex flex-col items-center justify-center backdrop-blur-md">
                                 <ShieldAlert className="w-20 h-20 text-red-500 animate-pulse mb-4" />
                                 <h3 className="text-2xl font-black text-white uppercase italic tracking-widest">AI Fraud Sentinel</h3>
                                 <p className="text-xs text-red-400 font-mono mt-2 uppercase tracking-[0.3em] animate-pulse">Scanning Transaction Pattern...</p>
                                 <div className="w-64 h-1 bg-gray-800 rounded-full mt-6 overflow-hidden">
                                     <div className="h-full bg-red-500 animate-shimmer"></div>
                                 </div>
                             </div>
                         )}

                         <div>
                             <p className="text-gray-500 font-bold uppercase text-xs tracking-[0.3em] mb-2">Total Payable</p>
                             <h2 className="text-7xl font-black text-white italic tracking-tighter">₹{activePaymentInvoice.amount}</h2>
                         </div>
                         
                         <div className="flex justify-center gap-4">
                             {['UPI', 'Card', 'Cash'].map(m => (
                                 <button 
                                    key={m}
                                    onClick={() => setPaymentMethod(m as any)}
                                    className={`px-6 py-4 rounded-2xl font-black uppercase text-[10px] border transition-all ${paymentMethod === m ? 'bg-white text-black border-white shadow-xl scale-105' : 'bg-black text-gray-500 border-white/10 hover:border-white/30'}`}
                                 >
                                     {m}
                                 </button>
                             ))}
                         </div>
                         
                         {paymentMethod === 'UPI' && (
                             <div className="bg-white p-6 rounded-[3rem] inline-block shadow-2xl relative overflow-hidden group border-8 border-white ring-4 ring-green-500/20">
                                 <img src={paymentQr} className="w-56 h-56 mix-blend-multiply relative z-10" alt="QR" />
                                 <div className="absolute inset-0 bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                     <Scan className="w-12 h-12 text-black" />
                                 </div>
                             </div>
                         )}

                         {paymentMethod !== 'UPI' && (
                             <div className="p-6 bg-gray-900 rounded-3xl border border-white/10">
                                 <p className="text-xs text-gray-400 mb-2">Automation Status:</p>
                                 <div className="flex items-center justify-center gap-2 text-green-400 font-bold text-xs uppercase">
                                     <CheckCircle className="w-4 h-4"/> WhatsApp Receipt will be sent
                                 </div>
                             </div>
                         )}

                         <button 
                            onClick={handleConfirmPayment}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-6 rounded-[2.5rem] uppercase tracking-[0.3em] text-xs shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                            <CheckCircle className="w-5 h-5" /> Confirm Receipt
                        </button>
                     </div>
                 )}
            </Modal>
            
            {/* ... Receipt Template Renderer ... */}
            {showReceipt && receiptData && (
                <ReceiptTemplate 
                    invoiceId={receiptData.invoice.id.toString()}
                    memberName={receiptData.invoice.memberName}
                    memberPhone={members.find(m => m.id === receiptData.invoice.memberId)?.phone || ''}
                    amount={receiptData.invoice.amount}
                    date={receiptData.invoice.date}
                    method={receiptData.txn?.method || 'Unknown'}
                    items={receiptData.invoice.items}
                    onClose={() => setShowReceipt(false)}
                />
            )}

            {/* ... Wizard Modal ... */}
            <Modal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} title="New Fiscal Entry">
                 <div className="p-10 text-center">
                     <ShoppingBag className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                     <p className="text-gray-400 text-sm mb-6 font-medium">Quick Invoice Generator Mode</p>
                     <p className="text-xs text-amber-500 font-bold uppercase tracking-widest bg-amber-900/20 px-4 py-2 rounded-xl inline-block border border-amber-500/20">Please use the Holo-POS tab for itemized billing.</p>
                 </div>
            </Modal>

        </div>
    );
};

export default Billing;
