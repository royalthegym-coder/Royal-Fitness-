import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench, Calendar, AlertTriangle, CheckCircle2, Factory } from 'lucide-react';

interface Equipment {
    id: string;
    name: string;
    category: string;
    purchaseDate: string;
    warrantyEnd: string;
    lastServiced: string;
    nextService: string;
    status: 'Operational' | 'Maintenance' | 'Out of Order';
    faults: string;
}

const mockEquipment: Equipment[] = [
    { id: 'EQ-001', name: 'Matrix Treadmill T7xe', category: 'Cardio', purchaseDate: '2023-01-15', warrantyEnd: '2028-01-15', lastServiced: '2024-02-10', nextService: '2024-08-10', status: 'Operational', faults: '' },
    { id: 'EQ-002', name: 'Life Fitness Cable Crossover', category: 'Strength', purchaseDate: '2022-05-20', warrantyEnd: '2027-05-20', lastServiced: '2024-01-05', nextService: '2024-07-05', status: 'Maintenance', faults: 'Frayed cable on left pulley' },
    { id: 'EQ-003', name: 'Concept2 Rower', category: 'Cardio', purchaseDate: '2023-11-10', warrantyEnd: '2026-11-10', lastServiced: '2024-03-20', nextService: '2024-09-20', status: 'Operational', faults: '' },
    { id: 'EQ-004', name: 'Hammer Strength Leg Press', category: 'Strength', purchaseDate: '2021-08-12', warrantyEnd: '2026-08-12', lastServiced: '2023-12-01', nextService: '2024-06-01', status: 'Out of Order', faults: 'Seat adjustment pin jammed' },
];

export default function EquipmentManager() {
    const [equipment, setEquipment] = useState<Equipment[]>(mockEquipment);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Operational': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'Maintenance': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'Out of Order': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Equipment Fleet</h2>
                    <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-mono">Hardware Maintenance Hub</p>
                </div>
                <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-colors shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2">
                    <Factory className="w-4 h-4" /> Add Asset
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-black/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Total Assets</p>
                            <h3 className="text-3xl font-black text-white mt-2">124</h3>
                        </div>
                        <Factory className="w-8 h-8 text-cyan-400 opacity-50" />
                    </div>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Operational</p>
                            <h3 className="text-3xl font-black text-green-400 mt-2">118</h3>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-green-400 opacity-50" />
                    </div>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">In Maintenance</p>
                            <h3 className="text-3xl font-black text-amber-400 mt-2">4</h3>
                        </div>
                        <Wrench className="w-8 h-8 text-amber-400 opacity-50" />
                    </div>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Out of Order</p>
                            <h3 className="text-3xl font-black text-red-500 mt-2">2</h3>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-red-500 opacity-50" />
                    </div>
                </div>
            </div>

            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    {/* Desktop Table View */}
                    <table className="w-full text-left border-collapse quantum-table hidden md:table">
                        <thead>
                            <tr className="border-b border-white/10 bg-black/60">
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Asset ID</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Name / Category</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Warranty Ends</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Next Service</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Status / Faults</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equipment.map((eq) => (
                                <tr key={eq.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-4 whitespace-nowrap">
                                        <span className="font-mono text-cyan-400 text-sm font-bold">{eq.id}</span>
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        <p className="text-white font-bold">{eq.name}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{eq.category}</p>
                                    </td>
                                    <td className="p-4 text-sm text-gray-300 font-mono whitespace-nowrap">
                                        {eq.warrantyEnd}
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-cyan-500" />
                                            <span className="text-sm font-mono text-gray-300">{eq.nextService}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-2 items-start">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(eq.status)}`}>
                                                {eq.status}
                                            </span>
                                            {eq.faults && (
                                                <span className="text-xs text-red-400 flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" /> {eq.faults}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right whitespace-nowrap">
                                        <button className="text-cyan-400 hover:text-cyan-300 text-xs font-bold uppercase tracking-widest border border-cyan-500/30 px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors">
                                            Log Service
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Mobile Card Layout */}
                    <div className="md:hidden flex flex-col space-y-4 p-4">
                        {equipment.map((eq) => (
                            <div key={eq.id} className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <h4 className="text-white font-bold">{eq.name}</h4>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{eq.category} • <span className="text-cyan-400 font-mono">{eq.id}</span></p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusColor(eq.status)}`}>
                                        {eq.status}
                                    </span>
                                </div>
                                
                                {eq.faults && (
                                    <div className="text-xs text-red-400 flex items-center gap-1.5 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                        <AlertTriangle className="w-4 h-4 flex-shrink-0" /> 
                                        <span>{eq.faults}</span>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-3 mt-1">
                                    <div>
                                        <p className="text-gray-500 mb-1 w-full uppercase tracking-widest text-[9px] font-bold">Warranty Ends</p>
                                        <p className="text-gray-300 font-mono">{eq.warrantyEnd}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-1 w-full uppercase tracking-widest text-[9px] font-bold">Next Service</p>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                                            <span className="text-gray-300 font-mono">{eq.nextService}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="w-full mt-2 text-cyan-400 hover:text-cyan-300 text-xs font-bold uppercase tracking-widest border border-cyan-500/30 px-4 py-2.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors">
                                    Log Service
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
