
import React, { useState, useMemo, useRef } from 'react';
import Card from '../common/Card';
import { INITIAL_DIETS, INITIAL_MEMBERS, INITIAL_MEMBER_FITNESS_DATA, INITIAL_PACKAGES } from '../../constants';
import { DietPlan } from '../../types';
import { getComplexResponse, getNutritionAnalysisFromImage } from '../../lib/gemini';
import { SparkleIcon } from '../icons/SparkleIcon';
import { CameraIcon } from '../icons/CameraIcon';
import { BotIcon } from '../icons/BotIcon';
import CameraModal from '../common/CameraModal';

interface DietPlanViewProps {
    memberId: number;
}

interface NutritionData {
    foodName: string;
    calories: number;
    macros: {
        protein: string;
        carbs: string;
        fats: string;
    };
    micros: string[];
    healthScore: number;
    analysis: string;
}

const MacroCard: React.FC<{ label: string; value: string; color: string; percent: number }> = ({ label, value, color, percent }) => (
    <div className="bg-gray-700/50 p-3 rounded-lg flex flex-col items-center flex-1">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
        <div className="w-full bg-gray-600 rounded-full h-1.5 mt-2">
            <div className={`h-1.5 rounded-full ${color.replace('text-', 'bg-')}`} style={{ width: `${percent}%` }}></div>
        </div>
    </div>
);

