import React, { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { SUPER_ADMIN_REQUIRES_MFA, isSuperAdminEmail } from '../../lib/config';
import { useSessionStore, UserProfile } from '../../lib/session';
import { claimInviteIfAny, hasTotpEnrolled, signedInWithTotp } from '../../lib/authService';

/**
 * The ONLY place a session is established:
 *   Firebase Auth onAuthStateChanged  ->  role from verified token (super admin) or Firestore users/{uid}.
 * Nothing is read from localStorage.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const setSession = useSessionStore((s) => s.set);
  const resetSession = useSessionStore((s) => s.reset);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      unsubProfile?.();
      unsubProfile = null;

      if (!user) {
        resetSession();
        return;
      }

      const sessionUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        phoneNumber: user.phoneNumber,
      };
      setSession({ status: 'loading', user: sessionUser, error: null });

      // Email/password accounts must verify their email (Google & phone are verified by the provider).
      const usesPassword = user.providerData.some((p) => p.providerId === 'password');
      if (usesPassword && !user.emailVerified) {
        setSession({ status: 'needs_email_verification', role: null, profile: null, activeGymId: null });
        return;
      }

      // ---- Super admin: token-based, email verified, TOTP second factor ----
      if (isSuperAdminEmail(user.email)) {
        if (SUPER_ADMIN_REQUIRES_MFA) {
          if (!hasTotpEnrolled(user)) {
            setSession({ status: 'needs_mfa_enrollment', role: 'super_admin', profile: null, activeGymId: null });
            return;
          }
          if (!(await signedInWithTotp(user))) {
            // Enrolled but this session was not completed with TOTP (e.g. right after enrolling): force re-login.
            await auth.signOut();
            setSession({ status: 'signed_out', error: 'Please sign in again and enter your authenticator code.' });
            return;
          }
        }
        setSession({ status: 'ready', role: 'super_admin', profile: null, activeGymId: null });
        return;
      }

      // ---- Everyone else: users/{uid} in Firestore ----
      let triedInvite = false;
      unsubProfile = onSnapshot(
        doc(db, 'users', user.uid),
        async (snap) => {
          if (!snap.exists()) {
            if (!triedInvite) {
              triedInvite = true;
              const claimed = await claimInviteIfAny(user);
              if (claimed) return; // snapshot fires again with the new profile
            }
            setSession({ status: 'no_profile', role: null, profile: null, activeGymId: null });
            return;
          }
          const profile = snap.data() as UserProfile;
          const status = profile.status === 'active' ? 'ready' : profile.status === 'disabled' ? 'disabled' : 'pending';
          setSession({ status, role: profile.role, profile, activeGymId: profile.gymId });
        },
        (err) => {
          console.warn('[auth] profile listener error', err);
          setSession({ status: 'no_profile', role: null, profile: null, activeGymId: null, error: err.message });
        }
      );
    });

    return () => {
      unsubProfile?.();
      unsubAuth();
    };
  }, [setSession, resetSession]);

  return <>{children}</>;
};

export default AuthProvider;
