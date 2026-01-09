
import React from 'react';
import { DashboardIcon, PackageIcon, MembersIcon, BillingIcon, WorkoutIcon, DietIcon, StaffIcon, ExpensesIcon, SettingsIcon, LeadsIcon, MembershipIcon, SparkleIcon } from './icons/NavIcons';
import { View } from '../App';
import { QrCodeIcon } from './icons/QrCodeIcon';
import { VoiceIcon } from './icons/VoiceIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { AIFitnessTrackerIcon } from './icons/AIFitnessTrackerIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { HealthEngineIcon } from './icons/HealthEngineIcon';
import { GeniusIcon } from './icons/GeniusIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { BotIcon } from './icons/BotIcon';


interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { id: 'healthIntelligence', label: 'Health Intelligence', icon: <div className="text-teal-400"><HealthEngineIcon /></div> }, // New Item
  { id: 'futureOps', label: 'Future Ops (AI)', icon: <BotIcon /> }, 
  { id: 'tasks', label: 'Tasks', icon: <ClipboardListIcon /> },
  { id: 'geniusMode', label: 'Genius Mode', icon: <GeniusIcon /> },
  { id: 'geminiHub', label: 'Gemini Hub', icon: <SparkleIcon /> },
  { id: 'voiceAssistant', label: 'Voice Assistant', icon: <VoiceIcon /> },
  { id: 'aiTracker', label: 'AI Fitness Tracker', icon: <AIFitnessTrackerIcon /> },
  { id: 'members', label: 'Members', icon: <MembersIcon /> },
  { id: 'packages', label: 'Packages', icon: <PackageIcon /> },
  { id: 'billing', label: 'Billing', icon: <BillingIcon /> },
  { id: 'payment', label: 'Payment', icon: <QrCodeIcon /> },
  { id: 'whatsapp', label: 'WhatsApp Business', icon: <WhatsAppIcon className="w-5 h-5" /> },
  { id: 'memberships', label: 'Memberships', icon: <MembershipIcon /> },
  { id: 'leads', label: 'Leads', icon: <LeadsIcon /> },
  { id: 'workouts', label: 'Workouts', icon: <WorkoutIcon /> },
  { id: 'diet', label: 'Diet Plans', icon: <DietIcon /> },
  { id: 'staff', label: 'Staff', icon: <StaffIcon /> },
  { id: 'expenses', label: 'Expenses', icon: <ExpensesIcon /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
] as const;


const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, setIsOpen }) => {
  const baseClasses = "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200";
  const activeClasses = "bg-amber-500 text-gray-900";
  const inactiveClasses = "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white";

  return (
    <div className={`bg-white dark:bg-gray-800 text-gray-800 dark:text-white flex flex-col transition-all duration-300 ${isOpen ? 'w-64' : 'w-0 overflow-hidden'} md:w-64`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <span className="text-xl font-bold text-amber-500 dark:text-amber-400">Royal The Gym</span>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                  setCurrentView(item.id as View);
                  if (window.innerWidth < 768) setIsOpen(false);
                }}
              className={`${baseClasses} ${currentView === item.id ? activeClasses : inactiveClasses} w-full`}
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center text-gray-500 dark:text-gray-400">
                <AutoUpdateIcon className="w-5 h-5 text-green-500 dark:text-green-400" />
                <div className="ml-3">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">Auto Updates</p>
                    <p className="text-xs text-green-500 dark:text-green-400">Enabled & Up to date</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Sidebar;
