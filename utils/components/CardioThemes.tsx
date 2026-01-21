
import React, { useState, useEffect } from 'react';
import { FireIcon, TimerIcon } from './icons/ActivityIcons';
import { SparkleIcon } from './icons/SparkleIcon';
import Modal from './common/Modal';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { BotIcon } from './icons/BotIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';

const themes = [
    {
        id: 1,
        title: "Neon HIIT Blast",
        duration: "45 Min",
        cal: "600+",
        image: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=600&auto=format&fit=crop",
        video: "https://v.ftcdn.net/05/57/45/78/700_F_557457856_pU7fPjD6Gf9P8eBvLpYl0zR2TjL6F1Z1_ST.mp4",
        intensity: "High",
        color: "from-pink-500 to-purple-600"
    },
    {
        id: 2,
        title: "Midnight Spin",
        duration: "60 Min",
        cal: "800+",
        image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop",
        video: "https://v.ftcdn.net/04/34/38/27/700_F_434382727_2p5iN8fV3v5X9f4f1u9z6n9v0L8o7R2p_ST.mp4",
        intensity: "Extreme",
        color: "from-cyan-500 to-blue-600"
    },
    {
        id: 3,
        title: "Zen Cardio Flow",
        duration: "30 Min",
        cal: "300+",
        image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=600&auto=format&fit=crop",
        video: "https://v.ftcdn.net/05/18/61/10/700_F_518611012_v1zX9n9v0L8o7R2p_ST.mp4",
        intensity: "Low",
        color: "from-green-400 to-emerald-600"
    },
    {
        id: 4,
        title: "Boxer's Rhythm",
        duration: "50 Min",
        cal: "750+",
        image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=600&auto=format&fit=crop",
        video: "https://v.ftcdn.net/05/49/71/93/700_F_549719386_v1zX9n9v0L8o7R2p_ST.mp4",
        intensity: "High",
        color: "from-red-500 to-orange-600"
    }
];

