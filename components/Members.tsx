
import React, { useState, useMemo, useRef } from 'react';
import { Member } from '../types';
import { INITIAL_MEMBERS, INITIAL_PACKAGES } from '../constants';
import Card from './common/Card';
import Modal from './common/Modal';
import CameraModal from './common/CameraModal';
import { CameraIcon } from './icons/CameraIcon';
import { UserIcon } from './icons/UserIcon';
import WelcomeModal from './common/WelcomeModal';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { sendWhatsAppWelcomeMessage } from '../lib/whatsapp';

const Members: React.FC = () => {
    const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [isWelcomeModalOpen, setWelcomeModalOpen] = useState(false);
    const [newlyAddedMember, setNewlyAddedMember] = useState<Member | null>(null);
    const [welcomeStatus, setWelcomeStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    const filteredMembers = useMemo(() =>
        members.filter(member =>
            member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.phone.includes(searchTerm)
        ), [members, searchTerm]);
    
    const handleAddMember = () => {
        setSelectedMember(null);
        setModalOpen(true);
    };

    const handleEditMember = (member: Member) => {
        setSelectedMember(member);
        setModalOpen(true);
    };
    
    const handleSaveMember = (memberData: Omit<Member, 'id'>) => {
        if (selectedMember) {
            setMembers(members.map(m => m.id === selectedMember.id ? { ...selectedMember, ...memberData } : m));
            setModalOpen(false);
        } else {
            // New Member Logic
            const newId = Math.max(...members.map(m => m.id)) + 1;
            const newMember: Member = { 
                ...memberData, 
                id: newId, 
                avatar: memberData.avatar || `https://picsum.photos/seed/${newId}/200`,
            };
            setMembers([...members, newMember]);
            setNewlyAddedMember(newMember);
            
            // Close form modal immediately
            setModalOpen(false);

            // Trigger Welcome Modal and Automated WhatsApp Logic
            setWelcomeModalOpen(true);
            
            if (memberData.whatsappConsent) {
                setWelcomeStatus('sending');
                // Automatically send welcome message via WhatsApp Business API
                sendWhatsAppWelcomeMessage(newMember)
                    .then((success) => {
                        if (success) {
                            setWelcomeStatus('sent');
                        } else {
                            console.error("Failed to send automatic welcome message.");
                            setWelcomeStatus('idle');
                        }
                    })
                    .catch((err) => {
                        console.error("Error in automated message flow:", err);
                        setWelcomeStatus('idle');
                    });
            } else {
                setWelcomeStatus('idle');
            }
        }
    };

    const getStatusColor = (status: Member['status']) => {
        switch(status) {
            case 'Active': return 'bg-green-500';
            case 'Expired': return 'bg-red-500';
            case 'Inactive': return 'bg-yellow-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-amber-400">Members</h1>
                <button onClick={handleAddMember} className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors">
                    Add Member
                </button>
            </div>
            <Card>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search members..."
                        className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-700 text-gray-400">
                                <th className="p-3">Name</th>
                                <th className="p-3 hidden md:table-cell">Contact</th>
                                <th className="p-3 hidden lg:table-cell">Join Date</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.map(member => (
                                <tr key={member.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-3">
                                        <div className="flex items-center">
                                            <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full mr-3 object-cover" />
                                            <div>
                                                <p className="font-semibold">{member.name}</p>
                                                <p className="text-sm text-gray-400 md:hidden">{member.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 hidden md:table-cell">
                                        <p>{member.email}</p>
                                        <p className="text-gray-400">{member.phone}</p>
                                    </td>
                                    <td className="p-3 hidden lg:table-cell">{member.joinDate}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(member.status)}`}>
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <button onClick={() => handleEditMember(member)} className="text-amber-400 hover:text-amber-300">Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
            {isModalOpen && (
                <MemberFormModal 
                    isOpen={isModalOpen}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSaveMember}
                    member={selectedMember}
                />
            )}
            {isWelcomeModalOpen && newlyAddedMember && (
                <WelcomeModal 
                    isOpen={isWelcomeModalOpen}
                    onClose={() => setWelcomeModalOpen(false)}
                    member={newlyAddedMember}
                    welcomeStatus={welcomeStatus}
                />
            )}
        </div>
    );
};


interface MemberFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (member: Omit<Member, 'id'>) => void;
    member: Member | null;
}

const MemberFormModal: React.FC<MemberFormModalProps> = ({ isOpen, onClose, onSave, member }) => {
    const [formData, setFormData] = useState({
        name: member?.name || '',
        email: member?.email || '',
        phone: member?.phone || '',
        joinDate: member?.joinDate || new Date().toISOString().split('T')[0],
        packageId: member?.packageId || 1,
        status: member?.status || 'Active',
        avatar: member?.avatar || '',
        whatsappConsent: member?.whatsappConsent || true, // Default to true for business automation
    });
    
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'packageId' ? parseInt(value, 10) : value }));
    };

     const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFormData(prev => ({ ...prev, avatar: event.target?.result as string }));
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const handleCapture = (imageDataUrl: string) => {
        setFormData(prev => ({ ...prev, avatar: imageDataUrl }));
        setIsCameraOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Omit<Member, 'id'>);
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={member ? 'Edit Member' : 'Add New Member'}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Top section: Photo and Personal Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        {/* Photo Column */}
                        <div className="md:col-span-1 flex flex-col items-center space-y-4">
                            <span className="inline-block h-28 w-28 rounded-full overflow-hidden bg-gray-700 border-2 border-gray-600">
                                {formData.avatar ? (
                                    <img className="h-full w-full object-cover" src={formData.avatar} alt="Member" />
                                ) : (
                                    <UserIcon className="h-full w-full text-gray-500 p-4" />
                                )}
                            </span>
                            <div className="flex items-center space-x-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-gray-600 text-white text-xs font-bold py-2 px-3 rounded-lg hover:bg-gray-500 transition-colors"
                                >
                                    Upload
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsCameraOpen(true)}
                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center"
                                >
                                    <CameraIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Personal Details Column */}
                        <div className="md:col-span-2 space-y-4">
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
                        </div>
                    </div>

                    {/* Membership Details Section */}
                    <div>
                        <h4 className="text-md font-semibold text-amber-400 border-b border-gray-700 pb-2 mb-4">Membership Details</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Join Date</label>
                                <input type="date" name="joinDate" value={formData.joinDate} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Package</label>
                                <select name="packageId" value={formData.packageId} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm">
                                    {INITIAL_PACKAGES.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-300">Status</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm">
                                    <option>Active</option>
                                    <option>Expired</option>
                                    <option>Inactive</option>
                                </select>
                            </div>
                            
                            {/* WhatsApp Business Integration Section */}
                             <div className="sm:col-span-2 mt-4 bg-gray-800 border border-green-600/50 p-4 rounded-lg flex items-start shadow-sm">
                                <div className="flex items-center h-5">
                                    <input id="whatsappConsent" name="whatsappConsent" type="checkbox" checked={formData.whatsappConsent} onChange={handleCheckboxChange} className="focus:ring-green-500 h-5 w-5 text-green-600 border-gray-500 rounded bg-gray-700"/>
                                </div>
                                <div className="ml-3">
                                    <label htmlFor="whatsappConsent" className="font-bold text-green-400 flex items-center">
                                        <WhatsAppIcon className="w-5 h-5 mr-2" />
                                        WhatsApp Business Auto-Message
                                    </label>
                                    <p className="text-gray-400 text-xs mt-1">
                                        Enable to instantly trigger the <strong>Official WhatsApp Business API</strong>. A professional welcome template will be sent immediately upon saving.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Buttons Footer */}
                    <div className="flex justify-end pt-4 mt-4 border-t border-gray-700">
                        <button type="button" onClick={onClose} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors mr-2">Cancel</button>
                        <button type="submit" className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors">Save Member</button>
                    </div>
                </form>
            </Modal>
            <CameraModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={handleCapture}
            />
        </>
    );
};

export default Members;
