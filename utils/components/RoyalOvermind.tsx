
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import { Globe, Activity, Users, ShieldCheck, Cpu, Database } from 'lucide-react';
import { useData } from '../context/DataProvider';

const RoyalOvermind: React.FC = () => {
    const { activeMemberCount, systemHealth, auditLogs } = useData();
    const [networkLoad, setNetworkLoad] = useState(42);

    useEffect(() => {
        const interval = setInterval(() => {
            setNetworkLoad(prev => Math.min(99, Math.max(10, prev + (Math.random() * 10 - 5))));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="p-10 rounded-[3.5rem] bg-[#020202] border border-purple-500/20 shadow-2xl text-center">
                 <Globe className="w-24 h-24 text-purple-500 mx-auto mb-6 animate-pulse" />
                 <h1 className="text-6xl font-black text-white italic uppercase tracking-tighter">
                    Royal <span className="text-purple-500">Overmind</span>
                </h1>
                <p className="text-gray-500 text-sm mt-3 font-mono tracking-[0.5em] uppercase">Global System Consciousness</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gray-900 border-white/5 text-center p-8">
                    <Activity className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
                    <h3 className="text-4xl font-black text-white italic">{networkLoad.toFixed(1)}%</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-2">Neural Load</p>
                </Card>
                <Card className="bg-gray-900 border-white/5 text-center p-8">
                    <Users className="w-10 h-10 text-green-400 mx-auto mb-4" />
                    <h3 className="text-4xl font-black text-white italic">{activeMemberCount}</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-2">Active Bio-Nodes</p>
                </Card>
                <Card className="bg-gray-900 border-white/5 text-center p-8">
                    <ShieldCheck className="w-10 h-10 text-amber-400 mx-auto mb-4" />
                    <h3 className="text-4xl font-black text-white italic">{systemHealth}%</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-2">Security Integrity</p>
                </Card>
            </div>

            <Card title="Live Thought Stream" className="bg-black border-white/10 h-96 flex flex-col p-0 overflow-hidden rounded-[3rem]">
                <div className="bg-gray-900/50 px-8 py-4 border-b border-white/5 flex items-center gap-3">
                    <Cpu className="w-4 h-4 text-purple-400 animate-spin-slow" />
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Processing...</span>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-3 font-mono text-xs text-purple-300/80 custom-scrollbar">
                    {auditLogs.map((log, i) => (
                        <div key={i} className="border-l-2 border-purple-500/20 pl-4 py-1">
                            <span className="text-gray-500 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                            <span className="text-white">{log.action}</span>: {log.details}
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default RoyalOvermind;
