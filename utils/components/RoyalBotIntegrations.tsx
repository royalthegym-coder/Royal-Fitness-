
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import { BotIcon } from './icons/BotIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { QrCodeIcon } from './icons/QrCodeIcon';
import { FingerPrintIcon } from './icons/FingerPrintIcon';
import { BellIcon } from './icons/BellIcon';
import { DumbbellIcon } from './icons/DumbbellIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { OpenSourceIcon } from './icons/OpenSourceIcon';
import { CloudArrowUpIcon } from './icons/CloudArrowUpIcon';
import { StarIcon } from './icons/StarIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { getComplexResponse } from '../../lib/gemini';
import { GoogleIcon } from './icons/GoogleIcon';

// --- TYPES ---
type BotStatus = 'Active' | 'Idle' | 'Processing' | 'Error' | 'Deploying';

interface BotConfig {
    id: string;
    name: string;
    provider: string; 
    description: string;
    icon: React.ReactNode;
    status: BotStatus;
    stats: { label: string; value: string | number }[];
    color: string;
    category?: 'neural' | 'ops' | 'growth' | 'experience';
}

interface MarketBot {
    id: string;
    name: string;
    developer: string;
    description: string;
    category: 'LLM' | 'Vision' | 'Audio' | 'Agent';
    downloads: string;
    isInstalled: boolean;
    rating: number;
}

// Helper for MediaPipe Icon locally since it's not imported
const EyeIcon = ({className}:{className?: string}) => <span className={`text-2xl ${className}`}>👁️</span>;
const PinterestIcon = ({className}:{className?: string}) => <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.435.771 1.435 1.696 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.112.112.212.083.382-.09.382-.296 1.191-.336 1.36-.053.22-.172.267-.399.16-1.49-.691-2.422-2.859-2.422-4.603 0-3.748 2.738-7.189 7.892-7.189 4.144 0 7.365 2.953 7.365 6.899 0 4.117-2.595 7.431-6.199 7.431-1.211 0-2.348-.63-2.738-1.373 0 0-.599 2.282-.744 2.84-.282 1.084-1.064 2.456-1.549 3.235C9.573 23.818 10.762 24 12.017 24c6.606 0 11.983-5.367 11.983-11.987 0-6.62-5.377-11.987-11.983-11.987z"/></svg>;

