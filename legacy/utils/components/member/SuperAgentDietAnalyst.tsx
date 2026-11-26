
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Card from '../common/Card';
import { useData } from '../../context/DataProvider';
import { 
    FlaskConical, Zap, Droplets, Utensils, 
    Camera, ShoppingBag, RefreshCw, ChefHat, 
    Activity, CheckCircle, Flame,
    TrendingUp, Info, Plus, Share2,
    FileText, Dumbbell, Binary, Cpu, Sparkles,
    Scan, ArrowRight, ShoppingCart, BrainCircuit
} from 'lucide-react';
import { getAIChefRecipe, getNutritionAnalysisFromImage, cleanAndParseJSON, getComplexResponse } from '../../../lib/core_ai';
import { useToast } from '../../hooks/useToast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Apple, Pill, Watch, HeartPulse, Moon, ShieldCheck, Fingerprint, Stethoscope, ChevronRight } from 'lucide-react';
import { BotIcon } from '../icons/BotIcon';
import { generateDietPDF } from '../../pdfGenerator';
import { Download } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b']; // Carbs, Protein, Fat

// Micronutrient Data for Radar Chart
const MICRO_DATA = [
    { subject: 'Vit D3', A: 120, fullMark: 150 },
    { subject: 'Zinc', A: 98, fullMark: 150 },
    { subject: 'Magnesium', A: 86, fullMark: 150 },
    { subject: 'Iron', A: 99, fullMark: 150 },
    { subject: 'Omega-3', A: 85, fullMark: 150 },
    { subject: 'B12', A: 65, fullMark: 150 },
];

