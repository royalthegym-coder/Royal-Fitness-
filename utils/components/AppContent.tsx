import React, { Suspense } from 'react';
import { useSessionStore } from '../../lib/session';
import { lazyWithRetry } from '../lazyWithRetry';
import ErrorBoundary from './common/ErrorBoundary';

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
  <div className="h-screen w-screen bg-[#09090B] flex items-center justify-center text-sm text-zinc-400">{text}</div>
);

export const AppContent: React.FC = () => {
  const status = useSessionStore((s) => s.status);
  const role = useSessionStore((s) => s.role);

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
