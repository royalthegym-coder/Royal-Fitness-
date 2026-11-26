import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Cpu, Zap, Settings, Shield, Sparkles, MessageCircle, Terminal, Command, Layout, Code, Activity } from 'lucide-react';

export const AIAgentHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState('models');

    const openSourceModels = [
        { name: "Llama 3 (Meta)", type: "LLM Orchestration", status: "Active Matrix", accuracy: "98.5%", icon: <Bot className="w-5 h-5 text-cyan-400" /> },
        { name: "Mistral Large", type: "Cognitive Processing", status: "Active Matrix", accuracy: "97.2%", icon: <Cpu className="w-5 h-5 text-indigo-400" /> },
        { name: "Gemma 2 (Google)", type: "Agentic Inference", status: "Active Matrix", accuracy: "96.8%", icon: <Sparkles className="w-5 h-5 text-fuchsia-400" /> },
        { name: "Stable Diffusion XL", type: "Visual Generation", status: "Standby", accuracy: "99.1%", icon: <Layout className="w-5 h-5 text-emerald-400" /> },
        { name: "Mixtral 8x7B", type: "MoE Routing Engine", status: "Active Matrix", accuracy: "95.5%", icon: <Activity className="w-5 h-5 text-amber-400" /> },
        { name: "Qwen 2.5", type: "Multimodal Analysis", status: "Standby", accuracy: "97.9%", icon: <Shield className="w-5 h-5 text-pink-400" /> }
    ];

    const activeBots = [
        { name: "CodeGenerator-X", role: "Auto-Programming", tasks: 1432, health: "100%", latency: "12ms" },
        { name: "Auto-Deployer", role: "CI/CD & Android Build", tasks: 890, health: "100%", latency: "8ms" },
        { name: "Security-Sentinel", role: "Vulnerability Scanner", tasks: 5410, health: "100%", latency: "4ms" },
        { name: "UI-UX-Crafter", role: "Interface Generator", tasks: 320, health: "100%", latency: "15ms" },
        { name: "Android-Automator", role: "APK Full Automation", tasks: 9942, health: "100%", latency: "6ms" },
        { name: "OS-Optimizer", role: "Open Source Aggregator", tasks: 210, health: "100%", latency: "9ms" }
    ];

        const [isDeploying, setIsDeploying] = useState(false);

    return (
        <div className="h-full bg-black text-white font-sans overflow-y-auto">
            <div className="p-8 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#0a0a0a] p-8 rounded-3xl border border-white/5 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>
                    
                    <div className="relative z-10 flex items-start gap-6">
                        <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                            <Bot className="w-10 h-10 text-indigo-400 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">Android Engine Level 5</span>
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">Fully Operational</span>
                            </div>
                            <h1 className="text-3xl font-black italic uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-cyan-400 drop-shadow-lg">
                                Ultimate AI App Builder Hub
                            </h1>
                            <p className="text-xs text-gray-400 mt-2 font-mono uppercase tracking-[0.2em]">World's Latest Open Source AI Models & Agents</p>
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-col items-end gap-2">
                        <div className="flex items-center gap-3 bg-black/60 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md">
                            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">Real-Time Core: Active</span>
                        </div>
                        <button 
                            onClick={() => {
                                setIsDeploying(true);
                                setTimeout(() => setIsDeploying(false), 3000);
                            }}
                            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all active:scale-95 border border-indigo-400/50 min-w-[160px] text-center"
                        >
                            {isDeploying ? 'Compiling APK...' : 'Deploy App Now'}
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-4 border-b border-white/10 pb-4 overflow-x-auto custom-scrollbar">
                    {[
                        { id: 'models', label: 'Open Source Models', icon: <Cpu className="w-4 h-4" /> },
                        { id: 'agents', label: 'Agentic Swarm', icon: <Bot className="w-4 h-4" /> },
                        { id: 'tools', label: 'Build Tools', icon: <Terminal className="w-4 h-4" /> },
                        { id: 'config', label: 'System Configuration', icon: <Settings className="w-4 h-4" /> }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all whitespace-nowrap ${
                                activeTab === tab.id 
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'models' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {openSourceModels.map((model, idx) => (
                                    <div key={idx} className="bg-[#0f0f0f] p-6 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-cyan-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 bg-black rounded-xl border border-white/10 shadow-lg group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-shadow">
                                                        {model.icon}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">{model.name}</h3>
                                                        <p className="text-[10px] text-gray-500 font-mono tracking-widest">{model.type}</p>
                                                    </div>
                                                </div>
                                                <div className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[8px] font-mono tracking-widest uppercase flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                                    {model.status}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-black/50 rounded-xl border border-white/5">
                                                <div>
                                                    <div className="text-[8px] text-gray-500 uppercase tracking-widest mb-1 font-mono">Inference Accuracy</div>
                                                    <div className="text-sm font-black text-white">{model.accuracy}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[8px] text-gray-500 uppercase tracking-widest mb-1 font-mono">Response Time</div>
                                                    <div className="text-sm font-black text-cyan-400">~120ms</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'agents' && (
                            <div className="space-y-6">
                                <div className="p-6 bg-gradient-to-r from-indigo-900/40 to-cyan-900/40 border border-indigo-500/30 rounded-2xl flex items-center justify-between shadow-[0_0_30px_rgba(99,102,241,0.15)] relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                                    <div className="relative z-10 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center border-2 border-dashed border-indigo-400/50 animate-[spin_10s_linear_infinite]">
                                            <Command className="w-5 h-5 text-indigo-300 animate-[spin_10s_linear_infinite_reverse]" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-white">Full Autonomous Swarm Active</h3>
                                            <p className="text-[10px] text-indigo-200 mt-1 font-mono">All agents operating with real-time sync and self-healing protocols.</p>
                                        </div>
                                    </div>
                                    <button className="relative z-10 px-5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/50 rounded-lg text-[9px] uppercase tracking-widest font-bold transition-all">
                                        Configure Swarm
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {activeBots.map((bot, idx) => (
                                        <div key={idx} className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl flex flex-col justify-between hover:border-cyan-500/30 transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-white/5 rounded-lg border border-white/10">
                                                        <Zap className="w-4 h-4 text-cyan-400" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-white uppercase tracking-wider">{bot.name}</div>
                                                        <div className="text-[9px] text-gray-500 font-mono tracking-widest">{bot.role}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[8px] text-gray-500 uppercase tracking-widest font-mono">Tasks Completed</div>
                                                    <div className="text-xs font-black text-white">{bot.tasks.toLocaleString()}</div>
                                                </div>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden mb-2">
                                                <div className="h-full bg-cyan-500 w-full shadow-[0_0_10px_#06b6d4]"></div>
                                            </div>
                                            <div className="flex justify-between items-center text-[8px] font-mono text-gray-400">
                                                <span>Health: <strong className="text-emerald-400">{bot.health}</strong></span>
                                                <span>Latency: <strong className="text-cyan-400">{bot.latency}</strong></span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'tools' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { title: "Android APK Compiler", desc: "Instantly compiles source down to native Android APKs using cloud workers.", icon: <Code className="w-6 h-6 text-emerald-400" /> },
                                    { title: "Full Automations Engine", desc: "End-to-end CI/CD automations for build, test, structure, and deploy loops.", icon: <Zap className="w-6 h-6 text-yellow-400" /> },
                                    { title: "Open Source Fetcher", desc: "Aggregates whole open source modules scaling app functionality exponentially.", icon: <Sparkles className="w-6 h-6 text-cyan-400" /> },
                                    { title: "Real-Time DB Sync", desc: "Bi-directional data sync with Supabase & Firebase simultaneously.", icon: <Activity className="w-6 h-6 text-fuchsia-400" /> },
                                    { title: "UI Components Engine", desc: "Generates Shadcn, Tailwind, and React Motion components on the fly.", icon: <Layout className="w-6 h-6 text-blue-400" /> },
                                    { title: "Zero-Trust SecOps", desc: "Automated penetration testing and vulnerability patching.", icon: <Shield className="w-6 h-6 text-amber-400" /> },
                                    { title: "Live Preview Sandbox", desc: "Test the application directly in a simulated Android environment.", icon: <Command className="w-6 h-6 text-indigo-400" /> },
                                    { title: "Multi-Language NLP", desc: "Instantly translates app UI into 140+ languages via AI.", icon: <MessageCircle className="w-6 h-6 text-pink-400" /> },
                                ].map((tool, idx) => (
                                    <div key={idx} className="bg-[#0A0A0B] p-6 rounded-2xl border border-white/5 hover:bg-[#111113] hover:border-white/10 transition-all flex flex-col items-center text-center group cursor-pointer">
                                        <div className="w-14 h-14 bg-black rounded-full border border-white/10 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all">
                                            {tool.icon}
                                        </div>
                                        <h3 className="text-[11px] font-black text-white uppercase tracking-wider mb-2">{tool.title}</h3>
                                        <p className="text-[9px] text-gray-500 font-mono tracking-wide leading-relaxed">{tool.desc}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'config' && (
                            <div className="bg-[#050505] border border-white/10 rounded-2xl p-8">
                                <h2 className="text-sm font-black uppercase tracking-widest text-white mb-8 flex items-center gap-3">
                                    <Settings className="w-5 h-5 text-gray-400" /> Advanced System Configuration
                                </h2>
                                
                                <div className="space-y-6">
                                    {[
                                        { label: "Real-Time Event Bus Protocol", val: "WebSocket (WSS) + MQTT Fallback", color: "text-emerald-400" },
                                        { label: "Hardware Acceleration", val: "Enabled (WebGPU / Vulkan)", color: "text-cyan-400" },
                                        { label: "AI Inference Locale", val: "Edge + Cloud Distributed", color: "text-indigo-400" },
                                        { label: "Max Agent Threads", val: "256 Concurrent Pipelines", color: "text-fuchsia-400" },
                                        { label: "Auto-Healing Mechanism", val: "Active (Interval: 5000ms)", color: "text-amber-400" }
                                    ].map((cfg, idx) => (
                                        <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-white/5 last:border-0 last:pb-0">
                                            <div>
                                                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{cfg.label}</div>
                                            </div>
                                            <div className="mt-2 md:mt-0 flex items-center gap-4">
                                                <div className={`text-xs font-bold font-mono ${cfg.color}`}>{cfg.val}</div>
                                                <div className="w-10 h-5 bg-white/10 rounded-full relative cursor-pointer border border-white/20">
                                                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
