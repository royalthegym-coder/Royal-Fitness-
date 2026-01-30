
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Card from './common/Card';
import { INITIAL_GOOGLE_REVIEWS, INITIAL_GOOGLE_POSTS, GYM_INFO, INITIAL_GOOGLE_INSIGHTS } from '../../constants';
import { GoogleReview, GoogleBusinessPost } from '../../types';
import { StarIcon } from './icons/StarIcon';
import { 
    getComplexResponse, 
    generateMarketingImage, 
    generateAutonomousMarketingStrategy
} from '../../lib/gemini';
import { SparkleIcon } from './icons/SparkleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { GoogleIcon } from './icons/GoogleIcon';
import Modal from './common/Modal';
import { BotIcon } from './icons/BotIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { UploadIcon } from './icons/UploadIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import CustomTooltip from './common/CustomTooltip';
// added LockIcon import
import { LockIcon } from './icons/LockIcon';

type GBPTab = 'reviews' | 'posts' | 'insights';

const GoogleBusiness: React.FC = () => {
    const [activeTab, setActiveTab] = useState<GBPTab>('reviews');
    const [isAccountLinked, setIsAccountLinked] = useState(false);
    const [isLinking, setIsLinking] = useState(false);
    
    // Data State
    const [reviews, setReviews] = useState<GoogleReview[]>(INITIAL_GOOGLE_REVIEWS);
    const [posts, setPosts] = useState<GoogleBusinessPost[]>(INITIAL_GOOGLE_POSTS);
    const [insights] = useState(INITIAL_GOOGLE_INSIGHTS);
    
    // Action States
    const [replyingTo, setReplyingTo] = useState<GoogleReview | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isNewPostModalOpen, setNewPostModalOpen] = useState(false);

    // AI Performance State
    const [optimizationReport, setOptimizationReport] = useState<string | null>(null);

    useEffect(() => {
        const savedKey = localStorage.getItem('google_business_key');
        if (savedKey) setIsAccountLinked(true);
    }, []);

    const handleLinkAccount = () => {
        setIsLinking(true);
        setTimeout(() => {
            setIsAccountLinked(true);
            setIsLinking(false);
        }, 1500);
    };

    const handleGenerateReply = async (review: GoogleReview) => {
        setReplyingTo(review);
        setIsGenerating(true);
        const prompt = `Generate a professional, warm, and SEO-friendly reply to this ${review.rating}-star review for "Royal The Gym".
        Reviewer: ${review.authorName}
        Comment: "${review.comment}"`;
        const generatedReply = await getComplexResponse(prompt);
        setReplyText(generatedReply);
        setIsGenerating(false);
    };

    const handleSendReply = () => {
        if (!replyingTo) return;
        setReviews(prev => prev.map(r => 
            r.id === replyingTo.id 
            ? { ...r, reply: { comment: replyText, timestamp: new Date().toISOString().split('T')[0] } } 
            : r
        ));
        setReplyingTo(null);
        setReplyText('');
    };

    const performanceData = [
        { name: 'Mon', search: 120, maps: 85 },
        { name: 'Tue', search: 150, maps: 110 },
        { name: 'Wed', search: 180, maps: 130 },
        { name: 'Thu', search: 140, maps: 95 },
        { name: 'Fri', search: 210, maps: 160 },
        { name: 'Sat', search: 250, maps: 190 },
        { name: 'Sun', search: 200, maps: 140 },
    ];

    if (!isAccountLinked) {
        return (
            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-dashed border-gray-700">
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="bg-white p-5 rounded-3xl mb-6 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                        <GoogleIcon className="w-16 h-16" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-3 uppercase italic tracking-tight">Google Business Manager</h2>
                    <p className="text-gray-400 mb-8 max-w-lg font-medium">
                        Sync Royal The Gym with Google Business Profile to manage your reputation, publish viral updates, and track local search performance.
                    </p>
                    <button 
                        onClick={handleLinkAccount}
                        disabled={isLinking}
                        className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-black py-4 px-10 rounded-2xl shadow-xl transition-all flex items-center gap-3 uppercase tracking-widest text-sm"
                    >
                        {isLinking ? <AutoUpdateIcon className="animate-spin" /> : <LockIcon />}
                        {isLinking ? 'Authenticating...' : 'Connect Profile'}
                    </button>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-gray-800/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-lg relative">
                        <GoogleIcon className="w-8 h-8" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800"></div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Royal The Gym</h2>
                        <p className="text-xs text-green-400 font-bold uppercase tracking-widest flex items-center mt-1">
                            <CheckCircleIcon className="w-3 h-3 mr-1" /> Live on Google
                        </p>
                    </div>
                </div>
                
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                    {(['reviews', 'posts', 'insights'] as GBPTab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === tab ? 'bg-amber-500 text-gray-900 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Tabs */}
            {activeTab === 'reviews' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        {reviews.map(review => (
                            <Card key={review.id} className="border-white/5 hover:border-amber-500/30 transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-black text-white border border-white/10">
                                            {review.authorName[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{review.authorName}</p>
                                            <div className="flex text-amber-400 gap-0.5 mt-0.5">
                                                {[...Array(5)].map((_, i) => <StarIcon key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-600'}`} />)}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-mono">{review.timestamp}</span>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed italic mb-4">"{review.comment}"</p>
                                
                                {review.reply ? (
                                    <div className="bg-blue-500/5 border-l-4 border-blue-500 p-4 rounded-r-xl">
                                        <p className="text-[10px] font-black text-blue-400 uppercase mb-2">Owner Response</p>
                                        <p className="text-sm text-gray-400 italic">"{review.reply.comment}"</p>
                                    </div>
                                ) : (
                                    <div className="flex justify-end gap-3">
                                        <button 
                                            onClick={() => handleGenerateReply(review)}
                                            className="text-[10px] font-black uppercase tracking-widest text-amber-500 border border-amber-500/20 px-4 py-2 rounded-lg hover:bg-amber-500/10 transition-all flex items-center gap-2"
                                        >
                                            <SparkleIcon className="w-3 h-3" /> AI Suggestion
                                        </button>
                                        <button 
                                            onClick={() => setReplyingTo(review)}
                                            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
                                        >
                                            Manual Reply
                                        </button>
                                    </div>
                                )}

                                {replyingTo?.id === review.id && (
                                    <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in">
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-amber-500/50 min-h-[100px]"
                                            placeholder="Compose your reply..."
                                        />
                                        <div className="flex justify-end gap-3 mt-3">
                                            <button onClick={() => setReplyingTo(null)} className="text-xs font-bold text-gray-500 px-4 py-2">Cancel</button>
                                            <button onClick={handleSendReply} className="bg-blue-600 text-white text-xs font-black px-6 py-2 rounded-lg hover:bg-blue-500 shadow-lg uppercase tracking-widest">Publish Reply</button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>

                    <div className="space-y-6">
                        <Card title="Reputation Health" className="bg-gradient-to-br from-gray-800 to-gray-900 border-none">
                            <div className="text-center py-4">
                                <p className="text-5xl font-black text-amber-500">{insights.averageRating}</p>
                                <div className="flex justify-center text-amber-400 gap-1 my-2">
                                    {[...Array(5)].map((_, i) => <StarIcon key={i} className="w-5 h-5 fill-current" />)}
                                </div>
                                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Across {insights.totalReviews} Reviews</p>
                            </div>
                            <div className="mt-6 space-y-3">
                                {[5,4,3,2,1].map(stars => (
                                    <div key={stars} className="flex items-center gap-3">
                                        <span className="text-[10px] text-gray-500 font-bold w-4">{stars}★</span>
                                        <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-500" style={{ width: `${stars === 5 ? 80 : stars === 4 ? 15 : 5}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                        
                        <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                             <SparkleIcon className="w-4 h-4" /> AI Review Analyzer
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'posts' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Active Campaigns</h3>
                        <button 
                            onClick={() => setNewPostModalOpen(true)}
                            className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-black py-2 px-6 rounded-xl shadow-lg transition-all flex items-center gap-2 uppercase tracking-widest text-xs"
                        >
                            <UploadIcon className="w-4 h-4" /> New Update
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map(post => (
                            <Card key={post.id} className="p-0 overflow-hidden flex flex-col h-full group hover:border-amber-500/30 transition-all">
                                {post.imageUrl && (
                                    <div className="h-48 relative overflow-hidden">
                                        <img src={post.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="post" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                                    </div>
                                )}
                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Live</span>
                                            <span className="text-[10px] text-gray-500 font-mono">{post.timestamp}</span>
                                        </div>
                                        <p className="text-gray-300 text-sm line-clamp-3 mb-4">"{post.content}"</p>
                                    </div>
                                    <button className="w-full py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-white/5">
                                        View Analytics
                                    </button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'insights' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-gray-800/50 p-6 rounded-3xl border border-white/5 text-center">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Search Views</p>
                            <p className="text-3xl font-black text-white">{insights.searchViews.toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-800/50 p-6 rounded-3xl border border-white/5 text-center">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Map Views</p>
                            <p className="text-3xl font-black text-white">{insights.profileViews.toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-800/50 p-6 rounded-3xl border border-white/5 text-center">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Actions</p>
                            <p className="text-3xl font-black text-amber-500">{insights.actions}</p>
                        </div>
                        <div className="bg-gray-800/50 p-6 rounded-3xl border border-white/5 text-center">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Local Authority</p>
                            <p className="text-3xl font-black text-green-500">82%</p>
                        </div>
                    </div>

                    <Card title="Traffic Intelligence" className="h-[450px]">
                        <div className="h-full w-full mt-4">
                            <ResponsiveContainer width="100%" height="85%">
                                <BarChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconType="circle" />
                                    <Bar dataKey="search" name="Google Search" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="maps" name="Google Maps" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-indigo-600/10 border-indigo-500/30">
                            <div className="flex gap-4">
                                <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400 h-fit">
                                    <SparkleIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white mb-1">Strategic AI Scan</h4>
                                    <p className="text-sm text-gray-400 mb-4">Gemini detected a 15% drop in Search visibility for "Strength Training" in Jhunjhunu.</p>
                                    <button 
                                        onClick={async () => {
                                            setIsGenerating(true);
                                            const report = await generateAutonomousMarketingStrategy(reviews, posts, GYM_INFO);
                                            setOptimizationReport(report);
                                            setIsGenerating(false);
                                        }}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-xl transition-all shadow-lg"
                                    >
                                        {isGenerating ? 'Running Scan...' : 'Fix Visibility'}
                                    </button>
                                </div>
                            </div>
                        </Card>
                        
                        {optimizationReport && (
                            <Card className="animate-fade-in border-green-500/30">
                                <div className="prose prose-invert prose-sm" dangerouslySetInnerHTML={{ __html: optimizationReport }} />
                            </Card>
                        )}
                    </div>
                </div>
            )}

            <NewPostModal 
                isOpen={isNewPostModalOpen} 
                onClose={() => setNewPostModalOpen(false)}
                onSave={(p) => {
                    setPosts(prev => [{ ...p, id: Date.now().toString() }, ...prev]);
                    setNewPostModalOpen(false);
                }}
            />
        </div>
    );
};

interface NewPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (post: Omit<GoogleBusinessPost, 'id'>) => void;
}

const NewPostModal: React.FC<NewPostModalProps> = ({ isOpen, onClose, onSave }) => {
    const [content, setContent] = useState('');
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600');
    // Renamed fileInputRef to logoInputRef to match the usage in the template and fixed missing useRef by adding it to the React import.
    const logoInputRef = useRef<HTMLInputElement>(null);

    const handleGenerateContent = async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        const prompt = `Write a viral Google Business offer for "Royal The Gym" about: "${topic}". Include a punchy headline, 3 bullet points, and a CTA. Max 100 words.`;
        const result = await getComplexResponse(prompt); 
        setContent(result);
        setIsLoading(false);
    };

    const handleGenerateImage = async () => {
        setIsGeneratingImage(true);
        const generatedImageBase64 = await generateMarketingImage(topic || content);
        if (generatedImageBase64) setImageUrl(generatedImageBase64);
        setIsGeneratingImage(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => event.target?.result && setImageUrl(event.target.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Google Business Post">
            <div className="space-y-5">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                    <GoogleIcon className="w-6 h-6" />
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Public Broadcast System</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2 block">Campaign Goal</label>
                        <div className="flex gap-2">
                            <input 
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                className="flex-1 bg-gray-800 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50"
                                placeholder="e.g. 50% Off New Members"
                            />
                            <button onClick={handleGenerateContent} disabled={isLoading} className="bg-blue-600 text-white font-black px-4 rounded-xl hover:bg-blue-500 disabled:opacity-50">
                                <SparkleIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2 block">Update Details</label>
                        <textarea 
                            rows={4}
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            className="w-full bg-gray-800 border border-white/5 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-amber-500/50"
                            placeholder="What's happening at the gym?"
                        />
                    </div>

                    <div className="relative group rounded-2xl overflow-hidden border border-white/10 h-48 bg-black">
                        {isGeneratingImage ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                                <SparkleIcon className="w-8 h-8 text-amber-500 animate-spin mb-2" />
                                <span className="text-[10px] font-bold text-gray-500 animate-pulse">Rendering Cinematic Visual...</span>
                            </div>
                        ) : (
                            <img src={imageUrl} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" alt="preview" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={handleGenerateImage} className="bg-amber-500 text-gray-900 px-4 py-2 rounded-full font-black text-[10px] uppercase">AI Generate</button>
                            <button onClick={() => logoInputRef.current?.click()} className="bg-white text-gray-900 px-4 py-2 rounded-full font-black text-[10px] uppercase">Upload</button>
                        </div>
                        <input type="file" ref={logoInputRef} className="hidden" onChange={handleFileChange} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <button onClick={onClose} className="py-4 text-xs font-black uppercase text-gray-500 tracking-widest hover:text-white">Cancel</button>
                    <button 
                        onClick={() => onSave({ content, imageUrl, timestamp: 'Just now', state: 'LIVE' })}
                        className="bg-amber-500 text-gray-900 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-900/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        Publish to Search
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default GoogleBusiness;
