
import React, { useState, useEffect } from 'react';
import { Thermometer, Zap } from 'lucide-react';

const BioSyncBanner: React.FC = () => {
    const [temp, setTemp] = useState(42); // Jhunjhunu Live Node Mock
    const [humidity, setHumidity] = useState(15);
    const [glucose, setGlucose] = useState(105);

    useEffect(() => {
        const interval = setInterval(() => {
            setGlucose(g => g + (Math.random() > 0.5 ? 1 : -1));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const isHeatStress = temp > 40;

    return (
        <div className={`relative overflow-hidden p-4 rounded-3xl border transition-all duration-700 ${isHeatStress ? 'bg-red-950/20 border-red-500/30' : 'bg-zinc-950 border-white/5'}`}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Thermometer className={`w-5 h-5 ${isHeatStress ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
                        <div>
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none">Jhunjhunu Node</p>
                            <p className={`text-sm font-bold ${isHeatStress ? 'text-red-500' : 'text-white'}`}>{temp}°C / {humidity}% HUM</p>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-white/10 hidden md:block"></div>
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-green-400" />
                        <div>
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none">Live Glucose</p>
                            <p className="text-sm font-bold text-green-400 font-mono">{glucose} mg/dL</p>
                        </div>
                    </div>
                </div>
                
                {isHeatStress && (
                    <div className="bg-red-600 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse">
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Heat Stress Mode: +30s Rest Enabled</span>
                    </div>
                )}
            </div>
            
            {/* Visual Pulse */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-scan"></div>
        </div>
    );
};

export default BioSyncBanner;