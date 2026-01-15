
import React, { useState, useMemo } from 'react';
import { INITIAL_LEADS } from '../../constants';
import { Lead, LeadSource } from '../../types';
import Card from './common/Card';
import Modal from './common/Modal';
import { FacebookIcon, InstagramIcon, WalkInIcon, WebIcon, OtherSourceIcon } from './icons/SocialIcons';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { BotIcon } from './icons/BotIcon';
import { getComplexResponse } from '../../lib/gemini';

const SourceIcon: React.FC<{ source: LeadSource, className?: string }> = ({ source, className = "w-5 h-5" }) => {
    switch (source) {
        case 'Facebook': return <FacebookIcon className={className} />;
        case 'Instagram': return <InstagramIcon className={className} />;
        case 'Website': return <WebIcon className={className} />;
        case 'Walk-in': return <WalkInIcon className={className} />;
        case 'Other': return <OtherSourceIcon className={className} />;
        default: return null;
    }
};

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; }> = ({ icon, title, value }) => (
  <div className="bg-gray-700/50 p-4 rounded-lg flex items-center">
    <div className="p-3 bg-gray-800 rounded-full mr-4">{icon}</div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const Leads: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSource, setFilterSource] = useState<LeadSource | 'All'>('All');

    // AI Modal State
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [selectedLeadForAi, setSelectedLeadForAi] = useState<Lead | null>(null);
    const [aiOptions, setAiOptions] = useState<string[]>([]);
    const [selectedMessage, setSelectedMessage] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const leadStats = useMemo(() => {
        const stats = {
            'Facebook': 0, 'Instagram': 0, 'Website': 0, 'Walk-in': 0, 'Other': 0,
        };
        leads.forEach(lead => {
            if (stats.hasOwnProperty(lead.source)) {
                stats[lead.source as LeadSource]++;
            }
        });
        return stats;
    }, [leads]);

    const filteredLeads = useMemo(() =>
        leads.filter(lead => {
            const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  lead.phone.includes(searchTerm);
            const matchesFilter = filterSource === 'All' || lead.source === filterSource;
            return matchesSearch && matchesFilter;
        }),
    [leads, searchTerm, filterSource]);

    const handleAddLead = () => {
        setSelectedLead(null);
        setModalOpen(true);
    };

    const handleEditLead = (lead: Lead) => {
        setSelectedLead(lead);
        setModalOpen(true);
    };

    const handleSaveLead = (leadData: Omit<Lead, 'id'>) => {
        if (selectedLead) {
            setLeads(leads.map(l => l.id === selectedLead.id ? { ...selectedLead, ...leadData } : l));
        } else {
            const newId = leads.length > 0 ? Math.max(...leads.map(l => l.id)) + 1 : 1;
            setLeads([...leads, { ...leadData, id: newId }]);
        }
        setModalOpen(false);
    };

    const handleOpenAiAssistant = async (lead: Lead) => {
        setSelectedLeadForAi(lead);
        setIsAiModalOpen(true);
        setIsGenerating(true);
        setAiOptions([]);
        setSelectedMessage('');

        const prompt = `
            Act as a sales representative for "Royal The Gym".
            Generate 3 distinct, short WhatsApp follow-up messages for a lead with these details:
            
            Name: ${lead.name}
            Source: ${lead.source}
            Current Status: ${lead.status}
            Inquiry Date: ${lead.inquiryDate}
            
            Variations needed:
            1. Friendly check-in.
            2. Benefit/Result focused.
            3. A limited-time offer hook.

            Return ONLY a JSON array of strings. Example: ["Message 1", "Message 2", "Message 3"].
            Do not include markdown or explanations.
        `;

        try {
            let response = await getComplexResponse(prompt);
            response = response.replace(/```json/g, '').replace(/```/g, '').trim();
            const options = JSON.parse(response);
            if (Array.isArray(options)) {
                setAiOptions(options);
                setSelectedMessage(options[0]);
            } else {
                setSelectedMessage(response); // Fallback if not array
            }
        } catch (error) {
            console.error("AI Generation Error", error);
            setSelectedMessage("Could not generate messages. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendWhatsApp = () => {
        if (!selectedLeadForAi) return;
        // Simulate API call
        alert(`Message sent to ${selectedLeadForAi.name} (${selectedLeadForAi.phone}):\n\n"${selectedMessage}"`);
        setIsAiModalOpen(false);
        
        // Update status to 'Contacted' if it was 'New'
        if (selectedLeadForAi.status === 'New') {
            setLeads(leads.map(l => l.id === selectedLeadForAi.id ? { ...l, status: 'Contacted' } : l));
        }
    };

    const getStatusColor = (status: Lead['status']) => {
        switch (status) {
            case 'New': return 'bg-blue-500';
            case 'Contacted': return 'bg-yellow-500';
            case 'Trial': return 'bg-purple-500';
            case 'Converted': return 'bg-green-500';
            case 'Lost': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };
    
    const filterSources: (LeadSource | 'All')[] = ['All', 'Facebook', 'Instagram', 'Website', 'Walk-in', 'Other'];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-amber-400">Leads Management</h1>
                <button onClick={handleAddLead} className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors">
                    Add Lead
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <StatCard icon={<UserGroupIcon className="w-6 h-6 text-blue-400" />} title="Total Leads" value={leads.length} />
                <StatCard icon={<FacebookIcon className="w-6 h-6" />} title="Facebook" value={leadStats.Facebook} />
                <StatCard icon={<InstagramIcon className="w-6 h-6" />} title="Instagram" value={leadStats.Instagram} />
                <StatCard icon={<WebIcon className="w-6 h-6" />} title="Website" value={leadStats.Website} />
                <StatCard icon={<WalkInIcon className="w-6 h-6" />} title="Walk-in" value={leadStats['Walk-in']} />
                <StatCard icon={<OtherSourceIcon className="w-6 h-6" />} title="Other" value={leadStats.Other} />
            </div>

            <Card>
                 <div className="flex flex-col md:flex-row gap-4 mb-4">
                     <input
                        type="text"
                        placeholder="Search leads..."
                        className="w-full md:flex-grow bg-gray-700 text-white p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="flex items-center bg-gray-700 rounded-lg border border-gray-600 p-1">
                        {filterSources.map(source => (
                            <button
                                key={source}
                                onClick={() => setFilterSource(source)}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${filterSource === source ? 'bg-amber-500 text-gray-900' : 'text-gray-300 hover:bg-gray-600'}`}
                            >
                                {source}
                            </button>
                        ))}
                    </div>
                 </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-700 text-gray-400">
                                <th className="p-3">Name</th>
                                <th className="p-3 hidden md:table-cell">Contact</th>
                                <th className="p-3">Source</th>
                                <th className="p-3 hidden sm:table-cell">Inquiry Date</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeads.map(lead => (
                                <tr key={lead.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-3 font-medium">{lead.name}</td>
                                    <td className="p-3 hidden md:table-cell">
                                        <p>{lead.email}</p>
                                        <p className="text-gray-400">{lead.phone}</p>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center">
                                            <SourceIcon source={lead.source} />
                                            <span className="ml-2 hidden lg:inline">{lead.source}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 hidden sm:table-cell">{lead.inquiryDate}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(lead.status)}`}>
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => handleOpenAiAssistant(lead)} 
                                                className="text-gray-400 hover:text-purple-400 transition-colors"
                                                title="Generate AI Follow-up"
                                            >
                                                <SparkleIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleEditLead(lead)} className="text-amber-400 hover:text-amber-300">Edit</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* AI Assistant Modal */}
            <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} title={`AI Assistant: ${selectedLeadForAi?.name}`}>
                <div className="space-y-4">
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <BotIcon className="w-12 h-12 text-amber-400 animate-bounce mb-4" />
                            <p className="text-gray-300 animate-pulse">Drafting personalized messages...</p>
                        </div>
                    ) : (
                        <>
                            {aiOptions.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 font-bold uppercase">Select a Strategy:</label>
                                    {aiOptions.map((opt, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => setSelectedMessage(opt)}
                                            className={`p-3 rounded-lg border cursor-pointer text-sm transition-all ${
                                                selectedMessage === opt 
                                                ? 'bg-purple-900/30 border-purple-500 text-white' 
                                                : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-700'
                                            }`}
                                        >
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Edit Message</label>
                                <textarea
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    rows={4}
                                    value={selectedMessage}
                                    onChange={(e) => setSelectedMessage(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button 
                                    onClick={() => setIsAiModalOpen(false)}
                                    className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSendWhatsApp}
                                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold flex items-center transition-colors"
                                >
                                    <WhatsAppIcon className="w-4 h-4 mr-2" /> Send via WhatsApp
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            {/* Edit/Add Modal */}
            {isModalOpen && (
                <LeadFormModal
                    isOpen={isModalOpen}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSaveLead}
                    lead={selectedLead}
                />
            )}
        </div>
    );
};


interface LeadFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (lead: Omit<Lead, 'id'>) => void;
    lead: Lead | null;
}

const LeadFormModal: React.FC<LeadFormModalProps> = ({ isOpen, onClose, onSave, lead }) => {
    const [formData, setFormData] = useState({
        name: lead?.name || '',
        email: lead?.email || '',
        phone: lead?.phone || '',
        inquiryDate: lead?.inquiryDate || new Date().toISOString().split('T')[0],
        status: lead?.status || 'New',
        source: lead?.source || 'Other',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Omit<Lead, 'id'>);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={lead ? 'Edit Lead' : 'Add New Lead'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Full Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Phone</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Inquiry Date</label>
                        <input type="date" name="inquiryDate" value={formData.inquiryDate} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm">
                            <option>New</option>
                            <option>Contacted</option>
                            <option>Trial</option>
                            <option>Converted</option>
                            <option>Lost</option>
                        </select>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Source</label>
                    <select name="source" value={formData.source} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm">
                        <option>Facebook</option>
                        <option>Instagram</option>
                        <option>Website</option>
                        <option>Walk-in</option>
                        <option>Other</option>
                    </select>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-700 mt-6">
                    <button type="button" onClick={onClose} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors mr-2">Cancel</button>
                    <button type="submit" className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors">Save Lead</button>
                </div>
            </form>
        </Modal>
    );
};

export default Leads;
