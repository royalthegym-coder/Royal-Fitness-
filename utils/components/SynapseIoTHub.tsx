
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Card from './common/Card';
import { NfcTouchIcon, WaterDropIcon, CrowdIcon } from './icons/SynapseIcons';
import { BotIcon } from './icons/BotIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { WifiIcon } from './icons/WifiIcon';
import { QrCodeIcon } from './icons/QrCodeIcon';
import { useData } from '../context/DataProvider';
import { 
    Thermometer, Lightbulb, Wind, Power, 
    Activity, Server, Lock, Unlock, 
    Zap, AlertTriangle, RefreshCw, Cpu,
    Fingerprint, Scan, Signal, Fan, Droplets,
    Smartphone, ShieldCheck
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis } from 'recharts';

const SynapseIoTHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'nfc' | 'water' | 'atmosphere' | 'fleet'>('nfc');
    const { systemHealth } = useData();

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="bg-[#020308] p-10 rounded-[3.5rem] border border-blue-500/30 relative overflow-hidden shadow-[0_0_120px_rgba(59,130,246,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] opacity-20"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="p-8 bg-blue-600 text-black rounded-[3rem] shadow-[0_0_60px_rgba(37,99,235,0.4)] border border-blue-400 group-hover:rotate-12 transition-transform duration-700">
                             <WifiIcon className="w-16 h-16 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-blue-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Cpu className="w-3 h-3" /> Synapse Core v31.0
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">NETWORK: MESH_STABLE</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Grid</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex bg-gray-900/80 p-2 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl overflow-x-auto no-scrollbar max-w-full gap-2">
                        {[
                            { id: 'nfc', label: 'Access Node', icon: <NfcTouchIcon /> },
                            { id: 'water', label: 'Hydro Station', icon: <WaterDropIcon /> },
                            { id: 'atmosphere', label: 'Atmosphere', icon: <Wind className="w-5 h-5"/> },
                            { id: 'fleet', label: 'Sentient Fleet', icon: <Server className="w-5 h-5"/> },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${
                                    activeTab === tab.id 
                                    ? 'bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)]' 
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <span className="text-lg">{tab.icon}</span> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="min-h-[600px] relative">
                {activeTab === 'nfc' && <NFCAccessPanel />}
                {activeTab === 'water' && <SmartWaterDispenser />}
                {activeTab === 'atmosphere' && <AtmosphereControl />}
                {activeTab === 'fleet' && <EquipmentFleet />}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: NFC Access Panel ---
const NFCAccessPanel: React.FC = () => {
    const { addAuditLog } = useData(); 
    const [isScanning, setIsScanning] = useState(false);
    const [accessGranted, setAccessGranted] = useState(false);
    const [doorStatus, setDoorStatus] = useState<'Locked' | 'Unlocked'>('Locked');
    const [log, setLog] = useState<string[]>([]);
    const [biometricScan, setBiometricScan] = useState(0);

    const handleTap = () => {
        if (isScanning || accessGranted) return;
        
        setIsScanning(true);
        setAccessGranted(false);
        setBiometricScan(0);
        setLog(prev => ["Initializing NFC Handshake...", ...prev]);
        
        // Simulating Biometric Scan
        const scanInterval = setInterval(() => {
            setBiometricScan(prev => Math.min(100, prev + 10));
        }, 100);

        setTimeout(() => {
            setLog(prev => ["Reading Token: 0x4F82A...", ...prev]);
        }, 800);

        setTimeout(() => {
            clearInterval(scanInterval);
            setBiometricScan(100);
            setIsScanning(false);
            setAccessGranted(true);
            setDoorStatus('Unlocked');
            setLog(prev => ["ACCESS GRANTED: Main Gate Open", ...prev]);
            
            addAuditLog({
                member_id: 0, 
                action: 'IoT_ACCESS',
                details: 'NFC Entry Authorized at Main Gate (Synapse Hub)'
            });
            
            setTimeout(() => {
                setAccessGranted(false);
                setDoorStatus('Locked');
            }, 5000);
            
        }, 2000);
    };

    const handleRemoteUnlock = () => {
        setDoorStatus('Unlocked');
        addAuditLog({ member_id: 0, action: 'REMOTE_UNLOCK', details: 'Admin triggered remote unlock.' });
        setTimeout(() => setDoorStatus('Locked'), 5000);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide-up">
            <Card className="bg-black border-blue-500/30 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden h-[600px] rounded-[3rem] shadow-2xl group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(37,99,235,0.1)_0%,_transparent_70%)] pointer-events-none"></div>
                
                {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                         <div className="w-[500px] h-[500px] border border-blue-500/10 rounded-full animate-ping"></div>
                         <div className="w-[400px] h-[400px] border border-blue-500/20 rounded-full animate-ping delay-75"></div>
                    </div>
                )}
                
                <div 
                    onClick={handleTap}
                    className={`w-72 h-72 rounded-full border-8 flex items-center justify-center cursor-pointer transition-all duration-500 shadow-2xl relative z-10 ${
                        accessGranted 
                        ? 'border-green-500 bg-green-500/10 shadow-[0_0_80px_#22c55e]' 
                        : isScanning 
                        ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_80px_#3b82f6] scale-95' 
                        : 'border-gray-800 bg-gray-900 hover:border-blue-500/50 hover:shadow-[0_0_40px_rgba(59,130,246,0.3)]'
                    }`}
                >
                    {accessGranted ? (
                        <div className="flex flex-col items-center animate-scale-in">
                            <CheckCircleIcon className="w-24 h-24 text-green-500 mb-4" />
                            <p className="text-green-400 font-black text-xs uppercase tracking-widest">Verified</p>
                        </div>
                    ) : isScanning ? (
                        <div className="flex flex-col items-center">
                            <Fingerprint className="w-24 h-24 text-blue-400 animate-pulse mb-4" />
                            <div className="w-32 h-1 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-100" style={{ width: `${biometricScan}%` }}></div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                             <NfcTouchIcon className="w-24 h-24 text-gray-600 group-hover:text-blue-500 transition-colors" />
                             <p className="text-gray-600 text-xs font-black uppercase tracking-widest mt-4 group-hover:text-blue-400">Touch ID</p>
                        </div>
                    )}
                </div>
                
                <h2 className="text-4xl font-black text-white uppercase italic mt-10 tracking-tighter">
                    {accessGranted ? 'WELCOME MEMBER' : isScanning ? 'ANALYZING...' : 'TAP TO ENTER'}
                </h2>
                <div className="mt-6 flex items-center gap-3 px-6 py-2 bg-gray-900 rounded-full border border-white/10">
                    {doorStatus === 'Locked' ? <Lock className="w-4 h-4 text-red-500"/> : <Unlock className="w-4 h-4 text-green-500"/>}
                    <span className={`text-xs font-black uppercase ${doorStatus === 'Locked' ? 'text-red-500' : 'text-green-500'}`}>{doorStatus}</span>
                </div>
            </Card>
            
            <div className="space-y-6">
                <Card title="Remote Command" className="bg-gray-950 border-white/5 rounded-[3rem] p-8">
                    <button 
                        onClick={handleRemoteUnlock}
                        className="w-full py-6 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-green-400 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 group"
                    >
                        <Unlock className="w-4 h-4 group-hover:rotate-12 transition-transform"/> Remote Override: Unlock
                    </button>
                    <div className="mt-8 space-y-4">
                        <div className="flex items-center justify-between p-5 bg-black/40 rounded-3xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="bg-white text-black font-black p-3 rounded-xl text-xs shadow-lg"><Smartphone className="w-4 h-4"/></div>
                                <div>
                                    <p className="text-sm font-bold text-white">Apple Wallet</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Express Mode Active</p>
                                </div>
                            </div>
                            <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e] animate-pulse"></div>
                        </div>
                         <div className="flex items-center justify-between p-5 bg-black/40 rounded-3xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-600 text-white font-black p-3 rounded-xl text-xs shadow-lg"><Scan className="w-4 h-4"/></div>
                                <div>
                                    <p className="text-sm font-bold text-white">Google Wallet</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Cloud Sync Ready</p>
                                </div>
                            </div>
                            <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e] animate-pulse"></div>
                        </div>
                    </div>
                </Card>

                <Card title="Access Log Stream" className="bg-black/80 border-gray-800 flex-1 overflow-hidden rounded-[3rem] p-0 min-h-[250px] flex flex-col">
                    <div className="flex-1 space-y-2 font-mono text-[10px] overflow-y-auto custom-scrollbar p-6 bg-[#0a0a0a]">
                         {log.map((l, i) => (
                             <div key={i} className="text-blue-400 border-b border-blue-900/20 pb-1 mb-1">
                                 <span className="text-gray-600 mr-2">{new Date().toLocaleTimeString()}</span>
                                 {l}
                             </div>
                         ))}
                         {log.length === 0 && <span className="text-gray-600 italic">Waiting for signal...</span>}
                         <div className="animate-pulse text-blue-500">_</div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Smart Water Dispenser ---
const SmartWaterDispenser: React.FC = () => {
    const [isScanning, setIsScanning] = useState(true);
    const [connected, setConnected] = useState(false);
    const [liquidType, setLiquidType] = useState<'Water' | 'BCAA' | 'Electrolytes'>('Water');
    const [amount, setAmount] = useState(500); // ml
    const [dispensing, setDispensing] = useState(false);
    const [progress, setProgress] = useState(0);

    // Auto-start scan simulation on mount
    useEffect(() => {
        if (!connected) {
            setTimeout(() => {
                setIsScanning(false);
                setConnected(true);
            }, 2000);
        }
    }, [connected]);

    const handleDispense = () => {
        setDispensing(true);
        setProgress(0);
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setDispensing(false);
                    return 100;
                }
                return prev + 2;
            });
        }, 50);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide-up">
            <Card className="bg-black border-cyan-500/30 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden rounded-[3rem] shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                {!connected ? (
                    <div className="text-center space-y-8 relative z-10">
                        <div className="w-64 h-64 bg-gray-900 rounded-full border-4 border-dashed border-cyan-500/30 flex items-center justify-center relative overflow-hidden animate-spin-slow">
                            <QrCodeIcon className="w-32 h-32 text-gray-700" />
                        </div>
                        <p className="text-cyan-400 font-bold uppercase tracking-widest animate-pulse">Scanning Hydro-Station...</p>
                    </div>
                ) : (
                    <div className="w-full max-w-sm space-y-8 relative z-10 animate-fade-in text-center">
                        <div className="bg-gray-900 p-6 rounded-[2.5rem] border border-white/10 flex items-center justify-between shadow-xl">
                            <div className="text-left">
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Connected To</p>
                                <h3 className="text-xl font-bold text-white">Hydra-Station #04</h3>
                            </div>
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {['Water', 'BCAA', 'Electrolytes'].map(type => (
                                <button 
                                    key={type}
                                    onClick={() => setLiquidType(type as any)}
                                    className={`py-4 rounded-2xl font-bold text-[10px] uppercase transition-all ${liquidType === type ? 'bg-cyan-600 text-white shadow-lg' : 'bg-gray-900 text-gray-500 hover:bg-gray-800'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        <div className="bg-gray-900 p-10 rounded-[3rem] border border-white/5 text-center relative overflow-hidden">
                             {dispensing && (
                                <div className="absolute bottom-0 left-0 w-full bg-cyan-500/20 transition-all duration-75" style={{ height: `${progress}%` }}></div>
                             )}
                            <div className="text-7xl font-black text-white italic tracking-tighter mb-4 relative z-10">{amount}<span className="text-lg text-gray-500 not-italic ml-1">ml</span></div>
                            <input 
                                type="range" min="200" max="1000" step="50" 
                                value={amount} onChange={(e) => setAmount(Number(e.target.value))}
                                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 relative z-10"
                            />
                        </div>

                        <button 
                            onClick={handleDispense}
                            disabled={dispensing}
                            className="w-full bg-cyan-500 text-black font-black py-6 rounded-[2.5rem] uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:bg-cyan-400 transition-all active:scale-95 disabled:opacity-50 relative overflow-hidden text-xs flex items-center justify-center gap-3"
                        >
                            {dispensing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Droplets className="w-4 h-4"/>}
                            {dispensing ? `DISPENSING ${progress}%` : 'DISPENSE NOW'}
                        </button>
                    </div>
                )}
            </Card>

            <Card title="Filter Diagnostics" className="bg-gray-950 border-white/5 rounded-[3rem] p-8">
                <div className="space-y-6">
                    <div className="flex justify-between items-center p-5 bg-black/40 rounded-3xl border border-white/5">
                        <div>
                            <p className="text-white font-bold text-sm">Filter Life</p>
                            <p className="text-[10px] text-green-400 font-bold uppercase">Optimal</p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-black text-white italic">82%</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center p-5 bg-black/40 rounded-3xl border border-white/5">
                         <div>
                            <p className="text-white font-bold text-sm">BCAA Tank</p>
                            <p className="text-[10px] text-amber-400 font-bold uppercase">Refill Soon</p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-black text-white italic">15%</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center p-5 bg-black/40 rounded-3xl border border-white/5">
                         <div>
                            <p className="text-white font-bold text-sm">Temp</p>
                            <p className="text-[10px] text-blue-400 font-bold uppercase">Chilled</p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-black text-white italic">4°C</p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

// --- SUB-COMPONENT: Environment & Crowd Control ---
const AtmosphereControl: React.FC = () => {
    const { activeMemberCount } = useData(); 
    const [temp, setTemp] = useState(21);
    const [aqi, setAqi] = useState(45);
    const [lightingMode, setLightingMode] = useState<'Daylight' | 'Neon' | 'Energy'>('Neon');
    
    // Live AQI Simulation
    useEffect(() => {
        const interval = setInterval(() => {
             setAqi(prev => Math.max(10, Math.min(100, prev + (Math.random() * 6 - 3))));
        }, 2000);
        return () => clearInterval(interval);
    }, []);
    
    // Distribute total active members across zones
    const zones = useMemo(() => [
        { name: 'Cardio', count: Math.floor(activeMemberCount * 0.3), capacity: 20 },
        { name: 'Iron Pit', count: Math.floor(activeMemberCount * 0.5), capacity: 30 },
        { name: 'Studio', count: Math.floor(activeMemberCount * 0.2), capacity: 15 },
    ], [activeMemberCount]);

    const totalOccupancy = Math.min(100, Math.round((activeMemberCount / 75) * 100));
    
    // Chart Data for AQI
    const aqiData = useMemo(() => Array.from({length: 10}, (_, i) => ({ time: i, val: Math.floor(Math.random() * 20 + 30) })), []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
            {/* Left: Heatmap */}
            <Card className="lg:col-span-2 bg-gray-900 border-white/5 relative overflow-hidden h-[500px] p-0 rounded-[3rem] shadow-2xl group">
                <div className="absolute inset-0 p-8">
                     <div className="w-full h-full border-4 border-gray-800 rounded-[2.5rem] relative bg-black/20">
                         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-gray-800 rounded-t-xl"></div>
                         <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black text-gray-600 uppercase tracking-widest">Main Entrance</p>

                         {/* Zones */}
                         <div className={`absolute top-6 left-6 w-1/3 h-1/2 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${zones[0].count > 15 ? 'border-red-500 bg-red-900/10' : 'border-gray-700 bg-black/40'}`}>
                             {zones[0].count > 15 && <div className="absolute inset-0 bg-red-500/20 blur-3xl opacity-50 rounded-full animate-pulse"></div>}
                             <span className="text-xs font-bold text-gray-400 z-10 mb-2">CARDIO</span>
                             <span className="text-4xl font-black text-white italic z-10">{zones[0].count}</span>
                         </div>
                         
                         <div className={`absolute top-6 right-6 w-1/2 h-2/3 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${zones[1].count > 20 ? 'border-red-500 bg-red-900/10' : 'border-gray-700 bg-black/40'}`}>
                             {zones[1].count > 20 && <div className="absolute inset-0 bg-red-500/20 blur-3xl opacity-50 rounded-full animate-pulse"></div>}
                             <span className="text-xs font-bold text-gray-400 z-10 mb-2">IRON PIT</span>
                             <span className="text-5xl font-black text-white italic z-10">{zones[1].count}</span>
                         </div>

                         <div className="absolute bottom-6 left-6 w-1/3 h-1/3 border-2 border-dashed border-gray-700 rounded-3xl flex flex-col items-center justify-center bg-black/40">
                             <span className="text-xs font-bold text-gray-400 z-10 mb-2">STUDIO</span>
                             <span className="text-3xl font-black text-white italic z-10">{zones[2].count}</span>
                         </div>
                     </div>
                </div>
                
                <div className="absolute top-8 right-8 bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex items-center gap-3 shadow-xl">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live Heatmap</span>
                </div>
            </Card>
            
            {/* Right: Controls */}
            <div className="space-y-6">
                <Card title="Atmosphere" className="bg-gray-950 border-white/5 rounded-[2.5rem] p-8">
                     <div className="space-y-8">
                         <div>
                             <div className="flex justify-between mb-4">
                                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Thermometer className="w-4 h-4"/> Temperature</p>
                                 <p className="text-3xl font-black text-white italic">{temp}°C</p>
                             </div>
                             <input type="range" min="16" max="26" value={temp} onChange={(e) => setTemp(Number(e.target.value))} className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                         </div>

                         <div>
                             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Lightbulb className="w-4 h-4"/> Mood Lighting</p>
                             <div className="grid grid-cols-3 gap-2">
                                 {['Daylight', 'Neon', 'Energy'].map(m => (
                                     <button 
                                        key={m} 
                                        onClick={() => setLightingMode(m as any)}
                                        className={`py-3 rounded-xl text-[9px] font-bold uppercase transition-all ${lightingMode === m ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-800 text-gray-500 hover:text-white'}`}
                                     >
                                         {m}
                                     </button>
                                 ))}
                             </div>
                         </div>
                     </div>
                </Card>

                <div className="p-8 bg-black border border-white/10 rounded-[2.5rem] flex flex-col justify-between h-[200px]">
                    <div className="flex justify-between items-start">
                        <div>
                             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                 <Fan className="w-3 h-3"/> Air Quality (AQI)
                             </p>
                             <p className={`text-3xl font-black italic ${aqi < 50 ? 'text-green-400' : 'text-amber-500'}`}>{aqi.toFixed(0)}</p>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${aqi < 50 ? 'bg-green-900/20 text-green-400 border-green-500/30' : 'bg-amber-900/20 text-amber-400 border-amber-500/30'}`}>
                            {aqi < 50 ? 'Excellent' : 'Moderate'}
                        </span>
                    </div>
                    
                    <div className="h-20 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={aqiData}>
                                <defs>
                                    <linearGradient id="aqiColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={aqi < 50 ? "#22c55e" : "#f59e0b"} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={aqi < 50 ? "#22c55e" : "#f59e0b"} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="val" stroke={aqi < 50 ? "#22c55e" : "#f59e0b"} strokeWidth={2} fill="url(#aqiColor)" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Equipment Fleet ---
const EquipmentFleet: React.FC = () => {
    const { addToast } = useData(); // Assuming context allows toasts, or import hook
    const machines = [
        { id: 'TRD-01', name: 'Treadmill Alpha', status: 'Online', health: 98, load: 45 },
        { id: 'TRD-02', name: 'Treadmill Beta', status: 'Maintenance', health: 45, load: 0 },
        { id: 'ELP-01', name: 'Elliptical One', status: 'Online', health: 92, load: 78 },
        { id: 'ROW-01', name: 'Rower Pro', status: 'Online', health: 88, load: 30 },
    ];

    const handleReboot = (id: string) => {
        // addToast(`Reboot sequence initiated for unit ${id}...`, "info");
        console.log(`Rebooting ${id}`);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
            {machines.map(m => (
                <Card key={m.id} className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] flex flex-col justify-between group hover:border-blue-500/30 transition-all shadow-xl">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl ${m.status === 'Online' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                                <Server className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-lg italic uppercase">{m.name}</h4>
                                <p className="text-[10px] text-gray-500 font-mono mt-1">ID: {m.id}</p>
                            </div>
                        </div>
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full border uppercase ${m.status === 'Online' ? 'text-green-400 border-green-500/20' : 'text-red-400 border-red-500/20 animate-pulse'}`}>{m.status}</span>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="text-[10px] text-gray-500 font-black uppercase">System Health</p>
                            <p className="text-xl font-black text-white italic">{m.health}%</p>
                        </div>
                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${m.health > 80 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${m.health}%` }}></div>
                        </div>
                        
                        <div className="flex justify-between items-center mt-2">
                             <p className="text-[10px] text-gray-500 font-black uppercase">Current Load</p>
                             <p className="text-white font-mono text-sm">{m.load}%</p>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                        {m.health < 100 && (
                            <button onClick={() => handleReboot(m.id)} className="text-[10px] font-bold text-cyan-400 uppercase hover:text-white flex items-center gap-2 transition-colors bg-cyan-900/10 px-4 py-2 rounded-xl border border-cyan-500/20">
                                <RefreshCw className="w-3 h-3"/> Reboot System
                            </button>
                        )}
                        {m.health === 100 && (
                            <span className="text-[10px] font-bold text-green-500 uppercase flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3"/> Optimized
                            </span>
                        )}
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default SynapseIoTHub;