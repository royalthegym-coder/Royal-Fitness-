
import React, { useState, useEffect, useRef } from 'react';
import Card from './common/Card';
import { GYM_INFO } from '../../constants';
import { View, Theme } from '../../types';
import { GoogleIcon } from './icons/GoogleIcon';
import { FacebookIcon, InstagramIcon, TwitterIcon } from './icons/SocialIcons';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import Modal from './common/Modal';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { BluetoothIcon } from './icons/BluetoothIcon';
import { WifiIcon } from './icons/WifiIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { SecurityLog } from '../../types';
import { KeyIcon } from './icons/KeyIcon';
import { BellIcon } from './icons/BellIcon';
import { UserIcon } from './icons/UserIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { UploadIcon } from './icons/UploadIcon';
import { BotIcon } from './icons/BotIcon';
import { BugFixIcon } from './icons/BugFixIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { SupportIcon } from './icons/SupportIcon';
import { SpeedIcon } from './icons/SpeedIcon'; // Reusing existing icon
import { useToast } from '../hooks/useToast';
import { toggleTurboMode } from '../hooks/usePerformance';

interface SettingsProps {
    setCurrentView: (view: View) => void;
    theme?: Theme;
    toggleTheme?: () => void;
    currentUser?: any;
}

// UUIDs matching the device firmware (Hypothetical defaults based on common ESP32 provisioning)
const PROVISIONING_SERVICE_UUID = '000000ff-0000-1000-8000-00805f9b34fb'; 
const WIFI_CREDENTIALS_CHAR_UUID = '0000ff01-0000-1000-8000-00805f9b34fb'; 

const IntegrationCard: React.FC<{ 
    name: string; 
    category: string; 
    description: string; 
    status: 'Active' | 'Inactive';
    onConfigure?: () => void;
}> = ({ name, category, description, status, onConfigure }) => (
    <div className="flex items-start justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600">
        <div>
            <div className="flex items-center">
                <h4 className="font-bold text-white text-lg mr-3">{name}</h4>
                <span className="text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full">{category}</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-2">
            {status === 'Active' && (
                <span className="flex items-center text-green-400 text-sm font-semibold">
                    <CheckCircleIcon className="w-5 h-5 mr-1" />
                    Active
                </span>
            )}
            {onConfigure && (
                <button 
                    onClick={onConfigure}
                    className="text-sm bg-gray-600 hover:bg-gray-500 text-white py-1 px-3 rounded transition-colors"
                >
                    Configure
                </button>
            )}
            {!onConfigure && status === 'Inactive' && (
                <button className="text-sm bg-blue-600 hover:bg-blue-500 text-white py-1 px-3 rounded">Connect</button>
            )}
        </div>
    </div>
);

