
// FIX: Import `useState` from React and correct typo in import statement.
import React, { useState } from 'react';
import Card from './common/Card';
import { GYM_INFO } from '../constants';
import { View } from '../App';
import { GoogleIcon } from './icons/GoogleIcon';
import { FacebookIcon, InstagramIcon, TwitterIcon } from './icons/SocialIcons';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import Modal from './common/Modal';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { BluetoothIcon } from './icons/BluetoothIcon';
import { WifiIcon } from './icons/WifiIcon';

interface SettingsProps {
    setCurrentView: (view: View) => void;
}

// UUIDs matching the device firmware (Hypothetical defaults based on common ESP32 provisioning)
const PROVISIONING_SERVICE_UUID = '000000ff-0000-1000-8000-00805f9b34fb'; 
const WIFI_CREDENTIALS_CHAR_UUID = '0000ff01-0000-1000-8000-00805f9b34fb'; 

const IntegrationCard: React.FC<{ name: string; category: string; description: string; status: 'Active' | 'Inactive' }> = ({ name, category, description, status }) => (
    <div className="flex items-start justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600">
        <div>
            <div className="flex items-center">
                <h4 className="font-bold text-white text-lg mr-3">{name}</h4>
                <span className="text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full">{category}</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
        <div className="flex items-center">
            {status === 'Active' ? (
                <span className="flex items-center text-green-400 text-sm font-semibold">
                    <CheckCircleIcon className="w-5 h-5 mr-1" />
                    Active
                </span>
            ) : (
                <button className="text-sm bg-blue-600 hover:bg-blue-500 text-white py-1 px-3 rounded">Connect</button>
            )}
        </div>
    </div>
);

