
import React, { useState } from 'react';
import Card from './common/Card';
import { Shield, Activity, Heart, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';

const BioScoutBot: React.FC = () => {
    const { members } = useData();
    const { addToast } = useToast();
    const [isScanning, setIsScanning] = useState(false);
    const [hasScanned, setHasScanned] = useState(false);
    
    // Process finding at-risk members
    const atRiskMembers = members.filter(m => (m.health_score || 0) < 70);

    const handleScan = () => {
        setIsScanning(true);
        setTimeout(() => {
            setIsScanning(false);
            setHasScanned(true);
            addToast(`Scan complete. Found ${atRiskMembers.length} anomalies.`, "info");
        }, 2000);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="mb-6 bg-[#020202] p-8 rounded-[3rem] border border-cyan-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-[2rem] shadow-[0_0_60px_rgba(6,182,212,0.5)] border border-cyan-400 group-hover:rotate-12 transition-transform duration-700">
                             <Shield className="w-12 h-12" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Activity className="w-3 h-3" /> Fitness Future
                                </div>
                                <span className="text-[10px] font-mono text-cyan-500/70 tracking-[0.4em] uppercase">ANOMALY DETECTION SYSTEM</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Bio-Scout <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400">Sentinel</span>
                            </h1>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden md:block">
                             <p className="text-5xl font-black text-cyan-500 italic">{hasScanned ? atRiskMembers.length : '-'}</p>
                             <p className="text-[10px] text-cyan-500/70 uppercase font-bold tracking-widest">Alerts Active</p>
                        </div>
                        <button 
                            onClick={handleScan}
                            disabled={isScanning}
                            className={`bg-cyan-600 hover:bg-cyan-500 text-black px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] ${isScanning ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                            {isScanning ? 'SCANNING...' : 'INITIATE SCAN'}
                        </button>
                    </div>
                </div>
            </div>

            {hasScanned && (
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
                                        <img src={m.avatar || "https://i.pravatar.cc/150?u=" + m.id} alt={m.name} className="w-12 h-12 rounded-2xl object-cover border border-white/10" />
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
                                <button 
                                    onClick={() => addToast(`Recovery Protocol sent to ${m.name}`, "success")}
                                    className="w-full mt-4 bg-red-900/20 text-red-500 border border-red-500/30 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-red-900/40 transition-all"
                                >
                                    Send Recovery Protocol
                                </button>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default BioScoutBot;
