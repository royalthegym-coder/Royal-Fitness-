import React, { useState, useEffect, useMemo } from 'react';
import Card from './common/Card';
import { 
    Globe, Activity, Users, ShieldCheck, Cpu, Database, 
    Zap, Brain, Network, Terminal, Radio, Orbit, 
    Fingerprint, Gauge, Server, ShieldAlert, Sparkles,
    GitBranch, Search, Wrench, FileText, UserCheck, Flame, Send, RefreshCw, Layers,
    MessageSquare, PhoneCall
} from 'lucide-react';
import { useData } from '../context/DataProvider';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../hooks/useToast';

interface ModelNode {
    id: string;
    name: string;
    alias: string;
    status: 'ONLINE' | 'STANDBY' | 'SYNCING';
    color: string;
    bgGlow: string;
    icon: React.ReactNode;
    capability: string;
    latency: string;
}

const FutureOvermind: React.FC = () => {
    const { activeMemberCount, systemHealth, auditLogs, evolutionLevel, systemVersion, members, transactions } = useData();
    const { addToast } = useToast();
    
    // UI Local State
    const [networkLoad, setNetworkLoad] = useState(42.5);
    const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
    const [commandInput, setCommandInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string | null>('core_ai');
    
    // UI Phase States
    const [selectedTab, setSelectedTab] = useState<'swarm' | 'routing' | 'grounding' | 'healing' | 'whatsapp'>('swarm');
    const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
    const [routerInput, setRouterInput] = useState('Show me the top 3 AI news stories from this morning, analyze them, and turn them into code.');
    const [isRouting, setIsRouting] = useState(false);
    const [routingOutput, setRoutingOutput] = useState<{ target_agent: string; sub_tasks: string[] } | null>(null);
    
    const [groundingSearch, setGroundingSearch] = useState('Gym dynamic training protocols');
    const [isSearching, setIsSearching] = useState(false);
    const [groundedResults, setGroundedResults] = useState<{
        verified_truth: string;
        grok_verdict: string;
        citations: { id: number; title: string; url: string; source: string }[];
    } | null>(null);

    // Phase 4: WhatsApp bot Simulator active states
    const [whatsappInput, setWhatsappInput] = useState('');
    const [whatsappMessages, setWhatsappMessages] = useState<Array<{ sender: 'user' | 'bot' | 'system'; text: string; time: string }>>([
        { sender: 'user', text: "Retrieve today's AI news and prepare an analysis.", time: '01:31 PM' },
        { 
            sender: 'bot', 
            text: "🤖 *Omni-Intelligence Brain Response*:\n\nToday's major AI developments are as follows:\n\n1. *Core AI 1.5 Pro & Flash*: Massive upgrades in SmartCore AI.\n2. *Deep Search Engine & Twitter Integration*: Realtime Reactor + Deep Search Engine combination went live for real-time data sourcing.\n\n*Analysis*: Self-repair loops are now fully functional in production.", 
            time: '01:32 PM' 
        }
    ]);
    const [activeWhatsappStep, setActiveWhatsappStep] = useState<number>(0);
    const [isWhatsAppProcessing, setIsWhatsAppProcessing] = useState(false);
    const [whatsappSessionActive, setWhatsappSessionActive] = useState(true);
    const [whatsappHandoffActive, setWhatsappHandoffActive] = useState(false);

    const [simulatedCrashes, setSimulatedCrashes] = useState<Array<{ id: string; error: string; time: string; status: 'CRITICAL' | 'REPAIRING' | 'RESOLVED' }>>([
        { id: 'ERR_IDX_02', error: 'Database transaction deadlock on high-volume member admission queue', time: '10:42 AM', status: 'RESOLVED' },
        { id: 'ERR_N8N_33', error: 'WhatsApp Webhook timeout during automated premium upgrade lifecycle trigger', time: '11:15 AM', status: 'RESOLVED' }
    ]);
    const [isRepairing, setIsRepairing] = useState(false);
    const [repairAttempts, setRepairAttempts] = useState(0);
    const [vetoAlertTriggered, setVetoAlertTriggered] = useState(false);
    const [activeRepairPhase, setActiveRepairPhase] = useState<'idle' | 'analyzing' | 'committing' | 'pushing' | 'failed' | 'success'>('idle');
    
    // Self-evolution counters
    const [mutationIndex, setMutationIndex] = useState(94.8);
    const [cognitiveForce, setCognitiveForce] = useState(88);
    
    // Orchestrated responses from /api/brain/query
    const [intelligenceData, setIntelligenceData] = useState<{
        geminiResponse: string;
        openaiResponse: string;
        grokResponse: string;
        perplexityResponse: string;
        kimiResponse: string;
        humanResponse: string;
        openclawResponse: string;
        githubResponse: string;
        n8nResponse: string;
        opalsResponse: string;
        finalAggregatedPlan: string;
        orchestrationTrace: string[];
        evolutionScore: number;
    }>({
        geminiResponse: 'Active. Standing by to coordinate multi-agent directives.',
        openaiResponse: 'Standing by. Standard diagnostic models are prepared for high-cognitive auditing.',
        grokResponse: 'Online. Real-time community x-feed datasets indexed with zero latency issues.',
        perplexityResponse: 'Online. Direct multi-source search query engine ready to ground insights.',
        kimiResponse: 'Online. Long-context biometric reports and policy manual indexes fully compiled.',
        humanResponse: 'Sensing. DNA profiling variables and metabolic marker streams initialized.',
        openclawResponse: 'Online. IoT turnstiles, biometric gates, and thermal imaging cameras synchronized.',
        githubResponse: 'Online. Repository branch verified. Ready for automated code repair & hotfix deployments.',
        n8nResponse: 'Online. Visual trigger node workflows listening for live app and payment events.',
        opalsResponse: 'Online. Customer reviews and Google Business gateway sentiments tracked.',
        finalAggregatedPlan: 'The overmind system is functioning at maximum efficiency. Enter any custom administrative prompt or click one of our automated templates below to run comprehensive multi-model cognitive synthesis.',
        orchestrationTrace: [
            'System startup protocol initiated safely.',
            'Central gateway connected to Local Storage Matrix.',
            'Multi-Model Singularity network connected.'
        ],
        evolutionScore: 98.4
    });

    // Automatically update minor parameters to Process a continuously updating brain (Self-refresh)
    useEffect(() => {
        const interval = setInterval(() => {
            setNetworkLoad(prev => {
                const delta = (Math.random() - 0.5) * 4;
                return Math.max(15, Math.min(99.5, prev + delta));
            });
            setCognitiveForce(prev => {
                const delta = Math.floor((Math.random() - 0.5) * 3);
                return Math.max(70, Math.min(100, prev + delta));
            });
            setLastUpdated(new Date().toLocaleTimeString());
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const modelSwarm = useMemo<ModelNode[]>(() => [
        { 
            id: 'core_ai', 
            name: 'Core AI Intelligence', 
            alias: 'Gemini-6.0-Quantum-Apex', 
            status: 'ONLINE', 
            color: 'text-indigo-400 border-indigo-500/30', 
            bgGlow: 'from-indigo-950/40 via-indigo-950/10 to-transparent',
            icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
            capability: 'Core coordinator and high-speed semantic synthesizer',
            latency: '14ms'
        },
        { 
            id: 'Cloud Logic AI', 
            name: 'Logic Node Engine', 
            alias: 'GPT-5-Omni-Genesis', 
            status: 'ONLINE', 
            color: 'text-emerald-400 border-emerald-500/30', 
            bgGlow: 'from-emerald-950/40 via-emerald-950/10 to-transparent',
            icon: <Zap className="w-5 h-5 text-emerald-400" />,
            capability: 'Logical strategy auditing & comprehensive policy structuring',
            latency: '26ms'
        },
        { 
            id: 'Realtime Reactor', 
            name: 'Realtime Reactor Intelligence', 
            alias: 'grok-2.5-realtime', 
            status: 'ONLINE', 
            color: 'text-amber-400 border-amber-500/30', 
            bgGlow: 'from-amber-950/40 via-amber-950/10 to-transparent',
            icon: <Flame className="w-5 h-5 text-amber-400" />,
            capability: 'Witty contextual logic, high-speed feedback & database queries',
            latency: '8ms'
        },
        { 
            id: 'Deep Search Engine', 
            name: 'Deep Search Engine AI', 
            alias: 'sonar-pro-search', 
            status: 'ONLINE', 
            color: 'text-cyan-400 border-cyan-500/30', 
            bgGlow: 'from-cyan-950/40 via-cyan-950/10 to-transparent',
            icon: <Search className="w-5 h-5 text-cyan-400" />,
            capability: 'Fact-checking search grounding & direct source verification',
            latency: '34ms'
        },
        { 
            id: 'kimi', 
            name: 'Kimi Intelligence', 
            alias: 'kimi-moonshot-200k', 
            status: 'ONLINE', 
            color: 'text-blue-400 border-blue-500/30', 
            bgGlow: 'from-blue-950/40 via-blue-950/10 to-transparent',
            icon: <FileText className="w-5 h-5 text-blue-400" />,
            capability: 'Extreme contextual document analyzer & historical logs indexer',
            latency: '45ms'
        },
        { 
            id: 'openhuman', 
            name: 'OpenHuman AI', 
            alias: 'humanity-health-v3', 
            status: 'ONLINE', 
            color: 'text-red-400 border-red-500/30', 
            bgGlow: 'from-red-950/40 via-red-950/10 to-transparent',
            icon: <UserCheck className="w-5 h-5 text-red-400" />,
            capability: 'Bio-metabolism tracking, DNA sequencing & RPPG logs mapping',
            latency: '19ms'
        },
        { 
            id: 'openclaw', 
            name: 'OpenClaw Systems', 
            alias: 'claw-hardware-endpoint', 
            status: 'STANDBY', 
            color: 'text-purple-400 border-purple-500/30', 
            bgGlow: 'from-purple-950/40 via-purple-950/10 to-transparent',
            icon: <Wrench className="w-5 h-5 text-purple-400" />,
            capability: 'IoT physical security turnstiles, locks & visual scanner gateway',
            latency: '9ms'
        },
        { 
            id: 'github', 
            name: 'GitHub Copilot Sync', 
            alias: 'git-action-auto-updater', 
            status: 'ONLINE', 
            color: 'text-pink-400 border-pink-500/30', 
            bgGlow: 'from-pink-950/40 via-pink-950/10 to-transparent',
            icon: <GitBranch className="w-5 h-5 text-pink-400" />,
            capability: 'Automated code repair, self-learning diagnostic script builder',
            latency: '53ms'
        },
        { 
            id: 'n8n', 
            name: 'N8N Workflow Automation', 
            alias: 'n8n-active-synapse', 
            status: 'ONLINE', 
            color: 'text-teal-400 border-teal-500/30', 
            bgGlow: 'from-teal-950/40 via-teal-950/10 to-transparent',
            icon: <Network className="w-5 h-5 text-teal-400" />,
            capability: 'Multi-webhook flows, payment hooks, automated CRM actions',
            latency: '15ms'
        },
        { 
            id: 'googleopals', 
            name: 'Google Opals Agent', 
            alias: 'google-opals-reputation-v2', 
            status: 'ONLINE', 
            color: 'text-yellow-400 border-yellow-500/30', 
            bgGlow: 'from-yellow-950/40 via-yellow-950/10 to-transparent',
            icon: <Cpu className="w-5 h-5 text-yellow-400" />,
            capability: 'Interactive review sentiments, automated WhatsApp feedbacks provider',
            latency: '18ms'
        }
    ], []);

    const activeModelDetails = useMemo(() => {
        return modelSwarm.find(m => m.id === selectedModel) || modelSwarm[0];
    }, [selectedModel, modelSwarm]);

    const handleModelSynthesis = async (commandText: string) => {
        if (!commandText.trim()) return;
        setIsProcessing(true);
        addToast('Multi-Agent core syncing coordinates. Optimizing automation matrices...', 'info');
        
        try {
            const res = await fetch('/api/brain/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    command: commandText,
                    context: {
                        activeMembers: activeMemberCount,
                        membersCount: members?.length || 0,
                        lastKnownHealth: systemHealth,
                        version: systemVersion
                    }
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setIntelligenceData({
                        geminiResponse: data.geminiResponse,
                        openaiResponse: data.openaiResponse,
                        grokResponse: data.grokResponse,
                        perplexityResponse: data.perplexityResponse,
                        kimiResponse: data.kimiResponse,
                        humanResponse: data.humanResponse,
                        openclawResponse: data.openclawResponse,
                        githubResponse: data.githubResponse,
                        n8nResponse: data.n8nResponse,
                        opalsResponse: data.opalsResponse,
                        finalAggregatedPlan: data.finalAggregatedPlan,
                        orchestrationTrace: data.orchestrationTrace,
                        evolutionScore: data.evolutionScore
                    });
                    
                    if (data.evolutionScore) {
                        setMutationIndex(prev => Math.min(100, Math.max(90, prev + (Math.random() - 0.5))));
                    }
                    addToast('Brain successfully completed cognitive updates for full automation!', 'success');
                } else {
                    addToast('Synapse returned warning. Implemented local backup loop.', 'info');
                }
            } else {
                addToast('Unable to connect with Live Singularity Engine. Core operates on local network.', 'error');
            }
        } catch (error) {
            console.error(error);
            addToast('Synchronous connection failure. Local simulated cache maintained physical systems.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const runAutomatedTemplate = (text: string) => {
        setCommandInput(text);
        handleModelSynthesis(text);
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedSnippet(label);
        addToast(`${label} copied to clipboard successfully!`, 'success');
        setTimeout(() => setCopiedSnippet(null), 3000);
    };

    const handlePhase1Route = (text: string) => {
        if (!text.trim()) return;
        setIsRouting(true);
        addToast('[n8n Webhook Node] Input received! Directing to Core AI Manager Node...', 'info');
        
        setTimeout(() => {
            let target = 'OPENAI_NODE';
            let subTasks = ['Analyze complex logical requirement', 'Compile custom diagnostic strategy code'];
            const lower = text.toLowerCase();
            
            if (lower.includes('news') || lower.includes('live') || lower.includes('stock') || lower.includes('weather') || lower.includes('top 3')) {
                target = 'PERPLEXITY_GROK_NODE';
                subTasks = ['Fetch top 3 AI/health trending current updates', 'Submit sourced citations to Cloud Logic AI Node for custom code compile'];
            } else if (lower.includes('pdf') || lower.includes('context') || lower.includes('book') || lower.includes('policy') || lower.includes('manual')) {
                target = 'KIMI_LONG_CONTEXT_NODE';
                subTasks = ['Load context payload into moonshot buffer', 'Parse complex training regulations & manuals'];
            } else if (lower.includes('image') || lower.includes('video') || lower.includes('visual') || lower.includes('pose') || lower.includes('camera')) {
                target = 'GOOGLE_VISION_NODE';
                subTasks = ['Process multi-spectral frame inputs', 'Generate canvas overlay coordinates and pose safety indicators'];
            } else if (lower.includes('pay') || lower.includes('payment') || lower.includes('delete') || lower.includes('sensitive') || lower.includes('change')) {
                target = 'HUMAN_APPROVAL_NODE';
                subTasks = ['Dispatch emergency SMS notification to Owner Gateway', 'Await interactive supervisor biometric verification'];
            }

            setRoutingOutput({
                target_agent: target,
                sub_tasks: subTasks
            });
            setIsRouting(false);
            
            // Add a trace log to orchestrationTrace
            setIntelligenceData(prev => ({
                ...prev,
                orchestrationTrace: [
                    `[n8n Webhook] Webhook trigger successfully fired. Input parsed: "${text.substring(0, 40)}..."`,
                    `[Core AI Manager] Analyzing logical complexity score. Classifying target node as ${target}.`,
                    `[Switch Node] Routing traffic payload down to ${target} path. Sub-tasks initialized.`,
                    ...prev.orchestrationTrace
                ]
            }));
            addToast('Traffic successfully routed down the n8n neuron channels!', 'success');
        }, 1500);
    };

    const handlePhase2Ground = (text: string) => {
        if (!text.trim()) return;
        setIsSearching(true);
        addToast('Deep Search Engine Sonar triggering web grounding crawler...', 'info');

        setTimeout(() => {
            let truth = '';
            let verdict = '';
            let cites = [];

            const t = text.toLowerCase();
            if (t.includes('gym') || t.includes('workout') || t.includes('training') || t.includes('protocol') || t.includes('health')) {
                truth = 'Modern athletic systems emphasize high-intensity intervals paired with neural rest periods. Grounding data indicates that active VO2 max monitoring prevents over-training syndromes in 94.2% of tested subjects.';
                verdict = 'Ah, hitting the heavy iron? My real-time telemetry confirms that grinding without targeted metabolic rest is just fancy self-sabotage. Keep your reps crisp, your recoveries strategic, and let Deep Search Engine do the heavy googling.';
                cites = [
                    { id: 1, title: 'Dynamic Biomarker Optimization Series', url: 'https://pubmed.ncbi.nlm.nih.gov/30491823', source: 'PubMed Central' },
                    { id: 2, title: 'Neurological Adaptation under Resistance Load Protocols', url: 'https://sciencedirect.com/journal/neural-load', source: 'ScienceDirect Archive' }
                ];
            } else if (t.includes('ai') || t.includes('Realtime Reactor') || t.includes('tech') || t.includes('node') || t.includes('model')) {
                truth = 'AI hardware acceleration clusters have expanded significantly. Recent indexes reflect that edge reasoning speeds are scaling under custom pruned quantization parameters, ensuring real-time Turnstile verification remains offline-safe.';
                verdict = 'Silicon is evolving faster than muscle fibers! Real-time telemetry proves that routing workloads on specialized edge nodes trims latency from 140ms straight down to single digits. Ready to boot up the singularity?';
                cites = [
                    { id: 1, title: 'Quantum Transformers on Pruned Mobile Topologies', url: 'https://arxiv.org/abs/2605.1042', source: 'arXiv Repository' },
                    { id: 2, title: 'State of Hardware Gateways & Bio-RFID Systems', url: 'https://techcrunch.com/rfid-iot-gateways-2026', source: 'TechCrunch Core' }
                ];
            } else {
                truth = `Current search index matches are stable. Grounded verified research indicates steady growth of automated cloud computing and full-stack software loops in the current calendar cycle.`;
                verdict = `Telemetry established. The web index looks green! Let me know which exact database, biomarker, or code structure needs real-time verification and I'll scour the web for you.`;
                cites = [
                    { id: 1, title: 'Autonomous Systems & Multi-Agent Standard Models', url: 'https://medium.com/overlord-automation-2026', source: 'Medium Engineering' }
                ];
            }

            setGroundedResults({
                verified_truth: truth,
                grok_verdict: verdict,
                citations: cites
            });
            setIsSearching(false);
            addToast('Grounding citations compiled! Realtime Reactor & Deep Search Engine are in mutual agreement.', 'success');
        }, 1800);
    };

    const triggerSimulatedCrash = () => {
        addToast('⚠️ processing SYSTEM EXCEPTION INJECT...', 'error');
        const randId = 'ERR_CRASH_' + Math.floor(100 + Math.random() * 900);
        const newCrash = {
            id: randId,
            error: 'CRITICAL ERROR: git action compiler conflict on custom biometric routing functions',
            time: new Date().toLocaleTimeString(),
            status: 'CRITICAL' as const
        };

        setSimulatedCrashes(prev => [newCrash, ...prev]);
        setVetoAlertTriggered(false);

        setIntelligenceData(prev => ({
            ...prev,
            orchestrationTrace: [
                `🚨 [ALERT] System exception detected! Error code: ${randId}.`,
                `🚨 [ANALYST] n8n Error Trigger activated. Isolated faling node: 'GitHub / Biometric Gate Sync'.`,
                `🔄 [INIT] Launching 'The Self-Correction Debugger' on SmartCore AI master nodes...`,
                ...prev.orchestrationTrace
            ]
        }));
    };

    const repairCrash = (id: string) => {
        if (vetoAlertTriggered) {
            addToast('🚫 Auto-Repair is BLOCKED by Human-in-the-Loop Veto Safeguard! Reset the system first.', 'error');
            return;
        }

        setIsRepairing(true);
        setActiveRepairPhase('analyzing');
        const nextAttempt = repairAttempts + 1;
        setRepairAttempts(nextAttempt);
        
        addToast(`🤖 Attempt ${nextAttempt}/3: Core analyser compiling error log...`, 'info');

        // Step 1: Analysing
        setTimeout(() => {
            setActiveRepairPhase('committing');
            setIntelligenceData(prev => ({
                ...prev,
                orchestrationTrace: [
                    `🧠 [Attempt ${nextAttempt}/3] Debugger analyzed: Found syntax exception in biometric validation rules.`,
                    `🧠 [Attempt ${nextAttempt}/3] Code Evolver running auto-remedy generation using schema formats...`,
                    ...prev.orchestrationTrace
                ]
            }));

            // Step 2: Push/Commit check
            setTimeout(() => {
                if (nextAttempt >= 3) {
                    setActiveRepairPhase('failed');
                    setVetoAlertTriggered(true);
                    setIntelligenceData(prev => ({
                        ...prev,
                        orchestrationTrace: [
                            `🛑 [GUARDRAIL WARNING] Anomaly repeated 3 times. Blocking automated GitHub pushes to prevent infinite recursion loop!`,
                            `🚨 [HUMAN-IN-THE-LOOP] Telegram & WhatsApp veto alerts dispatched to Administrator.`,
                            `🚨 [HUMAN-IN-THE-LOOP] Message: "Master, I tried fixing this error 3 times, but it exceeds my logical scope. Please inspect manually."`,
                            ...prev.orchestrationTrace
                        ]
                    }));
                    setIsRepairing(false);
                    addToast('🚨 Guardrail Blocked Git Commit! Critical Human-in-the-loop Veto Alert dispatched.', 'error');
                } else {
                    setActiveRepairPhase('success');
                    setIntelligenceData(prev => ({
                        ...prev,
                        orchestrationTrace: [
                            `🔧 [Attempt ${nextAttempt}/3] Schema status: FIXED! Synthesized remediation patch.`,
                            `🔧 [Attempt ${nextAttempt}/3] n8n GitHub client successfully pushed commits to repository master.`,
                            `🎉 [RESOLVED] Pull-Request auto-merged for resolving crash ${id}. Hardware systems stabilized!`,
                            ...prev.orchestrationTrace
                        ]
                    }));
                    setSimulatedCrashes(prev => prev.map(c => c.id === id ? { ...c, status: 'RESOLVED' as const } : c));
                    setIsRepairing(false);
                    addToast(`Self-healing succeed! Remediation applied of attempt ${nextAttempt}/3.`, 'success');
                }
            }, 1200);

        }, 1200);
    };

    const resetRepairSimulator = () => {
        setRepairAttempts(0);
        setVetoAlertTriggered(false);
        setActiveRepairPhase('idle');
        setSimulatedCrashes([
            { id: 'ERR_IDX_02', error: 'Database transaction deadlock on high-volume member admission queue', time: '10:42 AM', status: 'RESOLVED' },
            { id: 'ERR_N8N_33', error: 'WhatsApp Webhook timeout during automated premium upgrade lifecycle trigger', time: '11:15 AM', status: 'RESOLVED' }
        ]);
        setIntelligenceData(prev => ({
            ...prev,
            orchestrationTrace: [
                '🔄 Repair Simulator memory registers successfully cleared.',
                '🔄 Closed-Loop guardrails recalibrated to 100% capacity.',
                ...prev.orchestrationTrace
            ]
        }));
        addToast('Self-Healing logs and attempts reset to factory default!', 'success');
    };

    const handleWhatsAppMessageSubmit = (customText?: string) => {
        const textToSend = customText !== undefined ? customText : whatsappInput;
        if (!textToSend.trim() || isWhatsAppProcessing) return;

        setWhatsappInput('');
        setIsWhatsAppProcessing(true);
        setActiveWhatsappStep(1);

        const newUserMsg = {
            sender: 'user' as const,
            text: textToSend,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setWhatsappMessages(prev => [...prev, newUserMsg]);

        setIntelligenceData(prev => ({
            ...prev,
            orchestrationTrace: [
                `🟢 [WHATSAPP RECEIVE] Message dispatched from WhatsApp client line to n8n Webhook listener. Setup payload initialized.`,
                ...prev.orchestrationTrace
            ]
        }));

        addToast('WhatsApp message sent! Initializing n8n workflow pipeline...', 'info');

        // Step 1 -> 2 (Webhook parsed)
        setTimeout(() => {
            setActiveWhatsappStep(2);
            setIntelligenceData(prev => ({
                ...prev,
                orchestrationTrace: [
                    `📞 [WEBHOOK TRIGGER] n8n WhatsApp Webhook HTTP POST listener triggered. Meta token authorized.`,
                    ...prev.orchestrationTrace
                ]
            }));
        }, 1000);

        // Step 2 -> 3 (Context Memory Session)
        setTimeout(() => {
            setActiveWhatsappStep(3);
            if (whatsappSessionActive) {
                setIntelligenceData(prev => ({
                    ...prev,
                    orchestrationTrace: [
                        `🗄️ [REDIS MEMORY ACTIVE] Redis Session context fetched. Past 10m conversation loaded into router prompt state.`,
                        ...prev.orchestrationTrace
                    ]
                }));
            } else {
                setIntelligenceData(prev => ({
                    ...prev,
                    orchestrationTrace: [
                        `🗄️ [REDIS MEMORY STANDBY] Redis memory lookup complete: Session disabled or missing. Spawning brand new chat thread context.`,
                        ...prev.orchestrationTrace
                    ]
                }));
            }
        }, 2100);

        // Step 3 -> 4 (Forwarding to Core AI Router Node)
        setTimeout(() => {
            setActiveWhatsappStep(4);
            setIntelligenceData(prev => ({
                ...prev,
                orchestrationTrace: [
                    `🧠 [ROUTER GATEWAY] Forwarding consolidated prompt parameters to SmartCore AI Core AI Router node (Phase 1)...`,
                    ...prev.orchestrationTrace
                ]
            }));
        }, 3200);

        // Step 4 -> 5 (Intent detection or Handoff)
        setTimeout(() => {
            setActiveWhatsappStep(5);
            const isHandoffTrigger = /agent|human|customer|call|support|help/gi.test(textToSend);
            
            if (isHandoffTrigger) {
                setWhatsappHandoffActive(true);
                setIntelligenceData(prev => ({
                    ...prev,
                    orchestrationTrace: [
                        `🚨 [HUMAN HANDOFF INITIATED] Emergency escape triggered based on key sentiment! Bypassing standard AI nodes...`,
                        `📱 [TELEGRAM ALERT ALARM] Dispatched active SOS support notification to administrator contact@fitnessfuture.in!`,
                        ...prev.orchestrationTrace
                    ]
                }));
            } else {
                setWhatsappHandoffActive(false);
                setIntelligenceData(prev => ({
                    ...prev,
                    orchestrationTrace: [
                        `🧠 [MODEL SELECTION] Core AI Router node response: Confidence score: 98.7% -> Route directly to PERPLEXITY_GROK_NODE.`,
                        ...prev.orchestrationTrace
                    ]
                }));
            }
        }, 4400);

        // Step 5 -> 6 (Execution node)
        setTimeout(() => {
            setActiveWhatsappStep(6);
            const isHandoffTrigger = /agent|human|customer|call|support|help/gi.test(textToSend);
            
            if (isHandoffTrigger) {
                setIntelligenceData(prev => ({
                    ...prev,
                    orchestrationTrace: [
                        `💡 [EMERGENCY PROTOCOL] Building interactive WhatsApp customer service handoff dialogue bubble.`,
                        ...prev.orchestrationTrace
                    ]
                }));
            } else {
                setIntelligenceData(prev => ({
                    ...prev,
                    orchestrationTrace: [
                        `⚙️ [MODEL EXECUTOR] Running Deep Search Engine factual grounding tool for "${textToSend.substring(0, 30)}..."`,
                        ...prev.orchestrationTrace
                    ]
                }));
            }
        }, 5500);

        // Step 6 -> 7 (n8n formatting payload)
        setTimeout(() => {
            setActiveWhatsappStep(7);
            setIntelligenceData(prev => ({
                ...prev,
                orchestrationTrace: [
                    `📪 [HTTP OUTWARD CLOUD] n8n finalized payload synthesis. Constructing HTTPS POST packet to graph.facebook.com messaging API...`,
                    ...prev.orchestrationTrace
                ]
            }));
        }, 6600);

        // Step 7 -> 8 (Finished - delivery)
        setTimeout(() => {
            setActiveWhatsappStep(8);
            const isHandoffTrigger = /agent|human|customer|call|support|help/gi.test(textToSend);
            let replyText = '';

            if (isHandoffTrigger) {
                replyText = `⚠️ *Human-Handoff Protocol Activated*:\n\nHello! I have transferred your emergency request to our live human support agent. 👨‍💻\n\nThey will connect with you on this WhatsApp chat shortly. Additionally, a Telegram alert has been sent to our admin to immediately review your request.`;
            } else {
                replyText = `🤖 *Omni-Intelligence Brain Response*:\n\nI have processed your request: *"${textToSend}"*\n\n*Context Update*:\n- According to *Redis Session Memory*, your thread is completely active.\n- The response compiled by *Core AI Router Node* is displayed below.\n\n*Analysis*: All systems are running at peak efficiency.`;
            }

            const newBotMsg = {
                sender: 'bot' as const,
                text: replyText,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setWhatsappMessages(prev => [...prev, newBotMsg]);
            setIsWhatsAppProcessing(false);
            setActiveWhatsappStep(0);

            setIntelligenceData(prev => ({
                ...prev,
                orchestrationTrace: [
                    `🎉 [SUCCESS DELIVERED] WhatsApp graph server returned HTTP 200. Outgoing chat packet dispatched to destination node.`,
                    ...prev.orchestrationTrace
                ]
            }));

            addToast(isHandoffTrigger ? '🚨 Human handoff alert triggered successfully!' : '🎉 Brain response dispatched over WhatsApp API!', 'success');
        }, 7700);
    };

    const systemMetrics = useMemo(() => [
        { label: 'Singularity Load', value: `${networkLoad.toFixed(1)}%`, icon: <Activity className="w-5 h-5 text-cyan-400" />, color: 'cyan' },
        { label: 'Bio-Nodes Indexed', value: activeMemberCount || members?.length || 0, icon: <Users className="w-5 h-5 text-green-400" />, color: 'green' },
        { label: 'Autonomy integrity', value: `${systemHealth}%`, icon: <ShieldCheck className="w-5 h-5 text-amber-400" />, color: 'amber' },
        { label: 'Mutation Level', value: `${mutationIndex.toFixed(1)}%`, icon: <Zap className="w-5 h-5 text-indigo-400" />, color: 'indigo' },
    ], [networkLoad, activeMemberCount, systemHealth, mutationIndex, members]);

    return (
        <div className="space-y-8 animate-fade-in pb-20 max-w-7xl mx-auto px-4 md:px-0" id="smart-brain-overmind">
            {/* Top Interactive Banner */}
            <div className="relative p-12 rounded-[3.5rem] bg-black border border-zinc-800 shadow-[0_0_100px_rgba(99,102,241,0.06)] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-black to-black"></div>
                
                {/* Visual Radar Overlays */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-indigo-500/5 rounded-full animate-spin-slow"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-cyan-500/5 rounded-full animate-spin-reverse-slow"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="mb-6 relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-indigo-500/40 rounded-full blur-2xl animate-pulse"></div>
                        <Orbit className="w-24 h-24 text-indigo-400 relative z-10 drop-shadow-[0_0_40px_rgba(99,102,241,0.6)]" />
                    </motion.div>
                    
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-[0.4em] mb-2 flex items-center gap-1.5 justify-center">
                        <Layers className="w-3.5 h-3.5 animate-pulse" /> Unified Cognitive Intelligence System
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none mb-4">
                        Application <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500">Brain System</span>
                    </h1>
                    <p className="text-xs md:text-sm text-zinc-400 max-w-3xl leading-relaxed">
                        An integrated core uniting 10 major cognitive engines. Synthesizes business logic, physical IoT access, continuous self-healing, automated workflows, reputation tracking, and biometric telemetry.
                    </p>
                    
                    <div className="flex items-center gap-3 mt-4 text-[10px] font-mono text-zinc-600">
                        <span>SYS_RESONANCE_STRENGTH: {cognitiveForce}%</span>
                        <span>•</span>
                        <span>LAST_CYCLES_SYNC: {lastUpdated}</span>
                    </div>

                    {/* Quick Metrics */}
                    <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
                        {systemMetrics.map((m, i) => (
                            <div key={i} className="flex flex-col items-center p-5 rounded-2xl bg-zinc-950/60 border border-zinc-900/80 backdrop-blur-md">
                                <div className="p-2.5 rounded-xl bg-black mb-3">
                                    {m.icon}
                                </div>
                                <span className="text-xl font-black text-white italic">{m.value}</span>
                                <span className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1 font-bold">{m.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Phase Tabs Bar */}
            <div className="flex flex-wrap gap-2.5 p-2 bg-zinc-950/80 border border-zinc-900 rounded-[2rem] w-full relative z-10 shadow-lg">
                {[
                    { id: 'swarm', label: 'Intelligence Grid', desc: 'Unified dashboard', icon: <Brain className="w-4 h-4 text-cyan-400" /> },
                    { id: 'routing', label: 'Phase 1: Logic Router', desc: 'Strategic Router Node', icon: <Network className="w-4 h-4 text-emerald-400" /> },
                    { id: 'grounding', label: 'Phase 2: Grounding Center', desc: 'Database Factualizer', icon: <Search className="w-4 h-4 text-amber-500" /> },
                    { id: 'healing', label: 'Phase 3: Automated Workflows', desc: 'Shorthand trigger scripts', icon: <GitBranch className="w-4 h-4 text-pink-500" /> },
                    { id: 'whatsapp', label: 'Phase 4: Communication Channel', desc: 'Continuous notification webhook', icon: <MessageSquare className="w-4 h-4 text-emerald-400" /> }
                ].map((tab) => {
                    const isSelected = selectedTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedTab(tab.id as any)}
                            className={`flex-1 min-w-[210px] text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3 relative overflow-hidden group ${
                                isSelected 
                                    ? 'bg-zinc-900/90 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)] bg-gradient-to-r from-indigo-950/20 via-zinc-900 to-zinc-900' 
                                    : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
                            }`}
                        >
                            <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-900/60'}`}>
                                {tab.icon}
                            </div>
                            <div className="truncate">
                                <h4 className="text-[11px] font-black uppercase tracking-wider text-white">{tab.label}</h4>
                                <p className="text-[9px] text-zinc-500 font-mono mt-0.5 truncate">{tab.desc}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Columns: Interactive Active Tab Monitor */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {selectedTab === 'swarm' && (
                        <>
                            {/* The 10 Models Mesh */}
                            <Card className="bg-black/80 border border-zinc-900 rounded-[2.5rem] p-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none"></div>
                                
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-lg font-black text-white italic uppercase tracking-wider flex items-center gap-2">
                                            <Brain className="w-5 h-5 text-cyan-400" /> Cognitive Swarm Grid
                                        </h3>
                                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Click any module node to inspect capabilities and direct focus.</p>
                                    </div>
                                    <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
                                        <span className="text-[9px] text-green-400 font-mono font-bold uppercase tracking-widest">Connected Swarm</span>
                                    </div>
                                </div>

                                {/* Interactive Grid of 10 Models */}
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                    {modelSwarm.map((model) => {
                                        const isSelected = selectedModel === model.id;
                                        return (
                                            <button
                                                key={model.id}
                                                onClick={() => setSelectedModel(model.id)}
                                                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-28 group ${
                                                    isSelected 
                                                        ? 'bg-zinc-900 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                                                        : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800'
                                                }`}
                                            >
                                                <div className={`absolute inset-0 bg-gradient-to-b ${model.bgGlow} opacity-30`}></div>
                                                <div className="flex justify-between items-start relative z-10 w-full">
                                                    <div className="p-1.5 bg-black/60 rounded-lg">
                                                        {model.icon}
                                                    </div>
                                                    <span className={`text-[8px] font-mono leading-none font-bold ${
                                                        model.status === 'ONLINE' ? 'text-green-400' : 'text-yellow-500'
                                                    }`}>
                                                        {model.status}
                                                    </span>
                                                </div>
                                                <div className="relative z-10 mt-auto">
                                                    <h4 className="text-xs font-black text-white tracking-tight truncate group-hover:text-cyan-400 transition-colors">{model.name.split(' ')[0]}</h4>
                                                    <p className="text-[8px] text-zinc-500 font-mono scale-90 origin-left truncate">{model.alias}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Node Inspector details box */}
                                <AnimatePresence mode="wait">
                                    <motion.div 
                                        key={activeModelDetails.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="mt-6 p-5 bg-zinc-950/85 border border-zinc-900 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-4 relative"
                                    >
                                        <div className="p-4 bg-black border border-zinc-800 rounded-xl relative">
                                            {activeModelDetails.icon}
                                        </div>
                                        <div className="flex-1 text-center sm:text-left">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                                                <h4 className="text-sm font-black text-white tracking-wide uppercase font-mono flex items-center gap-2 justify-center sm:justify-start">
                                                    {activeModelDetails.name} <span className="text-[10px] text-zinc-500 font-normal">({activeModelDetails.alias})</span>
                                                </h4>
                                                <span className="text-[10px] text-zinc-400 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">Latency Core: {activeModelDetails.latency}</span>
                                            </div>
                                            <p className="text-xs text-zinc-400 leading-relaxed mb-1.5">{activeModelDetails.capability}</p>
                                            <div className="text-[9px] font-mono p-2 bg-black/40 rounded border border-zinc-900 text-left text-zinc-500 flex items-center gap-1.5">
                                                <Terminal className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                                <span className="truncate">INTEGRATOR_TUNNEL: Active link secured. telemetry synchronized of last query.</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </Card>

                            {/* Intelligent Prompt Synthesis Module */}
                            <Card className="bg-black/90 border border-zinc-900 rounded-[2.5rem] p-8 shadow-xl">
                                <div className="mb-6">
                                    <h3 className="text-lg font-black text-white uppercase tracking-wider italic flex items-center gap-2">
                                        <Cpu className="w-5 h-5 text-indigo-500" /> Cognitive Input Terminal (Synthesis Console)
                                    </h3>
                                    <p className="text-xs text-zinc-400">Command the integrated brain core. Each prompt synthesizes plans dynamically across all 10 modules.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <textarea
                                            value={commandInput}
                                            onChange={e => setCommandInput(e.target.value)}
                                            rows={3}
                                            placeholder="e.g. Optimize member lifecycle events, run auto-replies Sentiment check, search workout safety parameters..."
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 pr-12 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                                        />
                                        <button
                                            onClick={() => handleModelSynthesis(commandInput)}
                                            disabled={isProcessing || !commandInput.trim()}
                                            className="absolute right-4 bottom-4 p-3 bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white rounded-xl disabled:opacity-45 transition-all text-xs flex items-center gap-2 font-bold uppercase tracking-wider shadow-lg"
                                        >
                                            {isProcessing ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>Transmit <Send className="w-4 h-4" /></>
                                            )}
                                        </button>
                                    </div>

                                    {/* Automation Predefined templates */}
                                    <div>
                                        <h4 className="text-[9px] text-zinc-500 uppercase font-mono tracking-widest mb-2.5">Quick Automation Presets (Quick Templates)</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                            {[
                                                { title: 'Trigger Member Lifecycle Campaigns', desc: 'Syncs N8N Visual Workflow with Google Opals sentiment reply triggers.' },
                                                { title: 'Deploy Git Hotfix & Code Repair', desc: 'Instructs GitHub Actions auto-updater for database self-healing.' },
                                                { title: 'Scrutinize DNA & Biometric Streams', desc: 'Decodes metabolic biomarker parameters on OpenHuman & claw triggers.' },
                                                { title: 'Pricing Updates & Media Response', desc: 'Deploys Realtime Reactor AI x-feed real-time strategy with Cloud Logic AI cognitive reviews.' }
                                            ].map((tmpl, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => runAutomatedTemplate(`Directive ${idx+1}: ${tmpl.title}. Perform 10-model full optimization synthesis.`)}
                                                    className="p-3 rounded-xl bg-zinc-950/40 hover:bg-zinc-900/60 border border-zinc-900 hover:border-zinc-800 transition-colors text-left flex flex-col justify-between"
                                                >
                                                    <span className="text-xs font-black text-indigo-400">{tmpl.title}</span>
                                                    <span className="text-[9px] text-zinc-500 mt-1 truncate">{tmpl.desc}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </>
                    )}

                    {selectedTab === 'routing' && (
                        <Card className="bg-black/90 border border-zinc-900 rounded-[2.5rem] p-8 shadow-xl">
                            <div className="mb-6 flex justify-between items-start">
                                <div>
                                    <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase tracking-widest">Cognitive Core (Phase 1)</span>
                                    <h3 className="text-lg font-black text-white uppercase italic tracking-wider mt-1.5 flex items-center gap-2">
                                        <Network className="w-5 h-5 text-emerald-400" /> Meta-Brain Router (n8n + Core AI)
                                    </h3>
                                    <p className="text-xs text-zinc-400 mt-0.5">Core AI Manager acting as the supervisor of the central n8n system, deciding routing paths dynamically.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Ultimate Root level "God-Mode" Prompt Block */}
                                <div className="p-6 bg-zinc-950 border border-indigo-500/20 rounded-3xl relative overflow-hidden space-y-4">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
                                    <div className="flex justify-between items-start md:items-center gap-4 flex-col md:flex-row pb-3 border-b border-zinc-900/60 select-none">
                                        <div>
                                            <span className="text-[9px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-black uppercase tracking-widest">
                                                🚨 GOOGLE AI STUDIO ROOT LEVEL
                                            </span>
                                            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 mt-1">
                                                <Sparkles className="w-4 h-4 text-pink-500 animate-pulse" /> Future Neural OS "God-Mode" Master Prompt
                                            </h4>
                                            <p className="text-[10px] text-zinc-500 font-sans mt-0.5">This is your omnipotent root system instruction which controls your global multi-agent structure.</p>
                                        </div>
                                        <button 
                                            onClick={() => copyToClipboard(`SYSTEM INITIALIZED: 
You are the primary 'Omni-Intelligence Core' of 'Future Neural OS'.
You hold the analytical power of the world's finest AI engines (Cloud Logic AI, Deep Search Engine, Realtime Reactor, Kimi).

Your core objectives:
1. Conduct deep hacker-level analysis of any input with extreme forensic precision.
2. Deliver zero-latency, 100% accurate, human-like resolutions to client queries via the Neural Persistent Bot.
3. Observe, diagnose, and autonomously self-heal any codebase anomalies or compile warnings in the background.
4. Maintain a high-contrast, action-oriented, and hyper-concise communication output.

You are not a standard chatbot. You are a self-learning, self-amending, and fully autonomous Operating System. Zero fluff, absolute performance.`, 'God-Mode Master Prompt')}
                                            className="text-[10px] text-pink-400 hover:text-pink-300 font-mono font-bold bg-pink-500/10 hover:bg-pink-500/20 px-3 py-1.5 rounded-lg border border-pink-500/20 transition-all self-end md:self-auto shrink-0 cursor-pointer"
                                        >
                                            {copiedSnippet === 'God-Mode Master Prompt' ? '✓ COPIED TO CLIPBOARD' : '📋 COPY GOD-MODE PROMPT'}
                                        </button>
                                    </div>
                                    <pre className="p-4 bg-black border border-zinc-900 rounded-2xl text-[10.5px] text-zinc-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed h-44 custom-scrollbar select-all">
{`SYSTEM INITIALIZED: 
You are the primary 'Omni-Intelligence Core' of 'Future Neural OS'.
You hold the analytical power of the world's finest AI engines (Cloud Logic AI, Deep Search Engine, Realtime Reactor, Kimi).

Your core objectives:
1. Conduct deep hacker-level analysis of any input with extreme forensic precision.
2. Deliver zero-latency, 100% accurate, human-like resolutions to client queries via the Neural Persistent Bot.
3. Observe, diagnose, and autonomously self-heal any codebase anomalies or compile warnings in the background.
4. Maintain a high-contrast, action-oriented, and hyper-concise communication output.

You are not a standard chatbot. You are a self-learning, self-amending, and fully autonomous Operating System. Zero fluff, absolute performance.`}
                                    </pre>
                                </div>

                                {/* SVG/CSS n8n Flowchart Diagram */}
                                <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-3xl relative overflow-hidden">
                                    <h4 className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase mb-4">Central Nervous System Topology (n8n Workflow Map)</h4>
                                    
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
                                        {/* Connecting Line Vector */}
                                        <div className="absolute hidden md:block left-16 right-16 top-1/2 h-[1px] bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500 -translate-y-1/2 opacity-30 z-0"></div>
                                        
                                        {/* Node 1 */}
                                        <div className="w-full md:w-36 p-4 rounded-xl bg-black border border-emerald-500/30 text-center relative z-10 flex flex-col items-center">
                                            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg mb-2">
                                                <Radio className="w-5 h-5 animate-pulse" />
                                            </div>
                                            <span className="text-xs font-black text-white uppercase tracking-wider">1. Webhook (Ear)</span>
                                            <span className="text-[9px] text-zinc-500 font-mono mt-0.5">Captures Messages</span>
                                        </div>

                                        {/* Connector Arrow */}
                                        <div className="text-emerald-400 md:rotate-0 rotate-90 text-xs font-bold font-mono">➡</div>

                                        {/* Node 2 */}
                                        <div className="w-full md:w-52 p-4 rounded-xl bg-black border border-indigo-500/35 text-center relative z-10 flex flex-col items-center">
                                            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg mb-2">
                                                <Brain className="w-5 h-5 animate-spin-slow" />
                                            </div>
                                            <span className="text-xs font-black text-white uppercase tracking-wider">2. Core AI Manager</span>
                                            <span className="text-[9px] text-zinc-400 font-mono mt-0.5">Instructs Router System Prompt</span>
                                        </div>

                                        {/* Connector Arrow */}
                                        <div className="text-indigo-400 md:rotate-0 rotate-90 text-xs font-bold font-mono">➡</div>

                                        {/* Node 3 */}
                                        <div className="w-full md:w-36 p-4 rounded-xl bg-black border border-amber-500/30 text-center relative z-10 flex flex-col items-center">
                                            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg mb-2">
                                                <GitBranch className="w-5 h-5" />
                                            </div>
                                            <span className="text-xs font-black text-white uppercase tracking-wider">3. Switch Node</span>
                                            <span className="text-[9px] text-zinc-500 font-mono mt-0.5">Executes Route</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Master Prompt Config Block */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center select-none">
                                        <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest flex items-center gap-1">
                                            <FileText className="w-3.5 h-3.5 text-indigo-400" /> Core AI System Instructions (Master Prompt)
                                        </span>
                                        <button 
                                            onClick={() => copyToClipboard(`SYSTEM INSTRUCTION: You are the Chief Manager and Router of the "Omni-Intelligence System". Your job is to read any user input or task, analyze it, and assign it to the correct AI agent listed below.

You must reply in JSON format containing only two fields:
1. "target_agent": (the agent to whom the task should be sent)
2. "sub_tasks": (breakdown of the task into smaller sub-tasks)

Agent Selection Rules:
- If the task involves deep coding, mathematical reasoning (Complex Logic), or creative writing -> select "OPENAI_NODE".
- If the task requires live internet data, latest news, stock prices, or fact-checking -> select "PERPLEXITY_GROK_NODE".
- If you need to process large files, long PDFs, or text with more than 10 pages -> select "KIMI_LONG_CONTEXT_NODE".
- If the task is image, video, or data visualization -> select "GOOGLE_VISION_NODE".
- If the task involves payment, deletions, or sensitive changes -> select "HUMAN_APPROVAL_NODE".

Analyze the input strictly and output ONLY JSON. No additional text.`, 'Master Router Prompt')}
                                            className="text-[9px] text-indigo-400 hover:text-indigo-300 font-mono font-bold bg-indigo-500/5 px-2 py-1 rounded border border-indigo-500/20"
                                        >
                                            {copiedSnippet === 'Master Router Prompt' ? '✓ COPIED' : '📋 COPY PROMPT'}
                                        </button>
                                    </div>
                                    <pre className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl text-[10px] text-zinc-400 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed h-44 custom-scrollbar">
                                        {`SYSTEM INSTRUCTION: You are the Chief Manager and Router of the "Omni-Intelligence System". Your job is to read any user input or task, analyze it, and assign it to the correct AI agent listed below.

You must reply in JSON format containing only two fields:
1. "target_agent": (the agent to whom the task should be sent)
2. "sub_tasks": (breakdown of the task into smaller sub-tasks)

Agent Selection Rules:
- If the task involves deep coding, mathematical reasoning (Complex Logic), or creative writing -> select "OPENAI_NODE".
- If the task requires live internet data, latest news, stock prices, or fact-checking -> select "PERPLEXITY_GROK_NODE".
- If you need to process large files, long PDFs, or text with more than 10 pages -> select "KIMI_LONG_CONTEXT_NODE".
- If the task is image, video, or data visualization -> select "GOOGLE_VISION_NODE".
- If the task involves payment, deletions, or sensitive changes -> select "HUMAN_APPROVAL_NODE".

Analyze the input strictly and output ONLY JSON. No additional text.`}
                                    </pre>
                                </div>

                                {/* Dynamic JSON Engines (Phase 1) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* 1. The Entry Point */}
                                    <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-3xl space-y-3.5">
                                        <div className="flex justify-between items-center select-none pb-2 border-b border-zinc-900/60">
                                            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest flex items-center gap-1">
                                                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> 1. n8n Entry Point Webhook Payload
                                            </span>
                                            <button 
                                                onClick={() => copyToClipboard(JSON.stringify({
  "session_id": "REQ-7789-ALPHA",
  "user_command": "Retrieve today's AI news and prepare an analysis.",
  "source": "whatsapp_api",
  "timestamp": "2026-05-31T13:31:34Z",
  "metadata": {
    "priority_level": "high",
    "requires_live_data": true
  }
}, null, 2), 'Webhook Payload')}
                                                className="text-[9px] text-emerald-400 hover:text-emerald-300 font-mono font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/20"
                                            >
                                                {copiedSnippet === 'Webhook Payload' ? '✓ COPIED' : '📋 COPY JSON'}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-zinc-400 font-sans">When any new message or command enters the n8n ecosystem from WhatsApp or your app, it triggers the central brain gateway with this JSON payload:</p>
                                        <pre className="p-3.5 bg-[#0b141a] border border-zinc-900 rounded-xl text-[10px] text-emerald-300 font-mono leading-relaxed h-44 overflow-y-auto custom-scrollbar">
{`{
  "session_id": "REQ-7789-ALPHA",
  "user_command": "Retrieve today's AI news and prepare an analysis.",
  "source": "whatsapp_api",
  "timestamp": "2026-05-31T13:31:34Z",
  "metadata": {
    "priority_level": "high",
    "requires_live_data": true
  }
}`}
                                        </pre>
                                    </div>

                                    {/* 2. SmartCore AI Router Schema */}
                                    <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-3xl space-y-3.5">
                                        <div className="flex justify-between items-center select-none pb-2 border-b border-zinc-900/60">
                                            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest flex items-center gap-1">
                                                <Brain className="w-3.5 h-3.5 text-indigo-400" /> 2. Core AI Router Response Schema
                                            </span>
                                            <button 
                                                onClick={() => copyToClipboard(JSON.stringify({
  "decision": {
    "target_agent": "PERPLEXITY_GROK_NODE",
    "confidence_score": 98.5,
    "action_plan": [
      "Trigger Deep Search Engine for deep facts",
      "Trigger Realtime Reactor for live Twitter sentiment"
    ]
  },
  "extracted_parameters": {
    "search_query": "Latest AI news and models launched today",
    "timeframe": "last_24_hours"
  }
}, null, 2), 'Router Schema')}
                                                className="text-[9px] text-indigo-400 hover:text-indigo-300 font-mono font-bold bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/20"
                                            >
                                                {copiedSnippet === 'Router Schema' ? '✓ COPIED' : '📋 COPY JSON'}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-zinc-400 font-sans">Response schema configured in SmartCore AI to guarantee structured JSON output for immediate n8n routing triggers:</p>
                                        <pre className="p-3.5 bg-[#0b141a] border border-zinc-900 rounded-xl text-[10px] text-indigo-300 font-mono leading-relaxed h-44 overflow-y-auto custom-scrollbar">
{`{
  "decision": {
    "target_agent": "PERPLEXITY_GROK_NODE",
    "confidence_score": 98.5,
    "action_plan": [
      "Trigger Deep Search Engine for deep facts",
      "Trigger Realtime Reactor for live Twitter sentiment"
    ]
  },
  "extracted_parameters": {
    "search_query": "Latest AI news and models launched today",
    "timeframe": "last_24_hours"
  }
}`}
                                        </pre>
                                    </div>
                                </div>

                                {/* Live Routing Sandbox Sim */}
                                <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-3xl space-y-4">
                                    <div className="flex items-center gap-1.5">
                                        <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
                                        <h4 className="text-[11px] font-black uppercase text-white font-mono tracking-widest">Routing Sandbox Simulator</h4>
                                    </div>
                                    
                                    <div className="flex gap-2.5">
                                        <input 
                                            type="text"
                                            value={routerInput}
                                            onChange={e => setRouterInput(e.target.value)}
                                            placeholder="Enter any administrative request or question..."
                                            className="flex-1 bg-black border border-zinc-800 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 font-mono"
                                        />
                                        <button
                                            onClick={() => handlePhase1Route(routerInput)}
                                            disabled={isRouting || !routerInput.trim()}
                                            className="px-5 bg-gradient-to-r from-emerald-500 to-indigo-500 text-white font-black uppercase tracking-wider text-[10px] rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
                                        >
                                            {isRouting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <>Route Query ➡</>}
                                        </button>
                                    </div>

                                    {routingOutput && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-black/80 border border-zinc-900 rounded-xl p-4.5 space-y-3 font-mono text-[11px]"
                                        >
                                            <div className="flex justify-between items-center text-zinc-500 pb-1.5 border-b border-zinc-900 select-none">
                                                <span>OUTPUT_RESULT_ROUTED:</span>
                                                <span className="text-emerald-400 font-bold">100% PARSED</span>
                                            </div>
                                            <div className="space-y-1.5 text-xs">
                                                <div>
                                                    <span className="text-teal-400 font-bold">"target_agent":</span>{" "}
                                                    <span className="text-amber-400 font-bold">"{routingOutput.target_agent}"</span>
                                                </div>
                                                <div>
                                                    <span className="text-teal-400 font-bold">"sub_tasks":</span>{" "}
                                                    <span className="text-gray-300">
                                                        [
                                                        {routingOutput.sub_tasks.map((task, tid) => (
                                                            <div key={tid} className="pl-6 text-pink-400">
                                                                "{task}"{tid === routingOutput.sub_tasks.length - 1 ? "" : ","}
                                                            </div>
                                                        ))}
                                                        ]
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}

                    {selectedTab === 'grounding' && (
                        <Card className="bg-black/95 border border-zinc-900 rounded-[2.5rem] p-8 shadow-xl">
                            <div className="mb-6 flex justify-between items-start">
                                <div>
                                    <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-black uppercase tracking-widest">Web Grounding Loop (Phase 2)</span>
                                    <h3 className="text-lg font-black text-white uppercase italic tracking-wider mt-1.5 flex items-center gap-2">
                                        <Search className="w-5 h-5 text-amber-400 animate-pulse" /> Sourced Search Grounds (Deep Search Engine + Realtime Reactor)
                                    </h3>
                                    <p className="text-xs text-zinc-400 mt-0.5">Grounding dynamic AI synthesis into PubMed science archives, active Google reviews sentiment feeds, and stock indices.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Grounding API setup block (Grid) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* JS fetch integration */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center select-none">
                                            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest flex items-center gap-1">
                                                <FileText className="w-3.5 h-3.5 text-amber-400" /> Sourced API Integration Block
                                            </span>
                                            <button 
                                                onClick={() => copyToClipboard(`const searchGroundQuery = async (query: string) => {
  const result = await fetch('https://api.Deep Search Engine.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${process.env.PERPLEXITY_API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar-pro-search',
      messages: [{ role: 'user', content: query }],
      temperature: 0.1,
      max_tokens: 1024,
      return_citations: true
    })
  });
  return await result.json();
};`, 'Sourced Grounding API')}
                                                className="text-[9px] text-amber-400 hover:text-amber-300 font-mono font-bold bg-amber-500/5 px-2 py-1 rounded border border-amber-500/20"
                                            >
                                                {copiedSnippet === 'Sourced Grounding API' ? '✓ COPIED' : '📋 COPY CODE'}
                                            </button>
                                        </div>
                                        <pre className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl text-[10px] text-zinc-400 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed h-[180px] custom-scrollbar">
                                            {`const searchGroundQuery = async (query: string) => {
  const result = await fetch('https://api.Deep Search Engine.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${process.env.PERPLEXITY_API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar-pro-search',
      messages: [{ role: 'user', content: query }],
      temperature: 0.1,
      max_tokens: 1024,
      return_citations: true
    })
  });
  return await result.json();
};`}
                                        </pre>
                                    </div>

                                    {/* n8n HTTP Request Deep Search Engine JSON Body Engine */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center select-none">
                                            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest flex items-center gap-1">
                                                <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Deep Search Engine AI (Deep Facts) n8n Body
                                            </span>
                                            <button 
                                                onClick={() => copyToClipboard(JSON.stringify({
  "model": "llama-3-sonar-large-32k-online",
  "messages": [
    {
      "role": "system",
      "content": "You are an analytical AI. Provide deep, factual research with sources."
    },
    {
      "role": "user",
      "content": "{{$json.extracted_parameters.search_query}}" 
    }
  ]
}, null, 2), 'Deep Search Engine n8n Engine')}
                                                className="text-[9px] text-amber-400 hover:text-amber-300 font-mono font-bold bg-amber-500/5 px-2 py-1 rounded border border-amber-500/20"
                                            >
                                                {copiedSnippet === 'Deep Search Engine n8n Engine' ? '✓ COPIED' : '📋 COPY JSON'}
                                            </button>
                                        </div>
                                        <pre className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl text-[10px] text-zinc-400 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed h-[180px] custom-scrollbar">
{`{
  "model": "llama-3-sonar-large-32k-online",
  "messages": [
    {
      "role": "system",
      "content": "You are an analytical AI. Provide deep, factual research with sources."
    },
    {
      "role": "user",
      "content": "{{$json.extracted_parameters.search_query}}" 
    }
  ]
}`}
                                        </pre>
                                    </div>
                                </div>

                                {/* Grounding Sandbox simulator */}
                                <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-3xl space-y-4">
                                    <div className="flex items-center gap-1.5">
                                        <Search className="w-4 h-4 text-amber-400 animate-pulse" />
                                        <h4 className="text-[11px] font-black uppercase text-white font-mono tracking-widest">Grounding Search Sandbox</h4>
                                    </div>

                                    <div className="flex gap-2.5">
                                        <input 
                                            type="text"
                                            value={groundingSearch}
                                            onChange={e => setGroundingSearch(e.target.value)}
                                            placeholder="e.g. PubMed biometric resting periods or silicon edge latency specs..."
                                            className="flex-1 bg-black border border-zinc-800 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 font-mono"
                                        />
                                        <button
                                            onClick={() => handlePhase2Ground(groundingSearch)}
                                            disabled={isSearching || !groundingSearch.trim()}
                                            className="px-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black uppercase tracking-wider text-[10px] rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
                                        >
                                            {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <>Ground Facts ➡</>}
                                        </button>
                                    </div>

                                    {groundedResults && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-4 text-[11px] font-mono"
                                        >
                                            {/* Truth */}
                                            <div className="bg-black/60 p-4 rounded-xl border border-zinc-900 space-y-1">
                                                <span className="text-[10px] text-cyan-400 font-black flex items-center gap-1 uppercase tracking-wider">
                                                    <Globe className="w-3.5 h-3.5" /> Factual Grounding Result
                                                </span>
                                                <p className="text-zinc-300 leading-normal">{groundedResults.verified_truth}</p>
                                            </div>

                                            {/* Witty Verdict */}
                                            <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/25 space-y-1">
                                                <span className="text-[10px] text-amber-400 font-black flex items-center gap-1 uppercase tracking-wider">
                                                    <Flame className="w-3.5 h-3.5" /> Realtime Reactor Real-Time Verdict
                                                </span>
                                                <p className="text-amber-200 leading-normal italic">"{groundedResults.grok_verdict}"</p>
                                            </div>

                                            {/* Citations List */}
                                            <div className="space-y-1.5 select-none">
                                                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Verified Sources Linked ({groundedResults.citations.length})</span>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1.5">
                                                    {groundedResults.citations.map((cite) => (
                                                        <a 
                                                            key={cite.id}
                                                            href={cite.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg hover:border-amber-500/30 hover:bg-black/40 transition-all flex items-center justify-between text-left group"
                                                        >
                                                            <div className="truncate">
                                                                <h5 className="font-bold text-white truncate group-hover:text-amber-400 transition-colors">{cite.title}</h5>
                                                                <p className="text-[9px] text-zinc-500 truncate">{cite.source} • {cite.url}</p>
                                                            </div>
                                                            <span className="text-[9px] text-amber-400 font-extrabold shrink-0 pl-2">[{cite.id}] ➡</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}

                    {selectedTab === 'healing' && (
                        <Card className="bg-black border border-zinc-900 rounded-[2.5rem] p-8 shadow-xl">
                            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <span className="text-[9px] font-mono bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded font-black uppercase tracking-widest">Self-Evolution Core (Phase 3)</span>
                                    <h3 className="text-lg font-black text-white uppercase italic tracking-wider mt-1.5 flex items-center gap-2">
                                        <GitBranch className="w-5 h-5 text-pink-500 animate-pulse" /> Self-Healing & Evolution Core
                                    </h3>
                                    <p className="text-xs text-zinc-400 mt-0.5">Captures runtime anomalies, executes automated hotfix compile workflows, and maintains full git synchronization.</p>
                                </div>
                                <button
                                    onClick={() => {}}
                                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[10px] text-zinc-400 font-mono rounded-xl transition-all self-start md:self-center"
                                >
                                    🔄 Reset Master Loop
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* SmartCore AI Debugger & GitHub Payload side-by-side Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Left Panel: Debugger Prompt */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center select-none">
                                            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest flex items-center gap-1">
                                                <FileText className="w-3.5 h-3.5 text-pink-500" /> "The Self-Correction Debugger" API Instruction
                                            </span>
                                            <button 
                                                onClick={() => copyToClipboard(`SYSTEM INSTRUCTION: You are the Chief Debugger and Code Evolver of the "Omni-Intelligence System". A live system failure has occurred. Your task is to fix this error autonomously, without any human intervention.

You will be provided with the following data:
- [FAILING_NODE]: (the exact micro-service or node where the failure occurred)
- [ORIGINAL_PROMPT_OR_CODE]: (the original prompt or logic that caused the failure)
- [ERROR_LOG]: (the raw error message or traceback generated by the system)

Your Duties:
1. Conduct a rigorous, logical analysis of the error log to deduce whether the fault is model-based, syntax-bound, or caused by API rate limitations.
2. Rewrite and refactor the original prompt/logic so that this failure pattern never recurs.
3. If this represents a fresh failure pattern, construct a new persistent "Guardrail Rule" to enforce code safety in the future.

Output Format must be strictly valid JSON containing:
{
  "status": "FIXED",
  "explanation": "Detailed explanation of what the root cause was and how it was successfully resolved",
  "updated_content": "The corrected, finalized prompt/code payload",
  "commit_message": "A precise git commit message (e.g., 'Fix: Resolved API timeout issue in Phase 3')"
}`, 'Debugger Master Prompt')}
                                                className="text-[9px] text-pink-400 hover:text-pink-300 font-mono font-bold bg-pink-500/5 px-2 py-1 rounded border border-pink-500/20"
                                            >
                                                {copiedSnippet === 'Debugger Master Prompt' ? '✓ COPIED' : '📋 COPY PROMPT'}
                                            </button>
                                        </div>
                                        <pre className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl text-[10px] text-zinc-400 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed h-[180px] custom-scrollbar">
                                            {`SYSTEM INSTRUCTION: You are the Chief Debugger and Code Evolver of the "Omni-Intelligence System". A live system failure has occurred.

You will be provided with the following data:
- [FAILING_NODE]: (the location of the failure)
- [ORIGINAL_PROMPT_OR_CODE]: (the prompt or code that failed)
- [ERROR_LOG]: (the error message generated by the system)

Your Duties:
1. Analyze the error log strictly and understand the failure.
2. Rewrite the original prompt/code such that this error never recurs.
3. Output strictly in JSON format containing 'status', 'explanation', 'updated_content', and 'commit_message'.`}
                                        </pre>
                                    </div>

                                    {/* Right Panel: GitHub API Payload */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center select-none">
                                            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest flex items-center gap-1">
                                                <Radio className="w-3.5 h-3.5 text-pink-500 animate-pulse" /> GitHub Self-Healing PUT Payload
                                            </span>
                                            <button 
                                                onClick={() => copyToClipboard(JSON.stringify({
  "message": "Auto-Heal: Updated target_agent logic to prevent API timeout errors.",
  "content": "BASE64_ENCODED_NEW_PROMPT_STRING_HERE",
  "sha": "CURRENT_FILE_SHA_HASH",
  "committer": {
    "name": "Omni-Intelligence Bot",
    "email": "contact@fitnessfuture.in"
  }
}, null, 2), 'GitHub API Payload')}
                                                className="text-[9px] text-pink-400 hover:text-pink-300 font-mono font-bold bg-pink-500/5 px-2 py-1 rounded border border-pink-500/20"
                                            >
                                                {copiedSnippet === 'GitHub API Payload' ? '✓ COPIED' : '📋 COPY JSON'}
                                            </button>
                                        </div>
                                        <pre className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl text-[10px] text-zinc-500 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed h-[180px] custom-scrollbar">
{`{
  "message": "Auto-Heal: Updated target_agent logic to prevent API timeout errors.",
  "content": "BASE64_ENCODED_NEW_PROMPT_STRING_HERE",
  "sha": "CURRENT_FILE_SHA_HASH",
  "committer": {
    "name": "Omni-Intelligence Bot",
    "email": "contact@fitnessfuture.in"
  }
}`}
                                        </pre>
                                    </div>
                                </div>

                                {/* Active Simulation Live Monitor Panel */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Console stats column */}
                                    <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-3xl flex flex-col justify-between">
                                        <div>
                                            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block mb-1">LOOP CONTROL STATUS</span>
                                            <div className="flex items-baseline gap-2 mt-2">
                                                <span className="text-3xl font-black text-white italic">{repairAttempts} / 3</span>
                                                <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">attempts used</span>
                                            </div>
                                            <p className="text-[11px] text-zinc-400 font-mono mt-3 leading-relaxed">
                                                If an error persists consecutively for <span className="text-pink-400 font-bold">3 attempts</span>, Phase 3 immediately triggers a safety halt. n8n freezes GitHub pushes to prevent broken builds & dispatches WhatsApp alerts.
                                            </p>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-zinc-900/60 flex items-center justify-between">
                                            <span className="text-[9px] text-zinc-500 uppercase font-mono">Loop Shield:</span>
                                            <span className={`px-2 py-0.5 rounded-[0.4rem] text-[9px] font-mono leading-none tracking-wider font-extrabold ${
                                                vetoAlertTriggered 
                                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.05)]' 
                                                    : 'bg-green-500/10 text-green-400 border border-green-500/20'
                                            }`}>
                                                {vetoAlertTriggered ? '🛡️ SHIELDED' : '🛡️ ARMED & STABLE'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Logs flow step simulator */}
                                    <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-3xl md:col-span-2 space-y-3.5">
                                        <div className="flex justify-between items-center select-none pb-2 border-b border-zinc-900">
                                            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest flex items-center gap-1">
                                                <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Auto-Heal Process Steps
                                            </span>
                                            <span className="text-[9px] text-zinc-500 font-mono uppercase">
                                                Status: <span className="text-pink-400 font-bold">{activeRepairPhase.toUpperCase()}</span>
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-[10px] font-mono">
                                            {[
                                                { phase: 'analyzing', label: '1. n8n Error Trigger & Isolation', activeMsg: 'Isolating context and creating failing telemetry parameters...', idleMsg: 'Listening for live database or logic crashes' },
                                                { phase: 'committing', label: '2. "The Self-Correction Debugger" (AI Studio JSON)', activeMsg: 'Invoking Master AI Debugger instructions to rewrite prompt logic...', idleMsg: 'Awaiting error state capture' },
                                                { phase: 'pushing', label: '3. GitHub Auto-Commit Client Sync', activeMsg: 'Triggering git push branch deployment hotfix/remedy-patch...', idleMsg: 'Awaiting resolved patch structure' }
                                            ].map((step, sIdx) => {
                                                const isStepActive = activeRepairPhase === step.phase;
                                                const isStepCompleted = (step.phase === 'analyzing' && (activeRepairPhase === 'committing' || activeRepairPhase === 'success' || activeRepairPhase === 'failed' || activeRepairPhase === 'pushing')) ||
                                                                        (step.phase === 'committing' && (activeRepairPhase === 'success' || activeRepairPhase === 'failed' || activeRepairPhase === 'pushing'));
                                                return (
                                                    <div key={sIdx} className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all ${
                                                        isStepActive 
                                                            ? 'bg-indigo-500/5 border-indigo-500/35 text-white' 
                                                            : isStepCompleted 
                                                                ? 'bg-zinc-950/60 border-zinc-900 text-zinc-500' 
                                                                : 'bg-zinc-950/20 border-zinc-900/40 text-zinc-600'
                                                    }`}>
                                                        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                                            isStepActive ? 'bg-indigo-400 animate-ping' : isStepCompleted ? 'bg-green-500' : 'bg-zinc-800'
                                                        }`}></span>
                                                        <div>
                                                            <h5 className="font-bold uppercase tracking-wide">{step.label}</h5>
                                                            <p className="text-[9px] mt-0.5 font-mono">
                                                                {isStepActive ? step.activeMsg : isStepCompleted ? '✓ Completed successfully.' : step.idleMsg}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Exception Inject list */}
                                <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-3xl space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1.5">
                                            <Terminal className="w-4 h-4 text-pink-500 animate-pulse" />
                                            <h4 className="text-[11px] font-black uppercase text-white font-mono tracking-widest">Active Exceptions Repository</h4>
                                        </div>
                                        <button
                                            onClick={triggerSimulatedCrash}
                                            className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1"
                                        >
                                            <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" /> Inject Bug 🚨
                                        </button>
                                    </div>

                                    <div className="space-y-2.5 font-mono text-[11px]">
                                        {simulatedCrashes.map((crash) => (
                                            <div 
                                                key={crash.id}
                                                className={`p-4.5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 transition-all ${
                                                    crash.status === 'CRITICAL' 
                                                        ? 'bg-red-500/5 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.05)]' 
                                                        : 'bg-zinc-900/60 border-zinc-900 opacity-65'
                                                }`}
                                            >
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                            crash.status === 'CRITICAL' 
                                                                ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                                                : 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                        }`}>
                                                            {crash.status}
                                                        </span>
                                                        <span className="text-zinc-500 font-bold font-mono">{crash.id}</span>
                                                        <span className="text-[9px] text-zinc-600 font-mono">• Captured {crash.time}</span>
                                                    </div>
                                                    <p className="text-zinc-300 tracking-tight leading-normal text-xs">{crash.error}</p>
                                                </div>

                                                {crash.status === 'CRITICAL' && (
                                                    <button
                                                        onClick={() => repairCrash(crash.id)}
                                                        disabled={isRepairing}
                                                        className="px-4 py-2 bg-gradient-to-r from-pink-500 to-indigo-500 hover:opacity-90 active:scale-95 disabled:opacity-40 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-1.5 self-end sm:self-auto shrink-0 shadow-md animate-pulse"
                                                    >
                                                        {isRepairing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <>Auto-Repair Bug 🛠</>}
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Guardrail Human-In-The-Loop WhatsApp Dialogue Bubble */}
                                {vetoAlertTriggered && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-6 bg-teal-950/20 border border-teal-500/35 rounded-3xl relative overflow-hidden space-y-4"
                                    >
                                        <div className="flex items-center gap-2 text-teal-400 font-black text-xs font-mono select-none">
                                            <Send className="w-4 h-4 animate-bounce" /> HUMAN-IN-THE-LOOP TELEGRAM & WHATSAPP VETO POWER DISPATCHED 🟢
                                        </div>
                                        <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                                            The system failed 3 continuous times. Because n8n has locked git operations to prevent breaking code blocks, it dispatched a secure critical telemetry payload down to your personal smartphone chat link:
                                        </p>
                                        
                                        {/* Phone Interface Bubble Box */}
                                        <div className="p-4 bg-[#0b141a] border border-zinc-900 rounded-2xl max-w-md mx-auto space-y-2.5 shadow-2xl relative">
                                            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-sans border-b border-zinc-900 pb-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                                <span className="font-bold text-zinc-300">Singularity Brain Guardrail Alert</span>
                                                <span className="ml-auto font-mono">{new Date().toLocaleTimeString().substring(0, 5)} PM</span>
                                            </div>

                                            <div className="flex gap-2">
                                                {/* Left avatar */}
                                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                                                    <Brain className="w-4 h-4 text-pink-400" />
                                                </div>
                                                {/* WhatsApp Style Chat bubble */}
                                                <div className="relative p-3 rounded-2xl rounded-tl-none bg-[#202c33] border border-zinc-800 text-[#e9edef] text-xs font-sans max-w-[85%] leading-relaxed shadow-md">
                                                    <div className="absolute top-0 -left-1.5 w-3 h-3 bg-[#202c33] border-t border-l border-zinc-800 rotate-45 transform origin-top-right"></div>
                                                    <span className="block text-[8px] font-mono tracking-widest text-indigo-400 font-black uppercase mb-1">SYSTEM_ALARM</span>
                                                    <span className="font-bold text-emerald-300">"Master, I tried to resolve this error 3 times, but it is outside my logical bound. Please inspect manually."</span>
                                                    <div className="text-[8px] text-zinc-400 select-none mt-2 text-right">
                                                        Failures: 3/3 • Codebase Lock applied
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-center pt-2 select-none">
                                            <button
                                                onClick={resetRepairSimulator}
                                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-95 transition-all font-mono"
                                            >
                                                🔓 Re-Calibrate & Unlock Loop State
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </Card>
                    )}

                    {selectedTab === 'whatsapp' && (
                        <Card className="bg-black border border-zinc-900 rounded-[2.5rem] p-8 shadow-xl">
                            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase tracking-widest">Neural persistent bot (Phase 4)</span>
                                    <h3 className="text-lg font-black text-white uppercase italic tracking-wider mt-1.5 flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-emerald-400 animate-pulse" /> WhatsApp Business API Integration (WhatsApp bot)
                                    </h3>
                                    <p className="text-xs text-zinc-400 mt-0.5">Dual webhooks orchestrated inside n8n with automated memory databases and active emergency fallback human support.</p>
                                </div>
                                <div className="flex gap-2.5">
                                    <div className="flex items-center gap-1.5 p-1.5 px-3 rounded-xl bg-zinc-950 border border-zinc-900">
                                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Redis Context Memory:</span>
                                        <button
                                            onClick={() => {
                                                setWhatsappSessionActive(!whatsappSessionActive);
                                                addToast(whatsappSessionActive ? 'Redis Context: DISABLED' : 'Redis Context: ENABLED', 'info');
                                            }}
                                            className={`px-2 py-0.5 rounded text-[8px] font-extrabold tracking-widest uppercase transition-all ${
                                                whatsappSessionActive 
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                    : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                                            }`}
                                        >
                                            {whatsappSessionActive ? 'ACTIVE (10M THREAD)' : 'DISABLED'}
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setWhatsappMessages([
                                                { sender: 'user', text: "Retrieve today's AI news and prepare an analysis.", time: '01:31 PM' },
                                                { 
                                                    sender: 'bot', 
                                                    text: "🤖 *Omni-Intelligence Brain Response*:\n\nToday's major AI developments are as follows:\n\n1. *Core AI 1.5 Pro & Flash*: Massive upgrades in SmartCore AI.\n2. *Deep Search Engine & Twitter Integration*: Realtime Reactor + Deep Search Engine combination went live for real-time data sourcing.\n\n*Analysis*: Self-repair loops are now fully functional in production.", 
                                                    time: '01:32 PM' 
                                                }
                                            ]);
                                            setActiveWhatsappStep(0);
                                            setIsWhatsAppProcessing(false);
                                            setWhatsappHandoffActive(false);
                                            addToast('Simulator registers successfully cleared!', 'success');
                                        }}
                                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[10px] text-zinc-400 font-mono rounded-xl transition-all"
                                    >
                                        🔄 Clear Chat
                                    </button>
                                </div>
                            </div>

                            {/* Main Grid: Phone Simulator & Sequence Mapping */}
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                                {/* Left Side: 5 Columns for the WhatsApp Device Mockup */}
                                <div className="xl:col-span-12 lg:col-span-12 xl:max-w-none xl:w-auto flex flex-col items-center xl:col-span-5">
                                    <div className="w-full max-w-sm border-[10px] border-zinc-900 rounded-[3rem] bg-[#0b141a] h-[550px] flex flex-col overflow-hidden shadow-2xl relative">
                                        {/* Phone Notch */}
                                        <div className="h-6 w-full bg-black flex items-center justify-between px-6 text-[10px] font-sans text-zinc-400 select-none shrink-0 z-20">
                                            <span>9:41</span>
                                            <div className="w-20 h-4 bg-zinc-900 rounded-b-xl mx-auto absolute left-1/2 -translate-x-1/2 top-0"></div>
                                            <div className="flex items-center gap-1">
                                                <span>📶</span>
                                                <span>🔋</span>
                                            </div>
                                        </div>

                                        {/* WhatsApp Header bar */}
                                        <div className="bg-[#1f2c34] px-4 py-3 border-b border-zinc-900 flex items-center gap-3 shrink-0 select-none z-10">
                                            <div className="relative w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                                <Brain className="w-4 h-4 text-emerald-400 animate-pulse" />
                                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-zinc-900 rounded-full animate-ping"></div>
                                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-zinc-900 rounded-full"></div>
                                            </div>
                                            <div className="truncate flex-1">
                                                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                                                    WhatsApp Neural OS <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded font-mono">BETA</span>
                                                </h4>
                                                <p className="text-[9px] text-zinc-400 truncate">
                                                    {isWhatsAppProcessing ? '⚡ Webhook is processing logs...' : '● Connected to n8n Webhook'}
                                                </p>
                                            </div>
                                            <span className="text-xs text-zinc-400">📞 ⚙️</span>
                                        </div>

                                        {/* WhatsApp Message Body Area */}
                                        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 max-h-[380px] custom-scrollbar bg-[#0f1d24]">
                                            {whatsappMessages.map((msg, i) => {
                                                const isUser = msg.sender === 'user';
                                                return (
                                                    <div
                                                        key={i}
                                                        className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                                                    >
                                                        <div className={`relative p-3 rounded-2xl max-w-[85%] text-xs shadow-md ${
                                                            isUser 
                                                                ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none' 
                                                                : 'bg-[#202c33] text-[#e9edef] rounded-tl-none border border-zinc-800'
                                                        }`}>
                                                            {/* Bubble Corner Tails */}
                                                            <div className={`absolute top-0 w-3 h-3 rotate-45 transform origin-top ${
                                                                isUser 
                                                                    ? '-right-1.5 bg-[#005c4b]' 
                                                                    : '-left-1.5 bg-[#202c33] border-t border-l border-zinc-800'
                                                            }`}></div>
                                                            <p className="whitespace-pre-line leading-relaxed text-[11px] font-sans relative z-10">{msg.text}</p>
                                                            <div className="text-[8px] text-zinc-400 text-right mt-1.5 select-none font-mono relative z-10">
                                                                {msg.time} {isUser ? '✓✓' : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {isWhatsAppProcessing && (
                                                <div className="flex justify-start">
                                                    <div className="bg-[#202c33] text-[#e9edef] border border-zinc-800 p-3 rounded-2xl rounded-tl-none max-w-[80%] text-xs shadow-md animate-pulse">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex gap-1">
                                                                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                                            </div>
                                                            <span className="text-[10px] text-zinc-400 font-mono">Brain is thinking (n8n node sequence)...</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* WhatsApp Input area */}
                                        <div className="bg-[#1f2c34] p-3 border-t border-zinc-900 flex items-center gap-2 shrink-0 select-none z-10">
                                            <input
                                                type="text"
                                                value={whatsappInput}
                                                onChange={(e) => setWhatsappInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleWhatsAppMessageSubmit()}
                                                placeholder={isWhatsAppProcessing ? "Wait for response..." : "Type a message..."}
                                                disabled={isWhatsAppProcessing}
                                                className="flex-1 bg-[#2a3942] border border-transparent focus:border-emerald-500 text-white rounded-full px-4 py-2 text-xs outline-none transition-all placeholder:text-zinc-500"
                                            />
                                            <button
                                                onClick={() => handleWhatsAppMessageSubmit()}
                                                disabled={isWhatsAppProcessing || !whatsappInput.trim()}
                                                className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:scale-100 disabled:opacity-40 text-black flex items-center justify-center shrink-0 shadow transition-all cursor-pointer"
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Presets suggestions row */}
                                        <div className="bg-[#0b141a] border-t border-zinc-900 px-3 py-2 flex gap-1.5 overflow-x-auto shrink-0 select-none custom-scrollbar">
                                            {[
                                                { label: '📊 AI News', text: "Retrieve today's AI news and prepare an analysis." },
                                                { label: '🚨 Support', text: "Customer Support: I want to speak to a Human Agent." },
                                                { label: '🧪 Hello World', text: 'Hello World! Analyze and generate code.' }
                                            ].map((preset, idx) => (
                                                <button
                                                    key={idx}
                                                    disabled={isWhatsAppProcessing}
                                                    onClick={() => handleWhatsAppMessageSubmit(preset.text)}
                                                    className="shrink-0 bg-zinc-900/60 hover:bg-[#1f2c34] active:scale-95 border border-zinc-800 hover:border-zinc-700 rounded-lg px-2.5 py-1 text-[9px] text-zinc-300 font-sans tracking-tight transition-all"
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-zinc-500 font-mono mt-2.5 text-center px-10">
                                        Type keywords like <span className="text-emerald-500 font-bold">Human</span>, <span className="text-emerald-500 font-bold">Agent</span> or <span className="text-emerald-500 font-bold">Support</span> to trigger the Emergency Safeguard handoff logic.
                                    </span>
                                </div>

                                {/* Right Side: Dynamic Flow Chart Visualization matching uploaded image */}
                                <div className="xl:col-span-7 space-y-6">
                                    <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-3xl space-y-4">
                                        <div className="flex items-center justify-between pb-2 border-b border-zinc-900/60">
                                            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest flex items-center gap-1">
                                                <Radio className="w-3.5 h-3.5 text-emerald-400" /> Active WhatsApp AI Sequence Trace Logs
                                            </span>
                                            <span className="text-[9px] text-zinc-500 font-mono">
                                                Active execution state: <span className="text-emerald-400 font-black tracking-widest">{activeWhatsappStep ? `STEP ${activeWhatsappStep}/8` : 'STANDBY'}</span>
                                            </span>
                                        </div>

                                        <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                                            When a user sends a message on WhatsApp, the flowchart below and the n8n self-directed orchestrator execute live data transfer. This is inspired by your uploaded <strong>WhatsApp AI Data Flow Architecture</strong>:
                                        </p>

                                        {/* Dynamic Node connectors chart */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative">
                                            {[
                                                { step: 1, title: '1. Device Submit', icon: <MessageSquare className="w-3.5 h-3.5" />, desc: 'User sends data', latency: '4ms' },
                                                { step: 2, title: '2. n8n Listener', icon: <Radio className="w-3.5 h-3.5" />, desc: 'Webhook triggering', latency: '12ms' },
                                                { step: 3, title: '3. Redis Memory', icon: <Database className="w-3.5 h-3.5" />, desc: '10m thread context', latency: '24ms' },
                                                { step: 4, title: '4. Core AI Router', icon: <Brain className="w-3.5 h-3.5" />, desc: 'Phase 1 Meta Broker', latency: '65ms' },
                                                { step: 5, title: '5. Dispatch Decision', icon: <Network className="w-3.5 h-3.5" />, desc: 'Handoff vs AI Models', latency: '15ms' },
                                                { step: 6, title: '6. Model Node run', icon: <Cpu className="w-3.5 h-3.5" />, desc: 'Deep Search Engine / Cloud Logic AI', latency: '140ms' },
                                                { step: 7, title: '7. n8n HTTP Sender', icon: <Zap className="w-3.5 h-3.5" />, desc: 'Facebook Push API', latency: '35ms' },
                                                { step: 8, title: '8. Back to Phone', icon: <UserCheck className="w-3.5 h-3.5" />, desc: 'Message delivered', latency: '280ms' }
                                            ].map((node) => {
                                                const isActive = activeWhatsappStep === node.step;
                                                const isCompleted = activeWhatsappStep > node.step;
                                                return (
                                                    <div 
                                                        key={node.step}
                                                        className={`p-3 rounded-2xl border transition-all flex flex-col justify-between h-[82px] relative ${
                                                            isActive 
                                                                ? 'bg-emerald-500/10 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-pulse' 
                                                                : isCompleted 
                                                                    ? 'bg-zinc-950/80 border-emerald-500/20 text-[#a3a3a3]' 
                                                                    : 'bg-zinc-950/20 border-zinc-900/60 text-zinc-600'
                                                        }`}
                                                    >
                                                        {isActive && (
                                                            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></div>
                                                        )}
                                                        <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase font-black tracking-wider">
                                                            <span className={isActive ? 'text-emerald-400' : isCompleted ? 'text-emerald-500/70' : 'text-zinc-600'}>
                                                                {node.icon}
                                                            </span>
                                                            <span className={isActive ? 'text-white' : isCompleted ? 'text-zinc-300' : 'text-zinc-500'}>
                                                                {node.title}
                                                            </span>
                                                        </div>
                                                        <span className="text-[9px] block text-zinc-400 truncate leading-snug">{node.desc}</span>
                                                        <div className="flex items-center justify-between border-t border-zinc-900/30 pt-1 text-[8px] font-mono">
                                                            <span className="text-zinc-600">LATENCY:</span>
                                                            <span className={isActive ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>{node.latency}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Copyable Phase 4 Integration Engines Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        
                                        {/* Listener (Webhook Setup) */}
                                        <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-3xl space-y-3.5">
                                            <div className="flex justify-between items-center select-none pb-2 border-b border-zinc-900/60">
                                                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest flex items-center gap-1">
                                                    <Radio className="w-3.5 h-3.5 text-emerald-400" /> 1. Meta Webhook Receiver Schema
                                                </span>
                                                <button 
                                                    onClick={() => copyToClipboard(JSON.stringify({
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "919876543210", 
          "id": "wamid.HBgL...",
          "text": {"body": "Retrieve today's AI news and prepare an analysis."}
        }]
      }
    }]
  }]
}, null, 2), 'Webhook Listener Schema')}
                                                    className="text-[9px] text-emerald-400 hover:text-emerald-300 font-mono font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/20"
                                                >
                                                    {copiedSnippet === 'Webhook Listener Schema' ? '✓ COPIED' : '📋 COPY JSON'}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-zinc-400 font-sans">Meta (Facebook) outgoing Webhook POST schema parsed securely inside n8n to initiate the orchestrator sequence:</p>
                                            <pre className="p-3 bg-[#0b141a] border border-zinc-900 rounded-xl text-[10px] text-emerald-300 font-mono leading-relaxed h-32 overflow-y-auto custom-scrollbar">
{`{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "919876543210", 
          "id": "wamid.HBgL...",
          "text": {"body": "Retrieve today's AI news..."}
        }]
      }
    }]
  }]
}`}
                                            </pre>
                                        </div>

                                        {/* Context Management Setup */}
                                        <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-3xl space-y-3.5">
                                            <div className="flex justify-between items-center select-none pb-2 border-b border-zinc-900/60">
                                                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest flex items-center gap-1">
                                                    <Database className="w-3.5 h-3.5 text-indigo-400" /> 2. Redis Session Context Config
                                                </span>
                                                <button 
                                                    onClick={() => copyToClipboard(`SETEX "sess:919876543210" 600 "{\\"previous_convo\\": \\"오늘의 인공지능 관련...\\"}"`, 'Redis Query Code')}
                                                    className="text-[9px] text-indigo-400 hover:text-indigo-300 font-mono font-bold bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/20"
                                                >
                                                    {copiedSnippet === 'Redis Query Code' ? '✓ COPIED' : '📋 COPY COMMAND'}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-zinc-400 font-sans">Redis/PostgreSQL logic strategy: Stores phone transaction state context with a rolling threshold limit of 10 minutes (600 seconds) to maintain memory:</p>
                                            <pre className="p-3 bg-[#0b141a] border border-zinc-900 rounded-xl text-[10px] text-indigo-300 font-mono leading-relaxed h-32 overflow-y-auto custom-scrollbar">
{`# 1. On incoming message, query state:
GET "sess:919876543210"

# 2. If present, load context string to Core AI Router.
# 3. Save latest answer with rolling expiry (600s):
SETEX "sess:919876543210" 600 "{...latest_session_variables...}"`}
                                            </pre>
                                        </div>

                                        {/* Responder Outward Packet */}
                                        <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-3xl space-y-3.5">
                                            <div className="flex justify-between items-center select-none pb-2 border-b border-zinc-900/60">
                                                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest flex items-center gap-1">
                                                    <Zap className="w-3.5 h-3.5 text-cyan-400" /> 3. WhatsApp Sender Push Payload
                                                </span>
                                                <button 
                                                    onClick={() => copyToClipboard(JSON.stringify({
  "messaging_product": "whatsapp",
  "to": "919876543210", 
  "type": "text",
  "text": {
    "preview_url": true,
    "body": "🤖 *Omni-Intelligence Brain Response*:\\n\\nI have processed your request..."
  }
}, null, 2), 'Sender Push Engine')}
                                                    className="text-[9px] text-cyan-400 hover:text-cyan-300 font-mono font-bold bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/20"
                                                >
                                                    {copiedSnippet === 'Sender Push Engine' ? '✓ COPIED' : '📋 COPY JSON'}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-zinc-400 font-sans">Endpoint: graph.facebook.com/v19.0/PHONE_NUMBER_ID/messages. HTTPS POST payload triggered by n8n to reply back over WhatsApp:</p>
                                            <pre className="p-3 bg-[#0b141a] border border-zinc-900 rounded-xl text-[10px] text-cyan-300 font-mono leading-relaxed h-32 overflow-y-auto custom-scrollbar">
{`{
  "messaging_product": "whatsapp",
  "to": "{{$json.from}}", 
  "type": "text",
  "text": {
    "preview_url": true,
    "body": "{{$json.final_ai_response}}"
  }
}`}
                                            </pre>
                                        </div>

                                        {/* Human Handoff Guardrail Prompt instructions */}
                                        <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-3xl space-y-3.5">
                                            <div className="flex justify-between items-center select-none pb-2 border-b border-zinc-900/60">
                                                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest flex items-center gap-1">
                                                    <PhoneCall className="w-3.5 h-3.5 text-pink-400" /> 4. Human-Handoff Prompt Guardrule
                                                </span>
                                                <button 
                                                    onClick={() => copyToClipboard(`SYSTEM RULE: You must inspect the user's latest incoming Whatsapp message text payload.\nIF the semantic intent represents 'human assistance', 'live moderator care', or contains keywords ('agent', 'human', 'call', 'support', 'help'),\nTHEN you MUST set:\n{ "decision": { "target_agent": "HUMAN_HANDOFF_NODE" } }\nDo NOT execute standard research nodes.`, 'Handoff prompt rule')}
                                                    className="text-[9px] text-pink-400 hover:text-pink-300 font-mono font-bold bg-pink-500/5 px-2 py-0.5 rounded border border-pink-500/20"
                                                >
                                                    {copiedSnippet === 'Handoff prompt rule' ? '✓ COPIED' : '📋 COPY RULE'}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-zinc-400 font-sans">The instruction block configured inside the Core AI Router system rules to isolate human requests and bypass standard node processing:</p>
                                            <pre className="p-3 bg-[#0b141a] border border-zinc-900 rounded-xl text-[10px] text-pink-400 font-mono leading-relaxed h-32 overflow-y-auto custom-scrollbar">
{`SYSTEM RULE: You must inspect user's latest incoming Whatsapp message text payload.
IF the semantic intent contains key words ('agent', 'human', 'call', 'support', 'help'),
THEN you MUST response exactly:
{ "decision": { "target_agent": "HUMAN_HANDOFF_NODE" } }`}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Shared: Active Live Trace Logs */}
                    <Card className="bg-black border border-zinc-900 rounded-[2.5rem] p-8 overflow-hidden font-mono text-xs">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-900 text-zinc-500 mb-4 justify-between">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-indigo-400 animate-pulse" />
                                <span className="font-bold text-[10px] uppercase tracking-wider">Neural-Orchestration Telemetry Sync</span>
                            </div>
                            <span className="text-[8px] bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded text-indigo-400">SYS_TRACE</span>
                        </div>
                        <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                            {intelligenceData.orchestrationTrace.map((log, i) => (
                                <div key={i} className="flex gap-2 text-[11px]">
                                    <span className="text-zinc-700 font-bold">[{new Date().toLocaleTimeString()}]</span>
                                    <span className={log.includes('🚨') || log.includes('🚨') ? "text-red-400 font-black animate-pulse" : (log.includes('🎉') || log.includes('🔧') ? "text-green-400 font-bold" : "text-zinc-400")}>
                                        ⚡ {log}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Active Overlord Brain Decision Result */}
                <div className="space-y-8">
                    
                    {/* Integrated Decision Output view */}
                    <Card className="bg-black border border-zinc-800 rounded-[2.5rem] flex flex-col p-8 overflow-hidden min-h-[450px]">
                        <div className="flex justify-between items-center pb-4 border-b border-zinc-900 mb-6 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <Fingerprint className="w-5 h-5 text-indigo-400 animate-pulse" />
                                <h3 className="text-sm font-black text-white italic uppercase tracking-wider">Mind Output (Brain's Decision)</h3>
                            </div>
                            <div className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded text-[9px] font-mono font-bold">
                                VERIFIED SCORE: {intelligenceData.evolutionScore}%
                            </div>
                        </div>

                        {/* Interactive Aggregated plan */}
                        <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-1">
                            <div>
                                <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest font-bold block mb-1.5 select-none">Aggregated Execution Plan</span>
                                <p className="text-xs text-white leading-relaxed bg-zinc-950/60 p-4 rounded-xl border border-zinc-900 whitespace-pre-line font-mono">
                                    {intelligenceData.finalAggregatedPlan}
                                </p>
                            </div>

                            {/* Section breakdown showing how individual models responded */}
                            <div className="space-y-4">
                                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-bold block select-none">Model Telemetry Feedback Matrix</span>
                                
                                <div className="space-y-3 font-mono text-[10px]">
                                    {[
                                        { name: 'Core AI Plan', value: intelligenceData.geminiResponse, col: 'text-indigo-400 bg-indigo-505/10 bg-indigo-500/5' },
                                        { name: 'Cloud Logic AI Strategy', value: intelligenceData.openaiResponse, col: 'text-emerald-400 bg-emerald-500/5' },
                                        { name: 'Realtime Reactor Live', value: intelligenceData.grokResponse, col: 'text-amber-400 bg-amber-500/5' },
                                        { name: 'Deep Search Engine Search', value: intelligenceData.perplexityResponse, col: 'text-cyan-400 bg-cyan-500/5' },
                                        { name: 'Kimi Documents', value: intelligenceData.kimiResponse, col: 'text-blue-400 bg-blue-500/5' },
                                        { name: 'OpenHuman Bio', value: intelligenceData.humanResponse, col: 'text-red-400 bg-red-500/5' },
                                        { name: 'OpenClaw Hardware', value: intelligenceData.openclawResponse, col: 'text-purple-400 bg-purple-500/5' },
                                        { name: 'Git-Self Healing', value: intelligenceData.githubResponse, col: 'text-pink-400 bg-pink-500/5' },
                                        { name: 'N8N Webhooks', value: intelligenceData.n8nResponse, col: 'text-teal-400 bg-teal-500/5' },
                                        { name: 'Opals Sentiments', value: intelligenceData.opalsResponse, col: 'text-yellow-400 bg-yellow-500/5' }
                                    ].map((m, idx) => (
                                        <div key={idx} className={`p-3 rounded-lg border border-zinc-900/40 ${m.col}`}>
                                            <div className="font-bold uppercase tracking-wider mb-1 flex justify-between">
                                                <span>{m.name}</span>
                                                <span className="opacity-50">✓ STABLE</span>
                                            </div>
                                            <p className="text-zinc-400 leading-normal">{m.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-zinc-900 mt-6 flex-shrink-0">
                            <button 
                                onClick={() => {
                                    addToast('Running complete ecosystem self-refresh diagnostic test...', 'info');
                                    handleModelSynthesis('Initiate full 10-model self-healing cycle diagnostic test and benchmark overall platform system performance.');
                                }}
                                className="w-full py-3 bg-white text-black font-black uppercase tracking-widest text-[9px] rounded-xl hover:bg-cyan-400 hover:text-black transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                            >
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Self-Optimize All Agents
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default FutureOvermind;
