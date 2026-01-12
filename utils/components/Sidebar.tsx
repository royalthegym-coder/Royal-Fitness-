
import React, { memo, useState, useEffect } from 'react';
import { DashboardIcon, PackageIcon, MembersIcon, BillingIcon, WorkoutIcon, DietIcon, StaffIcon, ExpensesIcon, SettingsIcon, LeadsIcon, MembershipIcon, SparkleIcon } from './icons/NavIcons';
import { QrCodeIcon } from './icons/QrCodeIcon';
import { AIFitnessTrackerIcon } from './icons/AIFitnessTrackerIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { HealthEngineIcon } from './icons/HealthEngineIcon';
import { GeniusIcon } from './icons/GeniusIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { BodyScanIcon } from './icons/BodyScanIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { AwardIcon } from './icons/AwardIcon';
import { BotIcon } from './icons/BotIcon';
import { HealthIcon } from './icons/HealthIcons';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { BusinessIcon } from './icons/BusinessIcon';
import { CloudArrowUpIcon } from './icons/CloudArrowUpIcon';
import { BugFixIcon } from './icons/BugFixIcon';
import { SmartWatchIcon } from './icons/SmartWatchIcon';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';
import { TerminalIcon } from './icons/TerminalIcon';
import { SpeedIcon } from './icons/SpeedIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { ControlIcon } from './icons/ControlIcon';
import { FacebookIcon, InstagramIcon, TwitterIcon } from './icons/SocialIcons';
import { GYM_INFO } from '../../constants';


interface SidebarProps {
  currentView: string;
  setCurrentView: (view: any) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  role?: 'admin' | 'member';
}

