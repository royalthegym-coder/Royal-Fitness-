
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Card from './common/Card';
import { INITIAL_MEMBERS, INITIAL_BROADCASTS, GYM_INFO, INITIAL_PACKAGES } from '../constants';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { BroadcastMessage, Member, ChatMessage } from '../types';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { ChatIcon } from './icons/ChatIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BusinessIcon } from './icons/BusinessIcon';
import { CheckIcon } from './icons/CheckIcon';
import { HandWaveIcon } from './icons/HandWaveIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { getComplexResponse, getGeminiChatResponse } from '../lib/gemini';
import { SupportIcon } from './icons/SupportIcon';
import Modal from './common/Modal';

type Tab = 'broadcast' | 'automations' | 'ai_care' | 'analytics' | 'account' | 'welcome';

// Helper function to calculate expiry date
const getExpiryDate = (joinDateStr: string, packageId: number): Date | null => {
    const pkg = INITIAL_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return null;

    const joinDate = new Date(joinDateStr);
    let monthsToAdd = 0;
    const durationParts = pkg.duration.split(' ');
    
    if (durationParts[0].toLowerCase() === 'first') {
        monthsToAdd = 1;
    } else {
        monthsToAdd = parseInt(durationParts[0], 10);
    }

    if (isNaN(monthsToAdd)) return null;

    joinDate.setMonth(joinDate.getMonth() + monthsToAdd);
    return joinDate;
};


