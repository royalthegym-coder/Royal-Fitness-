
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../common/Card';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import { getComplexResponse, cleanAndParseJSON } from '../../../lib/gemini';
import { DailyRoutineLog } from '../../../types';
import { 
    Check, Clock, Zap, Activity, BrainCircuit, Plus, RefreshCw,
    FlaskConical, Utensils, Dumbbell, Sparkles, ShieldCheck,
    Target, Orbit, Infinity, Droplets, Moon, Flame, Award
} from 'lucide-react';
import { BotIcon } from '../icons/BotIcon';

const DailyRoutineLogView: React.FC<{ memberId: number }> = ({ memberId }) => {
    const { dailyRoutineLogs = [], updateRoutineLog, addRoutineLog, liveHealthData, members } = useData();
    const { addToast } = useToast();
    const member = members.find(m => m.id === memberId);

    // AI & System State
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Manual Input State
    const [manualTaskDesc, setManualTaskDesc] = useState('');
    const [manualTaskType, setManualTaskType] = useState('Meal');

    const memberLogs = useMemo(() => 
        dailyRoutineLogs.filter(log => log.member_id === memberId).sort((a, b) => a.task_time.localeCompare(b.task_time))
    , [dailyRoutineLogs, memberId]);

    const completedCount = useMemo(() => 
        memberLogs.filter(log => log.is_done).length
    , [memberLogs]);
    
    const progress = memberLogs.length > 0 ? Math.round((completedCount / memberLogs.length) * 100) : 100;

    const handleGenerateMission = async () => {
        setIsGenerating(true);
        addToast("Oracle: Scanning Bio-Rhythm...", "info");

        let vitalContext = "Normal State";
        if (liveHealthData.heartRate.hrv < 50) vitalContext = "High Stress / Low Recovery";
        if (liveHealthData.sleep.totalHours < 6) vitalContext = "Sleep Deprived";

        const prompt = `
            ACT AS 'ROYAL ORACLE' (FITNESS AI).
            USER: ${member?.name}.
            LIVE VITALS: HRV ${liveHealthData.heartRate.hrv}ms, Sleep ${liveHealthData.sleep.totalHours}h.
            CONTEXT: ${vitalContext}.
            GENERATE 1 SPECIFIC 'BIO-HACK' MISSION for right now.
            Examples: "NSDR Protocol (10m)", "Cold Plunge", "Fast Walk", "Magnesium Intake".
            OUTPUT STRICT JSON: {"task_desc": "string", "reason": "string (max 5 words)"}.
        `;
        
        try {
            const res = await getComplexResponse(prompt);
            const parsed = cleanAndParseJSON(res);
            
            const newMission: DailyRoutineLog = {
                log_id: `AI_${Date.now()}`,
                member_id: memberId,
                task_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                task_type: "Bio-Hack",
                task_desc: parsed.task_desc,
                is_done: false
            };
            
            addRoutineLog(newMission);
            addToast(`Oracle Directive: ${parsed.reason}`, "success");
        } catch (e) {
            addToast("Neural Link Interrupted.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddManualTask = () => {
        if (!manualTaskDesc.trim()) return;
        const newTask: DailyRoutineLog = {
            log_id: `MANUAL_${Date.now()}`,
            member_id: memberId,
            task_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            task_type: manualTaskType,
            task_desc: manualTaskDesc,
            is_done: false
        };
        addRoutineLog(newTask);
        setManualTaskDesc('');
        addToast("Tactical Shard Added.", "success");
    };

    const toggleTask = (log: DailyRoutineLog) => {
        const updatedLog = { ...log, is_done: !log.is_done };
        updateRoutineLog(updatedLog);
        if(!log.is_done) {
            const xpGain = log.task_type === 'Workout' ? 150 : log.task_type === 'Bio-Hack' ? 100 : 50;
            addToast(`Objective Complete. +${xpGain} Neural XP`, "success");
        }
    };

    const getIconForTask = (type: string) => {
        const props = { className: "w-6 h-6" };
        switch(type) {
            case 'Supplement': return <FlaskConical {...props} className="w-6 h-6 text-pink-400" />;
            case 'Meal': return <Utensils {...props} className="w-6 h-6 text-green-400" />;
            case 'Workout': return <Dumbbell {...props} className="w-6 h-6 text-blue-400" />;
            case 'Bio-Hack': return <Zap {...props} className="w-6 h-6 text-amber-400" />;
            case 'Hydration': return <Droplets {...props} className="w-6 h-6 text-cyan-400" />;
            case 'Sleep': return <Moon {...props} className="w-6 h-6 text-indigo-400" />;
            default: return <Activity {...props} className="w-6 h-6 text-gray-400" />;
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-32">
            
            {/* 1. APEX HEADER */}
            <div className="bg-[#020308] p-10 rounded-[3.5rem] border border-amber-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(245,158,11,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-amber-500 text-black rounded-[3rem] shadow-[0_0_60px_rgba(245,158,11,0.5)] border border-amber-400 group-hover:rotate-12 transition-transform duration-700">
                            <Orbit className="w-16 h-16 animate-spin-slow" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-amber-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Infinity className="w-3 h-3" /> Apex-Continuum v31.0
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">SYNC: OPTIMAL</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Daily <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Mission</span>
                            </h1>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT COLUMN: QUANTUM CORE & AI */}
                <div className="lg:col-span-4 space-y-6">
                     
                     {/* 1. QUANTUM EFFICIENCY RING */}
                     <Card className="bg-gray-950 border-white/5 p-10 rounded-[3.5rem] shadow-2xl text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
                        <div className="absolute top-0 right-0 p-6 opacity-5"><Target className="w-40 h-40 text-white" /></div>
                        
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-8 relative z-10">
                            {progress === 100 ? 'SINGULARITY ACHIEVED' : 'QUANTUM EFFICIENCY'}
                        </p>
                        
                        <div className="relative w-64 h-64 mx-auto flex items-center justify-center z-10">
                            {/* Outer Orbit */}
                            <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-800 animate-spin-slow"></div>
                            
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="128" cy="128" r="110" stroke="#1f2937" strokeWidth="12" fill="none" />
                                <circle 
                                    cx="128" cy="128" r="110" 
                                    stroke={progress === 100 ? '#22c55e' : '#f59e0b'} 
                                    strokeWidth="12" 
                                    fill="none" 
                                    strokeDasharray="691" 
                                    strokeDashoffset={691 - (691 * progress) / 100} 
                                    strokeLinecap="round"
                                    className={`transition-all duration-[2000ms] ease-out ${progress === 100 ? 'shadow-[0_0_40px_#22c55e]' : 'shadow-[0_0_20px_#f59e0b]'}`}
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className={`text-7xl font-black italic tracking-tighter ${progress === 100 ? 'text-green-400' : 'text-white'}`}>{progress}%</span>
                                {progress === 100 && <span className="text-xs font-black text-green-500 uppercase tracking-widest mt-1 animate-pulse">Complete</span>}
                            </div>
                        </div>
                        <div className="mt-8 flex items-center gap-4 relative z-10">
                             <span className="text-xs text-gray-500 font-mono tracking-widest">{completedCount} / {memberLogs.length} EXECUTED</span>
                             {progress === 100 && <Award className="w-6 h-6 text-amber-500 animate-bounce" />}
                        </div>
                     </Card>
                     
                     {/* 2. ORACLE INTEL (AI) */}
                     <div className="p-8 bg-indigo-900/10 border border-indigo-500/20 rounded-[3rem] shadow-xl space-y-6 relative overflow-hidden group">
                         <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <div className="flex items-center gap-4 relative z-10">
                             <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400 border border-indigo-500/30">
                                <BotIcon className="w-6 h-6" />
                             </div>
                             <div>
                                 <h4 className="text-white font-black uppercase text-sm italic tracking-widest">Oracle Intel</h4>
                                 <p className="text-[9px] text-indigo-400 font-mono">Live Bio-Feedback Link</p>
                             </div>
                         </div>
                         <p className="text-indigo-200 text-xs italic leading-relaxed relative z-10 border-l-2 border-indigo-500 pl-4">
                             "My neural scanners detect <strong className="text-white">{liveHealthData.heartRate.hrv < 50 ? 'High CNS Stress' : 'Optimal Recovery'}</strong>. 
                             Request a Bio-Hack to balance your matrix."
                         </p>
                         <button 
                            onClick={handleGenerateMission}
                            disabled={isGenerating}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] active:scale-95 disabled:opacity-50 relative z-10"
                        >
                            {isGenerating ? <RefreshCw className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4"/>}
                            {isGenerating ? 'SYNTHESIZING...' : 'GENERATE BIO-HACK'}
                        </button>
                     </div>
                </div>

                {/* RIGHT: MISSION TIMELINE */}
                <div className="lg:col-span-8">
                     <div className="space-y-4">
                        {memberLogs.length === 0 ? (
                            <Card className="h-full min-h-[400px] flex flex-col items-center justify-center text-center bg-gray-900/50 border-white/5 border-dashed rounded-[3rem]">
                                <Zap className="w-20 h-20 text-gray-800 mx-auto mb-6" />
                                <h3 className="text-xl font-black text-white uppercase italic tracking-widest mb-2">Timeline Empty</h3>
                                <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-xs">No active missions in neural buffer.</p>
                                <button onClick={handleGenerateMission} className="mt-8 text-amber-500 hover:text-amber-400 text-xs font-black uppercase tracking-widest underline decoration-dashed underline-offset-4">Initialize Oracle</button>
                            </Card>
                        ) : (
                            memberLogs.map((log) => (
                                <div 
                                    key={log.log_id} 
                                    onClick={() => toggleTask(log)}
                                    className={`group p-6 rounded-[2.5rem] border-2 transition-all duration-300 cursor-pointer relative overflow-hidden flex items-center justify-between shadow-xl ${
                                        log.is_done 
                                        ? 'bg-green-950/20 border-green-500/30 opacity-60 scale-[0.98] grayscale-[0.5]' 
                                        : 'bg-[#0a0a0a] border-white/10 hover:border-amber-500/50 hover:scale-[1.01]'
                                    }`}
                                >
                                    <div className="flex items-center gap-6 relative z-10 w-full">
                                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-300 border shadow-lg ${
                                            log.is_done 
                                            ? 'bg-green-900/20 border-green-500/20 text-green-500' 
                                            : `bg-gray-900 border-white/5 text-gray-400 group-hover:bg-amber-500 group-hover:text-black group-hover:border-amber-400`
                                        }`}>
                                            {log.is_done ? <Check className="w-8 h-8" strokeWidth={4} /> : getIconForTask(log.task_type)}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`text-xl font-black italic uppercase tracking-tight transition-colors leading-tight ${log.is_done ? 'text-gray-500 line-through decoration-green-500 decoration-2' : 'text-white group-hover:text-amber-500'}`}>
                                                {log.task_desc}
                                            </h4>
                                            <div className="flex flex-wrap items-center gap-3 mt-3">
                                                <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 px-3 py-1 rounded-full border ${log.is_done ? 'border-transparent text-gray-600 bg-gray-900' : 'border-white/10 text-gray-400 bg-white/5'}`}>
                                                    <BrainCircuit className="w-3 h-3" /> {log.task_type}
                                                </span>
                                                <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 px-3 py-1 rounded-full border ${log.is_done ? 'border-transparent text-gray-600 bg-gray-900' : 'border-white/10 text-gray-400 bg-white/5'}`}>
                                                    <Clock className="w-3 h-3" /> {log.task_time}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default DailyRoutineLogView;
