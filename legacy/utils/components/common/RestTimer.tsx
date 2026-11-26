import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Clock } from 'lucide-react';

interface RestTimerProps {
    initialSeconds?: number;
    onClose?: () => void;
}

const RestTimer: React.FC<RestTimerProps> = ({ initialSeconds = 60, onClose }) => {
    const [timeLeft, setTimeLeft] = useState(initialSeconds);
    const [isActive, setIsActive] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (timerRef.current) clearInterval(timerRef.current);
            // Play a sound when timer finishes
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play();
            } catch (e) {
                console.error("Audio play failed", e);
            }
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);
    
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(initialSeconds);
    };

    const addTime = (seconds: number) => {
        setTimeLeft((prev) => prev + seconds);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = (timeLeft / initialSeconds) * 100;

    if (isMinimized) {
        return (
            <div 
                className="fixed bottom-24 right-6 z-50 bg-gray-900 border border-cyan-500/30 p-3 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer hover:scale-105 transition-transform flex items-center gap-2"
                onClick={() => setIsMinimized(false)}
            >
                <Clock className={`w-5 h-5 ${isActive ? 'text-cyan-400 animate-pulse' : 'text-gray-400'}`} />
                <span className={`font-mono font-bold ${timeLeft === 0 ? 'text-red-500' : 'text-white'}`}>
                    {formatTime(timeLeft)}
                </span>
            </div>
        );
    }

    return (
        <div className="fixed bottom-24 right-6 z-50 bg-black/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl w-64 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Rest Timer
                </h3>
                <div className="flex gap-2">
                    <button onClick={() => setIsMinimized(true)} className="text-gray-500 hover:text-white transition-colors">
                        <span className="text-lg leading-none">-</span>
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="text-gray-500 hover:text-red-400 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="relative flex justify-center items-center mb-6">
                <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="transparent"
                        className="text-gray-800"
                    />
                    <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray={364.4}
                        strokeDashoffset={364.4 - (364.4 * progress) / 100}
                        className={`${timeLeft === 0 ? 'text-red-500' : 'text-cyan-500'} transition-all duration-1000 ease-linear`}
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className={`text-3xl font-black font-mono tracking-tighter ${timeLeft === 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {formatTime(timeLeft)}
                    </span>
                </div>
            </div>

            <div className="flex justify-center gap-3 mb-4">
                <button onClick={() => addTime(-15)} className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs font-mono text-gray-400">-15s</button>
                <button onClick={() => addTime(15)} className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs font-mono text-gray-400">+15s</button>
            </div>

            <div className="flex justify-center gap-4">
                <button 
                    onClick={resetTimer}
                    className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
                <button 
                    onClick={toggleTimer}
                    className={`p-3 rounded-xl flex-1 flex justify-center items-center transition-colors ${
                        isActive 
                        ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border border-amber-500/50' 
                        : 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    }`}
                >
                    {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
};

export default RestTimer;
