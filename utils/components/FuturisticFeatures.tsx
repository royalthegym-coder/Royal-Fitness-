
import React, { useState, useRef, useEffect } from 'react';
import Card from './common/Card';
import { CameraIcon } from './icons/CameraIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { analyzeExerciseForm, getRecoveryBasedWorkout, getAIChefRecipe, generateFutureSelfImage, generateTextToSpeech } from '../../lib/gemini';
import { decode, decodeAudioData } from '../audio';
import { BotIcon } from './icons/BotIcon';

// --- ICONS ---
const MoodIcon = () => <span className="text-2xl">🎭</span>;
const ChefIcon = () => <span className="text-2xl">👨‍🍳</span>;
const TimeIcon = () => <span className="text-2xl">⏳</span>;
const EyeIcon = () => <span className="text-2xl">👁️</span>;

// --- SUB-COMPONENTS ---

const AIFormGuard = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [feedback, setFeedback] = useState("Align your body in frame");
    const [status, setStatus] = useState<'Good' | 'Correction Needed' | 'Idle'>('Idle');

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isScanning) {
            startCamera();
            interval = setInterval(captureAndAnalyze, 5000); // Analyze every 5 seconds
        } else {
            stopCamera();
        }
        return () => {
            clearInterval(interval);
            stopCamera();
        };
    }, [isScanning]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            console.error(err);
            setFeedback("Camera permission denied");
        }
    };

    const stopCamera = () => {
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(t => t.stop());
    };

    const captureAndAnalyze = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx?.drawImage(videoRef.current, 0, 0);
        
        const base64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
        setFeedback("Analyzing Form...");
        
        const result = await analyzeExerciseForm(base64);
        setFeedback(result.feedback);
        setStatus(result.status);

        // Text to Speech Feedback
        if (result.feedback) {
            const audioData = await generateTextToSpeech(result.feedback);
            if (audioData) {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const buffer = await decodeAudioData(decode(audioData), ctx, 24000);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start();
            }
        }
    };

    return (
        <Card className="relative overflow-hidden border-2 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-scan" />
            <h3 className="text-xl font-bold text-cyan-400 flex items-center mb-4"><EyeIcon /> <span className="ml-2">AI Form Guard (MediaPipe Core)</span></h3>
            
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
                <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${isScanning ? 'opacity-100' : 'opacity-30'}`} />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* HUD Overlay */}
                {isScanning && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-4 left-4 border-t-2 border-l-2 border-cyan-500 w-8 h-8"/>
                        <div className="absolute top-4 right-4 border-t-2 border-r-2 border-cyan-500 w-8 h-8"/>
                        <div className="absolute bottom-4 left-4 border-b-2 border-l-2 border-cyan-500 w-8 h-8"/>
                        <div className="absolute bottom-4 right-4 border-b-2 border-r-2 border-cyan-500 w-8 h-8"/>
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full text-cyan-400 font-mono text-sm border border-cyan-500/30 backdrop-blur-md">
                            {feedback}
                        </div>
                    </div>
                )}
                {!isScanning && <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-mono">CAMERA OFFLINE</div>}
            </div>

            <button 
                onClick={() => setIsScanning(!isScanning)}
                className={`w-full py-3 font-bold rounded-lg transition-all ${isScanning ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30'}`}
            >
                {isScanning ? 'TERMINATE SCAN' : 'INITIATE FORM CHECK'}
            </button>
        </Card>
    );
};

