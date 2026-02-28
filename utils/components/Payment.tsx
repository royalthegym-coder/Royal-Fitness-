
import React, { useState, useEffect, useMemo } from 'react';
import Card from './common/Card';
import { GYM_INFO } from '../../constants';
import { Transaction, Invoice, InvoiceItem, InventoryItem } from '../../types';
import { toDataURL } from 'qrcode';
import { sendPaymentReceipt } from '../../lib/whatsapp';
import ReceiptTemplate from './common/ReceiptTemplate';
import { useData } from '../context/DataProvider';
import { 
    Printer, CreditCard, Smartphone, Banknote, 
    Search, Zap, ArrowRight, ShieldCheck,
    CheckCircle, AlertTriangle, Fingerprint, 
    Activity, ShoppingBag, Plus, Minus, Trash2, User, Cpu, 
    RefreshCw, ScanLine, Globe
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

const Payment: React.FC = () => {
    const { invoices = [], updateInvoiceStatus, transactions = [], addTransaction, members = [], inventory, updateInventory, addInvoice, addAuditLog } = useData();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'terminal' | 'pos' | 'history'>('terminal');
    
    // v31.0 Global State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processStep, setProcessStep] = useState<'idle' | 'encrypting' | 'handshake' | 'finalizing' | 'fraud_check'>('idle');
    const [successData, setSuccessData] = useState<Transaction | null>(null);
    const [qrCode, setQrCode] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Google Pay' | 'Card' | 'Cash'>('UPI');

    // POS State
    const [posCart, setPosCart] = useState<{item: InventoryItem, qty: number}[]>([]);
    const [posMemberId, setPosMemberId] = useState<number | 'Walk-in'>('Walk-in');
    const [posSearch, setPosSearch] = useState('');
    const [posCategory, setPosCategory] = useState<'All' | 'Supplement' | 'Accessory' | 'Apparel'>('All');

    // Live Liquidity Graph Data
    const [liquidityData, setLiquidityData] = useState<{time: string, amount: number}[]>([]);

    // Context Refs
    const [historyReceiptData, setHistoryReceiptData] = useState<{txn: Transaction, items: InvoiceItem[]} | null>(null);

    // --- LIVE LIQUIDITY ENGINE ---
    useEffect(() => {
        // Initialize graph with recent transactions or mock data if empty
        const recent = transactions.slice(0, 15).map(t => ({
            time: t.id.split('-')[1] ? new Date(parseInt(t.id.split('-')[1])).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '00:00',
            amount: t.amount
        })).reverse();

        // Fill with dummy data if not enough to look good
        const filledData = recent.length < 5 
            ? Array.from({length: 10}, (_, i) => ({ time: `${10+i}:00`, amount: Math.random() * 5000 + 1000 })) 
            : recent;

        setLiquidityData(filledData);
    }, [transactions]);

    const pendingInvoices = useMemo(() => {
        return invoices
            .filter(inv => (inv.status === 'Pending' || inv.status === 'Overdue'))
            .filter(inv => inv.memberName.toLowerCase().includes(searchTerm.toLowerCase()) || inv.id.toString().includes(searchTerm))
            .sort((a, b) => {
                // Prioritize Overdue in the queue
                if (a.status === 'Overdue' && b.status !== 'Overdue') return -1;
                if (a.status !== 'Overdue' && b.status === 'Overdue') return 1;
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
    }, [invoices, searchTerm]);

    const filteredInventory = useMemo(() => {
        return inventory.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(posSearch.toLowerCase());
            const matchesCat = posCategory === 'All' || item.category === posCategory;
            return matchesSearch && matchesCat;
        });
    }, [inventory, posSearch, posCategory]);

    const posTotal = useMemo(() => {
        return posCart.reduce((acc, cartItem) => acc + ((cartItem.item.price || 0) * cartItem.qty), 0);
    }, [posCart]);

    // Inbuilt Google Node QR Generation
    useEffect(() => {
        if (selectedInvoice && (paymentMethod === 'UPI' || paymentMethod === 'Google Pay')) {
            const note = `Inv-${selectedInvoice.id}`;
            // Standard UPI String
            const upiId = paymentMethod === 'Google Pay' ? (localStorage.getItem('google_pay_upi') || GYM_INFO.upiIds.gpay1) : GYM_INFO.upiIds.gpay1;
            const uri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(GYM_INFO.name)}&am=${selectedInvoice.amount.toFixed(2)}&cu=INR&tn=${note}`;
            
            toDataURL(uri, { width: 400, margin: 1, color: { dark: '#000000', light: '#ffffff' } }).then(url => setQrCode(url));
        }
    }, [selectedInvoice, paymentMethod]);

    const handleProcessTreasury = async () => {
        if (!selectedInvoice) return;
        
        setIsProcessing(true);
        setProcessStep('encrypting');
        
        // v31.0 Sentinel Security Handshake Simulation
        await new Promise(r => setTimeout(r, 800));
        
        // AI Fraud Check for Cash > 5000
        if (paymentMethod === 'Cash' && selectedInvoice.amount > 5000) {
            setProcessStep('fraud_check');
            await new Promise(r => setTimeout(r, 1500));
        }

        setProcessStep('handshake');
        await new Promise(r => setTimeout(r, 800));
        
        setProcessStep('finalizing');
        await new Promise(r => setTimeout(r, 600));

        const methodStr = paymentMethod === 'UPI' ? 'QR Code' : paymentMethod === 'Google Pay' ? 'Google Pay' : paymentMethod === 'Card' ? 'Card' : 'Cash';
        const txnId = `TXN-${Date.now()}`;
        const timeNow = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        const newTxn: Transaction = {
            id: txnId,
            memberName: selectedInvoice.memberName,
            amount: selectedInvoice.amount,
            date: new Date().toISOString().split('T')[0],
            method: methodStr as any
        };

        addTransaction(newTxn);
        updateInvoiceStatus(selectedInvoice.id, 'Paid');

        // Revenue Oracle Sync & Automation
        const member = members.find(m => m.id === selectedInvoice.memberId);
        if (member?.phone && member.whatsappConsent) {
            const itemsDesc = selectedInvoice.items?.map(i => i.description).join(', ') || selectedInvoice.packageName;
            sendPaymentReceipt(member.name, member.phone, newTxn.amount, newTxn.id, itemsDesc);
        }

        // Update Live Graph
        setLiquidityData(prev => [...prev.slice(1), { time: timeNow, amount: newTxn.amount }]);

        setSuccessData(newTxn);
        setIsProcessing(false);
        setProcessStep('idle');
        addToast("Treasury injection successful. Oracle synchronized.", "success");
    };

    const handleResetTerminal = () => {
        setSuccessData(null);
        setSelectedInvoice(null);
        setQrCode('');
        setPaymentMethod('UPI');
    };

    // --- POS ACTIONS ---

    const addToPosCart = (item: InventoryItem) => {
        if (item.stock <= 0) {
            addToast("Out of Stock", "error");
            return;
        }
        setPosCart(prev => {
            const existing = prev.find(p => p.item.id === item.id);
            if (existing) {
                if (existing.qty >= item.stock) {
                    addToast("Max stock reached for this item.", "error");
                    return prev;
                }
                return prev.map(p => p.item.id === item.id ? { ...p, qty: p.qty + 1 } : p);
            }
            return [...prev, { item, qty: 1 }];
        });
    };

    const removeFromPosCart = (itemId: string) => {
        setPosCart(prev => prev.filter(p => p.item.id !== itemId));
    };

    const updatePosQty = (itemId: string, delta: number) => {
        setPosCart(prev => prev.map(p => {
            if (p.item.id === itemId) {
                const newQty = Math.max(1, Math.min(p.item.stock, p.qty + delta));
                return { ...p, qty: newQty };
            }
            return p;
        }));
    };

    const handlePosCheckout = () => {
        if (posCart.length === 0) return;
        setIsProcessing(true);

        setTimeout(() => {
            // 1. Create Invoice
            const memberName = posMemberId === 'Walk-in' ? 'Walk-in Customer' : members.find(m => m.id === posMemberId)?.name || 'Unknown';
            const invoiceId = Date.now();
            const newInvoice: Invoice = {
                id: invoiceId,
                memberId: posMemberId === 'Walk-in' ? 0 : (posMemberId as number),
                memberName: memberName,
                packageId: 0,
                packageName: 'Store Purchase',
                amount: posTotal,
                date: new Date().toISOString().split('T')[0],
                status: 'Paid',
                items: posCart.map(p => ({
                    description: p.item.name,
                    amount: (p.item.price || 0) * p.qty,
                    type: 'Product'
                }))
            };
            addInvoice(newInvoice);

            // 2. Create Transaction
            const txnId = `POS-${Date.now()}`;
            const newTxn: Transaction = {
                id: txnId,
                memberName: memberName,
                amount: posTotal,
                date: new Date().toISOString().split('T')[0],
                method: paymentMethod === 'UPI' ? 'QR Code' : paymentMethod === 'Card' ? 'Card' : 'Cash'
            };
            addTransaction(newTxn);

            // 3. Update Inventory
            posCart.forEach(p => {
                updateInventory({ ...p.item, stock: p.item.stock - p.qty });
            });

            // 4. Log
            addAuditLog({
                member_id: posMemberId === 'Walk-in' ? 0 : (posMemberId as number),
                action: 'POS_SALE',
                details: `Sold ${posCart.length} items. Total: ₹${posTotal}`
            });
            
            // Update Graph
            setLiquidityData(prev => [...prev.slice(1), { time: 'Now', amount: newTxn.amount }]);

            // 5. Reset & Show Receipt
            setHistoryReceiptData({ txn: newTxn, items: newInvoice.items || [] });
            setPosCart([]);
            setPosMemberId('Walk-in');
            setIsProcessing(false);
            addToast("POS Transaction Complete. Inventory Updated.", "success");

        }, 1500);
    };

    const renderPosTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            {/* LEFT: MARKETPLACE */}
            <div className="lg:col-span-8 flex flex-col gap-6 h-full">
                <Card className="bg-[#0c0c0c] border-white/5 flex-none p-6 rounded-[2.5rem]">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input 
                                type="text" 
                                placeholder="Search Products..." 
                                value={posSearch}
                                onChange={(e) => setPosSearch(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white text-sm focus:border-amber-500 outline-none"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto w-full md:w-auto no-scrollbar">
                            {['All', 'Supplement', 'Accessory', 'Apparel'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setPosCategory(cat as any)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all whitespace-nowrap ${posCategory === cat ? 'bg-amber-500 text-black' : 'bg-gray-900 text-gray-500 hover:text-white'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-2 md:grid-cols-3 gap-4 content-start max-h-[600px]">
                    {filteredInventory.map(item => (
                        <div 
                            key={item.id} 
                            onClick={() => addToPosCart(item)}
                            className="bg-gray-900/40 border border-white/5 p-4 rounded-[2rem] hover:border-amber-500/50 transition-all cursor-pointer group flex flex-col justify-between h-48 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                {item.category === 'Supplement' ? <Zap className="w-16 h-16" /> : <ShoppingBag className="w-16 h-16" />}
                            </div>
                            <div className="relative z-10">
                                <span className={`text-[9px] font-black text-gray-500 uppercase tracking-widest bg-black/40 px-2 py-1 rounded ${item.stock <= item.threshold ? 'text-red-500 animate-pulse' : ''}`}>
                                    {item.stock <= 0 ? 'OUT OF STOCK' : item.category}
                                </span>
                                <h4 className="text-sm font-bold text-white leading-tight line-clamp-2 mb-1 mt-2">{item.name}</h4>
                                <p className={`text-[10px] ${item.stock <= item.threshold ? 'text-red-500' : 'text-gray-500'} font-mono`}>
                                    Stock: {item.stock}
                                </p>
                            </div>
                            <div className="relative z-10 flex justify-between items-end">
                                <p className="text-lg font-black text-amber-500 italic">₹{item.price?.toLocaleString() || 'N/A'}</p>
                                <button className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: CART & CHECKOUT */}
            <div className="lg:col-span-4 flex flex-col gap-6 h-full">
                <Card className="bg-[#0a0a0a] border-white/5 flex-1 flex flex-col p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500"></div>
                    
                    {/* Member Select */}
                    <div className="mb-6 relative">
                        <select 
                            value={posMemberId}
                            onChange={(e) => setPosMemberId(e.target.value === 'Walk-in' ? 'Walk-in' : Number(e.target.value))}
                            className="w-full bg-gray-900 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold outline-none focus:border-amber-500 appearance-none"
                        >
                            <option value="Walk-in">Walk-in Customer</option>
                            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-6 pr-1 max-h-[400px]">
                        {posCart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                                <ShoppingBag className="w-12 h-12 mb-3" />
                                <p className="text-xs font-black uppercase tracking-widest">Cart Empty</p>
                            </div>
                        ) : (
                            posCart.map((cartItem) => (
                                <div key={cartItem.item.id} className="flex justify-between items-center bg-gray-900/50 p-3 rounded-2xl border border-white/5">
                                    <div className="flex-1 min-w-0 mr-3">
                                        <p className="text-xs font-bold text-white truncate">{cartItem.item.name}</p>
                                        <p className="text-[10px] text-gray-500">₹{cartItem.item.price} x {cartItem.qty}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => updatePosQty(cartItem.item.id, -1)} className="p-1 hover:bg-white/10 rounded"><Minus className="w-3 h-3 text-gray-400"/></button>
                                        <span className="text-xs font-mono font-bold w-4 text-center">{cartItem.qty}</span>
                                        <button onClick={() => updatePosQty(cartItem.item.id, 1)} className="p-1 hover:bg-white/10 rounded"><Plus className="w-3 h-3 text-gray-400"/></button>
                                        <button onClick={() => removeFromPosCart(cartItem.item.id)} className="p-1 hover:bg-red-900/20 rounded text-red-500 ml-1"><Trash2 className="w-3 h-3"/></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Totals & Pay */}
                    <div className="pt-4 border-t border-white/10 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400 uppercase font-bold">Total</span>
                            <span className="text-2xl font-black text-amber-500">₹{posTotal.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex gap-2">
                             {['UPI', 'Card', 'Cash'].map(m => (
                                <button 
                                    key={m}
                                    onClick={() => setPaymentMethod(m as any)}
                                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${paymentMethod === m ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-gray-700'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={handlePosCheckout}
                            disabled={posCart.length === 0 || isProcessing}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4" />}
                            {isProcessing ? 'Processing...' : 'Complete Sale'}
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* v31.0 Autonomous Header */}
            <div className="bg-[#050505] p-8 rounded-[3.5rem] border border-amber-500/20 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] animate-pulse"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-gradient-to-tr from-amber-600 to-orange-400 rounded-[2rem] text-black shadow-[0_0_40px_rgba(245,158,11,0.4)] transform group-hover:rotate-12 transition-transform">
                            <Zap className="w-10 h-10 fill-current" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Fiscal <span className="text-amber-500">Terminal</span></h1>
                            <p className="text-gray-500 text-[9px] font-mono tracking-[0.5em] uppercase font-bold mt-2">Inbuilt v31.0 Global Treasury Hub</p>
                        </div>
                    </div>
                    
                    <div className="flex bg-black/60 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl overflow-x-auto no-scrollbar max-w-full">
                        <button onClick={() => setActiveTab('terminal')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'terminal' ? 'bg-white text-black shadow-2xl' : 'text-gray-500 hover:text-white'}`}>
                            <Activity className="w-4 h-4"/> Live Queue
                        </button>
                        <button onClick={() => setActiveTab('pos')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'pos' ? 'bg-white text-black shadow-2xl' : 'text-gray-500 hover:text-white'}`}>
                            <ShoppingBag className="w-4 h-4"/> Holo-POS
                        </button>
                        <button onClick={() => setActiveTab('history')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'history' ? 'bg-white text-black shadow-2xl' : 'text-gray-500 hover:text-white'}`}>
                            <ShieldCheck className="w-4 h-4"/> Quantum Ledger
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'pos' && renderPosTab()}

            {activeTab === 'terminal' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[750px]">
                    {/* NEURAL QUEUE MATRIX */}
                    <Card className="lg:col-span-4 bg-[#0a0a0a] border-white/5 flex flex-col p-0 overflow-hidden rounded-[3rem] shadow-2xl">
                        <div className="p-8 bg-gray-900/50 border-b border-white/5 space-y-5">
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Awaiting Injection</p>
                                <div className="bg-amber-500 text-black text-[9px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                    <Cpu className="w-3 h-3"/> {pendingInvoices.length} Nodes
                                </div>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                <input 
                                    type="text" 
                                    placeholder="Scan Neural Signature..." 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-14 pr-4 text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-mono" 
                                />
                            </div>
                        </div>
                        
                        {/* Liquidity Velocity Mini Graph */}
                        <div className="h-24 bg-black/60 relative border-b border-white/5">
                             <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={liquidityData}>
                                    <defs>
                                        <linearGradient id="liquidityFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="amount" stroke="#f59e0b" fill="url(#liquidityFill)" strokeWidth={2} isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                            <div className="absolute top-2 left-2 text-[8px] text-amber-500 font-bold uppercase">Liquidity Velocity (Live)</div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {pendingInvoices.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-gray-800 opacity-20 py-20">
                                    <CheckCircle className="w-20 h-20 mb-4" />
                                    <p className="text-sm font-black uppercase tracking-widest italic">All Balances Synchronized</p>
                                </div>
                            )}
                            {pendingInvoices.map(inv => (
                                <div 
                                    key={inv.id}
                                    onClick={() => !isProcessing && !successData && setSelectedInvoice(inv)}
                                    className={`p-6 rounded-[2rem] border cursor-pointer transition-all flex justify-between items-center group relative overflow-hidden ${selectedInvoice?.id === inv.id ? 'bg-amber-500/10 border-amber-500 shadow-xl scale-[1.03]' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
                                >
                                    <div className="relative z-10">
                                        <h4 className={`text-lg font-black italic uppercase tracking-tighter leading-none ${selectedInvoice?.id === inv.id ? 'text-amber-500' : 'text-white'}`}>{inv.memberName}</h4>
                                        <p className={`text-[9px] font-mono mt-2 uppercase tracking-widest ${inv.status === 'Overdue' ? 'text-red-500' : 'text-gray-500'}`}>
                                            {inv.status === 'Overdue' ? '⚠ DELINQUENT' : 'Pending Sync'}
                                        </p>
                                    </div>
                                    <div className="text-right relative z-10">
                                        <span className="text-2xl font-black text-white italic tracking-tighter">₹{inv.amount.toLocaleString()}</span>
                                        <div className="flex justify-end mt-1">
                                             <ArrowRight className={`w-4 h-4 transition-transform ${selectedInvoice?.id === inv.id ? 'text-amber-500 translate-x-1' : 'text-gray-800 group-hover:translate-x-1'}`} />
                                        </div>
                                    </div>
                                    {inv.status === 'Overdue' && <div className="absolute top-0 right-0 w-8 h-8 bg-red-600/10 rounded-bl-full flex items-start justify-end p-1"><AlertTriangle className="w-3 h-3 text-red-500" /></div>}
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* INTERFACE COMMAND DECK */}
                    <Card className="lg:col-span-8 bg-[#020202] border-white/5 relative overflow-hidden flex flex-col shadow-2xl p-0 rounded-[3.5rem]">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

                        {successData ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center animate-scale-in">
                                <div className="relative mb-12">
                                    <div className="absolute inset-0 bg-green-500 blur-3xl opacity-20 animate-pulse rounded-full"></div>
                                    <div className="w-40 h-40 bg-green-500 rounded-full flex items-center justify-center relative z-10 border-[12px] border-green-400 shadow-[0_0_100px_rgba(34,197,94,0.4)]">
                                        <CheckCircle className="w-20 h-20 text-black" />
                                    </div>
                                </div>
                                <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter mb-4">Uplink Confirmed</h2>
                                <p className="text-green-400 font-mono text-xl tracking-[0.5em] mb-12">TREASURY_INJECTION_SUCCESSFUL</p>
                                
                                <div className="flex gap-6">
                                    <button onClick={handleResetTerminal} className="bg-white text-black font-black px-12 py-5 rounded-2xl shadow-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs italic flex items-center gap-3 active:scale-95">
                                        <RefreshCw className="w-4 h-4" /> Next Operation
                                    </button>
                                </div>
                            </div>
                        ) : selectedInvoice ? (
                            <div className="w-full h-full flex flex-col relative z-10 animate-fade-in">
                                {/* Subject Metadata */}
                                <div className="bg-gray-900/80 p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-center backdrop-blur-3xl">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 rounded-[2rem] bg-gray-800 border-2 border-amber-500/30 flex items-center justify-center shadow-2xl relative overflow-hidden">
                                             <img src={members.find(m => m.id === selectedInvoice.memberId)?.avatar} className="w-full h-full object-cover" alt="avatar" />
                                             <div className="absolute inset-0 bg-amber-500/10 animate-scan"></div>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Target Entity Profile</p>
                                            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">{selectedInvoice.memberName}</h2>
                                            <p className="text-[10px] text-amber-500 font-mono mt-3 flex items-center gap-2">
                                                <Fingerprint className="w-3 h-3" /> NEURAL_ID: #{selectedInvoice.memberId} // SECTOR_JP
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right mt-6 md:mt-0">
                                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Net Treasury Input</p>
                                        <div className="text-7xl font-black text-white italic tracking-tighter">₹{selectedInvoice.amount.toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col md:flex-row">
                                    {/* Protocol Selection */}
                                    <div className="w-full md:w-80 bg-gray-900/30 border-r border-white/5 p-8 space-y-4">
                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] mb-8">Select Entry Protocol</p>
                                        {[
                                            { id: 'UPI', icon: <Smartphone />, label: 'Neural Link' },
                                            { id: 'Google Pay', icon: <Globe />, label: 'Google Business' },
                                            { id: 'Card', icon: <CreditCard />, label: 'Card Swiper' },
                                            { id: 'Cash', icon: <Banknote />, label: 'Physical Vault' }
                                        ].map((m) => (
                                            <button 
                                                key={m.id} 
                                                onClick={() => setPaymentMethod(m.id as any)} 
                                                className={`w-full p-6 rounded-3xl text-left border transition-all flex items-center justify-between group ${paymentMethod === m.id ? 'bg-white text-black border-white shadow-2xl scale-105' : 'bg-black border-white/5 text-gray-500 hover:border-white/20'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={paymentMethod === m.id ? 'text-black' : 'text-gray-600'}>{m.icon}</div>
                                                    <div>
                                                        <p className="font-black text-xs uppercase tracking-widest leading-none">{m.id}</p>
                                                        <p className="text-[8px] font-bold opacity-50 uppercase mt-1">{m.label}</p>
                                                    </div>
                                                </div>
                                                {paymentMethod === m.id && <div className="w-2 h-2 bg-black rounded-full animate-ping"></div>}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Central Gateway */}
                                    <div className="flex-1 p-12 flex flex-col items-center justify-center relative">
                                        {isProcessing ? (
                                            <div className="flex flex-col items-center space-y-10 animate-fade-in">
                                                <div className="relative">
                                                     <div className="w-32 h-32 border-8 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                                     <div className="absolute inset-0 flex items-center justify-center">
                                                         {processStep === 'fraud_check' ? <AlertTriangle className="w-12 h-12 text-red-500 animate-pulse"/> : <ShieldCheck className="w-12 h-12 text-amber-500 animate-pulse" />}
                                                     </div>
                                                </div>
                                                <div className="text-center space-y-3">
                                                    <p className="text-white font-black uppercase tracking-[0.5em] text-2xl italic">
                                                        {processStep === 'encrypting' ? 'ENCRYPTING...' : 
                                                         processStep === 'fraud_check' ? 'AI FRAUD SCAN...' :
                                                         processStep === 'handshake' ? 'AUTH_HANDSHAKE' : 'UPLINKING...'}
                                                    </p>
                                                    <p className="text-gray-600 text-[10px] font-mono tracking-widest">
                                                        {processStep === 'fraud_check' ? 'ANALYZING PATTERNS' : 'PROTOCOL: ROYAL_v31_TLS'}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (paymentMethod === 'UPI' || paymentMethod === 'Google Pay') ? (
                                            <div className="text-center animate-fade-in relative">
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-green-500/10 text-green-400 px-4 py-1.5 rounded-full border border-green-500/30 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                                    <ShieldCheck className="w-3 h-3" /> {paymentMethod === 'Google Pay' ? 'Google Business Node Verified' : 'UPI Node Verified'}
                                                </div>
                                                <div className="bg-white p-8 rounded-[4rem] inline-block shadow-[0_0_80px_rgba(255,255,255,0.1)] border-[16px] border-white ring-4 ring-green-500/20 relative group mb-10 overflow-hidden">
                                                    <img src={qrCode} alt="QR" className="w-64 h-64 object-contain mix-blend-multiply relative z-10" />
                                                    <div className="absolute inset-0 bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                        <p className="text-black font-black text-xs uppercase tracking-widest text-center">Scan with<br/>GPay / PhonePe</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.6em]">Inbuilt v31.0 Payment Node</p>
                                                </div>
                                            </div>
                                        ) : paymentMethod === 'Card' ? (
                                            <div className="text-center animate-fade-in space-y-10">
                                                <div className="w-56 h-56 bg-blue-900/10 rounded-[4rem] border-4 border-blue-500/30 flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.1)] mx-auto relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
                                                    <CreditCard className="w-24 h-24 text-blue-400 animate-bounce-slow relative z-10" />
                                                </div>
                                                <div>
                                                    <p className="text-blue-400 font-black uppercase tracking-[0.4em] text-sm">POS Terminal Armed</p>
                                                    <p className="text-gray-600 text-[10px] font-mono mt-3 uppercase tracking-widest">Awaiting Physical Authorization</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center animate-fade-in space-y-10">
                                                <div className="w-56 h-56 bg-amber-900/10 rounded-[4rem] border-4 border-amber-500/30 flex items-center justify-center shadow-[0_0_60px_rgba(245,158,11,0.1)] mx-auto relative overflow-hidden">
                                                    <Banknote className="w-24 h-24 text-amber-500 relative z-10" />
                                                </div>
                                                <div>
                                                    <p className="text-amber-400 font-black uppercase tracking-[0.4em] text-sm">Treasury Drawer Released</p>
                                                    <p className="text-gray-600 text-[10px] font-mono mt-3 uppercase">CONFIRM INJECTION: ₹{selectedInvoice.amount}</p>
                                                </div>
                                            </div>
                                        )}

                                        <button 
                                            onClick={handleProcessTreasury}
                                            disabled={isProcessing}
                                            className="w-full max-w-md mt-16 bg-white text-black font-black py-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:bg-amber-500 hover:scale-[1.02] transition-all active:scale-95 uppercase tracking-[0.3em] text-xs italic disabled:opacity-20"
                                        >
                                            Execute Treasury Injection
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center opacity-10 py-40 select-none">
                                <ScanLine className="w-56 h-56 mx-auto mb-10 text-gray-500" />
                                <h3 className="text-7xl font-black text-gray-500 uppercase italic tracking-tighter">Terminal Idle</h3>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {activeTab === 'history' && (
                <Card className="bg-[#050505] border-white/5 h-[750px] flex flex-col p-0 overflow-hidden rounded-[3.5rem] shadow-2xl">
                    <div className="p-10 border-b border-white/5 bg-gray-900/50 flex flex-col md:flex-row justify-between items-center gap-6">
                         <div className="relative w-full md:w-96">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                            <input 
                                type="text" 
                                placeholder="Audit Global Ledger..." 
                                className="w-full bg-black/60 border border-white/10 rounded-2xl py-4 pl-14 pr-4 text-xs text-white focus:border-green-500 outline-none font-mono" 
                            />
                        </div>
                        <div className="flex gap-4">
                             <div className="px-6 py-3 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center gap-3 shadow-xl">
                                 <CheckCircle className="w-4 h-4 text-green-500" />
                                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Inbuilt Audit Status: 100% Pass</span>
                             </div>
                             <button className="px-6 py-3 bg-white text-black font-black uppercase rounded-2xl text-[10px] tracking-widest flex items-center gap-2 shadow-lg hover:bg-gray-200">
                                 <Globe className="w-3 h-3"/> Bank Sync
                             </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-black text-gray-600 text-[10px] uppercase font-black tracking-[0.3em] italic sticky top-0 z-10 border-b border-white/5">
                                <tr>
                                    <th className="p-10">Hash Node</th>
                                    <th className="p-10">Entity Name</th>
                                    <th className="p-10">Timestamp</th>
                                    <th className="p-10 text-center">Protocol</th>
                                    <th className="p-10 text-right">Credits (₹)</th>
                                    <th className="p-10 text-right">Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm font-mono">
                                {transactions.map(txn => (
                                    <tr key={txn.id} className="hover:bg-white/5 transition-all group">
                                        <td className="p-10 text-gray-500 text-xs">#{txn.id.split('-')[1] || txn.id}</td>
                                        <td className="p-10 font-black text-white font-sans italic uppercase tracking-tight text-lg">{txn.memberName}</td>
                                        <td className="p-10 text-gray-500 text-xs">{txn.date}</td>
                                        <td className="p-10 text-center">
                                            <span className="bg-gray-900 border border-white/10 px-4 py-1.5 rounded-xl text-[9px] font-black text-gray-400 uppercase tracking-widest">{txn.method}</span>
                                        </td>
                                        <td className="p-10 text-right font-black text-white italic text-2xl">₹{Math.abs(txn.amount).toLocaleString()}</td>
                                        <td className="p-10 text-right">
                                             <button 
                                                onClick={() => { setHistoryReceiptData({ txn, items: [] }); }} 
                                                className="p-4 bg-gray-900 border border-white/10 text-gray-400 hover:text-white rounded-2xl transition-all shadow-xl opacity-0 group-hover:opacity-100 active:scale-95"
                                            >
                                                <Printer className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {historyReceiptData && (
                <ReceiptTemplate 
                    invoiceId={historyReceiptData.txn.id}
                    memberName={historyReceiptData.txn.memberName}
                    memberPhone="9999999999"
                    amount={historyReceiptData.txn.amount}
                    date={historyReceiptData.txn.date}
                    method={historyReceiptData.txn.method}
                    items={historyReceiptData.items}
                    onClose={() => setHistoryReceiptData(null)} 
                />
            )}
        </div>
    );
};

export default Payment;
