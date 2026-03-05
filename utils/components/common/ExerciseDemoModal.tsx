
import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { SparkleIcon } from '../icons/SparkleIcon';
import { SpeakerIcon } from '../icons/SpeakerIcon';
import { VideoCameraIcon } from '../icons/VideoCameraIcon';
import { generateTextToSpeech } from '../../../lib/gemini';
import { decode, decodeAudioData } from '../../audio';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { BotIcon } from '../icons/BotIcon';
import { AlertTriangle, WifiOff, Youtube, Lock } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

export interface ExerciseData {
    id: string;
    name: string;
    category: string;
    youtubeId: string; // Changed back to YouTube ID for reliability
    thumbnailUrl: string;
    setup: string[];
    execution: string[];
    mistakes: string[];
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro';
    muscles: string[];
}

// --- YOUTUBE-BASED EXERCISE DATABASE (VERIFIED HIGH-QUALITY IDs) ---
export const EXERCISE_DB: Record<string, ExerciseData> = {
    // --- WARMUP / ACTIVATION ---
    'arm circles': { id: 'w1', name: 'Dynamic Arm Circles', category: 'Warmup', youtubeId: '140RTMSahQI', thumbnailUrl: 'https://img.youtube.com/vi/140RTMSahQI/maxresdefault.jpg', setup: ['Stand tall', 'Arms extended'], execution: ['Rotate forward 10x', 'Rotate backward 10x', 'Increase speed gradually'], mistakes: ['Swinging torso'], difficulty: 'Beginner', muscles: ['shoulders', 'arms'] },
    'leg swings': { id: 'w2', name: 'Forward Leg Swings', category: 'Warmup', youtubeId: 'F12Y7Y3aGq0', thumbnailUrl: 'https://img.youtube.com/vi/F12Y7Y3aGq0/maxresdefault.jpg', setup: ['Hold support', 'Swing leg freely'], execution: ['Swing forward and back', 'Keep torso upright'], mistakes: ['Rounding back'], difficulty: 'Beginner', muscles: ['legs', 'core'] },
    'jumping jacks': { id: 'w4', name: 'Jumping Jacks', category: 'Warmup', youtubeId: 'iSSAk4XCsRA', thumbnailUrl: 'https://img.youtube.com/vi/iSSAk4XCsRA/maxresdefault.jpg', setup: ['Stand feet together'], execution: ['Jump feet out, hands up', 'Jump feet in, hands down'], mistakes: ['Landing heavily'], difficulty: 'Beginner', muscles: ['legs', 'arms', 'core'] },
    'cat cow': { id: 'w5', name: 'Cat Cow Stretch', category: 'Warmup', youtubeId: 'kqnua4rHVVA', thumbnailUrl: 'https://img.youtube.com/vi/kqnua4rHVVA/maxresdefault.jpg', setup: ['All fours position'], execution: ['Arch back up (Cat)', 'Dip spine down (Cow)'], mistakes: ['Rushing movement'], difficulty: 'Beginner', muscles: ['back', 'core'] },
    'world greatest stretch': { id: 'w6', name: 'World\'s Greatest Stretch', category: 'Warmup', youtubeId: '-C5_8b05e50', thumbnailUrl: 'https://img.youtube.com/vi/-C5_8b05e50/maxresdefault.jpg', setup: ['Lunge position'], execution: ['Rotate arm to ceiling', 'Stretch hip flexor'], mistakes: ['Knee touching floor'], difficulty: 'Intermediate', muscles: ['legs', 'core', 'back'] },

    // --- CHEST ---
    'bench press': { id: 'c1', name: 'Barbell Bench Press', category: 'Chest', youtubeId: 'rT7DgCr-3pg', thumbnailUrl: 'https://img.youtube.com/vi/rT7DgCr-3pg/maxresdefault.jpg', setup: ['Lie on bench, eyes under bar', 'Grip slightly wider than shoulders', 'Retract scapula'], execution: ['Lower bar to mid-chest', 'Press up driving through feet', 'Keep elbows at 45 degrees'], mistakes: ['Flaring elbows too wide', 'Bouncing bar off chest'], difficulty: 'Intermediate', muscles: ['chest', 'arms', 'shoulders'] },
    'incline dumbbell press': { id: 'c2', name: 'Incline DB Press', category: 'Chest', youtubeId: '8iPEnn-ltbc', thumbnailUrl: 'https://img.youtube.com/vi/8iPEnn-ltbc/maxresdefault.jpg', setup: ['Set bench to 30-45 degrees', 'Kick weights up to shoulders'], execution: ['Press weights vertically', 'Lower until stretch in chest'], mistakes: ['Touching dumbbells at top', 'Arching back excessively'], difficulty: 'Intermediate', muscles: ['chest', 'shoulders', 'arms'] },
    'cable fly': { id: 'c3', name: 'Cable Chest Fly', category: 'Chest', youtubeId: 'Iwe6AmxVf7o', thumbnailUrl: 'https://img.youtube.com/vi/Iwe6AmxVf7o/maxresdefault.jpg', setup: ['Set pulleys to shoulder height', 'Staggered stance'], execution: ['Drive handles together', 'Squeeze chest at peak'], mistakes: ['Bending elbows too much (pressing)', 'Using momentum'], difficulty: 'Intermediate', muscles: ['chest'] },
    'push up': { id: 'c4', name: 'Perfect Push Up', category: 'Chest', youtubeId: 'IODxDxX7oi4', thumbnailUrl: 'https://img.youtube.com/vi/IODxDxX7oi4/maxresdefault.jpg', setup: ['High plank position', 'Hands under shoulders'], execution: ['Lower chest to floor', 'Push back up fully'], mistakes: ['Hips sagging', 'Flaring elbows'], difficulty: 'Beginner', muscles: ['chest', 'arms', 'core'] },
    
    // --- BACK ---
    'lat pulldown': { id: 'b2', name: 'Lat Pulldown', category: 'Back', youtubeId: 'CAwf7n6Luuc', thumbnailUrl: 'https://img.youtube.com/vi/CAwf7n6Luuc/maxresdefault.jpg', setup: ['Adjust thigh pad', 'Wide grip on bar'], execution: ['Pull bar to upper chest', 'Drive elbows down'], mistakes: ['Swinging torso', 'Pulling too low'], difficulty: 'Beginner', muscles: ['back', 'arms'] },
    
    // --- LEGS ---
    'goblet squat': { id: 'l6', name: 'Goblet Squat', category: 'Legs', youtubeId: '2-SLv_I_B1g', thumbnailUrl: 'https://img.youtube.com/vi/2-SLv_I_B1g/maxresdefault.jpg', setup: ['Hold dumbbell vertically', 'Feet shoulder-width'], execution: ['Squat deep', 'Chest up'], mistakes: ['Leaning forward'], difficulty: 'Beginner', muscles: ['legs', 'core'] },
    
    // --- ABS ---
    'plank': { id: 'abs6', name: 'Standard Plank', category: 'Core', youtubeId: 'ASdvN_XEl_c', thumbnailUrl: 'https://img.youtube.com/vi/ASdvN_XEl_c/maxresdefault.jpg', setup: ['Elbows under shoulders', 'Body straight'], execution: ['Squeeze glutes and abs', 'Hold for time'], mistakes: ['Hips sagging', 'Hips too high'], difficulty: 'Beginner', muscles: ['core'] },
    
    // --- FINISHERS (Mandatory) ---
    'burpees': { id: 'f5', name: 'Burpees', category: 'Finisher', youtubeId: 'dZgVxmf6jkA', thumbnailUrl: 'https://img.youtube.com/vi/dZgVxmf6jkA/maxresdefault.jpg', setup: ['Stand tall'], execution: ['Squat, kick back, push up, jump in, jump up'], mistakes: ['Not doing a full push up'], difficulty: 'Advanced', muscles: ['legs', 'chest', 'core', 'arms'] },
};

