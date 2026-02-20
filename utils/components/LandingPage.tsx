
import React from 'react';
import { GYM_INFO } from '../../constants';
import { DumbbellIcon } from './icons/DumbbellIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { BotIcon } from './icons/BotIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import GymLocationMap from './GymLocationMap';
import BrandLogo from './common/BrandLogo';

interface LandingPageProps {
    onEnter: () => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-amber-500/50 transition-all group hover:-translate-y-2">
        <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-6 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight italic">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden font-sans selection:bg-amber-500/30">
            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-600/10 blur-[120px] rounded-full mix-blend-screen"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-red-600/10 blur-[120px] rounded-full mix-blend-screen"></div>
            </div>

            <nav className="relative z-50 flex justify-between items-center px-6 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <BrandLogo size="md" />
                    <span className="text-xl font-black tracking-tighter uppercase italic">Royal <span className="text-amber-500">The Gym</span></span>
                </div>
                <button 
                    onClick={onEnter}
                    className="bg-white/10 hover:bg-white/20 border border-white/10 px-6 py-2 rounded-full text-sm font-bold transition-all backdrop-blur-md"
                >
                    Member Login
                </button>
            </nav>

            <main className="relative z-10 pt-20 pb-32 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-6">
                            <SparkleIcon className="w-4 h-4" />
                            <span>AI-POWERED FITNESS ECOSYSTEM</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black leading-none mb-6 tracking-tighter uppercase italic">
                            Forging <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Elite</span> <br/>
                            Physiques
                        </h1>
                        <p className="text-gray-400 text-lg mb-8 max-w-lg leading-relaxed">
                            Experience the fusion of raw iron and neural intelligence. 
                            Royal The Gym integrates Gemini AI to optimize your training, recovery, and nutrition in real-time.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                                onClick={onEnter}
                                className="bg-amber-500 text-black px-8 py-4 rounded-full font-black text-lg hover:bg-amber-400 transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2"
                            >
                                Start Your Journey <span className="text-xl">→</span>
                            </button>
                            <button className="px-8 py-4 rounded-full font-bold border border-white/20 hover:bg-white/5 transition-all">
                                View Plans
                            </button>
                        </div>
                        
                        <div className="mt-12 flex items-center gap-4 text-sm font-medium text-gray-500">
                            <div className="flex -space-x-3">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-gray-800">
                                        <img src={`https://i.pravatar.cc/150?u=${i}`} className="w-full h-full rounded-full grayscale opacity-70" alt="member" />
                                    </div>
                                ))}
                            </div>
                            <p>Trusted by 500+ Athletes</p>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-transparent rounded-[3rem] blur-2xl transform rotate-3 scale-95"></div>
                        <div className="relative bg-gray-900 border border-white/10 rounded-[2.5rem] p-4 overflow-hidden shadow-2xl">
                            <img 
                                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop" 
                                alt="Gym Interior" 
                                className="rounded-[2rem] w-full object-cover h-[600px] grayscale hover:grayscale-0 transition-all duration-700"
                            />
                            
                            {/* Floating Cards */}
                            <div className="absolute top-10 right-10 bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 flex items-center gap-4 shadow-xl animate-float">
                                <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
                                    <BotIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">AI Analysis</p>
                                    <p className="text-white font-bold">Form Perfect</p>
                                </div>
                            </div>

                            <div className="absolute bottom-10 left-10 bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 flex items-center gap-4 shadow-xl animate-float-delayed">
                                <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
                                    <DumbbellIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Current Load</p>
                                    <p className="text-white font-bold">120 KG</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mt-32 max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-white uppercase italic mb-4">The Neural Edge</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            We don't just provide equipment. We provide an intelligent ecosystem that adapts to your physiology.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FeatureCard 
                            icon={<BotIcon />}
                            title="Gemini Trainer"
                            desc="Real-time workout adjustments and form analysis powered by Google's Gemini 1.5 Pro model."
                        />
                        <FeatureCard 
                            icon={<UserGroupIcon />}
                            title="Community Core"
                            desc="Compete in leaderboards, join squad challenges, and share milestones with the Royal elite."
                        />
                        <FeatureCard 
                            icon={<CheckCircleIcon />}
                            title="Smart Access"
                            desc="Geo-fenced check-ins and biometric security ensure a seamless and exclusive experience."
                        />
                    </div>
                </div>

                {/* Location Map Section */}
                <div className="mt-32 max-w-7xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-black text-white uppercase italic mb-4">HQ Coordinates</h2>
                        <p className="text-gray-400">{GYM_INFO.address}</p>
                    </div>
                    <div className="h-[500px] w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
                        <GymLocationMap />
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-32 border-t border-white/5 pt-10 text-center text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} Royal The Gym. Powered by Neural Systems.</p>
                </footer>
            </main>
        </div>
    );
};

export default LandingPage;
