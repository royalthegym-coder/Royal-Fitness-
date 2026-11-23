import { getCurrencySymbol } from '../store/useCurrencyStore';
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataProvider';
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, History, CreditCard, QrCode, Zap, ShieldCheck, Activity } from 'lucide-react';
import Card from './common/Card';
import { motion } from 'motion/react';

interface FuturePayProps {
    memberId?: number;
}

const FuturePay: React.FC<FuturePayProps> = ({ memberId }) => {
    const { members, walletTransactions, addWalletTransaction } = useData();
    const [amount, setAmount] = useState('');
    const [showAddFunds, setShowAddFunds] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState<number | null>(memberId || null);

    useEffect(() => {
        if (memberId) {
            setSelectedMemberId(memberId);
        }
    }, [memberId]);

    const handleAddFunds = () => {
        if (!selectedMemberId || !amount || isNaN(Number(amount))) return;
        
        addWalletTransaction({
            id: `wt_$\\{Date.now()}`,
            memberId: selectedMemberId,
            amount: Number(amount),
            type: 'credit',
            description: 'Encrypted Digital Deposit via Nexus',
            date: new Date().toISOString()
        });
        
        setAmount('');
        setShowAddFunds(false);
    };

    const selectedMember = members.find(m => m.id === selectedMemberId);
    const memberTransactions = walletTransactions.filter(t => t.memberId === selectedMemberId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center bg-black/40 p-6 rounded-2xl border border-emerald-500/20 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                            <Wallet className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                            FuturePay <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Vault</span>
                        </h1>
                    </div>
                    <p className="text-emerald-400/80 font-mono tracking-widest text-xs uppercase flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3" /> Secure Digital Asset Management
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    {!memberId && (
                        <Card className="p-6 bg-black/60 border-emerald-500/30 backdrop-blur-md">
                            <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Zap className="w-4 h-4" /> Node Selection
                            </h3>
                            <select 
                                className="w-full bg-gray-900 border-2 border-gray-800 rounded-xl p-4 text-white focus:border-emerald-500 focus:ring-0 outline-none transition-all font-mono"
                                value={selectedMemberId || ''}
                                onChange={(e) => setSelectedMemberId(Number(e.target.value))}
                            >
                                <option value="">-- Initialize Target Member --</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} [ID: {m.id}]</option>
                                ))}
                            </select>
                        </Card>
                    )}

                    {selectedMember && (
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                            <Card className="p-8 bg-gradient-to-br from-emerald-900/40 via-black to-emerald-950/20 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Wallet className="w-32 h-32" />
                                </div>
                                <div className="text-center relative z-10">
                                    <p className="text-emerald-400/70 text-xs font-black uppercase tracking-[0.3em] mb-2">Liquid Balance</p>
                                    <h2 className="text-6xl font-black text-white mt-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]">
                                        {getCurrencySymbol()}{selectedMember.walletBalance || 0}
                                    </h2>
                                    
                                    <div className="mt-8 flex gap-3 justify-center">
                                        <button 
                                            onClick={() => setShowAddFunds(true)}
                                            className="flex-1 flex justify-center items-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                        >
                                            <Plus className="w-5 h-5" /> Deposit
                                        </button>
                                        <button className="flex-1 flex justify-center items-center gap-2 px-6 py-4 bg-gray-900 hover:bg-gray-800 border border-emerald-500/30 text-white font-bold uppercase tracking-wider rounded-xl transition-all">
                                            <QrCode className="w-5 h-5 text-emerald-400" /> Pay
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {showAddFunds && selectedMember && (
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                            <Card className="p-6 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)] bg-black/80 backdrop-blur-xl">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Initialize Deposit</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-mono text-emerald-400/80 uppercase mb-2">Amount ({getCurrencySymbol()})</label>
                                        <input 
                                            type="number" 
                                            className="w-full bg-black border-2 border-gray-800 rounded-xl p-4 text-2xl font-black text-white focus:border-emerald-500 outline-none transition-all"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="p-4 border-2 border-gray-800 rounded-xl text-white hover:border-emerald-500 hover:bg-emerald-500/10 flex flex-col items-center gap-2 transition-all">
                                            <QrCode className="w-6 h-6 text-emerald-400" />
                                            <span className="text-xs font-bold uppercase tracking-wider">UPI / QR</span>
                                        </button>
                                        <button className="p-4 border-2 border-gray-800 rounded-xl text-white hover:border-blue-500 hover:bg-blue-500/10 flex flex-col items-center gap-2 transition-all">
                                            <CreditCard className="w-6 h-6 text-blue-400" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Card</span>
                                        </button>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            onClick={handleAddFunds}
                                            className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-emerald-400 text-black rounded-xl font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:scale-[1.02]"
                                        >
                                            Confirm
                                        </button>
                                        <button 
                                            onClick={() => setShowAddFunds(false)}
                                            className="px-6 py-4 bg-gray-900 border border-gray-700 text-gray-400 hover:text-white rounded-xl font-bold transition-all uppercase text-sm"
                                        >
                                            Abort
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </div>

                <div className="lg:col-span-2">
                    <Card className="p-0 border-gray-800/50 bg-black/40 overflow-hidden h-full flex flex-col">
                        <div className="p-6 border-b border-gray-800/50 bg-black/60 flex items-center justify-between">
                            <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                                <Activity className="w-5 h-5 text-emerald-400" />
                                Transaction Ledger
                            </h3>
                            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase tracking-widest rounded-full">Live Sync</span>
                        </div>
                        
                        <div className="p-6 flex-1 overflow-y-auto">
                            {!selectedMember ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-gray-500">
                                    <Wallet className="w-16 h-16 text-gray-800 mb-4" />
                                    <p className="font-mono text-sm tracking-widest uppercase">Awaiting Node Selection</p>
                                </div>
                            ) : memberTransactions.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-gray-500">
                                    <History className="w-16 h-16 text-gray-800 mb-4" />
                                    <p className="font-mono text-sm tracking-widest uppercase">Empty Ledger</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {memberTransactions.map((txn, i) => (
                                        <motion.div 
                                            initial={{ opacity: 0, x: -10 }} 
                                            animate={{ opacity: 1, x: 0 }} 
                                            transition={{ delay: i * 0.05 }}
                                            key={txn.id} 
                                            className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-900/80 to-black hover:from-gray-800/80 transition-all rounded-xl border border-gray-800/50 group"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className={`p-3 rounded-xl border $\\{txn.type === 'credit' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]'}`}>
                                                    {txn.type === 'credit' ? <ArrowDownRight className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold tracking-wide">{txn.description}</p>
                                                    <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-1 group-hover:text-gray-400 transition-colors">{new Date(txn.date).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className={`text-2xl font-black $\\{txn.type === 'credit' ? 'text-emerald-400' : 'text-red-500'}`}>
                                                {txn.type === 'credit' ? '+' : '-'}{getCurrencySymbol()}{txn.amount.toLocaleString()}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default FuturePay;
