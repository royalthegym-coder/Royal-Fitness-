import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';
import { Activity, Droplets, Flame, HeartPulse, Brain, Thermometer, ChevronRight, CheckCircle, AlertTriangle, FileText, Upload, Dna, Sun, Wind, Zap, Microscope, Cpu, RefreshCw } from 'lucide-react';
import { ai, generateHyperPersonalizedDiet, cleanAndParseJSON, getComplexResponse } from '../../lib/core_ai';

export const MedicalProfilingSystem: React.FC = () => {
    const { members, updateMember } = useData();
    const { addToast } = useToast();
    
    const [selectedMemberId, setSelectedMemberId] = useState<number | ''>('');
    const [activeTab, setActiveTab] = useState<'questionnaire' | 'blood_report' | 'digital_twin' | 'environment' | 'nutrient_timing'>('questionnaire');
    
    // Questionnaire State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
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

    // Blood Report State
    const [isScanningReport, setIsScanningReport] = useState(false);
    const [reportAnalysis, setReportAnalysis] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Digital Twin State
    const [twinTime, setTwinTime] = useState(0);
    const [muscleSynthesis, setMuscleSynthesis] = useState(0);

    const selectedMember = members.find(m => m.id === Number(selectedMemberId));

    useEffect(() => {
        if (activeTab === 'digital_twin' && selectedMember) {
            const interval = setInterval(() => {
                setTwinTime(prev => prev + 1);
                // Math: (W * H * A) / S
                const w = selectedMember.physical_metrics.weight;
                const h = selectedMember.physical_metrics.height;
                const a = selectedMember.bio_age;
                const s = 1.2 + Math.sin(Date.now() / 1000) * 0.1; // Smart constant fluctuating
                const rate = (w * h * a) / (s * 10000);
                setMuscleSynthesis(rate);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [activeTab, selectedMember]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAnalyzeQuestionnaire = async () => {
        if (!selectedMemberId) {
            addToast("Please select a member first.", "error");
            return;
        }
        
        setIsAnalyzing(true);
        addToast("Initiating Bio-Medical Scan...", "info");

        const promptData = {
            name: selectedMember?.name,
            age: selectedMember?.bio_age,
            gender: selectedMember?.gender || 'Male',
            metrics: selectedMember?.physical_metrics,
            questionnaire: formData,
            goal: "Optimize Health & Longevity"
        };

        try {
            const prompt = `Analyze the user's questionnaire and physical metrics. Identify potential deficiencies (e.g., Vitamin D, B12, Magnesium) based on symptoms like low energy, poor sleep, or joint pain. Suggest specific Ayurvedic and modern nutritional interventions suitable for a hot/dry climate like Rajasthan. Return a JSON object with 'potentialDeficiencies' (array of strings), 'hormonalImbalanceRisk' (string), 'ayurvedicRecommendations' (array of strings), and 'immediateActionPlan' (string). Data: ${JSON.stringify(promptData)}`;
            const res = await getComplexResponse(prompt, "You are an advanced AI Bio-Metrics Analyst and Nutritionist.");
            
            const parsedResult = cleanAndParseJSON(res);
            setAnalysisResult(parsedResult);
            
            if (selectedMember) {
                const updatedMember = {
                    ...selectedMember,
                    medical_history: {
                        ...selectedMember.medical_history,
                        conditions: [...selectedMember.medical_history.conditions, ...(parsedResult.potentialDeficiencies || [])],
                        lifestyle: { ...selectedMember.medical_history.lifestyle, stress: formData.stressLevel, sleep: formData.sleepQuality }
                    }
                };
                updateMember(updatedMember);
            }
            
            addToast("Bio-Medical Scan Complete.", "success");
        } catch (error) {
            console.error(error);
            addToast("Smart Link Failed during analysis.", "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !selectedMember) return;

        const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit per file
        const MAX_TOTAL_SIZE = 18 * 1024 * 1024; // 18MB total limit for Core AI inline data
        let totalSize = 0;

        const validFiles = (Array.from(files) as File[]).filter(file => {
            if (file.size > MAX_SIZE) {
                addToast(`Skipped ${file.name}: File too large (>10MB)`, "error");
                return false;
            }
            if (totalSize + file.size > MAX_TOTAL_SIZE) {
                addToast(`Skipped ${file.name}: Total size exceeds 18MB limit`, "error");
                return false;
            }
            totalSize += file.size;
            return true;
        });

        if (validFiles.length === 0) return;

        const filesArray = validFiles.slice(0, 5); // Limit to 5 reports

        setIsScanningReport(true);
        setReportAnalysis(null);
        addToast(`LayoutLMv3 OCR Scanning Initiated for ${filesArray.length} report(s)...`, "info");

        try {
            const fileParts: any[] = [];
            for (const file of filesArray) {
                const part = await new Promise<any>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const result = event.target?.result;
                            if (typeof result === 'string') {
                                const base64 = result.split(',')[1];
                                let mimeType = file.type || 'image/jpeg';
                                if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
                                resolve({
                                    inlineData: { data: base64, mimeType: mimeType }
                                });
                            } else {
                                reject(new Error("Failed to read file as base64"));
                            }
                        } catch (err) {
                            reject(err);
                        }
                    };
                    reader.onerror = (error) => reject(error);
                    reader.readAsDataURL(file);
                });
                fileParts.push(part);
            }

            const prompt = `
                ACT AS MED-PALM 2 AI ANALYST AND EXPERT FITNESS COACH.
                Analyze these ${filesArray.length} uploaded medical/blood reports for ${selectedMember.name} (Age: ${selectedMember.bio_age}, Gender: ${selectedMember.gender || 'Male'}, Weight: ${selectedMember.physical_metrics?.weight || 'N/A'}kg, Height: ${selectedMember.physical_metrics?.height || 'N/A'}cm).
                
                Provide a highly technical, medical-grade analysis in HTML format (using Tailwind classes like text-emerald-400, bg-black/50, p-4, rounded-xl, mb-4, text-white, font-bold, text-xl, list-disc, pl-5).
                
                Based on a deep and thorough study of ALL these reports combined, you MUST include:
                1. Comprehensive Biomarker Breakdown (extract key values and anomalies across all documents).
                2. Catabolic/Anabolic State Warning based on the findings.
                3. Deficiency Fixer (Suggest specific supplements and medical interventions based on the reports to fix all body issues).
                4. 100% Perfect Muscle Development Workout Plan: A highly accurate, customized workout plan designed to fix their specific issues and optimize muscle growth.
                5. Weekly/Monthly Diet Plan: A highly accurate, hyper-personalized diet plan (weekly or monthly) tailored to their medical profile to ensure 100% perfect body development.
                
                Ensure the response is structured, easy to read, and uses appropriate HTML tags for formatting. Do not use markdown backticks for the HTML output.
            `;
            
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-4-hydrogen',
                    contents: {
                        parts: [
                            ...fileParts,
                            { text: prompt }
                        ]
                    }
                });
                setReportAnalysis(response.text || "<p>Analysis failed to generate text.</p>");
                addToast("Comprehensive Blood Report Analysis Complete.", "success");
            } catch (err) {
                console.error("Vision API Error:", err);
                setReportAnalysis("<p class='text-red-500'>Med-PaLM 2 Link Offline or API Error. Analysis failed.</p>");
                addToast("Analysis failed.", "error");
            } finally {
                setIsScanningReport(false);
            }
        } catch (error) {
            console.error("File reading error:", error);
            setReportAnalysis("<p class='text-red-500'>File reading failed. Please try again.</p>");
            setIsScanningReport(false);
            addToast("Failed to read files.", "error");
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
        <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="mb-6 bg-[#020202] p-8 rounded-[3rem] border border-cyan-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-[2rem] shadow-[0_0_60px_rgba(6,182,212,0.5)] border border-cyan-400 group-hover:rotate-12 transition-transform duration-700">
                             <Dna className="w-12 h-12" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Cpu className="w-3 h-3" /> Fitness Future
                                </div>
                                <span className="text-[10px] font-mono text-cyan-500/70 tracking-[0.4em] uppercase">BIO-DIGITAL HUMAN OPTIMIZER</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Medical <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400">Profiling</span>
                            </h1>
                        </div>
                    </div>
                    
                    <select 
                        value={selectedMemberId}
                        onChange={(e) => setSelectedMemberId(Number(e.target.value))}
                        className="bg-black border border-cyan-500/50 rounded-2xl p-4 text-white font-bold outline-none focus:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] min-w-[250px]"
                    >
                        <option value="">Select Subject</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto gap-4 pb-2 hide-scrollbar">
                {[
                    { id: 'questionnaire', icon: <Activity className="w-4 h-4"/>, label: 'Smart Questionnaire' },
                    { id: 'blood_report', icon: <Microscope className="w-4 h-4"/>, label: 'The Medical Sentinel' },
                    { id: 'digital_twin', icon: <Cpu className="w-4 h-4"/>, label: 'Metabolic Digital Twin' },
                    { id: 'environment', icon: <Sun className="w-4 h-4"/>, label: 'Environmental Sync' },
                    { id: 'nutrient_timing', icon: <Zap className="w-4 h-4"/>, label: 'Nutrient Timing Oracle' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs whitespace-nowrap transition-all ${
                            activeTab === tab.id 
                            ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                            : 'bg-zinc-900/50 text-zinc-400 border border-white/5 hover:text-white hover:bg-zinc-800'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="mt-8">
                {!selectedMemberId ? (
                    <div className="bg-zinc-900/50 border border-white/5 rounded-[2rem] p-12 text-center">
                        <Dna className="w-16 h-16 text-zinc-600 mx-auto mb-4 animate-pulse" />
                        <h3 className="text-xl font-black text-white uppercase tracking-widest">Awaiting Subject</h3>
                        <p className="text-zinc-500 mt-2">Select a member from the top menu to initialize the Bio-Medical Oracle.</p>
                    </div>
                ) : (
                    <>
                        {/* TAB 1: Smart Questionnaire */}
                        {activeTab === 'questionnaire' && (
                            <div className="space-y-6 animate-fade-in">
                                {!analysisResult ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {renderQuestion(<Flame className="w-5 h-5"/>, "Energy Levels", "energyLevels", ["High", "Moderate", "Low (Fatigue)", "Crashes in Afternoon"])}
                                            {renderQuestion(<Brain className="w-5 h-5"/>, "Sleep Quality", "sleepQuality", ["Deep & Restful", "Average", "Trouble Falling Asleep", "Wake Up Tired"])}
                                            {renderQuestion(<Droplets className="w-5 h-5"/>, "Digestion", "digestion", ["Excellent", "Normal", "Bloating/Gas", "Acid Reflux"])}
                                            {renderQuestion(<HeartPulse className="w-5 h-5"/>, "Stress & Mood", "stressLevel", ["Low (Calm)", "Moderate", "High (Anxious)", "Brain Fog"])}
                                            {renderQuestion(<Activity className="w-5 h-5"/>, "Joint & Muscle Health", "jointPain", ["None", "Occasional Stiffness", "Knee/Back Pain", "Slow Recovery"])}
                                            {renderQuestion(<Thermometer className="w-5 h-5"/>, "Local Climate", "climate", ["Hot/Dry (Rajasthan)", "Humid", "Cold", "Moderate"])}
                                        </div>
                                        
                                        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
                                            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Known Deficiencies</h3>
                                            <input 
                                                type="text" 
                                                value={formData.knownDeficiencies}
                                                onChange={(e) => handleInputChange('knownDeficiencies', e.target.value)}
                                                placeholder="e.g., Low Vitamin D, Iron deficiency..."
                                                className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none"
                                            />
                                        </div>

                                        <button 
                                            onClick={handleAnalyzeQuestionnaire}
                                            disabled={isAnalyzing}
                                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-black py-5 rounded-2xl uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                                        >
                                            {isAnalyzing ? (
                                                <><Activity className="w-5 h-5 animate-spin"/> Scanning Bio-Markers...</>
                                            ) : (
                                                <>Initialize Medical Scan <ChevronRight className="w-5 h-5"/></>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <div className="bg-black border border-emerald-500/30 p-8 rounded-[2rem] shadow-[0_0_30px_rgba(16,185,129,0.1)] animate-slide-up">
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

                                            <div className="space-y-4">
                                                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                                    <Activity className="w-4 h-4 text-purple-500"/> Hormonal Status
                                                </h3>
                                                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                                    <p className="text-purple-300 text-sm leading-relaxed">{analysisResult.hormonalImbalanceRisk}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4 md:col-span-2">
                                                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                                    <Droplets className="w-4 h-4 text-cyan-500"/> Ayurvedic & Climate Optimization
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
                                )}
                            </div>
                        )}

                        {/* TAB 2: The Medical Sentinel (Blood Report OCR) */}
                        {activeTab === 'blood_report' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2rem] text-center">
                                    <div className="w-24 h-24 bg-black rounded-full border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 relative">
                                        <Microscope className="w-10 h-10 text-emerald-400" />
                                        {isScanningReport && (
                                            <div className="absolute inset-0 border-t-2 border-emerald-400 rounded-full animate-spin"></div>
                                        )}
                                    </div>
                                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">The Medical Sentinel</h2>
                                    <p className="text-zinc-400 max-w-lg mx-auto mb-8">Upload CBC, Lipid Profile, Thyroid, or Vitamin panels. The AI will use LayoutLMv3 + Med-PaLM 2 to detect hidden deficiencies.</p>
                                    
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="*/*"
                                        multiple
                                        onChange={handleFileUpload}
                                    />
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isScanningReport}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-black font-black px-8 py-4 rounded-2xl uppercase tracking-widest text-xs inline-flex items-center gap-3 transition-all disabled:opacity-50"
                                    >
                                        {isScanningReport ? <><RefreshCw className="w-4 h-4 animate-spin" /> Scanning Report...</> : <><Upload className="w-4 h-4" /> Upload Lab Report</>}
                                    </button>
                                </div>

                                {reportAnalysis && (
                                    <div className="bg-black border border-emerald-500/30 p-8 rounded-[2rem] shadow-[0_0_30px_rgba(16,185,129,0.1)] animate-slide-up">
                                        <div className="flex items-center gap-3 mb-6">
                                            <FileText className="w-6 h-6 text-emerald-400" />
                                            <h3 className="text-xl font-black text-white uppercase italic">Med-PaLM 2 Analysis</h3>
                                        </div>
                                        <div className="prose prose-invert prose-sm max-w-none text-zinc-300" dangerouslySetInnerHTML={{ __html: reportAnalysis }} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 3: Metabolic Digital Twin */}
                        {activeTab === 'digital_twin' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                                <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2rem] relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Cpu className="w-6 h-6 text-cyan-400" />
                                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Digital Twin Simulator</h2>
                                        </div>
                                        <p className="text-zinc-400 text-sm mb-8">Real-time bio-simulation modeling metabolic rate based on Lean Muscle Mass and Age.</p>
                                        
                                        <div className="space-y-6">
                                            <div className="bg-black p-6 rounded-2xl border border-cyan-500/20">
                                                <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-1">Live Muscle Synthesis Rate</p>
                                                <p className="text-4xl font-black text-white font-mono">{muscleSynthesis.toFixed(4)} <span className="text-sm text-zinc-500">g/hr</span></p>
                                            </div>
                                            
                                            <div className="bg-black p-6 rounded-2xl border border-cyan-500/20">
                                                <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-1">Advanced Math (Metabolic Rate)</p>
                                                <div className="font-mono text-emerald-400 text-lg bg-zinc-900 p-4 rounded-xl mt-2 border border-white/5">
                                                    Rate = (W × H × A) / S
                                                </div>
                                                <p className="text-xs text-zinc-500 mt-2">W=Weight, H=Height, A=Age, S=Smart Constant (Updates every second)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2rem]">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Zap className="w-6 h-6 text-amber-400" />
                                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Predictive Impact</h2>
                                    </div>
                                    <p className="text-zinc-400 text-sm mb-6">AI Prediction: If {selectedMember.name} consumes 1g extra protein right now...</p>
                                    
                                    <div className="space-y-4">
                                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-4">
                                            <Activity className="w-6 h-6 text-amber-400 shrink-0" />
                                            <div>
                                                <h4 className="text-white font-bold text-sm">Tomorrow Morning (+12hrs)</h4>
                                                <p className="text-amber-200/70 text-xs mt-1">Muscle Synthesis Rate will increase by 0.024%. Recovery speed enhanced.</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-4">
                                            <Flame className="w-6 h-6 text-emerald-400 shrink-0" />
                                            <div>
                                                <h4 className="text-white font-bold text-sm">Thermic Effect of Food (TEF)</h4>
                                                <p className="text-emerald-200/70 text-xs mt-1">Core temperature will rise by 0.1°C, burning an additional 1.2 kcal during digestion.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: Environmental & Circadian Sync */}
                        {activeTab === 'environment' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-gradient-to-br from-orange-900/40 to-red-900/40 border border-orange-500/30 p-8 rounded-[2rem] col-span-1 md:col-span-1 flex flex-col items-center justify-center text-center">
                                        <Sun className="w-16 h-16 text-orange-400 mb-4 animate-pulse" />
                                        <h3 className="text-4xl font-black text-white font-mono">45°C</h3>
                                        <p className="text-orange-300 text-sm font-bold uppercase tracking-widest mt-2">India</p>
                                        <p className="text-orange-400/70 text-xs mt-1">Extreme Heat Warning</p>
                                    </div>
                                    
                                    <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2rem] col-span-1 md:col-span-2">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Wind className="w-6 h-6 text-cyan-400" />
                                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Thermodynamic Diet Shift</h2>
                                        </div>
                                        <p className="text-zinc-400 text-sm mb-6">AI has detected extreme local heat. Adjusting {selectedMember.name}'s diet to maintain 100% hydration and stable core temperature.</p>
                                        
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-black rounded-xl border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-red-400 line-through font-bold">Pearl Millet</span>
                                                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                                                    <span className="text-emerald-400 font-bold">Barley</span>
                                                </div>
                                                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Cooling Effect</span>
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-black rounded-xl border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-red-400 line-through font-bold">Whey with Milk</span>
                                                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                                                    <span className="text-emerald-400 font-bold">Whey with Buttermilk</span>
                                                </div>
                                                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Probiotic Hydration</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-2xl flex items-start gap-4">
                                    <div className="p-3 bg-emerald-500/20 rounded-xl">
                                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-widest">Smart Bot WhatsApp Alert Queued</h4>
                                        <p className="text-emerald-100/70 text-sm mt-2 italic">
                                            "Hello {selectedMember.name}, a heatwave is expected at Fitness Future today. Please drink coconut water with a pinch of rock salt before your morning workout. Stay hydrated!"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 5: Precision Micro-Nutrient Optimizer */}
                        {activeTab === 'nutrient_timing' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2rem]">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Zap className="w-6 h-6 text-emerald-400" />
                                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Nutrient Timing Oracle</h2>
                                    </div>
                                    <p className="text-zinc-400 text-sm mb-8">Real-time Anabolic Window optimization based on Titan Vision workout intensity.</p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-black p-6 rounded-2xl border border-emerald-500/20">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest">Post-Workout Status</h3>
                                                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-[10px] font-bold uppercase rounded-lg">High Depletion</span>
                                            </div>
                                            <p className="text-white text-sm mb-4">Titan Vision detected a heavy leg day (Squats, Leg Press). Glycogen stores are severely depleted.</p>
                                            
                                            <div className="space-y-3">
                                                <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-xl">
                                                    <p className="text-emerald-400 text-xs font-bold uppercase mb-1">Immediate Action (0-30 mins)</p>
                                                    <p className="text-emerald-100/70 text-sm">Consume 40g Fast-Carbs (e.g., Dextrose or 2 Bananas) + 25g Whey Isolate to trigger an Insulin Spike and halt catabolism.</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-black p-6 rounded-2xl border border-emerald-500/20">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest">Anabolic Window</h3>
                                                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded-lg">Open</span>
                                            </div>
                                            
                                            <div className="relative h-4 bg-zinc-800 rounded-full overflow-hidden mb-2">
                                                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-cyan-500 w-[85%] animate-pulse"></div>
                                            </div>
                                            <p className="text-xs text-zinc-500 text-right mb-4">85% Optimal Absorption</p>
                                            
                                            <div className="space-y-3">
                                                <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl">
                                                    <p className="text-zinc-400 text-xs font-bold uppercase mb-1">Secondary Action (60-90 mins)</p>
                                                    <p className="text-zinc-300 text-sm">Solid meal required. 150g Chicken Breast + 200g White Rice. Avoid fats to ensure rapid digestion.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};