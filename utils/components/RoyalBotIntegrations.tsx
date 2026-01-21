
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import { INITIAL_MEMBERS, GYM_INFO, INITIAL_INVOICES, INITIAL_STAFF } from '../../constants';
import { BotIcon } from './icons/BotIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { QrCodeIcon } from './icons/QrCodeIcon';
import { FingerPrintIcon } from './icons/FingerPrintIcon';
import { BellIcon } from './icons/BellIcon';
import { DumbbellIcon } from './icons/DumbbellIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { OpenSourceIcon } from './icons/OpenSourceIcon';
import { CloudArrowUpIcon } from './icons/CloudArrowUpIcon';
import { StarIcon } from './icons/StarIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { getComplexResponse } from '../../lib/gemini';

// --- TYPES ---
type BotStatus = 'Active' | 'Idle' | 'Processing' | 'Error' | 'Deploying';

interface BotConfig {
    id: string;
    name: string;
    provider: string; // e.g., "Okfit Architecture", "GymOwl Engine"
    description: string;
    icon: React.ReactNode;
    status: BotStatus;
    stats: { label: string; value: string | number }[];
    color: string;
    category?: 'neural' | 'ops' | 'growth' | 'experience'; // For installed bots mapping
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

const RoyalBotIntegrations: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'ops' | 'growth' | 'experience' | 'neural' | 'store'>('neural');
    const [processingBot, setProcessingBot] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    
    // --- MARKETPLACE DATA (Latest Open Source 2025) ---
    const [marketBots, setMarketBots] = useState<MarketBot[]>([
        { id: 'svd-xt', name: 'SVD-XT Motion', developer: 'Stability AI (OSS)', description: 'Synthesizes cinematic workout demonstration videos from a single static image.', category: 'Vision', downloads: '12M+', isInstalled: false, rating: 4.9 },
        { id: 'deepseek-r1', name: 'DeepSeek R1', developer: 'DeepSeek', description: 'Advanced reasoning model for complex biomechanics and logic analysis.', category: 'LLM', downloads: '18M+', isInstalled: false, rating: 4.9 },
        { id: 'llama3.2', name: 'Llama 3.2 (90B)', developer: 'Meta AI', description: 'Multimodal powerhouse for vision-based workout tracking and text guidance.', category: 'LLM', downloads: '25M+', isInstalled: false, rating: 4.9 },
        { id: 'flux1', name: 'Flux.1 [dev]', developer: 'Black Forest Labs', description: 'Next-gen image generation for hyper-realistic marketing assets.', category: 'Vision', downloads: '8M+', isInstalled: false, rating: 4.8 },
        { id: 'phi3.5', name: 'Phi-3.5 Vision', developer: 'Microsoft', description: 'Lightweight vision model for edge devices and kiosk cameras.', category: 'Vision', downloads: '5M+', isInstalled: false, rating: 4.7 },
        { id: 'mistral-nemo', name: 'Mistral NeMo', developer: 'Mistral x NVIDIA', description: 'Optimized for enterprise gym operations and scheduling.', category: 'LLM', downloads: '3M+', isInstalled: false, rating: 4.6 },
        { id: 'whisper-v3', name: 'Whisper V3 Turbo', developer: 'OpenAI (OSS)', description: 'Ultra-fast speech recognition for noisy gym environments.', category: 'Audio', downloads: '50M+', isInstalled: false, rating: 4.9 },
        { id: 'openpose-rt', name: 'OpenPose RT', developer: 'CMU', description: 'Real-time multi-person keypoint detection for form correction.', category: 'Vision', downloads: '12M+', isInstalled: true, rating: 4.5 }, 
        { id: 'audioldm', name: 'AudioLDM-2', developer: 'OpenSource', description: 'Generates custom ambient workout music tracks.', category: 'Audio', downloads: '2M+', isInstalled: false, rating: 4.3 },
        { id: 'qwen2.5', name: 'Qwen 2.5 Math', developer: 'Alibaba Cloud', description: 'Specialized in calculating complex nutritional macros and progressive overload.', category: 'Agent', downloads: '6M+', isInstalled: false, rating: 4.7 },
    ]);

