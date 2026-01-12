
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
                Act as a Gym Manager. Write a short, constructive performance review for a staff member.
                Name: ${member.name}
                Role: ${member.role}
                Tenure: Since ${member.joinDate}
                
                Highlight 2 strengths (e.g. punctuality, member engagement) and 1 area for growth.
                Keep it professional and motivating. Format with HTML.
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map(member => (
                <Card key={member.id} className="relative overflow-hidden group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                            <div className="p-3 bg-gray-800 rounded-full mr-4 border border-gray-700">
                                <UserIcon className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white">{member.name}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                                    member.role === 'Manager' ? 'bg-purple-900/30 text-purple-400' :
                                    member.role === 'Trainer' ? 'bg-amber-900/30 text-amber-400' :
                                    'bg-blue-900/30 text-blue-400'
                                }`}>{member.role}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-400 mb-6">
                        <div className="flex justify-between">
                            <span>Phone:</span>
                            <span className="text-gray-300">{member.phone}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Joined:</span>
                            <span className="text-gray-300">{member.joinDate}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Base Salary:</span>
                            <span className="text-green-400 font-mono">₹{member.salary.toLocaleString()}</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => handleGenerateReview(member)}
                        disabled={isGeneratingReview && selectedStaffId === member.id}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center text-xs"
                    >
                        {isGeneratingReview && selectedStaffId === member.id ? (
                            <SparkleIcon className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <BotIcon className="w-4 h-4 mr-2" />
                        )}
                        {isGeneratingReview && selectedStaffId === member.id ? 'Analyzing...' : 'Generate AI Review'}
                    </button>

                    {selectedStaffId === member.id && aiReview && (
                        <div className="mt-4 p-3 bg-gray-900/80 rounded border border-amber-500/30 animate-fade-in absolute inset-0 z-10 overflow-y-auto">
                            <div className="flex justify-between items-center mb-2 sticky top-0 bg-gray-900/90 pb-2 border-b border-gray-700">
                                <h4 className="font-bold text-amber-400 text-xs">Performance Report</h4>
                                <button onClick={() => setSelectedStaffId(null)} className="text-xs text-gray-400 hover:text-white">Close</button>
                            </div>
                            <div className="prose dark:prose-invert prose-sm text-xs" dangerouslySetInnerHTML={{ __html: aiReview.replace(/\n/g, '<br />') }} />
                        </div>
                    )}
                </Card>
            ))}
            
            <button className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-xl p-6 hover:border-amber-500 hover:bg-gray-800/30 transition-all group min-h-[250px]">
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-2xl text-gray-500 group-hover:text-amber-500">+</span>
                </div>
                <span className="font-bold text-gray-500 group-hover:text-amber-400">Onboard Staff</span>
            </button>
        </div>
    );

    const renderRosterTab = () => (
        <Card title="Weekly Shift Roster" className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-gray-700 text-gray-400">
                        <th className="p-3 min-w-[150px]">Employee</th>
                        {days.map(day => <th key={day} className="p-3 text-center min-w-[100px]">{day}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {staff.map((member, i) => (
                        <tr key={member.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                            <td className="p-3 font-medium flex items-center gap-2">
                                <div className={`w-2 h-8 rounded-sm ${member.role === 'Trainer' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                                {member.name}
                            </td>
                            {days.map((_, dayIdx) => {
                                // Deterministic "random" shift for demo
                                const shiftIdx = (i + dayIdx) % shifts.length;
                                const shift = shifts[shiftIdx];
                                return (
                                    <td key={dayIdx} className="p-3 text-center">
                                        <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                                            shift === 'OFF' ? 'bg-gray-800 text-gray-500' : 
                                            'bg-blue-900/30 text-blue-300 border border-blue-500/20'
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
        </Card>
    );

    const renderPayrollTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-green-900/40 to-gray-800 border-green-500/30">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-400 text-sm font-bold uppercase">Total Payroll</h3>
                        <DollarSignIcon className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">₹{(staff.reduce((acc, s) => acc + s.salary, 0)).toLocaleString()}</p>
                    <p className="text-xs text-green-400 mt-2">Monthly Estimate</p>
                </Card>
                <Card className="bg-gradient-to-br from-amber-900/40 to-gray-800 border-amber-500/30">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-400 text-sm font-bold uppercase">Active Staff</h3>
                        <UserIcon className="w-6 h-6 text-amber-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">{staff.length}</p>
                    <p className="text-xs text-amber-400 mt-2">Full-time Equivalent</p>
                </Card>
                <Card className="bg-gradient-to-br from-purple-900/40 to-gray-800 border-purple-500/30">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-400 text-sm font-bold uppercase">Next Payout</h3>
                        <CalendarIcon className="w-6 h-6 text-purple-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">01 Aug</p>
                    <p className="text-xs text-purple-400 mt-2">In 3 Days</p>
                </Card>
            </div>

            <Card title="Payroll Breakdown">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-700 text-gray-400 text-sm">
                                <th className="p-3">Staff Name</th>
                                <th className="p-3">Role</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Base Salary</th>
                                <th className="p-3 text-right">Bonus (Est.)</th>
                                <th className="p-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-300">
                            {staff.map(member => (
                                <tr key={member.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                    <td className="p-3 font-medium">{member.name}</td>
                                    <td className="p-3 text-sm">{member.role}</td>
                                    <td className="p-3"><span className="bg-green-900/30 text-green-400 px-2 py-0.5 rounded text-xs">Active</span></td>
                                    <td className="p-3 text-right font-mono">₹{member.salary.toLocaleString()}</td>
                                    <td className="p-3 text-right font-mono text-gray-500">₹0</td>
                                    <td className="p-3 text-right font-bold text-white">₹{member.salary.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-amber-400 flex items-center">
                        <UserIcon className="w-8 h-8 mr-3 text-amber-400" />
                        Staff Command Center
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Manage team rosters, performance, and payroll.</p>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg w-full md:w-auto inline-flex">
                {[
                    { id: 'team', label: 'Team Overview', icon: <UserIcon className="w-4 h-4 mr-2"/> },
                    { id: 'roster', label: 'Shift Roster', icon: <CalendarIcon className="w-4 h-4 mr-2"/> },
                    { id: 'payroll', label: 'Payroll', icon: <DollarSignIcon className="w-4 h-4 mr-2"/> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            activeTab === tab.id 
                            ? 'bg-amber-500 text-gray-900 shadow-lg' 
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
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
