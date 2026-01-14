
import React, { useState, useMemo, useRef } from 'react';
import Card from '../common/Card';
import { INITIAL_DIETS, INITIAL_MEMBERS, INITIAL_MEMBER_FITNESS_DATA, INITIAL_PACKAGES, INITIAL_HEALTH_DATA } from '../../../constants';
import { DietPlan } from '../../../types';
import { getComplexResponse, getNutritionAnalysisFromImage } from '../../../lib/gemini';
import { SparkleIcon } from '../icons/SparkleIcon';
import { CameraIcon } from '../icons/CameraIcon';
import { BotIcon } from '../icons/BotIcon';
import CameraModal from '../common/CameraModal';
import { FireIcon, StepIcon } from '../icons/ActivityIcons';
import { SleepIcon } from '../icons/HealthIcons';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
    goalAdvice?: string;
}

// Icon for Download
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;

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
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    
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
        
        // Simulating live wearable data sync
        const wearableData = INITIAL_HEALTH_DATA;

        let scannedFoodContext = "";
        if (nutritionData) {
            scannedFoodContext = `
            **Recently Scanned Meal:**
            - Food: ${nutritionData.foodName}
            - Calories: ${nutritionData.calories}
            - Macros: Protein ${nutritionData.macros.protein}, Carbs ${nutritionData.macros.carbs}, Fats ${nutritionData.macros.fats}
            - Health Score: ${nutritionData.healthScore}/10
            `;
        } else {
            scannedFoodContext = "No recent food scan available.";
        }

        const prompt = `
            Act as an elite, holistic nutrition coach for "Royal The Gym". Provide a "360° Nutrition & Lifestyle Audit" for a member.

            **Member Profile:**
            - Name: ${member?.name}
            - Main Goal: ${packageInfo?.category || 'General Fitness'} (Inferred from membership)
            - Assigned Diet Plan: ${dietPlan?.name || 'None'} (${dietPlan?.category || 'N/A'})

            **Wearable & Activity Data (Today's Live Sync):**
            - Steps: ${wearableData.steps}
            - Active Calories Burned: ${wearableData.caloriesBurned} kcal
            - Sleep: ${wearableData.sleep.totalHours} hours (Deep: ${wearableData.sleep.deepHours}h)
            - Resting HR: ${wearableData.heartRate.min} bpm

            **Progress Data (Recent Weight History):**
            ${JSON.stringify(recentMetrics)}

            ${scannedFoodContext}

            **Your Task:**
            Based on the convergence of their diet, activity output, and sleep recovery, provide highly personalized advice.
            
            Format the response in Markdown with these specific sections:
            1. **📊 Energy Balance Analysis:** Compare their activity output (${wearableData.caloriesBurned} kcal burned) with their nutritional needs. Are they fueling enough for their movement?
            2. **🥑 Macronutrient & Recovery Tweaks:** Suggest specific adjustments. If sleep is low (${wearableData.sleep.totalHours}h), suggest nutrients to aid recovery (e.g., Magnesium, Casein).
            ${nutritionData ? '3. **🍽 Meal Critique:** Briefly evaluate the scanned meal in context of their day\'s activity.' : ''}
            ${nutritionData ? '4' : '3'}. **💡 Holistic Habit:** One behavioral change linking nutrition to their lifestyle data (e.g. "Eat complex carbs post-workout to replenish glycogen from your high step count").

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
        
        // Determine member goal context
        const member = INITIAL_MEMBERS.find(m => m.id === memberId);
        const pkg = INITIAL_PACKAGES.find(p => p.id === member?.packageId);
        const goal = dietPlan?.category || pkg?.category || 'General Fitness';

        try {
            // Extract base64 data
            const base64Data = scannerImage.split(',')[1];
            const mimeType = scannerImage.split(';')[0].split(':')[1];
            const result = await getNutritionAnalysisFromImage(base64Data, mimeType, goal);
            
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

    const handleDownloadPDF = async () => {
        setIsDownloadingPdf(true);
        const element = document.getElementById('diet-content');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#111827' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            // Allow multipage if long
            if (imgHeight > pdfHeight) {
                // Simplified multipage strategy for demo: shrink to fit or add pages
                // Just add image for now, standard PDF handling logic would be more complex
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
            } else {
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
            }
            
            // Add Footer
            pdf.setFontSize(10);
            pdf.setTextColor(150);
            // Ensure text is at the very bottom
            pdf.text("Generated by Royal The Gym", pdfWidth / 2, pdfHeight - 10, { align: 'center' });
            
            pdf.save(`${dietPlan?.name || 'Diet'}_Plan.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Could not download PDF.');
        } finally {
            setIsDownloadingPdf(false);
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
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-amber-400">{dietPlan.name}</h2>
                                <p className="text-lg font-semibold text-gray-300">{dietPlan.category} - Approx. {dietPlan.calories} kcal/day</p>
                                <p className="mt-2 text-gray-400">{dietPlan.description}</p>
                            </div>
                            {mealPlan && (
                                <button
                                    onClick={handleDownloadPDF}
                                    disabled={isDownloadingPdf}
                                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white flex items-center transition-colors text-xs font-bold disabled:opacity-50"
                                    title="Download PDF"
                                >
                                    {isDownloadingPdf ? <SparkleIcon className="w-4 h-4 animate-spin"/> : <DownloadIcon />}
                                    <span className="ml-1 hidden sm:inline">PDF</span>
                                </button>
                            )}
                        </div>
                        {!mealPlan && (
                            <button
                                onClick={handleGenerateMealPlan}
                                disabled={isLoading}
                                className="mt-4 w-full sm:w-auto bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-gray-600 flex items-center justify-center"
                            >
                                <SparkleIcon className="w-5 h-5 mr-2" />
                                {isLoading ? 'Generating Plan...' : 'Generate Sample 7-Day Meal Plan'}
                            </button>
                        )}
                    </Card>

                    {mealPlan && (
                        <div id="diet-content" className="relative p-2 rounded-lg bg-gray-900 overflow-hidden">
                            {/* Watermark */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                                <h1 className="text-9xl font-black text-gray-700/10 -rotate-45 whitespace-nowrap select-none">
                                    ROYAL THE GYM
                                </h1>
                            </div>
                            
                            <Card className="relative z-10 bg-transparent border-none">
                                <h3 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Sample Weekly Meal Plan</h3>
                                <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: mealPlan.replace(/\n/g, '<br />') }}></div>
                            </Card>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'scanner' && (
                <div className="space-y-6">
                    <Card title="AI Food Lens & Nutrition Analyst">
                        <p className="text-sm text-gray-400 mb-4">
                            Upload a photo of your meal. Our advanced AI will identify the food, calculate macros, vitamins, minerals, and provide personalized advice based on your fitness goal.
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
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="bg-amber-500 text-gray-900 text-xs font-bold px-2 py-1 rounded">
                                                {nutritionData.calories} kcal
                                            </span>
                                            {nutritionData.micros && nutritionData.micros.map((micro, idx) => (
                                                <span key={idx} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded border border-gray-600 flex items-center">
                                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></span>
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

                                <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700 space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-amber-400 mb-2 flex items-center">
                                            <SparkleIcon className="w-4 h-4 mr-2" />
                                            AI Nutritionist Analysis
                                        </h4>
                                        <p className="text-gray-300 text-sm leading-relaxed">
                                            {nutritionData.analysis}
                                        </p>
                                    </div>
                                    {nutritionData.goalAdvice && (
                                        <div className="pt-4 border-t border-gray-700">
                                            <h4 className="font-semibold text-blue-400 mb-2 flex items-center">
                                                <BotIcon className="w-4 h-4 mr-2" />
                                                Goal-Based Advice ({dietPlan?.category || 'General Fitness'})
                                            </h4>
                                            <p className="text-gray-300 text-sm leading-relaxed italic">
                                                "{nutritionData.goalAdvice}"
                                            </p>
                                        </div>
                                    )}
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
                                    I analyze your <strong>Wearable Data</strong>, <strong>Recent Food Logs</strong>, and <strong>Weight Trends</strong> to provide a 360° personalized "Nutrition Audit". 
                                    Stuck at a plateau? Need more energy? Let's check your strategy.
                                </p>
                                
                                {/* Data Sources Indicator */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="text-[10px] bg-blue-900/30 text-blue-300 px-2 py-1 rounded border border-blue-500/30 flex items-center">
                                        <StepIcon className="w-3 h-3 mr-1" />
                                        Steps & Cals Synced
                                    </span>
                                    <span className="text-[10px] bg-purple-900/30 text-purple-300 px-2 py-1 rounded border border-purple-500/30 flex items-center">
                                        <SleepIcon className="w-3 h-3 mr-1" />
                                        Sleep Synced ({INITIAL_HEALTH_DATA.sleep.totalHours}h)
                                    </span>
                                    <span className={`text-[10px] px-2 py-1 rounded border flex items-center ${nutritionData ? 'bg-green-900/30 text-green-300 border-green-500/30' : 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                                        <SparkleIcon className="w-3 h-3 mr-1" />
                                        Food Log: {nutritionData ? 'Active' : 'Empty'}
                                    </span>
                                </div>

                                <button
                                    onClick={handleGetNutritionAdvice}
                                    disabled={isGeneratingAdvice}
                                    className="bg-amber-500 text-gray-900 font-bold py-2 px-6 rounded-lg hover:bg-amber-400 transition-colors disabled:bg-gray-600 flex items-center shadow-lg"
                                >
                                    <SparkleIcon className="w-5 h-5 mr-2" />
                                    {isGeneratingAdvice ? 'Analyzing Holistic Data...' : 'Generate 360° Strategy'}
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
