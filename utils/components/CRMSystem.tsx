
import React from 'react';
import Card from './common/Card';
import { Layers, UserPlus, Phone, CheckCircle, MoreHorizontal } from 'lucide-react';
import { useData } from '../context/DataProvider';

const CRMSystem: React.FC = () => {
    const { leads } = useData();

    const columns = {
        'New': { color: 'bg-blue-500', icon: <UserPlus className="w-4 h-4"/>, items: leads.filter(l => l.status === 'New') },
        'Contacted': { color: 'bg-amber-500', icon: <Phone className="w-4 h-4"/>, items: leads.filter(l => l.status === 'Contacted' || l.status === 'Trial') },
        'Converted': { color: 'bg-green-500', icon: <CheckCircle className="w-4 h-4"/>, items: leads.filter(l => l.status === 'Converted') },
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20 h-full flex flex-col">
            <div className="flex justify-between items-center bg-[#050505] p-8 rounded-[3rem] border border-pink-500/20">
                 <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                    <Layers className="w-10 h-10 text-pink-500" />
                    Pipeline <span className="text-pink-400">CRM</span>
                </h1>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-6 min-w-full h-full">
                    {Object.entries(columns).map(([status, col]) => (
                        <div key={status} className="flex-1 min-w-[300px] bg-gray-900/50 rounded-[2.5rem] border border-white/5 flex flex-col">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg text-white ${col.color}`}>{col.icon}</div>
                                    <h3 className="font-black text-white uppercase text-sm tracking-widest">{status}</h3>
                                </div>
                                <span className="text-xs font-mono text-gray-500">{col.items.length}</span>
                            </div>
                            
                            <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                                {col.items.map(lead => (
                                    <div key={lead.id} className="bg-[#0c0c0c] p-5 rounded-[2rem] border border-white/5 hover:border-pink-500/30 cursor-pointer group transition-all shadow-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-white">{lead.name}</h4>
                                            <button className="text-gray-600 hover:text-white"><MoreHorizontal className="w-4 h-4"/></button>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-mono mb-3">{lead.phone}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] bg-white/5 px-2 py-1 rounded text-gray-400 uppercase">{lead.source}</span>
                                            {lead.aiScore && (
                                                <span className={`text-[9px] font-black ${lead.aiScore > 80 ? 'text-green-500' : 'text-amber-500'}`}>{lead.aiScore}% Prob</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CRMSystem;