// Sub-component for Broadcast Tab
const Broadcast: React.FC = () => {
    const [message, setMessage] = useState('');
    const [audience, setAudience] = useState<'all' | 'active' | 'expired'>('all');
    const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>(INITIAL_BROADCASTS);
    const [showSuccess, setShowSuccess] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const consentedMembers = useMemo(() => INITIAL_MEMBERS.filter(m => m.whatsappConsent), []);

    const targetMembers = useMemo(() => {
        let members = consentedMembers;
        if (audience === 'active') return members.filter(m => m.status === 'Active');
        if (audience === 'expired') return members.filter(m => m.status === 'Expired');
        return members;
    }, [consentedMembers, audience]);

    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    const handleGenerateMessage = async () => {
        if (!aiTopic.trim()) return;
        setIsGenerating(true);
        setMessage(''); // Clear previous message

        const prompt = `
            You are a marketing assistant for a gym named "${GYM_INFO.name}".
            Write a short, engaging, and professional WhatsApp Business broadcast message for gym members about the following topic: "${aiTopic}".
            Include a friendly tone and a call to action if appropriate. The message should be concise and suitable for a mobile notification.
        `;

        try {
            const generatedMessage = await getComplexResponse(prompt);
            setMessage(generatedMessage);
        } catch (error) {
            console.error("Failed to generate message:", error);
            setMessage("Sorry, I couldn't generate a message. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendBroadcast = () => {
        if (!message.trim()) return;
        const newBroadcast: BroadcastMessage = {
            id: Math.max(0, ...broadcasts.map(b => b.id)) + 1,
            message, audience, recipientCount: targetMembers.length,
            sentAt: new Date().toISOString().split('T')[0],
        };
        setBroadcasts([newBroadcast, ...broadcasts]);
        setShowSuccess(true);
        setMessage('');
        setAiTopic('');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card title="Compose WhatsApp Business Broadcast">
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-700/50 rounded-lg mb-4">
                            <h4 className="flex items-center text-sm font-semibold text-amber-400 mb-2">
                                <SparkleIcon className="w-4 h-4 mr-2" />
                                AI Content Assistant
                            </h4>
                            <p className="text-xs text-gray-400 mb-2">Describe the broadcast topic, and let Gemini write the message for you.</p>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={aiTopic}
                                    onChange={(e) => setAiTopic(e.target.value)}
                                    placeholder="e.g., 20% off annual memberships"
                                    className="flex-1 bg-gray-800 p-2 rounded text-sm border border-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    disabled={isGenerating}
                                />
                                <button 
                                    onClick={handleGenerateMessage}
                                    disabled={isGenerating || !aiTopic.trim()}
                                    className="bg-blue-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-gray-600 flex items-center"
                                >
                                    {isGenerating ? 'Generating...' : 'Generate'}
                                </button>
                            </div>
                        </div>

                        <textarea id="message" rows={6}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-amber-500"
                            placeholder="Type your announcement..." value={message} onChange={(e) => setMessage(e.target.value)} />
                        <select id="audience" value={audience} onChange={(e) => setAudience(e.target.value as any)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-amber-500">
                            <option value="all">All ({consentedMembers.length})</option>
                            <option value="active">Active ({consentedMembers.filter(m => m.status === 'Active').length})</option>
                            <option value="expired">Expired ({consentedMembers.filter(m => m.status === 'Expired').length})</option>
                        </select>
                         <div className="flex justify-end items-center">
                            {showSuccess && <span className="text-green-400 text-sm mr-4">Broadcast sent!</span>}
                            <button onClick={handleSendBroadcast} disabled={!message.trim()} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-400 flex items-center disabled:bg-gray-600">
                                <WhatsAppIcon className="w-5 h-5 mr-2" /> Send via WhatsApp Business
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
            <div>
                <Card title="Consent Status">
                    <div className="text-center">
                        <p className="text-6xl font-bold text-amber-400">{consentedMembers.length}</p>
                        <p className="text-gray-400">members have consented.</p>
                    </div>
                </Card>
            </div>
            <div className="lg:col-span-3">
                <Card title="Broadcast History">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-700 text-gray-400">
                                    <th className="p-3">Date</th><th className="p-3">Message</th><th className="p-3">Audience</th><th className="p-3">Recipients</th>
                                </tr>
                            </thead>
                            <tbody>
                                {broadcasts.map(b => (
                                    <tr key={b.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="p-3 text-sm">{b.sentAt}</td><td className="p-3 text-sm">{b.message}</td>
                                        <td className="p-3 capitalize">{b.audience}</td><td className="p-3 text-center">{b.recipientCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const AutomationCard: React.FC<{ title: string; description: string; enabled?: boolean; onToggle?: () => void; children?: React.ReactNode }> = ({ title, description, enabled, onToggle, children }) => {
    return (
        <Card>
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="text-lg font-semibold text-amber-400">{title}</h4>
                    <p className="text-sm text-gray-400 mt-1">{description}</p>
                </div>
                {onToggle && (
                    <label className="inline-flex relative items-center cursor-pointer">
                        <input type="checkbox" checked={enabled} onChange={onToggle} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                )}
            </div>
            {children}
        </Card>
    );
};

// Modal for sending payment reminders
interface PaymentReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    members: Member[];
    onSend: () => void;
}
const PaymentReminderModal: React.FC<PaymentReminderModalProps> = ({ isOpen, onClose, members, onSend }) => {
    const defaultMessage = `Dear {{memberName}},\n\nA friendly reminder from Royal The Gym that your membership payment is due in 3 days. Please renew on time to continue your fitness journey without interruption.\n\nThank you!`;
    const [message, setMessage] = useState(defaultMessage);

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Send Payment Reminders">
            <div className="space-y-4">
                <p>You are about to send a WhatsApp Business reminder to <strong className="text-amber-400">{members.length}</strong> member(s):</p>
                <ul className="text-sm list-disc list-inside bg-gray-700/50 p-3 rounded-md max-h-40 overflow-y-auto">
                    {members.map(m => <li key={m.id}>{m.name}</li>)}
                </ul>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Message Template</label>
                    <textarea 
                        rows={6}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-amber-500"
                    />
                     <p className="text-xs text-gray-500 mt-1">`{`{{memberName}}`}` will be replaced automatically.</p>
                </div>
                <div className="flex justify-end items-center pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 mr-2">Cancel</button>
                    <button onClick={onSend} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-400 flex items-center">
                        <WhatsAppIcon className="w-5 h-5 mr-2" /> Send Reminders
                    </button>
                </div>
            </div>
        </Modal>
    );
}


// Interactive card for Payment Reminders
const PaymentReminderAutomation: React.FC = () => {
    const [enabled, setEnabled] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [eligibleMembers, setEligibleMembers] = useState<Member[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleFindMembers = () => {
        setIsChecking(true);
        
        const targetDate = new Date();
        targetDate.setDate(new Date().getDate() + 3);
        targetDate.setHours(0, 0, 0, 0);

        const membersDue = INITIAL_MEMBERS.filter(member => {
            if (member.status !== 'Active' || !member.whatsappConsent) return false;
            
            const expiryDate = getExpiryDate(member.joinDate, member.packageId);
            if (!expiryDate) return false;

            expiryDate.setHours(0, 0, 0, 0);
            return expiryDate.getTime() === targetDate.getTime();
        });

        setEligibleMembers(membersDue);
        setIsModalOpen(true);
        setIsChecking(false);
    };
    
    const handleSendReminders = () => {
        // In a real app, this would trigger an API call.
        console.log("Sending reminders to:", eligibleMembers.map(m => m.name));
        setIsModalOpen(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };


    return (
        <>
            <AutomationCard 
                title="Payment Due Reminders"
                description="Automatically find members whose payment is due in the next 3 days and send them a WhatsApp Business reminder."
                enabled={enabled}
                onToggle={() => setEnabled(!enabled)}
            >
                {enabled && (
                    <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                         {showSuccess && <span className="text-green-400 text-sm">Reminders sent successfully!</span>}
                        <button
                            onClick={handleFindMembers}
                            disabled={isChecking}
                            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-gray-600"
                        >
                            {isChecking ? 'Checking...' : 'Find & Notify Members'}
                        </button>
                    </div>
                )}
            </AutomationCard>
            <PaymentReminderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                members={eligibleMembers}
                onSend={handleSendReminders}
            />
        </>
    );
};


const Automations: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PaymentReminderAutomation />
        <AutomationCard title="Birthday Wishes" description="Send a personalized birthday greeting to members on their special day." />
        <AutomationCard title="Feedback Request" description="Ask members for feedback one month after they join to improve services." />
        <AutomationCard title="Inactive Member Follow-up" description="Send a message to members who haven't checked in for 14 days." />
    </div>
);


const AICustomerCare: React.FC = () => {
    const [selectedMember, setSelectedMember] = useState<Member | null>(INITIAL_MEMBERS.find(m => m.whatsappConsent) || null);
    const [conversations, setConversations] = useState<{ [key: number]: ChatMessage[] }>({
        1: [{ role: 'model', text: 'Hello Aarav! How can I help you today?' }],
    });
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [aiEnabled, setAiEnabled] = useState(true);
    const chatBodyRef = useRef<HTMLDivElement>(null);

    const consentedMembers = useMemo(() => INITIAL_MEMBERS.filter(m => m.whatsappConsent), []);
    
    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [conversations, selectedMember]);

    const systemPrompt = `
        You are a friendly, professional, and helpful customer care executive for a gym named "${GYM_INFO.name}".
        Your goal is to assist gym members with their questions.
        You have access to the following information about the gym:
        - Name: ${GYM_INFO.name}
        - Contact Number: ${GYM_INFO.contact}
        - Email: ${GYM_INFO.email}
        - Address: ${GYM_INFO.address}
        - Website: ${GYM_INFO.website}
        - Membership Packages: ${JSON.stringify(INITIAL_PACKAGES.map(p => ({ name: p.name, price: p.price, duration: p.duration })))}

        Rules:
        - Keep your responses concise and to the point.
        - If you don't know the answer, politely say you need to check with a human manager.
        - Use the provided information to answer questions about pricing, location, contact, etc.
    `;

    const handleSendMessage = async () => {
        if (!currentMessage.trim() || !selectedMember) return;
        
        const userMessage: ChatMessage = { role: 'user', text: currentMessage };
        const currentHistory = conversations[selectedMember.id] || [];
        const updatedHistory = [...currentHistory, userMessage];

        setConversations(prev => ({ ...prev, [selectedMember.id]: updatedHistory }));
        setCurrentMessage('');

        if (aiEnabled) {
            setIsLoading(true);
            const aiResponseText = await getGeminiChatResponse(updatedHistory, currentMessage, systemPrompt);
            const aiMessage: ChatMessage = { role: 'model', text: aiResponseText };
            
            setConversations(prev => ({
                ...prev,
                [selectedMember.id]: [...updatedHistory, aiMessage]
            }));
            setIsLoading(false);
        }
    };
    
    const currentConversation = selectedMember ? (conversations[selectedMember.id] || []) : [];

    return (
        <Card>
            <div className="flex h-[70vh]">
                <div className="w-1/3 border-r border-gray-700 overflow-y-auto">
                    {consentedMembers.map(member => (
                        <button key={member.id} onClick={() => setSelectedMember(member)}
                            className={`w-full text-left p-3 flex items-center ${selectedMember?.id === member.id ? 'bg-amber-500/20' : 'hover:bg-gray-700/50'}`}>
                            <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full mr-3"/>
                            <div>
                                <p className="font-semibold">{member.name}</p>
                                <p className="text-xs text-gray-400">{member.phone}</p>
                            </div>
                        </button>
                    ))}
                </div>
                <div className="w-2/3 flex flex-col">
                    {selectedMember ? (
                        <>
                            <div className="p-3 border-b border-gray-700 flex justify-between items-center">
                                <p className="font-bold text-lg">{selectedMember.name}</p>
                                <div className="flex items-center">
                                    <span className={`text-xs mr-2 ${aiEnabled ? 'text-green-400' : 'text-gray-500'}`}>{aiEnabled ? 'AI Active' : 'AI Inactive'}</span>
                                    <label className="inline-flex relative items-center cursor-pointer">
                                        <input type="checkbox" checked={aiEnabled} onChange={() => setAiEnabled(!aiEnabled)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                    </label>
                                </div>
                            </div>
                            <div ref={chatBodyRef} className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-800/50">
                                {currentConversation.map((msg, index) => (
                                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-green-800 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                            <p className="text-sm">{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                     <div className="flex justify-start">
                                        <div className="bg-gray-700 text-gray-200 p-3 rounded-lg">
                                           <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                                                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse delay-75"></div>
                                                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse delay-150"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-2 border-t border-gray-700 flex items-center">
                                <input type="text" placeholder={`Message ${selectedMember.name}...`}
                                    value={currentMessage}
                                    onChange={(e) => setCurrentMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="w-full bg-gray-700 rounded-full px-4 py-2 focus:outline-none flex-1" />
                                <button onClick={handleSendMessage} disabled={isLoading || !currentMessage.trim()} className="ml-2 bg-green-500 text-white p-2 rounded-full disabled:bg-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                </button>
                            </div>
                        </>
                    ) : <div className="flex items-center justify-center h-full text-gray-500">Select a member to view chat</div>}
                </div>
            </div>
        </Card>
    );
};


const Analytics: React.FC = () => {
    const data = [
        { name: 'Week 1', sent: 30 }, { name: 'Week 2', sent: 50 }, { name: 'Week 3', sent: 25 }, { name: 'Week 4', sent: 60 }
    ];
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Messages Sent (Month)"><p className="text-4xl font-bold">165</p></Card>
                <Card title="Delivery Rate"><p className="text-4xl font-bold text-green-400">98.2%</p></Card>
                <Card title="Read Rate (Est.)"><p className="text-4xl font-bold text-blue-400">85.6%</p></Card>
            </div>
            <Card title="Weekly Message Volume">
                <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis dataKey="name" stroke="#A0AEC0" />
                            <YAxis stroke="#A0AEC0" />
                            <Tooltip contentStyle={{ backgroundColor: '#1A202C' }} />
                            <Bar dataKey="sent" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};

const Account: React.FC = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
            <Card title="Account Details">
                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-400">Account Name</p>
                        <p className="font-semibold">Royal The Gym Official</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Phone Number</p>
                        <p className="font-semibold font-mono">{GYM_INFO.whatsappNumber}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Status</p>
                        <div className="flex items-center">
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                            <p className="font-semibold text-green-400">Connected</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Quality Rating</p>
                        <p className="font-semibold text-green-400">High</p>
                    </div>
                    <div className="pt-4 border-t border-gray-700 space-y-2">
                        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-3 rounded-lg text-sm">Manage Account</button>
                        <button className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg text-sm">Disconnect</button>
                    </div>
                </div>
            </Card>
        </div>
        <div className="lg:col-span-2">
            <Card title="Message Templates">
                <div className="space-y-3">
                    {['welcome_message', 'renewal_reminder', 'birthday_greeting', 'special_offer'].map(template => (
                        <div key={template} className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-mono text-amber-400">{template}</p>
                                <p className="text-xs text-gray-400">Category: Marketing</p>
                            </div>
                            <div className="flex items-center text-xs text-green-400">
                                <CheckIcon className="w-4 h-4 mr-1"/> Approved
                            </div>
                        </div>
                    ))}
                </div>
                 <button className="mt-4 w-full bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-3 rounded-lg text-sm">
                    Create New Template
                </button>
            </Card>
        </div>
    </div>
);

const WelcomeMessage: React.FC = () => {
    const [isEnabled, setIsEnabled] = useState(false);
    const [template, setTemplate] = useState(`Welcome {{memberName}}! We are thrilled to have you join {{gymName}}. Let us know if you have any questions.`);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSave = () => {
        // In a real app, this would save to a backend.
        console.log("Saving welcome message template:", template);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const previewMessage = template
        .replace('{{memberName}}', 'Aarav Sharma')
        .replace('{{gymName}}', GYM_INFO.name);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h4 className="text-lg font-semibold text-amber-400">Automated Welcome Message</h4>
                        <p className="text-sm text-gray-400 mt-1">Send a friendly greeting to new members as soon as they're added.</p>
                    </div>
                    <label className="inline-flex relative items-center cursor-pointer">
                        <input type="checkbox" checked={isEnabled} onChange={() => setIsEnabled(!isEnabled)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                </div>
                <div className={`space-y-4 transition-opacity ${isEnabled ? 'opacity-100' : 'opacity-50'}`}>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Message Template</label>
                        <textarea
                            rows={5}
                            value={template}
                            onChange={(e) => setTemplate(e.target.value)}
                            disabled={!isEnabled}
                            className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-amber-500 disabled:cursor-not-allowed"
                        />
                        {/* FIX: Correct JSX syntax for rendering string literals in `<code>` tags. */}
                        <p className="text-xs text-gray-500 mt-1">Use <code className="bg-gray-600 p-1 rounded-sm text-xs">{`{{memberName}}`}</code> and <code className="bg-gray-600 p-1 rounded-sm text-xs">{`{{gymName}}`}</code> for personalization.</p>
                    </div>
                    <div className="flex justify-end items-center">
                        {showSuccess && <span className="text-green-400 text-sm mr-4">Template saved!</span>}
                        <button onClick={handleSave} disabled={!isEnabled} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 disabled:bg-gray-600">
                            Save Template
                        </button>
                    </div>
                </div>
            </Card>
             <Card title="Message Preview">
                <div className="bg-gray-900 p-4 rounded-lg">
                    <div className="flex justify-start">
                        <div className="bg-gray-700 p-3 rounded-lg max-w-sm">
                            <p className="text-sm">{previewMessage}</p>
                            <p className="text-xs text-gray-400 text-right mt-1">10:01 AM</p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};


const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; icon: React.ReactNode }> = ({ label, isActive, onClick, icon }) => (
    <button onClick={onClick} className={`flex items-center shrink-0 whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm ${isActive ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
        {icon} <span className="ml-2">{label}</span>
    </button>
);

const WhatsAppIntegration: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('automations');

    const renderContent = () => {
        switch (activeTab) {
            case 'broadcast': return <Broadcast />;
            case 'welcome': return <WelcomeMessage />;
            case 'automations': return <Automations />;
            case 'ai_care': return <AICustomerCare />;
            case 'analytics': return <Analytics />;
            case 'account': return <Account />;
            default: return null;
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-amber-400 mb-2 flex items-center">
                <WhatsAppIcon className="h-8 w-8 mr-3 text-green-500" /> WhatsApp Business Integration
            </h1>
            <p className="text-gray-400 mb-6">Manage all your member communications from one central hub.</p>

            <div className="border-b border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    <TabButton label="Account" isActive={activeTab === 'account'} onClick={() => setActiveTab('account')} icon={<BusinessIcon />} />
                    <TabButton label="Welcome Message" isActive={activeTab === 'welcome'} onClick={() => setActiveTab('welcome')} icon={<HandWaveIcon />} />
                    <TabButton label="Broadcast" isActive={activeTab === 'broadcast'} onClick={() => setActiveTab('broadcast')} icon={<WhatsAppIcon className="w-5 h-5" />} />
                    <TabButton label="AI Customer Care" isActive={activeTab === 'ai_care'} onClick={() => setActiveTab('ai_care')} icon={<SupportIcon />} />
                    <TabButton label="Automations" isActive={activeTab === 'automations'} onClick={() => setActiveTab('automations')} icon={<AutoUpdateIcon className="w-5 h-5" />} />
                    <TabButton label="Analytics" isActive={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<ChartBarIcon />} />
                </nav>
            </div>
            {renderContent()}
        </div>
    );
};

export default WhatsAppIntegration;
