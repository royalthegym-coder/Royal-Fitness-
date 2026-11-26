import React from 'react';
import { PlayCircle, ShieldCheck, Lock } from 'lucide-react';
import { FEATURE_IMAGES } from '../../data/featureMedia';

export default function ExerciseVideoLibrary() {
    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-2">Form & Protocol</h2>
                <p className="text-cyan-400 font-mono text-sm uppercase tracking-[0.3em]">Fitness Future Exercise Archives</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {[
                    { title: 'Barbell Squat Form', category: 'Legs', locked: false, url: FEATURE_IMAGES.workoutEngine },
                    { title: 'Bench Press Mechanics', category: 'Chest', locked: false, url: FEATURE_IMAGES.memberMobileSuite },
                    { title: 'Deadlift Biomechanics', category: 'Back', locked: true, url: FEATURE_IMAGES.biomechanicsIntake }
                ].map((vid, i) => (
                    <div key={i} className="group relative rounded-3xl overflow-hidden border border-white/10 aspect-video cursor-pointer">
                        <img src={vid.url} alt={vid.title} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            {vid.locked ? (
                                <Lock className="w-16 h-16 text-gray-500 bg-black/50 p-4 rounded-full backdrop-blur-md" />
                            ) : (
                                <PlayCircle className="w-16 h-16 text-white bg-cyan-500/50 p-3 rounded-full backdrop-blur-md opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all shadow-[0_0_30px_rgba(6,182,212,0.5)]" />
                            )}
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                            <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-black bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm">{vid.category}</span>
                            <h3 className="text-lg font-black text-white mt-2 uppercase tracking-wide">{vid.title}</h3>
                        </div>
                        {vid.locked && (
                            <div className="absolute top-4 right-4 bg-red-500/20 border border-red-500/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-red-400 font-bold uppercase tracking-widest">
                                Pro Plan Only
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-3xl p-8 flex items-center gap-6 backdrop-blur-xl">
                <ShieldCheck className="w-12 h-12 text-cyan-400 flex-shrink-0" />
                <div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-widest mb-1">Safety First</h3>
                    <p className="text-sm text-cyan-100/70 font-mono">Always warm up before executing any protocol. Ensure correct form to prevent injuries. Consult your AI Coach or PT for personalized mechanics.</p>
                </div>
            </div>
        </div>
    );
}
