
import React, { useState } from 'react';
import Card from './common/Card';
import { SparkleIcon } from './icons/SparkleIcon';
import { BotIcon } from './icons/BotIcon';
import { DietIcon } from './icons/NavIcons';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { useData } from '../../context/DataProvider';

// --- SUB-COMPONENT: Metabolic Sync ---
const MetabolicSync = () => {
    const [glucose, setGlucose] = useState(95);
    const [trend, setTrend] = useState<'Stable' | 'Spiking' | 'Dropping'>('Stable');

    // Simulate Live CGM
    React.useEffect(() => {
        const interval = setInterval(() => {
            const change = Math.floor(Math.random() * 10) - 4;
            setGlucose(prev => {
                const newVal = Math.max(70, Math.min(180, prev + change));
                if (newVal > prev + 3) setTrend('Spiking');
                else if (newVal < prev - 3) setTrend('Dropping');
                else setTrend('Stable');
                return newVal;
            });
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Chronobiology Calculation
    const now = new Date();
    const hours = now.getHours();
    let metabolicWindow = "Maintenance";
    let windowColor = "text-gray-400";
    
    if (hours >= 6 && hours < 10) { metabolicWindow = "Fat Oxidation (Peak)"; windowColor = "text-green-400"; }
    else if (hours >= 16 && hours < 20) { metabolicWindow = "Muscle Protein Synthesis (Peak)"; windowColor = "text-blue-400"; }
    else if (hours >= 22 || hours < 5) { metabolicWindow = "Rest & Repair"; windowColor = "text-purple-400"; }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card title="Live Metabolic Telemetry (CGM)" className="border-t-4 border-green-500">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Glucose Level</p>
                        <div className="flex items-baseline mt-1">
                            <span className={`text-5xl font-black ${glucose > 140 ? 'text-red-500' : 'text-green-400'}`}>
                                {glucose}
                            </span>
                            <span className="text-sm text-gray-500 ml-1">mg/dL</span>
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded text-xs font-bold uppercase ${trend === 'Spiking' ? 'bg-red-900/30 text-red-400' : 'bg-gray-800 text-gray-400'}`}>
                        {trend}
                    </div>
                </div>
                
                {/* Simulated Graph */}
                <div className="flex items-end justify-between h-24 gap-1">
                    {[...Array(20)].map((_, i) => {
                        const h = Math.max(10, Math.min(100, (glucose / 180) * 100 + (Math.random() * 20 - 10)));
                        return <div key={i} className={`w-full rounded-t-sm opacity-50 ${h > 70 ? 'bg-red-500' : 'bg-green-500'}`} style={{ height: `${h}%` }}></div>;
                    })}
                </div>
            </Card>

            <Card title="Chronobiology Engine" className="bg-gray-900 border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-900/20 rounded-full text-blue-400"><AutoUpdateIcon className="w-6 h-6"/></div>
                    <div>
                        <h4 className="font-bold text-white text-sm">Circadian Rhythm Sync</h4>
                        <p className="text-xs text-gray-400">Optimizing nutrient timing.</p>
                    </div>
                </div>
                
                <div className="bg-black/40 p-4 rounded-xl border border-gray-700">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Current Biological Window</p>
                    <p className={`text-xl font-black ${windowColor}`}>{metabolicWindow}</p>
                    <p className="text-xs text-gray-400 mt-2 italic">
                        "Your insulin sensitivity is high right now. Perfect time for complex carbs."
                    </p>
                </div>
            </Card>
        </div>
    );
};

const DietPlans: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'architect' | 'biosync'>('biosync');
    
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="relative rounded-3xl overflow-hidden bg-gray-900 border border-gray-700 shadow-2xl p-8">
                <div className="absolute inset-0 bg-gradient-to-r from-green-900/20 to-blue-900/20 z-0"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 flex items-center mb-2">
                        <DietIcon className="w-10 h-10 mr-3 text-green-400" />
                        Genius Nutrition Hub
                    </h1>
                    <p className="text-gray-400 max-w-xl">
                        AI-driven nutrition synced with your metabolic data.
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex space-x-1 bg-gray-800 p-1 rounded-xl w-fit border border-gray-700">
                <button onClick={() => setActiveTab('architect')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'architect' ? 'bg-green-600 text-white' : 'text-gray-400'}`}>Standard Plan</button>
                <button onClick={() => setActiveTab('biosync')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'biosync' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>Bio-Sync (Next Level)</button>
            </div>

            {activeTab === 'biosync' ? <MetabolicSync /> : <div className="text-center text-gray-500 py-10">Standard Diet Architect (See previous code)</div>}
        </div>
    );
};

export default DietPlans;
