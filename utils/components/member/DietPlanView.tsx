
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Card from '../common/Card';
import { useData } from '../../context/DataProvider';
import { 
    FlaskConical, Zap, Droplets, Utensils, 
    Camera, ShoppingBag, RefreshCw, ChefHat, 
    Activity, CheckCircle, Flame,
    TrendingUp, Info, Plus, Share2,
    FileText, Dumbbell, Binary, Cpu, Sparkles,
    Scan, ArrowRight
} from 'lucide-react';
import { getAIChefRecipe, getNutritionAnalysisFromImage, cleanAndParseJSON } from '../../../lib/gemini';
import { useToast } from '../../hooks/useToast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { BotIcon } from '../icons/BotIcon';
import { generateDietPDF } from '../../pdfGenerator';
import { Download } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b']; // Carbs, Protein, Fat

// Mock Micronutrient Data for Radar Chart
const MICRO_DATA = [
    { subject: 'Vit D3', A: 120, fullMark: 150 },
    { subject: 'Zinc', A: 98, fullMark: 150 },
    { subject: 'Magnesium', A: 86, fullMark: 150 },
    { subject: 'Iron', A: 99, fullMark: 150 },
    { subject: 'Omega-3', A: 85, fullMark: 150 },
    { subject: 'B12', A: 65, fullMark: 150 },
];

