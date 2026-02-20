
import React from 'react';
import Card from '../common/Card';
import { Map, MapPin } from 'lucide-react';
import { GYM_INFO } from '../../constants';

// Simulated City Zones
const ZONES = [
    { name: 'Downtown', density: 'High', color: 'bg-red-500' },
    { name: 'North Sector', density: 'Medium', color: 'bg-amber-500' },
    { name: 'West End', density: 'Low', color: 'bg-green-500' },
    { name: 'Tech Park', density: 'High', color: 'bg-red-500' },
    { name: 'Old Town', density: 'Medium', color: 'bg-amber-500' },
    { name: 'Suburbs', density: 'Low', color: 'bg-green-500' },
];

const CityHealthMap: React.FC = () => {
    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="p-10 rounded-[3.5rem] bg-[#050505] border border-cyan-500/20 shadow-2xl">
                 <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                    <Map className="w-12 h-12 text-cyan-400" />
                    City <span className="text-cyan-500">Health Grid</span>
                </h1>
                <p className="text-gray-500 text-xs font-mono mt-2 tracking-widest uppercase">Member Density & Fitness Index</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card className="bg-gray-900 border-white/5 p-0 overflow-hidden h-[500px] relative rounded-[3rem]">
                        {/* Visual Holographic Grid */}
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-1 p-4">
                            {ZONES.map((zone, i) => (
                                <div key={i} className={`relative rounded-3xl border border-white/5 flex items-center justify-center group overflow-hidden bg-black/40`}>
                                    <div className={`absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity ${zone.color}`}></div>
                                    <div className="text-center z-10">
                                        <h4 className="text-white font-black uppercase text-xl italic">{zone.name}</h4>
                                        <p className="text-[10px] text-gray-400 font-mono mt-1 uppercase tracking-widest">{zone.density} Activity</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Center Gym Location */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black p-4 rounded-full border-4 border-cyan-500 shadow-[0_0_50px_cyan] z-20">
                            <MapPin className="w-8 h-8 text-cyan-400" />
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card title="Regional Intelligence" className="bg-black border-white/10 h-full">
                        <div className="space-y-4">
                            {ZONES.map((z, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-900/50 border border-white/5">
                                    <span className="text-sm font-bold text-gray-300">{z.name}</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${z.color}`}></div>
                                        <span className="text-[10px] text-gray-500 uppercase">{z.density}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CityHealthMap;
