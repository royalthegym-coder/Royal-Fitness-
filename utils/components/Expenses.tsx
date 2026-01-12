
import React, { useState, useMemo } from 'react';
import { Expense } from '../../types';
import { INITIAL_EXPENSES } from '../../constants';
import Card from './common/Card';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { BotIcon } from './icons/BotIcon';
import CustomTooltip from './common/CustomTooltip';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Expenses: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
    const [activeTab, setActiveTab] = useState<'overview' | 'audit'>('overview');
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditResults, setAuditResults] = useState<{id: number, issue: string}[]>([]);

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const expensesByCategory = useMemo(() => {
        const map: Record<string, number> = {};
        expenses.forEach(e => {
            map[e.category] = (map[e.category] || 0) + e.amount;
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [expenses]);

    // Simulated Forecast Data
    const forecastData = [
        { month: 'Jul', actual: totalExpenses, projected: totalExpenses },
        { month: 'Aug', actual: 0, projected: totalExpenses * 1.05 },
        { month: 'Sep', actual: 0, projected: totalExpenses * 1.02 },
    ];

    const handleRunAudit = () => {
        setIsAuditing(true);
        setAuditResults([]);
        
        // Simulate AI Audit Process
        setTimeout(() => {
            // Find "High" expenses as mock anomalies
            const anomalies = expenses
                .filter(e => e.amount > 20000 && e.category !== 'Salary')
                .map(e => ({ id: e.id, issue: `High value transaction: ₹${e.amount.toLocaleString()} for ${e.item}. Verify receipt.` }));
            
            // Random duplicate simulation
            if (Math.random() > 0.5) {
                anomalies.push({ id: 999, issue: "Potential duplicate: 'Electricity Bill' logged twice in June." });
            }

            setAuditResults(anomalies);
            setIsAuditing(false);
        }, 2000);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-amber-400 flex items-center">
                        <DollarSignIcon className="w-8 h-8 mr-3 text-green-500" />
                        Financial Intelligence
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Expense tracking, forecasting, and AI auditing.</p>
                </div>
                <div className="flex bg-gray-800 rounded-lg p-1">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'overview' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white'}`}
                    >
                        Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('audit')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'audit' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white'}`}
                    >
                        Smart Audit
                    </button>
                </div>
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Key Stats */}
                    <Card className="lg:col-span-2 bg-gradient-to-r from-gray-800 to-gray-900 border-green-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm font-bold uppercase">Total Spend (This Month)</p>
                                <p className="text-4xl font-bold text-white mt-1">₹{totalExpenses.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center justify-end text-green-400 font-bold mb-1">
                                    <TrendingUpIcon className="w-4 h-4 mr-1" />
                                    <span>Within Budget</span>
                                </div>
                                <p className="text-xs text-gray-500">Target: ₹1,50,000</p>
                            </div>
                        </div>
                    </Card>

                    {/* Breakdown Chart */}
                    <Card title="Expense Breakdown">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={expensesByCategory} 
                                        cx="50%" cy="50%" 
                                        innerRadius={60} outerRadius={100} 
                                        paddingAngle={5} 
                                        dataKey="value"
                                    >
                                        {expensesByCategory.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Transaction List */}
                    <Card title="Recent Transactions" className="overflow-hidden">
                        <div className="overflow-x-auto max-h-[300px]">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-800 sticky top-0">
                                    <tr className="text-gray-400">
                                        <th className="p-3">Item</th>
                                        <th className="p-3">Category</th>
                                        <th className="p-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-300 divide-y divide-gray-700">
                                    {expenses.map(expense => (
                                        <tr key={expense.id} className="hover:bg-gray-700/50">
                                            <td className="p-3">{expense.item}</td>
                                            <td className="p-3"><span className="bg-gray-700 px-2 py-1 rounded text-xs">{expense.category}</span></td>
                                            <td className="p-3 text-right font-mono">₹{expense.amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button className="w-full mt-4 py-2 border border-dashed border-gray-600 text-gray-400 text-sm rounded hover:border-amber-500 hover:text-amber-500 transition-colors">
                            + Add Expense
                        </button>
                    </Card>

                    {/* Forecast */}
                    <Card title="Spend Forecast (AI Projection)" className="lg:col-span-2">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={forecastData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false}/>
                                    <XAxis dataKey="month" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="actual" name="Actual Spend" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="projected" name="Projected (AI)" fill="#3b82f6" radius={[4, 4, 0, 0]} fillOpacity={0.6} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'audit' && (
                <div className="space-y-6">
                    <Card className="bg-gradient-to-r from-gray-900 to-blue-900/20 border-l-4 border-blue-500">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-900/30 rounded-full text-blue-400">
                                    <ShieldCheckIcon className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">AI Financial Auditor</h2>
                                    <p className="text-gray-400 text-sm">Scans transactions for anomalies, duplicates, and budget overruns.</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleRunAudit}
                                disabled={isAuditing}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg flex items-center transition-all disabled:opacity-50"
                            >
                                {isAuditing ? <AutoUpdateIcon className="w-5 h-5 mr-2 animate-spin"/> : <SparkleIcon className="w-5 h-5 mr-2"/>}
                                {isAuditing ? 'Scanning Ledger...' : 'Run Smart Audit'}
                            </button>
                        </div>
                    </Card>

                    {auditResults.length > 0 && (
                        <div className="grid grid-cols-1 gap-4 animate-fade-in">
                            <h3 className="text-red-400 font-bold uppercase text-sm tracking-wider mb-2">Detected Anomalies ({auditResults.length})</h3>
                            {auditResults.map((res, i) => (
                                <div key={i} className="bg-red-900/10 border border-red-500/30 p-4 rounded-lg flex items-start gap-3">
                                    <div className="mt-1 text-red-500"><BotIcon className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-gray-200 font-medium">{res.issue}</p>
                                        <div className="flex gap-3 mt-2">
                                            <button className="text-xs text-blue-400 hover:text-blue-300 font-bold">Investigate</button>
                                            <button className="text-xs text-gray-500 hover:text-gray-400">Ignore</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isAuditing && auditResults.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-xl">
                            <CheckCircleIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500">System Idle. Run an audit to check for issues.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Expenses;
