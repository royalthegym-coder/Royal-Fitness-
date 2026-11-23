import React, { Suspense, useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { View } from '../../../types';
import { useData } from '../../context/DataProvider';
import { useGym } from '../../context/GymProvider';
import { signOutFirebaseUser } from '../../../lib/firebase';
import { useSessionStore } from '../../../lib/session';
import { lazyWithRetry } from '../../lazyWithRetry';
import Sidebar from '../Sidebar';
import Header from '../Header';
import ErrorBoundary from '../common/ErrorBoundary';

// Every screen is its own chunk: only the screen you open is downloaded.
const AIAutoOperatorDashboard = lazyWithRetry(() => import('../suite/AIAutoOperatorDashboard'));
const MembersManager = lazyWithRetry(() => import('../suite/MembersManager'));
const PackagesManager = lazyWithRetry(() => import('../suite/PackagesManager'));
const SmartBilling = lazyWithRetry(() => import('../suite/SmartBilling'));
const ScientificAdmission = lazyWithRetry(() => import('../suite/ScientificAdmission'));
const SmartWorkouts = lazyWithRetry(() => import('../suite/SmartWorkouts'));
const SmartDietPlans = lazyWithRetry(() => import('../suite/SmartDietPlans'));
const StaffManager = lazyWithRetry(() => import('../suite/StaffManager'));
const ExpensesManager = lazyWithRetry(() => import('../suite/ExpensesManager'));
const AIReports = lazyWithRetry(() => import('../suite/AIReports'));
const GeometricAttendance = lazyWithRetry(() => import('../suite/GeometricAttendance'));
const WhatsAppBusinessAI = lazyWithRetry(() => import('../suite/WhatsAppBusinessAI'));
const LeadsManager = lazyWithRetry(() => import('../suite/LeadsManager'));
const OffersManager = lazyWithRetry(() => import('../suite/OffersManager'));
const ReviewsManager = lazyWithRetry(() => import('../suite/ReviewsManager'));
const DatabaseExplorer = lazyWithRetry(() => import('../suite/DatabaseExplorer'));
const SocialConnectHub = lazyWithRetry(() => import('../suite/SocialConnectHub'));
const CleanMemberPortal = lazyWithRetry(() => import('../suite/CleanMemberPortal'));
const GymSettingsPanel = lazyWithRetry(() => import('../suite/GymSettingsPanel'));
const PublicGymProfile = lazyWithRetry(() => import('../suite/PublicGymProfile'));
const AccessManager = lazyWithRetry(() => import('./AccessManager'));

const ScreenLoader = () => <div className="py-20 text-center text-xs text-zinc-500">Loading…</div>;

/** Gym owner (admin) portal. Also used by the super admin after choosing a gym. */
export const AdminPortal: React.FC<{ topBar?: React.ReactNode }> = ({ topBar }) => {
  const { members, isHydrating } = useData();
  const { currentGym } = useGym();
  const user = useSessionStore((s) => s.user);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [previewMemberId, setPreviewMemberId] = useState<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    const on = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'members': return <MembersManager />;
      case 'packages': return <PackagesManager />;
      case 'billing': return <SmartBilling />;
      case 'admission': return <ScientificAdmission setCurrentView={setCurrentView} />;
      case 'workouts': return <SmartWorkouts />;
      case 'diets': return <SmartDietPlans />;
      case 'staff': return <StaffManager />;
      case 'expenses': return <ExpensesManager />;
      case 'reports': return <AIReports />;
      case 'attendance': return <GeometricAttendance />;
      case 'whatsapp': return <WhatsAppBusinessAI />;
      case 'socialConnect': return <SocialConnectHub />;
      case 'leads': return <LeadsManager />;
      case 'offers': return <OffersManager />;
      case 'reviews': return <ReviewsManager />;
      case 'database': return <DatabaseExplorer />;
      case 'settings': return <GymSettingsPanel setCurrentView={setCurrentView} />;
      case 'publicProfile': return <PublicGymProfile setCurrentView={setCurrentView} />;
      case 'access': return <AccessManager />;
      case 'memberPortal': {
        const target = members.find((m) => m.id === previewMemberId) || members[0];
        return (
          <div className="space-y-4">
            <div className="bg-[#111318] border border-white/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">Member Portal Preview</h2>
              <select aria-label="Select member to preview" value={target?.id || ''} onChange={(e) => setPreviewMemberId(Number(e.target.value))} className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white">
                {members.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>)}
              </select>
            </div>
            {target ? <CleanMemberPortal member={target} onExit={() => setCurrentView('dashboard')} isPreview /> : <p className="text-xs text-zinc-500">No members yet.</p>}
          </div>
        );
      }
      default: return <AIAutoOperatorDashboard setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#09090B] text-zinc-100">
      {topBar}
      <div className="flex flex-1 min-h-0">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <Header
            currentView={currentView}
            setCurrentView={setCurrentView}
            userName={currentGym?.ownerName || user?.displayName || user?.email || 'Gym Owner'}
            onToggleSidebar={() => setIsSidebarOpen((p) => !p)}
            onSwitchAccount={() => void signOutFirebaseUser()}
          />
          {isOffline && (
            <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 flex items-center justify-center gap-2 shrink-0">
              <WifiOff className="w-3.5 h-3.5" /> Offline — changes are saved on this device and sync automatically when you reconnect.
            </div>
          )}
          <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {isHydrating && <div className="text-[11px] text-zinc-500 mb-2">Syncing gym data…</div>}
              <ErrorBoundary>
                <Suspense fallback={<ScreenLoader />}>{renderView()}</Suspense>
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
