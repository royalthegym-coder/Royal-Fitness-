import React from 'react';
import { LogOut, WifiOff } from 'lucide-react';
import { signOutFirebaseUser } from '../../../lib/firebase';
import { IconButton, ThemeToggle, cx } from '../ui';

export interface PortalTab<T extends string> {
  id: T;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

function useOnline() {
  const [online, setOnline] = React.useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  React.useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

/**
 * Mobile-first app shell for the Super Admin, Trainer and Member portals:
 * top app bar + bottom navigation on phones, left rail on tablets/desktop.
 */
export function PortalShell<T extends string>({
  title,
  subtitle,
  badge,
  tabs,
  active,
  onTab,
  topBar,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  tabs: PortalTab<NoInfer<T>>[];
  active: T;
  onTab: (t: NoInfer<T>) => void;
  topBar?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const online = useOnline();
  const mainRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [active]);

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-canvas text-fg">
      {topBar}
      <header className="pt-safe shrink-0 bg-surface/90 backdrop-blur border-b border-line">
        <div className="h-14 px-3 sm:px-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand text-brand-fg font-extrabold text-sm flex items-center justify-center shrink-0" aria-hidden="true">
            {(title || 'FF').replace(/[^A-Za-z0-9 ]/g, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'FF'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[15px] font-bold truncate">{title}</span>
              {badge}
            </div>
            {subtitle && <div className="text-[11px] text-muted truncate">{subtitle}</div>}
          </div>
          {actions}
          <ThemeToggle />
          <IconButton label="Sign out" onClick={() => void signOutFirebaseUser()}>
            <LogOut className="w-[18px] h-[18px]" />
          </IconButton>
        </div>
        {!online && (
          <div className="px-4 py-1.5 text-[11px] bg-amber-500/15 text-amber-500 border-t border-amber-500/30 flex items-center justify-center gap-1.5" role="status">
            <WifiOff className="w-3.5 h-3.5" /> Offline — changes are saved on this phone and sync when you reconnect.
          </div>
        )}
      </header>

      <div className="flex flex-1 min-h-0">
        <nav aria-label="Sections" className="hidden md:flex w-56 shrink-0 flex-col gap-1 p-3 border-r border-line bg-surface/50">
          {tabs.map((t) => {
            const Icon = t.icon;
            const on = t.id === active;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTab(t.id)}
                aria-current={on ? 'page' : undefined}
                className={cx(
                  'h-11 px-3 rounded-xl flex items-center gap-2.5 text-sm font-medium transition cursor-pointer',
                  on ? 'bg-brand/15 text-brand' : 'text-muted hover:text-fg hover:bg-fg/5'
                )}
              >
                <Icon className="w-[18px] h-[18px]" />
                {t.label}
              </button>
            );
          })}
        </nav>

        <main ref={mainRef} className="flex-1 min-w-0 overflow-y-auto custom-scrollbar">
          <div className="max-w-5xl mx-auto px-3 sm:px-5 py-4 pb-28 md:pb-8">{children}</div>
        </main>
      </div>

      <nav aria-label="Sections" className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-line pb-safe">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map((t) => {
            const Icon = t.icon;
            const on = t.id === active;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTab(t.id)}
                aria-current={on ? 'page' : undefined}
                className={cx('h-14 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold cursor-pointer', on ? 'text-brand' : 'text-subtle')}
              >
                <Icon className="w-5 h-5" />
                <span className="truncate max-w-full px-1">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default PortalShell;
