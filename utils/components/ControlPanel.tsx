
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import { ControlIcon } from './icons/ControlIcon';
import { BotIcon } from './icons/BotIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';

const ControlPanel: React.FC = () => {
    const [isAutoPilot, setIsAutoPilot] = useState(true);
    const [sysLoad, setSysLoad] = useState(15);
    const [threatsDeflected, setThreats] = useState(124);

    useEffect(() => {
        const interval = setInterval(() => {
            setSysLoad(prev => Math.max(5, Math.min(95, prev + (Math.random() * 20 - 10))));
            if (Math.random() > 0.95) setThreats(t => t + 1);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center bg-gray-900 p-8 rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
                    <ControlIcon className="w-64 h-64 text-amber-500" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-white flex items-center uppercase italic gap-3">
                        <ControlIcon className="w-10 h-10 text-cyan-400" /> System Control Hub
                    </h1>
                    <p className="text-xs text-gray-500 font-mono mt-1 tracking-widest uppercase">Master Override Authorization: Level 4</p>
                </div>
                
                <div className="flex items-center gap-6 relative z-10">
                    <div className="flex flex-col items-end">
                        <span className={`text-[10px] font-black ${isAutoPilot ? 'text-green-500' : 'text-amber-500'} uppercase tracking-widest mb-1`}>{isAutoPilot ? 'Autopilot Active' : 'Manual Override'}</span>
                        <button 
                            onClick={() => setIsAutoPilot(!isAutoPilot)}
                            className={`w-16 h-8 rounded-full border-2 transition-all p-1 flex items-center ${isAutoPilot ? 'bg-green-900/20 border-green-500 justify-end' : 'bg-amber-900/20 border-amber-500 justify-start'}`}
                        >
                            <div className={`w-5 h-5 rounded-full shadow-lg ${isAutoPilot ? 'bg-green-500 shadow-green-500/50' : 'bg-amber-500 shadow-amber-500/50'}`}></div>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-t-4 border-cyan-500 bg-black/40">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Core Neural Load</h4>
                    <div className="text-5xl font-black text-white tracking-tighter italic">{sysLoad.toFixed(1)}%</div>
                    <div className="w-full bg-gray-800 h-2 rounded-full mt-6 overflow-hidden">
                        <div className="h-full bg-cyan-500 transition-all duration-1000" style={{ width: `${sysLoad}%` }}></div>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-2 font-mono italic">Thread utilization within optimal bounds.</p>
                </Card>

                <Card className="border-t-4 border-purple-500 bg-black/40">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Threat Deflection</h4>
                    <div className="text-5xl font-black text-purple-500 tracking-tighter italic">{threatsDeflected}</div>
                    <div className="mt-6 flex items-center gap-3">
                        <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Perimeter Intrusion Detection Active</span>
                    </div>
                </Card>

                <Card className="border-t-4 border-amber-500 bg-black/40">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Autonomous Bots</h4>
                    <div className="text-5xl font-black text-amber-500 tracking-tighter italic">12</div>
                    <div className="mt-6 flex items-center gap-3">
                        <BotIcon className="w-5 h-5 text-amber-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Executing Scheduled CRM Missions</span>
                    </div>
                </Card>
            </div>

            <Card title="Global Environment Map" className="bg-black border-gray-800">
                <div className="grid grid-cols-8 md:grid-cols-16 gap-1.5 h-48 opacity-40">
                    {Array(128).fill(0).map((_, i) => (
                        <div key={i} className={`rounded-sm transition-all duration-1000 ${sysLoad > 70 && i % 3 === 0 ? 'bg-amber-500' : 'bg-gray-800'}`}></div>
                    ))}
                </div>
                <div className="mt-6 flex justify-between items-center text-[10px] font-mono text-gray-600 uppercase tracking-[0.2em]">
                    <span className="flex items-center gap-2"><AutoUpdateIcon className="w-3 h-3 animate-spin"/> Uptime: 99.999%</span>
                    <span>Region: Jhunjhunu-Core-1</span>
                </div>
            </Card>
        </div>
    );
};

export default ControlPanel;
