import { getCurrencySymbol } from '../store/useCurrencyStore';

import React, { useState } from 'react';
import { Staff as StaffType } from '../../types';
import { INITIAL_STAFF } from '../../constants';
import Card from './common/Card';
import { UserIcon } from './icons/UserIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { BotIcon } from './icons/BotIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { getComplexResponse } from '../../lib/core_ai';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';
import { 
    ShieldCheck, Users, Briefcase, UserPlus, 
    Infinity, Activity, Search, RefreshCw, 
    Clock, Award, Phone, Zap, Upload, Camera, Trash2
} from 'lucide-react';

const Staff: React.FC = () => {
    const { staff, setStaff } = useData();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'team' | 'roster' | 'payroll'>('team');
    const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
    const [aiReview, setAiReview] = useState<string | null>(null);
    const [isGeneratingReview, setIsGeneratingReview] = useState(false);
    const [isRecruiting, setIsRecruiting] = useState(false);
    const [newStaff, setNewStaff] = useState<Partial<StaffType>>({
        name: '', role: 'Trainer', phone: '', salary: 0, joinDate: new Date().toISOString().split('T')[0], photo: undefined
    });
    const [dragOver, setDragOver] = useState(false);

    const handleFileSelect = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setNewStaff(prev => ({ ...prev, photo: result }));
                addToast("Photo loaded successfully!", "success");
            };
            reader.readAsDataURL(file);
        } else {
            addToast("Please select a valid image file.", "error");
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    // Roster Data
    const shifts = ['06:00 - 14:00', '14:00 - 22:00', 'OFF'];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const handleGenerateReview = async (member: StaffType) => {
        setIsGeneratingReview(true);
        setAiReview(null);
        setSelectedStaffId(member.id);

        try {
            const prompt = `
                ACT AS 'FUTURE COMMANDER AI'. Write a high-tech performance review for a gym staff member.
                Name: ${member.name}
                Role: ${member.role}
                Tenure: Since ${member.joinDate}
                
                Generate a "Smart Performance Audit" in HTML format.
                Include:
                1. <b style="color:#818cf8">Efficiency Rating:</b> (90-99%)
                2. <b style="color:#34d399">Tactical Strengths:</b> (2 bullet points)
                3. <b style="color:#facc15">Optimization Required:</b> (1 area for growth)
                
                Keep it futuristic and motivating.
            `;
            const review = await getComplexResponse(prompt);
            setAiReview(review);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingReview(false);
        }
    };

    const handleAddStaff = () => {
        if (!newStaff.name) {
            addToast("Full Name is required to recruit an agent.", "error");
            return;
        }
        if (!newStaff.phone) {
            addToast("Phone Number is required.", "error");
            return;
        }
        const createdStaff: StaffType = {
            id: Date.now(),
            name: newStaff.name || '',
            role: newStaff.role as ('Trainer' | 'Manager' | 'Cleaning' | 'Reception'),
            phone: newStaff.phone || '',
            joinDate: newStaff.joinDate || new Date().toISOString().split('T')[0],
            salary: newStaff.salary || 0,
            photo: newStaff.photo,
        };
        setStaff([...staff, createdStaff]);
        setIsRecruiting(false);
        setNewStaff({ name: '', role: 'Trainer', phone: '', salary: 0, joinDate: new Date().toISOString().split('T')[0], photo: undefined });
        addToast(`Agent ${createdStaff.name} recruited successfully!`, "success");
    };

    const renderTeamTab = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
            {staff.map(member => (
                <div key={member.id} className="relative overflow-hidden bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-6 group hover:border-indigo-500/30 transition-all shadow-xl">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                        <ShieldCheck className="w-32 h-32 text-indigo-400" />
                    </div>

                    <div className="relative z-10 flex items-start gap-5 mb-6">
                        {member.photo ? (
                            <img src={member.photo} alt={member.name} className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-indigo-900/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg">
                                <span className="text-xl font-black">{member.name[0]}</span>
                            </div>
                        )}
                        <div>
                            <h3 className="font-black text-white text-lg uppercase italic tracking-tight">{member.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${
                                    member.role === 'Manager' ? 'bg-purple-900/20 text-purple-400 border-purple-500/30' :
                                    member.role === 'Trainer' ? 'bg-amber-900/20 text-amber-400 border-amber-500/30' :
                                    'bg-blue-900/20 text-blue-400 border-blue-500/30'
                                }`}>{member.role}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-3 relative z-10 bg-black/40 p-4 rounded-2xl border border-white/5 mb-6">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 flex items-center gap-2"><Phone className="w-3 h-3"/> Contact</span>
                            <span className="text-gray-300 font-mono">{member.phone}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 flex items-center gap-2"><Clock className="w-3 h-3"/> Since</span>
                            <span className="text-gray-300 font-mono">{member.joinDate}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 flex items-center gap-2"><Award className="w-3 h-3"/> Rating</span>
                            <span className="text-amber-400 font-black">4.9/5.0</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => handleGenerateReview(member)}
                        disabled={isGeneratingReview && selectedStaffId === member.id}
                        className="w-full bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600 hover:to-purple-600 text-indigo-400 hover:text-white border border-indigo-500/50 border-dashed font-black py-4 rounded-xl transition-all flex items-center justify-center text-[10px] uppercase tracking-widest relative z-10 active:scale-95 shadow-[0_0_15px_rgba(99,102,241,0.2)] overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                        <span className="relative z-10 flex items-center justify-center">
                            {isGeneratingReview && selectedStaffId === member.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <BotIcon className="w-4 h-4 mr-2" />
                            )}
                            {isGeneratingReview && selectedStaffId === member.id ? 'ANALYZING METRICS...' : 'RUN NEURAL EVALUATION'}
                        </span>
                    </button>

                    {selectedStaffId === member.id && aiReview && (
                        <div className="mt-4 p-4 bg-gray-900/95 rounded-2xl border border-indigo-500/30 animate-fade-in absolute inset-0 z-20 overflow-y-auto backdrop-blur-xl">
                            <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-900/95 pb-2 border-b border-white/10 pt-1">
                                <h4 className="font-black text-white text-xs uppercase tracking-widest flex items-center gap-2">
                                    <SparkleIcon className="w-3 h-3 text-amber-400"/> Performance Audit
                                </h4>
                                <button onClick={() => setSelectedStaffId(null)} className="text-[10px] font-bold text-gray-500 hover:text-white bg-white/5 px-2 py-1 rounded">CLOSE</button>
                            </div>
                            <div className="prose prose-invert prose-sm text-xs text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: aiReview.replace(/\n/g, '<br />') }} />
                        </div>
                    )}
                </div>
            ))}
            
            <button 
                onClick={() => setIsRecruiting(true)}
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-[2.5rem] p-6 hover:border-indigo-500/50 hover:bg-indigo-900/5 transition-all group min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xl border border-white/5">
                    <UserPlus className="w-6 h-6 text-gray-500 group-hover:text-indigo-400" />
                </div>
                <span className="font-black text-gray-500 group-hover:text-white uppercase tracking-widest text-xs">Recruit Agent</span>
            </button>
        </div>
    );

    const renderRosterTab = () => (
        <Card className="bg-[#0c0c0c] border-white/5 p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Shift Matrix</h3>
                <div className="flex gap-2">
                    <span className="text-[10px] bg-blue-900/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">AM SHIFT</span>
                    <span className="text-[10px] bg-indigo-900/20 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">PM SHIFT</span>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-black/40 text-gray-500 font-black uppercase text-[10px] tracking-widest">
                        <tr>
                            <th className="p-6 min-w-[150px]">Agent</th>
                            {days.map(day => <th key={day} className="p-6 text-center min-w-[100px]">{day}</th>)}
                        </tr>
                    </thead>
                    <tbody className="text-gray-300 divide-y divide-white/5">
                        {staff.map((member, i) => (
                            <tr key={member.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-6 font-bold text-white flex items-center gap-3">
                                    <div className={`w-1.5 h-8 rounded-full ${member.role === 'Trainer' ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                                    <div>
                                        {member.name}
                                        <p className="text-[9px] text-gray-500 font-normal uppercase tracking-wider">{member.role}</p>
                                    </div>
                                </td>
                                {days.map((_, dayIdx) => {
                                    const shiftIdx = (i + dayIdx) % shifts.length;
                                    const shift = shifts[shiftIdx];
                                    return (
                                        <td key={dayIdx} className="p-4 text-center">
                                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${
                                                shift === 'OFF' ? 'bg-gray-900 text-gray-600 border-gray-800' : 
                                                shift.includes('06:00') ? 'bg-blue-900/20 text-blue-400 border-blue-500/20' :
                                                'bg-indigo-900/20 text-indigo-400 border-indigo-500/20'
                                            }`}>
                                                {shift}
                                            </span>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );

    const renderPayrollTab = () => (
        <div className="space-y-8 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-green-900/20 to-black border-green-500/30 p-8 rounded-[2.5rem]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Total Payroll</h3>
                        <div className="p-2 bg-green-500/20 rounded-full text-green-400"><DollarSignIcon className="w-5 h-5" /></div>
                    </div>
                    <p className="text-4xl font-black text-white italic tracking-tighter">{getCurrencySymbol()}{(staff.reduce((acc, s) => acc + s.salary, 0)).toLocaleString()}</p>
                    <p className="text-[10px] text-green-400 mt-2 font-bold uppercase tracking-wide">Monthly Obligation</p>
                </Card>
                <Card className="bg-gradient-to-br from-amber-900/20 to-black border-amber-500/30 p-8 rounded-[2.5rem]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Active Units</h3>
                        <div className="p-2 bg-amber-500/20 rounded-full text-amber-400"><Users className="w-5 h-5" /></div>
                    </div>
                    <p className="text-4xl font-black text-white italic tracking-tighter">{staff.length}</p>
                    <p className="text-[10px] text-amber-400 mt-2 font-bold uppercase tracking-wide">FTE Capacity</p>
                </Card>
                <Card className="bg-gradient-to-br from-purple-900/20 to-black border-purple-500/30 p-8 rounded-[2.5rem]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Payout Cycle</h3>
                        <div className="p-2 bg-purple-500/20 rounded-full text-purple-400"><CalendarIcon className="w-5 h-5" /></div>
                    </div>
                    <p className="text-4xl font-black text-white italic tracking-tighter">01 AUG</p>
                    <p className="text-[10px] text-purple-400 mt-2 font-bold uppercase tracking-wide">T-Minus 3 Days</p>
                </Card>
            </div>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Ledger Breakdown</h2>
                <button 
                    className="bg-green-600 hover:bg-green-500 text-white font-black px-6 py-3 rounded-xl uppercase tracking-widest text-[#10px] flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] active:scale-95"
                    onClick={() => {
                        alert("Automated Payroll Distribution to Staff Bank Accounts Executed (Simulation). Ledger Updated.");
                    }}
                >
                    <Zap className="w-4 h-4" /> Execute Auto-Payroll Sync
                </button>
            </div>
            <Card className="bg-[#0c0c0c] border-white/5 p-8 rounded-[3rem]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-black/40 text-gray-500 font-black uppercase text-[10px] tracking-widest border-b border-white/5">
                            <tr>
                                <th className="p-4">Staff Identity</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Base Salary</th>
                                <th className="p-4 text-right">Performance Bonus</th>
                                <th className="p-4 text-right">Net Payable</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-300 divide-y divide-white/5 text-sm">
                            {staff.map(member => (
                                <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 font-bold text-white flex items-center gap-3">
                                        {member.photo ? (
                                            <img src={member.photo} alt={member.name} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-lg bg-indigo-900/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">{member.name[0]}</div>
                                        )}
                                        <span>{member.name}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-[10px] font-bold uppercase">{member.role}</span>
                                    </td>
                                    <td className="p-4"><span className="text-green-400 text-[10px] font-black uppercase tracking-widest bg-green-900/20 px-2 py-1 rounded border border-green-500/20">Active</span></td>
                                    <td className="p-4 text-right font-mono text-gray-400">{getCurrencySymbol()}{member.salary.toLocaleString()}</td>
                                    <td className="p-4 text-right font-mono text-green-400`>+ ${getCurrencySymbol()}0</td>
                                    <td className=`p-4 text-right font-black text-white italic text-lg">{getCurrencySymbol()}{member.salary.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-24">
             {/* 1. FitnessFuture-CONTINUUM HEADER */}
             <div className="bg-[#020202] p-10 rounded-[3.5rem] border border-cyan-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-[3rem] shadow-[0_0_60px_rgba(6,182,212,0.5)] border border-cyan-400 group-hover:rotate-12 transition-transform duration-700">
                            <Briefcase className="w-16 h-16" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Infinity className="w-3 h-3" /> FitnessFutureMatrix Fitness Future
                                </div>
                                <span className="text-[10px] font-mono text-cyan-500/70 tracking-[0.4em] uppercase">ACCESS: COMMANDER</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Personnel <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400">Command</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex bg-gray-900/80 p-2 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl">
                         <div className="px-10 py-5 text-center border-r border-white/5">
                             <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Total Units</p>
                             <p className="text-4xl font-black text-white italic">{staff.length}</p>
                         </div>
                         <div className="px-10 py-5 text-center">
                             <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">On Duty</p>
                             <div className="flex items-center gap-2 justify-center">
                                 <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                                 <p className="text-4xl font-black text-green-400 italic">3</p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. CONTROL DECK */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex bg-gray-950 p-2 rounded-[2rem] border border-white/5 w-fit shadow-xl">
                    {[
                        { id: 'team', label: 'Squadron', icon: <Users className="w-4 h-4"/> },
                        { id: 'roster', label: 'Shift Matrix', icon: <CalendarIcon className="w-4 h-4"/> },
                        { id: 'payroll', label: 'Fiscal Ledger', icon: <DollarSignIcon className="w-4 h-4"/> }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 relative overflow-hidden group ${
                                activeTab === tab.id 
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-indigo-400/50 border-dashed' 
                                : 'text-gray-500 hover:text-white border border-transparent'
                            }`}
                        >
                            {activeTab === tab.id && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
                            <span className="relative z-10 flex items-center gap-3">{tab.icon} {tab.label}</span>
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setIsRecruiting(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all"
                >
                    <UserPlus className="w-4 h-4" /> Recruit Agent
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'team' && renderTeamTab()}
                {activeTab === 'roster' && renderRosterTab()}
                {activeTab === 'payroll' && renderPayrollTab()}
            </div>

             {/* Recruit Agent Modal */}
             {isRecruiting && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                     <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-[3rem] w-full max-w-md animate-fade-in relative max-h-[90vh] overflow-y-auto">
                         <div className="sticky top-0 bg-[#0a0a0a] pb-4 mb-4 border-b border-white/5 flex justify-between items-center z-10">
                             <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                                 <UserPlus className="w-6 h-6 text-indigo-400" /> New Agent Profile
                             </h2>
                             <button onClick={() => setIsRecruiting(false)} className="text-gray-500 hover:text-white" title="Close">
                                 <Search className="w-5 h-5 rotate-45" /> {/* Close icon lookalike */}
                             </button>
                         </div>

                         <div className="space-y-4">
                             {/* Drag & Drop Photo Zone and Presets */}
                             <div>
                                 <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 block">Agent Photo</label>
                                 <div className="flex flex-col items-center justify-center p-5 bg-white/5 border border-white/5 rounded-3xl gap-4">
                                     <div className="relative group">
                                         {newStaff.photo ? (
                                             <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                                                 <img src={newStaff.photo} alt={newStaff.name || "New Staff"} className="w-full h-full object-cover" />
                                                 <button 
                                                     id="remove-photo-button"
                                                     type="button"
                                                     onClick={() => setNewStaff(prev => ({ ...prev, photo: undefined }))}
                                                     className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 font-bold text-xs"
                                                     title="Remove Photo"
                                                 >
                                                     <Trash2 className="w-5 h-5" />
                                                 </button>
                                             </div>
                                         ) : (
                                             <div className="w-24 h-24 rounded-full bg-indigo-900/20 border-2 border-dashed border-indigo-500/30 flex items-center justify-center text-indigo-400">
                                                 <Camera className="w-8 h-8 opacity-60" />
                                             </div>
                                         )}
                                     </div>

                                     {/* Drag & Drop zone */}
                                     <div 
                                         id="photo-drag-drop-zone"
                                         onDragOver={handleDragOver}
                                         onDragLeave={handleDragLeave}
                                         onDrop={handleDrop}
                                         onClick={() => document.getElementById('custom-photo-input')?.click()}
                                         className={`w-full py-4 px-2 border border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                                             dragOver ? 'border-cyan-400 bg-cyan-950/20 text-cyan-400' : 'border-white/10 hover:border-indigo-500/50 hover:bg-white/5 text-gray-500 hover:text-gray-300'
                                         }`}
                                     >
                                         <input 
                                             type="file" 
                                             id="custom-photo-input" 
                                             accept="image/*" 
                                             className="hidden" 
                                             onChange={(e) => {
                                                 if (e.target.files && e.target.files.length > 0) {
                                                     handleFileSelect(e.target.files[0]);
                                                 }
                                             }}
                                         />
                                         <Upload className="w-4 h-4 mx-auto mb-1 opacity-70" />
                                         <p className="text-[10px] font-bold uppercase tracking-wider">Drag & drop photo or click to browse</p>
                                     </div>

                                     {/* Quick Presets */}
                                     <div className="w-full">
                                         <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest text-center mb-2">Or click to select a preset portfolio image</p>
                                         <div className="flex gap-2.5 justify-center">
                                             {[
                                                 { name: 'Coach Rahul', url: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=200&h=200' },
                                                 { name: 'Trainer Priya', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200' },
                                                 { name: 'Coach Dev', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200' },
                                                 { name: 'Admin Sameer', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200' },
                                             ].map((preset, idx) => (
                                                 <button
                                                     key={idx}
                                                     id={`preset-photo-btn-${idx}`}
                                                     type="button"
                                                     onClick={() => setNewStaff(prev => ({ ...prev, photo: preset.url }))}
                                                     className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all hover:scale-110 active:scale-95 ${
                                                         newStaff.photo === preset.url ? 'border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'border-transparent hover:border-white/20'
                                                     }`}
                                                     title={`Use preset for ${preset.name}`}
                                                 >
                                                     <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                                                 </button>
                                             ))}
                                         </div>
                                     </div>
                                 </div>
                             </div>

                             <div>
                                 <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 block">Full Name</label>
                                 <input 
                                     id="staff-name-input"
                                     type="text" 
                                     value={newStaff.name} 
                                     onChange={(e) => setNewStaff({...newStaff, name: e.target.value})} 
                                     className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
                                     placeholder="e.g. Rahul Sharma"
                                 />
                             </div>
                             <div>
                                 <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 block">Role</label>
                                 <select 
                                     id="staff-role-select"
                                     value={newStaff.role} 
                                     onChange={(e) => setNewStaff({...newStaff, role: e.target.value as any})} 
                                     className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
                                 >
                                     <option>Trainer</option>
                                     <option>Manager</option>
                                     <option>Reception</option>
                                     <option>Cleaning</option>
                                 </select>
                             </div>
                             <div>
                                 <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 block">Phone Number</label>
                                 <input 
                                     id="staff-phone-input"
                                     type="text" 
                                     value={newStaff.phone} 
                                     onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})} 
                                     className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
                                     placeholder="e.g. +91 9876543210"
                                 />
                             </div>
                             <div>
                                 <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 block">Monthly Salary / Package</label>
                                 <input 
                                     id="staff-salary-input"
                                     type="number" 
                                     value={newStaff.salary || ''} 
                                     onChange={(e) => setNewStaff({...newStaff, salary: Number(e.target.value)})} 
                                     className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
                                     placeholder="e.g. 25000"
                                 />
                             </div>
                         </div>

                         <div className="mt-8 flex gap-4 sticky bottom-0 bg-[#0a0a0a] pt-4 border-t border-white/5">
                             <button id="cancel-recruit-btn" onClick={() => setIsRecruiting(false)} className="flex-1 bg-white/5 hover:bg-white/10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors text-white">
                                 Cancel
                             </button>
                             <button id="save-recruit-btn" onClick={handleAddStaff} className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] text-white">
                                 Save Profile
                             </button>
                         </div>
                     </div>
                 </div>
             )}
        </div>
    );
};

export default Staff;
