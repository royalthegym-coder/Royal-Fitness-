
import React, { useState, useMemo, useEffect } from 'react';
import Card from './common/Card';
import Modal from './common/Modal';
import { INITIAL_LEADS, INITIAL_MEMBERS } from '../../constants';
import { Lead, CRMWorkflow, LeadStage } from '../../types';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { getComplexResponse } from '../../lib/gemini';
import { sendWhatsAppMessage } from '../../lib/whatsapp';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { BotIcon } from './icons/BotIcon';

// Mock Workflows
const INITIAL_WORKFLOWS: CRMWorkflow[] = [
    { id: 'wf1', name: 'Lead Nurture Sequence', trigger: 'New Lead Added', action: 'Send Welcome -> Wait 2 Days -> Send Offer', status: 'Active', stats: { runs: 45, successRate: 98 } },
    { id: 'wf2', name: 'Membership Renewal Chaser', trigger: 'Expiry - 3 Days', action: 'Send Payment Link -> Wait 1 Day -> Call Alert', status: 'Active', stats: { runs: 120, successRate: 100 } },
    { id: 'wf3', name: 'Absentee Re-engagement', trigger: 'No Visit > 10 Days', action: 'Send "We Miss You" + 10% Off Voucher', status: 'Active', stats: { runs: 15, successRate: 92 } },
    { id: 'wf4', name: 'Birthday Delight', trigger: 'Birthday = Today', action: 'Send Greeting + Free Protein Shake Coupon', status: 'Active', stats: { runs: 8, successRate: 100 } },
];

const PipelineColumn: React.FC<{ title: string; leads: Lead[]; color: string; onAiSuggest: (lead: Lead) => void }> = ({ title, leads, color, onAiSuggest }) => (
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
                        <div className="flex gap-1">
                             <button 
                                onClick={() => onAiSuggest(lead)}
                                className="text-gray-400 hover:text-amber-400 p-1 transition-colors"
                                title="Generate AI Follow-up"
                            >
                                <SparkleIcon className="w-4 h-4" />
                            </button>
                            <button className="text-gray-400 hover:text-green-400 p-1 transition-colors">
                                <WhatsAppIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{lead.source}</p>
                    <p className="text-xs text-gray-500 mt-2">Added: {lead.inquiryDate}</p>
                    {lead.lastContactDate && (
                        <p className="text-[10px] text-blue-400 mt-1">Last Contact: {lead.lastContactDate}</p>
                    )}
                    
                    {/* Simulated Automation Indicator */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                         <span className="flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                    </div>
                </div>
            ))}
            {leads.length === 0 && <p className="text-xs text-gray-500 text-center py-4">No leads</p>}
        </div>
    </div>
);

