
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import {
    Zap, Globe, Cpu, Network, Database, Shield,
    MessageSquare, Share2, Github, Workflow,
    CreditCard, Star, MapPin, RefreshCw,
    ExternalLink, CheckCircle2, AlertCircle,
    Terminal, Bot, Layers, Radio, Activity
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { clearLegacySensitiveStorage, getRuntimeSecret, setRuntimeSecret } from '../../lib/runtimeSecrets';
import { isN8nLiveDeliveryEnabled, normalizeN8nWebhookUrl } from '../../lib/automationPolicy';

function readSavedValue(key: string): string | null {
    try {
        return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
    } catch {
        return null;
    }
}

const AutomationHub: React.FC = () => {
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'n8n' | 'github' | 'google' | 'whatsapp'>('n8n');

    // Webhook addresses are public routing details, not secrets. Delivery is separately disabled by default.
    const [n8nPaymentSyncUrl, setN8nPaymentSyncUrl] = useState(
        readSavedValue('n8n_payment_sync_url') ?? import.meta.env?.VITE_N8N_PAYMENT_SYNC_URL ?? '',
    );
    const [n8nOnboardingUrl, setN8nOnboardingUrl] = useState(
        readSavedValue('n8n_onboarding_url') ?? import.meta.env?.VITE_N8N_ONBOARDING_URL ?? '',
    );
    const n8nLiveDeliveryEnabled = isN8nLiveDeliveryEnabled(import.meta.env?.VITE_N8N_LIVE_DELIVERY_ENABLED);

    // GitHub State
    const [githubToken, setGithubToken] = useState(getRuntimeSecret('github_token'));
    const [repoStatus, setRepoStatus] = useState({
        name: 'royal-the-gym-neural-os',
        branch: 'main',
        lastCommit: '7f2a1c9',
        status: 'synced'
    });

    // WhatsApp State
    const [waToken, setWaToken] = useState(getRuntimeSecret('whatsapp_access_token'));
    const [waPhoneId, setWaPhoneId] = useState(getRuntimeSecret('whatsapp_phone_id'));
    const [waNumber, setWaNumber] = useState('9785300123');

    // Google Business State
    const [googleMerchantId, setGoogleMerchantId] = useState(localStorage.getItem('google_merchant_id') || import.meta.env.VITE_GOOGLE_MERCHANT_ID || '');
    const [googleApiKey, setGoogleApiKey] = useState(getRuntimeSecret('google_api_key'));
    const [googlePayUpi, setGooglePayUpi] = useState(localStorage.getItem('google_pay_upi') || '9785300123@okbizaxis');
    const [googleStats, setGoogleStats] = useState({
        profileViews: 1240,
        searchViews: 850,
        avgRating: 4.9,
        totalReviews: 128,
        pendingReviews: 3
    });

    useEffect(() => { clearLegacySensitiveStorage(); }, []);

    const handleSaveConfig = (type: 'n8n' | 'github' | 'whatsapp' | 'google') => {
        if (type === 'n8n') {
            const paymentUrl = n8nPaymentSyncUrl.trim();
            const onboardingUrl = n8nOnboardingUrl.trim();
            if ((paymentUrl && !normalizeN8nWebhookUrl(paymentUrl)) || (onboardingUrl && !normalizeN8nWebhookUrl(onboardingUrl))) {
                addToast('Use HTTPS webhook URLs without credentials, query strings, or fragments.', 'error');
                return;
            }
            try {
                localStorage.setItem('n8n_payment_sync_url', paymentUrl);
                localStorage.setItem('n8n_onboarding_url', onboardingUrl);
                localStorage.removeItem('n8n_workflow_url');
            } catch {
                addToast('Could not save webhook addresses in this browser.', 'error');
                return;
            }
            addToast('Webhook addresses saved locally. No live request was made.', 'success');
        } else if (type === 'github') {
            setRuntimeSecret('github_token', githubToken);
            addToast('GitHub credential is kept in memory for this session only.', 'success');
        } else if (type === 'whatsapp') {
            setRuntimeSecret('whatsapp_access_token', waToken);
            setRuntimeSecret('whatsapp_phone_id', waPhoneId);
            addToast('WhatsApp credentials are kept in memory for this session only.', 'success');
        } else if (type === 'google') {
            localStorage.setItem('google_merchant_id', googleMerchantId);
            setRuntimeSecret('google_api_key', googleApiKey);
            localStorage.setItem('google_pay_upi', googlePayUpi);
            addToast('Google Business settings saved; API key stays in memory for this session only.', 'success');
        }
    };

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
                                    Event-only automation
                                </span>
                                <span className={`text-[10px] font-bold uppercase ${n8nLiveDeliveryEnabled ? 'text-amber-400' : 'text-gray-400'}`}>
                                    {n8nLiveDeliveryEnabled ? 'Live delivery enabled by build setting' : 'Live delivery disabled'}
                                </span>
                            </div>
                            <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-4">
                                n8n <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600">Events</span>
                            </h1>
                            <p className="text-sm text-gray-400 max-w-2xl">
                                Only fixed event/status envelopes are supported. This screen does not inspect workflow runs or perform a global sync.
                            </p>
                        </div>
                    </div>
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
                            <Card title="Webhook endpoints" className="bg-black/40 border-white/5 p-8 rounded-[3rem]">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Payment event endpoint</label>
                                        <input
                                            type="url"
                                            value={n8nPaymentSyncUrl}
                                            onChange={(e) => setN8nPaymentSyncUrl(e.target.value)}
                                            placeholder="https://your-n8n-host/webhook/payment-event"
                                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-mono text-sm outline-none focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Member-created event endpoint</label>
                                        <input
                                            type="url"
                                            value={n8nOnboardingUrl}
                                            onChange={(e) => setN8nOnboardingUrl(e.target.value)}
                                            placeholder="https://your-n8n-host/webhook/member-created"
                                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-mono text-sm outline-none focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        HTTPS only. Do not put credentials or tokens in these URLs. Saving stores addresses in this browser; it does not test or run a workflow.
                                    </p>
                                    <button
                                        onClick={() => handleSaveConfig('n8n')}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg transition-all"
                                    >
                                        Save endpoint addresses
                                    </button>
                                </div>
                            </Card>
                            <Card title="Supported event envelopes" className="bg-black/40 border-white/5 p-8 rounded-[3rem]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-900/50 border border-white/5 p-6 rounded-3xl">
                                        <div className="flex justify-between items-start gap-3">
                                            <h4 className="text-lg font-bold text-white">Member created</h4>
                                            <span className="text-[9px] font-black text-indigo-300 uppercase bg-indigo-500/10 px-2 py-1 rounded">Code wired</span>
                                        </div>
                                        <p className="mt-3 text-xs text-gray-400">Sends only schema version, event name, source, timestamp and the fixed status. No member record or contact details.</p>
                                    </div>
                                    <div className="bg-gray-900/50 border border-white/5 p-6 rounded-3xl">
                                        <div className="flex justify-between items-start gap-3">
                                            <h4 className="text-lg font-bold text-white">Payment received</h4>
                                            <span className="text-[9px] font-black text-indigo-300 uppercase bg-indigo-500/10 px-2 py-1 rounded">Admin attestation</span>
                                        </div>
                                        <p className="mt-3 text-xs text-gray-400">Only after explicit admin confirmation of a known non-Paid → Paid transition. It is not processor verification and includes no invoice or payment details.</p>
                                    </div>
                                </div>
                                <p className="mt-5 text-xs text-gray-400">Attendance, review, medical and system-sync events are not sent. No downstream workflow has been verified from this screen.</p>
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

                {/* Delivery limits and safeguards */}
                <div className="lg:col-span-1 space-y-6">
                    <Card title="Delivery safety" className="bg-[#0c0c0c] border-white/5 p-6 rounded-[3rem]">
                        <div className="space-y-4 text-sm text-gray-300">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-indigo-400" />
                                <span className="font-bold text-white">{n8nLiveDeliveryEnabled ? 'Deployment gate is enabled' : 'Live delivery is off by default'}</span>
                            </div>
                            <p>When enabled in deployment configuration, eligible events send only the fixed envelope. This UI does not run test or live workflows.</p>
                            <p>Endpoints are not health-checked. HTTP success does not prove a downstream workflow completed.</p>
                            <p className="text-amber-300">A server-side authenticated proxy, durable delivery and cross-session idempotency are not implemented.</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AutomationHub;