const SuperAgentDietAnalyst: React.FC<{ memberId: number }> = ({ memberId }) => {
    const { members, updateMember, liveHealthData, addRoutineLog, dailyRoutineLogs } = useData();
    const { addToast } = useToast();
    const member = members.find(m => m.id === memberId);
    
    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'matrix' | 'scanner' | 'kitchen' | 'grocery' | 'quantum' | 'medical_swarm'>('medical_swarm');
    
    // FitnessFutureAI Diet Generator
    const [advancedPlan, setAdvancedPlan] = useState<any>(null);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    
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
    const [phase, setPhase] = useState<'syncing' | 'analyst_assessment' | 'diet_generation' | 'complete'>('complete');
    const [isGeneratingSwarm, setIsGeneratingSwarm] = useState(false);
    const [agentLogs, setAgentLogs] = useState<string[]>([]);
    const [learningState, setLearningState] = useState("Memory Context: Aggregating 14-Day Wearable Data & Sleep Cycles.");

    const simulateSwarm = () => {
        setIsGeneratingSwarm(true);
        setPhase('syncing');
        setAgentLogs([]);
        
        const sequence = [
            "Initiating Global Synapse Swarm...",
            "Wearable Bot: Fetching REM Sleep & HRV metrics...",
            "Habit Tracker: Analyzing daily biological rhythms...",
            "[AI BIO-ANALYST AGENT] Reviewing blood panels & muscle recovery logs...",
            "[AI BIO-ANALYST AGENT] Identifying microscopic deficiencies...",
            "[DIET PLANNER AGENT] Syncing with Bio-Analyst's bio-markers...",
            "[DIET PLANNER AGENT] Synthesizing Hyper-Personalized Macronutrients...",
            "Pharma Bot: Cross-referencing branded supplementation...",
            "Final Override: Injecting Self-Correction Module for tomorrow...",
            "Engine Ready."
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i < sequence.length) {
                setAgentLogs(prev => [...prev, sequence[i]]);
                
                if (i === 3) setPhase('analyst_assessment');
                if (i === 5) setPhase('diet_generation');
                if (i === sequence.length - 1) setPhase('complete');
                
                i++;
            } else {
                clearInterval(interval);
                setIsGeneratingSwarm(false);
                setLearningState("Self-Learning Engine Updated: Baseline adjusted based on today's metabolic burn.");
            }
        }, 800);
    };

    const wearableData = [
        { icon: Moon, label: "Deep Sleep Factor", value: "4h 12m", status: "Sub-optimal" },
        { icon: HeartPulse, label: "Morning HRV", value: "42 ms", status: "Requires Recovery" },
        { icon: Activity, label: "TDEE Burn", value: "3,150 kcal", status: "Accelerated" },
        { icon: Watch, label: "Workout Stress Strain", value: "18.4", status: "High" }
    ];

    const aiBioAnalystInsights = [
        "Identified delayed CNS recovery across the posterior chain.",
        "Slight Vitamin D3 & Magnesium deficiency noted post-sleep analysis.",
        "Cortisol levels elevated; adjusting complex carbohydrate timing.",
        "Joint lubrication protocol advised prior to heavy compound loads."
    ];

    const dietPlanPhase = [
        { time: "06:30 AM", phase: "Pre-Workout Ignition", meal: "Black Coffee + 10g L-Citrulline + Isomaltulose (Slow Carb)", purpose: "Vasodilation & sustained energy without insulin spikes." },
        { time: "08:30 AM", phase: "Post-Workout Anabolism", meal: "Hydrolyzed Whey (Fast Digesting) + 50g Dextrose + 5g Creatine Monohydrate", purpose: "Immediate glycogen replenishment & MPS trigger." },
        { time: "11:00 AM", phase: "Breakfast / Bio-Hatch", meal: "4 Whole Eggs (Pasture-raised), 100g Oats with Blueberries & Cinnamon", purpose: "Hormonal cholesterol support & antioxidant infusion." },
        { time: "02:30 PM", phase: "Lunch / Mid-Day Sustenance", meal: "200g Grilled Chicken Breast, 150g Quinoa, Asparagus with Olive Oil", purpose: "Steady amino acid drip & microbiome fiber." },
        { time: "07:00 PM", phase: "Dinner / Evening Recovery", meal: "250g Wild Caught Salmon, Sweet Potato, Spinach Salad", purpose: "Omega-3 EPA/DHA for joint repair and brain plasticity." },
        { time: "09:30 PM", phase: "Pre-Sleep Protocol", meal: "Micellar Casein Protein + Zinc/Magnesium (ZMA)", purpose: "Extended 8-hour amino release & deep sleep induction." }
    ];

    const prescribedSupplements = [
        { brand: "Optimum Nutrition", item: "Gold Standard Whey", dosage: "2 Scoops Post-Workout", reasoning: "Rapid isolate absorption targeted by AI Bio-Analyst." },
        { brand: "Thorne", item: "Magnesium Bisglycinate", dosage: "200mg Pre-Sleep", reasoning: "Addresses sleep debt and CNS cortisol spike." },
        { brand: "Life Extension", item: "Super Omega-3", dosage: "2000mg EPA/DHA with Dinner", reasoning: "Cardio-protective and inflammation mitigation." },
        { brand: "Animal", item: "Animal Pak", dosage: "1 Pack with Breakfast", reasoning: "Comprehensive micro-nutrient insurance." }
    ];

    
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
            addToast("Chef Smart Link Error.", "error");
        } finally {
            setIsCooking(false);
        }
    };

    const generateAdvancedDietPlan = async () => {
        if (!member) return;
        setIsGeneratingPlan(true);
        addToast("FitnessFutureAI: Synthesizing God-Tier Diet Protocol...", "info");

        const height = member.height || member.physical_metrics?.height || 'Unknown';
        const weight = member.weight || member.physical_metrics?.weight || 'Unknown';
        const bodyFat = member.bodyFat || member.physical_metrics?.body_fat || 'Unknown';
        const dietaryRestrictions = member.medical_history?.lifestyle?.diet || 'None specified';

        const prompt = `
            ACT AS AN ELITE AI SPORTS NUTRITIONIST, ENDOCRINOLOGIST, AND GENETICIST.
            CLIENT: ${member.name}, GOAL: ${member.physical_metrics?.target_weight ? 'Reach ' + member.physical_metrics.target_weight + 'kg' : 'Hypertrophy/Fat Loss'},
            CURRENT WEIGHT: ${weight}kg, HEIGHT: ${height}cm, BODY FAT: ${bodyFat}%.
            LIVE HEALTH DATA: Steps: ${liveHealthData.steps}, Active Calories: ${liveHealthData.caloriesBurned}, Avg Heart Rate: ${liveHealthData.heartRate.avg}bpm, Sleep: ${liveHealthData.sleep.totalHours} hours with ${liveHealthData.sleep.deepHours} deep sleep.
            DIETARY RESTRICTIONS/PREFERENCES: ${dietaryRestrictions}.
            GENERATE A HIGHLY ADVANCED, CUTTING-EDGE 1-DAY DIET PROTOCOL (JSON FORMAT) BASED ON THEIR ENTIRE BODY REPORT, WORKOUT INTENSITY, AND WEARABLES DATA.
            INCLUDE NUTRIENT TIMING, PRE/POST WORKOUT PROTOCOLS, SUPPLEMENT STACK, AND GUT MICROBIOME/DNA OPTIMIZATION TIPS.
            PROVIDE A CUSTOMIZED SUPPLEMENT RECOMMENDATION LIST AND A 'PERFECT GRIND' HYPER-NUTRITION STRATEGY.
            LANGUAGE: English only. Strictly do NOT use any Hindi words or characters. Keep explanations and reasoning clean, professional, and entirely in English.
            JSON SCHEMA:
            {
                "protocolName": "String (e.g., FitnessFutureShred Protocol)",
                "dailyCalories": Number,
                "macros": { "protein": Number, "carbs": Number, "fats": Number },
                "waterIntakeLiters": Number,
                "meals": [
                    { "time": "String", "name": "String", "items": ["String"], "calories": Number, "protein": Number, "scienceReasoning": "String" }
                ],
                "supplementStack": ["String"],
                "dnaGutOptimization": "String"
            }
        `;

        try {
            const res = await getComplexResponse(prompt);
            const planData = cleanAndParseJSON(res);
            setAdvancedPlan(planData);
            
            // Save the plan to the member
            if (planData) {
                const structuredPlan = {
                    goal: member.fitnessGoal || "General Fitness",
                    caloriesTarget: planData.dailyCalories || 2000,
                    macrosTarget: planData.macros || { protein: 150, carbs: 200, fats: 60 },
                    meals: planData.meals?.map((m: any) => ({
                        time: m.time,
                        name: m.name,
                        items: m.items?.map((item: string) => ({ food: item, portion: "1 serving" })) || [],
                        totalCalories: m.calories || 0,
                        macros: { protein: m.protein || 0, carbs: 0, fats: 0 }
                    })) || [],
                    scienceNote: planData.dnaGutOptimization || "AI Generated Protocol"
                };
                updateMember({ ...member, approvedDietPlan: structuredPlan as any });
            }

            addToast("FitnessFutureProtocol Generated Successfully.", "success");
        } catch (error) {
            console.error("Failed to generate advanced diet plan:", error);
            addToast("AI Core Overload. Failed to generate plan.", "error");
        } finally {
            setIsGeneratingPlan(false);
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
                                    Nutri-Sync Fitness Future
                                </div>
                                <span className={`text-[10px] font-mono tracking-[0.4em] uppercase font-bold flex items-center gap-2 ${metabolicState.color}`}>
                                    {metabolicState.icon} STATE: {metabolicState.status.toUpperCase()}
                                </span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Fitness Future<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-600">Continuum</span>
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
                                generateDietPDF(activePlan as any, member);
                                addToast('PDF Downloaded Successfully', 'success');
                            } else {
                                addToast('No active diet plan found.', 'error');
                            }
                        }}
                        className="relative mt-6 md:mt-0 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 backdrop-blur-xl border border-dashed border-gray-600/50 text-white px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-all duration-500 hover:-translate-y-1 shadow-[0_0_15px_rgba(0,0,0,0.5)] group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                        <Download className="w-4 h-4 group-hover:scale-110 transition-transform duration-500 relative z-10" /> 
                        <span className="relative z-10">Download PDF</span>
                    </button>
                </div>
                
                <div className="mt-8 flex bg-gray-950 p-2 rounded-[2rem] border border-white/5 shadow-xl w-fit overflow-x-auto no-scrollbar max-w-full gap-2">
                    <button onClick={() => setActiveTab('matrix')} className={`relative px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap overflow-hidden group ${activeTab === 'matrix' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 border border-dashed border-emerald-400/50 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-transparent border border-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}>
                        {activeTab === 'matrix' && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
                        <span className="relative z-10">Metabolic Matrix</span>
                    </button>
                    {member && (new Date().getTime() - new Date(member.joinDate).getTime()) / (1000 * 60 * 60 * 24) >= 2 && (
                        <button onClick={() => setActiveTab('scanner')} className={`relative px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap overflow-hidden group ${activeTab === 'scanner' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 border border-dashed border-emerald-400/50 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-transparent border border-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}>
                            {activeTab === 'scanner' && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
                            <span className="relative z-10">Vision AI</span>
                        </button>
                    )}
                    {member && (new Date().getTime() - new Date(member.joinDate).getTime()) / (1000 * 60 * 60 * 24) >= 3 && (
                        <button onClick={() => setActiveTab('kitchen')} className={`relative px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap overflow-hidden group ${activeTab === 'kitchen' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 border border-dashed border-emerald-400/50 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-transparent border border-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}>
                            {activeTab === 'kitchen' && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
                            <span className="relative z-10">Smart Chef</span>
                        </button>
                    )}
                    <button onClick={() => setActiveTab('grocery')} className={`relative px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap overflow-hidden group ${activeTab === 'grocery' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 border border-dashed border-emerald-400/50 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-transparent border border-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}>
                        {activeTab === 'grocery' && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
                        <span className="relative z-10 flex items-center gap-2"><ShoppingCart className="w-3 h-3" /> Auto-Procure</span>
                    </button>
                    <button onClick={() => setActiveTab('quantum')} className={`relative px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap overflow-hidden group ${activeTab === 'quantum' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 border border-dashed border-emerald-400/50 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-transparent border border-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}>
                        {activeTab === 'quantum' && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
                        <span className="relative z-10 flex items-center gap-2"><Sparkles className="w-3 h-3"/> FitnessFutureAI</span>
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            
            {activeTab === 'medical_swarm' && (
                <div className="animate-fade-in pb-10">
            {/* AI Reasoning / Execution Terminal */}
            <AnimatePresence>
                {isGeneratingSwarm && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-black/60 border border-emerald-500/30 rounded-2xl overflow-hidden mb-6"
                    >
                        <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest flex items-center gap-2">
                                <Cpu className="w-4 h-4" /> Cognitive Core Processing
                            </h3>
                            <div className="flex gap-2">
                                <span className={`h-2 w-2 rounded-full ${phase === 'syncing' ? 'bg-emerald-400 animate-ping' : 'bg-emerald-400/20'}`}></span>
                                <span className={`h-2 w-2 rounded-full ${phase === 'analyst_assessment' ? 'bg-blue-400 animate-ping' : 'bg-blue-400/20'}`}></span>
                                <span className={`h-2 w-2 rounded-full ${phase === 'diet_generation' ? 'bg-amber-400 animate-ping' : 'bg-amber-400/20'}`}></span>
                            </div>
                        </div>
                        <div className="p-4 font-mono text-[10px] space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {agentLogs.map((log, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={idx}
                                    className={`flex items-center gap-2 ${log.includes('ANALYST') ? 'text-blue-300' : log.includes('DIET') ? 'text-amber-300' : 'text-emerald-300'}`}
                                >
                                    <ChevronRight className="w-3 h-3" /> {log}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results HUD */}
            {!isGeneratingSwarm && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                    {/* Left Column: Wearables & Analytics */}
                    <div className="space-y-6">
                        <div className="bg-[#050505] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <BrainCircuit className="w-16 h-16 text-emerald-500" />
                            </div>
                            <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-2 flex items-center gap-2">
                                <RefreshCw className="w-3 h-3" /> Auto-Upgrade Memory System
                            </h4>
                            <p className="text-[11px] text-gray-400 leading-relaxed font-mono">
                                {learningState}
                            </p>
                        </div>

                        <div className="bg-[#050505] border border-white/5 rounded-2xl p-5">
                            <h4 className="text-[10px] font-black uppercase text-white tracking-widest mb-4 flex items-center gap-2">
                                <Watch className="w-4 h-4 text-cyan-400" /> Gadget Biomarkers
                            </h4>
                            <div className="space-y-3">
                                {wearableData.map((data, idx) => {
                                    const IconC = data.icon;
                                    return (
                                        <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 bg-black rounded-lg">
                                                    <IconC className="w-4 h-4 text-cyan-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-white uppercase">{data.label}</p>
                                                    <p className={`text-[9px] font-black uppercase tracking-wider ${data.status === 'Sub-optimal' || data.status === 'Requires Recovery' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                        {data.status}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-mono font-bold text-white">{data.value}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-5">
                            <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-4 flex items-center gap-2">
                                <Stethoscope className="w-4 h-4" /> AI Bio-Analyst Assessment
                            </h4>
                            <div className="space-y-3">
                                {aiBioAnalystInsights.map((insight, idx) => (
                                    <div key={idx} className="flex gap-3 text-[11px] text-gray-300">
                                        <ChevronRight className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                        <p className="leading-relaxed">{insight}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        {/* Dynamic Diet Plan */}
                        <div className="bg-[#050505] border border-white/5 rounded-2xl p-5">
                            <div className="flex justify-between mb-4">
                                <h4 className="text-[10px] font-black uppercase text-amber-400 tracking-widest flex items-center gap-2">
                                    <Apple className="w-4 h-4" /> Categorized Precision Diet Plan
                                </h4>
                                <button onClick={simulateSwarm} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[9px] uppercase tracking-widest transition-all">
                                    Re-Swarm Algorithm
                                </button>
                            </div>
                            <div className="space-y-3">
                                {dietPlanPhase.map((meal, idx) => (
                                    <div key={idx} className="bg-black/40 border border-white/5 p-4 rounded-xl flex flex-col md:flex-row gap-4 hover:border-amber-500/20 transition-colors">
                                        <div className="md:w-32 shrink-0">
                                            <span className="text-xs font-black text-white font-mono bg-white/5 px-2 py-1 rounded inline-block mb-1">{meal.time}</span>
                                            <p className="text-[8px] font-bold uppercase text-amber-500 tracking-widest">{meal.phase}</p>
                                        </div>
                                        <div className="flex-1 border-l-2 border-white/5 pl-4 md:pl-6">
                                            <p className="text-sm font-bold text-white mb-1">{meal.meal}</p>
                                            <p className="text-[10px] text-gray-400 leading-relaxed font-mono italic">
                                                <span className="text-amber-400/70">Scientific Purpose:</span> {meal.purpose}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-rose-900/10 border border-rose-500/20 rounded-2xl p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                                <h4 className="text-[10px] font-black uppercase text-rose-400 tracking-widest flex items-center gap-2">
                                    <Pill className="w-4 h-4" /> Clinical Supplement Protocols
                                </h4>
                                <span className="bg-rose-500/20 text-rose-300 text-[8px] font-bold px-2 py-1 flex items-center gap-1 rounded uppercase tracking-widest">
                                    <ShieldCheck className="w-3 h-3" /> Analyst Recommended Brands
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {prescribedSupplements.map((supp, idx) => (
                                    <div key={idx} className="bg-black/50 border border-rose-500/10 rounded-xl p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">{supp.brand}</span>
                                                <h5 className="text-xs font-bold text-white">{supp.item}</h5>
                                            </div>
                                            <span className="bg-white/5 text-gray-300 text-[9px] font-mono px-2 py-1 rounded">{supp.dosage}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 leading-relaxed pt-2 border-t border-rose-500/10">
                                            {supp.reasoning}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
                </div>
            )}
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

                        <div className="relative bg-black/40 backdrop-blur-xl border-2 border-dashed border-cyan-500/30 p-8 rounded-[3rem] overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.1)] cursor-pointer hover:border-cyan-500/60 hover:shadow-[0_0_50px_rgba(6,182,212,0.2)] hover:-translate-y-1 transition-all duration-500 group" onClick={toggleHydration}>
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                        <Droplets className="w-4 h-4 group-hover:scale-110 transition-transform duration-500" /> Hydration Core
                                    </p>
                                    <p className="text-4xl font-black text-white italic group-hover:text-cyan-300 transition-colors duration-500">{hydration}%</p>
                                    <p className="text-[9px] text-cyan-500/60 font-mono mt-1 group-hover:text-cyan-400 transition-colors duration-500">Tap to Log +250ml</p>
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
                                    <div key={idx} className={`relative bg-black/40 backdrop-blur-xl p-6 rounded-[2.5rem] border-2 border-dashed transition-all duration-500 group overflow-hidden ${consumedMeals.has(idx.toString()) ? 'border-emerald-500/50 opacity-60 grayscale' : 'border-white/10 hover:border-emerald-500/50 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]'}`}>
                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500"><Utensils className="w-16 h-16 text-white" /></div>
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
                                                className={`relative w-full mt-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-2 overflow-hidden border border-dashed ${
                                                    consumedMeals.has(idx.toString())
                                                    ? 'bg-green-900/20 border-green-500/30 text-green-500 cursor-default'
                                                    : 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-emerald-600 hover:to-teal-700 border-gray-600/50 hover:border-emerald-400/50 text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                                }`}
                                            >
                                                {!consumedMeals.has(idx.toString()) && <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
                                                <div className="relative z-10 flex items-center gap-2">
                                                    {consumedMeals.has(idx.toString()) ? <CheckCircle className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
                                                    {consumedMeals.has(idx.toString()) ? 'CONSUMED' : 'LOG MEAL'}
                                                </div>
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
                                 <button onClick={handleLogScannedMeal} className="relative w-full py-4 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600 hover:to-teal-600 backdrop-blur-xl border border-dashed border-emerald-500/50 text-emerald-400 hover:text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all duration-500 group overflow-hidden active:scale-95">
                                     <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                     <span className="relative z-10">Log to Daily Protocol</span>
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
                            className="relative w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 backdrop-blur-xl border border-dashed border-emerald-400/50 text-white font-black py-6 rounded-[2.5rem] shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-500 flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-sm disabled:opacity-50 active:scale-95 group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                            <div className="relative z-10 flex items-center gap-4">
                                {isCooking ? <RefreshCw className="animate-spin w-6 h-6" /> : <ChefHat className="w-6 h-6 group-hover:scale-110 transition-transform duration-500" />}
                                <span>{isCooking ? 'FORMULATING RECIPE...' : 'INVENT HIGH-YIELD MEAL'}</span>
                            </div>
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
                    <Card title="Auto-Procurement Manifest" className="bg-black border-emerald-500/30 p-10 rounded-[4rem] shadow-[0_0_50px_rgba(16,185,129,0.15)] relative overflow-hidden">
                         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-emerald-500/5 blur-[120px] pointer-events-none rounded-full animate-pulse"></div>

                         <div className="space-y-8 relative z-10">
                             <div className="flex justify-between items-center border-b border-emerald-500/20 pb-6">
                                 <div>
                                     <div className="flex items-center gap-3 mb-2">
                                         <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                                             <ShoppingCart className="w-6 h-6 text-emerald-400" />
                                         </div>
                                         <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter shadow-sm text-shadow-sm">Auto-Procure</h3>
                                     </div>
                                     <p className="text-[10px] text-emerald-400 font-mono mt-1 uppercase tracking-widest flex items-center gap-2"><Zap className="w-3 h-3" /> Predictive Supply Chain Live</p>
                                 </div>
                                 <div className="flex gap-4">
                                     <button className="relative bg-black border border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400 font-black px-8 py-3 rounded-2xl flex items-center gap-2 uppercase tracking-widest text-[10px] transition-all duration-300 group overflow-hidden active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                         <div className="absolute right-0 top-0 w-2 h-full bg-emerald-500/20 group-hover:w-full transition-all duration-500 -z-10" />
                                         <BrainCircuit className="w-4 h-4" /> 
                                         <span>AI Optimize Cart</span>
                                     </button>
                                     <button className="relative bg-gradient-to-r from-[#25D366]/20 to-[#128C7E]/20 hover:from-[#25D366] hover:to-[#128C7E] backdrop-blur-xl border border-dashed border-[#25D366]/50 text-[#25D366] hover:text-white font-black px-6 py-3 rounded-2xl flex items-center gap-2 uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(37,211,102,0.2)] hover:shadow-[0_0_30px_rgba(37,211,102,0.4)] transition-all duration-500 group overflow-hidden active:scale-95">
                                         <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                         <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-500 relative z-10"/> 
                                         <span className="relative z-10">Dispatch to WhatsApp</span>
                                     </button>
                                 </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                 {activePlan.meals && Array.isArray(activePlan.meals) ? activePlan.meals.flatMap(m => m.items).map((item, i) => (
                                     <div key={i} className="relative flex items-center gap-4 p-6 bg-gray-900/40 backdrop-blur-md rounded-2xl border border-gray-800 hover:border-emerald-500/50 hover:-translate-y-1 hover:bg-emerald-900/10 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all duration-300 cursor-pointer group overflow-hidden">
                                         <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-emerald-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                         
                                         <div className="relative z-10 w-8 h-8 rounded-xl border border-emerald-500/30 group-hover:border-emerald-500 bg-black flex items-center justify-center transition-all duration-500">
                                             <Scan className="w-4 h-4 text-emerald-500/50 group-hover:text-emerald-400" />
                                         </div>
                                         <div className="relative z-10 flex-1">
                                             <p className="text-white font-bold text-sm tracking-wide uppercase group-hover:text-emerald-300 transition-colors duration-500">{item.food}</p>
                                             <p className="text-[10px] text-gray-500 font-mono group-hover:text-emerald-400/70 transition-colors duration-500">QTY: {item.portion} • P: {(item as any).protein || 0}g</p>
                                         </div>
                                         <div className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-black tracking-widest uppercase border border-emerald-500/50">Auto-Order</div>
                                         </div>
                                     </div>
                                 )) : <p className="text-gray-500 font-mono uppercase tracking-widest">Awaiting plan synthesis.</p>}
                             </div>
                             
                             {/* AI Supply Chain Estimate */}
                             <div className="mt-8 p-6 bg-gradient-to-r from-emerald-900/20 to-black border border-emerald-500/20 rounded-3xl flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                     <BotIcon className="w-10 h-10 text-emerald-400" />
                                     <div>
                                         <p className="text-white font-black uppercase tracking-wider text-sm">Estimated Restock Value</p>
                                         <p className="text-emerald-400/70 text-xs font-mono uppercase tracking-widest">Real-time market analysis</p>
                                     </div>
                                 </div>
                                 <div className="text-right">
                                     <p className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">₹ {(Math.random() * 2000 + 1500).toFixed(0)}</p>
                                 </div>
                             </div>
                         </div>
                    </Card>
                </div>
            )}

            {activeTab === 'quantum' && (
                <div className="lg:col-span-12 animate-slide-up space-y-8">
                    <div className="bg-gradient-to-br from-indigo-900/40 to-black p-10 rounded-[3.5rem] border border-indigo-500/30 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-10 opacity-10"><Sparkles className="w-48 h-48 text-indigo-400" /></div>
                        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                            <div className="w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.4)]">
                                <BotIcon className="w-16 h-16 text-white" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-3xl font-black text-white uppercase italic tracking-tight mb-2">AI FitnessFutureDiet Generator</h3>
                                <p className="text-gray-400 text-sm leading-relaxed italic mb-6">
                                    "Generate a hyper-personalized, cutting-edge diet protocol using advanced AI. Tailored to your exact biometrics, goals, and metabolic rate."
                                </p>
                                <button 
                                    onClick={generateAdvancedDietPlan}
                                    disabled={isGeneratingPlan}
                                    className="relative bg-gradient-to-r from-indigo-900/40 to-indigo-800/40 hover:from-indigo-800/60 hover:to-indigo-700/60 backdrop-blur-xl border border-dashed border-indigo-500/50 hover:border-indigo-400 text-indigo-400 font-black px-10 py-4 rounded-2xl uppercase tracking-widest text-xs transition-all flex items-center gap-3 mx-auto md:mx-0 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] disabled:opacity-50 group overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                    <div className="relative z-10 flex items-center gap-3">
                                        {isGeneratingPlan ? <RefreshCw className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform duration-500" />}
                                        <span>{isGeneratingPlan ? 'SYNTHESIZING PROTOCOL...' : 'GENERATE NEURAL DIET'}</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {isGeneratingPlan && (
                        <div className="space-y-8 animate-pulse mt-8">
                            <div className="bg-[#0a0a0a] border border-indigo-500/20 p-8 rounded-[3rem] shadow-xl">
                                <div className="h-10 bg-indigo-900/20 rounded-xl w-1/2 mb-4"></div>
                                <div className="h-4 bg-indigo-900/20 rounded-md w-1/4 mb-8"></div>
                                <div className="flex gap-4 mb-8">
                                    <div className="h-20 bg-indigo-900/20 rounded-2xl w-24"></div>
                                    <div className="h-20 bg-indigo-900/20 rounded-2xl w-24"></div>
                                    <div className="h-20 bg-indigo-900/20 rounded-2xl w-24"></div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-32 bg-indigo-900/10 rounded-3xl w-full"></div>
                                    <div className="h-32 bg-indigo-900/10 rounded-3xl w-full"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!isGeneratingPlan && advancedPlan && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="bg-[#0a0a0a] border border-indigo-500/20 p-8 rounded-[3rem] shadow-xl">
                                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                                    <div>
                                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">{advancedPlan.protocolName}</h2>
                                        <p className="text-indigo-400 font-mono text-xs mt-2 uppercase tracking-widest">Target: {advancedPlan.dailyCalories} kcal | Water: {advancedPlan.waterIntakeLiters}L</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="text-center bg-black/40 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[10px] text-gray-500 font-bold uppercase">Protein</p>
                                            <p className="text-xl font-black text-blue-400 italic">{advancedPlan.macros?.protein}g</p>
                                        </div>
                                        <div className="text-center bg-black/40 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[10px] text-gray-500 font-bold uppercase">Carbs</p>
                                            <p className="text-xl font-black text-emerald-400 italic">{advancedPlan.macros?.carbs}g</p>
                                        </div>
                                        <div className="text-center bg-black/40 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[10px] text-gray-500 font-bold uppercase">Fats</p>
                                            <p className="text-xl font-black text-amber-400 italic">{advancedPlan.macros?.fats}g</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {advancedPlan.meals?.map((meal: any, idx: number) => (
                                        <div key={idx} className="bg-black/40 border border-white/5 p-6 rounded-3xl hover:border-indigo-500/30 transition-colors group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{meal.time}</span>
                                                        <h4 className="text-xl font-black text-white italic uppercase">{meal.name}</h4>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-white italic">{meal.calories} kcal</p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase">{meal.protein}g Protein</p>
                                                </div>
                                            </div>
                                            <ul className="list-disc list-inside text-gray-400 text-sm mb-4 space-y-1">
                                                {meal.items?.map((item: string, i: number) => (
                                                    <li key={i}>{item}</li>
                                                ))}
                                            </ul>
                                            <div className="bg-indigo-900/10 border-l-2 border-indigo-500 p-4 rounded-r-xl">
                                                <p className="text-xs text-indigo-200 italic">"{meal.scienceReasoning || meal.scienceReasoningHindi}"</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {advancedPlan.supplementStack && advancedPlan.supplementStack.length > 0 && (
                                    <div className="mt-8 bg-black/40 border border-white/5 p-6 rounded-3xl">
                                        <h4 className="text-lg font-black text-white uppercase italic mb-4 flex items-center gap-2"><FlaskConical className="w-5 h-5 text-indigo-400"/> Supplement Stack</h4>
                                        <div className="flex flex-wrap gap-3">
                                            {advancedPlan.supplementStack.map((supp: string, idx: number) => (
                                                <span key={idx} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-4 py-2 rounded-xl text-xs font-bold">{supp}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                { (advancedPlan.dnaGutOptimization || advancedPlan.dnaGutOptimizationHindi) && (
                                    <div className="mt-8 bg-gradient-to-br from-emerald-900/20 to-black border border-emerald-500/30 p-6 rounded-3xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10"><Binary className="w-24 h-24 text-emerald-400"/></div>
                                        <div className="relative z-10">
                                            <h4 className="text-lg font-black text-white uppercase italic mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-400"/> DNA & Gut Microbiome Optimization</h4>
                                            <p className="text-emerald-200 text-sm leading-relaxed italic">"{advancedPlan.dnaGutOptimization || advancedPlan.dnaGutOptimizationHindi}"</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SuperAgentDietAnalyst;
