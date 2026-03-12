import React, { useState } from 'react';
import { User, Sparkles, MessageSquare, Rotate3d, ArrowRight, Video, Camera } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useToast } from '../hooks/useToast';

const DigitalTwin: React.FC = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [twinReady, setTwinReady] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatLog, setChatLog] = useState<{role: string, text: string}[]>([]);
    const { addToast } = useToast();

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            setTwinReady(true);
            addToast("3D Gaussian Splatting Complete. Digital Twin Generated.", "success");
            setChatLog([{ role: 'model', text: "Hello! I am your Future Self (90 Days). I've dropped 4% body fat and gained 2kg of muscle. Ask me anything about our journey!" }]);
        }, 3000);
    };

    const handleChat = async () => {
        if (!chatInput.trim()) return;
        
        const userMsg = chatInput;
        setChatLog(prev => [...prev, { role: 'user', text: userMsg }]);
        setChatInput('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
            const response = await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents: userMsg,
                config: {
                    systemInstruction: `You are the user's "Future Self" 90 days from now after following a strict workout and diet plan at Royal The Gym. 
                    You are fitter, stronger, and highly motivated. Respond in a friendly, encouraging, and slightly futuristic tone. Keep it concise.`
                }
            });

            setChatLog(prev => [...prev, { role: 'model', text: response.text || "Connection to future timeline disrupted." }]);
        } catch (error) {
            console.error("Digital Twin Chat Error:", error);
            setChatLog(prev => [...prev, { role: 'model', text: "Error: Temporal anomaly detected. Please ensure your Gemini API key is configured correctly." }]);
        }
    };

    return (
        <div className="h-full flex flex-col animate-fade-in space-y-6">
            <div className="flex items-center justify-between bg-black/40 p-6 rounded-[2rem] border border-purple-500/20 shadow-[0_0_40px_rgba(168,85,247,0.1)] backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-purple-500/20 rounded-2xl border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                        <Rotate3d className="w-8 h-8 text-purple-400 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-widest italic flex items-center gap-3">
                            Digital <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Twin 3D</span>
                        </h1>
                        <p className="text-xs font-mono text-purple-400/70 uppercase tracking-[0.3em]">Gaussian Splatting (SMPL-X)</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-purple-900/20 rounded-full border border-purple-500/30">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">Temporal Sync</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                {/* 3D Viewer Area */}
                <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
                    
                    {!twinReady ? (
                        <div className="text-center z-10">
                            <div className="w-32 h-32 mx-auto bg-gray-900 rounded-full border-4 border-dashed border-gray-700 flex items-center justify-center mb-6 relative">
                                {isGenerating ? (
                                    <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
                                ) : (
                                    <Video className="w-10 h-10 text-gray-500" />
                                )}
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Upload 10s Video</h3>
                            <p className="text-xs text-gray-500 font-mono mb-8 max-w-xs mx-auto">AI will reconstruct your exact 3D topology and simulate your physique 90 days into the future.</p>
                            
                            <button 
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 transition-all shadow-[0_0_30px_rgba(168,85,247,0.4)] disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2 mx-auto"
                            >
                                {isGenerating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                {isGenerating ? 'Synthesizing Twin...' : 'Generate Digital Twin'}
                            </button>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center z-10">
                            <div className="flex items-center justify-between w-full px-8 mb-8">
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Current Self</p>
                                    <div className="w-32 h-64 bg-gray-800 rounded-full border-2 border-gray-600 relative overflow-hidden flex items-center justify-center">
                                        <User className="w-12 h-12 text-gray-500" />
                                    </div>
                                    <p className="text-xs font-mono text-gray-400 mt-4">BF: 22% | MM: 34kg</p>
                                </div>
                                
                                <ArrowRight className="w-8 h-8 text-purple-500 animate-pulse" />
                                
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Future Self (+90 Days)</p>
                                    <div className="w-32 h-64 bg-purple-900/20 rounded-full border-2 border-purple-500 relative overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.3)] flex items-center justify-center">
                                        <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent"></div>
                                        <User className="w-12 h-12 text-purple-400 relative z-10" />
                                        {/* Hologram effect */}
                                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(168,85,247,0.1)_50%)] bg-[length:100%_4px] animate-scan"></div>
                                    </div>
                                    <p className="text-xs font-mono text-purple-300 mt-4">BF: 14% | MM: 38kg</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-purple-400 bg-purple-900/20 px-4 py-2 rounded-full border border-purple-500/30">
                                <Rotate3d className="w-3 h-3 animate-spin-slow" /> 360° View Enabled
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat with Future Self */}
                <div className={`flex flex-col bg-black/40 border border-white/5 rounded-[2.5rem] overflow-hidden transition-opacity duration-500 ${twinReady ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <div className="p-6 border-b border-white/5 bg-purple-900/10">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-purple-400" /> Talk to Future Self
                        </h3>
                    </div>
                    
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
                        {chatLog.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-white/10 text-white rounded-tr-none' : 'bg-purple-900/40 text-purple-100 border border-purple-500/30 rounded-tl-none shadow-[0_0_15px_rgba(168,85,247,0.1)]'}`}>
                                    {msg.role === 'model' && <p className="text-[9px] font-black uppercase tracking-widest text-purple-400 mb-1">Future You</p>}
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-gray-950 border-t border-white/5 flex gap-3">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                            placeholder="Ask your future self..."
                            className="flex-1 bg-gray-900 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all"
                        />
                        <button
                            onClick={handleChat}
                            className="px-6 bg-purple-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-purple-500 transition-all"
                        >
                            Ask
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DigitalTwin;
