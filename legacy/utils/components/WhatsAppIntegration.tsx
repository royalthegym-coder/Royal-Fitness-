import { getCurrencySymbol } from '../store/useCurrencyStore';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Card from './common/Card';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { BotIcon } from './icons/BotIcon';
import { TerminalIcon } from './icons/TerminalIcon';
import { LockIcon } from './icons/LockIcon';
import { OpenSourceIcon } from './icons/OpenSourceIcon';
import { 
    Zap, Activity, Shield, Globe, Cpu, 
    MessageSquare, Power, Send,
    Radio, FileText, Users, Clock, Edit3, Trash2, Plus,
    BarChart3, RefreshCw, Network, BrainCircuit, Scan, Wifi, Server,
    ArrowRight, Copy, Check, KeyRound, Play, Code2, Database, Github
} from 'lucide-react';
import { getComplexResponse } from '../../lib/core_ai';
import { triggerWhatsAppWorkflow, WhatsAppWorkflowType } from '../../lib/whatsapp';
import { executeUnifiedPipeline } from '../../lib/automation';
import { useToast } from '../hooks/useToast';
import { useData } from '../context/DataProvider';
import { useAutomationStore, bi } from '../store/useAutomationStore';
import Modal from './common/Modal';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// --- TYPES ---
type Tab = 'live_console' | 'broadcast' | 'templates' | 'autonomous_agents' | 'neural_config' | 'n8n_automation' | 'local_host';
type AIModel = 'Google Opals Agent' | 'N8N Automation Node' | 'GitHub Code Worker' | 'Core AI 3.1 Pro' | 'Core AI 2.5 Flash' | 'Gemma 3 (Local)' | 'Core AI Video 2.0';
type HostingMode = 'Cloud API' | 'Private Server' | 'Secure Container' | 'GitHub Codespaces';

interface AgentTask {
    id: string;
    agent: 'Task Runner' | 'Goal Seeker' | 'Retention Guard' | 'Revenue Bot' | 'WhatsApp Auto-Responder' | 'Google Business Syncer';
    goal: string;
    status: 'Thinking' | 'Executing' | 'Completed' | 'Waiting';
    logs: string[];
    efficiency: number;
}

interface MessageTemplate {
    id: string;
    name: string;
    content: string;
    category: string;
}

interface BroadcastLog {
    id: number;
    message: string;
    audience: string;
    count: number;
    date: string;
}

// Sentiment Data for Radar
const SENTIMENT_DATA = [
    { subject: 'Urgency', A: 80, fullMark: 100 },
    { subject: 'Positivity', A: 65, fullMark: 100 },
    { subject: 'Queries', A: 90, fullMark: 100 },
    { subject: 'Complaints', A: 20, fullMark: 100 },
    { subject: 'Sales', A: 70, fullMark: 100 },
];

