import { create } from 'zustand';

export type AppRole = 'super_admin' | 'admin' | 'trainer' | 'member';

export type SessionStatus =
  | 'loading'
  | 'signed_out'
  | 'needs_email_verification'
  | 'needs_mfa_enrollment'
  | 'no_profile'
  | 'pending'
  | 'disabled'
  | 'ready';

export interface SessionUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
}

export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  role: Exclude<AppRole, 'super_admin'>;
  gymId: string;
  status: 'active' | 'pending' | 'disabled';
  memberId?: number | null;
  staffId?: number | null;
  createdBy?: string;
  /** Member choice: where personal data (chat, progress, photos, food log) is stored. Default firestore. */
  personalStorage?: 'drive' | 'firestore';
  /** Member choice: share a small progress summary with their trainer. */
  shareProgress?: boolean;
}

export interface SessionState {
  status: SessionStatus;
  user: SessionUser | null;
  role: AppRole | null;
  profile: UserProfile | null;
  /** gymId the UI is currently scoped to (super_admin can switch; everybody else = profile.gymId). */
  activeGymId: string | null;
  error: string | null;
  set: (patch: Partial<SessionState>) => void;
  reset: () => void;
}

const initial = {
  status: 'loading' as SessionStatus,
  user: null,
  role: null,
  profile: null,
  activeGymId: null,
  error: null,
};

/**
 * In-memory session derived ONLY from Firebase Auth + Firestore users/{uid}.
 * Never persisted to localStorage (a forged copy there would be meaningless anyway,
 * because Firestore rules evaluate the real ID token).
 */
export const useSessionStore = create<SessionState>((set) => ({
  ...initial,
  set: (patch) => set(patch),
  reset: () => set({ ...initial, status: 'signed_out' }),
}));
