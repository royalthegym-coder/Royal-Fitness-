
import React, { useState, useMemo } from 'react';
import Card from './common/Card';
import { INITIAL_INVOICES, INITIAL_MEMBERS, INITIAL_PACKAGES } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import { getComplexResponse } from '../lib/gemini';
import { SparkleIcon } from './icons/SparkleIcon';
import CustomTooltip from './common/CustomTooltip';

const Reports: React.FC = () => {
    const [aiSummary, setAiSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const monthlyRevenueData = useMemo(() => {
        const months: { [key: string]: number } = {};
        INITIAL_INVOICES.filter(i => i.status === 'Paid').forEach(invoice => {
            const month = new Date(invoice.date).toLocaleString('default', { month: 'short', year: 'numeric' });
            months[month] = (months[month] || 0) + invoice.amount;
        });
        return Object.entries(months).map(([name, revenue]) => ({ name, revenue })).reverse();
    }, []);

    const packagePopularityData = useMemo(() => {
        const packageCounts: { [key: string]: number } = {};
        INITIAL_MEMBERS.forEach(member => {
            const pkg = INITIAL_PACKAGES.find(p => p.id === member.packageId);
            if (pkg) {
                packageCounts[pkg.name] = (packageCounts[pkg.name] || 0) + 1;
            }
        });
        return Object.entries(packageCounts).map(([name, value]) => ({ name, value }));
    }, []);

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

            Total Members: ${INITIAL_MEMBERS.length}
            Total Paid Invoices: ${INITIAL_INVOICES.filter(i => i.status === 'Paid').length}
        `;

        const summary = await getComplexResponse(promptData);
        setAiSummary(summary);
        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <Card title="AI-Powered Business Summary">
                <button
                    onClick={handleGenerateSummary}
                    disabled={isLoading}
                    className="w-full bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors disabled:bg-gray-600 flex items-center justify-center"
                >
                    <SparkleIcon className="w-5 h-5 mr-2" />
                    {isLoading ? 'Generating Analysis...' : 'Generate AI Summary'}
                </button>
                {aiSummary && (
                    <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                         <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\n/g, '<br />') }} />
                    </div>
                )}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Monthly Revenue">
                    <div className="h-[400px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyRevenueData}>
                                <XAxis dataKey="name" stroke="currentColor" className="text-xs" />
                                <YAxis stroke="currentColor" className="text-xs" />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(125, 125, 125, 0.1)' }} />
                                <Legend />
                                <Bar dataKey="revenue" name="Revenue (₹)" fill="#fbbf24" activeBar={<rect fill="#f59e0b" />} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card title="Package Popularity">
                    <div className="h-[400px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={packagePopularityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                    {packagePopularityData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Reports;
