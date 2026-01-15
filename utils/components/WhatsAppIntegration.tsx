
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

// --- EXISTING COMPONENTS (Automations, Broadcast) ---

const Automations: React.FC = () => {
    const [isChecking, setIsChecking] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const handleRunCheck = async () => {
        setIsChecking(true);
        setStatus('Running daily automation suite...');
        try {
            const result = await runDailyAutomations();
            setStatus(result);
        } catch (error) {
            setStatus('Error: Failed to run automation task.');
            console.error(error);
        } finally {
            setIsChecking(false);
        }
    };

    const triggers = [
        { id: 1, name: 'New Member Registration', action: 'Welcome + Gym Rules', status: 'Active', icon: <UserGroupIcon className="w-5 h-5 text-green-400"/> },
        { id: 2, name: 'Fee Due Reminder', action: 'Payment Reminder (Hindi)', status: 'Active', icon: <DollarSignIcon className="w-5 h-5 text-amber-400"/> },
        { id: 3, name: 'Workout Plan Assigned', action: 'Send PDF / Image Plan', status: 'Active', icon: <SparkleIcon className="w-5 h-5 text-blue-400"/> },
        { id: 4, name: 'Trainer Assigned', action: 'Trainer Intro Message', status: 'Active', icon: <BotIcon /> },
        { id: 5, name: 'Attendance Missed', action: 'Motivation Message (7 Days)', status: 'Active', icon: <CalendarIcon className="w-5 h-5 text-red-400"/> },
        { id: 6, name: 'Offer / Discount', action: 'Promo Broadcast', status: 'Manual', icon: <SparkleIcon className="w-5 h-5 text-purple-400"/> },
        { id: 7, name: 'Birthday', action: 'Greeting Message + Offer', status: 'Active', icon: <SparkleIcon className="w-5 h-5 text-pink-400"/> },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <BotIcon /> <span className="ml-2">Automation Center</span>
                    </h2>
                    <p className="text-sm text-gray-400">Manage all auto-triggered WhatsApp messages.</p>
                </div>
                <button 
                    onClick={handleRunCheck} 
                    disabled={isChecking}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg flex items-center transition-colors disabled:bg-gray-600 shadow-lg"
                >
                    {isChecking ? <AutoUpdateIcon className="w-4 h-4 mr-2 animate-spin"/> : <SparkleIcon className="w-4 h-4 mr-2"/>}
                    {isChecking ? 'Processing...' : 'Run Daily Check Now'}
                </button>
            </div>

            {status && (
                <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg animate-fade-in">
                    <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{status}</pre>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Fee Due Reminder" className="border-l-4 border-amber-500">
                    <div className="flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center mb-3">
                                <div className="p-2 bg-amber-900/30 rounded-lg mr-3 text-amber-500">
                                    <DollarSignIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Payment Reminder (Hindi)</h3>
                                    <span className="text-xs text-green-400 font-mono flex items-center">
                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                                        ACTIVE • T-minus 3 Days
                                    </span>
                                </div>
                            </div>
                            <p className="text-gray-300 text-sm mb-4">
                                Automatically sends a reminder when a membership is about to expire.
                            </p>
                            
                            <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Template Preview</p>
                                <p className="text-sm text-gray-300 italic">
                                    "प्रिय {'{name}'}, आपकी Gym Fee ₹{'{amount}'} बकाया है। कृपया भुगतान करें।"
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="New Member Automation" className="border-l-4 border-green-500">
                    <div className="flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center mb-3">
                                <div className="p-2 bg-green-900/30 rounded-lg mr-3 text-green-500">
                                    <UserGroupIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Welcome + Gym Rules</h3>
                                    <span className="text-xs text-green-400 font-mono flex items-center">
                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                                        ACTIVE • ON REGISTRATION
                                    </span>
                                </div>
                            </div>
                            <p className="text-gray-300 text-sm mb-4">
                                Triggers immediately when a new member is added. Sends a personalized greeting with Membership ID.
                            </p>
                            
                            <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Template Preview</p>
                                <p className="text-sm text-gray-300 italic">
                                    "नमस्ते {'{name}'}, आपका {GYM_INFO.name} में स्वागत है। आपका Membership ID: {'{member_id}'}"
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <Card title="All Automated Message Triggers">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-gray-500 border-b border-gray-700">
                                <th className="pb-3 pl-2">Trigger Event</th>
                                <th className="pb-3">Auto Message Action</th>
                                <th className="pb-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-300">
                            {triggers.map((t) => (
                                <tr key={t.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                                    <td className="py-3 pl-2 flex items-center">
                                        <div className="mr-3 opacity-80">{t.icon}</div>
                                        {t.name}
                                    </td>
                                    <td className="py-3">{t.action}</td>
                                    <td className="py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${t.status === 'Active' ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                                            {t.status === 'Active' ? '● Active' : '○ Manual'}
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
    const [activeTab, setActiveTab] = useState<Tab>('agent');

    return (
        <div>
            <h1 className="text-3xl font-bold text-amber-400 mb-6 flex items-center">
                <WhatsAppIcon className="w-8 h-8 mr-3 text-green-500" />
                WhatsApp Intelligence Hub
            </h1>

            <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg mb-6 w-full md:w-auto inline-flex overflow-x-auto">
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
                    onClick={() => setActiveTab('automations')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'automations' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    Automations
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
            {activeTab === 'automations' && <Automations />}
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
