
import React from 'react';
import Card from '../common/Card';
import { Play, Database, BrainCircuit } from 'lucide-react';

interface WarriorProtocolCardProps {
    exercise: string;
    protocol: string;
    tubeId: string; // Kept for interface compatibility but ignored or reused for ID tracking if needed
    onSetComplete?: () => void;
}

const WarriorProtocolCard: React.FC<WarriorProtocolCardProps> = ({ exercise, protocol, tubeId }) => {
    
    const handleNeuralLink = () => {
        // Since we removed YouTube, we can trigger an alert or open the modal if we had context
        // For this isolated component, we'll just indicate action
        console.log("Activating Neural Link for:", exercise);
        // Ideally this would emit an event to open ExerciseDemoModal
    };

    return (
        <Card className="bg-gradient-to-br from-gray-900 to-black border-l-4 border-amber-500 shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 opacity-5 transition-transform duration-1000 group-hover:rotate-12">
                <BrainCircuit className="w-48 h-48 text-amber-500" />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="flex-1">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-1">Live Protocol</p>
                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{exercise}</h3>
                    <div className="flex gap-4 mt-3">
                        <span className="text-xs font-black text-gray-300 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">{protocol}</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={handleNeuralLink}
                        className="p-4 bg-red-600 rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:scale-105 active:scale-95 transition-all text-white flex items-center gap-2 group"
                    >
                        <Play className="w-6 h-6 fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Neural Link</span>
                    </button>
                    <button className="p-4 bg-gray-800 rounded-2xl border border-white/10 text-gray-400 hover:text-white transition-all">
                        <Database className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
                <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-500">
                            {i}
                        </div>
                    ))}
                </div>
                <div className="text-[9px] text-gray-600 font-mono uppercase">Brzycki Logic Engaged</div>
            </div>
        </Card>
    );
};

export default WarriorProtocolCard;
