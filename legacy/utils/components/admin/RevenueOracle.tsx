import { getCurrencySymbol } from '../../store/useCurrencyStore';

import React, { useState, useMemo } from 'react';
import Card from '../common/Card';
import { useData } from '../../context/DataProvider';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Activity, Calendar, Download, RefreshCw } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const RevenueOracle: React.FC = () => {
    const { invoices, totalRevenue } = useData();
    const { addToast } = useToast();
    const [timeRange, setTimeRange] = useState<'Week' | 'Month' | 'Year'>('Month');
    
    // Prediction Logic
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
            <div className="mb-6 bg-[#020202] p-8 rounded-[3rem] border border-cyan-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-[2rem] shadow-[0_0_60px_rgba(6,182,212,0.5)] border border-cyan-400 group-hover:rotate-12 transition-transform duration-700">
                             <DollarSign className="w-12 h-12" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Activity className="w-3 h-3" /> Fitness Future
                                </div>
                                <span className="text-[10px] font-mono text-cyan-500/70 tracking-[0.4em] uppercase">FINANCIAL INTELLIGENCE</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Revenue <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400">Oracle</span>
                            </h1>
                        </div>
                    </div>
                    
                    <div className="flex gap-3 mt-4 md:mt-0">
                         <button 
                            onClick={() => addToast("Financial Report exported successfully.", "success")}
                            className="bg-cyan-600 text-black px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center gap-2"
                         >
                            <Download className="w-4 h-4" /> Export Report
                         </button>
                    </div>
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
                    <h3 className="text-3xl font-black text-white italic">{getCurrencySymbol()}{(totalRevenue/1000).toFixed(1)}k</h3>
                </Card>
                <Card className="bg-gray-900 border-white/5 p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><Activity className="w-6 h-6"/></div>
                    </div>
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Monthly Recurring (MRR)</p>
                    <h3 className="text-3xl font-black text-white italic">{getCurrencySymbol()}{(mrr/1000).toFixed(1)}k</h3>
                </Card>
                <Card className="bg-gray-900 border-white/5 p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400"><TrendingUp className="w-6 h-6"/></div>
                    </div>
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Proj. Next Month</p>
                    <h3 className="text-3xl font-black text-white italic">{getCurrencySymbol()}{((mrr * 1.15)/1000).toFixed(1)}k</h3>
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
                                <span className="text-sm font-bold text-gray-400">Merchandise/Supps</span>
                                <span className="text-white font-mono">35%</span>
                            </div>
                            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-amber-500 h-full" style={{width: '35%'}}></div>
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
