
import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { VideoCameraIcon } from '../icons/VideoCameraIcon';
import { SparkleIcon } from '../icons/SparkleIcon';
import { BotIcon } from '../icons/BotIcon';
import { SpeakerIcon } from '../icons/SpeakerIcon';
import { generateTextToSpeech } from '../../../lib/gemini';
import { decode, decodeAudioData } from '../../audio';

// --- TYPES ---
interface ExerciseData {
    id: string;
    name: string;
    url: string;
    backupUrl: string;
    setup: string[];
    execution: string[];
    mistakes: string[];
    muscles: string[];
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

// --- ROBUST EXERCISE DATABASE (King Mode Assets) ---
const EXERCISE_DB: Record<string, ExerciseData> = {
    'squat': {
        id: 'sq1',
        name: 'Barbell Squat',
        url: 'https://media.giphy.com/media/1iTH1WIUjM0VATSw/giphy.gif',
        backupUrl: 'https://i.pinimg.com/originals/17/20/d9/1720d9d0d3da26b1696e79db3be98bb0.gif',
        setup: ['Feet shoulder-width apart.', 'Toes slightly pointed out (15-30 degrees).', 'Chest up, core braced.'],
        execution: ['Hinge at hips and bend knees simultaneously.', 'Lower until thighs are parallel to floor.', 'Keep knees in line with toes.', 'Drive through heels to stand.'],
        mistakes: ['Knees caving inward.', 'Heels lifting off floor.', 'Rounding the lower back.'],
        muscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
        difficulty: 'Intermediate'
    },
    'bench press': {
        id: 'bp1',
        name: 'Bench Press',
        url: 'https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif',
        backupUrl: 'https://i.pinimg.com/originals/05/cc/db/05ccdb2b50e4af45d2818f678456f369.gif',
        setup: ['Lie flat on bench, eyes under bar.', 'Feet flat on floor.', 'Grip bar slightly wider than shoulder-width.'],
        execution: ['Lower bar to mid-chest with control.', 'Elbows at 45-degree angle.', 'Press bar up explosively.'],
        mistakes: ['Flaring elbows out too wide.', 'Bouncing bar off chest.', 'Arching back excessively.'],
        muscles: ['Pectoralis Major', 'Triceps', 'Anterior Deltoids'],
        difficulty: 'Intermediate'
    },
    'deadlift': {
        id: 'dl1',
        name: 'Deadlift',
        url: 'https://media.giphy.com/media/pS6qtZYSsZ7sk/giphy.gif',
        backupUrl: 'https://i.makeagif.com/media/6-02-2016/e7q3eZ.gif',
        setup: ['Feet hip-width apart, bar over mid-foot.', 'Hinge hips back, grip bar just outside legs.', 'Flatten back, engage lats.'],
        execution: ['Drive floor away with legs.', 'Keep bar close to body.', 'Lock out hips at top.', 'Lower with control.'],
        mistakes: ['Rounding the spine.', 'Jerking the bar.', 'Squatting instead of hinging.'],
        muscles: ['Posterior Chain', 'Back', 'Glutes', 'Hamstrings'],
        difficulty: 'Advanced'
    },
    'push-up': {
        id: 'pu1',
        name: 'Push Up',
        url: 'https://media.giphy.com/media/5t9Ic9k8R4hYA/giphy.gif',
        backupUrl: 'https://thumbs.gfycat.com/GlossySkinnyDuckbillcat-size_restricted.gif',
        setup: ['High plank position.', 'Hands under shoulders.', 'Body in straight line.'],
        execution: ['Lower chest to floor.', 'Keep elbows tucked (arrow shape).', 'Push back up fully.'],
        mistakes: ['Sagging hips.', 'Flaring elbows.', 'Head dropping forward.'],
        muscles: ['Chest', 'Shoulders', 'Triceps', 'Core'],
        difficulty: 'Beginner'
    },
    'pull-up': {
        id: 'pl1',
        name: 'Pull Up',
        url: 'https://media.giphy.com/media/eM4j65eaf9qHm/giphy.gif',
        backupUrl: 'https://thumbs.gfycat.com/ConstantFailingAustraliancurlew-size_restricted.gif',
        setup: ['Grip bar wider than shoulders.', 'Hang with straight arms.', 'Engage shoulders (don\'t shrug).'],
        execution: ['Pull chest towards bar.', 'Drive elbows down and back.', 'Lower all the way down.'],
        mistakes: ['Kipping/Swinging.', 'Not verifying full range of motion.', 'Chin reaching instead of pulling.'],
        muscles: ['Latissimus Dorsi', 'Biceps', 'Rhomboids'],
        difficulty: 'Advanced'
    },
    'lunge': {
        id: 'lg1',
        name: 'Walking Lunge',
        url: 'https://media.giphy.com/media/l3q2Q3sUEkEyDvfHO/giphy.gif',
        backupUrl: 'https://i.pinimg.com/originals/26/a8/51/26a851943f1675666735e29780b6db13.gif',
        setup: ['Stand tall, feet hip-width apart.', 'Hands on hips or holding weights.'],
        execution: ['Step forward/backward.', 'Lower hips until both knees are 90 degrees.', 'Keep torso upright.'],
        mistakes: ['Front knee passing toes excessively.', 'Torso leaning forward.', 'Narrow stance (tightrope).'],
        muscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
        difficulty: 'Beginner'
    },
    'inchworm': {
        id: 'iw1',
        name: 'Inchworm',
        url: 'https://media.giphy.com/media/xT8qBff8cKDDRPjeXC/giphy.gif',
        backupUrl: 'https://media.giphy.com/media/xT8qBff8cKDDRPjeXC/giphy.gif',
        setup: ['Stand tall.', 'Hinge at hips to touch floor.'],
        execution: ['Walk hands out to plank position.', 'Hold briefly.', 'Walk feet towards hands.'],
        mistakes: ['Sagging hips in plank.', 'Bending knees too much.', 'Rushing the movement.'],
        muscles: ['Core', 'Hamstrings', 'Shoulders'],
        difficulty: 'Intermediate'
    },
    'burpee': {
        id: 'bp2',
        name: 'Burpee',
        url: 'https://media.giphy.com/media/23hPPmr8PvgWE/giphy.gif',
        backupUrl: 'https://media.giphy.com/media/l0HlHjgmez1F96h6g/giphy.gif',
        setup: ['Standing position.'],
        execution: ['Drop to squat, kick feet back.', 'Perform pushup (optional).', 'Jump feet in.', 'Jump up with hands overhead.'],
        mistakes: ['Arching back on jump back.', 'Landing on toes/stiff legs.'],
        muscles: ['Full Body', 'Cardio', 'Explosive Power'],
        difficulty: 'Advanced'
    },
    'mountain climber': {
        id: 'mc1',
        name: 'Mountain Climber',
        url: 'https://media.giphy.com/media/l2JhtVkVOwSMYhXuk/giphy.gif',
        backupUrl: 'https://media.giphy.com/media/3o7TKR1b2XXZkHhYVq/giphy.gif',
        setup: ['High plank position.'],
        execution: ['Drive one knee to chest.', 'Switch legs rapidly.', 'Keep hips low.'],
        mistakes: ['Bouncing hips up and down.', 'Hands forward of shoulders.'],
        muscles: ['Core', 'Cardio', 'Hip Flexors'],
        difficulty: 'Intermediate'
    }
};

const DEFAULT_EXERCISE: ExerciseData = {
    id: 'def',
    name: 'General Fitness Movement',
    url: 'https://media.giphy.com/media/l41Yy4J96X8ehz8xG/giphy.gif',
    backupUrl: 'https://media.giphy.com/media/3o7TKsWIbU8G202MFi/giphy.gif',
    setup: ['Assume a stable starting position.', 'Engage your core.'],
    execution: ['Perform the movement with control.', 'Focus on the target muscle.', 'Breathe rhythmically.'],
    mistakes: ['Using momentum.', 'Holding breath.', 'Poor posture.'],
    muscles: ['Target Muscle Group'],
    difficulty: 'Beginner'
};

// --- HELPER FUNCTIONS ---
const getExerciseData = (name: string): ExerciseData => {
    const n = name.toLowerCase();
    const key = Object.keys(EXERCISE_DB).find(k => n.includes(k));
    if (key) return { ...EXERCISE_DB[key], name: name };
    return { ...DEFAULT_EXERCISE, name: name };
};

export const getMediaForExercise = (name: string): string => {
    return getExerciseData(name).url;
};

// --- COMPONENTS ---

const AIOverlay = ({ isActive }: { isActive: boolean }) => {
    if (!isActive) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-xl">
            {/* Skeletal Tracking Simulation */}
            <div className="absolute top-1/4 left-1/2 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
            <div className="absolute top-1/4 left-[45%] w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75"></div>
            <div className="absolute top-1/4 left-[55%] w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75"></div>
            
            <div className="absolute top-1/2 left-[48%] w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
            
            {/* Dynamic Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            
            {/* Scanning Line */}
            <div className="absolute w-full h-0.5 bg-cyan-400/50 shadow-[0_0_15px_#22d3ee] animate-scan-fast top-0"></div>
            
            {/* Tech Corners */}
            <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-cyan-500"></div>
            <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-cyan-500"></div>
            <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-cyan-500"></div>
            <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-cyan-500"></div>

            <div className="absolute top-4 left-4 bg-black/60 px-2 py-1 rounded border border-cyan-500/50 text-[10px] text-cyan-400 font-mono flex items-center backdrop-blur-sm">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                AI VISION: ANALYZING BIOMECHANICS
            </div>
        </div>
    );
};

