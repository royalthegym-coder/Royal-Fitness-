
import React, { useState } from 'react';
import { Staff as StaffType } from '../../types';
import { INITIAL_STAFF } from '../../constants';
import Card from './common/Card';
import { UserIcon } from './icons/UserIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { BotIcon } from './icons/BotIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { getComplexResponse } from '../../lib/gemini';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { 
    ShieldCheck, Users, Briefcase, UserPlus, 
    Infinity, Activity, Search, RefreshCw, 
    Clock, Award, Phone, Zap
} from 'lucide-react';

const Staff: React.FC = () => {
    const [staff, setStaff] = useState<StaffType[]>(INITIAL_STAFF);
    const [activeTab, setActiveTab] = useState<'team' | 'roster' | 'payroll'>('team');
    const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
    const [aiReview, setAiReview] = useState<string | null>(null);
    const [isGeneratingReview, setIsGeneratingReview] = useState(false);

    // Mock Roster Data
    const shifts = ['06:00 - 14:00', '14:00 - 22:00', 'OFF'];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const handleGenerateReview = async (member: StaffType) => {
        setIsGeneratingReview(true);
        setAiReview(null);
        setSelectedStaffId(member.id);

        try {
            const prompt = `
                ACT AS 'ROYAL COMMANDER AI'. Write a high-tech performance review for a gym staff member.
                Name: ${member.name}
                Role: ${member.role}
                Tenure: Since ${member.joinDate}
                
                Generate a "Neural Performance Audit" in HTML format.
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

    const renderTeamTab = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
            {staff.map(member => (
                <div key={member.id} className="relative overflow-hidden bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-6 group hover:border-indigo-500/30 transition-all shadow-xl">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                        <ShieldCheck className="w-32 h-32 text-indigo-400" />
                    </div>

                    <div className="relative z-10 flex items-start gap-5 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-900/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg">
                            <span className="text-xl font-black">{member.name[0]}</span>
                        </div>
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
                        className="w-full bg-indigo-600/10 hover:bg-indigo-600 hover:text-white text-indigo-400 border border-indigo-500/30 font-black py-4 rounded-xl transition-all flex items-center justify-center text-[10px] uppercase tracking-widest relative z-10 active:scale-95"
                    >
                        {isGeneratingReview && selectedStaffId === member.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <BotIcon className="w-4 h-4 mr-2" />
                        )}
                        {isGeneratingReview && selectedStaffId === member.id ? 'ANALYZING METRICS...' : 'RUN NEURAL EVALUATION'}
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
            
            <button className="flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-[2.5rem] p-6 hover:border-indigo-500/50 hover:bg-indigo-900/5 transition-all group min-h-[300px]">
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
                    <p className="text-4xl font-black text-white italic tracking-tighter">₹{(staff.reduce((acc, s) => acc + s.salary, 0)).toLocaleString()}</p>
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

            <Card title="Ledger Breakdown" className="bg-[#0c0c0c] border-white/5 p-8 rounded-[3rem]">
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
                                    <td className="p-4 font-bold text-white">{member.name}</td>
                                    <td className="p-4">
                                        <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-[10px] font-bold uppercase">{member.role}</span>
                                    </td>
                                    <td className="p-4"><span className="text-green-400 text-[10px] font-black uppercase tracking-widest bg-green-900/20 px-2 py-1 rounded border border-green-500/20">Active</span></td>
                                    <td className="p-4 text-right font-mono text-gray-400">₹{member.salary.toLocaleString()}</td>
                                    <td className="p-4 text-right font-mono text-green-400">+ ₹0</td>
                                    <td className="p-4 text-right font-black text-white italic text-lg">₹{member.salary.toLocaleString()}</td>
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
             {/* 1. APEX-CONTINUUM HEADER */}
             <div className="bg-[#020202] p-10 rounded-[3.5rem] border border-indigo-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(99,102,241,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-indigo-600 text-white rounded-[3rem] shadow-[0_0_60px_rgba(99,102,241,0.5)] border border-indigo-400 group-hover:rotate-12 transition-transform duration-700">
                            <Briefcase className="w-16 h-16" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-indigo-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Infinity className="w-3 h-3" /> Singularity v31.0
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">ACCESS: COMMANDER</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Personnel <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600">Command</span>
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
            <div className="flex bg-gray-950 p-2 rounded-[2rem] border border-white/5 w-fit shadow-xl">
                {[
                    { id: 'team', label: 'Squadron', icon: <Users className="w-4 h-4"/> },
                    { id: 'roster', label: 'Shift Matrix', icon: <CalendarIcon className="w-4 h-4"/> },
                    { id: 'payroll', label: 'Fiscal Ledger', icon: <DollarSignIcon className="w-4 h-4"/> }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
                            activeTab === tab.id 
                            ? 'bg-indigo-600 text-white shadow-lg' 
                            : 'text-gray-500 hover:text-white'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'team' && renderTeamTab()}
                {activeTab === 'roster' && renderRosterTab()}
                {activeTab === 'payroll' && renderPayrollTab()}
            </div>
        </div>
    );
};

export default Staff;
