
import React, { useState, useEffect, useRef } from 'react';
import Card from '../common/Card';
import { TimeQuestIcon } from '../icons/TimeQuestIcon';
import { SparkleIcon } from '../icons/SparkleIcon';
import { AutoUpdateIcon } from '../icons/AutoUpdateIcon';
import { BellIcon } from '../icons/BellIcon';
import { BotIcon } from '../icons/BotIcon';
import { getTacticalMotivation } from '../../../lib/gemini';
import { SpeedIcon } from '../icons/SpeedIcon';

const SmartScheduler: React.FC<{ memberName: string; phone: string }> = ({ memberName, phone }) => {
    // Settings
    const [targetTime, setTargetTime] = useState('18:00');
    const [durationGoal, setDurationGoal] = useState(60); // minutes
    const [reminderEnabled, setReminderEnabled] = useState(true);

    // Live State
    const [timeLeft, setTimeLeft] = useState<string>('--:--');
    const [status, setStatus] = useState<'ontrack' | 'warning' | 'late' | 'arrived'>('ontrack');
    const [minutesUntil, setMinutesUntil] = useState(0);
    
    // Mission Control State (In-Session)
    const [isWorkoutActive, setIsWorkoutActive] = useState(false);
    const [workoutTimer, setWorkoutTimer] = useState(0);
    const [efficiencyScore, setEfficiencyScore] = useState(100);
    const [matrixColor, setMatrixColor] = useState('bg-green-500');

    // AI & Notifications
    const [aiMotivation, setAiMotivation] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [lastAlertSent, setLastAlertSent] = useState<string | null>(null);

    // --- EFFECT: Neural Shift Countdown ---
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const [hours, minutes] = targetTime.split(':').map(Number);
            const target = new Date();
            target.setHours(hours, minutes, 0, 0);

            if (now > target) {
                target.setDate(target.getDate() + 1); // Next day target
            }

            const diffMs = target.getTime() - now.getTime();
            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
            
            const totalMins = Math.floor(diffMs / 60000);
            setMinutesUntil(totalMins);

            setTimeLeft(`${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`);

            // Logic for Status & Auto-Alert
            if (diffHrs === 0 && diffMins < 30) setStatus('warning');
            else if (diffHrs === 0 && diffMins < 10) setStatus('late');
            else setStatus('ontrack');

        }, 1000);
        return () => clearInterval(interval);
    }, [targetTime]);

    // --- EFFECT: Matrix Timer & Efficiency Engine ---
    useEffect(() => {
        let interval: any;
        if (isWorkoutActive) {
            interval = setInterval(() => {
                setWorkoutTimer(prev => {
                    const newTime = prev + 1;
                    
                    // Matrix Gradient Logic
                    const progress = newTime / (durationGoal * 60);
                    if (progress > 0.9) setMatrixColor('bg-red-600 animate-pulse');
                    else if (progress > 0.7) setMatrixColor('bg-amber-500');
                    else setMatrixColor('bg-green-500');

                    // Efficiency Calculation (Decays if over time)
                    if (progress > 1.0) {
                        setEfficiencyScore(prevScore => Math.max(0, prevScore - 0.5));
                    }
                    
                    return newTime;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isWorkoutActive, durationGoal]);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // --- AI MOTIVATION UPLINK ---
    const handleTriggerUplink = async () => {
        setIsGenerating(true);
        // Calculate lateness context
        const isLate = minutesUntil < 15; 
        const lateBy = isLate ? 15 - minutesUntil : 0;
        
        try {
            const motivation = await getTacticalMotivation(memberName, lateBy, "Muscle Gain");
            setAiMotivation(motivation);
            setLastAlertSent(new Date().toLocaleTimeString());
            
            // Audio Feedback (Voice Command)
            const utterance = new SpeechSynthesisUtterance(motivation);
            utterance.rate = 1.1;
            window.speechSynthesis.speak(utterance);

        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleMission = () => {
        if (isWorkoutActive) {
            setIsWorkoutActive(false);
            const actualMins = Math.floor(workoutTimer / 60);
            alert(`Mission Complete! Duration: ${actualMins}m. Neural Efficiency: ${Math.round(efficiencyScore)}%.`);
            setWorkoutTimer(0);
            setEfficiencyScore(100);
            setMatrixColor('bg-green-500');
        } else {
            setIsWorkoutActive(true);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header / Config */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-amber-400 flex items-center">
                        <TimeQuestIcon className="w-8 h-8 mr-3 text-cyan-400" />
                        Mission Control
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Neural Scheduling & Tactical Timing</p>
                </div>
                
                <div className="flex bg-gray-800 p-2 rounded-xl border border-gray-700 items-center gap-4">
                    <div>
                        <label className="block text-[10px] text-gray-500 uppercase font-bold">Shift Start</label>
                        <input 
                            type="time" 
                            value={targetTime} 
                            onChange={(e) => setTargetTime(e.target.value)} 
                            className="bg-transparent text-white font-mono font-bold text-lg outline-none w-24"
                        />
                    </div>
                    <div className="h-8 w-px bg-gray-600"></div>
                    <div>
                        <label className="block text-[10px] text-gray-500 uppercase font-bold">Mission Time</label>
                        <select 
                            value={durationGoal} 
                            onChange={(e) => setDurationGoal(Number(e.target.value))}
                            className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer"
                        >
                            <option value={30}>30 Mins</option>
                            <option value={45}>45 Mins</option>
                            <option value={60}>60 Mins</option>
                            <option value={90}>90 Mins</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. NEURAL SHIFT COUNTDOWN / MATRIX TIMER */}
                <Card className={`relative overflow-hidden border-2 transition-all duration-500 ${isWorkoutActive ? 'border-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.3)]' : status === 'late' ? 'border-red-500' : status === 'warning' ? 'border-amber-500' : 'border-cyan-500/50'}`}>
                    {/* Dynamic Background */}
                    <div className={`absolute inset-0 opacity-10 ${isWorkoutActive ? 'bg-amber-500' : 'bg-cyan-500'} animate-pulse`}></div>
                    
                    <div className="relative z-10 text-center py-10">
                        <p className="text-sm font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">
                            {isWorkoutActive ? 'MISSION CLOCK ACTIVE' : 'NEURAL SHIFT COUNTDOWN'}
                        </p>
                        
                        <div className="font-mono text-7xl md:text-8xl font-black text-white tracking-tighter mb-6 tabular-nums drop-shadow-2xl">
                            {isWorkoutActive ? formatTime(workoutTimer) : timeLeft}
                        </div>

                        {/* In-Session Matrix Bar */}
                        {isWorkoutActive && (
                            <div className="w-64 mx-auto h-3 bg-gray-900 rounded-full overflow-hidden mb-8 border border-gray-700">
                                <div 
                                    className={`h-full transition-all duration-1000 ${matrixColor}`} 
                                    style={{ width: `${Math.min(100, (workoutTimer / (durationGoal * 60)) * 100)}%` }}
                                ></div>
                            </div>
                        )}

                        {!isWorkoutActive && (
                            <div className="flex justify-center gap-3 mb-8">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border ${status === 'ontrack' ? 'bg-cyan-900/40 text-cyan-400 border-cyan-500/50' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>On Track</span>
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border ${status === 'warning' ? 'bg-amber-900/40 text-amber-400 border-amber-500/50 animate-pulse' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>Warning</span>
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border ${status === 'late' ? 'bg-red-900/40 text-red-400 border-red-500/50 animate-pulse' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>Critical</span>
                            </div>
                        )}

                        <button 
                            onClick={toggleMission}
                            className={`px-10 py-5 rounded-xl font-black uppercase tracking-widest text-sm shadow-2xl transition-all hover:scale-105 active:scale-95 ${
                                isWorkoutActive 
                                ? 'bg-red-600 hover:bg-red-500 text-white ring-4 ring-red-900/30' 
                                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white ring-4 ring-cyan-900/30'
                            }`}
                        >
                            {isWorkoutActive ? 'ABORT MISSION' : 'INITIATE SESSION'}
                        </button>
                    </div>
                </Card>

                {/* 2. PRODUCTIVITY METER & AI UPLINK */}
                <div className="space-y-6">
                    {/* Neural Efficiency Gauge */}
                    <Card className="bg-gray-900 border border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
                                <SpeedIcon className="w-5 h-5 mr-2 text-green-400" />
                                Neural Efficiency
                            </h3>
                            <span className="text-2xl font-black text-white">{Math.round(efficiencyScore)}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden mb-2">
                            <div 
                                className={`h-full transition-all duration-700 ${efficiencyScore > 80 ? 'bg-green-500' : efficiencyScore > 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                                style={{ width: `${efficiencyScore}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500 font-mono">
                            {isWorkoutActive ? "Tracking real-time intensity vs target time." : "System Idle. Start session to track."}
                        </p>
                    </Card>

                    {/* AI Motivation Uplink */}
                    <Card title="AI Motivation Uplink" className="bg-gray-800/50 border border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <div className={`p-2 rounded-full mr-3 ${reminderEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                                    <BellIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Tactical Alerts</p>
                                    <p className="text-xs text-gray-400">Auto-triggers if >5m late</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={reminderEnabled} onChange={e => setReminderEnabled(e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>

                        {aiMotivation && (
                            <div className="mb-4 p-4 bg-amber-900/20 border-l-4 border-amber-500 rounded-r-lg animate-fade-in">
                                <div className="flex items-start">
                                    <SparkleIcon className="w-5 h-5 text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-200 italic">"{aiMotivation}"</p>
                                        <p className="text-[10px] text-gray-500 mt-2 uppercase font-bold">Received at {lastAlertSent}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={handleTriggerUplink}
                            disabled={isGenerating}
                            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center text-xs uppercase tracking-wider"
                        >
                            {isGenerating ? <AutoUpdateIcon className="w-4 h-4 mr-2 animate-spin"/> : <BotIcon className="w-4 h-4 mr-2"/>}
                            {isGenerating ? 'ESTABLISHING UPLINK...' : 'REQUEST TACTICAL MOTIVATION'}
                        </button>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SmartScheduler;