interface ExerciseDemoModalProps {
    isOpen: boolean;
    onClose: () => void;
    exerciseName: string;
}

const ExerciseDemoModal: React.FC<ExerciseDemoModalProps> = ({ isOpen, onClose, exerciseName }) => {
    const [data, setData] = useState<ExerciseData>(DEFAULT_EXERCISE);
    const [activeTab, setActiveTab] = useState<'form' | 'analysis'>('form');
    const [imgSrc, setImgSrc] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isVoicePlaying, setIsVoicePlaying] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const foundData = getExerciseData(exerciseName);
            setData(foundData);
            setImgSrc(foundData.url);
            setIsLoading(true);
            setActiveTab('form');
            setIsVoicePlaying(false);
            
            // Safety timeout: stop loading if image takes too long
            const timer = setTimeout(() => setIsLoading(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, exerciseName]);

    const handleImageError = () => {
        console.warn(`Video failed for ${exerciseName}`);
        if (imgSrc === data.url && data.backupUrl) {
            setImgSrc(data.backupUrl);
        } else if (imgSrc === data.backupUrl) {
            setImgSrc(DEFAULT_EXERCISE.url);
        } else {
            // If even default fails, stop loading to show broken image icon/alt text
            setIsLoading(false);
        }
    };

    const handlePlayVoiceGuide = async () => {
        if (isVoicePlaying) return;
        setIsVoicePlaying(true);
        
        const script = `Here is how to do the ${data.name}. ${data.setup.join(' ')} ${data.execution.join(' ')} Focus on correct form to avoid injury.`;
        
        try {
            const audioData = await generateTextToSpeech(script);
            if (audioData) {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const buffer = await decodeAudioData(decode(audioData), ctx, 24000);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.onended = () => setIsVoicePlaying(false);
                source.start();
            } else {
                setIsVoicePlaying(false);
            }
        } catch (e) {
            console.error("TTS Error", e);
            setIsVoicePlaying(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${exerciseName} Guide`}>
            <div className="flex flex-col space-y-4">
                
                {/* ADVANCED MEDIA PLAYER */}
                <div className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-800 group">
                    
                    {/* Loading State */}
                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-20">
                            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                            <span className="text-xs text-cyan-400 font-mono animate-pulse">Fetching 4K Assets...</span>
                        </div>
                    )}

                    {/* Main Visual */}
                    <img 
                        src={imgSrc} 
                        alt={exerciseName} 
                        className={`w-full h-full object-contain transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                        onError={handleImageError}
                        onLoad={() => setIsLoading(false)}
                    />

                    {/* AI Overlay Layer */}
                    {!isLoading && <AIOverlay isActive={true} />}

                    {/* Player Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent flex justify-between items-end z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-2">
                            <button 
                                onClick={handlePlayVoiceGuide}
                                disabled={isVoicePlaying}
                                className={`p-2 rounded-full backdrop-blur-md border border-white/20 transition-all ${isVoicePlaying ? 'bg-green-500 text-white animate-pulse' : 'bg-black/50 text-white hover:bg-black/70'}`}
                                title="AI Voice Guide"
                            >
                                <SpeakerIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex gap-2">
                             <span className={`text-[10px] px-2 py-1 rounded border font-mono font-bold shadow-black/50 shadow-md ${
                                data.difficulty === 'Beginner' ? 'bg-green-900/80 text-green-400 border-green-500' :
                                data.difficulty === 'Intermediate' ? 'bg-yellow-900/80 text-yellow-400 border-yellow-500' :
                                'bg-red-900/80 text-red-400 border-red-500'
                            }`}>
                                {data.difficulty.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* TABS CONTROLS */}
                <div className="flex bg-gray-800 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('form')}
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center ${activeTab === 'form' ? 'bg-amber-500 text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    >
                        <VideoCameraIcon className="w-4 h-4 mr-2" />
                        Technique
                    </button>
                    <button 
                        onClick={() => setActiveTab('analysis')}
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center ${activeTab === 'analysis' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    >
                        <BotIcon className="w-4 h-4 mr-2" />
                        AI Biomechanics
                    </button>
                </div>

                {/* CONTENT AREA */}
                <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 p-4 h-64 overflow-y-auto custom-scrollbar">
                    {activeTab === 'form' ? (
                        <div className="space-y-5 animate-fade-in">
                            <div>
                                <h4 className="text-amber-400 font-bold text-sm uppercase mb-2 flex items-center">
                                    <span className="w-5 h-5 rounded-full border border-amber-500 flex items-center justify-center mr-2 text-[10px] font-mono">1</span>
                                    Setup Position
                                </h4>
                                <ul className="space-y-2 ml-2">
                                    {data.setup.map((s, i) => (
                                        <li key={i} className="flex items-start text-sm text-gray-300">
                                            <span className="text-amber-500 mr-2 mt-1.5 text-[6px]">●</span>
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-green-400 font-bold text-sm uppercase mb-2 flex items-center">
                                    <span className="w-5 h-5 rounded-full border border-green-500 flex items-center justify-center mr-2 text-[10px] font-mono">2</span>
                                    Perfect Execution
                                </h4>
                                <ul className="space-y-2 ml-2">
                                    {data.execution.map((s, i) => (
                                        <li key={i} className="flex items-start text-sm text-gray-300">
                                            <span className="text-green-500 mr-2 mt-1.5 text-[6px]">●</span>
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            {/* Muscle Map Badge */}
                            <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/30">
                                <h4 className="text-blue-400 font-bold text-xs uppercase mb-2 flex items-center">
                                    <SparkleIcon className="w-3 h-3 mr-1" /> Target Activation
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {data.muscles.map((m, i) => (
                                        <span key={i} className="text-[10px] bg-blue-500/20 text-blue-200 px-2 py-1 rounded border border-blue-500/40">
                                            {m}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Mistakes */}
                            <div>
                                <h4 className="text-red-400 font-bold text-sm uppercase mb-3 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    Correction Radar
                                </h4>
                                <ul className="space-y-2">
                                    {data.mistakes.map((m, i) => (
                                        <li key={i} className="flex items-center justify-between text-gray-300 text-xs bg-gray-800 p-2.5 rounded border border-gray-700">
                                            <span>{m}</span>
                                            <span className="text-red-500 font-bold ml-2">AVOID</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-gray-700 text-center">
                                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">
                                    GENERATED BY ROYAL AI ENGINE v2.4
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <button 
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white font-bold py-3 rounded-lg transition-all border border-gray-500 shadow-lg"
                >
                    Resume Workout
                </button>
            </div>
        </Modal>
    );
};

export default ExerciseDemoModal;
