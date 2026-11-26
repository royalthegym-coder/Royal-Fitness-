import React, { useState, useEffect } from 'react';
import { omniEngine100x, AppFitnessFutureMatrixConfig } from '../../core/SelfLearningEngine';
import { Network, Brain, Activity, Zap, RefreshCw } from 'lucide-react';
import Card from '../common/Card';

export const OmniMATRIXDashboard: React.FC = () => {
    const [config, setConfig] = useState<AppFitnessFutureMatrixConfig>(omniEngine100x.getConfig());
    const [logs, setLogs] = useState(omniEngine100x.getLogs());
    const [isEvolving, setIsEvolving] = useState(false);
    const [lastInsights, setLastInsights] = useState<string[]>([]);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setLogs([...omniEngine100x.getLogs()]);
        }, 5000); // Polling logs every 5 seconds for visual update
        return () => clearInterval(interval);
    }, []);

    const handleEvolve = async () => {
        setIsEvolving(true);
        // Add a generated event just to ensure we have enough data if testing manually
        omniEngine100x.logEvent("manual_evolution_trigger", { user: "Admin", action: "Force Evolve" });
        omniEngine100x.logEvent("test_log_2", { metric: "CPU usage 80%" });
        omniEngine100x.logEvent("test_log_3", { metric: "High dropout rate in night workouts" });
        omniEngine100x.logEvent("test_log_4", { UX_feedback: "User preferred larger text" });
        omniEngine100x.logEvent("test_log_5", { AI_interaction: "More aggressive coaching requested" });

        const result = await omniEngine100x.triggerEvolution();
        if (result) {
            setConfig(omniEngine100x.getConfig());
            setLastInsights(result.insights || []);
            setLogs([...omniEngine100x.getLogs()]);
        }
        setIsEvolving(false);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 flex items-center gap-3">
                        <Brain className="w-8 h-8 text-cyan-400" />
                        FitnessFutureMatrix Core (Self-Learning AI)
                    </h2>
                    <p className="text-emerald-400/70 mt-2 font-mono text-sm">
                        Continuous neural mutation engine. Level {config.learningLevel.toFixed(2)}
                    </p>
                </div>
                <button
                    onClick={handleEvolve}
                    disabled={isEvolving}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-mono focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all"
                >
                    <RefreshCw className={`w-4 h-4 ${isEvolving ? 'animate-spin' : ''}`} />
                    {isEvolving ? 'Mutating Core...' : 'Force Evolution'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-4 bg-gray-900/50 border-gray-800">
                    <div className="flex items-center gap-3 text-cyan-400 mb-2">
                        <Network className="w-5 h-5" />
                        <h3 className="font-bold">Theme State</h3>
                    </div>
                    <p className="text-2xl font-mono text-white capitalize">{config.themeMode}</p>
                </Card>
                <Card className="p-4 bg-gray-900/50 border-gray-800">
                    <div className="flex items-center gap-3 text-purple-400 mb-2">
                        <Activity className="w-5 h-5" />
                        <h3 className="font-bold">AI Strictness</h3>
                    </div>
                    <p className="text-2xl font-mono text-white">{config.aiStrictness} / 10</p>
                </Card>
                <Card className="p-4 bg-gray-900/50 border-gray-800">
                    <div className="flex items-center gap-3 text-blue-400 mb-2">
                        <Zap className="w-5 h-5" />
                        <h3 className="font-bold">Default Workout (m)</h3>
                    </div>
                    <p className="text-2xl font-mono text-white">{config.defaultWorkoutDurationMinutes}</p>
                </Card>
                <Card className="p-4 bg-gray-900/50 border-gray-800">
                    <div className="flex items-center gap-3 text-emerald-400 mb-2">
                        <Brain className="w-5 h-5" />
                        <h3 className="font-bold">Active Modules</h3>
                    </div>
                    <p className="text-xl font-mono text-white">{config.activeModules.length} Modules</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 bg-black/40 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-400" />
                        Recent Smart Insights
                    </h3>
                    {lastInsights.length > 0 ? (
                        <ul className="space-y-3">
                            {lastInsights.map((insight, idx) => (
                                <li key={idx} className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50 text-emerald-300 font-mono text-sm shadow-inner">
                                    &gt; {insight}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 font-mono text-sm italic">
                            Waiting for next neural evolution cycle...
                        </p>
                    )}
                </Card>

                <Card className="p-6 bg-black/40 border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Network className="w-5 h-5 text-cyan-400" />
                        Raw Event Stream ({logs.length})
                    </h3>
                    <div className="h-48 overflow-y-auto space-y-2 pr-2 font-mono text-xs">
                        {logs.slice().reverse().map((log, i) => (
                            <div key={i} className="flex gap-2 text-gray-400 border-b border-gray-800/50 pb-1">
                                <span className="text-cyan-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                <span className="text-purple-400 font-bold shrink-0">{log.event}</span>
                                <span className="text-gray-500 truncate">{JSON.stringify(log.data)}</span>
                            </div>
                        ))}
                        {logs.length === 0 && (
                            <p className="text-gray-600 italic">No events logged yet.</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};
export default OmniMATRIXDashboard;
