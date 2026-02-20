
import React, { useState } from 'react';
import Card from '../common/Card';
import { Share2, Instagram, Facebook, Youtube, Sparkles, Send, Calendar } from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import { getComplexResponse } from '../../../lib/gemini';

const SocialMediaManager: React.FC = () => {
    const { addSocialPost, socialPosts } = useData();
    const { addToast } = useToast();
    const [topic, setTopic] = useState('');
    const [platform, setPlatform] = useState<'Instagram' | 'Facebook' | 'YouTube'>('Instagram');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!topic) return;
        setIsGenerating(true);
        try {
            const prompt = `Write a viral ${platform} post for a gym about: "${topic}". Include emojis and hashtags. Max 50 words.`;
            const res = await getComplexResponse(prompt);
            setGeneratedContent(res);
        } catch (e) {
            addToast("AI Generation Failed.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePost = () => {
        if (!generatedContent) return;
        addSocialPost({
            id: `post-${Date.now()}`,
            platform: [platform as any],
            content: generatedContent,
            status: 'Scheduled',
            time: 'Tomorrow, 10:00 AM',
            author: 'Admin'
        });
        addToast("Content Scheduled Successfully.", "success");
        setGeneratedContent('');
        setTopic('');
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="p-10 rounded-[3.5rem] bg-[#050505] border border-pink-500/20 shadow-2xl">
                 <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                    <Share2 className="w-10 h-10 text-pink-500" />
                    Brand <span className="text-pink-400">Command</span>
                </h1>
                <p className="text-gray-500 text-xs font-mono mt-2 tracking-widest uppercase">Multi-Channel Broadcast Node</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Content Creator */}
                <Card className="bg-gray-900 border-white/5 p-8 rounded-[3rem]">
                    <h3 className="text-xl font-bold text-white mb-6">AI Content Studio</h3>
                    <div className="space-y-4">
                        <div className="flex gap-2 mb-4">
                            {['Instagram', 'Facebook', 'YouTube'].map(p => (
                                <button 
                                    key={p} 
                                    onClick={() => setPlatform(p as any)}
                                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${platform === p ? 'bg-white text-black' : 'bg-black border border-white/10 text-gray-500'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <textarea 
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="What's happening? (e.g. New treadmills, Transformation Tuesday)"
                            className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-pink-500 outline-none resize-none"
                            rows={3}
                        />
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating || !topic}
                            className="w-full bg-pink-600 text-white font-black py-4 rounded-2xl uppercase text-xs flex items-center justify-center gap-2 hover:bg-pink-500 transition-all disabled:opacity-50"
                        >
                            <Sparkles className="w-4 h-4" /> {isGenerating ? 'Generating...' : 'Generate Magic'}
                        </button>
                        
                        {generatedContent && (
                            <div className="bg-pink-900/10 border border-pink-500/30 p-4 rounded-2xl animate-fade-in">
                                <p className="text-sm text-pink-100 italic">{generatedContent}</p>
                                <button onClick={handlePost} className="w-full mt-4 bg-white text-black font-black py-3 rounded-xl text-xs uppercase flex items-center justify-center gap-2">
                                    <Calendar className="w-4 h-4"/> Schedule Post
                                </button>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Queue */}
                <Card className="bg-gray-900 border-white/5 p-8 rounded-[3rem]">
                    <h3 className="text-xl font-bold text-white mb-6">Scheduled Queue</h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {socialPosts.filter(p => p.status === 'Scheduled').map(post => (
                            <div key={post.id} className="bg-black/40 p-4 rounded-2xl border border-white/5 flex gap-4">
                                <div className="p-3 bg-gray-800 rounded-xl h-fit">
                                    {post.platform?.includes('Instagram') ? <Instagram className="w-5 h-5 text-pink-500"/> : <Facebook className="w-5 h-5 text-blue-500"/>}
                                </div>
                                <div>
                                    <p className="text-gray-300 text-xs line-clamp-2">{post.content}</p>
                                    <p className="text-[10px] text-gray-500 mt-2 font-mono">{post.time}</p>
                                </div>
                            </div>
                        ))}
                         {socialPosts.filter(p => p.status === 'Scheduled').length === 0 && (
                            <p className="text-center text-gray-600 text-xs py-10 uppercase tracking-widest">Queue Empty</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SocialMediaManager;
