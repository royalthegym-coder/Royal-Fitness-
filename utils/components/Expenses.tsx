
import React, { useState, useMemo } from 'react';
import { Expense } from '../../types';
import { INITIAL_EXPENSES } from '../../constants';
import Card from './common/Card';
import Modal from './common/Modal';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { BotIcon } from './icons/BotIcon';
import CustomTooltip from './common/CustomTooltip';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { 
    Activity, Flame, Wallet, ArrowUpRight, 
    Plus, Search, Database, Layers, 
    AlertTriangle, ShieldAlert, Infinity,
    FileText, Calculator, Filter
} from 'lucide-react';
import { useToast } from '../hooks/useToast';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

const EntropyLog: React.FC = () => {
    const { addToast } = useToast();
    const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
    const [activeTab, setActiveTab] = useState<'stream' | 'audit' | 'matrix'>('stream');
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditResults, setAuditResults] = useState<{id: number, issue: string}[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Add Expense State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newExpense, setNewExpense] = useState<Partial<Expense>>({
        item: '',
        category: 'Utilities',
        amount: 0,
        date: new Date().toISOString().split('T')[0]
    });

    const totalExpenses = useMemo(() => expenses.reduce((sum, exp) => sum + exp.amount, 0), [expenses]);
    const budgetLimit = 150000;
    const burnRate = (totalExpenses / budgetLimit) * 100;

    const expensesByCategory = useMemo(() => {
        const map: Record<string, number> = {};
        expenses.forEach(e => {
            map[e.category] = (map[e.category] || 0) + e.amount;
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [expenses]);

    // Simulated Forecast Data
    const forecastData = [
        { month: 'Jul', actual: totalExpenses, projected: totalExpenses },
        { month: 'Aug', actual: 0, projected: totalExpenses * 1.05 },
        { month: 'Sep', actual: 0, projected: totalExpenses * 1.02 },
    ];

    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => 
            e.item.toLowerCase().includes(searchTerm.toLowerCase()) || 
            e.category.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, searchTerm]);

    const handleRunAudit = () => {
        setIsAuditing(true);
        setAuditResults([]);
        
        // Simulate AI Audit Process
        setTimeout(() => {
            const anomalies = expenses
                .filter(e => e.amount > 20000 && e.category !== 'Rent') // Ignore Rent for high value check
                .map(e => ({ id: e.id, issue: `High entropy event: ₹${e.amount.toLocaleString()} for ${e.item}. Variance detected.` }));
            
            if (Math.random() > 0.5) {
                anomalies.push({ id: 999, issue: "Recursive Pattern: 'Electricity Bill' logged with irregular interval." });
            }

            setAuditResults(anomalies);
            setIsAuditing(false);
            addToast("Neural Audit Complete. Anomalies Flagged.", "success");
        }, 2000);
    };

    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newExpense.item || !newExpense.amount) return;

        const expense: Expense = {
            id: Date.now(),
            item: newExpense.item!,
            category: newExpense.category!,
            amount: Number(newExpense.amount),
            date: newExpense.date!
        };

        setExpenses(prev => [expense, ...prev]);
        setIsAddModalOpen(false);
        setNewExpense({ item: '', category: 'Utilities', amount: 0, date: new Date().toISOString().split('T')[0] });
        addToast("Entropy Node Injected Successfully.", "success");
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            
            {/* 1. APEX-CONTINUUM HEADER */}
            <div className="bg-[#020202] p-10 rounded-[3.5rem] border border-red-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(239,68,68,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-red-600 text-white rounded-[3rem] shadow-[0_0_60px_rgba(220,38,38,0.5)] border border-red-400 group-hover:rotate-12 transition-transform duration-700">
                            <Flame className="w-16 h-16 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-red-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Infinity className="w-3 h-3" /> Apex-Continuum v31.0
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">SYSTEM: ENTROPY_MONITOR</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Entropy <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-600">Log</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex bg-gray-900/80 p-2 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl">
                         <div className="px-10 py-5 text-center border-r border-white/5">
                             <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Total Decay</p>
                             <p className="text-4xl font-black text-white italic">₹{(totalExpenses/1000).toFixed(1)}k</p>
                         </div>
                         <div className="px-10 py-5 text-center border-r border-white/5">
                             <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Burn Rate</p>
                             <div className="flex items-center gap-2 justify-center">
                                 <Activity className={`w-4 h-4 ${burnRate > 80 ? 'text-red-500 animate-bounce' : 'text-green-500'}`} />
                                 <p className={`text-4xl font-black italic ${burnRate > 80 ? 'text-red-400' : 'text-green-400'}`}>{burnRate.toFixed(0)}%</p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. CONTROL DECK */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-950/60 p-4 rounded-[2.5rem] border border-white/5 backdrop-blur-xl shadow-xl">
                 <div className="flex gap-4">
                    <div className="flex bg-black rounded-2xl p-1.5 border border-white/5">
                        <button onClick={() => setActiveTab('stream')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'stream' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Live Stream</button>
                        <button onClick={() => setActiveTab('audit')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'audit' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Neural Audit</button>
                        <button onClick={() => setActiveTab('matrix')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'matrix' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Visual Matrix</button>
                    </div>
                 </div>
                
                 <div className="flex-1 w-full md:w-auto relative">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                     <input 
                        type="text" 
                        placeholder="Scan Fiscal Signatures..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs text-white focus:border-red-500 outline-none transition-all font-mono italic"
                     />
                 </div>

                 <button onClick={() => setIsAddModalOpen(true)} className="bg-white text-black px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-400 hover:text-white transition-all shadow-xl flex items-center gap-3 active:scale-95 group">
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Manual Injection
                 </button>
            </div>

            {/* 3. CONTENT AREAS */}
            
            {/* TAB 1: LIVE STREAM (LEDGER) */}
            {activeTab === 'stream' && (
                <Card className="bg-[#050505] border-white/5 p-0 overflow-hidden rounded-[3rem] shadow-2xl min-h-[500px] flex flex-col">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gray-900/50">
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Hyper-Ledger</h3>
                        <div className="flex gap-2">
                            <span className="text-[10px] bg-red-900/20 text-red-400 px-3 py-1 rounded-full border border-red-500/20">DEBIT STREAM</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-black text-gray-500 font-black uppercase text-[10px] tracking-[0.2em] sticky top-0 z-10">
                                <tr>
                                    <th className="p-6">Entity (Item)</th>
                                    <th className="p-6">Classification</th>
                                    <th className="p-6">Timestamp</th>
                                    <th className="p-6 text-right">Value Decay</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm font-mono">
                                {filteredExpenses.map(expense => (
                                    <tr key={expense.id} className="hover:bg-white/5 transition-all group">
                                        <td className="p-6 font-bold text-white uppercase italic">{expense.item}</td>
                                        <td className="p-6">
                                            <span className="bg-gray-800 text-gray-400 px-3 py-1 rounded-lg text-[10px] font-bold border border-white/5">{expense.category}</span>
                                        </td>
                                        <td className="p-6 text-gray-500 text-xs">{expense.date}</td>
                                        <td className="p-6 text-right font-black text-red-500 text-lg">- ₹{expense.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredExpenses.length === 0 && (
                            <div className="py-20 text-center opacity-30">
                                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600"/>
                                <p className="text-xs font-black uppercase tracking-widest">Ledger Empty</p>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* TAB 2: NEURAL AUDIT */}
            {activeTab === 'audit' && (
                <div className="space-y-6">
                    <Card className="bg-gradient-to-r from-gray-900 to-red-950/20 border-l-4 border-red-500 p-8 rounded-[2.5rem]">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <div className="p-5 bg-red-900/30 rounded-3xl text-red-400 border border-red-500/20">
                                    <ShieldCheckIcon className="w-10 h-10" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">AI Financial Auditor</h2>
                                    <p className="text-gray-400 text-xs mt-1 font-mono">Scans ledger for anomalies, duplicates, and budget breaches.</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleRunAudit}
                                disabled={isAuditing}
                                className="px-10 py-5 bg-red-600 hover:bg-red-500 text-white font-black rounded-3xl shadow-xl flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 text-xs uppercase tracking-widest"
                            >
                                {isAuditing ? <AutoUpdateIcon className="w-5 h-5 mr-2 animate-spin"/> : <SparkleIcon className="w-5 h-5 mr-2"/>}
                                {isAuditing ? 'Scanning Ledger...' : 'Run Deep Audit'}
                            </button>
                        </div>
                    </Card>

                    {auditResults.length > 0 && (
                        <div className="grid grid-cols-1 gap-4 animate-fade-in">
                            <h3 className="text-red-400 font-black uppercase text-xs tracking-[0.3em] mb-2 pl-2">Detected Anomalies ({auditResults.length})</h3>
                            {auditResults.map((res, i) => (
                                <div key={i} className="bg-red-900/10 border border-red-500/30 p-6 rounded-[2rem] flex items-start gap-5 hover:border-red-500/60 transition-all">
                                    <div className="mt-1 text-red-500"><BotIcon className="w-6 h-6" /></div>
                                    <div className="flex-1">
                                        <p className="text-white font-bold text-sm mb-2">{res.issue}</p>
                                        <div className="flex gap-3">
                                            <button className="text-[10px] bg-red-600 text-white px-4 py-2 rounded-xl font-black uppercase hover:bg-red-500 transition-colors">Investigate</button>
                                            <button className="text-[10px] bg-black border border-white/10 text-gray-400 px-4 py-2 rounded-xl font-black uppercase hover:text-white transition-colors">Dismiss</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isAuditing && auditResults.length === 0 && (
                        <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[3rem]">
                            <CheckCircleIcon className="w-20 h-20 text-green-500/20 mx-auto mb-4" />
                            <p className="text-gray-500 text-xs font-black uppercase tracking-widest">System Nominal. Ledger Clean.</p>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: VISUAL MATRIX */}
            {activeTab === 'matrix' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Entropy Breakdown" className="bg-[#0c0c0c] border-white/5 p-8 rounded-[3rem]">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={expensesByCategory} 
                                        cx="50%" cy="50%" 
                                        innerRadius={80} outerRadius={110} 
                                        paddingAngle={5} 
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {expensesByCategory.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card title="Decay Forecast (AI Projection)" className="bg-[#0c0c0c] border-white/5 p-8 rounded-[3rem]">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={forecastData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false}/>
                                    <XAxis dataKey="month" stroke="#666" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#666" fontSize={10} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="actual" name="Actual Burn" fill="#f97316" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="projected" name="Projected (AI)" fill="#ef4444" radius={[4, 4, 0, 0]} fillOpacity={0.4} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            )}

            {/* ADD EXPENSE MODAL */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Manual Entropy Injection">
                <form onSubmit={handleAddExpense} className="space-y-6 py-4">
                    <div className="bg-red-500/5 p-6 rounded-[2.5rem] border border-red-500/20">
                         <div className="mb-6">
                            <label className="text-[10px] font-black text-red-400 uppercase tracking-widest block mb-2 ml-1">Entity Name</label>
                            <input 
                                required 
                                value={newExpense.item} 
                                onChange={e => setNewExpense({...newExpense, item: e.target.value})} 
                                className="w-full bg-gray-900 border border-white/10 rounded-2xl p-4 text-white font-bold text-sm outline-none focus:border-red-500 transition-all shadow-inner" 
                                placeholder="e.g. Server Maintenance" 
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 ml-1">Value (INR)</label>
                                <div className="relative">
                                    <input 
                                        required 
                                        type="number" 
                                        value={newExpense.amount} 
                                        onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} 
                                        className="w-full bg-gray-900 border border-white/10 rounded-2xl p-4 text-white font-bold text-sm outline-none focus:border-red-500 pl-10" 
                                        placeholder="0.00" 
                                    />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                </div>
                             </div>
                             <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 ml-1">Category</label>
                                <select 
                                    value={newExpense.category} 
                                    onChange={e => setNewExpense({...newExpense, category: e.target.value})} 
                                    className="w-full bg-gray-900 border border-white/10 rounded-2xl p-4 text-white font-bold text-sm outline-none focus:border-red-500"
                                >
                                    <option>Utilities</option>
                                    <option>Rent</option>
                                    <option>Equipment</option>
                                    <option>Salary</option>
                                    <option>Marketing</option>
                                    <option>Software</option>
                                    <option>Maintenance</option>
                                    <option>Other</option>
                                </select>
                             </div>
                         </div>
                         <div className="mt-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 ml-1">Timestamp</label>
                            <input 
                                type="date"
                                required 
                                value={newExpense.date} 
                                onChange={e => setNewExpense({...newExpense, date: e.target.value})} 
                                className="w-full bg-gray-900 border border-white/10 rounded-2xl p-4 text-white font-bold text-sm outline-none focus:border-red-500" 
                            />
                         </div>
                    </div>
                    <button type="submit" className="w-full bg-white text-black font-black py-5 rounded-[2rem] shadow-xl uppercase tracking-[0.2em] text-xs hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3">
                        <Plus className="w-4 h-4" /> Inject to Ledger
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default EntropyLog;