const Settings: React.FC<SettingsProps> = ({ setCurrentView }) => {
    // Simplified state, assuming connection is managed elsewhere.
    const [isConnected] = useState(true);
    const [activeTab, setActiveTab] = useState<'general' | 'integrations' | 'iot'>('general');

    // IoT Provisioning State
    const [ssid, setSsid] = useState('');
    const [password, setPassword] = useState('');
    const [provisionStatus, setProvisionStatus] = useState<'idle' | 'scanning' | 'connecting' | 'provisioning' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');

    const handleProvisionDevice = async () => {
        if (!ssid || !password) {
            alert("Please enter both SSID and Password.");
            return;
        }

        setProvisionStatus('scanning');
        setStatusMessage("Scanning for Royal Smart Devices...");

        try {
            const nav = navigator as any;
            if (!nav.bluetooth) {
                throw new Error("Web Bluetooth not supported in this browser.");
            }

            const device = await nav.bluetooth.requestDevice({
                // In a real app, use filters: [{ services: [PROVISIONING_SERVICE_UUID] }],
                acceptAllDevices: true,
                optionalServices: [PROVISIONING_SERVICE_UUID]
            });

            if (!device) throw new Error("No device selected.");

            setProvisionStatus('connecting');
            setStatusMessage("Connecting to device...");
            
            const server = await device.gatt.connect();
            
            setStatusMessage("Discovering services...");
            const service = await server.getPrimaryService(PROVISIONING_SERVICE_UUID);
            
            setStatusMessage("Locating WiFi characteristic...");
            const characteristic = await service.getCharacteristic(WIFI_CREDENTIALS_CHAR_UUID);

            setProvisionStatus('provisioning');
            setStatusMessage("Sending WiFi credentials...");

            const payload = JSON.stringify({ ssid, password });
            const encoder = new TextEncoder();
            await characteristic.writeValue(encoder.encode(payload));

            setProvisionStatus('success');
            setStatusMessage("Device Provisioned Successfully! It should now connect to WiFi.");
            
            setTimeout(() => {
                if (device.gatt.connected) device.gatt.disconnect();
            }, 2000);

        } catch (error: any) {
            console.error(error);
            setProvisionStatus('error');
            if (error.name === 'NotFoundError' || error.message.includes('cancelled')) {
                setStatusMessage("Pairing cancelled.");
            } else {
                setStatusMessage(`Error: ${error.message || "Failed to provision"}`);
            }
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-amber-400 mb-6">Settings</h1>
            
            <div className="flex space-x-4 mb-6 border-b border-gray-700 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('general')}
                    className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'general' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    General
                </button>
                <button 
                    onClick={() => setActiveTab('integrations')}
                    className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'integrations' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    Open Source Integrations
                </button>
                <button 
                    onClick={() => setActiveTab('iot')}
                    className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'iot' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    IoT Device Setup
                </button>
            </div>

            {activeTab === 'general' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Gym Information">
                        <div className="space-y-3">
                            <p><strong>Name:</strong> {GYM_INFO.name}</p>
                            <p><strong>Contact:</strong> {GYM_INFO.contact}</p>
                            <p><strong>Email:</strong> {GYM_INFO.email}</p>
                            <p><strong>Address:</strong> {GYM_INFO.address}</p>
                            <p><strong>Website:</strong> <a href={GYM_INFO.website} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">{GYM_INFO.website}</a></p>
                            <p><strong>UPI ID 1:</strong> {GYM_INFO.upiIds.gpay1}</p>
                            <p><strong>UPI ID 2:</strong> {GYM_INFO.upiIds.gpay2}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <h4 className="font-semibold text-gray-300 mb-3">Follow Us</h4>
                            <div className="flex flex-wrap items-center gap-6">
                                <a href={GYM_INFO.socials.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-300 hover:text-white transition-colors">
                                    <InstagramIcon className="w-6 h-6 mr-2" />
                                    <span>Instagram</span>
                                </a>
                                <a href={GYM_INFO.socials.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-300 hover:text-white transition-colors">
                                    <FacebookIcon className="w-6 h-6 mr-2" />
                                    <span>Facebook</span>
                                </a>
                                <a href={GYM_INFO.socials.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-300 hover:text-white transition-colors">
                                    <TwitterIcon className="w-6 h-6 mr-2 text-white" />
                                    <span>Twitter</span>
                                </a>
                                <a href={GYM_INFO.socials.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-300 hover:text-white transition-colors">
                                    <WhatsAppIcon className="w-6 h-6 mr-2 text-green-500" />
                                    <span>WhatsApp Business</span>
                                </a>
                            </div>
                        </div>
                        <button className="mt-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            Edit Information
                        </button>
                    </Card>
                    <div className="space-y-6">
                        <Card title="Application Settings">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="language" className="block text-sm font-medium text-gray-300">Language</label>
                                    <select id="language" name="language" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm">
                                        <option>English</option>
                                        <option>Hindi</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-300">Enable Email Notifications</span>
                                    <label htmlFor="notifications" className="inline-flex relative items-center cursor-pointer">
                                        <input type="checkbox" value="" id="notifications" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                    </label>
                                </div>
                            </div>
                        </Card>
                        <Card title="WhatsApp Business Connect">
                            {isConnected ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-400">Your official gym number is connected and ready to send messages.</p>
                                    <div className="p-3 bg-gray-700/50 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <p className="font-mono text-lg">{GYM_INFO.whatsappNumber}</p>
                                            <div className="flex items-center space-x-2">
                                                <span className="flex items-center text-xs text-green-400">
                                                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></span>
                                                    Active
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setCurrentView('whatsapp')}
                                        className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                                    >
                                        <WhatsAppIcon className="w-5 h-5 mr-2" />
                                        Manage WhatsApp Business
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <p className="text-sm text-gray-400 mt-1 mb-4">WhatsApp Business account is not connected.</p>
                                    <button
                                        onClick={() => setCurrentView('whatsapp')}
                                        className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                                    >
                                        <WhatsAppIcon className="w-5 h-5 mr-2" />
                                        Connect WhatsApp Business
                                    </button>
                                </div>
                            )}
                        </Card>
                        <Card title="Google Business Integration">
                            <div className="space-y-3">
                                <p className="text-gray-400">Manage your Google reviews and posts directly from the app.</p>
                                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                                    <div className="flex items-center">
                                        <GoogleIcon className="w-6 h-6 mr-3" />
                                        <p className="font-medium">Google Business Profile</p>
                                    </div>
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500 text-white">
                                        Connected
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">Connected to: {GYM_INFO.googleBusinessEmail}</p>
                            </div>
                            <button
                                onClick={() => setCurrentView('geminiHub')}
                                className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors w-full"
                            >
                                Manage on Gemini Hub
                            </button>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'integrations' && (
                <div className="space-y-6">
                    <Card title="AI & Automation Core">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <IntegrationCard 
                                name="Rasa / LangChain" 
                                category="AI Chatbot" 
                                description="Powers the 'Gemini Assistant' for natural language processing and member support." 
                                status="Active"
                            />
                            <IntegrationCard 
                                name="Alan AI / Vosk" 
                                category="Voice Command" 
                                description="Enables offline and online voice navigation and control within the app." 
                                status="Active"
                            />
                        </div>
                    </Card>
                    
                    <Card title="Health & Nutrition">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <IntegrationCard 
                                name="LogMeal / Gemini Vision" 
                                category="Nutrition Analyst" 
                                description="Analyzes food images to extract macronutrient data and calories." 
                                status="Active"
                            />
                            <IntegrationCard 
                                name="OpenFoodFacts" 
                                category="Food Database" 
                                description="Provides barcode scanning and extensive nutritional database for packaged foods." 
                                status="Active"
                            />
                             <IntegrationCard 
                                name="OptaPlanner" 
                                category="Diet Planning" 
                                description="AI Constraint Solver for generating personalized meal plans based on preferences." 
                                status="Active"
                            />
                        </div>
                    </Card>

                    <Card title="Fitness & Analytics">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <IntegrationCard 
                                name="Wger" 
                                category="Workout Tracker" 
                                description="Backend engine for workout logging, exercise database, and progression tracking." 
                                status="Active"
                            />
                            <IntegrationCard 
                                name="Grafana / Tremor" 
                                category="Visualization" 
                                description="Renders high-performance dashboards and interactive charts for gym metrics." 
                                status="Active"
                            />
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'iot' && (
                <div className="max-w-2xl mx-auto space-y-6">
                    <Card title="Provision Smart Device" className="border-2 border-blue-500/30">
                        <p className="text-gray-400 mb-6">
                            Connect your Royal Gym Smart Displays, Treadmills, or Access Control scanners to the Wi-Fi network using Bluetooth Low Energy (BLE).
                        </p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Wi-Fi SSID (Network Name)</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <WifiIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={ssid}
                                        onChange={(e) => setSsid(e.target.value)}
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-600 bg-gray-700 rounded-md py-3 text-white"
                                        placeholder="Gym_Guest_WiFi"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300">Wi-Fi Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-600 bg-gray-700 rounded-md py-3 px-4 text-white mt-1"
                                    placeholder="Enter network password"
                                />
                            </div>

                            <button
                                onClick={handleProvisionDevice}
                                disabled={provisionStatus !== 'idle' && provisionStatus !== 'error' && provisionStatus !== 'success'}
                                className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-all ${
                                    provisionStatus === 'success' ? 'bg-green-600' :
                                    provisionStatus === 'error' ? 'bg-red-600 hover:bg-red-700' :
                                    'bg-blue-600 hover:bg-blue-700'
                                } disabled:opacity-50`}
                            >
                                {provisionStatus === 'scanning' || provisionStatus === 'connecting' || provisionStatus === 'provisioning' ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        {provisionStatus === 'scanning' ? 'Scanning...' : provisionStatus === 'connecting' ? 'Connecting...' : 'Provisioning...'}
                                    </>
                                ) : provisionStatus === 'success' ? (
                                    <>
                                        <CheckCircleIcon className="w-5 h-5 mr-2" /> Provisioned!
                                    </>
                                ) : (
                                    <>
                                        <BluetoothIcon className="w-5 h-5 mr-2" /> Scan & Provision Device
                                    </>
                                )}
                            </button>

                            {statusMessage && (
                                <div className={`p-3 rounded-lg text-sm font-mono text-center ${
                                    provisionStatus === 'error' ? 'bg-red-900/30 text-red-300' : 
                                    provisionStatus === 'success' ? 'bg-green-900/30 text-green-300' : 'bg-gray-800 text-gray-300'
                                }`}>
                                    {statusMessage}
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card title="How it Works">
                        <ol className="list-decimal list-inside space-y-2 text-gray-400 text-sm">
                            <li>Power on your Royal Smart Device. It should be in pairing mode (blinking blue LED).</li>
                            <li>Enter the Wi-Fi credentials for the network you want the device to join.</li>
                            <li>Click "Scan & Provision".</li>
                            <li>Select your device from the browser's Bluetooth picker (look for "Royal_Device_...").</li>
                            <li>The app will securely send the credentials to the device.</li>
                        </ol>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Settings;
