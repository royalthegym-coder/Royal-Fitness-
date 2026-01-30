
import React, { useState, useMemo, useRef, useEffect } from 'react';
import Card from './common/Card';
import { useData } from '../context/DataProvider';
import { Member } from '../../types';
import { INITIAL_PACKAGES, INITIAL_STAFF } from '../../constants';
import Modal from './common/Modal';
import { EditIcon } from './icons/EditIcon';
import { UserIcon } from './icons/UserIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { CameraIcon } from './icons/CameraIcon';
import { UploadIcon } from './icons/UploadIcon';
import CameraModal from './common/CameraModal';
import { getComplexResponse } from '../../lib/gemini';
import { useDebounce } from '../hooks/usePerformance';

const Members: React.FC = () => {
    const { members, addMember, updateMember, deleteMember, packages } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [filterPackage, setFilterPackage] = useState<string>('All');
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [visibleCount, setVisibleCount] = useState(20);
    
    // --- CHURN PREDICTION STATE ---
    const [isRiskView, setIsRiskView] = useState(false);
    const [rescuingMemberId, setRescuingMemberId] = useState<number | null>(null);

    const calculateDaysAbsent = (lastWorkout?: string) => {
        if (!lastWorkout) return 0;
        const last = new Date(lastWorkout);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - last.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    };

    const filteredMembers = useMemo(() => {
        let result = members.filter(member => {
            const matchesSearch = member.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                member.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                member.phone.includes(debouncedSearchTerm);
            
            const matchesStatus = filterStatus === 'All' || member.status === filterStatus;
            const matchesPackage = filterPackage === 'All' || member.packageId.toString() === filterPackage;

            if (isRiskView) {
                const days = calculateDaysAbsent(member.lastWorkoutDate);
                return matchesSearch && days > 7 && member.status === 'Active';
            }

            return matchesSearch && matchesStatus && matchesPackage;
        });
        return result;
    }, [members, debouncedSearchTerm, filterStatus, filterPackage, isRiskView]);

    const handleAddMember = () => { setSelectedMember(null); setModalOpen(true); };
    const handleEditMember = (member: Member) => { setSelectedMember(member); setModalOpen(true); };
    const handleSelectOne = (id: number) => { selectedIds.includes(id) ? setSelectedIds(selectedIds.filter(sid => sid !== id)) : setSelectedIds([...selectedIds, id]); };
    
    const handleSaveMember = (memberData: Omit<Member, 'id'>) => {
        if (selectedMember) {
            updateMember({ ...memberData, id: selectedMember.id });
        } else {
            const newId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;
            // Use provided avatar or generate default if none provided
            const finalAvatar = memberData.avatar || `https://i.pravatar.cc/150?u=${newId}`;
            addMember({ ...memberData, id: newId, avatar: finalAvatar });
        }
        setModalOpen(false);
    };

    const handleAiRescue = async (member: Member) => {
        setRescuingMemberId(member.id);
        const prompt = `
            You are a Gym Motivator Agent. 
            Member: ${member.name}
            Stats: 100kg Squat on Monday (Record Break).
            Status: Absent 2 days. Fees Pending.
            Generate this EXACT message in Hindi/Hinglish (Do not add fluff, just the message):
            "नमस्ते ${member.name.split(' ')[0]}! आपने सोमवार को 100kg स्क्वाट्स मारकर रिकॉर्ड बनाया था, उस मोमेंटम को न खोएं। आपकी फीस पेंडिंग है, पेमेंट करें और कल लेग डे (Leg Day) पर मिलते हैं!"
        `;
        try {
            const message = await getComplexResponse(prompt);
            const mobileNumber = `91${member.phone.replace(/\D/g, '')}`;
            const url = `https://wa.me/${mobileNumber}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        } catch (e) {
            alert("Neural Core Offline.");
        } finally {
            setRescuingMemberId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center">
                    <UserIcon className="w-8 h-8 mr-3 text-amber-400" />
                    <div>
                        <h1 className="text-3xl font-bold text-amber-400">Members Directory</h1>
                        <p className="text-gray-400 text-sm">Manage comprehensive member profiles.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsRiskView(!isRiskView)}
                        className={`font-bold py-2 px-4 rounded-lg flex items-center transition-all ${isRiskView ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                    >
                         <ShieldCheckIcon className="w-4 h-4 mr-2" /> 
                         {isRiskView ? 'Exit Risk View' : 'Churn Risks'}
                    </button>
                    <button onClick={handleAddMember} className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors flex items-center shadow-lg shadow-amber-500/20">
                        <span className="mr-1 text-xl leading-none">+</span> Add Member
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <input 
                    type="text" 
                    placeholder="Search by Name, Phone, or Email..." 
                    className="flex-grow bg-gray-800 text-white p-3 rounded-xl border border-gray-700 focus:outline-none focus:border-amber-500 shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)} 
                    className="bg-gray-800 text-white p-3 rounded-xl border border-gray-700 focus:outline-none focus:border-amber-500"
                >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </div>

            <Card className="overflow-hidden p-0 bg-gray-900 border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-800 text-gray-400 uppercase font-bold text-xs sticky top-0 z-10 shadow-md">
                            <tr>
                                <th className="p-4 w-4">#</th>
                                <th className="p-4">Member Profile</th>
                                <th className="p-4 hidden md:table-cell">Package</th>
                                {isRiskView && <th className="p-4">Neural Analysis</th>}
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {filteredMembers.slice(0, visibleCount).map((member) => (
                                <tr key={member.id} className="hover:bg-gray-800/50 transition-colors group">
                                    <td className="p-4"><input type="checkbox" checked={selectedIds.includes(member.id)} onChange={() => handleSelectOne(member.id)} className="rounded bg-gray-700 border-gray-600 text-amber-500 focus:ring-amber-500" /></td>
                                    <td className="p-4">
                                        <div className="flex items-center">
                                            <div className="relative">
                                                <img src={member.avatar} alt="" className="w-10 h-10 rounded-full mr-3 object-cover border border-gray-700" />
                                                <div className={`absolute bottom-0 right-3 w-2.5 h-2.5 rounded-full border border-gray-900 ${member.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">{member.name}</div>
                                                <div className="text-gray-500 text-xs flex items-center gap-1">
                                                    {member.phone} 
                                                    {member.gender && <span className="bg-gray-700 px-1 rounded text-[9px]">{member.gender.charAt(0)}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 hidden md:table-cell text-gray-300">
                                        {packages.find(p => p.id === member.packageId)?.name || 'Unknown'}
                                        <div className="text-xs text-gray-500">{member.preferredShift || 'General'} Shift</div>
                                    </td>
                                    
                                    {isRiskView ? (
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-red-400 font-bold text-xs">Absent: {calculateDaysAbsent(member.lastWorkoutDate)} Days</span>
                                                <span className="text-gray-500 text-[10px]">Last: {member.lastWorkoutDate || 'Never'}</span>
                                            </div>
                                        </td>
                                    ) : (
                                        <td className="p-4">
                                             <span className={`px-2 py-1 rounded-full text-xs font-bold border ${member.status === 'Active' ? 'bg-green-900/20 text-green-400 border-green-500/30' : 'bg-red-900/20 text-red-400 border-red-500/30'}`}>
                                                {member.status}
                                            </span>
                                        </td>
                                    )}

                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {isRiskView ? (
                                                <button 
                                                    onClick={() => handleAiRescue(member)}
                                                    disabled={rescuingMemberId === member.id}
                                                    className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded-md text-xs font-bold flex items-center disabled:opacity-50 shadow-md"
                                                >
                                                    {rescuingMemberId === member.id ? <AutoUpdateIcon className="w-3 h-3 mr-1 animate-spin"/> : <WhatsAppIcon className="w-3 h-3 mr-1"/>}
                                                    {rescuingMemberId === member.id ? 'Sending...' : 'Rescue'}
                                                </button>
                                            ) : (
                                                <button onClick={() => handleEditMember(member)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-blue-400 transition-colors border border-gray-700">
                                                    <EditIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {visibleCount < filteredMembers.length && (
                    <div className="p-4 text-center border-t border-gray-800">
                        <button onClick={() => setVisibleCount(prev => prev + 20)} className="text-sm text-gray-400 hover:text-white font-semibold">Load More</button>
                    </div>
                )}
            </Card>

            {/* FULL COMPREHENSIVE ADD/EDIT MEMBER FORM WITH PHOTO */}
            <MemberFormModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSaveMember}
                member={selectedMember}
                packages={packages}
                trainers={INITIAL_STAFF.filter(s => s.role === 'Trainer')}
            />
        </div>
    );
};

interface MemberFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (member: Omit<Member, 'id'>) => void;
    member: Member | null;
    packages: any[];
    trainers: any[];
}

const MemberFormModal: React.FC<MemberFormModalProps> = ({ isOpen, onClose, onSave, member, packages, trainers }) => {
    // Initial State including ALL fields + Avatar
    const [formData, setFormData] = useState<Partial<Member>>({
        name: '',
        email: '',
        phone: '',
        dob: '',
        gender: 'Male',
        bloodGroup: '',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        joinDate: new Date().toISOString().split('T')[0],
        packageId: packages[0]?.id || 1,
        trainerId: undefined,
        preferredShift: 'Morning',
        height: 0,
        weight: 0,
        fitnessGoal: 'General Fitness',
        medicalConditions: '',
        status: 'Active',
        whatsappConsent: true,
        avatar: ''
    });

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (member) {
            setFormData(member);
        } else {
            // Reset for Add Mode
            setFormData({
                name: '',
                email: '',
                phone: '',
                dob: '',
                gender: 'Male',
                bloodGroup: '',
                address: '',
                emergencyContactName: '',
                emergencyContactPhone: '',
                joinDate: new Date().toISOString().split('T')[0],
                packageId: packages[0]?.id || 1,
                trainerId: undefined,
                preferredShift: 'Morning',
                height: 0,
                weight: 0,
                fitnessGoal: 'General Fitness',
                medicalConditions: '',
                status: 'Active',
                whatsappConsent: true,
                avatar: ''
            });
        }
    }, [member, isOpen, packages]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                    name === 'packageId' || name === 'trainerId' || name === 'height' || name === 'weight' ? Number(value) : value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setFormData(prev => ({ ...prev, avatar: event.target!.result as string }));
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleCameraCapture = (imgSrc: string) => {
        setFormData(prev => ({ ...prev, avatar: imgSrc }));
        setIsCameraOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Omit<Member, 'id'>);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={member ? `Edit: ${member.name}` : 'New Member Registration'}>
            <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                
                {/* 0. Photo Upload Section (New Update) */}
                <div className="flex flex-col items-center justify-center space-y-4 mb-6">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-700 bg-gray-800 shadow-xl group">
                        {formData.avatar ? (
                            <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <UserIcon className="w-16 h-16" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-white hover:text-amber-400 p-2 bg-gray-700/80 rounded-full transition-transform hover:scale-110" title="Upload Photo">
                                <UploadIcon className="w-5 h-5" />
                            </button>
                            <button type="button" onClick={() => setIsCameraOpen(true)} className="text-white hover:text-amber-400 p-2 bg-gray-700/80 rounded-full transition-transform hover:scale-110" title="Take Photo">
                                <CameraIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    <p className="text-xs text-gray-500">Tap image to update photo</p>
                </div>

                {/* 1. Personal Information */}
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <h4 className="text-amber-400 text-xs font-bold uppercase mb-4 tracking-wider border-b border-gray-700 pb-2">Personal Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Full Name *</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-amber-500 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Phone Number *</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-amber-500 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Email Address</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-amber-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Date of Birth</label>
                            <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-amber-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-amber-500 outline-none">
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Blood Group</label>
                            <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-amber-500 outline-none">
                                <option value="">Select...</option>
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

                {/* 2. Contact & Address */}
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <h4 className="text-blue-400 text-xs font-bold uppercase mb-4 tracking-wider border-b border-gray-700 pb-2">Address & Emergency</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Address</label>
                            <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Emergency Contact Name</label>
                                <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Emergency Contact Phone</label>
                                <input type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Membership Details */}
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <h4 className="text-green-400 text-xs font-bold uppercase mb-4 tracking-wider border-b border-gray-700 pb-2">Gym Membership</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Join Date *</label>
                            <input type="date" name="joinDate" value={formData.joinDate} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-green-500 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Package *</label>
                            <select name="packageId" value={formData.packageId} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-green-500 outline-none" required>
                                {packages.map(p => <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Assigned Trainer</label>
                            <select name="trainerId" value={formData.trainerId || ''} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-green-500 outline-none">
                                <option value="">None</option>
                                {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Preferred Shift</label>
                            <select name="preferredShift" value={formData.preferredShift} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-green-500 outline-none">
                                <option value="Morning">Morning</option>
                                <option value="Afternoon">Afternoon</option>
                                <option value="Evening">Evening</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Account Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-green-500 outline-none">
                                <option value="Active">Active</option>
                                <option value="Expired">Expired</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 4. Physical & Medical */}
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <h4 className="text-purple-400 text-xs font-bold uppercase mb-4 tracking-wider border-b border-gray-700 pb-2">Health Profile</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Height (cm)</label>
                            <input type="number" name="height" value={formData.height || ''} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-purple-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Weight (kg)</label>
                            <input type="number" name="weight" value={formData.weight || ''} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-purple-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Fitness Goal</label>
                            <select name="fitnessGoal" value={formData.fitnessGoal} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-purple-500 outline-none">
                                <option value="General Fitness">General Fitness</option>
                                <option value="Weight Loss">Weight Loss</option>
                                <option value="Muscle Gain">Muscle Gain</option>
                                <option value="Endurance">Endurance</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Medical Conditions / Injuries</label>
                        <textarea name="medicalConditions" value={formData.medicalConditions} onChange={handleChange} rows={2} placeholder="Any injuries, allergies, or conditions..." className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-purple-500 outline-none" />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input type="checkbox" name="whatsappConsent" checked={formData.whatsappConsent} onChange={handleChange} className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-gray-700 border-gray-600" />
                    <label className="text-sm text-gray-300">Enable WhatsApp Notifications (Fees, Schedules, Offers)</label>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-700 sticky bottom-0 bg-gray-900/95 p-4 -mx-6 -mb-6 backdrop-blur-sm">
                    <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors mr-3 font-medium">Cancel</button>
                    <button type="submit" className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-lg hover:shadow-amber-500/20 transition-all transform hover:scale-105">
                        {member ? 'Update Profile' : 'Register Member'}
                    </button>
                </div>
            </form>
            
            <CameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={handleCameraCapture} />
        </Modal>
    );
};

export default Members;
