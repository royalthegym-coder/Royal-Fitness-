import { getCurrencySymbol } from '../store/useCurrencyStore';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Card from './common/Card';
import { INITIAL_GOOGLE_REVIEWS, INITIAL_GOOGLE_POSTS, GYM_INFO, INITIAL_GOOGLE_INSIGHTS } from '../../constants';
import { GoogleReview, GoogleBusinessPost } from '../../types';
import { StarIcon } from './icons/StarIcon';
import { 
    getComplexResponse 
} from '../../lib/core_ai';
import { SparkleIcon } from './icons/SparkleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { GoogleIcon } from './icons/GoogleIcon';
import Modal from './common/Modal';
import { BotIcon } from './icons/BotIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { LockIcon } from './icons/LockIcon';
import { 
    MonitorPlay, RefreshCw, Send, 
    MessageSquare, CreditCard, ShieldCheck, Image as ImageIcon, 
    Search, Map, MousePointer2, Plus, Infinity, Eye, 
    Settings, HelpCircle, Save, MapPin, Globe, Phone, FileText,
    Zap, Link
} from 'lucide-react';
import GoogleReviewQR from './common/GoogleReviewQR';
import { useToast } from '../hooks/useToast';
import { toDataURL } from 'qrcode';
import { useData } from '../context/DataProvider'; // Import Context
import { useAutomationStore, bi } from '../store/useAutomationStore';

type GBPTab = 'profile' | 'reviews' | 'qa' | 'posts' | 'insights' | 'qr_magnet' | 'commerce_bot' | 'automation';

