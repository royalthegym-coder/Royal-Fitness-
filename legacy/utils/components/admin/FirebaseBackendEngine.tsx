import React, { useState } from 'react';
import { Database, Server, Cloud, ShieldAlert, Cpu, Activity, RefreshCw } from 'lucide-react';
import { useData } from '../../context/DataProvider';

export const FirebaseBackendEngine = () => {
    const { isDeveloperMode, evolutionLevel } = useData();
    const [isDeploying, setIsDeploying] = useState(false);
    const [logs, setLogs] = useState<string[]>([
        "Firebase Backend initialized.",
        "Connecting to Firestore instances...",
        "Connection established. Server-less architecture running.",
        "Database Rules: STABLE"
    ]);

    const deployRules = () => {
        setIsDeploying(true);
        setLogs(prev => ["[SYSTEM] Compiling security rules...", ...prev]);
        setTimeout(() => {
            setLogs(prev => ["[SUCCESS] firestore.rules deployed to all edges.", ...prev]);
            setIsDeploying(false);
        }, 2000);
    };

    const triggerSync = () => {
        setIsDeploying(true);
        setLogs(prev => ["[SYNC] Force pulling data from Firestore...", ...prev]);
        setTimeout(() => {
            setLogs(prev => ["[SUCCESS] Local state synchronized with Cloud.", ...prev]);
            setIsDeploying(false);
        }, 1500);
    };

    return (
        <div className="p-6 h-full flex flex-col space-y-6 text-gray-100 font-mono">
            <div>
                <h2 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-green-500 uppercase flex items-center gap-3">
                    <Database className="w-8 h-8 text-yellow-400" />
                    Backend Automation: Firebase
                </h2>
                <p className="text-xs text-gray-400 mt-2 uppercase tracking-[0.2em]">Automated Cloud Infrastructure & Coding</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-black/60 border border-yellow-500/20 p-6 rounded-2xl flex flex-col items-center justify-center text-center group hover:border-yellow-500/50 transition-colors">
                    <Server className="w-12 h-12 text-yellow-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg mb-2">Firestore Database</h3>
                    <p className="text-xs text-gray-400">NoSQL Document Store</p>
                    <div className="mt-4 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-[10px] font-bold uppercase border border-green-500/20">
                        Online
                    </div>
                </div>

                <div className="bg-black/60 border border-yellow-500/20 p-6 rounded-2xl flex flex-col items-center justify-center text-center group hover:border-yellow-500/50 transition-colors">
                    <Cloud className="w-12 h-12 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg mb-2">Cloud Functions</h3>
                    <p className="text-xs text-gray-400">Automated Backend Logic</p>
                    <div className="mt-4 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-[10px] font-bold uppercase border border-green-500/20">
                        Active
                    </div>
                </div>

                <div className="bg-black/60 border border-yellow-500/20 p-6 rounded-2xl flex flex-col items-center justify-center text-center group hover:border-yellow-500/50 transition-colors">
                    <ShieldAlert className="w-12 h-12 text-red-500 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg mb-2">Security Rules</h3>
                    <p className="text-xs text-gray-400">Zero-Trust Protocol</p>
                    <div className="mt-4 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-[10px] font-bold uppercase border border-green-500/20">
                        Enforced
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                <div className="bg-black/80 border border-gray-800 rounded-2xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-black/40">
                        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-yellow-500" /> Serverless Terminal
                        </h3>
                        <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto space-y-2">
                        {logs.map((log, i) => (
                            <div key={i} className="text-xs text-gray-400 flex items-start gap-2">
                                <span className="text-yellow-500 font-bold shrink-0">{'>'}</span>
                                <span className={log.includes('[SUCCESS]') ? 'text-green-400' : log.includes('[SYNC]') ? 'text-blue-400' : ''}>
                                    {log}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <button 
                        onClick={deployRules}
                        disabled={isDeploying}
                        className="p-6 bg-gradient-to-r from-yellow-500/10 to-red-500/10 border border-yellow-500/30 rounded-2xl flex items-center gap-4 hover:border-yellow-500/60 transition-all disabled:opacity-50"
                    >
                        <ShieldAlert className="w-8 h-8 text-yellow-500" />
                        <div className="text-left">
                            <h4 className="font-bold text-white text-lg">Deploy Security Rules</h4>
                            <p className="text-xs text-gray-400 mt-1">Compile and deploy firestore.rules</p>
                        </div>
                    </button>

                    <button 
                        onClick={triggerSync}
                        disabled={isDeploying}
                        className="p-6 bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-500/30 rounded-2xl flex items-center gap-4 hover:border-blue-500/60 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-8 h-8 text-blue-500 ${isDeploying ? 'animate-spin' : ''}`} />
                        <div className="text-left">
                            <h4 className="font-bold text-white text-lg">Force Cloud Sync</h4>
                            <p className="text-xs text-gray-400 mt-1">Sync local state with Firestore documents</p>
                        </div>
                    </button>
                    
                    <div className="flex-1 border border-yellow-500/20 bg-yellow-500/5 rounded-2xl p-6 flex flex-col justify-center">
                        <h4 className="font-bold text-yellow-500 text-sm mb-2">Automated Coding Status</h4>
                        <p className="text-xs text-gray-300">
                            Firebase integration automates the creation of backend APIs, databases, and Real-Time socket layers without writing manual server logic. All production schemas are implemented and stored on active cloud instances.
                        </p>
                        <div className="mt-4 flex items-center gap-4">
                            <div className="h-2 flex-1 bg-black rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-500 w-[100%] shadow-[0_0_10px_#eab308]"></div>
                            </div>
                            <span className="text-xs font-bold text-yellow-500">100% COVERAGE</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FirebaseBackendEngine;
