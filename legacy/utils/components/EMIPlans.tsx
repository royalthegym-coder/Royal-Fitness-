import { getCurrencySymbol } from '../store/useCurrencyStore';
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataProvider';
import { CreditCard, Plus, CheckCircle, AlertCircle, Clock, Zap, Target, Activity } from 'lucide-react';
import Card from './common/Card';
import { EMIPlan } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface EMIPlansProps {
    memberId?: number;
}

const EMIPlans: React.FC<EMIPlansProps> = ({ memberId }) => {
    const { emiPlans, members, updateEMIPlan } = useData();
    const [showNewPlan, setShowNewPlan] = useState(false);

    // Filter plans
    const displayedPlans = memberId 
        ? emiPlans.filter(p => p.memberId === memberId)
        : emiPlans;

    const handleMarkPaid = (planId: string, installmentIndex: number) => {
        const plan = emiPlans.find(p => p.id === planId);
        if (!plan) return;

        const updatedInstallments = [...plan.installments];
        updatedInstallments[installmentIndex] = {
            ...updatedInstallments[installmentIndex],
            status: 'paid',
            paidDate: new Date().toISOString()
        };

        const remainingAmount = updatedInstallments.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);
        const status = remainingAmount === 0 ? 'Completed' : plan.status;

        updateEMIPlan({
            ...plan,
            installments: updatedInstallments,
            remainingAmount,
            status
        });
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center bg-black/40 p-6 rounded-2xl border border-blue-500/20 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none" />
                <div className="relative z-10 flex w-full justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                                <CreditCard className="w-8 h-8 text-blue-400" />
                            </div>
                            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                                EMI <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Smart Vault</span>
                            </h1>
                        </div>
                        <p className="text-blue-400/80 font-mono tracking-widest text-xs uppercase flex items-center gap-2">
                            <Zap className="w-3 h-3" /> Predictive Payment Analytics Active
                        </p>
                    </div>
                    {/* Only show Create plan button in Admin mode (no memberId prop passed) */}
                    {!memberId && (
                        <button 
                            onClick={() => setShowNewPlan(true)}
                            className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105"
                        >
                            <Plus className="w-5 h-5" /> Initialize Plan
                        </button>
                    )}
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {displayedPlans.length === 0 ? (
                        <Card className="p-16 text-center border-dashed border-gray-800 bg-black/40 backdrop-blur-sm">
                            <div className="w-24 h-24 mx-auto bg-gray-900 rounded-full flex items-center justify-center mb-6">
                                <Target className="w-10 h-10 text-gray-700" />
                            </div>
                            <h3 className="text-xl font-black text-gray-500 uppercase tracking-widest">No Active Contracts</h3>
                            <p className="text-gray-600 mt-2 font-mono text-sm uppercase">Smart Vault is currently awaiting financial assignments.</p>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {displayedPlans.map((plan, index) => {
                                const member = members.find(m => m.id === plan.memberId);
                                return (
                                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} key={plan.id}>
                                        <Card className="p-0 border-blue-500/30 bg-black/60 overflow-hidden group">
                                            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-gray-900 to-black">
                                                <div>
                                                    <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-wider">
                                                        {!memberId && (member?.name || `Node #$\\{plan.memberId}`)}
                                                        {memberId && "Contract Overview"}
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest $\\{
                                                            plan.status === 'Active' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]' :
                                                            plan.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' :
                                                            'bg-red-500/20 text-red-500 border border-red-500/50'
                                                        }`}>
                                                            {plan.status}
                                                        </span>
                                                    </h3>
                                                    <p className="text-gray-500 text-xs font-mono mt-2 uppercase tracking-widest">Hash: {plan.id} • Initiated: {new Date(plan.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-blue-400/80 font-mono uppercase tracking-[0.2em]">Total Value</p>
                                                    <p className="text-3xl font-black text-white tracking-tighter">{getCurrencySymbol()}{plan.totalAmount.toLocaleString()}</p>
                                                </div>
                                            </div>

                                            <div className="p-6 bg-black/40">
                                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                                    <Activity className="w-4 h-4 text-gray-400" /> Contract Milestones
                                                </h4>
                                                <div className="grid gap-3">
                                                    {plan.installments.map((inst, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-900/50 hover:bg-gray-800/50 transition-colors rounded-xl border border-gray-800 relative overflow-hidden">
                                                            {inst.status === 'paid' && <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />}
                                                            
                                                            <div className="flex items-center gap-4 relative z-10">
                                                                <div className={`p-3 rounded-xl border $\\{inst.status === 'paid' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]'}`}>
                                                                    {inst.status === 'paid' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                                </div>
                                                                <div>
                                                                    <p className="text-white font-bold uppercase tracking-wider text-sm">Phase 0{idx + 1}</p>
                                                                    <p className="text-xs font-mono text-gray-500 tracking-widest mt-1">Deadline: {new Date(inst.dueDate).toLocaleDateString()}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-6 relative z-10">
                                                                <span className="text-xl font-black text-white">{getCurrencySymbol()}{inst.amount.toLocaleString()}</span>
                                                                {inst.status === 'pending' ? (
                                                                    <button 
                                                                        onClick={() => handleMarkPaid(plan.id, idx)}
                                                                        className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-black text-xs font-black uppercase tracking-widest rounded-lg transition-transform hover:scale-105 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                                                    >
                                                                        Clear Due
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase">
                                                                        Cleared: {new Date(inst.paidDate!).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <Card className="p-8 bg-gradient-to-br from-blue-900/40 via-black to-indigo-900/20 border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.15)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                                <CreditCard className="w-48 h-48" />
                            </div>
                            <h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 relative z-10">
                                <Activity className="w-4 h-4" /> System Telemetry
                            </h3>
                            <div className="space-y-6 relative z-10">
                                <div>
                                    <span className="text-gray-400 font-mono text-xs uppercase tracking-widest block mb-1">Active Contracts</span>
                                    <span className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                        {displayedPlans.filter(p => p.status === 'Active').length}
                                    </span>
                                </div>
                                <div className="h-px bg-gradient-to-r from-blue-500/50 to-transparent" />
                                <div>
                                    <span className="text-amber-400/80 font-mono text-xs uppercase tracking-widest block mb-1">Pending Liquidity</span>
                                    <span className="text-3xl font-black text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                                        {getCurrencySymbol()}{displayedPlans.reduce((sum, p) => sum + p.remainingAmount, 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="h-px bg-gradient-to-r from-emerald-500/50 to-transparent" />
                                <div>
                                    <span className="text-emerald-400/80 font-mono text-xs uppercase tracking-widest block mb-1">Realized Capital</span>
                                    <span className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                                        {getCurrencySymbol()}{displayedPlans.reduce((sum, p) => sum + (p.totalAmount - p.remainingAmount), 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    <Card className="p-6 border-amber-500/30 bg-black/60 backdrop-blur-md">
                        <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> Oracle Forecast
                        </h3>
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <p className="text-sm font-mono text-amber-400/90 leading-relaxed uppercase tracking-wider">
                                Algorithms detect zero immediate risks. Vault liquidity is stable for the next 7 days.
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default EMIPlans;
