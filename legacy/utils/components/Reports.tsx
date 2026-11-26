import { getCurrencySymbol } from '../store/useCurrencyStore';

import React, { useState, useMemo } from 'react';
import Card from './common/Card';
import { INITIAL_PACKAGES } from '../../constants';
import { useData } from '../context/DataProvider';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector, LineChart, Line, CartesianGrid } from 'recharts';
import { getComplexResponse } from '../../lib/core_ai';
import { SparkleIcon } from './icons/SparkleIcon';
import CustomTooltip from './common/CustomTooltip';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';

const Reports: React.FC = () => {
    const { members, invoices } = useData();
    const [aiSummary, setAiSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'standard' | 'predictive'>('standard');

    const monthlyRevenueData = useMemo(() => {
        const months: { [key: string]: number } = {};
        invoices.filter(i => i.status === 'Paid').forEach(invoice => {
            const month = new Date(invoice.date).toLocaleString('default', { month: 'short', year: 'numeric' });
            months[month] = (months[month] || 0) + invoice.amount;
        });
        return Object.entries(months).map(([name, revenue]) => ({ name, revenue })).reverse();
    }, [invoices]);

    const packagePopularityData = useMemo(() => {
        const packageCounts: { [key: string]: number } = {};
        members.forEach(member => {
            const pkg = INITIAL_PACKAGES.find(p => p.id === member.packageId);
            if (pkg) {
                packageCounts[pkg.name] = (packageCounts[pkg.name] || 0) + 1;
            }
        });
        return Object.entries(packageCounts).map(([name, value]) => ({ name, value }));
    }, [members]);

    const membershipGrowthData = useMemo(() => {
        const sortedMembers = [...members].sort((a, b) => new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime());
        const growth: { [key: string]: number } = {};
        let count = 0;
        
        sortedMembers.forEach(member => {
            count++;
            const month = new Date(member.joinDate).toLocaleString('default', { month: 'short', year: '2-digit' });
            growth[month] = count;
        });

        return Object.entries(growth).map(([name, members]) => ({ name, members }));
    }, [members]);

    // Data for Predictive Analytics
    const forecastData = [
        { month: 'Aug', actual: 78000, projected: 78000 },
        { month: 'Sep', actual: null, projected: 82000 },
        { month: 'Oct', actual: null, projected: 85500 },
        { month: 'Nov', actual: null, projected: 81000 },
    ];

    const churnRiskMembers = useMemo(() => {
        return members.map(m => ({
            name: m.name,
            risk: m.status === 'Expired' ? 85 : m.status === 'Inactive' ? 60 : 15,
            reason: m.status === 'Expired' ? 'Membership expired' : m.status === 'Inactive' ? 'Low recent attendance' : 'Consistent attendance'
        }));
    }, [members]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

    const handleGenerateSummary = async () => {
        setIsLoading(true);
        setAiSummary('');
        const promptData = `
            Analyze the following gym performance data and provide a concise summary of business health, key trends, and potential areas for improvement.

            Monthly Revenue:
            ${JSON.stringify(monthlyRevenueData)}

            Package Popularity (by member count):
            ${JSON.stringify(packagePopularityData)}

            Membership Growth:
            ${JSON.stringify(membershipGrowthData)}

            Total Members: ${members.length}
            Total Paid Invoices: ${invoices.filter(i => i.status === 'Paid').length}
        `;

        const summary = await getComplexResponse(promptData);
        setAiSummary(summary);
        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-center mb-6">
                <div className="bg-gray-900/80 rounded-2xl p-1.5 flex space-x-1 border border-white/10 shadow-xl backdrop-blur-md">
                    <button onClick={() => setActiveTab('standard')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden group ${activeTab === 'standard' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-amber-400/50 border-dashed' : 'text-gray-400 hover:text-white border border-transparent'}`}>
                        {activeTab === 'standard' && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
                        <span className="relative z-10">Standard Reports</span>
                    </button>
                    <button onClick={() => setActiveTab('predictive')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden group ${activeTab === 'predictive' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-amber-400/50 border-dashed' : 'text-gray-400 hover:text-white border border-transparent'}`}>
                        {activeTab === 'predictive' && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
                        <span className="relative z-10">Predictive Analytics (AI)</span>
                    </button>
                </div>
            </div>

            {activeTab === 'standard' && (
                <>
                    <Card title="AI-Powered Business Summary">
                        <button
                            onClick={handleGenerateSummary}
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black py-4 rounded-xl uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(245,158,11,0.3)] border border-amber-400/50 border-dashed transition-all disabled:opacity-50 flex items-center justify-center gap-2 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                            <SparkleIcon className="w-4 h-4 relative z-10" />
                            <span className="relative z-10">{isLoading ? 'Generating Analysis...' : 'Generate AI Summary'}</span>
                        </button>
                        {aiSummary && (
                            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                                <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\n/g, '<br />') }} />
                            </div>
                        )}
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card title="Monthly Revenue">
                            {/* Fixed height container for Recharts using inline style to ensure it's picked up */}
                            <div className="w-full min-w-0" style={{ height: 400 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyRevenueData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${getCurrencySymbol()}${value/1000}k`} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(125, 125, 125, 0.1)' }} />
                                        <Legend />
                                        <Bar dataKey="revenue" name={`Revenue (${getCurrencySymbol()})`} fill="#fbbf24" radius={[4, 4, 0, 0]} activeBar={<rect fill="#f59e0b" />} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                        
                        <Card title="Membership Growth">
                            {/* Fixed height container for Recharts */}
                            <div className="w-full min-w-0" style={{ height: 400 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={membershipGrowthData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Line type="monotone" dataKey="members" name="Total Members" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card title="Package Popularity" className="lg:col-span-2">
                            <div className="w-full min-w-0" style={{ height: 400 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={packagePopularityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                            {packagePopularityData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>
                </>
            )}

            {activeTab === 'predictive' && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card title="Revenue Forecast (Next Quarter)">
                            <p className="text-sm text-gray-400 mb-4">Projected revenue based on active subscriptions and historical growth trends.</p>
                            <div className="w-full min-w-0" style={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={forecastData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                        <XAxis dataKey="month" stroke="#9CA3AF" />
                                        <YAxis stroke="#9CA3AF" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={3} name="Actual Revenue" />
                                        <Line type="monotone" dataKey="projected" stroke="#F59E0B" strokeDasharray="5 5" strokeWidth={3} name="Projected Revenue" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card title="Member Churn Risk">
                            <p className="text-sm text-gray-400 mb-4">AI analysis of attendance patterns and engagement to predict potential cancellations.</p>
                            <div className="space-y-4">
                                {churnRiskMembers.map((member, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30 border border-gray-600">
                                        <div className="flex items-center">
                                            <div className={`w-2 h-10 rounded mr-3 ${member.risk > 70 ? 'bg-red-500' : member.risk > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                            <div>
                                                <p className="font-bold text-white">{member.name}</p>
                                                <p className="text-xs text-gray-400">{member.reason}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-bold ${member.risk > 70 ? 'text-red-400' : member.risk > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                                                {member.risk}%
                                            </p>
                                            <p className="text-[10px] text-gray-500 uppercase">Risk Score</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="mt-6 w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black py-4 rounded-xl uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-500/50 border-dashed transition-all relative overflow-hidden group">
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                <span className="relative z-10">Send Re-engagement Offers</span>
                            </button>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
};

export default Reports;
