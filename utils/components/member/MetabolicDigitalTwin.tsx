import React, { useState } from 'react';
import { Activity, Zap, Flame, Droplets, AlertTriangle, Play, BrainCircuit, RefreshCw, ChevronRight, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { useToast } from '../../hooks/useToast';

interface SimulationScenario {
    id: string;
    name: string;
    type: 'Meal' | 'Supplement' | 'Activity';
    description: string;
    glycemicLoad: 'Low' | 'Medium' | 'High';
    chartData: any[];
    insights: {
        spike: string;
        crash: string;
        fatStorage: string;
        aiRecommendation: string;
    };
}

const SCENARIOS: SimulationScenario[] = [
    {
        id: 's1',
        name: 'Oats & Whey Protein',
        type: 'Meal',
        description: 'Standard pre-workout complex carb and fast protein.',
        glycemicLoad: 'Low',
        chartData: [
            { time: '0m', baseline: 90, predicted: 90 },
            { time: '30m', baseline: 90, predicted: 105 },
            { time: '60m', baseline: 90, predicted: 110 },
            { time: '90m', baseline: 90, predicted: 100 },
            { time: '120m', baseline: 90, predicted: 95 },
            { time: '150m', baseline: 90, predicted: 90 },
        ],
        insights: {
            spike: 'Minimal (+20 mg/dL)',
            crash: 'None. Sustained energy.',
            fatStorage: 'Very Low',
            aiRecommendation: 'Perfect for sustained energy. Optimal 60 mins before heavy lifting.'
        }
    },
    {
        id: 's2',
        name: 'Cheat Meal (Pizza & Cola)',
        type: 'Meal',
        description: 'High refined carb and sugar intake.',
        glycemicLoad: 'High',
        chartData: [
            { time: '0m', baseline: 90, predicted: 90 },
            { time: '30m', baseline: 90, predicted: 140 },
            { time: '60m', baseline: 90, predicted: 185 },
            { time: '90m', baseline: 90, predicted: 160 },
            { time: '120m', baseline: 90, predicted: 75 }, // Crash
            { time: '150m', baseline: 90, predicted: 80 },
        ],
        insights: {
            spike: 'Critical (+95 mg/dL)',
            crash: 'Severe at 120m (Reactive Hypoglycemia)',
            fatStorage: 'High (Insulin Surge)',
            aiRecommendation: 'Will cause severe lethargy post-meal. Suggest adding 15g fiber or a 10-min walk post-meal to blunt the spike.'
        }
    },
    {
        id: 's3',
        name: 'Rajasthani Thali (Heavy)',
        type: 'Meal',
        description: 'Traditional heavy meal with ghee, carbs, and moderate protein.',
        glycemicLoad: 'Medium',
        chartData: [
            { time: '0m', baseline: 90, predicted: 90 },
            { time: '30m', baseline: 90, predicted: 115 },
            { time: '60m', baseline: 90, predicted: 135 },
            { time: '90m', baseline: 90, predicted: 130 },
            { time: '120m', baseline: 90, predicted: 110 },
            { time: '150m', baseline: 90, predicted: 95 },
        ],
        insights: {
            spike: 'Moderate (+45 mg/dL)',
            crash: 'Mild. Slow digestion due to fats.',
            fatStorage: 'Moderate',
            aiRecommendation: 'High caloric density. Best consumed on rest days or 4 hours prior to training. Ghee slows down glucose absorption.'
        }
    }
];

export const MetabolicDigitalTwin: React.FC = () => {
    const { addToast } = useToast();
    const [selectedScenario, setSelectedScenario] = useState<SimulationScenario | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const handleSimulate = (scenario: SimulationScenario) => {
        setSelectedScenario(scenario);
        setShowResults(false);
        setIsSimulating(true);
        addToast("Initializing Digital Twin Simulation...", "info");

        setTimeout(() => {
            setIsSimulating(false);
            setShowResults(true);
            addToast("Simulation Complete. Bio-Response mapped.", "success");
        }, 2000);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
            {/* Header */}
            <div className="bg-gradient-to-br from-zinc-900 to-black p-8 md:p-12 rounded-[3rem] border border-white/5 relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <BrainCircuit className="w-3 h-3" /> Bio-Simulator Engine
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                            Metabolic <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Digital Twin</span>
                        </h1>
                        <p className="text-zinc-400 mt-4 max-w-xl text-sm leading-relaxed">
                            Test meals and activities on your digital clone before you consume them. The AI predicts glucose spikes, energy crashes, and fat storage based on your unique biology.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: Scenarios */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Select Scenario</h3>
                    
                    {SCENARIOS.map((scenario) => (
                        <div 
                            key={scenario.id}
                            onClick={() => handleSimulate(scenario)}
                            className={`p-5 rounded-3xl border cursor-pointer transition-all duration-300 group ${
                                selectedScenario?.id === scenario.id 
                                ? 'bg-purple-500/10 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)]' 
                                : 'bg-black/40 border-white/5 hover:border-white/10 hover:bg-white/5'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-white font-bold">{scenario.name}</h4>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                                    scenario.glycemicLoad === 'High' ? 'bg-red-500/10 text-red-400' :
                                    scenario.glycemicLoad === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                                    'bg-emerald-500/10 text-emerald-400'
                                }`}>
                                    GL: {scenario.glycemicLoad}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-500 mb-4">{scenario.description}</p>
                            <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-purple-400 group-hover:text-purple-300">
                                <Play className="w-3 h-3 mr-1" /> Run Simulation
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Panel: Simulation Results */}
                <div className="lg:col-span-2">
                    <div className="bg-[#050505] rounded-[3rem] border border-white/5 p-8 h-full relative overflow-hidden">
                        {!selectedScenario && !isSimulating && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
                                <BrainCircuit className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-sm font-mono uppercase tracking-widest">Awaiting Scenario Input</p>
                            </div>
                        )}

                        {isSimulating && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20 animate-fade-in">
                                <RefreshCw className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                                <h3 className="text-xl font-black text-white uppercase tracking-widest italic">Simulating Metabolism</h3>
                                <p className="text-purple-400 font-mono text-xs uppercase tracking-[0.3em] mt-2">Calculating Insulin Response...</p>
                            </div>
                        )}

                        {showResults && selectedScenario && (
                            <div className="animate-fade-in h-full flex flex-col">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                        Predicted <span className="text-purple-400">Response</span>
                                    </h3>
                                    <div className="flex gap-4 text-xs font-mono">
                                        <span className="flex items-center gap-2 text-zinc-400"><div className="w-2 h-2 rounded-full bg-zinc-600"></div> Baseline</span>
                                        <span className="flex items-center gap-2 text-purple-400"><div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]"></div> Predicted</span>
                                    </div>
                                </div>

                                {/* Chart */}
                                <div className="h-64 w-full mb-8">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={selectedScenario.chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                            <XAxis dataKey="time" stroke="#ffffff40" fontSize={10} tickMargin={10} />
                                            <YAxis stroke="#ffffff40" fontSize={10} domain={[60, 200]} tickFormatter={(val) => `${val}`} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#000', borderColor: '#a855f740', borderRadius: '1rem' }}
                                                itemStyle={{ color: '#fff', fontSize: '12px' }}
                                                labelStyle={{ color: '#a855f7', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                            />
                                            <ReferenceLine y={140} stroke="#ef444440" strokeDasharray="3 3" />
                                            <ReferenceLine y={70} stroke="#ef444440" strokeDasharray="3 3" />
                                            <Line type="monotone" dataKey="baseline" stroke="#52525b" strokeWidth={2} dot={false} />
                                            <Line type="monotone" dataKey="predicted" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, fill: '#a855f7', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#fff' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Insights Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                                        <Activity className="w-4 h-4 text-rose-500 mb-2" />
                                        <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Glucose Spike</p>
                                        <p className="text-sm font-bold text-white">{selectedScenario.insights.spike}</p>
                                    </div>
                                    <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                                        <Zap className="w-4 h-4 text-amber-500 mb-2" />
                                        <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Energy Crash</p>
                                        <p className="text-sm font-bold text-white">{selectedScenario.insights.crash}</p>
                                    </div>
                                    <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5 col-span-2 md:col-span-1">
                                        <Flame className="w-4 h-4 text-orange-500 mb-2" />
                                        <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Fat Storage Prob.</p>
                                        <p className="text-sm font-bold text-white">{selectedScenario.insights.fatStorage}</p>
                                    </div>
                                </div>

                                {/* AI Recommendation */}
                                <div className="bg-purple-500/10 border border-purple-500/30 p-5 rounded-2xl flex items-start gap-4 mt-auto">
                                    <div className="mt-1">
                                        <BrainCircuit className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Oracle Insight</h4>
                                        <p className="text-sm text-purple-100/80 leading-relaxed">{selectedScenario.insights.aiRecommendation}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
