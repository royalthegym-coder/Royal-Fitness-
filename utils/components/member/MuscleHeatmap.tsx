
import React from 'react';

interface MuscleHeatmapProps {
    targetedMuscles: string[];
}

const MuscleHeatmap: React.FC<MuscleHeatmapProps> = ({ targetedMuscles }) => {
    const isEngaged = (m: string) => targetedMuscles.some(tm => tm.toLowerCase() === m.toLowerCase());

    return (
        <div className="relative w-full bg-black/40 rounded-3xl p-6 border border-white/5 flex items-center justify-center">
            {/* 3D Mannequin Projection Simulator */}
            <div className="relative w-48 h-80 flex flex-col items-center">
                {/* HEAD */}
                <div className={`w-8 h-8 rounded-full border border-white/10 mb-1 transition-all duration-500 ${isEngaged('head') ? 'bg-amber-500 shadow-[0_0_20px_#f59e0b]' : 'bg-gray-800'}`}></div>
                
                {/* TORSO / CHEST */}
                <div className="flex gap-1 mb-1">
                    <div className={`w-14 h-20 rounded-xl border border-white/10 transition-all duration-500 ${isEngaged('pectorals') || isEngaged('chest') ? 'bg-orange-600 shadow-[0_0_30px_#ea580c] scale-110' : 'bg-gray-800'}`}>
                         <div className="flex items-center justify-center h-full text-[8px] font-black text-white/20 uppercase rotate-90">Core</div>
                    </div>
                </div>

                {/* ARMS */}
                <div className="absolute top-10 -left-6 flex flex-col items-center">
                    <div className={`w-6 h-16 rounded-full border border-white/10 transition-all duration-500 ${isEngaged('triceps') || isEngaged('arms') ? 'bg-orange-600 shadow-[0_0_20px_#ea580c]' : 'bg-gray-800'}`}></div>
                </div>
                <div className="absolute top-10 -right-6 flex flex-col items-center">
                    <div className={`w-6 h-16 rounded-full border border-white/10 transition-all duration-500 ${isEngaged('triceps') || isEngaged('arms') ? 'bg-orange-600 shadow-[0_0_20px_#ea580c]' : 'bg-gray-800'}`}></div>
                </div>

                {/* LEGS */}
                <div className="flex gap-4 mt-1">
                    <div className={`w-10 h-32 rounded-xl border border-white/10 transition-all duration-500 ${isEngaged('legs') || isEngaged('quads') ? 'bg-orange-600 shadow-[0_0_30px_#ea580c]' : 'bg-gray-800'}`}></div>
                    <div className={`w-10 h-32 rounded-xl border border-white/10 transition-all duration-500 ${isEngaged('legs') || isEngaged('quads') ? 'bg-orange-600 shadow-[0_0_30px_#ea580c]' : 'bg-gray-800'}`}></div>
                </div>

                <div className="absolute bottom-2 text-[10px] font-black text-orange-500 uppercase tracking-widest animate-pulse">
                    MIND-MUSCLE SYNC ACTIVE
                </div>
            </div>

            {/* Labels */}
            <div className="absolute right-6 top-6 space-y-2">
                {targetedMuscles.map(m => (
                    <div key={m} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_#f97316]"></div>
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">{m}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MuscleHeatmap;
