
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
    
    // --- MARKETPLACE DATA ---
    const [marketBots, setMarketBots] = useState<MarketBot[]>([
        { id: 'llama3', name: 'Llama 3.1 (70B)', developer: 'Meta AI', description: 'State-of-the-art open source LLM for complex reasoning and chat.', category: 'LLM', downloads: '12M+', isInstalled: false, rating: 4.9 },
        { id: 'gemma2', name: 'Gemma 2 (27B)', developer: 'Google DeepMind', description: 'High-performance open model optimized for efficiency and reasoning.', category: 'LLM', downloads: '5M+', isInstalled: false, rating: 4.8 },
        { id: 'mistral', name: 'Mixtral 8x22B', developer: 'Mistral AI', description: 'High-efficiency mixture-of-experts model for fast gym operations.', category: 'LLM', downloads: '8M+', isInstalled: false, rating: 4.7 },
        { id: 'qwen', name: 'Qwen 2.5-Coder', developer: 'Alibaba Cloud', description: 'Specialized in generating workout scripts and automation code.', category: 'LLM', downloads: '3M+', isInstalled: false, rating: 4.6 },
        { id: 'sdxl', name: 'Stable Diffusion XL', developer: 'Stability AI', description: 'Generates high-quality marketing posters for gym events.', category: 'Vision', downloads: '25M+', isInstalled: false, rating: 4.8 },
        { id: 'yolo', name: 'YOLOv9', developer: 'OpenSource', description: 'Real-time object detection for equipment usage tracking.', category: 'Vision', downloads: '10M+', isInstalled: false, rating: 4.5 },
        { id: 'whisper', name: 'Whisper V3', developer: 'OpenAI (OSS)', description: 'Industry-leading speech recognition for voice commands.', category: 'Audio', downloads: '50M+', isInstalled: false, rating: 4.9 },
        { id: 'openpose', name: 'OpenPose', developer: 'CMU', description: 'Real-time multi-person keypoint detection for form analysis.', category: 'Vision', downloads: '5M+', isInstalled: false, rating: 4.4 },
        { id: 'rasa', name: 'Rasa Core', developer: 'Rasa', description: 'Open source conversational AI framework for member support.', category: 'Agent', downloads: '15M+', isInstalled: false, rating: 4.3 },
    ]);

    // --- INSTALLED BOTS CONFIGURATIONS ---
    const [installedBots, setInstalledBots] = useState<BotConfig[]>([
         {
            id: 'google_neural',
            name: 'Google Profile Mind',
            provider: 'Gemini 2.0 Autonomous',
            description: 'Continuously optimizes Maps ranking, SEO descriptions, and auto-responds to reviews.',
            icon: <SparkleIcon className="w-6 h-6" />,
            status: 'Processing',
            stats: [{ label: 'Optimization Score', value: '98/100' }, { label: 'Auto-Posts', value: '3/Week' }],
            color: 'text-amber-400',
            category: 'neural'
        },
        {
            id: 'market_watch',
            name: 'Market Watchdog',
            provider: 'Predictive Trends API',
            description: 'Scans local competitor reviews and pricing to suggest strategic adjustments.',
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
            provider: 'FitnessAI Engine',
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
                "Gemini 2.0: Auto-Replied to 5-star review.",
                "Okfit: Synced 3 biometric entries.",
                "GymOwl: Sent 2 fee reminders via WhatsApp.",
                "FitnessAI: Updated Aarav's leg day volume.",
                "Billing: Generated Invoice #INV-2024-89.",
                "Security: Gate 1 Locked (Member Expired).",
                "Llama 3: Analyzing customer sentiment..."
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
            } else if (botId.includes('fitness')) {
                // Actual AI call simulation
                try {
                    const aiRes = await getComplexResponse("Generate a 1-line motivational quote for a gym app notification.");
                    msg = `FitnessAI Broadcast: "${aiRes}" sent to active members.`;
                } catch {
                    msg = "FitnessAI: Optimized 12 workout plans.";
                }
            } else if (botId.includes('llama')) {
                msg = "Llama 3: Processed 500kb of local chat logs for sentiment analysis.";
            } else if (botId.includes('openpose')) {
                msg = "OpenPose: Calibrated camera feed for squat rack #2.";
            } else if (botId.includes('gemma')) {
                msg = "Gemma 2: Summarized 50 member feedback forms.";
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
                  bot.category === 'Vision' ? <OpenSourceIcon className="w-6 h-6"/> :
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
                        Unified automation suite integrating <strong>Gemini 2.0</strong>, <strong>Okfit</strong>, <strong>GymOwl</strong>, and <strong>Open Source</strong> protocols. 
                        Autonomous optimization for Google Business, Operations, and Revenue.
                    </p>
                </div>
                <div className="relative z-10 flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
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
                    <DumbbellIcon className="w-4 h-4 mr-2" /> Experience (FitnessAI)
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
                            Open Source Model Hub
                        </h2>
                        <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded border border-purple-500/30">Community Edition</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {marketBots.map(bot => (
                            <Card key={bot.id} className="border border-gray-700 hover:border-purple-500 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-gray-800 rounded-lg">
                                        {bot.category === 'LLM' ? <BotIcon className="w-6 h-6 text-purple-400"/> :
                                         bot.category === 'Vision' ? <OpenSourceIcon className="w-6 h-6 text-blue-400"/> :
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
                            <span className={log.includes('Gemini') ? 'text-amber-300' : log.includes('Llama') ? 'text-purple-300' : log.includes('Okfit') ? 'text-cyan-300' : log.includes('GymOwl') ? 'text-green-300' : 'text-gray-300'}>
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
