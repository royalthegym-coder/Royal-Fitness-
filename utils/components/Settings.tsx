
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import { View } from '../../types';
import { 
    Cpu, RefreshCw, Zap, Save, CheckCircle, 
    Globe, Lock, Shield, Server, Activity, 
    Smartphone, Cloud, BrainCircuit, User,
    MapPin, Radio, AlertTriangle, Trash2,
    Crosshair, Terminal, Power, Mic, ScanFace,
    Layers, Fingerprint, Database
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import ConfirmationDialog from './common/ConfirmationDialog';

interface SettingsProps {
    setCurrentView: (view: View) => void;
    currentUser?: any;
}

const Settings: React.FC<SettingsProps> = ({ setCurrentView, currentUser }) => {
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'neural_core' | 'security_grid' | 'comms_uplink' | 'identity'>('neural_core');
    
    // --- STATE MANAGEMENT ---

    // 1. Neural Core (AI)
    const [aiProvider, setAiProvider] = useState(localStorage.getItem('royal_ai_provider') || 'HUGGINGFACE');
    const [simMode, setSimMode] = useState(localStorage.getItem('royal_ai_mode') === 'SIMULATION');
    const [voiceEnabled, setVoiceEnabled] = useState(localStorage.getItem('royal_voice_enabled') !== 'false');
    const [reasoningBudget, setReasoningBudget] = useState(Number(localStorage.getItem('royal_reasoning_budget')) || 50);
    const [hfToken, setHfToken] = useState(localStorage.getItem('HUGGINGFACE_API_KEY') || '');

    // 2. Security Grid (Geo-Fencing)
    const [geoLockEnabled, setGeoLockEnabled] = useState(localStorage.getItem('royal_geo_lock') === 'true');
    const [bioLockEnabled, setBioLockEnabled] = useState(localStorage.getItem('royal_bio_lock') === 'true');
    const [gymLat, setGymLat] = useState(localStorage.getItem('royal_gym_lat') || '28.1289');
    const [gymLng, setGymLng] = useState(localStorage.getItem('royal_gym_lng') || '75.3995');

    // 3. Comms Uplink (WhatsApp)
    const [waToken, setWaToken] = useState(localStorage.getItem('whatsapp_access_token') || '');
    const [waPhoneId, setWaPhoneId] = useState(localStorage.getItem('whatsapp_phone_id') || '');

    // 4. Identity
    const [name, setName] = useState(currentUser?.name || '');

    // Danger Zone
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

    // --- ACTIONS ---

    const handleSaveNeural = () => {
        localStorage.setItem('royal_ai_provider', aiProvider);
        localStorage.setItem('royal_ai_mode', simMode ? 'SIMULATION' : 'ONLINE');
        localStorage.setItem('royal_voice_enabled', String(voiceEnabled));
        localStorage.setItem('royal_reasoning_budget', String(reasoningBudget));
        localStorage.setItem('HUGGINGFACE_API_KEY', hfToken);
        
        addToast("Neural Core Reconfigured. Rebooting Logic Layers...", "success");
        // Simulate a quick reboot effect if needed, or just toast
    };

    const handleSaveSecurity = () => {
        localStorage.setItem('royal_geo_lock', String(geoLockEnabled));
        localStorage.setItem('royal_bio_lock', String(bioLockEnabled));
        localStorage.setItem('royal_gym_lat', gymLat);
        localStorage.setItem('royal_gym_lng', gymLng);
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
        localStorage.setItem('whatsapp_access_token', waToken);
        localStorage.setItem('whatsapp_phone_id', waPhoneId);
        addToast("Sub-Space Communication Channels Synced.", "success");
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
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">VER: 31.0.0</span>
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
                                { id: 'neural_core', label: 'Neural Core (AI)', icon: <BrainCircuit className="w-5 h-5"/>, color: 'text-cyan-400', border: 'border-cyan-500/20' },
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
                            className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <Trash2 className="w-4 h-4" /> System Purge
                        </button>
                    </div>
                </div>

                {/* CONFIGURATION DECK */}
                <div className="lg:col-span-8">
                    
                    {/* 1. NEURAL CORE (AI) */}
                    {activeTab === 'neural_core' && (
                        <Card title="Intelligence Engine" className="bg-[#0c0c0c] border-white/5 p-10 rounded-[3rem] h-full shadow-2xl">
                             <div className="space-y-8">
                                <div className="p-6 bg-blue-900/10 border border-blue-500/30 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><BrainCircuit className="w-32 h-32 text-blue-400"/></div>
                                    <div className="flex justify-between items-center mb-4 relative z-10">
                                        <div>
                                            <h4 className="text-white font-bold text-lg">Cost Control Mode</h4>
                                            <p className="text-xs text-gray-400 mt-1">Force Simulation to prevent API charges.</p>
                                        </div>
                                        <button 
                                            onClick={() => setSimMode(!simMode)}
                                            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase transition-all tracking-widest ${simMode ? 'bg-green-500 text-black shadow-[0_0_20px_#22c55e]' : 'bg-gray-800 text-gray-500'}`}
                                        >
                                            {simMode ? 'Simulation: Active' : 'Online: Active'}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-mono">
                                        <div className={`w-2 h-2 rounded-full ${simMode ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                                        <span className={simMode ? 'text-green-400' : 'text-red-400'}>
                                            {simMode ? 'Running Local Heuristics (Free)' : 'Connected to Hugging Face/OpenAI (Cloud)'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div onClick={() => setAiProvider('HUGGINGFACE')} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${aiProvider === 'HUGGINGFACE' || aiProvider === 'GEMINI' ? 'border-blue-500 bg-blue-900/10' : 'border-gray-800 bg-black/40 hover:border-gray-600'}`}>
                                        <Globe className={`w-8 h-8 mb-4 ${aiProvider === 'HUGGINGFACE' || aiProvider === 'GEMINI' ? 'text-blue-400' : 'text-gray-600'}`} />
                                        <h3 className="font-bold text-white">Hugging Face</h3>
                                        <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-wider">Open Source Models. Free Tier.</p>
                                    </div>
                                    <div onClick={() => setAiProvider('OPENAI')} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${aiProvider === 'OPENAI' ? 'border-green-500 bg-green-900/10' : 'border-gray-800 bg-black/40 hover:border-gray-600'}`}>
                                        <Cloud className={`w-8 h-8 mb-4 ${aiProvider === 'OPENAI' ? 'text-green-400' : 'text-gray-600'}`} />
                                        <h3 className="font-bold text-white">OpenAI (GPT-4)</h3>
                                        <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-wider">Requires External Key.</p>
                                    </div>
                                </div>

                                {aiProvider === 'HUGGINGFACE' && (
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Hugging Face Token (Optional for Free Tier)</label>
                                        <input 
                                            type="password" 
                                            value={hfToken}
                                            onChange={(e) => setHfToken(e.target.value)}
                                            placeholder="hf_..."
                                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-mono text-sm outline-none focus:border-blue-500 transition-all"
                                        />
                                        <p className="text-[10px] text-gray-500 mt-2">Get a free token at huggingface.co/settings/tokens</p>
                                    </div>
                                )}

                                <div className="bg-gray-900/50 p-6 rounded-3xl border border-white/5 space-y-6">
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

                                <button onClick={handleSaveNeural} className="w-full bg-white text-black font-black py-5 rounded-[2rem] uppercase tracking-widest text-xs shadow-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-2">
                                    <RefreshCw className="w-4 h-4" /> Save & Reboot Neural Link
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

                                <div className="bg-gray-900/50 p-6 rounded-3xl border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                         <h4 className="text-white font-bold text-sm uppercase">Biometric Login Lock</h4>
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

                                <button onClick={handleCalibrateLocation} className="w-full py-4 bg-gray-900 border border-white/10 rounded-2xl text-gray-400 font-bold uppercase text-[10px] tracking-widest hover:text-white hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                                    <Crosshair className="w-4 h-4" /> Calibrate to My Location
                                </button>

                                <button onClick={handleSaveSecurity} className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-5 rounded-[2rem] uppercase tracking-widest text-xs shadow-xl transition-all flex items-center justify-center gap-2 mt-auto">
                                    <Lock className="w-4 h-4" /> Update Security Grid
                                </button>
                             </div>
                        </Card>
                    )}

                    {/* 3. COMMS UPLINK */}
                    {activeTab === 'comms_uplink' && (
                        <Card title="Sub-Space Transceiver" className="bg-[#0c0c0c] border-white/5 p-10 rounded-[3rem] h-full shadow-2xl">
                             <div className="space-y-8">
                                <div className="p-6 bg-green-900/10 border border-green-500/20 rounded-3xl">
                                    <div className="flex items-center gap-4 mb-4">
                                        <Smartphone className="w-8 h-8 text-green-500" />
                                        <h3 className="text-xl font-black text-white italic uppercase">WhatsApp Business API</h3>
                                    </div>
                                    <p className="text-gray-400 text-xs leading-relaxed">
                                        Configure your Meta Developer credentials here to enable automated alerts, fee reminders, and the AI chatbot.
                                    </p>
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

                                <button onClick={handleSaveComms} className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-5 rounded-[2rem] uppercase tracking-widest text-xs shadow-xl transition-all flex items-center justify-center gap-2">
                                    <Zap className="w-4 h-4" /> Establish Uplink
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
                                        <h3 className="text-3xl font-black text-white italic uppercase">Super Admin</h3>
                                        <p className="text-amber-500 font-mono text-xs mt-2">Clearance: Level 10</p>
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

                                <div className="bg-amber-900/10 border border-amber-500/20 p-6 rounded-3xl flex items-center justify-between">
                                    <div>
                                        <h4 className="text-white font-bold text-sm uppercase">Biometric Hash</h4>
                                        <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Last Scan: 2 mins ago</p>
                                    </div>
                                    <Fingerprint className="w-8 h-8 text-amber-500 animate-pulse" />
                                </div>
                                
                                <button className="w-full bg-gray-900 border border-white/10 text-gray-300 font-black py-5 rounded-[2rem] uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2">
                                    <Save className="w-4 h-4" /> Update Credentials
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
