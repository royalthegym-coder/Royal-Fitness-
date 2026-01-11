
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
import { getComplexResponse } from '../../lib/gemini';

// --- TYPES ---
type BotStatus = 'Active' | 'Idle' | 'Processing' | 'Error';

interface BotConfig {
    id: string;
    name: string;
    provider: string; // e.g., "Okfit Architecture", "GymOwl Engine"
    description: string;
    icon: React.ReactNode;
    status: BotStatus;
    stats: { label: string; value: string | number }[];
    color: string;
}

const RoyalBotIntegrations: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'ops' | 'growth' | 'experience'>('ops');
    const [processingBot, setProcessingBot] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    // --- BOT CONFIGURATIONS ---
    const bots: Record<string, BotConfig[]> = {
        ops: [
            {
                id: 'okfit_bio',
                name: 'Bio-Access Control',
                provider: 'Okfit Biometrics Core',
                description: 'Real-time fingerprint/face recognition sync. Auto-blocks expired members at the turnstile.',
                icon: <FingerPrintIcon className="w-6 h-6" />,
                status: 'Active',
                stats: [{ label: 'Check-ins Today', value: 142 }, { label: 'Denied', value: 3 }],
                color: 'text-cyan-400'
            },
            {
                id: 'billing_auto',
                name: 'Auto-Billing & GST',
                provider: 'Okfit Finance Module',
                description: 'Generates GST invoices, tracks payments, and auto-renews subscriptions via UPI mandates.',
                icon: <DollarSignIcon className="w-6 h-6" />,
                status: 'Active',
                stats: [{ label: 'Pending Dues', value: '₹45k' }, { label: 'Auto-Renewed', value: 8 }],
                color: 'text-green-400'
            },
            {
                id: 'staff_ops',
                name: 'Staff Commander',
                provider: 'FitGym Rostering',
                description: 'Automated shift scheduling and biometric attendance tracking for trainers and housekeeping.',
                icon: <QrCodeIcon className="w-6 h-6" />,
                status: 'Idle',
                stats: [{ label: 'Staff Present', value: '5/8' }, { label: 'Payroll Est.', value: '₹1.2L' }],
                color: 'text-purple-400'
            }
        ],
        growth: [
            {
                id: 'gymowl_alerts',
                name: 'Smart Alert Hub',
                provider: 'GymOwl Notification Engine',
                description: 'Automated WhatsApp alerts for fees, birthdays, and "We Miss You" retention messages.',
                icon: <WhatsAppIcon className="w-6 h-6" />,
                status: 'Active',
                stats: [{ label: 'Msgs Sent', value: 1250 }, { label: 'Open Rate', value: '98%' }],
                color: 'text-green-500'
            },
            {
                id: 'retention_ai',
                name: 'Churn Predictor',
                provider: 'Gemini Predictive Analytics',
                description: 'Analyzes attendance patterns to predict cancellations before they happen.',
                icon: <TrendingUpIcon className="w-6 h-6" />,
                status: 'Processing',
                stats: [{ label: 'At-Risk', value: 12 }, { label: 'Saved', value: 4 }],
                color: 'text-red-400'
            }
        ],
        experience: [
            {
                id: 'fitness_ai',
                name: 'Hyper-Trainer',
                provider: 'FitnessAI Engine',
                description: 'Generates personalized daily workout plans based on previous log performance (Progressive Overload).',
                icon: <DumbbellIcon className="w-6 h-6" />,
                status: 'Active',
                stats: [{ label: 'Plans Generated', value: 45 }, { label: 'PRs Broken', value: 12 }],
                color: 'text-indigo-400'
            },
            {
                id: 'class_minder',
                name: 'Class Optimizer',
                provider: 'Virtuagym Logic',
                description: 'Auto-schedules classes based on demand and sends invites to interested members.',
                icon: <CalendarIcon className="w-6 h-6" />,
                status: 'Idle',
                stats: [{ label: 'Fill Rate', value: '85%' }, { label: 'Waitlist', value: 4 }],
                color: 'text-pink-400'
            }
        ]
    };

    // --- SIMULATION LOGIC ---
    useEffect(() => {
        const interval = setInterval(() => {
            const time = new Date().toLocaleTimeString();
            const actions = [
                "Okfit: Synced 3 biometric entries.",
                "GymOwl: Sent 2 fee reminders via WhatsApp.",
                "FitnessAI: Updated Aarav's leg day volume.",
                "Billing: Generated Invoice #INV-2024-89.",
                "Security: Gate 1 Locked (Member Expired)."
            ];
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            setLogs(prev => [`[${time}] ${randomAction}`, ...prev].slice(0, 8));
        }, 4000);
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
            } else if (botId.includes('fitness')) {
                // Actual AI call simulation
                try {
                    const aiRes = await getComplexResponse("Generate a 1-line motivational quote for a gym app notification.");
                    msg = `FitnessAI Broadcast: "${aiRes}" sent to active members.`;
                } catch {
                    msg = "FitnessAI: Optimized 12 workout plans.";
                }
            }
            setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
            setProcessingBot(null);
        }, 2000);
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
                        Royal Autopilot <span className="text-xs align-top ml-2 bg-amber-500 text-black px-2 py-0.5 rounded font-bold">2026 EDITION</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-2 max-w-xl">
                        Unified automation suite integrating <strong>Okfit</strong>, <strong>GymOwl</strong>, and <strong>FitnessAI</strong> protocols. 
                        Managing operations, revenue, and retention autonomously.
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
                    <p className="text-xs text-gray-500">Last Full Sync: Just now</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-4 border-b border-gray-700 pb-2 overflow-x-auto">
                <button onClick={() => setActiveTab('ops')} className={`pb-2 px-4 text-sm font-bold transition-colors whitespace-nowrap flex items-center ${activeTab === 'ops' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400 hover:text-white'}`}>
                    <FingerPrintIcon className="w-4 h-4 mr-2" /> Operations (Okfit)
                </button>
                <button onClick={() => setActiveTab('growth')} className={`pb-2 px-4 text-sm font-bold transition-colors whitespace-nowrap flex items-center ${activeTab === 'growth' ? 'border-b-2 border-green-400 text-green-400' : 'text-gray-400 hover:text-white'}`}>
                    <TrendingUpIcon className="w-4 h-4 mr-2" /> Growth (GymOwl)
                </button>
                <button onClick={() => setActiveTab('experience')} className={`pb-2 px-4 text-sm font-bold transition-colors whitespace-nowrap flex items-center ${activeTab === 'experience' ? 'border-b-2 border-indigo-400 text-indigo-400' : 'text-gray-400 hover:text-white'}`}>
                    <SparkleIcon className="w-4 h-4 mr-2" /> Experience (FitnessAI)
                </button>
            </div>

            {/* Bots Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {bots[activeTab].map((bot) => (
                    <Card key={bot.id} className="relative group hover:border-gray-500 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl bg-gray-800 border border-gray-700 ${bot.color} shadow-lg`}>
                                {bot.icon}
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${
                                    bot.status === 'Active' ? 'bg-green-900/20 text-green-400 border-green-500/30' :
                                    bot.status === 'Processing' ? 'bg-blue-900/20 text-blue-400 border-blue-500/30 animate-pulse' :
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
                            disabled={processingBot === bot.id}
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

            {/* Live Terminal */}
            <Card title="Live Automation Stream" className="bg-black/40 border-gray-700">
                <div className="font-mono text-xs space-y-2 h-40 overflow-y-auto custom-scrollbar">
                    {logs.map((log, i) => (
                        <div key={i} className="flex items-start text-gray-300 border-b border-gray-800/50 pb-1 last:border-0">
                            <span className="text-green-500 mr-2">➜</span>
                            <span className={log.includes('Okfit') ? 'text-cyan-300' : log.includes('GymOwl') ? 'text-green-300' : 'text-gray-300'}>
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