const RoyalBotIntegrations: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'ops' | 'growth' | 'experience' | 'neural' | 'store'>('neural');
    const [processingBot, setProcessingBot] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    
    // --- MARKETPLACE DATA (Latest Open Source 2025) ---
    const [marketBots, setMarketBots] = useState<MarketBot[]>([
        { id: 'svd-xt', name: 'SVD-XT Motion', developer: 'Stability AI (OSS)', description: 'Synthesizes cinematic workout demonstration videos from a single static image.', category: 'Vision', downloads: '12M+', isInstalled: true, rating: 4.9 },
        { id: 'llama3.2', name: 'Llama 3.2 (90B)', developer: 'Meta AI', description: 'Multimodal powerhouse for vision-based workout tracking and text guidance.', category: 'LLM', downloads: '25M+', isInstalled: true, rating: 4.9 },
        { id: 'flux1', name: 'Flux.1 [dev]', developer: 'Black Forest Labs', description: 'Next-gen image generation for hyper-realistic marketing assets.', category: 'Vision', downloads: '8M+', isInstalled: false, rating: 4.8 },
        { id: 'phi3.5', name: 'Phi-3.5 Vision', developer: 'Microsoft', description: 'Lightweight vision model for edge devices and kiosk cameras.', category: 'Vision', downloads: '5M+', isInstalled: false, rating: 4.7 },
        { id: 'mistral-nemo', name: 'Mistral NeMo', developer: 'Mistral x NVIDIA', description: 'Optimized for enterprise gym operations and scheduling.', category: 'LLM', downloads: '3M+', isInstalled: false, rating: 4.6 },
        { id: 'whisper-v3', name: 'Whisper V3 Turbo', developer: 'OpenAI (OSS)', description: 'Ultra-fast speech recognition for noisy gym environments.', category: 'Audio', downloads: '50M+', isInstalled: false, rating: 4.9 },
    ]);

    // --- INSTALLED BOTS CONFIGURATIONS ---
    const [installedBots, setInstalledBots] = useState<BotConfig[]>([
        {
            id: 'deepseek_core',
            name: 'DeepSeek R1',
            provider: 'DeepSeek Logic Engine',
            description: 'Advanced reasoning model for complex biomechanics, pricing strategy, and multi-step logic analysis.',
            icon: <BotIcon className="w-6 h-6" />,
            status: 'Active',
            stats: [{ label: 'Reasoning Depth', value: 'Level 5' }, { label: 'Latency', value: '45ms' }],
            color: 'text-purple-400',
            category: 'neural'
        },
        {
            id: 'grok_realtime',
            name: 'Grok-1',
            provider: 'xAI Real-time',
            description: 'Connected to live X (Twitter) data for trending fitness topics and witty member engagement.',
            icon: <SparkleIcon className="w-6 h-6" />,
            status: 'Active',
            stats: [{ label: 'Live Trends', value: 'Synced' }, { label: 'Humor Level', value: '90%' }],
            color: 'text-white',
            category: 'neural'
        },
        {
            id: 'perplexity_research',
            name: 'Perplexity Online',
            provider: 'Perplexity AI',
            description: 'Deep research engine for grounding diet plans and medical advice in latest scientific journals.',
            icon: <OpenSourceIcon className="w-6 h-6" />,
            status: 'Idle',
            stats: [{ label: 'Sources', value: 'PubMed' }, { label: 'Citations', value: 'Enabled' }],
            color: 'text-cyan-400',
            category: 'neural'
        },
         {
            id: 'google_neural',
            name: 'Gemini 1.5 Pro',
            provider: 'Google DeepMind',
            description: 'Multimodal core for vision analysis, chat, and general gym intelligence.',
            icon: <SparkleIcon className="w-6 h-6" />,
            status: 'Processing',
            stats: [{ label: 'Vision', value: 'Active' }, { label: 'Context', value: '1M Tokens' }],
            color: 'text-amber-400',
            category: 'neural'
        },
        {
            id: 'market_watch',
            name: 'Google Business Bot',
            provider: 'DeepSeek + Gemini',
            description: 'Automates Google Reviews, creates viral posts, and scans local SEO competitors.',
            icon: <GoogleIcon className="w-6 h-6" />,
            status: 'Active',
            stats: [{ label: 'Auto-Replies', value: 145 }, { label: 'SEO Score', value: '98%' }],
            color: 'text-blue-400',
            category: 'growth'
        },
        {
            id: 'pinterest_curator',
            name: 'Pinterest Curator',
            provider: 'Pinterest Visual AI',
            description: 'Fetches high-quality, AI-generated workout form videos and diagrams for the exercise library.',
            icon: <PinterestIcon className="w-6 h-6" />,
            status: 'Active',
            stats: [{ label: 'Pins Synced', value: '1,204' }, { label: 'Form Guides', value: 'HD' }],
            color: 'text-red-500',
            category: 'experience'
        },
        {
            id: 'okfit_bio',
            name: 'Bio-Access Control',
            provider: 'Okfit Biometrics Core',
            description: 'Real-time fingerprint/face recognition sync. Auto-blocks expired members at the turnstile.',
            icon: <FingerPrintIcon className="w-6 h-6" />,
            status: 'Active',
            stats: [{ label: 'Check-ins Today', value: 142 }, { label: 'Denied', value: 3 }],
            color: 'text-cyan-400',
            category: 'ops'
        },
        {
            id: 'billing_auto',
            name: 'Auto-Billing & GST',
            provider: 'Okfit Finance Module',
            description: 'Generates GST invoices, tracks payments, and auto-renews subscriptions via UPI mandates.',
            icon: <DollarSignIcon className="w-6 h-6" />,
            status: 'Active',
            stats: [{ label: 'Pending Dues', value: '₹45k' }, { label: 'Auto-Renewed', value: 8 }],
            color: 'text-green-400',
            category: 'ops'
        },
        {
            id: 'gymowl_alerts',
            name: 'WhatsApp Auto-Pilot',
            provider: 'Meta Cloud x GymOwl',
            description: 'Automated WhatsApp alerts for fees, birthdays, and "We Miss You" retention messages.',
            icon: <WhatsAppIcon className="w-6 h-6" />,
            status: 'Active',
            stats: [{ label: 'Msgs Sent', value: 1250 }, { label: 'Open Rate', value: '98%' }],
            color: 'text-green-500',
            category: 'growth'
        },
        {
            id: 'fitness_ai',
            name: 'Hyper-Trainer',
            provider: 'Llama 3.2 Vision',
            description: 'Generates personalized daily workout plans based on previous log performance (Progressive Overload).',
            icon: <DumbbellIcon className="w-6 h-6" />,
            status: 'Active',
            stats: [{ label: 'Plans Generated', value: 45 }, { label: 'PRs Broken', value: 12 }],
            color: 'text-indigo-400',
            category: 'experience'
        }
    ]);

    // --- SIMULATION LOGIC ---
    useEffect(() => {
        const interval = setInterval(() => {
            const time = new Date().toLocaleTimeString();
            const actions = [
                "Gemini 1.5: Optimized Google Maps Keywords.",
                "DeepSeek R1: Analyzing competitor pricing strategy.",
                "Grok: Detected viral fitness trend 'Hyrox'. Updating class schedule.",
                "Perplexity: Researching latest creatine studies for member query.",
                "Okfit: Synced 3 biometric entries.",
                "WhatsApp: Sent 2 fee reminders via DeepSeek drafted text.",
                "Pinterest Bot: Cached 5 new 'Deadlift Form' diagrams.",
            ];
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            setLogs(prev => [`[${time}] ${randomAction}`, ...prev].slice(0, 8));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleRunBot = async (botId: string) => {
        setProcessingBot(botId);
        // Simulate specific bot action
        setTimeout(async () => {
            let msg = "";
            if (botId.includes('gymowl')) {
                msg = "GymOwl: Batch processed 15 fee reminders. 100% Delivery.";
            } else if (botId.includes('deepseek')) {
                msg = "DeepSeek R1: Solved complex scheduling conflict for Trainer Ravi.";
            } else if (botId.includes('grok')) {
                msg = "Grok: Posted witty tweet about leg day. Engagement +15%.";
            } else if (botId.includes('perplexity')) {
                msg = "Perplexity: Generated report on 'Intermittent Fasting for Women'.";
            } else if (botId.includes('google')) {
                msg = "Gemini: SEO Audit complete. Keywords injected into profile.";
            } else if (botId.includes('market_watch')) {
                msg = "Google Bot: Auto-replied to 3 new reviews and posted 'Weekend Offer'.";
            } else if (botId.includes('pinterest')) {
                msg = "Pinterest Bot: Updated exercise library with 10 high-res infographics.";
            }
            setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
            setProcessingBot(null);
        }, 2000);
    };

    const handleDeployBot = (bot: MarketBot) => {
        setMarketBots(prev => prev.map(b => b.id === bot.id ? { ...b, isInstalled: true } : b));
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] KUBERNETES: Pulling image ${bot.id}:latest...`, ...prev]);
    };

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <AutoUpdateIcon className="w-64 h-64 text-amber-500" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-extrabold text-white flex items-center">
                        <BotIcon className="w-10 h-10 mr-3 text-amber-400" />
                        Royal Neural Hub <span className="text-xs align-top ml-2 bg-amber-500 text-black px-2 py-0.5 rounded font-bold">V5.0</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-2 max-w-xl">
                        Unified automation suite integrating <strong>Gemini</strong>, <strong>DeepSeek</strong>, <strong>Pinterest AI</strong>, and <strong>Perplexity</strong> protocols. 
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-4 border-b border-gray-700 pb-2 overflow-x-auto">
                <button onClick={() => setActiveTab('neural')} className={`pb-2 px-4 text-sm font-bold transition-colors whitespace-nowrap flex items-center ${activeTab === 'neural' ? 'border-b-2 border-amber-400 text-amber-400' : 'text-gray-400 hover:text-white'}`}>
                    <SparkleIcon className="w-4 h-4 mr-2" /> Neural Swarm (AI)
                </button>
                <button onClick={() => setActiveTab('growth')} className={`pb-2 px-4 text-sm font-bold transition-colors whitespace-nowrap flex items-center ${activeTab === 'growth' ? 'border-b-2 border-green-400 text-green-400' : 'text-gray-400 hover:text-white'}`}>
                    <WhatsAppIcon className="w-4 h-4 mr-2" /> WhatsApp & Growth
                </button>
                <button onClick={() => setActiveTab('ops')} className={`pb-2 px-4 text-sm font-bold transition-colors whitespace-nowrap flex items-center ${activeTab === 'ops' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400 hover:text-white'}`}>
                    <FingerPrintIcon className="w-4 h-4 mr-2" /> Operations
                </button>
                <button onClick={() => setActiveTab('experience')} className={`pb-2 px-4 text-sm font-bold transition-colors whitespace-nowrap flex items-center ${activeTab === 'experience' ? 'border-b-2 border-indigo-400 text-indigo-400' : 'text-gray-400 hover:text-white'}`}>
                    <DumbbellIcon className="w-4 h-4 mr-2" /> Experience
                </button>
                <button onClick={() => setActiveTab('store')} className={`pb-2 px-4 text-sm font-bold transition-colors whitespace-nowrap flex items-center ${activeTab === 'store' ? 'border-b-2 border-purple-400 text-purple-400' : 'text-gray-400 hover:text-white'}`}>
                    <OpenSourceIcon className="w-4 h-4 mr-2" /> Bot Store
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'store' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {marketBots.map(bot => (
                        <Card key={bot.id} className="border border-gray-700 hover:border-purple-500 transition-all">
                            <h3 className="text-lg font-bold text-white">{bot.name}</h3>
                            <p className="text-sm text-gray-400 mb-4">{bot.description}</p>
                            <button 
                                onClick={() => handleDeployBot(bot)}
                                disabled={bot.isInstalled}
                                className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${bot.isInstalled ? 'bg-green-900/20 text-green-400' : 'bg-purple-600 text-white'}`}
                            >
                                {bot.isInstalled ? 'INSTALLED' : 'DEPLOY'}
                            </button>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {installedBots.filter(b => b.category === activeTab).map((bot) => (
                        <Card key={bot.id} className="relative group hover:border-gray-500 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl bg-gray-800 border border-gray-700 ${bot.color} shadow-lg`}>
                                    {bot.icon}
                                </div>
                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${bot.status === 'Active' ? 'bg-green-900/20 text-green-400 border-green-500/30' : 'bg-blue-900/20 text-blue-400 border-blue-500/30'}`}>
                                    {processingBot === bot.id ? 'RUNNING...' : bot.status}
                                </span>
                            </div>
                            
                            <h3 className="text-xl font-bold text-white mb-1">{bot.name}</h3>
                            <p className="text-xs text-gray-500 mb-3 font-mono uppercase tracking-wide">Powered by {bot.provider}</p>
                            <p className="text-sm text-gray-300 mb-6 h-10 line-clamp-2">{bot.description}</p>

                            <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                                {bot.stats.map((stat, idx) => (
                                    <div key={idx}>
                                        <p className="text-[10px] text-gray-500 uppercase">{stat.label}</p>
                                        <p className="text-sm font-bold text-white">{stat.value}</p>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={() => handleRunBot(bot.id)}
                                disabled={processingBot === bot.id}
                                className="w-full py-2 rounded-lg font-bold text-sm bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center"
                            >
                                {processingBot === bot.id ? <AutoUpdateIcon className="w-4 h-4 animate-spin mr-2"/> : <SparkleIcon className="w-4 h-4 mr-2"/>}
                                {processingBot === bot.id ? 'Processing...' : 'Run Task Now'}
                            </button>
                        </Card>
                    ))}
                </div>
            )}

            {/* Live Terminal */}
            <Card title="Live Neural Automation Stream" className="bg-black/40 border-gray-700">
                <div className="font-mono text-xs space-y-2 h-40 overflow-y-auto custom-scrollbar">
                    {logs.map((log, i) => (
                        <div key={i} className="flex items-start text-gray-300 border-b border-gray-800/50 pb-1 last:border-0">
                            <span className="text-green-500 mr-2">➜</span>
                            <span className={log.includes('DeepSeek') ? 'text-purple-300' : log.includes('Grok') ? 'text-blue-300' : 'text-gray-300'}>
                                {log}
                            </span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default RoyalBotIntegrations;