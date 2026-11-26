import { getCurrencySymbol } from '../../store/useCurrencyStore';

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
    Binary, MessageSquare, Eye, Heart, Thermometer, Wind, X, Camera, Moon
} from 'lucide-react';
import { BotIcon } from '../icons/BotIcon';
import { useToast } from '../../hooks/useToast';
import { MedicalConsultation } from '../../../types';
import Modal from '../common/Modal';
import { runAIBioCouncil, processMedicalReport, AIFitnessAnalysis, analyzeComprehensiveHealth } from '../../../lib/aiBioAnalyst';
import { generateAIPDFReport } from '../../../lib/pdfGenerator';
import { generateTextToSpeech } from '../../../lib/core_ai';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { toBase64, decode, decodeAudioData } from '../../../lib/utils';

const CrownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-3-4 3-6-7z"/></svg>;

// --- MOCK AGENTS (The Open Source Council) ---
const AI_AGENTS = [
    { id: 'Llama-3-Med', role: 'Generalist', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: <Globe className="w-3 h-3"/> },
    { id: 'Bio-Mistral', role: 'Physiology', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: <Dna className="w-3 h-3"/> },
    { id: 'DeepSeek-V3', role: 'Pathology', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: <Binary className="w-3 h-3"/> },
    { id: 'Future-Core', role: 'Supervisor', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: <CrownIcon /> }
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
    const { members, medicalConsultations, addMedicalConsultation, liveHealthData, addMedicalReport } = useData();
    const { addToast } = useToast();
    const member = members.find(m => m.id === memberId);
    
    // UI State
    const [activeTab, setActiveTab] = useState<'diagnostics' | 'labTests' | 'telePhysio' | 'mentalHealth'>('diagnostics');
    const [isConsultOpen, setIsConsultOpen] = useState(false);
    const [symptoms, setSymptoms] = useState('');
    const [selectedPart, setSelectedBodyPart] = useState('General');
    const [isListening, setIsListening] = useState(false);
    const [ecgData, setEcgData] = useState<{time: number, val: number}[]>([]);
    
    // AI Council State
    const [councilLogs, setCouncilLogs] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [diagnosis, setDiagnosis] = useState<AIFitnessAnalysis | null>(null);
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
            { agent: 'Future-Core', action: 'Synthesizing Final Verdict...', delay: 1000 }
        ];

        for (const step of sequence) {
            setActiveAgent(step.agent);
            await new Promise(r => setTimeout(r, step.delay));
            setCouncilLogs(prev => [...prev, `[${step.agent}] ${step.action}`]);
        }

        try {
            const filesForAI = attachedFiles.map(f => ({ data: f.data, mimeType: f.type }));
            
            // Use the new comprehensive function
            const analysis = await analyzeComprehensiveHealth(symptoms, filesForAI, {
                ...member,
                heartRate: liveHealthData.heartRate.avg
            });
            
            setDiagnosis(analysis);
            setCouncilLogs(prev => [...prev, `[System] GitHub Sync: ${analysis.github_sync_status}`, `[System] n8n Workflow: ${analysis.n8n_workflow_id}`]);
            
            // Generate PDF Report if files were attached
            if (attachedFiles.length > 0) {
                const originalFileName = attachedFiles[0].name;
                let pdfDataUri = "";
                try {
                    pdfDataUri = generateAIPDFReport(member?.name || "Member", analysis, originalFileName);
                } catch (pdfErr) {
                    console.error("PDF Generation failed", pdfErr);
                    pdfDataUri = attachedFiles[0].data; // Fallback to original file data
                }
                
                // Save the PDF report to the server/context
                await addMedicalReport({
                    report_id: `rep_${Date.now()}`,
                    member_id: memberId,
                    file_url: pdfDataUri,
                    ocr_data: analysis,
                    status: 'Analyzed',
                    upload_date: new Date().toISOString()
                });
                
                // Clear original uploaded files (auto-delete)
                setAttachedFiles([]);
                addToast("Original files deleted. AI Report saved as PDF.", "success");
            }
            
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
            setDiagnosis({ diagnosis: "Smart Fatigue Analysis", severity: "Low", exercise_plan: "Rest", diet_plan: "Hydrate", supplement_stack: "Electrolytes", treatment_allopathic: "Rest", treatment_ayurvedic: "Rest", recovery_days: 1, agents_involved: ["Future-Core"], github_sync_status: "Failed", n8n_workflow_id: "N/A" });
        } finally {
            setIsAnalyzing(false);
            setActiveAgent(null);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const target = e.target;
        const files = Array.from(target.files || []) as File[];
        if (files.length === 0) return;
        
        setIsUploading(true);
        setIsConsultOpen(true);
        
        try {
            const newFiles: {name: string, data: string, type: string}[] = [];
            const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit per file
            const MAX_TOTAL_SIZE = 18 * 1024 * 1024; // 18MB total limit
            let totalSize = attachedFiles.reduce((acc, f) => acc + (f.data ? f.data.length * 0.75 : 0), 0); // Approximate base64 size

            for (const file of files) {
                if (file.size > MAX_SIZE) {
                    addToast(`Skipped ${file.name}: File too large (>5MB)`, "error");
                    continue;
                }
                if (totalSize + file.size > MAX_TOTAL_SIZE) {
                    addToast(`Skipped ${file.name}: Total size exceeds 18MB limit`, "error");
                    continue;
                }
                totalSize += file.size;

                let mimeType = file.type;
                if (!mimeType) {
                    if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
                    else if (file.name.endsWith('.csv')) mimeType = 'text/csv';
                    else if (file.name.endsWith('.txt')) mimeType = 'text/plain';
                    else mimeType = 'application/octet-stream';
                }

                const reader = new FileReader();
                await new Promise<void>((resolve, reject) => {
                    reader.onload = () => {
                        try {
                            const res = reader.result?.toString();
                            if (res) {
                                newFiles.push({ name: file.name, data: res, type: mimeType });
                            }
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
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
            try { if (target) target.value = ''; } catch(e) {}
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
            severity: diagnosis.severity as any,
            historyContext: '',
            aiDiagnosis: JSON.stringify(diagnosis),
            aiPrescription: `Exercise: ${diagnosis.exercise_plan} | Diet: ${diagnosis.diet_plan} | Supplement: ${diagnosis.supplement_stack}`,
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
                                Cloud <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Med</span>
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* TAB NAVIGATOR */}
            <div className="flex bg-gray-950 p-2 rounded-[2rem] border border-white/5 w-fit mx-auto backdrop-blur-xl overflow-x-auto no-scrollbar">
                {[
                    { id: 'diagnostics', label: 'Diagnostics', icon: <Stethoscope className="w-4 h-4" /> },
                    { id: 'labTests', label: 'Lab Tests', icon: <TestTube className="w-4 h-4" /> },
                    { id: 'telePhysio', label: 'Tele-Physio', icon: <Activity className="w-4 h-4" /> },
                    { id: 'mentalHealth', label: 'Mental Health', icon: <BrainCircuit className="w-4 h-4" /> },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`relative px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap overflow-hidden group ${
                            activeTab === tab.id 
                            ? 'bg-gradient-to-r from-cyan-900/40 to-cyan-800/40 backdrop-blur-xl border border-dashed border-cyan-500/50 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                            : 'bg-gradient-to-r from-gray-900/40 to-gray-800/40 backdrop-blur-xl border border-dashed border-gray-600/50 hover:border-gray-500 text-gray-500 hover:text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]'
                        }`}
                    >
                        <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                        <div className="relative z-10 flex items-center gap-3 group-hover:scale-105 transition-transform duration-500">
                            {tab.icon} {tab.label}
                        </div>
                    </button>
                ))}
            </div>

            {activeTab === 'diagnostics' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up">
                    
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
                            className="relative flex-1 bg-gradient-to-r from-cyan-900/40 to-cyan-800/40 hover:from-cyan-800/60 hover:to-cyan-700/60 backdrop-blur-xl border border-dashed border-cyan-500/50 hover:border-cyan-400 text-white font-black py-6 rounded-[2.5rem] shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 active:scale-95 group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                            <BotIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-500 relative z-10"/> 
                            <span className="relative z-10">Initiate Diagnosis</span>
                        </button>
                        <label className="relative flex-1 bg-gradient-to-r from-gray-900/40 to-gray-800/40 hover:from-gray-800/60 hover:to-gray-700/60 backdrop-blur-xl border border-dashed border-white/10 hover:border-cyan-500/50 text-white font-black py-6 rounded-[2.5rem] transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] group overflow-hidden">
                            <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                            <FileText className="w-5 h-5 group-hover:scale-110 transition-transform duration-500 relative z-10"/>
                            <span className="relative z-10">{isUploading ? 'Analyzing...' : 'Upload Report'}</span>
                            <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="*/*" disabled={isUploading} />
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
            )}

            {activeTab === 'labTests' && (
                <div className="space-y-8 animate-slide-up">
                    <div className="bg-gradient-to-r from-blue-900/20 to-black border border-blue-500/20 p-8 rounded-[3rem] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><TestTube className="w-48 h-48 text-blue-500" /></div>
                        <div className="relative z-10">
                            <h3 className="text-3xl font-black text-white uppercase italic mb-2 tracking-tight">Lab Test Booking</h3>
                            <p className="text-gray-400 text-sm max-w-xl mb-6">Book blood tests directly. Reports are automatically analyzed by our AI to adjust your diet and workout plans.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { name: 'Testosterone Panel', desc: 'Free & Total Testosterone, SHBG', price: '${getCurrencySymbol()}1,499' },
                                    { name: 'Thyroid Profile', desc: 'T3, T4, TSH', price: '${getCurrencySymbol()}999' },
                                    { name: 'Vitamin D & B12', desc: 'Essential vitamins for recovery', price: '${getCurrencySymbol()}1,299' },
                                    { name: 'Complete Blood Count', desc: 'Overall health marker', price: '${getCurrencySymbol()}499' },
                                    { name: 'Lipid Profile', desc: 'Cholesterol, Triglycerides', price: '${getCurrencySymbol()}799' },
                                    { name: 'Full Body Checkup', desc: 'Comprehensive 60+ parameters', price: '${getCurrencySymbol()}2,999' }
                                ].map((test, idx) => (
                                    <Card key={idx} className="bg-[#080808] border-white/5 p-6 rounded-[2.5rem] hover:border-blue-500/30 transition-all group relative overflow-hidden">
                                        <h4 className="text-xl font-black text-white uppercase italic mb-1">{test.name}</h4>
                                        <p className="text-gray-400 text-xs mb-4">{test.desc}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-blue-400 font-bold">{test.price}</span>
                                            <button className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                                Book Now
                                            </button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'telePhysio' && (
                <div className="space-y-8 animate-slide-up">
                    <div className="bg-gradient-to-r from-teal-900/20 to-black border border-teal-500/20 p-8 rounded-[3rem] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><Activity className="w-48 h-48 text-teal-500" /></div>
                        <div className="relative z-10">
                            <h3 className="text-3xl font-black text-white uppercase italic mb-2 tracking-tight">Tele-Consultation</h3>
                            <p className="text-gray-400 text-sm max-w-xl mb-6">Injured or need diet advice? Connect with our expert physiotherapists and nutritionists via video call instantly.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { name: 'Dr. Anjali Sharma', role: 'Sports Physiotherapist', exp: '8 Years Exp', avatar: 'https://i.pravatar.cc/150?u=anjali' },
                                    { name: 'Rahul Verma', role: 'Clinical Nutritionist', exp: '5 Years Exp', avatar: 'https://i.pravatar.cc/150?u=rahulv' }
                                ].map((doc, idx) => (
                                    <Card key={idx} className="bg-[#080808] border-white/5 p-6 rounded-[2.5rem] hover:border-teal-500/30 transition-all group relative overflow-hidden flex items-center gap-6">
                                        <img src={doc.avatar} alt={doc.name} className="w-20 h-20 rounded-2xl object-cover border border-teal-500/30" />
                                        <div className="flex-1">
                                            <h4 className="text-xl font-black text-white uppercase italic mb-1">{doc.name}</h4>
                                            <p className="text-teal-400 text-xs font-bold mb-1">{doc.role}</p>
                                            <p className="text-gray-500 text-[10px] mb-4">{doc.exp}</p>
                                            <button className="w-full bg-teal-600/20 text-teal-400 hover:bg-teal-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                                <Camera className="w-4 h-4" /> Start Video Call
                                            </button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'mentalHealth' && (
                <div className="space-y-8 animate-slide-up">
                    <div className="bg-gradient-to-r from-purple-900/20 to-black border border-purple-500/20 p-8 rounded-[3rem] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><BrainCircuit className="w-48 h-48 text-purple-500" /></div>
                        <div className="relative z-10">
                            <h3 className="text-3xl font-black text-white uppercase italic mb-2 tracking-tight">Sleep & Mental Health</h3>
                            <p className="text-gray-400 text-sm max-w-xl mb-6">Smartwatch-synced recovery analysis and guided meditation tracks for optimal mental performance.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <Card className="bg-black/40 border-white/5 p-6 rounded-[2.5rem]">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-purple-500/20 rounded-xl"><Moon className="w-6 h-6 text-purple-400" /></div>
                                        <div>
                                            <h4 className="font-bold text-white uppercase">Sleep Recovery</h4>
                                            <p className="text-xs text-gray-500">Last Night's Analysis</p>
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-2 mb-2">
                                        <span className="text-5xl font-black text-white italic">6h 45m</span>
                                        <span className="text-purple-400 font-bold mb-1">/ 8h Required</span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
                                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                                    </div>
                                    <p className="text-xs text-gray-400">AI Suggestion: You need 1h 15m more sleep tonight for optimal muscle recovery.</p>
                                </Card>

                                <Card className="bg-black/40 border-white/5 p-6 rounded-[2.5rem]">
                                    <h4 className="font-bold text-white uppercase mb-4">Guided Audio Tracks</h4>
                                    <div className="space-y-3">
                                        {[
                                            { title: 'Deep Muscle Relaxation', duration: '15 min' },
                                            { title: 'Pre-Workout Focus', duration: '5 min' },
                                            { title: 'Sleep Inducing Frequencies', duration: '30 min' }
                                        ].map((track, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center"><Volume2 className="w-4 h-4 text-purple-400" /></div>
                                                    <span className="text-sm text-gray-300 font-bold">{track.title}</span>
                                                </div>
                                                <span className="text-xs text-gray-500">{track.duration}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DIAGNOSTIC MODAL */}
            <Modal isOpen={isConsultOpen} onClose={() => setIsConsultOpen(false)} title="Smart Council Uplink">
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
                                         <div className="p-4 bg-gray-900 rounded-2xl border border-white/10 space-y-4">
                                             <div>
                                                 <p className="text-xs text-gray-400 uppercase font-bold mb-1">Exercise Plan</p>
                                                 <p className="text-white text-sm leading-relaxed">{diagnosis.exercise_plan}</p>
                                             </div>
                                             <div>
                                                 <p className="text-xs text-gray-400 uppercase font-bold mb-1">Diet Plan</p>
                                                 <p className="text-white text-sm leading-relaxed">{diagnosis.diet_plan}</p>
                                             </div>
                                             <div>
                                                 <p className="text-xs text-gray-400 uppercase font-bold mb-1">Supplement Stack</p>
                                                 <p className="text-purple-400 text-sm leading-relaxed font-bold">{diagnosis.supplement_stack}</p>
                                             </div>
                                             <div>
                                                 <p className="text-xs text-emerald-400 uppercase font-bold mb-1">Treatments (Allopathic & Ayurvedic)</p>
                                                 <p className="text-white text-sm leading-relaxed">Allopathic: {diagnosis.treatment_allopathic || 'N/A'}<br/>Ayurvedic: {diagnosis.treatment_ayurvedic || 'N/A'}</p>
                                             </div>
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
                                         <button onClick={handleSaveRecord} className="relative w-full py-3 bg-gradient-to-r from-cyan-900/40 to-cyan-800/40 hover:from-cyan-800/60 hover:to-cyan-700/60 backdrop-blur-xl border border-dashed border-cyan-500/50 hover:border-cyan-400 text-white font-black rounded-xl uppercase text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] group overflow-hidden">
                                             <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                             <span className="relative z-10">Save to Ledger</span>
                                         </button>
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
                                             <label className="relative flex-1 py-4 bg-gradient-to-r from-gray-800/40 to-gray-700/40 hover:from-gray-700/60 hover:to-gray-600/60 backdrop-blur-xl border border-dashed border-white/10 hover:border-white/30 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,255,255,0.1)] group overflow-hidden">
                                                 <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                                 <FileText className="w-4 h-4 group-hover:scale-110 transition-transform duration-500 relative z-10"/> 
                                                 <span className="relative z-10">Upload Files</span>
                                                 <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="*/*" disabled={isUploading} />
                                             </label>
                                             <label className="relative flex-1 py-4 bg-gradient-to-r from-gray-800/40 to-gray-700/40 hover:from-gray-700/60 hover:to-gray-600/60 backdrop-blur-xl border border-dashed border-white/10 hover:border-white/30 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,255,255,0.1)] group overflow-hidden">
                                                 <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                                 <Camera className="w-4 h-4 group-hover:scale-110 transition-transform duration-500 relative z-10"/> 
                                                 <span className="relative z-10">Camera</span>
                                                 <input type="file" capture="environment" className="hidden" onChange={handleFileUpload} accept="image/*" disabled={isUploading} />
                                             </label>
                                             <button 
                                                onClick={runCouncilSession}
                                                disabled={(!symptoms && attachedFiles.length === 0) || isAnalyzing}
                                                className="relative flex-[2] bg-gradient-to-r from-cyan-900/40 to-cyan-800/40 hover:from-cyan-800/60 hover:to-cyan-700/60 backdrop-blur-xl border border-dashed border-cyan-500/50 hover:border-cyan-400 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] group overflow-hidden"
                                             >
                                                 <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                                 <div className="relative z-10 flex items-center gap-2">
                                                     {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Zap className="w-4 h-4 fill-current group-hover:scale-110 transition-transform duration-500"/>}
                                                     <span>{isAnalyzing ? 'THE COUNCIL IS THINKING...' : 'SUMMON THE COUNCIL'}</span>
                                                 </div>
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