    // --- INSTALLED BOTS CONFIGURATIONS ---
    const [installedBots, setInstalledBots] = useState<BotConfig[]>([
         {
            id: 'google_neural',
            name: 'Google Profile Mind',
            provider: 'Gemini 2.0 Flash',
            description: 'Continuously optimizes Maps ranking, SEO descriptions, and auto-responds to reviews.',
            icon: <SparkleIcon className="w-6 h-6" />,
            status: 'Processing',
            stats: [{ label: 'Optimization Score', value: '98/100' }, { label: 'Auto-Posts', value: '3/Week' }],
            color: 'text-amber-400',
            category: 'neural'
        },
        {
            id: 'video_motion_svd',
            name: 'AI Video Renderer',
            provider: 'Stability SVD-XT',
            description: 'Generates high-fidelity cardio preview videos locally using open-source diffusion models.',
            icon: <VideoCameraIcon className="w-6 h-6" />,
            status: 'Active',
            stats: [{ label: 'FPS Rendered', value: '30' }, { label: 'GPU Usage', value: '82%' }],
            color: 'text-pink-400',
            category: 'experience'
        },
        {
            id: 'market_watch',
            name: 'Market Watchdog',
            provider: 'DeepSeek R1 Engine',
            description: 'Scans local competitor reviews and pricing to suggest strategic adjustments using Chain-of-Thought.',
            icon: <TrendingUpIcon className="w-6 h-6" />,
            status: 'Active',
            stats: [{ label: 'Competitors', value: 5 }, { label: 'Gap Analysis', value: 'Ready' }],
            color: 'text-blue-400',
            category: 'neural'
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
            id: 'staff_ops',
            name: 'Staff Commander',
            provider: 'FitGym Rostering',
            description: 'Automated shift scheduling and biometric attendance tracking for trainers and housekeeping.',
            icon: <QrCodeIcon className="w-6 h-6" />,
            status: 'Idle',
            stats: [{ label: 'Staff Present', value: '5/8' }, { label: 'Payroll Est.', value: '₹1.2L' }],
            color: 'text-purple-400',
            category: 'ops'
        },
        {
            id: 'gymowl_alerts',
            name: 'Smart Alert Hub',
            provider: 'GymOwl Notification Engine',
            description: 'Automated WhatsApp alerts for fees, birthdays, and "We Miss You" retention messages.',
            icon: <WhatsAppIcon className="w-6 h-6" />,
            status: 'Active',
            stats: [{ label: 'Msgs Sent', value: 1250 }, { label: 'Open Rate', value: '98%' }],
            color: 'text-green-500',
            category: 'growth'
        },
        {
            id: 'retention_ai',
            name: 'Churn Predictor',
            provider: 'Gemini Predictive Analytics',
            description: 'Analyzes attendance patterns to predict cancellations before they happen.',
            icon: <TrendingUpIcon className="w-6 h-6" />,
            status: 'Processing',
            stats: [{ label: 'At-Risk', value: 12 }, { label: 'Saved', value: 4 }],
            color: 'text-red-400',
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
        },
        {
            id: 'class_minder',
            name: 'Class Optimizer',
            provider: 'Virtuagym Logic',
            description: 'Auto-schedules classes based on demand and sends invites to interested members.',
            icon: <CalendarIcon className="w-6 h-6" />,
            status: 'Idle',
            stats: [{ label: 'Fill Rate', value: '85%' }, { label: 'Waitlist', value: 4 }],
            color: 'text-pink-400',
            category: 'experience'
        }
    ]);

