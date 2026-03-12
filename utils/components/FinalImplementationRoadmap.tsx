import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
    Terminal, Cpu, Eye, Utensils, Stethoscope, Rocket, 
    ShieldCheck, Database, Server, CheckCircle2, Circle, 
    Activity, Code, Lock
} from 'lucide-react';

export const FinalImplementationRoadmap: React.FC = () => {
    const [activePhase, setActivePhase] = useState<number>(0);

    const phases = [
        {
            title: "Phase 1: Core Infrastructure & Security",
            icon: <Server className="w-6 h-6 text-indigo-400" />,
            status: "completed",
            tasks: [
                { name: "Setup React/Vite + Tailwind CSS Architecture", done: true },
                { name: "Implement Role-Based Access Control (Admin/Member)", done: true },
                { name: "Quantum Encryption (Simulated) & HIPAA/GDPR Data Models", done: true },
                { name: "Global State Management (Data Provider)", done: true }
            ]
        },
        {
            title: "Phase 2: The 4 Pillars of Singularity",
            icon: <Cpu className="w-6 h-6 text-cyan-400" />,
            status: "in-progress",
            tasks: [
                { name: "Titan Vision: Pose Estimation & Rep Counting UI", done: true },
                { name: "AI Kitchen Chief: Nutrigenomic Diet Generator", done: true },
                { name: "Ghost Pulse & IoT: Universal Gadget Sync Dashboard", done: true },
                { name: "Bio-Aether Oracle: AI Doctor Voice/Chat Interface", done: true },
                { name: "Digital Bio-Health Pass Generation", done: true }
            ]
        },
        {
            title: "Phase 3: Backend & AI Model Integration",
            icon: <Database className="w-6 h-6 text-amber-400" />,
            status: "pending",
            tasks: [
                { name: "Connect Gemini 3.1 Pro API for all AI Agents", done: true },
                { name: "Setup Vector Database (Pinecone/Weaviate) for RAG", done: false },
                { name: "Integrate Real WebSockets for Live Gadget Data", done: false },
                { name: "Deploy Edge Functions for Zero-Latency Processing", done: false }
            ]
        },
        {
            title: "Phase 4: Hardware & Real-World Deployment",
            icon: <Rocket className="w-6 h-6 text-emerald-400" />,
            status: "pending",
            tasks: [
                { name: "Procure & Test EMG Fabrics & CGM Patches", done: false },
                { name: "Install 3D Depth Cameras in Gym Premises", done: false },
                { name: "Beta Testing with 50 Elite Members", done: false },
                { name: "Official Launch of 'Royal The Gym: The Singularity'", done: false }
            ]
        }
    ];

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-zinc-900 to-black p-8 rounded-[2rem] border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Terminal className="w-5 h-5 text-indigo-400" />
                            <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">Developer Command Center</span>
                        </div>
                        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Final Implementation Roadmap</h1>
                        <p className="text-zinc-400 mt-2 text-sm max-w-2xl">
                            The master checklist to bring "The Singularity" from a digital prototype to a real-world, hardware-integrated AI Super-Gym.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 bg-black/50 p-4 rounded-xl border border-white/5">
                        <div className="text-right">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Project Status</p>
                            <p className="text-lg font-black text-emerald-400">Prototype Ready</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                            <Rocket className="w-6 h-6 text-emerald-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Architecture Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 text-center hover:border-indigo-500/30 transition-colors">
                    <Eye className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Titan Vision</h3>
                    <p className="text-xs text-zinc-500">Computer Vision & Pose AI</p>
                </div>
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 text-center hover:border-emerald-500/30 transition-colors">
                    <Utensils className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Kitchen Chief</h3>
                    <p className="text-xs text-zinc-500">Nutrigenomic Diet AI</p>
                </div>
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 text-center hover:border-cyan-500/30 transition-colors">
                    <Activity className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Ghost Pulse</h3>
                    <p className="text-xs text-zinc-500">IoT & Wearable Sync</p>
                </div>
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 text-center hover:border-amber-500/30 transition-colors">
                    <Stethoscope className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Bio-Oracle</h3>
                    <p className="text-xs text-zinc-500">Med-PaLM 3 AI Doctor</p>
                </div>
            </div>

            {/* Roadmap Timeline */}
            <div className="bg-black rounded-[2rem] border border-white/10 p-8">
                <h2 className="text-xl font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                    <Code className="w-6 h-6 text-indigo-500" />
                    Deployment Checklist
                </h2>

                <div className="space-y-6">
                    {phases.map((phase, idx) => (
                        <div 
                            key={idx} 
                            className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                                activePhase === idx 
                                ? 'bg-zinc-900/80 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.1)]' 
                                : 'bg-zinc-900/30 border-white/5 hover:bg-zinc-900/50'
                            }`}
                            onClick={() => setActivePhase(idx)}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-black border border-white/10`}>
                                        {phase.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white uppercase tracking-widest">{phase.title}</h3>
                                        <p className="text-xs font-mono text-zinc-500 uppercase mt-1">
                                            Status: <span className={
                                                phase.status === 'completed' ? 'text-emerald-400' : 
                                                phase.status === 'in-progress' ? 'text-amber-400' : 'text-zinc-400'
                                            }>{phase.status}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <motion.div 
                                initial={false}
                                animate={{ height: activePhase === idx ? 'auto' : 0, opacity: activePhase === idx ? 1 : 0 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-4 border-t border-white/10 space-y-3">
                                    {phase.tasks.map((task, tIdx) => (
                                        <div key={tIdx} className="flex items-start gap-3 p-3 rounded-xl bg-black/50 border border-white/5">
                                            {task.done ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                            ) : (
                                                <Circle className="w-5 h-5 text-zinc-600 shrink-0" />
                                            )}
                                            <span className={`text-sm ${task.done ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                                {task.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Security Notice */}
            <div className="bg-red-950/20 border border-red-500/20 p-6 rounded-2xl flex items-start gap-4">
                <Lock className="w-6 h-6 text-red-400 shrink-0" />
                <div>
                    <h4 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-1">Critical Compliance Notice</h4>
                    <p className="text-xs text-red-200/70 leading-relaxed">
                        Before connecting real medical data (Blood Reports, DNA) to the Gemini API, ensure a BAA (Business Associate Agreement) is signed for HIPAA compliance, and all PII (Personally Identifiable Information) is stripped or encrypted at the edge layer.
                    </p>
                </div>
            </div>
        </div>
    );
};