const CardioThemes: React.FC = () => {
    const [activeTheme, setActiveTheme] = useState<typeof themes[0] | null>(null);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [videoReady, setVideoReady] = useState(false);
    const [generationLogs, setGenerationLogs] = useState<string[]>([]);
    const [videoError, setVideoError] = useState(false);

    const handleStartSession = (theme: typeof themes[0]) => {
        setActiveTheme(theme);
        setVideoReady(false);
        setVideoError(false);
    };

    const handleClose = () => {
        setActiveTheme(null);
        setIsGeneratingVideo(false);
        setVideoReady(false);
        setVideoError(false);
    };

    const handleGenerateAIVideo = () => {
        setIsGeneratingVideo(true);
        setGenerationLogs(["Initializing SVD-XT Open Source Core..."]);
        
        const logs = [
            "Pulling weights: stable-video-diffusion-img2vid-xt-1-1...",
            "Context: " + activeTheme?.title,
            "Analyzing image keypoints via Llama 3.2 Vision...",
            "Latent Diffusion Process started (25 steps)...",
            "Synthesizing motion vectors...",
            "Upscaling to 1080p via R-ESRGAN...",
            "Neural Rendering Complete."
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i < logs.length) {
                setGenerationLogs(prev => [...prev, logs[i]]);
                i++;
            } else {
                clearInterval(interval);
                setIsGeneratingVideo(false);
                setVideoReady(true);
            }
        }, 800);
    };

    return (
        <div className="mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-500">
                        Latest Cardio Themes
                    </h2>
                    <p className="text-gray-400 text-xs mt-1">AI-enhanced motion guides for this week.</p>
                </div>
                <button className="text-xs font-bold text-amber-400 hover:text-white border border-amber-500/30 px-3 py-1 rounded-full transition-all hover:bg-amber-500/20">
                    Explore Library
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {themes.map((theme) => (
                    <div 
                        key={theme.id} 
                        onClick={() => handleStartSession(theme)}
                        className="group relative h-64 rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border border-white/5 bg-gray-900"
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0">
                            <img 
                                src={theme.image} 
                                alt={theme.title} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />
                        </div>

                        {/* Content */}
                        <div className="absolute inset-0 p-5 flex flex-col justify-end">
                            <div className={`absolute top-4 right-4 bg-gradient-to-r ${theme.color} text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center`}>
                                <VideoCameraIcon className="w-3 h-3 mr-1" /> {theme.intensity}
                            </div>

                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">
                                {theme.title}
                            </h3>
                            
                            <div className="flex items-center gap-2 text-xs text-gray-300">
                                <span className="flex items-center bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
                                    <TimerIcon className="w-3 h-3 mr-1.5 text-gray-300" /> {theme.duration}
                                </span>
                                <span className="flex items-center bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
                                    <FireIcon className="w-3 h-3 mr-1.5 text-orange-500" /> {theme.cal} kcal
                                </span>
                            </div>

                            {/* Hover Action */}
                            <div className="h-0 group-hover:h-10 overflow-hidden transition-all duration-300 mt-0 group-hover:mt-3">
                                <button className={`w-full bg-gradient-to-r ${theme.color} text-white font-bold text-xs py-2 rounded-lg shadow-lg flex items-center justify-center`}>
                                    <SparkleIcon className="w-3 h-3 mr-2" /> Start Session
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Session Info Modal */}
            <Modal 
                isOpen={!!activeTheme} 
                onClose={handleClose} 
                title={activeTheme ? `Session: ${activeTheme.title}` : 'Session Details'}
            >
                {activeTheme && (
                    <div className="space-y-6">
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-700 shadow-2xl bg-black group">
                            {isGeneratingVideo ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gray-900/90">
                                    <div className="relative mb-6">
                                        <div className="w-16 h-16 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"></div>
                                        <BotIcon className="absolute inset-0 m-auto w-8 h-8 text-cyan-400" />
                                    </div>
                                    <div className="w-full bg-black/40 rounded-lg p-3 font-mono text-[10px] text-green-400 h-24 overflow-y-auto border border-gray-700">
                                        {generationLogs.map((log, idx) => (
                                            <div key={idx} className="mb-1"> {'>'} {log}</div>
                                        ))}
                                    </div>
                                </div>
                            ) : videoReady && !videoError ? (
                                <video 
                                    src={activeTheme.video} 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline 
                                    className="w-full h-full object-cover animate-fade-in"
                                    onError={() => setVideoError(true)}
                                />
                            ) : (
                                <>
                                    <img 
                                        src={activeTheme.image} 
                                        alt={activeTheme.title} 
                                        className="w-full h-full object-cover opacity-60"
                                    />
                                    {videoError && (
                                        <div className="absolute top-4 left-4 bg-red-900/80 text-white text-[10px] px-2 py-1 rounded border border-red-500/50">
                                            Video Feed Offline. Showing Poster.
                                        </div>
                                    )}
                                </>
                            )}
                            
                            {!isGeneratingVideo && !videoReady && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <button 
                                        onClick={handleGenerateAIVideo}
                                        className="bg-black/60 backdrop-blur-md border border-amber-500/50 text-amber-400 font-bold py-2 px-6 rounded-full flex items-center hover:bg-black/80 transition-all group"
                                    >
                                        <SparkleIcon className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                                        Generate AI Motion Guide
                                    </button>
                                </div>
                            )}

                            {videoReady && !videoError && (
                                <div className="absolute top-4 right-4 bg-green-500/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded">
                                    AI RENDERED (SVD-XT)
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Duration</p>
                                <p className="text-xl font-bold text-white flex items-center justify-center">
                                    <TimerIcon className="w-4 h-4 mr-2 text-amber-400" /> {activeTheme.duration}
                                </p>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Target Burn</p>
                                <p className="text-xl font-bold text-white flex items-center justify-center">
                                    <FireIcon className="w-4 h-4 mr-2 text-orange-500" /> {activeTheme.cal} kcal
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                            <h4 className="text-blue-400 font-bold text-sm mb-2 flex items-center">
                                <BotIcon className="w-4 h-4 mr-2" /> Open Source Insight
                            </h4>
                            <p className="text-sm text-gray-300 leading-relaxed italic">
                                This session uses high-frequency intervals. Our AI motion engine (Stable Video Diffusion) can synthesize a custom coach preview to help you maintain perfect form during exhaustion.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-800">
                            <button 
                                onClick={handleClose}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-all"
                            >
                                Back
                            </button>
                            <button className="flex-[2] bg-amber-500 text-gray-900 font-bold py-3 rounded-xl hover:bg-amber-400 transition-all flex items-center justify-center shadow-lg shadow-amber-900/20">
                                <AutoUpdateIcon className="w-4 h-4 mr-2" /> Start Live Practice
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CardioThemes;
