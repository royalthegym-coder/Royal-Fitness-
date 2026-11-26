import React, { useState } from 'react';
import Card from './common/Card';
import { 
    Brain, MessageSquare, Camera, CreditCard, 
    Globe, Database, Zap, Cpu, Activity, 
    ShieldCheck, Network, Sparkles, Layers,
    Bot, Fingerprint, RefreshCw, Eye, Clock, Smartphone, Star, Unlock
} from 'lucide-react';

const SmartArchitecture: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'stack' | 'god-tier' | 'roadmap' | 'comparison'>('stack');

    const techStack = [
        {
            id: 'core',
            title: 'Core Management & AI Architecture (The Brain)',
            description: '100% Free and open-source engines to power your neural operating system:',
            icon: <Brain className="w-8 h-8 text-purple-400" />,
            color: 'from-purple-500/20 to-fuchsia-500/20',
            border: 'border-purple-500/30',
            tools: [
                { name: 'Llama-3 / Edge Node (via Groq/HF)', desc: 'Generates scientific diet structures and active workouts. Leverages high intelligence at zero cost.', icon: <Sparkles className="w-5 h-5 text-purple-400" /> },
                { name: 'n8n (Self-Hosted Community Edition)', desc: 'Runs the entire gym backend on autofocus with no monthly subscription fees.', icon: <Network className="w-5 h-5 text-purple-400" /> },
                { name: 'ChromaDB / FAISS (Local Vector DB)', desc: 'Provides local vector memory to keep member progress personalized without premium database bills.', icon: <Database className="w-5 h-5 text-purple-400" /> }
            ]
        },
        {
            id: 'whatsapp',
            title: 'WhatsApp Business & Comm Automation',
            description: 'Intelligent conversational AI mimicking human replies at zero cost:',
            icon: <MessageSquare className="w-8 h-8 text-green-400" />,
            color: 'from-green-500/20 to-emerald-500/20',
            border: 'border-green-500/30',
            tools: [
                { name: 'whatsapp-web.js / Baileys', desc: 'Saves expensive WhatsApp official API license fees by creating local custom clients.', icon: <MessageSquare className="w-5 h-5 text-green-400" /> },
                { name: 'Flowise AI (Open Source)', desc: 'A node-based chatbot flow builder designed to capture gym admission forms.', icon: <Bot className="w-5 h-5 text-green-400" /> },
                { name: 'Local Whisper (Speech-to-Text)', desc: 'Transcribes member voice notes to readable transcripts instantly and cost-free.', icon: <RefreshCw className="w-5 h-5 text-green-400" /> }
            ]
        },
        {
            id: 'vision',
            title: 'AI Fitness & Exercise Vision (Advanced)',
            description: '100% Free libraries for pose checking and virtual active coaching:',
            icon: <Camera className="w-8 h-8 text-cyan-400" />,
            color: 'from-cyan-500/20 to-blue-500/20',
            border: 'border-cyan-500/30',
            tools: [
                { name: 'Google MediaPipe / TensorFlow.js', desc: 'Calculates active 3D pose landmarks locally on-device without cloud fees.', icon: <Activity className="w-5 h-5 text-cyan-400" /> },
                { name: 'SadTalker / Wav2Lip (Open Source)', desc: 'Alternative to pricey speech synthesis avatars. Creates auto-talking video tutorials.', icon: <Fingerprint className="w-5 h-5 text-cyan-400" /> },
                { name: 'YouTube Data API (Free Tier)', desc: 'Syncs visual exercise tutorials to keep the feed engaging and trendy.', icon: <Layers className="w-5 h-5 text-cyan-400" /> }
            ]
        },
        {
            id: 'finance',
            title: 'Payment & Finance Automation',
            description: 'Syncs cash and UPI payments without transaction gateway fees:',
            icon: <CreditCard className="w-8 h-8 text-amber-400" />,
            color: 'from-amber-500/20 to-orange-500/20',
            border: 'border-amber-500/30',
            tools: [
                { name: 'Direct UPI Intent / Dynamic QR', desc: 'Direct bank account deposits avoiding MDR fees completely.', icon: <CreditCard className="w-5 h-5 text-amber-400" /> },
                { name: 'Auto-Reconciliation Bot (Local)', desc: 'Scans device receipt SMS to automatically verify payment status as paid.', icon: <ShieldCheck className="w-5 h-5 text-amber-400" /> }
            ]
        },
        {
            id: 'marketing',
            title: 'Marketing & Smart Diet Algorithm',
            description: 'Promote local SEO presence and formulate micro-nutritious diets:',
            icon: <Globe className="w-8 h-8 text-pink-400" />,
            color: 'from-pink-500/20 to-rose-500/20',
            border: 'border-pink-500/30',
            tools: [
                { name: 'OpenStreetMap / Nominatim', desc: 'Geolocal target mapping with open mapping endpoints.', icon: <Globe className="w-5 h-5 text-pink-400" /> },
                { name: 'GMB API (Free Tier)', desc: 'Replies to search engine reviews and updates local business maps automatically.', icon: <Zap className="w-5 h-5 text-pink-400" /> },
                { name: 'OpenFoodFacts API', desc: 'Scans barcodes and delivers extensive food labels database at zero cost.', icon: <Activity className="w-5 h-5 text-pink-400" /> },
                { name: 'USDA FoodData Central', desc: 'Leverages full access to the official clinical database of food nutrients.', icon: <Database className="w-5 h-5 text-pink-400" /> }
            ]
        }
    ];

    const godTierTools = [
        {
            id: 'orion',
            name: 'Orion Nexus (The Multi-Agent Orchestrator)',
            tech: 'n8n (Self-Hosted) + Llama-3 (Local)',
            desc: 'This is not just a single bot, it manages a fleet of bots. 100% cost-free and fully automated. When a member makes a payment, Orion immediately coordinates incoming data, receipts, WhatsApp notifications, and updates the diet logs, completely without external API billing.',
            icon: <Network className="w-6 h-6 text-purple-400" />,
            color: 'from-purple-500/20 to-fuchsia-500/20',
            border: 'border-purple-500/30'
        },
        {
            id: 'titan',
            name: 'Titan Vision Pro v5.0 (The Pose Correction Engine)',
            tech: 'Google MediaPipe + TensorFlow.js (Free Edge AI)',
            desc: 'Users exercise in front of their mobile device camera, and this tool tracks real-time skeletal positions with ultra-high accuracy to guide posture correction. It runs entirely on-device, saving you server-side computer costs.',
            icon: <Eye className="w-6 h-6 text-cyan-400" />,
            color: 'from-cyan-500/20 to-blue-500/20',
            border: 'border-cyan-500/30'
        },
        {
            id: 'gastronoma',
            name: 'Gastronoma Scientific AI (The Advanced Kitchen Chief)',
            tech: 'Edge Node 8x7B (Open Source) + OpenFoodFacts DB',
            desc: 'It does not just generate static diet plans. It monitors biometric biomarkers and smart scales to adjust daily calories dynamically, utilizing OpenFoodFacts public database integrations at no premium cost.',
            icon: <Activity className="w-6 h-6 text-green-400" />,
            color: 'from-green-500/20 to-emerald-500/20',
            border: 'border-green-500/30'
        },
        {
            id: 'aegis',
            name: 'Aegis Flow (The WhatsApp & Business Automation)',
            tech: 'whatsapp-web.js (Free) + n8n Community',
            desc: 'Allows you to turn standard WhatsApp lines into Automated Bots without expensive Twilio or commercial API systems. Captures leads, coordinates virtual gym tours, and collects registration info automatically.',
            icon: <MessageSquare className="w-6 h-6 text-pink-400" />,
            color: 'from-pink-500/20 to-rose-500/20',
            border: 'border-pink-500/30'
        },
        {
            id: 'chronos',
            name: 'Chronos Mirror v11.5 (Predictive Retention Bot)',
            tech: 'Scikit-Learn + Local Heuristics',
            desc: 'Predicts which member is likely to drop out of their routine over the next 10 days using local pattern-matching algorithms, allowing trainers to reach out proactively.',
            icon: <Clock className="w-6 h-6 text-amber-400" />,
            color: 'from-amber-500/20 to-orange-500/20',
            border: 'border-amber-500/30'
        }
    ];

    const comparisonTable = [
        { feature: 'Diet AI', tool: 'Llama-3 + OpenFoodFacts', desc: 'Scientific & research-fueled diet plan (100% Free)' },
        { feature: 'Pose Detection', tool: 'MediaPipe (On-Device)', desc: 'Real-time workout posture checking (Zero Server Cost)' },
        { feature: 'Automation', tool: 'n8n (Self-Hosted)', desc: 'Codeless workflow engine (No Monthly subscription Fees)' },
        { feature: 'Payment', tool: 'Dynamic UPI QR', desc: 'One-click visual checkout (0% Transaction Fee)' },
        { feature: 'Content', tool: 'Stable Diffusion / Flux', desc: 'Hyper-realistic workout imagery (Open Source)' }
    ];

    const summaryTable = [
        { section: 'Brain', tool: 'Llama-3 + ChromaDB', role: 'Vector memory & local core logic (Cost-Free)' },
        { section: 'Vision', tool: 'Google MediaPipe', role: 'Live tracking of posture angles (Local)' },
        { section: 'Automation', tool: 'n8n / Flowise', role: 'Dues reminders and registration sequences (Self-Hosted)' },
        { section: 'Diet AI', tool: 'USDA DB + Edge Node AI', role: 'Clinical and biological nutrition plans (Open Source)' },
        { section: 'Media', tool: 'Local Whisper + SadTalker', role: 'Engagement videos and transcription templates (Free)' }
    ];

    const masterArchitecture = [
        { layer: 'User Interface', tool: 'React / Tailwind', work: 'Sleek, fluid navigation interfaces.' },
        { layer: 'Logic Layer', tool: 'n8n (Community)', work: 'Self-repairing automation for alerts and payments.' },
        { layer: 'Intelligence', tool: 'Llama-3 / Groq', work: 'Clinical data lookups without external server hits.' },
        { layer: 'Vision Layer', tool: 'MediaPipe', work: '3D pose coordinate tracking directly in browser.' },
        { layer: 'Communication', tool: 'whatsapp-web.js', work: 'Unbounded free text broadcast threads.' }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 flex items-center gap-3">
                        <Unlock className="w-8 h-8 text-indigo-400" />
                        100% Free & Open-Source Smart OS
                    </h1>
                    <p className="text-gray-400 mt-2">
                        The world's most advanced, fully-automated and <span className="text-green-400 font-bold">Cost-Free</span> AI stack
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-gray-800 mb-6">
                <button
                    onClick={() => setActiveTab('stack')}
                    className={`pb-4 px-4 font-medium transition-colors ${
                        activeTab === 'stack' 
                            ? 'text-indigo-400 border-b-2 border-indigo-400' 
                            : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    Cost-Free Tech Stack
                </button>
                <button
                    onClick={() => setActiveTab('god-tier')}
                    className={`pb-4 px-4 font-medium transition-colors ${
                        activeTab === 'god-tier' 
                            ? 'text-indigo-400 border-b-2 border-indigo-400' 
                            : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    7 Open-Source Bots
                </button>
                <button
                    onClick={() => setActiveTab('roadmap')}
                    className={`pb-4 px-4 font-medium transition-colors ${
                        activeTab === 'roadmap' 
                            ? 'text-indigo-400 border-b-2 border-indigo-400' 
                            : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    Automation Roadmap
                </button>
                <button
                    onClick={() => setActiveTab('comparison')}
                    className={`pb-4 px-4 font-medium transition-colors ${
                        activeTab === 'comparison' 
                            ? 'text-indigo-400 border-b-2 border-indigo-400' 
                            : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    Free vs Paid Comparison
                </button>
            </div>

            {/* Content */}
            {activeTab === 'stack' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {techStack.map((section) => (
                        <Card key={section.id} className={`bg-gradient-to-br ${section.color} border ${section.border} backdrop-blur-sm`}>
                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-700/50">
                                    {section.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{section.title}</h3>
                                    <p className="text-sm text-gray-300 mt-1">{section.description}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {section.tools.map((tool, idx) => (
                                    <div key={idx} className="flex gap-3 p-3 bg-gray-900/40 rounded-lg border border-gray-700/30 hover:bg-gray-900/60 transition-colors">
                                        <div className="mt-1">{tool.icon}</div>
                                        <div>
                                            <h4 className="font-semibold text-gray-100">{tool.name}</h4>
                                            <p className="text-sm text-gray-400 mt-1 leading-relaxed">{tool.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {activeTab === 'god-tier' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {godTierTools.map((tool) => (
                            <Card key={tool.id} className={`bg-gradient-to-br ${tool.color} border ${tool.border} backdrop-blur-sm hover:scale-[1.02] transition-transform duration-300`}>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-700/50">
                                        {tool.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white leading-tight">{tool.name}</h3>
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-900/60 rounded text-xs font-medium text-green-400 border border-green-500/30">
                                            {tool.tech}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    {tool.desc}
                                </p>
                            </Card>
                        ))}
                    </div>

                    <Card className="bg-gray-900/50 border-gray-800 mt-8">
                        <div className="p-4 border-b border-gray-800 flex items-center gap-3">
                            <Star className="w-6 h-6 text-amber-400" />
                            <h3 className="text-xl font-bold text-white">Open-Source Stack Summary</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-800 bg-gray-900/30">
                                        <th className="py-4 px-6 text-gray-400 font-medium">Section</th>
                                        <th className="py-4 px-6 text-gray-400 font-medium">Free Tool</th>
                                        <th className="py-4 px-6 text-gray-400 font-medium">Main Role</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summaryTable.map((row, idx) => (
                                        <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                                            <td className="py-4 px-6 font-medium text-purple-400">{row.section}</td>
                                            <td className="py-4 px-6 text-gray-200">
                                                <span className="px-3 py-1 bg-gray-800 rounded-full text-sm border border-gray-700">
                                                    {row.tool}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-gray-400">{row.role}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 bg-green-500/10 border-t border-green-500/20 text-sm text-green-200 flex items-start gap-3">
                            <Unlock className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            <p>
                                <strong>Pro Tip:</strong> You don't need expensive commercial APIs to make the world's best app. Local Llama-3 pipelines, n8n workflow servers, and on-device MediaPipe visual sensors are completely free, zero-cost, and preserve deep user privacy.
                            </p>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'roadmap' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <Network className="w-6 h-6 text-indigo-400" />
                                <h3 className="text-xl font-bold text-white">1. n8n (Self-Hosted): 100% Free Automation</h3>
                            </div>
                            <p className="text-sm text-gray-300 mb-4">
                                The n8n Community Edition is fully free. It automates all of your gym operations (WhatsApp notifications, spreadsheets, AI integrations) without monthly charges.
                            </p>
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                    <h4 className="font-medium text-indigo-300 text-sm">Trigger (Webhook)</h4>
                                    <p className="text-xs text-gray-400 mt-1">Triggered as soon as a member submits their admission or health profiling form.</p>
                                </div>
                                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                    <h4 className="font-medium text-purple-300 text-sm">AI Node (Llama-3 Local)</h4>
                                    <p className="text-xs text-gray-400 mt-1">Analyzes health goals to build a scientifically backed custom diet plan at zero API cost.</p>
                                </div>
                                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                    <h4 className="font-medium text-green-300 text-sm">WhatsApp Node (whatsapp-web.js)</h4>
                                    <p className="text-xs text-gray-400 mt-1">Delivers direct, automated welcome templates and diet plan links to the member.</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <Eye className="w-6 h-6 text-cyan-400" />
                                <h3 className="text-xl font-bold text-white">2. MediaPipe: 'Advanced' Free Vision</h3>
                            </div>
                            <p className="text-sm text-gray-300 mb-4">
                                This engine powers deep optical tracking of body movements. It processes feed locally, guaranteeing zero server costs.
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium text-cyan-300 text-sm mb-2">Technical Architecture:</h4>
                                    <ul className="space-y-2 text-sm text-gray-400 list-disc pl-5">
                                        <li><strong>On-Device Processing:</strong> Processes coordinates inside the browser sandbox directly to ensure extreme speed.</li>
                                        <li><strong>Feedback System:</strong> Highlights alignment errors (e.g. overextended knee coordinates during deep squat reps).</li>
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <Card className="bg-gray-900/50 border-gray-800">
                        <div className="p-4 border-b border-gray-800 flex items-center gap-3">
                            <Layers className="w-6 h-6 text-purple-400" />
                            <h3 className="text-xl font-bold text-white">3. Super App's Cost-Free Master Architecture</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-800 bg-gray-900/30">
                                        <th className="py-4 px-6 text-gray-400 font-medium font-bold">Layer</th>
                                        <th className="py-4 px-6 text-gray-400 font-medium font-bold">Free Tech</th>
                                        <th className="py-4 px-6 text-gray-400 font-medium font-bold">Duties</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {masterArchitecture.map((row, idx) => (
                                        <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                                            <td className="py-4 px-6 font-medium text-indigo-300">{row.layer}</td>
                                            <td className="py-4 px-6 text-gray-200">
                                                <span className="px-3 py-1 bg-gray-800 rounded-full text-sm border border-gray-700">
                                                    {row.tool}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-gray-400">{row.work}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'comparison' && (
                <Card className="bg-gray-900/50 border-gray-800">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-800">
                                    <th className="py-4 px-6 text-gray-400 font-medium">Feature</th>
                                    <th className="py-4 px-6 text-gray-400 font-medium">Free Tool</th>
                                    <th className="py-4 px-6 text-gray-400 font-medium">Capability</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonTable.map((row, idx) => (
                                    <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                                        <td className="py-4 px-6 font-medium text-indigo-300">{row.feature}</td>
                                        <td className="py-4 px-6 text-gray-200">
                                            <span className="px-3 py-1 bg-gray-800 rounded-full text-sm border border-green-500/30 text-green-400">
                                                {row.tool}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-gray-400">{row.desc}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default SmartArchitecture;
