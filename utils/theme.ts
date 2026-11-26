import { create } from 'zustand';

export type ThemePref = 'dark' | 'light' | 'system';
const KEY = 'ff_theme';

const systemLight = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches;

export function applyTheme(pref: ThemePref) {
  const light = pref === 'light' || (pref === 'system' && systemLight());
  const el = document.documentElement;
  el.classList.toggle('light', !!light);
  el.classList.toggle('dark', !light);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#f6f7f9' : '#09090b');
}

const readPref = (): ThemePref => {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'system' ? v : 'dark';
  } catch {
    return 'dark';
  }
};

interface ThemeState {
  pref: ThemePref;
  setPref: (p: ThemePref) => void;
  /** dark -> light -> system -> dark */
  cycle: () => void;
}

export const useTheme = create<ThemeState>((set, get) => ({
  pref: readPref(),
  setPref: (pref) => {
    try {
      localStorage.setItem(KEY, pref);
    } catch {
      /* storage unavailable */
    }
    applyTheme(pref);
    set({ pref });
  },
  cycle: () => {
    const order: ThemePref[] = ['dark', 'light', 'system'];
    get().setPref(order[(order.indexOf(get().pref) + 1) % order.length]);
  },
}));

if (typeof window !== 'undefined') {
  applyTheme(readPref());
  window.matchMedia?.('(prefers-color-scheme: light)').addEventListener?.('change', () => {
    if (useTheme.getState().pref === 'system') applyTheme('system');
  });
}
