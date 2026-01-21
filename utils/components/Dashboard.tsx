
import React, { useState, useMemo, useEffect } from 'react';
import Card from './common/Card';
import { MembersIcon } from './icons/NavIcons';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { View } from '../../types';
import { CalendarIcon } from './icons/CalendarIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import LiveActivity from './LiveActivity';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import CustomTooltip from './common/CustomTooltip';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { Member } from '../../types';
import { sendWhatsAppMessage } from '../../lib/whatsapp';
import { BotIcon } from './icons/BotIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import CardioThemes from './CardioThemes';
import { ControlIcon } from './icons/ControlIcon';
import { useToast } from '../hooks/useToast';
import { useData } from '../context/DataProvider'; // Import Context

interface DashboardProps {
    setCurrentView: (view: View) => void;
}

// ... (Keep existing Type interfaces: ErrorEvent, AutoFixEvent, HeatmapCell) ...
interface ErrorEvent {
    id: number;
    message: string;
    source: string;
    timestamp: string;
    severity: 'critical' | 'high' | 'medium';
}

interface AutoFixEvent {
    id: number;
    action: string;
    target: string;
    timestamp: string;
    status: 'executed' | 'pending_approval' | 'rolled_back';
}

interface HeatmapCell {
    id: number;
    load: number;
    status: 'healthy' | 'warning' | 'critical';
}

// Helper kept same
const getExpiryDate = (joinDateStr: string, packageId: number, packages: any[]): Date | null => {
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return null;

    const joinDate = new Date(joinDateStr);
    let monthsToAdd = 0;
    const durationParts = pkg.duration.split(' ');
    
    if (durationParts[0].toLowerCase() === 'first') {
        monthsToAdd = 1;
    } else {
        monthsToAdd = parseInt(durationParts[0], 10);
    }

    if (isNaN(monthsToAdd)) return null;

    joinDate.setMonth(joinDate.getMonth() + monthsToAdd);
    return joinDate;
};

// StatCard & CircularProgress kept same
const StatCard: React.FC<{ 
    icon: React.ReactNode; 
    title: string; 
    value: string; 
    trend?: string; 
    trendDirection?: 'up' | 'down'; 
    action?: () => void 
}> = ({ icon, title, value, trend, trendDirection, action }) => (
    <Card onClick={action} className="p-0">
        <div className="p-6">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</h3>
                </div>
                <div className={`p-3 rounded-lg ${action ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    {icon}
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <span className={`flex items-center font-medium ${trendDirection === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                        {trendDirection === 'up' ? <TrendingUpIcon className="w-4 h-4 mr-1" /> : <TrendingUpIcon className="w-4 h-4 mr-1 transform rotate-180" />}
                        {trend}
                    </span>
                    <span className="text-gray-400 ml-2">vs last month</span>
                </div>
            )}
        </div>
    </Card>
);

