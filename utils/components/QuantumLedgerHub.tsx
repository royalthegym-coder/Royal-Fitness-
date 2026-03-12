
import React, { useState, useEffect, useRef } from 'react';
import Card from './common/Card';
import { WalletIcon, CoinIcon, NftIcon, ContractIcon } from './icons/QuantumIcons';
import { BotIcon } from './icons/BotIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { LockIcon } from './icons/LockIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { useToast } from '../hooks/useToast';
import { ShoppingBag, Activity, Zap, Send, ArrowRight, Lock as LockLucide, TrendingUp, RefreshCw, Cpu, Layers } from 'lucide-react';
import Modal from './common/Modal';
import { useData } from '../context/DataProvider';
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { getComplexResponse } from '../../lib/gemini';

// --- TYPES ---
interface MarketItem {
    id: string;
    name: string;
    cost: number;
    image: string;
    type: 'Product' | 'Discount';
    purchased?: boolean;
}

interface NFT {
    id: string;
    name: string;
    image: string;
    rarity: 'Common' | 'Rare' | 'Legendary' | 'Artifact';
    unlockedAt: string | null;
    criteria: string;
}

interface Transaction {
    id: string;
    desc: string;
    amount: number;
    type: 'credit' | 'debit';
    time: string;
}

interface CoinValue {
    time: string;
    value: number;
}

const QuantumLedgerHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'wallet' | 'nft' | 'contracts'>('wallet');
    const [balance, setBalance] = useState(1245.50);
    const [stakedBalance, setStakedBalance] = useState(500.00); // v27 Staking
    const [isMining, setIsMining] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([
        { id: 'tx1', desc: 'Workout Reward', amount: 24.5, type: 'credit', time: '10:30 AM' },
        { id: 'tx2', desc: 'Daily Login Bonus', amount: 10.0, type: 'credit', time: '08:00 AM' },
        { id: 'tx3', desc: 'Staking Yield (APY 12%)', amount: 1.5, type: 'credit', time: '06:00 AM' }
    ]);

    // Mining Simulation
    useEffect(() => {
        if (!isMining) return;
        const interval = setInterval(() => {
            // Simulate micro-payments based on "effort"
            const earned = parseFloat((Math.random() * 0.05).toFixed(4));
            setBalance(prev => prev + earned);
        }, 1000);
        return () => clearInterval(interval);
    }, [isMining]);

    // Staking Simulation (APY)
    useEffect(() => {
        if (stakedBalance <= 0) return;
        const interval = setInterval(() => {
            // 12% APY simulated per second
            const yieldAmount = stakedBalance * (0.12 / 31536000) * 5; // accelerated
            setBalance(prev => prev + yieldAmount);
        }, 5000);
        return () => clearInterval(interval);
    }, [stakedBalance]);

    const handlePurchase = (item: MarketItem) => {
        setBalance(prev => prev - item.cost);
        const newTx: Transaction = {
            id: `tx_${Date.now()}`,
            desc: `Bought: ${item.name}`,
            amount: item.cost,
            type: 'debit',
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        setTransactions(prev => [newTx, ...prev]);
    };

    const handleTransfer = (amount: number, recipient: string) => {
        setBalance(prev => prev - amount);
        const newTx: Transaction = {
            id: `tx_${Date.now()}`,
            desc: `Transfer to ${recipient}`,
            amount: amount,
            type: 'debit',
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        setTransactions(prev => [newTx, ...prev]);
    };

    const handleStake = (amount: number) => {
        setBalance(prev => prev - amount);
        setStakedBalance(prev => prev + amount);
        const newTx: Transaction = {
            id: `tx_${Date.now()}`,
            desc: `Staked to Vault`,
            amount: amount,
            type: 'debit',
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        setTransactions(prev => [newTx, ...prev]);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="bg-[#020308] p-10 rounded-[3.5rem] border border-purple-500/30 relative overflow-hidden shadow-[0_0_120px_rgba(168,85,247,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-purple-600 text-white rounded-[3rem] shadow-[0_0_60px_rgba(147,51,234,0.5)] border border-purple-400 group-hover:rotate-12 transition-transform duration-700">
                             <WalletIcon className="w-16 h-16 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-purple-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Layers className="w-3 h-3" /> Quantum Core v31.0
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">LEDGER: ENTANGLED</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Royal <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Credit</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex bg-gray-900/80 p-2 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl overflow-x-auto no-scrollbar max-w-full">
                        {[
                            { id: 'wallet', label: 'Wallet', icon: <CoinIcon /> },
                            { id: 'nft', label: 'Badges', icon: <NftIcon /> },
                            { id: 'contracts', label: 'Contracts', icon: <ContractIcon /> },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
                                    activeTab === tab.id 
                                    ? 'bg-purple-600 text-white shadow-2xl' 
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <span className="text-lg">{tab.icon}</span> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="min-h-[600px] relative">
                {activeTab === 'wallet' && (
                    <WalletView 
                        balance={balance} 
                        stakedBalance={stakedBalance}
                        isMining={isMining} 
                        setIsMining={setIsMining} 
                        transactions={transactions}
                        onPurchase={handlePurchase}
                        onTransfer={handleTransfer}
                        onStake={handleStake}
                    />
                )}
                {activeTab === 'nft' && <NftVaultView />}
                {activeTab === 'contracts' && <ContractsView />}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Wallet View ---
const WalletView: React.FC<{ 
    balance: number; 
    stakedBalance: number;
    isMining: boolean; 
    setIsMining: (v: boolean) => void;
    transactions: Transaction[];
    onPurchase: (item: MarketItem) => void;
    onTransfer: (amount: number, recipient: string) => void;
    onStake: (amount: number) => void;
}> = ({ balance, stakedBalance, isMining, setIsMining, transactions, onPurchase, onTransfer, onStake }) => {
    const { addToast } = useToast();
    const { members } = useData();
    const [inventory, setInventory] = useState<string[]>([]);
    const [hashRate, setHashRate] = useState(0);

    // Modal States
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isStakeModalOpen, setIsStakeModalOpen] = useState(false);
    const [transferAmount, setTransferAmount] = useState('');
    const [recipientId, setRecipientId] = useState('');
    const [stakeAmount, setStakeAmount] = useState('');
    
    // AI & Graph State
    const [aiAdvice, setAiAdvice] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [coinHistory, setCoinHistory] = useState<CoinValue[]>([]);

    // Hashrate simulation
    useEffect(() => {
        if (!isMining) {
            setHashRate(0);
            return;
        }
        const interval = setInterval(() => {
            setHashRate(Math.floor(Math.random() * 50 + 150)); // 150-200 H/s
        }, 800);
        return () => clearInterval(interval);
    }, [isMining]);

    // RYL Value Simulation
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setCoinHistory(prev => {
                const lastVal = prev.length > 0 ? prev[prev.length - 1].value : 1.2;
                const change = (Math.random() - 0.5) * 0.1;
                const newVal = Math.max(0.5, lastVal + change);
                return [...prev.slice(-30), { time: timeStr, value: newVal }];
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleAnalyzeWealth = async () => {
        setIsAnalyzing(true);
        setAiAdvice(null);
        try {
             const prompt = `Act as a crypto-fitness financial advisor. Analyze user activity: ${transactions.length} transactions, Balance: ${balance.toFixed(2)}, Staked: ${stakedBalance.toFixed(2)}. Suggest 1 way to earn more RYL coins in the gym context (e.g. hitting PRs, streaks). Keep it short and motivational.`;
             const res = await getComplexResponse(prompt);
             setAiAdvice(res);
             addToast("Neural Advice Synthesized.", "success");
        } catch (e) {
             setAiAdvice("Neural Link Offline. Keep staking for stable yields.");
        } finally {
             setIsAnalyzing(false);
        }
    };

    const marketItems: MarketItem[] = [
        { id: 'm1', name: 'Whey Protein (1 Scoop)', cost: 500, type: 'Product', image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=200' },
        { id: 'm2', name: '1 Month Membership', cost: 5000, type: 'Discount', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200' },
        { id: 'm4', name: 'Royal Gym Shaker', cost: 800, type: 'Product', image: 'https://images.unsplash.com/photo-1598633333333-e1d5a7d57065?q=80&w=200' },
    ];

    const handleBuy = (item: MarketItem) => {
        if (balance >= item.cost) {
            onPurchase(item);
            setInventory(prev => [...prev, item.id]);
            addToast(`Successfully purchased ${item.name}!`, 'success');
        } else {
            addToast("Insufficient Royal Coins (RYL). Keep training!", "error");
        }
    };

    const processTransfer = (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(transferAmount);
        if (amt > 0 && amt <= balance && recipientId) {
            const recipientName = members.find(m => m.id.toString() === recipientId)?.name || 'Unknown Member';
            onTransfer(amt, recipientName);
            setIsTransferModalOpen(false);
            setTransferAmount('');
            setRecipientId('');
            addToast(`Sent ${amt} RYL to ${recipientName}`, 'success');
        } else {
            addToast("Invalid transfer request.", 'error');
        }
    };

    const processStake = (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(stakeAmount);
        if (amt > 0 && amt <= balance) {
            onStake(amt);
            setIsStakeModalOpen(false);
            setStakeAmount('');
            addToast(`${amt} RYL Staked. Yield Farming Active.`, 'success');
        } else {
            addToast("Insufficient funds to stake.", 'error');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Wallet Balance Card */}
            <div className="lg:col-span-1 space-y-6">
                <Card className="bg-gradient-to-br from-gray-900 to-black border-purple-500/30 p-8 text-center relative overflow-hidden shadow-2xl rounded-[3rem]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 animate-scan"></div>
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4">Liquid Assets</p>
                    <div className="text-6xl font-black text-white italic tracking-tighter mb-2">
                        {balance.toFixed(2)}
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-8">Royal Coins (RYL)</p>
                    
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button onClick={() => setIsTransferModalOpen(true)} className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl py-3 text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all">
                            <Send className="w-3 h-3"/> Transfer
                        </button>
                        <button onClick={() => setIsStakeModalOpen(true)} className="bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 text-purple-400 rounded-xl py-3 text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all">
                            <LockLucide className="w-3 h-3"/> Stake
                        </button>
                    </div>

                    <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded-xl border border-white/5 mb-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isMining ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-[9px] font-mono text-gray-300 uppercase tracking-widest">
                                {isMining ? 'Mining Active' : 'Mining Paused'}
                            </span>
                        </div>
                        {isMining && <span className="text-[9px] font-mono text-green-400">{hashRate} H/s</span>}
                    </div>

                    <button 
                        onClick={() => setIsMining(!isMining)}
                        className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                            isMining ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-green-600 text-white hover:bg-green-500 shadow-lg'
                        }`}
                    >
                        {isMining ? 'Stop Earning' : 'Start Earning'}
                    </button>
                </Card>
                
                {/* AI Wealth Architect */}
                <Card className="bg-indigo-900/10 border-indigo-500/20 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform"><Cpu className="w-20 h-20 text-indigo-400" /></div>
                    <div className="relative z-10 text-center">
                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                            <BotIcon className="w-4 h-4"/> Neural Wealth Architect
                        </h4>
                        {aiAdvice ? (
                             <div className="prose prose-invert prose-sm text-[11px] text-indigo-200 leading-relaxed italic animate-fade-in" dangerouslySetInnerHTML={{ __html: aiAdvice }} />
                        ) : (
                             <p className="text-[10px] text-gray-500 mb-4">Optimize your RYL yield with AI analysis.</p>
                        )}
                        <button 
                            onClick={handleAnalyzeWealth}
                            disabled={isAnalyzing}
                            className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-xl uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isAnalyzing ? <RefreshCw className="animate-spin w-3 h-3"/> : <SparkleIcon className="w-3 h-3"/>}
                            {isAnalyzing ? 'Analyzing Ledger...' : 'Run Audit'}
                        </button>
                    </div>
                </Card>
            </div>

            {/* Marketplace & Graph */}
            <div className="lg:col-span-2 space-y-6">
                 
                 {/* RYL Value Graph */}
                 <Card title="RYL Market Value (Live)" className="bg-black border-white/5 p-6 rounded-[3rem] h-[300px]">
                     <div className="h-full w-full">
                         <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={coinHistory}>
                                 <defs>
                                     <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                         <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                         <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                     </linearGradient>
                                 </defs>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                 <XAxis dataKey="time" stroke="#666" fontSize={10} tick={false} axisLine={false} />
                                 <YAxis stroke="#666" fontSize={10} domain={['dataMin - 0.1', 'dataMax + 0.1']} axisLine={false} tickLine={false} />
                                 <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '10px' }} />
                                 <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorValue)" isAnimationActive={false} />
                             </AreaChart>
                         </ResponsiveContainer>
                     </div>
                 </Card>

                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Redeem Rewards</h3>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest border border-white/10 px-3 py-1 rounded-full bg-black flex items-center gap-2">
                            <ShoppingBag className="w-3 h-3"/> Official Store
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {marketItems.map(item => {
                            const isOwned = inventory.includes(item.id);
                            return (
                                <div key={item.id} className={`bg-gray-900 border border-white/5 rounded-2xl p-4 flex gap-4 transition-all group ${isOwned ? 'opacity-75' : 'hover:border-purple-500/50 cursor-pointer'}`}>
                                    <div className="w-20 h-20 bg-gray-800 rounded-xl overflow-hidden flex-shrink-0">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="flex flex-col justify-between flex-1">
                                        <div>
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${item.type === 'Product' ? 'text-purple-400' : 'text-amber-400'}`}>{item.type}</span>
                                            <h4 className="font-bold text-white text-sm leading-tight mt-1">{item.name}</h4>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-lg font-black text-white italic">{item.cost} <span className="text-[10px] text-gray-500 not-italic">RYL</span></span>
                                            <button 
                                                onClick={() => !isOwned && handleBuy(item)}
                                                disabled={isOwned}
                                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors ${
                                                    isOwned 
                                                    ? 'bg-green-600 text-white cursor-default' 
                                                    : 'bg-white text-black hover:bg-purple-400'
                                                }`}
                                            >
                                                {isOwned ? 'Purchased' : 'Buy'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* MODALS */}
            <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="P2P Transfer">
                <form onSubmit={processTransfer} className="space-y-6">
                    <div className="bg-gray-900 p-6 rounded-2xl border border-white/5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Recipient</label>
                        <select 
                            value={recipientId}
                            onChange={(e) => setRecipientId(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-xl p-3 text-white outline-none focus:border-purple-500"
                            required
                        >
                            <option value="">Select Member</option>
                            {members.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="bg-gray-900 p-6 rounded-2xl border border-white/5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Amount (RYL)</label>
                        <div className="relative">
                            <input 
                                type="number"
                                value={transferAmount}
                                onChange={(e) => setTransferAmount(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-xl p-3 pl-10 text-white outline-none focus:border-purple-500 font-mono"
                                placeholder="0.00"
                                required
                            />
                            <CoinIcon className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2">Available: {balance.toFixed(2)} RYL</p>
                    </div>
                    <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs shadow-lg transition-all flex items-center justify-center gap-2">
                        <Send className="w-4 h-4" /> Send Credits
                    </button>
                </form>
            </Modal>

            <Modal isOpen={isStakeModalOpen} onClose={() => setIsStakeModalOpen(false)} title="Quantum Staking">
                 <form onSubmit={processStake} className="space-y-6">
                    <div className="bg-purple-900/10 border border-purple-500/30 p-6 rounded-2xl text-center">
                        <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest mb-1">Current Yield</p>
                        <p className="text-4xl font-black text-white italic">12.0% <span className="text-sm text-gray-500 not-italic">APY</span></p>
                        <p className="text-[10px] text-gray-400 mt-2">Rewards paid out every second.</p>
                    </div>

                    <div className="bg-gray-900 p-6 rounded-2xl border border-white/5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Stake Amount</label>
                         <div className="relative">
                            <input 
                                type="number"
                                value={stakeAmount}
                                onChange={(e) => setStakeAmount(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-xl p-3 pl-10 text-white outline-none focus:border-purple-500 font-mono"
                                placeholder="0.00"
                                required
                            />
                            <LockLucide className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                         <p className="text-[10px] text-gray-500 mt-2">Available: {balance.toFixed(2)} RYL</p>
                    </div>

                    <button type="submit" className="w-full bg-white text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs shadow-lg transition-all flex items-center justify-center gap-2 hover:bg-purple-400">
                        <LockLucide className="w-4 h-4" /> Confirm Stake
                    </button>
                 </form>
            </Modal>
        </div>
    );
};

// --- SUB-COMPONENT: NFT Vault View ---
const NftVaultView: React.FC = () => {
    const badges: NFT[] = [
        { id: 'n1', name: '100KG Bench Press', image: '', rarity: 'Legendary', unlockedAt: '2024-02-15', criteria: 'Lift 100kg Bench Press' },
        { id: 'n2', name: 'Early Adopter', image: '', rarity: 'Rare', unlockedAt: '2024-01-01', criteria: 'Join before Feb 2024' },
        { id: 'n3', name: 'Cardio King', image: '', rarity: 'Common', unlockedAt: null, criteria: 'Run 50km in a month' },
        { id: 'n4', name: 'Iron Will', image: '', rarity: 'Artifact', unlockedAt: null, criteria: 'Attend 30 days straight' },
    ];

    const getRarityColor = (rarity: NFT['rarity']) => {
        switch (rarity) {
            case 'Common': return 'border-gray-600 text-gray-400';
            case 'Rare': return 'border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]';
            case 'Legendary': return 'border-amber-500 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)]';
            case 'Artifact': return 'border-red-500 text-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)]';
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
            {badges.map(badge => (
                <div 
                    key={badge.id} 
                    className={`relative aspect-[3/4] rounded-3xl bg-gray-900 border-2 flex flex-col items-center justify-center p-6 transition-all group hover:-translate-y-2 ${getRarityColor(badge.rarity)} ${!badge.unlockedAt ? 'opacity-50 grayscale' : ''}`}
                >
                    {!badge.unlockedAt && (
                        <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
                            <LockIcon className="w-12 h-12 text-gray-500" />
                        </div>
                    )}
                    
                    {/* Holographic Effect Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-20 transition-opacity z-0 pointer-events-none"></div>

                    <div className="w-24 h-24 mb-6 relative z-10">
                        <div className={`w-full h-full rounded-full border-4 flex items-center justify-center bg-black ${badge.rarity === 'Legendary' || badge.rarity === 'Artifact' ? 'animate-pulse' : ''} ${getRarityColor(badge.rarity).split(' ')[0]}`}>
                            <span className="text-4xl">🏆</span>
                        </div>
                    </div>
                    
                    <div className="text-center relative z-10">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border mb-2 inline-block ${getRarityColor(badge.rarity)}`}>
                            {badge.rarity}
                        </span>
                        <h3 className="text-lg font-black text-white uppercase italic leading-tight">{badge.name}</h3>
                        <p className="text-[10px] text-gray-400 mt-2 font-mono">{badge.unlockedAt ? `Minted: ${badge.unlockedAt}` : badge.criteria}</p>
                    </div>

                    {badge.unlockedAt && (
                         <div className="absolute bottom-4 right-4">
                             <CheckCircleIcon className="w-5 h-5 text-green-500" />
                         </div>
                    )}
                </div>
            ))}
        </div>
    );
};

// --- SUB-COMPONENT: Contracts View ---
const ContractsView: React.FC = () => {
    const { addToast } = useToast();
    const [autoRenew, setAutoRenew] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);

    const toggleAutoRenew = () => {
        const newState = !autoRenew;
        setIsDeploying(true);
        setTimeout(() => {
            setIsDeploying(false);
            setAutoRenew(newState);
            addToast(newState ? "Contract Upgraded: Auto-Renewal Enabled" : "Contract Downgraded: Auto-Renewal Disabled", newState ? 'success' : 'info');
        }, 1500);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
            <Card title="Membership Contract" className="bg-gray-900 border-indigo-500/30">
                <div className="flex items-center gap-4 mb-6 p-4 bg-indigo-900/10 rounded-2xl border border-indigo-500/20">
                    <div className="p-3 bg-indigo-500/20 rounded-xl">
                        <ContractIcon className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold">Standard Agreement</h4>
                        <p className="text-xs text-indigo-300 font-mono">ID: 0x71C...9A2F</p>
                    </div>
                    <div className="ml-auto">
                        <span className="text-[10px] bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-green-500/30">Active</span>
                    </div>
                </div>

                <div className="space-y-4 font-mono text-xs text-gray-400 bg-black/40 p-4 rounded-xl border border-white/5 relative overflow-hidden">
                    {isDeploying && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 backdrop-blur-sm">
                            <div className="flex flex-col items-center">
                                <AutoUpdateIcon className="w-8 h-8 text-indigo-500 animate-spin mb-2"/>
                                <p className="text-indigo-400 font-bold uppercase tracking-widest">Deploying Contract...</p>
                            </div>
                        </div>
                    )}
                    <p><span className="text-purple-400">function</span> <span className="text-yellow-400">renewMembership</span>() <span className="text-white">{'{'}</span></p>
                    <p className="pl-4"><span className="text-blue-400">if</span> (wallet.balance {'>='} 5000) <span className="text-white">{'{'}</span></p>
                    <p className="pl-8">wallet.transfer(5000, 'ROYAL_TREASURY');</p>
                    <p className="pl-8">membership.extend(30, 'DAYS');</p>
                    <p className="pl-8"><span className="text-green-400">return</span> <span className="text-orange-400">true</span>;</p>
                    <p className="pl-4"><span className="text-white">{'}'}</span></p>
                    <p className="pl-4"><span className="text-green-400">return</span> <span className="text-orange-400">false</span>;</p>
                    <p><span className="text-white">{'}'}</span></p>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
                    <div>
                        <p className="text-sm font-bold text-white">Auto-Renewal</p>
                        <p className="text-xs text-gray-500">Automatically execute contract on expiry.</p>
                    </div>
                    <button 
                        onClick={toggleAutoRenew}
                        disabled={isDeploying}
                        className={`w-14 h-8 rounded-full p-1 transition-colors ${autoRenew ? 'bg-indigo-500' : 'bg-gray-700'}`}
                    >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${autoRenew ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>
            </Card>

            <div className="space-y-6">
                <Card className="bg-black/40 border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4">Contract Logs</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                            <span className="text-gray-400">2024-03-01 09:00</span>
                            <span className="text-green-400">Membership Validated</span>
                        </div>
                        <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                            <span className="text-gray-400">2024-02-01 09:00</span>
                            <span className="text-indigo-400">Auto-Renewal Executed (-5000 RYL)</span>
                        </div>
                        <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                            <span className="text-gray-400">2024-01-01 10:30</span>
                            <span className="text-green-400">Contract Deployed</span>
                        </div>
                    </div>
                </Card>

                <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 p-6 rounded-2xl border border-purple-500/20 flex items-start gap-4 shadow-xl">
                    <BotIcon className="w-8 h-8 text-purple-400 flex-shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold text-white mb-1">AI Audit</h4>
                        <p className="text-xs text-gray-400">Your contracts are secure. No anomalies detected. Next auto-renewal scheduled for <strong>April 1st</strong>.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuantumLedgerHub;
