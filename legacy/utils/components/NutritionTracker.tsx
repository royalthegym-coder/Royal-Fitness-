import React, { useState, useRef } from 'react';
import { Apple, Utensils, Flame, Droplets, Leaf, Activity, Camera, Plus, Cpu, Zap, Orbit, Terminal, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ai, Type, cleanAndParseJSON } from '../../lib/core_ai';

const NutritionTracker: React.FC = () => {
    const [foodInput, setFoodInput] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [nutritionData, setNutritionData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const analyzeFood = async () => {
        if (!foodInput.trim() && !imagePreview) return;
        setAnalyzing(true);
        setError(null);
        try {
            let response;
            
            if (imagePreview) {
                // Image analysis
                const base64Data = imagePreview.replace(/^data:(image\/\w+);base64,/, "");
                const mimeType = imagePreview.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";
                
                const prompt = `Analyze this meal image. ${foodInput ? `Additional context: "${foodInput}".` : ''} Provide a short futuristic analysis. Return ONLY a JSON object with this exact structure: {"calories": number, "protein": number, "carbs": number, "fat": number, "health_score": number (0-10), "ai_feedback": "string"}`;
                
                response = await ai.models.generateContent({
                    model: 'gemini-4-hydrogen',
                    contents: {
                        parts: [
                            { inlineData: { data: base64Data, mimeType } },
                            { text: prompt }
                        ]
                    }
                });
            } else {
                // Text only analysis
                const prompt = `Analyze this meal: "${foodInput}". Provide a short futuristic analysis.`;
                response = await ai.models.generateContent({
                    model: 'gemini-4-hydrogen',
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                calories: { type: Type.NUMBER, description: "Total calories" },
                                protein: { type: Type.NUMBER, description: "Protein in grams" },
                                carbs: { type: Type.NUMBER, description: "Carbohydrates in grams" },
                                fat: { type: Type.NUMBER, description: "Fat in grams" },
                                health_score: { type: Type.NUMBER, description: "Health score from 0 to 10" },
                                ai_feedback: { type: Type.STRING, description: "Short futuristic analysis of the meal" }
                            },
                            required: ["calories", "protein", "carbs", "fat", "health_score", "ai_feedback"]
                        }
                    }
                });
            }

            const rawText = response.text || "{}";
            console.log("Raw AI Response:", rawText);
            const data = cleanAndParseJSON(rawText);
            
            // Validate data
            if (data.calories === undefined || data.protein === undefined) {
                throw new Error("INVALID DATA STRUCTURE RETURNED");
            }
            
            setNutritionData(data);
        } catch (err: any) {
            console.error("Nutrition AI Error:", err);
            setError(`Fitness Future UPLINK FAILED: ${err.message || "UNABLE TO ANALYZE BIOMETRICS."}`);
        }
        setAnalyzing(false);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20 max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="relative p-12 rounded-[4rem] bg-[#020202] border border-cyan-500/20 shadow-[0_0_120px_rgba(6,182,212,0.15)] overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                {/* Animated Background Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-cyan-500/5 rounded-full animate-spin-slow"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-fuchsia-500/5 rounded-full animate-spin-reverse-slow"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="mb-8 relative"
                    >
                        <div className="absolute inset-0 bg-cyan-500/40 rounded-full blur-3xl animate-pulse"></div>
                        <Orbit className="w-32 h-32 text-white relative z-10 drop-shadow-[0_0_50px_rgba(6,182,212,0.8)]" />
                    </motion.div>
                    
                    <div className="flex items-center gap-3 mb-3">
                        <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                            <Cpu className="w-3 h-3" /> Fitness Future
                        </div>
                    </div>
                    <h1 className="text-7xl font-black text-white italic uppercase tracking-tighter leading-none">
                        Nutrition <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400">Oracle</span>
                    </h1>
                    <div className="flex items-center gap-4 mt-4">
                        <span className="h-px w-12 bg-cyan-500/30"></span>
                        <p className="text-cyan-400 text-[10px] font-mono tracking-[1em] uppercase">Fitness Future ANALYSIS</p>
                        <span className="h-px w-12 bg-cyan-500/30"></span>
                    </div>
                </div>
            </div>

            {/* Input Section */}
            <div className="bg-black border border-white/5 p-8 rounded-[3rem] relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
                
                <div className="relative z-10 flex flex-col gap-4">
                    {imagePreview && (
                        <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-emerald-500/30 group">
                            <img src={imagePreview} alt="Meal Preview" className="w-full h-full object-cover" />
                            <button 
                                onClick={removeImage}
                                className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/50"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative flex items-center gap-2">
                            <div className="relative flex-1">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2">
                                    <Terminal className="w-6 h-6 text-emerald-500" />
                                </div>
                                <input 
                                    type="text" 
                                    value={foodInput}
                                    onChange={(e) => setFoodInput(e.target.value)}
                                    placeholder="INPUT BIOMASS DATA (e.g., Grilled chicken breast with quinoa)..."
                                    className="w-full bg-black border border-emerald-500/30 rounded-full pl-16 pr-6 py-5 text-emerald-400 font-mono text-sm focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all placeholder:text-emerald-900"
                                    onKeyDown={(e) => e.key === 'Enter' && analyzeFood()}
                                />
                            </div>
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-black border border-emerald-500/30 p-5 rounded-full text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400 transition-all flex-shrink-0"
                                title="Upload Image"
                            >
                                <ImageIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <button 
                            onClick={analyzeFood}
                            disabled={analyzing || (!foodInput.trim() && !imagePreview)}
                            className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 px-10 py-5 rounded-full font-black italic uppercase tracking-widest hover:bg-emerald-500/20 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {analyzing ? (
                                <>
                                    <Cpu className="w-6 h-6 animate-pulse" />
                                    PROCESSING...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-6 h-6" />
                                    ANALYZE
                                </>
                            )}
                        </button>
                    </div>
                </div>
                {error && (
                    <div className="mt-4 text-center text-red-500 font-mono text-xs tracking-widest uppercase animate-pulse">
                        {error}
                    </div>
                )}
            </div>

            {/* Results Section */}
            <AnimatePresence>
                {nutritionData && !analyzing && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        <div className="bg-black border border-white/5 p-8 rounded-[3rem] flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-orange-500/30 transition-colors">
                            <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <Flame className="w-10 h-10 text-orange-500 mb-4 relative z-10" />
                            <div className="text-5xl font-black text-white italic relative z-10">{nutritionData.calories}</div>
                            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em] mt-2 relative z-10">Calories</p>
                        </div>
                        
                        <div className="bg-black border border-white/5 p-8 rounded-[3rem] flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-red-500/30 transition-colors">
                            <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <Utensils className="w-10 h-10 text-red-500 mb-4 relative z-10" />
                            <div className="text-5xl font-black text-white italic relative z-10">{nutritionData.protein}g</div>
                            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em] mt-2 relative z-10">Protein</p>
                        </div>

                        <div className="bg-black border border-white/5 p-8 rounded-[3rem] flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-green-500/30 transition-colors">
                            <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <Leaf className="w-10 h-10 text-green-500 mb-4 relative z-10" />
                            <div className="text-5xl font-black text-white italic relative z-10">{nutritionData.carbs}g</div>
                            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em] mt-2 relative z-10">Carbs</p>
                        </div>

                        <div className="bg-black border border-white/5 p-8 rounded-[3rem] flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-yellow-500/30 transition-colors">
                            <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <Droplets className="w-10 h-10 text-yellow-500 mb-4 relative z-10" />
                            <div className="text-5xl font-black text-white italic relative z-10">{nutritionData.fat}g</div>
                            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em] mt-2 relative z-10">Fat</p>
                        </div>

                        <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-black border border-emerald-500/20 p-10 rounded-[3rem] relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-widest flex items-center gap-3">
                                        <Activity className="w-8 h-8 text-emerald-400" />
                                        System Feedback
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-mono text-emerald-500 tracking-widest uppercase">Health Score</span>
                                        <div className="text-3xl font-black text-emerald-400 italic">{nutritionData.health_score}/10</div>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/10">
                                    <p className="text-emerald-100/80 font-mono text-sm leading-relaxed uppercase tracking-wider">
                                        {nutritionData.ai_feedback}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NutritionTracker;
