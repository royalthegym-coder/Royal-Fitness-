
import React, { useState, useMemo, useRef, useEffect } from 'react';
import Card from '../common/Card';
import { useData } from '../../context/DataProvider';
import { 
    Stethoscope, Activity, FileText, CheckCircle, 
    XCircle, Clock, Search, BrainCircuit, RefreshCw,
    ShieldCheck, Zap, AlertTriangle, User, Send,
    Fingerprint, Dna, Scan, Microscope, Globe,
    Plus, TestTube, Cross, Pill, Beaker, Mic, MicOff, Volume2,
    Cpu, Network, Layers, Sparkles, ChevronRight, Share2,
    Binary, MessageSquare, Eye, Heart, Thermometer, Wind, X, Camera
} from 'lucide-react';
import { BotIcon } from '../icons/BotIcon';
import { useToast } from '../../hooks/useToast';
import { MedicalConsultation } from '../../../types';
import Modal from '../common/Modal';
import { runAIDoctorCouncil, processMedicalReport, AIDoctorAnalysis } from '../../../lib/aiDoctor';
import { generateTextToSpeech } from '../../../lib/gemini';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { toBase64, decode, decodeAudioData } from '../../../lib/utils';

const CrownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-3-4 3-6-7z"/></svg>;

// --- MOCK AGENTS (The Open Source Council) ---
const AI_AGENTS = [
    { id: 'Llama-3-Med', role: 'Generalist', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: <Globe className="w-3 h-3"/> },
    { id: 'Bio-Mistral', role: 'Physiology', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: <Dna className="w-3 h-3"/> },
    { id: 'DeepSeek-V3', role: 'Pathology', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: <Binary className="w-3 h-3"/> },
    { id: 'Royal-Core', role: 'Supervisor', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: <CrownIcon /> }
];

// --- BODY MAP COMPONENT ---
const BodyMap: React.FC<{ onSelect: (part: string) => void, selected: string }> = ({ onSelect, selected }) => {
    return (
        <div className="relative h-[400px] w-full flex items-center justify-center bg-[#050505] rounded-[2rem] border border-cyan-500/20 overflow-hidden group shadow-inner">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
            <div className="absolute top-0 w-full h-1 bg-cyan-500/50 blur-md animate-scan opacity-50 z-10"></div>
            
            {/* SVG Body Outline */}
            <svg viewBox="0 0 200 400" className="h-[90%] w-auto drop-shadow-[0_0_15px_rgba(6,182,212,0.4)] z-20">
                <path d="M100,20 Q130,20 130,50 Q130,80 100,80 Q70,80 70,50 Q70,20 100,20" fill="none" stroke="#06b6d4" strokeWidth="2" /> 
                <path d="M70,80 L40,110 L40,200 L50,300 L60,400" fill="none" stroke="#06b6d4" strokeWidth="2" />
                <path d="M130,80 L160,110 L160,200 L150,300 L140,400" fill="none" stroke="#06b6d4" strokeWidth="2" />
                <path d="M100,80 L100,200" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 4" />
                
                {/* Interactive Nodes */}
                {[
                    { id: 'Head', cx: 100, cy: 50 },
                    { id: 'Chest', cx: 100, cy: 100 },
                    { id: 'Back', cx: 100, cy: 140 },
                    { id: 'Shoulders', cx: 140, cy: 90 },
                    { id: 'Knees', cx: 130, cy: 300 },
                ].map(node => (
                    <circle 
                        key={node.id}
                        cx={node.cx} cy={node.cy} r="8"
                        fill={selected === node.id ? '#ef4444' : '#06b6d4'}
                        className="cursor-pointer hover:r-10 transition-all duration-300 animate-pulse"
                        onClick={() => onSelect(node.id)}
                    />
                ))}
            </svg>
            
            <div className="absolute bottom-4 left-0 right-0 text-center">
                 <p className="text-[10px] text-cyan-500 font-mono uppercase tracking-[0.3em] animate-pulse">
                     {selected ? `SCANNING: ${selected.toUpperCase()}` : 'SELECT BIO-ZONE'}
                 </p>
            </div>
        </div>
    );
};

