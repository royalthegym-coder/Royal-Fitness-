
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../common/Card';
import { useData } from '../../context/DataProvider';
import { 
    ScanFace, Activity, TrendingUp, AlertTriangle, CheckCircle, 
    MessageSquare, Send, RefreshCw, Zap, User, Eye, 
    BrainCircuit, ShieldAlert, Video, Crosshair, BarChart3,
    Map, Grid, Radio, Layers, Target
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import Modal from '../common/Modal';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { getComplexResponse } from '../../../lib/gemini';
import { BotIcon } from '../icons/BotIcon';

// Mock Zones for Holographic Floor
const GYM_ZONES = [
    { id: 'rack', name: 'Squat Racks', risk: 65, active: 4 },
    { id: 'platform', name: 'Deadlift Zone', risk: 82, active: 2 },
    { id: 'bench', name: 'Bench Press', risk: 40, active: 6 },
    { id: 'dumbbells', name: 'Free Weights', risk: 30, active: 12 },
    { id: 'machines', name: 'Machines', risk: 10, active: 8 },
    { id: 'cardio', name: 'Cardio Deck', risk: 5, active: 15 },
];

const FutureOFSAdmin: React.FC = () => {
    const { ofsLogs = [], members, updateMember } = useData();
    const { addToast } = useToast();
    
    // UI State
    const [selectedNoteMember, setSelectedNoteMember] = useState<number | null>(null);
    const [noteText, setNoteText] = useState('');
    const [isPushing, setIsPushing] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [aiVerdict, setAiVerdict] = useState<string | null>(null);
    const [selectedZone, setSelectedZone] = useState<string>('platform');
    const [broadcastMsg, setBroadcastMsg] = useState('');
    
    // Live Feed Simulation
    const [activeCams, setActiveCams] = useState(3);
    const [liveLogs, setLiveLogs] = useState(ofsLogs);

    // --- 1. DATA PROCESSING ---
    const sortedLogs = useMemo(() => {
        return [...liveLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [liveLogs]);

    const averageScore = useMemo(() => {
        if (liveLogs.length === 0) return 0;
        const total = liveLogs.reduce((acc, log) => acc + log.formScore, 0);
        return (total / liveLogs.length).toFixed(1);
    }, [liveLogs]);

    const highRiskLogs = useMemo(() => sortedLogs.filter(l => l.formScore < 70), [sortedLogs]);
    const activeZoneData = GYM_ZONES.find(z => z.id === selectedZone);

    // --- 2. LIVE SIMULATION ---
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.7 && members.length > 0) {
                const member = members[Math.floor(Math.random() * members.length)];
                const exercises = ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press'];
                const newLog = {
                    id: `OFS-${Date.now()}`,
                    memberId: member.id,
                    memberName: member.name,
                    exercise: exercises[Math.floor(Math.random() * exercises.length)],
                    formScore: Math.floor(Math.random() * 40) + 60,
                    date: new Date().toISOString(),
                };
                setLiveLogs(prev => [newLog, ...prev].slice(0, 50));
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [members]);
    
    // --- 3. ACTIONS ---
    const handleSendNote = () => {
        if (!noteText || !selectedNoteMember) return;
        setIsPushing(true);
        const member = members.find(m => m.id === selectedNoteMember);
        if (!member) return;

        setTimeout(() => {
            const coachingNote = {
                id: `NOTE-${Date.now()}`,
                text: noteText,
                timestamp: new Date().toISOString(),
                isVoice: false
            };

            // This update is illustrative. In a real app, you'd handle array updates more robustly.
            updateMember({ ...member, coaching_notes: [...(member.coaching_notes || []), coachingNote] });
            
            addToast(`Coaching Directive sent to ${member.name}.`, "success");
            setIsPushing(false);
            setSelectedNoteMember(null);
            setNoteText('');
        }, 1500);
    };

    const handleRunAnalysis = async () => {
        setIsScanning(true);
        setAiVerdict(null);
        const summary = highRiskLogs.map(l => `${l.memberName} (${l.exercise}, Score: ${l.formScore})`).join(', ');
        const prompt = `
            ACT AS 'APEX BIOMECHANICS AI'. 
            High-risk gym members: ${summary}.
            Most common fault is ${highRiskLogs[0]?.exercise || 'Squat'}.
            Provide one critical, gym-wide coaching cue to broadcast that would help fix the most common issue. Be concise.
        `;
        try {
            const res = await getComplexResponse(prompt);
            setAiVerdict(res);
            setBroadcastMsg(res);
            addToast("Global Cue Synthesized.", "success");
        } catch (e) {
            addToast("AI Analysis Failed.", "error");
        } finally {
            setIsScanning(false);
        }
    };
    
    return (
        <div className="space-y-8 animate-fade-in pb-24">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <ScanFace className="w-8 h-8 text-amber-400"/> Future-OFS Command
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="md:col-span-1 bg-gray-900 border-white/5 p-6">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-2">Avg Form Score</p>
                    <p className="text-5xl font-black text-white italic">{averageScore}</p>
                </Card>
                <Card className="md:col-span-1 bg-gray-900 border-white/5 p-6">
                     <p className="text-xs text-gray-400 font-bold uppercase mb-2">Total Scans Today</p>
                    <p className="text-5xl font-black text-white italic">{liveLogs.length}</p>
                </Card>
                <Card className="md:col-span-1 bg-gray-900 border-white/5 p-6">
                     <p className="text-xs text-gray-400 font-bold uppercase mb-2">High-Risk Logs</p>
                    <p className="text-5xl font-black text-red-500 italic">{highRiskLogs.length}</p>
                </Card>
                <Card className="md:col-span-1 bg-gray-900 border-white/5 p-6">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-2">Active Cams</p>
                    <p className="text-5xl font-black text-cyan-400 italic">{activeCams}</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card title="Live Feed" className="h-[600px] flex flex-col p-0">
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
                            {sortedLogs.map(log => (
                                <div key={log.id} className="flex items-center justify-between bg-gray-900 p-4 rounded-xl border border-gray-800 group hover:bg-gray-800/50">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg ${log.formScore < 70 ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'}`}>
                                            {log.formScore < 70 ? <AlertTriangle className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{log.memberName} - <span className="text-gray-400">{log.exercise}</span></p>
                                            <p className="text-[10px] text-gray-500 font-mono">{new Date(log.date).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className={`text-2xl font-black italic ${log.formScore < 70 ? 'text-red-500' : 'text-green-400'}`}>{log.formScore}</p>
                                        <button onClick={() => setSelectedNoteMember(log.memberId)} className="p-2 bg-gray-800 rounded-lg text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MessageSquare className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card title="AI Analysis" className="bg-gray-900/50 border-cyan-500/20">
                         <div className="text-center">
                             <BotIcon className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                             <button onClick={handleRunAnalysis} disabled={isScanning} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                                 {isScanning ? <RefreshCw className="animate-spin w-4 h-4"/> : <Zap className="w-4 h-4"/>}
                                 {isScanning ? 'Analyzing...' : 'Run Analysis'}
                             </button>
                         </div>
                         {aiVerdict && (
                             <div className="mt-4 bg-cyan-900/20 p-4 rounded-lg border border-cyan-500/30">
                                 <p className="text-sm text-cyan-200 italic">"{aiVerdict}"</p>
                             </div>
                         )}
                    </Card>
                    <Card title="Holographic Floor Plan" className="h-fit">
                        <div className="relative aspect-square bg-black rounded-2xl border border-white/10 p-4 grid grid-cols-3 grid-rows-3 gap-2">
                             {GYM_ZONES.map(z => (
                                <div key={z.id} onClick={() => setSelectedZone(z.id)} className={`flex items-center justify-center rounded-lg cursor-pointer transition-all ${selectedZone === z.id ? 'ring-2 ring-cyan-500' : ''}`} style={{backgroundColor: `rgba(239, 68, 68, ${z.risk/100})`}}>
                                    <p className="text-[8px] font-black text-white uppercase text-center">{z.name}</p>
                                </div>
                             ))}
                        </div>
                        {activeZoneData && (
                            <div className="mt-4 bg-gray-900 p-4 rounded-xl">
                                <p className="text-xs font-bold text-white">{activeZoneData.name}</p>
                                <p className="text-red-500 text-2xl font-black italic">{activeZoneData.risk}% <span className="text-xs text-gray-400 not-italic">Risk</span></p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            <Modal isOpen={!!selectedNoteMember} onClose={() => setSelectedNoteMember(null)} title="Send Coaching Note">
                <div className="space-y-4">
                    <textarea value={noteText} onChange={e => setNoteText(e.target.value)} className="w-full bg-gray-800 p-3 rounded" rows={4} placeholder="e.g. 'Keep your chest up on squats'..." />
                    <button onClick={handleSendNote} disabled={isPushing} className="w-full bg-amber-500 text-black font-bold p-3 rounded flex items-center justify-center">
                        {isPushing ? <RefreshCw className="animate-spin"/> : <Send className="w-4 h-4 mr-2"/>}
                        Push to Member App
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default FutureOFSAdmin;
