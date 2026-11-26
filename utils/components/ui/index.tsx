/**
 * Fitness Future design system — small, dependency-free primitives built on the theme
 * tokens in index.css / tailwind.config.js (canvas, surface, surface2, line, fg, muted, subtle, brand).
 * Mobile-first: 44px touch targets, readable 14px body text, visible focus rings.
 */
import React from 'react';
import { Loader2, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../../theme';

export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

// ------------------------------------------------------------------ layout
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { padded?: boolean }> = ({ className, padded = true, ...p }) => (
  <div className={cx('bg-surface border border-line rounded-2xl shadow-sm', padded && 'p-4 sm:p-5', className)} {...p} />
);

export const CardHeader: React.FC<{ title: React.ReactNode; subtitle?: React.ReactNode; icon?: React.ReactNode; action?: React.ReactNode }> = ({
  title,
  subtitle,
  icon,
  action,
}) => (
  <div className="flex items-start justify-between gap-3 mb-3">
    <div className="flex items-start gap-2.5 min-w-0">
      {icon && <span className="mt-0.5 text-brand shrink-0">{icon}</span>}
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-fg leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const PageTitle: React.FC<{ title: string; subtitle?: React.ReactNode; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
    <div className="min-w-0">
      <h1 className="text-xl sm:text-2xl font-bold text-fg tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ------------------------------------------------------------------ controls
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-brand text-brand-fg hover:brightness-110',
  secondary: 'bg-surface2 text-fg border border-line hover:bg-fg/5',
  ghost: 'text-muted hover:text-fg hover:bg-fg/5',
  danger: 'bg-rose-600 text-white hover:bg-rose-500',
  success: 'bg-emerald-600 text-white hover:bg-emerald-500',
};

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md'; loading?: boolean; icon?: React.ReactNode }
>(({ variant = 'primary', size = 'md', loading, icon, className, children, disabled, type = 'button', ...p }, ref) => (
  <button
    ref={ref}
    type={type}
    disabled={disabled || loading}
    className={cx(
      'inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none',
      size === 'sm' ? 'h-9 px-3 text-xs' : 'h-11 px-4 text-sm',
      BTN[variant],
      className
    )}
    {...p}
  >
    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
    {children}
  </button>
));
Button.displayName = 'Button';

export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }> = ({ label, className, children, type = 'button', ...p }) => (
  <button
    type={type}
    aria-label={label}
    title={label}
    className={cx('inline-flex items-center justify-center w-10 h-10 rounded-xl text-muted hover:text-fg hover:bg-fg/5 transition cursor-pointer', className)}
    {...p}
  >
    {children}
  </button>
);

const fieldCls =
  'w-full h-11 rounded-xl bg-surface2 border border-line px-3 text-sm text-fg placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand/60';

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode; className?: string }> = ({ label, hint, children, className }) => (
  <label className={cx('block space-y-1', className)}>
    <span className="text-xs font-medium text-muted">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-subtle">{hint}</span>}
  </label>
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cx(fieldCls, className)} {...p} />
));
Input.displayName = 'Input';

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className, ...p }) => (
  <select className={cx(fieldCls, 'pr-8', className)} {...p} />
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...p }) => (
  <textarea className={cx(fieldCls, 'h-auto py-2.5 min-h-[88px]', className)} {...p} />
);

