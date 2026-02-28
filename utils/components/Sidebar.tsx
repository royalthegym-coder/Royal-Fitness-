
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
import { User, Microscope, Zap, Settings, Command, Activity, Heart, DollarSign, CalendarCheck, Stethoscope, TrendingUp, Cpu, ShieldAlert, MonitorPlay, HelpCircle, ScanFace, Globe, Glasses, Link, Shield, FlaskConical, Clock, Wind, Network, Moon, Eye, Truck, Map, Terminal, Gauge, Share2, Package, List, Users, ChevronDown, Utensils, Sparkles, Workflow } from 'lucide-react';
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

const Sidebar: React.FC<SidebarProps> = memo(({ currentView, setCurrentView, isOpen, setIsOpen, role = 'admin' }) => {
  
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
      role === 'admin' ? ['Main (मुख्य)', 'Fitness (फिटनेस)', 'Marketing (मार्केटिंग)'] : ['My Zone (मेरा जोन)', 'Training (ट्रेनिंग)']
  );

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
        { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
        { id: 'scientificAdmissionForm', label: 'AI Admission Form', icon: <Sparkles className="w-5 h-5 text-indigo-400" /> },
        { id: 'members', label: 'Members List', icon: <MembersIcon /> },
        { id: 'adminAttendance', label: 'Attendance', icon: <Clock className="w-5 h-5 text-cyan-400" /> },
        { id: 'billing', label: 'Billing & Fees', icon: <BillingIcon /> },
        { id: 'payment', label: 'Take Payment', icon: <DollarSignIcon className="text-green-500" /> },
        { id: 'staff', label: 'Staff Management', icon: <Users className="w-5 h-5 text-indigo-400" /> },
        { id: 'expenses', label: 'Expenses', icon: <ExpensesIcon /> },
        { id: 'tasks', label: 'Tasks', icon: <List className="w-5 h-5 text-amber-500" /> },
      ]
    },
    {
      category: 'Fitness (फिटनेस)',
      items: [
        { id: 'workouts', label: 'Workout Plans', icon: <WorkoutIcon /> },
        { id: 'diet', label: 'Diet Plans', icon: <DietIcon /> },
        { id: 'packages', label: 'Packages', icon: <PackageIcon /> },
        { id: 'aiFitnessTracker', label: 'AI Progress', icon: <Activity className="w-5 h-5 text-amber-400"/> },
        { id: 'healthEngine', label: 'Health Scan', icon: <Microscope className="w-5 h-5 text-green-400" /> },
      ]
    },
    {
      category: 'Marketing (मार्केटिंग)',
      items: [
        { id: 'leads', label: 'Leads (Enquiry)', icon: <LeadsIcon /> },
        { id: 'socialManager', label: 'Social Media', icon: <Share2 className="w-5 h-5 text-pink-500" /> }, 
        { id: 'crm', label: 'CRM System', icon: <CRMIcon className="w-5 h-5 text-pink-400" /> },
        { id: 'googleBusiness', label: 'Google Maps', icon: <GoogleIcon className="w-5 h-5" /> },
        { id: 'whatsapp', label: 'WhatsApp', icon: <WhatsAppIcon className="w-5 h-5" /> },
      ]
    },
    {
      category: 'Advanced AI (एडवांस्ड)',
      items: [
        { id: 'aetherMed', label: 'AI Doctor', icon: <Stethoscope className="w-5 h-5 text-cyan-400" /> },
        { id: 'geniusMode', label: 'AI Planner', icon: <Zap className="w-5 h-5 text-amber-400" /> },
        { id: 'bioScout', label: 'Risk Alerts', icon: <Shield className="w-5 h-5 text-red-400" /> },
        { id: 'revenueOracle', label: 'Revenue AI', icon: <Eye className="w-5 h-5 text-green-500" /> }, 
        { id: 'bots', label: 'My AI Bots', icon: <BotIcon className="w-5 h-5 text-purple-400" /> },
      ]
    },
    {
      category: 'System (सिस्टम)',
      items: [
        { id: 'automationHub', label: 'Automation Hub', icon: <Workflow className="w-5 h-5 text-indigo-400" /> },
        { id: 'neuralArchitecture', label: 'Neural OS Stack', icon: <Cpu className="w-5 h-5 text-indigo-400" /> },
        { id: 'autoProcurement', label: 'Auto-Orders', icon: <Truck className="w-5 h-5 text-amber-500" /> }, 
        { id: 'security', label: 'Security', icon: <ShieldAlert className="w-5 h-5 text-red-400" /> },
        { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
      ]
    }
  ];

  const memberNav = [
    { 
      category: 'My Zone (मेरा जोन)', 
      items: [
        { id: 'dashboard', label: 'Home', icon: <DashboardIcon /> },
        { id: 'profile', label: 'My Profile', icon: <User className="w-5 h-5 text-indigo-400" /> },
        { id: 'dailyProtocol', label: 'My Tasks', icon: <CalendarCheck className="w-5 h-5 text-amber-400" /> },
        { id: 'attendance', label: 'Attendance', icon: <Clock className="w-5 h-5 text-cyan-400" /> },
        { id: 'payments', label: 'Payments', icon: <DollarSign className="w-5 h-5 text-green-500" /> },
        { id: 'packages', label: 'My Plan', icon: <PackageIcon /> },
        { id: 'globalHealthPassport', label: 'Gym ID', icon: <Globe className="w-5 h-5 text-cyan-400" /> }, 
      ]
    },
    {
      category: 'Training (ट्रेनिंग)',
      items: [
        { id: 'workout', label: 'Start Workout', icon: <WorkoutIcon /> },
        { id: 'diet', label: 'My Diet', icon: <DietIcon /> },
        { id: 'nutritionAdvisor', label: 'Nutritionist', icon: <Utensils className="w-5 h-5 text-green-400" /> },
        { id: "performanceLab", label: "Progress Lab", icon: <TrendingUp className="w-5 h-5 text-cyan-400" /> },
        { id: 'futureOFS', label: 'Recovery Test', icon: <Activity className="w-5 h-5 text-amber-400" /> },
      ]
    },
    {
      category: 'Health (स्वास्थ्य)',
      items: [
        { id: 'health', label: 'Health Stats', icon: <Heart className="w-5 h-5 text-red-500" /> },
        { id: 'medicalHub', label: 'Medical Report', icon: <Stethoscope className="w-5 h-5 text-indigo-400" /> },
        { id: 'wearables', label: 'Connect Watch', icon: <SmartWatchIcon className="w-5 h-5 text-amber-400" /> },
        { id: 'neuroRecovery', label: 'Relaxation', icon: <Moon className="w-5 h-5 text-indigo-400" /> }, 
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
        
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar relative">
          {navItems.map((section, idx) => {
            const isExpanded = expandedCategories.includes(section.category);
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
                        {section.items.map(item => {
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
                                <span className="font-bold tracking-wider uppercase relative z-10 text-[11px]">{item.label}</span>
                                
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
