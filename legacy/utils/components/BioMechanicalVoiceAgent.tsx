import React, { useState, useEffect } from 'react';
import { Mic, PhoneCall, Volume2, CloudLightning, BrainCircuit, Waves, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNeuralStore } from '../store/useNeuralStore';

export default function BioMechanicalVoiceAgent() {
    const [isActive, setIsActive] = useState(false);
    const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
    const [transcript, setTranscript] = useState('...');
    const { isModelReady, checkWebGPUAndInit } = useNeuralStore();

    useEffect(() => {
        // Initialize On-Device AI models to process voice intents locally if WebGPU is available
        checkWebGPUAndInit();
    }, [checkWebGPUAndInit]);

    const handleToggleCall = () => {
        if (isActive) {
            setIsActive(false);
            setStatus('idle');
            setTranscript('...');
        } else {
            setIsActive(true);
            setStatus('listening');
            setTranscript('Listening for voice command (English)...');
            
            // Simulating Voice AI response pipeline with absolute zero cost APIs
            setTimeout(() => {
                setStatus('processing');
                setTranscript('Converting voice to vector via WebGPU edge cache...');
            }, 2500);

            setTimeout(() => {
                setStatus('speaking');
                setTranscript('Welcome to Fitness Future! How can I assist you with your workout, nutrition, or membership today?');
            }, 4500);
            
            setTimeout(() => {
                setStatus('listening');
            }, 8000);
        }
    };

    return (
        <div className="bg-black/60 border border-white/5 p-6 md:p-8 rounded-[3.5rem] shadow-2xl backdrop-blur-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-black to-fuchsia-900/20 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                            <BrainCircuit className="w-6 h-6 text-cyan-400" />
                            Voice AI Core
                        </h2>
                        <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest font-mono flex items-center gap-1">
                            <CloudLightning className="w-3 h-3 text-fuchsia-400" />
                            Zero Cost Bio-Mechanical Receptionist
                        </p>
                    </div>
                    {isModelReady && (
                        <div className="bg-green-500/10 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                            <Activity className="w-3 h-3" /> On-Device Vector Mesh Live
                        </div>
                    )}
                </div>

                {/* Voice Orb */}
                <div className="relative w-48 h-48 my-8 flex items-center justify-center">
                    <motion.div 
                        animate={{ 
                            scale: status === 'listening' ? [1, 1.2, 1] : status === 'speaking' ? [1, 1.3, 1.1, 1.4, 1] : 1,
                            opacity: status === 'idle' ? 0.3 : 0.8
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500 to-fuchsia-500 blur-2xl opacity-40 mix-blend-screen"
                    ></motion.div>
                    
                    <button 
                        onClick={handleToggleCall}
                        className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.5)] transition-all ${isActive ? 'bg-fuchsia-600 hover:bg-fuchsia-500' : 'bg-cyan-600 hover:bg-cyan-500'}`}
                    >
                        {isActive ? <PhoneCall className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
                    </button>
                    
                    {/* Ring animations */}
                    {isActive && (
                        <motion.div 
                            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className={`absolute w-32 h-32 rounded-full border-2 ${status === 'speaking' ? 'border-fuchsia-400' : 'border-cyan-400'}`}
                        />
                    )}
                </div>

                <div className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 mt-2">
                    <div className="flex items-center gap-3 mb-2">
                        {status === 'listening' ? <Mic className="w-4 h-4 text-cyan-400 animate-pulse" /> : 
                         status === 'speaking' ? <Volume2 className="w-4 h-4 text-fuchsia-400 animate-pulse" /> :
                         <Waves className="w-4 h-4 text-gray-500" />}
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                            Status: <span className={status === 'listening' ? 'text-cyan-400' : status === 'speaking' ? 'text-fuchsia-400' : 'text-gray-500'}>{status}</span>
                        </span>
                    </div>
                    <div className="font-mono text-sm text-white/90 min-h-[40px] italic">
                        {transcript}
                    </div>
                </div>
            </div>
        </div>
    );
}
