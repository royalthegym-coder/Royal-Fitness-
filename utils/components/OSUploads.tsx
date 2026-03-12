import React, { useState } from 'react';
import { UploadCloud, FileText, Bot, Cpu, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../hooks/useToast';

const OSUploads: React.FC = () => {
    const { addToast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleUpload = () => {
        setIsUploading(true);
        setUploadProgress(0);
        
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsUploading(false);
                    addToast("Upload successful. Neural integration complete.", "success");
                    return 100;
                }
                return prev + 10;
            });
        }, 300);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="bg-[#050505] p-10 rounded-[4rem] border border-fuchsia-500/20 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="relative z-10 flex items-center gap-8">
                    <div className="p-8 bg-fuchsia-500 text-black rounded-[2.5rem] shadow-[0_0_50px_rgba(217,70,239,0.4)] group-hover:rotate-12 transition-transform">
                        <UploadCloud className="w-16 h-16" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-4 py-1.5 bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                <Cpu className="w-3 h-3" /> Quantum OS v32.0
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none">
                            OS <span className="text-fuchsia-400">Uploads</span>
                        </h1>
                    </div>
                </div>
            </div>

            {/* Upload Area */}
            <div className="bg-black/40 border border-white/10 p-10 rounded-[3rem] text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-500/5 to-transparent"></div>
                <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
                    <div className="w-32 h-32 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center mb-4">
                        <UploadCloud className="w-16 h-16 text-fuchsia-400" />
                    </div>
                    
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tight">
                        Deploy New Features, Tools & Bots
                    </h2>
                    
                    <p className="text-gray-400 max-w-xl mx-auto text-sm">
                        Upload your latest Open-Source AI-Powered Quantum Computer OS modules here. The system will automatically compile and integrate them into the neural network.
                    </p>

                    <div className="flex gap-4 mt-8">
                        <button 
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="bg-fuchsia-500 text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(217,70,239,0.3)] hover:bg-fuchsia-400 transition-all flex items-center gap-3 disabled:opacity-50"
                        >
                            {isUploading ? <Cpu className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                            {isUploading ? 'Uploading...' : 'Select Files to Upload'}
                        </button>
                    </div>

                    {isUploading && (
                        <div className="w-full max-w-md mt-8">
                            <div className="flex justify-between text-xs font-mono text-fuchsia-400 mb-2 uppercase tracking-widest">
                                <span>Integrating Modules...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-white/10">
                                <div 
                                    className="h-full bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 transition-all duration-300 shadow-[0_0_10px_#d946ef]"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Supported Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-950 border border-white/5 p-8 rounded-[2.5rem] hover:border-fuchsia-500/30 transition-colors group">
                    <Bot className="w-10 h-10 text-fuchsia-500 mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">AI Bots</h3>
                    <p className="text-sm text-gray-500">Deploy custom conversational agents and automated response systems.</p>
                </div>
                <div className="bg-gray-950 border border-white/5 p-8 rounded-[2.5rem] hover:border-cyan-500/30 transition-colors group">
                    <Cpu className="w-10 h-10 text-cyan-500 mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">OS Features</h3>
                    <p className="text-sm text-gray-500">Core system upgrades, UI enhancements, and performance patches.</p>
                </div>
                <div className="bg-gray-950 border border-white/5 p-8 rounded-[2.5rem] hover:border-amber-500/30 transition-colors group">
                    <FileText className="w-10 h-10 text-amber-500 mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Neural Tools</h3>
                    <p className="text-sm text-gray-500">Analytics modules, data processors, and specialized algorithms.</p>
                </div>
            </div>
        </div>
    );
};

export default OSUploads;