const Settings: React.FC<SettingsProps> = ({ setCurrentView, theme, toggleTheme, currentUser }) => {
    const { addToast } = useToast();
    // Simplified state, assuming connection is managed elsewhere.
    const [isConnected] = useState(true);
    const [activeTab, setActiveTab] = useState<'general' | 'integrations' | 'iot' | 'security' | 'profile' | 'notifications' | 'feedback' | 'performance'>('performance');

    // IoT Provisioning State
    const [ssid, setSsid] = useState('');
    const [password, setPassword] = useState('');
    const [provisionStatus, setProvisionStatus] = useState<'idle' | 'scanning' | 'connecting' | 'provisioning' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');

    // Profile State
    const [profileName, setProfileName] = useState(currentUser?.name || '');
    const [profileEmail, setProfileEmail] = useState(currentUser?.type === 'admin' ? 'admin@royal.com' : 'user@example.com');
    const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatar || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Notification State
    const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

    // Security & Webhook Logs
    const [webhookLogs, setWebhookLogs] = useState<SecurityLog[]>([]);

    // OpenAI State
    const [isOpenAIModalOpen, setIsOpenAIModalOpen] = useState(false);
    const [openAIKey, setOpenAIKey] = useState('');

    // Feedback State
    const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('bug');
    const [feedbackTitle, setFeedbackTitle] = useState('');
    const [feedbackDesc, setFeedbackDesc] = useState('');
    const [feedbackPriority, setFeedbackPriority] = useState('Medium');
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [feedbackHistory, setFeedbackHistory] = useState([
        { id: 1, type: 'bug', title: 'Login Timeout', status: 'Resolved', date: '2024-07-20' },
        { id: 2, type: 'feature', title: 'Dark Mode Toggle', status: 'Implemented', date: '2024-07-25' }
    ]);
    
    // Performance State
    const [isTurboMode, setIsTurboMode] = useState(false);

    useEffect(() => {
        if ('Notification' in window) {
            setNotifPermission(Notification.permission);
        }
        // Load OpenAI Key
        const savedKey = localStorage.getItem('OPENAI_API_KEY');
        if (savedKey) setOpenAIKey(savedKey);
        
        // Load Turbo Mode
        setIsTurboMode(localStorage.getItem('royal_perf_mode') === 'turbo');
    }, []);

    useEffect(() => {
        // Simulate incoming webhook traffic
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                const newLog: SecurityLog = {
                    id: Date.now(),
                    event: Math.random() > 0.5 ? 'payment.success' : 'message.received',
                    source: Math.random() > 0.5 ? 'Razorpay' : 'WhatsApp',
                    status: 'Verified',
                    timestamp: new Date().toISOString(),
                    details: 'Signature: hmac_sha256 verified.'
                };
                setWebhookLogs(prev => [newLog, ...prev].slice(0, 10));
            }
        }, 8000);
        return () => clearInterval(interval);
    }, []);
    
    const handleTurboToggle = () => {
        const newState = !isTurboMode;
        setIsTurboMode(newState);
        toggleTurboMode(newState);
        addToast(newState ? "Turbo Mode Activated: Maximum Speed" : "Turbo Mode Deactivated: High Quality", 'info');
    };

    const handleProvisionDevice = async () => {
        // ... (Existing provision logic kept as is)
        if (!ssid || !password) {
            addToast("Please enter both SSID and Password.", 'error');
            return;
        }
        setProvisionStatus('scanning');
        setStatusMessage("Scanning for Royal Smart Devices...");
        try {
            const nav = navigator as any;
            if (!nav.bluetooth) throw new Error("Web Bluetooth not supported.");
            const device = await nav.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: [PROVISIONING_SERVICE_UUID] });
            if (!device) throw new Error("No device selected.");
            setProvisionStatus('connecting');
            const server = await device.gatt.connect();
            const service = await server.getPrimaryService(PROVISIONING_SERVICE_UUID);
            const characteristic = await service.getCharacteristic(WIFI_CREDENTIALS_CHAR_UUID);
            setProvisionStatus('provisioning');
            const payload = JSON.stringify({ ssid, password });
            await characteristic.writeValue(new TextEncoder().encode(payload));
            setProvisionStatus('success');
            setStatusMessage("Device Provisioned Successfully!");
            setTimeout(() => { if (device.gatt.connected) device.gatt.disconnect(); }, 2000);
        } catch (error: any) {
            console.error(error);
            setProvisionStatus('error');
            setStatusMessage(`Error: ${error.message || "Failed to provision"}`);
        }
    };

    const handleExportData = () => addToast("Preparing GDPR Data Export...", 'info');
    const handleDeleteAccount = () => { if(confirm("Are you sure?")) addToast("Account deletion request received.", 'info'); }
    const handleProfileUpdate = (e: React.FormEvent) => { e.preventDefault(); addToast("Profile updated successfully!", 'success'); };
    
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => { if (event.target?.result) setProfileAvatar(event.target.result as string); };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const requestNotificationPermission = async () => {
        if (!('Notification' in window)) return;
        const permission = await Notification.requestPermission();
        setNotifPermission(permission);
        if (permission === 'granted') new Notification("Royal Gym", { body: "Notifications enabled!" });
    };

    const sendTestNotification = () => {
        if (notifPermission === 'granted') new Notification("Royal Gym Alert", { body: "Test notification." });
        else addToast("Enable notifications first.", 'error');
    };

    const handleSaveOpenAIKey = () => {
        localStorage.setItem('OPENAI_API_KEY', openAIKey);
        setIsOpenAIModalOpen(false);
        addToast("OpenAI API Key Saved.", 'success');
    };

    const handleSubmitFeedback = (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedbackTitle.trim() || !feedbackDesc.trim()) {
            addToast("Please fill in the title and description.", 'error');
            return;
        }

        setIsSubmittingFeedback(true);
        
        // Simulate API call
        setTimeout(() => {
            const newEntry = {
                id: Date.now(),
                type: feedbackType,
                title: feedbackTitle,
                status: 'Under Review',
                date: new Date().toISOString().split('T')[0]
            };
            setFeedbackHistory(prev => [newEntry, ...prev]);
            
            // Reset form
            setFeedbackTitle('');
            setFeedbackDesc('');
            setIsSubmittingFeedback(false);
            
            addToast("Feedback submitted successfully. Thank you!", 'success');
        }, 1500);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-amber-400 mb-6">Settings</h1>
            
            <div className="flex space-x-4 mb-6 border-b border-gray-700 overflow-x-auto">
                {['performance', 'profile', 'general', 'notifications', 'security', 'integrations', 'iot', 'feedback'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)} 
                        className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap capitalize ${activeTab === tab ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        {tab === 'iot' ? 'IoT Setup' : tab}
                    </button>
                ))}
            </div>

            {/* Performance Tab (NEW) */}
            {activeTab === 'performance' && (
                <div className="max-w-2xl mx-auto space-y-6">
                    <Card title="Optimization Engine">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg border border-gray-700">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-full ${isTurboMode ? 'bg-amber-500 text-black' : 'bg-gray-700 text-gray-400'}`}>
                                    <SpeedIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">Turbo Mode</h3>
                                    <p className="text-gray-400 text-sm mt-1">
                                        Disables blur effects, shadows, and heavy animations. 
                                        <br/>Recommended for low-end devices or battery saving.
                                    </p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isTurboMode} onChange={handleTurboToggle} className="sr-only peer" />
                                <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
                            </label>
                        </div>
                    </Card>
                    
                    <Card title="Cache Management">
                         <div className="flex justify-between items-center">
                            <div>
                                <p className="font-bold text-white">Application Cache</p>
                                <p className="text-sm text-gray-400">Clear temporary data to free up memory.</p>
                            </div>
                            <button 
                                onClick={() => {
                                    localStorage.clear();
                                    sessionStorage.clear();
                                    window.location.reload();
                                }}
                                className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-900/50"
                            >
                                Clear & Reload
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="max-w-2xl mx-auto space-y-6">
                    <Card title="Edit Profile">
                        <form onSubmit={handleProfileUpdate} className="space-y-6">
                            <div className="flex flex-col items-center">
                                <div className="relative group">
                                    <img src={profileAvatar} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-gray-700" />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-amber-500 p-2 rounded-full text-gray-900 hover:bg-amber-400 transition-colors shadow-lg">
                                        <UploadIcon className="w-5 h-5" />
                                    </button>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                                    <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-amber-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                                    <input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-amber-500 outline-none" />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">Save Changes</button>
                            </div>
                        </form>
                    </Card>
                    <Card title="Appearance">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-white">App Theme</p>
                                <p className="text-sm text-gray-400">Switch between dark and light mode.</p>
                            </div>
                            {toggleTheme && (
                                <button onClick={toggleTheme} className={`p-3 rounded-lg flex items-center gap-2 font-bold transition-colors ${theme === 'dark' ? 'bg-gray-700 text-amber-400' : 'bg-gray-200 text-gray-800'}`}>
                                    {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                                </button>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Gym Information">
                        <div className="space-y-3 text-sm text-gray-300">
                            <p><strong>Name:</strong> {GYM_INFO.name}</p>
                            <p><strong>Contact:</strong> {GYM_INFO.contact}</p>
                            <p><strong>Email:</strong> {GYM_INFO.email}</p>
                            <p><strong>Address:</strong> {GYM_INFO.address}</p>
                        </div>
                    </Card>
                    <Card title="Application Settings">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
                                <div className="flex items-center"><GoogleIcon className="w-5 h-5 mr-3"/> Google Business</div>
                                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">Connected</span>
                            </div>
                            <div className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
                                <div className="flex items-center"><WhatsAppIcon className="w-5 h-5 mr-3 text-green-500"/> WhatsApp Business</div>
                                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">Connected</span>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <Card title="Push Notifications">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-full ${notifPermission === 'granted' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                <BellIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Browser Permission</h3>
                                <p className="text-sm text-gray-400">Status: <span className="uppercase font-bold">{notifPermission}</span></p>
                            </div>
                        </div>
                        {notifPermission !== 'granted' && <button onClick={requestNotificationPermission} className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg">Enable</button>}
                    </div>
                    <button onClick={sendTestNotification} disabled={notifPermission !== 'granted'} className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm w-full">Send Test Alert</button>
                </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Webhook Monitor">
                        <div className="bg-black/40 rounded-lg p-3 h-64 overflow-y-auto font-mono text-xs border border-gray-700">
                            {webhookLogs.map(log => (
                                <div key={log.id} className="mb-2 pb-2 border-b border-gray-800">
                                    <div className="flex justify-between text-gray-400"><span>{new Date(log.timestamp).toLocaleTimeString()}</span><span className="text-blue-400">{log.source}</span></div>
                                    <div className="text-green-500">[{log.event}] {log.status}</div>
                                </div>
                            ))}
                        </div>
                    </Card>
                    <Card title="Data Rights">
                        <div className="space-y-4">
                            <button onClick={handleExportData} className="w-full bg-gray-700 py-2 rounded text-white text-sm">Export Data (GDPR)</button>
                            <button onClick={handleDeleteAccount} className="w-full bg-red-900/30 text-red-300 border border-red-900 py-2 rounded text-sm">Delete Account</button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
                <div className="space-y-6">
                    <Card title="AI & Automation Core">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <IntegrationCard 
                                name="Gemini (RoyalOS)" 
                                category="Default AI" 
                                description="Primary neural engine for chat, vision, and reasoning." 
                                status="Active"
                            />
                            <IntegrationCard 
                                name="OpenAI (GPT-4)" 
                                category="Advanced LLM" 
                                description="Enable GPT-4o for enhanced creative writing and reasoning tasks." 
                                status={openAIKey ? 'Active' : 'Inactive'}
                                onConfigure={() => setIsOpenAIModalOpen(true)}
                            />
                            <IntegrationCard 
                                name="Rasa / LangChain" 
                                category="AI Chatbot" 
                                description="Powers the 'Gemini Assistant' for natural language processing." 
                                status="Active"
                            />
                            <IntegrationCard 
                                name="Alan AI" 
                                category="Voice Command" 
                                description="Enables offline and online voice navigation." 
                                status="Active"
                            />
                        </div>
                    </Card>
                    <Card title="Fitness & Analytics">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <IntegrationCard name="Wger" category="Workout Tracker" description="Workout logging database." status="Active" />
                            <IntegrationCard name="Grafana" category="Visualization" description="High-performance metric dashboards." status="Active" />
                        </div>
                    </Card>
                </div>
            )}

            {/* IoT Tab */}
            {activeTab === 'iot' && (
                <div className="max-w-2xl mx-auto space-y-6">
                    <Card title="Provision Smart Device" className="border-2 border-blue-500/30">
                        <div className="space-y-4">
                            <input type="text" value={ssid} onChange={(e) => setSsid(e.target.value)} className="block w-full bg-gray-700 border-gray-600 rounded-md py-3 px-4 text-white" placeholder="Wi-Fi SSID" />
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full bg-gray-700 border-gray-600 rounded-md py-3 px-4 text-white" placeholder="Wi-Fi Password" />
                            <button onClick={handleProvisionDevice} disabled={provisionStatus !== 'idle' && provisionStatus !== 'success'} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-md flex justify-center items-center">
                                <BluetoothIcon className="w-5 h-5 mr-2" /> {provisionStatus === 'idle' ? 'Scan & Provision' : provisionStatus}
                            </button>
                            {statusMessage && <div className="text-center text-sm text-gray-300 mt-2">{statusMessage}</div>}
                        </div>
                    </Card>
                </div>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card title="Submit Feedback">
                            <div className="flex items-center gap-2 mb-4 bg-gray-800 p-3 rounded-lg border border-gray-700">
                                <SupportIcon className="w-5 h-5 text-amber-400" />
                                <p className="text-sm text-gray-300">Found a bug or have a feature idea? Let us know directly.</p>
                            </div>
                            <form onSubmit={handleSubmitFeedback} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Feedback Type</label>
                                        <div className="flex gap-2">
                                            <button 
                                                type="button" 
                                                onClick={() => setFeedbackType('bug')}
                                                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center transition-colors ${feedbackType === 'bug' ? 'bg-red-900/40 text-red-400 border border-red-500/50' : 'bg-gray-700 text-gray-400 border border-gray-600'}`}
                                            >
                                                <BugFixIcon className="w-4 h-4 mr-2" /> Bug
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => setFeedbackType('feature')}
                                                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center transition-colors ${feedbackType === 'feature' ? 'bg-blue-900/40 text-blue-400 border border-blue-500/50' : 'bg-gray-700 text-gray-400 border border-gray-600'}`}
                                            >
                                                <SparkleIcon className="w-4 h-4 mr-2" /> Feature
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
                                        <select 
                                            value={feedbackPriority}
                                            onChange={(e) => setFeedbackPriority(e.target.value)}
                                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-amber-500 outline-none h-[42px]"
                                        >
                                            <option>Low</option>
                                            <option>Medium</option>
                                            <option>High</option>
                                            <option>Critical</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
                                    <input 
                                        type="text" 
                                        value={feedbackTitle} 
                                        onChange={(e) => setFeedbackTitle(e.target.value)}
                                        placeholder={feedbackType === 'bug' ? "e.g., App crashes on profile update" : "e.g., Add dark mode for calendar"}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                    <textarea 
                                        rows={4}
                                        value={feedbackDesc}
                                        onChange={(e) => setFeedbackDesc(e.target.value)}
                                        placeholder="Describe the issue or idea in detail..."
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                    />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button 
                                        type="submit" 
                                        disabled={isSubmittingFeedback}
                                        className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-2 px-6 rounded-lg transition-colors flex items-center disabled:opacity-50"
                                    >
                                        {isSubmittingFeedback ? 'Sending...' : 'Submit Feedback'}
                                    </button>
                                </div>
                            </form>
                        </Card>
                    </div>

                    <div className="lg:col-span-1">
                        <Card title="My Submissions">
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                                {feedbackHistory.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No submissions yet.</p>}
                                {feedbackHistory.map(item => (
                                    <div key={item.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                                item.type === 'bug' ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'
                                            }`}>
                                                {item.type}
                                            </span>
                                            <span className="text-xs text-gray-500">{item.date}</span>
                                        </div>
                                        <h4 className="font-semibold text-white text-sm mb-1 line-clamp-1">{item.title}</h4>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-xs text-gray-400">Status:</span>
                                            <span className={`text-xs font-bold ${
                                                item.status === 'Resolved' || item.status === 'Implemented' ? 'text-green-400' : 'text-yellow-400'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* OpenAI Configuration Modal */}
            <Modal isOpen={isOpenAIModalOpen} onClose={() => setIsOpenAIModalOpen(false)} title="Configure OpenAI">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <BotIcon className="w-8 h-8 text-green-400" />
                        <div>
                            <h4 className="text-white font-bold">OpenAI Integration</h4>
                            <p className="text-xs text-gray-400">Unlock GPT-4o for advanced reasoning.</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">API Key</label>
                        <input 
                            type="password" 
                            value={openAIKey} 
                            onChange={(e) => setOpenAIKey(e.target.value)} 
                            placeholder="sk-..."
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-green-500 outline-none font-mono" 
                        />
                        <p className="text-xs text-gray-500 mt-1">Your key is stored locally on this device.</p>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button onClick={() => setIsOpenAIModalOpen(false)} className="mr-2 text-gray-400 hover:text-white px-4 py-2">Cancel</button>
                        <button onClick={handleSaveOpenAIKey} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg">Save Key</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Settings;
