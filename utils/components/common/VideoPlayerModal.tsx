import React from 'react';
import { X, Lock, PlayCircle } from 'lucide-react';

interface VideoPlayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    exerciseName: string;
    youtubeId?: string;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ isOpen, onClose, exerciseName, youtubeId }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-4xl overflow-hidden relative shadow-2xl flex flex-col">
                
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 z-50 bg-black/50 text-white p-2 rounded-full hover:bg-red-600 transition-colors border border-white/10"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Video Container */}
                <div className="aspect-video bg-black relative group w-full">
                    {youtubeId ? (
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&modestbranding=1&rel=0&controls=1&disablekb=1`}
                            title={exerciseName}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full object-cover"
                        ></iframe>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center relative bg-black">
                            <div className="w-32 h-32 rounded-full border-4 border-cyan-500/30 flex items-center justify-center relative animate-pulse mb-6">
                                <div className="absolute inset-0 rounded-full border-t-4 border-cyan-400 animate-spin"></div>
                                <PlayCircle className="w-12 h-12 text-cyan-400" />
                            </div>
                            <p className="text-cyan-400 font-mono uppercase tracking-widest text-sm font-bold">Neural Simulation Active</p>
                            <p className="text-gray-500 text-xs mt-2">Video stream unavailable. Follow protocol instructions.</p>
                        </div>
                    )}
                    
                    {/* Security Overlay (Transparent to block right-click context menu on iframe if possible, but hard with iframe) */}
                    <div className="absolute inset-0 z-20 pointer-events-none bg-transparent"></div>

                    {/* Watermark / Security Badge */}
                    <div className="absolute bottom-4 left-4 z-30 bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg border border-red-500/30 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-red-500" />
                        <span className="text-[10px] text-white font-mono uppercase tracking-widest">
                            CONFIDENTIAL • ID: {Date.now().toString().slice(-6)}
                        </span>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="p-6 bg-gray-900 border-t border-white/5">
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">{exerciseName}</h3>
                    <p className="text-gray-400 text-sm">
                        Detailed execution guide. Focus on form and tempo. 
                        <span className="text-red-400 block mt-2 text-xs uppercase font-bold tracking-widest">
                            * Do not attempt max weight without a spotter.
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayerModal;
