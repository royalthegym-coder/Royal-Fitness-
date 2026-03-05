import React, { useState } from 'react';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';
import { Activity, Droplets, Flame, HeartPulse, Brain, Thermometer, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { generateHyperPersonalizedDiet, cleanAndParseJSON } from '../../lib/gemini';

export const MedicalProfilingSystem: React.FC = () => {
    const { members, updateMember } = useData();
    const { addToast } = useToast();
    
    const [selectedMemberId, setSelectedMemberId] = useState<number | ''>('');
    const [step, setStep] = useState(1);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        energyLevels: 'Moderate',
        sleepQuality: 'Average',
        digestion: 'Normal',
        stressLevel: 'Moderate',
        jointPain: 'None',
        climate: 'Hot/Dry (Rajasthan)',
        recentBloodWork: 'No',
        knownDeficiencies: '',
        dietaryPreferences: 'Vegetarian'
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAnalyze = async () => {
        if (!selectedMemberId) {
            addToast("Please select a member first.", "error");
            return;
        }
        
        setIsAnalyzing(true);
        addToast("Initiating Bio-Medical Scan...", "info");

        const member = members.find(m => m.id === Number(selectedMemberId));
        
        // Construct a prompt for Gemini to act as a Medical AI
        const promptData = {
            name: member?.name,
            age: member?.bio_age,
            gender: member?.gender || 'Male',
            metrics: member?.physical_metrics,
            questionnaire: formData,
            goal: "Optimize Health & Longevity"
        };

        try {
            // Re-using the diet generator but asking for medical insights
            const res = await generateHyperPersonalizedDiet({
                ...promptData,
                // Injecting specific instructions for the AI to act as a doctor
                systemInstruction: "You are an advanced AI Medical Doctor and Nutritionist. Analyze the user's questionnaire and physical metrics. Identify potential deficiencies (e.g., Vitamin D, B12, Magnesium) based on symptoms like low energy, poor sleep, or joint pain. Suggest specific Ayurvedic and modern nutritional interventions suitable for a hot/dry climate like Rajasthan. Return a JSON object with 'potentialDeficiencies' (array of strings), 'hormonalImbalanceRisk' (string), 'ayurvedicRecommendations' (array of strings), and 'immediateActionPlan' (string)."
            });
            
            const parsedResult = cleanAndParseJSON(res);
            setAnalysisResult(parsedResult);
            
            // Update member profile with new medical insights
            if (member) {
                const updatedMember = {
                    ...member,
                    medical_history: {
                        ...member.medical_history,
                        conditions: [...member.medical_history.conditions, ...(parsedResult.potentialDeficiencies || [])],
                        lifestyle: { ...member.medical_history.lifestyle, stress: formData.stressLevel, sleep: formData.sleepQuality }
                    }
                };
                updateMember(updatedMember);
            }
            
            addToast("Bio-Medical Scan Complete.", "success");
        } catch (error) {
            console.error(error);
            addToast("Neural Link Failed during analysis.", "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const renderQuestion = (icon: React.ReactNode, label: string, field: string, options: string[]) => (
        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-black rounded-lg border border-white/10 text-emerald-400">
                    {icon}
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{label}</h3>
            </div>
            <div className="flex flex-wrap gap-3">
                {options.map(opt => (
                    <button
                        key={opt}
                        onClick={() => handleInputChange(field, opt)}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                            (formData as any)[field] === opt 
                            ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                            : 'bg-black text-zinc-400 border border-white/10 hover:text-white'
                        }`}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-zinc-900 to-black p-8 rounded-[3rem] border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-5 h-5 text-emerald-400" />
                            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Bio-Medical Oracle</span>
                        </div>
                        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Smart Health Profiling</h1>
                        <p className="text-zinc-400 mt-2 text-sm">Detect hidden deficiencies and optimize cellular health.</p>
                    </div>
                    
                    <select 
                        value={selectedMemberId}
                        onChange={(e) => setSelectedMemberId(Number(e.target.value))}
                        className="bg-black border border-white/20 rounded-xl p-3 text-white font-bold outline-none focus:border-emerald-500"
                    >
                        <option value="">Select Subject</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
            </div>

            {!analysisResult ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderQuestion(<Flame className="w-5 h-5"/>, "Energy Levels", "energyLevels", ["High", "Moderate", "Low (Fatigue)", "Crashes in Afternoon"])}
                        {renderQuestion(<Brain className="w-5 h-5"/>, "Sleep Quality", "sleepQuality", ["Deep & Restful", "Average", "Trouble Falling Asleep", "Wake Up Tired"])}
                        {renderQuestion(<Droplets className="w-5 h-5"/>, "Digestion", "digestion", ["Excellent", "Normal", "Bloating/Gas", "Acid Reflux"])}
                        {renderQuestion(<HeartPulse className="w-5 h-5"/>, "Stress & Mood", "stressLevel", ["Low (Calm)", "Moderate", "High (Anxious)", "Brain Fog"])}
                        {renderQuestion(<Activity className="w-5 h-5"/>, "Joint & Muscle Health", "jointPain", ["None", "Occasional Stiffness", "Knee/Back Pain", "Slow Recovery"])}
                        {renderQuestion(<Thermometer className="w-5 h-5"/>, "Local Climate", "climate", ["Hot/Dry (Rajasthan)", "Humid", "Cold", "Moderate"])}
                    </div>
                    
                    <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Known Deficiencies (If any blood work done)</h3>
                        <input 
                            type="text" 
                            value={formData.knownDeficiencies}
                            onChange={(e) => handleInputChange('knownDeficiencies', e.target.value)}
                            placeholder="e.g., Low Vitamin D, Iron deficiency..."
                            className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none"
                        />
                    </div>

                    <button 
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !selectedMemberId}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-black py-5 rounded-2xl uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                    >
                        {isAnalyzing ? (
                            <><Activity className="w-5 h-5 animate-spin"/> Scanning Bio-Markers...</>
                        ) : (
                            <>Initialize Medical Scan <ChevronRight className="w-5 h-5"/></>
                        )}
                    </button>
                </div>
            ) : (
                <div className="space-y-6 animate-slide-up">
                    <div className="bg-black border border-emerald-500/30 p-8 rounded-[2rem] shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                        <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
                            <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center border border-emerald-500/50">
                                <CheckCircle className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Diagnostic Complete</h2>
                                <p className="text-emerald-400 text-sm font-mono mt-1">AI Medical Oracle Analysis</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Deficiencies */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500"/> Potential Deficiencies
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {analysisResult.potentialDeficiencies?.map((def: string, i: number) => (
                                        <span key={i} className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-sm font-medium">
                                            {def}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Hormonal Risk */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-purple-500"/> Hormonal Status
                                </h3>
                                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                    <p className="text-purple-300 text-sm leading-relaxed">{analysisResult.hormonalImbalanceRisk}</p>
                                </div>
                            </div>

                            {/* Ayurvedic Interventions */}
                            <div className="space-y-4 md:col-span-2">
                                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <Droplets className="w-4 h-4 text-cyan-500"/> Ayurvedic & Climate Optimization (Rajasthan)
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {analysisResult.ayurvedicRecommendations?.map((rec: string, i: number) => (
                                        <div key={i} className="p-4 bg-cyan-900/10 border border-cyan-500/20 rounded-xl flex items-start gap-3">
                                            <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></div>
                                            <p className="text-cyan-100 text-sm">{rec}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Plan */}
                            <div className="space-y-4 md:col-span-2">
                                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-500"/> Immediate Action Plan
                                </h3>
                                <div className="p-6 bg-emerald-900/10 border border-emerald-500/30 rounded-2xl">
                                    <p className="text-emerald-300 text-sm leading-relaxed font-medium">{analysisResult.immediateActionPlan}</p>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setAnalysisResult(null)}
                            className="mt-8 w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-4 rounded-xl uppercase tracking-widest text-xs transition-all border border-white/10"
                        >
                            Run New Scan
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
