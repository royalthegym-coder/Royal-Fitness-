import React, { useState, useMemo, useEffect } from 'react';
import Card from './common/Card';
import { INITIAL_MEMBERS, INITIAL_BROADCASTS, GYM_INFO } from '../../constants';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { BroadcastMessage } from '../../types';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { sendWhatsAppMessage, runDailyAutomations } from '../../lib/whatsapp';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { BotIcon } from './icons/BotIcon';
import { getComplexResponse } from '../../lib/gemini';
import { DumbbellIcon } from './icons/DumbbellIcon';

type Tab = 'agent' | 'broadcast' | 'automations' | 'settings';

// --- NEW COMPONENT: AI Agent Console ---
const AIAgentConsole: React.FC = () => {
    const [incomingMessages, setIncomingMessages] = useState<any[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [isAgentActive, setIsAgentActive] = useState(false);

    // Simulate incoming messages stream
    useEffect(() => {
        if (!isAgentActive) return;

        const interval = setInterval(() => {
            const randomMember = INITIAL_MEMBERS[Math.floor(Math.random() * INITIAL_MEMBERS.length)];
            const intents = [
                { text: "What is the fee for 3 months?", intent: "enquiry" },
                { text: "I'll be late for the 6 PM class.", intent: "notification" },
                { text: "Send me my diet plan pdf.", intent: "request" },
                { text: "Gym open today?", intent: "enquiry" }
            ];
            const msg = intents[Math.floor(Math.random() * intents.length)];
            
            const newMessage = {
                id: Date.now(),
                from: randomMember.name,
                phone: randomMember.phone,
                text: msg.text,
                intent: msg.intent,
                timestamp: new Date().toLocaleTimeString(),
                status: 'processing'
            };

            setIncomingMessages(prev => [newMessage, ...prev].slice(0, 5));
            processMessage(newMessage);

        }, 5000);

        return () => clearInterval(interval);
    }, [isAgentActive]);

    const processMessage = async (msg: any) => {
        setLogs(prev => [`[RECEIVE] New msg from ${msg.from}: "${msg.text}"`, ...prev]);
        
        // Simulate AI Thinking Delay
        await new Promise(r => setTimeout(r, 1500));
        
        let action = "";
        let reply = "";

        if (msg.intent === 'enquiry') {
            action = "Fetching Info...";
            reply = "Hi! Our 3-month package is ₹5000. Gym is open 5AM-10PM.";
        } else if (msg.intent === 'notification') {
            action = "Updating Schedule...";
            reply = "Noted! See you then.";
        } else {
            action = "Generating Doc...";
            reply = "Sure, generating your diet plan now...";
        }

        setLogs(prev => [`[AI CORE] Intent: ${msg.intent} | Action: ${action}`, ...prev]);
        
        await new Promise(r => setTimeout(r, 1500));
        
        setLogs(prev => [`[WHATSAPP API] Sent Reply: "${reply}"`, ...prev]);
        
        // Update message status in UI
        setIncomingMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'replied', reply } : m));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <Card className="bg-gradient-to-r from-gray-900 to-green-900/30 border-green-500/30">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-full ${isAgentActive ? 'bg-green-500 animate-pulse' : 'bg-gray-700'}`}>
                                <BotIcon className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Neural Agent Status</h2>
                                <p className="text-sm text-gray-400">
                                    {isAgentActive ? 'Online • Listening on Port 443' : 'Offline • AI Standby'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsAgentActive(!isAgentActive)}
                            className={`px-6 py-3 rounded-lg font-bold transition-all ${isAgentActive ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                        >
                            {isAgentActive ? 'STOP AGENT' : 'ACTIVATE OS'}
                        </button>
                    </div>
                </Card>

                <Card title="Live Message Stream">
                    <div className="space-y-3">
                        {incomingMessages.length === 0 && <p className="text-gray-500 text-center py-4">Waiting for incoming messages...</p>}
                        {incomingMessages.map(msg => (
                            <div key={msg.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700 animate-fade-in">
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-green-400 text-sm">{msg.from}</span>
                                    <span className="text-xs text-gray-500">{msg.timestamp}</span>
                                </div>
                                <p className="text-gray-300 text-sm mb-2">"{msg.text}"</p>
                                {msg.status === 'processing' ? (
                                    <div className="flex items-center text-xs text-amber-400">
                                        <SparkleIcon className="w-3 h-3 mr-1 animate-spin" /> AI Analyzing...
                                    </div>
                                ) : (
                                    <div className="bg-green-900/20 p-2 rounded border border-green-500/20">
                                        <p className="text-xs text-green-300 font-mono">🤖 BOT: {msg.reply}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="h-full">
                <Card title="System Kernel Log" className="h-full flex flex-col bg-black border-gray-700">
                    <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 p-2 custom-scrollbar">
                        {logs.map((log, i) => (
                            <div key={i} className="border-b border-gray-800 pb-1 text-green-400 break-all">
                                <span className="text-gray-600 mr-2">{'>'}</span>{log}
                            </div>
                        ))}
                        {logs.length === 0 && <span className="text-gray-600">System initialized. Waiting for events...</span>}
                    </div>
                </Card>
            </div>
        </div>
    );
};

// --- UPDATED SMART AUTOMATION COMPONENT ---

interface AutomationLogEntry {
    id: number;
    timestamp: string;
    action: string;
    details: string;
    status: 'Success' | 'Processing';
}

const SmartAutomations: React.FC = () => {
    const [isAutoPilot, setIsAutoPilot] = useState(false);
    const [logs, setLogs] = useState<AutomationLogEntry[]>([]);
    const [activeScan, setActiveScan] = useState<string | null>(null);

    // Simulate Autonomous AI Behavior
    useEffect(() => {
        if (!isAutoPilot) {
            setActiveScan(null);
            return;
        }

        const activities = [
            { type: 'Retention Scan', detail: 'Analyzing 200 members for churn risk...' },
            { type: 'Revenue Boost', detail: 'Identifying upsell opportunities for expired plans...' },
            { type: 'Engagement Check', detail: 'Finding members with 0 attendance this week...' },
            { type: 'Performance Optimization', detail: 'Reviewing message open rates...' }
        ];

        const interval = setInterval(async () => {
            // 1. Pick a random activity
            const activity = activities[Math.floor(Math.random() * activities.length)];
            setActiveScan(activity.type);

            // 2. Add "Processing" log
            const procId = Date.now();
            // FIX: Explicitly type the new log object to satisfy the strict 'status' type.
            const newLogEntry: AutomationLogEntry = {
                id: procId,
                timestamp: new Date().toLocaleTimeString(),
                action: activity.type,
                details: activity.detail,
                status: 'Processing'
            };
            setLogs(prev => [newLogEntry, ...prev].slice(0, 10));

            // 3. Simulate work duration
            await new Promise(r => setTimeout(r, 2000));

            // 4. Generate AI result (Simulated or via Gemini)
            let resultDetail = "";
            if (activity.type === 'Retention Scan') {
                const member = INITIAL_MEMBERS[Math.floor(Math.random() * INITIAL_MEMBERS.length)];
                resultDetail = `Identified ${member.name} (Risk: High). Scheduled 'We Miss You' sequence.`;
            } else if (activity.type === 'Revenue Boost') {
                resultDetail = "Found 3 potential renewals. Generated 10% discount codes.";
            } else if (activity.type === 'Engagement Check') {
                resultDetail = "Sent 5 motivational quotes to low-attendance group.";
            } else {
                resultDetail = "Optimized send times for max read rate (98%).";
            }

            // 5. Update log to Success
            setLogs(prev => prev.map(l => l.id === procId ? { ...l, status: 'Success', details: resultDetail } : l));
            setActiveScan(null);

        }, 5000);

        return () => clearInterval(interval);
    }, [isAutoPilot]);

    const triggers = [
        { id: 1, name: 'Smart Retention', description: 'AI detects drop-off patterns and sends hyper-personalized re-engagement messages.', status: true, icon: <UserGroupIcon className="text-blue-400 w-6 h-6"/> },
        { id: 2, name: 'Dynamic Fee Recovery', description: 'Uses sentiment analysis to send polite but firm payment reminders at optimal times.', status: true, icon: <DollarSignIcon className="text-green-400 w-6 h-6"/> },
        { id: 3, name: 'Celebration Engine', description: 'Auto-generates unique birthday & milestone wishes with generated images.', status: true, icon: <SparkleIcon className="text-pink-400 w-6 h-6"/> },
        { id: 4, name: 'Win-Back Sequence', description: 'Autonomous 3-step message sequence to recover lost leads.', status: false, icon: <CalendarIcon className="text-red-400 w-6 h-6"/> },
    ];

    return (
        <div className="space-y-6">
            {/* Header / Control */}
            <Card className={`relative overflow-hidden transition-colors duration-500 ${isAutoPilot ? 'bg-gradient-to-r from-gray-900 to-indigo-900/40 border-indigo-500' : 'bg-gray-800 border-gray-700'}`}>
                <div className="flex flex-col md:flex-row justify-between items-center relative z-10">
                    <div className="mb-4 md:mb-0">
                        <h2 className="text-2xl font-bold text-white flex items-center">
                            <BotIcon className={`w-8 h-8 mr-3 ${isAutoPilot ? 'text-indigo-400 animate-bounce' : 'text-gray-500'}`} />
                            Autonomous Automation Hub
                        </h2>
                        <p className="text-gray-400 text-sm mt-1 max-w-lg">
                            Enable fully autonomous mode to let Royal AI manage member lifecycle, retention, and revenue messages without manual intervention.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {isAutoPilot && (
                            <div className="text-right mr-4 hidden md:block">
                                <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider">AI Status</p>
                                <p className="text-white font-mono text-sm">{activeScan ? `SCANNING: ${activeScan}` : 'MONITORING...'}</p>
                            </div>
                        )}
                        <button 
                            onClick={() => setIsAutoPilot(!isAutoPilot)}
                            className={`px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-all transform hover:scale-105 ${
                                isAutoPilot 
                                ? 'bg-indigo-600 text-white shadow-indigo-500/30' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            {isAutoPilot ? 'AUTOPILOT ON' : 'ENABLE AUTOPILOT'}
                        </button>
                    </div>
                </div>
                {isAutoPilot && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-scan-fast"></div>}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Live Decisions Feed */}
                <Card title="Live Decision Feed">
                    <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {logs.length === 0 && <p className="text-gray-500 text-center py-10">System Idle. Enable Autopilot to start.</p>}
                        {logs.map(log => (
                            <div key={log.id} className="flex gap-3 items-start animate-fade-in">
                                <div className="mt-1">
                                    {log.status === 'Processing' 
                                        ? <AutoUpdateIcon className="w-5 h-5 text-amber-400 animate-spin" />
                                        : <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                    }
                                </div>
                                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-white text-sm">{log.action}</span>
                                        <span className="text-[10px] text-gray-500 font-mono">{log.timestamp}</span>
                                    </div>
                                    <p className="text-xs text-gray-300">{log.details}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Smart Triggers Configuration */}
                <Card title="Active Smart Protocols">
                    <div className="space-y-4">
                        {triggers.map(t => (
                            <div key={t.id} className={`p-4 rounded-xl border transition-all ${t.status ? 'bg-gray-800 border-gray-600' : 'bg-gray-800/50 border-gray-700 opacity-60'}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <div className="p-2 bg-gray-900 rounded-lg h-fit">{t.icon}</div>
                                        <div>
                                            <h4 className="font-bold text-white">{t.name}</h4>
                                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{t.description}</p>
                                        </div>
                                    </div>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={t.status} readOnly />
                                        <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

const Broadcast: React.FC = () => {
    const [message, setMessage] = useState('');
    const [audience, setAudience] = useState<'all' | 'active' | 'expired'>('all');
    const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>(INITIAL_BROADCASTS);
    const [isSending, setIsSending] = useState(false);

    const consentedMembers = useMemo(() => INITIAL_MEMBERS.filter(m => m.whatsappConsent), []);

    const targetMembers = useMemo(() => {
        let members = consentedMembers;
        if (audience === 'active') members = members.filter(m => m.status === 'Active');
        if (audience === 'expired') members = members.filter(m => m.status === 'Expired');
        return members;
    }, [consentedMembers, audience]);

    const handleSendBroadcast = async () => {
        if (!message.trim()) return;
        setIsSending(true);

        let sentCount = 0;
        for (const member of targetMembers) {
            await sendWhatsAppMessage({
                mobileNumber: member.phone,
                templateName: "broadcast_generic",
                parameters: [{ type: "text", text: message }]
            });
            sentCount++;
        }

        const newBroadcast: BroadcastMessage = {
            id: Date.now(),
            message,
            audience,
            recipientCount: sentCount,
            sentAt: new Date().toISOString().split('T')[0],
        };

        setBroadcasts([newBroadcast, ...broadcasts]);
        setMessage('');
        setIsSending(false);
        alert(`Broadcast sent to ${sentCount} members.`);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card title="Compose Broadcast">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Target Audience</label>
                            <select 
                                value={audience}
                                onChange={(e) => setAudience(e.target.value as any)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
                            >
                                <option value="all">All Consented Members ({consentedMembers.length})</option>
                                <option value="active">Active Members Only</option>
                                <option value="expired">Expired Members Only</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Sending to {targetMembers.length} recipients.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Message Content</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={5}
                                placeholder="Type your update here..."
                                className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handleSendBroadcast}
                                disabled={isSending || targetMembers.length === 0 || !message.trim()}
                                className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <WhatsAppIcon className="w-5 h-5 mr-2" />
                                {isSending ? 'Sending...' : 'Send Broadcast'}
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
            
            <div className="lg:col-span-1">
                <Card title="Recent Broadcasts">
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        {broadcasts.map(b => (
                            <div key={b.id} className="border-b border-gray-700 pb-3 last:border-0 last:pb-0">
                                <p className="text-xs text-gray-500 mb-1">{b.sentAt}</p>
                                <p className="text-sm text-gray-300 line-clamp-2 mb-1">{b.message}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-400 capitalize">{b.audience}</span>
                                    <span className="text-xs font-bold text-green-500">{b.recipientCount} sent</span>
                                </div>
                            </div>
                        ))}
                        {broadcasts.length === 0 && <p className="text-gray-500 text-center text-sm">No history yet.</p>}
                    </div>
                </Card>
            </div>
        </div>
    );
};

const WhatsAppIntegration: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('automations');

    return (
        <div>
            <h1 className="text-3xl font-bold text-amber-400 mb-6 flex items-center">
                <WhatsAppIcon className="w-8 h-8 mr-3 text-green-500" />
                WhatsApp Intelligence Hub
            </h1>

            <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg mb-6 w-full md:w-auto inline-flex overflow-x-auto">
                <button
                    onClick={() => setActiveTab('automations')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'automations' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    Smart Automation
                </button>
                <button
                    onClick={() => setActiveTab('agent')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${activeTab === 'agent' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <SparkleIcon className="w-4 h-4 mr-2" />
                    AI Agent
                </button>
                <button
                    onClick={() => setActiveTab('broadcast')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'broadcast' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    Broadcasts
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    Settings
                </button>
            </div>

            {activeTab === 'agent' && <AIAgentConsole />}
            {activeTab === 'broadcast' && <Broadcast />}
            {activeTab === 'automations' && <SmartAutomations />}
            {activeTab === 'settings' && (
                <Card title="Connection Settings">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                            <div>
                                <p className="font-bold text-white">Business Account</p>
                                <p className="text-sm text-gray-400">{GYM_INFO.whatsappNumber}</p>
                            </div>
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/50 rounded-full text-xs font-bold flex items-center">
                                <CheckCircleIcon className="w-3 h-3 mr-1" /> CONNECTED
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">
                            Integration provided by Meta Cloud API. Messages are sent securely using standard templates.
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default WhatsAppIntegration;
