import { create } from 'zustand';
import { syncToFirebase } from '../../lib/firebase';

export type SocialPlatformKey = 'whatsapp' | 'instagram' | 'facebook' | 'youtube';
export type SocialProfileScope = 'gym' | 'super_admin';

export interface SocialPlatformLink {
  rawInput: string;
  url: string;
  handle: string;
  connected: boolean;
  connectedAt?: string;
}

export interface SocialVideoItem {
  id: string;
  title: string;
  url: string;
  videoId: string;
  category: string;
  addedAt: string;
}

export interface SocialProfileBundle {
  displayName: string;
  subtitle: string;
  bio: string;
  platforms: Record<SocialPlatformKey, SocialPlatformLink>;
  videos: SocialVideoItem[];
}

const STORAGE_KEY = 'fitness_future_social_profiles_v1';

/**
 * Strictly extract an 11-character YouTube Video ID from standard watch, youtu.be, shorts, or embed URLs.
 * Returns null for invalid or unsafe URLs.
 */
export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = (input || '').trim();
  if (!trimmed) return null;

  // Allow direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    const allowedHosts = ['youtube.com', 'm.youtube.com', 'youtu.be', 'youtube-nocookie.com'];
    if (!allowedHosts.includes(host)) return null;

    if (host === 'youtu.be') {
      const seg = parsed.pathname.split('/').filter(Boolean)[0];
      return seg && /^[a-zA-Z0-9_-]{11}$/.test(seg) ? seg : null;
    }

    const vParam = parsed.searchParams.get('v');
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
      return vParam;
    }

    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && ['shorts', 'embed', 'live', 'v'].includes(parts[0])) {
      const id = parts[1];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Safely normalizes any user-entered link, handle, or phone number into a verified HTTPS URL
 * for WhatsApp, Instagram, Facebook, or YouTube. Rejects javascript: or unsafe protocols.
 */
export function normalizeSocialLink(
  platform: SocialPlatformKey,
  rawInput: string
): { valid: boolean; url: string; handle: string; error?: string } {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) {
    return { valid: false, url: '', handle: '', error: 'Please paste a link or username.' };
  }

  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return { valid: false, url: '', handle: '', error: 'Invalid or unsafe link protocol.' };
  }

  if (platform === 'whatsapp') {
    // Support wa.me links, whatsapp.com links, or raw phone numbers
    if (/wa\.me|whatsapp\.com/i.test(trimmed)) {
      const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      try {
        const u = new URL(withProto);
        if (!/^(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com|whatsapp\.com)$/i.test(u.hostname.replace(/^www\./, ''))) {
          return { valid: false, url: '', handle: '', error: 'Enter a valid WhatsApp link or mobile number.' };
        }
        const digits = u.pathname.replace(/\D/g, '') || u.searchParams.get('phone')?.replace(/\D/g, '') || '';
        return {
          valid: true,
          url: u.toString(),
          handle: digits ? `+${digits}` : 'WhatsApp Group / Chat',
        };
      } catch {
        return { valid: false, url: '', handle: '', error: 'Invalid WhatsApp URL format.' };
      }
    }

    const digits = trimmed.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      return { valid: false, url: '', handle: '', error: 'Enter a valid 10-digit WhatsApp number or wa.me link.' };
    }
    const normalizedDigits = digits.length === 10 ? `91${digits}` : digits;
    return {
      valid: true,
      url: `https://wa.me/${normalizedDigits}`,
      handle: `+${normalizedDigits}`,
    };
  }

  if (platform === 'instagram') {
    if (!trimmed.includes('.') && !trimmed.includes('/')) {
      const cleanUser = trimmed.replace(/^@+/, '').replace(/[^a-zA-Z0-9._]/g, '');
      if (!cleanUser) return { valid: false, url: '', handle: '', error: 'Enter a valid Instagram username or link.' };
      return {
        valid: true,
        url: `https://instagram.com/${cleanUser}`,
        handle: `@${cleanUser}`,
      };
    }
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const u = new URL(withProto);
      const host = u.hostname.replace(/^www\./i, '').toLowerCase();
      if (host !== 'instagram.com' && host !== 'instagr.am') {
        return { valid: false, url: '', handle: '', error: 'Link must be an instagram.com profile URL or @username.' };
      }
      const seg = u.pathname.split('/').filter(Boolean)[0] || 'instagram';
      return { valid: true, url: u.toString(), handle: `@${seg.replace(/^@/, '')}` };
    } catch {
      return { valid: false, url: '', handle: '', error: 'Invalid Instagram link format.' };
    }
  }

  if (platform === 'facebook') {
    if (!trimmed.includes('.') && !trimmed.includes('/')) {
      const cleanPage = trimmed.replace(/^@+/, '').replace(/[^a-zA-Z0-9._-]/g, '');
      if (!cleanPage) return { valid: false, url: '', handle: '', error: 'Enter a valid Facebook page name or link.' };
      return {
        valid: true,
        url: `https://facebook.com/${cleanPage}`,
        handle: `fb.com/${cleanPage}`,
      };
    }
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const u = new URL(withProto);
      const host = u.hostname.replace(/^(www|m)\./i, '').toLowerCase();
      if (host !== 'facebook.com' && host !== 'fb.com' && host !== 'fb.me') {
        return { valid: false, url: '', handle: '', error: 'Link must be a facebook.com or fb.com URL.' };
      }
      const seg = u.pathname.split('/').filter(Boolean)[0] || 'page';
      return { valid: true, url: u.toString(), handle: `fb.com/${seg}` };
    } catch {
      return { valid: false, url: '', handle: '', error: 'Invalid Facebook link format.' };
    }
  }

  // YouTube
  if (!trimmed.includes('.') && !trimmed.includes('/')) {
    const cleanHandle = trimmed.replace(/^@+/, '').replace(/[^a-zA-Z0-9._-]/g, '');
    if (!cleanHandle) return { valid: false, url: '', handle: '', error: 'Enter a valid YouTube channel link or @handle.' };
    return {
      valid: true,
      url: `https://youtube.com/@${cleanHandle}`,
      handle: `@${cleanHandle}`,
    };
  }
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProto);
    const host = u.hostname.replace(/^(www|m)\./i, '').toLowerCase();
    if (host !== 'youtube.com' && host !== 'youtu.be') {
      return { valid: false, url: '', handle: '', error: 'Link must be a youtube.com or youtu.be URL.' };
    }
    const seg = u.pathname.split('/').filter(Boolean)[0] || 'YouTube';
    return { valid: true, url: u.toString(), handle: seg.startsWith('@') ? seg : `youtube.com/${seg}` };
  } catch {
    return { valid: false, url: '', handle: '', error: 'Invalid YouTube link format.' };
  }
}

