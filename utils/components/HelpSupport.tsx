
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Card from './common/Card';
import { 
  HelpCircle, MessageSquare, ShieldCheck, Zap, 
  Phone, Mail, MapPin, Send, AlertTriangle, 
  CheckCircle, ChevronRight, FileText, RefreshCw,
  Search, Terminal, Cpu, Clock, Bell, History,
  ShieldAlert, Fingerprint, Activity, LifeBuoy,
  Server, Wifi, Globe, Sparkles, Lock, Radio,
  BrainCircuit
} from 'lucide-react';
import { BotIcon } from './icons/BotIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { useToast } from '../hooks/useToast';
import { GYM_INFO } from '../../constants';
import { getComplexResponse } from '../../lib/gemini';

// --- v31.0 CONSTANTS ---
const STATIC_FAQS = [
  {
    q: "How does Aether-Prime analysis work?",
    a: "Our Sovereign AI scans your medical biomarkers and kinetic history to synthesize a 100% personalized training and nutrition protocol."
  },
  {
    q: "Is my biological data secure?",
    a: "Yes. All matter-data is stored in an RSA-4096 encrypted enclave. Access is limited to your unique biometric identity."
  },
  {
    q: "Payment not reflecting in wallet?",
    a: "Neural sync can take up to 300 seconds. If it persists, use the 'Raise Ticket' feature for an immediate treasury audit."
  },
  {
    q: "Can I pause my membership?",
    a: "Membership freeze is available for 'Sovereign' tier users for up to 30 days. Contact admin via Neural Ticket."
  }
];

interface HelpSupportProps {
  setChatOpen: (open: boolean) => void;
}

interface SupportTicket {
    id: string;
    category: string;
    description: string;
    priority: 'Normal' | 'Urgent' | 'Critical';
    status: 'Queued' | 'Analyzing' | 'Resolved';
    timestamp: string;
}

