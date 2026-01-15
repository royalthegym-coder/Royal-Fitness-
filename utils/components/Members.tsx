
import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { PackageIcon } from './icons/NavIcons';

// --- ICONS FOR NEW FEATURES ---
const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
);

const SortIcon = ({ direction }: { direction?: 'asc' | 'desc' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ml-1 inline-block transition-transform ${direction === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {direction ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        )}
    </svg>
);

const Members: React.FC = () => {
    const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
    
    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [filterPackage, setFilterPackage] = useState<string>('All');

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: keyof Member; direction: 'asc' | 'desc' } | null>(null);

    // Modal State
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [isWelcomeModalOpen, setWelcomeModalOpen] = useState(false);
    const [newlyAddedMember, setNewlyAddedMember] = useState<Member | null>(null);
    const [welcomeStatus, setWelcomeStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
    
    // View Details State
    const [viewMember, setViewMember] = useState<Member | null>(null);

    // Bulk Action State
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isBulkPackageModalOpen, setBulkPackageModalOpen] = useState(false);
    const [bulkTargetPackageId, setBulkTargetPackageId] = useState<number>(INITIAL_PACKAGES[0]?.id || 1);

    // Lazy Loading State
    const [visibleCount, setVisibleCount] = useState(20);
    const observerTarget = useRef<HTMLTableRowElement>(null);

    const filteredMembers = useMemo(() => {
        let result = members.filter(member => {
            const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                member.phone.includes(searchTerm);
            
            const matchesStatus = filterStatus === 'All' || member.status === filterStatus;
            
            const matchesPackage = filterPackage === 'All' || member.packageId.toString() === filterPackage;

            return matchesSearch && matchesStatus && matchesPackage;
        });

        if (sortConfig) {
            result.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === undefined || bValue === undefined) return 0;

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [members, searchTerm, filterStatus, filterPackage, sortConfig]);

    // Reset visible count when filters change
    useEffect(() => {
        setVisibleCount(20);
    }, [searchTerm, filterStatus, filterPackage, sortConfig]);

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((prev) => prev + 20);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [observerTarget, visibleCount, filteredMembers.length]);
    
    // --- HANDLERS ---

    const handleSort = (key: keyof Member) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleAddMember = () => {
        setSelectedMember(null);
        setModalOpen(true);
    };

    const handleEditMember = (member: Member) => {
        setSelectedMember(member);
        setModalOpen(true);
    };

    const handleDeleteMember = (id: number) => {
        if(confirm('Are you sure you want to delete this member?')) {
            setMembers(members.filter(m => m.id !== id));
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        }
    };

    const handleViewMember = (member: Member) => {
        setViewMember(member);
    };

    // --- BULK ACTIONS ---

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(filteredMembers.map(m => m.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkDelete = () => {
        if(confirm(`Delete ${selectedIds.length} members?`)) {
            setMembers(members.filter(m => !selectedIds.includes(m.id)));
            setSelectedIds([]);
        }
    };

    const handleBulkStatusChange = (status: 'Active' | 'Expired' | 'Inactive') => {
        setMembers(members.map(m => selectedIds.includes(m.id) ? { ...m, status } : m));
        setSelectedIds([]);
    };

    const handleBulkPackageUpdate = () => {
        setMembers(members.map(m => selectedIds.includes(m.id) ? { ...m, packageId: bulkTargetPackageId } : m));
        setBulkPackageModalOpen(false);
        setSelectedIds([]);
        alert("Packages updated successfully for selected members.");
    };

    // --- EXPORT ---

    const handleExport = () => {
        const headers = ['ID,Name,Email,Phone,Status,Join Date,Package ID'];
        const rows = filteredMembers.map(m => `${m.id},"${m.name}","${m.email}","${m.phone}",${m.status},${m.joinDate},${m.packageId}`);
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "royal_members_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    // --- FORM SAVE ---

    const handleSaveMember = async (memberData: Omit<Member, 'id'>) => {
        if (selectedMember) {
            // Edit Mode
            const trainerChanged = memberData.trainerId !== selectedMember.trainerId;
            const updatedMember = { ...selectedMember, ...memberData };
            setMembers(members.map(m => m.id === selectedMember.id ? updatedMember : m));
            setModalOpen(false);

            if (trainerChanged && memberData.trainerId && memberData.whatsappConsent && memberData.whatsappMode === 'Auto') {
                const trainer = INITIAL_STAFF.find(s => s.id === memberData.trainerId);
                if (trainer) {
                    await sendTrainerAssignmentNotification(updatedMember, trainer.name);
                }
            }

        } else {
            // New Member Logic
            const newId = Math.max(...members.map(m => m.id), 0) + 1;
            const newMember: Member = { 
                ...memberData, 
                id: newId, 
                avatar: memberData.avatar || `https://picsum.photos/seed/${newId}/200`,
            };
            setMembers([...members, newMember]);
            setNewlyAddedMember(newMember);
            setModalOpen(false);
            setWelcomeModalOpen(true);
            
            if (memberData.whatsappConsent && memberData.whatsappMode === 'Auto') {
                setWelcomeStatus('sending');
                sendWhatsAppWelcomeMessage(newMember)
                    .then((success) => {
                        if (success) setWelcomeStatus('sent');
                        else setWelcomeStatus('idle');
                    })
                    .catch((err) => {
                        console.error("Error in automated message flow:", err);
                        setWelcomeStatus('idle');
                    });
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center">
                    <UserIcon className="w-8 h-8 mr-3 text-amber-400" />
                    <div>
                        <h1 className="text-3xl font-bold text-amber-400">Members</h1>
                        <p className="text-gray-400 text-sm">Manage gym members and subscriptions.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExport} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
                        <DownloadIcon /> <span className="ml-2 hidden sm:inline">Export</span>
                    </button>
                    <button onClick={handleAddMember} className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors flex items-center shadow-lg shadow-amber-500/20">
                        <span className="mr-1 text-xl leading-none">+</span> Add Member
                    </button>
                </div>
            </div>

            {/* Filters & Bulk Actions */}
            <Card className="bg-gray-800 border-gray-700">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-grow md:flex-grow-0">
                            <input 
                                type="text" 
                                placeholder="Search by name, email..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-gray-900 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-amber-500 w-full sm:w-64"
                            />
                            <svg className="w-5 h-5 text-gray-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <div className="flex gap-2">
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-amber-500 text-sm">
                                <option value="All">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Expired">Expired</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 animate-fade-in bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-500/30">
                            <span className="text-sm text-amber-400 font-bold">{selectedIds.length} Selected</span>
                            <div className="h-4 w-px bg-gray-600 mx-2"></div>
                            <button onClick={() => handleBulkStatusChange('Active')} className="text-xs text-green-400 hover:text-green-300 font-bold">Activate</button>
                            <button onClick={() => handleBulkStatusChange('Inactive')} className="text-xs text-gray-400 hover:text-gray-300 font-bold">Deactivate</button>
                            <button onClick={() => setBulkPackageModalOpen(true)} className="text-xs text-blue-400 hover:text-blue-300 font-bold">Change Package</button>
                            <button onClick={handleBulkDelete} className="text-xs text-red-400 hover:text-red-300 font-bold">Delete</button>
                        </div>
                    )}
                </div>
            </Card>

            <Card className="overflow-hidden p-0 bg-gray-900 border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-800 text-gray-400 uppercase font-bold text-xs">
                            <tr>
                                <th className="p-4 w-4">
                                    <input type="checkbox" onChange={handleSelectAll} checked={filteredMembers.length > 0 && selectedIds.length === filteredMembers.length} className="rounded bg-gray-700 border-gray-600 text-amber-500 focus:ring-amber-500" />
                                </th>
                                <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                                    Member <SortIcon direction={sortConfig?.key === 'name' ? sortConfig.direction : undefined} />
                                </th>
                                <th className="p-4 hidden md:table-cell cursor-pointer hover:text-white" onClick={() => handleSort('packageId')}>
                                    Package <SortIcon direction={sortConfig?.key === 'packageId' ? sortConfig.direction : undefined} />
                                </th>
                                <th className="p-4 hidden sm:table-cell cursor-pointer hover:text-white" onClick={() => handleSort('joinDate')}>
                                    Joined <SortIcon direction={sortConfig?.key === 'joinDate' ? sortConfig.direction : undefined} />
                                </th>
                                <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('status')}>
                                    Status <SortIcon direction={sortConfig?.key === 'status' ? sortConfig.direction : undefined} />
                                </th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {filteredMembers.slice(0, visibleCount).map((member) => (
                                <tr key={member.id} className="hover:bg-gray-800/50 transition-colors group">
                                    <td className="p-4">
                                        <input type="checkbox" checked={selectedIds.includes(member.id)} onChange={() => handleSelectOne(member.id)} className="rounded bg-gray-700 border-gray-600 text-amber-500 focus:ring-amber-500" />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center">
                                            <img src={member.avatar} alt="" className="w-10 h-10 rounded-full mr-3 object-cover border border-gray-700" />
                                            <div>
                                                <div className="font-bold text-white">{member.name}</div>
                                                <div className="text-gray-500 text-xs">{member.phone}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 hidden md:table-cell">
                                        <span className="bg-gray-800 text-gray-300 py-1 px-2 rounded text-xs border border-gray-700">
                                            {INITIAL_PACKAGES.find(p => p.id === member.packageId)?.name || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="p-4 hidden sm:table-cell text-gray-400 font-mono text-xs">
                                        {member.joinDate}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                                            member.status === 'Active' ? 'bg-green-900/20 text-green-400 border-green-500/30' : 
                                            member.status === 'Expired' ? 'bg-red-900/20 text-red-400 border-red-500/30' : 
                                            'bg-gray-700 text-gray-400 border-gray-600'
                                        }`}>
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleViewMember(member)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="View Details">
                                                <EyeIcon />
                                            </button>
                                            <button onClick={() => handleEditMember(member)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-blue-400 hover:text-blue-300" title="Edit">
                                                <EditIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteMember(member.id)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-red-400 hover:text-red-300" title="Delete">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {/* Infinite Scroll Trigger */}
                            <tr ref={observerTarget}>
                                <td colSpan={6} className="h-4"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modals */}
            <MemberFormModal 
                isOpen={isModalOpen} 
                onClose={() => setModalOpen(false)} 
                onSave={handleSaveMember} 
                member={selectedMember} 
            />

            {newlyAddedMember && (
                <WelcomeModal 
                    isOpen={isWelcomeModalOpen} 
                    onClose={() => setWelcomeModalOpen(false)} 
                    member={newlyAddedMember}
                    welcomeStatus={welcomeStatus}
                />
            )}

            {/* View Member Modal - Simplified */}
            {viewMember && (
                <Modal isOpen={!!viewMember} onClose={() => setViewMember(null)} title="Member Profile">
                    <div className="text-center">
                        <img src={viewMember.avatar} alt={viewMember.name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-amber-500" />
                        <h2 className="text-2xl font-bold text-white">{viewMember.name}</h2>
                        <p className="text-gray-400">{viewMember.email} • {viewMember.phone}</p>
                        <div className="mt-6 grid grid-cols-2 gap-4 text-left">
                            <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                <p className="text-xs text-gray-500 uppercase">Status</p>
                                <p className={`font-bold ${viewMember.status === 'Active' ? 'text-green-400' : 'text-red-400'}`}>{viewMember.status}</p>
                            </div>
                            <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                <p className="text-xs text-gray-500 uppercase">Joined</p>
                                <p className="font-bold text-white">{viewMember.joinDate}</p>
                            </div>
                            <div className="bg-gray-800 p-3 rounded border border-gray-700 col-span-2">
                                <p className="text-xs text-gray-500 uppercase">Package</p>
                                <p className="font-bold text-white">{INITIAL_PACKAGES.find(p => p.id === viewMember.packageId)?.name}</p>
                            </div>
                            {viewMember.trainerFees && (
                                <div className="bg-gray-800 p-3 rounded border border-gray-700 col-span-2">
                                    <p className="text-xs text-gray-500 uppercase">Trainer Fees</p>
                                    <p className="font-bold text-amber-400">₹{viewMember.trainerFees}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Modal>
            )}

            {/* Bulk Package Update Modal */}
            <Modal isOpen={isBulkPackageModalOpen} onClose={() => setBulkPackageModalOpen(false)} title="Bulk Change Package">
                <div className="space-y-4">
                    <p className="text-gray-300 text-sm">Select the new package to assign to the {selectedIds.length} selected members.</p>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Select Package</label>
                        <select 
                            value={bulkTargetPackageId} 
                            onChange={(e) => setBulkTargetPackageId(Number(e.target.value))}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-amber-500"
                        >
                            {INITIAL_PACKAGES.map(p => (
                                <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setBulkPackageModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                        <button onClick={handleBulkPackageUpdate} className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors">
                            Update Members
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// --- MEMBER FORM MODAL COMPONENT ---

interface MemberFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (member: Omit<Member, 'id'>) => void;
    member: Member | null;
}

const MemberFormModal: React.FC<MemberFormModalProps> = ({ isOpen, onClose, onSave, member }) => {
    const [formData, setFormData] = useState<Partial<Member>>({
        name: '',
        email: '',
        phone: '',
        joinDate: new Date().toISOString().split('T')[0],
        packageId: INITIAL_PACKAGES[0]?.id,
        trainerId: undefined,
        trainerFees: undefined,
        status: 'Active',
        whatsappConsent: true,
        whatsappMode: 'Auto',
        avatar: '',
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    useEffect(() => {
        if (member) {
            setFormData(member);
        } else {
            // Reset for new member
            setFormData({
                name: '',
                email: '',
                phone: '',
                joinDate: new Date().toISOString().split('T')[0],
                packageId: INITIAL_PACKAGES[0]?.id,
                trainerId: undefined,
                trainerFees: undefined,
                status: 'Active',
                whatsappConsent: true,
                whatsappMode: 'Auto',
                avatar: '',
            });
        }
    }, [member, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else if (name === 'packageId' || name === 'trainerId') {
            setFormData(prev => ({ ...prev, [name]: value ? parseInt(value) : undefined }));
        } else if (name === 'trainerFees') {
            setFormData(prev => ({ ...prev, [name]: value ? parseFloat(value) : undefined }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setFormData(prev => ({ ...prev, avatar: event.target?.result as string }));
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Omit<Member, 'id'>);
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={member ? 'Edit Member' : 'Register New Member'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Avatar Upload */}
                    <div className="flex justify-center mb-6">
                        <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-600 bg-gray-700 flex items-center justify-center">
                                {formData.avatar ? (
                                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-12 h-12 text-gray-500" />
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1 bg-white rounded-full text-black">
                                        <UploadIcon className="w-4 h-4"/>
                                    </button>
                                    <button type="button" onClick={() => setIsCameraOpen(true)} className="p-1 bg-amber-500 rounded-full text-black">
                                        <CameraIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        </div>
                    </div>

                    {/* Personal Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Full Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Phone</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500" required />
                    </div>

                    {/* Membership Details */}
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-4">
                        <h4 className="text-sm font-bold text-gray-400 uppercase">Membership Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Package</label>
                                <select name="packageId" value={formData.packageId} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500">
                                    {INITIAL_PACKAGES.map(p => <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Join Date</label>
                                <input type="date" name="joinDate" value={formData.joinDate} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Status</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500">
                                    <option value="Active">Active</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Trainer Info - Added Trainer Fees */}
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-4">
                        <h4 className="text-sm font-bold text-gray-400 uppercase">Training & Fees</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Assign Trainer</label>
                                <select name="trainerId" value={formData.trainerId || ''} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500">
                                    <option value="">-- No Trainer --</option>
                                    {INITIAL_STAFF.filter(s => s.role === 'Trainer').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Gym Trainer Fees (₹)</label>
                                <div className="relative mt-1 rounded-md shadow-sm">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="text-gray-500 sm:text-sm">₹</span>
                                    </div>
                                    <input 
                                        type="number" 
                                        name="trainerFees" 
                                        value={formData.trainerFees || ''} 
                                        onChange={handleChange} 
                                        className="block w-full rounded-md border-gray-600 bg-gray-700 pl-7 p-2 text-white focus:border-amber-500 focus:ring-amber-500 sm:text-sm" 
                                        placeholder="0.00" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* WhatsApp Automation Settings */}
                    <div className="flex items-center justify-between p-3 bg-green-900/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-center">
                            <WhatsAppIcon className="w-5 h-5 text-green-500 mr-2" />
                            <label className="text-sm font-medium text-gray-300">Enable WhatsApp Automation</label>
                        </div>
                        <input type="checkbox" name="whatsappConsent" checked={formData.whatsappConsent} onChange={handleChange} className="h-4 w-4 text-green-500 focus:ring-green-500 border-gray-600 rounded bg-gray-700" />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                        <button type="button" onClick={onClose} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors">Cancel</button>
                        <button type="submit" className="bg-amber-500 text-gray-900 font-bold py-2 px-6 rounded-lg hover:bg-amber-400 transition-colors shadow-lg">Save Member</button>
                    </div>
                </form>
            </Modal>

            <CameraModal 
                isOpen={isCameraOpen} 
                onClose={() => setIsCameraOpen(false)} 
                onCapture={(img) => { setFormData(prev => ({ ...prev, avatar: img })); setIsCameraOpen(false); }} 
            />
        </>
    );
};

export default Members;
