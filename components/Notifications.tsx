
import React, { useState, useMemo, useEffect } from 'react';
import Card from './common/Card';
import { INITIAL_MEMBERS, INITIAL_BROADCASTS } from '../constants';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { BroadcastMessage } from '../types';

const WhatsAppBroadcast: React.FC = () => {
    const [message, setMessage] = useState('');
    const [audience, setAudience] = useState<'all' | 'active' | 'expired'>('all');
    const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>(INITIAL_BROADCASTS);
    const [showSuccess, setShowSuccess] = useState(false);

    const consentedMembers = useMemo(() => INITIAL_MEMBERS.filter(m => m.whatsappConsent), []);

    const targetMembers = useMemo(() => {
        let members = consentedMembers;
        if (audience === 'active') {
            return members.filter(m => m.status === 'Active');
        }
        if (audience === 'expired') {
            return members.filter(m => m.status === 'Expired');
        }
        return members;
    }, [consentedMembers, audience]);

    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    const handleSendBroadcast = () => {
        if (!message.trim()) {
            alert('Please enter a message to send.');
            return;
        }

        const newBroadcast: BroadcastMessage = {
            id: Math.max(0, ...broadcasts.map(b => b.id)) + 1,
            message,
            audience,
            recipientCount: targetMembers.length,
            sentAt: new Date().toISOString().split('T')[0],
        };

        setBroadcasts([newBroadcast, ...broadcasts]);
        
        setShowSuccess(true);
        setMessage('');
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-amber-400 mb-6">WhatsApp Business Broadcast</h1>
            
            <Card className="mb-6">
                <div className="flex flex-col md:flex-row items-center">
                     <div className="p-3 bg-green-500 rounded-full mr-4 mb-3 md:mb-0">
                        <WhatsAppIcon className="h-6 w-6 text-white"/>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-green-400">Engage Members with WhatsApp Business</h3>
                        <p className="text-gray-400 text-sm">
                            Use this tool to send bulk messages (broadcasts) about new offers, fee changes, or important news directly to your members. This feature simulates the WhatsApp Business API and respects member privacy by only messaging users who have provided consent.
                        </p>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Broadcast Composer */}
                <div className="lg:col-span-2">
                    <Card title="Compose Broadcast Message">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-300">Message</label>
                                <textarea
                                    id="message"
                                    rows={6}
                                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                                    placeholder="Type your announcement, offer, or update here..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                ></textarea>
                            </div>
                             <div>
                                <label htmlFor="audience" className="block text-sm font-medium text-gray-300">Target Audience (Consented Members Only)</label>
                                <select 
                                    id="audience" 
                                    value={audience}
                                    onChange={(e) => setAudience(e.target.value as any)}
                                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                                >
                                    <option value="all">All ({consentedMembers.length})</option>
                                    <option value="active">Active ({consentedMembers.filter(m => m.status === 'Active').length})</option>
                                    <option value="expired">Expired ({consentedMembers.filter(m => m.status === 'Expired').length})</option>
                                </select>
                            </div>
                             <div className="flex justify-end items-center">
                                 {showSuccess && <span className="text-green-400 text-sm mr-4">Broadcast sent successfully!</span>}
                                <button
                                    onClick={handleSendBroadcast}
                                    className="inline-flex items-center justify-center bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-400 transition-colors"
                                >
                                    <WhatsAppIcon className="w-5 h-5 mr-2" />
                                    Send via WhatsApp Business
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
                
                {/* Consent Info */}
                <div>
                    <Card title="Consent Status">
                        <div className="text-center">
                            <p className="text-6xl font-bold text-amber-400">{consentedMembers.length}</p>
                            <p className="text-gray-400">members have consented to receive WhatsApp Business updates.</p>
                        </div>
                        <div className="mt-4 text-xs text-gray-500">
                             <p>Consent can be managed from the "Edit Member" screen. This feature ensures compliance with privacy policies by only targeting members who opted-in.</p>
                        </div>
                    </Card>
                </div>
                
                {/* Broadcast History */}
                <div className="lg:col-span-3">
                    <Card title="Broadcast History">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-700 text-gray-400">
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Message</th>
                                        <th className="p-3 hidden sm:table-cell">Audience</th>
                                        <th className="p-3">Recipients</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {broadcasts.map(b => (
                                        <tr key={b.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                            <td className="p-3 text-sm text-gray-400 whitespace-nowrap">{b.sentAt}</td>
                                            <td className="p-3 text-sm">{b.message}</td>
                                            <td className="p-3 hidden sm:table-cell capitalize">{b.audience}</td>
                                            <td className="p-3 text-center">{b.recipientCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppBroadcast;
