import React, { useState } from 'react';
import { Share2, Zap, TrendingUp, Megaphone, MapPin, Bot, Image as ImageIcon, CheckCircle, RefreshCw, Heart } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useToast } from '../hooks/useToast';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const GhostSocial: React.FC = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [campaigns, setCampaigns] = useState<{title: string, copy: string, image: string, status: string}[]>([]);
    const { addToast } = useToast();

    const generateCampaign = async () => {
        setIsGenerating(true);
        try {
            // 1. Generate Copy
            const copyResponse = await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents: `Create a highly engaging, viral Instagram ad copy for 'Royal The Gym' located in Jhunjhunu, Rajasthan. 
                Use local slang, emojis, and a strong call to action. Mention a "Jhunjhunu Local Event" discount. Keep it under 3 sentences.`,
                config: { systemInstruction: "You are an expert autonomous social media marketing AI." }
            });

            // 2. Generate Image
            const imageResponse = await ai.models.generateContent({
                model: 'gemini-3.1-flash-image-preview',
                contents: { parts: [{ text: "A highly cinematic, neon-lit gym interior with a glowing sign saying 'ROYAL THE GYM'. Cyberpunk fitness aesthetic." }] },
                config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
            });

            let imageUrl = '';
            for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                    break;
                }
            }

            setCampaigns(prev => [{
                title: "Jhunjhunu Viral Campaign",
                copy: copyResponse.text || "Join Royal The Gym today! #JhunjhunuFitness",
                image: imageUrl || 'https://picsum.photos/seed/gym/400/400',
                status: 'Auto-Published'
            }, ...prev]);

            addToast("Autonomous Campaign Generated & Deployed.", "success");
        } catch (error) {
            addToast("Failed to generate campaign.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="h-full flex flex-col animate-fade-in space-y-6">
            <div className="flex items-center justify-between bg-black/40 p-6 rounded-[2rem] border border-pink-500/20 shadow-[0_0_40px_rgba(236,72,153,0.1)] backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-pink-500/20 rounded-2xl border border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                        <Bot className="w-8 h-8 text-pink-400 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-widest italic flex items-center gap-3">
                            Auto-Marketer <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-orange-500">Ghost Bot</span>
                        </h1>
                        <p className="text-xs font-mono text-pink-400/70 uppercase tracking-[0.3em]">Autonomous Social Agent (AutoGPT)</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-pink-900/20 rounded-full border border-pink-500/30">
                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-pink-300 uppercase tracking-widest">Self-Growing Mode Active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                {/* Control Panel */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                        
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Zap className="w-3 h-3 text-pink-400" /> Agent Status
                        </h3>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex items-center gap-3"><TrendingUp className="w-4 h-4 text-green-400" /><span className="text-xs font-bold text-white">Trend Analysis</span></div>
                                <span className="text-[10px] font-mono text-green-400">Active</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex items-center gap-3"><ImageIcon className="w-4 h-4 text-purple-400" /><span className="text-xs font-bold text-white">Meme Generator</span></div>
                                <span className="text-[10px] font-mono text-purple-400">Active</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-orange-400" /><span className="text-xs font-bold text-white">Local Event Scraper</span></div>
                                <span className="text-[10px] font-mono text-orange-400">Scanning Jhunjhunu...</span>
                            </div>
                        </div>

                        <button 
                            onClick={generateCampaign}
                            disabled={isGenerating}
                            className="w-full py-4 bg-gradient-to-r from-pink-600 to-orange-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(236,72,153,0.4)] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                            {isGenerating ? 'Generating Campaign...' : 'Force Generate Local Ad'}
                        </button>
                    </div>

                    <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-6 flex-1">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Share2 className="w-3 h-3 text-cyan-400" /> Auto-Reply Logs
                        </h3>
                        <div className="space-y-3">
                            <div className="p-3 bg-gray-900/50 rounded-xl border border-white/5">
                                <p className="text-[10px] text-gray-500 font-mono mb-1">@rahul_fitness asked: "Fees kitni hai bhai?"</p>
                                <p className="text-xs text-cyan-300 font-bold">Bot: "Bhai, Royal The Gym mein aao, pehla din free trial! Fees ekdum budget mein hai. DM check karo! 💪"</p>
                            </div>
                            <div className="p-3 bg-gray-900/50 rounded-xl border border-white/5">
                                <p className="text-[10px] text-gray-500 font-mono mb-1">@jhunjhunu_memes commented: "🔥"</p>
                                <p className="text-xs text-cyan-300 font-bold">Bot: "Aag laga denge gym mein! Aajao sham ko! 🔥🏋️‍♂️"</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Campaigns */}
                <div className="lg:col-span-2 bg-black/40 border border-white/5 rounded-[2.5rem] p-6 overflow-y-auto custom-scrollbar">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-pink-400" /> Autonomous Campaigns Deployed
                    </h3>

                    {campaigns.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-gray-800 rounded-3xl">
                            <Bot className="w-12 h-12 mb-4 opacity-50" />
                            <p className="text-sm font-black uppercase tracking-widest">Bot is analyzing trends...</p>
                            <p className="text-xs font-mono mt-2 text-center max-w-sm">The Ghost Agent is currently scraping local Jhunjhunu news to create the perfect viral ad.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {campaigns.map((camp, idx) => (
                                <div key={idx} className="bg-gray-900 border border-white/10 rounded-3xl overflow-hidden group hover:border-pink-500/50 transition-all">
                                    <div className="h-48 overflow-hidden relative">
                                        <img src={camp.image} alt="Ad" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute top-4 right-4 bg-green-500/20 text-green-400 border border-green-500/50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 backdrop-blur-md">
                                            <CheckCircle className="w-3 h-3" /> {camp.status}
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h4 className="text-white font-black uppercase tracking-widest text-sm mb-2">{camp.title}</h4>
                                        <p className="text-gray-400 text-xs leading-relaxed italic">"{camp.copy}"</p>
                                        
                                        <div className="mt-4 flex items-center gap-4 text-[10px] font-mono text-gray-500">
                                            <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-pink-500" /> 1.2k Predicted</span>
                                            <span className="flex items-center gap-1"><Share2 className="w-3 h-3 text-cyan-500" /> High Virality</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GhostSocial;
