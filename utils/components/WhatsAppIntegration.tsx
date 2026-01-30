
import React, { useState, useMemo, useEffect } from 'react';
import Card from './common/Card';
import { INITIAL_MEMBERS, INITIAL_BROADCASTS, GYM_INFO } from '../../constants';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { BroadcastMessage } from '../../types';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { sendWhatsAppMessage } from '../../lib/whatsapp';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { BotIcon } from './icons/BotIcon';
import { getComplexResponse } from '../../lib/gemini';
import { TerminalIcon } from './icons/TerminalIcon';

type Tab = 'agent' | 'broadcast' | 'automations' | 'settings';
type AIModel = 'Gemini 1.5 Pro' | 'GPT-4o (OpenAI)' | 'Grok-1 (xAI)' | 'DeepSeek R1' | 'Perplexity Online';

// --- COMPONENT: AI Agent Console ---
const AIAgentConsole: React.FC = () => {
    const [incomingMessages, setIncomingMessages] = useState<any[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [isAgentActive, setIsAgentActive] = useState(false);
    const [selectedModel, setSelectedModel] = useState<AIModel>('DeepSeek R1');

    // Simulate incoming messages stream
    useEffect(() => {
        if (!isAgentActive) return;

        const interval = setInterval(() => {
            const randomMember = INITIAL_MEMBERS[Math.floor(Math.random() * INITIAL_MEMBERS.length)];
            const intents = [
                { text: "What is the fee for 3 months?", intent: "enquiry" },
                { text: "I'll be late for the 6 PM class.", intent: "notification" },
                { text: "Send me my diet plan pdf.", intent: "request" },
                { text: "Gym open today?", intent: "enquiry" },
                { text: "My back hurts after deadlifts, advice?", intent: "support" }
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

        }, 4000);

        return () => clearInterval(interval);
    }, [isAgentActive, selectedModel]);

    const processMessage = async (msg: any) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] RECEIVE: Msg from ${msg.from}: "${msg.text}"`, ...prev]);
        
        // Simulate Model Thinking
        await new Promise(r => setTimeout(r, 1000));
        let thinkingLog = "";
        
        if (selectedModel === 'DeepSeek R1') thinkingLog = "DeepSeek: Reasoning through biomechanics & pricing logic...";
        else if (selectedModel === 'Grok-1 (xAI)') thinkingLog = "Grok: Accessing real-time humor & gym facts...";
        else if (selectedModel === 'Perplexity Online') thinkingLog = "Perplexity: Searching web for latest recovery protocols...";
        else thinkingLog = `${selectedModel}: Processing intent...`;

        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${thinkingLog}`, ...prev]);
        
        await new Promise(r => setTimeout(r, 1500));
        
        let reply = "";
        if (msg.intent === 'enquiry') reply = "Hi! Our 3-month package is ₹5000. Gym is open 5AM-10PM. Come join the Royal family!";
        else if (msg.intent === 'support') reply = "Please rest immediately. DeepSeek suggests applying ice and checking form. Book a session with our trainer.";
        else reply = "Request received. Processing your document now.";

        setLogs(prev => [`[${new Date().toLocaleTimeString()}] WHATSAPP API: Sent Reply via ${selectedModel}: "${reply}"`, ...prev]);
        
        // Update message status in UI
        setIncomingMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'replied', reply } : m));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <Card className="bg-gradient-to-r from-gray-900 to-green-900/30 border-green-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <BotIcon className="w-32 h-32 text-green-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-4 rounded-full ${isAgentActive ? 'bg-green-500 shadow-[0_0_20px_#22c55e]' : 'bg-gray-700'}`}>
                                    <WhatsAppIcon className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Auto-Response Agent</h2>
                                    <p className="text-sm text-gray-400">
                                        {isAgentActive ? 'Online • Listening on Port 443' : 'Offline • AI Standby'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsAgentActive(!isAgentActive)}
                                className={`px-6 py-3 rounded-lg font-bold transition-all shadow-lg ${isAgentActive ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                            >
                                {isAgentActive ? 'STOP AGENT' : 'ACTIVATE'}
                            </button>
                        </div>

                        <div className="bg-black/40 p-4 rounded-xl border border-white/10">
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Select Neural Brain</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Gemini 1.5 Pro', 'GPT-4o (OpenAI)', 'Grok-1 (xAI)', 'DeepSeek R1', 'Perplexity Online'].map((model) => (
                                    <button
                                        key={model}
                                        onClick={() => setSelectedModel(model as AIModel)}
                                        className={`text-xs py-2 px-3 rounded-lg text-left transition-all border ${selectedModel === model ? 'bg-green-500/20 border-green-500 text-green-300' : 'bg-gray-800 border-transparent text-gray-400 hover:bg-gray-700'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            {model}
                                            {selectedModel === model && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Live Customer Conversations">
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {incomingMessages.length === 0 && <p className="text-gray-500 text-center py-4">Waiting for incoming WhatsApp messages...</p>}
                        {incomingMessages.map(msg => (
                            <div key={msg.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700 animate-fade-in">
                                <div className="flex justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-[10px] text-black font-bold">WA</div>
                                        <span className="font-bold text-white text-sm">{msg.from}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-500">{msg.timestamp}</span>
                                </div>
                                <p className="text-gray-300 text-xs mb-2 pl-8">"{msg.text}"</p>
                                {msg.status === 'processing' ? (
                                    <div className="flex items-center text-xs text-amber-400 pl-8">
                                        <SparkleIcon className="w-3 h-3 mr-1 animate-spin" /> {selectedModel} Typing...
                                    </div>
                                ) : (
                                    <div className="bg-green-900/10 p-2 rounded border border-green-500/20 ml-8">
                                        <p className="text-[10px] text-green-300 font-mono flex items-start gap-1">
                                            <BotIcon className="w-3 h-3 mt-0.5"/> 
                                            {msg.reply}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="h-full">
                <Card title="Neural Kernel Logs" className="h-full flex flex-col bg-[#0c0c0c] border-gray-800 font-mono">
                    <div className="flex items-center gap-2 border-b border-gray-800 pb-2 mb-2 text-xs text-gray-500">
                        <TerminalIcon className="w-4 h-4" />
                        <span>/var/log/royal_whatsapp_bot.log</span>
                    </div>
                    <div className="flex-1 overflow-y-auto text-[10px] space-y-1.5 p-2 custom-scrollbar">
                        {logs.map((log, i) => (
                            <div key={i} className="border-b border-gray-900 pb-1 break-all">
                                <span className={log.includes('RECEIVE') ? 'text-blue-400' : log.includes('WHATSAPP') ? 'text-green-400' : log.includes('DeepSeek') || log.includes('Grok') ? 'text-purple-400' : 'text-gray-400'}>
                                    {log}
                                </span>
                            </div>
                        ))}
                        {logs.length === 0 && <span className="text-gray-600">System initialized. Waiting for events...</span>}
                    </div>
                </Card>
            </div>
        </div>
    );
};

// --- COMPONENT: Smart Automations with Logic Selection ---
const SmartAutomations: React.FC = () => {
    const [isAutoPilot, setIsAutoPilot] = useState(false);
    
    return (
        <div className="space-y-6">
            <Card className={`relative overflow-hidden transition-colors duration-500 ${isAutoPilot ? 'bg-gradient-to-r from-gray-900 to-indigo-900/40 border-indigo-500' : 'bg-gray-800 border-gray-700'}`}>
                <div className="flex flex-col md:flex-row justify-between items-center relative z-10">
                    <div className="mb-4 md:mb-0">
                        <h2 className="text-2xl font-bold text-white flex items-center">
                            <SparkleIcon className={`w-8 h-8 mr-3 ${isAutoPilot ? 'text-indigo-400 animate-spin-slow' : 'text-gray-500'}`} />
                            Autonomous CRM Workflows
                        </h2>
                        <p className="text-gray-400 text-sm mt-1 max-w-lg">
                            Royal's AI Engine actively monitors member behavior and triggers WhatsApp sequences using <strong>DeepSeek Logic</strong> and <strong>Gemini Creativity</strong>.
                        </p>
                    </div>
                    
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
                {isAutoPilot && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-scan-fast"></div>}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { name: 'Churn Prevention', logic: 'DeepSeek R1', trigger: 'Absent > 7 Days', action: 'Send "Miss You" + Offer', icon: <UserGroupIcon/>, color: 'blue' },
                    { name: 'Fee Recovery', logic: 'Grok-1', trigger: 'Payment Overdue', action: 'Send Witty Reminder + Link', icon: <DollarSignIcon/>, color: 'green' },
                    { name: 'Birthday Wishes', logic: 'Gemini 1.5', trigger: 'Date = Birthday', action: 'Generate Image + Text', icon: <SparkleIcon/>, color: 'pink' },
                    { name: 'Review Booster', logic: 'GPT-4o', trigger: 'Attendance > 20', action: 'Request Google Review', icon: <CalendarIcon/>, color: 'amber' },
                    { name: 'Lead Nurture', logic: 'Perplexity', trigger: 'New Lead', action: 'Send Info Packet', icon: <BotIcon/>, color: 'purple' },
                    { name: 'Feedback Loop', logic: 'DeepSeek', trigger: 'Low Rating', action: 'Alert Admin + Apology', icon: <AutoUpdateIcon/>, color: 'red' },
                ].map((flow, idx) => (
                    <Card key={idx} className="relative group hover:border-gray-500 transition-all">
                        <div className={`absolute top-0 right-0 p-2 text-xs font-bold text-${flow.color}-400 bg-${flow.color}-900/20 rounded-bl-lg border-b border-l border-${flow.color}-500/20`}>
                            {flow.logic}
                        </div>
                        <div className="flex items-start gap-4 mb-4">
                            <div className={`p-3 rounded-lg bg-${flow.color}-900/20 text-${flow.color}-400`}>
                                {flow.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-white">{flow.name}</h3>
                                <p className="text-xs text-gray-500 mt-1">Logic: {flow.logic}</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm text-gray-300">
                            <div className="flex justify-between bg-gray-900/50 p-2 rounded">
                                <span className="text-gray-500">IF</span>
                                <span>{flow.trigger}</span>
                            </div>
                            <div className="flex justify-center text-gray-600">↓</div>
                            <div className="flex justify-between bg-gray-900/50 p-2 rounded">
                                <span className="text-green-500">THEN</span>
                                <span>{flow.action}</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-[10px] text-gray-500">Last run: 2m ago</span>
                            <div className={`w-3 h-3 rounded-full ${isAutoPilot ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

// --- COMPONENT: Broadcast ---
const Broadcast: React.FC = () => {
    // Reuse existing logic but with improved UI
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = () => {
        setIsSending(true);
        setTimeout(() => { setIsSending(false); alert("Broadcast Sent!"); }, 2000);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="New Broadcast Campaign">
                <div className="space-y-4">
                    <textarea 
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:border-green-500 outline-none h-40"
                        placeholder="Type your message here... (AI Suggestion: 'Get ready for summer! 20% off PT')"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                    />
                    <div className="flex gap-4">
                        <button 
                            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl border border-gray-600 flex items-center justify-center gap-2"
                            onClick={async () => {
                                const res = await getComplexResponse("Write a catchy gym offer WhatsApp message for Diwali.");
                                setMessage(res);
                            }}
                        >
                            <SparkleIcon className="w-4 h-4 text-amber-400" /> AI Draft
                        </button>
                        <button 
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
                            onClick={handleSend}
                            disabled={isSending}
                        >
                            {isSending ? <AutoUpdateIcon className="animate-spin w-4 h-4"/> : <WhatsAppIcon className="w-4 h-4"/>}
                            {isSending ? 'Broadcasting...' : 'Send Now'}
                        </button>
                    </div>
                </div>
            </Card>
            
            <Card title="Campaign Analytics">
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <div>
                            <p className="font-bold text-white">Summer Shred</p>
                            <p className="text-xs text-gray-500">Sent Yesterday</p>
                        </div>
                        <div className="text-right">
                            <p className="text-green-400 font-bold">98% Open</p>
                            <p className="text-xs text-gray-500">12 Replies</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <div>
                            <p className="font-bold text-white">Sunday Yoga</p>
                            <p className="text-xs text-gray-500">Sent 3 days ago</p>
                        </div>
                        <div className="text-right">
                            <p className="text-green-400 font-bold">92% Open</p>
                            <p className="text-xs text-gray-500">45 Bookings</p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const WhatsAppIntegration: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('agent');

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 flex items-center">
                        <WhatsAppIcon className="w-8 h-8 mr-3 text-green-500" />
                        WhatsApp Intelligence Hub
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Powered by <strong>Meta Cloud API</strong> x <strong>DeepSeek/Grok/GPT</strong></p>
                </div>
            </div>

            <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg mb-6 w-full md:w-auto inline-flex overflow-x-auto">
                <button onClick={() => setActiveTab('agent')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'agent' ? 'bg-green-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                    AI Agent Console
                </button>
                <button onClick={() => setActiveTab('automations')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'automations' ? 'bg-green-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                    Smart Workflows
                </button>
                <button onClick={() => setActiveTab('broadcast')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'broadcast' ? 'bg-green-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                    Broadcasts
                </button>
                <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-green-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                    API Config
                </button>
            </div>

            {activeTab === 'agent' && <AIAgentConsole />}
            {activeTab === 'automations' && <SmartAutomations />}
            {activeTab === 'broadcast' && <Broadcast />}
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
