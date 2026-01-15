
import React, { useState } from 'react';
import Card from '../common/Card';
import { SmartWatchIcon } from '../icons/SmartWatchIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { AutoUpdateIcon } from '../icons/AutoUpdateIcon';
import { SamsungHealthIcon } from '../icons/SamsungHealthIcon';
import { GoogleIcon } from '../icons/GoogleIcon';
import { SmartRingIcon } from '../icons/SmartRingIcon';
import { SmartBandIcon } from '../icons/SmartBandIcon';
import { WatchOSIcon } from '../icons/WatchOSIcon';
import { SamsungWatchIcon } from '../icons/SamsungWatchIcon';
import { BioActiveIcon } from '../icons/BioActiveIcon';
import { HeartRateIcon, SleepIcon } from '../icons/HealthIcons';
import { CameraIcon } from '../icons/CameraIcon';
import { BotIcon } from '../icons/BotIcon';
import { AppleHealthIcon } from '../icons/AppleHealthIcon';

type DeviceType = 'platform' | 'watch' | 'band' | 'ring';

interface DeviceConfig {
    id: string;
    name: string;
    type: DeviceType;
    icon: React.ReactNode;
    connected: boolean;
    syncing: boolean;
    features: string[];
    color: string;
    hasDashboard?: boolean;
}

const GalaxyWatchDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [isRinging, setIsRinging] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);
    const [appInstalled, setAppInstalled] = useState(false);

    const handleRing = () => {
        setIsRinging(true);
        setTimeout(() => setIsRinging(false), 3000);
    };

    const handleInstall = () => {
        setIsInstalling(true);
        setTimeout(() => {
            setIsInstalling(false);
            setAppInstalled(true);
        }, 2500);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <button onClick={onBack} className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                Back to Devices
            </button>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-blue-900 to-gray-900 p-6 rounded-2xl border border-blue-500/30 shadow-xl">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <SamsungWatchIcon className="w-20 h-20 text-blue-400" />
                        <span className="absolute top-0 right-0 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-gray-900"></span>
                        </span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Galaxy Watch 6</h2>
                        <p className="text-blue-300 text-sm font-mono">MODEL: SM-R940 • BATT: 82%</p>
                        <div className="flex gap-2 mt-2">
                            <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded border border-blue-500/30">One UI 5.0 Watch</span>
                            <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded border border-green-500/30">Wear OS 4</span>
                        </div>
                    </div>
                </div>
                <div className="mt-4 md:mt-0 flex gap-3">
                    <button onClick={handleRing} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${isRinging ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}>
                        {isRinging ? 'Ringing...' : 'Find My Watch'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* BIOACTIVE SENSOR */}
                <Card className="lg:col-span-2 border-t-4 border-blue-500 bg-gray-800/80">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center">
                            <BioActiveIcon className="w-6 h-6 mr-2 text-blue-400" />
                            BioActive Sensor Analysis
                        </h3>
                        <span className="text-xs text-gray-400">Last Sync: 2m ago</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                            <p className="text-xs text-gray-400 uppercase tracking-wide">Skeletal Muscle</p>
                            <p className="text-2xl font-bold text-white mt-1">32.4 <span className="text-sm font-normal text-gray-500">kg</span></p>
                            <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2">
                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                        </div>
                        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                            <p className="text-xs text-gray-400 uppercase tracking-wide">Body Fat Mass</p>
                            <p className="text-2xl font-bold text-white mt-1">18.2 <span className="text-sm font-normal text-gray-500">kg</span></p>
                            <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2">
                                <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                        </div>
                        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                            <p className="text-xs text-gray-400 uppercase tracking-wide">Body Water</p>
                            <p className="text-2xl font-bold text-white mt-1">42.8 <span className="text-sm font-normal text-gray-500">kg</span></p>
                            <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2">
                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-red-500/20 bg-red-900/10 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-red-400 font-bold uppercase">ECG Monitor</p>
                                <p className="text-white font-semibold">Sinus Rhythm</p>
                            </div>
                            <HeartRateIcon className="w-8 h-8 text-red-500 animate-pulse" />
                        </div>
                        <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-900/10 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-purple-400 font-bold uppercase">Blood Pressure</p>
                                <p className="text-white font-semibold">118 / 78 <span className="text-xs text-gray-400">mmHg</span></p>
                            </div>
                            <div className="h-8 w-8 rounded-full border-2 border-purple-500 flex items-center justify-center text-purple-500 font-bold text-xs">BP</div>
                        </div>
                    </div>
                </Card>

                {/* SLEEP COACHING */}
                <Card className="border-t-4 border-indigo-500 bg-gray-800/80">
                    <h3 className="text-lg font-bold text-white flex items-center mb-4">
                        <SleepIcon className="w-6 h-6 mr-2 text-indigo-400" />
                        Sleep Coaching
                    </h3>
                    <div className="text-center py-4">
                        <div className="inline-block p-4 bg-indigo-900/30 rounded-full mb-3 border border-indigo-500/30">
                            <span className="text-4xl">🦁</span>
                        </div>
                        <p className="text-indigo-300 font-bold text-lg">Unconcerned Lion</p>
                        <p className="text-xs text-gray-400 mt-1">You sleep deeply but inconsistently.</p>
                    </div>
                    <div className="space-y-3 mt-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Sleep Score</span>
                            <span className="text-green-400 font-bold">85/100</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Snore Detection</span>
                            <span className="text-red-400 font-bold">12 mins</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Blood Oxygen</span>
                            <span className="text-blue-400 font-bold">96% (Min)</span>
                        </div>
                    </div>
                </Card>

                {/* TOOLS */}
                <Card title="Royal Gym Tools" className="lg:col-span-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button 
                            className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${appInstalled ? 'bg-green-900/20 border-green-500/50' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                            onClick={handleInstall}
                            disabled={appInstalled || isInstalling}
                        >
                            {isInstalling ? (
                                <AutoUpdateIcon className="w-8 h-8 text-white animate-spin mb-2" />
                            ) : appInstalled ? (
                                <CheckCircleIcon className="w-8 h-8 text-green-500 mb-2" />
                            ) : (
                                <BotIcon className="w-8 h-8 text-white mb-2" />
                            )}
                            <span className="text-sm font-bold text-white">{appInstalled ? 'Installed' : isInstalling ? 'Installing...' : 'Install Gym App'}</span>
                            <span className="text-[10px] text-gray-400 mt-1">Companion App</span>
                        </button>

                        <button className="p-4 rounded-xl border border-gray-600 bg-gray-700 hover:bg-gray-600 flex flex-col items-center justify-center transition-all group">
                            <CameraIcon className="w-8 h-8 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold text-white">Camera Controller</span>
                            <span className="text-[10px] text-gray-400 mt-1">Form Check Remote</span>
                        </button>

                        <div className="p-4 rounded-xl border border-gray-600 bg-gray-700 flex flex-col items-center justify-center">
                            <div className="flex items-center justify-center w-full mb-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            <span className="text-sm font-bold text-white">Theater Mode</span>
                            <span className="text-[10px] text-gray-400 mt-1">Silence Watch</span>
                        </div>

                        <div className="p-4 rounded-xl border border-gray-600 bg-gray-700 flex flex-col items-center justify-center">
                            <div className="text-2xl font-mono text-amber-400 font-bold mb-1">00:00</div>
                            <span className="text-sm font-bold text-white">Rest Timer</span>
                            <span className="text-[10px] text-gray-400 mt-1">Sync to Watch</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const DeviceCard: React.FC<{ 
    device: DeviceConfig; 
    onToggle: () => void; 
    onManage?: () => void;
}> = ({ device, onToggle, onManage }) => (
    <div className={`p-4 rounded-xl border transition-all duration-300 ${device.connected ? 'bg-gray-800 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'}`}>
        <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${device.color} bg-opacity-20`}>
                    {device.icon}
                </div>
                <div>
                    <h4 className="font-bold text-white text-sm">{device.name}</h4>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{device.type}</p>
                </div>
            </div>
            {/* Connection Toggle */}
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={device.connected} onChange={onToggle} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
            </label>
        </div>
        
        {device.connected && (
            <div className="pt-3 border-t border-gray-700">
                <div className="flex justify-between items-center mb-3">
                    {device.syncing ? (
                        <span className="flex items-center text-xs text-amber-400">
                            <AutoUpdateIcon className="w-3 h-3 mr-1 animate-spin" /> Syncing Data...
                        </span>
                    ) : (
                        <span className="flex items-center text-xs text-green-400">
                            <CheckCircleIcon className="w-3 h-3 mr-1" /> Connected
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                    {device.features.map((feature, i) => (
                        <span key={i} className="text-[10px] bg-gray-900 border border-gray-600 px-2 py-0.5 rounded text-gray-300">
                            {feature}
                        </span>
                    ))}
                </div>
                
                {device.hasDashboard && !device.syncing && (
                    <button 
                        onClick={onManage}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center shadow-lg"
                    >
                        <SamsungWatchIcon className="w-4 h-4 mr-2" />
                        Manage Device Features
                    </button>
                )}
            </div>
        )}
    </div>
);

const SmartWatch: React.FC = () => {
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
    const [devices, setDevices] = useState<DeviceConfig[]>([
        { 
            id: 'galaxy_watch', 
            name: 'Galaxy Watch 6', 
            type: 'watch', 
            icon: <SamsungWatchIcon className="w-6 h-6 text-blue-400"/>, 
            connected: false, 
            syncing: false,
            features: ['BIA Sensor', 'Sleep Coach', 'ECG/BP'],
            color: 'bg-blue-500',
            hasDashboard: true
        },
        { 
            id: 'apple_health', 
            name: 'Apple Health', 
            type: 'platform', 
            icon: <AppleHealthIcon className="w-6 h-6 text-red-500"/>, 
            connected: false, 
            syncing: false,
            features: ['Activity Rings', 'Heart Health', 'Sleep'],
            color: 'bg-red-500'
        },
        { 
            id: 'samsung_health', 
            name: 'Samsung Health', 
            type: 'platform', 
            icon: <SamsungHealthIcon className="w-6 h-6 text-green-500"/>, 
            connected: true, 
            syncing: false,
            features: ['All Metrics', 'Sleep', 'Workout Sync'],
            color: 'bg-green-500'
        },
        { 
            id: 'google_fit', 
            name: 'Google Fit', 
            type: 'platform', 
            icon: <GoogleIcon className="w-6 h-6"/>, 
            connected: false, 
            syncing: false,
            features: ['Steps', 'Heart Points'],
            color: 'bg-white'
        },
        { 
            id: 'apple_watch', 
            name: 'Apple Watch Ultra', 
            type: 'watch', 
            icon: <div className="text-xl">🍎</div>, 
            connected: false, 
            syncing: false,
            features: ['Activity Rings', 'Depth', 'GPS'],
            color: 'bg-red-500'
        },
        { 
            id: 'oura', 
            name: 'Oura Ring Gen3', 
            type: 'ring', 
            icon: <SmartRingIcon className="w-6 h-6 text-amber-400"/>, 
            connected: false, 
            syncing: false,
            features: ['Readiness', 'Sleep Score', 'Recovery'],
            color: 'bg-amber-500'
        },
        { 
            id: 'ultrahuman', 
            name: 'Ultrahuman Air', 
            type: 'ring', 
            icon: <SmartRingIcon className="w-6 h-6 text-orange-400"/>, 
            connected: false, 
            syncing: false,
            features: ['Metabolism', 'Movement', 'Sleep'],
            color: 'bg-orange-500'
        },
        { 
            id: 'mi_band', 
            name: 'Xiaomi Band 8', 
            type: 'band', 
            icon: <SmartBandIcon className="w-6 h-6 text-purple-400"/>, 
            connected: false, 
            syncing: false,
            features: ['Steps', 'Basic HR', 'Battery'],
            color: 'bg-purple-500'
        },
        { 
            id: 'whoop', 
            name: 'Whoop 4.0', 
            type: 'band', 
            icon: <SmartBandIcon className="w-6 h-6 text-gray-200"/>, 
            connected: false, 
            syncing: false,
            features: ['Strain', 'Recovery', 'HRV'],
            color: 'bg-gray-600'
        },
    ]);

    const toggleDevice = (id: string) => {
        setDevices(prev => prev.map(d => {
            if (d.id === id) {
                const newState = !d.connected;
                return { ...d, connected: newState, syncing: newState }; // Start syncing on connect
            }
            return d;
        }));

        // Simulate Sync finish
        const device = devices.find(d => d.id === id);
        if (device && !device.connected) {
            setTimeout(() => {
                setDevices(prev => prev.map(d => d.id === id ? { ...d, syncing: false } : d));
            }, 2500);
        }
    };

    const renderSection = (title: string, type: DeviceType, subtitle?: string) => {
        const filtered = devices.filter(d => d.type === type);
        if (filtered.length === 0) return null;
        
        return (
            <div className="mb-8">
                <div className="flex items-baseline mb-4">
                    <h3 className="text-xl font-bold text-white mr-3">{title}</h3>
                    {subtitle && <span className="text-xs text-gray-500 uppercase tracking-wide">{subtitle}</span>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map(d => (
                        <DeviceCard 
                            key={d.id}
                            device={d}
                            onToggle={() => toggleDevice(d.id)}
                            onManage={() => setSelectedDevice(d.id)}
                        />
                    ))}
                </div>
            </div>
        );
    };

    // If a specific device dashboard is active (e.g. Samsung Watch), render it
    if (selectedDevice === 'galaxy_watch') {
        return <GalaxyWatchDashboard onBack={() => setSelectedDevice(null)} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-amber-400 flex items-center">
                        <SmartWatchIcon />
                        <span className="ml-3">Wearable Connect Hub</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Sync your Smart Watches, Bands, and Rings for 360° health tracking.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full border border-gray-700">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-mono text-gray-300">HUB ONLINE</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        {renderSection("Smart Watches", 'watch', "Advanced Telemetry")}
                        {renderSection("Health Platforms", 'platform', "Data Aggregators")}
                        {renderSection("Smart Rings", 'ring', "Recovery & Sleep")}
                        {renderSection("Fitness Bands", 'band', "Activity Tracking")}
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-blue-900/40 to-gray-800 border-blue-500/30">
                        <div className="text-center py-6">
                            <h3 className="text-lg font-bold text-white mb-2">Live Sync Status</h3>
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/10 mb-4 animate-pulse relative">
                                <SamsungHealthIcon className="w-10 h-10 text-blue-400 absolute opacity-50" />
                                <AutoUpdateIcon className="w-8 h-8 text-blue-400 z-10" />
                            </div>
                            <p className="text-sm text-gray-300">Processing incoming data streams.</p>
                            <div className="mt-4 space-y-2 text-left bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Samsung Health</span>
                                    <span className="text-green-400">Connected</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Google Fit</span>
                                    <span className="text-gray-600">Offline</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Apple Health</span>
                                    <span className={devices.find(d => d.id === 'apple_health')?.connected ? "text-green-400" : "text-gray-600"}>
                                        {devices.find(d => d.id === 'apple_health')?.connected ? "Connected" : "Offline"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card title="Data Privacy">
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Your health data is encrypted locally (AES-256) and used solely to tailor your AI recommendations. 
                            We strictly adhere to <span className="text-amber-400">Samsung Health</span>, <span className="text-amber-400">Google Health Connect</span>, and <span className="text-amber-400">Apple HealthKit</span> privacy policies.
                        </p>
                        <button className="text-xs text-blue-400 mt-4 hover:underline flex items-center">
                            <CheckCircleIcon className="w-3 h-3 mr-1" /> View Data Agreement
                        </button>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SmartWatch;
