import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, Salad, Heart, PlusCircle, AlertCircle, Sparkles, Scale, RefreshCw, 
  ChevronRight, Compass, ShieldCheck, CheckCircle2, FileSpreadsheet, Play, Check,
  ShoppingCart, Send, Smartphone, Terminal
} from 'lucide-react';

interface Meal {
  name: string;
  time: string;
  items: { food: string; portion: string; note?: string }[];
  totalCalories: number;
  macros: { protein: number; carbs: number; fats: number };
}

interface DietPlan {
  planName: string;
  regionalTheme: string;
  coachingRationale: string;
  digestiveEnzymesRoutine: string;
  hydrationSchedule: string;
  meals: Meal[];
  advice: string;
}

const CUISINES = [
  { id: 'punjabi', name: 'Punjabi (Traditional)', description: 'Paneer, Lassi, Rajma-Chawal, Sarson ka Saag & Makki Roti (Healthy versions)' },
  { id: 'rajasthani', name: 'Rajasthani (Marwadi)', description: 'Bajre ki Roti, Gatte ki Sabji, Panchmel Dal, Chaas, Lahsun Chutney' },
  { id: 'haryanvi', name: 'Haryanvi (Desi)', description: 'Desi ghee limits, Kadi, Bajra Khichdi, Sattu Shake, Milk-Lassi metrics' },
  { id: 'south_indian', name: 'South Indian (Classic)', description: 'Ragi Mudde, Idli with Sambhar, Buttermilk, Paneer Podi, Curd Rice' },
  { id: 'maharashtrian', name: 'Gujarati & Maharashtrian', description: 'Methi Thepla, Sprouts Usal, Jowar Bhakri, Shrikhand (High Protein), Solkadhi' },
];

const HEALTH_PRESETS = [
  { id: 'sugar_high', label: 'Diabetic / High Blood Sugar', metric: 'Glucose: 155 mg/dL', restrict: 'Low Glycemic Index, No Refined Carbs, High Fiber Bajra/Ragi' },
  { id: 'fat_high', label: 'Fat Loss / Metabolic Syndrome', metric: 'Body Fat: 28.5%', restrict: 'Calorie Deficit, Thermogenic foods, Curd/Chaas hydration' },
  { id: 'uric_high', label: 'Elevated Uric Acid', metric: 'Uric Acid: 7.2 mg/dL', restrict: 'Low Purine, high hydration, limited spinach/soy, lean cottage cheese' },
  { id: 'bulk_up', label: 'Ectomorph Muscle Synthesis', metric: 'LBM: 54 kg (Need Mass)', restrict: 'Calorie Surplus, Sattu nutrition, thick paneer & dairy profiles' },
];

