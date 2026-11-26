import { getCurrencySymbol } from '../../store/useCurrencyStore';
import React, { useState } from 'react';
import { Download, Upload, DollarSign, Calendar, IndianRupee } from 'lucide-react';

const mockPayroll = [
    { id: 1, name: 'Arjun Singh', role: 'Head Trainer', salary: 45000, status: 'Paid', date: '2024-04-01' },
    { id: 2, name: 'Priya Sharma', role: 'Yoga Instructor', salary: 35000, status: 'Pending', date: '2024-04-01' },
    { id: 3, name: 'Ravi Kumar', role: 'Facility Manager', salary: 30000, status: 'Paid', date: '2024-04-01' },
    { id: 4, name: 'Neha Gupta', role: 'Receptionist', salary: 25000, status: 'Processing', date: '2024-04-01' },
];

export default function PayrollManager() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Payroll & Expenses</h2>
                    <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-mono">Financial Distribution Hub</p>
                </div>
                <div className="flex gap-4">
                    <button className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-colors border border-white/10 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-colors shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2">
                        <IndianRupee className="w-4 h-4" /> Run Payroll
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-black/40 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-md">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Total Payroll (April)</p>
                    <h3 className="text-4xl font-black text-emerald-400 mt-2">{getCurrencySymbol()}1,35,000</h3>
                </div>
                <div className="bg-black/40 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-md">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Pending Clearance</p>
                    <h3 className="text-4xl font-black text-amber-400 mt-2">{getCurrencySymbol()}35,000</h3>
                </div>
                <div className="bg-black/40 border border-fuchsia-500/30 rounded-2xl p-6 backdrop-blur-md">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Facility Expenses</p>
                    <h3 className="text-4xl font-black text-fuchsia-400 mt-2">{getCurrencySymbol()}48,200</h3>
                </div>
            </div>

            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                    <h3 className="text-lg font-black text-white uppercase tracking-widest">Staff Compensation</h3>
                    <div className="flex gap-2">
                        <select className="bg-black/50 border border-white/10 text-white text-xs rounded-lg px-4 py-2 uppercase tracking-widest outline-none">
                            <option>April 2024</option>
                            <option>March 2024</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {/* Desktop Table */}
                    <table className="w-full text-left border-collapse quantum-table hidden md:table">
                        <thead>
                            <tr className="border-b border-white/10 bg-black/60">
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Employee</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Role</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Base Salary</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockPayroll.map((staff) => (
                                <tr key={staff.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-4 whitespace-nowrap">
                                        <p className="text-white font-bold">{staff.name}</p>
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        <span className="text-xs text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">{staff.role}</span>
                                    </td>
                                    <td className="p-4 font-mono text-gray-200 whitespace-nowrap">{getCurrencySymbol()}{staff.salary.toLocaleString()}
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                                            staff.status === 'Paid' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                                            staff.status === 'Pending' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 
                                            'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                        }`}>
                                            {staff.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right whitespace-nowrap">
                                        <button className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center justify-end gap-2 w-full">
                                           Process <Upload className="w-3 h-3" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Mobile Card Layout */}
                    <div className="md:hidden flex flex-col space-y-4 mt-4">
                        {mockPayroll.map((staff) => (
                            <div key={staff.id} className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-white font-bold">{staff.name}</h4>
                                        <span className="text-[10px] text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 mt-1 inline-block">{staff.role}</span>
                                    </div>
                                    <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${
                                        staff.status === 'Paid' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                                        staff.status === 'Pending' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 
                                        'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                    }`}>
                                        {staff.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1">
                                    <div className="font-mono text-gray-200">
                                        <span className="text-[10px] text-gray-500 mr-1 uppercase">Salary:</span>
                                        {getCurrencySymbol()}{staff.salary.toLocaleString()}
                                    </div>
                                    <button className="text-gray-300 hover:text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                                       Process <Upload className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
