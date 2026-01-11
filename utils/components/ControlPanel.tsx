
import React, { useState, useEffect, useRef } from 'react';
import Card from './common/Card';
import { ControlIcon } from './icons/ControlIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { BugFixIcon } from './icons/BugFixIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { TrashIcon } from './icons/TrashIcon';
import { BotIcon } from './icons/BotIcon';

// --- TYPES ---

interface ErrorEvent {
    id: number;
    message: string;
    source: string;
    timestamp: string;
    severity: 'critical' | 'high' | 'medium';
}

interface AutoFixEvent {
    id: number;
    action: string;
    target: string;
    timestamp: string;
    status: 'executed' | 'pending_approval' | 'rolled_back';
}

interface HeatmapCell {
    id: number;
    load: number; // 0-100
    status: 'healthy' | 'warning' | 'critical';
}

const ControlPanel: React.FC = () => {
    // --- STATE ---
    const [isManualMode, setIsManualMode] = useState(false);
    const [riskScore, setRiskScore] = useState(12); // Lower is better
    const [errorFeed, setErrorFeed] = useState<ErrorEvent[]>([]);
    const [autoFixHistory, setAutoFixHistory] = useState<AutoFixEvent[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<AutoFixEvent[]>([]);
    const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>(Array(64).fill(null).map((_, i) => ({ id: i, load: 10, status: 'healthy' })));
    const [isRollingBack, setIsRollingBack] = useState(false);

    // --- SIMULATION EFFECTS ---

    useEffect(() => {
        const interval = setInterval(() => {
            // 1. Simulate Heatmap Updates
            setHeatmapData(prev => prev.map(cell => {
                // Random walk
                let newLoad = cell.load + (Math.random() * 20 - 10);
                newLoad = Math.max(0, Math.min(100, newLoad));
                
                let status: HeatmapCell['status'] = 'healthy';
                if (newLoad > 80) status = 'critical';
                else if (newLoad > 50) status = 'warning';

                return { ...cell, load: newLoad, status };
            }));

            // 2. Simulate Random Errors & Incidents
            if (Math.random() > 0.85) {
                const sources = ['Auth-Service', 'Payment-Gateway', 'Redis-Cache', 'Node-Worker-1', 'API-Gateway'];
                const msgs = ['Timeout waiting for lock', 'Connection reset by peer', 'High memory usage detected', 'Invalid JWT signature', 'Rate limit exceeded'];
                const severity = Math.random() > 0.8 ? 'critical' : Math.random() > 0.5 ? 'high' : 'medium';
                
                const newError: ErrorEvent = {
                    id: Date.now(),
                    source: sources[Math.floor(Math.random() * sources.length)],
                    message: msgs[Math.floor(Math.random() * msgs.length)],
                    timestamp: new Date().toLocaleTimeString(),
                    severity: severity as any
                };

                setErrorFeed(prev => [newError, ...prev].slice(0, 20));

                // 3. Trigger Auto-Fix (or Request Approval)
                const fixAction = `Restarted ${newError.source}`;
                const newFix: AutoFixEvent = {
                    id: Date.now(),
                    action: fixAction,
                    target: newError.source,
                    timestamp: new Date().toLocaleTimeString(),
                    status: isManualMode ? 'pending_approval' : 'executed'
                };

                if (isManualMode) {
                    setPendingApprovals(prev => [newFix, ...prev]);
                } else {
                    setAutoFixHistory(prev => [newFix, ...prev].slice(0, 50));
                    // Simulate effect of fix on heatmap/score
                    setRiskScore(prev => Math.max(0, prev - 2));
                }
            }

            // Slowly increase risk score over time to simulate drift, unless fixes happen
            if (Math.random() > 0.9) {
                setRiskScore(prev => Math.min(100, prev + 1));
            }

        }, 1000);

        return () => clearInterval(interval);
    }, [isManualMode]);

    // --- HANDLERS ---

    const handleApprove = (fix: AutoFixEvent) => {
        setPendingApprovals(prev => prev.filter(f => f.id !== fix.id));
        setAutoFixHistory(prev => [{ ...fix, status: 'executed', timestamp: new Date().toLocaleTimeString() }, ...prev]);
        setRiskScore(prev => Math.max(0, prev - 5));
    };

    const handleDeny = (id: number) => {
        setPendingApprovals(prev => prev.filter(f => f.id !== id));
    };

    const handleRollback = () => {
        if (autoFixHistory.length === 0) return;
        setIsRollingBack(true);
        setTimeout(() => {
            const lastAction = autoFixHistory[0];
            const rollbackEvent: AutoFixEvent = {
                id: Date.now(),
                action: `ROLLED BACK: ${lastAction.action}`,
                target: lastAction.target,
                timestamp: new Date().toLocaleTimeString(),
                status: 'rolled_back'
            };
            setAutoFixHistory(prev => [rollbackEvent, ...prev]);
            setIsRollingBack(false);
            alert(`System rolled back to state before: ${lastAction.action}`);
        }, 1500);
    };

    // --- UI HELPERS ---

    const getSeverityColor = (s: string) => {
        switch(s) {
            case 'critical': return 'text-red-500 bg-red-900/20 border-red-500/50';
            case 'high': return 'text-orange-500 bg-orange-900/20 border-orange-500/50';
            default: return 'text-blue-400 bg-blue-900/20 border-blue-500/50';
        }
    };

    return (
        <div className="space-y-6">
            {/* --- HEADER CONTROLS --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-900 p-6 rounded-xl border border-gray-700 shadow-xl">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center">
                        <ControlIcon className="w-10 h-10 mr-3 text-cyan-400" />
                        AI Control Dashboard
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Autonomous System Oversight & Manual Intervention Interface</p>
                </div>
                
                <div className="flex items-center gap-6 mt-4 md:mt-0">
                    <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Security Risk</p>
                        <div className={`text-3xl font-black ${riskScore > 50 ? 'text-red-500' : riskScore > 20 ? 'text-yellow-500' : 'text-green-500'}`}>
                            {riskScore}
                        </div>
                    </div>

                    <div className="h-10 w-px bg-gray-700"></div>

                    <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${!isManualMode ? 'text-green-400' : 'text-gray-500'}`}>AUTO</span>
                        <div 
                            onClick={() => setIsManualMode(!isManualMode)}
                            className="w-14 h-7 bg-gray-800 rounded-full border border-gray-600 p-1 cursor-pointer relative"
                        >
                            <div className={`w-5 h-5 rounded-full shadow-md transition-all duration-300 transform ${isManualMode ? 'translate-x-7 bg-amber-500' : 'translate-x-0 bg-green-500'}`}></div>
                        </div>
                        <span className={`text-sm font-bold ${isManualMode ? 'text-amber-400' : 'text-gray-500'}`}>MANUAL</span>
                    </div>

                    <button 
                        onClick={handleRollback}
                        disabled={isRollingBack || autoFixHistory.length === 0}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all active:scale-95"
                    >
                        {isRollingBack ? <AutoUpdateIcon className="w-5 h-5 animate-spin mr-2"/> : <div className="mr-2">↺</div>}
                        {isRollingBack ? 'Reverting...' : 'ROLLBACK'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* --- LEFT COL: HEATMAP & FEED --- */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Performance Heatmap */}
                    <Card title="System Neural Heatmap" className="bg-black border-gray-800">
                        <div className="grid grid-cols-16 gap-1 h-32">
                            {heatmapData.map(cell => (
                                <div 
                                    key={cell.id} 
                                    className={`rounded-sm transition-all duration-500 ${
                                        cell.status === 'critical' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] z-10' : 
                                        cell.status === 'warning' ? 'bg-amber-500' : 
                                        'bg-green-900/40 border border-green-500/10'
                                    }`}
                                    title={`Node ${cell.id}: ${cell.load}% Load`}
                                ></div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center mt-2 text-[10px] text-gray-500 font-mono">
                            <span>NODES: 64 ACTIVE</span>
                            <div className="flex gap-3">
                                <span className="flex items-center"><span className="w-2 h-2 bg-green-900 mr-1 rounded-sm"></span> IDLE</span>
                                <span className="flex items-center"><span className="w-2 h-2 bg-amber-500 mr-1 rounded-sm"></span> WARN</span>
                                <span className="flex items-center"><span className="w-2 h-2 bg-red-500 mr-1 rounded-sm"></span> CRIT</span>
                            </div>
                        </div>
                    </Card>

                    {/* Live Error Feed */}
                    <Card title="Live Incident Feed" className="h-[400px] flex flex-col">
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                            {errorFeed.length === 0 && <div className="text-center text-gray-500 py-10">System Nominal. No Active Incidents.</div>}
                            {errorFeed.map(err => (
                                <div key={err.id} className={`p-3 rounded-lg border flex items-start justify-between animate-fade-in ${getSeverityColor(err.severity)}`}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-xs uppercase px-1.5 py-0.5 bg-black/20 rounded">{err.source}</span>
                                            <span className="text-xs opacity-75">{err.timestamp}</span>
                                        </div>
                                        <p className="text-sm font-semibold">{err.message}</p>
                                    </div>
                                    {isManualMode && (
                                        <button className="text-xs bg-black/20 hover:bg-black/40 px-3 py-1.5 rounded font-bold transition-colors">
                                            Investigate
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* --- RIGHT COL: ACTIONS & HISTORY --- */}
                <div className="space-y-6">
                    {/* Pending Approvals (Manual Mode) */}
                    {isManualMode && (
                        <Card className="border-2 border-amber-500/50 bg-amber-900/10">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-amber-400 flex items-center">
                                    <BotIcon className="w-5 h-5 mr-2" /> Pending Approvals
                                </h3>
                                <span className="bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded-full">{pendingApprovals.length}</span>
                            </div>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {pendingApprovals.length === 0 && <p className="text-sm text-gray-500 italic">No pending actions.</p>}
                                {pendingApprovals.map(fix => (
                                    <div key={fix.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                        <p className="text-sm text-white font-bold mb-1">{fix.action}</p>
                                        <p className="text-xs text-gray-400 mb-3">Target: {fix.target}</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleApprove(fix)} className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 rounded transition-colors">
                                                Approve
                                            </button>
                                            <button onClick={() => handleDeny(fix.id)} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-200 text-xs font-bold py-2 rounded transition-colors border border-red-500/30">
                                                Deny
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Auto-Fix History */}
                    <Card title="Auto-Remediation Log">
                        <div className="space-y-4 relative">
                            {/* Connector Line */}
                            <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gray-700"></div>
                            
                            {autoFixHistory.length === 0 && <p className="text-gray-500 text-sm pl-8">No actions taken yet.</p>}
                            
                            {autoFixHistory.map((fix, i) => (
                                <div key={fix.id} className="relative pl-8 animate-fade-in">
                                    {/* Timeline Dot */}
                                    <div className={`absolute left-0 top-1 w-5 h-5 rounded-full border-4 border-gray-800 ${
                                        fix.status === 'rolled_back' ? 'bg-red-500' : 'bg-green-500'
                                    }`}></div>
                                    
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className={`text-sm font-bold ${fix.status === 'rolled_back' ? 'text-red-400 line-through' : 'text-gray-200'}`}>
                                                {fix.action}
                                            </p>
                                            <p className="text-xs text-gray-500">{fix.timestamp} • {fix.target}</p>
                                        </div>
                                        {fix.status === 'executed' && i === 0 && !isManualMode && (
                                            <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-500/30">
                                                Just Now
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ControlPanel;
