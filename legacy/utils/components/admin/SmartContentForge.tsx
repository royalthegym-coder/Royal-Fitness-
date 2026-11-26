import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Video, Image, Type, Send, Sparkles, Instagram, Facebook, Layout, RefreshCw, BarChart } from 'lucide-react';
import { getComplexResponse } from '../../../lib/core_ai';
import { useToast } from '../../hooks/useToast';

export const SmartContentForge: React.FC = () => {
    const { addToast } = useToast();
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<any | null>(null);

    const handleForgeContent = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        try {
            const aiPrompt = `Act as an Elite AI Social Media Content Creator for a high-end luxury gym (Fitness Future). 
            Target platform: Instagram & Facebook. Theme: God-tier, Futuristic, Elite performance.
            User concept: "${prompt}"
            Generate a full content package including:
            1. Instagram Viral Reel Script
            2. High-converting Caption (including emojis and top 20 trending fitness hashtags)
            3. Detailed AI Image Generation Prompt (for Midjourney/Core AI)
            4. 3 Engagement-heavy Story Poll ideas
            Return ONLY raw JSON with keys: reel_script, caption, image_prompt, story_ideas[]`;
            
            const result = await getComplexResponse(aiPrompt);
            setGeneratedContent(JSON.parse(result));
            addToast('Content Package Forged by Smart OS.', 'success');
        } catch (error) {
            console.error(error);
            addToast('Uplink to Content Forge failed.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-20">
            <div className="bg-[#050505] p-10 rounded-[3.5rem] border border-blue-500/20 relative overflow-hidden group shadow-[0_0_80px_rgba(59,130,246,0.1)]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-6">
                        <div className="p-6 bg-blue-500/10 rounded-[2rem] border border-blue-500/30 text-blue-400">
                            <Sparkles className="w-12 h-12" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Content <span className="text-blue-400">Forge</span> Bot</h2>
                            <p className="text-gray-500 text-[10px] font-mono uppercase tracking-[0.3em] mt-1">Multi-Platform Viral Asset Factory</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-black text-blue-400 uppercase tracking-widest border border-blue-500/20 px-4 py-2 rounded-full bg-blue-950/20">
                        <RefreshCw className="w-4 h-4" /> Infinite Creation Active
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Forge Input */}
                <div className="bg-zinc-950/40 border border-white/5 p-8 rounded-[2.5rem] space-y-6">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Type className="w-4 h-4 text-blue-400" /> Creation Core
                    </h3>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Define your campaign concept (e.g., Early morning transformation vibes at Fitness Future)..."
                        className="w-full bg-black/50 border border-white/10 rounded-[2rem] p-6 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all min-h-[160px] resize-none"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3">
                            <Instagram className="w-5 h-5 text-pink-500" />
                            <span className="text-[10px] font-black text-zinc-400 uppercase">Insta Reels</span>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3">
                            <Facebook className="w-5 h-5 text-blue-500" />
                            <span className="text-[10px] font-black text-zinc-400 uppercase">FB Reach</span>
                        </div>
                    </div>
                    <button 
                        onClick={handleForgeContent}
                        disabled={isGenerating || !prompt.trim()}
                        className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(59,130,246,0.3)] disabled:opacity-50"
                    >
                        {isGenerating ? <RefreshCw className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                        Forge Viral Assets
                    </button>
                </div>

                {/* Forge Output */}
                <div className="min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {!generatedContent && !isGenerating && (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center border border-white/5 bg-zinc-950/20 rounded-[2.5rem] p-12 text-center"
                            >
                                <Layout className="w-16 h-16 mb-4 text-zinc-800" />
                                <p className="text-zinc-600 font-mono text-xs uppercase tracking-widest leading-relaxed">
                                    Forge at absolute zero.<br/>Enter prompt to ignite neural furnace.
                                </p>
                            </motion.div>
                        )}

                        {isGenerating && (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center bg-blue-950/5 border border-blue-500/20 rounded-[2.5rem] p-12"
                            >
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
                                    <Sparkles className="w-16 h-16 text-blue-500 animate-spin-slow relative z-10" />
                                </div>
                                <p className="text-blue-400 font-black text-sm uppercase tracking-[0.3em] animate-pulse">Forging Digital DNA...</p>
                            </motion.div>
                        )}

                        {generatedContent && !isGenerating && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="bg-zinc-950 p-8 rounded-[2.5rem] border border-white/5 space-y-4">
                                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                        <Video className="w-4 h-4" /> Reel Script
                                    </h4>
                                    <p className="text-xs text-zinc-300 font-medium leading-relaxed bg-white/5 p-4 rounded-2xl italic">
                                        {generatedContent.reel_script}
                                    </p>
                                    
                                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 pt-4">
                                        <Type className="w-4 h-4" /> High-Performance Caption
                                    </h4>
                                    <p className="text-xs text-zinc-400 font-bold leading-relaxed bg-black p-4 rounded-2xl border border-white/5">
                                        {generatedContent.caption}
                                    </p>

                                    <h4 className="text-[10px] font-black text-pink-400 uppercase tracking-widest flex items-center gap-2 pt-4">
                                        <Image className="w-4 h-4" /> Image Generation Prompt
                                    </h4>
                                    <div className="text-[10px] text-pink-300 font-mono bg-pink-900/10 p-4 rounded-xl border border-pink-500/20">
                                        {generatedContent.image_prompt}
                                    </div>
                                    
                                    <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2 pt-4">
                                        <BarChart className="w-4 h-4" /> Story Engagement Hooks
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {(generatedContent.story_ideas || []).map((idea: string, i: number) => (
                                            <div key={i} className="px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-xs text-zinc-300 italic">
                                                "{idea}"
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