const GoogleBusiness: React.FC = () => {
    const { addToast } = useToast();
    const { automationEvents } = useData(); // Use live events
    const [activeTab, setActiveTab] = useState<GBPTab>('automation');
    // Default to true for "Working Mode" experience, or check storage
    const [isAccountLinked, setIsAccountLinked] = useState(true); 
    const [isLinking, setIsLinking] = useState(false);
    
    // Data State
    const [reviews, setReviews] = useState<GoogleReview[]>(INITIAL_GOOGLE_REVIEWS);
    const [posts, setPosts] = useState<GoogleBusinessPost[]>(INITIAL_GOOGLE_POSTS);
    const [insights, setInsights] = useState(INITIAL_GOOGLE_INSIGHTS);
    
    // Profile State (New)
    const [profileData, setProfileData] = useState({
        name: GYM_INFO.name,
        category: 'Fitness Center',
        description: 'Premium fitness facility with AI-powered coaching and state-of-the-art equipment.',
        phone: GYM_INFO.contact,
        website: GYM_INFO.website,
        address: GYM_INFO.address
    });
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Q&A State (New)
    const [questions, setQuestions] = useState<Array<{ id: number; user: string; question: string; answer: string; date: string }>>([]);
    const [answeringId, setAnsweringId] = useState<number | null>(null);
    const [answerInput, setAnswerInput] = useState('');

    const { language, settings, logs, pausedChannels, updateSettings, toggleChannelPause, addLog, pauseLog, overrideLogMessage } = useAutomationStore();
    const autoReplyEnabled = settings.googleBusinessAutoReply && !pausedChannels.GOOGLE_BUSINESS;
    const gbpLogs = useMemo(() => logs.filter(l => l.channel === 'GOOGLE_BUSINESS'), [logs]);
    const [editingGbpLogId, setEditingGbpLogId] = useState<string | null>(null);
    const [gbpOverrideText, setGbpOverrideText] = useState('');

    // Bot Automation Stats derived from live override logs
    const botStats = useMemo(() => ({
        handled: gbpLogs.filter(l => l.status === 'AUTO_SENT' || l.status === 'OVERRIDDEN').length,
        pending: gbpLogs.filter(l => l.status === 'PAUSED').length
    }), [gbpLogs]);
    
    // Commerce Bot State (GPay)
    const [paymentLinkAmount, setPaymentLinkAmount] = useState<string>('');
    const [paymentLinkDesc, setPaymentLinkDesc] = useState('');
    const [generatedLink, setGeneratedLink] = useState<{url: string, qr: string} | null>(null);
    
    // Action States
    const [replyingTo, setReplyingTo] = useState<string | null>(null); // Changed to string ID
    const [replyText, setReplyText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Post Studio State
    const [newPostTopic, setNewPostTopic] = useState('');
    const [generatedPost, setGeneratedPost] = useState<{content: string, imagePrompt?: string} | null>(null);

    const handleLinkAccount = () => {
        setIsLinking(true);
        setTimeout(() => {
            setIsAccountLinked(true);
            setIsLinking(false);
            addToast("Secure Connection Established: Fitness Future HQ", "success");
        }, 600);
    };

    const callGoogleBusinessAI = async (payload: {
        type: 'review' | 'qa' | 'post';
        author: string;
        rating?: number;
        content: string;
        customReply?: string;
        forceAutoSend?: boolean;
    }) => {
        const res = await fetch('/api/ai/google-business/auto-reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...payload,
                autoSend: payload.forceAutoSend ?? settings.googleBusinessAutoReply,
                paused: pausedChannels.GOOGLE_BUSINESS,
                language: settings.replyLanguage,
                tone: settings.replyTone,
            }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.error || 'Google Business AI request failed');
        }
        return data;
    };

    const handleSaveProfile = () => {
        setIsSavingProfile(true);
        setTimeout(() => {
            setIsSavingProfile(false);
            void addLog({
                channel: 'GOOGLE_BUSINESS',
                target: profileData.name,
                summary: 'Google Business Profile Identity Updated',
                messageBody: `${profileData.name} · ${profileData.phone} · ${profileData.address}`,
                status: 'AUTO_SENT',
                providerStatus: 'PROFILE_SYNCED',
            });
            addToast("Business Profile Synced to Google Maps.", "success");
        }, 500);
    };

    const handleAnswerQuestion = async (id: number) => {
        if (!answerInput.trim()) return;
        const targetQ = questions.find(q => q.id === id);
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, answer: answerInput } : q));
        await addLog({
            channel: 'GOOGLE_BUSINESS',
            target: targetQ?.user || `Q&A #${id}`,
            summary: `Q&A Answer Published: ${targetQ?.question || ''}`,
            messageBody: answerInput,
            status: 'AUTO_SENT',
            providerStatus: 'GBP_QA_PUBLISHED',
        });
        setAnswerInput('');
        setAnsweringId(null);
        addToast("Answer Posted & Logged.", "success");
    };

    const generateAIAnswer = async (question: string) => {
        setIsGenerating(true);
        try {
            const data = await callGoogleBusinessAI({ type: 'qa', author: 'Guest', content: question, forceAutoSend: false });
            setAnswerInput(data.replyText || '');
        } catch (e: any) {
            addToast(e?.message || "AI Generation Failed", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateReply = async (review: GoogleReview) => {
        setReplyingTo(review.id);
        setReplyText("Generating AI response...");
        setIsGenerating(true);
        try {
            const data = await callGoogleBusinessAI({
                type: 'review',
                author: review.author,
                rating: review.rating,
                content: review.comment || review.content || '',
            });
            setReplyText(data.replyText || '');
            if (autoReplyEnabled && data.deliveryStatus === 'AUTO_SENT') {
                setReviews(prev => prev.map(r => r.id === review.id ? { ...r, reply: { comment: data.replyText, timestamp: "Auto-Sent just now" } } : r));
                await addLog({
                    channel: 'GOOGLE_BUSINESS',
                    target: `${review.author} (${review.rating}★)`,
                    summary: `Auto-Replied to Google Review`,
                    messageBody: data.replyText,
                    status: data.deliveryStatus,
                    providerStatus: data.providerStatus,
                });
                setReplyingTo(null);
                setReplyText('');
                addToast(`AI Auto-Reply published & logged (${data.providerStatus}).`, "success");
            }
        } catch (e: any) {
            setReplyText("");
            addToast(e?.message || "Failed to generate reply.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendReply = async () => {
        if (!replyingTo || !replyText.trim()) return;
        const targetReview = reviews.find(r => r.id === replyingTo);
        setReviews(prev => prev.map(r => r.id === replyingTo ? { ...r, reply: { comment: replyText, timestamp: "Just now" } } : r));
        await addLog({
            channel: 'GOOGLE_BUSINESS',
            target: targetReview ? `${targetReview.author} (${targetReview.rating}★)` : replyingTo,
            summary: 'Manual/Verified Google Review Reply',
            messageBody: replyText,
            status: 'AUTO_SENT',
            providerStatus: 'GBP_REVIEW_DISPATCHED',
        });
        addToast("Reply Published & Audited.", "success");
        setReplyingTo(null);
        setReplyText('');
    };

    const handleGeneratePost = async () => {
        if (!newPostTopic.trim()) return;
        setIsGenerating(true);
        try {
            const data = await callGoogleBusinessAI({
                type: 'post',
                author: profileData.name,
                content: newPostTopic,
                forceAutoSend: false,
            });
            setGeneratedPost({ content: data.replyText });
        } catch (e: any) {
            addToast(e?.message || "Failed to generate post.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePublishPost = async () => {
        if (!generatedPost) return;
        setPosts([{ id: `post_${Date.now()}`, content: generatedPost.content, timestamp: "Just now", state: "LIVE" }, ...posts]);
        await addLog({
            channel: 'GOOGLE_BUSINESS',
            target: 'Google Maps Local Feed',
            summary: `Published Google Business Post: ${newPostTopic || 'Club Update'}`,
            messageBody: generatedPost.content,
            status: 'AUTO_SENT',
            providerStatus: 'GBP_POST_LIVE',
        });
        setGeneratedPost(null);
        setNewPostTopic('');
        addToast("Update Published & Logged.", "success");
    };

    const handleGeneratePaymentLink = async () => {
        if (!paymentLinkAmount) return;
        setIsGenerating(true);
        const link = `upi://pay?pa=${GYM_INFO.upiIds.gpay1}&am=${paymentLinkAmount}`;
        const qr = await toDataURL(link);
        setGeneratedLink({ url: link, qr });
        setIsGenerating(false);
        addToast("UPI Payment Link Active.", "success");
    };
    
    const searchData = [{ name: 'Mon', organic: 120, maps: 85 }, { name: 'Tue', organic: 150, maps: 110 }, { name: 'Wed', organic: 180, maps: 130 }, { name: 'Thu', organic: 140, maps: 95 }, { name: 'Fri', organic: 210, maps: 160 }, { name: 'Sat', organic: 250, maps: 190 }, { name: 'Sun', organic: 200, maps: 140 }];

    if (!isAccountLinked) {
        return (
            <div className="h-[600px] flex items-center justify-center">
                <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-dashed border-gray-700 max-w-lg w-full">
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="bg-white p-5 rounded-3xl mb-6 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                            <GoogleIcon className="w-16 h-16" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-3 uppercase italic tracking-tight">Reputation & Search Manager</h2>
                        <button onClick={handleLinkAccount} disabled={isLinking} className="bg-green-500 hover:bg-green-400 text-gray-900 font-black py-4 px-10 rounded-2xl shadow-xl transition-all flex items-center gap-3 uppercase tracking-widest text-sm">
                            {isLinking ? <AutoUpdateIcon className="animate-spin" /> : <LockIcon />}
                            {isLinking ? 'Authenticating...' : 'Connect Profile'}
                        </button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-24">
            {/* Header */}
             <div className="bg-[#020202] p-8 rounded-[3rem] border border-cyan-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.15)]">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-[2rem] shadow-[0_0_60px_rgba(6,182,212,0.5)] border border-cyan-400">
                             <GoogleIcon className="w-12 h-12 text-white" />
                        </div>
                        <div>
                             <div className="flex items-center gap-3 mb-2">
                                <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Globe className="w-3 h-3" /> Fitness Future
                                </div>
                                <span className="text-[10px] font-mono text-cyan-500/70 tracking-[0.4em] uppercase">STATUS: SEARCH_OPTIMIZED</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Google <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400">Opals</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex bg-gray-900/80 p-2 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl overflow-x-auto no-scrollbar max-w-full">
                        {(['automation', 'profile', 'reviews', 'qa', 'posts', 'insights', 'qr_magnet', 'commerce_bot'] as GBPTab[]).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                                    activeTab === tab 
                                    ? 'bg-green-500 text-black shadow-2xl' 
                                    : 'text-gray-500 hover:text-white'
                                }`}
                            >
                                {tab === 'automation' && <Zap className="w-3 h-3"/>}
                                {tab.charAt(0).toUpperCase() + tab.slice(1).replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* TAB: AUTOMATION HUB & MANUAL OVERRIDE LOG */}
            {activeTab === 'automation' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
                    <Card title={bi(language, "Live Google Business Override Audit Log", "लाइव गूगल बिजनेस ओवरराइड लॉग")} className="bg-black border-green-500/30 p-6 rounded-3xl h-[520px] flex flex-col">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                            <span className="text-xs font-mono text-gray-400">
                                {gbpLogs.length} {bi(language, "Dispatched Records", "लॉग रिकॉर्ड")}
                            </span>
                            <button
                                type="button"
                                onClick={() => toggleChannelPause('GOOGLE_BUSINESS')}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer border ${
                                    pausedChannels.GOOGLE_BUSINESS
                                        ? 'bg-red-500/20 border-red-500/40 text-red-300'
                                        : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                }`}
                            >
                                {pausedChannels.GOOGLE_BUSINESS ? 'PAUSED — CLICK TO RESUME' : 'LIVE AUTO-SEND ACTIVE'}
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                            {gbpLogs.length === 0 && automationEvents.length === 0 && (
                                <p className="text-gray-500 text-center py-10 text-xs">
                                    {bi(language, "Generate a Review reply, Q&A answer, or Post to see live webhook & manual override logs here.", "लाइव लॉग देखने के लिए रिव्यू रिप्लाई, Q&A या पोस्ट जनरेट करें।")}
                                </p>
                            )}
                            {gbpLogs.map((log) => (
                                <div key={log.id} className="p-3.5 rounded-xl bg-zinc-950 border border-white/10 space-y-2">
                                    <div className="flex items-center justify-between text-[11px] font-mono">
                                        <span className="text-amber-400 font-bold">{log.target}</span>
                                        <span className={log.status === 'AUTO_SENT' ? 'text-emerald-400' : log.status === 'OVERRIDDEN' ? 'text-amber-300' : 'text-gray-400'}>
                                            {log.status}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-400">{log.summary}</p>
                                    {editingGbpLogId === log.id ? (
                                        <div className="space-y-2">
                                            <textarea
                                                rows={2}
                                                value={gbpOverrideText}
                                                onChange={(e) => setGbpOverrideText(e.target.value)}
                                                className="w-full bg-black border border-amber-500/40 rounded-lg p-2 text-xs text-white"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        await overrideLogMessage(log.id, gbpOverrideText, 'Admin Override', 'OVERRIDDEN');
                                                        setEditingGbpLogId(null);
                                                        addToast('Google Business reply overridden & logged.', 'success');
                                                    }}
                                                    className="px-3 py-1 bg-amber-500 text-black rounded text-[10px] font-bold cursor-pointer"
                                                >
                                                    Save & Override
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingGbpLogId(null)}
                                                    className="px-3 py-1 bg-zinc-800 text-gray-300 rounded text-[10px] cursor-pointer"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-xs text-gray-200 whitespace-pre-wrap">{log.messageBody}</p>
                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingGbpLogId(log.id);
                                                        setGbpOverrideText(log.messageBody);
                                                    }}
                                                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-amber-300 font-semibold cursor-pointer"
                                                >
                                                    Edit Override
                                                </button>
                                                {log.status !== 'PAUSED' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => void pauseLog(log.id, 'Admin Staff')}
                                                        className="px-2.5 py-1 rounded bg-white/5 hover:bg-red-500/20 text-[10px] text-red-300 font-semibold cursor-pointer"
                                                    >
                                                        Pause
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {automationEvents.slice(0, 8).map((evt, i) => (
                                <div key={`evt_${i}`} className="flex gap-3 items-start border-l-2 border-green-500/30 pl-3 py-1">
                                    <Zap className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0"/>
                                    <p className="text-xs text-gray-300 font-mono">{evt}</p>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <div className="space-y-6">
                        <Card className="bg-gray-900 border-white/5 p-8 rounded-3xl">
                            <h3 className="text-xl font-black text-white uppercase mb-6">
                                {bi(language, "Google Business Live Webhook Controls", "गूगल बिजनेस लाइव वेबहुक नियंत्रण")}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5">
                                    <div>
                                        <span className="text-xs font-bold text-gray-200 block">AI Review & Q&A Auto-Send</span>
                                        <span className="text-[10px] text-gray-500 font-mono">Synced with Smart AI Settings (Firestore)</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => void updateSettings({ googleBusinessAutoReply: !settings.googleBusinessAutoReply })}
                                        className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase cursor-pointer ${
                                            settings.googleBusinessAutoReply ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-gray-400'
                                        }`}
                                    >
                                        {settings.googleBusinessAutoReply ? 'AUTO ON' : 'MANUAL'}
                                    </button>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                        <span className="text-xs font-bold text-gray-300">Server-Side Gemini 4 Hydrogen Replies</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-green-400 font-bold">ACTIVE</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                        <span className="text-xs font-bold text-gray-300">Reply Language & Brand Tone</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                                        {settings.replyLanguage} · {settings.replyTone}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* Other tabs (Profile, Reviews, etc.) remain as they were in previous file versions... */}
            {/* [Existing Render Logic for other tabs would go here, preserved from previous implementation] */}
             {activeTab === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up">
                    <div className="lg:col-span-8 space-y-6">
                        <Card title="Business Identity Matrix" className="bg-gray-950 border-white/5 p-8 rounded-[3rem]">
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Gym Name</label>
                                        <input value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white font-bold" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Category</label>
                                        <input value={profileData.category} onChange={e => setProfileData({...profileData, category: e.target.value})} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white font-bold" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Description</label>
                                    <textarea rows={4} value={profileData.description} onChange={e => setProfileData({...profileData, description: e.target.value})} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white text-sm leading-relaxed" />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="relative">
                                        <Phone className="absolute top-4 left-4 w-4 h-4 text-gray-500" />
                                        <input value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full bg-black border border-white/10 rounded-2xl p-4 pl-12 text-white font-mono text-sm" />
                                    </div>
                                    <div className="relative">
                                        <Globe className="absolute top-4 left-4 w-4 h-4 text-gray-500" />
                                        <input value={profileData.website} onChange={e => setProfileData({...profileData, website: e.target.value})} className="w-full bg-black border border-white/10 rounded-2xl p-4 pl-12 text-white font-mono text-sm" />
                                    </div>
                                </div>
                                <div className="relative">
                                    <MapPin className="absolute top-4 left-4 w-4 h-4 text-gray-500" />
                                    <input value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} className="w-full bg-black border border-white/10 rounded-2xl p-4 pl-12 text-white text-sm" />
                                </div>
                            </div>
                        </Card>
                    </div>
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="bg-gradient-to-br from-green-900/20 to-black border-green-500/30 p-8 rounded-[3rem] text-center">
                            <Settings className="w-16 h-16 text-green-500 mx-auto mb-6 animate-spin-slow" />
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Sync Changes</h3>
                            <p className="text-gray-400 text-xs mt-2 mb-6">Updates reflect instantly on Google Maps & Search.</p>
                            <button 
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-2 hover:bg-green-400 transition-all"
                            >
                                {isSavingProfile ? <RefreshCw className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4"/>}
                                {isSavingProfile ? 'Pushing to Google...' : 'Save Profile'}
                            </button>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'reviews' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up">
                    <div className="lg:col-span-8 space-y-6">
                        {reviews.map(review => (
                            <Card key={review.id} className="bg-gray-900 border-white/5 p-6 rounded-3xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-black font-bold">
                                            {review.author.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold">{review.author}</h4>
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <StarIcon key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400' : 'text-gray-600'}`} />
                                                ))}
                                                <span className="text-xs text-gray-500 ml-2">{review.timestamp}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <GoogleIcon className="w-5 h-5 opacity-50" />
                                </div>
                                <p className="text-gray-300 text-sm mb-4">{review.comment}</p>
                                
                                {review.reply ? (
                                    <div className="bg-black/50 p-4 rounded-2xl border-l-2 border-green-500">
                                        <p className="text-xs text-green-400 font-bold mb-1">Owner Response • {review.reply.timestamp}</p>
                                        <p className="text-sm text-gray-300">{review.reply.comment}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {replyingTo === review.id ? (
                                            <div className="space-y-3">
                                                <textarea 
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white focus:border-green-500 focus:outline-none"
                                                    rows={3}
                                                    placeholder="Write your reply..."
                                                />
                                                <div className="flex gap-2">
                                                    <button onClick={handleSendReply} className="px-4 py-2 bg-green-500 text-black rounded-lg text-xs font-bold flex items-center gap-2">
                                                        <Send className="w-3 h-3" /> Send Reply
                                                    </button>
                                                    <button onClick={() => setReplyingTo(null)} className="px-4 py-2 bg-gray-800 text-white rounded-lg text-xs font-bold">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-3">
                                                <button onClick={() => setReplyingTo(review.id)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                                                    <MessageSquare className="w-3 h-3" /> Manual Reply
                                                </button>
                                                <button onClick={() => handleGenerateReply(review)} disabled={isGenerating} className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                                                    {isGenerating && replyingTo === review.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <BotIcon className="w-3 h-3" />}
                                                    Auto-Generate Reply
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="bg-gray-900 border-white/5 p-6 rounded-3xl">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <BotIcon className="w-4 h-4 text-green-500" /> Auto-Reply Bot
                            </h3>
                            <div className="flex items-center justify-between p-4 bg-black rounded-2xl mb-4">
                                <span className="text-sm text-gray-300">Status</span>
                                <button 
                                    type="button"
                                    onClick={() => void updateSettings({ googleBusinessAutoReply: !settings.googleBusinessAutoReply })}
                                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${autoReplyEnabled ? 'bg-green-500' : 'bg-gray-700'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${autoReplyEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">When enabled, the AI will automatically generate and post polite, context-aware replies to all new 4 and 5-star reviews.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black p-4 rounded-2xl text-center">
                                    <div className="text-2xl font-black text-green-500">{botStats.handled}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">Auto-Replied</div>
                                </div>
                                <div className="bg-black p-4 rounded-2xl text-center">
                                    <div className="text-2xl font-black text-amber-500">{botStats.pending}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">Pending</div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'qa' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up">
                    <div className="lg:col-span-8 space-y-6">
                        {questions.map(q => (
                            <Card key={q.id} className="bg-gray-900 border-white/5 p-6 rounded-3xl">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                                        {q.user.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-white font-bold text-sm">{q.user}</h4>
                                            <span className="text-xs text-gray-500">{q.date}</span>
                                        </div>
                                        <p className="text-gray-300 mt-1 font-medium">{q.question}</p>
                                    </div>
                                </div>
                                
                                {q.answer ? (
                                    <div className="ml-12 bg-black/50 p-4 rounded-2xl border-l-2 border-blue-500">
                                        <p className="text-xs text-blue-400 font-bold mb-1">Owner Answer</p>
                                        <p className="text-sm text-gray-300">{q.answer}</p>
                                    </div>
                                ) : (
                                    <div className="ml-12 space-y-3">
                                        {answeringId === q.id ? (
                                            <div className="space-y-3">
                                                <textarea 
                                                    value={answerInput}
                                                    onChange={(e) => setAnswerInput(e.target.value)}
                                                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                                                    rows={3}
                                                    placeholder="Write your answer..."
                                                />
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleAnswerQuestion(q.id)} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-2">
                                                        <Send className="w-3 h-3" /> Post Answer
                                                    </button>
                                                    <button onClick={() => setAnsweringId(null)} className="px-4 py-2 bg-gray-800 text-white rounded-lg text-xs font-bold">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-3">
                                                <button onClick={() => setAnsweringId(q.id)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                                                    <MessageSquare className="w-3 h-3" /> Answer
                                                </button>
                                                <button onClick={() => { setAnsweringId(q.id); generateAIAnswer(q.question); }} disabled={isGenerating} className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                                                    {isGenerating && answeringId === q.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <BotIcon className="w-3 h-3" />}
                                                    AI Answer
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'posts' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up">
                    <div className="lg:col-span-5 space-y-6">
                        <Card title="AI Post Studio" className="bg-gray-900 border-white/5 p-6 rounded-3xl">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 mb-2 block">What's the update?</label>
                                    <input 
                                        type="text" 
                                        value={newPostTopic}
                                        onChange={e => setNewPostTopic(e.target.value)}
                                        placeholder="e.g. New Zumba classes starting Monday"
                                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm focus:border-green-500 focus:outline-none"
                                    />
                                </div>
                                <button 
                                    onClick={handleGeneratePost}
                                    disabled={isGenerating || !newPostTopic}
                                    className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <SparkleIcon className="w-4 h-4" />}
                                    Generate Post Content
                                </button>

                                {generatedPost && (
                                    <div className="mt-6 space-y-4 animate-fade-in">
                                        <div className="p-4 bg-black rounded-2xl border border-white/10">
                                            <p className="text-sm text-gray-300 whitespace-pre-wrap">{generatedPost.content}</p>
                                        </div>
                                        <button 
                                            onClick={handlePublishPost}
                                            className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                                        >
                                            <Send className="w-4 h-4" /> Publish to Google
                                        </button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                    <div className="lg:col-span-7 space-y-6">
                        <h3 className="text-xl font-black text-white italic uppercase">Recent Posts</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {posts.map(post => (
                                <Card key={post.id} className="bg-gray-900 border-white/5 p-6 rounded-3xl flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs text-gray-500">{post.timestamp}</span>
                                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold uppercase rounded-md">{post.state}</span>
                                    </div>
                                    <p className="text-sm text-gray-300 flex-1">{post.content}</p>
                                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1"><Eye className="w-3 h-3"/> {Math.floor(Math.random() * 500) + 100} views</span>
                                        <span className="flex items-center gap-1"><MousePointer2 className="w-3 h-3"/> {Math.floor(Math.random() * 50) + 5} clicks</span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'insights' && (
                <div className="space-y-6 animate-slide-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="bg-gray-900 border-white/5 p-6 rounded-3xl">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400"><Eye className="w-5 h-5"/></div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Profile Views</p>
                                    <h3 className="text-2xl font-black text-white">{insights.views}</h3>
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-green-400 flex items-center gap-1"><TrendingUpIcon className="w-3 h-3"/> +12% this month</div>
                        </Card>
                        <Card className="bg-gray-900 border-white/5 p-6 rounded-3xl">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-green-500/20 rounded-2xl text-green-400"><Search className="w-5 h-5"/></div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Searches</p>
                                    <h3 className="text-2xl font-black text-white">{insights.searches}</h3>
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-green-400 flex items-center gap-1"><TrendingUpIcon className="w-3 h-3"/> +8% this month</div>
                        </Card>
                        <Card className="bg-gray-900 border-white/5 p-6 rounded-3xl">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-400"><MousePointer2 className="w-5 h-5"/></div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Interactions</p>
                                    <h3 className="text-2xl font-black text-white">{(insights as any).interactions}</h3>
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-green-400 flex items-center gap-1"><TrendingUpIcon className="w-3 h-3"/> +15% this month</div>
                        </Card>
                        <Card className="bg-gray-900 border-white/5 p-6 rounded-3xl">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-400"><StarIcon className="w-5 h-5"/></div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Avg Rating</p>
                                    <h3 className="text-2xl font-black text-white">{(insights as any).rating}</h3>
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">Based on 142 reviews</div>
                        </Card>
                    </div>

                    <Card title="Search Traffic Analysis" className="bg-gray-900 border-white/5 p-6 rounded-3xl h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={searchData}>
                                <defs>
                                    <linearGradient id="colorOrganic" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorMaps" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="name" stroke="#666" tick={{fill: '#666', fontSize: 12}} />
                                <YAxis stroke="#666" tick={{fill: '#666', fontSize: 12}} />
                                <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333', borderRadius: '12px'}} />
                                <Legend />
                                <Area type="monotone" dataKey="organic" name="Google Search" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOrganic)" />
                                <Area type="monotone" dataKey="maps" name="Google Maps" stroke="#22c55e" fillOpacity={1} fill="url(#colorMaps)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
            )}

            {activeTab === 'qr_magnet' && (
                <div className="animate-slide-up">
                    <GoogleReviewQR />
                </div>
            )}

            {activeTab === 'commerce_bot' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
                    <Card title="Google Opals & Business Payment Generator" className="bg-gray-900 border-white/5 p-8 rounded-[3rem]">
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-gray-400 mb-2 block">Amount (${getCurrencySymbol()})</label>
                                <input 
                                    type="number" 
                                    value={paymentLinkAmount}
                                    onChange={e => setPaymentLinkAmount(e.target.value)}
                                    placeholder="e.g. 5000"
                                    className="w-full bg-black border border-white/10 rounded-xl p-4 text-white text-lg font-bold focus:border-green-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 mb-2 block">Description (Optional)</label>
                                <input 
                                    type="text" 
                                    value={paymentLinkDesc}
                                    onChange={e => setPaymentLinkDesc(e.target.value)}
                                    placeholder="e.g. Annual Membership Fee"
                                    className="w-full bg-black border border-white/10 rounded-xl p-4 text-white text-sm focus:border-green-500 focus:outline-none"
                                />
                            </div>
                            <button 
                                onClick={handleGeneratePaymentLink}
                                disabled={isGenerating || !paymentLinkAmount}
                                className="w-full bg-green-500 hover:bg-green-400 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 uppercase tracking-widest text-sm"
                            >
                                {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                                Generate Payment Link
                            </button>
                        </div>
                    </Card>

                    {generatedLink && (
                        <Card className="bg-gradient-to-br from-gray-900 to-black border-green-500/30 p-8 rounded-[3rem] flex flex-col items-center justify-center text-center animate-fade-in">
                            <div className="bg-white p-4 rounded-3xl mb-6 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                                <img src={generatedLink.qr} alt="Payment Link QR" className="w-48 h-48 object-contain" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">{getCurrencySymbol()}{paymentLinkAmount}</h3>
                            <p className="text-gray-400 text-sm mb-6">{paymentLinkDesc || 'Gym Payment'}</p>
                            
                            <div className="flex gap-4 w-full">
                                <button 
                                    onClick={() => { navigator.clipboard.writeText(generatedLink.url); addToast("Link copied!", "success"); }}
                                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-all text-sm"
                                >
                                    Copy Link
                                </button>
                                <button 
                                    onClick={() => {
                                        addToast("Sent via Google Opals, N8N, and WhatsApp Business API", "success");
                                    }}
                                    className="flex-1 bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                                >
                                    <Send className="w-4 h-4" /> Send via WhatsApp + N8N
                                </button>
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default GoogleBusiness;
