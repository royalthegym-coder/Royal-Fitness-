import { getCurrencySymbol } from '../store/useCurrencyStore';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { View } from '../../types';
import { useData } from '../context/DataProvider';
import { 
    TrendingUp, Activity, Users, Wallet, Infinity, Cpu,
    ShieldCheck, Bot, UserPlus, FileText, Send, Database,
    Radio, BrainCircuit, GitMerge, Cloud, Terminal, Zap,
    ArrowUpRight, AlertTriangle, Layers, Globe, Eye,
    Bell, Siren, Search, CreditCard, ChevronRight,
    Workflow, Microscope, Calendar, Dumbbell, BarChart3,
    Camera
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { NotificationService } from '../../lib/notifications';
import BioMechanicalVoiceAgent from './BioMechanicalVoiceAgent';
import { useToast } from '../hooks/useToast';
import MemberCheckIn from './MemberCheckIn';
import AttendancePaymentAnalyticsSection from './AttendancePaymentAnalyticsSection';
import FeatureImage from './common/FeatureImage';
import { ADMIN_MATRIX_MEDIA } from '../data/featureMedia';

// --- SUB-COMPONENT: METRIC CARD ---
const MetricCard: React.FC<{ 
    title: string;
    value: string | number;
    subtext: string;
    icon: React.ReactNode;
    color: string; 
    onClick: () => void;
    index: number;
}> = ({ title, value, subtext, icon, color, onClick, index }) => (
    <motion.div 
        onClick={onClick} 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ scale: 1.02, translateY: -5 }}
        whileTap={{ scale: 0.98 }}
        className="relative overflow-hidden bg-zinc-950/75 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 cursor-pointer group hover:border-white/25 transition-all duration-500 hover:shadow-2xl"
    >
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`p-4 rounded-2xl bg-black/40 border border-white/10 ${color} shadow-lg backdrop-blur-md group-hover:scale-110 transition-transform duration-300`}>
                {icon}
            </div>
        </div>
        <div className="relative z-10">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">{title}</p>
            <h3 className="text-4xl font-black text-white italic tracking-tighter mb-2">{value}</h3>
            <p className="text-xs font-mono text-gray-400">{subtext}</p>
        </div>
    </motion.div>
);

