import React from 'react';
import { motion } from 'motion/react';
import { 
    FileCode2, Server, Database, BrainCircuit, ShieldAlert, 
    Rocket, Cpu, Network, Layers, Terminal, CheckCircle2, 
    GitBranch, Lock, Activity
} from 'lucide-react';

export const ProjectHandover: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in h-full flex flex-col">
            {/* Header */}
            <div className="bg-black border border-indigo-500/30 rounded-[2rem] p-8 relative overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.15)] shrink-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/50 rounded-full flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Final Blueprint</span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">v32.0_Singularity</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                            Project <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Handover</span>
                        </h1>
                        <p className="text-sm text-zinc-400 font-mono mt-2 max-w-2xl">
                            Technical specifications, architecture guidelines, and sprint planning for the development team. This document serves as the absolute source of truth for "The Singularity".
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center gap-2">
                            <FileCode2 className="w-4 h-4" />
                            Export to GitHub
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2">
                
                {/* Left Column: Tech Stack & Architecture */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* The Global Stack */}
                    <div className="bg-[#050505] border border-white/10 rounded-[2rem] p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400"><Layers className="w-6 h-6" /></div>
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-widest">The Global Stack</h3>
                                <p className="text-[10px] font-mono text-cyan-400/70 uppercase">Approved Technologies</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest mb-3">
                                    <Terminal className="w-4 h-4 text-zinc-400" /> Frontend (Client)
                                </h4>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-sm text-zinc-400"><CheckCircle2 className="w-3 h-3 text-cyan-500" /> React 18 + TypeScript</li>
                                    <li className="flex items-center gap-2 text-sm text-zinc-400"><CheckCircle2 className="w-3 h-3 text-cyan-500" /> Tailwind CSS (Styling)</li>
                                    <li className="flex items-center gap-2 text-sm text-zinc-400"><CheckCircle2 className="w-3 h-3 text-cyan-500" /> Framer Motion (Animations)</li>
                                    <li className="flex items-center gap-2 text-sm text-zinc-400"><CheckCircle2 className="w-3 h-3 text-cyan-500" /> Recharts (Data Viz)</li>
                                </ul>
                            </div>
                            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest mb-3">
                                    <Server className="w-4 h-4 text-zinc-400" /> Backend & DB
                                </h4>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-sm text-zinc-400"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Node.js / Express</li>
                                    <li className="flex items-center gap-2 text-sm text-zinc-400"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> PostgreSQL (Supabase)</li>
                                    <li className="flex items-center gap-2 text-sm text-zinc-400"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Redis (Caching)</li>
                                    <li className="flex items-center gap-2 text-sm text-zinc-400"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> WebSockets (Real-time)</li>
                                </ul>
                            </div>
                            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest mb-3">
                                    <BrainCircuit className="w-4 h-4 text-zinc-400" /> AI & Machine Learning
                                </h4>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-sm text-zinc-400"><CheckCircle2 className="w-3 h-3 text-fuchsia-500" /> Google Gemini Pro (LLM)</li>
                                    <li className="flex items-center gap-2 text-sm text-zinc-400"><CheckCircle2 className="w-3 h-3 text-fuchsia-500" /> MediaPipe (Pose Tracking)</li>
                                    <li className="flex items-center gap-2 text-sm text-zinc-400"><CheckCircle2 className="w-3 h-3 text-fuchsia-500" /> TensorFlow Lite (Edge AI)</li>
                                    <li className="flex items-center gap-2 text-sm text-zinc-400"><CheckCircle2 className="w-3 h-3 text-fuchsia-500" /> Med-PaLM 3 (Medical)</li>
                                </ul>
                            </div>
                            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest mb-3">
                                    <Lock className="w-4 h-4 text-zinc-400" /> Security & Infra
                                </h4>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-sm text-zinc-400"><CheckCircle2 className="w-3 h-3 text-amber-500" /> CRYSTALS-Kyber (Quantum-Safe)</li>
                                    <li className="flex items-center gap-2 text-sm text-zinc-400"><CheckCircle2 className="w-3 h-3 text-amber-500" /> Docker & Kubernetes</li>
                                    <li className="flex items-center gap-2 text-sm text-zinc-400"><CheckCircle2 className="w-3 h-3 text-amber-500" /> Cloudflare (DDoS Protection)</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Core Neural Sync Logic */}
                    <div className="bg-[#050505] border border-white/10 rounded-[2rem] p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400"><FileCode2 className="w-6 h-6" /></div>
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-widest">Core Neural Sync Logic</h3>
                                <p className="text-[10px] font-mono text-indigo-400/70 uppercase">System Initialization Protocol</p>
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a] rounded-xl border border-white/5 p-4 overflow-x-auto">
                            <pre className="text-xs font-mono text-zinc-300">