const DEFAULT_PROFILES: Record<SocialProfileScope, SocialProfileBundle> = {
  gym: {
    displayName: 'Gym Official Profile',
    subtitle: 'Local Gym Branch Social Channels & Workout Videos',
    bio: 'Connect directly with our gym desk, follow daily transformation stories, and watch trainer workout tutorials.',
    platforms: {
      whatsapp: {
        rawInput: '9876543210',
        url: 'https://wa.me/919876543210',
        handle: '+919876543210',
        connected: true,
        connectedAt: new Date().toISOString().split('T')[0],
      },
      instagram: {
        rawInput: 'https://instagram.com/fitnessfuturegym',
        url: 'https://instagram.com/fitnessfuturegym',
        handle: '@fitnessfuturegym',
        connected: true,
        connectedAt: new Date().toISOString().split('T')[0],
      },
      facebook: {
        rawInput: 'https://facebook.com/fitnessfuturegym',
        url: 'https://facebook.com/fitnessfuturegym',
        handle: 'fb.com/fitnessfuturegym',
        connected: true,
        connectedAt: new Date().toISOString().split('T')[0],
      },
      youtube: {
        rawInput: 'https://youtube.com/@fitnessfuturegym',
        url: 'https://youtube.com/@fitnessfuturegym',
        handle: '@fitnessfuturegym',
        connected: true,
        connectedAt: new Date().toISOString().split('T')[0],
      },
    },
    videos: [
      {
        id: 'vid-gym-1',
        title: '20-Minute Full Body Dumbbell Workout (Beginner to Pro)',
        url: 'https://www.youtube.com/watch?v=U0bhE67HuDY',
        videoId: 'U0bhE67HuDY',
        category: 'Workout Demo',
        addedAt: new Date().toISOString().split('T')[0],
      },
      {
        id: 'vid-gym-2',
        title: 'Proper Squat & Deadlift Form Guide — Coach Breakdown',
        url: 'https://www.youtube.com/watch?v=ultWZbUMPL8',
        videoId: 'ultWZbUMPL8',
        category: 'Form & Technique',
        addedAt: new Date().toISOString().split('T')[0],
      },
    ],
  },
  super_admin: {
    displayName: 'Super Admin Official Profile',
    subtitle: 'Fitness Future Master Network — Founder Updates & Training Guides',
    bio: 'Official Super Admin channels for national fitness challenges, master nutrition seminars, and platform updates.',
    platforms: {
      whatsapp: {
        rawInput: '9829000100',
        url: 'https://wa.me/919829000100',
        handle: '+919829000100',
        connected: true,
        connectedAt: new Date().toISOString().split('T')[0],
      },
      instagram: {
        rawInput: 'https://instagram.com/fitnessfuture.official',
        url: 'https://instagram.com/fitnessfuture.official',
        handle: '@fitnessfuture.official',
        connected: true,
        connectedAt: new Date().toISOString().split('T')[0],
      },
      facebook: {
        rawInput: 'https://facebook.com/fitnessfutureofficial',
        url: 'https://facebook.com/fitnessfutureofficial',
        handle: 'fb.com/fitnessfutureofficial',
        connected: true,
        connectedAt: new Date().toISOString().split('T')[0],
      },
      youtube: {
        rawInput: 'https://youtube.com/@fitnessfutureofficial',
        url: 'https://youtube.com/@fitnessfutureofficial',
        handle: '@fitnessfutureofficial',
        connected: true,
        connectedAt: new Date().toISOString().split('T')[0],
      },
    },
    videos: [
      {
        id: 'vid-sa-1',
        title: 'Complete Mobility & Warm-Up Routine Before Lifting',
        url: 'https://www.youtube.com/watch?v=R0mMyV5OtcM',
        videoId: 'R0mMyV5OtcM',
        category: 'Master Guide',
        addedAt: new Date().toISOString().split('T')[0],
      },
      {
        id: 'vid-sa-2',
        title: 'High-Protein Indian Diet Explained for Fat Loss & Muscle',
        url: 'https://www.youtube.com/watch?v=2pLT-olgUJs',
        videoId: '2pLT-olgUJs',
        category: 'Nutrition Talk',
        addedAt: new Date().toISOString().split('T')[0],
      },
    ],
  },
};

