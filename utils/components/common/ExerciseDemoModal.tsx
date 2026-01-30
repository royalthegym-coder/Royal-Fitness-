
import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { VideoCameraIcon } from '../icons/VideoCameraIcon';
import { SparkleIcon } from '../icons/SparkleIcon';
import { BotIcon } from '../icons/BotIcon';
import { SpeakerIcon } from '../icons/SpeakerIcon';
import { CameraIcon } from '../icons/CameraIcon';
import { generateTextToSpeech, analyzeExerciseForm, findBestExerciseMedia } from '../../../lib/gemini';
import { decode, decodeAudioData } from '../../audio';

// --- ICONS ---
const PinterestIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.435.771 1.435 1.696 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.112.112.212.083.382-.09.382-.296 1.191-.336 1.36-.053.22-.172.267-.399.16-1.49-.691-2.422-2.859-2.422-4.603 0-3.748 2.738-7.189 7.892-7.189 4.144 0 7.365 2.953 7.365 6.899 0 4.117-2.595 7.431-6.199 7.431-1.211 0-2.348-.63-2.738-1.373 0 0-.599 2.282-.744 2.84-.282 1.084-1.064 2.456-1.549 3.235C9.573 23.818 10.762 24 12.017 24c6.606 0 11.983-5.367 11.983-11.987 0-6.62-5.377-11.987-11.983-11.987z"/>
    </svg>
);

