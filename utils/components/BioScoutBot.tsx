
import React from 'react';
import Card from './common/Card';
import { Shield, Activity, Heart, AlertTriangle, CheckCircle } from 'lucide-react';
import { useData } from '../context/DataProvider';

const BioScoutBot: React.FC = () => {
    const { members } = useData();
    
    // Simulate finding at-risk members
    const atRiskMembers = members.filter(m => (m.health_score || 0) < 70);

    return (
        <div className="space-y-8 animate-fade-in pb-20">
             <div className="p-10 rounded-[3.5rem] bg-[#050505] border border-red-500/20 shadow-2xl flex items-center justify-between">
                 <div>
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                        <Shield className="w-12 h-12 text-red-500" />
                        Bio-Scout <span className="text-red-400">Sentinel</span>
                    </h1>
                    <p className="text-gray-500 text-xs font-mono mt-2 tracking-widest uppercase">Anomaly Detection System</p>
                 </div>
                 <div className="text-right hidden md:block">
                     <p className="text-5xl font-black text-red-500 italic">{atRiskMembers.length}</p>
                     <p className="text-[10px] text-gray-500 uppercase font-bold">Alerts Active</p>
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {atRiskMembers.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-gray-900 rounded-[3rem] border border-white/5">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <p className="text-gray-400 uppercase tracking-widest text-sm">All bio-metrics nominal.</p>
                    </div>
                ) : (
                    atRiskMembers.map(m => (
                        <Card key={m.id} className="bg-gray-900 border-red-500/20 hover:border-red-500/50 transition-all p-6 rounded-[2.5rem]">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <img src={m.avatar} className="w-12 h-12 rounded-xl object-cover border border-white/10" alt="avatar"/>
                                    <div>
                                        <h4 className="text-white font-bold">{m.name}</h4>
                                        <p className="text-[10px] text-gray-500 uppercase">ID: {m.id}</p>
                                    </div>
                                </div>
                                <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs bg-black/40 p-2 rounded-lg">
                                    <span className="text-gray-500">Health Score</span>
                                    <span className="text-red-400 font-bold">{m.health_score}%</span>
                                </div>
                                <div className="flex justify-between text-xs bg-black/40 p-2 rounded-lg">
                                    <span className="text-gray-500">HRV Status</span>
                                    <span className="text-amber-400 font-bold">Low</span>
                                </div>
                            </div>
                            <button className="w-full mt-4 bg-red-900/20 text-red-500 border border-red-500/30 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-red-900/40 transition-all">
                                Send Recovery Protocol
                            </button>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default BioScoutBot;