const SmartRecovery = () => {
    const [energy, setEnergy] = useState(50);
    const [sleep, setSleep] = useState(7);
    const [mood, setMood] = useState('Neutral');
    const [plan, setPlan] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        const res = await getRecoveryBasedWorkout(mood, energy, sleep);
        setPlan(res);
        setLoading(false);
    };

    return (
        <Card className="border-2 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <h3 className="text-xl font-bold text-purple-400 flex items-center mb-4"><MoodIcon /> <span className="ml-2">Smart Recovery Lab</span></h3>
            
            <div className="space-y-4 mb-4">
                <div>
                    <label className="text-xs text-purple-300 uppercase font-bold">Energy Level: {energy}%</label>
                    <input type="range" min="0" max="100" value={energy} onChange={e => setEnergy(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                </div>
                <div>
                    <label className="text-xs text-purple-300 uppercase font-bold">Sleep: {sleep} hrs</label>
                    <input type="range" min="0" max="12" value={sleep} onChange={e => setSleep(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                </div>
                <div className="flex justify-between gap-2">
                    {['Stressed 😫', 'Neutral 😐', 'Pumped 🚀'].map(m => (
                        <button key={m} onClick={() => setMood(m)} className={`flex-1 py-2 text-xs rounded border ${mood === m ? 'bg-purple-500 text-white border-purple-500' : 'border-gray-600 text-gray-400'}`}>
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            <button onClick={handleGenerate} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50">
                {loading ? 'ANALYZING BIOMETRICS...' : 'OPTIMIZE TODAY\'S WORKOUT'}
            </button>

            {plan && (
                <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                    <p className="text-sm text-purple-200 whitespace-pre-wrap">{plan}</p>
                </div>
            )}
        </Card>
    );
};

const AIChef = () => {
    const [ingredients, setIngredients] = useState('');
    const [recipe, setRecipe] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleCook = async () => {
        if (!ingredients) return;
        setLoading(true);
        const jsonStr = await getAIChefRecipe(ingredients);
        try {
            setRecipe(JSON.parse(jsonStr));
        } catch (e) {
            console.error("JSON Parse Error", e);
        }
        setLoading(false);
    };

    return (
        <Card className="border-2 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <h3 className="text-xl font-bold text-green-400 flex items-center mb-4"><ChefIcon /> <span className="ml-2">The AI Chef</span></h3>
            <textarea 
                value={ingredients}
                onChange={e => setIngredients(e.target.value)}
                placeholder="What's in your fridge? (e.g. Eggs, Spinach, Bread)"
                className="w-full bg-gray-900 border border-green-500/30 rounded-lg p-3 text-green-100 placeholder-green-700/50 focus:outline-none focus:border-green-500 mb-4"
                rows={2}
            />
            <button onClick={handleCook} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50">
                {loading ? 'GENERATING RECIPE...' : 'INVENT RECIPE'}
            </button>

            {recipe && (
                <div className="mt-4 animate-fade-in">
                    <h4 className="font-bold text-lg text-white">{recipe.title}</h4>
                    <p className="text-xs text-green-300 mb-2">{recipe.macros}</p>
                    <div className="bg-gray-800 p-3 rounded text-sm text-gray-300 space-y-1">
                        {recipe.instructions?.map((step: string, i: number) => <p key={i}>• {step}</p>)}
                    </div>
                    {recipe.shoppingList?.length > 0 && (
                        <div className="mt-2 text-xs text-yellow-400">
                            Missing: {recipe.shoppingList.join(', ')}
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

const FutureSelfSim = () => {
    const [current, setCurrent] = useState('');
    const [goal, setGoal] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSimulate = async () => {
        if(!current || !goal) return;
        setLoading(true);
        const img = await generateFutureSelfImage(current, goal);
        setImage(img);
        setLoading(false);
    };

    return (
        <Card className="border-2 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <h3 className="text-xl font-bold text-amber-400 flex items-center mb-4"><TimeIcon /> <span className="ml-2">Future Self Simulator</span></h3>
            
            <div className="space-y-3 mb-4">
                <input value={current} onChange={e => setCurrent(e.target.value)} placeholder="Current: 80kg, average build" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white" />
                <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Goal: 75kg, shredded, 6-pack" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white" />
            </div>

            <button onClick={handleSimulate} disabled={loading} className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50">
                {loading ? 'RENDERING TIMELINE...' : 'VISUALIZE 3 MONTHS LATER'}
            </button>

            {image && (
                <div className="mt-4 rounded-lg overflow-hidden border border-amber-500/30">
                    <img src={image} alt="Future Self" className="w-full h-auto" />
                    <p className="text-center text-xs text-amber-500/70 mt-1">AI Projection (Estimated Results)</p>
                </div>
            )}
        </Card>
    );
};

const Gamification = () => (
    <Card className="border-2 border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
        <h3 className="text-xl font-bold text-pink-400 flex items-center mb-4"><BotIcon /> <span className="ml-2">AI Challenges</span></h3>
        <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-pink-900/20 border border-pink-500/30 rounded-lg">
                <div>
                    <p className="text-sm font-bold text-pink-200">Push-up Overlord</p>
                    <p className="text-xs text-pink-400">Beat your record: 50 → 55 reps</p>
                </div>
                <button className="px-3 py-1 bg-pink-600 rounded text-xs font-bold text-white hover:bg-pink-500">ACCEPT</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-pink-900/20 border border-pink-500/30 rounded-lg">
                <div>
                    <p className="text-sm font-bold text-pink-200">Consistency King</p>
                    <p className="text-xs text-pink-400">Log 5 workouts this week</p>
                </div>
                <div className="text-xs text-green-400 font-bold">ACTIVE (3/5)</div>
            </div>
        </div>
    </Card>
);

const FuturisticFeatures: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-900 p-6 space-y-8">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 tracking-wider uppercase drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                    Royal Future Ops
                </h1>
                <p className="text-gray-400 mt-2 font-mono text-xs tracking-[0.3em]">AI INTEGRATED // VERSION 2.0</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                <AIFormGuard />
                <SmartRecovery />
                <AIChef />
                <FutureSelfSim />
                <div className="md:col-span-2">
                    <Gamification />
                </div>
            </div>
        </div>
    );
};

export default FuturisticFeatures;