const NutriSyncGodTier: React.FC<{ memberId: number }> = ({ memberId }) => {
    const { members, liveHealthData, addRoutineLog, dailyRoutineLogs } = useData();
    const { addToast } = useToast();
    const member = members.find(m => m.id === memberId);
    
    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'matrix' | 'scanner' | 'kitchen' | 'grocery'>('matrix');
    
    // Vision AI
    const [scanImage, setScanImage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Chef AI
    const [chefInput, setChefInput] = useState('');
    const [isCooking, setIsCooking] = useState(false);
    const [recipe, setRecipe] = useState<any>(null);
    
    // Hydration
    const [hydration, setHydration] = useState(45);
    
    // Tracked Meals (Local state for immediate feedback, synced with logs)
    const [consumedMeals, setConsumedMeals] = useState<Set<string>>(new Set());

    // Sync consumed meals from daily logs
    useEffect(() => {
        const consumed = new Set<string>();
        dailyRoutineLogs.forEach(log => {
            if (log.member_id === memberId && log.task_type === 'Meal' && log.is_done) {
                // Try to match meal name from log description
                const mealName = log.task_desc.split(':')[1]?.split('(')[0]?.trim();
                if (mealName) consumed.add(mealName);
            }
        });
        // We use a simpler index-based tracking for the UI session
    }, [dailyRoutineLogs, memberId]);

    // --- LOGIC ---
    const activePlan = member?.approvedDietPlan;

    // Adjusted Macros based on Live Health Data (Metabolic Matrix)
    const adjustedMacros = useMemo(() => {
        if (!activePlan) return null;
        // If user is very active today (>10k steps or high HR), increase calories dynamically
        const activityMultiplier = (liveHealthData.steps > 10000 || liveHealthData.caloriesBurned > 600) ? 1.15 : 1.0;
        
        return {
            calories: Math.round(activePlan.caloriesTarget * activityMultiplier),
            protein: activePlan.macrosTarget.protein,
            carbs: Math.round(activePlan.macrosTarget.carbs * activityMultiplier), // Carbs fuel activity
            fat: activePlan.macrosTarget.fats
        };
    }, [activePlan, liveHealthData]);

    const metabolicState = useMemo(() => {
        const hr = liveHealthData.heartRate.avg;
        if (hr > 120) return { status: 'Catabolic (Burn)', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: <Flame className="w-4 h-4"/> };
        if (hr > 90) return { status: 'Metabolic Flux', color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: <Activity className="w-4 h-4"/> };
        return { status: 'Anabolic (Repair)', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: <Zap className="w-4 h-4"/> };
    }, [liveHealthData]);

    // --- HANDLERS ---

    const handleMealScan = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = (event.target?.result as string).split(',')[1];
            setScanImage(event.target?.result as string);
            setIsScanning(true);
            addToast("Sovereign Vision: Analyzing Molecular Density...", "info");
            
            try {
                const resJson = await getNutritionAnalysisFromImage(base64, file.type, activePlan?.goal || "Health");
                const result = cleanAndParseJSON(resJson);
                setScanResult(result);
                addToast("Food Matrix Verified.", "success");
            } catch (err) {
                addToast("Visual Uplink Failed. Try again.", "error");
            } finally {
                setIsScanning(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleLogScannedMeal = () => {
        if (!scanResult || !member) return;
        addRoutineLog({
            log_id: `SCAN_${Date.now()}`,
            member_id: member.id,
            task_type: 'Meal',
            task_desc: `Scanned: ${scanResult.foodName} (~${scanResult.macros?.protein * 4 + scanResult.macros?.carbs * 4 + scanResult.macros?.fats * 9} kcal)`,
            task_time: new Date().toLocaleTimeString(),
            is_done: true
        });
        addToast("Scanned Meal Logged to Core.", "success");
        setScanImage(null);
        setScanResult(null);
        setActiveTab('matrix');
    };

    const handleChefRequest = async () => {
        if (!chefInput.trim()) return;
        setIsCooking(true);
        try {
            const res = await getAIChefRecipe(chefInput, activePlan?.goal || "Hypertrophy");
            const recipeData = cleanAndParseJSON(res);
            setRecipe(recipeData);
        } catch (e) {
            addToast("Chef Neural Link Error.", "error");
        } finally {
            setIsCooking(false);
        }
    };

    const toggleHydration = () => {
        setHydration(prev => {
            const next = prev + 10;
            if(next > 100) return 0;
            return next;
        });
        addToast("Fluid Intake Logged. Cellular Hydration Updated.", "success");
    };

    const handleLogMeal = (mealName: string, cals: number, index: number) => {
        if (!member) return;
        if (consumedMeals.has(index.toString())) return;

        addRoutineLog({
            log_id: `MEAL_${Date.now()}`,
            member_id: member.id,
            task_type: 'Meal',
            task_desc: `Consumed: ${mealName} (${cals} kcal)`,
            task_time: new Date().toLocaleTimeString(),
            is_done: true
        });
        
        setConsumedMeals(prev => new Set(prev).add(index.toString()));
        addToast(`Metabolic Fuel Injected: ${mealName}`, "success");
    };

    const chartData = [
        { name: 'Carbs', value: adjustedMacros?.carbs || 40 },
        { name: 'Protein', value: adjustedMacros?.protein || 30 },
        { name: 'Fat', value: adjustedMacros?.fat || 30 },
    ];

    if (!member) return <div className="text-center p-10">Select a member to view Nutri-Sync.</div>;

    return (
        <div className="space-y-8 animate-fade-in pb-32">
            {/* HEADER */}
            <div className="bg-[#020308] p-10 rounded-[4rem] border border-emerald-500/30 relative overflow-hidden shadow-[0_0_120px_rgba(16,185,129,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-emerald-600 text-white rounded-[3rem] shadow-[0_0_60px_rgba(16,185,129,0.5)] border border-emerald-400 group-hover:rotate-12 transition-transform duration-700">
                            <FlaskConical className="w-16 h-16" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-emerald-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                                    Nutri-Sync v31.0
                                </div>
                                <span className={`text-[10px] font-mono tracking-[0.4em] uppercase font-bold flex items-center gap-2 ${metabolicState.color}`}>
                                    {metabolicState.icon} STATE: {metabolicState.status.toUpperCase()}
                                </span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Apex <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-600">Continuum</span>
                            </h1>
                            <p className="text-gray-400 text-sm mt-2 font-mono uppercase tracking-[0.2em]">
                                Metabolic Matrix // {activePlan?.goal || 'Maintenance'}
                            </p>
                        </div>
                    </div>
                    
                    {/* PDF Download Button */}
                    <button 
                        onClick={() => {
                            if (activePlan) {
                                generateDietPDF(activePlan, member);
                                addToast('PDF Downloaded Successfully', 'success');
                            } else {
                                addToast('No active diet plan found.', 'error');
                            }
                        }}
                        className="mt-6 md:mt-0 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 border border-white/20 backdrop-blur-md transition-all active:scale-95"
                    >
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                </div>
                
                <div className="mt-8 flex bg-gray-900/80 p-2 rounded-3xl border border-white/10 backdrop-blur-3xl overflow-x-auto no-scrollbar max-w-full">
                    <button onClick={() => setActiveTab('matrix')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'matrix' ? 'bg-emerald-500 text-black shadow-2xl' : 'text-gray-500 hover:text-white'}`}>Metabolic Matrix</button>
                    <button onClick={() => setActiveTab('scanner')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'scanner' ? 'bg-emerald-500 text-black shadow-2xl' : 'text-gray-500 hover:text-white'}`}>Vision AI</button>
                    <button onClick={() => setActiveTab('kitchen')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'kitchen' ? 'bg-emerald-500 text-black shadow-2xl' : 'text-gray-500 hover:text-white'}`}>Smart Chef</button>
                    <button onClick={() => setActiveTab('grocery')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'grocery' ? 'bg-emerald-500 text-black shadow-2xl' : 'text-gray-500 hover:text-white'}`}>Auto-Procure</button>
                </div>
            </div>

            {/* CONTENT */}
            {activeTab === 'matrix' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT: HUD */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card title="Metabolic Engine" className="bg-gray-950 border-white/5 p-8 rounded-[3.5rem] relative overflow-hidden group shadow-2xl">
                             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-45 transition-transform"><Cpu className="w-20 h-20" /></div>
                             
                             {activePlan ? (
                                <div className="space-y-8 animate-fade-in">
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4">Live Caloric Target</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-7xl font-black text-white italic tracking-tighter leading-none">{adjustedMacros?.calories}</p>
                                            <span className="text-xs text-gray-500 font-bold uppercase">KCAL</span>
                                        </div>
                                        
                                        <div className={`mt-4 p-4 rounded-2xl border flex items-center gap-3 ${metabolicState.bg} ${metabolicState.color.replace('text', 'border')}/30`}>
                                            {metabolicState.icon}
                                            <p className={`text-[10px] font-mono font-bold uppercase tracking-widest ${metabolicState.color}`}>
                                                State: {metabolicState.status}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="h-[200px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                                    {chartData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '15px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="flex justify-center gap-4 text-[9px] font-bold text-gray-500 uppercase mt-2">
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Protein</span>
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Carbs</span>
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Fats</span>
                                        </div>
                                    </div>
                                </div>
                             ) : (
                                 <div className="h-64 flex flex-col items-center justify-center text-center opacity-40">
                                     <BotIcon className="w-16 h-16 mb-4 text-gray-600" />
                                     <p className="text-xs uppercase font-black tracking-widest">Awaiting Admin Protocol</p>
                                     <p className="text-[10px] text-gray-500 mt-2">No Approved Plan Found</p>
                                 </div>
                             )}
                        </Card>

                        <div className="bg-cyan-900/10 border border-cyan-500/30 p-8 rounded-[3rem] relative overflow-hidden shadow-xl cursor-pointer hover:border-cyan-500/50 transition-all group" onClick={toggleHydration}>
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                        <Droplets className="w-4 h-4" /> Hydration Core
                                    </p>
                                    <p className="text-4xl font-black text-white italic">{hydration}%</p>
                                    <p className="text-[9px] text-cyan-500/60 font-mono mt-1">Tap to Log +250ml</p>
                                </div>
                                <div className="w-12 h-12 rounded-full border-2 border-cyan-500/50 flex items-center justify-center hover:bg-cyan-500/20 transition-all group-hover:scale-110">
                                    <Plus className="w-6 h-6 text-cyan-400" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full bg-cyan-500/20 transition-all duration-1000 ease-in-out" style={{ height: `${hydration}%` }}>
                                <div className="absolute top-0 left-0 w-full h-2 bg-cyan-400 blur-md opacity-50 animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: MEALS & MICROS */}
                    <div className="lg:col-span-8 space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[350px]">
                              <Card title="Bio-Shield (Micros)" className="bg-black/60 border-white/5 p-8 rounded-[3rem]">
                                 <div className="h-full w-full">
                                     <ResponsiveContainer width="100%" height="100%">
                                         <RadarChart cx="50%" cy="50%" outerRadius="70%" data={MICRO_DATA}>
                                             <PolarGrid stroke="#333" />
                                             <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontWeight: 'bold' }} />
                                             <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} />
                                             <Radar name="Level" dataKey="A" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf6" fillOpacity={0.4} />
                                             <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '15px' }} />
                                         </RadarChart>
                                     </ResponsiveContainer>
                                 </div>
                             </Card>
                             
                             <Card title="Plan Info" className="bg-gray-900 border-white/5 p-8 rounded-[3rem] flex flex-col justify-center">
                                 {activePlan ? (
                                     <div className="space-y-4">
                                         <div>
                                             <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Goal</p>
                                             <p className="text-xl text-white font-bold">{activePlan.goal}</p>
                                         </div>
                                         <div>
                                             <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Notes</p>
                                             <p className="text-sm text-gray-400 italic">"{activePlan.scienceNote || 'Focus on nutrient timing.'}"</p>
                                         </div>
                                     </div>
                                 ) : (
                                     <p className="text-gray-500 text-xs text-center">No plan details.</p>
                                 )}
                             </Card>
                         </div>

                         {activePlan && activePlan.meals && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activePlan.meals.map((meal, idx) => (
                                    <div key={idx} className={`bg-[#0c0c0c] p-6 rounded-[2.5rem] border hover:border-emerald-500/30 transition-all group relative overflow-hidden ${consumedMeals.has(idx.toString()) ? 'border-emerald-500/50 opacity-60 grayscale' : 'border-white/5'}`}>
                                        <div className="absolute top-0 right-0 p-4 opacity-5"><Utensils className="w-16 h-16 text-white" /></div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className={`text-[10px] font-black px-3 py-0.5 rounded ${meal.name.includes('Pre') || meal.name.includes('Post') ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-black'}`}>{meal.time}</span>
                                                <span className="text-green-400 font-mono text-xs font-bold">{meal.totalCalories} kcal</span>
                                            </div>
                                            <h3 className="text-xl font-black text-white italic uppercase tracking-tight mb-2">{meal.name}</h3>
                                            <p className="text-xs text-gray-400 line-clamp-2 mb-4">{meal.items.map(i => i.food).join(', ')}</p>
                                            
                                            {meal.name.includes('Pre') && (
                                                <div className="flex items-center gap-2 text-[9px] font-black text-amber-500 uppercase tracking-widest border-t border-white/5 pt-2">
                                                    <Dumbbell className="w-3 h-3"/> Fuel for Lift
                                                </div>
                                            )}
                                            {meal.name.includes('Post') && (
                                                <div className="flex items-center gap-2 text-[9px] font-black text-blue-400 uppercase tracking-widest border-t border-white/5 pt-2">
                                                    <Activity className="w-3 h-3"/> Recovery (Glycogen)
                                                </div>
                                            )}
                                            
                                            <button 
                                                onClick={() => handleLogMeal(meal.name, meal.totalCalories, idx)}
                                                disabled={consumedMeals.has(idx.toString())}
                                                className={`w-full mt-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                                    consumedMeals.has(idx.toString())
                                                    ? 'bg-green-900/20 text-green-500 cursor-default'
                                                    : 'bg-white/5 hover:bg-emerald-600 hover:text-black text-white'
                                                }`}
                                            >
                                                {consumedMeals.has(idx.toString()) ? <CheckCircle className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
                                                {consumedMeals.has(idx.toString()) ? 'CONSUMED' : 'LOG MEAL'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {activeTab === 'scanner' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide-up">
                    <Card className="bg-black border-2 border-dashed border-emerald-500/30 p-12 flex flex-col items-center justify-center text-center rounded-[4rem] group hover:bg-emerald-950/10 transition-all cursor-pointer min-h-[500px] relative overflow-hidden" onClick={() => fileInputRef.current?.click()}>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-noise.png')] opacity-10 pointer-events-none"></div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleMealScan} />
                        {scanImage ? (
                            <div className="w-full h-80 bg-emerald-900/20 rounded-[3rem] shadow-2xl border border-emerald-500/30 flex items-center justify-center">
                                <div className="text-center">
                                    <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                                    <p className="text-emerald-400 font-black uppercase tracking-widest">Image Captured</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="w-32 h-32 bg-gray-900 rounded-full flex items-center justify-center mb-8 shadow-2xl group-hover:scale-110 transition-transform relative">
                                    <Camera className="w-12 h-12 text-emerald-500" />
                                    <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full animate-ping"></div>
                                </div>
                                <h3 className="text-3xl font-black text-white uppercase italic">Sovereign Vision</h3>
                                <p className="text-gray-500 text-sm mt-3 font-medium uppercase tracking-widest">Snap to Analyze Molecular Density</p>
                            </>
                        )}
                        {isScanning && (
                            <div className="absolute inset-0 bg-black/80 rounded-[4rem] flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                                <Scan className="w-20 h-20 text-emerald-400 animate-spin-slow mb-4" />
                                <p className="text-emerald-400 font-black uppercase tracking-widest animate-pulse">Scanning Bio-Matrix...</p>
                            </div>
                        )}
                    </Card>

                    <Card className="bg-gray-950 border-white/10 p-10 rounded-[4rem] flex flex-col justify-center relative overflow-hidden shadow-2xl min-h-[500px]">
                         <div className="absolute top-0 right-0 p-10 opacity-5"><Binary className="w-40 h-40 text-white" /></div>
                         {scanResult ? (
                             <div className="space-y-10 relative z-10 animate-scale-in">
                                 <div>
                                     <h4 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">{scanResult.foodName}</h4>
                                     <div className="h-1 w-24 bg-emerald-500 mt-4 rounded-full"></div>
                                 </div>
                                 <div className="grid grid-cols-3 gap-6">
                                     <div className="text-center p-6 bg-black rounded-3xl border border-white/5 shadow-inner">
                                         <p className="text-3xl font-black text-emerald-400 italic">{scanResult.macros?.protein}g</p>
                                         <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-2">Protein</p>
                                     </div>
                                     <div className="text-center p-6 bg-black rounded-3xl border border-white/5 shadow-inner">
                                         <p className="text-3xl font-black text-cyan-400 italic">{scanResult.macros?.carbs}g</p>
                                         <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-2">Carbs</p>
                                     </div>
                                     <div className="text-center p-6 bg-black rounded-3xl border border-white/5 shadow-inner">
                                         <p className="text-3xl font-black text-amber-400 italic">{scanResult.macros?.fats}g</p>
                                         <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-2">Fat</p>
                                     </div>
                                 </div>
                                 <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/30">
                                     <p className="text-emerald-200 text-sm italic leading-relaxed">"{scanResult.analysis}"</p>
                                 </div>
                                 <button onClick={handleLogScannedMeal} className="w-full py-4 bg-emerald-600 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-500 transition-all">
                                     Log to Daily Protocol
                                 </button>
                             </div>
                         ) : (
                             <div className="text-center opacity-30">
                                 <Activity className="w-20 h-20 mx-auto mb-6 text-gray-700" />
                                 <p className="text-lg font-black uppercase tracking-[0.4em] text-gray-600">Awaiting Optical Input</p>
                             </div>
                         )}
                    </Card>
                </div>
            )}
            
            {activeTab === 'kitchen' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
                    <Card title="Synthesis Lab" className="bg-gray-950 border-white/5 p-10 rounded-[4rem] shadow-2xl">
                        <textarea 
                            className="w-full bg-black border border-white/10 rounded-3xl p-8 text-white text-xl font-medium outline-none focus:border-emerald-500 h-48 resize-none shadow-inner mb-8"
                            placeholder="Eggs, Chicken, Broccoli, Rice..."
                            value={chefInput}
                            onChange={(e) => setChefInput(e.target.value)}
                        />
                        <button 
                            onClick={handleChefRequest}
                            disabled={isCooking || !chefInput}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-sm active:scale-95 disabled:opacity-50"
                        >
                            {isCooking ? <RefreshCw className="animate-spin" /> : <ChefHat className="w-6 h-6" />}
                            {isCooking ? 'FORMULATING RECIPE...' : 'INVENT HIGH-YIELD MEAL'}
                        </button>
                    </Card>

                    {recipe && (
                        <Card className="bg-[#050505] border-emerald-500/20 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Sparkles className="w-48 h-48 text-emerald-400" /></div>
                             <div className="relative z-10">
                                 <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none">{recipe.title}</h3>
                                 <div className="bg-emerald-900/20 text-emerald-400 px-6 py-2 rounded-full inline-block font-black text-xs uppercase tracking-widest mb-10 border border-emerald-500/30">{recipe.macros}</div>
                                 <div className="space-y-6">
                                     {recipe.instructions.map((step: string, i: number) => (
                                         <div key={i} className="flex gap-6 items-start group">
                                             <span className="w-8 h-8 rounded-xl bg-gray-900 border border-white/10 flex items-center justify-center font-mono text-xs text-gray-500 group-hover:bg-emerald-600 group-hover:text-black transition-all">{i+1}</span>
                                             <p className="text-gray-300 text-lg leading-relaxed italic">{step}</p>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                        </Card>
                    )}
                </div>
            )}

            {activeTab === 'grocery' && activePlan && (
                <div className="lg:col-span-12 animate-slide-up">
                    <Card title="Auto-Procurement List" className="bg-gray-950 border-white/5 p-10 rounded-[4rem] shadow-2xl">
                         <div className="space-y-8">
                             <div className="flex justify-between items-center border-b border-white/10 pb-6">
                                 <div>
                                     <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Supply Manifest</h3>
                                     <p className="text-xs text-gray-500 font-mono mt-1">Generated from: {activePlan.goal}</p>
                                 </div>
                                 <button className="bg-[#25D366] text-black font-black px-6 py-3 rounded-2xl flex items-center gap-2 uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-lg">
                                     <Share2 className="w-4 h-4"/> WhatsApp
                                 </button>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                 {activePlan.meals && Array.isArray(activePlan.meals) ? activePlan.meals.flatMap(m => m.items).map((item, i) => (
                                     <div key={i} className="flex items-center gap-4 p-5 bg-black/40 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer group">
                                         <div className="w-6 h-6 rounded-lg border-2 border-gray-700 group-hover:border-emerald-500 group-hover:bg-emerald-500/20 transition-all"></div>
                                         <div>
                                             <p className="text-white font-bold text-sm">{item.food}</p>
                                             <p className="text-[10px] text-gray-500 font-mono">Qty: {item.portion}</p>
                                         </div>
                                     </div>
                                 )) : <p>No meals generated.</p>}
                             </div>
                         </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default NutriSyncGodTier;
