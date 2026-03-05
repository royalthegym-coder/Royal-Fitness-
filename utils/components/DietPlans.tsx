import React, { useState, useEffect, useRef, useMemo } from 'react';
import Card from './common/Card';
import { useData } from '../context/DataProvider';
import { 
    FlaskConical, Zap, Droplets, Utensils, 
    Camera, ShoppingBag, RefreshCw, ChefHat, 
    Activity, CheckCircle, Flame,
    TrendingUp, Info, Plus, Share2,
    FileText, Dumbbell, Binary, Cpu, Sparkles,
    Scan, ArrowRight, Save, Target, BrainCircuit, Database
} from 'lucide-react';
import { getAIChefRecipe, getNutritionAnalysisFromImage, cleanAndParseJSON, generateHyperPersonalizedDiet } from '../../lib/gemini';
import { useToast } from '../hooks/useToast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { BotIcon } from './icons/BotIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { StructuredDietPlan, AIRecommendation } from '../../types';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']; // Protein, Carbs, Fats, Other

// Mock Micronutrient Data
const MICRO_DATA = [
    { subject: 'Vit D3', A: 120, fullMark: 150 },
    { subject: 'Zinc', A: 98, fullMark: 150 },
    { subject: 'Magnesium', A: 86, fullMark: 150 },
    { subject: 'Iron', A: 99, fullMark: 150 },
    { subject: 'Omega-3', A: 85, fullMark: 150 },
    { subject: 'B12', A: 65, fullMark: 150 },
];

