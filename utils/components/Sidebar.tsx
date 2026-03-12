
import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DashboardIcon, MembersIcon, BillingIcon, WorkoutIcon, DietIcon, 
  ExpensesIcon, PackageIcon, LeadsIcon 
} from './icons/NavIcons';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';
import { ControlIcon } from './icons/ControlIcon';
import { User, Microscope, Zap, Settings, Command, Activity, Heart, DollarSign, CalendarCheck, Stethoscope, TrendingUp, Cpu, ShieldAlert, MonitorPlay, HelpCircle, ScanFace, Globe, Glasses, Link, Shield, FlaskConical, Clock, Wind, Network, Moon, Eye, Truck, Map, Terminal, Gauge, Share2, Package, List, Users, ChevronDown, Utensils, Sparkles, Workflow, ShieldCheck, BrainCircuit, Power, BookOpen, Dna, Rocket, FileCode2, MessageCircle } from 'lucide-react';
import { GoogleIcon } from './icons/GoogleIcon';
import { View } from '../../types';
import { CloudArrowUpIcon } from './icons/CloudArrowUpIcon';
import { BugFixIcon } from './icons/BugFixIcon';
import { AetherIcon } from './icons/AetherIcon';
import { NfcTouchIcon } from './icons/SynapseIcons';
import { WalletIcon } from './icons/QuantumIcons';
import { BrainWaveIcon } from './icons/NeuroIcons';
import { HandshakeIcon } from './icons/SocialIcons';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { CRMIcon } from './icons/CRMSystem';
import { BotIcon } from './icons/BotIcon';
import { SmartWatchIcon } from './icons/SmartWatchIcon';
import BrandLogo from './common/BrandLogo';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  role?: 'admin' | 'member';
}

const SparkleText = ({ children }: { children: React.ReactNode }) => (
  <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-wide">
    {children}
  </span>
);