const CRMSystem: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'pipeline' | 'workflows' | 'intelligence'>('pipeline');
    const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS as Lead[]); // Cast for compatibility
    const [workflows, setWorkflows] = useState<CRMWorkflow[]>(INITIAL_WORKFLOWS);
    const [systemLog, setSystemLog] = useState<string[]>([]);
    
    // AI Intelligence State
    const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
    const [isThinking, setIsThinking] = useState(false);

    // AI Follow-up Modal State
    const [selectedLeadForAi, setSelectedLeadForAi] = useState<Lead | null>(null);
    const [aiMessageSuggestion, setAiMessageSuggestion] = useState('');
    const [aiMessageOptions, setAiMessageOptions] = useState<string[]>([]);
    const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);

    // Group leads by stage
    const leadsByStage = useMemo(() => {
        return {
            'New': leads.filter(l => l.status === 'New'),
            'Contacted': leads.filter(l => l.status === 'Contacted'),
            'Trial': leads.filter(l => l.status === 'Trial'),
            'Converted': leads.filter(l => l.status === 'Converted'),
            'Lost': leads.filter(l => l.status === 'Lost'),
        };
    }, [leads]);

    // Simulated Auto-Run Effect
    useEffect(() => {
        const interval = setInterval(() => {
            const actions = [
                "Checking payment dues...",
                "Scanning for missed workouts...",
                "Syncing leads from Facebook...",
                "Sending scheduled follow-up to Amit...",
                "Updating pipeline status..."
            ];
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            
            if (Math.random() > 0.7) {
                const time = new Date().toLocaleTimeString();
                setSystemLog(prev => [`[${time}] AUTO: ${randomAction}`, ...prev].slice(0, 5));
            }
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleRunAIAnalysis = async () => {
        setIsThinking(true);
        setAiSuggestions(null);
        
        const prompt = `
            Analyze this CRM data for "Royal The Gym".
            Leads: ${JSON.stringify(leads.map(l => ({name: l.name, status: l.status, source: l.source})))}
            Workflows: ${JSON.stringify(workflows.map(w => w.name))}
            
            Provide 3 actionable insights to improve conversion rates and 1 suggestion for a new automated workflow.
            Format as Markdown.
        `;

        try {
            const result = await getComplexResponse(prompt);
            setAiSuggestions(result);
        } catch (e) {
            console.error(e);
        } finally {
            setIsThinking(false);
        }
    };

    const handleGenerateFollowUp = async (lead: Lead) => {
        setSelectedLeadForAi(lead);
        setAiMessageSuggestion('');
        setAiMessageOptions([]);
        setIsGeneratingSuggestion(true);

        const prompt = `
            Act as a sales representative for "Royal The Gym".
            Generate 3 distinct WhatsApp follow-up messages for a lead with these details:
            
            Lead Name: ${lead.name}
            Source: ${lead.source}
            Current Stage: ${lead.status}
            Last Contact: ${lead.lastContactDate || 'Never'}
            
            Create 3 variations:
            1. Friendly & Casual (welcoming tone)
            2. Benefit-Focused (highlighting results/value)
            3. Direct/Urgent (limited offer or call to action)

            Keep each under 50 words. Do not include placeholders like [Your Name], sign off as "Royal Gym Team".
            
            Return ONLY a JSON array of strings containing the 3 messages. 
            Example format: ["Message 1", "Message 2", "Message 3"]
            Do not include any markdown formatting or explanation.
        `;

        try {
            let result = await getComplexResponse(prompt);
            // Cleanup in case of markdown block
            result = result.replace(/```json/g, '').replace(/```/g, '').trim();
            
            let options: string[] = [];
            try {
                options = JSON.parse(result);
            } catch (e) {
                // Fallback if not valid JSON array
                options = [result];
            }

            if (Array.isArray(options) && options.length > 0) {
                setAiMessageOptions(options);
                setAiMessageSuggestion(options[0]);
            } else {
                setAiMessageSuggestion("Could not generate multiple options. Please try again.");
            }
        } catch (e) {
            console.error(e);
            setAiMessageSuggestion("Sorry, I couldn't generate a message right now.");
        } finally {
            setIsGeneratingSuggestion(false);
        }
    };

    const handleSendSuggestion = async () => {
        if (!selectedLeadForAi) return;
        
        // In a real app, this would use sendWhatsAppMessage from lib/whatsapp
        // For now we simulate the send action
        
        const mobileNumber = selectedLeadForAi.phone;
        
        // Simulating API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        alert(`Message sent to ${selectedLeadForAi.name} (${mobileNumber}) via WhatsApp Business API:\n\n"${aiMessageSuggestion}"`);
        
        // Update last contact date
        setLeads(prev => prev.map(l => l.id === selectedLeadForAi.id ? { ...l, lastContactDate: new Date().toISOString().split('T')[0] } : l));
        
        setSelectedLeadForAi(null);
    };

    const toggleWorkflow = (id: string) => {
        setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: w.status === 'Active' ? 'Paused' : 'Active' } : w));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-amber-400 flex items-center">
                        <SparkleIcon className="w-8 h-8 mr-3 text-cyan-400" />
                        Royal Smart CRM
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Fully automated customer lifecycle management.</p>
                </div>
                
                {/* System Pulse Indicator */}
                <div className="bg-gray-800 border border-gray-700 rounded-full px-4 py-1.5 flex items-center shadow-lg">
                    <div className="relative flex h-3 w-3 mr-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </div>
                    <span className="text-xs font-mono text-green-400 uppercase">System Active • Processing Events</span>
                </div>
            </div>

            {/* Navigation */}
            <div className="border-b border-gray-700">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('pipeline')} className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'pipeline' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
                        <UserGroupIcon className="w-4 h-4 mr-2" /> Pipeline Board
                    </button>
                    <button onClick={() => setActiveTab('workflows')} className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'workflows' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
                        <AutoUpdateIcon className="w-4 h-4 mr-2" /> Auto-Workflows
                    </button>
                    <button onClick={() => setActiveTab('intelligence')} className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'intelligence' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
                        <SparkleIcon className="w-4 h-4 mr-2" /> AI Intelligence
                    </button>
                </nav>
            </div>

            {/* Content: Pipeline */}
            {activeTab === 'pipeline' && (
                <div className="h-[calc(100vh-250px)] min-h-[500px] overflow-x-auto">
                    <div className="flex gap-4 h-full min-w-[1200px]">
                        <PipelineColumn title="New Leads" leads={leadsByStage['New']} color="text-blue-400" onAiSuggest={handleGenerateFollowUp} />
                        <PipelineColumn title="Contacted" leads={leadsByStage['Contacted']} color="text-yellow-400" onAiSuggest={handleGenerateFollowUp} />
                        <PipelineColumn title="Trial" leads={leadsByStage['Trial']} color="text-purple-400" onAiSuggest={handleGenerateFollowUp} />
                        <PipelineColumn title="Converted" leads={leadsByStage['Converted']} color="text-green-400" onAiSuggest={handleGenerateFollowUp} />
                        <PipelineColumn title="Lost" leads={leadsByStage['Lost']} color="text-red-400" onAiSuggest={handleGenerateFollowUp} />
                    </div>
                </div>
            )}

            {/* Content: Workflows */}
            {activeTab === 'workflows' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        {workflows.map(wf => (
                            <Card key={wf.id} className={`transition-all ${wf.status === 'Paused' ? 'opacity-75 grayscale' : 'border-l-4 border-green-500'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{wf.name}</h3>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                                            <span className="flex items-center bg-gray-700 px-2 py-1 rounded">
                                                <span className="text-amber-400 mr-2">IF:</span> {wf.trigger}
                                            </span>
                                            <span className="text-gray-600">➔</span>
                                            <span className="flex items-center bg-gray-700 px-2 py-1 rounded">
                                                <span className="text-blue-400 mr-2">DO:</span> {wf.action}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <label className="inline-flex relative items-center cursor-pointer">
                                            <input type="checkbox" checked={wf.status === 'Active'} onChange={() => toggleWorkflow(wf.id)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                        </label>
                                        <span className="text-xs text-gray-500">{wf.stats.runs} Runs | {wf.stats.successRate}% Success</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                    
                    {/* Live System Log */}
                    <Card title="System Activity Log" className="bg-black/20 border-gray-700">
                        <div className="space-y-2 font-mono text-xs max-h-[400px] overflow-y-auto">
                            {systemLog.map((log, i) => (
                                <div key={i} className="text-green-400 border-b border-gray-800 pb-1">{log}</div>
                            ))}
                            <div className="text-gray-500 italic">Listening for triggers...</div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Content: Intelligence */}
            {activeTab === 'intelligence' && (
                <div className="space-y-6">
                    <Card className="bg-gradient-to-r from-gray-900 to-indigo-900/30 border-indigo-500/30">
                        <div className="text-center py-8">
                            <SparkleIcon className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">Gemini CRM Strategist</h2>
                            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
                                Analyzing lead behavior, conversion velocity, and engagement patterns to optimize your sales funnel automatically.
                            </p>
                            <button 
                                onClick={handleRunAIAnalysis}
                                disabled={isThinking}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 disabled:opacity-50 flex items-center mx-auto"
                            >
                                {isThinking ? <AutoUpdateIcon className="w-5 h-5 mr-2 animate-spin"/> : <SparkleIcon className="w-5 h-5 mr-2"/>}
                                {isThinking ? 'Analyzing Data...' : 'Generate Strategic Insights'}
                            </button>
                        </div>
                    </Card>

                    {aiSuggestions && (
                        <div className="grid grid-cols-1 gap-6 animate-fade-in">
                            <Card title="Strategic Insights">
                                <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: aiSuggestions.replace(/\n/g, '<br />') }} />
                            </Card>
                        </div>
                    )}
                </div>
            )}

            {/* AI Suggestion Modal */}
            <Modal isOpen={!!selectedLeadForAi} onClose={() => setSelectedLeadForAi(null)} title={`AI Follow-up: ${selectedLeadForAi?.name}`}>
                <div className="space-y-4">
                    {isGeneratingSuggestion ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <SparkleIcon className="w-10 h-10 text-amber-400 animate-spin mb-3" />
                            <p className="text-gray-300 animate-pulse">Drafting personalized message strategies...</p>
                        </div>
                    ) : (
                        <>
                            {aiMessageOptions.length > 0 && (
                                <div className="grid grid-cols-1 gap-3 mb-4">
                                    <label className="block text-sm font-bold text-gray-300">Choose a Strategy:</label>
                                    {aiMessageOptions.map((opt, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => setAiMessageSuggestion(opt)}
                                            className={`p-3 rounded-lg border cursor-pointer text-sm transition-all hover:scale-[1.01] ${
                                                aiMessageSuggestion === opt 
                                                ? 'bg-amber-900/30 border-amber-500 text-white ring-1 ring-amber-500' 
                                                : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600'
                                            }`}
                                        >
                                            <span className="text-xs text-gray-500 font-bold uppercase mb-1 block">Option {idx + 1}</span>
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Edit Message</label>
                                <textarea 
                                    className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm focus:border-amber-500 outline-none"
                                    rows={4}
                                    value={aiMessageSuggestion}
                                    onChange={(e) => setAiMessageSuggestion(e.target.value)}
                                />
                            </div>
                            <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30 text-xs text-blue-300">
                                <p><strong>Context used:</strong> Source ({selectedLeadForAi?.source}), Stage ({selectedLeadForAi?.status}), Last Contact ({selectedLeadForAi?.lastContactDate || 'None'})</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button 
                                    onClick={() => setSelectedLeadForAi(null)} 
                                    className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSendSuggestion}
                                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold flex items-center"
                                >
                                    <WhatsAppIcon className="w-4 h-4 mr-2" /> Send via WhatsApp
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default CRMSystem;
