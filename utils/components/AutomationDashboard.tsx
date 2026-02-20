
import React, { useState } from 'react';
import Card from './common/Card';
import { Layers, Zap, Clock, MessageSquare, Plus, Power } from 'lucide-react';
import { useToast } from '../hooks/useToast';

const AutomationDashboard: React.FC = () => {
    const { addToast } = useToast();
    const [flows, setFlows] = useState([
        { id: 1, name: 'Missed Workout Nudge', trigger: 'Absent > 3 days', action: 'WhatsApp Msg', active: true },
        { id: 2, name: 'Birthday Bonus', trigger: 'Date = Birthday', action: 'Email Offer', active: true },
        { id: '3', name: 'Payment Reminder', trigger: 'Due Date - 3 Days', action: 'WhatsApp + SMS', active: true },
        { id: '4', name: 'Lead Welcome', trigger: 'New Lead', action: 'Auto-Reply', active: false },
    ]);

    const toggleFlow = (id: number) => {
        setFlows(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f));
        addToast("Automation State Updated.", "info");
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="p-10 rounded-[3.5rem] bg-[#050505] border border-amber-500/20 shadow-2xl flex justify-between items-center">
                 <div>
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                        <Zap className="w-10 h-10 text-amber-500" />
                        Auto-<span className="text-amber-400">Flow</span>
                    </h1>
                    <p className="text-gray-500 text-xs font-mono mt-2 tracking-widest uppercase">Logic Gate Management</p>
                 </div>
                 <button className="bg-white text-black px-6 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 hover:bg-amber-400 transition-all">
                     <Plus className="w-4 h-4"/> Create Flow
                 </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {flows.map(flow => (
                    <Card key={flow.id} className={`transition-all ${flow.active ? 'bg-gray-900 border-white/10' : 'bg-gray-950 border-white/5 opacity-60'}`}>
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-gray-800 rounded-2xl border border-white/5">
                                <Layers className={`w-6 h-6 ${flow.active ? 'text-amber-500' : 'text-gray-500'}`} />
                            </div>
                            <button onClick={() => toggleFlow(flow.id)} className={`p-2 rounded-full ${flow.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                <Power className="w-4 h-4" />
                            </button>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4">{flow.name}</h3>
                        
                        <div className="space-y-3 relative">
                            <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-800"></div>
                            
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-6 h-6 rounded-full bg-black border border-white/10 flex items-center justify-center text-[10px] font-black text-gray-500">IF</div>
                                <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/5 text-xs text-gray-300 flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-blue-400"/> {flow.trigger}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-6 h-6 rounded-full bg-black border border-white/10 flex items-center justify-center text-[10px] font-black text-gray-500">DO</div>
                                <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/5 text-xs text-gray-300 flex items-center gap-2">
                                    <MessageSquare className="w-3 h-3 text-green-400"/> {flow.action}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default AutomationDashboard;
