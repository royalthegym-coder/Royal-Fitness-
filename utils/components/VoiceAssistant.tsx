
import React, { useState, useRef, useEffect } from 'react';
import Card from './common/Card';
import { VoiceIcon } from './icons/VoiceIcon';
import { View } from '../../types';
import { Mic, MicOff, Activity, Volume2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { getComplexResponse } from '../../lib/gemini';

interface VoiceAssistantProps {
    setCurrentView: (view: View) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ setCurrentView }) => {
    const { addToast } = useToast();
    const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
    const [volume, setVolume] = useState(0);
    const [aiResponseText, setAiResponseText] = useState('Tap Mic to Activate Royal Assistant');
    
    // Browser Speech Recognition Refs
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

    // Visualizer Animation
    useEffect(() => {
        if (status === 'listening' || status === 'speaking') {
            const interval = setInterval(() => {
                setVolume(Math.random() * 100);
            }, 100);
            return () => clearInterval(interval);
        } else {
            setVolume(0);
        }
    }, [status]);

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            setAiResponseText("Browser does not support Voice API.");
            return;
        }

        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => {
            setStatus('listening');
            setAiResponseText("Listening...");
        };

        recognitionRef.current.onresult = async (event: any) => {
            const transcript = event.results[0][0].transcript;
            setStatus('processing');
            setAiResponseText(`"${transcript}"`);
            await processQuery(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error(event);
            setStatus('idle');
            setAiResponseText("Did not catch that. Try again.");
        };

        recognitionRef.current.onend = () => {
            if (status === 'listening') setStatus('idle');
        };

        recognitionRef.current.start();
    };

    const processQuery = async (query: string) => {
        try {
            // Use the centralized wrapper to respect free mode
            const prompt = `
                You are 'Royal', a gym AI assistant. Keep answer under 20 words.
                User said: ${JSON.stringify(query)}.
                
                If user asks to navigate, return JSON: {"text": "Navigating...", "action": "view_name"}.
                Views: dashboard, workout, diet, payments.
                Otherwise return JSON: {"text": "Your answer here", "action": null}.
            `;

            const responseText = await getComplexResponse(prompt);
            
            let cleanJson = responseText.replace(/```json|```/g, '').trim();
            // Handle edge case where model returns plain text (common in simulation mode)
            if (!cleanJson.startsWith('{')) {
                // If it's the simulation message, just speak it
                cleanJson = JSON.stringify({ text: "Processing via Neural Core.", action: null });
            }

            let data;
            try {
                data = JSON.parse(cleanJson);
            } catch {
                data = { text: responseText, action: null };
            }
            
            setAiResponseText(data.text);
            speak(data.text);

            if (data.action) {
                setTimeout(() => {
                    setCurrentView(data.action as View);
                }, 2000);
            }

        } catch (e) {
            console.error(e);
            const fallback = "I am processing your workout request locally.";
            setAiResponseText(fallback);
            speak(fallback);
            setStatus('idle');
        }
    };

    const speak = (text: string) => {
        if (synthRef.current.speaking) {
            synthRef.current.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = 1;
        utterance.rate = 1;
        utterance.volume = 1;
        
        // Try to find a good voice
        const voices = synthRef.current.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Male')) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => setStatus('speaking');
        utterance.onend = () => setStatus('idle');

        synthRef.current.speak(utterance);
    };

    const stopSession = () => {
        if (recognitionRef.current) recognitionRef.current.stop();
        if (synthRef.current) synthRef.current.cancel();
        setStatus('idle');
        setAiResponseText("Voice System Standby.");
    };

    return (
        <Card className="bg-black/90 border border-amber-500/30 p-0 overflow-hidden relative min-h-[400px] flex flex-col items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.2)]">
            {/* Background Animation */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-black to-black"></div>
            
            {/* Holographic Circle */}
            <div className="relative z-10 w-64 h-64 flex items-center justify-center">
                {/* Outer Ring */}
                <div className={`absolute inset-0 rounded-full border-2 border-amber-500/20 ${status === 'processing' ? 'animate-spin-slow' : ''}`}></div>
                
                {/* Active Voice Wave */}
                {(status === 'listening' || status === 'speaking') && (
                    <div 
                        className="absolute inset-0 rounded-full bg-amber-500/10 blur-xl transition-all duration-75"
                        style={{ transform: `scale(${1 + (volume / 200)})` }}
                    ></div>
                )}

                {/* Central Core */}
                <button 
                    onClick={status === 'idle' ? startListening : stopSession}
                    className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl z-20 ${
                        status === 'idle' 
                        ? 'bg-gray-800 border-4 border-gray-600 hover:border-amber-500 hover:scale-105' 
                        : 'bg-amber-600 border-4 border-amber-400 animate-pulse'
                    }`}
                >
                    {status === 'idle' ? (
                        <MicOff className="w-12 h-12 text-gray-400" />
                    ) : status === 'processing' ? (
                        <Activity className="w-12 h-12 text-white animate-spin" />
                    ) : status === 'speaking' ? (
                        <Volume2 className="w-12 h-12 text-white animate-pulse" />
                    ) : (
                        <Mic className="w-12 h-12 text-white" />
                    )}
                </button>
            </div>

            {/* Status Display */}
            <div className="relative z-10 mt-8 text-center px-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <VoiceIcon className={`w-5 h-5 ${status !== 'idle' ? 'text-amber-400' : 'text-gray-600'}`} />
                    <span className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">
                        {status === 'idle' ? 'SYSTEM OFFLINE' : 'NATIVE VOICE CORE ACTIVE'}
                    </span>
                </div>
                
                <h2 className={`text-2xl font-black italic uppercase tracking-tighter transition-colors ${status === 'idle' ? 'text-gray-700' : 'text-white'}`}>
                    {status === 'idle' ? 'Tap to Speak' : status === 'speaking' ? 'Royal AI Speaking...' : status === 'processing' ? 'Thinking...' : 'Listening...'}
                </h2>
                
                {status !== 'idle' && (
                     <div className="mt-4 h-1 w-full max-w-[200px] bg-gray-800 rounded-full overflow-hidden mx-auto">
                         <div className="h-full bg-amber-500 transition-all duration-75" style={{ width: `${volume}%` }}></div>
                     </div>
                )}
                
                <p className="mt-6 text-xs text-amber-500/80 font-mono max-w-sm mx-auto min-h-[40px] px-4 py-2 bg-gray-900/50 rounded-lg border border-white/5">
                    {aiResponseText}
                </p>
            </div>

            <div className="absolute bottom-6 left-6 flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${status === 'idle' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                 <span className="text-[9px] font-bold text-gray-500 uppercase">Web Speech API (Free)</span>
            </div>
        </Card>
    );
};

export default VoiceAssistant;
