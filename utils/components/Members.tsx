
import React, { useState, useMemo, useRef } from 'react';
import { Member } from '../../types';
import { INITIAL_MEMBERS, INITIAL_PACKAGES, INITIAL_STAFF } from '../../constants';
import Card from './common/Card';
import Modal from './common/Modal';
import CameraModal from './common/CameraModal';
import { CameraIcon } from './icons/CameraIcon';
import { UserIcon } from './icons/UserIcon';
import WelcomeModal from './common/WelcomeModal';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { sendWhatsAppWelcomeMessage, sendTrainerAssignmentNotification } from '../../lib/whatsapp';
import { BotIcon } from './icons/BotIcon';
import { UploadIcon } from './icons/UploadIcon';

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
    
    const handleSaveMember = async (memberData: Omit<Member, 'id'>) => {
        if (selectedMember) {
            // Check if trainer changed
            const trainerChanged = memberData.trainerId !== selectedMember.trainerId;
            const updatedMember = { ...selectedMember, ...memberData };
            setMembers(members.map(m => m.id === selectedMember.id ? updatedMember : m));
            setModalOpen(false);

            if (trainerChanged && memberData.trainerId && memberData.whatsappConsent && memberData.whatsappMode === 'Auto') {
                const trainer = INITIAL_STAFF.find(s => s.id === memberData.trainerId);
                if (trainer) {
                    await sendTrainerAssignmentNotification(updatedMember, trainer.name);
                    alert(`Trainer assignment notification sent to ${updatedMember.name}`);
                }
            }

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
            
            if (memberData.whatsappConsent && memberData.whatsappMode === 'Auto') {
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
                
                // If trainer assigned on creation
                if (memberData.trainerId) {
                     const trainer = INITIAL_STAFF.find(s => s.id === memberData.trainerId);
                     if (trainer) {
                         // Small delay to not overlap messages too much
                         setTimeout(() => sendTrainerAssignmentNotification(newMember, trainer.name), 2000);
                     }
                }
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

    const getTrainerName = (trainerId?: number) => {
        if (!trainerId) return 'Unassigned';
        return INITIAL_STAFF.find(s => s.id === trainerId)?.name || 'Unknown';
    }

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
                                <th className="p-3 hidden lg:table-cell">Trainer</th>
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
                                        <div className="flex items-center">
                                            <p className="text-gray-400 mr-2">{member.phone}</p>
                                            {member.whatsappConsent && (
                                                <span className={`${member.whatsappMode === 'Manual' ? 'text-blue-400' : 'text-green-500'}`} title={`WhatsApp Business: ${member.whatsappMode || 'Auto'}`}>
                                                    <WhatsAppIcon className="w-4 h-4" />
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-3 hidden lg:table-cell text-sm">{getTrainerName(member.trainerId)}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(member.status)}`}>
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => handleEditMember(member)} className="text-amber-400 hover:text-amber-300 font-medium">Edit</button>
                                            {member.whatsappConsent && (
                                                <a 
                                                    href={`https://wa.me/91${member.phone.replace(/\D/g, '')}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-green-500 hover:text-green-400"
                                                    title="Chat on WhatsApp"
                                                >
                                                    <WhatsAppIcon className="w-5 h-5" />
                                                </a>
                                            )}
                                        </div>
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
        trainerId: member?.trainerId || 0,
        status: member?.status || 'Active',
        avatar: member?.avatar || '',
        whatsappConsent: member?.whatsappConsent || false, 
        whatsappMode: member?.whatsappMode || 'Auto',
    });
    
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const trainers = INITIAL_STAFF.filter(s => s.role === 'Trainer');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: (name === 'packageId' || name === 'trainerId') ? parseInt(value, 10) : value 
        }));
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
                    {/* Personal Details Section */}
                    <div>
                        <h4 className="text-md font-semibold text-amber-400 border-b border-gray-700 pb-2 mb-4">Personal Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                            {/* Photo Column */}
                            <div className="md:col-span-1 flex flex-col items-center justify-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                <span className="inline-block h-32 w-32 rounded-full overflow-hidden bg-gray-700 border-4 border-gray-600 shadow-lg mb-4">
                                    {formData.avatar ? (
                                        <img className="h-full w-full object-cover" src={formData.avatar} alt="Member" />
                                    ) : (
                                        <UserIcon className="h-full w-full text-gray-500 p-6" />
                                    )}
                                </span>
                                <div className="flex flex-col w-full gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full bg-gray-600 text-white text-xs font-bold py-2 px-3 rounded-lg hover:bg-gray-500 transition-colors flex items-center justify-center"
                                    >
                                        <UploadIcon className="w-4 h-4 mr-2" /> Upload Photo
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
                                        className="w-full bg-blue-600 text-white text-xs font-bold py-2 px-3 rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center"
                                    >
                                        <CameraIcon className="w-4 h-4 mr-2" /> Take Photo
                                    </button>
                                </div>
                            </div>

                            {/* Personal Inputs */}
                            <div className="md:col-span-2 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all" required placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all" required placeholder="john@example.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all" required placeholder="+91 98765 43210" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Membership Section */}
                    <div>
                        <h4 className="text-md font-semibold text-amber-400 border-b border-gray-700 pb-2 mb-4">Membership Details</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Join Date</label>
                                <input type="date" name="joinDate" value={formData.joinDate} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-amber-500 outline-none" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Select Package</label>
                                <select name="packageId" value={formData.packageId} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-amber-500 outline-none">
                                    {INITIAL_PACKAGES.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Assigned Trainer</label>
                                <select name="trainerId" value={formData.trainerId} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-amber-500 outline-none">
                                    <option value={0}>Unassigned</option>
                                    {trainers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Membership Status</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-amber-500 outline-none">
                                    <option value="Active">Active</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        
                        {/* WhatsApp Integration */}
                        <div className="mt-6 bg-gradient-to-r from-gray-800 to-gray-800/50 border border-gray-700 p-5 rounded-xl shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-900/30 rounded-lg">
                                        <WhatsAppIcon className="w-6 h-6 text-green-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-100">WhatsApp Business Integration</h4>
                                        <p className="text-xs text-gray-400">Automate notifications and updates</p>
                                    </div>
                                </div>
                                <label className="inline-flex relative items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        name="whatsappConsent"
                                        checked={formData.whatsappConsent} 
                                        onChange={handleCheckboxChange} 
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>

                            {formData.whatsappConsent && (
                                <div className="bg-gray-900/80 p-4 rounded-lg border border-gray-600 animate-fade-in">
                                    <label className="text-xs text-gray-400 font-bold uppercase mb-3 block tracking-wider">Communication Mode</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center transition-all ${formData.whatsappMode === 'Auto' ? 'bg-green-500/10 border-green-500 text-green-400 ring-1 ring-green-500' : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500'}`}>
                                            <input 
                                                type="radio" 
                                                name="whatsappMode" 
                                                value="Auto" 
                                                checked={formData.whatsappMode === 'Auto'} 
                                                onChange={handleChange} 
                                                className="sr-only" 
                                            />
                                            <BotIcon />
                                            <span className="mt-2 font-bold text-sm">Auto Pilot</span>
                                            <span className="text-[10px] opacity-70 mt-1 text-center">Bot handles everything</span>
                                        </label>
                                        <label className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center transition-all ${formData.whatsappMode === 'Manual' ? 'bg-blue-500/10 border-blue-500 text-blue-400 ring-1 ring-blue-500' : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500'}`}>
                                            <input 
                                                type="radio" 
                                                name="whatsappMode" 
                                                value="Manual" 
                                                checked={formData.whatsappMode === 'Manual'} 
                                                onChange={handleChange} 
                                                className="sr-only" 
                                            />
                                            <UserIcon className="w-5 h-5" />
                                            <span className="mt-2 font-bold text-sm">Manual Only</span>
                                            <span className="text-[10px] opacity-70 mt-1 text-center">You send messages</span>
                                        </label>
                                    </div>
                                </div>
                            )}
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
