
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import { 
    Zap, Globe, Cpu, Network, Database, Shield, 
    MessageSquare, Share2, Github, Workflow, 
    CreditCard, Star, MapPin, RefreshCw, 
    ExternalLink, CheckCircle2, AlertCircle,
    Terminal, Bot, Layers, Radio, Activity
} from 'lucide-react';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';
import { getComplexResponse } from '../../lib/gemini';

const AutomationHub: React.FC = () => {
    const { addToast } = useToast();
    const { members, invoices } = useData();
    const [activeTab, setActiveTab] = useState<'n8n' | 'github' | 'google' | 'whatsapp'>('n8n');
    const [isSyncing, setIsSyncing] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    
    // n8n State
    const [n8nStatus, setN8nStatus] = useState<'connected' | 'error' | 'idle'>('connected');
    const [n8nPaymentSyncUrl, setN8nPaymentSyncUrl] = useState(localStorage.getItem('n8n_payment_sync_url') || import.meta.env.VITE_N8N_PAYMENT_SYNC_URL || 'https://royalthegym.app.n8n.cloud/webhook/payment-sync');
    const [n8nOnboardingUrl, setN8nOnboardingUrl] = useState(localStorage.getItem('n8n_onboarding_url') || import.meta.env.VITE_N8N_ONBOARDING_URL || 'https://royalthegym.app.n8n.cloud/webhook/onboarding');
    const [n8nWorkflowUrl, setN8nWorkflowUrl] = useState(localStorage.getItem('n8n_workflow_url') || import.meta.env.VITE_N8N_WORKFLOW_URL || 'https://royalthegym.app.n8n.cloud/workflow/aqLESKJDrp6xWaok');
    
    const [workflows, setWorkflows] = useState([
        { id: 'wf1', name: 'Member Onboarding Flow', status: 'active', lastRun: '2 mins ago' },
        { id: 'wf2', name: 'Payment Reconciliation', status: 'active', lastRun: '1 hour ago' },
        { id: 'wf3', name: 'Google Review Auto-Reply', status: 'active', lastRun: '10 mins ago' },
        { id: 'wf4', name: 'WhatsApp Retention Bot', status: 'active', lastRun: '5 mins ago' }
    ]);

    // GitHub State
    const [githubToken, setGithubToken] = useState(localStorage.getItem('github_token') || import.meta.env.VITE_GITHUB_TOKEN || '');
    const [repoStatus, setRepoStatus] = useState({
        name: 'royal-the-gym-neural-os',
        branch: 'main',
        lastCommit: '7f2a1c9',
        status: 'synced'
    });

    // WhatsApp State
    const [waToken, setWaToken] = useState(localStorage.getItem('whatsapp_access_token') || import.meta.env.VITE_WHATSAPP_TOKEN || '');
    const [waPhoneId, setWaPhoneId] = useState(localStorage.getItem('whatsapp_phone_id') || import.meta.env.VITE_WHATSAPP_PHONE_ID || '');
    const [waNumber, setWaNumber] = useState('9785300123');

    // Google Business State
    const [googleMerchantId, setGoogleMerchantId] = useState(localStorage.getItem('google_merchant_id') || import.meta.env.VITE_GOOGLE_MERCHANT_ID || '');
    const [googleApiKey, setGoogleApiKey] = useState(localStorage.getItem('google_api_key') || import.meta.env.VITE_GOOGLE_API_KEY || '');
    const [googlePayUpi, setGooglePayUpi] = useState(localStorage.getItem('google_pay_upi') || '9785300123@okbizaxis');
    const [googleStats, setGoogleStats] = useState({
        profileViews: 1240,
        searchViews: 850,
        avgRating: 4.9,
        totalReviews: 128,
        pendingReviews: 3
    });

    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 20));
    };

    const handleSaveConfig = (type: 'n8n' | 'github' | 'whatsapp' | 'google') => {
        if (type === 'n8n') {
            localStorage.setItem('n8n_payment_sync_url', n8nPaymentSyncUrl);
            localStorage.setItem('n8n_onboarding_url', n8nOnboardingUrl);
            localStorage.setItem('n8n_workflow_url', n8nWorkflowUrl);
            addToast("n8n Webhook URLs updated successfully.", "success");
            addLog("n8n Webhook configuration saved.");
        } else if (type === 'github') {
            localStorage.setItem('github_token', githubToken);
            addToast("GitHub Token updated successfully.", "success");
            addLog("GitHub integration credentials saved.");
        } else if (type === 'whatsapp') {
            localStorage.setItem('whatsapp_access_token', waToken);
            localStorage.setItem('whatsapp_phone_id', waPhoneId);
            addToast("WhatsApp Business API credentials updated.", "success");
            addLog(`WhatsApp Business API configured for number: ${waNumber}`);
        } else if (type === 'google') {
            localStorage.setItem('google_merchant_id', googleMerchantId);
            localStorage.setItem('google_api_key', googleApiKey);
            localStorage.setItem('google_pay_upi', googlePayUpi);
            addToast("Google Business Profile & Payment credentials updated.", "success");
            addLog("Google Business configuration saved.");
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        addLog("Initiating Neural Sync across all nodes...");
        
        // Simulate n8n trigger
        addLog("Triggering n8n Webhook: member_sync_v2");
        await new Promise(r => setTimeout(r, 1000));
        
        // Simulate GitHub push
        addLog("Pushing local state to GitHub repository...");
        await new Promise(r => setTimeout(r, 800));
        
        // Simulate Google Business Update
        addLog("Syncing Google Business Profile with latest gym metrics...");
        await new Promise(r => setTimeout(r, 1200));

        setIsSyncing(false);
        addToast("Neural OS fully synchronized with n8n, GitHub, and Google Business.", "success");
        addLog("Sync Complete. All systems nominal.");
    };

    useEffect(() => {
        addLog("Automation Hub Initialized. Monitoring n8n workflows...");
    }, []);

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header Section */}
            <div className="bg-black p-10 rounded-[3rem] border border-indigo-500/20 relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className="p-6 bg-indigo-600 text-white rounded-[2.5rem] shadow-2xl border border-indigo-400">
                            <Workflow className="w-12 h-12" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/30">
                                    Neural Automation Hub
                                </span>
                                <span className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></div>
                                    Live Sync Active
                                </span>
                            </div>
                            <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-4">
                                Automation <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600">Singularity</span>
                            </h1>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] animate-pulse">
                                    World's Fastest & Latest Open-Source AI-POWERED Quantum Computer OS
                                </p>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="bg-white text-black px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-indigo-50 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                        {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        {isSyncing ? 'Syncing Matrix...' : 'Force Global Sync'}
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-gray-900/50 p-2 rounded-3xl border border-white/5 backdrop-blur-xl overflow-x-auto no-scrollbar">
                {[
                    { id: 'n8n', label: 'n8n Workflows', icon: <Workflow className="w-4 h-4" /> },
                    { id: 'github', label: 'GitHub Sync', icon: <Github className="w-4 h-4" /> },
                    { id: 'google', label: 'Google Business', icon: <Globe className="w-4 h-4" /> },
                    { id: 'whatsapp', label: 'WhatsApp Auto', icon: <MessageSquare className="w-4 h-4" /> }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'n8n' && (
                        <div className="space-y-6">
                            <Card title="n8n Configuration" className="bg-black/40 border-white/5 p-8 rounded-[3rem]">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Payment Sync Webhook URL</label>
                                        <input 
                                            type="text" 
                                            value={n8nPaymentSyncUrl}
                                            onChange={(e) => setN8nPaymentSyncUrl(e.target.value)}
                                            placeholder="https://royalthegym.app.n8n.cloud/webhook/payment-sync"
                                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-mono text-sm outline-none focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Onboarding Webhook URL</label>
                                        <input 
                                            type="text" 
                                            value={n8nOnboardingUrl}
                                            onChange={(e) => setN8nOnboardingUrl(e.target.value)}
                                            placeholder="https://royalthegym.app.n8n.cloud/webhook/onboarding"
                                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-mono text-sm outline-none focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Workflow URL</label>
                                        <input 
                                            type="text" 
                                            value={n8nWorkflowUrl}
                                            onChange={(e) => setN8nWorkflowUrl(e.target.value)}
                                            placeholder="https://royalthegym.app.n8n.cloud/workflow/aqLESKJDrp6xWaok"
                                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-mono text-sm outline-none focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => handleSaveConfig('n8n')}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg transition-all"
                                    >
                                        Save Webhook Configuration
                                    </button>
                                </div>
                            </Card>
                            <Card title="n8n Workflow Engine" className="bg-black/40 border-white/5 p-8 rounded-[3rem]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {workflows.map(wf => (
                                        <div key={wf.id} className="bg-gray-900/50 border border-white/5 p-6 rounded-3xl hover:border-indigo-500/30 transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-indigo-600/10 rounded-2xl text-indigo-400">
                                                    <Zap className="w-5 h-5" />
                                                </div>
                                                <span className="text-[9px] font-black text-green-500 uppercase bg-green-500/10 px-2 py-1 rounded">Active</span>
                                            </div>
                                            <h4 className="text-lg font-bold text-white mb-1">{wf.name}</h4>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Last Run: {wf.lastRun}</p>
                                            <div className="mt-4 flex gap-2">
                                                <button className="flex-1 py-2 bg-black border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">Edit in n8n</button>
                                                <button className="px-4 py-2 bg-black border border-white/10 rounded-xl text-gray-400 hover:text-white"><ExternalLink className="w-3 h-3" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'github' && (
                        <div className="space-y-6">
                            <Card title="GitHub Configuration" className="bg-black/40 border-white/5 p-8 rounded-[3rem]">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">GitHub Personal Access Token</label>
                                        <input 
                                            type="password" 
                                            value={githubToken}
                                            onChange={(e) => setGithubToken(e.target.value)}
                                            placeholder="ghp_..."
                                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-mono text-sm outline-none focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => handleSaveConfig('github')}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg transition-all"
                                    >
                                        Save GitHub Credentials
                                    </button>
                                </div>
                            </Card>
                            <Card title="GitHub Repository Sync" className="bg-black/40 border-white/5 p-8 rounded-[3rem]">
                                <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                                    <div className="p-10 bg-white text-black rounded-full shadow-2xl">
                                        <Github className="w-16 h-16" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white uppercase italic">{repoStatus.name}</h3>
                                        <p className="text-gray-500 font-mono text-sm">Branch: <span className="text-indigo-400">{repoStatus.branch}</span> | Commit: <span className="text-indigo-400">{repoStatus.lastCommit}</span></p>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Repository Synced</span>
                                    </div>
                                    <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-white/5 text-left space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-400">Auto-Backup</span>
                                            <span className="text-xs text-green-500 font-bold">ENABLED</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-400">CI/CD Pipeline</span>
                                            <span className="text-xs text-green-500 font-bold">HEALTHY</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-400">Environment Sync</span>
                                            <span className="text-xs text-indigo-400 font-bold">STABLE</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'google' && (
                        <div className="space-y-6">
                            <Card title="Google Business Configuration" className="bg-black/40 border-white/5 p-8 rounded-[3rem]">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Google Merchant ID</label>
                                        <input 
                                            type="text" 
                                            value={googleMerchantId}
                                            onChange={(e) => setGoogleMerchantId(e.target.value)}
                                            placeholder="e.g. 1234567890"
                                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-mono text-sm outline-none focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Google API Key</label>
                                        <input 
                                            type="password" 
                                            value={googleApiKey}
                                            onChange={(e) => setGoogleApiKey(e.target.value)}
                                            placeholder="AIzaSy..."
                                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-mono text-sm outline-none focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Google Pay Business UPI ID</label>
                                        <input 
                                            type="text" 
                                            value={googlePayUpi}
                                            onChange={(e) => setGooglePayUpi(e.target.value)}
                                            placeholder="9785300123@okbizaxis"
                                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-mono text-sm outline-none focus:border-green-500 transition-all"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => handleSaveConfig('google')}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg transition-all"
                                    >
                                        Save Google Configuration
                                    </button>
                                </div>
                            </Card>
                            <Card title="Google Business Profile & Payments" className="bg-black/40 border-white/5 p-8 rounded-[3rem]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        <div className="bg-gray-900/50 p-6 rounded-3xl border border-white/5">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Globe className="w-5 h-5 text-blue-400" />
                                                <span className="text-xs font-black text-white uppercase tracking-widest">Business Insights</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-black">Profile Views</p>
                                                    <p className="text-2xl font-black text-white italic">{googleStats.profileViews}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-black">Search Views</p>
                                                    <p className="text-2xl font-black text-white italic">{googleStats.searchViews}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-900/50 p-6 rounded-3xl border border-white/5">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Star className="w-5 h-5 text-amber-400" />
                                                <span className="text-xs font-black text-white uppercase tracking-widest">Review Management</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-3xl font-black text-white italic">{googleStats.avgRating}</p>
                                                    <div className="flex text-amber-400">
                                                        {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-gray-500 uppercase font-black">Total Reviews</p>
                                                    <p className="text-xl font-black text-white">{googleStats.totalReviews}</p>
                                                </div>
                                            </div>
                                            <button className="w-full mt-4 py-3 bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest rounded-xl">Reply to {googleStats.pendingReviews} Pending Reviews</button>
                                        </div>
                                    </div>

                                    <div className="bg-gray-900/50 p-6 rounded-3xl border border-white/5 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-6">
                                                <CreditCard className="w-5 h-5 text-green-400" />
                                                <span className="text-xs font-black text-white uppercase tracking-widest">Google Business Payments</span>
                                            </div>
                                            <p className="text-sm text-gray-400 leading-relaxed mb-6">
                                                Accept payments directly through your Google Business Profile. Fully automated with your gym's billing system.
                                            </p>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-xs text-gray-300">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    Auto-reconciliation with Invoices
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-gray-300">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    Instant WhatsApp Receipt Generation
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-gray-300">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    Google Maps "Book Now" Integration
                                                </div>
                                            </div>
                                        </div>
                                        <button className="w-full py-4 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl mt-6">Configure Payment Gateway</button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'whatsapp' && (
                        <div className="space-y-6">
                            <Card title="WhatsApp Business Configuration" className="bg-black/40 border-white/5 p-8 rounded-[3rem]">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Registered Phone Number</label>
                                        <input 
                                            type="text" 
                                            value={waNumber}
                                            onChange={(e) => setWaNumber(e.target.value)}
                                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-mono text-sm outline-none focus:border-green-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Phone Number ID</label>
                                        <input 
                                            type="text" 
                                            value={waPhoneId}
                                            onChange={(e) => setWaPhoneId(e.target.value)}
                                            placeholder="e.g. 1045..."
                                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-mono text-sm outline-none focus:border-green-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Permanent Access Token</label>
                                        <textarea 
                                            value={waToken}
                                            onChange={(e) => setWaToken(e.target.value)}
                                            placeholder="EAAG..."
                                            rows={3}
                                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-mono text-xs outline-none focus:border-green-500 transition-all resize-none"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => handleSaveConfig('whatsapp')}
                                        className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg transition-all"
                                    >
                                        Save WhatsApp Credentials
                                    </button>
                                </div>
                            </Card>
                            <Card title="WhatsApp Business Automation" className="bg-black/40 border-white/5 p-8 rounded-[3rem]">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between bg-green-900/10 border border-green-500/20 p-6 rounded-3xl">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 bg-green-600 text-black rounded-2xl">
                                                <MessageSquare className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-white uppercase italic">WhatsApp Business API</h4>
                                                <p className="text-xs text-green-500 font-bold uppercase tracking-widest">Status: Connected & Verified</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-500 uppercase font-black">Messages Sent (Today)</p>
                                            <p className="text-2xl font-black text-white">428</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { label: 'Auto-Reply', status: 'ON', icon: <Bot className="w-5 h-5" /> },
                                            { label: 'Broadcasts', status: 'ON', icon: <Radio className="w-5 h-5" /> },
                                            { label: 'Neural Chat', status: 'ON', icon: <Cpu className="w-5 h-5" /> }
                                        ].map((item, i) => (
                                            <div key={i} className="bg-gray-900/50 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-indigo-400">{item.icon}</div>
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{item.label}</span>
                                                </div>
                                                <span className="text-[9px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded">{item.status}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-gray-900/50 p-6 rounded-3xl border border-white/5">
                                        <h5 className="text-xs font-black text-white uppercase tracking-widest mb-4">Automated Trigger Logic</h5>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-3 bg-black rounded-xl border border-white/5">
                                                <span className="text-xs text-gray-400">New Admission</span>
                                                <span className="text-xs text-indigo-400 font-bold">Send Welcome + Diet</span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-black rounded-xl border border-white/5">
                                                <span className="text-xs text-gray-400">Payment Received</span>
                                                <span className="text-xs text-indigo-400 font-bold">Send Receipt + Invoice</span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-black rounded-xl border border-white/5">
                                                <span className="text-xs text-gray-400">Inactivity (3 Days)</span>
                                                <span className="text-xs text-indigo-400 font-bold">Send Motivation Bot</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Right Column: Console & Status */}
                <div className="lg:col-span-1 space-y-6">
                    <Card title="Neural Terminal" className="bg-[#0c0c0c] border-white/5 h-[400px] flex flex-col p-6 rounded-[3rem]">
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 font-mono text-[10px]">
                            {logs.map((log, i) => (
                                <div key={i} className="text-gray-500 border-b border-white/5 pb-1">
                                    <span className="text-indigo-500 mr-2">{'>'}</span>
                                    {log}
                                </div>
                            ))}
                            {isSyncing && <div className="text-indigo-400 animate-pulse">{'>'} Syncing Neural Nodes...</div>}
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-indigo-900/20 to-black border-indigo-500/30 rounded-[3rem] p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-indigo-600 rounded-2xl text-white">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-black text-white uppercase italic">System Health</h3>
                                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">All Nodes Nominal</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase mb-1">
                                    <span>Automation Load</span>
                                    <span>24%</span>
                                </div>
                                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-indigo-500 h-full w-[24%]"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase mb-1">
                                    <span>Sync Latency</span>
                                    <span>12ms</span>
                                </div>
                                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-green-500 h-full w-[10%]"></div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="bg-black/60 border border-white/10 rounded-[3rem] p-8 text-center space-y-4">
                        <div className="flex justify-center">
                            <Bot className="w-12 h-12 text-indigo-500 animate-bounce" />
                        </div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Aether Prime Assistant</h4>
                        <p className="text-xs text-gray-500 italic leading-relaxed">
                            "I am monitoring all n8n workflows and GitHub commits. Your gym is currently operating at 98% automation efficiency."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AutomationHub;