const DietPlanView: React.FC<DietPlanViewProps> = ({ memberId }) => {
    const [activeTab, setActiveTab] = useState<'plan' | 'scanner' | 'coach'>('plan');
    const [isLoading, setIsLoading] = useState(false);
    const [mealPlan, setMealPlan] = useState<string | null>(null);
    
    // Scanner States
    const [scannerImage, setScannerImage] = useState<string | null>(null);
    const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
    const [rawAnalysis, setRawAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // AI Coach States
    const [aiAdvice, setAiAdvice] = useState<string | null>(null);
    const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);

    const dietPlan: DietPlan | undefined = useMemo(() => {
        return INITIAL_DIETS.find(d => d.assignedTo.includes(memberId));
    }, [memberId]);

    const handleGenerateMealPlan = async () => {
        if (!dietPlan) return;
        setIsLoading(true);
        setMealPlan(null);
        const prompt = `
            Generate a sample 7-day meal plan for a gym-goer in India.
            The diet plan is called "${dietPlan.name}".
            The goal is "${dietPlan.category}".
            The daily calorie target is around ${dietPlan.calories} kcal.
            The description is: "${dietPlan.description}".
            
            Provide vegetarian and non-vegetarian options where possible.
            Format the response using Markdown with headings for each day (e.g., Day 1: Monday) and bullet points for meals (Breakfast, Lunch, Dinner, Snacks).
        `;
        const result = await getComplexResponse(prompt);
        setMealPlan(result);
        setIsLoading(false);
    };

    const handleGetNutritionAdvice = async () => {
        setIsGeneratingAdvice(true);
        setAiAdvice(null);

        const member = INITIAL_MEMBERS.find(m => m.id === memberId);
        const memberData = INITIAL_MEMBER_FITNESS_DATA[memberId] || { metrics: [] };
        const packageInfo = INITIAL_PACKAGES.find(p => p.id === member?.packageId);
        const recentMetrics = memberData.metrics.slice(-3); // Last 3 records

        let scannedFoodContext = "";
        if (nutritionData) {
            scannedFoodContext = `
            **Recently Scanned Meal:**
            - Food: ${nutritionData.foodName}
            - Calories: ${nutritionData.calories}
            - Macros: Protein ${nutritionData.macros.protein}, Carbs ${nutritionData.macros.carbs}, Fats ${nutritionData.macros.fats}
            - Health Score: ${nutritionData.healthScore}/10
            `;
        }

        const prompt = `
            Act as an elite nutrition coach for "Royal The Gym". Provide a "Nutrition Audit" for a member.

            **Member Profile:**
            - Name: ${member?.name}
            - Main Goal: ${packageInfo?.category || 'General Fitness'} (Inferred from membership)
            - Assigned Diet Plan: ${dietPlan?.name || 'None'} (${dietPlan?.category || 'N/A'})

            **Progress Data (Recent Weight History):**
            ${JSON.stringify(recentMetrics)}

            ${scannedFoodContext}

            **Your Task:**
            Based on the trend in their metrics${scannedFoodContext ? ', their recently scanned meal,' : ''} and their goal, provide highly personalized advice.
            
            Format the response in Markdown with these specific sections:
            1. **📉 Metric Analysis:** Analyze if they are moving towards their goal (e.g., losing weight if cutting, gaining if bulking) or if they have plateaued.
            2. **🥑 Macronutrient Tweaks:** Suggest specific adjustments to their current approach. (e.g., "Increase protein by 20g" or "Cycle carbs on rest days").
            ${scannedFoodContext ? '3. **🍽 Meal Critique:** Briefly evaluate the scanned meal. Is it aligned with their goal? If not, what should they change?' : ''}
            ${scannedFoodContext ? '4' : '3'}. **💡 Behavioral Habit:** One simple, non-dietary habit to improve their nutrition (e.g., water intake, sleep timing, chewing speed).

            Keep it encouraging but direct and data-driven.
        `;

        try {
            const result = await getComplexResponse(prompt);
            setAiAdvice(result);
        } catch (error) {
            console.error("Failed to generate advice", error);
            setAiAdvice("Sorry, I couldn't generate advice at this moment. Please try again.");
        } finally {
            setIsGeneratingAdvice(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setScannerImage(event.target?.result as string);
                setNutritionData(null);
                setRawAnalysis(null);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleCapture = (imageDataUrl: string) => {
        setScannerImage(imageDataUrl);
        setNutritionData(null);
        setRawAnalysis(null);
        setIsCameraOpen(false);
    };

    const handleAnalyzeFood = async () => {
        if (!scannerImage) return;
        setIsAnalyzing(true);
        setNutritionData(null);
        try {
            // Extract base64 data
            const base64Data = scannerImage.split(',')[1];
            const mimeType = scannerImage.split(';')[0].split(':')[1];
            const result = await getNutritionAnalysisFromImage(base64Data, mimeType);
            
            try {
                // Remove Markdown code blocks if present
                const cleanJson = result.replace(/```json|```/g, '').trim();
                const parsedData: NutritionData = JSON.parse(cleanJson);
                setNutritionData(parsedData);
            } catch (jsonError) {
                console.warn("Could not parse JSON, falling back to raw text", jsonError);
                setRawAnalysis(result);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to analyze image. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!dietPlan && activeTab === 'plan') {
        return (
            <div className="space-y-6">
                 <div className="flex justify-center mb-6 border-b border-gray-700">
                    <button onClick={() => setActiveTab('plan')} className="pb-2 px-4 text-sm font-medium border-b-2 transition-colors border-amber-500 text-amber-400">My Diet Plan</button>
                    <button onClick={() => setActiveTab('scanner')} className="pb-2 px-4 text-sm font-medium border-b-2 transition-colors border-transparent text-gray-400">AI Food Lens</button>
                    <button onClick={() => setActiveTab('coach')} className="pb-2 px-4 text-sm font-medium border-b-2 transition-colors border-transparent text-gray-400">AI Coach</button>
                </div>
                <Card>
                    <div className="text-center py-10">
                        <h3 className="text-2xl font-bold">No Diet Plan Assigned</h3>
                        <p className="text-gray-400 mt-2">Please contact your trainer to get a personalized diet plan.</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-center mb-6 border-b border-gray-700 overflow-x-auto">
                <button onClick={() => setActiveTab('plan')} className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'plan' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-white'}`}>My Diet Plan</button>
                <button onClick={() => setActiveTab('scanner')} className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'scanner' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-white'}`}>AI Food Lens</button>
                <button onClick={() => setActiveTab('coach')} className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'coach' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-white'}`}>AI Coach</button>
            </div>

            {activeTab === 'plan' && dietPlan && (
                <>
                    <Card className="mb-6">
                        <h2 className="text-2xl font-bold text-amber-400">{dietPlan.name}</h2>
                        <p className="text-lg font-semibold text-gray-300">{dietPlan.category} - Approx. {dietPlan.calories} kcal/day</p>
                        <p className="mt-2 text-gray-400">{dietPlan.description}</p>
                        <button
                            onClick={handleGenerateMealPlan}
                            disabled={isLoading}
                            className="mt-4 w-full sm:w-auto bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-gray-600 flex items-center justify-center"
                        >
                            <SparkleIcon className="w-5 h-5 mr-2" />
                            {isLoading ? 'Generating Plan...' : 'Generate Sample 7-Day Meal Plan'}
                        </button>
                    </Card>

                    {mealPlan && (
                        <Card>
                            <h3 className="text-xl font-bold mb-4">Sample Weekly Meal Plan</h3>
                            <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: mealPlan.replace(/\n/g, '<br />') }}></div>
                        </Card>
                    )}
                </>
            )}

            {activeTab === 'scanner' && (
                <div className="space-y-6">
                    <Card title="AI Food Lens & Nutrition Analyst">
                        <p className="text-sm text-gray-400 mb-4">
                            Upload a photo of your meal. Our advanced AI will identify the food, calculate macros, and provide a detailed health score instantly.
                        </p>
                        
                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-600 rounded-lg bg-gray-800/50">
                            {scannerImage ? (
                                <div className="relative w-full max-w-md">
                                    <img src={scannerImage} alt="Scanned Food" className="rounded-lg w-full h-64 object-cover" />
                                    <button 
                                        onClick={() => setScannerImage(null)} 
                                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-500"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <SparkleIcon className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                                    <p className="text-gray-400 mb-4">No image selected</p>
                                    <div className="flex space-x-3">
                                        <button onClick={() => fileInputRef.current?.click()} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
                                            Upload Photo
                                        </button>
                                        <button onClick={() => setIsCameraOpen(true)} className="bg-amber-500 hover:bg-amber-400 text-gray-900 px-4 py-2 rounded-lg transition-colors flex items-center">
                                            <CameraIcon className="w-5 h-5 mr-2" /> Camera
                                        </button>
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                </div>
                            )}
                        </div>

                        {scannerImage && (
                            <button
                                onClick={handleAnalyzeFood}
                                disabled={isAnalyzing}
                                className="w-full mt-4 bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-400 transition-colors disabled:bg-gray-600 flex items-center justify-center"
                            >
                                <SparkleIcon className="w-5 h-5 mr-2" />
                                {isAnalyzing ? 'Analyzing Food...' : 'Analyze Nutrition'}
                            </button>
                        )}
                    </Card>

                    {nutritionData && (
                        <div className="space-y-6 animate-fade-in">
                            <Card className="border-t-4 border-amber-500">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">{nutritionData.foodName}</h3>
                                        <div className="flex items-center mt-1 space-x-2">
                                            <span className="bg-amber-500 text-gray-900 text-xs font-bold px-2 py-1 rounded">
                                                {nutritionData.calories} kcal
                                            </span>
                                            {nutritionData.micros && nutritionData.micros.map((micro, idx) => (
                                                <span key={idx} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded border border-gray-600">
                                                    {micro}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center bg-gray-800 p-3 rounded-lg border border-gray-700">
                                        <span className="text-xs text-gray-400">Health Score</span>
                                        <span className={`text-3xl font-bold ${nutritionData.healthScore >= 7 ? 'text-green-400' : nutritionData.healthScore >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {nutritionData.healthScore}<span className="text-sm text-gray-500">/10</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <MacroCard 
                                        label="Protein" 
                                        value={nutritionData.macros.protein} 
                                        color="text-blue-400" 
                                        percent={30} // Simulated visual percentage
                                    />
                                    <MacroCard 
                                        label="Carbs" 
                                        value={nutritionData.macros.carbs} 
                                        color="text-green-400" 
                                        percent={50} 
                                    />
                                    <MacroCard 
                                        label="Fats" 
                                        value={nutritionData.macros.fats} 
                                        color="text-yellow-400" 
                                        percent={20} 
                                    />
                                </div>

                                <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                                    <h4 className="font-semibold text-amber-400 mb-2 flex items-center">
                                        <SparkleIcon className="w-4 h-4 mr-2" />
                                        AI Nutritionist Analysis
                                    </h4>
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        {nutritionData.analysis}
                                    </p>
                                </div>
                            </Card>
                        </div>
                    )}

                    {rawAnalysis && !nutritionData && (
                        <Card title="Analysis Result">
                            <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: rawAnalysis.replace(/\n/g, '<br />') }} />
                        </Card>
                    )}
                </div>
            )}

            {activeTab === 'coach' && (
                <div className="space-y-6">
                    <Card title="AI Personal Nutrition Strategist">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="p-4 bg-gray-800 rounded-full border-2 border-amber-500">
                                <BotIcon />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-xl font-bold text-white mb-2">Smart Dietary Adjustments</h4>
                                <p className="text-gray-400 text-sm mb-4">
                                    I analyze your recent weight trends and fitness goals to provide a personalized "Nutrition Audit". 
                                    Stuck at a plateau? Need more energy? Let's check your strategy.
                                </p>
                                <button
                                    onClick={handleGetNutritionAdvice}
                                    disabled={isGeneratingAdvice}
                                    className="bg-amber-500 text-gray-900 font-bold py-2 px-6 rounded-lg hover:bg-amber-400 transition-colors disabled:bg-gray-600 flex items-center"
                                >
                                    <SparkleIcon className="w-5 h-5 mr-2" />
                                    {isGeneratingAdvice ? 'Analyzing Metrics...' : 'Generate Personalized Strategy'}
                                </button>
                            </div>
                        </div>
                    </Card>

                    {aiAdvice && (
                        <Card title="Your Nutrition Strategy">
                            <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: aiAdvice.replace(/\n/g, '<br />') }} />
                        </Card>
                    )}
                </div>
            )}
            
            <CameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={handleCapture} />
        </div>
    );
};

export default DietPlanView;
