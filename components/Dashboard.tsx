
import React, { useMemo } from 'react';
import Card from './common/Card';
import { INITIAL_MEMBERS, INITIAL_INVOICES, INITIAL_PACKAGES, INITIAL_LEADS } from '../constants';
import { MembersIcon } from './icons/NavIcons';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { View } from '../App';
import { CalendarIcon } from './icons/CalendarIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import LiveActivity from './LiveActivity';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import CustomTooltip from './common/CustomTooltip';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { Member } from '../types';
import { sendWhatsAppMessage } from '../lib/whatsapp';

interface DashboardProps {
    setCurrentView: (view: View) => void;
}

const getExpiryDate = (joinDateStr: string, packageId: number): Date | null => {
    const pkg = INITIAL_PACKAGES.find(p => p.id === packageId);
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

// Enhanced Stat Card with Trends
const StatCard: React.FC<{ 
    icon: React.ReactNode; 
    title: string; 
    value: string; 
    trend?: string; 
    trendDirection?: 'up' | 'down'; 
    action?: () => void 
}> = ({ icon, title, value, trend, trendDirection, action }) => (
    <div 
        onClick={action}
        className={`bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group transition-all duration-300 ${action ? 'cursor-pointer hover:shadow-md hover:border-amber-500/50' : ''}`}
    >
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
    const totalMembers = INITIAL_MEMBERS.length;
    const activeMembers = INITIAL_MEMBERS.filter(m => m.status === 'Active').length;
    
    // Mock Revenue Data for Chart (Last 6 Months)
    const revenueData = [
        { name: 'Feb', revenue: 45000 },
        { name: 'Mar', revenue: 52000 },
        { name: 'Apr', revenue: 48000 },
        { name: 'May', revenue: 61000 },
        { name: 'Jun', revenue: 55000 },
        { name: 'Jul', revenue: 78000 }, // Current simulated month
    ];

    // Mock Footfall Data (Weekly)
    const footfallData = [
        { day: 'Mon', visits: 120 },
        { day: 'Tue', visits: 135 },
        { day: 'Wed', visits: 110 },
        { day: 'Thu', visits: 140 },
        { day: 'Fri', visits: 95 },
        { day: 'Sat', visits: 150 },
        { day: 'Sun', visits: 60 },
    ];

    const currentMonthRevenue = revenueData[revenueData.length - 1].revenue;
    const previousMonthRevenue = revenueData[revenueData.length - 2].revenue;
    const revenueGrowth = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(1);

    const convertedLeads = INITIAL_LEADS.filter(lead => lead.status === 'Converted').length;
    const totalLeads = INITIAL_LEADS.length;
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    const upcomingRenewals = useMemo(() => {
        const today = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);

        return INITIAL_MEMBERS.filter(member => {
            if (member.status !== 'Active') return false;
            const expiryDate = getExpiryDate(member.joinDate, member.packageId);
            return expiryDate && expiryDate > today && expiryDate <= sevenDaysFromNow;
        });
    }, []);
    
    const topPackages = useMemo(() => {
        const packageCounts = INITIAL_MEMBERS.reduce((acc, member) => {
            acc[member.packageId] = (acc[member.packageId] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        return Object.entries(packageCounts)
            .map(([packageId, count]) => ({
                pkg: INITIAL_PACKAGES.find(p => p.id === Number(packageId)),
                count
            }))
            .filter(item => item.pkg)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
    }, []);

    const handleRemind = async (member: Member) => {
        const expiryDate = getExpiryDate(member.joinDate, member.packageId);
        const dateStr = expiryDate ? expiryDate.toLocaleDateString() : 'soon';
        
        // Use Business API instead of opening app
        const success = await sendWhatsAppMessage({
            mobileNumber: member.phone,
            templateName: "payment_reminder",
            parameters: [
                { type: "text", text: member.name },
                { type: "text", text: dateStr }
            ]
        });
        
        if (success) {
            alert(`Reminder sent to ${member.name} via WhatsApp Business.`);
        } else {
            alert("Failed to send reminder via API.");
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of Royal The Gym performance.</p>
                </div>
                <div className="mt-4 md:mt-0 flex gap-3">
                    <button onClick={() => setCurrentView('members')} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center">
                        <UserGroupIcon className="w-4 h-4 mr-2" /> Add Member
                    </button>
                    <button onClick={() => setCurrentView('payment')} className="bg-amber-500 hover:bg-amber-400 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center">
                        <DollarSignIcon className="w-4 h-4 mr-2" /> New Transaction
                    </button>
                </div>
            </div>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                    icon={<MembersIcon />} 
                    title="Total Active Members" 
                    value={activeMembers.toString()} 
                    trend="5.2%" 
                    trendDirection="up" 
                    action={() => setCurrentView('members')} 
                />
                <StatCard 
                    icon={<DollarSignIcon />} 
                    title="Monthly Revenue" 
                    value={`₹${currentMonthRevenue.toLocaleString()}`} 
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
                    <Card title="Revenue Growth (6 Months)" className="h-full">
                        <div className="h-[400px] w-full mt-4 min-w-0">
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
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card title="Weekly Footfall" className="h-full">
                        <div className="h-[400px] w-full mt-4 min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={footfallData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                                    <Bar dataKey="visits" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Check-ins" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Lead Conversion Widget */}
                <Card title="Lead Conversion" className="lg:col-span-1">
                     <div className="flex flex-col items-center justify-center py-6">
                        <CircularProgress percentage={conversionRate} />
                        <div className="mt-6 text-center">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                <span className="font-bold text-gray-900 dark:text-white text-lg">{convertedLeads}</span> Converted / <span className="font-bold text-gray-900 dark:text-white text-lg">{totalLeads}</span> Total
                            </p>
                            <button onClick={() => setCurrentView('leads')} className="mt-4 text-sm text-amber-500 hover:text-amber-400 font-semibold">View All Leads &rarr;</button>
                        </div>
                    </div>
                </Card>

                {/* Upcoming Renewals */}
                <Card title="Upcoming Renewals (7 Days)" className="lg:col-span-1">
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {upcomingRenewals.length > 0 ? (
                            upcomingRenewals.map(member => {
                                const expiryDateString = getExpiryDate(member.joinDate, member.packageId)?.toLocaleDateString() ?? 'N/A';
                                return (
                                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center">
                                        <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full mr-3 object-cover" />
                                        <div>
                                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{member.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{INITIAL_PACKAGES.find(p => p.id === member.packageId)?.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <p className="text-xs font-bold text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">Exp: {expiryDateString}</p>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleRemind(member); }}
                                            className="text-green-500 hover:text-green-400 p-1 flex items-center text-xs font-bold"
                                            title="Send WhatsApp Business Reminder"
                                        >
                                            <WhatsAppIcon className="w-3 h-3 mr-1" /> Remind
                                        </button>
                                    </div>
                                </div>
                            )})
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-center">
                                <CalendarIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-2" />
                                <p className="text-gray-500">No renewals due this week.</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Top Packages */}
                <Card title="Top Selling Packages" className="lg:col-span-1">
                    <div className="space-y-4">
                        {topPackages.map((item, index) => {
                             // Calculate percentage relative to the top seller
                             const maxCount = topPackages[0].count;
                             const percent = (item.count / maxCount) * 100;
                             
                             return (
                             <div key={item.pkg!.id} className="relative">
                                <div className="flex items-center justify-between mb-1 relative z-10">
                                    <div className="flex items-center">
                                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mr-3 ${index === 0 ? 'bg-yellow-500 text-white' : index === 1 ? 'bg-gray-400 text-white' : 'bg-orange-700 text-white'}`}>
                                            {index + 1}
                                        </span>
                                        <span className="font-medium text-gray-700 dark:text-gray-200">{item.pkg!.name}</span>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white">{item.count} <span className="text-xs font-normal text-gray-500">sold</span></span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                                    <div 
                                        className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" 
                                        style={{ width: `${percent}%` }}
                                    ></div>
                                </div>
                            </div>
                        )})}
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button onClick={() => setCurrentView('packages')} className="w-full text-center text-sm font-semibold text-blue-500 hover:text-blue-400">Manage Packages</button>
                    </div>
                </Card>
            </div>
            
            {/* Live Activity Feed */}
            <div className="grid grid-cols-1">
                 <LiveActivity setCurrentView={setCurrentView} />
            </div>

        </div>
    );
};

export default Dashboard;
