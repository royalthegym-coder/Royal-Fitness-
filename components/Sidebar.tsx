
import React from 'react';
import { DashboardIcon, PackageIcon, MembersIcon, BillingIcon, WorkoutIcon, DietIcon, StaffIcon, ExpensesIcon, SettingsIcon, LeadsIcon, MembershipIcon, SparkleIcon } from './icons/NavIcons';
// Remove View import to make component more flexible
// import { View } from '../App';
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
  { category: 'Management', items: [
      { id: 'members', label: 'Members', icon: <MembersIcon /> },
      { id: 'packages', label: 'Packages', icon: <PackageIcon /> },
      { id: 'billing', label: 'Billing', icon: <BillingIcon /> },
      { id: 'payment', label: 'POS / Payment', icon: <QrCodeIcon /> },
      { id: 'staff', label: 'Staff', icon: <StaffIcon /> },
      { id: 'expenses', label: 'Expenses', icon: <ExpensesIcon /> },
  ]},
  { category: 'Growth & CRM', items: [
      { id: 'leads', label: 'Leads', icon: <LeadsIcon /> },
      { id: 'whatsapp', label: 'WhatsApp Business', icon: <WhatsAppIcon className="w-5 h-5" /> },
      { id: 'memberships', label: 'Memberships', icon: <MembershipIcon /> },
  ]},
  { category: 'Fitness & Nutrition', items: [
      { id: 'workouts', label: 'Workout Library', icon: <WorkoutIcon /> },
      { id: 'diet', label: 'Diet Plans', icon: <DietIcon /> },
  ]},
  { category: 'AI Intelligence Suite', items: [
      { id: 'geminiHub', label: 'Gemini Hub', icon: <SparkleIcon /> },
      { id: 'healthIntelligence', label: 'Health Intelligence', icon: <div className="text-teal-400"><HealthEngineIcon /></div> }, 
      { id: 'geniusMode', label: 'Genius Mode', icon: <GeniusIcon /> },
      { id: 'aiTracker', label: 'Client Analysis', icon: <AIFitnessTrackerIcon /> },
      { id: 'simulator', label: '3D Simulator', icon: <BodyScanIcon className="w-5 h-5" /> },
  ]},
  { category: 'System', items: [
      { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
  ]},
];

const memberNavItems = [
    { category: 'My Fitness', items: [
        { id: 'workout', label: 'Today\'s Workout', icon: <WorkoutIcon /> },
        { id: 'diet', label: 'My Diet Plan', icon: <DietIcon /> },
        { id: 'tracker', label: 'Fitness Tracker', icon: <ChartBarIcon /> },
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


const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, setIsOpen, role = 'admin' }) => {
  const baseClasses = "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 mb-1";
  const activeClasses = "bg-amber-500 text-gray-900";
  const inactiveClasses = "text-gray-400 hover:bg-gray-800 hover:text-white";

  const navItems = role === 'member' ? memberNavItems : adminNavItems;
  const title = role === 'member' ? 'Royal Member' : 'Royal Admin';

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

        <div className="p-4 border-t border-gray-800 bg-gray-900">
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <AutoUpdateIcon className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-3">
                    <p className="text-sm font-medium text-white">System Status</p>
                    <p className="text-xs text-green-400">All Systems Operational</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Sidebar;
