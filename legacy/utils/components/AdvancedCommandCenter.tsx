import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Activity, X, Cpu, Sparkles, Send } from 'lucide-react';
import { useToast } from '../hooks/useToast';

export const FitnessFutureCommandCenter: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [manualCommand, setManualCommand] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const { addToast } = useToast();
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const SpeechRecognitionCtor =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognitionCtor) {
            try {
                recognitionRef.current = new SpeechRecognitionCtor();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = 'en-US';

                recognitionRef.current.onresult = (event: any) => {
                    let currentTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        currentTranscript += event.results[i][0].transcript;
                    }
                    setTranscript(currentTranscript);
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.warn("Speech recognition notice:", event.error);
                    setIsListening(false);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            } catch (e) {
                console.warn("SpeechRecognition initialization skipped:", e);
            }
        }
    }, []);

    useEffect(() => {
        if (!isListening && transcript.trim()) {
            processCommand(transcript.trim());
        }
    }, [isListening]);

    const processCommand = (cmd: string) => {
        if (!cmd.trim()) return;
        const lowerCmd = cmd.toLowerCase();
        addToast(`Command Received: "${cmd}"`, "info");
        
        setTimeout(() => {
            if (lowerCmd.includes('diet') || lowerCmd.includes('nutrition')) {
                addToast("FitnessFutureDiet Synthesizer activated. Adjusting macros...", "success");
            } else if (lowerCmd.includes('workout') || lowerCmd.includes('exercise')) {
                addToast("Mood-Based AI Workout initialized. Generating routine...", "success");
            } else if (lowerCmd.includes('scan') || lowerCmd.includes('face') || lowerCmd.includes('bio')) {
                addToast("Facial Recognition Bio-Scan starting...", "info");
            } else {
                addToast("Command processed by Dr. Cloud.", "success");
            }
            setTranscript('');
            setManualCommand('');
            setIsOpen(false);
        }, 900);
    };

    const toggleListening = () => {
        if (isListening) {
            try {
                recognitionRef.current?.stop();
            } catch {
                // ignore
            }
            setIsListening(false);
        } else {
            setTranscript('');
            setIsOpen(true);
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                    setIsListening(true);
                } catch (e) {
                    setIsListening(false);
                }
            }
        }
    };

    return (
        <>
            {/* Floating Mic Button */}
            <button 
                type="button"
                onClick={toggleListening}
                className={`fixed bottom-36 right-4 sm:right-6 lg:bottom-28 lg:right-8 xl:right-10 p-3.5 sm:p-4 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.5)] z-50 transition-all border-2 cursor-pointer ${isListening ? 'bg-rose-600 border-rose-400 animate-pulse' : 'bg-black/80 border-cyan-500 hover:scale-110 backdrop-blur-md'}`}
                title="FitnessFutureVoice Command"
            >
                {isListening ? <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> : <MicOff className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />}
            </button>

            {/* Command Center Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-52 lg:bottom-44 right-4 sm:right-6 lg:right-10 w-[calc(100vw-2rem)] max-w-xs bg-black/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4 sm:p-5 z-50 shadow-[0_0_50px_rgba(6,182,212,0.2)]"
                    >
                        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
                            <div className="flex items-center gap-2">
                                <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                                <h3 className="text-xs sm:text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase tracking-wider">
                                    FitnessFutureCommand
                                </h3>
                            </div>
                            <button type="button" onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex flex-col items-center justify-center py-4">
                            {isListening ? (
                                <div className="relative">
                                    <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse"></div>
                                    <Activity className="w-10 h-10 text-cyan-400 animate-pulse relative z-10" />
                                </div>
                            ) : (
                                <Sparkles className="w-10 h-10 text-cyan-400/70" />
                            )}
                            
                            <p className="mt-4 text-center text-xs text-gray-300 min-h-[32px] font-mono">
                                {transcript || (isListening ? "Listening to your command..." : "Speak or select a quick command below")}
                            </p>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                processCommand(manualCommand);
                            }}
                            className="flex items-center gap-2 mt-2"
                        >
                            <input
                                type="text"
                                value={manualCommand}
                                onChange={(e) => setManualCommand(e.target.value)}
                                placeholder="Type voice command..."
                                className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                            />
                            <button
                                type="submit"
                                className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold cursor-pointer"
                                title="Run Command"
                            >
                                <Send className="w-3.5 h-3.5" />
                            </button>
                        </form>
                        
                        <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-gray-400 flex flex-wrap justify-center gap-1.5">
                            {['Show my diet plan', 'Start Bio-Scan', 'Generate AI workout'].map((sample) => (
                                <button
                                    key={sample}
                                    type="button"
                                    onClick={() => processCommand(sample)}
                                    className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono cursor-pointer"
                                >
                                    "{sample}"
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
