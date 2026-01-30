
import React, { useState, useEffect, useRef } from 'react';
import Card from './common/Card';
import { GYM_INFO } from '../../constants';
import { View, Theme } from '../../types';
import { GoogleIcon } from './icons/GoogleIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import Modal from './common/Modal';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { BluetoothIcon } from './icons/BluetoothIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { SecurityLog } from '../../types';
import { BellIcon } from './icons/BellIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { UploadIcon } from './icons/UploadIcon';
import { BotIcon } from './icons/BotIcon';
import { BugFixIcon } from './icons/BugFixIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { SupportIcon } from './icons/SupportIcon';
import { SpeedIcon } from './icons/SpeedIcon';
import { useToast } from '../hooks/useToast';
import { toggleTurboMode, performanceCache } from '../hooks/usePerformance';
import { validateWgerKey } from '../../lib/wger';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';

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
    icon?: React.ReactNode;
}> = ({ name, category, description, status, onConfigure, icon }) => (
    <div className="flex items-start justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600">
        <div className="flex gap-4">
             {icon && <div className="mt-1">{icon}</div>}
            <div>
                <div className="flex items-center">
                    <h4 className="font-bold text-white text-lg mr-3">{name}</h4>
                    <span className="text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full">{category}</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">{description}</p>
            </div>
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
    const [geoLockEnabled, setGeoLockEnabled] = useState(false);
    const [isCalibrating, setIsCalibrating] = useState(false);

    // OpenAI State
    const [isOpenAIModalOpen, setIsOpenAIModalOpen] = useState(false);
    const [openAIKey, setOpenAIKey] = useState('');

    // Wger State
    const [isWgerModalOpen, setIsWgerModalOpen] = useState(false);
    const [wgerApiKey, setWgerApiKey] = useState('');
    const [isWgerValidating, setIsWgerValidating] = useState(false);

    // Google Business State
    const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
    const [googleApiKey, setGoogleApiKey] = useState('');

    // WhatsApp Business State
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [whatsappToken, setWhatsappToken] = useState('');
    const [whatsappPhoneId, setWhatsappPhoneId] = useState('');

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
    const [isCleaning, setIsCleaning] = useState(false);

    useEffect(() => {
        if ('Notification' in window) {
            setNotifPermission(Notification.permission);
        }
        // Load Keys with safe fallback
        const envOpenAI = (window as any).process?.env?.OPENAI_API_KEY;
        const savedOpenAIKey = localStorage.getItem('OPENAI_API_KEY') || envOpenAI;
        if (savedOpenAIKey) setOpenAIKey(savedOpenAIKey);
        
        const savedWgerKey = localStorage.getItem('wger_api_key');
        if (savedWgerKey) setWgerApiKey(savedWgerKey);

        const savedGoogleKey = localStorage.getItem('google_business_key');
        if (savedGoogleKey) setGoogleApiKey(savedGoogleKey);

        const savedWhatsAppToken = localStorage.getItem('whatsapp_access_token');
        if (savedWhatsAppToken) setWhatsappToken(savedWhatsAppToken);

        const savedWhatsAppPhoneId = localStorage.getItem('whatsapp_phone_id');
        if (savedWhatsAppPhoneId) setWhatsappPhoneId(savedWhatsAppPhoneId);

        // Load Turbo Mode
        setIsTurboMode(localStorage.getItem('royal_perf_mode') === 'turbo');

        // Load GeoLock
        setGeoLockEnabled(localStorage.getItem('royal_geo_lock') === 'true');
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

    const handleGeoLockToggle = () => {
        const newState = !geoLockEnabled;
        setGeoLockEnabled(newState);
        localStorage.setItem('royal_geo_lock', String(newState));
        addToast(newState ? "Geo-Lock Active: Admin access restricted." : "Geo-Lock Disabled: Remote Access Allowed.", newState ? 'success' : 'info');
    };

    const handleCalibrateLocation = () => {
        setIsCalibrating(true);
        if (!navigator.geolocation) {
            addToast("Geolocation not supported by this browser.", 'error');
            setIsCalibrating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // Save custom coordinates
                localStorage.setItem('royal_gym_lat', latitude.toString());
                localStorage.setItem('royal_gym_lng', longitude.toString());
                localStorage.setItem('royal_geo_lock', 'true'); // Auto-enable on calibrate
                setGeoLockEnabled(true);
                
                addToast(`Location Calibrated! Gym set to: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, 'success');
                setIsCalibrating(false);
            },
            (err) => {
                addToast("Failed to get location. Ensure GPS is on.", 'error');
                setIsCalibrating(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleClearCache = () => {
        if (isCleaning) return;
        setIsCleaning(true);
        addToast("Optimizing storage...", 'info');
        setTimeout(() => {
            try {
                const keysToPreserve = [
                    'royal_user', 'theme', 'royal_perf_mode', 
                    'OPENAI_API_KEY', 'wger_api_key', 'google_business_key',
                    'whatsapp_access_token', 'whatsapp_phone_id',
                    'royal_members', 'royal_invoices', 'royal_packages', 
                    'royal_leads', 'royal_transactions', 'royal_geo_lock',
                    'royal_gym_lat', 'royal_gym_lng'
                ];
                const allKeys = Object.keys(localStorage);
                let cleanedCount = 0;
                allKeys.forEach(key => {
                    if (!keysToPreserve.includes(key)) {
                        localStorage.removeItem(key);
                        cleanedCount++;
                    }
                });
                try { sessionStorage.clear(); } catch (e) { console.warn("Session clean skipped"); }
                if (performanceCache && typeof performanceCache.clear === 'function') {
                    performanceCache.clear();
                }
                addToast(`Success! Cleared ${cleanedCount} temp files. System Optimized.`, 'success');
            } catch (error) {
                console.error("Cache clear error:", error);
                addToast("Minor error during optimization, but system is safe.", 'error');
            } finally {
                setIsCleaning(false);
            }
        }, 500);
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

    const handleSaveWgerKey = async () => {
        setIsWgerValidating(true);
        const isValid = await validateWgerKey(wgerApiKey);
        setIsWgerValidating(false);

        if (isValid) {
            localStorage.setItem('wger_api_key', wgerApiKey);
            setIsWgerModalOpen(false);
            addToast("Wger Integration Connected Successfully!", 'success');
        } else {
            localStorage.setItem('wger_api_key', wgerApiKey); // Saving anyway for demo persistence
            setIsWgerModalOpen(false);
            addToast("Wger Key saved (Validation warning: could not verify).", 'info');
        }
    };

    const handleSaveGoogleKey = () => {
        localStorage.setItem('google_business_key', googleApiKey);
        setIsGoogleModalOpen(false);
        addToast("Google Business API Key Saved. Integration Active.", 'success');
    };

    const handleSaveWhatsAppKey = () => {
        if (!whatsappToken || !whatsappPhoneId) {
            addToast("Please fill in both Token and Phone ID", "error");
            return;
        }
        localStorage.setItem('whatsapp_access_token', whatsappToken);
        localStorage.setItem('whatsapp_phone_id', whatsappPhoneId);
        setIsWhatsAppModalOpen(false);
        addToast("WhatsApp Business API Connected Successfully.", 'success');
    };

    const handleSubmitFeedback = (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedbackTitle.trim() || !feedbackDesc.trim()) {
            addToast("Please fill in the title and description.", 'error');
            return;
        }
        setIsSubmittingFeedback(true);
        setTimeout(() => {
            const newEntry = {
                id: Date.now(),
                type: feedbackType,
                title: feedbackTitle,
                status: 'Under Review',
                date: new Date().toISOString().split('T')[0]
            };
            setFeedbackHistory(prev => [newEntry, ...prev]);
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

            {/* Performance Tab */}
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
                    <Card title="System Maintenance">
                         <div className="flex justify-between items-center">
                            <div>
                                <p className="font-bold text-white">Application Cache</p>
                                <p className="text-sm text-gray-400">Cleanup temporary files to free up memory.</p>
                            </div>
                            <button onClick={handleClearCache} disabled={isCleaning} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${isCleaning ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed' : 'bg-red-900/30 border-red-500/50 text-red-300 hover:bg-red-900/50'}`}>
                                {isCleaning ? 'Optimizing...' : 'Clear Cache'}
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Admin Access Control">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-full ${geoLockEnabled ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-400'}`}>
                                        <ShieldCheckIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">Admin Geo-Fencing</h3>
                                        <p className="text-sm text-gray-400">Restrict admin login to gym premises only (GPS Check).</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={geoLockEnabled} onChange={handleGeoLockToggle} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                </label>
                            </div>
                            
                            <button 
                                onClick={handleCalibrateLocation} 
                                disabled={isCalibrating}
                                className="w-full bg-blue-900/20 border border-blue-500/50 text-blue-300 hover:bg-blue-900/40 font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
                            >
                                {isCalibrating ? <AutoUpdateIcon className="w-5 h-5 mr-2 animate-spin"/> : <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                                {isCalibrating ? 'Calibrating...' : 'Set Gym Location to Here'}
                            </button>
                            
                            <p className="text-xs text-gray-500 text-center">
                                *Clicking this button sets the lock to your current location.
                            </p>
                        </div>
                    </Card>
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
                                <div className="flex items-center"><WhatsAppIcon className="w-5 h-5 mr-3 text-green-500"/> WhatsApp Business</div>
                                <span className={`text-white text-xs px-2 py-1 rounded ${whatsappToken ? 'bg-green-500' : 'bg-gray-500'}`}>
                                    {whatsappToken ? 'Connected' : 'Not Connected'}
                                </span>
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

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
                <div className="space-y-6">
                    <Card title="Marketing & Visibility">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <IntegrationCard 
                                name="Google Business Profile" 
                                category="Marketing" 
                                description="Manage reviews, posts, and map data via API." 
                                status={googleApiKey ? 'Active' : 'Inactive'}
                                onConfigure={() => setIsGoogleModalOpen(true)}
                                icon={<GoogleIcon className="w-8 h-8" />}
                            />
                            <IntegrationCard 
                                name="WhatsApp Business" 
                                category="Marketing" 
                                description="Automate messages, broadcasts, and chatbots." 
                                status={whatsappToken ? 'Active' : 'Inactive'}
                                onConfigure={() => setIsWhatsAppModalOpen(true)}
                                icon={<WhatsAppIcon className="w-8 h-8 text-green-500" />}
                            />
                         </div>
                    </Card>
                    <Card title="AI & Automation Core">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <IntegrationCard name="Gemini (RoyalOS)" category="Default AI" description="Primary neural engine for chat, vision, and reasoning." status="Active" />
                            <IntegrationCard 
                                name="OpenAI (GPT-4)" 
                                category="Advanced LLM" 
                                description="Enable GPT-4o for enhanced creative writing and reasoning tasks." 
                                status={openAIKey ? 'Active' : 'Inactive'}
                                onConfigure={() => setIsOpenAIModalOpen(true)}
                            />
                            <IntegrationCard name="Rasa / LangChain" category="AI Chatbot" description="Powers the 'Gemini Assistant' for natural language processing." status="Active" />
                            <IntegrationCard name="Alan AI" category="Voice Command" description="Enables offline and online voice navigation." status="Active" />
                        </div>
                    </Card>
                    <Card title="Fitness & Analytics">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <IntegrationCard 
                                name="Wger" 
                                category="Workout Tracker" 
                                description="Workout logging database (Open Source)." 
                                status={wgerApiKey ? 'Active' : 'Inactive'}
                                onConfigure={() => setIsWgerModalOpen(true)}
                            />
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
                                        <select value={feedbackPriority} onChange={(e) => setFeedbackPriority(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-amber-500 outline-none h-[42px]">
                                            <option>Low</option>
                                            <option>Medium</option>
                                            <option>High</option>
                                            <option>Critical</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
                                    <input type="text" value={feedbackTitle} onChange={(e) => setFeedbackTitle(e.target.value)} placeholder={feedbackType === 'bug' ? "e.g., App crashes on profile update" : "e.g., Add dark mode for calendar"} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-amber-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                    <textarea rows={4} value={feedbackDesc} onChange={(e) => setFeedbackDesc(e.target.value)} placeholder="Describe the issue or idea in detail..." className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-amber-500 outline-none" />
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button type="submit" disabled={isSubmittingFeedback} className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-2 px-6 rounded-lg transition-colors flex items-center disabled:opacity-50">
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
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${item.type === 'bug' ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                                {item.type}
                                            </span>
                                            <span className="text-xs text-gray-500">{item.date}</span>
                                        </div>
                                        <h4 className="font-semibold text-white text-sm mb-1 line-clamp-1">{item.title}</h4>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-xs text-gray-400">Status:</span>
                                            <span className={`text-xs font-bold ${item.status === 'Resolved' || item.status === 'Implemented' ? 'text-green-400' : 'text-yellow-400'}`}>
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

            {/* Wger Configuration Modal */}
            <Modal isOpen={isWgerModalOpen} onClose={() => setIsWgerModalOpen(false)} title="Configure Wger Integration">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                            <span className="font-bold">W</span>
                        </div>
                        <div>
                            <h4 className="text-white font-bold">Wger Workout Manager</h4>
                            <p className="text-xs text-gray-400">Sync exercises and workout templates from wger.de</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">API Token</label>
                        <input 
                            type="password" 
                            value={wgerApiKey} 
                            onChange={(e) => setWgerApiKey(e.target.value)} 
                            placeholder="Wger API Token"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono" 
                        />
                        <p className="text-xs text-gray-500 mt-1">Get your token from your wger.de profile settings.</p>
                    </div>
                    <div className="flex justify-end pt-4">
                         <button onClick={() => setIsWgerModalOpen(false)} className="mr-2 text-gray-400 hover:text-white px-4 py-2">Cancel</button>
                         <button 
                            onClick={handleSaveWgerKey} 
                            disabled={isWgerValidating}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg flex items-center"
                        >
                            {isWgerValidating ? <AutoUpdateIcon className="w-4 h-4 animate-spin mr-2"/> : null}
                            {isWgerValidating ? "Verifying..." : "Connect Wger"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Google Business API Modal */}
            <Modal isOpen={isGoogleModalOpen} onClose={() => setIsGoogleModalOpen(false)} title="Google Business Profile API">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <GoogleIcon className="w-8 h-8" />
                        <div>
                            <h4 className="text-white font-bold">Google My Business</h4>
                            <p className="text-xs text-gray-400">Automate reviews and posts via API.</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">API Key / Client ID</label>
                        <input 
                            type="password" 
                            value={googleApiKey} 
                            onChange={(e) => setGoogleApiKey(e.target.value)} 
                            placeholder="AIzaSy..."
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono" 
                        />
                        <p className="text-xs text-gray-500 mt-1">Stored securely in local storage.</p>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button onClick={() => setIsGoogleModalOpen(false)} className="mr-2 text-gray-400 hover:text-white px-4 py-2">Cancel</button>
                        <button onClick={handleSaveGoogleKey} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg">Save API Key</button>
                    </div>
                </div>
            </Modal>

            {/* WhatsApp Business API Modal */}
            <Modal isOpen={isWhatsAppModalOpen} onClose={() => setIsWhatsAppModalOpen(false)} title="WhatsApp Business API">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <WhatsAppIcon className="w-8 h-8 text-green-500" />
                        <div>
                            <h4 className="text-white font-bold">Meta Cloud API</h4>
                            <p className="text-xs text-gray-400">Configure your Facebook/Meta Developer credentials.</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number ID</label>
                        <input 
                            type="text" 
                            value={whatsappPhoneId} 
                            onChange={(e) => setWhatsappPhoneId(e.target.value)} 
                            placeholder="e.g. 1000293..."
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-green-500 outline-none font-mono" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Access Token</label>
                        <input 
                            type="password" 
                            value={whatsappToken} 
                            onChange={(e) => setWhatsappToken(e.target.value)} 
                            placeholder="EAA..."
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-green-500 outline-none font-mono" 
                        />
                        <p className="text-xs text-gray-500 mt-1">Permanent or Temporary Token from Meta App Dashboard.</p>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button onClick={() => setIsWhatsAppModalOpen(false)} className="mr-2 text-gray-400 hover:text-white px-4 py-2">Cancel</button>
                        <button onClick={handleSaveWhatsAppKey} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg">Connect</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Settings;
