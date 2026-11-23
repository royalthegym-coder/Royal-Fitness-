import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, RefreshCcw, UserMinus, Phone } from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { generatePredictiveChurn } from '../../lib/core_ai';
import { useToast } from '../hooks/useToast';

export const PredictiveChurn: React.FC = () => {
    const members = useDataStore((s) => s.members);
    const attendance = useDataStore((s) => s.attendanceRecords);
    const invoices = useDataStore((s) => s.invoices);
    const [churnList, setChurnList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    const generatePrediction = async () => {
        setIsLoading(true);
        addToast('Running Deep-Learning Predictive Churn Model...', 'info');
        try {
            const results = await generatePredictiveChurn({members, attendance, invoices});
            setChurnList(results);
            addToast(`Identified ${results.length} members at risk.`, 'success');
        } catch (e) {
            addToast('Failed to run prediction model.', 'error');
        }
        setIsLoading(false);
    };

    return (
        <div className="bg-zinc-950 border border-red-500/20 p-8 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0 opacity-50"></div>
            
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <UserMinus className="w-6 h-6 text-red-500" />
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">AI Predictive Churn</h3>
                </div>
                <button 
                    onClick={generatePrediction}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-full text-xs font-bold uppercase transition-colors"
                >
                    {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                    {isLoading ? 'Scanning...' : 'Run Analysis'}
                </button>
            </div>

            {churnList.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-500 text-sm font-mono">Run analysis to identify members at risk of leaving.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {churnList.map((item, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-red-500/30 transition-colors"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="text-white font-bold">{item.name}</h4>
                                    <p className="text-[10px] uppercase font-mono text-gray-500">Member ID: {item.memberId}</p>
                                </div>
                                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.risk === 'High' ? 'bg-red-500/20 text-red-400' : item.risk === 'Medium' ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                    {item.risk} Risk ({item.probability}%)
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">{item.reasoning}</p>
                            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                                <Phone className="w-3 h-3 text-cyan-400" />
                                <span className="text-[10px] font-mono text-cyan-400">Action: {item.actionPlan}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};
