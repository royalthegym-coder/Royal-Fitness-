import React from 'react';
import { Menu, Building2, UserCircle2, LogOut } from 'lucide-react';
import { useGym } from '../context/GymProvider';
import { View } from '../../types';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  userName: string;
  onToggleSidebar: () => void;
  onSwitchAccount?: () => void;
}

const VIEW_TITLES: Record<string, string> = {
  dashboard: 'AI Auto Operator Dashboard',
  members: 'Members Management',
  admission: 'Scientific AI Admission Form',
  packages: 'Packages & Annual Discounts',
  billing: 'AI Smart Billing',
  attendance: 'Geometric Attendance',
  staff: 'AI Staff Management',
  workouts: 'Smart Workouts',
  diets: 'Smart Diet Plans',
  expenses: 'Expenses Management',
  reports: 'AI Reports & Analytics',
  whatsapp: 'WhatsApp Business AI',
  socialConnect: 'Social Connect & Official Videos',
  leads: 'AI Leads Management',
  offers: 'Offers Manager',
  reviews: 'Reviews System',
  settings: 'Gym Management Settings',
  publicProfile: 'Official Public Gym Profile',
  gymRegistration: 'Gym Registration & Branding',
  database: 'Database Records',
  access: 'Team, Trainers & Member Access',
  memberPortal: 'Member Portal Preview',
};

const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  userName,
  onToggleSidebar,
  onSwitchAccount,
}) => {
  const { currentGym } = useGym();
  const title = VIEW_TITLES[currentView] || 'Gym Management';

  const initials = (userName || 'GO')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-16 px-4 lg:px-6 bg-[#0D0F14] border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-lg bg-zinc-900 border border-white/10 text-zinc-200 hover:text-white cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <div className="text-sm sm:text-base font-semibold text-white truncate">{title}</div>
          <div className="text-[11px] text-zinc-400 truncate hidden sm:block">
            {currentGym?.gymName || 'Fitness Future'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setCurrentView('gymRegistration')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-200 cursor-pointer"
        >
          <Building2 className="w-3.5 h-3.5 text-amber-400" />
          Gym Profile
        </button>

        <button
          type="button"
          onClick={() => setCurrentView(currentView === 'memberPortal' ? 'dashboard' : 'memberPortal')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-200 cursor-pointer"
        >
          <UserCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden xs:inline">
            {currentView === 'memberPortal' ? 'Back to Admin' : 'Member Portal'}
          </span>
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center">
            {initials}
          </div>
          {onSwitchAccount && (
            <button
              type="button"
              onClick={onSwitchAccount}
              title="Switch Account / Login"
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;