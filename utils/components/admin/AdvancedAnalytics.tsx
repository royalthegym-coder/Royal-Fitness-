import { getCurrencySymbol } from '../../store/useCurrencyStore';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

const revenueData = [
  { name: 'Jan', profit: 4000, expense: 2400, admission: 20 },
  { name: 'Feb', profit: 3000, expense: 1398, admission: 15 },
  { name: 'Mar', profit: 2000, expense: 9800, admission: 10 },
  { name: 'Apr', profit: 2780, expense: 3908, admission: 22 },
  { name: 'May', profit: 1890, expense: 4800, admission: 18 },
  { name: 'Jun', profit: 2390, expense: 3800, admission: 25 },
  { name: 'Jul', profit: 3490, expense: 4300, admission: 30 },
];

const distributionData = [
  { name: 'Monthly Members', value: 400 },
  { name: 'Quarterly Members', value: 300 },
  { name: 'Yearly Members', value: 300 },
  { name: 'PT Members', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AdvancedAnalytics() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Advanced Analytics</h2>
        <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-mono">FitnessFutureRevenue Intelligence</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: `Total Revenue YTD", value: "${getCurrencySymbol()}24,50,000`, icon: DollarSign, color: "text-emerald-400" },
          { title: "Active Members", value: "1,204", icon: Users, color: "text-cyan-400" },
          { title: "Avg. Retention Rate", value: "87%", icon: Activity, color: "text-purple-400" },
          { title: "New Admissions", value: "+140", icon: TrendingUp, color: "text-amber-400" }
        ].map((stat, i) => (
          <div key={i} className="p-6 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-md">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl bg-black/60 border border-white/5 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.title}</h3>
            </div>
            <p className="text-3xl font-black text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-md h-[400px]">
          <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-widest">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
              <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-md h-[400px]">
          <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-widest">New Admissions Trend</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={revenueData}>
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
              <Bar dataKey="admission" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-md h-[400px]">
          <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-widest">Membership Distribution</h3>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-md h-[400px]">
          <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-widest">Profit Margin Growth</h3>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={revenueData}>
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
              <Line type="monotone" dataKey="profit" stroke="#a855f7" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
