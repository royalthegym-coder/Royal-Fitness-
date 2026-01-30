
import React, { memo, useState, useEffect } from 'react';
import { DashboardIcon, MembersIcon, BillingIcon, WorkoutIcon, DietIcon, StaffIcon, ExpensesIcon, SettingsIcon, MembershipIcon } from './icons/NavIcons';
import { SparkleIcon } from './icons/SparkleIcon';
import { QrCodeIcon } from './icons/QrCodeIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { HealthEngineIcon } from './icons/HealthEngineIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { BodyScanIcon } from './icons/BodyScanIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { CloudArrowUpIcon } from './icons/CloudArrowUpIcon';
import { BugFixIcon } from './icons/BugFixIcon';
import { SmartWatchIcon } from './icons/SmartWatchIcon';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { ControlIcon } from './icons/ControlIcon';
import { StorkIcon } from './icons/StorkIcon';
import { TimeQuestIcon } from './icons/TimeQuestIcon';
import { FacebookIcon, InstagramIcon } from './icons/SocialIcons';
import { GYM_INFO } from '../../constants';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { FingerPrintIcon } from './icons/FingerPrintIcon';
import BrandLogo from './common/BrandLogo';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: any) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  role?: 'admin' | 'member';
}

const adminNavItems = [
  { 
    category: 'Royal Operations', 
    items: [
      { id: 'dashboard', label: 'Command Center', icon: <DashboardIcon /> },
      { id: 'members', label: 'Member Matrix', icon: <MembersIcon /> },
      { id: 'billing', label: 'Finance & POS', icon: <BillingIcon /> },
      { id: 'crm', label: 'Lead Intelligence', icon: <StorkIcon /> },
      { id: 'automation', label: 'Automations', icon: <AutoUpdateIcon /> },
      { id: 'staff', label: 'Team Force', icon: <StaffIcon /> },
      { id: 'settings', label: 'System Settings', icon: <SettingsIcon /> },
    ]
  },
  { 
    category: 'Neural Engine', 
    items: [
      { id: 'neuralCore', label: 'AI R&D Lab', icon: <BrainCircuitIcon /> },
      { id: 'geminiHub', label: 'Strategy Hub', icon: <SparkleIcon /> },
      { id: 'workouts', label: 'Protocols', icon: <WorkoutIcon /> },
      { id: 'diet', label: 'Bio-Nutrition', icon: <DietIcon /> },
      { id: 'simulator', label: '3D Simulation', icon: <BodyScanIcon /> },
      { id: 'royalBots', label: 'Bot Swarm', icon: <CloudArrowUpIcon /> },
    ]
  }
];

const memberNavItems = [
    { category: 'My Training', items: [
        { id: 'dashboard', label: 'Overview', icon: <DashboardIcon /> },
        { id: 'workout', label: 'Daily Mission', icon: <WorkoutIcon /> },
        { id: 'diet', label: 'Bio-Sync Diet', icon: <DietIcon /> },
        { id: 'attendance', label: 'Auto Check-in', icon: <FingerPrintIcon /> },
        { id: 'scheduler', label: 'Smart Schedule', icon: <TimeQuestIcon /> },
    ]},
    { category: 'Intelligence', items: [
        { id: 'health', label: 'Bio-Telemetry', icon: <SmartWatchIcon /> },
        { id: 'simulator', label: 'Future Mirror', icon: <BodyScanIcon /> },
        { id: 'payments', label: 'Payments', icon: <DollarSignIcon /> },
    ]}
];

const Sidebar: React.FC<SidebarProps> = memo(({ currentView, setCurrentView, isOpen, setIsOpen, role = 'admin' }) => {
  const baseClasses = "flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 mb-1 group";
  const activeClasses = "bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]";
  const inactiveClasses = "text-gray-400 hover:bg-gray-800 hover:text-white";

  const navItems = role === 'member' ? memberNavItems : adminNavItems;

  return (
    <div className={`bg-[#080808] text-white flex flex-col h-screen transition-all duration-300 ${isOpen ? 'w-72' : 'w-0 overflow-hidden'} md:w-72 border-r border-white/5 relative z-30`}>
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/5">
             <BrandLogo size="sm" />
             <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
          {navItems.map((section, idx) => (
            <div key={idx}>
              <h3 className="px-4 mb-4 text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">
                {section.category}
              </h3>
              <div className="space-y-1">
                {section.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setCurrentView(item.id); if (window.innerWidth < 768) setIsOpen(false); }}
                    className={`${baseClasses} ${currentView === item.id ? activeClasses : inactiveClasses}`}
                  >
                    <span className={`${currentView === item.id ? 'text-black' : 'text-gray-500 group-hover:text-amber-500'} transition-colors`}>{item.icon}</span>
                    <span className="ml-4 uppercase tracking-wider">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 bg-black/40">
            <button onClick={() => setCurrentView('controlPanel')} className="w-full bg-gray-900 border border-white/5 rounded-2xl p-4 text-left group hover:border-amber-500/50 transition-all">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Neural Link</span>
                    <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                </div>
                <div className="flex items-center gap-3">
                    <BrainCircuitIcon className="w-5 h-5 text-cyan-400" />
                    <div>
                        <p className="text-xs font-bold text-white uppercase">System Stable</p>
                        <p className="text-[9px] text-gray-500 font-mono">LATENCY: 14MS</p>
                    </div>
                </div>
            </button>
        </div>
    </div>
  );
});

export default Sidebar;