const adminNavItems = [
  { category: 'Overview', items: [
      { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
      { id: 'tasks', label: 'Tasks', icon: <ClipboardListIcon /> },
  ]},
  { category: 'Smart Business (AI)', items: [
      { id: 'royalBots', label: 'Royal Autopilot', icon: <div className="text-amber-400"><BotIcon /></div> }, 
      { id: 'crm', label: 'Smart CRM', icon: <UserGroupIcon /> },
      { id: 'automation', label: 'Automation Suite', icon: <AutoUpdateIcon /> },
      { id: 'leads', label: 'Leads (Classic)', icon: <LeadsIcon /> },
  ]},
  { category: 'Management', items: [
      { id: 'members', label: 'Members', icon: <MembersIcon /> },
      { id: 'packages', label: 'Packages', icon: <PackageIcon /> },
      { id: 'billing', label: 'Billing', icon: <BillingIcon /> },
      { id: 'payment', label: 'POS / Payment', icon: <QrCodeIcon /> },
      { id: 'staff', label: 'Staff', icon: <StaffIcon /> },
      { id: 'expenses', label: 'Expenses', icon: <ExpensesIcon /> },
  ]},
  { category: 'Fitness & Nutrition', items: [
      { id: 'workouts', label: 'Workout Library', icon: <WorkoutIcon /> },
      { id: 'diet', label: 'Diet Plans', icon: <DietIcon /> },
  ]},
  { category: 'AI Intelligence Suite', items: [
      { id: 'healthIntelligence', label: 'Health Intelligence', icon: <div className="text-teal-400"><HealthEngineIcon /></div> }, 
      { id: 'geminiHub', label: 'Gemini Hub', icon: <SparkleIcon /> },
      { id: 'geniusMode', label: 'Genius Mode', icon: <GeniusIcon /> },
      { id: 'aiTracker', label: 'Client Analysis', icon: <AIFitnessTrackerIcon /> },
      { id: 'simulator', label: '3D Simulator', icon: <BodyScanIcon className="w-5 h-5" /> },
  ]},
  { category: 'System Core', items: [
      { id: 'security', label: 'Security Layer', icon: <ShieldCheckIcon className="w-5 h-5 text-red-500" /> },
      { id: 'performance', label: 'Performance Layer', icon: <SpeedIcon className="w-5 h-5 text-indigo-400" /> },
      { id: 'debugEngine', label: 'Debug Engine', icon: <TerminalIcon className="w-5 h-5 text-purple-400" /> },
      { id: 'neuralCore', label: 'Neural System Core', icon: <BrainCircuitIcon className="w-5 h-5 text-cyan-400" /> },
      { id: 'autoUpgrader', label: 'Auto Upgrader', icon: <CloudArrowUpIcon className="w-5 h-5" /> },
      { id: 'selfRepair', label: 'Self-Healing Engine', icon: <BugFixIcon className="w-5 h-5 text-red-400" /> },
      { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
  ]},
];

const memberNavItems = [
    { category: 'My Fitness', items: [
        { id: 'workout', label: 'Today\'s Workout', icon: <WorkoutIcon /> },
        { id: 'diet', label: 'My Diet Plan', icon: <DietIcon /> },
        { id: 'tracker', label: 'Fitness Tracker', icon: <ChartBarIcon /> },
        { id: 'smartwatch', label: 'Wearables', icon: <SmartWatchIcon /> },
    ]},
    { category: 'Health & Science', items: [
        { id: 'health', label: 'Health Dashboard', icon: <HealthIcon /> },
        { id: 'simulator', label: 'Body Simulator', icon: <BodyScanIcon className="w-5 h-5" /> },
    ]},
    { category: 'Gamification', items: [
        { id: 'achievements', label: 'Achievements', icon: <AwardIcon className="w-5 h-5"/> },
    ]},
    { category: 'AI Tools', items: [
        { id: 'ai_tools', label: 'Future Ops', icon: <BotIcon /> },
    ]}
];


const Sidebar: React.FC<SidebarProps> = memo(({ currentView, setCurrentView, isOpen, setIsOpen, role = 'admin' }) => {
  const baseClasses = "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 mb-1";
  const activeClasses = "bg-amber-500 text-gray-900";
  const inactiveClasses = "text-gray-400 hover:bg-gray-800 hover:text-white";

  const navItems = role === 'member' ? memberNavItems : adminNavItems;
  const title = role === 'member' ? 'Royal Member' : 'Royal Admin';

  const [systemIndex, setSystemIndex] = useState(0);
  const systems = [
      { name: 'Neural Core', status: 'Processing...', icon: <BrainCircuitIcon className="w-4 h-4 text-cyan-400"/>, color: 'text-cyan-400' },
      { name: 'Security Shield', status: 'Threat Scan: Idle', icon: <ShieldCheckIcon className="w-4 h-4 text-green-400"/>, color: 'text-green-400' },
      { name: 'Gemini Agent', status: 'Listening (Live)', icon: <SparkleIcon className="w-4 h-4 text-purple-400"/>, color: 'text-purple-400' },
      { name: 'Self-Repair', status: 'Integrity: 100%', icon: <BugFixIcon className="w-4 h-4 text-amber-400"/>, color: 'text-amber-400' },
  ];

  useEffect(() => {
      const interval = setInterval(() => {
          setSystemIndex((prev) => (prev + 1) % systems.length);
      }, 4000);
      return () => clearInterval(interval);
  }, []);

  const currentSystem = systems[systemIndex];

  return (
    <div className={`bg-gray-900 text-white flex flex-col transition-all duration-300 ${isOpen ? 'w-64' : 'w-0 overflow-hidden'} md:w-64 border-r border-gray-800 h-screen absolute md:relative z-30`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800 flex-shrink-0 bg-gray-900">
          <span className="text-xl font-bold text-amber-500 tracking-wider">{title}</span>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
          {navItems.map((section, idx) => (
            <div key={idx}>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {section.category}
              </h3>
              <div className="space-y-1">
                {section.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                        setCurrentView(item.id);
                        if (window.innerWidth < 768) setIsOpen(false);
                      }}
                    className={`${baseClasses} ${currentView === item.id ? activeClasses : inactiveClasses} w-full group`}
                  >
                    <span className={`${currentView === item.id ? 'text-gray-900' : 'text-gray-400 group-hover:text-white'}`}>
                        {item.icon}
                    </span>
                    <span className="ml-3">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Social Links Footer */}
        <div className="px-6 py-4 border-t border-gray-800 bg-gray-900">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Connect With Us</p>
            <div className="flex space-x-4">
                <a href={GYM_INFO.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors" title="Instagram">
                    <InstagramIcon className="w-5 h-5" />
                </a>
                <a href={GYM_INFO.socials.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors" title="Facebook">
                    <FacebookIcon className="w-5 h-5" />
                </a>
                <a href={GYM_INFO.socials.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors" title="Twitter">
                    <TwitterIcon className="w-5 h-5" />
                </a>
                <a href={GYM_INFO.socials.whatsapp} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 transition-colors" title="WhatsApp">
                    <WhatsAppIcon className="w-5 h-5" />
                </a>
            </div>
        </div>

        {/* Improved System Status Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900">
            <button 
                onClick={() => setCurrentView('controlPanel')}
                className="w-full bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl p-3 transition-all group text-left shadow-inner"
            >
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">System Status</span>
                    <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-[10px] text-green-400 font-mono">98.2% UP</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-900 rounded-lg border border-gray-600 group-hover:border-amber-500/50 transition-colors">
                        {currentSystem.icon}
                    </div>
                    <div>
                        <p className={`text-xs font-bold ${currentSystem.color} transition-all duration-300`}>
                            {currentSystem.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                            {currentSystem.status}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-1 mt-3 pt-3 border-t border-gray-700/50">
                    <div className="text-center">
                        <p className="text-[8px] text-gray-500 uppercase">CPU</p>
                        <p className="text-[10px] font-mono text-gray-300">12%</p>
                    </div>
                    <div className="text-center border-l border-gray-700/50">
                        <p className="text-[8px] text-gray-500 uppercase">MEM</p>
                        <p className="text-[10px] font-mono text-gray-300">1.4GB</p>
                    </div>
                    <div className="text-center border-l border-gray-700/50">
                        <p className="text-[8px] text-gray-500 uppercase">AI OPS</p>
                        <p className="text-[10px] font-mono text-amber-400">Active</p>
                    </div>
                </div>
            </button>
        </div>
    </div>
  );
});

export default Sidebar;
