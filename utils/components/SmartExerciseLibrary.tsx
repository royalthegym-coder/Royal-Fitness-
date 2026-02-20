
import React, { useState, useMemo, useEffect } from 'react';
import Card from './common/Card';
import { EXERCISE_DB, ExerciseData } from './common/ExerciseDemoModal';
import ExerciseDemoModal from './common/ExerciseDemoModal';
import { SparkleIcon } from './icons/SparkleIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { BotIcon } from './icons/BotIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { findBestExerciseVideo } from '../../lib/gemini';
import { useToast } from '../hooks/useToast';

const categories = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

const SmartExerciseLibrary: React.FC = () => {
    const { addToast } = useToast();
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Neural Search States
    const [isThinking, setIsThinking] = useState(false);
    const [neuralQuery, setNeuralQuery] = useState('');
    const [aiMetadata, setAiMetadata] = useState<{ analysis: string; proTips: string[] } | undefined>(undefined);

    const exerciseList = useMemo(() => Object.values(EXERCISE_DB), []);

    useEffect(() => {
        // Simulate fetching data
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    const filteredList = useMemo(() => {
        return exerciseList.filter(ex => {
            const matchesCategory = filter === 'All' || ex.category === filter;
            const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [filter, search, exerciseList]);

    const handleNeuralSearch = async () => {
        if (!neuralQuery.trim()) return;
        setIsThinking(true);
        addToast("Neural Engine Analyzing...", "info");
        setAiMetadata(undefined);
        
        try {
            // Use the advanced AI function to find the semantic match
            const result = await findBestExerciseVideo(neuralQuery, exerciseList);
            
            if (result.matchedName) {
                // Set metadata before opening modal
                setAiMetadata({
                    analysis: result.analysis,
                    proTips: result.proTips
                });
                setSelectedExercise(result.matchedName);
                addToast("Protocol Identified. Loading Visuals...", "success");
            } else {
                addToast("No matching protocol found. Try clarifying your goal.", "error");
            }
        } catch (e) {
            console.error(e);
            addToast("Neural Link Failed.", "error");
        } finally {
            setIsThinking(false);
        }
    };

    const handleCloseModal = () => {
        setSelectedExercise(null);
        setAiMetadata(undefined);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-900 p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                        Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Library</span>
                    </h2>
                    <p className="text-gray-500 text-xs font-mono mt-1 tracking-widest uppercase">Visual Protocol Database</p>
                </div>
                
                {/* Neural Search Bar */}
                <div className="relative w-full md:w-96 group">
                     <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-purple-600 rounded-full blur opacity-20 group-hover:opacity-60 transition duration-500"></div>
                     <div className="relative flex bg-black rounded-full items-center p-1 border border-white/10">
                         <div className="pl-4 pr-2 text-amber-500">
                             {isThinking ? <AutoUpdateIcon className="w-5 h-5 animate-spin"/> : <BotIcon className="w-5 h-5"/>}
                         </div>
                         <input 
                            type="text" 
                            placeholder="Ask AI: 'Best exercise for upper chest'..." 
                            value={neuralQuery}
                            onChange={(e) => setNeuralQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleNeuralSearch()}
                            disabled={isThinking}
                            className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-gray-600 py-2"
                        />
                        <button 
                            onClick={handleNeuralSearch}
                            disabled={isThinking || !neuralQuery}
                            className="bg-amber-600 hover:bg-amber-500 text-white p-2 rounded-full transition-colors disabled:opacity-50"
                        >
                            <SparkleIcon className="w-4 h-4"/>
                        </button>
                     </div>
                </div>
            </div>

            {/* Standard Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                            filter === cat 
                            ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
                {/* Fallback Search Input */}
                <div className="ml-auto min-w-[200px] relative hidden md:block">
                     <input 
                        type="text" 
                        placeholder="Quick Filter..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-full px-4 py-2 text-xs text-white focus:border-gray-500 outline-none"
                    />
                </div>
            </div>

            {/* Masonry Grid (Pinterest Style) */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32">
                    <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <p className="text-gray-500 text-xs font-mono uppercase tracking-widest animate-pulse">Loading Neural Library...</p>
                </div>
            ) : (
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                    {filteredList.map((ex) => (
                        <div 
                            key={ex.id}
                            onClick={() => setSelectedExercise(ex.name)}
                            className="break-inside-avoid relative group cursor-pointer rounded-2xl overflow-hidden border border-white/5 bg-gray-900 shadow-xl transition-all hover:-translate-y-1 hover:border-amber-500/30"
                        >
                            {/* Thumbnail */}
                            <div className="relative aspect-[9/16] overflow-hidden">
                                <img 
                                    src={ex.thumbnailUrl} 
                                    alt={ex.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                                
                                {/* Play Button Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="w-14 h-14 bg-amber-500/90 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm">
                                        <VideoCameraIcon className="w-6 h-6 text-black" />
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                                    <span className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[8px] font-bold text-white uppercase tracking-wider border border-white/10">
                                        {ex.difficulty}
                                    </span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                <h3 className="text-lg font-black text-white italic uppercase leading-none mb-1">{ex.name}</h3>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">{ex.category}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!isLoading && filteredList.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    <p className="text-xs uppercase tracking-widest">No protocols found.</p>
                </div>
            )}

            {/* Video Player Modal */}
            <ExerciseDemoModal 
                isOpen={!!selectedExercise} 
                onClose={handleCloseModal} 
                exerciseName={selectedExercise || ''} 
                aiMetadata={aiMetadata}
            />
        </div>
    );
};

export default SmartExerciseLibrary;
