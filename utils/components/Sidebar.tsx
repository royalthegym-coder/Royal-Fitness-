
import React, { memo, useState, useEffect } from 'react';
import { DashboardIcon, PackageIcon, MembersIcon, BillingIcon, WorkoutIcon, DietIcon, StaffIcon, ExpensesIcon, SettingsIcon, LeadsIcon, MembershipIcon } from './icons/NavIcons';
import { SparkleIcon } from './icons/SparkleIcon';
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

// --- CONSOLIDATED "STREET TOOLS" ---

const adminNavItems = [
  { 
    category: 'Tool 1: Royal Operations', 
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
      { id: 'members', label: 'Members', icon: <MembersIcon /> },
      { id: 'billing', label: 'Billing & POS', icon: <BillingIcon /> },
      { id: 'payment', label: 'Terminal', icon: <QrCodeIcon /> },
      { id: 'packages', label: 'Packages', icon: <PackageIcon /> },
      { id: 'crm', label: 'Smart CRM', icon: <UserGroupIcon /> },
      { id: 'automation', label: 'Automation', icon: <AutoUpdateIcon /> },
      { id: 'staff', label: 'Staff & Payroll', icon: <StaffIcon /> },
      { id: 'expenses', label: 'Expenses', icon: <ExpensesIcon /> },
      { id: 'tasks', label: 'Tasks', icon: <ClipboardListIcon /> },
      { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
    ]
  },
  { 
    category: 'Tool 2: Neural Engine', 
    items: [
      { id: 'geminiHub', label: 'Gemini Hub', icon: <SparkleIcon /> },
      { id: 'workouts', label: 'Workouts', icon: <WorkoutIcon /> },
      { id: 'diet', label: 'Diet Plans', icon: <DietIcon /> },
      { id: 'healthEngine', label: 'Health Core', icon: <HealthEngineIcon /> },
      { id: 'voiceAssistant', label: 'Voice Ops', icon: <div className="text-amber-400"><BotIcon /></div> },
      { id: 'simulator', label: '3D Simulator', icon: <BodyScanIcon /> },
      { id: 'royalBots', label: 'Bot Swarm', icon: <CloudArrowUpIcon /> },
      { id: 'security', label: 'Security', icon: <ShieldCheckIcon className="w-5 h-5 text-red-500" /> },
      { id: 'selfRepair', label: 'Self-Repair', icon: <BugFixIcon className="w-5 h-5 text-indigo-400" /> },
      { id: 'performance', label: 'Turbo Core', icon: <SpeedIcon className="w-5 h-5 text-cyan-400" /> },
    ]
  }
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
  const activeClasses = "bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
  const inactiveClasses = "text-gray-400 hover:bg-gray-800/50 hover:text-white";

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
    <div className={`bg-gray-900/90 backdrop-blur-xl text-white flex flex-col transition-all duration-300 ${isOpen ? 'w-64' : 'w-0 overflow-hidden'} md:w-64 border-r border-white/5 h-screen absolute md:relative z-30 shadow-2xl`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/5 flex-shrink-0 bg-gray-900/50">
          <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 tracking-wider drop-shadow-md">{title}</span>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
          {navItems.map((section, idx) => (
            <div key={idx}>
              <div className="flex items-center px-3 mb-2">
                  <div className={`w-1 h-3 rounded-full mr-2 ${idx === 0 ? 'bg-amber-500' : 'bg-cyan-500'}`}></div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {section.category}
                  </h3>
              </div>
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
                    <span className={`${currentView === item.id ? 'text-amber-400' : 'text-gray-400 group-hover:text-white'} transition-colors`}>
                        {item.icon}
                    </span>
                    <span className="ml-3 font-semibold">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Social Links Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-gray-900/50">
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

        {/* Improved System Status Footer - Admin Only */}
        {role === 'admin' && (
            <div className="p-4 border-t border-white/5 bg-gray-900/50">
                <button 
                    onClick={() => setCurrentView('controlPanel')}
                    className="w-full bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl p-3 transition-all group text-left shadow-inner backdrop-blur-sm"
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
                        <div className="p-2 bg-gray-800 rounded-lg border border-gray-600 group-hover:border-amber-500/50 transition-colors">
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

                    <div className="grid grid-cols-3 gap-1 mt-3 pt-3 border-t border-white/10">
                        <div className="text-center">
                            <p className="text-[8px] text-gray-500 uppercase">CPU</p>
                            <p className="text-[10px] font-mono text-gray-300">12%</p>
                        </div>
                        <div className="text-center border-l border-white/10">
                            <p className="text-[8px] text-gray-500 uppercase">MEM</p>
                            <p className="text-[10px] font-mono text-gray-300">1.4GB</p>
                        </div>
                        <div className="text-center border-l border-white/10">
                            <p className="text-[8px] text-gray-500 uppercase">AI OPS</p>
                            <p className="text-[10px] font-mono text-amber-400">Active</p>
                        </div>
                    </div>
                </button>
            </div>
        )}
    </div>
  );
});

export default Sidebar;