const DEFAULT_EXERCISE: ExerciseData = { id: 'def', name: 'Protocol Guide', category: 'General', youtubeId: 'h3h60PT5sY', thumbnailUrl: '', setup: ['Assume starting position'], execution: ['Perform movement controlled'], mistakes: ['Check form with trainer'], difficulty: 'Beginner', muscles: [] };

export const getExerciseByName = (name: string): ExerciseData => {
    const lowerName = name.toLowerCase();
    const key = Object.keys(EXERCISE_DB).find(k => lowerName.includes(k));
    return key ? EXERCISE_DB[key] : { ...DEFAULT_EXERCISE, name: name };
};

export const getMediaForExercise = (name: string): string => {
    const ex = getExerciseByName(name);
    return ex.thumbnailUrl;
};

import MuscleModel3D from './MuscleModel3D';

interface ExerciseDemoModalProps {
    isOpen: boolean;
    onClose: () => void;
    exerciseName: string;
    aiMetadata?: { analysis: string; proTips: string[] };
}

const ExerciseDemoModal: React.FC<ExerciseDemoModalProps> = ({ isOpen, onClose, exerciseName, aiMetadata }) => {
    const data = getExerciseByName(exerciseName);
    const [isVoicePlaying, setIsVoicePlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    
    const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Exhale'>('Inhale');
    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            setHasError(false);
            // Simulate buffer time for cinematic effect
            setTimeout(() => setIsLoading(false), 800);
        }
    }, [isOpen, data.youtubeId]);
    
    // Breathing Animation Loop
    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(() => {
            setBreathingPhase(prev => prev === 'Inhale' ? 'Exhale' : 'Inhale');
        }, 3000);
        return () => clearInterval(interval);
    }, [isOpen]);

    // Tip rotation
    useEffect(() => {
        if (!isOpen) return;
        const tips = aiMetadata?.proTips || data.mistakes;
        const interval = setInterval(() => {
            setCurrentTipIndex(prev => (prev + 1) % tips.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [isOpen, aiMetadata, data.mistakes]);

    const handlePlayVoice = async () => {
        setIsVoicePlaying(true);
        const script = `Protocol for ${data.name}. Setup: ${data.setup.join('. ')}. Execution: ${data.execution.join('. ')}. Avoid: ${data.mistakes.join('. ')}`;
        try {
            const audio = await generateTextToSpeech(script);
            if (audio) {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const buffer = await decodeAudioData(decode(audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.onended = () => setIsVoicePlaying(false);
                source.start();
            }
        } catch (e) { setIsVoicePlaying(false); }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="" className="max-w-6xl w-full">
            <div className="flex flex-col lg:flex-row h-[85vh] bg-black text-white rounded-2xl overflow-hidden relative border border-white/10">
                
                {/* LEFT COLUMN: 3D Muscle Model (Demo Zone) */}
                <div className="w-full lg:w-1/3 bg-gray-900/50 border-r border-white/10 flex flex-col relative">
                    <div className="p-4 bg-black/80 border-b border-white/10 z-10">
                        <h3 className="text-lg font-black italic uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                            <SparkleIcon className="w-4 h-4" /> Demo Zone
                        </h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Target Muscle Activation</p>
                    </div>
                    <div className="flex-grow relative">
                        {isOpen && <MuscleModel3D targetMuscles={data.muscles} />}
                        <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10">
                            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">Primary Targets:</p>
                            <div className="flex flex-wrap gap-2">
                                {data.muscles.length > 0 ? data.muscles.map(m => (
                                    <span key={m} className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[9px] font-bold uppercase tracking-widest">
                                        {m}
                                    </span>
                                )) : (
                                    <span className="text-xs text-gray-500">Full Body / Compound</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Video & Info */}
                <div className="w-full lg:w-2/3 flex flex-col relative">
                    {/* Header Overlay */}
                    <div className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-black/90 to-transparent flex justify-between items-start pointer-events-none">
                        <div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white drop-shadow-md flex items-center gap-2">
                                {data.name}
                            </h2>
                            <span className="text-[10px] bg-cyan-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-widest inline-flex items-center mt-1 shadow-lg">
                                {data.category} • {data.difficulty}
                            </span>
                        </div>
                    </div>

                    {/* Main Video Area */}
                    <div className="relative flex-grow bg-black flex items-center justify-center overflow-hidden min-h-[300px]">
                        {isLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black">
                                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Establishing Neural Uplink...</p>
                            </div>
                        )}

                        {!hasError && (
                             <div className="absolute inset-0 w-full h-full bg-black flex flex-col items-center justify-center relative group">
                                 {data.youtubeId ? (
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed/${data.youtubeId}?autoplay=1&modestbranding=1&rel=0&controls=1&disablekb=1`}
                                        title={data.name}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-full object-cover"
                                    ></iframe>
                                 ) : (
                                     <>
                                        <div className="w-32 h-32 rounded-full border-4 border-cyan-500/30 flex items-center justify-center relative animate-pulse">
                                            <div className="absolute inset-0 rounded-full border-t-4 border-cyan-400 animate-spin"></div>
                                            <VideoCameraIcon className="w-12 h-12 text-cyan-400" />
                                        </div>
                                        <p className="mt-6 text-cyan-400 font-mono uppercase tracking-widest text-sm font-bold">Neural Simulation Active</p>
                                     </>
                                 )}
                                 
                                 {/* Security Overlay (Transparent) */}
                                 <div className="absolute inset-0 z-10 pointer-events-none bg-transparent"></div>

                                 {/* Watermark */}
                                 <div className="absolute bottom-4 left-4 z-20 bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg border border-red-500/30 flex items-center gap-2 pointer-events-none">
                                    <Lock className="w-4 h-4 text-red-500" />
                                    <span className="text-[10px] text-white font-mono uppercase tracking-widest">
                                        CONFIDENTIAL • ID: {Date.now().toString().slice(-6)}
                                    </span>
                                 </div>
                             </div>
                        )}
                        
                        {hasError && (
                             <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center text-center p-6">
                                 <WifiOff className="w-16 h-16 text-red-500 mb-4" />
                                 <h3 className="text-xl font-bold text-white mb-2">Signal Lost</h3>
                                 <p className="text-gray-400 text-sm">Unable to load protocol simulation. Please consult floor trainer.</p>
                             </div>
                        )}

                    </div>

                    {/* Info Panel */}
                    <div className="bg-gray-900/95 backdrop-blur-xl border-t border-white/10 p-6 z-20 max-h-[40%] overflow-y-auto custom-scrollbar relative shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                        <div className="flex justify-center mb-4 sticky top-0">
                            <div className="w-12 h-1.5 bg-gray-700 rounded-full"></div>
                        </div>
                        
                        {aiMetadata && (
                            <div className="mb-6 bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/30">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <BotIcon className="w-3 h-3"/> Neural Analysis
                                </p>
                                <p className="text-sm text-indigo-100 italic">"{aiMetadata.analysis}"</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-green-400 uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircleIcon className="w-3 h-3" /> 
                                    {aiMetadata ? 'Pro Tips (AI)' : 'Key Execution Points'}
                                </h4>
                                <div className="bg-black/40 p-4 rounded-xl border border-white/5 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                                    <p className="text-sm text-gray-200 font-medium transition-all duration-500 min-h-[40px] flex items-center">
                                        {aiMetadata ? aiMetadata.proTips[currentTipIndex] : data.execution[currentTipIndex % data.execution.length]}
                                    </p>
                                    <div className="flex gap-1 mt-3 justify-center">
                                        {(aiMetadata?.proTips || data.execution).map((_, i) => (
                                            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentTipIndex ? 'bg-green-500 w-3' : 'bg-gray-700'}`}></div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                                    <AlertTriangle className="w-3 h-3" /> Common Errors
                                </h4>
                                <ul className="text-sm text-gray-400 space-y-2">
                                    {data.mistakes.map((m, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-red-500 mt-1">×</span> {m}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors border border-white/10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </Modal>
    );
};

export default ExerciseDemoModal;
