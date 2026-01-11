
import React, { useState, useMemo } from 'react';
import Card from './common/Card';
import { INITIAL_MEMBERS, INITIAL_MEMBER_FITNESS_DATA, INITIAL_WORKOUT_TEMPLATES, INITIAL_DIETS } from '../../constants';
import { Member, MemberFitnessData, WorkoutTemplate, DietPlan } from '../../types';
import { getGeniusModeAnalysis, getGeniusModePlan } from '../../lib/gemini';
import { SparkleIcon } from './icons/SparkleIcon';
import { GeniusIcon } from './icons/GeniusIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { sendWhatsAppMessage } from '../../lib/whatsapp';

interface AIPlan {
    workoutPlan: string;
    nutritionPlan: string;
}

const StepCard: React.FC<{ number: number; title: string; children: React.ReactNode; isComplete: boolean }> = ({ number, title, children, isComplete }) => (
    <Card className={`border-l-4 ${isComplete ? 'border-green-500' : 'border-amber-500'}`}>
        <div className="flex items-start">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full ${isComplete ? 'bg-green-500' : 'bg-amber-500'} text-white flex items-center justify-center font-bold mr-4`}>
                {number}
            </div>
            <div className="flex-1">
                <h3 className="text-xl font-bold">{title}</h3>
                <div className="mt-2 text-gray-400">
                    {children}
                </div>
            </div>
        </div>
    </Card>
);

const GeniusMode: React.FC = () => {
    const [selectedMemberId, setSelectedMemberId] = useState<number | ''>(INITIAL_MEMBERS[0]?.id || '');
    
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);

    const [isLoadingPlan, setIsLoadingPlan] = useState(false);
    const [planResult, setPlanResult] = useState<AIPlan | null>(null);
    
    const [isSaving, setIsSaving] = useState(false);

    const member: Member | undefined = useMemo(() => {
        return INITIAL_MEMBERS.find(m => m.id === Number(selectedMemberId));
    }, [selectedMemberId]);

    const memberData: MemberFitnessData[number] = useMemo(() => {
        if (!selectedMemberId) return { logs: [], metrics: [] };
        return INITIAL_MEMBER_FITNESS_DATA[Number(selectedMemberId)] || { logs: [], metrics: [] };
    }, [selectedMemberId]);

    const resetState = () => {
        setAnalysisResult(null);
        setPlanResult(null);
        setIsLoadingAnalysis(false);
        setIsLoadingPlan(false);
        setIsSaving(false);
    };

    const handleGenerateAnalysis = async () => {
        if (!member) return;
        setIsLoadingAnalysis(true);
        setAnalysisResult(null);
        setPlanResult(null);
        const result = await getGeniusModeAnalysis(member, memberData);
        setAnalysisResult(result);
        setIsLoadingAnalysis(false);
    };

    const handleGeneratePlan = async () => {
        if (!analysisResult || !member) return;
        setIsLoadingPlan(true);
        setPlanResult(null);
        const result = await getGeniusModePlan(analysisResult, member);

        const workoutPlan = result.split('### 4-Week Workout Plan ###')[1]?.split('### Nutrition Plan ###')[0]?.trim() || 'Could not generate workout plan.';
        const nutritionPlan = result.split('### Nutrition Plan ###')[1]?.trim() || 'Could not generate nutrition plan.';
        
        setPlanResult({ workoutPlan, nutritionPlan });
        setIsLoadingPlan(false);
    };
    
    const handleSaveAndSchedule = () => {
        if (!planResult || !member) return;
        setIsSaving(true);
        
        // This is a simulation. In a real app, this would trigger API calls.
        // For this demo, we'll just use alerts and assume it's saved.
        setTimeout(() => {
            alert(`New Workout & Nutrition plans for ${member.name} have been saved and scheduled! Check the Workouts and Diet Plans tabs to see the new AI-generated templates.`);
            setIsSaving(false);
        }, 1000);
    };
    
    const handleSendToMember = async () => {
        if (!planResult || !member) return;
        
        const success = await sendWhatsAppMessage({
            mobileNumber: member.phone,
            templateName: "genius_plan_update",
            parameters: [
                { type: "text", text: member.name },
                { type: "text", text: "Your new 4-week AI-powered plan is ready in the portal." }
            ]
        });

        if (success) {
            alert("Plan notification sent via WhatsApp Business!");
        } else {
            alert("Failed to send notification.");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-amber-400 flex items-center">
                    <GeniusIcon />
                    <span className="ml-3">Genius Mode</span>
                </h1>
            </div>

            <div className="space-y-6">
                <StepCard number={1} title="Select Member" isComplete={!!member}>
                    <p className="mb-2">Choose the member you want to analyze and generate a hyper-personalized plan for.</p>
                    <select
                        id="member-select"
                        value={selectedMemberId}
                        onChange={(e) => {
                            setSelectedMemberId(Number(e.target.value));
                            resetState();
                        }}
                        className="w-full max-w-sm bg-gray-700 text-white p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        {INITIAL_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </StepCard>

                {member && (
                    <StepCard number={2} title="AI Deep-Dive Analysis" isComplete={!!analysisResult}>
                        <p className="mb-4">"Genius Mode" will perform a holistic analysis of the member's entire history to identify strengths, weaknesses, and key opportunities for growth.</p>
                        <button onClick={handleGenerateAnalysis} disabled={isLoadingAnalysis} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 disabled:bg-gray-600 flex items-center">
                            <SparkleIcon className="w-5 h-5 mr-2" />
                            {isLoadingAnalysis ? 'Analyzing Member Data...' : 'Start Analysis'}
                        </button>
                        {analysisResult && (
                            <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
                                <h4 className="font-semibold text-green-400 mb-2">Analysis Complete:</h4>
                                <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: analysisResult.replace(/\n/g, '<br />') }} />
                            </div>
                        )}
                    </StepCard>
                )}

                {analysisResult && (
                    <StepCard number={3} title="Generate Optimized 4-Week Plan" isComplete={!!planResult}>
                        <p className="mb-4">Using the analysis as a foundation, the AI will now generate a complete 4-week workout and nutrition plan specifically designed to address the findings.</p>
                        <button onClick={handleGeneratePlan} disabled={isLoadingPlan} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 disabled:bg-gray-600 flex items-center">
                            <SparkleIcon className="w-5 h-5 mr-2" />
                            {isLoadingPlan ? 'Generating Full Plan...' : 'Generate Plan from Analysis'}
                        </button>
                        {planResult && (
                             <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700 space-y-4">
                                <div>
                                    <h4 className="font-semibold text-green-400 mb-2">4-Week Workout Plan:</h4>
                                    <div className="prose prose-invert prose-sm max-w-none max-h-60 overflow-y-auto pr-2" dangerouslySetInnerHTML={{ __html: planResult.workoutPlan.replace(/\n/g, '<br />') }} />
                                </div>
                                <div className="pt-4 border-t border-gray-700">
                                    <h4 className="font-semibold text-green-400 mb-2">Nutrition Plan:</h4>
                                    <div className="prose prose-invert prose-sm max-w-none max-h-60 overflow-y-auto pr-2" dangerouslySetInnerHTML={{ __html: planResult.nutritionPlan.replace(/\n/g, '<br />') }} />
                                </div>
                            </div>
                        )}
                    </StepCard>
                )}

                {planResult && (
                     <StepCard number={4} title="Deploy Plan" isComplete={false}>
                        <p className="mb-4">The plan is ready. You can now save it as a new template, schedule it for the member, and notify them.</p>
                         <div className="flex flex-wrap gap-4">
                            <button onClick={handleSaveAndSchedule} disabled={isSaving} className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 disabled:bg-gray-600 flex items-center">
                                {isSaving ? 'Saving...' : 'Save & Schedule'}
                            </button>
                             <button onClick={handleSendToMember} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-400 flex items-center">
                                 <WhatsAppIcon className="w-5 h-5 mr-2"/>
                                Send via WhatsApp Business
                            </button>
                        </div>
                    </StepCard>
                )}
            </div>
        </div>
    );
};

export default GeniusMode;
