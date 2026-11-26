import React from 'react';
import {
  LayoutDashboard,
  Users,
  Layers,
  Receipt,
  ClipboardPlus,
  Dumbbell,
  Utensils,
  UserCog,
  Wallet,
  BarChart3,
  CheckSquare,
  MessageSquare,
  Target,
  Tag,
  Star,
  Database,
  Building2,
  UserCircle2,
  Share2,
  Settings,
  Globe,
  X,
  Sparkles,
} from 'lucide-react';
import { View } from '../../types';
import { useGym } from '../context/GymProvider';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: View;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Daily operations',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'members', label: 'Members', icon: Users },
      { id: 'admission', label: 'New admission', icon: ClipboardPlus },
      { id: 'packages', label: 'Plans & packages', icon: Layers },
      { id: 'billing', label: 'Billing & renewals', icon: Receipt },
      { id: 'attendance', label: 'Attendance', icon: CheckSquare },
      { id: 'staff', label: 'Staff', icon: UserCog },
    ],
  },
  {
    title: 'Training',
    items: [
      { id: 'workouts', label: 'Workout templates', icon: Dumbbell },
      { id: 'diets', label: 'Diet templates', icon: Utensils },
    ],
  },
  {
    title: 'Money & growth',
    items: [
      { id: 'expenses', label: 'Expenses', icon: Wallet },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
      { id: 'insights', label: 'AI insights', icon: Sparkles },
      { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
      { id: 'socialConnect', label: 'Social & Videos', icon: Share2 },
      { id: 'leads', label: 'Leads', icon: Target },
      { id: 'offers', label: 'Offers', icon: Tag },
      { id: 'reviews', label: 'Reviews', icon: Star },
    ],
  },
  {
    title: 'Setup',
    items: [
      { id: 'settings', label: 'Gym Settings', icon: Settings },
      { id: 'publicProfile', label: 'Public Profile', icon: Globe },
      { id: 'access', label: 'Team & Access', icon: Building2 },
      { id: 'database', label: 'Data export', icon: Database },
      { id: 'memberPortal', label: 'Member app preview', icon: UserCircle2 },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, onClose }) => {
  const { currentGym } = useGym();

  const handleSelect = (id: View) => {
    setCurrentView(id);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0D0F14] border-r border-white/10 flex flex-col shrink-0 transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSelect('dashboard')}
            className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
          >
            {currentGym?.logoUrl ? (
              <img
                src={currentGym.logoUrl}
                alt={currentGym.gymName || 'Gym Logo'}
                className="w-8 h-8 rounded-lg object-cover border border-white/15 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-zinc-950 font-bold text-sm flex items-center justify-center shrink-0">
                {(currentGym?.gymName || 'FF').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">
                {currentGym?.gymName || 'Fitness Future'}
              </div>
              <div className="text-[11px] text-zinc-400 truncate">Gym admin</div>
            </div>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                {group.title}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = currentView === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(item.id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                          active
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'text-zinc-300 hover:text-white hover:bg-white/[0.04] border border-transparent'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-400' : 'text-zinc-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Active Gym Footer */}
        <div className="p-3 border-t border-white/10 text-xs text-zinc-400">
          <div className="truncate font-medium text-zinc-200">
            {currentGym?.ownerName || 'Gym Owner'}
          </div>
          <div className="truncate text-[11px] text-zinc-500 mt-0.5">
            {currentGym?.paymentUpiId || currentGym?.upiId || 'Configure UPI in Gym Settings'}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
