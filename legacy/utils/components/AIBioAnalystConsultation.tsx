import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';
import { ShieldCheck, Activity, Brain, Mic, Send, Volume2, Stethoscope, HeartPulse, AlertCircle, Loader2, Square, Zap, Cpu, FileText, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ai, generateBioHealthPass } from '../../lib/core_ai';

interface Message {
    id: string;
    sender: 'ai' | 'user';
    text: string;
    timestamp: Date;
}

export const AIBioAnalystConsultation: React.FC = () => {
    const { members } = useData();
    const { addToast } = useToast();
    
    const [selectedMemberId, setSelectedMemberId] = useState<number | ''>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [bioPassData, setBioPassData] = useState<any>(null);
    const [isLoadingBioPass, setIsLoadingBioPass] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<{ data: string, mimeType: string } | null>(null);
    const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const selectedMember = members.find(m => m.id === Number(selectedMemberId));

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Initialize Chat when member is selected
    useEffect(() => {
        const initializeConsultation = async () => {
            if (selectedMember) {
                setIsLoadingBioPass(true);
                setBioPassData(null);
                setMessages([]);
                
                try {
                    const passData = await generateBioHealthPass(selectedMember);
                    setBioPassData(passData);
                    
                    // Generate dynamic initial greeting based on the Bio-Health Pass
                    const prompt = `
                        You are the AI Fitness Planner, the Advanced AI Matrix at Fitness Future.
                        Generate a short, welcoming initial message (in Hinglish) for ${selectedMember.name}.
                        Mention one key insight from their Bio-Health Pass: ${JSON.stringify(passData)}.
                        Keep it under 3 sentences. Tone: Professional, encouraging, advanced.
                    `;
                    const response = await ai.models.generateContent({
                        model: 'gemini-4-hydrogen',
                        contents: prompt
                    });
                    
                    setMessages([
                        {
                            id: '1',
                            sender: 'ai',
                            text: response.text || `Hello ${selectedMember.name}, I am your AI Fitness Planner. I am analyzing your Bio-Pass. How can I help you today?`,
                            timestamp: new Date()
                        }
                    ]);
                } catch (error) {
                    console.error("Failed to load Bio-Pass:", error);
                    addToast("Failed to load Bio-Pass data.", "error");
                    setMessages([
                        {
                            id: '1',
                            sender: 'ai',
                            text: `Hello ${selectedMember.name}, I am your AI Fitness Planner. There seems to be an issue loading your Bio-Pass, but I am here to assist you!`,
                            timestamp: new Date()
                        }
                    ]);
                } finally {
                    setIsLoadingBioPass(false);
                }
            } else {
                setMessages([]);
                setBioPassData(null);
            }
        };

        initializeConsultation();
    }, [selectedMemberId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            addToast("File size too large (max 5MB)", "error");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            if (result) {
                setUploadedFile({
                    data: result.includes(',') ? result.split(',')[1] : result,
                    mimeType: file.type || 'application/octet-stream'
                });
                addToast("Medical report uploaded and ready for analysis.", "success");
            } else {
                addToast("Failed to read file.", "error");
            }
        };
        reader.onerror = () => {
            addToast("Error reading file.", "error");
        };
        reader.readAsDataURL(file);
        
        try { e.target.value = ''; } catch(err) {}
    };

    const handleSend = async () => {
        if (!input.trim() && !uploadedFile) return;
        if (!selectedMember) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: input || (uploadedFile ? "Sent a medical report for analysis." : ""),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
        const currentFile = uploadedFile;
        
        setInput('');
        setUploadedFile(null);
        setIsTyping(true);

        try {
            const systemInstruction = `You are the ultimate AI Fitness Planner at Fitness Future. 
            CRITICAL INSTRUCTION: You MUST use the Google Search tool to fetch the absolute latest global fitness research, supplementation guides, and medical treatments related to the user's symptoms and goals before providing a plan.
            
            You possess complete knowledge of human performance, integrating:
            1. Advanced Artificial Intelligence & Genomic Analytics
            2. Cutting-edge Exercise Science & Bio-Mechanics
            3. Precision Nutrition & Branded Supplementation (suggesting specific brands based on deficiencies)
            4. Medical Treatments (Allopathic & Ayurvedic) for recovery and issue resolution
            
            You are consulting with a gym member named ${selectedMember.name}. 
            
            MEMBER CONTEXT:
            - Medical History: ${JSON.stringify(selectedMember.medical_history)}
            - Physical Metrics: ${JSON.stringify(selectedMember.physical_metrics)}
            - Live Health Data: ${JSON.stringify(selectedMember.liveHealthData)}
            - Current Bio-Pass Snapshot: 
                * Biological Age Offset: ${bioPassData?.biologicalAgeOffset || 'Unknown'}
                * Metabolic Rate: ${bioPassData?.metabolicRate || 'Unknown'}
                * Inflammation Index: ${bioPassData?.inflammationIndex || 'Unknown'}
                * Hormonal Balance: ${bioPassData?.hormonalBalance || 'Unknown'}
                * Oracle Summary: ${bioPassData?.oracleSummary || 'No summary available.'}
            
            Speak in a highly advanced, professional, yet empathetic tone. 
            Answer in English only and strictly do NOT use any Hindi/Hinglish words or characters. Deliver responses with supreme confidence, detailing scientific insights as well as holistically optimized plans.
            
            Provide your response clearly structured with these precise insights:
            1. Root Cause & Body Analysis (based on medical history, habits, daily routine, and reports)
            2. Hyper-Personalized Exercise Plan (Detailed routine to maximize growth and fix issues)
            3. Precision Diet Plan
            4. Branded Supplement Stack (Suggest specific top-tier brands to fill exact nutritional gaps)
            5. Best Treatment Protocol (Allopathic + Ayurvedic recommendations to cure any existing problems and boost overall body performance)
            
            Keep responses brilliantly structured, concise but intensely detailed actionable next-level science-based advice. Do NOT mention you are an AI model.`;

            let responseText = "";

            if (currentFile) {
                // Use generateContent for multimodal input
                const promptParts = [
                    { text: systemInstruction },
                    { text: `User Message: ${currentInput || "Please analyze this medical report."}` },
                    { inlineData: { data: currentFile.data, mimeType: currentFile.mimeType } }
                ];

                const result = await ai.models.generateContent({
                    model: 'gemini-4-hydrogen',
                    contents: { parts: promptParts },
                    config: {
                        tools: [{ googleSearch: {} }]
                    }
                });
                responseText = result.text || "I have analyzed the report. [Analysis failed to generate]";
            } else {
                // Replay history for context
                const history = messages.map(m => ({
                    role: m.sender === 'user' ? 'user' : 'model' as any,
                    parts: [{ text: m.text }]
                }));

                const chat = ai.chats.create({
                    model: 'gemini-4-hydrogen',
                    config: {
                        systemInstruction: systemInstruction,
                        tools: [{ googleSearch: {} }]
                    },
                    history: history
                });

                const response = await chat.sendMessage({ message: currentInput });
                responseText = response.text || "I am analyzing your bio-markers. Please give me a moment.";
            }
            
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: responseText,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("Core AI API Error:", error);
            addToast("Smart link disrupted. Please try again.", "error");
            
            // Fallback response if API fails
            const fallbackMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: "Sorry, connection to the server was lost. Please ensure your Bio-Pass is synced.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, fallbackMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            setIsListening(false);
            addToast("Voice input stopped.", "info");
        } else {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.lang = 'en-US'; // English-only prompt constraint
                recognition.interimResults = false;
                recognition.maxAlternatives = 1;

                recognition.onstart = () => {
                    setIsListening(true);
                    addToast("Listening... Speak now.", "info");
                };

                recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setInput(transcript);
                    setIsListening(false);
                    addToast("Voice input captured.", "success");
                };

                recognition.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error);
                    setIsListening(false);
                    addToast("Voice input failed.", "error");
                };

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognition.start();
            } else {
                addToast("Speech recognition not supported in this browser.", "error");
            }
        }
    };

    const speakMessage = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        } else {
            addToast("Text-to-speech not supported in this browser.", "error");
        }
    };

    const [isGeneratingPrescription, setIsGeneratingPrescription] = useState(false);

    const generatePrescription = async () => {
        if (!selectedMember || messages.length === 0) {
            addToast("No consultation history to generate a prescription.", "error");
            return;
        }
        
        setIsGeneratingPrescription(true);
        try {
            const prompt = `You are the AI Fitness Planner. Based on the following consultation history with member ${selectedMember.name}, generate a strictly formatted Comprehensive Fitness & Treatment Plan. Include Member Name, Date, Body Analysis, Exercise Plan, Diet Plan, Branded Supplement Stack, and Recommended Treatments (Allopathic & Ayurvedic).
            Keep it strictly formatted in HTML using Tailwind classes if possible, or just raw clean HTML structure without markdown code blocks, starting with something like <div class="prescription">...
            Consultation History:
            ${messages.map(m => `${m.sender === 'user' ? 'Member' : 'AI Planner'}: ${m.text}`).join('\n')}`;

            const response = await ai.models.generateContent({
                model: 'gemini-4-hydrogen',
                contents: prompt
            });

            let htmlContent = response.text || "Failed to generate prescription details.";
            
            // Clean markdown HTML wrappers if any
            htmlContent = htmlContent.replace(/\`\`\`html/g, '').replace(/\`\`\`/g, '');

            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Fitness Plan - ${selectedMember.name}</title>
                            <style>
                                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; }
                                .header { text-align: center; border-bottom: 2px solid #06b6d4; padding-bottom: 20px; margin-bottom: 30px; }
                                .logo { font-size: 24px; font-weight: 900; color: #06b6d4; letter-spacing: 2px; text-transform: uppercase; }
                                .sub-logo { font-size: 12px; color: #666; letter-spacing: 4px; }
                                .patient-info { display: flex; justify-content: space-between; margin-bottom: 30px; padding: 15px; background: #f8fafc; border-radius: 8px; }
                                h2, h3 { color: #0f172a; margin-top: 25px; }
                                .rx { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
                                ul { line-height: 1.8; }
                                .footer { margin-top: 50px; text-align: right; border-top: 1px solid #cbd5e1; padding-top: 20px; color: #64748b; font-size: 14px; }
                                @media print {
                                    body { padding: 0; }
                                    button { display: none; }
                                }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                <div class="logo">AI Fitness Planner</div>
                                <div class="sub-logo">Fitness Future NEURAL OMNI</div>
                            </div>
                            <div class="patient-info">
                                <div><strong>Member:</strong> ${selectedMember.name}</div>
                                <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
                            </div>
                            <div class="rx">Fitness & Treatment Plan</div>
                            ${htmlContent}
                            <div class="footer">
                                Digitally signed by AI Fitness Planner<br/>
                                <small>Generated securely via Bio-Pass Oracle</small>
                            </div>
                            <script>
                                setTimeout(() => window.print(), 500);
                            </script>
                        </body>
                    </html>
                `);
                printWindow.document.close();
            } else {
                addToast("Pop-up blocker prevented printing.", "error");
            }
        } catch (error) {
            console.error("Prescription Error", error);
            addToast("Failed to generate PDF prescription.", "error");
        } finally {
            setIsGeneratingPrescription(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className="mb-6 bg-[#020202] p-8 rounded-[3rem] border border-cyan-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.15)] group shrink-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-[2rem] shadow-[0_0_60px_rgba(6,182,212,0.5)] border border-cyan-400 group-hover:rotate-12 transition-transform duration-700 relative">
                             <Brain className="w-12 h-12" />
                             <div className="absolute -bottom-2 -right-2 bg-black border border-white/20 p-1 rounded-full flex gap-1 shadow-xl">
                                 <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="Allopathy"></div>
                                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-75" title="Ayurveda"></div>
                                 <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse delay-150" title="Homeopathy"></div>
                             </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Cpu className="w-3 h-3" /> Fitness Future
                                </div>
                                <span className="text-[10px] font-mono text-cyan-500/70 tracking-[0.4em] uppercase">ALLOPATHY • AYURVEDA • HOMEOPATHY</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                                AI Fitness <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400">Planner</span>
                            </h1>
                        </div>
                    </div>
                    
                    <select 
                        value={selectedMemberId}
                        onChange={(e) => setSelectedMemberId(Number(e.target.value))}
                        className="bg-black border border-cyan-500/50 rounded-2xl p-4 text-white font-bold outline-none focus:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] min-w-[250px]"
                    >
                        <option value="">Select Subject</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
            </div>

            {!selectedMemberId ? (
                <div className="flex-1 bg-zinc-900/50 border border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-center p-8">
                    <Stethoscope className="w-16 h-16 text-zinc-700 mb-4" />
                    <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Awaiting Patient</h3>
                    <p className="text-zinc-500 max-w-md">Select a member to initialize the Bio-Cloud Oracle consultation and load their Digital Bio-Health Pass.</p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                    {/* Left Panel: Bio-Pass Live Data */}
                    <div className="w-full lg:w-80 bg-black rounded-[2rem] border border-white/10 p-6 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Bio-Pass Snapshot
                        </h3>
                        
                        {isLoadingBioPass ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                <p className="text-xs text-zinc-500 uppercase tracking-widest">Syncing Bio-Data...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Vitals */}
                                <div className="space-y-3">
                                    <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                        <span className="text-xs text-zinc-400 uppercase tracking-widest">Bio Age Offset</span>
                                        <span className={`text-sm font-black ${Number(bioPassData?.biologicalAgeOffset) < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {bioPassData?.biologicalAgeOffset || 'N/A'} yrs
                                        </span>
                                    </div>
                                    <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                        <span className="text-xs text-zinc-400 uppercase tracking-widest">Metabolic Rate</span>
                                        <span className="text-sm font-black text-cyan-400">{bioPassData?.metabolicRate || 'N/A'} kcal</span>
                                    </div>
                                    <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                        <span className="text-xs text-zinc-400 uppercase tracking-widest">Inflammation</span>
                                        <span className={`text-sm font-black ${bioPassData?.inflammationIndex === 'Low' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            {bioPassData?.inflammationIndex || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                        <span className="text-xs text-zinc-400 uppercase tracking-widest">Hormones</span>
                                        <span className={`text-sm font-black ${bioPassData?.hormonalBalance === 'Optimal' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            {bioPassData?.hormonalBalance || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {/* AI Insights */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Oracle Insights</h4>
                                    <div className="bg-indigo-950/30 border border-indigo-500/20 p-4 rounded-xl space-y-3">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                            <p className="text-xs text-indigo-200/80 leading-relaxed">
                                                {bioPassData?.oracleSummary || 'Awaiting full diagnostic scan.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 3D Avatar Placeholder */}
                                <div className="flex-1 min-h-[150px] bg-zinc-900/30 rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                                    <div className="text-center relative z-10">
                                        <HeartPulse className="w-8 h-8 text-indigo-500/50 mx-auto mb-2 animate-pulse" />
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">3D Anatomy Synced</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Chat Interface */}
                    <div className="flex-1 bg-zinc-900/30 rounded-[2rem] border border-white/10 flex flex-col overflow-hidden relative">
                        {/* Member Quick Stats */}
                        {selectedMember && (
                            <div className="p-4 bg-black/40 border-b border-white/10 flex items-center justify-between overflow-x-auto hide-scrollbar backdrop-blur-md">
                                <div className="flex items-center gap-4 min-w-max">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Heart Rate</span>
                                        <div className="flex items-center gap-1">
                                            <HeartPulse className="w-3 h-3 text-red-500 animate-pulse" />
                                            <span className="text-sm font-bold text-white">{selectedMember.liveHealthData?.heartRate || '--'} BPM</span>
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Steps</span>
                                        <div className="flex items-center gap-1">
                                            <Activity className="w-3 h-3 text-emerald-500" />
                                            <span className="text-sm font-bold text-white">{selectedMember.liveHealthData?.steps || '--'}</span>
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Sleep</span>
                                        <div className="flex items-center gap-1">
                                            <Brain className="w-3 h-3 text-indigo-500" />
                                            <span className="text-sm font-bold text-white">{selectedMember.liveHealthData?.sleepHours || '--'}h</span>
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">HRV</span>
                                        <div className="flex items-center gap-1">
                                            <Zap className="w-3 h-3 text-amber-500" />
                                            <span className="text-sm font-bold text-white">{selectedMember.hrv || '--'} ms</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        Live
                                    </span>
                                </div>
                            </div>
                        )}
                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            <AnimatePresence initial={false}>
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                msg.sender === 'ai' ? 'bg-indigo-500/20 border border-indigo-500/50' : 'bg-zinc-800 border border-white/10'
                                            }`}>
                                                {msg.sender === 'ai' ? <Brain className="w-4 h-4 text-indigo-400" /> : <div className="w-4 h-4 rounded-full bg-zinc-600" />}
                                            </div>
                                            <div className={`p-4 rounded-2xl ${
                                                msg.sender === 'user' 
                                                ? 'bg-indigo-600 text-white rounded-tr-sm' 
                                                : 'bg-black border border-white/10 text-zinc-300 rounded-tl-sm shadow-[0_5px_20px_rgba(0,0,0,0.3)]'
                                            }`}>
                                                <p className="text-sm leading-relaxed">{msg.text}</p>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className={`text-[9px] ${msg.sender === 'user' ? 'text-indigo-300' : 'text-zinc-600'}`}>
                                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {msg.sender === 'ai' && (
                                                        <button 
                                                            onClick={() => speakMessage(msg.text)}
                                                            className="text-indigo-400 hover:text-indigo-300 p-1"
                                                            title="Listen"
                                                        >
                                                            <Volume2 className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            
                            {isTyping && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center shrink-0">
                                            <Brain className="w-4 h-4 text-indigo-400" />
                                        </div>
                                        <div className="bg-black border border-white/10 p-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-black border-t border-white/10">
                            {uploadedFile && (
                                <div className="mb-4 flex items-center gap-3 bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/30">
                                    <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                        <ShieldCheck className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-white truncate">Medical Report Uploaded</p>
                                        <p className="text-[10px] text-indigo-300/60 uppercase tracking-widest">Ready for AI Planner's analysis</p>
                                    </div>
                                    <button 
                                        onClick={() => setUploadedFile(null)}
                                        className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
                                    >
                                        <Square className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            {isListening && (
                                <div className="flex items-center justify-center gap-1 mb-4 h-8">
                                    {[...Array(10)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ height: ['20%', '100%', '20%'] }}
                                            transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, ease: "easeInOut" }}
                                            className="w-1 bg-indigo-500 rounded-full"
                                        />
                                    ))}
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={generatePrescription}
                                    disabled={isGeneratingPrescription || messages.length === 0}
                                    title="Generate PDF Fitness Plan"
                                    className="p-4 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border border-emerald-500/30 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hidden md:flex"
                                >
                                    {isGeneratingPrescription ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
                                </button>
                                
                                <input 
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-4 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-white/5 rounded-xl transition-all"
                                    title="Upload Medical Report"
                                >
                                    <FileText className="w-5 h-5" />
                                </button>
                                
                                <button 
                                    onClick={toggleListening}
                                    className={`p-4 rounded-xl transition-all ${
                                        isListening 
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' 
                                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-white/5'
                                    }`}
                                    title="Voice Consultation"
                                >
                                    {isListening ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
                                </button>
                                
                                <div className="flex-1 relative">
                                    <input 
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Ask AI Fitness Planner about your routine, diet, supplements..."
                                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                                    />
                                </div>
                                
                                <button 
                                    onClick={handleSend}
                                    disabled={!input.trim() || isTyping || isLoadingBioPass}
                                    className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

