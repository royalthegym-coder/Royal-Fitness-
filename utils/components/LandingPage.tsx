
import React, { useEffect, useState } from 'react';
import { GYM_INFO } from '../../constants';
import { BotIcon } from './icons/BotIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { CloudArrowUpIcon } from './icons/CloudArrowUpIcon';
import BrandLogo from './common/BrandLogo';

interface LandingPageProps {
    onEnter: () => void;
}

const NeuralBackground = () => (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#050505]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] animate-pulse"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-amber-600/10 blur-[150px] rounded-full mix-blend-screen animate-pulse"></div>
    </div>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; delay: number }> = ({ icon, title, subtitle, delay }) => (
    <div 
        className="group relative p-6 bg-gray-900/40 border border-white/5 rounded-2xl backdrop-blur-sm hover:border-amber-500/30 transition-all duration-500 transform hover:-translate-y-2 cursor-default overflow-hidden"
    >
        <div className="relative z-10">
            <div className="w-12 h-12 rounded-lg bg-gray-800/80 border border-white/10 flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-white mb-1 uppercase tracking-wide group-hover:text-amber-400">{title}</h3>
            <p className="text-xs text-gray-500 font-mono leading-relaxed">{subtitle}</p>
        </div>
    </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
    return (
        <div className="min-h-screen w-screen flex flex-col relative overflow-hidden bg-[#020202] font-sans">
            <NeuralBackground />
            
            <header className="relative z-50 flex justify-between items-center px-8 py-6 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
                <BrandLogo size="sm" />
                <button 
                    onClick={onEnter}
                    className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white uppercase tracking-[0.2em] transition-all"
                >
                    System Access
                </button>
            </header>

            <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-900/10 mb-8">
                    <SparkleIcon className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">Next-Gen AI Integrated</span>
                </div>

                <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-[0.9] mb-6">
                    Royal <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-red-600">The Gym</span>
                </h1>

                <p className="text-gray-400 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-12">
                    A premium fitness ecosystem powered by <span className="text-white font-bold">Proactive AI</span>. 
                    Optimize biology. Automate operations. Dominate functionality.
                </p>

                <button 
                    onClick={onEnter}
                    className="relative group bg-amber-500 hover:bg-amber-400 text-black px-12 py-5 rounded-none skew-x-[-10deg] transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(245,158,11,0.4)]"
                >
                    <div className="skew-x-[10deg] font-black text-sm uppercase tracking-widest">
                        Initialize Mainframe →
                    </div>
                </button>

                <div className="mt-24 w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FeatureCard icon={<BotIcon />} title="Neural Core" subtitle="Autonomous agents managing diet & workouts 24/7." delay={0} />
                    <FeatureCard icon={<ShieldCheckIcon />} title="Bio-Security" subtitle="Geo-fenced access with biometric verification." delay={100} />
                    <FeatureCard icon={<CloudArrowUpIcon />} title="Wearable Hub" subtitle="Real-time sync from Apple, Samsung & Oura." delay={200} />
                    <FeatureCard icon={<SparkleIcon />} title="Vision Lab" subtitle="Real-time pose estimation & form correction." delay={300} />
                </div>
            </main>
            
            <footer className="relative z-20 border-t border-white/5 bg-[#080808] py-4 text-center">
                <p className="text-[10px] text-gray-600 uppercase tracking-[0.5em]">Powered by RoyalOS 2026</p>
            </footer>
        </div>
    );
};

export default LandingPage;
