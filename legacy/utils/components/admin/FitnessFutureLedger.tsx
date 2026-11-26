import { getCurrencySymbol } from '../../store/useCurrencyStore';
import React from 'react';
import { DollarSign, TrendingUp, BarChart2, Activity, ArrowUpRight, ArrowDownRight, Globe } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

const mockFinancialData = [
  { month: 'Jan', revenue: 120000, projected: 120000 },
  { month: 'Feb', revenue: 135000, projected: 135000 },
  { month: 'Mar', revenue: 125000, projected: 125000 },
  { month: 'Apr', revenue: 145000, projected: 145000 },
  { month: 'May (Current)', revenue: 160000, projected: 160000 },
  { month: 'Jun', revenue: null, projected: 175000 },
  { month: 'Jul', revenue: null, projected: 168000 },
  { month: 'Aug', revenue: null, projected: 190000 },
];

export default function FitnessFutureLedger() {
    return (
        <div className="space-y-6 animate-fade-in pb-24">
            <div className="bg-black border border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2 flex items-center gap-3 relative z-10">
                    <Globe className="w-8 h-8 text-yellow-400" /> Advanced Financial Ledger
                </h1>
                <p className="text-gray-400 text-sm font-mono uppercase tracking-widest relative z-10">SuperAdmin Predictive Intelligence (Meta Prophet AI)</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="bg-black/40 border border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-center">
                    <DollarSign className="w-8 h-8 text-yellow-400 mb-4" />
                    <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">Current MRR</p>
                    <p className="text-3xl font-black text-white italic tracking-tighter">{getCurrencySymbol()}1,60,000</p>
                    <p className="text-sm text-green-400 mt-2 flex items-center"><ArrowUpRight className="w-4 h-4 mr-1"/> 10.3% vs last month</p>
                </div>
                <div className="bg-black/40 border border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-center">
                    <TrendingUp className="w-8 h-8 text-cyan-400 mb-4" />
                    <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">Predicted MRR (Next 3 Mo)</p>
                    <p className="text-3xl font-black text-white italic tracking-tighter text-cyan-400">{getCurrencySymbol()}1,90,000</p>
                    <p className="text-sm text-cyan-500 mt-2 flex items-center">Meta Prophet Q3 Forecast</p>
                </div>
                <div className="bg-black/40 border border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-center">
                    <Activity className="w-8 h-8 text-emerald-400 mb-4" />
                    <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">Retention ROI</p>
                    <p className="text-3xl font-black text-white italic tracking-tighter text-emerald-400">{getCurrencySymbol()}45,200</p>
                    <p className="text-sm text-gray-400 mt-2 flex items-center">Saved via n8n Bots</p>
                </div>
                <div className="bg-black/40 border border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-center">
                    <BarChart2 className="w-8 h-8 text-red-400 mb-4" />
                    <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">Predicted Seasonal Dip</p>
                    <p className="text-3xl font-black text-white italic tracking-tighter text-red-500">July</p>
                    <p className="text-sm text-red-400 mt-2 flex items-center"><ArrowDownRight className="w-4 h-4 mr-1"/> Monsoon drop forecast</p>
                </div>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-6 lg:p-10 backdrop-blur-md">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-white font-black uppercase text-xl flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-yellow-400" /> Revenue Trajectory & Forecast Graph
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-mono font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-2 text-white"><span className="w-3 h-3 rounded-full bg-white"></span> Actual</span>
                        <span className="flex items-center gap-2 text-yellow-500"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Predicted (Meta Prophet)</span>
                    </div>
                </div>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockFinancialData} margin={{ top: 20, right: 20, left: 20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="month" stroke="#ffffff50" fontSize={12} tickMargin={15} />
                            <YAxis stroke="#ffffff50" fontSize={12} tickFormatter={(v) => `${getCurrencySymbol()}${(v/1000).toFixed(0)}k`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#000000cc', borderColor: '#ffffff20', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                                itemStyle={{ fontWeight: 'bold' }}
                                labelStyle={{ color: '#aaa', fontSize: '10px', marginBottom: '4px' }}
                            />
                            
                            <ReferenceLine x="May (Current)" stroke="#ffffff30" strokeDasharray="5 5" />
                            
                            {/* Actual Revenue Line */}
                            <Line 
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="#ffffff" 
                                strokeWidth={3} 
                                name="Recorded Revenue" 
                                dot={{ fill: '#ffffff', strokeWidth: 2, r: 4 }} 
                                activeDot={{ r: 6 }} 
                            />
                            {/* Predicted Line (Dotted) */}
                            <Line 
                                type="monotone" 
                                dataKey="projected" 
                                stroke="#eab308" 
                                strokeWidth={3} 
                                strokeDasharray="5 5"
                                name="Prophet Prediction AI" 
                                dot={{ fill: '#eab308', strokeWidth: 2, r: 4 }} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
        </div>
    );
}