const FuelAlchemy: React.FC = () => {
    const { members, updateMember, liveHealthData, dailyRoutineLogs } = useData();
    const { addToast } = useToast();
    
    // Core State
    const [selectedId, setSelectedId] = useState<number | ''>(members[0]?.id || '');
    const [activeTab, setActiveTab] = useState<'matrix' | 'architect' | 'vision' | 'synthesis'>('matrix');
    
    // Architect State
    const [goal, setGoal] = useState('Muscle Gain');
    const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Pro Advance'>('Advanced');
    const [preferences, setPreferences] = useState('Balanced');
    const [allergies, setAllergies] = useState('None');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Vision AI
    const [scanImage, setScanImage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Chef AI
    const [chefInput, setChefInput] = useState('');
    const [isCooking, setIsCooking] = useState(false);
    const [recipe, setRecipe] = useState<any>(null);
    
    // Live Context
    const [hydration, setHydration] = useState(65);

    const member = useMemo(() => members.find(m => m.id === Number(selectedId)), [members, selectedId]);
    const activePlan = member?.approvedDietPlan;

    // --- METABOLIC MATRIX LOGIC (Live Adjustments) ---
    const adjustedMacros = useMemo(() => {
        if (!activePlan) return null;
        
        // Dynamic Adjustment Factors
        const stepFactor = Math.min(1.2, 1 + (liveHealthData.steps / 20000)); // Up to +20% calories
        const stressFactor = liveHealthData.heartRate.avg > 90 ? 0.9 : 1.0; // Reduce food if stressed (digestive load)
        
        const multiplier = stepFactor * stressFactor;

        return {
            calories: Math.round(activePlan.caloriesTarget * multiplier),
            protein: Math.round(activePlan.macrosTarget.protein), // Protein constant
            carbs: Math.round(activePlan.macrosTarget.carbs * multiplier), // Carbs fuel activity
            fat: Math.round(activePlan.macrosTarget.fats * stressFactor) // Fats sensitive to stress
        };
    }, [activePlan, liveHealthData]);

    const chartData = useMemo(() => {
        if (!adjustedMacros) return [];
        return [
            { name: 'Protein', value: adjustedMacros.protein },
            { name: 'Carbs', value: adjustedMacros.carbs },
            { name: 'Fats', value: adjustedMacros.fat },
        ];
    }, [adjustedMacros]);

    const metabolicState = useMemo(() => {
        const hr = liveHealthData.heartRate.avg;
        if (hr > 120) return { status: 'CATABOLIC (HIGH BURN)', color: 'text-red-500', icon: <Flame className="w-4 h-4"/> };
        if (hr > 90) return { status: 'METABOLIC FLUX', color: 'text-amber-400', icon: <Activity className="w-4 h-4"/> };
        return { status: 'ANABOLIC (REPAIR)', color: 'text-green-500', icon: <Zap className="w-4 h-4"/> };
    }, [liveHealthData]);

    // --- HANDLERS ---

    // AI Diet Validation Logic (Python to TypeScript conversion)
    const validateDiet = (aiDietJson: any, memberAllergies: string[]) => {
        if (!aiDietJson || !aiDietJson.meals || !memberAllergies || memberAllergies.length === 0) {
            return { isValid: true, message: "Safe Diet" };
        }
        
        const allergiesLower = memberAllergies.map(a => a.toLowerCase().trim());
        
        for (const meal of aiDietJson.meals) {
            if (!meal.items) continue;
            for (const item of meal.items) {
                const itemLower = item.toLowerCase();
                for (const allergy of allergiesLower) {
                    if (itemLower.includes(allergy)) {
                        return { isValid: false, message: `Alert: AI suggested ${item} which contains an allergy (${allergy})!` };
                    }
                }
            }
        }
        return { isValid: true, message: "Safe Diet" };
    };

    const handleGeneratePlan = async () => {
        if (!member) return;
        setIsGenerating(true);
        addToast("Neural Architect: Analyzing Bio-Markers...", "info");

        const profile = {
            name: member.name,
            stats: member.physical_metrics,
            goal: goal,
            level: level,
            preferences: preferences,
            allergies: allergies,
            live_data: { hrv: liveHealthData.heartRate.hrv, sleep: liveHealthData.sleep.totalHours }
        };

        try {
            const res = await generateHyperPersonalizedDiet(profile);
            const plan: StructuredDietPlan = cleanAndParseJSON(res);
            
            if (plan && plan.meals) {
                // Validate Diet against Allergies
                const allergyList = allergies.split(',').map(a => a.trim()).filter(a => a);
                const validation = validateDiet(plan, allergyList);
                
                if (!validation.isValid) {
                    addToast(validation.message, "error");
                    throw new Error("Diet validation failed due to allergies.");
                }

                // Ensure the plan has the correct structure before saving
                const structuredPlan: StructuredDietPlan = {
                    ...plan,
                    id: Date.now(),
                    level: level,
                    aiGenerated: true,
                    scientificNote: plan.scientificNote || "AI Generated Protocol"
                };
                updateMember({ ...member, approvedDietPlan: structuredPlan });
                addToast("Protocol Synthesized & Deployed.", "success");
                setActiveTab('matrix');
            } else {
                throw new Error("Invalid structure");
            }
        } catch (e: any) {
            console.error(e);
            if (e.message === "Diet validation failed due to allergies.") {
                addToast("Neural Link Failed: Allergy detected in AI suggestion. Please try again.", "error");
            } else {
                addToast("Neural Link Failed. Using fallback protocol.", "error");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleMealScan = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            setScanImage(event.target?.result as string);
            setIsScanning(true);
            const base64 = (event.target?.result as string).split(',')[1];
            
            try {
                const resJson = await getNutritionAnalysisFromImage(base64, file.type, goal);
                setScanResult(cleanAndParseJSON(resJson));
                addToast("Molecular Scan Complete.", "success");
            } catch (e) {
                addToast("Vision Sensor Offline.", "error");
            } finally {
                setIsScanning(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleChefRequest = async () => {
        if (!chefInput) return;
        setIsCooking(true);
        try {
            const res = await getAIChefRecipe(chefInput, goal);
            setRecipe(cleanAndParseJSON(res));
        } catch (e) {
            addToast("Synthesis Failed.", "error");
        } finally {
            setIsCooking(false);
        }
    };

    const handleShareList = () => {
        if (!member) return;
        const phone = `91${member.phone.replace(/\D/g, '')}`;
        const url = `https://wa.me/${phone}?text=Your%20Fuel%20Alchemy%20Shopping%20List%20is%20Ready!`;
        window.open(url, '_blank');
        addToast("List Transmitted via Neural Net (WhatsApp).", "success");
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            
            {/* 1. HEADER HUD */}
            <div className="bg-[#020308] p-10 rounded-[4rem] border border-emerald-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(16,185,129,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-15"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-emerald-600 text-black rounded-[3rem] shadow-[0_0_60px_rgba(16,185,129,0.5)] border border-emerald-400 group-hover:rotate-12 transition-transform duration-700">
                            <FlaskConical className="w-16 h-16" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-emerald-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Cpu className="w-3 h-3" /> Fuel Alchemy v31.0
                                </div>
                                <span className={`text-[10px] font-mono tracking-[0.4em] uppercase font-bold flex items-center gap-2 ${metabolicState.color}`}>
                                    {metabolicState.icon} {metabolicState.status}
                                </span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Fuel <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-600">Alchemy</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex gap-4">
                         <button 
                            onClick={() => addToast('Triggering N8N AI Diet Generator Workflow...', 'info')}
                            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
                        >
                            <SparkleIcon className="w-4 h-4 text-white" /> N8N AI Sync
                        </button>
                        <button 
                            onClick={() => addToast('Syncing advanced diet protocols to GitHub...', 'success')}
                            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-900 text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg hover:scale-105 transition-transform border border-gray-700"
                        >
                            <Database className="w-4 h-4 text-white" /> GitHub Backup
                        </button>
                    </div>

                    <div className="flex bg-gray-900/80 p-2 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl overflow-x-auto no-scrollbar max-w-full">
                        <button onClick={() => setActiveTab('matrix')} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'matrix' ? 'bg-emerald-500 text-black shadow-2xl' : 'text-gray-500 hover:text-white'}`}>
                            <Activity className="w-4 h-4"/> Matrix
                        </button>
                        <button onClick={() => setActiveTab('architect')} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'architect' ? 'bg-emerald-500 text-black shadow-2xl' : 'text-gray-500 hover:text-white'}`}>
                            <BotIcon className="w-4 h-4"/> Architect
                        </button>
                        <button onClick={() => setActiveTab('vision')} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'vision' ? 'bg-emerald-500 text-black shadow-2xl' : 'text-gray-500 hover:text-white'}`}>
                            <Scan className="w-4 h-4"/> Vision
                        </button>
                        <button onClick={() => setActiveTab('synthesis')} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'synthesis' ? 'bg-emerald-500 text-black shadow-2xl' : 'text-gray-500 hover:text-white'}`}>
                            <ChefHat className="w-4 h-4"/> Lab
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT: MEMBER & VITALS */}
                <div className="lg:col-span-4 space-y-6">
                    <Card title="Subject Selection" className="bg-gray-950 border-white/5 p-8 rounded-[3rem] shadow-2xl">
                         <div className="relative mb-6">
                             <select 
                                value={selectedId}
                                onChange={(e) => setSelectedId(Number(e.target.value))}
                                className="w-full bg-black border border-white/10 rounded-2xl p-5 text-white font-black italic outline-none focus:border-emerald-500 appearance-none shadow-inner"
                             >
                                 <option value="">-- SELECT BIO-NODE --</option>
                                 {members.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>)}
                             </select>
                             <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500">
                                 <Cpu className="w-5 h-5 animate-pulse" />
                             </div>
                         </div>
                         
                         {activePlan && (
                             <div className="space-y-4 animate-fade-in">
                                 <div className="p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-2xl">
                                     <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mb-1">Active Protocol</p>
                                     <p className="text-white font-bold">{activePlan.goal}</p>
                                 </div>
                                 <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-2xl">
                                     <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-1">Live Adjustment</p>
                                     <p className="text-white font-bold">{liveHealthData.steps > 10000 ? '+15% Calories (High Activity)' : 'Baseline Maintenance'}</p>
                                 </div>
                             </div>
                         )}
                    </Card>

                    <Card title="Hydration Core" className="bg-cyan-900/10 border-cyan-500/20 p-8 rounded-[3rem] relative overflow-hidden group">
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <p className="text-4xl font-black text-white italic">{hydration}%</p>
                                <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest">Cellular Saturation</p>
                            </div>
                            <button onClick={() => setHydration(Math.min(100, hydration + 10))} className="p-4 bg-cyan-600 rounded-full text-black hover:bg-cyan-400 transition-all shadow-lg active:scale-95">
                                <Plus className="w-6 h-6"/>
                            </button>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full bg-cyan-500/10 transition-all duration-1000" style={{ height: `${hydration}%` }}></div>
                    </Card>
                </div>

                {/* RIGHT: MAIN CONTENT */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* TAB 1: METABOLIC MATRIX */}
                    {activeTab === 'matrix' && (
                        <div className="space-y-6 animate-slide-up">
                            {activePlan ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card title="Live Fuel Gauge" className="bg-black border-white/5 p-8 rounded-[3rem]">
                                        <div className="h-64 w-full relative">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                                        {chartData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-3xl font-black text-white">{adjustedMacros?.calories}</span>
                                                <span className="text-[9px] text-gray-500 font-bold uppercase">KCAL Target</span>
                                            </div>
                                        </div>
                                        {activePlan.scientificNote && (
                                            <div className="mt-4 p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-2xl">
                                                <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mb-1">Scientific Strategy</p>
                                                <p className="text-[10px] text-gray-300 leading-relaxed">{activePlan.scientificNote}</p>
                                            </div>
                                        )}
                                    </Card>

                                    <div className="space-y-4">
                                        <div className="p-6 bg-gray-900 border border-white/5 rounded-[2.5rem]">
                                            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4">Daily Schedule ({activePlan.level})</h4>
                                            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                                                {activePlan.meals.map((meal: any, idx: number) => (
                                                    <div key={idx} className="flex flex-col p-3 bg-black/40 rounded-xl border border-white/5 gap-2 hover:bg-white/5 transition-colors">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <p className="text-[10px] text-emerald-400 font-bold uppercase">{meal.time}</p>
                                                                <p className="text-xs font-bold text-white">{meal.name}</p>
                                                            </div>
                                                            <span className="text-xs font-mono text-gray-500">{meal.calories || meal.totalCalories} kcal</span>
                                                        </div>
                                                        {meal.items && meal.items.length > 0 && (
                                                            <div className="text-[10px] text-gray-400 pl-2 border-l-2 border-emerald-500/30">
                                                                {meal.items.join(', ')}
                                                            </div>
                                                        )}
                                                        {meal.notes && (
                                                            <p className="text-[9px] text-gray-600 italic">{meal.notes}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <button onClick={handleShareList} className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-xl hover:bg-emerald-400 transition-all">
                                            <Share2 className="w-4 h-4"/> Beam to WhatsApp
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-96 flex flex-col items-center justify-center bg-gray-900/50 rounded-[3rem] border border-white/5">
                                    <BotIcon className="w-20 h-20 text-gray-700 mb-6" />
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">No Protocol Found</h3>
                                    <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">Use Architect to synthesize a plan.</p>
                                    <button onClick={() => setActiveTab('architect')} className="mt-6 text-emerald-400 hover:text-white font-bold underline decoration-dashed">Launch Architect</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: NEURAL ARCHITECT */}
                    {activeTab === 'architect' && (
                        <Card title="Protocol Architect" className="bg-gray-950 border-white/5 p-10 rounded-[3rem] shadow-2xl animate-scale-in">
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Primary Goal</label>
                                    <select value={goal} onChange={e => setGoal(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-emerald-500">
                                        <option>Muscle Gain</option><option>Fat Loss</option><option>Maintenance</option><option>Athletic Performance</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Protocol Level</label>
                                    <select value={level} onChange={e => setLevel(e.target.value as any)} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-emerald-500">
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                        <option value="Pro Advance">Pro Advance</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Preferences</label>
                                    <select value={preferences} onChange={e => setPreferences(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-emerald-500">
                                        <option>Balanced</option><option>Vegetarian</option><option>Vegan</option><option>Keto</option><option>Paleo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Constraints / Allergies</label>
                                    <input value={allergies} onChange={e => setAllergies(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-emerald-500" placeholder="e.g. Peanuts, Shellfish..." />
                                </div>
                            </div>
                            <button 
                                onClick={handleGeneratePlan}
                                disabled={isGenerating || !member}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-black py-5 rounded-3xl shadow-xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50"
                            >
                                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin"/> : <BrainCircuit className="w-4 h-4"/>}
                                {isGenerating ? 'Synthesizing Protocol...' : 'Execute Neural Design'}
                            </button>
                        </Card>
                    )}

                    {/* TAB 3: SOVEREIGN VISION */}
                    {activeTab === 'vision' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide-up">
                            <Card className="bg-black border-2 border-dashed border-emerald-500/30 p-10 rounded-[3rem] flex flex-col items-center justify-center text-center cursor-pointer hover:bg-emerald-900/10 transition-all group min-h-[400px]" onClick={() => fileInputRef.current?.click()}>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleMealScan} />
                                {scanImage ? (
                                    <img src={scanImage} className="w-full h-64 object-cover rounded-3xl shadow-2xl border border-white/10" alt="meal" />
                                ) : (
                                    <div className="w-32 h-32 bg-gray-900 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-2xl border-4 border-gray-800">
                                        <Camera className="w-12 h-12 text-emerald-500" />
                                    </div>
                                )}
                                <h3 className="text-2xl font-black text-white uppercase italic">Visual Sensor</h3>
                                <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">{isScanning ? 'Processing Molecular Structure...' : 'Tap to Scan Fuel Source'}</p>
                            </Card>

                            <Card title="Nutrient Matrix" className="bg-gray-900 border-white/5 p-8 rounded-[3rem]">
                                {scanResult ? (
                                    <div className="space-y-8 animate-fade-in">
                                        <div>
                                            <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{scanResult.foodName}</h4>
                                            <div className="h-1 w-24 bg-emerald-500 mt-2 rounded-full"></div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-black p-4 rounded-2xl border border-white/5 text-center">
                                                <p className="text-2xl font-black text-emerald-400 italic">{scanResult.macros?.protein}g</p>
                                                <p className="text-[8px] font-bold text-gray-500 uppercase">Protein</p>
                                            </div>
                                            <div className="bg-black p-4 rounded-2xl border border-white/5 text-center">
                                                <p className="text-2xl font-black text-blue-400 italic">{scanResult.macros?.carbs}g</p>
                                                <p className="text-[8px] font-bold text-gray-500 uppercase">Carbs</p>
                                            </div>
                                            <div className="bg-black p-4 rounded-2xl border border-white/5 text-center">
                                                <p className="text-2xl font-black text-amber-400 italic">{scanResult.macros?.fats}g</p>
                                                <p className="text-[8px] font-bold text-gray-500 uppercase">Fats</p>
                                            </div>
                                        </div>
                                        <div className="bg-emerald-900/20 p-4 rounded-2xl border border-emerald-500/20">
                                            <p className="text-emerald-200 text-sm italic leading-relaxed">"{scanResult.analysis}"</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                        <Scan className="w-16 h-16 text-gray-500 mb-4" />
                                        <p className="text-xs font-black uppercase tracking-widest">Awaiting Visual Input</p>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {/* TAB 4: SYNTHESIS LAB */}
                    {activeTab === 'synthesis' && (
                        <div className="space-y-6 animate-slide-up">
                            <Card title="Molecular Chef" className="bg-gray-950 border-white/5 p-8 rounded-[3rem]">
                                <div className="relative">
                                    <textarea 
                                        value={chefInput}
                                        onChange={(e) => setChefInput(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-2xl p-6 text-white text-sm focus:border-emerald-500 outline-none resize-none h-32 shadow-inner font-medium"
                                        placeholder="Enter available ingredients (e.g. Chicken, Rice, Broccoli)..."
                                    />
                                    <button 
                                        onClick={handleChefRequest}
                                        disabled={isCooking || !chefInput}
                                        className="absolute bottom-4 right-4 bg-emerald-600 hover:bg-emerald-500 text-black px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg disabled:opacity-50"
                                    >
                                        {isCooking ? 'Cooking...' : 'Synthesize'}
                                    </button>
                                </div>
                            </Card>

                            {recipe && (
                                <div className="bg-[#0c0c0c] border border-emerald-500/20 p-10 rounded-[3.5rem] relative overflow-hidden shadow-2xl animate-scale-in">
                                    <div className="absolute top-0 right-0 p-8 opacity-5"><Sparkles className="w-40 h-40 text-emerald-400" /></div>
                                    <div className="relative z-10">
                                        <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none">{recipe.title}</h3>
                                        <div className="inline-block bg-emerald-900/20 text-emerald-400 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest border border-emerald-500/30 mb-8">
                                            {recipe.macros}
                                        </div>
                                        <div className="space-y-4">
                                            {recipe.instructions.map((step: string, i: number) => (
                                                <div key={i} className="flex gap-4 items-start">
                                                    <span className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-emerald-500 border border-white/5 flex-shrink-0">{i+1}</span>
                                                    <p className="text-gray-300 text-sm leading-relaxed">{step}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default FuelAlchemy;