import React, { useState, useMemo, useEffect } from 'react';
import Card from '../common/Card';
import { 
    ScanFace, RefreshCw, ShieldCheck, 
    BrainCircuit, Activity, MessageSquare, Play, Zap, FileText,
    CheckCircle, AlertTriangle, Layers, Target, ChevronRight
} from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import LiveTrainingHUD from './LiveTrainingHUD';
import { getComplexResponse, cleanAndParseJSON } from '../../../lib/gemini';
import { BotIcon } from '../icons/BotIcon';

// FIX: Define a strict type for muscle groups to ensure type safety.
type MuscleGroup = 'Legs' | 'Push' | 'Pull';

const FutureOFS: React.FC<{ memberId: number }> = ({ memberId }) => {
    const { members, liveHealthData, detailedWorkoutLogs } = useData();
    const { addToast } = useToast();
    
    // Core State Machine
    const [phase, setPhase] = useState<'Diagnostics' | 'CNS_Test' | 'Generating' | 'Ready' | 'Live'>('Diagnostics');
    
    // CNS Tap Test State
    const [tapCount, setTapCount] = useState(0);
    const [tapTimer, setTapTimer] = useState(5);
    const [isTapping, setIsTapping] = useState(false);
    const [cnsScore, setCnsScore] = useState<number | null>(null);

    // User Inputs & Context
    // FIX: Use the strict MuscleGroup type for state.
    const [targetMuscle, setTargetMuscle] = useState<MuscleGroup>('Legs');
    const [aiProtocol, setAiProtocol] = useState<any>(null);

    const member = members.find(m => m.id === memberId);
    
    // --- 1. RECOVERY HEATMAP LOGIC (Simulated from logs) ---
    const muscleStatus = useMemo(() => {
        // Simplified logic: Check if a major lift for a bodypart was done recently
        const hasRecent = (bodypart: string) => {
            return detailedWorkoutLogs.some(log => 
                log.memberId === memberId && 
                log.exerciseName.toLowerCase().includes(bodypart) &&
                (Date.now() - new Date(log.date).getTime()) < (1000 * 60 * 60 * 48) // Within 48h
            );
        };

        return {
            Legs: { recovery: hasRecent('squat') ? 45 : 95 },
            Push: { recovery: hasRecent('bench') ? 55 : 88 },
            Pull: { recovery: hasRecent('row') ? 60 : 92 },
        };
    }, [detailedWorkoutLogs, memberId]);

    // --- 2. CNS TAP TEST ENGINE ---
    useEffect(() => {
        let interval: any;
        if (isTapping && tapTimer > 0) {
            interval = setInterval(() => setTapTimer(prev => Math.max(0, prev - 0.1)), 100);
        } else if (isTapping && tapTimer <= 0) {
            finishTapTest();
        }
        return () => clearInterval(interval);
    }, [isTapping, tapTimer]);

    const handleTap = () => {
        if (!isTapping && tapTimer === 5) setIsTapping(true);
        if (tapTimer > 0) setTapCount(prev => prev + 1);
    };

    const finishTapTest = () => {
        setIsTapping(false);
        const calculatedScore = Math.min(100, Math.round((tapCount / 35) * 100));
        setCnsScore(calculatedScore);
        addToast(`Neural Benchmark: ${calculatedScore}%`, calculatedScore < 50 ? 'error' : 'success');
        setPhase('Generating'); 
        generateProtocol(calculatedScore);
    };

    // --- 3. AI PROTOCOL GENERATION ---
    const generateProtocol = async (cns: number) => {
        // FIX: Removed unnecessary type assertion as `targetMuscle` is now strongly typed.
        const recovery = muscleStatus[targetMuscle]?.recovery || 80;

        const prompt = `
            ACT AS FUTURE OFS COMMANDER.
            USER BIOMETRICS: CNS Score: ${cns}/100, Muscle Recovery: ${recovery}% (${targetMuscle})
            OUTPUT JSON: { "recommendation": "1 punchy command.", "targetRPE": number, "tempo": "e.g. 3-0-1-0", "focus": "Strength/Hypertrophy/Speed", "riskLevel": "Low/Medium/High" }
        `;

        try {
            const res = await getComplexResponse(prompt);
            const parsed = cleanAndParseJSON(res);
            setAiProtocol(parsed);
            setTimeout(() => setPhase('Ready'), 1500);
        } catch (e) {
            setAiProtocol({ recommendation: "Link Offline. Standard protocol engaged.", targetRPE: 8, tempo: "2-0-2-0", focus: "Standard", riskLevel: "Low" });
            setPhase('Ready');
        }
    };
    
    if (phase === 'Live') {
        return <LiveTrainingHUD exercise={targetMuscle} sets="5" memberId={memberId} onClose={() => setPhase('Diagnostics')} />;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">Future OFS</h1>
            
            {phase === 'Diagnostics' && (
                <Card title="Phase 1: Diagnostics">
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg">Select Target Muscle Group:</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {/* FIX: Use Object.keys with a type assertion to iterate safely and fix the 'unknown' type error on `data`. */}
                            {(Object.keys(muscleStatus) as MuscleGroup[]).map((muscle) => {
                                const data = muscleStatus[muscle];
                                return (
                                <button key={muscle} onClick={() => setTargetMuscle(muscle)} className={`p-4 rounded-lg border-2 ${targetMuscle === muscle ? 'border-cyan-500 bg-cyan-900/50' : 'border-gray-700'}`}>
                                    <p>{muscle}</p>
                                    <p className={data.recovery > 80 ? 'text-green-400' : 'text-amber-400'}>{data.recovery}% Recovered</p>
                                </button>
                                );
                            })}
                        </div>
                        <button onClick={() => setPhase('CNS_Test')} className="w-full bg-cyan-600 p-4 rounded-lg font-bold">Next: CNS Test</button>
                    </div>
                </Card>
            )}
            
            {phase === 'CNS_Test' && (
                <Card title="Phase 2: CNS Benchmark">
                    <div className="text-center">
                        <p className="text-5xl font-mono">{tapTimer.toFixed(1)}s</p>
                        <button onMouseDown={handleTap} onTouchStart={e => {e.preventDefault(); handleTap()}} className="my-4 w-full bg-cyan-600 active:bg-cyan-400 text-white font-black py-8 rounded-lg text-2xl">
                            TAP FAST! ({tapCount})
                        </button>
                        <p className="text-sm text-gray-400">Rapidly tap to measure CNS fatigue.</p>
                    </div>
                </Card>
            )}

            {phase === 'Generating' && (
                <Card className="text-center py-20">
                    <RefreshCw className="w-16 h-16 text-cyan-500 animate-spin mx-auto mb-4" />
                    <h3 className="text-xl font-bold">Generating Protocol...</h3>
                </Card>
            )}

            {phase === 'Ready' && aiProtocol && (
                <Card title="Phase 3: Protocol Ready">
                    <div className="space-y-4 text-center">
                        <BotIcon className="w-12 h-12 text-cyan-400 mx-auto" />
                        <p className="text-lg italic text-cyan-200">"{aiProtocol.recommendation}"</p>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <p className="text-xs text-gray-400">Target RPE</p>
                                <p className="text-2xl font-bold">{aiProtocol.targetRPE}</p>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <p className="text-xs text-gray-400">Tempo</p>
                                <p className="text-2xl font-bold">{aiProtocol.tempo}</p>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <p className="text-xs text-gray-400">Risk</p>
                                <p className={`text-2xl font-bold ${aiProtocol.riskLevel === 'Low' ? 'text-green-400' : 'text-red-400'}`}>{aiProtocol.riskLevel}</p>
                            </div>
                        </div>
                        <button onClick={() => setPhase('Live')} className="w-full bg-green-600 p-4 rounded-lg font-bold text-lg flex items-center justify-center">
                            <Play className="w-5 h-5 mr-2 fill-current"/> Initialize Live Mirror
                        </button>
                    </div>
                </Card>
            )}

        </div>
    );
};

export default FutureOFS;
