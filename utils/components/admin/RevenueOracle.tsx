
import React, { useState, useMemo } from 'react';
import Card from '../common/Card';
import { useData } from '../../context/DataProvider';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Activity, Calendar, Download, RefreshCw } from 'lucide-react';

const RevenueOracle: React.FC = () => {
    const { invoices, totalRevenue } = useData();
    const [timeRange, setTimeRange] = useState<'Week' | 'Month' | 'Year'>('Month');
    
    // Mock Prediction Logic
    const predictionData = useMemo(() => {
        const data = [];
        const base = 50000;
        for (let i = 1; i <= 12; i++) {
            const actual = i < 7 ? base + Math.random() * 20000 : null;
            const projected = base + (i * 2000) + Math.random() * 10000;
            data.push({
                name: `M${i}`,
                Actual: actual,
                Projected: projected
            });
        }
        return data;
    }, []);

    const mrr = totalRevenue / 12; // Simple MRR Calc

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-[#050505] p-8 rounded-[3rem] border border-emerald-500/20 shadow-2xl">
                <div>
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                        Revenue <span className="text-emerald-500">Oracle</span>
                    </h1>
                    <p className="text-gray-500 text-xs font-mono mt-2 tracking-widest uppercase">Financial Intelligence v31.0</p>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                     <button className="bg-emerald-600 text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export Report
                     </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-gray-900 border-white/5 p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400"><DollarSign className="w-6 h-6"/></div>
                        <span className="text-[10px] bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded font-bold">+12%</span>
                    </div>
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Total Revenue</p>
                    <h3 className="text-3xl font-black text-white italic">₹{(totalRevenue/1000).toFixed(1)}k</h3>
                </Card>
                <Card className="bg-gray-900 border-white/5 p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><Activity className="w-6 h-6"/></div>
                    </div>
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Monthly Recurring (MRR)</p>
                    <h3 className="text-3xl font-black text-white italic">₹{(mrr/1000).toFixed(1)}k</h3>
                </Card>
                <Card className="bg-gray-900 border-white/5 p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400"><TrendingUp className="w-6 h-6"/></div>
                    </div>
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Proj. Next Month</p>
                    <h3 className="text-3xl font-black text-white italic">₹{((mrr * 1.15)/1000).toFixed(1)}k</h3>
                </Card>
                <Card className="bg-gray-900 border-white/5 p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400"><RefreshCw className="w-6 h-6"/></div>
                    </div>
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Churn Rate</p>
                    <h3 className="text-3xl font-black text-white italic">2.4%</h3>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card title="Financial Trajectory" className="bg-[#0c0c0c] border-white/5 p-8 rounded-[3rem] h-[500px]">
                        <div className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={predictionData}>
                                    <defs>
                                        <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#555" />
                                    <YAxis stroke="#555" />
                                    <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333'}} />
                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                    <Area type="monotone" dataKey="Actual" stroke="#10b981" fillOpacity={1} fill="url(#colorAct)" strokeWidth={3} />
                                    <Area type="monotone" dataKey="Projected" stroke="#3b82f6" fillOpacity={1} fill="url(#colorProj)" strokeDasharray="5 5" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card title="Revenue Sources" className="bg-[#0c0c0c] border-white/5 p-8 rounded-[3rem]">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-400">Memberships</span>
                                <span className="text-white font-mono">65%</span>
                            </div>
                            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full" style={{width: '65%'}}></div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-400">Personal Training</span>
                                <span className="text-white font-mono">25%</span>
                            </div>
                            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full" style={{width: '25%'}}></div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-400">Merchandise/Supps</span>
                                <span className="text-white font-mono">10%</span>
                            </div>
                            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-amber-500 h-full" style={{width: '10%'}}></div>
                            </div>
                        </div>
                    </Card>
                    <div className="bg-emerald-900/10 border border-emerald-500/20 p-6 rounded-[2.5rem]">
                        <p className="text-emerald-400 font-black uppercase text-xs tracking-widest mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4"/> AI Insight
                        </p>
                        <p className="text-gray-300 text-sm italic leading-relaxed">
                            "Revenue is projected to grow by 18% next month due to seasonal trends. Recommend launching a 'Summer Shred' promo to maximize yield."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RevenueOracle;
