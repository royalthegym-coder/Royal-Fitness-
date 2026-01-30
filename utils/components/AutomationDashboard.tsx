
import React, { useState } from 'react';
import Card from './common/Card';
import Modal from './common/Modal';
import { BotIcon } from './icons/BotIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { MessageTemplate, Campaign, MessageLog } from '../../types';
import { getComplexResponse } from '../../lib/gemini';

const INITIAL_TEMPLATES: MessageTemplate[] = [
    { id: 't1', name: 'New Year Offer', content: "Happy New Year {{name}}! Get 20% off on renewal this week.", variables: ['name'], category: 'Marketing' },
    { id: 't2', name: 'Payment Reminder', content: "Dear {{name}}, your fee of ₹{{amount}} is pending. Please pay via this link: {{link}}.", variables: ['name', 'amount', 'link'], category: 'Transactional' },
    { id: 't3', name: 'Gym Closed', content: "Hi {{name}}, Royal The Gym will be closed tomorrow for maintenance.", variables: ['name'], category: 'Alert' },
    { id: 't4', name: 'Workout Reminder', content: "Hey {{name}}, we missed you at the gym! Come crush a workout today.", variables: ['name'], category: 'Transactional' },
];

const INITIAL_CAMPAIGNS: Campaign[] = [
    { id: 'c1', name: 'Diwali Blast', status: 'Completed', scheduledDate: '2023-11-10', scheduledTime: '10:00', templateId: 't1', audience: 'All Members' },
    { id: 'c2', name: 'Weekend Workshop', status: 'Scheduled', scheduledDate: '2024-08-15', scheduledTime: '09:00', templateId: 't3', audience: 'Active Members' },
];

const INITIAL_LOGS: MessageLog[] = [
    { id: 'l1', recipientName: 'Aarav Sharma', recipientPhone: '9876543210', templateName: 'Payment Reminder', sentAt: '2024-08-01 10:05', status: 'Read' },
    { id: 'l2', recipientName: 'Priya Patel', recipientPhone: '9876543211', templateName: 'New Year Offer', sentAt: '2024-08-02 14:30', status: 'Delivered' },
    { id: 'l3', recipientName: 'Rohan Kumar', recipientPhone: '9876543212', templateName: 'Gym Closed', sentAt: '2024-08-03 09:00', status: 'Sent' },
];

const AutomationDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'rules' | 'templates' | 'campaigns' | 'reports'>('rules');
    
    // State for Tabs
    const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
    const [campaigns, setCampaigns] = useState(INITIAL_CAMPAIGNS);
    const [logs] = useState(INITIAL_LOGS);
    
    // Modal States
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState<Partial<MessageTemplate>>({});

    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [newCampaign, setNewCampaign] = useState<Partial<Campaign>>({ status: 'Scheduled' });

    // Chatbot Sandbox State
    const [testQuery, setTestQuery] = useState('');
    const [botResponse, setBotResponse] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    // --- RENDERERS ---

    const renderRulesTab = () => {
        const rules: { name: string; trigger: string; status: boolean; icon: React.ReactNode; note?: string }[] = [
            { name: 'Welcome Message', trigger: 'New Member Added', status: true, icon: <UserGroupIcon className="text-green-400 w-6 h-6"/> },
            { name: 'Fee Reminder (Smart)', trigger: 'Daily (Last 3 Days)', status: true, icon: <DollarSignIcon className="text-amber-400 w-6 h-6"/>, note: "Sends UPI Pay Link automatically" },
            { name: 'Payment Receipt', trigger: 'Upon Payment', status: true, icon: <CheckCircleIcon className="text-blue-400 w-6 h-6"/> },
            { name: 'Birthday Wish', trigger: 'Birthday', status: true, icon: <SparkleIcon className="text-pink-400 w-6 h-6"/> },
            { name: 'Win-back (Inactive)', trigger: 'Absent > 15 Days', status: false, icon: <CalendarIcon className="text-red-400 w-6 h-6"/> },
        ];

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rules.map((rule, idx) => (
                        <Card key={idx} className={`border-l-4 ${rule.status ? 'border-green-500' : 'border-gray-600 opacity-75'}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-800 rounded-lg">{rule.icon}</div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{rule.name}</h4>
                                        <p className="text-xs text-gray-400">{rule.trigger}</p>
                                    </div>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${rule.status ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                            </div>
                            { rule.note && <p className="text-[10px] text-amber-400 mt-2 bg-amber-900/20 px-2 py-1 rounded">{rule.note}</p> }
                        </Card>
                    ))}
                </div>
            </div>
        );
    };

    const renderTemplatesTab = () => (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => setIsTemplateModalOpen(true)} className="bg-amber-500 text-black font-bold py-2 px-4 rounded-lg flex items-center">
                    <span className="text-xl mr-2 leading-none">+</span> New Template
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(template => (
                    <Card key={template.id}>
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-white">{template.name}</h4>
                            <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">{template.category}</span>
                        </div>
                        <p className="text-sm text-gray-400 bg-gray-900 p-3 rounded mb-2 font-mono">"{template.content}"</p>
                        <div className="flex gap-2">
                            {template.variables.map(v => <span key={v} className="text-[10px] bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded">{`{{${v}}}`}</span>)}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );

    const renderCampaignsTab = () => (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => setIsCampaignModalOpen(true)} className="bg-amber-500 text-black font-bold py-2 px-4 rounded-lg flex items-center">
                    <span className="text-xl mr-2 leading-none">+</span> New Campaign
                </button>
            </div>
            <Card>
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-gray-700 text-gray-400">
                            <th className="p-2">Campaign Name</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Scheduled</th>
                            <th className="p-2">Audience</th>
                            <th className="p-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {campaigns.map(c => (
                            <tr key={c.id} className="border-b border-gray-700 last:border-0 hover:bg-gray-800/50">
                                <td className="p-2 font-medium">{c.name}</td>
                                <td className="p-2">
                                    <span className={`px-2 py-1 rounded text-xs ${c.status === 'Completed' ? 'bg-green-900 text-green-400' : c.status === 'Running' ? 'bg-blue-900 text-blue-400' : 'bg-gray-700 text-gray-300'}`}>
                                        {c.status}
                                    </span>
                                </td>
                                <td className="p-2 text-gray-400">{c.scheduledDate} {c.scheduledTime}</td>
                                <td className="p-2">{c.audience}</td>
                                <td className="p-2 text-right">
                                    <button className="text-gray-400 hover:text-white p-1"><EditIcon className="w-4 h-4"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );

    const renderReportsTab = () => (
        <div className="space-y-4">
            <Card title="Message Logs">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-gray-700 text-gray-400">
                            <th className="p-2">Recipient</th>
                            <th className="p-2">Template</th>
                            <th className="p-2">Sent At</th>
                            <th className="p-2">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id} className="border-b border-gray-700 last:border-0 hover:bg-gray-800/50">
                                <td className="p-2 font-medium">
                                    {log.recipientName}
                                    <div className="text-xs text-gray-500">{log.recipientPhone}</div>
                                </td>
                                <td className="p-2">{log.templateName}</td>
                                <td className="p-2 text-gray-400">{log.sentAt}</td>
                                <td className="p-2">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                        log.status === 'Read' ? 'bg-blue-900 text-blue-400' :
                                        log.status === 'Delivered' ? 'bg-green-900 text-green-400' :
                                        log.status === 'Failed' ? 'bg-red-900 text-red-400' : 'bg-gray-700 text-gray-300'
                                    }`}>
                                        {log.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );

    const handleBotTest = async () => {
        if(!testQuery.trim()) return;
        setIsThinking(true);
        setBotResponse('');
        const prompt = `Act as the Royal The Gym WhatsApp Bot. Answer this user query concisely: "${testQuery}"`;
        try {
            const result = await getComplexResponse(prompt);
            setBotResponse(result);
        } catch (error) {
            setBotResponse("Error: Could not reach AI.");
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold text-amber-400 flex items-center">
                    <AutoUpdateIcon className="w-8 h-8 mr-3 text-green-400" />
                    Automation & Campaigns
                </h1>
            </div>

            <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg w-full md:w-auto inline-flex overflow-x-auto">
                {['rules', 'templates', 'campaigns', 'reports'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-amber-500 text-gray-900 shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'rules' && renderRulesTab()}
            {activeTab === 'templates' && renderTemplatesTab()}
            {activeTab === 'campaigns' && renderCampaignsTab()}
            {activeTab === 'reports' && renderReportsTab()}

            <div className="mt-8 border-t border-gray-700 pt-6">
                <h3 className="text-lg font-bold text-gray-300 mb-4 flex items-center">
                    <BotIcon className="w-5 h-5 mr-2 text-purple-400" /> 
                    AI Chatbot Sandbox
                </h3>
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <textarea 
                            value={testQuery}
                            onChange={e => setTestQuery(e.target.value)}
                            placeholder="Test message (e.g., 'What are the timings?')"
                            className="w-full bg-gray-900 text-white rounded-lg p-3 border border-gray-600 focus:border-purple-500 outline-none h-32"
                        />
                        <button 
                            onClick={handleBotTest}
                            disabled={isThinking}
                            className="mt-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold text-sm w-full flex items-center justify-center disabled:opacity-50"
                        >
                            {isThinking ? <AutoUpdateIcon className="w-4 h-4 mr-2 animate-spin"/> : 'Test Response'}
                        </button>
                    </div>
                    <div className="flex-1 bg-black/40 rounded-lg p-3 border border-gray-600 font-mono text-sm text-green-400 overflow-y-auto h-32">
                        {botResponse || <span className="text-gray-600">// Bot response will appear here...</span>}
                    </div>
                </div>
            </div>

            {/* Template Modal */}
            <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title="Create Template">
                <div className="space-y-4">
                    <input type="text" placeholder="Template Name" className="w-full bg-gray-700 rounded p-2 text-white" value={newTemplate.name || ''} onChange={e => setNewTemplate({...newTemplate, name: e.target.value})} />
                    <textarea placeholder="Content (use {{variable}})" className="w-full bg-gray-700 rounded p-2 text-white h-24" value={newTemplate.content || ''} onChange={e => setNewTemplate({...newTemplate, content: e.target.value})} />
                    <button className="bg-amber-500 text-black font-bold py-2 px-4 rounded w-full">Save Template</button>
                </div>
            </Modal>

             {/* Campaign Modal */}
             <Modal isOpen={isCampaignModalOpen} onClose={() => setIsCampaignModalOpen(false)} title="Schedule Campaign">
                <div className="space-y-4">
                    <input type="text" placeholder="Campaign Name" className="w-full bg-gray-700 rounded p-2 text-white" value={newCampaign.name || ''} onChange={e => setNewCampaign({...newCampaign, name: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <input type="date" className="bg-gray-700 rounded p-2 text-white" value={newCampaign.scheduledDate || ''} onChange={e => setNewCampaign({...newCampaign, scheduledDate: e.target.value})} />
                        <input type="time" className="bg-gray-700 rounded p-2 text-white" value={newCampaign.scheduledTime || ''} onChange={e => setNewCampaign({...newCampaign, scheduledTime: e.target.value})} />
                    </div>
                    <button className="bg-amber-500 text-black font-bold py-2 px-4 rounded w-full">Schedule</button>
                </div>
            </Modal>
        </div>
    );
};

export default AutomationDashboard;
