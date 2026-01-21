
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Member } from '../../types';
import { INITIAL_PACKAGES, INITIAL_STAFF } from '../../constants';
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
import { useDebounce } from '../hooks/usePerformance';
import { useData } from '../context/DataProvider'; // Import Context

// ... (Keep existing Icons: EyeIcon, DownloadIcon, FilterIcon, SortIcon) ...
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
    // Consume Data from Context
    const { members, addMember, updateMember, deleteMember, packages } = useData();
    
    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

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
            const matchesSearch = member.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                member.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                member.phone.includes(debouncedSearchTerm);
            
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
    }, [members, debouncedSearchTerm, filterStatus, filterPackage, sortConfig]);

    useEffect(() => {
        setVisibleCount(20);
    }, [debouncedSearchTerm, filterStatus, filterPackage, sortConfig]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    if (visibleCount < filteredMembers.length) {
                        setTimeout(() => {
                            setVisibleCount((prev) => Math.min(prev + 20, filteredMembers.length));
                        }, 300);
                    }
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
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
            deleteMember(id); // Use Context Action
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        }
    };

    const handleViewMember = (member: Member) => {
        setViewMember(member);
    };

    // --- BULK ACTIONS ---

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(filteredMembers.slice(0, visibleCount).map(m => m.id));
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
            selectedIds.forEach(id => deleteMember(id)); // Context
            setSelectedIds([]);
        }
    };

    const handleBulkStatusChange = (status: 'Active' | 'Expired' | 'Inactive') => {
        members.forEach(m => {
            if(selectedIds.includes(m.id)) {
                updateMember({...m, status}); // Context
            }
        });
        setSelectedIds([]);
    };

    const handleBulkPackageUpdate = () => {
        members.forEach(m => {
            if(selectedIds.includes(m.id)) {
                updateMember({...m, packageId: bulkTargetPackageId}); // Context
            }
        });
        setBulkPackageModalOpen(false);
        setSelectedIds([]);
        alert("Packages updated successfully for selected members.");
    };

    // --- EXPORT ---

    const handleExport = () => {
        // Updated Export Headers to include new fields
        const headers = ['ID,Name,Gender,Email,Phone,DOB,BloodGroup,Address,EmergencyContact,EmergencyPhone,Height(cm),Weight(kg),Shift,Status,Join Date,Package ID'];
        const rows = filteredMembers.map(m => 
            `${m.id},"${m.name}","${m.gender || ''}","${m.email}","${m.phone}","${m.dob || ''}","${m.bloodGroup || ''}","${m.address || ''}","${m.emergencyContactName || ''}","${m.emergencyContactPhone || ''}","${m.height || ''}","${m.weight || ''}","${m.preferredShift || ''}",${m.status},${m.joinDate},${m.packageId}`
        );
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
            updateMember(updatedMember); // Use Context
            setModalOpen(false);

            if (trainerChanged && memberData.trainerId && memberData.whatsappConsent && memberData.whatsappMode === 'Auto') {
                const trainer = INITIAL_STAFF.find(s => s.id === memberData.trainerId);
                if (trainer) {
                    await sendTrainerAssignmentNotification(updatedMember, trainer.name);
                }
            }

        } else {
            // New Member Logic
            const newId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;
            const newMember: Member = { 
                ...memberData, 
                id: newId, 
                avatar: memberData.avatar || `https://picsum.photos/seed/${newId}/200`,
            };
            
            addMember(newMember); // Use Context
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

                if (memberData.trainerId) {
                    const trainer = INITIAL_STAFF.find(s => s.id === memberData.trainerId);
                    if (trainer) {
                        sendTrainerAssignmentNotification(newMember, trainer.name)
                            .then(() => console.log("Trainer notification sent"))
                            .catch(err => console.error("Error sending trainer notification", err));
                    }
                }
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
                        <thead className="bg-gray-800 text-gray-400 uppercase font-bold text-xs sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-4">
                                    <input type="checkbox" onChange={handleSelectAll} checked={filteredMembers.length > 0 && selectedIds.length === Math.min(visibleCount, filteredMembers.length)} className="rounded bg-gray-700 border-gray-600 text-amber-500 focus:ring-amber-500" />
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
                                            {packages.find(p => p.id === member.packageId)?.name || 'Unknown'}
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
                            
                            {visibleCount < filteredMembers.length && (
                                <tr ref={observerTarget} className="bg-gray-900/30">
                                    <td colSpan={6} className="p-6 text-center border-t border-gray-800">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-100"></div>
                                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-200"></div>
                                            </div>
                                            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                                                Loading More...
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            )}
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

            {viewMember && (
                <Modal isOpen={!!viewMember} onClose={() => setViewMember(null)} title="Member Profile">
                    <div className="text-center">
                        <img src={viewMember.avatar} alt={viewMember.name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-amber-500" />
                        <h2 className="text-2xl font-bold text-white">{viewMember.name}</h2>
                        <p className="text-gray-400">{viewMember.email} • {viewMember.phone}</p>
                        
                        {/* Basic Info */}
                        <div className="mt-6 grid grid-cols-2 gap-4 text-left">
                            <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                <p className="text-xs text-gray-500 uppercase">Status</p>
                                <p className={`font-bold ${viewMember.status === 'Active' ? 'text-green-400' : 'text-red-400'}`}>{viewMember.status}</p>
                            </div>
                            <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                <p className="text-xs text-gray-500 uppercase">Joined</p>
                                <p className="font-bold text-white">{viewMember.joinDate}</p>
                            </div>
                            {viewMember.dob && (
                                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                    <p className="text-xs text-gray-500 uppercase">DOB</p>
                                    <p className="font-bold text-white">{viewMember.dob}</p>
                                </div>
                            )}
                            {viewMember.gender && (
                                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                    <p className="text-xs text-gray-500 uppercase">Gender</p>
                                    <p className="font-bold text-white">{viewMember.gender}</p>
                                </div>
                            )}
                             {viewMember.address && (
                                <div className="bg-gray-800 p-3 rounded border border-gray-700 col-span-2">
                                    <p className="text-xs text-gray-500 uppercase">Address</p>
                                    <p className="font-bold text-white text-sm">{viewMember.address}</p>
                                </div>
                            )}
                            
                            {/* Membership Info */}
                            <div className="col-span-2 border-t border-gray-700 pt-4 mt-2">
                                <h4 className="text-amber-400 text-sm font-bold uppercase mb-2">Membership Details</h4>
                            </div>

                            <div className="bg-gray-800 p-3 rounded border border-gray-700 col-span-2">
                                <p className="text-xs text-gray-500 uppercase">Package</p>
                                <p className="font-bold text-white">{packages.find(p => p.id === viewMember.packageId)?.name}</p>
                            </div>
                            {viewMember.trainerFees && (
                                <div className="bg-gray-800 p-3 rounded border border-gray-700 col-span-2">
                                    <p className="text-xs text-gray-500 uppercase">Trainer Fees</p>
                                    <p className="font-bold text-amber-400">₹{viewMember.trainerFees}</p>
                                </div>
                            )}
                            {viewMember.preferredShift && (
                                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                    <p className="text-xs text-gray-500 uppercase">Shift</p>
                                    <p className="font-bold text-white">{viewMember.preferredShift}</p>
                                </div>
                            )}
                            
                            {/* Emergency Contact */}
                            {(viewMember.emergencyContactName || viewMember.emergencyContactPhone) && (
                                <div className="col-span-2 border-t border-gray-700 pt-4 mt-2">
                                    <h4 className="text-red-400 text-sm font-bold uppercase mb-2">Emergency Contact</h4>
                                    <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                         <p className="font-bold text-white">{viewMember.emergencyContactName || 'N/A'}</p>
                                         <p className="text-gray-400 text-sm">{viewMember.emergencyContactPhone || 'N/A'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Modal>
            )}

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
                            {packages.map(p => (
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

// ... (MemberFormModal remains largely the same, just consumes props) ...
interface MemberFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (member: Omit<Member, 'id'>) => void;
    member: Member | null;
}

const MemberFormModal: React.FC<MemberFormModalProps> = ({ isOpen, onClose, onSave, member }) => {
    const { packages } = useData(); // Use packages from context
    const [formData, setFormData] = useState<Partial<Member>>({
        name: '', email: '', phone: '', dob: '', address: '', gender: 'Male', bloodGroup: '',
        emergencyContactName: '', emergencyContactPhone: '',
        height: undefined, weight: undefined, fitnessGoal: 'General Fitness', medicalConditions: '',
        joinDate: new Date().toISOString().split('T')[0],
        packageId: packages[0]?.id || 1, trainerId: undefined, trainerFees: undefined, preferredShift: 'Morning',
        status: 'Active', whatsappConsent: true, whatsappMode: 'Auto', avatar: '',
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    useEffect(() => {
        if (member) {
            setFormData(member);
        } else {
            setFormData({
                name: '', email: '', phone: '', dob: '', address: '', gender: 'Male', bloodGroup: '',
                emergencyContactName: '', emergencyContactPhone: '',
                height: undefined, weight: undefined, fitnessGoal: 'General Fitness', medicalConditions: '',
                joinDate: new Date().toISOString().split('T')[0],
                packageId: packages[0]?.id || 1, trainerId: undefined, trainerFees: undefined, preferredShift: 'Morning',
                status: 'Active', whatsappConsent: true, whatsappMode: 'Auto', avatar: '',
            });
        }
    }, [member, isOpen, packages]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else if (name === 'packageId' || name === 'trainerId') {
            setFormData(prev => ({ ...prev, [name]: value ? parseInt(value) : undefined }));
        } else if (name === 'trainerFees' || name === 'height' || name === 'weight') {
            setFormData(prev => ({ ...prev, [name]: value ? parseFloat(value) : undefined }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) setFormData(prev => ({ ...prev, avatar: event.target?.result as string }));
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
                <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
                    
                    {/* 1. Avatar Section */}
                    <div className="flex justify-center mb-4">
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

                    {/* 2. Personal Information */}
                    <div className="space-y-4 border-b border-gray-700 pb-4">
                        <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center">
                            Personal Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Full Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Gender</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500">
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Date of Birth</label>
                                <input type="date" name="dob" value={formData.dob || ''} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Blood Group</label>
                                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500">
                                    <option value="">Select Group</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 3. Contact & Emergency */}
                    <div className="space-y-4 border-b border-gray-700 pb-4">
                         <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center">
                            Contact Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Phone</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500" required />
                            </div>
                            <div className='md:col-span-2'>
                                <label className="block text-sm font-medium text-gray-300">Address</label>
                                <textarea name="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 text-white" rows={2} placeholder="Enter full address" />
                            </div>
                            <div className="pt-2 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase">Emergency Contact Name</label>
                                    <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md p-2 focus:ring-red-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase">Emergency Phone</label>
                                    <input type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md p-2 focus:ring-red-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                     {/* 4. Health & Fitness Profile */}
                     <div className="space-y-4 border-b border-gray-700 pb-4">
                         <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center">
                            Health & Goals
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Height (cm)</label>
                                <input type="number" name="height" value={formData.height || ''} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Weight (kg)</label>
                                <input type="number" name="weight" value={formData.weight || ''} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Fitness Goal</label>
                                <select name="fitnessGoal" value={formData.fitnessGoal} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500">
                                    <option value="General Fitness">General Fitness</option>
                                    <option value="Weight Loss">Weight Loss</option>
                                    <option value="Muscle Gain">Muscle Gain</option>
                                    <option value="Endurance">Endurance</option>
                                </select>
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-300">Medical Conditions / Injuries</label>
                                <textarea name="medicalConditions" value={formData.medicalConditions} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 text-white" rows={2} placeholder="E.g., Asthma, Knee Injury..." />
                            </div>
                        </div>
                     </div>

                    {/* 5. Membership Details */}
                    <div className="space-y-4 border-b border-gray-700 pb-4">
                        <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center">
                            Subscription & Training
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Package</label>
                                <select name="packageId" value={formData.packageId} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500">
                                    {packages.map(p => <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Join Date</label>
                                <input type="date" name="joinDate" value={formData.joinDate} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Shift Timing</label>
                                <select name="preferredShift" value={formData.preferredShift} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500">
                                    <option value="Morning">Morning</option>
                                    <option value="Afternoon">Afternoon</option>
                                    <option value="Evening">Evening</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Status</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500">
                                    <option value="Active">Active</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Assign Trainer</label>
                                <select name="trainerId" value={formData.trainerId || ''} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500">
                                    <option value="">-- No Trainer --</option>
                                    {INITIAL_STAFF.filter(s => s.role === 'Trainer').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Trainer Fees (₹)</label>
                                <input
                                    type="number"
                                    name="trainerFees"
                                    value={formData.trainerFees || ''}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-gray-600 bg-gray-700 p-2 text-white focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                                    placeholder="0.00"
                                />
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

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-700 sticky bottom-0 bg-gray-800 pb-2">
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
