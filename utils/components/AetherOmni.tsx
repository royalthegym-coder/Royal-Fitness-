
import React, { useState } from 'react';
import Card from './common/Card';
import { Layers, Camera, Crosshair, Scan } from 'lucide-react';

const AetherOmni: React.FC = () => {
    const [activeFeed, setActiveFeed] = useState(1);

    return (
        <div className="space-y-8 animate-fade-in pb-20">
             <div className="p-10 rounded-[3.5rem] bg-[#050505] border border-cyan-500/20 shadow-2xl relative overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                 <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4 relative z-10">
                    <Layers className="w-12 h-12 text-cyan-400" />
                    Aether <span className="text-cyan-500">Omni</span>
                </h1>
                <p className="text-gray-500 text-xs font-mono mt-2 tracking-widest uppercase relative z-10">Augmented Reality Overwatch</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    <div className="bg-black rounded-[3rem] border-2 border-cyan-500/30 h-[600px] relative overflow-hidden shadow-2xl">
                        {/* Simulated Feed */}
                        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                            <p className="text-gray-700 font-black text-6xl opacity-20 uppercase">CAM 0{activeFeed}</p>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_100%)] opacity-80"></div>
                        </div>
                        
                        {/* AR HUD Overlay */}
                        <div className="absolute inset-0 p-8 pointer-events-none">
                            <div className="w-full h-full border-2 border-cyan-500/20 rounded-[2rem] relative">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-500"></div>
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-500"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-500"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-500"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <Crosshair className="w-12 h-12 text-cyan-500/50" />
                                </div>
                                <div className="absolute top-4 left-4 bg-cyan-900/50 text-cyan-400 px-3 py-1 rounded text-xs font-mono border border-cyan-500/30">
                                    LIVE FEED • 1080p • 60FPS
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div 
                            key={i} 
                            onClick={() => setActiveFeed(i)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${activeFeed === i ? 'bg-cyan-900/20 border-cyan-500' : 'bg-gray-900 border-white/5 hover:bg-gray-800'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-white uppercase">Sector {i}</span>
                                {activeFeed === i && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
                            </div>
                            <div className="aspect-video bg-black rounded-lg relative overflow-hidden opacity-60">
                                <Scan className="absolute inset-0 m-auto w-6 h-6 text-gray-700"/>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AetherOmni;