const MedicalHub: React.FC<{ memberId: number }> = ({ memberId }) => {
    const { members, medicalConsultations, addMedicalConsultation, liveHealthData } = useData();
    const { addToast } = useToast();
    const member = members.find(m => m.id === memberId);
    
    // UI State
    const [isConsultOpen, setIsConsultOpen] = useState(false);
    const [symptoms, setSymptoms] = useState('');
    const [selectedPart, setSelectedBodyPart] = useState('General');
    const [isListening, setIsListening] = useState(false);
    const [ecgData, setEcgData] = useState<{time: number, val: number}[]>([]);
    
    // AI Council State
    const [councilLogs, setCouncilLogs] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [diagnosis, setDiagnosis] = useState<AIDoctorAnalysis | null>(null);
    const [activeAgent, setActiveAgent] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<{name: string, data: string, type: string}[]>([]);

    // Audio Ref
    const recognitionRef = useRef<any>(null);

    // --- 1. LIVE ECG SIMULATION ---
    useEffect(() => {
        const interval = setInterval(() => {
            setEcgData(prev => {
                const now = Date.now();
                const beat = Math.random() > 0.9 ? 100 : 40 + Math.random() * 10;
                return [...prev.slice(-30), { time: now, val: beat }];
            });
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // --- 2. VOICE INPUT ---
    const toggleVoice = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            if (!('webkitSpeechRecognition' in window)) return addToast("Voice API unavailable.", "error");
            
            const recognition = new (window as any).webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            
            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onresult = (e: any) => {
                const transcript = e.results[0][0].transcript;
                setSymptoms(prev => prev ? `${prev} ${transcript}` : transcript);
            };
            
            recognitionRef.current = recognition;
            recognition.start();
        }
    };

    // --- 3. THE COUNCIL LOGIC ---
    const runCouncilSession = async () => {
        if (!symptoms && attachedFiles.length === 0) return;
        setIsAnalyzing(true);
        setCouncilLogs([]);
        setDiagnosis(null);

        const sequence = [
            { agent: 'Llama-3-Med', action: 'Parsing Symptom Vector & Reports...', delay: 800 },
            { agent: 'Bio-Mistral', action: 'Cross-referencing Anatomy DB...', delay: 1200 },
            { agent: 'DeepSeek-V3', action: 'Checking Pathology Markers...', delay: 1000 },
            { agent: 'Grok-Med', action: 'Real-time Insights Sync...', delay: 1000 },
            { agent: 'Royal-Core', action: 'Synthesizing Final Verdict...', delay: 1000 }
        ];

        for (const step of sequence) {
            setActiveAgent(step.agent);
            await new Promise(r => setTimeout(r, step.delay));
            setCouncilLogs(prev => [...prev, `[${step.agent}] ${step.action}`]);
        }

        try {
            const filesForAI = attachedFiles.map(f => ({ data: f.data, mimeType: f.type }));
            
            // Use the new comprehensive function
            const { analyzeComprehensiveHealth } = await import('../../../lib/aiDoctor');
            const analysis = await analyzeComprehensiveHealth(symptoms, filesForAI, {
                ...member,
                heartRate: liveHealthData.heartRate.avg
            });
            
            setDiagnosis(analysis);
            setCouncilLogs(prev => [...prev, `[System] GitHub Sync: ${analysis.github_sync_status}`, `[System] n8n Workflow: ${analysis.n8n_workflow_id}`]);
            
            // Speak result
            const audio = await generateTextToSpeech(`Diagnosis complete. ${analysis.diagnosis}. Severity: ${analysis.severity}.`);
            if(audio) { 
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const buffer = await decodeAudioData(ctx, decode(audio));
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start();
            }
        } catch (e) {
            setDiagnosis({ diagnosis: "Neural Fatigue Analysis", severity: "Low", treatment: "Rest & Hydrate", recovery_days: 1, agents_involved: ["Royal-Core"], github_sync_status: "Failed", n8n_workflow_id: "N/A" });
        } finally {
            setIsAnalyzing(false);
            setActiveAgent(null);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        if (files.length === 0) return;
        
        setIsUploading(true);
        setIsConsultOpen(true);
        
        try {
            const newFiles: {name: string, data: string, type: string}[] = [];
            const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit to prevent crashes

            for (const file of files) {
                if (file.size > MAX_SIZE) {
                    addToast(`Skipped ${file.name}: File too large (>10MB)`, "error");
                    continue;
                }

                const reader = new FileReader();
                await new Promise<void>((resolve, reject) => {
                    reader.onload = () => {
                        const res = reader.result?.toString();
                        if (res) {
                            const base64 = res.split(',')[1];
                            if (base64) {
                                newFiles.push({ name: file.name, data: base64, type: file.type });
                            }
                        }
                        resolve();
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }
            
            if (newFiles.length > 0) {
                setAttachedFiles(prev => [...prev, ...newFiles]);
                addToast(`${newFiles.length} report(s) attached.`, "success");
            }
            
            // Reset input so same file can be selected again if needed
            if (e.target) e.target.value = '';
        } catch (error) {
            console.error(error);
            addToast("Failed to read files. Please try again.", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const removeFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveRecord = () => {
        if (!diagnosis) return;
        addMedicalConsultation({
            id: `DOC-${Date.now()}`,
            memberId: memberId,
            memberName: member?.name || 'User',
            symptoms: symptoms + (attachedFiles.length > 0 ? ` [Attached ${attachedFiles.length} reports]` : ''),
            duration: '1 day',
            severity: diagnosis.severity,
            historyContext: '',
            aiDiagnosis: JSON.stringify(diagnosis),
            aiPrescription: diagnosis.treatment,
            status: 'Pending Analysis',
            timestamp: new Date().toISOString()
        });
        setIsConsultOpen(false);
        setSymptoms('');
        setAttachedFiles([]);
        addToast("Medical Record Encrypted & Stored.", "success");
    };

    return (
        <div className="space-y-8 animate-fade-in pb-32">
            
            {/* HEADER */}
            <div className="bg-[#020308] p-10 rounded-[3.5rem] border border-cyan-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-15"></div>
                <div className="absolute -right-20 -top-20 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-cyan-600 text-black rounded-[3rem] shadow-[0_0_60px_rgba(6,182,212,0.4)] border border-cyan-400 group-hover:rotate-12 transition-transform duration-700">
                             <Stethoscope className="w-16 h-16 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Network className="w-3 h-3" /> Multi-Agent Swarm
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">SYSTEM: ONLINE</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Aether <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Med</span>
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT: BODY SCANNER & VITALS */}
                <div className="lg:col-span-4 space-y-6">
                    <Card title="Bio-Telemetry" className="bg-black border-white/5 p-6 rounded-[3rem] h-[400px] flex flex-col relative overflow-hidden shadow-2xl">
                         {/* Live ECG */}
                         <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                         
                         <div className="relative z-10 flex-1 flex flex-col justify-end pb-8 pl-4">
                             <div className="flex items-baseline gap-2 mb-2">
                                 <span className="text-7xl font-black text-green-500 italic tracking-tighter">{liveHealthData.heartRate.avg}</span>
                                 <span className="text-xs font-bold text-gray-500 uppercase">BPM</span>
                             </div>
                             <div className="h-24 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={ecgData}>
                                        <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                        <Area type="monotone" dataKey="val" stroke="#22c55e" strokeWidth={2} fill="none" isAnimationActive={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                             </div>
                         </div>
                    </Card>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => setIsConsultOpen(true)}
                            className="flex-1 bg-white text-black font-black py-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:bg-cyan-400 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 active:scale-95"
                        >
                            <BotIcon className="w-5 h-5"/> Initiate Diagnosis
                        </button>
                        <label className="flex-1 bg-gray-900 border border-white/10 text-white font-black py-6 rounded-[2.5rem] hover:border-cyan-500/50 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 active:scale-95 cursor-pointer">
                            <FileText className="w-5 h-5"/>
                            {isUploading ? 'Analyzing...' : 'Upload Report'}
                            <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx" disabled={isUploading} />
                        </label>
                    </div>
                </div>

                {/* RIGHT: MEDICAL HISTORY & AI INSIGHTS */}
                <div className="lg:col-span-8 space-y-6">
                     <Card title="Medical Ledger" className="bg-gray-950 border-white/5 p-8 rounded-[3rem] min-h-[500px]">
                         {medicalConsultations.length === 0 ? (
                             <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-40">
                                 <FileText className="w-20 h-20 mb-4"/>
                                 <p className="text-xs font-black uppercase tracking-widest">No Medical Records Found</p>
                             </div>
                         ) : (
                             <div className="space-y-4">
                                 {medicalConsultations.map(c => (
                                     <div key={c.id} className="bg-black/40 p-6 rounded-[2rem] border border-white/5 flex justify-between items-center group hover:border-cyan-500/30 transition-all">
                                         <div>
                                             <div className="flex items-center gap-3 mb-1">
                                                 <span className={`w-2 h-2 rounded-full ${c.severity === 'Critical' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                                                 <h4 className="font-bold text-white text-sm">{c.symptoms.substring(0, 40)}...</h4>
                                             </div>
                                             <p className="text-[10px] text-gray-500 font-mono">{new Date(c.timestamp).toLocaleDateString()}</p>
                                         </div>
                                         <div className="text-right">
                                              <span className="text-[9px] font-black uppercase bg-white/5 px-3 py-1 rounded-full border border-white/10">{c.status}</span>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}
                     </Card>
                </div>
            </div>

            {/* DIAGNOSTIC MODAL */}
            <Modal isOpen={isConsultOpen} onClose={() => setIsConsultOpen(false)} title="Neural Council Uplink">
                 <div className="space-y-6">
                     <div className="flex gap-6">
                         {/* LEFT: Body & Input */}
                         <div className="w-1/3">
                             <BodyMap onSelect={setSelectedBodyPart} selected={selectedPart} />
                         </div>
                         <div className="w-2/3 flex flex-col gap-4">
                             <div className="flex-1 bg-black rounded-3xl border border-white/10 p-4 relative overflow-hidden">
                                 {diagnosis ? (
                                     <div className="space-y-4 animate-scale-in">
                                         <div className="flex items-center gap-3 text-green-400 mb-2">
                                             <CheckCircle className="w-6 h-6"/>
                                             <h3 className="font-black uppercase text-lg italic">Verdict Reached</h3>
                                         </div>
                                         <div className="p-4 bg-gray-900 rounded-2xl border border-white/10">
                                             <p className="text-xs text-gray-400 uppercase font-bold mb-1">Diagnosis</p>
                                             <p className="text-white font-bold">{diagnosis.diagnosis}</p>
                                         </div>
                                         <div className="p-4 bg-gray-900 rounded-2xl border border-white/10">
                                             <p className="text-xs text-gray-400 uppercase font-bold mb-1">Treatment Plan</p>
                                             <p className="text-white text-sm leading-relaxed">{diagnosis.treatment}</p>
                                         </div>
                                         <div className="grid grid-cols-2 gap-3">
                                             <div className="p-3 bg-indigo-900/10 border border-indigo-500/20 rounded-xl">
                                                 <p className="text-[8px] text-indigo-400 font-black uppercase tracking-widest mb-1">GitHub Sync</p>
                                                 <p className="text-[10px] text-white font-mono">{diagnosis.github_sync_status}</p>
                                             </div>
                                             <div className="p-3 bg-cyan-900/10 border border-cyan-500/20 rounded-xl">
                                                 <p className="text-[8px] text-cyan-400 font-black uppercase tracking-widest mb-1">n8n Workflow</p>
                                                 <p className="text-[10px] text-white font-mono">{diagnosis.n8n_workflow_id}</p>
                                             </div>
                                         </div>
                                         <button onClick={handleSaveRecord} className="w-full py-3 bg-cyan-600 text-white font-black rounded-xl uppercase text-xs hover:bg-cyan-500 transition-all">Save to Ledger</button>
                                     </div>
                                 ) : (
                                     <>
                                         <div className="space-y-2 mb-4 h-48 overflow-y-auto custom-scrollbar font-mono text-[10px]">
                                             {councilLogs.map((log, i) => (
                                                 <div key={i} className="text-gray-400 border-l-2 border-white/10 pl-2 animate-fade-in">{log}</div>
                                             ))}
                                             {isAnalyzing && <span className="text-cyan-500 animate-pulse">_</span>}
                                         </div>
                                         
                                         {/* Agent Status Bar */}
                                         <div className="grid grid-cols-4 gap-2 mb-4">
                                             {AI_AGENTS.map(agent => (
                                                 <div key={agent.id} className={`flex flex-col items-center p-2 rounded-xl transition-all ${agent.id === activeAgent ? `${agent.bg} ${agent.border} border` : 'opacity-30'}`}>
                                                     <div className={`text-white mb-1`}>{agent.icon}</div>
                                                     <span className={`text-[6px] font-black uppercase ${agent.color}`}>{agent.role}</span>
                                                 </div>
                                             ))}
                                         </div>

                                         <div className="relative">
                                             <input 
                                                value={symptoms}
                                                onChange={(e) => setSymptoms(e.target.value)}
                                                className="w-full bg-gray-900 border border-white/10 rounded-2xl p-4 pr-12 text-white text-sm outline-none focus:border-cyan-500"
                                                placeholder="Describe symptoms..."
                                                disabled={isAnalyzing}
                                             />
                                             <button 
                                                onClick={toggleVoice}
                                                className={`absolute right-2 top-2 p-2 rounded-xl transition-all ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                                             >
                                                 {isListening ? <MicOff className="w-4 h-4"/> : <Mic className="w-4 h-4"/>}
                                             </button>
                                         </div>
                                         
                                         {/* Attached Files List */}
                                         {attachedFiles.length > 0 && (
                                             <div className="mt-4 space-y-2">
                                                 <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Attached Reports</p>
                                                 <div className="flex flex-wrap gap-2">
                                                     {attachedFiles.map((file, idx) => (
                                                         <div key={idx} className="flex items-center gap-2 bg-gray-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300">
                                                             <FileText className="w-3 h-3 text-cyan-400" />
                                                             <span className="truncate max-w-[150px]">{file.name}</span>
                                                             <button onClick={() => removeFile(idx)} className="text-red-400 hover:text-red-300 ml-1">
                                                                 <X className="w-3 h-3" />
                                                             </button>
                                                         </div>
                                                     ))}
                                                 </div>
                                             </div>
                                         )}

                                         <div className="flex gap-3 mt-4">
                                             <label className="flex-1 py-4 bg-gray-800 border border-white/10 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-gray-700 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                                 <FileText className="w-4 h-4"/> Upload Files
                                                 <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx" disabled={isUploading} />
                                             </label>
                                             <label className="flex-1 py-4 bg-gray-800 border border-white/10 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-gray-700 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                                 <Camera className="w-4 h-4"/> Camera
                                                 <input type="file" capture="environment" className="hidden" onChange={handleFileUpload} accept="image/*" disabled={isUploading} />
                                             </label>
                                             <button 
                                                onClick={runCouncilSession}
                                                disabled={(!symptoms && attachedFiles.length === 0) || isAnalyzing}
                                                className="flex-[2] bg-white text-black font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-cyan-400 transition-all"
                                             >
                                                 {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Zap className="w-4 h-4 fill-current"/>}
                                                 {isAnalyzing ? 'THE COUNCIL IS THINKING...' : 'SUMMON THE COUNCIL'}
                                             </button>
                                         </div>
                                     </>
                                 )}
                             </div>
                         </div>
                     </div>
                 </div>
            </Modal>
        </div>
    );
};

export default MedicalHub;