function loadInitialProfiles(): Record<SocialProfileScope, SocialProfileBundle> {
  if (typeof window === 'undefined') return DEFAULT_PROFILES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILES;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.gym && parsed.super_admin) {
      return parsed;
    }
    return DEFAULT_PROFILES;
  } catch {
    return DEFAULT_PROFILES;
  }
}

function persistProfiles(profiles: Record<SocialProfileScope, SocialProfileBundle>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // Ignore storage quota errors
  }
  try {
    syncToFirebase('social_profiles', 'master', profiles);
  } catch {
    // Optional cloud sync
  }
}

interface SocialLinksStoreState {
  profiles: Record<SocialProfileScope, SocialProfileBundle>;
  connectPlatform: (
    scope: SocialProfileScope,
    platform: SocialPlatformKey,
    rawInput: string
  ) => { ok: boolean; error?: string };
  disconnectPlatform: (scope: SocialProfileScope, platform: SocialPlatformKey) => void;
  updateProfileMeta: (
    scope: SocialProfileScope,
    meta: Partial<Pick<SocialProfileBundle, 'displayName' | 'subtitle' | 'bio'>>
  ) => void;
  addVideo: (
    scope: SocialProfileScope,
    title: string,
    url: string,
    category?: string
  ) => { ok: boolean; error?: string };
  removeVideo: (scope: SocialProfileScope, videoId: string) => void;
}

export const useSocialLinksStore = create<SocialLinksStoreState>((set, get) => ({
  profiles: loadInitialProfiles(),

  connectPlatform: (scope, platform, rawInput) => {
    const result = normalizeSocialLink(platform, rawInput);
    if (!result.valid) {
      return { ok: false, error: result.error || 'Invalid link.' };
    }

    const current = get().profiles;
    const next: Record<SocialProfileScope, SocialProfileBundle> = {
      ...current,
      [scope]: {
        ...current[scope],
        platforms: {
          ...current[scope].platforms,
          [platform]: {
            rawInput: rawInput.trim(),
            url: result.url,
            handle: result.handle,
            connected: true,
            connectedAt: new Date().toISOString().split('T')[0],
          },
        },
      },
    };
    set({ profiles: next });
    persistProfiles(next);
    return { ok: true };
  },

  disconnectPlatform: (scope, platform) => {
    const current = get().profiles;
    const next: Record<SocialProfileScope, SocialProfileBundle> = {
      ...current,
      [scope]: {
        ...current[scope],
        platforms: {
          ...current[scope].platforms,
          [platform]: {
            rawInput: '',
            url: '',
            handle: '',
            connected: false,
          },
        },
      },
    };
    set({ profiles: next });
    persistProfiles(next);
  },

  updateProfileMeta: (scope, meta) => {
    const current = get().profiles;
    const next: Record<SocialProfileScope, SocialProfileBundle> = {
      ...current,
      [scope]: {
        ...current[scope],
        ...meta,
      },
    };
    set({ profiles: next });
    persistProfiles(next);
  },

  addVideo: (scope, title, url, category = 'Workout Video') => {
    const cleanTitle = title.trim();
    const vid = extractYouTubeVideoId(url);
    if (!cleanTitle) {
      return { ok: false, error: 'Please enter a video title.' };
    }
    if (!vid) {
      return {
        ok: false,
        error: 'Enter a valid YouTube video or Shorts link (e.g. youtube.com/watch?v=... or youtu.be/...).',
      };
    }

    const current = get().profiles;
    const newVideo: SocialVideoItem = {
      id: `vid-${Date.now()}`,
      title: cleanTitle,
      url: `https://www.youtube.com/watch?v=${vid}`,
      videoId: vid,
      category: category.trim() || 'Workout Video',
      addedAt: new Date().toISOString().split('T')[0],
    };

    const next: Record<SocialProfileScope, SocialProfileBundle> = {
      ...current,
      [scope]: {
        ...current[scope],
        videos: [newVideo, ...current[scope].videos],
      },
    };
    set({ profiles: next });
    persistProfiles(next);
    return { ok: true };
  },

  removeVideo: (scope, id) => {
    const current = get().profiles;
    const next: Record<SocialProfileScope, SocialProfileBundle> = {
      ...current,
      [scope]: {
        ...current[scope],
        videos: current[scope].videos.filter((v) => v.id !== id),
      },
    };
    set({ profiles: next });
    persistProfiles(next);
  },
}));
