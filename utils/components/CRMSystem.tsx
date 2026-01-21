import React, { useState, useMemo, useEffect } from 'react';
import Card from './common/Card';
import { INITIAL_LEADS } from '../../constants';
import { Lead, CRMWorkflow } from '../../types';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { getComplexResponse } from '../../lib/gemini';

// Mock Workflows
const INITIAL_WORKFLOWS: CRMWorkflow[] = [
    { id: 'wf1', name: 'Lead Nurture Sequence', trigger: 'New Lead Added', action: 'Send Welcome -> Wait 2 Days -> Send Offer', status: 'Active', stats: { runs: 45, successRate: 98 } },
    { id: 'wf2', name: 'Membership Renewal Chaser', trigger: 'Expiry - 3 Days', action: 'Send Payment Link -> Wait 1 Day -> Call Alert', status: 'Active', stats: { runs: 120, successRate: 100 } },
    { id: 'wf3', name: 'Absentee Re-engagement', trigger: 'No Visit > 10 Days', action: 'Send "We Miss You" + 10% Off Voucher', status: 'Active', stats: { runs: 15, successRate: 92 } },
    { id: 'wf4', name: 'Birthday Delight', trigger: 'Birthday = Today', action: 'Send Greeting + Free Protein Shake Coupon', status: 'Active', stats: { runs: 8, successRate: 100 } },
];

const PipelineColumn: React.FC<{ title: string; leads: Lead[]; color: string }> = ({ title, leads, color }) => (
    <div className="flex-1 min-w-[250px] bg-gray-800/50 rounded-lg p-3 border border-gray-700">
        <div className={`flex justify-between items-center mb-3 pb-2 border-b border-gray-700 ${color}`}>
            <h4 className="font-bold text-sm uppercase tracking-wider">{title}</h4>
            <span className="bg-gray-700 text-xs px-2 py-1 rounded-full">{leads.length}</span>
        </div>
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {leads.map(lead => (
                <div key={lead.id} className="bg-gray-700 p-3 rounded shadow-sm hover:shadow-md transition-shadow border border-gray-600 cursor-move relative group">
                    <div className="flex justify-between items-start">
                        <h5 className="font-semibold text-white">{lead.name}</h5>
                        <button className="text-gray-400 hover:text-green-400">
                            <WhatsAppIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{lead.source}</p>
                    <p className="text-xs text-gray-500 mt-2">Added: {lead.inquiryDate}</p>
                </div>
            ))}
        </div>
    </div>
);

const CRMSystem: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'pipeline' | 'workflows' | 'intelligence'>('pipeline');
    const [leads] = useState<Lead[]>(INITIAL_LEADS as Lead[]);
    const [workflows] = useState<CRMWorkflow[]>(INITIAL_WORKFLOWS);
    const [systemLog, setSystemLog] = useState<string[]>([]);
    
    const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
    const [isThinking, setIsThinking] = useState(false);

    const leadsByStage = useMemo(() => ({
        'New': leads.filter(l => l.status === 'New'),
        'Contacted': leads.filter(l => l.status === 'Contacted'),
        'Trial': leads.filter(l => l.status === 'Trial'),
        'Converted': leads.filter(l => l.status === 'Converted'),
        'Lost': leads.filter(l => l.status === 'Lost'),
    }), [leads]);

    useEffect(() => {
        const interval = setInterval(() => {
            const actions = ["Checking payment dues...", "Scanning leads...", "Syncing Facebook Leads..."];
            if (Math.random() > 0.7) {
                setSystemLog(prev => [`[${new Date().toLocaleTimeString()}] AUTO: ${actions[Math.floor(Math.random() * actions.length)]}`, ...prev].slice(0, 5));
            }
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleRunAIAnalysis = async () => {
        setIsThinking(true);
        try {
            const result = await getComplexResponse("Analyze CRM leads and provide conversion tips.");
            setAiSuggestions(result);
        } catch (e) { console.error(e); } finally { setIsThinking(false); }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-amber-400 flex items-center"><SparkleIcon className="mr-3" /> Royal CRM</h1>
            <div className="flex gap-4 border-b border-gray-700">
                <button onClick={() => setActiveTab('pipeline')} className={`pb-2 px-4 ${activeTab === 'pipeline' ? 'border-b-2 border-amber-500 text-amber-500' : 'text-gray-400'}`}>Pipeline</button>
                <button onClick={() => setActiveTab('workflows')} className={`pb-2 px-4 ${activeTab === 'workflows' ? 'border-b-2 border-amber-500 text-amber-500' : 'text-gray-400'}`}>Workflows</button>
                <button onClick={() => setActiveTab('intelligence')} className={`pb-2 px-4 ${activeTab === 'intelligence' ? 'border-b-2 border-amber-500 text-amber-500' : 'text-gray-400'}`}>Intelligence</button>
            </div>
            {activeTab === 'pipeline' && (
                <div className="flex gap-4 overflow-x-auto pb-4">
                    <PipelineColumn title="New" leads={leadsByStage.New} color="text-blue-400" />
                    <PipelineColumn title="Contacted" leads={leadsByStage.Contacted} color="text-yellow-400" />
                    <PipelineColumn title="Trial" leads={leadsByStage.Trial} color="text-purple-400" />
                    <PipelineColumn title="Converted" leads={leadsByStage.Converted} color="text-green-400" />
                </div>
            )}
            {activeTab === 'workflows' && (
                <div className="space-y-4">
                    {workflows.map(wf => (
                        <Card key={wf.id}>
                            <h3 className="font-bold">{wf.name}</h3>
                            <p className="text-sm text-gray-400">{wf.trigger} -> {wf.action}</p>
                        </Card>
                    ))}
                </div>
            )}
            {activeTab === 'intelligence' && (
                <Card>
                    <button onClick={handleRunAIAnalysis} className="bg-amber-500 text-black font-bold p-2 rounded">{isThinking ? 'Analyzing...' : 'Analyze Pipeline'}</button>
                    {aiSuggestions && <div className="mt-4 prose prose-invert">{aiSuggestions}</div>}
                </Card>
            )}
        </div>
    );
};

export default CRMSystem;