import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { persistFirestoreDocument } from '../../src/backend/FitnessFutureService';

export type AppLanguage = 'en' | 'hi';

export type AutomationChannel =
  | 'WHATSAPP'
  | 'GOOGLE_BUSINESS'
  | 'AUTO_OPERATOR'
  | 'SMART_BILLING'
  | 'ATTENDANCE'
  | 'ADMISSION';

export type AutomationDeliveryStatus = 'AUTO_SENT' | 'OVERRIDDEN' | 'PAUSED' | 'FAILED';

export interface SmartAISettings {
  language: AppLanguage;
  autoOperatorEnabled: boolean;
  autoBillingEnabled: boolean;
  churnRecoveryDays: number;
  leadAutoFollowUp: boolean;
  whatsappAutoSend: boolean;
  googleBusinessAutoReply: boolean;
  replyTone: 'Executive Luxury' | 'Friendly Bilingual' | 'Strict Clinical';
  replyLanguage: 'en' | 'hi' | 'bilingual';
  quietHoursStart: string;
  quietHoursEnd: string;
  gstRatePercent: number;
  updatedAt: string;
}

export interface AutomationOverrideLog {
  id: string;
  timestamp: string;
  channel: AutomationChannel;
  target: string;
  summary: string;
  messageBody: string;
  status: AutomationDeliveryStatus;
  providerStatus?: string;
  overrideBy?: string;
  overriddenAt?: string;
}

interface AutomationStoreState {
  language: AppLanguage;
  settings: SmartAISettings;
  logs: AutomationOverrideLog[];
  pausedChannels: Record<AutomationChannel, boolean>;
  isHydrated: boolean;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  updateSettings: (patch: Partial<SmartAISettings>) => Promise<void>;
  toggleChannelPause: (channel: AutomationChannel) => void;
  addLog: (entry: Omit<AutomationOverrideLog, 'id' | 'timestamp'>) => Promise<AutomationOverrideLog>;
  pauseLog: (id: string, actor?: string) => Promise<void>;
  overrideLogMessage: (
    id: string,
    newBody: string,
    actor?: string,
    newStatus?: AutomationDeliveryStatus
  ) => Promise<void>;
  hydrateFromCloud: () => Promise<void>;
}

const SETTINGS_STORAGE_KEY = 'ff_smart_ai_settings_v1';
const LOGS_STORAGE_KEY = 'ff_automation_override_logs_v1';

const DEFAULT_SETTINGS: SmartAISettings = {
  language: 'en',
  autoOperatorEnabled: true,
  autoBillingEnabled: true,
  churnRecoveryDays: 4,
  leadAutoFollowUp: true,
  whatsappAutoSend: true,
  googleBusinessAutoReply: true,
  replyTone: 'Executive Luxury',
  replyLanguage: 'bilingual',
  quietHoursStart: '22:00',
  quietHoursEnd: '06:00',
  gstRatePercent: 18,
  updatedAt: new Date().toISOString(),
};

function loadInitialSettings(): SmartAISettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_SETTINGS;
}

function loadInitialLogs(): AutomationOverrideLog[] {
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(0, 100);
    }
  } catch {
    // ignore storage errors
  }
  return [];
}

function persistLocal(settings: SmartAISettings, logs: AutomationOverrideLog[]) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch {
    // ignore quota errors
  }
}

const initialSettings = loadInitialSettings();
const initialLogs = loadInitialLogs();

export const useAutomationStore = create<AutomationStoreState>((set, get) => ({
  language: initialSettings.language || 'en',
  settings: initialSettings,
  logs: initialLogs,
  pausedChannels: {
    WHATSAPP: false,
    GOOGLE_BUSINESS: false,
    AUTO_OPERATOR: false,
    SMART_BILLING: false,
    ATTENDANCE: false,
    ADMISSION: false,
  },
  isHydrated: false,

  setLanguage: (lang) => {
    const updated: SmartAISettings = {
      ...get().settings,
      language: lang,
      updatedAt: new Date().toISOString(),
    };
    set({ language: lang, settings: updated });
    persistLocal(updated, get().logs);
    void persistFirestoreDocument('system_governance', 'ai_settings', { ...updated } as Record<string, unknown>);
  },

  toggleLanguage: () => {
    const next: AppLanguage = get().language === 'en' ? 'hi' : 'en';
    get().setLanguage(next);
  },

  updateSettings: async (patch) => {
    const updated: SmartAISettings = {
      ...get().settings,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    set({
      language: updated.language,
      settings: updated,
    });
    persistLocal(updated, get().logs);
    await persistFirestoreDocument('system_governance', 'ai_settings', { ...updated } as Record<string, unknown>);
  },

  toggleChannelPause: (channel) => {
    const current = get().pausedChannels;
    const nextPaused = !current[channel];
    set({
      pausedChannels: {
        ...current,
        [channel]: nextPaused,
      },
    });
  },

  addLog: async (entry) => {
    const record: AutomationOverrideLog = {
      ...entry,
      id: `LOG_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    const nextLogs = [record, ...get().logs].slice(0, 100);
    set({ logs: nextLogs });
    persistLocal(get().settings, nextLogs);
    await persistFirestoreDocument('automation_logs', record.id, { ...record } as Record<string, unknown>);
    return record;
  },

  pauseLog: async (id, actor = 'Admin Staff') => {
    const now = new Date().toISOString();
    const nextLogs = get().logs.map((item) =>
      item.id === id
        ? { ...item, status: 'PAUSED' as AutomationDeliveryStatus, overrideBy: actor, overriddenAt: now }
        : item
    );
    set({ logs: nextLogs });
    persistLocal(get().settings, nextLogs);
    const target = nextLogs.find((item) => item.id === id);
    if (target) {
      await persistFirestoreDocument('automation_logs', target.id, { ...target } as Record<string, unknown>);
    }
  },

  overrideLogMessage: async (id, newBody, actor = 'Admin Staff', newStatus = 'OVERRIDDEN') => {
    const now = new Date().toISOString();
    const nextLogs = get().logs.map((item) =>
      item.id === id
        ? {
            ...item,
            messageBody: newBody,
            status: newStatus,
            overrideBy: actor,
            overriddenAt: now,
          }
        : item
    );
    set({ logs: nextLogs });
    persistLocal(get().settings, nextLogs);
    const target = nextLogs.find((item) => item.id === id);
    if (target) {
      await persistFirestoreDocument('automation_logs', target.id, { ...target } as Record<string, unknown>);
    }
  },

  hydrateFromCloud: async () => {
    if (get().isHydrated) return;
    try {
      const snap = await getDoc(doc(db, 'system_governance', 'ai_settings'));
      if (snap.exists()) {
        const cloudSettings = { ...DEFAULT_SETTINGS, ...(snap.data() as Partial<SmartAISettings>) };
        set({
          language: cloudSettings.language,
          settings: cloudSettings,
          isHydrated: true,
        });
        persistLocal(cloudSettings, get().logs);
        return;
      }
    } catch {
      // Offline or unauthenticated visitors fall back safely to local settings
    }
    set({ isHydrated: true });
  },
}));

/**
 * Lightweight bilingual selector helper for Hindi / English UI surfaces.
 */
export function bi(lang: AppLanguage, en: string, hi: string): string {
  return lang === 'hi' ? hi : en;
}