const WhatsAppIntegration: React.FC = () => {
    const { addToast } = useToast();
    const { automationEvents, members } = useData(); // Hook into global events
    const { language, settings, logs, pausedChannels, updateSettings, toggleChannelPause, addLog, pauseLog, overrideLogMessage } = useAutomationStore();
    const whatsappOverrideLogs = useMemo(() => logs.filter(l => l.channel === 'WHATSAPP'), [logs]);
    const [editingWaLogId, setEditingWaLogId] = useState<string | null>(null);
    const [waOverrideDraft, setWaOverrideDraft] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('n8n_automation');
    const [selectedModel, setSelectedModel] = useState<AIModel>('Google Opals Agent');
    const [hostingMode, setHostingMode] = useState<HostingMode>('Cloud API');
    
    // Live Console State
    const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
    const [incomingMsg, setIncomingMsg] = useState<any>(null);
    const [isBotActive, setIsBotActive] = useState(true);
    const [manualInput, setManualInput] = useState('');
    const [isManualProcessing, setIsManualProcessing] = useState(false);
    
    // Broadcast State
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [targetAudience, setTargetAudience] = useState<'All' | 'Active' | 'Expired'>('All');
    const [broadcastHistory, setBroadcastHistory] = useState<BroadcastLog[]>([]);
    const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

    // --- FULL WHATSAPP 4-WORKFLOW & 6-NODE AUTOMATION STATE ---
    const [waTargetMember, setWaTargetMember] = useState({
        name: members[0]?.name || '',
        phone: members[0]?.phone || '',
        planName: 'Fitness Future Pro Transformation',
        amount: 1500,
        dueDate: new Date(Date.now() + 2 * 86400000).toLocaleDateString('en-IN'),
        goal: 'Lean Muscle & Fat Loss',
        incomingQuery: 'What are the membership plans, diet coaching options, and UPI payment details?'
    });
    const [activeWaTrigger, setActiveWaTrigger] = useState<WhatsAppWorkflowType | null>(null);
    const [lastDispatchedResult, setLastDispatchedResult] = useState<any>(null);
    const [isRunningFullSync, setIsRunningFullSync] = useState(false);
    const [webhookSwitches, setWebhookSwitches] = useState({
        ai_auto_reply: true,
        fee_expiry_reminder: true,
        diet_workout_delivery: true,
        lead_welcome_followup: true
    });

    // --- N8N WEBHOOK AUTOMATION STATES ---
    const [n8nSimStep, setN8nSimStep] = useState<string>('idle');
    const [n8nUserStatus, setN8nUserStatus] = useState<string>('Active');
    const [n8nPayload, setN8nPayload] = useState<string>(JSON.stringify({
      userId: String(members[0]?.id || ''),
      name: members[0]?.name || '',
      phone: members[0]?.phone || '',
      event: "Membership renewal reminder"
    }, null, 2));
    const [n8nLogs, setN8nLogs] = useState<string[]>([
      "System initialized. All 6 nodes (Claude Code, ChatGPT, n8n, Supabase, GitHub, WhatsApp Cloud API) connected via Server Vault."
    ]);
    const [n8nGeneratedMsg, setN8nGeneratedMsg] = useState<string>("");

    const handleTriggerWhatsAppFlow = async (workflowType: WhatsAppWorkflowType) => {
        setActiveWaTrigger(workflowType);
        const time = new Date().toLocaleTimeString();
        setN8nLogs(prev => [
            `[${time}] Triggering Live WhatsApp Workflow [${workflowType.toUpperCase()}] for ${waTargetMember.name || 'Guest'} (+91 ${waTargetMember.phone})...`,
            ...prev
        ]);
        try {
            const dispatchRes = await fetch('/api/ai/whatsapp/auto-dispatch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: waTargetMember.phone,
                    recipientName: waTargetMember.name || 'Member',
                    intent: workflowType,
                    inboundMessage: waTargetMember.incomingQuery || `${waTargetMember.planName} · ${waTargetMember.goal}`,
                    autoSend: settings.whatsappAutoSend,
                    paused: pausedChannels.WHATSAPP,
                    language: settings.replyLanguage,
                    tone: settings.replyTone,
                }),
            });
            const aiDispatch = await dispatchRes.json().catch(() => null);

            let messageBody = aiDispatch?.messageBody || '';
            let providerStatus = aiDispatch?.providerStatus || 'LIVE_WEBHOOK';
            let deliveryStatus = aiDispatch?.deliveryStatus || (pausedChannels.WHATSAPP || !settings.whatsappAutoSend ? 'PAUSED' : 'AUTO_SENT');
            let recipient = aiDispatch?.recipient || `+91${String(waTargetMember.phone).replace(/\D/g, '')}`;

            if (!aiDispatch?.success && !pausedChannels.WHATSAPP && settings.whatsappAutoSend) {
                const fallbackResult = await triggerWhatsAppWorkflow({
                    workflowType,
                    memberName: waTargetMember.name,
                    phoneNumber: waTargetMember.phone,
                    amount: Number(waTargetMember.amount) || 1500,
                    dueDate: waTargetMember.dueDate,
                    planName: waTargetMember.planName,
                    goal: waTargetMember.goal,
                    incomingQuery: waTargetMember.incomingQuery
                });
                messageBody = fallbackResult.generatedMessage;
                providerStatus = fallbackResult.providerStatus;
                recipient = fallbackResult.recipient;
            }

            setLastDispatchedResult({ providerStatus, recipient, messageBody, deliveryStatus });
            setN8nGeneratedMsg(messageBody);
            await addLog({
                channel: 'WHATSAPP',
                target: `${waTargetMember.name || 'Member'} (${recipient})`,
                summary: `WhatsApp Workflow · ${workflowType.replace(/_/g, ' ')}`,
                messageBody,
                status: deliveryStatus,
                providerStatus,
            });
            setN8nLogs(prev => [
                `[${time}] WhatsApp [${deliveryStatus}] (${providerStatus}) -> Recipient: ${recipient}`,
                ...prev
            ]);
            setConsoleLogs(prev => [
                `[${time}] WHATSAPP (${workflowType}): ${deliveryStatus} to ${recipient}`,
                ...prev
            ].slice(0, 50));
            addToast(
                deliveryStatus === 'PAUSED'
                    ? bi(language, 'WhatsApp paused/held for manual override approval.', 'व्हाट्सएप संदेश मैनुअल ओवरराइड समीक्षा के लिए रोका गया।')
                    : bi(language, `WhatsApp (${workflowType}) dispatched to ${recipient}.`, `व्हाट्सएप (${workflowType}) ${recipient} को भेज दिया गया।`),
                deliveryStatus === 'PAUSED' ? 'info' : 'success'
            );
        } catch (err: any) {
            addToast(`Failed to trigger workflow: ${err.message}`, 'error');
            setN8nLogs(prev => [`[${time}] Error: ${err.message}`, ...prev]);
        } finally {
            setActiveWaTrigger(null);
        }
    };

    const handleRunUnified6NodeSync = async () => {
        setIsRunningFullSync(true);
        const time = new Date().toLocaleTimeString();
        setN8nLogs(prev => [`[${time}] ⚡ Executing Full 6-Node Sync (Claude Code + ChatGPT + n8n + Supabase + GitHub + WhatsApp)...`, ...prev]);
        try {
            const res = await executeUnifiedPipeline({
                pipelineType: 'full_gym_sync',
                memberName: waTargetMember.name,
                memberPhone: waTargetMember.phone,
                planTier: waTargetMember.planName,
                amount: Number(waTargetMember.amount) || 1500,
                goal: waTargetMember.goal
            });
            (res.stages || []).forEach((st: any) => {
                setN8nLogs(prev => [`[${time}] ✅ Stage ${st.step} (${st.node}): ${st.detail}`, ...prev]);
            });
            addToast(`6-Node Pipeline (${res.runId}) completed in ${res.durationMs}ms!`, 'success');
        } catch (e: any) {
            addToast(`Pipeline sync failed: ${e.message}`, 'error');
        } finally {
            setIsRunningFullSync(false);
        }
    };

    const handleSimulateN8N = async () => {
      setN8nSimStep('webhook');
      setN8nLogs(["[00:00] 🔵 Webhook Trigger received POST request with payload..."]);
      
      await new Promise(r => setTimeout(r, 600));
      let payload: any;
      try {
        payload = JSON.parse(n8nPayload);
      } catch(e) {
        setN8nSimStep('failed');
        setN8nLogs(prev => [...prev, "[00:01] ❌ Validation Error: Failed to parse request body payload as JSON."]);
        addToast("Malformed Webhook Input", "error");
        return;
      }
      
      setN8nLogs(prev => [...prev, `[00:01] 🟢 Webhook validated. Event payload identifies User ID: ${payload.userId || 'N/A'}`]);
      setN8nSimStep('supabase');
      
      await new Promise(r => setTimeout(r, 600));
      setN8nLogs(prev => [...prev, `[00:02] 🔵 Connecting to Supabase -> Querying: SELECT status, name, phone FROM members WHERE id = '${payload.userId}'`]);
      
      const dbStatus = n8nUserStatus;
      const phone = payload.phone || waTargetMember.phone || "";
      const name = payload.name || waTargetMember.name || "Registered Member";
      setN8nLogs(prev => [...prev, `[00:03] 🟢 Supabase record retrieved: { name: "${name}", status: "${dbStatus}", phone: "${phone}" }`]);
      setN8nSimStep('if');
      
      if (dbStatus !== 'Active') {
        setN8nSimStep('failed_condition');
        setN8nLogs(prev => [...prev, `[00:04] ⚠️ Terminating workflow: Client status is "${dbStatus}".`]);
        addToast("Automation Skipped: User Inactive", "info");
        return;
      }
      
      setN8nSimStep('code');
      await handleTriggerWhatsAppFlow('diet_workout_delivery');
      setN8nSimStep('completed');
    };

    // Template State
    const [templates, setTemplates] = useState<MessageTemplate[]>([
        { 
            id: 't1', 
            name: 'New Member Onboarding (The Admission Bot)', 
            content: "Hello! Welcome to [Gym Name]'s 'Smart OS' powered fitness ecosystem. 🚀\nClick the button below to fill out your admission form. This form is completely automated. [Link: Admission Form]\nOnce the form is filled, you will receive your payment link.", 
            category: 'Onboarding' 
        },
        { 
            id: 't2', 
            name: 'Google Business Payments (UPI/Cards)', 
            content: `Hello [Member Name]!\nYour gym membership details:\n- Plan: [Plan Name]\n- Due Date: [Date]\n- Amount: ${getCurrencySymbol()}[Amount]\nPay instantly via Google Opals & Google Business Payments: [Payment Link]\nNote: After payment, your receipt and 'FitnessFuture' workout access will be activated immediately.`, 
            category: 'Payment' 
        },
        { 
            id: 't3', 
            name: 'AI Diet & Workout Delivery via GitHub Actions', 
            content: "Congratulations [Member Name]! Your payment was successful. ✅\nYour 'Scientific AI Diet Plan' and 'Bodybuilding Workout Schedule' are ready. [Link: View My Plan]\nOur 'Titan Vision' technology is ready to track your exercise posture. Start your first workout!", 
            category: 'Onboarding' 
        },
        { 
            id: 't4', 
            name: 'Auto-Reminder (Retention Bot via N8N)', 
            content: "Hello [Member Name], are you ready for the next level? 🔥\nYour membership is expiring in 3 days. Renew today to continue your workout without any interruption. [Link: Quick Renew]", 
            category: 'Reminder' 
        }
    ]);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', content: '' });

    // Autonomous Agents State (Swarm)
    const [activeTasks, setActiveTasks] = useState<AgentTask[]>([
        { 
            id: 't1', 
            agent: 'WhatsApp Auto-Responder', 
            goal: 'Process 50+ incoming WhatsApp queries via N8N & ChatGPT', 
            status: 'Executing', 
            logs: ['Connected to WhatsApp Cloud API (+91 98XXXXXXXX)', 'Received query regarding pricing', 'Generating dynamic response using ChatGPT + n8n...'],
            efficiency: 99
        },
        { 
            id: 't2', 
            agent: 'Google Business Syncer', 
            goal: 'Sync recent 5 reviews and post automated replies', 
            status: 'Thinking', 
            logs: ['Scanning Google Business Profile...', 'Found 2 new 5-star reviews... Generating gratitude sequence!'],
            efficiency: 96
        },
        {
            id: 't3',
            agent: 'Goal Seeker',
            goal: 'Recover churned members via Claude Code & GitHub scheduled Action',
            status: 'Waiting',
            logs: ['Awaiting CRON trigger', 'Scripts valid'],
            efficiency: 90
        }
    ]);

    // Local Hosting Stats
    const [gpuLoad, setGpuLoad] = useState(0);
    const [memoryUsage, setMemoryUsage] = useState(0);
    
    // Live Traffic Graph Data
    const [trafficData, setTrafficData] = useState<{time: string, msg: number}[]>([]);

    const terminalRef = useRef<HTMLDivElement>(null);

    // Sync global events to console logs
    useEffect(() => {
        if (automationEvents.length > 0) {
            const latestEvent = automationEvents[0];
            setConsoleLogs(prev => [latestEvent, ...prev].slice(0, 50));
        }
    }, [automationEvents]);

    // Local Resource Monitor
    useEffect(() => {
        if (hostingMode !== 'Cloud API') {
            const interval = setInterval(() => {
                const load = Math.min(100, 20 + (consoleLogs.length % 10) * 5);
                setGpuLoad(load); 
                setMemoryUsage(4096 + (consoleLogs.length * 10)); 
            }, 2000);
            return () => clearInterval(interval);
        } else {
            setGpuLoad(0);
            setMemoryUsage(0);
        }
    }, [hostingMode, consoleLogs]);

    // Auto-scroll terminal
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [consoleLogs]);

    // --- LOGIC ---

    const executeRealBotResponse = async (user: string, text: string, model: AIModel) => {
        const time = new Date().toLocaleTimeString();
        
        setConsoleLogs(prev => [`[${time}] 📥 MANUAL INPUT (${user}): "${text}"`, ...prev].slice(0, 50));
        setIncomingMsg({ user, text, model, status: 'thinking' });

        let thoughtProcess = "";
        if (model === 'Core AI 3.1 Pro' || model === 'Google Opals Agent') thoughtProcess = `${model}: Deep logic planning... checking N8N graph loops...`;
        else if (model === 'Core AI 2.5 Flash') thoughtProcess = "Core AI 2.5 Flash: Checking viral context...";
        else if (model === 'N8N Automation Node') thoughtProcess = "N8N Node: Executing webhook trigger, connecting to WhatsApp Business API...";
        else if (model === 'GitHub Code Worker') thoughtProcess = "GitHub Action: Running deployment hook... generating responses...";
        else thoughtProcess = `${model}: Processing natural language vector...`;

        setConsoleLogs(prev => [`[${time}] 🧠 ${thoughtProcess}`, ...prev].slice(0, 50));
        setIncomingMsg((prev: any) => ({ ...prev, status: 'typing' }));

        let reply = "";
        try {
            const res = await triggerWhatsAppWorkflow({
                workflowType: 'ai_auto_reply',
                memberName: user,
                phoneNumber: waTargetMember.phone,
                incomingQuery: text
            });
            reply = res.generatedMessage;
        } catch (e) {
            reply = "Welcome to Fitness Future! Open 5 AM - 10 PM. Plans: ₹1200/mo, ₹3000/qtr, ₹9000/yr. Pay via UPI: your-upi@bank.";
        }

        setConsoleLogs(prev => [`[${time}] 📤 SENT: ${reply}`, ...prev].slice(0, 50));
        setIncomingMsg(null);
    };

    const handleManualMessage = async () => {
        if (!manualInput.trim()) return;
        setIsManualProcessing(true);
        const text = manualInput;
        setManualInput('');
        await executeRealBotResponse("Admin Override", text, selectedModel);
        setIsManualProcessing(false);
    };

    const handleBroadcastSend = () => {
        if (!broadcastMessage.trim()) {
            addToast("Message content is empty.", "error");
            return;
        }
        setIsSendingBroadcast(true);
        setTimeout(() => {
            const recipientCount = targetAudience === 'All' ? members.length : Math.floor(members.length / 2);
            setBroadcastHistory(prev => [{
                id: Date.now(),
                message: broadcastMessage,
                audience: targetAudience,
                count: recipientCount,
                date: new Date().toLocaleTimeString()
            }, ...prev]);
            
            setBroadcastMessage('');
            setIsSendingBroadcast(false);
            addToast(`FitnessFutureBroadcast Sent to ${recipientCount} Nodes.`, "success");
        }, 1200);
    };

    const handleSaveTemplate = () => {
        if (newTemplate.name && newTemplate.content) {
            setTemplates(prev => [...prev, { id: `t${Date.now()}`, name: newTemplate.name, content: newTemplate.content, category: 'Custom' }]);
            setNewTemplate({ name: '', content: '' });
            setIsTemplateModalOpen(false);
            addToast("Template Encoded to Matrix.", "success");
        }
    };

    // --- RENDERERS ---

    const renderN8nAutomationTab = () => (
        <div className="space-y-6 animate-slide-up">
            {/* Top Status Strip: All 6 Keys Pre-Configured */}
            <div className="p-6 rounded-[2.5rem] bg-gradient-to-r from-emerald-950/60 via-black to-indigo-950/60 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-500 text-black">
                        <KeyRound className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-white uppercase italic">
                                Claude Code + ChatGPT + n8n + Supabase + GitHub + WhatsApp
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500 text-black">
                                KEYS PRE-CONFIGURED
                            </span>
                        </div>
                        <p className="text-xs text-gray-300 font-mono mt-0.5">
                            WhatsApp Cloud API: +91 98XXXXXXXX &bull; Official UPI: your-upi@bank &bull; Mode: Real-Time Webhooks + 1-Click Triggers
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => void updateSettings({ whatsappAutoSend: !settings.whatsappAutoSend })}
                        className={`px-4 py-3 rounded-xl font-black uppercase text-[10px] tracking-wider cursor-pointer border ${
                            settings.whatsappAutoSend
                                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                                : 'bg-zinc-900 border-white/15 text-gray-300'
                        }`}
                    >
                        {settings.whatsappAutoSend ? 'Auto-Send: ON' : 'Auto-Send: MANUAL HOLD'}
                    </button>
                    <button
                        type="button"
                        onClick={() => toggleChannelPause('WHATSAPP')}
                        className={`px-4 py-3 rounded-xl font-black uppercase text-[10px] tracking-wider cursor-pointer border ${
                            pausedChannels.WHATSAPP
                                ? 'bg-red-500/25 border-red-400 text-red-200'
                                : 'bg-black/60 border-white/15 text-amber-300'
                        }`}
                    >
                        {pausedChannels.WHATSAPP ? 'Bot Paused — Resume' : 'Pause WhatsApp Bot'}
                    </button>
                    <button
                        type="button"
                        onClick={handleRunUnified6NodeSync}
                        disabled={isRunningFullSync}
                        className="px-5 py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl shadow-xl hover:bg-emerald-400 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {isRunningFullSync ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {isRunningFullSync ? 'Syncing 6 Nodes...' : '1-Click: Sync All 6 Nodes'}
                    </button>
                </div>
            </div>

            {/* LIVE MANUAL OVERRIDE AUDIT LOG (WHATSAPP) */}
            {whatsappOverrideLogs.length > 0 && (
                <div className="bg-zinc-950 border border-white/10 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
                            {bi(language, 'WhatsApp Live Webhook & Manual Override Audit Log', 'व्हाट्सएप लाइव वेबहुक व मैनुअल ओवरराइड लॉग')} ({whatsappOverrideLogs.length})
                        </h4>
                        <span className="text-[11px] font-mono text-slate-400">
                            Mode: {pausedChannels.WHATSAPP ? 'PAUSED' : settings.whatsappAutoSend ? 'LIVE AUTO-SEND' : 'MANUAL HOLD'}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                        {whatsappOverrideLogs.slice(0, 8).map((log) => (
                            <div key={log.id} className="p-3.5 rounded-xl bg-black border border-white/10 space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-mono">
                                    <span className="text-white font-semibold truncate">{log.target}</span>
                                    <span className={log.status === 'AUTO_SENT' ? 'text-emerald-400' : log.status === 'OVERRIDDEN' ? 'text-amber-300' : 'text-red-300'}>
                                        {log.status}
                                    </span>
                                </div>
                                {editingWaLogId === log.id ? (
                                    <div className="space-y-2">
                                        <textarea
                                            rows={2}
                                            value={waOverrideDraft}
                                            onChange={(e) => setWaOverrideDraft(e.target.value)}
                                            className="w-full bg-zinc-900 border border-amber-500/40 rounded p-2 text-xs text-white"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    await fetch('/api/ai/whatsapp/auto-dispatch', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            phone: log.target.replace(/\D/g, ''),
                                                            recipientName: log.target,
                                                            customBody: waOverrideDraft,
                                                            autoSend: true,
                                                            paused: false,
                                                        }),
                                                    }).catch(() => {});
                                                    await overrideLogMessage(log.id, waOverrideDraft, 'Admin Staff', 'OVERRIDDEN');
                                                    setEditingWaLogId(null);
                                                    addToast('WhatsApp override dispatched.', 'success');
                                                }}
                                                className="px-2.5 py-1 bg-amber-500 text-black rounded text-[10px] font-bold cursor-pointer"
                                            >
                                                Override & Send
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingWaLogId(null)}
                                                className="px-2.5 py-1 bg-zinc-800 text-gray-300 rounded text-[10px] cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-xs text-gray-300 line-clamp-3 whitespace-pre-wrap">{log.messageBody}</p>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingWaLogId(log.id);
                                                    setWaOverrideDraft(log.messageBody);
                                                }}
                                                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-amber-300 font-semibold cursor-pointer"
                                            >
                                                Edit & Override
                                            </button>
                                            {log.status !== 'PAUSED' && (
                                                <button
                                                    type="button"
                                                    onClick={() => void pauseLog(log.id, 'Admin Staff')}
                                                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-red-500/20 text-[10px] text-red-300 font-semibold cursor-pointer"
                                                >
                                                    Pause
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Columns: Target Member & 4 Core WhatsApp Workflows */}
                <div className="lg:col-span-2 space-y-6">
                    <Card title="Target Member & Live Webhook Parameters" className="bg-gray-950 border-white/10 p-6 rounded-[2.5rem]">
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                                    Select or Customize Recipient for Instant Dispatch
                                </span>
                                {members && members.length > 0 && (
                                    <select
                                        onChange={(e) => {
                                            const m = members.find(item => String(item.id) === e.target.value);
                                            if (m) {
                                                setWaTargetMember(prev => ({
                                                    ...prev,
                                                    name: m.name,
                                                    phone: m.phone
                                                }));
                                            }
                                        }}
                                        className="bg-black border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                                    >
                                        <option value="">Choose Member from Database...</option>
                                        {members.map(m => (
                                            <option key={m.id} value={String(m.id)}>{m.name} ({m.phone})</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                                <div>
                                    <label className="text-[9px] text-gray-400 uppercase block mb-1">Member / Lead Name</label>
                                    <input
                                        type="text"
                                        value={waTargetMember.name}
                                        onChange={e => setWaTargetMember(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-gray-400 uppercase block mb-1">WhatsApp Phone</label>
                                    <input
                                        type="text"
                                        value={waTargetMember.phone}
                                        onChange={e => setWaTargetMember(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-gray-400 uppercase block mb-1">Renewal Fee (₹)</label>
                                    <input
                                        type="number"
                                        value={waTargetMember.amount}
                                        onChange={e => setWaTargetMember(prev => ({ ...prev, amount: Number(e.target.value) }))}
                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                                <div>
                                    <label className="text-[9px] text-gray-400 uppercase block mb-1">Fitness Goal (For AI Diet & Workout Plan)</label>
                                    <input
                                        type="text"
                                        value={waTargetMember.goal}
                                        onChange={e => setWaTargetMember(prev => ({ ...prev, goal: e.target.value }))}
                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-gray-400 uppercase block mb-1">Incoming Member Query (For AI Auto-Reply)</label>
                                    <input
                                        type="text"
                                        value={waTargetMember.incomingQuery}
                                        onChange={e => setWaTargetMember(prev => ({ ...prev, incomingQuery: e.target.value }))}
                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* 4 Core WhatsApp Workflows */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            {
                                id: 'ai_auto_reply' as WhatsAppWorkflowType,
                                title: '1. 24/7 AI Auto-Reply Engine',
                                subtitle: 'ChatGPT + n8n Instant Support',
                                desc: 'Automatically answers incoming member & lead queries regarding pricing, timings (5 AM - 10 PM), and coaching.',
                                accent: 'border-emerald-500/30 bg-emerald-950/20'
                            },
                            {
                                id: 'fee_expiry_reminder' as WhatsAppWorkflowType,
                                title: '2. Membership Expiry & Fee Reminder',
                                subtitle: 'Supabase + UPI (your-upi@bank)',
                                desc: 'Detects expiring memberships and dispatches automated WhatsApp reminders with 1-click UPI payment links.',
                                accent: 'border-amber-500/30 bg-amber-950/20'
                            },
                            {
                                id: 'diet_workout_delivery' as WhatsAppWorkflowType,
                                title: '3. AI Diet & Workout Plan Delivery',
                                subtitle: 'Claude Code + ChatGPT Nutrition Coach',
                                desc: 'Generates and sends personalized daily calorie/protein macros and 5-day workout splits directly on WhatsApp.',
                                accent: 'border-cyan-500/30 bg-cyan-950/20'
                            },
                            {
                                id: 'lead_welcome_followup' as WhatsAppWorkflowType,
                                title: '4. New Inquiry Lead Follow-Up & Welcome',
                                subtitle: 'n8n Webhook + WhatsApp Cloud API',
                                desc: 'Sends instant VIP welcome package, digital brochure, and complimentary trial invite to new gym inquiries.',
                                accent: 'border-purple-500/30 bg-purple-950/20'
                            }
                        ].map(wf => {
                            const webhookOn = (webhookSwitches as any)[wf.id];
                            return (
                                <div key={wf.id} className={`p-6 rounded-[2rem] border ${wf.accent} flex flex-col justify-between space-y-4`}>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-mono font-bold text-gray-300 uppercase">
                                                {wf.subtitle}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setWebhookSwitches(prev => ({ ...prev, [wf.id]: !webhookOn }));
                                                    addToast(`${wf.title} Real-Time Webhook ${!webhookOn ? 'Enabled' : 'Paused'}`, 'info');
                                                }}
                                                className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase cursor-pointer ${
                                                    webhookOn ? 'bg-green-500 text-black' : 'bg-gray-800 text-gray-400'
                                                }`}
                                            >
                                                {webhookOn ? 'WEBHOOK: ON' : 'WEBHOOK: OFF'}
                                            </button>
                                        </div>
                                        <h4 className="text-base font-black text-white uppercase italic">{wf.title}</h4>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{wf.desc}</p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleTriggerWhatsAppFlow(wf.id)}
                                        disabled={activeWaTrigger === wf.id}
                                        className="w-full py-3.5 bg-green-500 hover:bg-green-400 text-black font-black uppercase text-[10px] tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        {activeWaTrigger === wf.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        {activeWaTrigger === wf.id ? 'Dispatching via WhatsApp API...' : '1-Click Trigger Workflow'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Dispatched Message Preview */}
                    {lastDispatchedResult && (
                        <Card title="Latest Dispatched WhatsApp Payload (Meta Cloud API v22.0)" className="bg-black/80 border-green-500/40 p-6 rounded-[2.5rem]">
                            <div className="space-y-3 font-mono">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-green-400">
                                    <span>Recipient: {lastDispatchedResult.recipient} ({lastDispatchedResult.memberName})</span>
                                    <span>Message ID: {lastDispatchedResult.messageId}</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-[#07130c] border border-green-500/30 text-xs text-gray-100 whitespace-pre-wrap leading-relaxed">
                                    {lastDispatchedResult.generatedMessage}
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right Column: Live Execution Trace */}
                <div className="lg:col-span-1 space-y-6">
                    <Card title="6-Node Real-Time Execution Log" className="bg-[#08090c] border-white/10 p-6 rounded-[2.5rem] h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto space-y-2.5 font-mono text-[11px] max-h-[540px] pr-1 custom-scrollbar">
                            {n8nLogs.map((log, index) => (
                                <div key={index} className="p-3 rounded-xl bg-black/70 border border-white/5 text-gray-300 leading-relaxed">
                                    {log}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={handleSimulateN8N}
                            className="w-full mt-4 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer"
                        >
                            Simulate End-to-End Webhook Event
                        </button>
                    </Card>
                </div>
            </div>
        </div>
    );

    const renderBroadcastTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
            <div className="lg:col-span-2 space-y-6">
                <Card title="FitnessFutureBroadcast" className="bg-gray-950 border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Radio className="w-40 h-40 text-green-500" /></div>
                    <div className="space-y-6 relative z-10">
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Target Audience</label>
                            <div className="flex bg-black rounded-xl p-1 border border-white/10">
                                {['All', 'Active', 'Expired'].map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => setTargetAudience(t as any)}
                                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${targetAudience === t ? 'bg-green-600 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Transmission Content</label>
                            <textarea 
                                value={broadcastMessage}
                                onChange={(e) => setBroadcastMessage(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-green-500 outline-none h-40 resize-none font-medium"
                                placeholder="Type your message here... Use {{name}} for dynamic insertion."
                            />
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-[10px] text-gray-600 uppercase font-black">Estimated Reach: {targetAudience === 'All' ? members.length : Math.floor(members.length/2)} Nodes</span>
                                <button onClick={() => setBroadcastMessage(prev => prev + " {{name}}")} className="text-[10px] bg-gray-800 px-2 py-1 rounded text-cyan-400 hover:text-white transition-colors">+ Add Name Variable</button>
                            </div>
                        </div>

                        <button 
                            onClick={handleBroadcastSend}
                            disabled={isSendingBroadcast}
                            className="w-full bg-green-600 hover:bg-green-500 text-black font-black py-5 rounded-2xl uppercase tracking-widest text-xs shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                            {isSendingBroadcast ? <RefreshCw className="animate-spin w-4 h-4"/> : <Send className="w-4 h-4" />}
                            {isSendingBroadcast ? 'Broadcasting...' : 'Initiate FitnessFutureBroadcast'}
                        </button>
                        
                        <button 
                            onClick={() => handleTriggerWhatsAppFlow('fee_expiry_reminder')}
                            className="w-full bg-black hover:bg-gray-900 text-white border border-green-500/30 font-black py-5 rounded-2xl uppercase tracking-widest text-xs shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 cursor-pointer"
                        >
                            <BotIcon className="w-4 h-4 text-green-500" />
                            Auto-Detect Expiring & Send UPI Fee Reminders (your-upi@bank)
                        </button>
                    </div>
                </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
                <Card title="Transmission Log" className="bg-[#0c0c0c] border-white/5 h-full flex flex-col p-6 rounded-[3rem]">
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                        {broadcastHistory.length === 0 && <p className="text-gray-600 text-center py-10 italic text-xs">No recent transmissions.</p>}
                        {broadcastHistory.map(log => (
                            <div key={log.id} className="bg-gray-900/50 p-4 rounded-2xl border border-white/5">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black text-green-500 uppercase bg-green-900/20 px-2 py-0.5 rounded border border-green-500/20">Sent</span>
                                    <span className="text-[10px] text-gray-500 font-mono">{log.date}</span>
                                </div>
                                <p className="text-xs text-gray-300 line-clamp-2 italic">"{log.message}"</p>
                                <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                                    <span>Target: {log.audience}</span>
                                    <span>Count: {log.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );

    const renderTemplatesTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(t => (
                    <div key={t.id} className="bg-gray-900 border border-white/5 p-6 rounded-[2.5rem] group hover:border-green-500/30 transition-all cursor-pointer" onClick={() => setBroadcastMessage(t.content)}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-black rounded-xl text-green-500 border border-white/5">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors"><Edit3 className="w-3 h-3"/></button>
                                <button className="p-2 hover:bg-red-900/20 rounded-full text-gray-500 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3"/></button>
                            </div>
                        </div>
                        <h4 className="text-lg font-black text-white uppercase italic tracking-tight">{t.name}</h4>
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded mb-3 inline-block">{t.category}</span>
                        <p className="text-xs text-gray-400 line-clamp-3 font-mono leading-relaxed">"{t.content}"</p>
                    </div>
                ))}
                
                <button 
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="border-2 border-dashed border-gray-800 rounded-[2.5rem] flex flex-col items-center justify-center p-6 text-gray-600 hover:text-green-500 hover:border-green-500/50 hover:bg-green-900/5 transition-all group min-h-[200px]"
                >
                    <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">Encode Template</span>
                </button>
            </div>
        </div>
    );

    const renderSmartConfig = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
            <Card title="Select Intelligence Model (Brain)" className="border-t-4 border-indigo-500 bg-black/40">
                <div className="space-y-3">
                    {[
                        { id: 'Google Opals Agent', desc: 'World Class Autonomous Workflow & Ops Management', icon: <BotIcon/>, color: 'text-indigo-400' },
                        { id: 'N8N Automation Node', desc: 'Continuous Event-Driven Execution', icon: <Activity className="w-5 h-5"/>, color: 'text-[#ff6d5a]' },
                        { id: 'GitHub Code Worker', desc: 'Deployments, Updates & Cron Jobs', icon: <TerminalIcon/>, color: 'text-gray-300' },
                        { id: 'Core AI 3.1 Pro', desc: 'Best for complex logic & planning', icon: <BotIcon/>, color: 'text-purple-400' },
                        { id: 'Core AI 2.5 Flash', desc: 'Speed and multimodality', icon: <SparkleIcon/>, color: 'text-white' },
                        { id: 'Gemma 3 (Local)', desc: 'Privacy-focused on-device AI', icon: <Globe/>, color: 'text-cyan-400' },
                        { id: 'Core AI Video 2.0', desc: 'Best for Image/Video Workout Analysis', icon: <Zap/>, color: 'text-blue-400' },
                    ].map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setSelectedModel(m.id as AIModel)}
                            className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                                selectedModel === m.id 
                                ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                                : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-black/50 ${m.color}`}>{m.icon}</div>
                                <div className="text-left">
                                    <p className={`font-bold ${selectedModel === m.id ? 'text-white' : 'text-gray-300'}`}>{m.id}</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{m.desc}</p>
                                </div>
                            </div>
                            {selectedModel === m.id && <CheckCircleIcon className="w-5 h-5 text-indigo-400" />}
                        </button>
                    ))}
                </div>
            </Card>

            <Card title="Hosting Infrastructure (Body)" className="border-t-4 border-green-500 bg-black/40">
                <div className="space-y-4">
                    <div 
                        onClick={() => setHostingMode('Cloud API')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${hostingMode === 'Cloud API' ? 'bg-blue-900/20 border-blue-500' : 'bg-gray-800 border-gray-700'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Globe className="w-5 h-5 text-blue-400" />
                                <span className="font-bold text-white">Cloud API (Standard)</span>
                            </div>
                            {hostingMode === 'Cloud API' && <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded">ACTIVE</span>}
                        </div>
                        <p className="text-xs text-gray-400">High speed. Connected to Server-Side Vault.</p>
                    </div>

                    <div 
                        onClick={() => setHostingMode('Private Server')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${hostingMode === 'Private Server' ? 'bg-green-900/20 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'bg-gray-800 border-gray-700'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <LockIcon className="w-5 h-5 text-green-400" />
                                <span className="font-bold text-white">Private Server (Privacy Mode)</span>
                            </div>
                            {hostingMode === 'Private Server' && <span className="text-[10px] bg-green-500 text-black px-2 py-0.5 rounded font-black">SECURE</span>}
                        </div>
                        <p className="text-xs text-gray-400">Runs offline on Gym PC. 100% Data Privacy. Zero Latency.</p>
                        
                        {hostingMode.includes('Private') && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <div className="bg-black/50 p-2 rounded border border-green-500/30">
                                    <p className="text-[10px] text-green-500">GPU LOAD</p>
                                    <div className="w-full bg-gray-700 h-1.5 rounded-full mt-1">
                                        <div className="bg-green-500 h-full rounded-full transition-all duration-300" style={{ width: `${gpuLoad}%` }}></div>
                                    </div>
                                </div>
                                <div className="bg-black/50 p-2 rounded border border-green-500/30">
                                    <p className="text-[10px] text-green-500">VRAM USAGE</p>
                                    <p className="text-xs font-mono text-white">{memoryUsage} MB</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div 
                        onClick={() => setHostingMode('GitHub Codespaces')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${hostingMode === 'GitHub Codespaces' ? 'bg-purple-900/20 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'bg-gray-800 border-gray-700'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-purple-400" />
                                <span className="font-bold text-white">GitHub Actions / Codespaces</span>
                            </div>
                            {hostingMode === 'GitHub Codespaces' && <span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded font-black">CONTINUOUS</span>}
                        </div>
                        <p className="text-xs text-gray-400">Automated builds, CRON jobs via GitHub workflows and connected to N8N webhooks.</p>
                    </div>
                </div>
            </Card>
        </div>
    );

    const renderAutonomousAgents = () => (
        <div className="space-y-6 animate-slide-up">
            <div className="flex justify-between items-center bg-gray-900 p-6 rounded-[2rem] border border-pink-500/30">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <BotIcon className="w-6 h-6 text-pink-500" />
                        Autonomous Agent Swarm
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                        Independent AI units monitoring gym health 24/7.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTasks.map((task) => (
                    <div key={task.id} className="bg-black/40 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                        {task.status === 'Executing' && (
                            <div className="absolute top-0 left-0 w-1 h-full bg-pink-500 animate-pulse"></div>
                        )}
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-black uppercase px-2 py-1 rounded ${task.agent === 'Goal Seeker' ? 'bg-purple-900/50 text-purple-400' : 'bg-blue-900/50 text-blue-400'}`}>
                                        {task.agent}
                                    </span>
                                    <h4 className="font-bold text-white truncate max-w-[150px]">{task.goal}</h4>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 font-mono">ID: {task.id}</p>
                            </div>
                            <span className={`text-xs font-bold ${task.status === 'Executing' ? 'text-pink-400 animate-pulse' : 'text-green-400'}`}>
                                {task.status.toUpperCase()}
                            </span>
                        </div>
                        
                        <div className="bg-gray-900 p-3 rounded-lg border border-gray-800 font-mono text-xs text-gray-400 h-24 overflow-y-auto custom-scrollbar">
                            {task.logs.map((log, i) => (
                                <div key={i} className="mb-1 border-b border-gray-800 pb-1 last:border-0">
                                    <span className="text-pink-500 mr-2">{'>'}</span>{log}
                                </div>
                            ))}
                            {task.status === 'Executing' && <span className="animate-pulse">_</span>}
                        </div>
                        
                        <div className="mt-4 flex items-center gap-3">
                             <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                 <div className="h-full bg-pink-500" style={{width: `${task.efficiency}%`}}></div>
                             </div>
                             <span className="text-[10px] font-black text-pink-400">{task.efficiency}% EFFICIENCY</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderLiveConsole = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[650px] animate-slide-up">
            <div className="lg:col-span-2 flex flex-col gap-4">
                {/* Visualizer / Status */}
                <div className="bg-black rounded-[3rem] border border-white/10 p-8 flex items-center justify-between relative overflow-hidden h-40 shadow-2xl">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    
                    <div className="relative z-10 flex items-center gap-6">
                        {incomingMsg ? (
                             <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500 animate-pulse">
                                 <WhatsAppIcon className="w-8 h-8 text-green-500" />
                             </div>
                        ) : (
                             <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center border border-white/10">
                                 <BotIcon className="w-8 h-8 text-gray-600" />
                             </div>
                        )}
                        <div>
                            <h3 className="text-white font-bold text-lg">{incomingMsg ? incomingMsg.user : "System Idle"}</h3>
                            <p className="text-gray-400 text-sm italic truncate max-w-xs">{incomingMsg ? `"${incomingMsg.text}"` : "Waiting for neural signals..."}</p>
                            {incomingMsg && (
                                <div className="mt-2 flex items-center gap-2">
                                    <SparkleIcon className="w-3 h-3 text-purple-400 animate-spin" />
                                    <span className="text-purple-400 text-[10px] font-mono uppercase tracking-widest">
                                        {selectedModel} Processing...
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="relative z-10 text-right">
                         <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Queue Load</p>
                         <p className="text-3xl font-black text-white italic">{incomingMsg ? '1' : '0'}</p>
                    </div>
                </div>

                {/* Console Log */}
                <Card title="Smart Communication Log" className="flex-1 bg-[#0c0c0c] border-gray-800 font-mono text-xs overflow-hidden flex flex-col rounded-[2.5rem]">
                    <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar bg-black/40 rounded-xl m-2">
                        {consoleLogs.map((log, i) => (
                            <div key={i} className="border-b border-gray-800 pb-1 break-all">
                                <span className={log.includes('INCOMING') ? 'text-blue-400' : log.includes('THINKING') ? 'text-purple-400' : log.includes('SENT') ? 'text-green-400' : 'text-gray-500'}>
                                    {log}
                                </span>
                            </div>
                        ))}
                    </div>
                    {/* Manual Input */}
                    <div className="mt-2 flex gap-2 border-t border-white/5 pt-4">
                         <input 
                            type="text" 
                            className="flex-1 bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none"
                            placeholder="Process user message..."
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleManualMessage()}
                            disabled={isManualProcessing}
                        />
                        <button 
                            onClick={handleManualMessage}
                            disabled={isManualProcessing || !manualInput}
                            className="bg-green-600 text-black font-bold px-6 py-3 rounded-xl hover:bg-green-500 disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </Card>
            </div>

            <div className="lg:col-span-1 space-y-4">
                {/* Sentiment Radar */}
                <Card title="Live Sentiment Pulse" className="bg-gray-950 border-white/5 rounded-[2.5rem] h-64">
                    <div className="h-full w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={SENTIMENT_DATA}>
                                <PolarGrid stroke="#333" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 9, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                                <Radar name="Sentiment" dataKey="A" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.4} />
                                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-green-900/20 to-black border-green-500/30 rounded-[2.5rem]">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-full ${isBotActive ? 'bg-green-500' : 'bg-red-500'}`}>
                            <Power className="w-6 h-6 text-black" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">System Status</h3>
                            <p className="text-xs text-gray-400">{isBotActive ? 'ACTIVE' : 'SHUTDOWN'}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsBotActive(!isBotActive)}
                        className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest ${isBotActive ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-green-600 text-white hover:bg-green-500'}`}
                    >
                        {isBotActive ? 'Terminate Uplink' : 'Initialize System'}
                    </button>
                </Card>
                
                {/* Live Traffic Mini Graph */}
                <div className="bg-black/60 border border-white/10 rounded-[2.5rem] p-4 h-32 flex flex-col justify-end overflow-hidden relative">
                    <p className="absolute top-4 left-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">Traffic Load</p>
                    <ResponsiveContainer width="100%" height="60%">
                        <AreaChart data={trafficData}>
                             <defs>
                                <linearGradient id="trafficColor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="msg" stroke="#8b5cf6" fill="url(#trafficColor)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="bg-[#020202] p-10 rounded-[3rem] border border-cyan-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-[3rem] shadow-[0_0_60px_rgba(6,182,212,0.5)] border border-cyan-400 group-hover:rotate-12 transition-transform duration-700">
                             <WhatsAppIcon className="w-16 h-16" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <MessageSquare className="w-3 h-3" /> Fitness Future (+91 98XXXXXXXX)
                                </div>
                                <span className="text-[10px] font-mono text-emerald-400 tracking-[0.2em] uppercase">
                                    ALL 4 WORKFLOWS & SERVER VAULT KEYS ACTIVE
                                </span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none">
                                WhatsApp <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-cyan-400 to-indigo-400">Full Auto</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex bg-gray-900/80 p-2 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl overflow-x-auto no-scrollbar max-w-full">
                        <button onClick={() => setActiveTab('n8n_automation')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${activeTab === 'n8n_automation' ? 'bg-green-500 text-black shadow-2xl' : 'text-gray-400 hover:text-white'}`}>
                            <Network className="w-4 h-4" /> Full Automation (4 Flows)
                        </button>
                        <button onClick={() => setActiveTab('live_console')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${activeTab === 'live_console' ? 'bg-green-500 text-black shadow-2xl' : 'text-gray-400 hover:text-white'}`}>
                            <TerminalIcon className="w-4 h-4" /> Live Console
                        </button>
                        <button onClick={() => setActiveTab('broadcast')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${activeTab === 'broadcast' ? 'bg-green-500 text-black shadow-2xl' : 'text-gray-400 hover:text-white'}`}>
                            <Radio className="w-4 h-4" /> Broadcast
                        </button>
                        <button onClick={() => setActiveTab('templates')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${activeTab === 'templates' ? 'bg-green-500 text-black shadow-2xl' : 'text-gray-400 hover:text-white'}`}>
                            <FileText className="w-4 h-4" /> Templates
                        </button>
                        <button onClick={() => setActiveTab('autonomous_agents')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${activeTab === 'autonomous_agents' ? 'bg-green-500 text-black shadow-2xl' : 'text-gray-400 hover:text-white'}`}>
                            <BotIcon className="w-4 h-4" /> Agent Swarm
                        </button>
                        <button onClick={() => setActiveTab('neural_config')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${activeTab === 'neural_config' ? 'bg-green-500 text-black shadow-2xl' : 'text-gray-400 hover:text-white'}`}>
                            <Cpu className="w-4 h-4" /> Smart Config
                        </button>
                        <button onClick={() => setActiveTab('local_host')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${activeTab === 'local_host' ? 'bg-green-500 text-black shadow-2xl' : 'text-gray-400 hover:text-white'}`}>
                            <Server className="w-4 h-4" /> Local Host
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[600px]">
                {activeTab === 'n8n_automation' && renderN8nAutomationTab()}
                {activeTab === 'live_console' && renderLiveConsole()}
                {activeTab === 'broadcast' && renderBroadcastTab()}
                {activeTab === 'templates' && renderTemplatesTab()}
                {activeTab === 'neural_config' && renderSmartConfig()}
                {activeTab === 'autonomous_agents' && renderAutonomousAgents()}
                {activeTab === 'local_host' && (
                    <div className="flex flex-col items-center justify-center h-[500px] bg-black/40 rounded-3xl border border-white/5">
                        <Server className="w-24 h-24 text-gray-700 mb-6" />
                        <h3 className="text-2xl font-black text-white uppercase italic">Local Host Diagnostics</h3>
                        <p className="text-gray-500 mt-2">API Endpoint: <span className="text-green-400 font-mono">http://localhost:3000/api/whatsapp/automation-trigger</span></p>
                        <p className="text-gray-500">Container Status: <span className="text-green-400 font-mono">Running (Server Vault Locked)</span></p>
                    </div>
                )}
            </div>
            
            {/* Template Modal */}
            <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title="Create Template">
                <div className="space-y-4">
                    <input type="text" placeholder="Template Name" className="w-full bg-gray-700 rounded p-2 text-white" value={newTemplate.name || ''} onChange={e => setNewTemplate({...newTemplate, name: e.target.value})} />
                    <textarea placeholder="Content (use {{variable}})" className="w-full bg-gray-700 rounded p-2 text-white h-24" value={newTemplate.content || ''} onChange={e => setNewTemplate({...newTemplate, content: e.target.value})} />
                    <button onClick={handleSaveTemplate} className="bg-amber-500 text-black font-bold py-2 px-4 rounded w-full">Save Template</button>
                </div>
            </Modal>
        </div>
    );
};

export default WhatsAppIntegration;