<span className="text-pink-400">class</span> <span className="text-emerald-400">RoyalSingularity</span> {'{'}
  <span className="text-pink-400">static final String</span> admin = <span className="text-amber-300">"Mahesh Saini"</span>;
  <span className="text-pink-400">static final String</span> location = <span className="text-amber-300">"Jhunjhunu, Rajasthan"</span>;
  
  <span className="text-pink-400">void</span> <span className="text-blue-400">executeAutoPilot</span>() {'{'}
    TitanVision.<span className="text-blue-400">startScanning</span>();      <span className="text-zinc-500">// विज़न सक्रिय (Vision Active)</span>
    KitchenChief.<span className="text-blue-400">syncMetabolism</span>();    <span className="text-zinc-500">// डाइट सक्रिय (Diet Active)</span>
    RoyalNexus.<span className="text-blue-400">automateBusiness</span>();    <span className="text-zinc-500">// मैनेजमेंट सक्रिय (Management Active)</span>
    SovereignOverride.<span className="text-blue-400">arm</span>();          <span className="text-zinc-500">// सुरक्षा कवच सक्रिय (Security Armed)</span>
  {'}'}
{'}'}
                            </pre>
                        </div>
                    </div>

                    {/* Advanced Features Specs */}
                    <div className="bg-[#050505] border border-white/10 rounded-[2rem] p-6 relative overflow-hidden group hover:border-fuchsia-500/30 transition-colors">
                         <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-fuchsia-500/10 rounded-xl text-fuchsia-400"><Activity className="w-6 h-6" /></div>
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-widest">Advanced Algorithms</h3>
                                <p className="text-[10px] font-mono text-fuchsia-400/70 uppercase">Mathematical Models</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                                <h4 className="text-sm font-bold text-white mb-2">1. Frame-Skipping Algorithm (Titan Vision)</h4>
                                <p className="text-xs text-zinc-400 mb-2">Optimizes mobile device performance by reducing processing load while maintaining accuracy.</p>
                                <code className="text-[10px] text-fuchsia-300 bg-fuchsia-900/20 px-2 py-1 rounded">Input: 30 FPS -{'>'} Processing: 10 FPS (Keyframe interpolation)</code>
                            </div>
                            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                                <h4 className="text-sm font-bold text-white mb-2">2. rPPG (Ghost Pulse)</h4>
                                <p className="text-xs text-zinc-400 mb-2">Remote Photoplethysmography extracts heart rate from subtle color changes in facial pixels using the smartphone camera.</p>
                            </div>
                            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                                <h4 className="text-sm font-bold text-white mb-2">3. Joint Torque Calculation</h4>
                                <p className="text-xs text-zinc-400 mb-2">Real-time injury prevention physics engine.</p>
                                <div className="text-center py-2 bg-black rounded-lg border border-white/5 mt-2">
                                    <code className="text-xs text-cyan-400 font-mono">τ = r × F (Torque = Radius vector × Force vector)</code>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: Sprint Planning & Security */}
                <div className="space-y-6">
                    
                    {/* Sprint 1 Plan */}
                    <div className="bg-[#050505] border border-white/10 rounded-[2rem] p-6 relative overflow-hidden group hover:border-orange-500/30 transition-colors">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400"><GitBranch className="w-6 h-6" /></div>
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-widest">Sprint 1: Genesis</h3>
                                <p className="text-[10px] font-mono text-orange-400/70 uppercase">Month 1-2 Roadmap</p>
                            </div>
                        </div>

                        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#050505] bg-orange-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                    <span className="text-xs font-bold">1</span>
                                </div>
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-zinc-900/80 p-4 rounded-xl border border-orange-500/30 shadow">
                                    <h4 className="text-xs font-bold text-white uppercase mb-1">Titan Vision Core</h4>
                                    <p className="text-[10px] text-zinc-400">Implement MediaPipe pose detection and basic rep counting logic.</p>
                                </div>
                            </div>
                            
                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#050505] bg-zinc-800 text-zinc-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                    <span className="text-xs font-bold">2</span>
                                </div>
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-zinc-900/50 p-4 rounded-xl border border-white/5 shadow">
                                    <h4 className="text-xs font-bold text-white uppercase mb-1">Basic Management</h4>
                                    <p className="text-[10px] text-zinc-400">Member onboarding, attendance tracking, and initial dashboard setup.</p>
                                </div>
                            </div>

                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#050505] bg-zinc-800 text-zinc-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                    <span className="text-xs font-bold">3</span>
                                </div>
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-zinc-900/50 p-4 rounded-xl border border-white/5 shadow">
                                    <h4 className="text-xs font-bold text-white uppercase mb-1">Nexus Integration</h4>
                                    <p className="text-[10px] text-zinc-400">Connect WhatsApp Cloud API for basic notifications.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Protocols */}
                    <div className="bg-[#050505] border border-red-500/20 rounded-[2rem] p-6 relative overflow-hidden group hover:border-red-500/50 transition-colors">
                        <div className="absolute top-0 right-0 p-6 opacity-5"><ShieldAlert className="w-32 h-32 text-red-500" /></div>
                        
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="p-3 bg-red-500/10 rounded-xl text-red-400"><ShieldAlert className="w-6 h-6" /></div>
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-widest">Sovereign Override</h3>
                                <p className="text-[10px] font-mono text-red-400/70 uppercase">Master Kill-Switch Protocol</p>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                                <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> Vocal Frequency Lock
                                </h4>
                                <p className="text-xs text-zinc-300">Biometric voice recognition tied exclusively to "Mahesh Saini". Initiates immediate system-wide lockdown and data encryption upon command.</p>
                            </div>
                            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Lock className="w-4 h-4" /> Quantum-Resistant Encryption
                                </h4>
                                <p className="text-xs text-zinc-400">All member health data and financial records are encrypted using CRYSTALS-Kyber, securing them against future quantum computer attacks.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