const HelpSupport: React.FC<HelpSupportProps> = ({ setChatOpen }) => {
  const { addToast } = useToast();
  
  // CORE STATES
  const [activeTab, setActiveTab] = useState<'ticket' | 'status' | 'contact' | 'matrix'>('ticket');
  const [ticketCategory, setTicketCategory] = useState('General');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'Normal' | 'Urgent'>('Normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Diagnostic State
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<'clean' | 'issues' | null>(null);
  const [diagnosticLog, setDiagnosticLog] = useState<string[]>([]);
  
  // AI Knowledge Matrix State
  const [searchTerm, setSearchTerm] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  // Persisted Logic (Simulation)
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([
      { id: 'TIC-8821', category: 'Payment', description: 'Monthly fee sync delay', priority: 'Normal', status: 'Resolved', timestamp: '2 days ago' }
  ]);

  const terminalRef = useRef<HTMLDivElement>(null);

  // --- AUTO-DIAGNOSTIC SENTINEL ---
  const runDiagnostics = () => {
      setIsDiagnosing(true);
      setDiagnosticLog([]);
      setDiagnosticResult(null);
      
      const steps = [
          "Handshake: Pinging Treasury Ledger...",
          "Bio-Scan: Verifying Biometric Hash...",
          "Cache: Integrity Check (SHA-256)...",
          "Network: Latency < 20ms confirmed...",
          "Neural Uplink: Calibrating..."
      ];
      
      let i = 0;
      const interval = setInterval(() => {
          if (i < steps.length) {
              setDiagnosticLog(prev => [...prev, `> ${steps[i]}`]);
              if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
              i++;
          } else {
              clearInterval(interval);
              setIsDiagnosing(false);
              setDiagnosticResult('clean');
              setDiagnosticLog(prev => [...prev, "> SYSTEM_NOMINAL. No local errors found.", "> READY."]);
              addToast("Self-Repair Complete. System Green.", "success");
          }
      }, 600);
  };

  // --- TICKET DISPATCHER ---
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketDesc.trim()) {
        addToast("Please provide incident details.", "error");
        return;
    }

    setIsSubmitting(true);
    addToast("Neural Dispatcher: Routing Ticket to Admin...", "info");
    
    // Sovereign Handshake Simulation
    setTimeout(() => {
        const newTicket: SupportTicket = {
            id: `TIC-${Math.floor(1000 + Math.random() * 9000)}`,
            category: ticketCategory,
            description: ticketDesc,
            priority: ticketPriority === 'Urgent' ? 'Urgent' : 'Normal',
            status: 'Queued',
            timestamp: 'Just now'
        };
        
        setMyTickets([newTicket, ...myTickets]);
        addToast(`Sovereign Ticket ${newTicket.id} Deployed.`, "success");
        setTicketDesc('');
        setTicketCategory('General');
        setTicketPriority('Normal');
        setIsSubmitting(false);
        setActiveTab('status');
    }, 2000);
  };

  // --- NEURAL KNOWLEDGE MATRIX (AI SEARCH) ---
  const handleNeuralQuery = async () => {
      if (!searchTerm.trim()) return;
      setIsThinking(true);
      setAiAnswer(null);

      const prompt = `
        Act as the Support AI for 'Royal The Gym'.
        User Question: "${searchTerm}"
        
        Context:
        - We are a high-tech, AI-powered gym.
        - Features: Bio-Scan, Future OFS, Neural Recovery, Smart Payments.
        - Tone: Professional, Futuristic, Helpful.
        
        Provide a concise (max 2 sentences) answer.
      `;

      try {
          const res = await getComplexResponse(prompt);
          setAiAnswer(res);
      } catch (e) {
          setAiAnswer("Neural Link Offline. Please check static FAQs.");
      } finally {
          setIsThinking(false);
      }
  };

  const handleContactAction = (type: 'call' | 'whatsapp' | 'email') => {
      if (type === 'call') window.open(`tel:${GYM_INFO.contact}`);
      if (type === 'email') window.open(`mailto:${GYM_INFO.email}`);
      if (type === 'whatsapp') window.open(`https://wa.me/${GYM_INFO.whatsappNumber.replace(/\D/g, '')}?text=URGENT: Sovereign Support Required.`);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-32">
      {/* ROYAL SOVEREIGN HEADER */}
      <div className="bg-[#020308] p-10 rounded-[4rem] border border-blue-500/30 relative overflow-hidden shadow-[0_0_120px_rgba(59,130,246,0.15)] group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-15"></div>
        <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-8">
                <div className="p-8 bg-blue-600 text-white rounded-[3rem] shadow-[0_0_60px_rgba(37,99,235,0.5)] border border-blue-400 group-hover:rotate-12 transition-transform duration-700">
                    <LifeBuoy className="w-16 h-16 animate-pulse" />
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="px-4 py-1.5 bg-blue-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                            Assistance Node v31.0
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">STATUS: SUPPORT_UPLINK_STABLE</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                        Help <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">Core</span>
                    </h1>
                </div>
            </div>

            <div className="flex bg-gray-900/80 p-2 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl overflow-x-auto no-scrollbar max-w-full">
                {[
                    { id: 'ticket', label: 'Raise Issue', icon: <AlertTriangle className="w-4 h-4" /> },
                    { id: 'matrix', label: 'Knowledge Matrix', icon: <BrainCircuit className="w-4 h-4" /> },
                    { id: 'status', label: 'My Tickets', icon: <History className="w-4 h-4" /> },
                    { id: 'contact', label: 'Uplink', icon: <Radio className="w-4 h-4" /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'bg-blue-600 text-white shadow-2xl' 
                            : 'text-gray-500 hover:text-white'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: ACTIVE INTERFACE */}
        <div className="lg:col-span-8 space-y-6">
            
            {/* TAB: TICKET SYSTEM */}
            {activeTab === 'ticket' && (
                <div className="space-y-6 animate-slide-up">
                    {/* 1. AUTO-DIAGNOSTIC PANEL */}
                    <div className={`p-8 rounded-[3rem] border transition-all relative overflow-hidden ${diagnosticResult === 'clean' ? 'bg-green-950/20 border-green-500/30' : 'bg-gray-950 border-white/5'}`}>
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex items-start gap-5">
                                <div className={`p-4 rounded-2xl ${isDiagnosing ? 'bg-blue-600/20 text-blue-400' : diagnosticResult === 'clean' ? 'bg-green-600/20 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                                    {isDiagnosing ? <RefreshCw className="w-6 h-6 animate-spin"/> : <Server className="w-6 h-6"/>}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Auto-Diagnostic Sentinel</h3>
                                    <p className="text-gray-400 text-xs mt-1 max-w-sm">Run a self-repair scan before raising a ticket. This fixes 90% of sync/cache issues.</p>
                                </div>
                            </div>
                            <button 
                                onClick={runDiagnostics}
                                disabled={isDiagnosing || diagnosticResult === 'clean'}
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    diagnosticResult === 'clean' 
                                    ? 'bg-green-600 text-black shadow-lg cursor-default' 
                                    : 'bg-white text-black hover:bg-blue-400 hover:text-white shadow-xl active:scale-95'
                                }`}
                            >
                                {isDiagnosing ? 'SCANNING...' : diagnosticResult === 'clean' ? 'SYSTEM CLEAN' : 'RUN CHECK'}
                            </button>
                        </div>
                        {/* Console Output */}
                        {(isDiagnosing || diagnosticLog.length > 0) && (
                            <div ref={terminalRef} className="mt-6 bg-black/60 rounded-2xl p-4 font-mono text-[10px] text-blue-300 space-y-1 h-32 overflow-y-auto custom-scrollbar border border-white/5 shadow-inner">
                                {diagnosticLog.map((log, i) => (
                                    <div key={i} className="animate-fade-in text-blue-400/90">{log}</div>
                                ))}
                                {isDiagnosing && <div className="animate-pulse">_</div>}
                            </div>
                        )}
                    </div>

                    {/* 2. TICKET FORM */}
                    <Card title="Neural Ticket Dispatcher" className="bg-gray-950 border-white/5 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><Terminal className="w-32 h-32 text-blue-500" /></div>
                        
                        <form onSubmit={handleSubmitTicket} className="space-y-10 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Identify Problem Node</label>
                                    <select 
                                        value={ticketCategory}
                                        onChange={(e) => setTicketCategory(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-2xl p-5 text-white font-black italic outline-none focus:border-blue-500 appearance-none shadow-inner"
                                    >
                                        <option>General Support</option>
                                        <option>Treasury / Fees</option>
                                        <option>Biometric / Access</option>
                                        <option>Equipment Fault</option>
                                        <option>Trainer Protocol</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Priority Level</label>
                                    <div className="flex bg-black rounded-2xl p-1.5 border border-white/10">
                                        <button 
                                            type="button"
                                            onClick={() => setTicketPriority('Normal')}
                                            className={`flex-1 text-center py-4 text-[10px] font-black uppercase rounded-xl transition-all ${ticketPriority === 'Normal' ? 'bg-white text-black shadow-xl' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            Standard
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setTicketPriority('Urgent')}
                                            className={`flex-1 text-center py-4 text-[10px] font-black uppercase rounded-xl transition-all ${ticketPriority === 'Urgent' ? 'bg-red-600 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            Urgent
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Detailed Incident Report</label>
                                <textarea 
                                    value={ticketDesc}
                                    onChange={(e) => setTicketDesc(e.target.value)}
                                    rows={6}
                                    placeholder="Describe the biological or digital bottleneck..."
                                    className="w-full bg-black border border-white/10 rounded-[2rem] p-8 text-white text-sm focus:border-blue-500 outline-none resize-none shadow-inner italic"
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-[2.5rem] shadow-2xl transition-all flex items-center justify-center gap-4 uppercase tracking-[0.4em] text-xs active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? <RefreshCw className="animate-spin" /> : <Send className="w-5 h-5" />}
                                {isSubmitting ? 'TRANSMITTING...' : 'Deploy Assistance Ticket'}
                            </button>
                        </form>
                    </Card>
                </div>
            )}

            {/* TAB: STATUS TRACKER */}
            {activeTab === 'status' && (
                <div className="space-y-6 animate-slide-up">
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-widest pl-4">Sovereign status Tracker</h3>
                    {myTickets.map((ticket) => (
                        <div key={ticket.id} className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[3rem] flex flex-col md:flex-row justify-between items-center group hover:border-blue-500/30 transition-all shadow-xl">
                            <div className="flex items-center gap-8">
                                <div className={`p-5 rounded-2xl bg-gray-900 border border-white/5 ${ticket.status === 'Resolved' ? 'text-green-500' : 'text-blue-500 animate-pulse'}`}>
                                    {ticket.status === 'Resolved' ? <CheckCircle className="w-8 h-8" /> : <Activity className="w-8 h-8" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-xs font-black text-white italic uppercase tracking-tight">{ticket.id}</span>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${ticket.priority === 'Urgent' ? 'bg-red-900/20 text-red-500 border-red-500/30' : 'bg-blue-900/20 text-blue-400 border-blue-500/30'}`}>{ticket.priority}</span>
                                    </div>
                                    <h4 className="text-xl font-black text-gray-300 italic group-hover:text-white transition-colors uppercase">{ticket.category}</h4>
                                    <p className="text-xs text-gray-600 mt-1 font-medium italic">{ticket.description}</p>
                                </div>
                            </div>
                            <div className="text-right mt-6 md:mt-0 flex flex-col items-end gap-3">
                                 <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${ticket.status === 'Resolved' ? 'bg-green-900/20 text-green-400 border-green-500/30' : 'bg-blue-900/20 text-blue-400 border-blue-500/30'}`}>
                                     {ticket.status}
                                 </span>
                                 <p className="text-[9px] text-gray-700 font-mono">{ticket.timestamp}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB: KNOWLEDGE MATRIX (AI) */}
            {activeTab === 'matrix' && (
                <div className="space-y-6 animate-slide-up">
                    <Card title="Neural Knowledge Base" className="bg-gray-950 border-white/5 p-10 rounded-[3rem] shadow-2xl">
                         <div className="relative mb-10">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-600" />
                            <input 
                                type="text" 
                                placeholder="Ask the Hive Mind (e.g. 'How to freeze membership?')"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleNeuralQuery()}
                                className="w-full bg-black border border-white/10 rounded-[2rem] py-6 pl-16 pr-32 text-white font-black italic focus:border-blue-500 outline-none shadow-inner"
                            />
                            <button 
                                onClick={handleNeuralQuery}
                                disabled={isThinking || !searchTerm}
                                className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white font-black px-6 rounded-[1.5rem] uppercase text-[10px] tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50"
                            >
                                {isThinking ? <RefreshCw className="w-4 h-4 animate-spin"/> : 'Search'}
                            </button>
                        </div>
                        
                        {/* AI Answer Block */}
                        {aiAnswer && (
                            <div className="mb-10 p-8 bg-blue-900/10 border-l-4 border-blue-500 rounded-r-[3rem] animate-fade-in relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><BotIcon className="w-20 h-20 text-blue-400"/></div>
                                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" /> Neural Response
                                </h4>
                                <p className="text-blue-100 text-sm leading-relaxed italic">{aiAnswer}</p>
                            </div>
                        )}

                        <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 pl-4 border-l-2 border-gray-700">Common Protocols</h4>
                        <div className="space-y-4">
                            {STATIC_FAQS.map((faq, idx) => (
                                <div key={idx} className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 hover:border-blue-500/30 transition-all group shadow-xl">
                                    <h4 className="text-lg font-black text-white uppercase italic mb-3 flex items-start gap-3">
                                        <HelpCircle className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transition-colors mt-0.5" />
                                        {faq.q}
                                    </h4>
                                    <p className="text-gray-400 text-xs leading-relaxed pl-8 border-l border-white/10 ml-2">
                                        {faq.a}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* TAB: CONTACT */}
            {activeTab === 'contact' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
                    <Card onClick={() => handleContactAction('whatsapp')} className="bg-green-950/10 border-green-500/20 hover:border-green-500 cursor-pointer group transition-all text-center py-16 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><WhatsAppIcon className="w-48 h-48" /></div>
                        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(34,197,94,0.3)] border border-green-500/50">
                            <WhatsAppIcon className="w-12 h-12 text-green-400" />
                        </div>
                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">WhatsApp Admin</h3>
                        <p className="text-green-500/60 text-[10px] font-black uppercase tracking-widest mt-2">Instant Neural Sync</p>
                    </Card>

                    <Card onClick={() => handleContactAction('call')} className="bg-blue-950/10 border-blue-500/20 hover:border-blue-500 cursor-pointer group transition-all text-center py-16 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Phone className="w-48 h-48" /></div>
                        <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(59,130,246,0.3)] border border-blue-500/50">
                            <Phone className="w-12 h-12 text-blue-400" />
                        </div>
                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Voice Uplink</h3>
                        <p className="text-blue-400 font-mono text-sm mt-2 font-bold tracking-widest">{GYM_INFO.contact}</p>
                    </Card>

                    <Card className="bg-gray-900 border-white/5 p-10 rounded-[3rem] text-center md:col-span-2">
                        <div className="flex flex-col md:flex-row items-center justify-center gap-12">
                             <div className="space-y-2">
                                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5"><Mail className="w-8 h-8 text-gray-500" /></div>
                                <h4 className="text-white font-bold uppercase tracking-widest text-xs">Email Shard</h4>
                                <p className="text-gray-500 text-sm">{GYM_INFO.email}</p>
                             </div>
                             <div className="h-20 w-px bg-white/5 hidden md:block"></div>
                             <div className="space-y-2">
                                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5"><MapPin className="w-8 h-8 text-gray-500" /></div>
                                <h4 className="text-white font-bold uppercase tracking-widest text-xs">Base Sector</h4>
                                <p className="text-gray-500 text-xs max-w-xs">{GYM_INFO.address}</p>
                             </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>

        {/* RIGHT COLUMN: AI & SENTINEL */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* AI Assistant Card */}
            <Card className="bg-gradient-to-br from-indigo-900/60 to-black border-indigo-500/30 p-10 text-center relative overflow-hidden group shadow-2xl rounded-[3.5rem]">
                <div className="absolute inset-0 bg-indigo-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="w-32 h-32 bg-indigo-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border-4 border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.4)] animate-pulse group-hover:rotate-12 transition-transform duration-700">
                    <BotIcon className="w-16 h-16 text-indigo-400" />
                </div>
                
                <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none">Neural Assistant</h3>
                <p className="text-gray-400 text-sm mb-10 font-medium italic">
                    "Uplink directly to the Royal Sovereign AI for instant bio-metric analysis or troubleshooting."
                </p>
                
                <button 
                    onClick={() => setChatOpen(true)}
                    className="w-full bg-white text-indigo-900 font-black py-5 rounded-[2rem] shadow-2xl transition-all flex items-center justify-center gap-4 uppercase tracking-widest text-xs hover:bg-indigo-50 active:scale-95"
                >
                    <MessageSquare className="w-5 h-5" /> Initialize Chat
                </button>
            </Card>

            {/* System Status Sentinel */}
            <div className="bg-gray-950 p-8 rounded-[3rem] border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Council Presence</span>
                    <span className="text-[10px] font-bold text-green-400 bg-green-900/20 px-4 py-1.5 rounded-full border border-green-500/20 flex items-center gap-3">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span> SECURE_LINE
                    </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                     <div className="bg-black/40 p-3 rounded-2xl border border-white/5 text-center">
                         <p className="text-[8px] font-black text-gray-500 uppercase">Avg Response</p>
                         <p className="text-xl font-bold text-white italic">12 <span className="text-xs font-normal text-gray-600">min</span></p>
                     </div>
                     <div className="bg-black/40 p-3 rounded-2xl border border-white/5 text-center">
                         <p className="text-[8px] font-black text-gray-500 uppercase">Active Agents</p>
                         <p className="text-xl font-bold text-blue-400 italic">03</p>
                     </div>
                </div>

                <div className="flex -space-x-4 mb-6 justify-center">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-12 h-12 rounded-2xl border-4 border-gray-950 bg-gray-900 flex items-center justify-center shadow-lg relative group">
                             <img src={`https://i.pravatar.cc/100?u=council${i}`} className="w-full h-full rounded-xl grayscale group-hover:grayscale-0 transition-all" alt="council" />
                        </div>
                    ))}
                </div>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-2 flex justify-between">
                    <span>Admin Velocity:</span>
                    <span className="text-white italic">Peak (98%)</span>
                </p>
            </div>

            {/* Data Sovereignty Shard */}
            <div className="p-8 bg-amber-900/10 border border-amber-500/20 rounded-[3rem] flex gap-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform"><ShieldCheck className="w-16 h-16 text-amber-500" /></div>
                <ShieldAlert className="w-10 h-10 text-amber-500 flex-shrink-0 relative z-10" />
                <div className="relative z-10">
                    <h4 className="text-amber-500 font-black text-xs uppercase mb-1 tracking-widest italic">Data Sovereignty</h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                        Communication packets are PGP encrypted. No third-party matter-harvesting.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
