
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
import { INITIAL_MEMBERS } from '../../constants';
import { getGeminiChatResponse } from '../../lib/gemini';
import { DumbbellIcon } from './icons/DumbbellIcon';

const INITIAL_TEMPLATES: MessageTemplate[] = [
    { id: 't1', name: 'New Year Offer', content: "Happy New Year {{name}}! Get 20% off on renewal this week.", variables: ['name'], category: 'Marketing' },
    { id: 't2', name: 'Payment Reminder', content: "Dear {{name}}, your fee of ₹{{amount}} is pending. Please pay by {{date}}.", variables: ['name', 'amount', 'date'], category: 'Transactional' },
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
    const [activeTab, setActiveTab] = useState<'rules' | 'templates' | 'campaigns' | 'reports' | 'chatbot'>('rules');
    
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

    const renderRulesTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { name: 'Welcome Message', trigger: 'New Member Added', status: true, icon: <UserGroupIcon className="text-green-400 w-6 h-6"/> },
                    { name: 'Fee Reminder', trigger: '3 Days Before Expiry', status: true, icon: <DollarSignIcon className="text-amber-400 w-6 h-6"/> },
                    { name: 'Workout Reminder', trigger: 'Absent > 3 Days', status: true, icon: <DumbbellIcon className="text-indigo-400 w-6 h-6"/> },
                    { name: 'Birthday Wish', trigger: 'On Member Birthday', status: true, icon: <SparkleIcon className="text-pink-400 w-6 h-6"/> },
                    { name: 'Absent Alert', trigger: 'Inactive > 7 Days', status: false, icon: <CalendarIcon className="text-red-400 w-6 h-6"/> },
                    { name: 'Review Request', trigger: '1 Month After Joining', status: false, icon: <SparkleIcon className="text-blue-400 w-6 h-6"/> },
                ].map((rule, idx) => (
                    <Card key={idx} className={`relative overflow-hidden ${rule.status ? 'border-l-4 border-green-500' : 'border-l-4 border-gray-600 opacity-75'}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-800 rounded-lg">{rule.icon}</div>
                                <div>
                                    <h3 className="font-bold text-lg">{rule.name}</h3>
                                    <p className="text-xs text-gray-400">Trigger: {rule.trigger}</p>
                                </div>
                            </div>
                            <div className="form-check form-switch">
                                <input className="form-check-input appearance-none w-9 -ml-10 rounded-full float-left h-5 align-top bg-gray-600 bg-no-repeat bg-contain focus:outline-none cursor-pointer shadow-sm" type="checkbox" role="switch" checked={rule.status} readOnly />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${rule.status ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                                {rule.status ? 'Active' : 'Disabled'}
                            </span>
                            <button className="text-xs text-blue-400 hover:text-blue-300">Configure</button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );

    const renderTemplatesTab = () => (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button onClick={() => { setNewTemplate({}); setIsTemplateModalOpen(true); }} className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 flex items-center">
                    <EditIcon className="w-4 h-4 mr-2" /> Create Template
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(t => (
                    <Card key={t.id} className="relative group">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-white">{t.name}</h4>
                            <span className="text-[10px] bg-gray-700 px-2 py-1 rounded text-gray-300">{t.category}</span>
                        </div>
                        <p className="text-sm text-gray-400 bg-gray-800/50 p-3 rounded italic">"{t.content}"</p>
                        <div className="mt-3 flex gap-2">
                            {t.variables.map((v, i) => <span key={i} className="text-[10px] bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">{`{{${v}}}`}</span>)}
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button className="text-gray-400 hover:text-white"><EditIcon className="w-4 h-4"/></button>
                            <button className="text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );

    const renderCampaignsTab = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div>
                    <h2 className="text-xl font-bold text-white">Campaign Scheduler</h2>
                    <p className="text-sm text-gray-400">Plan your marketing blasts.</p>
                </div>
                <button onClick={() => { setNewCampaign({}); setIsCampaignModalOpen(true); }} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2" /> Schedule New
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-700 text-gray-400 text-sm">
                            <th className="p-3">Campaign Name</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Scheduled For</th>
                            <th className="p-3">Audience</th>
                            <th className="p-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-300">
                        {campaigns.map(c => (
                            <tr key={c.id} className="border-b border-gray-700/50 hover:bg-gray-800/50">
                                <td className="p-3 font-medium">{c.name}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        c.status === 'Completed' ? 'bg-green-900/30 text-green-400' :
                                        c.status === 'Running' ? 'bg-blue-900/30 text-blue-400 animate-pulse' :
                                        'bg-yellow-900/30 text-yellow-400'
                                    }`}>
                                        {c.status}
                                    </span>
                                </td>
                                <td className="p-3 text-sm">{c.scheduledDate} @ {c.scheduledTime}</td>
                                <td className="p-3 text-sm">{c.audience}</td>
                                <td className="p-3">
                                    <button className="text-gray-400 hover:text-white"><EditIcon className="w-4 h-4"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderReportsTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="text-center py-4">
                    <p className="text-xs text-gray-400 uppercase">Sent</p>
                    <p className="text-2xl font-bold text-blue-400">1,240</p>
                </Card>
                <Card className="text-center py-4">
                    <p className="text-xs text-gray-400 uppercase">Delivered</p>
                    <p className="text-2xl font-bold text-green-400">1,215</p>
                </Card>
                <Card className="text-center py-4">
                    <p className="text-xs text-gray-400 uppercase">Read Rate</p>
                    <p className="text-2xl font-bold text-amber-400">88%</p>
                </Card>
                <Card className="text-center py-4">
                    <p className="text-xs text-gray-400 uppercase">Failed</p>
                    <p className="text-2xl font-bold text-red-400">25</p>
                </Card>
            </div>

            <Card title="Detailed Delivery Report">
                <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-800 sticky top-0">
                            <tr className="text-gray-400">
                                <th className="p-3">Time</th>
                                <th className="p-3">Recipient</th>
                                <th className="p-3">Template</th>
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-300">
                            {logs.map(log => (
                                <tr key={log.id} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                                    <td className="p-3 font-mono text-xs text-gray-500">{log.sentAt}</td>
                                    <td className="p-3">
                                        <div>{log.recipientName}</div>
                                        <div className="text-xs text-gray-500">{log.recipientPhone}</div>
                                    </td>
                                    <td className="p-3">{log.templateName}</td>
                                    <td className="p-3">
                                        <span className={`flex items-center font-bold text-xs ${
                                            log.status === 'Read' ? 'text-blue-400' :
                                            log.status === 'Delivered' ? 'text-gray-400' :
                                            log.status === 'Sent' ? 'text-gray-500' : 'text-red-500'
                                        }`}>
                                            {log.status === 'Read' && <span className="mr-1">✓✓</span>}
                                            {log.status === 'Delivered' && <span className="mr-1">✓✓</span>}
                                            {log.status === 'Sent' && <span className="mr-1">✓</span>}
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );

    const handleBotTest = async () => {
        if(!testQuery.trim()) return;
        setIsThinking(true);
        try {
            const response = await getGeminiChatResponse([], testQuery);
            setBotResponse(response);
        } catch(e) {
            setBotResponse("Error communicating with AI agent.");
        } finally {
            setIsThinking(false);
        }
    };

    const renderChatbotTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="AI Agent Configuration">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Bot Name</label>
                        <input type="text" defaultValue="Royal Assistant" className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">System Instruction</label>
                        <textarea 
                            rows={6} 
                            defaultValue="You are a helpful gym assistant for Royal The Gym. You answer questions about membership fees (Basic: 1500, Premium: 5000), timings (6AM - 10PM), and equipment. Be polite and concise."
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" 
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-300">Auto-Reply to Unknown Messages</span>
                        <input type="checkbox" defaultChecked className="w-5 h-5 accent-green-500" />
                    </div>
                    <button className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg">Save Configuration</button>
                </div>
            </Card>
            <Card title="WhatsApp Bot Sandbox">
                <div className="bg-black/30 rounded-lg p-4 h-64 overflow-y-auto mb-4 border border-gray-700 space-y-4">
                    {testQuery && <div className="flex justify-end"><span className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm rounded-br-none">{testQuery}</span></div>}
                    {isThinking && <div className="flex justify-start"><span className="bg-gray-700 text-gray-200 px-3 py-1 rounded-lg text-sm rounded-bl-none animate-pulse">Typing...</span></div>}
                    {botResponse && <div className="flex justify-start"><span className="bg-gray-700 text-gray-200 px-3 py-1 rounded-lg text-sm rounded-bl-none">{botResponse}</span></div>}
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Ask: 'What are the fees?' or 'Who is the trainer?'" 
                        className="flex-1 bg-gray-700 border border-gray-600 rounded p-2 text-white" 
                        value={testQuery}
                        onChange={(e) => setTestQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleBotTest()}
                    />
                    <button onClick={handleBotTest} disabled={isThinking} className="bg-amber-500 text-black px-4 py-2 rounded font-bold">Send</button>
                </div>
            </Card>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-amber-400 flex items-center">
                    <BotIcon />
                    <span className="ml-3">Automation Suite</span>
                </h1>
                <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-xs text-green-400 font-mono">SYSTEM ONLINE</span>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-700 overflow-x-auto">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'rules', label: 'Auto Rules', icon: <AutoUpdateIcon className="w-4 h-4 mr-2"/> },
                        { id: 'templates', label: 'Templates', icon: <EditIcon className="w-4 h-4 mr-2"/> },
                        { id: 'campaigns', label: 'Broadcasts', icon: <WhatsAppIcon className="w-4 h-4 mr-2"/> },
                        { id: 'reports', label: 'Reports & Receipts', icon: <CheckCircleIcon className="w-4 h-4 mr-2"/> },
                        { id: 'chatbot', label: 'Chatbot AI', icon: <BotIcon /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                                activeTab === tab.id
                                    ? 'border-amber-500 text-amber-400'
                                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'rules' && renderRulesTab()}
                {activeTab === 'templates' && renderTemplatesTab()}
                {activeTab === 'campaigns' && renderCampaignsTab()}
                {activeTab === 'reports' && renderReportsTab()}
                {activeTab === 'chatbot' && renderChatbotTab()}
            </div>

            {/* Template Modal */}
            <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title="Create Message Template">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400">Template Name</label>
                        <input type="text" className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" value={newTemplate.name || ''} onChange={e => setNewTemplate({...newTemplate, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">Content (Use {'{{variable}}'} for dynamic data)</label>
                        <textarea rows={4} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" value={newTemplate.content || ''} onChange={e => setNewTemplate({...newTemplate, content: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">Category</label>
                        <select className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" value={newTemplate.category || 'Marketing'} onChange={e => setNewTemplate({...newTemplate, category: e.target.value as any})}>
                            <option>Marketing</option>
                            <option>Transactional</option>
                            <option>Alert</option>
                        </select>
                    </div>
                    <button onClick={() => { 
                        if(newTemplate.name && newTemplate.content) {
                            setTemplates([...templates, { id: `t${Date.now()}`, name: newTemplate.name, content: newTemplate.content, category: newTemplate.category as any || 'Marketing', variables: [] }]);
                            setIsTemplateModalOpen(false);
                        }
                    }} className="w-full bg-amber-500 text-black font-bold py-2 rounded">Save Template</button>
                </div>
            </Modal>

            {/* Campaign Modal */}
            <Modal isOpen={isCampaignModalOpen} onClose={() => setIsCampaignModalOpen(false)} title="Schedule Campaign">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400">Campaign Name</label>
                        <input type="text" className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-400">Date</label>
                            <input type="date" className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Time</label>
                            <input type="time" className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">Template</label>
                        <select className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <button onClick={() => setIsCampaignModalOpen(false)} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded">Schedule Blast</button>
                </div>
            </Modal>
        </div>
    );
};

export default AutomationDashboard;