const CircularProgress: React.FC<{ percentage: number }> = ({ percentage }) => {
    const sqSize = 120;
    const strokeWidth = 8;
    const radius = (sqSize - strokeWidth) / 2;
    const viewBox = `0 0 ${sqSize} ${sqSize}`;
    const dashArray = radius * Math.PI * 2;
    const dashOffset = dashArray - (dashArray * percentage) / 100;

    return (
        <svg width={sqSize} height={sqSize} viewBox={viewBox} className="transform -rotate-90">
            <circle
                className="stroke-current text-gray-200 dark:text-gray-700"
                cx={sqSize / 2}
                cy={sqSize / 2}
                r={radius}
                strokeWidth={`${strokeWidth}px`}
                fill="none"
            />
            <circle
                className="stroke-current text-amber-500 transition-all duration-1000 ease-out"
                cx={sqSize / 2}
                cy={sqSize / 2}
                r={radius}
                strokeWidth={`${strokeWidth}px`}
                fill="none"
                strokeLinecap="round"
                style={{
                    strokeDasharray: dashArray,
                    strokeDashoffset: dashOffset,
                }}
            />
            <text
                className="fill-current text-gray-800 dark:text-white font-bold text-2xl"
                x="50%"
                y="50%"
                dy=".3em"
                textAnchor="middle"
                 transform={`rotate(90 ${sqSize / 2} ${sqSize / 2})`}
            >
                {`${percentage}%`}
            </text>
        </svg>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ setCurrentView }) => {
    const [activeView, setActiveView] = useState<'business' | 'system'>('business');
    const { addToast } = useToast();
    
    // Consume Real Data from Context
    const { members, activeMemberCount, totalRevenue, leads, packages } = useData();

    // --- Business Logic ---
    const totalMembers = members.length;
    
    // Revenue Data - In real app, aggregate 'invoices' by month. 
    // Here we use static trend data but inject current total for the latest month.
    const revenueData = [
        { name: 'Feb', revenue: 45000 },
        { name: 'Mar', revenue: 52000 },
        { name: 'Apr', revenue: 48000 },
        { name: 'May', revenue: 61000 },
        { name: 'Jun', revenue: 55000 },
        { name: 'Jul', revenue: totalRevenue > 0 ? totalRevenue : 78000 }, // Inject real total if exists, else mock
    ];

    const footfallData = [
        { day: 'Mon', visits: 120 },
        { day: 'Tue', visits: 135 },
        { day: 'Wed', visits: 110 },
        { day: 'Thu', visits: 140 },
        { day: 'Fri', visits: 95 },
        { day: 'Sat', visits: 150 },
        { day: 'Sun', visits: 60 },
    ];

    const currentMonthRevenue = revenueData[revenueData.length - 1]?.revenue ?? 0;
    const previousMonthRevenue = revenueData[revenueData.length - 2]?.revenue ?? 0;
    const revenueGrowth = previousMonthRevenue !== 0 
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(1) 
        : "0.0";

    const convertedLeads = leads.filter(lead => lead.status === 'Converted').length;
    const totalLeads = leads.length;
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    const upcomingRenewals = useMemo(() => {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30); 

        return members.filter(member => {
            if (member.status === 'Inactive') return false;
            
            const expiryDate = getExpiryDate(member.joinDate, member.packageId, packages);
            if (!expiryDate) return false;

            const recentPast = new Date();
            recentPast.setDate(today.getDate() - 7);
            
            return expiryDate >= recentPast && expiryDate <= thirtyDaysFromNow;
        }).sort((a, b) => {
            const dateA = Number(getExpiryDate(a.joinDate, a.packageId, packages)?.getTime() ?? 0);
            const dateB = Number(getExpiryDate(b.joinDate, b.packageId, packages)?.getTime() ?? 0);
            return dateA - dateB;
        });
    }, [members, packages]);
    
    const packagePerformance = useMemo(() => {
        const stats: Record<number, { pkg: any, count: number, revenue: number, active: number }> = {};
        
        members.forEach(member => {
            if (!stats[member.packageId]) {
                const pkg = packages.find(p => p.id === member.packageId);
                if (pkg) {
                    stats[member.packageId] = { pkg, count: 0, revenue: 0, active: 0 };
                }
            }
            if (stats[member.packageId]) {
                stats[member.packageId].count += 1;
                stats[member.packageId].revenue += stats[member.packageId].pkg.price; 
                if (member.status === 'Active') {
                    stats[member.packageId].active += 1;
                }
            }
        });

        return Object.values(stats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 4);
    }, [members, packages]);

    const handleRemind = async (member: Member) => {
        const expiryDate = getExpiryDate(member.joinDate, member.packageId, packages);
        const dateStr = expiryDate ? expiryDate.toLocaleDateString() : 'soon';
        
        const success = await sendWhatsAppMessage({
            mobileNumber: member.phone,
            templateName: "payment_reminder",
            parameters: [
                { type: "text", text: member.name },
                { type: "text", text: dateStr }
            ]
        });
        
        if (success) {
            addToast(`Reminder sent to ${member.name} via WhatsApp.`, 'success');
        } else {
            addToast("Failed to send reminder via API.", 'error');
        }
    };

    // --- Control Panel / System Logic (Kept same as simulated) ---
    const [isManualMode, setIsManualMode] = useState(false);
    const [riskScore, setRiskScore] = useState(12);
    const [errorFeed, setErrorFeed] = useState<ErrorEvent[]>([]);
    const [autoFixHistory, setAutoFixHistory] = useState<AutoFixEvent[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<AutoFixEvent[]>([]);
    const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>(Array(64).fill(null).map((_, i) => ({ id: i, load: 10, status: 'healthy' })));
    const [isRollingBack, setIsRollingBack] = useState(false);

    useEffect(() => {
        if (activeView !== 'system') return;
        const interval = setInterval(() => {
            setHeatmapData(prev => prev.map(cell => {
                let newLoad = cell.load + (Math.random() * 20 - 10);
                newLoad = Math.max(0, Math.min(100, newLoad));
                let status: HeatmapCell['status'] = 'healthy';
                if (newLoad > 80) status = 'critical';
                else if (newLoad > 50) status = 'warning';
                return { ...cell, load: newLoad, status };
            }));

            if (Math.random() > 0.85) {
                const sources = ['Auth-Service', 'Payment-Gateway', 'Redis-Cache', 'Node-Worker-1', 'API-Gateway'];
                const msgs = ['Timeout waiting for lock', 'Connection reset by peer', 'High memory usage detected', 'Invalid JWT signature', 'Rate limit exceeded'];
                const severity = Math.random() > 0.8 ? 'critical' : Math.random() > 0.5 ? 'high' : 'medium';
                
                const newError: ErrorEvent = {
                    id: Date.now(),
                    source: sources[Math.floor(Math.random() * sources.length)],
                    message: msgs[Math.floor(Math.random() * msgs.length)],
                    timestamp: new Date().toLocaleTimeString(),
                    severity: severity as any
                };

                setErrorFeed(prev => [newError, ...prev].slice(0, 20));

                const fixAction = `Restarted ${newError.source}`;
                const newFix: AutoFixEvent = {
                    id: Date.now(),
                    action: fixAction,
                    target: newError.source,
                    timestamp: new Date().toLocaleTimeString(),
                    status: isManualMode ? 'pending_approval' : 'executed'
                };

                if (isManualMode) {
                    setPendingApprovals(prev => [newFix, ...prev]);
                } else {
                    setAutoFixHistory(prev => [newFix, ...prev].slice(0, 50));
                    setRiskScore(prev => Math.max(0, prev - 2));
                }
            }

            if (Math.random() > 0.9) {
                setRiskScore(prev => Math.min(100, prev + 1));
            }

        }, 1000);

        return () => clearInterval(interval);
    }, [isManualMode, activeView]);

    const handleApprove = (fix: AutoFixEvent) => {
        setPendingApprovals(prev => prev.filter(f => f.id !== fix.id));
        setAutoFixHistory(prev => [{ ...fix, status: 'executed', timestamp: new Date().toLocaleTimeString() }, ...prev]);
        setRiskScore(prev => Math.max(0, prev - 5));
    };

    const handleDeny = (id: number) => {
        setPendingApprovals(prev => prev.filter(f => f.id !== id));
    };

    const handleRollback = () => {
        if (autoFixHistory.length === 0) return;
        setIsRollingBack(true);
        setTimeout(() => {
            const lastAction = autoFixHistory[0];
            const rollbackEvent: AutoFixEvent = {
                id: Date.now(),
                action: `ROLLED BACK: ${lastAction.action}`,
                target: lastAction.target,
                timestamp: new Date().toLocaleTimeString(),
                status: 'rolled_back'
            };
            setAutoFixHistory(prev => [rollbackEvent, ...prev]);
            setIsRollingBack(false);
            addToast(`System rolled back to state before: ${lastAction.action}`, 'info');
        }, 1500);
    };

    const getSeverityColor = (s: string) => {
        switch(s) {
            case 'critical': return 'text-red-500 bg-red-900/20 border-red-500/50';
            case 'high': return 'text-orange-500 bg-orange-900/20 border-orange-500/50';
            default: return 'text-blue-400 bg-blue-900/20 border-blue-500/50';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                        Dashboard
                        {activeView === 'system' && <span className="text-sm font-normal text-gray-500 px-2 py-1 bg-gray-800 rounded border border-gray-700">System Mode</span>}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of Royal The Gym performance.</p>
                </div>
                
                <div className="flex items-center gap-4 bg-gray-800 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveView('business')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeView === 'business' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white'}`}
                    >
                        Business Ops
                    </button>
                    <button 
                        onClick={() => setActiveView('system')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeView === 'system' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        System Core
                    </button>
                </div>
            </div>
            
            {activeView === 'business' ? (
                <>
                    <CardioThemes />

                    {/* Automation Health Widget */}
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gray-700 rounded-lg">
                                <BotIcon className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">Autopilot Active</h3>
                                <p className="text-xs text-gray-400">Okfit • GymOwl • FitnessAI Syncing Live</p>
                            </div>
                        </div>
                        <div className="text-right hidden sm:block">
                            <p className="text-2xl font-bold text-green-400">142</p>
                            <p className="text-[10px] uppercase text-gray-500 font-bold">Auto-Tasks Today</p>
                        </div>
                        <button onClick={() => setCurrentView('royalBots')} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center">
                            <AutoUpdateIcon className="w-3 h-3 mr-2" /> View Logs
                        </button>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard 
                            icon={<MembersIcon />} 
                            title="Total Active Members" 
                            value={activeMemberCount.toString()} 
                            trend="5.2%" 
                            trendDirection="up" 
                            action={() => setCurrentView('members')} 
                        />
                        <StatCard 
                            icon={<DollarSignIcon />} 
                            title="Monthly Revenue" 
                            value={`₹${totalRevenue.toLocaleString()}`} 
                            trend={`${revenueGrowth}%`} 
                            trendDirection="up" 
                            action={() => setCurrentView('billing')} 
                        />
                        <StatCard 
                            icon={<CalendarIcon />} 
                            title="Avg. Daily Attendance" 
                            value="116" 
                            trend="2.1%" 
                            trendDirection="down" 
                        />
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <Card title="Revenue Growth (6 Months)" className="h-full p-0">
                                <div className="p-6">
                                    <div className="w-full mt-4 min-w-0" style={{ height: 400 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={revenueData}>
                                                <defs>
                                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" unit=" INR" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </Card>
                        </div>
                        <div className="lg:col-span-1">
                            <Card title="Weekly Footfall" className="h-full p-0">
                                <div className="p-6">
                                    <div className="w-full mt-4 min-w-0" style={{ height: 400 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={footfallData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                                                <Bar dataKey="visits" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Check-ins" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Bottom Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Lead Conversion Widget */}
                        <Card title="Lead Conversion" className="lg:col-span-1 p-0">
                            <div className="p-6">
                                 <div className="flex flex-col items-center justify-center py-6">
                                    <CircularProgress percentage={conversionRate} />
                                    <div className="mt-6 text-center">
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                                            <span className="font-bold text-gray-900 dark:text-white text-lg">{convertedLeads}</span> Converted / <span className="font-bold text-gray-900 dark:text-white text-lg">{totalLeads}</span> Total
                                        </p>
                                        <button onClick={() => setCurrentView('leads')} className="mt-4 text-sm text-amber-500 hover:text-amber-400 font-semibold">View All Leads &rarr;</button>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Upcoming Renewals */}
                        <Card title="Upcoming Renewals" className="lg:col-span-1 p-0">
                            <div className="p-6">
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                    {upcomingRenewals.length > 0 ? (
                                        upcomingRenewals.map(member => {
                                            const expiryDate = getExpiryDate(member.joinDate, member.packageId, packages);
                                            const expiryDateString = expiryDate?.toLocaleDateString() ?? 'N/A';
                                            const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
                                            const isExpired = daysLeft < 0;
                                            
                                            const joinDate = new Date(member.joinDate);
                                            const totalDuration = expiryDate ? expiryDate.getTime() - joinDate.getTime() : 1;
                                            const elapsed = Date.now() - joinDate.getTime();
                                            const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

                                            return (
                                            <div key={member.id} className="group relative p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-amber-500/50 transition-all">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700" />
                                                        <div>
                                                            <p className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{member.name}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-32">{packages.find(p => p.id === member.packageId)?.name ?? 'Unknown'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end">
                                                         <p className={`text-xs font-bold ${isExpired ? 'text-red-500' : 'text-amber-500'}`}>
                                                            {isExpired ? 'Expired' : `${daysLeft} days`}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400">{expiryDateString}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                                                    <div 
                                                        className={`h-full rounded-full ${isExpired ? 'bg-red-500' : progress > 90 ? 'bg-amber-500' : 'bg-green-500'}`} 
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>

                                                <div className="flex justify-between items-center mt-2">
                                                     <span className="text-[10px] text-gray-400 font-mono uppercase">
                                                        ID: #{member.id.toString().padStart(4, '0')}
                                                     </span>
                                                     <button 
                                                        onClick={(e) => { e.stopPropagation(); handleRemind(member); }}
                                                        className="flex items-center gap-1 text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded hover:bg-green-500/20 transition-colors font-bold uppercase tracking-wider"
                                                    >
                                                        <WhatsAppIcon className="w-3 h-3" /> Remind
                                                    </button>
                                                </div>
                                            </div>
                                        )})
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-40 text-center opacity-50">
                                            <CalendarIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
                                            <p className="text-sm text-gray-500">No renewals due soon.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Top Performing Packages Widget */}
                        <Card title="Top Performing Packages" className="lg:col-span-1 p-0">
                            <div className="p-6">
                                <div className="space-y-4">
                                    {packagePerformance.map((item, index) => (
                                        <div key={item.pkg.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 transition-all hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                                                    index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 ring-2 ring-yellow-500/50' : 
                                                    index === 1 ? 'bg-gray-300 text-gray-700' : 
                                                    index === 2 ? 'bg-orange-200 text-orange-800' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                                }`}>
                                                    {index === 0 ? <TrophyIcon className="w-4 h-4" /> : `#${index + 1}`}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{item.pkg.name}</p>
                                                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                                        <span className={`w-1.5 h-1.5 rounded-full mr-1 ${item.active > 0 ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                                                        {item.active} Active
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-green-600 dark:text-green-400 text-sm">₹{item.revenue.toLocaleString()}</p>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{item.count} Sold</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                                    <button onClick={() => setCurrentView('packages')} className="text-sm text-blue-500 hover:text-blue-400 font-semibold flex items-center justify-center mx-auto">
                                        View All Plans &rarr;
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </div>
                    
                    {/* Live Activity Feed */}
                    <div className="grid grid-cols-1">
                         <LiveActivity setCurrentView={setCurrentView} />
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    {/* --- SYSTEM CONTROL PANEL VIEW --- */}
                    {/* ... (System View remains the same) ... */}
                    {/* Re-using Control Panel UI from original file but kept concise here for limits */}
                    <Card className="lg:col-span-3 border-2 border-cyan-500/50 bg-gray-900 p-0">
                         <div className="p-6">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center">
                                    <ControlIcon className="w-10 h-10 mr-3 text-cyan-400" />
                                    <div>
                                        <h2 className="text-xl font-bold text-white">System Command Center</h2>
                                        <p className="text-xs text-gray-400">Autonomous Monitoring & Remediation</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Security Risk</p>
                                        <div className={`text-3xl font-black ${riskScore > 50 ? 'text-red-500' : riskScore > 20 ? 'text-yellow-500' : 'text-green-500'}`}>
                                            {riskScore}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleRollback}
                                        disabled={isRollingBack || autoFixHistory.length === 0}
                                        className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all active:scale-95"
                                    >
                                        {isRollingBack ? <AutoUpdateIcon className="w-5 h-5 animate-spin mr-2"/> : <div className="mr-2">↺</div>}
                                        {isRollingBack ? 'Reverting...' : 'ROLLBACK'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>
                    {/* Heatmap & Feed (Visual only, reusing state) */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card title="System Neural Heatmap" className="bg-black border-gray-800">
                             <div className="grid grid-cols-16 gap-1 h-32">
                                {heatmapData.map(cell => (
                                    <div 
                                        key={cell.id} 
                                        className={`rounded-sm transition-all duration-500 ${
                                            cell.status === 'critical' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] z-10' : 
                                            cell.status === 'warning' ? 'bg-amber-500' : 
                                            'bg-green-900/40 border border-green-500/10'
                                        }`}
                                    ></div>
                                ))}
                            </div>
                        </Card>
                         <Card title="Live Incident Feed" className="h-[400px] flex flex-col">
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                {errorFeed.length === 0 && <div className="text-center text-gray-500 py-10">System Nominal. No Active Incidents.</div>}
                                {errorFeed.map(err => (
                                    <div key={err.id} className={`p-3 rounded-lg border flex items-start justify-between animate-fade-in ${getSeverityColor(err.severity)}`}>
                                        <div>
                                            <p className="text-sm font-semibold">{err.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                     <div className="space-y-6">
                        <Card title="Auto-Remediation Log">
                            <div className="space-y-4 relative">
                                <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gray-700"></div>
                                {autoFixHistory.length === 0 && <p className="text-gray-500 text-sm pl-8">No actions taken yet.</p>}
                                {autoFixHistory.map((fix) => (
                                    <div key={fix.id} className="relative pl-8 animate-fade-in">
                                        <div className={`absolute left-0 top-1 w-5 h-5 rounded-full border-4 border-gray-800 ${fix.status === 'rolled_back' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                        <p className="text-sm font-bold text-gray-200">{fix.action}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