export const KitchenChief: React.FC<{ memberId: number }> = ({ memberId }) => {
  const [selectedCuisine, setSelectedCuisine] = useState('rajasthani');
  const [selectedPreset, setSelectedPreset] = useState('sugar_high');
  const [customSugar, setCustomSugar] = useState('145');
  const [customFat, setCustomFat] = useState('25');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'results'>('config');
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [isScanningReport, setIsScanningReport] = useState(false);
  const [scannedMetrics, setScannedMetrics] = useState<string | null>(null);

  // Grocery automation states
  const [isGroceryDispatching, setIsGroceryDispatching] = useState(false);
  const [groceryLogs, setGroceryLogs] = useState<{ status: string; time: string; msg: string }[]>([]);
  const [groceryItems, setGroceryItems] = useState<Record<string, { food: string; portion: string; quantity: string }[]> | null>(null);
  const [dispatchedMessageSnippet, setDispatchedMessageSnippet] = useState<string | null>(null);

  const handleDispatchGrocery = async () => {
    if (!dietPlan) return;
    setIsGroceryDispatching(true);
    setGroceryLogs([]);
    setGroceryItems(null);
    setDispatchedMessageSnippet(null);
    playBeep();

    try {
      const response = await fetch('/api/diet/dispatch-grocery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meals: dietPlan.meals,
          planName: dietPlan.planName,
          memberId
        })
      });
      const data = await response.json();
      if (data.success) {
        setGroceryItems(data.items);
        setDispatchedMessageSnippet(data.messageSnippet);
        
        // Stagger logs display for cyberpunk immersive feel
        let index = 0;
        const interval = setInterval(() => {
          if (index < data.logs.length) {
            setGroceryLogs(prev => [...prev, data.logs[index]]);
            playBeep();
            index++;
          } else {
            clearInterval(interval);
            setIsGroceryDispatching(false);
          }
        }, 600);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error(err);
      setIsGroceryDispatching(false);
    }
  };

  // Sound generator simulation (pings of future sound)
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      // Ignored if browser blocks audio contextual playback
    }
  };

  const handleScanReport = () => {
    setIsScanningReport(true);
    playBeep();
    setTimeout(() => {
      setIsScanningReport(false);
      setScannedMetrics('SCAN COMPLETE: Blood Glucose 158 mg/dL • Visceral Fat Index 14 • Uric Acid 7.4 mg/dL.');
      setSelectedPreset('sugar_high');
      setCustomSugar('158');
      setCustomFat('28');
    }, 2000);
  };

  const handleSynthesize = async () => {
    setIsSynthesizing(true);
    playBeep();
    
    // Quick validation delay for the cyberpunk immersive feedback
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const response = await fetch('/api/diet/kitchen-chief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuisine: selectedCuisine,
          preset: selectedPreset,
          customSugar,
          customFat,
          scannedMetrics
        })
      });

      const data = await response.json();
      if (data.success && data.dietPlan) {
        setDietPlan(data.dietPlan);
      } else {
        throw new Error('Using fallback engine...');
      }
    } catch (error) {
      console.warn('Core AI proxy error, activating regional rule-based database matching:', error);
      // Premium Rule-based Offline Nutritionist Database based on selected inputs
      const fallbackPlan: DietPlan = generateOfflinePlan(selectedCuisine, selectedPreset, customSugar, customFat);
      setDietPlan(fallbackPlan);
    } finally {
      setIsSynthesizing(false);
      setActiveTab('results');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 p-2 text-gray-100">
      
      {/* HEADER MATRIX banner */}
      <div className="bg-black border border-yellow-500/30 p-8 rounded-[3rem] relative overflow-hidden shadow-[0_0_80px_rgba(234,179,8,0.06)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-yellow-950/40 text-yellow-500 border border-yellow-500/20 text-[9px] font-black tracking-widest uppercase rounded-full">
                Regional Nutrition OS
              </span>
              <span className="px-3 py-1 bg-cyan-950/30 text-cyan-400 border border-cyan-500/20 text-[9px] font-mono tracking-wider rounded-full">
                Kitchen Chief v4.1
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black italic uppercase text-white tracking-tighter leading-none">
              Kitchen <span className="text-yellow-400">Chief</span> AI
            </h1>
            <p className="text-xs text-gray-400 mt-2 font-mono tracking-wider">
              Translating health markers into Bajra ki Roti, Chaass, Sattu & local proteins. High Bioavailability.
            </p>
          </div>
          <Compass className="w-12 h-12 text-yellow-400 hidden lg:block animate-spin-slow" />
        </div>
      </div>

      {/* CORE CONTROL TABS */}
      <div className="flex border-b border-white/5 space-x-2">
        <button 
          onClick={() => { setActiveTab('config'); playBeep(); }}
          className={`px-8 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'config' ? 'border-yellow-500 text-yellow-400 font-bold bg-yellow-500/5 rounded-t-2xl' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          1. Biomarker Config
        </button>
        {dietPlan && (
          <button 
            onClick={() => { setActiveTab('results'); playBeep(); }}
            className={`px-8 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'results' ? 'border-yellow-500 text-yellow-400 font-bold bg-yellow-500/5 rounded-t-2xl' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            2. Gen-Food Synthesizer Matrix
          </button>
        )}
      </div>

      {activeTab === 'config' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Biomarker Intake & Medical diagnostics */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-black border border-white/5 rounded-3xl p-6 relative overflow-hidden space-y-6">
              
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <Scale className="w-5 h-5 text-yellow-400" />
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Biomarker Assessment</h3>
              </div>

              {/* Scan report mockup */}
              <div className="bg-gray-950 border border-dashed border-cyan-500/20 p-4 rounded-2xl relative overflow-hidden text-center space-y-3">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400 animate-scanner opacity-40"></div>
                <div className="text-[10px] text-cyan-400 font-mono tracking-wider uppercase font-black">Scan Diagnostic File</div>
                <p className="text-[11px] text-gray-500">Upload medical report, metabolic screen, or hormone biomarker summary</p>
                
                <button
                  onClick={handleScanReport}
                  disabled={isScanningReport}
                  className="w-full bg-cyan-950/30 hover:bg-cyan-500 hover:text-black border border-cyan-500/30 text-cyan-400 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-cyan-950/20 disabled:opacity-50"
                >
                  {isScanningReport ? 'SCANNING MARKERS...' : 'INITIATE LAB SCAN'}
                </button>

                {scannedMetrics && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="p-3 bg-cyan-950/40 text-[11px] font-mono border border-cyan-500/30 text-cyan-300 rounded-lg text-left"
                  >
                    {scannedMetrics}
                  </motion.div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                    Blood Glucose Marker (mg/dL)
                  </label>
                  <input 
                    type="number"
                    value={customSugar}
                    onChange={(e) => setCustomSugar(e.target.value)}
                    className="w-full bg-gray-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-yellow-500/50 outline-none text-yellow-400 font-mono font-bold"
                    placeholder="e.g. 140"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">Glucose check: Diabetic tier triggers &gt;125 mg/dL</span>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                    Visceral Fat Index / Body Fat (%)
                  </label>
                  <input 
                    type="number"
                    value={customFat}
                    onChange={(e) => setCustomFat(e.target.value)}
                    className="w-full bg-gray-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-yellow-500/50 outline-none text-yellow-400 font-mono font-bold"
                    placeholder="e.g. 24"
                  />
                </div>
              </div>

              {/* Presets List */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Metabolic Condition</span>
                {HEALTH_PRESETS.map((preset) => {
                  const isChoice = selectedPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => { setSelectedPreset(preset.id); playBeep(); }}
                      className={`w-full p-3 text-left rounded-xl border text-xs transition-all relative overflow-hidden ${isChoice ? 'bg-yellow-950/20 border-yellow-500 text-yellow-400' : 'bg-gray-950/50 border-white/5 text-gray-400 hover:border-gray-800'}`}
                    >
                      <div className="font-bold flex justify-between items-center">
                        <span>{preset.label}</span>
                        {isChoice && <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400" />}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-2 font-mono flex gap-2">
                        <span className="text-cyan-400">{preset.metric}</span>
                        <span className="truncate max-w-[180px]">{preset.restrict}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

            </div>
          </div>

          {/* RIGHT: Cuisine customization & AI Synthesis */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-black border border-white/5 rounded-3xl p-8 space-y-6">
              
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <Compass className="w-5 h-5 text-yellow-400" />
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Select Regional Cuisine Core</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CUISINES.map((cuisine) => {
                  const isChoice = selectedCuisine === cuisine.id;
                  return (
                    <button
                      key={cuisine.id}
                      onClick={() => { setSelectedCuisine(cuisine.id); playBeep(); }}
                      className={`p-5 text-left rounded-2xl border-2 transition-all relative overflow-hidden flex flex-col justify-between h-40 ${isChoice ? 'bg-yellow-950/20 border-yellow-500 shadow-[0_0_25px_rgba(234,179,8,0.1)]' : 'bg-gray-950 border-white/5 hover:border-white/10 hover:bg-gray-920'}`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-black uppercase tracking-wider ${isChoice ? 'text-yellow-400 font-bold' : 'text-white'}`}>
                            {cuisine.name}
                          </span>
                          {isChoice && <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                          {cuisine.description}
                        </p>
                      </div>
                      
                      <div className="text-[10px] font-mono uppercase tracking-widest text-gray-600 mt-4">
                        {isChoice ? 'PRIMARY AXIS SELECTED' : 'SELECT ARCHITECTURE'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Warning about real clinical parameters */}
              <div className="bg-[#110e05]/50 border border-yellow-500/20 p-4 rounded-2xl flex gap-3 text-yellow-500 text-xs">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <span className="font-bold uppercase tracking-wider block mb-1">Clinical Bio-Integration Notice</span>
                  Our Core AI model aggregates medical inputs (like Blood Glucose & Body Fat) to adjust ratios of macro-nutrients and glycemic density. No synthetic pharmaceuticals. Pure high-integrity localized food synthesis.
                </div>
              </div>

              {/* ACTION: SYNTHESIZE */}
              <div className="pt-4">
                <button
                  onClick={handleSynthesize}
                  disabled={isSynthesizing}
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black py-5 rounded-[2rem] shadow-[0_0_30px_rgba(234,179,8,0.25)] hover:shadow-[0_0_50px_rgba(234,179,8,0.4)] transition-all flex items-center justify-center gap-3 uppercase tracking-wider text-xs active:scale-95 disabled:opacity-50"
                >
                  {isSynthesizing ? (
                    <>
                      <RefreshCw className="animate-spin w-4 h-4" />
                      <span>SYNTHESIZING REGIONAL NUTRITIONAL PROTOCOLS...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span>COMPILE REGIONAL AI DIET MATRIX</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          
          {/* RESULTS DISPLAY GRID */}
          {dietPlan ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Sidebar: plan metadata */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-black border border-yellow-500/20 rounded-3xl p-6 relative overflow-hidden space-y-6 shadow-xl">
                  
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <Compass className="w-5 h-5 text-yellow-400" />
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-white leading-none">Synthesized Schema</h3>
                      <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-1 block">Engine Confirmed</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-950 p-4 rounded-2xl border border-white/5">
                      <span className="text-[10px] font-mono uppercase text-gray-500 block">Plan Nomenclature</span>
                      <h4 className="text-yellow-400 font-black text-lg italic uppercase mt-1">
                        {dietPlan.planName}
                      </h4>
                    </div>

                    <div className="bg-gray-950 p-4 rounded-2xl border border-white/5">
                      <span className="text-[10px] font-mono uppercase text-gray-500 block">Regional Core Integration</span>
                      <p className="text-white text-xs font-bold mt-1">
                        {dietPlan.regionalTheme}
                      </p>
                    </div>

                    <div className="bg-gray-950 p-4 rounded-2xl border border-white/5">
                      <span className="text-[10px] font-mono uppercase text-gray-500 block">Digestive Enzymes & Micro-hydration</span>
                      <p className="text-gray-300 text-xs mt-1 leading-relaxed">
                        {dietPlan.digestiveEnzymesRoutine}
                      </p>
                    </div>

                    <div className="bg-gray-950 p-4 rounded-2xl border border-white/5">
                      <span className="text-[10px] font-mono uppercase text-gray-500 block">Hydration Flow</span>
                      <p className="text-cyan-400 text-xs font-mono font-bold mt-1">
                        {dietPlan.hydrationSchedule}
                      </p>
                    </div>
                  </div>

                  <div className="bg-yellow-950/10 border border-yellow-500/10 p-4 rounded-2xl">
                    <span className="text-[10px] font-black uppercase text-yellow-500 tracking-wider block mb-1">Coaching Insights</span>
                    <p className="text-[11px] text-gray-400 leading-relaxed italic">
                      "{dietPlan.coachingRationale}"
                    </p>
                  </div>

                  <button
                    onClick={() => { setActiveTab('config'); playBeep(); }}
                    className="w-full py-4 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors"
                  >
                    Adjust Biomarkers
                  </button>

                </div>
              </div>

              {/* Right panel: Meals Grid */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Micro metrics header */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-black border border-white/5 p-4 rounded-2xl text-center">
                    <span className="text-[10px] font-mono uppercase text-gray-500 block">Glucose Targeting</span>
                    <span className="text-lg font-black text-green-400 font-mono mt-1 block">Low Glycemic</span>
                  </div>
                  <div className="bg-black border border-white/5 p-4 rounded-2xl text-center">
                    <span className="text-[10px] font-mono uppercase text-gray-500 block">Thermic Foods Index</span>
                    <span className="text-lg font-black text-yellow-400 font-mono mt-1 block">Active (L-Glutamine)</span>
                  </div>
                  <div className="bg-black border border-white/5 p-4 rounded-2xl text-center">
                    <span className="text-[10px] font-mono uppercase text-gray-500 block">Primary Proteins</span>
                    <span className="text-lg font-black text-cyan-400 font-mono mt-1 block">Paneer & Sattu</span>
                  </div>
                  <div className="bg-black border border-white/5 p-4 rounded-2xl text-center">
                    <span className="text-[10px] font-mono uppercase text-gray-500 block">Hydration Target</span>
                    <span className="text-lg font-black text-blue-400 font-mono mt-1 block">4.5 Litres</span>
                  </div>
                </div>

                <div className="bg-black border border-white/5 rounded-3xl p-8 space-y-6">
                  
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <Salad className="w-5 h-5 text-yellow-400 animate-pulse" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Traditional Local meal Plan Schema</h3>
                  </div>

                  <div className="space-y-6">
                    {dietPlan.meals.map((meal, index) => (
                      <div key={index} className="bg-gray-950 p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-yellow-500/20 transition-all">
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-white/5 pb-3 mb-4">
                          <div>
                            <span className="px-2 py-0.5 bg-yellow-950/40 text-yellow-400 text-[9px] font-black uppercase tracking-wider rounded-md border border-yellow-500/10 mr-2">
                              {meal.time}
                            </span>
                            <span className="text-white font-black text-sm uppercase tracking-wider">{meal.name}</span>
                          </div>
                          
                          <div className="text-[11px] font-mono flex gap-4 text-gray-400">
                            <span>Protein: <strong className="text-cyan-400 font-bold">{meal.macros.protein}g</strong></span>
                            <span>Carbs: <strong className="text-amber-500 font-bold">{meal.macros.carbs}g</strong></span>
                            <span>Fats: <strong className="text-red-400 font-bold">{meal.macros.fats}g</strong></span>
                            <span className="bg-yellow-400/10 text-yellow-300 font-bold px-1.5 rounded">{meal.totalCalories} kcal</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest block mb-1">Traditional Local Foods</span>
                            <ul className="space-y-1.5">
                              {meal.items.map((item, id) => (
                                <li key={id} className="text-xs font-bold text-gray-200 flex items-center gap-2">
                                  <Check className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                                  <span>{item.food}</span>
                                  <span className="text-gray-500 font-mono font-medium text-[10px]">({item.portion})</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {meal.items.some(it => it.note) && (
                            <div className="bg-yellow-500/5 p-3 rounded-xl border border-yellow-500/10 flex gap-2 text-[11px] text-yellow-500 leading-snug">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <div>
                                {meal.items.find(it => it.note)?.note || "Local bioavailability optimization active."}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>

                  {/* Regional Advice */}
                  <div className="p-4 bg-yellow-950/20 rounded-2xl border border-yellow-500/20">
                    <span className="text-[10px] font-black uppercase text-yellow-400 tracking-wider block mb-1">Synthesis Advisory Summary</span>
                    <p className="text-xs text-gray-300 leading-relaxed font-bold">
                      {dietPlan.advice}
                    </p>
                  </div>

                </div>

              </div>

            </div>

            {/* WEEKLY GROCERY DISPATCH CARD */}
            <div className="bg-black border border-yellow-500/20 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden shadow-2xl mt-12">
              <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 bg-green-950/40 text-green-400 border border-green-500/20 text-[9px] font-black uppercase tracking-widest rounded-md">
                      n8n Autoloop Connected
                    </span>
                    <span className="px-2.5 py-0.5 bg-yellow-950/40 text-yellow-400 border border-yellow-500/20 text-[9px] font-mono tracking-widest rounded-md">
                      SMS/WHATSAPP CORE
                    </span>
                  </div>
                  <h3 className="text-xl font-black italic uppercase text-white tracking-tight">
                    Sunday Evening Weekly Smart Grocery Hub
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    No foreign avocados or quinoa. Automated local ingredients compiling & WhatsApp dispatch loops.
                  </p>
                </div>

                <button
                  onClick={handleDispatchGrocery}
                  disabled={isGroceryDispatching}
                  className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black text-xs font-black uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_35px_rgba(16,185,129,0.4)] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 shrink-0 self-stretch md:self-auto justify-center"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isGroceryDispatching ? 'SENDING N8N PAYLOAD...' : 'RUN WHATSAPP DISPATCH'}</span>
                </button>
              </div>

              {/* AUTOMATION REPORT DISPLAY */}
              {(isGroceryDispatching || groceryItems) && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in pt-4">
                  
                  {/* Category aggregated list */}
                  <div className="lg:col-span-5 bg-gray-950 p-6 rounded-3xl border border-white/5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <ShoppingCart className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs font-black uppercase tracking-widest text-white">Aggregated Weekly Cart</span>
                    </div>

                    {groceryItems ? (
                      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                        {Object.entries(groceryItems).map(([category, items]) => (
                          <div key={category} className="space-y-2">
                            <span className="text-[10px] text-yellow-500 font-bold tracking-wide uppercase">{category}</span>
                            <ul className="space-y-1.5 pl-1">
                              {items.map((item, idx) => (
                                <li key={idx} className="text-xs font-bold text-gray-300 flex justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                                  <span className="truncate">{item.food}</span>
                                  <span className="text-green-400 font-mono font-black shrink-0 ml-2">{item.quantity}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48">
                        <RefreshCw className="w-6 h-6 text-yellow-400 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Terminal Execution logs */}
                  <div className="lg:col-span-4 bg-black p-6 rounded-3xl border border-white/5 font-mono text-[10px] space-y-4 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-green-500 animate-ping m-4"></div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                        <Terminal className="w-4 h-4 text-cyan-400" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">n8n Execution Logs (/dev/stdout)</span>
                      </div>
                      
                      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                        {groceryLogs.map((log, idx) => (
                          <div key={idx} className={`p-2 rounded border leading-relaxed ${log.status === 'success' ? 'bg-green-950/20 border-green-500/20 text-green-400' : 'bg-gray-950 border-white/5 text-gray-400'}`}>
                            <div className="flex justify-between font-black text-[9px] text-gray-500 mb-1">
                              <span>STEP {idx + 1}</span>
                              <span>{log.time}</span>
                            </div>
                            <span>{log.msg}</span>
                          </div>
                        ))}
                        {isGroceryDispatching && (
                          <div className="flex items-center gap-2 text-cyan-400 text-xs animate-pulse">
                            <span>●</span>
                            <span className="text-[10px] font-bold">TUNNEL COMPILING WEBHOOK SIGNALS...</span>
                          </div>
                        )}
                        {groceryLogs.length === 0 && !isGroceryDispatching && (
                          <div className="text-center text-gray-600 py-12">
                            Awaiting trigger signals ...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp simulator container */}
                  <div className="lg:col-span-3 flex flex-col items-center justify-center">
                    <div className="w-full max-w-[240px] aspect-[9/18] bg-neutral-900 rounded-[2rem] p-3 border-4 border-neutral-800 shadow-2xl relative overflow-hidden">
                      {/* Notch */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 h-4 w-20 bg-neutral-800 rounded-b-xl z-20"></div>
                      
                      {/* Glass screen */}
                      <div className="h-full w-full bg-cover bg-center rounded-[1.5rem] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/40 via-neutral-950 to-neutral-950 border border-white/5 p-2 flex flex-col justify-between relative">
                        <div className="overflow-hidden">
                          {/* Phone Top Bar */}
                          <div className="flex justify-between items-center text-[7px] text-gray-500 font-mono pt-1 pb-2 border-b border-white/5 select-none">
                            <span>Future-Net</span>
                            <div className="flex items-center gap-1">
                              <span>18:00</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                            </div>
                          </div>

                          {/* WhatsApp Chat Header */}
                          <div className="flex items-center gap-1.5 py-1.5 border-b border-white/5">
                            <span className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-black text-[8px]">
                              R
                            </span>
                            <div>
                              <div className="text-[9px] font-black text-white leading-none">Fitness Future OS</div>
                              <span className="text-[7px] text-green-400 leading-none block font-mono">online</span>
                            </div>
                          </div>

                          {/* WhatsApp Chat Bubbles */}
                          <div className="mt-3 space-y-2 max-h-[190px] overflow-y-auto pr-1">
                            {dispatchedMessageSnippet ? (
                              <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-[#056062] text-[8px] text-white p-2 rounded-lg rounded-tl-none border border-[#0b8a8d]/30 max-w-[95%] leading-relaxed whitespace-pre-line relative shadow-lg"
                              >
                                {dispatchedMessageSnippet}
                                <span className="absolute bottom-1 right-1 text-[6px] text-gray-300 font-mono">18:00 ✓✓</span>
                              </motion.div>
                            ) : (
                              <div className="text-center text-[8px] text-gray-600 py-12">
                                {isGroceryDispatching ? 'Delivering...' : 'Ready for dispatch'}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Text box simulator */}
                        <div className="bg-neutral-900 border border-white/5 p-1 rounded-full text-[8.5px] text-gray-500 flex justify-between px-2 select-none">
                          <span>Message...</span>
                          <span className="text-teal-400">⚡</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </>
          ) : (
            <div className="p-12 text-center text-gray-500 font-mono uppercase tracking-widest bg-black border border-white/5 rounded-3xl">
              Compile Biomarker configurations to display customized regional diet protocols.
            </div>
          )}

        </div>
      )}

    </div>
  );
};

// --- MULTI-REGIONAL LOCAL SYNTHESIZER SIMULATOR DATABASE ---
function generateOfflinePlan(cuisine: string, preset: string, sugar: string, fat: string): DietPlan {
  const sugarVal = parseInt(sugar) || 120;
  const fatVal = parseInt(fat) || 20;

  const getCuisineThemeLabel = (id: string) => {
    switch(id) {
      case 'punjabi': return 'Low GI High Protein Punjabi Cuisine Engine';
      case 'rajasthani': return 'Marwadi Desert Grains and Digestive Hydration Model';
      case 'haryanvi': return 'Desi Haryanvi Pure-Sattu Lean Mass Protocol';
      case 'south_indian': return 'Low Carb podi/Ragi Bio-Nutrients Framework';
      default: return 'Custom Traditional Indian Food Synthesis Engine';
    }
  };

  const getPresetRationale = () => {
    if (sugarVal > 140) {
      return "Critical hyper-glycemic protocol loaded. Restricting milled jasmine wheat/white rice. Substituting with hand-ground high-alloy grains with slow glycemic absorption (Bajra / Jowar) paired with heavy probiotics (curd/chaas) to slow initial starch conversion.";
    }
    if (fatVal > 25) {
      return "Thermogenic acceleration active. Heavy protein-to-carbohydrate partition loaded. Utilizing low-fat paneer bhurji and high-alloy leafy sabjis cooked using cold-pressed mustard oil, optimizing fat oxidation.";
    }
    return "Balanced fitness development algorithm active. Stabilized carbohydrates, high natural dairy proteins with rich amino acid sequencing.";
  };

  // Generate meals based on Selected Cuisine
  let meals: Meal[] = [];

  if (cuisine === 'rajasthani') {
    meals = [
      {
        name: 'Early Morning Shakar-Mukti',
        time: '07:00 AM',
        items: [
          { food: 'Sattu-Methi Infusion (Roasted Barley & Fenugreek Powder)', portion: '250ml', note: 'Suppresses liver gluconeogenesis instantly.' },
          { food: 'Munakka & Almonds soaked overnight', portion: '5 units', note: 'Provides clean essential fatty acids.' }
        ],
        totalCalories: 150,
        macros: { protein: 8, carbs: 18, fats: 4 }
      },
      {
        name: 'Pratah-Prem Desi Breakfast',
        time: '09:00 AM',
        items: [
          { food: 'Bajre ki Roti with fresh homemade white butter (limit to 5g) or low-fat Curd', portion: '1 big roti', note: 'Bajra has rich fiber content and prevents insulin surges.' },
          { food: 'Paneer Bhurji with green chilies & coriander', portion: '150g', note: 'Rich in slow-release casein protein.' }
        ],
        totalCalories: 450,
        macros: { protein: 28, carbs: 42, fats: 16 }
      },
      {
        name: 'Madhyanha Marwadi Lunch',
        time: '01:30 PM',
        items: [
          { food: 'Jowar Bhakri paired with Panchmel Dal (Yellow and green lentils)', portion: '1 roti + 1.5 cups dal', note: 'Lentils provide essential amino acids for fast repair.' },
          { food: 'Gatte ki Sabji (steamed chickpea flour dumplings in light spicy yogurt cream)', portion: '1 cup', note: 'Excellent source of complex bio-carbs and minerals.' },
          { food: 'Smoked Lahsun Chutney + Cucumber-Onion Salad', portion: '1 cup', note: 'Garlic contains allicin which enhances cardiovascular recovery.' }
        ],
        totalCalories: 580,
        macros: { protein: 32, carbs: 68, fats: 18 }
      },
      {
        name: 'Sanjeevani Post-Workout/Snack',
        time: '05:30 PM',
        items: [
          { food: 'Chilled Chaas (Jeera Buttermilk with Black Salt & Mint leaf)', portion: '350ml', note: 'Excellent electrolyte restorer. Aids digestion.' },
          { food: 'Roasted Chana (Bhuna) with Skin', portion: '1 small bowl', note: 'High iron and plant-based protein with zero glycemic load.' }
        ],
        totalCalories: 220,
        macros: { protein: 12, carbs: 24, fats: 6 }
      },
      {
        name: 'Twilight Lean Dinner',
        time: '08:30 PM',
        items: [
          { food: 'Steamed Bajra Khichdi with lots of green Moong sprouts and minimal salt', portion: '1.5 cups', note: 'Moong and pearl-millet synthesis locks amino patterns.' },
          { food: 'Sautéed native seasonal vegetables (Tinda / Lauki / Kundru) cooked in cold pressed oil', portion: '1 bowl', note: 'Extremely high hydration index which reduces kidney stress.' }
        ],
        totalCalories: 380,
        macros: { protein: 18, carbs: 54, fats: 10 }
      }
    ];
  } else if (cuisine === 'punjabi') {
    meals = [
      {
        name: 'Power Wake-up Infusion',
        time: '07:30 AM',
        items: [
          { food: 'Cinnamon & Ginger boiled hot herbal tea (Adrak-Dalchini)', portion: '1 cup', note: 'Enhances insulin receptor affinity in cellular walls.' }
        ],
        totalCalories: 20,
        macros: { protein: 1, carbs: 3, fats: 0 }
      },
      {
        name: 'Gabru Bio-Breakfast',
        time: '09:00 AM',
        items: [
          { food: 'Bran-enriched Atta Paneer stuffed Paratha cooked dry without oil on Tawa', portion: '1.5 units', note: 'Paneer is highly anti-catabolic.' },
          { food: 'Thick low-fat dahi (Curd)', portion: '200g', note: 'Provides gut probiotics to process grains.' }
        ],
        totalCalories: 480,
        macros: { protein: 31, carbs: 49, fats: 14 }
      },
      {
        name: 'Sher-E-Punjab Power Lunch',
        time: '02:00 PM',
        items: [
          { food: 'Rajma/Chana Curry cooked in light onion-tomato gravy', portion: '2 cups', note: 'Very rich in vegan protein and dietary fiber.' },
          { food: 'Multi-grain Oats & Missi Roti', portion: '1.5 rotis', note: 'Slow-burning release prevents blood sugar crashes.' },
          { food: 'Raw onion rings and radish sheets', portion: '1 plate', note: 'Raw brassica vegetables aid hormonal metabolism.' }
        ],
        totalCalories: 540,
        macros: { protein: 29, carbs: 64, fats: 12 }
      },
      {
        name: 'Speed recovery Nitro Snack',
        time: '06:00 PM',
        items: [
          { food: 'Double-strained Lassi made with skimmed milk and zero sugars', portion: '300ml', note: 'Replenishes active mineral elements.' },
          { food: 'Boiled Chickpea salad with lemon squeezed', portion: '1 bowl', note: 'High arginine which triggers nutrient delivery.' }
        ],
        totalCalories: 240,
        macros: { protein: 14, carbs: 29, fats: 8 }
      },
      {
        name: 'Twilight Muscle Repair Dinner',
        time: '08:30 PM',
        items: [
          { food: 'Sarson ka Saag (cooked with minimal ghee) with 1 small Makki di Roti', portion: '1 bowl + 1 small roti', note: 'High chlorophyll, iron, and slow bio-carbs.' },
          { food: 'Lightly roasted low-fat Paneer block (marinated in curd and turmeric)', portion: '150g', note: 'Casein profile ensures sleep repairs.' }
        ],
        totalCalories: 420,
        macros: { protein: 26, carbs: 36, fats: 15 }
      }
    ];
  } else if (cuisine === 'haryanvi') {
    meals = [
      {
        name: 'Desi Pre-train Hydrator',
        time: '06:30 AM',
        items: [
          { food: 'Desi Sattu Shake (Roasted Bengal Gram flour stirred in ice water with rock salt)', portion: '350ml', note: 'Extreme stamina and natural cooling agent.' }
        ],
        totalCalories: 180,
        macros: { protein: 11, carbs: 32, fats: 2 }
      },
      {
        name: 'Traditional Haryana Breakfast',
        time: '08:30 AM',
        items: [
          { food: 'Dalia (broken wheat porridge) cooked in double toned cow milk', portion: '2 bowls', note: 'Extremely easily digestible complex carbs.' },
          { food: 'Boiled egg whites or 5 Almonds', portion: '4 whites / 5 nuts', note: 'Pure fast recovery protein.' }
        ],
        totalCalories: 390,
        macros: { protein: 24, carbs: 48, fats: 10 }
      },
      {
        name: 'The Desi Wrestler Lunch',
        time: '01:30 PM',
        items: [
          { food: 'Besan ki Roti (Chickpea flour rich flatbread)', portion: '2 units', note: 'Twice the protein of normal wheat.' },
          { food: 'Desi Kadi with green leafy vegetables (not deep fried pakoras)', portion: '1.5 cups', note: 'High zinc and potassium content.' },
          { food: 'Sprouted Moong & Kala Chana dry chaat', portion: '1 bowl', note: 'Active living enzymes.' }
        ],
        totalCalories: 510,
        macros: { protein: 28, carbs: 62, fats: 14 }
      },
      {
        name: 'Post-Workout Shreshtha Fuel',
        time: '05:30 PM',
        items: [
          { food: 'Jeera Chaas (Buttermilk) with fresh rock salt', portion: '400ml', note: 'Protects kidneys from high blood urea nitrogen.' },
          { food: 'Toasted whole wheat bread with fresh low-fat cottage cheese', portion: '2 slices', note: 'Rebuilds liver glycogen stores.' }
        ],
        totalCalories: 260,
        macros: { protein: 16, carbs: 34, fats: 6 }
      },
      {
        name: 'Soil-to-Gym Twilight Dinner',
        time: '08:00 PM',
        items: [
          { food: 'Bajra-Khichada cooked with green lentils and high garlic', portion: '1.5 plates', note: 'Pearl millet reduces diabetic index.' },
          { food: 'Mixed vegetable vegetable stew (Lauki / Karela / Palak)', portion: '1 large bowl', note: 'Ensures optimal digestive cycle.' }
        ],
        totalCalories: 350,
        macros: { protein: 15, carbs: 58, fats: 6 }
      }
    ];
  } else {
    // General high hydration & proteins fallback
    meals = [
      {
        name: 'Early Morning Activator',
        time: '07:00 AM',
        items: [
          { food: 'Ragi Mudde / Millet porridge with Buttermilk', portion: '300ml', note: 'High calcium and anti-diabetic fiber.' }
        ],
        totalCalories: 200,
        macros: { protein: 10, carbs: 36, fats: 2 }
      },
      {
        name: 'High-Integrity Breakfast',
        time: '09:00 AM',
        items: [
          { food: 'Moong Dal Cheela stuffed with paneer', portion: '2 units', note: 'Rich in vitamin B-complex and clean proteins.' },
          { food: 'Buttermilk with curry leaves', portion: '200ml', note: 'Promotes gut microbial diversity.' }
        ],
        totalCalories: 410,
        macros: { protein: 24, carbs: 42, fats: 12 }
      },
      {
        name: 'Core Diagnostics Lunch',
        time: '01:30 PM',
        items: [
          { food: 'Brown Rice / Jowar flatbread paired with mixed Sambhar', portion: '1 plate', note: 'Sambhar is highly mineralizing.' },
          { food: 'Sprouted organic gram dry sabji', portion: '1.5 cups', note: 'Provides dense antioxidants.' }
        ],
        totalCalories: 490,
        macros: { protein: 20, carbs: 72, fats: 8 }
      },
      {
        name: 'Nutritional Recovery Snack',
        time: '05:30 PM',
        items: [
          { food: 'Fresh coconut water + handful of roasted chana', portion: '1 glass', note: 'Contains natural potassium and sodium binders.' }
        ],
        totalCalories: 180,
        macros: { protein: 8, carbs: 22, fats: 4 }
      },
      {
        name: 'Aesthetic Twilight Dinner',
        time: '08:30 PM',
        items: [
          { food: 'Lean Paneer Tikka / Sautéed Tofu blocks with local veggies', portion: '200g', note: 'Keeps physical growth hormone triggers high during sleep.' }
        ],
        totalCalories: 320,
        macros: { protein: 30, carbs: 12, fats: 14 }
      }
    ];
  }

  // Adjust calories based on inputs
  if (sugarVal > 140) {
    meals = meals.map(m => ({
      ...m,
      totalCalories: Math.round(m.totalCalories * 0.9),
      macros: {
        ...m.macros,
        carbs: Math.round(m.macros.carbs * 0.8),
        protein: Math.round(m.macros.protein * 1.1)
      }
    }));
  }

  return {
    planName: sugarVal > 140 ? 'Neural Glucose Stabilizer OS' : 'Metabolic Thermogenic Synthesis',
    regionalTheme: getCuisineThemeLabel(cuisine),
    coachingRationale: getPresetRationale(),
    digestiveEnzymesRoutine: 'Take 10ml Apple Cider Vinegar or 1 glass Jeera Water containing raw rock salt 10 minutes before Pratah Breakfast to optimize glucose sensitivity.',
    hydrationSchedule: 'Administer 350ml mineralized water with lime every 90 minutes. Drink 400ml cold Chaas at 05:30 PM for high-conductivity cellular hydration.',
    meals,
    advice: `Warning coordinates logged: High glucose (${sugarVal} mg) and high fat (${fatVal}%) require strict consistency. Follow the exact Bajra/Jowar flour mappings and avoid all synthetic zero-sugar powders. Regional, real Indian farming food is superior.`
  };
}
