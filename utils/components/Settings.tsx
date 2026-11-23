
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import { View } from '../../types';
import { 
    Cpu, RefreshCw, Zap, Save, CheckCircle, 
    Globe, Lock, Shield, Server, Activity, 
    Smartphone, Cloud, BrainCircuit, User,
    MapPin, Radio, AlertTriangle, Trash2,
    Crosshair, Terminal, Power, Mic, ScanFace,
    Layers, Fingerprint, Database, Send
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useData } from '../context/DataProvider';
import ConfirmationDialog from './common/ConfirmationDialog';
import { workerFetch } from '../../lib/apiClient';

interface SettingsProps {
    setCurrentView: (view: View) => void;
    currentUser?: any;
}

const Settings: React.FC<SettingsProps> = ({ setCurrentView, currentUser }) => {
    const { addToast } = useToast();
    const { systemVersion, isDeveloperMode, setDeveloperMode } = useData();
    const [activeTab, setActiveTab] = useState<'neural_core' | 'security_grid' | 'comms_uplink' | 'identity'>('neural_core');
    
    // --- STATE MANAGEMENT ---

    // 1. Smart Core (AI)
    const [aiProvider, setAiProvider] = useState(localStorage.getItem('fitness_ai_provider') || 'CORE_AI');
    const [geminiModel, setGeminiModel] = useState(localStorage.getItem('fitness_gemini_model') || 'gemini-4-hydrogen');
    const [simMode, setSimMode] = useState(localStorage.getItem('fitness_ai_mode') === 'SIMULATION');
    const [voiceEnabled, setVoiceEnabled] = useState(localStorage.getItem('fitness_voice_enabled') !== 'false');
    const [reasoningBudget, setReasoningBudget] = useState(Number(localStorage.getItem('fitness_reasoning_budget')) || 50);

    // 2. Security Grid (Geo-Fencing)
    const [geoLockEnabled, setGeoLockEnabled] = useState(localStorage.getItem('fitness_geo_lock') === 'true');
    const [bioLockEnabled, setBioLockEnabled] = useState(localStorage.getItem('fitness_bio_lock') === 'true');
    const [neuralEncryption, setSmartEncryption] = useState(localStorage.getItem('fitness_neural_encryption') === 'true');
    const [gymLat, setGymLat] = useState(localStorage.getItem('fitness_future_lat') || '28.1289');
    const [gymLng, setGymLng] = useState(localStorage.getItem('fitness_future_lng') || '75.3995');

    // 3. Comms Uplink (WhatsApp)
    // API tokens (WhatsApp, Gemini, Razorpay) are NEVER stored in the browser.
    // They live only as Cloudflare Worker secrets; here we only show whether they are configured.
    type IntegrationStatus = { connected: boolean; label: string };
    const [integrations, setIntegrations] = useState<Record<string, IntegrationStatus> | null>(null);
    const [integrationsError, setIntegrationsError] = useState<string | null>(null);
    const [holographicComms, setHolographicComms] = useState(localStorage.getItem('fitness_holographic_comms') === 'true');
    const [testPhone, setTestPhone] = useState(localStorage.getItem('fitness_test_phone') || '9800000000');
    const [isTestingWa, setIsTestingWa] = useState(false);

    const loadIntegrationStatus = async () => {
        const res = await workerFetch<{ integrations: Record<string, IntegrationStatus> }>('/integrations/status');
        if (res.ok && res.data?.integrations) {
            setIntegrations(res.data.integrations);
            setIntegrationsError(null);
        } else {
            setIntegrations(null);
            setIntegrationsError(res.error || 'Could not read integration status.');
        }
    };

    useEffect(() => {
        // Clean up any token an older version of the app may have left in this browser.
        ['whatsapp_access_token', 'whatsapp_phone_id', 'HUGGINGFACE_API_KEY', 'GEMINI_API_KEY', 'gemini_api_key',
         'razorpay_key_id', 'razorpay_key_secret', 'RAZORPAY_KEY_SECRET'].forEach((k) => localStorage.removeItem(k));
        loadIntegrationStatus();
    }, []);

    // 4. Identity
    const [name, setName] = useState(currentUser?.name || '');
    const [dnaHash, setDnaHash] = useState(localStorage.getItem('fitness_dna_hash') || 'SHA-256:8f3e...9a2c');

    // Danger Zone
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

    // --- ACTIONS ---

    const handleSaveSmart = () => {
        localStorage.setItem('fitness_ai_provider', aiProvider);
        localStorage.setItem('fitness_gemini_model', geminiModel);
        localStorage.setItem('fitness_ai_mode', simMode ? 'SIMULATION' : 'ONLINE');
        localStorage.setItem('fitness_voice_enabled', String(voiceEnabled));
        localStorage.setItem('fitness_reasoning_budget', String(reasoningBudget));
        
        addToast("Smart Core Reconfigured. Rebooting Logic Layers...", "success");
    };

    const handleSaveSecurity = () => {
        localStorage.setItem('fitness_geo_lock', String(geoLockEnabled));
        localStorage.setItem('fitness_bio_lock', String(bioLockEnabled));
        localStorage.setItem('fitness_neural_encryption', String(neuralEncryption));
        localStorage.setItem('fitness_future_lat', gymLat);
        localStorage.setItem('fitness_future_lng', gymLng);
        addToast("Perimeter & Bio-Security Protocols Updated.", "success");
    };

    const handleCalibrateLocation = () => {
        if (!navigator.geolocation) {
            addToast("GPS Hardware Not Detected.", "error");
            return;
        }
        addToast("Triangulating Satellite Signal...", "info");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGymLat(pos.coords.latitude.toString());
                setGymLng(pos.coords.longitude.toString());
                addToast("Coordinates Locked to Current Location.", "success");
            },
            (err) => addToast("GPS Signal Lost.", "error")
        );
    };

    const handleSaveComms = () => {
        localStorage.setItem('fitness_holographic_comms', String(holographicComms));
        localStorage.setItem('fitness_test_phone', testPhone);
        addToast("Sub-Space Communication Channels Synced.", "success");
    };

    const handleTestWhatsApp = async () => {
        setIsTestingWa(true);
        const res = await workerFetch<{ configured: boolean; message: string }>('/whatsapp/status');
        if (res.ok && res.data?.configured) {
            addToast(res.data.message || "WhatsApp is configured on the server.", "success");
        } else {
            addToast(res.data?.message || res.error || "WhatsApp is not configured on the server.", "error");
        }
        await loadIntegrationStatus();
        setIsTestingWa(false);
    };

    const handleFactoryReset = () => {
        localStorage.clear();
        sessionStorage.clear();
        addToast("SYSTEM PURGE INITIATED...", "error");
        setTimeout(() => window.location.reload(), 2000);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            
            {/* KERNEL HEADER */}
            <div className="bg-[#020202] p-10 rounded-[3.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px] animate-pulse"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="p-6 bg-white/10 rounded-[2.5rem] border border-white/20 text-white shadow-xl group-hover:rotate-12 transition-transform duration-700">
                            <Cpu className="w-16 h-16 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="px-4 py-1.5 bg-white/10 text-gray-300 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 border border-white/5">
                                    <Terminal className="w-3 h-3" /> Root Access
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">VER: {systemVersion}</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Kernel <span className="text-gray-500">Config</span>
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* NAVIGATION MATRIX */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-gray-950 p-6 rounded-[3rem] border border-white/5">
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-6 pl-4">System Modules</p>
                        <div className="space-y-3">
                            {[
                                { id: 'neural_core', label: 'Core Engine', icon: <BrainCircuit className="w-5 h-5"/>, color: 'text-cyan-400', border: 'border-cyan-500/20' },
                                { id: 'security_grid', label: 'Security Grid', icon: <Shield className="w-5 h-5"/>, color: 'text-red-400', border: 'border-red-500/20' },
                                { id: 'comms_uplink', label: 'Comms Uplink', icon: <Radio className="w-5 h-5"/>, color: 'text-green-400', border: 'border-green-500/20' },
                                { id: 'identity', label: 'Identity Node', icon: <User className="w-5 h-5"/>, color: 'text-amber-400', border: 'border-amber-500/20' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id as any)}
                                    className={`w-full p-5 rounded-[2rem] flex items-center justify-between transition-all group border ${
                                        activeTab === item.id 
                                        ? `bg-white text-black shadow-xl border-white` 
                                        : `bg-black/40 text-gray-400 hover:bg-white/5 hover:text-white ${item.border}`
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl bg-gray-900 border border-white/5 ${item.color} group-hover:scale-110 transition-transform`}>
                                            {item.icon}
                                        </div>
                                        <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
                                    </div>
                                    {activeTab === item.id && <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-red-950/10 p-6 rounded-[2.5rem] border border-red-500/20 text-center">
                        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                        <h4 className="text-red-500 font-black uppercase text-xs tracking-widest mb-4">Danger Zone</h4>
                        <button 
                            onClick={() => setIsResetConfirmOpen(true)}
                            className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(220,38,38,0.3)] border border-red-500/50 border-dashed flex items-center justify-center gap-2 transition-all active:scale-95 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                            <Trash2 className="w-4 h-4 relative z-10" /> <span className="relative z-10">System Purge</span>
                        </button>
                    </div>
                </div>

                {/* CONFIGURATION DECK */}
                <div className="lg:col-span-8">
                    
                    {/* 1. NEURAL CORE (AI) */}
                    {activeTab === 'neural_core' && (
                        <Card title="Intelligence Engine" className="bg-[#0c0c0c] border-white/5 p-10 rounded-[3rem] h-full shadow-2xl">
                             <div className="space-y-8">
                                <div className="p-6 bg-cyan-900/10 border border-cyan-500/30 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><Zap className="w-32 h-32 text-cyan-400"/></div>
                                    <div className="flex justify-between items-center relative z-10">
                                        <div>
                                            <h4 className="text-white font-bold text-lg">High-Contrast Light Theme</h4>
                                            <p className="text-xs text-gray-400 mt-1">Force UI to invert for extreme brightness visibility.</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const isLight = document.documentElement.classList.contains('high-contrast-light');
                                                if (isLight) {
                                                    document.documentElement.classList.remove('high-contrast-light');
                                                    localStorage.setItem('fitness_global_theme', 'dark');
                                                    addToast('Global theme restored to native Dark Mode.', 'success');
                                                } else {
                                                    document.documentElement.classList.add('high-contrast-light');
                                                    localStorage.setItem('fitness_global_theme', 'light');
                                                    addToast('High-contrast Light Mode activated across all apps.', 'success');
                                                }
                                            }}
                                            className="px-6 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 rounded-2xl font-black text-[10px] uppercase transition-all tracking-widest relative overflow-hidden group"
                                        >
                                            Toggle Global UI Theme
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 bg-indigo-900/10 border border-indigo-500/30 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><Terminal className="w-32 h-32 text-indigo-400"/></div>
                                    <div className="flex justify-between items-center mb-4 relative z-10">
                                        <div>
                                            <h4 className="text-white font-bold text-lg">Developer Mode</h4>
                                            <p className="text-xs text-gray-400 mt-1">Enable advanced system diagnostics and logs.</p>
                                        </div>
                                        <button 
                                            onClick={() => setDeveloperMode(!isDeveloperMode)}
                                            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase transition-all tracking-widest relative overflow-hidden group ${isDeveloperMode ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_20px_#6366f1] border border-indigo-400/50 border-dashed' : 'bg-gray-800 text-gray-500 border border-transparent'}`}
                                        >
                                            {isDeveloperMode && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
                                            <span className="relative z-10">{isDeveloperMode ? 'Dev Mode: Active' : 'Dev Mode: Inactive'}</span>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-mono">
                                        <div className={`w-2 h-2 rounded-full ${isDeveloperMode ? 'bg-indigo-500' : 'bg-gray-500'} animate-pulse`}></div>
                                        <span className={isDeveloperMode ? 'text-indigo-400' : 'text-gray-500'}>
                                            {isDeveloperMode ? 'Advanced Diagnostics Enabled' : 'Standard Mode'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 bg-green-900/10 border border-green-500/30 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><BrainCircuit className="w-32 h-32 text-green-400"/></div>
                                    <div className="flex justify-between items-center mb-4 relative z-10">
                                        <div>
                                            <h4 className="text-white font-bold text-lg">Offline-First Edge Mode</h4>
                                            <p className="text-xs text-gray-400 mt-1">Prioritize local cache and instant edge processing.</p>
                                        </div>
                                        <button 
                                            onClick={() => setSimMode(!simMode)}
                                            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase transition-all tracking-widest relative overflow-hidden group ${simMode ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-black shadow-[0_0_20px_#22c55e] border border-green-400/50 border-dashed' : 'bg-gray-800 text-gray-500 border border-transparent'}`}
                                        >
                                            {simMode && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
                                            <span className="relative z-10">{simMode ? 'Edge Mode: Active' : 'Cloud Mode: Active'}</span>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-mono">
                                        <div className={`w-2 h-2 rounded-full ${simMode ? 'bg-green-500' : 'bg-cyan-500'} animate-pulse`}></div>
                                        <span className={simMode ? 'text-green-400' : 'text-cyan-400'}>
                                            {simMode ? 'Running Local Edge Engine' : 'Connected to Fitness Future Cloud'}
                                        </span>
                                    </div>
                                </div>

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div onClick={() => setAiProvider('CORE_AI')} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${aiProvider === 'CORE_AI' ? 'border-green-500 bg-green-900/10' : 'border-gray-800 bg-black/40 hover:border-gray-600'}`}>
                                        <Globe className={`w-8 h-8 mb-4 ${aiProvider === 'CORE_AI' ? 'text-green-400' : 'text-gray-600'}`} />
                                        <h3 className="font-bold text-white">Fitness Future Cloud Core</h3>
                                        <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-wider">High-speed real-time processing.</p>
                                        
                                        {aiProvider === 'CORE_AI' && (
                                            <select 
                                                value={geminiModel}
                                                onChange={(e) => setGeminiModel(e.target.value)}
                                                className="mt-4 w-full bg-black border border-green-500/30 rounded-xl p-2 text-[10px] text-green-400 outline-none"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="gemini-4-hydrogen">Pro Engine (Flagship Speed)</option>
                                                <option value="gemini-3.1-flash-lite">Lite Engine (Ultra-Low Latency)</option>
                                            </select>
                                        )}
                                    </div>
                                    <div onClick={() => setAiProvider('HUGGING_FACE')} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${aiProvider === 'HUGGING_FACE' ? 'border-cyan-500 bg-cyan-900/10' : 'border-gray-800 bg-black/40 hover:border-gray-600'}`}>
                                        <Cloud className={`w-8 h-8 mb-4 ${aiProvider === 'HUGGING_FACE' ? 'text-cyan-400' : 'text-gray-600'}`} />
                                        <h3 className="font-bold text-white">Custom Endpoint Mode</h3>
                                        <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-wider">Optional external compute node.</p>
                                        
                                        {aiProvider === 'HUGGING_FACE' && (
                                            <select 
                                                value={geminiModel}
                                                onChange={(e) => setGeminiModel(e.target.value)}
                                                className="mt-4 w-full bg-black border border-cyan-500/30 rounded-xl p-2 text-[10px] text-cyan-400 outline-none"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="meta-llama/Meta-Llama-3-8B-Instruct">Standard Compute Profile</option>
                                                <option value="mistralai/Mixtral-8x7B-Instruct-v0.1">Balanced Compute Profile</option>
                                                <option value="deepseek-ai/deepseek-coder-6.7b-instruct">Technical Compute Profile</option>
                                            </select>
                                        )}
                                    </div>
                                </div>

                                {aiProvider === 'CORE_AI' && (
                                    <div>
                                        <p className="text-[10px] text-green-500 mt-2">Fitness Future Cloud Core is active and synchronized.</p>
                                    </div>
                                )}

                                <div className="bg-gray-900/50 p-6 rounded-3xl border border-white/5 space-y-6">
                                     <div className="text-[11px] text-gray-400">
                                         Gemini API key: <span className={integrations?.geminiAI?.connected ? 'text-green-400 font-bold' : 'text-yellow-400 font-bold'}>
                                             {integrations ? (integrations.geminiAI?.connected ? 'Configured on server' : 'Not configured on server') : (integrationsError || 'Checking…')}
                                         </span>
                                         <p className="text-[10px] text-gray-500 mt-1">AI keys are kept only on the server (Cloudflare Worker secret). They are never typed or stored in the browser.</p>
                                     </div>
                                     <div>
                                         <div className="flex justify-between items-center mb-3">
                                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                 <Activity className="w-3 h-3 text-purple-400"/> Reasoning Budget
                                             </label>
                                             <span className="text-white font-bold font-mono">{reasoningBudget}%</span>
                                         </div>
                                         <input 
                                            type="range" min="0" max="100" value={reasoningBudget} 
                                            onChange={(e) => setReasoningBudget(Number(e.target.value))}
                                            className="w-full h-2 bg-black rounded-full appearance-none cursor-pointer accent-purple-500"
                                         />
                                     </div>
                                     <div className="flex items-center justify-between">
                                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                             <Mic className="w-3 h-3 text-amber-400"/> Voice Synthesis
                                         </label>
                                         <button 
                                            onClick={() => setVoiceEnabled(!voiceEnabled)}
                                            className={`w-12 h-6 rounded-full p-1 transition-colors ${voiceEnabled ? 'bg-amber-500' : 'bg-gray-700'}`}
                                         >
                                             <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${voiceEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                         </button>
                                     </div>
                                </div>

                                <button onClick={handleSaveSmart} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black py-5 rounded-[2rem] uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-cyan-400/50 border-dashed transition-all flex items-center justify-center gap-2 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                    <RefreshCw className="w-4 h-4 relative z-10" /> <span className="relative z-10">Save & Reboot Smart Link</span>
                                </button>
                             </div>
                        </Card>
                    )}

                    {/* 2. SECURITY GRID */}
                    {activeTab === 'security_grid' && (
                        <Card title="Perimeter Defense" className="bg-[#0c0c0c] border-white/5 p-10 rounded-[3rem] h-full shadow-2xl">
                             <div className="space-y-8">
                                 <div className="bg-red-900/10 p-8 rounded-3xl border border-red-500/20 flex items-center justify-between relative overflow-hidden">
                                    <div className="absolute -right-10 -top-10 opacity-10"><Shield className="w-48 h-48 text-red-500"/></div>
                                    <div className="relative z-10">
                                        <h4 className="text-white font-bold text-xl uppercase italic">Geo-Fencing Protocol</h4>
                                        <p className="text-gray-400 text-xs mt-2 max-w-xs">Restrict admin access to physical gym location (10m radius).</p>
                                    </div>
                                    <div 
                                        onClick={() => setGeoLockEnabled(!geoLockEnabled)}
                                        className={`w-16 h-8 rounded-full p-1 cursor-pointer transition-all relative z-10 ${geoLockEnabled ? 'bg-red-600 shadow-[0_0_20px_#dc2626]' : 'bg-gray-700'}`}
                                    >
                                        <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${geoLockEnabled ? 'translate-x-8' : 'translate-x-0'}`}></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-900/50 p-6 rounded-3xl border border-white/5">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-white font-bold text-sm uppercase">Biometric Login</h4>
                                            <div 
                                                onClick={() => setBioLockEnabled(!bioLockEnabled)}
                                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${bioLockEnabled ? 'bg-indigo-500' : 'bg-gray-700'}`}
                                            >
                                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${bioLockEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                            </div>
                                        </div>
                                        <p className="text-gray-500 text-[10px] uppercase tracking-widest flex items-center gap-2">
                                            <ScanFace className="w-3 h-3"/> {bioLockEnabled ? 'Enforced' : 'Optional'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-900/50 p-6 rounded-3xl border border-white/5">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-white font-bold text-sm uppercase">Smart Encryption</h4>
                                            <div 
                                                onClick={() => setSmartEncryption(!neuralEncryption)}
                                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${neuralEncryption ? 'bg-red-500' : 'bg-gray-700'}`}
                                            >
                                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${neuralEncryption ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                            </div>
                                        </div>
                                        <p className="text-gray-500 text-[10px] uppercase tracking-widest flex items-center gap-2">
                                            <Lock className="w-3 h-3"/> {neuralEncryption ? 'Fitness Future-Safe' : 'Standard'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Latitude</label>
                                        <input value={gymLat} onChange={e => setGymLat(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-mono text-sm outline-none focus:border-red-500 transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Longitude</label>
                                        <input value={gymLng} onChange={e => setGymLng(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-mono text-sm outline-none focus:border-red-500 transition-all" />
                                    </div>
                                </div>

                                <button onClick={handleCalibrateLocation} className="w-full py-4 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-gray-600/50 border-dashed rounded-2xl text-gray-300 font-black uppercase text-[10px] tracking-widest shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all flex items-center justify-center gap-2 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                    <Crosshair className="w-4 h-4 relative z-10" /> <span className="relative z-10">Calibrate to My Location</span>
                                </button>

                                <button onClick={handleSaveSecurity} className="w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black py-5 rounded-[2rem] uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(220,38,38,0.3)] border border-red-500/50 border-dashed transition-all flex items-center justify-center gap-2 mt-auto relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                    <Lock className="w-4 h-4 relative z-10" /> <span className="relative z-10">Update Security Grid</span>
                                </button>
                             </div>
                        </Card>
                    )}

                    {/* 3. COMMS UPLINK */}
                    {activeTab === 'comms_uplink' && (
                        <Card title="Sub-Space Transceiver" className="bg-[#0c0c0c] border-white/5 p-10 rounded-[3rem] h-full shadow-2xl">
                             <div className="space-y-8">
                                <div className="p-6 bg-green-900/10 border border-green-500/20 rounded-3xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <Smartphone className="w-8 h-8 text-green-500" />
                                            <h3 className="text-xl font-black text-white italic uppercase">WhatsApp Business API</h3>
                                        </div>
                                        <div 
                                            onClick={() => setHolographicComms(!holographicComms)}
                                            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${holographicComms ? 'bg-green-500' : 'bg-gray-700'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${holographicComms ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                        </div>
                                    </div>
                                    <p className="text-gray-400 text-xs leading-relaxed">
                                        WhatsApp credentials are configured on the server by the platform owner. This page only shows whether they are set.
                                    </p>
                                    <p className="text-[9px] text-green-500 uppercase tracking-widest mt-2">
                                        {holographicComms ? 'Holographic Uplink: Enabled' : 'Standard Text Uplink'}
                                    </p>
                                </div>

                                <div className="p-6 bg-black/60 border border-white/10 rounded-2xl space-y-3">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Server integrations</p>
                                    {integrations ? (
                                        Object.entries({ whatsappBusiness: 'WhatsApp Business', geminiAI: 'Gemini AI', razorpay: 'Razorpay', googleBusinessProfile: 'Google Business Profile' }).map(([key, label]) => (
                                            <div key={key} className="flex justify-between text-xs">
                                                <span className="text-gray-300">{label}</span>
                                                <span className={integrations[key]?.connected ? 'text-green-400 font-bold' : 'text-yellow-400 font-bold'}>
                                                    {integrations[key]?.connected ? 'Configured on server' : (integrations[key]?.label || 'Not configured')}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-yellow-400">{integrationsError || 'Checking server status…'}</p>
                                    )}
                                    <p className="text-[10px] text-gray-500 leading-relaxed">
                                        Tokens (WhatsApp access token, phone number ID, Gemini key, Razorpay secret) are set by the owner with
                                        <span className="font-mono"> wrangler secret put</span>. They are never entered or saved in this browser.
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-white/5">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Test Phone Number</label>
                                    <div className="flex gap-3">
                                        <input 
                                            type="text" 
                                            value={testPhone}
                                            onChange={(e) => setTestPhone(e.target.value)}
                                            placeholder="91..."
                                            className="flex-1 bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-mono text-sm outline-none focus:border-green-500 transition-all"
                                        />
                                        <button 
                                            onClick={handleTestWhatsApp}
                                            disabled={isTestingWa}
                                            className="px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(34,197,94,0.3)] border border-green-400/50 border-dashed transition-all flex items-center gap-2 disabled:opacity-50 relative overflow-hidden group"
                                        >
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                            <span className="relative z-10 flex items-center gap-2">
                                                {isTestingWa ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                                                Check status
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <button onClick={handleSaveComms} className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white font-black py-5 rounded-[2rem] uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(22,163,74,0.3)] border border-green-500/50 border-dashed transition-all flex items-center justify-center gap-2 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                    <Zap className="w-4 h-4 relative z-10" /> <span className="relative z-10">Establish Uplink</span>
                                </button>
                             </div>
                        </Card>
                    )}

                    {/* 4. IDENTITY NODE */}
                    {activeTab === 'identity' && (
                        <Card title="Admin Identity" className="bg-[#0c0c0c] border-white/5 p-10 rounded-[3rem] h-full shadow-2xl">
                             <div className="space-y-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 bg-gray-900 rounded-[2rem] border-2 border-white/10 flex items-center justify-center shadow-lg">
                                        <User className="w-10 h-10 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Access Level</p>
                                        <h3 className="text-3xl font-black text-white italic uppercase">{currentUser?.type === 'super_admin' ? 'Super Admin' : 'Admin'}</h3>
                                        <p className="text-amber-500 font-mono text-xs mt-2">{currentUser?.type === 'super_admin' ? 'Clearance: Level 10' : 'Clearance: Level 5'}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Display Name</label>
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-bold text-lg outline-none focus:border-amber-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Smart DNA Hash</label>
                                    <input 
                                        type="text" 
                                        value={dnaHash}
                                        onChange={(e) => setDnaHash(e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-amber-500 font-mono text-xs outline-none focus:border-amber-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Google Business Email</label>
                                    <input 
                                        type="email" 
                                        value={localStorage.getItem('admin_google_business_email') || ''}
                                        onChange={(e) => localStorage.setItem('admin_google_business_email', e.target.value)}
                                        placeholder="gym@business.google.com"
                                        className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-bold text-lg outline-none focus:border-amber-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">WhatsApp Business Number</label>
                                    <input 
                                        type="tel" 
                                        value={localStorage.getItem('admin_whatsapp_business_number') || ''}
                                        onChange={(e) => localStorage.setItem('admin_whatsapp_business_number', e.target.value)}
                                        placeholder="+91 9876543210"
                                        className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-bold text-lg outline-none focus:border-amber-500 transition-all"
                                    />
                                </div>

                                <div className="bg-amber-900/10 border border-amber-500/20 p-6 rounded-3xl flex items-center justify-between">
                                    <div>
                                        <h4 className="text-white font-bold text-sm uppercase">Biometric Hash</h4>
                                        <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Last Scan: 2 mins ago</p>
                                    </div>
                                    <Fingerprint className="w-8 h-8 text-amber-500 animate-pulse" />
                                </div>
                                
                                <button className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-gray-600/50 border-dashed text-gray-300 font-black py-5 rounded-[2rem] uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all flex items-center justify-center gap-2 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                    <Save className="w-4 h-4 relative z-10" /> <span className="relative z-10">Update Credentials</span>
                                </button>
                             </div>
                        </Card>
                    )}
                </div>
            </div>

            <ConfirmationDialog 
                isOpen={isResetConfirmOpen}
                onClose={() => setIsResetConfirmOpen(false)}
                onConfirm={handleFactoryReset}
                title="System Purge Sequence"
                message="WARNING: This will wipe all local neural shards and reset the kernel to factory defaults. Proceed?"
            />
        </div>
    );
};

export default Settings;