// ------------------------------------------------------------------ display
type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
const TONE: Record<Tone, string> = {
  neutral: 'bg-fg/5 text-muted border-line',
  brand: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  success: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  danger: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
  info: 'bg-sky-500/15 text-sky-500 border-sky-500/30',
};
export const Badge: React.FC<{ tone?: Tone; children: React.ReactNode; className?: string }> = ({ tone = 'neutral', children, className }) => (
  <span className={cx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold whitespace-nowrap', TONE[tone], className)}>{children}</span>
);

export const Stat: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
  onClick?: () => void;
  loading?: boolean;
}> = ({ label, value, hint, icon, tone = 'neutral', onClick, loading }) => {
  const Comp: any = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cx(
        'text-left bg-surface border border-line rounded-2xl p-4 flex flex-col gap-1 min-w-0',
        onClick && 'hover:border-brand/50 transition cursor-pointer'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted truncate">{label}</span>
        {icon && <span className={cx('w-8 h-8 rounded-lg flex items-center justify-center border', TONE[tone])}>{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-fg tracking-tight truncate">{loading ? <span className="inline-block h-7 w-16 rounded bg-fg/10 animate-pulse" /> : value}</div>
      {hint && <div className="text-[11px] text-subtle truncate">{hint}</div>}
    </Comp>
  );
};

export const EmptyState: React.FC<{ icon?: React.ReactNode; title: string; children?: React.ReactNode; action?: React.ReactNode }> = ({ icon, title, children, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-10 px-4 gap-2">
    {icon && <div className="w-12 h-12 rounded-2xl bg-fg/5 text-subtle flex items-center justify-center mb-1">{icon}</div>}
    <p className="text-sm font-semibold text-fg">{title}</p>
    {children && <p className="text-xs text-muted max-w-sm">{children}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => <div className={cx('rounded-lg bg-fg/10 animate-pulse', className)} />;

export const Spinner: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted" role="status">
    <Loader2 className="w-4 h-4 animate-spin" /> {label}
  </div>
);

/** Segmented control / tabs (scrolls horizontally on small screens). */
export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: NoInfer<T>) => void; items: Array<{ id: NoInfer<T>; label: string; count?: number }> }) {
  return (
    <div role="tablist" className="flex gap-1 p-1 bg-surface2 border border-line rounded-xl overflow-x-auto no-scrollbar">
      {items.map((it) => (
        <button
          key={it.id}
          role="tab"
          type="button"
          aria-selected={value === it.id}
          onClick={() => onChange(it.id)}
          className={cx(
            'h-9 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer',
            value === it.id ? 'bg-surface text-fg shadow-sm border border-line' : 'text-muted hover:text-fg'
          )}
        >
          {it.label}
          {it.count != null && <span className="ml-1.5 text-subtle">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Bottom sheet on phones, centered dialog on larger screens. */
export const Sheet: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }> = ({
  open,
  onClose,
  title,
  children,
  footer,
}) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full sm:max-w-lg max-h-[90dvh] flex flex-col bg-surface border border-line rounded-t-3xl sm:rounded-2xl shadow-2xl">
        <div className="px-5 pt-4 pb-3 border-b border-line flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-fg">{title}</h3>
          <IconButton label="Close" onClick={onClose}>
            ✕
          </IconButton>
        </div>
        <div className="p-5 overflow-y-auto custom-scrollbar space-y-3">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-line pb-safe flex gap-2 justify-end">{footer}</div>}
      </div>
    </div>
  );
};

export const ThemeToggle: React.FC = () => {
  const pref = useTheme((s) => s.pref);
  const cycle = useTheme((s) => s.cycle);
  const label = pref === 'dark' ? 'Theme: dark (tap for light)' : pref === 'light' ? 'Theme: light (tap for system)' : 'Theme: system (tap for dark)';
  return (
    <IconButton label={label} onClick={cycle}>
      {pref === 'dark' ? <Moon className="w-[18px] h-[18px]" /> : pref === 'light' ? <Sun className="w-[18px] h-[18px]" /> : <Monitor className="w-[18px] h-[18px]" />}
    </IconButton>
  );
};

// ------------------------------------------------------------------ formatting
export const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

/** Local (device) calendar date YYYY-MM-DD — not UTC, so Indian mornings count as "today". */
export const localIsoDate = (d: Date = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const daysBetween = (fromIso: string, toIso: string) => {
  const a = new Date(`${fromIso}T00:00:00`).getTime();
  const b = new Date(`${toIso}T00:00:00`).getTime();
  return Math.round((b - a) / 86400000);
};

export const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
