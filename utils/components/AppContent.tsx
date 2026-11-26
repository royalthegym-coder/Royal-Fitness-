import React, { Suspense } from 'react';
import { useSessionStore } from '../../lib/session';
import { lazyWithRetry } from '../lazyWithRetry';
import ErrorBoundary from './common/ErrorBoundary';
import { useGym } from '../context/GymProvider';
import { signOutFirebaseUser } from '../../lib/firebase';

/**
 * Role-guarded router. There is NO default user:
 *   - no Firebase session            -> LoginScreen
 *   - session but account incomplete -> the matching gate (verify email / TOTP / join gym / pending)
 *   - ready                          -> exactly one portal, chosen from the verified role
 * The role comes from the ID token (super admin) or Firestore users/{uid}; Firestore rules
 * enforce the same thing server-side, so tampering with the client gains nothing.
 */
const LoginScreen = lazyWithRetry(() => import('./LoginScreen'));
const SuperAdminPortal = lazyWithRetry(() => import('./portals/SuperAdminPortal'));
const AdminPortal = lazyWithRetry(() => import('./portals/AdminPortal'));
const TrainerPortal = lazyWithRetry(() => import('./portals/TrainerPortal'));
const MemberPortal = lazyWithRetry(() => import('./portals/MemberPortal'));
const VerifyEmailScreen = lazyWithRetry(() => import('./access/AccountGates').then((m) => ({ default: m.VerifyEmailScreen })));
const MfaEnrollmentScreen = lazyWithRetry(() => import('./access/AccountGates').then((m) => ({ default: m.MfaEnrollmentScreen })));
const JoinGymScreen = lazyWithRetry(() => import('./access/AccountGates').then((m) => ({ default: m.JoinGymScreen })));
const PendingScreen = lazyWithRetry(() => import('./access/AccountGates').then((m) => ({ default: m.PendingScreen })));
const DisabledScreen = lazyWithRetry(() => import('./access/AccountGates').then((m) => ({ default: m.DisabledScreen })));

const Splash: React.FC<{ text?: string }> = ({ text = 'Loading…' }) => (
  <div className="h-[100dvh] w-full bg-canvas flex items-center justify-center text-sm text-muted" role="status">{text}</div>
);

const SuspendedScreen: React.FC<{ gymName?: string }> = ({ gymName }) => (
  <div className="h-[100dvh] w-full bg-canvas flex items-center justify-center p-4 text-fg">
    <div className="max-w-sm text-center space-y-3 bg-surface border border-line rounded-2xl p-6">
      <p className="text-base font-semibold">{gymName || 'This gym'} is paused</p>
      <p className="text-sm text-muted">The gym’s account is suspended by the platform. Please contact the gym owner.</p>
      <button type="button" onClick={() => void signOutFirebaseUser()} className="h-11 px-4 rounded-xl bg-brand text-brand-fg text-sm font-semibold">
        Sign out
      </button>
    </div>
  </div>
);

export const AppContent: React.FC = () => {
  const status = useSessionStore((s) => s.status);
  const role = useSessionStore((s) => s.role);
  const { currentGym } = useGym();

  const screen = (() => {
    switch (status) {
      case 'loading':
        return <Splash />;
      case 'signed_out':
        return <LoginScreen />;
      case 'needs_email_verification':
        return <VerifyEmailScreen />;
      case 'needs_mfa_enrollment':
        return <MfaEnrollmentScreen />;
      case 'no_profile':
        return <JoinGymScreen />;
      case 'pending':
        return <PendingScreen />;
      case 'disabled':
        return <DisabledScreen />;
      case 'ready':
        if (role !== 'super_admin' && currentGym?.status === 'suspended') return <SuspendedScreen gymName={currentGym.gymName} />;
        if (role === 'super_admin') return <SuperAdminPortal />;
        if (role === 'admin') return <AdminPortal />;
        if (role === 'trainer') return <TrainerPortal />;
        if (role === 'member') return <MemberPortal />;
        return <LoginScreen />;
      default:
        return <LoginScreen />;
    }
  })();

  return (
    <ErrorBoundary>
      <Suspense fallback={<Splash />}>{screen}</Suspense>
    </ErrorBoundary>
  );
};

export default AppContent;