// --- SUB-COMPONENT: BUILD HEALTH SUMMARY CARD ---
const BuildHealthSummaryCard: React.FC<{ setCurrentView: (view: View) => void }> = ({ setCurrentView }) => {
    const [uptime, setUptime] = React.useState('99.98%');
    const [incidents, setIncidents] = React.useState(0);
    const [status, setStatus] = React.useState('Nominal');
    const [activePipeline, setActivePipeline] = React.useState('None');

    React.useEffect(() => {
        const checkHealth = () => {
            const storedUptime = localStorage.getItem('build_health_uptime') || '99.98%';
            const storedIncidents = parseInt(localStorage.getItem('build_health_incidents') || '0', 10);
            const storedStatus = localStorage.getItem('build_health_status') || 'Nominal';
            const storedPipeline = localStorage.getItem('build_health_active_pipeline') || 'None';

            setUptime(storedUptime);
            setIncidents(storedIncidents);
            setStatus(storedStatus);
            setActivePipeline(storedPipeline);
        };

        checkHealth();
        window.addEventListener('storage', checkHealth);
        const interval = setInterval(checkHealth, 10000);
        return () => {
            window.removeEventListener('storage', checkHealth);
            clearInterval(interval);
        };
    }, []);

    const getStatusColor = () => {
        switch (status.toLowerCase()) {
            case 'building':
            case 'running':
            case 'deploying':
                return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
            case 'failed':
            case 'error':
                return 'text-red-400 border-red-500/30 bg-red-500/10';
            case 'auto-healed':
            case 'repaired':
                return 'text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-500/10';
            default:
                return 'text-green-400 border-green-500/30 bg-green-500/10';
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-950/75 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-500"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent opacity-30"></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        <Activity className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">CI/CD Build & Deployment Health</h3>
                            <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full border ${getStatusColor()} flex items-center gap-1.5`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping"></span>
                                {status}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 font-mono">
                            {activePipeline !== 'None' ? `Currently running: ${activePipeline}` : 'All core delivery nodes are performing within operational limits.'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-8 border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-8">
                    <div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Uptime</span>
                        <strong className="text-2xl font-black text-white font-mono">{uptime}</strong>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Recent Incidents</span>
                        <strong className={`text-2xl font-black font-mono ${incidents > 0 ? 'text-fuchsia-400' : 'text-white'}`}>
                            {incidents} {incidents === 1 && status.toLowerCase() === 'auto-healed' ? '(Auto-Healed)' : ''}
                        </strong>
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex items-center justify-end lg:pl-4 gap-2">
                        <button 
                            onClick={() => setCurrentView('brandedApp')}
                            className="w-full sm:w-auto px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-emerald-500 hover:text-black hover:border-emerald-400 transition-all duration-300 flex items-center justify-center gap-1.5 group/btn cursor-pointer"
                        >
                            <span>Build Health</span>
                            <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </button>
                        <button 
                            onClick={() => setCurrentView('launchCommandCenter')}
                            className="w-full sm:w-auto px-4 py-3 bg-white/5 border border-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-cyan-500 hover:text-black hover:border-cyan-400 transition-all duration-300 flex items-center justify-center gap-1.5 group/btn cursor-pointer"
                        >
                            <span>Deploy</span>
                            <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const Dashboard: React.FC<{ setCurrentView: (view: View) => void; currentUser?: any }> = ({ setCurrentView, currentUser }) => {
    const { members, invoices, leads, auditLogs, systemHealth, activeMemberCount, totalRevenue, staff, osSubscription, attendanceRecords } = useData();
    const { addToast } = useToast();
    const [showQRCheckIn, setShowQRCheckIn] = React.useState<boolean>(false);
    
    // Derived Stats
    const totalMembers = members.length;
    const pendingDues = invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').reduce((acc, i) => acc + i.amount, 0);
    const conversionRate = leads.length > 0 ? ((leads.filter(l => l.status === 'Converted').length / leads.length) * 100).toFixed(1) : '0.0';

    const trainers = staff.filter(s => s.role.toLowerCase().includes('trainer') || s.role.toLowerCase().includes('coach'));

    // Analytics Data (Last 7 Days)
    const analyticsData = useMemo(() => {
        const dataMap = new Map();
        
        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dataMap.set(dateStr, { name: displayDate, revenue: 0, members: 0 });
        }

        // Calculate Revenue from Invoices
        invoices.forEach(inv => {
            if (inv.status === 'Paid' && inv.date) {
                try {
                    const dateStr = new Date(inv.date).toISOString().split('T')[0];
                    if (dataMap.has(dateStr)) {
                        const entry = dataMap.get(dateStr);
                        entry.revenue += inv.amount;
                    }
                } catch (e) {
                    console.error("Invalid invoice date", inv.date);
                }
            }
        });

        // Calculate Attendance from AttendanceRecords
        (attendanceRecords || []).forEach(rec => {
            if (rec.status === 'Present' && rec.date) {
                try {
                    const dateStr = new Date(rec.date).toISOString().split('T')[0];
                    if (dataMap.has(dateStr)) {
                        const entry = dataMap.get(dateStr);
                        entry.members += 1;
                    }
                } catch (e) {
                    console.error("Invalid attendance date", rec.date);
                }
            }
        });

        return Array.from(dataMap.values());
    }, [invoices, attendanceRecords]);

    // Schedule Data
    const todaySchedule = [
        { time: '06:00 AM', class: 'HIIT Blast', trainer: trainers[0]?.name || 'John Doe', capacity: '15/20' },
        { time: '08:00 AM', class: 'Yoga Flow', trainer: trainers[1]?.name || 'Jane Smith', capacity: '12/15' },
        { time: '05:00 PM', class: 'Strength & Conditioning', trainer: trainers[0]?.name || 'John Doe', capacity: '18/20' },
        { time: '07:00 PM', class: 'Zumba', trainer: trainers[2]?.name || 'Alice Johnson', capacity: '25/30' },
    ];

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            
            {/* 1. MIRROR DECK HEADER */}
            <div className="bg-black/65 backdrop-blur-2xl p-10 rounded-[3.5rem] border border-cyan-500/30 relative overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-3">
                        <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                            <Infinity className="w-3 h-3" /> {osSubscription.tier === 'Basic' ? 'Basic OS' : osSubscription.tier === 'Premium' ? 'Premium OS' : 'Admin Console'}
                        </div>
                        {osSubscription.tier !== 'Basic' && (
                            <div className="px-4 py-1.5 bg-fuchsia-500/20 border border-fuchsia-500/50 text-fuchsia-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(217,70,239,0.3)] flex items-center gap-2">
                                <Globe className="w-3 h-3 animate-pulse" /> Language Mode Active (English Only)
                            </div>
                        )}
                        {osSubscription.tier === 'Elite' && (
                            <div className="px-4 py-1.5 bg-green-500/20 border border-green-500/50 text-green-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(34,197,94,0.3)] flex items-center gap-2">
                                <Workflow className="w-3 h-3 animate-spin-slow" /> Helper Assistant: Active
                            </div>
                        )}
                        <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase ml-auto">SYSTEM ONLINE</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none mb-4">
                        {osSubscription.tier === 'Basic' ? 'Gym ' : osSubscription.tier === 'Premium' ? 'Smart ' : 'Elite Gym '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                            {osSubscription.tier === 'Basic' ? 'Manager' : osSubscription.tier === 'Premium' ? 'Console' : 'Manager'}
                        </span>
                    </h1>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-1 mt-4">
                        <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] animate-pulse">
                            {osSubscription.tier === 'Basic' ? 'Standard Core Gym Management Infrastructure' : 'Complete Gym Membership and Fee Management'}
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={() => setShowQRCheckIn(prev => !prev)}
                                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black text-xs font-black uppercase tracking-widest shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
                            >
                                <Camera className="w-4 h-4" />
                                {showQRCheckIn ? 'Hide Member QR Check-In' : 'Member QR Check-In'}
                            </button>
                            {currentUser?.type === 'super_admin' && (
                                <button
                                    onClick={() => setCurrentView('superAdmin')}
                                    className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-purple-500 hover:from-amber-400 hover:to-purple-400 text-black text-xs font-black uppercase tracking-widest shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    Owner Master Console
                                </button>
                            )}
                            <button
                                onClick={() => setCurrentView('adminPortal')}
                                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black text-xs font-black uppercase tracking-widest shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Open Admin Portal (Member Lock &amp; Renewal)
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <BuildHealthSummaryCard setCurrentView={setCurrentView} />

            {/* 2. GLOBAL PULSE GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <MetricCard 
                    title="Total Members"
                    value={activeMemberCount}
                    subtext={`Total: ${totalMembers}`}
                    icon={<Users className="w-6 h-6" />}
                    color="text-cyan-400"
                    onClick={() => setCurrentView('members')}
                    index={0}
                />
                <MetricCard 
                    title="Total Collection"
                    value={`${getCurrencySymbol()}${(totalRevenue/1000).toFixed(1)}k`}
                    subtext={`Pending: ${getCurrencySymbol()}${(pendingDues/1000).toFixed(1)}k`}
                    icon={<Wallet className="w-6 h-6" />}
                    color="text-amber-400"
                    onClick={() => setCurrentView('billing')}
                    index={1}
                />
                <MetricCard 
                    title="New Admissions"
                    value={`${conversionRate}%`}
                    subtext={`${leads.length} Prospects`}
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="text-purple-400"
                    onClick={() => setCurrentView('leads')}
                    index={2}
                />
                <MetricCard 
                    title="Database Connection"
                    value={`${systemHealth}%`}
                    subtext="Verified"
                    icon={<ShieldCheck className="w-6 h-6" />}
                    color="text-green-400"
                    onClick={() => setCurrentView('security')}
                    index={3}
                />
            </div>

            {/* LIVE MEMBER QR CHECK-IN (REACT-WEBCAM + JSQR + WHATSAPP WORKFLOW) */}
            {showQRCheckIn && (
                <MemberCheckIn embedded={true} />
            )}

            {/* RECHARTS ATTENDANCE PATTERNS, PAYMENT TRENDS & HOURLY CHECK-IN HEATMAP */}
            <AttendancePaymentAnalyticsSection onOpenQRCheckIn={() => setShowQRCheckIn(true)} />

            {/* INTEGRATED SMARTCORE AI MOLECULAR AUTO-LOBBY */}
            <div className="bg-gradient-to-br from-[#050510] via-black to-[#090212] p-8 rounded-[3.5rem] border border-fuchsia-500/20 relative overflow-hidden shadow-[0_0_60px_rgba(217,70,239,0.15)]">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-cyan-600/10 rounded-[4rem] blur-[100px] rotate-45"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/5 pb-6">
                    <div>
                        <div className="flex items-center gap-2.5 mb-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 animate-ping"></span>
                            <span className="text-[10px] font-black uppercase text-fuchsia-400 tracking-[0.3em]">Scientific Unification Layer</span>
                        </div>
                        <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">
                            Fitness Future <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400">Integrated Operations Hub</span>
                        </h2>
                        <p className="text-xs text-gray-400 mt-1">Automated workflows, scientific diagnostic models, real-time IoT relays, and feedback loops unified into a single club system.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-black/60 border border-white/10 px-4 py-3 rounded-2xl whitespace-nowrap">
                        <Cpu className="w-5 h-5 text-cyan-400 animate-spin-slow" />
                        <div className="text-left font-mono">
                            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Global Automation Load</div>
                            <div className="text-xs font-black text-white">98.42% Synergy Rate</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                    {[
                        {
                            id: 'futureOvermind',
                            title: 'Primary Operations Link',
                            description: 'Central club telemetry correlating real-time biometric and attendance metrics.',
                            icon: <BrainCircuit className="w-5 h-5 text-indigo-400" />,
                            badge: 'Core Telemetry',
                            badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        },
                        {
                            id: 'agenticBots',
                            title: 'Automated Task Managers',
                            description: 'Automated workflow system dispatching retention reminders, billing alerts, and updates.',
                            icon: <Zap className="w-5 h-5 text-fuchsia-400" />,
                            badge: 'Active Workflows',
                            badgeColor: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20'
                        },
                        {
                            id: 'geniusEngine',
                            title: 'Smart Analytics Core',
                            description: 'Advanced predictive wellness analytics and club performance modeling.',
                            icon: <Cpu className="w-5 h-5 text-emerald-400" />,
                            badge: 'Analytics Engine',
                            badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        },
                        {
                            id: 'realTimeFormAnalyzer',
                            title: 'Posture CCTV Audit',
                            description: 'Integrated optical coordinate tracker conducting real-time safety diagnostic audits.',
                            icon: <Camera className="w-5 h-5 text-amber-400" />,
                            badge: 'Optical Studio',
                            badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        },
                        {
                            id: 'advancedDNA',
                            title: 'Genomic DNA Profiler',
                            description: 'Scientific mapping of genetic sequences and athletic recovery profiles.',
                            icon: <Microscope className="w-5 h-5 text-cyan-400 animate-pulse" />,
                            badge: 'Molecular Biotech',
                            badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                        },
                        {
                            id: 'aiBioAnalyst',
                            title: 'Bio-Analyst Panel',
                            description: 'Generates biometric wellness reviews based on wearable health and heart-rate data.',
                            icon: <Activity className="w-5 h-5 text-rose-400" />,
                            badge: 'Clinical Insights',
                            badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        },
                        {
                            id: 'cityHealthMap',
                            title: 'City Heatmap Portal',
                            description: 'Deep spatial location analyzer and population health density projections.',
                            icon: <Globe className="w-5 h-5 text-blue-400" />,
                            badge: 'Spatial GIS Node',
                            badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        },
                        {
                            id: 'synapseIoT',
                            title: 'Synapse IoT Gateway',
                            description: 'Live hardware tracking of NFC entries, gym turnstiles, and wearable sync buffers.',
                            icon: <Radio className="w-5 h-5 text-yellow-400" />,
                            badge: 'Sensory Router',
                            badgeColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }
                    ].map((agent, index) => (
                        <motion.div
                            key={index}
                            onClick={() => setCurrentView(agent.id as View)}
                            whileHover={{ scale: 1.02, y: -4, borderColor: 'rgba(217,70,239,0.4)', backgroundColor: 'rgba(255,255,255,0.03)' }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-black/40 border border-white/5 rounded-3xl p-5 hover:shadow-2xl transition-all duration-300 cursor-pointer text-left flex flex-col justify-between group h-52 relative overflow-hidden"
                        >
                            <div className="absolute top-1/2 right-1/2 w-32 h-32 bg-inherit rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 border border-t-fuchsia-500/10 border-r-cyan-500/10 animate-spin-slow animate-[spin_8s_linear_infinite]"></div>
                            
                            <div className="space-y-4 relative z-101">
                                <div className="flex items-center justify-between">
                                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                                        {agent.icon}
                                    </div>
                                    <span className={`text-[8.5px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${agent.badgeColor}`}>
                                        {agent.badge}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black text-white group-hover:text-fuchsia-300 transition-colors uppercase italic tracking-wide">{agent.title}</h4>
                                    <p className="text-[10px] text-gray-500 leading-relaxed font-sans">{agent.description}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 text-[9px] font-black text-fuchsia-400 uppercase tracking-widest pt-2 mt-auto border-t border-white/5 relative z-10 opacity-65 group-hover:opacity-100 group-hover:text-cyan-400 transition-all">
                                <span>Initialize Engine</span>
                                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* 3. COMPREHENSIVE ADMIN SECTIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT COLUMN: Analytics & Schedules */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Analytics Chart */}
                    <div className="bg-zinc-950 border border-white/5 p-8 rounded-[3.5rem] shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <BarChart3 className="w-6 h-6 text-cyan-400" />
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">7-Day Income & Attendance Trends</h3>
                            </div>
                            <select className="bg-black/40 border border-white/10 text-xs text-gray-400 rounded-xl px-4 py-2 outline-none">
                                <option>Last 7 Days</option>
                            </select>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analyticsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#d946ef" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#d946ef" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="name" stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff10', borderRadius: '1rem' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                    <Area type="monotone" dataKey="members" stroke="#d946ef" strokeWidth={3} fillOpacity={1} fill="url(#colorMembers)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Today's Schedule */}
                    <div className="bg-zinc-950 border border-white/5 p-8 rounded-[3.5rem] shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-6 h-6 text-amber-400" />
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Today's Fitness Classes</h3>
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => {
                                        members.forEach(m => NotificationService.sendNewClassAnnouncement(m.id.toString(), "HIIT Blast", "Join us for a high-intensity session at 06:00 AM!"));
                                        addToast("Announcements dispatched to all members.", "success");
                                    }}
                                    className="bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black px-4 py-2 rounded-xl uppercase tracking-[0.2em] text-[10px] shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:from-amber-400 hover:to-orange-500 transition-all active:scale-95 flex items-center gap-2 border border-amber-400/50 border-dashed relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                    <Send className="w-3 h-3 relative z-10" /> <span className="relative z-10">Notify All</span>
                                </button>
                                <button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black px-4 py-2 rounded-xl uppercase tracking-[0.2em] text-[10px] shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:from-cyan-400 hover:to-blue-500 transition-all active:scale-95 border border-cyan-400/50 border-dashed relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                    <span className="relative z-10">View All</span>
                                </button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {todaySchedule.map((session, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg text-xs font-mono font-bold">
                                            {session.time}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{session.class}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{session.trainer}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-300">{session.capacity}</p>
                                        <p className="text-[9px] text-gray-600 uppercase tracking-widest">Booked</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN: Trainers & Feed */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* Active Trainers */}
                    <div className="bg-zinc-950 border border-white/5 p-8 rounded-[3.5rem] shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <Dumbbell className="w-6 h-6 text-fuchsia-400" />
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Available Gym Coaches</h3>
                            </div>
                            <button onClick={() => setCurrentView('staff')} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black px-4 py-2 rounded-xl uppercase tracking-[0.2em] text-[10px] shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:from-cyan-400 hover:to-blue-500 transition-all active:scale-95 border border-cyan-400/50 border-dashed relative overflow-hidden group">
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                <span className="relative z-10">Manage</span>
                            </button>
                        </div>
                        <div className="space-y-4">
                            {trainers.length > 0 ? trainers.map(trainer => (
                                <div key={trainer.id} className="flex items-center gap-4 p-3 bg-black/40 border border-white/5 rounded-2xl">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg">
                                        {trainer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{trainer.name}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{trainer.role}</p>
                                    </div>
                                    <div className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                </div>
                            )) : (
                                <p className="text-xs text-gray-500 italic text-center py-4">No active trainers found.</p>
                            )}
                        </div>
                    </div>

                    {/* Predictive Churn Risk */}
                    <div className="bg-zinc-950 border border-white/5 p-8 rounded-[3.5rem] shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Inactive Members Warning</h3>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {members.filter(m => m.status !== 'Active').slice(0, 3).length > 0 ? (
                                members.filter(m => m.status !== 'Active').slice(0, 3).map(member => (
                                    <div key={member.id} className="flex items-center justify-between p-4 bg-black/40 border border-red-500/20 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold shadow-lg">
                                                {(member.name || 'M').slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{member.name}</p>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Status: {member.status}</p>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-black uppercase tracking-widest">
                                            Action Needed
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-500 italic text-center py-6">
                                    All registered members are currently active. No churn risks detected.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Fitness Future-CORTEX FEED (Mini) */}
                    <div className="bg-zinc-950 border border-white/5 h-[400px] p-0 overflow-hidden flex flex-col rounded-[3.5rem] shadow-2xl">
                         <div className="p-6 border-b border-white/5 bg-gray-900/50 flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                 <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Live System Events</span>
                             </div>
                             <button 
                                 onClick={() => {
                                     members.forEach(m => NotificationService.notifyGymUpdate(m.id.toString(), "System Maintenance: The gym will be closed for maintenance tomorrow from 2 AM to 4 AM."));
                                     addToast("Gym update sent to all members.", "success");
                                 }}
                                 className="bg-gradient-to-r from-red-500 to-rose-600 text-black font-black px-4 py-2 rounded-xl uppercase tracking-[0.2em] text-[10px] shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:from-red-400 hover:to-rose-500 transition-all active:scale-95 flex items-center gap-2 border border-red-400/50 border-dashed relative overflow-hidden group"
                             >
                                 <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                 <AlertTriangle className="w-3 h-3 relative z-10" /> <span className="relative z-10">Broadcast Update</span>
                             </button>
                         </div>
                         
                         <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/40">
                             {auditLogs.slice(0, 8).map((log, i) => (
                                 <motion.div 
                                     key={i} 
                                     initial={{ opacity: 0, x: -20 }}
                                     animate={{ opacity: 1, x: 0 }}
                                     transition={{ duration: 0.4, delay: i * 0.05 }}
                                     className="flex gap-4 group"
                                 >
                                     <div className="flex flex-col items-center">
                                         <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_cyan]"></div>
                                         <div className="w-px h-full bg-white/5 my-1 group-last:hidden"></div>
                                     </div>
                                     <div>
                                         <p className="text-[9px] font-mono text-gray-600 mb-1 flex items-center gap-2">
                                             {new Date(log.timestamp).toLocaleTimeString()} 
                                         </p>
                                         <p className="text-xs text-gray-300 font-medium leading-relaxed">{log.details}</p>
                                     </div>
                                 </motion.div>
                             ))}
                             {auditLogs.length === 0 && (
                                 <div className="h-full flex flex-col items-center justify-center opacity-30">
                                     <Bot className="w-12 h-12 mb-4 text-gray-600" />
                                     <p className="text-[10px] font-black uppercase tracking-widest">Feed Silent</p>
                                 </div>
                             )}
                         </div>
                    </div>

                    {/* NEURAL SHORTCUTS */}
                    <div className="bg-zinc-950 border border-white/5 p-6 rounded-[3.5rem]">
                        <div className="space-y-3">
                            <button onClick={() => setCurrentView('members')} className="w-full p-4 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 hover:from-cyan-800/60 hover:to-blue-800/60 rounded-2xl border border-dashed border-cyan-500/30 hover:border-cyan-400/60 flex items-center justify-between group transition-all shadow-[0_0_20px_rgba(6,182,212,0.1)] backdrop-blur-sm relative overflow-hidden">
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="p-3 bg-cyan-900/40 rounded-xl text-cyan-400 border border-cyan-500/30 shadow-[inset_0_0_10px_rgba(6,182,212,0.2)]"><UserPlus className="w-5 h-5"/></div>
                                    <p className="text-xs font-black text-cyan-100 uppercase tracking-[0.2em]">Initialize Member</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-cyan-600 group-hover:text-cyan-300 transition-colors relative z-10" />
                            </button>

                            <button onClick={() => setCurrentView('billing')} className="w-full p-4 bg-gradient-to-r from-amber-900/40 to-orange-900/40 hover:from-amber-800/60 hover:to-orange-800/60 rounded-2xl border border-dashed border-amber-500/30 hover:border-amber-400/60 flex items-center justify-between group transition-all shadow-[0_0_20px_rgba(245,158,11,0.1)] backdrop-blur-sm relative overflow-hidden">
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="p-3 bg-amber-900/40 rounded-xl text-amber-400 border border-amber-500/30 shadow-[inset_0_0_10px_rgba(245,158,11,0.2)]"><CreditCard className="w-5 h-5"/></div>
                                    <p className="text-xs font-black text-amber-100 uppercase tracking-[0.2em]">New Transaction</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-amber-600 group-hover:text-amber-300 transition-colors relative z-10" />
                            </button>
                        </div>
                    </div>

                    <div className="mt-6">
                        <BioMechanicalVoiceAgent />
                    </div>

                </div>
            </div>

            {/* ADMIN PORTAL CATEGORIZED ALL-FEATURES & BOARDS COMMAND MATRIX */}
            <div className="bg-zinc-950 border border-white/10 rounded-[3rem] p-8 space-y-6 shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                        <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em]">
                            Admin Portal • Categorized Super-App Suite
                        </span>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tight mt-2">
                            All Admin Modules, AI Engines, Boards & Smart Tools
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                            Complete category-wise access to every administrative, clinical, financial, IoT, and AI feature in your gym portal.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setCurrentView('memberPortal')}
                            className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black border border-cyan-500/40 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                        >
                            Preview Member Portal
                        </button>
                        <button
                            onClick={() => setCurrentView('bioscienceHub')}
                            className="px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-black border border-purple-500/40 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                        >
                            Bioscience 3D Hub
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[
                        {
                            title: '1. Operations, Staff & Attendance',
                            badge: 'Core Ops',
                            links: [
                                { id: 'staff', label: 'Staff & Coach Directory' },
                                { id: 'adminScheduler', label: 'Staff Shift Planner' },
                                { id: 'adminAttendance', label: 'Biometric Attendance Desk' },
                                { id: 'qrScanner', label: 'Camera QR Scanner' },
                                { id: 'tasks', label: 'Admin Task Board' },
                                { id: 'storkTeam', label: 'Stork Team Collaboration' },
                                { id: 'trainerClientLogger', label: 'Trainer Client Logger' },
                            ],
                        },
                        {
                            title: '2. Member & Lead CRM Suite',
                            badge: 'Growth & Intake',
                            links: [
                                { id: 'members', label: 'Master Member Database' },
                                { id: 'leads', label: 'Leads & Funnel Manager' },
                                { id: 'fitnessFutureCRM', label: 'Advanced AI CRM' },
                                { id: 'crm', label: 'Member Engagement CRM' },
                                { id: 'memberRegistrationForm', label: 'Basic Member Registration' },
                                { id: 'scientificAdmissionForm', label: 'Scientific Bio-Admission' },
                                { id: 'quantumAdmissionForm', label: 'Quantum Biometric Admission' },
                            ],
                        },
                        {
                            title: '3. Fitness, Workout & AI CCTV',
                            badge: 'Training Lab',
                            links: [
                                { id: 'workouts', label: 'Master Workout Planner' },
                                { id: 'classManager', label: 'Group Class Scheduler' },
                                { id: 'classBooking', label: 'Interactive Class Booking' },
                                { id: 'fitnessFutureTraining', label: 'Quantum Training Core' },
                                { id: 'fitnessFutureProgress', label: 'Member Progress Tracker' },
                                { id: 'workoutAnalytics', label: 'Workout Analytics Board' },
                                { id: 'aiHiitCoach', label: 'Dynamic AI HIIT Coach' },
                                { id: 'realTimeFormAnalyzer', label: 'AI CCTV Form Audits' },
                            ],
                        },
                        {
                            title: '4. Diet, Medical & Genomic Station',
                            badge: 'Clinical AI',
                            links: [
                                { id: 'diet', label: 'Master Diet Matrix' },
                                { id: 'nutritionTracker', label: 'Nutrition Macro Tracker' },
                                { id: 'healthEngine', label: 'Health Engine Core' },
                                { id: 'medicalProfiling', label: 'Clinical Health Profile Lab' },
                                { id: 'injuryOracle', label: 'Gym Injury Risk Oracle' },
                                { id: 'aiBioAnalyst', label: 'AI Bio-Analyst Panel' },
                                { id: 'aetherMed', label: 'CloudMed Tele-Health' },
                                { id: 'advancedDNA', label: 'Genomic DNA Profiler' },
                            ],
                        },
                        {
                            title: '5. Billing, POS, EMI & FinTech',
                            badge: 'Commerce',
                            links: [
                                { id: 'billing', label: 'Master Billing Gateway' },
                                { id: 'paymentDashboard', label: 'Payment Analytics Board' },
                                { id: 'packages', label: 'Membership Packages' },
                                { id: 'emiPlans', label: 'Member EMI Tracking' },
                                { id: 'fitnessFuturePOS', label: 'Gym POS Station' },
                                { id: 'fitnessFutureLedger', label: 'Full Financial Ledger' },
                                { id: 'inventoryPortal', label: 'Store & Stock Management' },
                                { id: 'revenueOracle', label: 'AI Revenue Oracle' },
                            ],
                        },
                        {
                            title: '6. AI Agents, IoT, 3D Twin & Security',
                            badge: 'Autonomous OS',
                            links: [
                                { id: 'fitnessFutureCommandHub', label: 'Fitness Future Command Hub' },
                                { id: 'aiAgentHub', label: 'AI Agent & Bot Hub' },
                                { id: 'synapseIoT', label: 'Synapse IoT Equipment Hub' },
                                { id: 'digitalTwin', label: '3D Facility Digital Twin' },
                                { id: 'biometricTurnstile', label: 'Biometric Gate Turnstile' },
                                { id: 'whatsapp', label: 'WhatsApp Business API' },
                                { id: 'brandedApp', label: 'Brand App & Pipeline Monitor' },
                                { id: 'security', label: 'Zero-Trust Security Layer' },
                            ],
                        },
                    ].map((group, gIdx) => (
                        <div key={gIdx} className="bg-black/60 border border-white/10 rounded-3xl overflow-hidden flex flex-col group/card">
                            <FeatureImage
                                src={ADMIN_MATRIX_MEDIA[gIdx % ADMIN_MATRIX_MEDIA.length]}
                                alt={`${group.title} interface preview`}
                                aspectClassName="aspect-[16/9]"
                                className="group-hover/card:scale-[1.03]"
                                fallbackTitle={group.title}
                            >
                                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-mono text-cyan-300">{group.badge}</span>
                                    <span className="text-[11px] font-mono text-slate-300 tabular-nums">{group.links.length} Modules</span>
                                </div>
                            </FeatureImage>
                            <div className="p-6 space-y-4 flex-1">
                                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                    <h4 className="text-sm font-black text-white uppercase tracking-wider">{group.title}</h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {group.links.map(link => (
                                        <button
                                            key={link.id}
                                            onClick={() => setCurrentView(link.id as View)}
                                            className="text-left px-3 py-2.5 rounded-xl bg-zinc-900/80 hover:bg-cyan-500/15 border border-white/5 hover:border-cyan-500/40 text-[11px] font-bold text-gray-300 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                                        >
                                            <span className="truncate pr-1">{link.label}</span>
                                            <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-cyan-400 shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