// --- TYPES ---
interface ExerciseData {
    id: string;
    name: string;
    url: string; // Fallback Image
    youtubeId?: string; // Standard Video
    timestamp?: number; // Semantic Link Start Time
    pinterestId?: string; // Perfect Form AI Video
    setup: string[];
    execution: string[];
    mistakes: string[];
    muscles: string[];
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

const DEFAULT_EXERCISE: ExerciseData = {
    id: 'def',
    name: 'Exercise Guide',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop',
    setup: ['Assume a stable starting position.', 'Engage your core.'],
    execution: ['Perform movement with control.', 'Focus on target muscle.'],
    mistakes: ['Using momentum.', 'Poor posture.'],
    muscles: ['Target Muscle Group'],
    difficulty: 'Beginner'
};

// --- HELPER FUNCTIONS ---
export const getMediaForExercise = (name: string): string => {
    // Placeholder logic for grid thumbnails
    return DEFAULT_EXERCISE.url;
};

// --- AI HUD OVERLAY COMPONENT ---
const AIVisionOverlay = ({ isActive, type }: { isActive: boolean, type: string }) => {
    if (!isActive) return null;
    return (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            <div className="absolute w-full h-1 bg-cyan-400/50 shadow-[0_0_15px_#22d3ee] animate-scan-fast top-0"></div>
            {/* Smart Link Badge */}
            <div className="absolute top-4 left-4 flex flex-col gap-1 z-20">
                <div className="bg-black/80 backdrop-blur-md px-3 py-1 rounded-lg border border-cyan-500/50 flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    <SparkleIcon className="w-3 h-3 text-cyan-400 animate-spin-slow" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Neural Link Active</span>
                </div>
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
    const [activeTab, setActiveTab] = useState<'youtube' | 'pinterest' | 'camera'>('youtube');
    const [isLoading, setIsLoading] = useState(true);
    const [isVoicePlaying, setIsVoicePlaying] = useState(false);
    
    // Neural Audio Cue State
    const [isTempoAudioActive, setIsTempoAudioActive] = useState(false);
    const [tempoPhase, setTempoPhase] = useState<'Eccentric' | 'Concentric'>('Eccentric');
    
    // Camera Logic
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [formFeedback, setFormFeedback] = useState("Align body in frame...");

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                setIsLoading(true);
                setIsVoicePlaying(false);
                setIsCameraActive(false);
                setIsTempoAudioActive(false);

                // Always use AI Scout for Semantic Linking
                console.log(`[AI Scout] Semantic Search: ${exerciseName}`);
                const aiResult = await findBestExerciseMedia(exerciseName);
                
                const newExerciseData: ExerciseData = {
                    ...DEFAULT_EXERCISE,
                    id: `ai-${Date.now()}`,
                    name: exerciseName,
                    youtubeId: aiResult.youtubeId,
                    timestamp: aiResult.timestamp || 0, // Semantic Link
                    url: aiResult.imageUrl || DEFAULT_EXERCISE.url,
                    setup: [aiResult.tips[0] || 'Assume stable position'],
                    execution: [aiResult.tips[1] || 'Perform controlled movement'],
                    mistakes: [aiResult.tips[2] || 'Maintain form'],
                    muscles: ['Target Muscle'],
                    difficulty: 'Intermediate'
                };
                
                setData(newExerciseData);
                setActiveTab(newExerciseData.youtubeId ? 'youtube' : 'pinterest');
                setIsLoading(false);
            };

            fetchData();
        } else {
            stopCamera();
            setIsTempoAudioActive(false);
        }
    }, [isOpen, exerciseName]);

    // Neural Audio Loop
    useEffect(() => {
        let interval: any;
        if (isTempoAudioActive) {
            // 3s Eccentric (Deep), 1s Concentric (High)
            let tick = 0;
            interval = setInterval(() => {
                tick++;
                if (tick <= 3) {
                    setTempoPhase('Eccentric');
                    // Play Deep Sound (Simulated)
                    if (window.AudioContext) {
                        const ctx = new window.AudioContext();
                        const osc = ctx.createOscillator();
                        osc.frequency.value = 150; // Low hum
                        osc.connect(ctx.destination);
                        osc.start();
                        osc.stop(ctx.currentTime + 0.1);
                    }
                } else {
                    setTempoPhase('Concentric');
                    // Play High Sound
                    if (window.AudioContext) {
                        const ctx = new window.AudioContext();
                        const osc = ctx.createOscillator();
                        osc.frequency.value = 400; // High energy
                        osc.connect(ctx.destination);
                        osc.start();
                        osc.stop(ctx.currentTime + 0.1);
                    }
                    if (tick >= 4) tick = 0;
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTempoAudioActive]);

    useEffect(() => {
        if (activeTab === 'camera' && !isCameraActive) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [activeTab]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
            }
        } catch (e) {
            setFormFeedback("Camera access denied or unavailable.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
            setIsCameraActive(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${data.name} Masterclass`}>
            <div className="flex flex-col space-y-4 max-h-[85vh]">
                
                {/* --- VIDEO / MEDIA CONTAINER --- */}
                <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-800 ring-4 ring-amber-500/10 group">
                    
                    {isLoading && activeTab !== 'camera' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-30">
                            <SparkleIcon className="w-10 h-10 text-amber-500 animate-spin mb-3" />
                            <p className="text-amber-500 font-mono text-xs animate-pulse">
                                SEMANTIC LINKING NODE ACTIVE...
                            </p>
                        </div>
                    )}

                    {/* MODE 1: YOUTUBE (SEMANTIC) */}
                    {activeTab === 'youtube' && (
                        <div className="w-full h-full relative">
                            {data.youtubeId ? (
                                <iframe 
                                    src={`https://www.youtube.com/embed/${data.youtubeId}?autoplay=1&start=${data.timestamp}&mute=1&controls=0&modestbranding=1&rel=0&enablejsapi=1`} 
                                    className="w-full h-full object-cover"
                                    allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    onLoad={() => setIsLoading(false)}
                                    title="YouTube"
                                ></iframe>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center relative bg-gray-900">
                                     <p className="text-gray-400 text-xs">AI Scouting for Video...</p>
                                </div>
                            )}
                            <AIVisionOverlay isActive={true} type="Semantic Node" />
                            {data.timestamp && data.timestamp > 0 && (
                                <div className="absolute top-12 left-4 bg-purple-600/90 backdrop-blur px-2 py-0.5 rounded-md text-[9px] font-bold text-white shadow-lg flex items-center gap-1 border border-purple-400/50 z-20">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                    Smart Cue: Skipping intro... ({data.timestamp}s)
                                </div>
                            )}
                        </div>
                    )}

                    {/* MODE 3: LIVE CAMERA CHECK */}
                    {activeTab === 'camera' && (
                        <div className="w-full h-full relative bg-black">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1] opacity-90" />
                            <AIVisionOverlay isActive={true} type="Agentic Vision" />
                            <div className="absolute bottom-6 left-0 right-0 text-center z-30">
                                <span className="bg-black/70 text-cyan-400 px-6 py-2 rounded-full text-xs font-mono font-bold border border-cyan-500/50 shadow-lg backdrop-blur-md">
                                    {formFeedback}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- NEURAL AUDIO CUES --- */}
                <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 flex items-center justify-between">
                    <div>
                        <h4 className="text-white font-bold text-sm">Neural Audio Cues</h4>
                        <p className="text-gray-400 text-xs">Sync tempo: 3s down, 1s up.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {isTempoAudioActive && (
                            <span className={`text-xs font-mono font-bold ${tempoPhase === 'Eccentric' ? 'text-blue-400' : 'text-red-500'}`}>
                                {tempoPhase.toUpperCase()}
                            </span>
                        )}
                        <button 
                            onClick={() => setIsTempoAudioActive(!isTempoAudioActive)}
                            className={`p-2 rounded-full ${isTempoAudioActive ? 'bg-green-500 text-black' : 'bg-gray-700 text-white'}`}
                        >
                            <SpeakerIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* --- TABS --- */}
                <div className="flex bg-gray-900 p-1.5 rounded-xl border border-gray-700 shadow-inner">
                    <button 
                        onClick={() => setActiveTab('youtube')}
                        className={`flex-1 py-2.5 text-[10px] font-black rounded-lg transition-all flex items-center justify-center uppercase tracking-widest ${activeTab === 'youtube' ? 'bg-gray-700 text-white shadow-md ring-1 ring-gray-600' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <VideoCameraIcon className="w-4 h-4 mr-2" /> Tutorial
                    </button>
                    <button 
                        onClick={() => setActiveTab('camera')}
                        className={`flex-1 py-2.5 text-[10px] font-black rounded-lg transition-all flex items-center justify-center uppercase tracking-widest ${activeTab === 'camera' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/50' : 'text-gray-500 hover:text-cyan-400'}`}
                    >
                        <CameraIcon className="w-4 h-4 mr-2" /> Live Check
                    </button>
                </div>

                {/* --- DETAILS --- */}
                <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-5 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="space-y-3 animate-fade-in">
                        {/* Steps */}
                        <div>
                            <h4 className="text-amber-400 font-black text-xs uppercase mb-3 flex items-center tracking-widest">
                                <BotIcon className="w-4 h-4 mr-2" /> Execution Protocol
                            </h4>
                            <ul className="space-y-3 ml-1">
                                {[...data.setup, ...data.execution].map((s, i) => (
                                    <li key={i} className="text-sm text-gray-300 flex items-start gap-3">
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-800 border border-gray-700 text-[10px] font-mono flex items-center justify-center text-amber-500 mt-0.5">{i+1}</span>
                                        <span className="leading-snug">{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={onClose}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-gray-900 font-black py-4 rounded-2xl transition-all shadow-xl shadow-amber-900/20 uppercase tracking-widest text-sm active:scale-[0.98]"
                >
                    Return to Training
                </button>
            </div>
        </Modal>
    );
};

export default ExerciseDemoModal;