const Sidebar: React.FC<SidebarProps> = memo(({ currentView, setCurrentView, isOpen, setIsOpen, role = 'admin' }) => {
  
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
      role === 'admin' ? ['Main (मुख्य)', 'Fitness (फिटनेस)', 'Marketing (मार्केटिंग)'] : ['My Zone (मेरा जोन)', 'Training (ट्रेनिंग)']
  );
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const adminNav = [
    { 
      category: 'Main (मुख्य)', 
      items: [
        { id: 'dashboard', label: 'Home', icon: <DashboardIcon /> },
        { id: 'scientificAdmissionForm', label: 'Add Member', icon: <Sparkles className="w-5 h-5 text-indigo-400" /> },
        { id: 'members', label: 'Members', icon: <MembersIcon /> },
        { id: 'adminAttendance', label: 'Attendance', icon: <Clock className="w-5 h-5 text-cyan-400" /> },
        { id: 'adminScheduler', label: 'Schedules', icon: <CalendarCheck className="w-5 h-5 text-amber-400" /> },
        { id: 'billing', label: 'Billing', icon: <BillingIcon /> },
        { id: 'payment', label: 'Payment', icon: <DollarSignIcon className="text-green-500" /> },
        { id: 'staff', label: 'Staff', icon: <Users className="w-5 h-5 text-indigo-400" /> },
        { id: 'expenses', label: 'Expenses', icon: <ExpensesIcon /> },
        { id: 'tasks', label: 'Tasks', icon: <List className="w-5 h-5 text-amber-500" /> },
      ]
    },
    {
      category: 'Fitness (फिटनेस)',
      items: [
        { id: 'workouts', label: 'Workouts', icon: <WorkoutIcon /> },
        { id: 'diet', label: 'Diet', icon: <DietIcon /> },
        { id: 'packages', label: 'Packages', icon: <PackageIcon /> },
        { id: 'aiFitnessTracker', label: 'AI Progress', icon: <Activity className="w-5 h-5 text-amber-400"/> },
        { id: 'healthEngine', label: 'Health Scan', icon: <Microscope className="w-5 h-5 text-green-400" /> },
      ]
    },
    {
      category: 'Marketing (मार्केटिंग)',
      items: [
        { id: 'viralMarketing', label: 'Marketing', icon: <Rocket className="w-5 h-5 text-orange-500" /> },
        { id: 'leads', label: 'Leads', icon: <LeadsIcon /> },
        { id: 'socialManager', label: 'Social', icon: <Share2 className="w-5 h-5 text-pink-500" /> }, 
        { id: 'crm', label: 'CRM', icon: <CRMIcon className="w-5 h-5 text-pink-400" /> },
        { id: 'googleBusiness', label: 'Google', icon: <GoogleIcon className="w-5 h-5" /> },
        { id: 'whatsapp', label: 'WhatsApp', icon: <WhatsAppIcon className="w-5 h-5" /> },
      ]
    },
    {
      category: 'Advanced AI (एडवांस्ड)',
      items: [
        { id: 'geniusEngine', label: 'AI Engine', icon: <BrainCircuit className="w-5 h-5 text-indigo-400" /> },
        { id: 'aetherMed', label: 'Bio Oracle', icon: <Stethoscope className="w-5 h-5 text-cyan-400" /> },
        { id: 'medicalProfiling', label: 'Medical', icon: <Microscope className="w-5 h-5 text-emerald-400" /> },
        { id: 'quantumDNA', label: 'DNA Scan', icon: <Dna className="w-5 h-5 text-emerald-400" /> },
        { id: 'digitalBioPass', label: 'Bio Pass', icon: <ShieldCheck className="w-5 h-5 text-emerald-400" /> },
        { id: 'aiDoctor', label: 'AI Doctor', icon: <Activity className="w-5 h-5 text-indigo-400" /> },
        { id: 'geniusMode', label: 'AI Planner', icon: <Zap className="w-5 h-5 text-amber-400" /> },
        { id: 'bioScout', label: 'Alerts', icon: <Shield className="w-5 h-5 text-red-400" /> },
        { id: 'revenueOracle', label: 'Revenue AI', icon: <Eye className="w-5 h-5 text-green-500" /> }, 
        { id: 'bots', label: 'AI Bots', icon: <BotIcon className="w-5 h-5 text-purple-400" /> },
      ]
    },
    {
      category: 'God-Tier AI (गॉड-टियर)',
      items: [
        { id: 'sentinelIntakeBot', label: 'Intake Bot', icon: <MessageCircle className="w-5 h-5 text-emerald-400" /> },
        { id: 'injuryOracle', label: 'Injury AI', icon: <Activity className="w-5 h-5 text-red-500" /> },
        { id: 'ghostSensor', label: 'Sensor', icon: <Eye className="w-5 h-5 text-cyan-400" /> },
        { id: 'digitalTwin', label: '3D Twin', icon: <User className="w-5 h-5 text-purple-400" /> },
        { id: 'ghostSocial', label: 'Auto Market', icon: <Share2 className="w-5 h-5 text-pink-500" /> },
        { id: 'neuralEdge', label: 'Neural', icon: <Cpu className="w-5 h-5 text-emerald-400" /> },
        { id: 'universalGadgets', label: 'Sync', icon: <Cpu className="w-5 h-5 text-cyan-400" /> },
      ]
    },
    {
      category: 'System (सिस्टम)',
      items: [
        { id: 'automationHub', label: 'Automation', icon: <Workflow className="w-5 h-5 text-indigo-400" /> },
        { id: 'nexusMaster', label: 'Nexus', icon: <Network className="w-5 h-5 text-fuchsia-400" /> },
        { id: 'quantumCore', label: 'OS Core', icon: <Cpu className="w-5 h-5 text-fuchsia-500" /> },
        { id: 'neuralArchitecture', label: 'OS Stack', icon: <Cpu className="w-5 h-5 text-indigo-400" /> },
        { id: 'autoProcurement', label: 'Orders', icon: <Truck className="w-5 h-5 text-amber-500" /> }, 
        { id: 'security', label: 'Security', icon: <ShieldAlert className="w-5 h-5 text-red-400" /> },
        { id: 'emergencyOverride', label: 'Override', icon: <Power className="w-5 h-5 text-red-500" /> },
        { id: 'finalStressTest', label: 'Stress Test', icon: <Activity className="w-5 h-5 text-indigo-400" /> },
        { id: 'launchCommandCenter', label: 'Launch', icon: <Rocket className="w-5 h-5 text-orange-500" /> },
        { id: 'staffAITraining', label: 'Staff Manual', icon: <BookOpen className="w-5 h-5 text-blue-400" /> },
        { id: 'projectHandover', label: 'Handover', icon: <FileCode2 className="w-5 h-5 text-indigo-400" /> },
        { id: 'devRoadmap', label: 'Roadmap', icon: <Terminal className="w-5 h-5 text-emerald-400" /> },
        { id: 'osUploads', label: 'OS Uploads', icon: <CloudArrowUpIcon className="w-5 h-5 text-cyan-400" /> },
        { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
      ]
    }
  ];

  const memberNav = [
    { 
      category: 'My Zone (मेरा जोन)', 
      items: [
        { id: 'dashboard', label: 'Home', icon: <DashboardIcon /> },
        { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5 text-indigo-400" /> },
        { id: 'dailyProtocol', label: 'Tasks', icon: <CalendarCheck className="w-5 h-5 text-amber-400" /> },
        { id: 'attendance', label: 'Attendance', icon: <Clock className="w-5 h-5 text-cyan-400" /> },
        { id: 'payments', label: 'Payments', icon: <DollarSign className="w-5 h-5 text-green-500" /> },
        { id: 'packages', label: 'My Plan', icon: <PackageIcon /> },
        { id: 'globalHealthPassport', label: 'Gym ID', icon: <Globe className="w-5 h-5 text-cyan-400" /> }, 
      ]
    },
    {
      category: 'Training (ट्रेनिंग)',
      items: [
        { id: 'workout', label: 'Workout', icon: <WorkoutIcon /> },
        { id: 'diet', label: 'Diet', icon: <DietIcon /> },
        { id: 'metabolicTracker', label: 'Digital Twin', icon: <BrainCircuit className="w-5 h-5 text-purple-400" /> },
        { id: 'nutritionAdvisor', label: 'Nutritionist', icon: <Utensils className="w-5 h-5 text-green-400" /> },
        { id: "performanceLab", label: "Progress Lab", icon: <TrendingUp className="w-5 h-5 text-cyan-400" /> },
        { id: 'futureOFS', label: 'Recovery Test', icon: <Activity className="w-5 h-5 text-amber-400" /> },
      ]
    },
    {
      category: 'Health (स्वास्थ्य)',
      items: [
        { id: 'geniusEngine', label: 'AI Engine', icon: <BrainCircuit className="w-5 h-5 text-indigo-400" /> },
        { id: 'health', label: 'Health Stats', icon: <Heart className="w-5 h-5 text-red-500" /> },
        { id: 'medicalHub', label: 'Medical Report', icon: <Stethoscope className="w-5 h-5 text-indigo-400" /> },
        { id: 'quantumDNA', label: 'DNA Scan', icon: <Dna className="w-5 h-5 text-emerald-400" /> },
        { id: 'digitalBioPass', label: 'Bio Pass', icon: <ShieldCheck className="w-5 h-5 text-emerald-400" /> },
        { id: 'wearables', label: 'Connect Watch', icon: <SmartWatchIcon className="w-5 h-5 text-amber-400" /> },
        { id: 'universalGadgets', label: 'Neural Sync', icon: <Cpu className="w-5 h-5 text-cyan-400" /> },
        { id: 'neuroRecovery', label: 'Relaxation', icon: <Moon className="w-5 h-5 text-indigo-400" /> }, 
      ]
    },
    {
      category: 'God-Tier AI (गॉड-टियर)',
      items: [
        { id: 'injuryOracle', label: 'Injury AI', icon: <Activity className="w-5 h-5 text-red-500" /> },
        { id: 'ghostSensor', label: 'Sensor', icon: <Eye className="w-5 h-5 text-cyan-400" /> },
        { id: 'digitalTwin', label: '3D Twin', icon: <User className="w-5 h-5 text-purple-400" /> },
        { id: 'neuralEdge', label: 'Neural', icon: <Cpu className="w-5 h-5 text-emerald-400" /> },
      ]
    },
    {
      category: 'Support (मदद)',
      items: [
        { id: 'aetherCommunity', label: 'Community', icon: <Network className="w-5 h-5 text-indigo-400" /> }, 
        { id: 'helpSupport', label: 'Help Center', icon: <HelpCircle className="w-5 h-5 text-blue-400" /> },
      ]
    }
  ];

  const navItems = role === 'member' ? memberNav : adminNav;

  return (
    <div className={`bg-[#030303]/95 backdrop-blur-3xl text-white flex flex-col h-screen transition-all duration-500 ${isOpen ? 'w-80' : 'w-0 overflow-hidden md:w-80'} border-r border-white/5 relative z-50 shadow-[20px_0_60px_rgba(0,0,0,0.5)]`}>
        {/* Header HUD */}
        <div className="h-32 px-8 flex items-center justify-between border-b border-white/5 relative overflow-hidden bg-gradient-to-b from-[#0a0a0a] to-transparent">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          {/* Top light trace */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_15px_#06b6d4] opacity-50"></div>
          
          <div className="flex items-center gap-4 relative z-10 w-full">
            <div className="relative group cursor-pointer">
                <div className="absolute -inset-1 bg-cyan-500/30 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-12 h-12 bg-[#0f0f0f] rounded-xl flex items-center justify-center border border-white/10 relative z-10 shadow-xl">
                    <BrandLogo size="sm" showText={false} className="w-8 h-8" />
                </div>
            </div>
            <div>
                <h1 className="text-xl font-black italic tracking-tighter uppercase font-display leading-none text-white drop-shadow-md">
                    Royal <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Gym</span>
                </h1>
                <div className="flex items-center gap-2 mt-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <p className="text-[9px] text-gray-500 font-mono tracking-[0.3em] uppercase font-bold">Online</p>
                </div>
            </div>
          </div>
        </div>
        
        <div className="px-6 pt-6 pb-2 relative z-10">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input 
                    type="text" 
                    placeholder="Search features..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder-gray-600"
                />
            </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar relative">
          {navItems.map((section, idx) => {
            const filteredItems = section.items.filter(item => 
                item.label.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (filteredItems.length === 0 && searchQuery) return null;

            const isExpanded = searchQuery ? true : expandedCategories.includes(section.category);
            
            return (
                <div key={idx} className="relative z-10 mb-4">
                    <motion.button 
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleCategory(section.category)}
                        className={`w-full flex items-center justify-between px-6 py-3 rounded-2xl transition-all duration-300 group ${isExpanded ? 'bg-white/5 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                    >
                        <div className="flex items-center">
                            <span className={`w-1 h-3 mr-3 rounded-full transition-all duration-300 ${isExpanded ? (idx === 0 ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]') : 'bg-gray-700'}`}></span>
                            <span className="text-[11px] font-black uppercase tracking-[0.1em]">{section.category}</span>
                        </div>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white' : 'text-gray-600'}`} />
                    </motion.button>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="space-y-1 mt-2 overflow-hidden"
                      >
                        {filteredItems.map(item => {
                            const isActive = currentView === item.id;
                            
                            return (
                              <motion.button
                                key={item.id}
                                whileHover={{ x: 8 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { setCurrentView(item.id as View); if (window.innerWidth < 768) setIsOpen(false); }}
                                className={`group relative flex items-center w-full px-6 py-3.5 text-xs rounded-xl transition-all duration-300 overflow-hidden ${
                                    isActive 
                                    ? 'bg-gradient-to-r from-white/10 to-transparent border-l-2 border-cyan-400 text-white shadow-[inset_10px_0_20px_-10px_rgba(6,182,212,0.2)]' 
                                    : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                                }`}
                              >
                                <span className={`mr-4 transition-transform duration-300 group-hover:scale-110 relative z-10 ${isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'text-gray-600 group-hover:text-cyan-200'}`}>
                                    {item.icon}
                                </span>
                                <span className="font-bold tracking-wider uppercase relative z-10 text-[11px]"><SparkleText>{item.label}</SparkleText></span>
                                
                                {isActive && <motion.div layoutId="active-indicator" className="absolute right-4 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_10px_#06b6d4] animate-pulse"></motion.div>}
                              </motion.button>
                            );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
            );
          })}
        </nav>

        {/* Footer Status */}
        <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-md">
            <div className="bg-[#0a0a0a] p-4 rounded-2xl border border-white/5 relative overflow-hidden group">
                <div className="flex justify-between items-center mb-2 relative z-10">
                    <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest leading-none flex items-center gap-2">
                        <Share2 className="w-3 h-3" /> App Sync
                    </span>
                    <span className="text-[9px] font-mono text-green-400 font-bold animate-pulse">LOCKED</span>
                </div>
                <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden relative z-10">
                    <div className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 w-full animate-shimmer relative"></div>
                </div>
            </div>
        </div>
    </div>
  );
});

export default Sidebar;
