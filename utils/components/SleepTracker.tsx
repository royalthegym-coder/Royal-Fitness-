import React, { useState } from 'react';
import { useData } from '../context/DataProvider';
import { Moon, Plus, Activity, Clock, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { SleepLog } from '../types';

const SleepTracker: React.FC = () => {
    const { sleepLogs, addSleepLog, members } = useData();
    const [isAdding, setIsAdding] = useState(false);
    
    // Form state
    const [memberId, setMemberId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [totalHours, setTotalHours] = useState('');
    const [deepHours, setDeepHours] = useState('');
    const [remHours, setRemHours] = useState('');
    const [quality, setQuality] = useState('Good');
    const [notes, setNotes] = useState('');
    const [filterMemberId, setFilterMemberId] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!memberId || !date || !totalHours || !deepHours || !remHours) return;

        const newLog: SleepLog = {
            id: Date.now().toString(),
            memberId: parseInt(memberId),
            date,
            totalHours: parseFloat(totalHours),
            deepHours: parseFloat(deepHours),
            remHours: parseFloat(remHours),
            quality,
            notes
        };

        addSleepLog(newLog);
        setIsAdding(false);
        setTotalHours('');
        setDeepHours('');
        setRemHours('');
        setNotes('');
    };

    // Prepare data for chart (aggregate or show latest for a specific member, here we just show all logs sorted by date for simplicity, or we can group by date)
    const chartData = [...sleepLogs]
        .filter(log => filterMemberId === '' || log.memberId === parseInt(filterMemberId))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(log => ({
            ...log,
            lightHours: log.totalHours - log.deepHours - log.remHours,
            memberName: members.find(m => m.id === log.memberId)?.name || 'Unknown'
        }));

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 font-mono animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-500/30 pb-4 gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-black border border-cyan-500 p-3 rounded-full">
                        <Moon className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                <Activity className="w-3 h-3" /> Fitness Future
                            </div>
                        </div>
                        <h1 className="text-3xl font-black text-cyan-400 uppercase tracking-[0.2em]">Sleep Tracker</h1>
                        <p className="text-cyan-500/70 text-sm tracking-widest mt-1">MONITOR RECOVERY & SLEEP CYCLES</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <select
                        value={filterMemberId}
                        onChange={(e) => setFilterMemberId(e.target.value)}
                        className="bg-gray-900 border border-cyan-500/30 text-cyan-400 px-4 py-2 rounded-sm focus:outline-none focus:border-cyan-500 uppercase tracking-widest text-sm"
                    >
                        <option value="">All Members</option>
                        {members.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                    <button 
                        onClick={() => setIsAdding(!isAdding)}
                        className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-sm uppercase tracking-widest font-bold transition-colors"
                    >
                        {isAdding ? 'Cancel' : <><Plus className="w-4 h-4" /> Log Sleep</>}
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="bg-gray-900 border border-indigo-500/30 p-6 rounded-xl">
                    <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest">Add Sleep Log</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs text-indigo-400 uppercase tracking-widest mb-1">Member</label>
                            <select 
                                value={memberId} 
                                onChange={(e) => setMemberId(e.target.value)}
                                className="w-full bg-black border border-indigo-500/30 rounded-lg p-2 text-white focus:border-indigo-500 outline-none"
                                required
                            >
                                <option value="">Select Member</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-indigo-400 uppercase tracking-widest mb-1">Date</label>
                            <input 
                                type="date" 
                                value={date} 
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-black border border-indigo-500/30 rounded-lg p-2 text-white focus:border-indigo-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-indigo-400 uppercase tracking-widest mb-1">Total Hours</label>
                            <input 
                                type="number" 
                                step="0.1"
                                value={totalHours} 
                                onChange={(e) => setTotalHours(e.target.value)}
                                className="w-full bg-black border border-indigo-500/30 rounded-lg p-2 text-white focus:border-indigo-500 outline-none"
                                placeholder="e.g. 7.5"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-indigo-400 uppercase tracking-widest mb-1">Deep Sleep (Hours)</label>
                            <input 
                                type="number" 
                                step="0.1"
                                value={deepHours} 
                                onChange={(e) => setDeepHours(e.target.value)}
                                className="w-full bg-black border border-indigo-500/30 rounded-lg p-2 text-white focus:border-indigo-500 outline-none"
                                placeholder="e.g. 1.5"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-indigo-400 uppercase tracking-widest mb-1">REM Sleep (Hours)</label>
                            <input 
                                type="number" 
                                step="0.1"
                                value={remHours} 
                                onChange={(e) => setRemHours(e.target.value)}
                                className="w-full bg-black border border-indigo-500/30 rounded-lg p-2 text-white focus:border-indigo-500 outline-none"
                                placeholder="e.g. 2.0"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-indigo-400 uppercase tracking-widest mb-1">Quality</label>
                            <select 
                                value={quality} 
                                onChange={(e) => setQuality(e.target.value)}
                                className="w-full bg-black border border-indigo-500/30 rounded-lg p-2 text-white focus:border-indigo-500 outline-none"
                            >
                                <option value="Excellent">Excellent</option>
                                <option value="Good">Good</option>
                                <option value="Fair">Fair</option>
                                <option value="Poor">Poor</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                            <label className="block text-xs text-indigo-400 uppercase tracking-widest mb-1">Notes</label>
                            <input 
                                type="text" 
                                value={notes} 
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-black border border-indigo-500/30 rounded-lg p-2 text-white focus:border-indigo-500 outline-none"
                                placeholder="Any notes about sleep..."
                            />
                        </div>
                        <div className="md:col-span-2 lg:col-span-3 flex justify-end">
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-sm uppercase tracking-widest font-bold transition-colors">
                                Save Log
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {sleepLogs.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-900 border border-indigo-500/30 p-6 rounded-xl">
                        <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-400" />
                            Sleep Stages Breakdown
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#111827', borderColor: '#4F46E5', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="deepHours" name="Deep Sleep" stackId="a" fill="#4F46E5" />
                                    <Bar dataKey="remHours" name="REM Sleep" stackId="a" fill="#8B5CF6" />
                                    <Bar dataKey="lightHours" name="Light Sleep" stackId="a" fill="#60A5FA" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-gray-900 border border-indigo-500/30 p-6 rounded-xl">
                        <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-400" />
                            Total Sleep Trend
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#111827', borderColor: '#4F46E5', color: '#fff' }}
                                    />
                                    <Line type="monotone" dataKey="totalHours" name="Total Hours" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, fill: '#8B5CF6' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-gray-900 border border-indigo-500/30 rounded-xl overflow-hidden">
                        <div className="p-4 bg-indigo-900/20 border-b border-indigo-500/30">
                            <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-400" />
                                Historical Log
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-300">
                                <thead className="text-xs text-indigo-400 uppercase bg-black/50">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Member</th>
                                        <th className="px-4 py-3">Total (h)</th>
                                        <th className="px-4 py-3">Deep (h)</th>
                                        <th className="px-4 py-3">REM (h)</th>
                                        <th className="px-4 py-3">Quality</th>
                                        <th className="px-4 py-3">Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {chartData.slice().reverse().map((log) => (
                                        <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                            <td className="px-4 py-3">{new Date(log.date).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 font-bold text-white">{log.memberName}</td>
                                            <td className="px-4 py-3 text-indigo-400 font-bold">{log.totalHours}</td>
                                            <td className="px-4 py-3 text-blue-400">{log.deepHours}</td>
                                            <td className="px-4 py-3 text-purple-400">{log.remHours}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                    log.quality === 'Excellent' ? 'bg-green-500/20 text-green-400' :
                                                    log.quality === 'Good' ? 'bg-blue-500/20 text-blue-400' :
                                                    log.quality === 'Fair' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                    {log.quality}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 truncate max-w-xs">{log.notes || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-900 border border-indigo-500/30 p-12 rounded-xl text-center">
                    <Moon className="w-16 h-16 text-indigo-500/50 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">No Sleep Data</h3>
                    <p className="text-gray-400">Log your first sleep session to start tracking recovery metrics.</p>
                </div>
            )}
        </div>
    );
};

export default SleepTracker;