    // --- SIMULATION LOGIC ---
    useEffect(() => {
        const interval = setInterval(() => {
            const time = new Date().toLocaleTimeString();
            const actions = [
                "Gemini 2.0: Optimized Google Maps Keywords.",
                "DeepSeek R1: Analyzing competitor pricing strategy.",
                "Okfit: Synced 3 biometric entries.",
                "GymOwl: Sent 2 fee reminders via WhatsApp.",
                "Llama 3.2: Updated Aarav's leg day volume.",
                "Billing: Generated Invoice #INV-2024-89.",
                "Flux.1: Generating marketing poster for 'Summer Shred'.",
                "SVD-XT: Rendering cardio motion preview for 'Neon HIIT'.",
                "Qwen 2.5: Recalculating macros for diet plans."
            ];
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            setLogs(prev => [`[${time}] ${randomAction}`, ...prev].slice(0, 8));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleRunBot = async (botId: string) => {
        setProcessingBot(botId);
        // Simulate specific bot action
        setTimeout(async () => {
            let msg = "";
            if (botId.includes('gymowl')) {
                msg = "GymOwl: Batch processed 15 fee reminders. 100% Delivery.";
            } else if (botId.includes('okfit')) {
                msg = "Okfit: Biometric database synced with cloud. 2 devices updated.";
            } else if (botId.includes('google')) {
                msg = "Gemini: SEO Audit complete. Keywords injected into profile.";
            } else if (botId.includes('svd')) {
                msg = "SVD-XT: 1080p Motion Guide rendered for active session.";
            } else if (botId.includes('fitness')) {
                // Actual AI call simulation
                try {
                    const aiRes = await getComplexResponse("Generate a 1-line motivational quote for a gym app notification.");
                    msg = `FitnessAI Broadcast: "${aiRes}" sent to active members.`;
                } catch {
                    msg = "FitnessAI: Optimized 12 workout plans.";
                }
            } else if (botId.includes('market')) {
                msg = "DeepSeek R1: Detected competitor price drop. Suggesting 10% flash sale.";
            } else if (botId.includes('openpose')) {
                msg = "OpenPose: Calibrated camera feed for squat rack #2.";
            } else if (botId.includes('mistral')) {
                msg = "Mistral NeMo: Summarized 50 member feedback forms.";
            } else if (botId.includes('yolo')) {
                msg = "YOLOv9: Detected 'Dumbbell Rack' empty. Alert sent to housekeeping.";
            }
            setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
            setProcessingBot(null);
        }, 2000);
    };

    const handleDeployBot = (bot: MarketBot) => {
        setMarketBots(prev => prev.map(b => b.id === bot.id ? { ...b, isInstalled: true } : b));
        
        // Add to installed list
        const newBotConfig: BotConfig = {
            id: bot.id,
            name: bot.name,
            provider: bot.developer,
            description: bot.description,
            icon: bot.category === 'LLM' ? <BotIcon className="w-6 h-6"/> : 
                  bot.category === 'Vision' ? <VideoCameraIcon className="w-6 h-6"/> :
                  bot.category === 'Audio' ? <BellIcon className="w-6 h-6"/> : <SparkleIcon className="w-6 h-6"/>,
            status: 'Deploying',
            stats: [{ label: 'Uptime', value: '0%' }, { label: 'Requests', value: 0 }],
            color: 'text-white',
            category: bot.category === 'LLM' ? 'neural' : 
                      bot.category === 'Vision' ? 'experience' : 
                      bot.category === 'Audio' ? 'neural' : 'growth'
        };

        setInstalledBots(prev => [...prev, newBotConfig]);
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] KUBERNETES: Pulling image ${bot.id}:latest...`, ...prev]);

        setTimeout(() => {
            setInstalledBots(prev => prev.map(b => b.id === bot.id ? { ...b, status: 'Active', stats: [{ label: 'Uptime', value: '100%' }, { label: 'Requests', value: 0 }] } : b));
            setLogs(prev => [`[${new Date().toLocaleTimeString()}] KUBERNETES: Pod ${bot.id}-7f8c9d started successfully.`, ...prev]);
        }, 3000);
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
                        Royal Autopilot <span className="text-xs align-top ml-2 bg-amber-500 text-black px-2 py-0.5 rounded font-bold">LATEST AI CORE</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-2 max-w-xl">
                        Unified automation suite integrating <strong>Gemini 2.0</strong>, <strong>DeepSeek R1</strong>, <strong>Stable Video Diffusion</strong>, and <strong>Open Source</strong> protocols. 
                    </p>
                </div>
                <div className="relative z-10 flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-green-400 font-mono font-bold text-sm">SYSTEM OPTIMAL</span>
                    </div>
                    <p className="text-xs text-gray-500">Neural Sync: Active</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-4 border-b border-gray-700 pb-2 overflow-x-auto">
                <button onClick={() => setActiveTab('neural')} className={`pb-2 px-4 text-sm font-bold transition-colors whitespace-nowrap flex items-center ${activeTab === 'neural' ? 'border-b-2 border-amber-400 text-amber-400' : 'text-gray-400 hover:text-white'}`}>
                    <SparkleIcon className="w-4 h-4 mr-2" /> Autonomous Swarm (Gemini)
                </button>
                <button onClick={() => setActiveTab('ops')} className={`pb-2 px-4 text-sm font-bold transition-colors whitespace-nowrap flex items-center ${activeTab === 'ops' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400 hover:text-white'}`}>
                    <FingerPrintIcon className="w-4 h-4 mr-2" /> Operations (Okfit)
                </button>
                <button onClick={() => setActiveTab('growth')} className={`pb-2 px-4 text-sm font-bold transition-colors whitespace-nowrap flex items-center ${activeTab === 'growth' ? 'border-b-2 border-green-400 text-green-400' : 'text-gray-400 hover:text-white'}`}>
                    <TrendingUpIcon className="w-4 h-4 mr-2" /> Growth (GymOwl)
                </button>
                <button onClick={() => setActiveTab('experience')} className={`pb-2 px-4 text-sm font-bold transition-colors whitespace-nowrap flex items-center ${activeTab === 'experience' ? 'border-b-2 border-indigo-400 text-indigo-400' : 'text-gray-400 hover:text-white'}`}>
                    <DumbbellIcon className="w-4 h-4 mr-2" /> Experience (VideoAI)
                </button>
                <button onClick={() => setActiveTab('store')} className={`pb-2 px-4 text-sm font-bold transition-colors whitespace-nowrap flex items-center ${activeTab === 'store' ? 'border-b-2 border-purple-400 text-purple-400' : 'text-gray-400 hover:text-white'}`}>
                    <OpenSourceIcon className="w-4 h-4 mr-2" /> Bot Store (OSS)
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'store' ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center">
                            <CloudArrowUpIcon className="w-6 h-6 mr-2 text-purple-400" />
                            Open Source Model Hub (2025 Edition)
                        </h2>
                        <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded border border-purple-500/30">Community Edition</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {marketBots.map(bot => (
                            <Card key={bot.id} className="border border-gray-700 hover:border-purple-500 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-gray-800 rounded-lg">
                                        {bot.category === 'LLM' ? <BotIcon className="w-6 h-6 text-purple-400"/> :
                                         bot.category === 'Vision' ? <VideoCameraIcon className="w-6 h-6 text-blue-400"/> :
                                         <SparkleIcon className="w-6 h-6 text-green-400"/>}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] bg-gray-700 text-gray-300 px-2 py-1 rounded mb-1">{bot.category}</span>
                                        <div className="flex items-center text-[10px] text-amber-400">
                                            <StarIcon className="w-3 h-3 mr-1" /> {bot.rating}
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-white">{bot.name}</h3>
                                <p className="text-xs text-gray-500 mb-2">by {bot.developer}</p>
                                <p className="text-sm text-gray-400 mb-4 h-10 line-clamp-2">{bot.description}</p>
                                
                                <div className="flex items-center justify-between mt-auto">
                                    <span className="text-xs text-gray-500 flex items-center">
                                        <CloudArrowUpIcon className="w-3 h-3 mr-1" /> {bot.downloads}
                                    </span>
                                    <button 
                                        onClick={() => handleDeployBot(bot)}
                                        disabled={bot.isInstalled}
                                        className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${
                                            bot.isInstalled 
                                            ? 'bg-green-900/20 text-green-400 cursor-default border border-green-500/30' 
                                            : 'bg-purple-600 hover:bg-purple-500 text-white'
                                        }`}
                                    >
                                        {bot.isInstalled ? 'INSTALLED' : 'DEPLOY'}
                                    </button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ) : (
                /* Bots Grid for Active Tabs */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {installedBots.filter(b => b.category === activeTab).map((bot) => (
                        <Card key={bot.id} className="relative group hover:border-gray-500 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl bg-gray-800 border border-gray-700 ${bot.color} shadow-lg`}>
                                    {bot.icon}
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${
                                        bot.status === 'Active' ? 'bg-green-900/20 text-green-400 border-green-500/30' :
                                        bot.status === 'Processing' || bot.status === 'Deploying' ? 'bg-blue-900/20 text-blue-400 border-blue-500/30 animate-pulse' :
                                        'bg-gray-700 text-gray-400 border-gray-600'
                                    }`}>
                                        {processingBot === bot.id ? 'RUNNING...' : bot.status}
                                    </span>
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-bold text-white mb-1">{bot.name}</h3>
                            <p className="text-xs text-gray-500 mb-3 font-mono uppercase tracking-wide">Powered by {bot.provider}</p>
                            <p className="text-sm text-gray-300 mb-6 h-10 line-clamp-2">{bot.description}</p>

                            {/* Stats Row */}
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
                                disabled={processingBot === bot.id || bot.status === 'Deploying'}
                                className={`w-full py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center ${
                                    processingBot === bot.id ? 'bg-gray-700 text-gray-400' : 'bg-gray-700 hover:bg-gray-600 text-white'
                                }`}
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
                            <span className={log.includes('Gemini') ? 'text-amber-300' : log.includes('Llama') || log.includes('DeepSeek') || log.includes('SVD') ? 'text-purple-300' : log.includes('Okfit') ? 'text-cyan-300' : log.includes('GymOwl') ? 'text-green-300' : 'text-gray-300'}>
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
