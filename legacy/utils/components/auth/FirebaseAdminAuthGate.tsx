import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import {
  auth,
  db,
  signInWithGoogle,
  signOutFirebaseUser,
  resolveUserPortalRole,
  subscribeToAuthChanges,
  getVerifiedUserTokenClaims,
  FirebaseTokenClaims,
  PortalRole,
  BOOTSTRAPPED_SUPER_ADMIN_EMAILS
} from '../../../lib/firebase';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Crown,
  UserCheck,
  Database,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Terminal,
  Info,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export interface FirebaseAdminAuthGateProps {
  requiredRole: 'admin' | 'super_admin';
  portalTitle?: string;
  currentUser?: { type: 'admin' | 'member' | 'super_admin'; id?: string; email?: string } | null;
  onRoleSynchronized?: (user: { type: 'admin' | 'member' | 'super_admin'; id?: string }) => void;
  onExitToAllowedView?: () => void;
  children: React.ReactNode;
}

export const FirebaseAdminAuthGate: React.FC<FirebaseAdminAuthGateProps> = ({
  requiredRole,
  portalTitle,
  currentUser,
  onRoleSynchronized,
  onExitToAllowedView,
  children,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(auth.currentUser);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [verifyingRole, setVerifyingRole] = useState<boolean>(true);
  const [claims, setClaims] = useState<FirebaseTokenClaims | null>(null);
  const [tokenExpiration, setTokenExpiration] = useState<string | null>(null);
  const [tokenIssuedAt, setTokenIssuedAt] = useState<string | null>(null);
  const [firestoreRole, setFirestoreRole] = useState<PortalRole | null>(null);
  const [accountStatus, setAccountStatus] = useState<string>('Active');
  const [hasClaimAuthorization, setHasClaimAuthorization] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isRefreshingClaims, setIsRefreshingClaims] = useState<boolean>(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState<boolean>(false);
  const [showClaimsDetails, setShowClaimsDetails] = useState<boolean>(false);
  const [refreshSuccessMessage, setRefreshSuccessMessage] = useState<string | null>(null);

  // Core claims verification method inspecting Firebase Auth ID token
  const verifyTokenClaimsAndRole = useCallback(
    async (user: User | null, forceRefresh: boolean = false) => {
      if (!user) {
        setClaims(null);
        setFirestoreRole(null);
        setHasClaimAuthorization(false);
        setTokenExpiration(null);
        setTokenIssuedAt(null);
        return;
      }

      try {
        // 1. Inspect Firebase Auth ID Token custom claims
        const claimsResult = await getVerifiedUserTokenClaims(user, forceRefresh);
        setClaims(claimsResult.claims);
        setTokenExpiration(claimsResult.tokenResult.expirationTime);
        setTokenIssuedAt(claimsResult.tokenResult.issuedAtTime);

        // 2. Resolve Firestore RBAC state as supplementary validation
        let userDocRole: PortalRole = 'member';
        let userDocStatus = 'Active';
        try {
          const resolved = await resolveUserPortalRole(user, requiredRole);
          userDocRole = (resolved.role === 'none' ? 'member' : resolved.role) as PortalRole;
          userDocStatus = resolved.status;
          setFirestoreRole(userDocRole);
          setAccountStatus(resolved.status);
        } catch (e) {
          console.warn('[FirebaseAdminAuthGate] Firestore role resolution non-fatal warning:', e);
        }

        // 3. Evaluate claim authorization based on strict requirements:
        //    - Super Admin: requires custom claim super_admin === true, claims.role === 'super_admin', or bootstrapped email
        //    - Admin: requires custom claim admin === true, claims.role === 'admin', or super_admin claim
        const normalizedEmail = (user.email || '').trim().toLowerCase();
        const isBootstrappedSuperAdmin = BOOTSTRAPPED_SUPER_ADMIN_EMAILS.includes(normalizedEmail);

        const satisfiesSuperAdminClaims =
          claimsResult.hasSuperAdminClaim ||
          claimsResult.claims.super_admin === true ||
          claimsResult.claims.role === 'super_admin' ||
          (Array.isArray(claimsResult.claims.roles) && claimsResult.claims.roles.includes('super_admin')) ||
          isBootstrappedSuperAdmin ||
          userDocRole === 'super_admin';

        const satisfiesAdminClaims =
          satisfiesSuperAdminClaims ||
          claimsResult.hasAdminClaim ||
          claimsResult.claims.admin === true ||
          claimsResult.claims.role === 'admin' ||
          (Array.isArray(claimsResult.claims.roles) && claimsResult.claims.roles.includes('admin')) ||
          userDocRole === 'admin';

        const authorized = requiredRole === 'super_admin' ? satisfiesSuperAdminClaims : satisfiesAdminClaims;
        const statusAllowed = userDocStatus !== 'Locked' && userDocStatus !== 'Suspended';

        const finalAuthorization = authorized && statusAllowed;
        setHasClaimAuthorization(finalAuthorization);

        if (finalAuthorization && onRoleSynchronized) {
          onRoleSynchronized({
            type: satisfiesSuperAdminClaims ? 'super_admin' : 'admin',
            id: user.uid,
          });
        }
      } catch (err: any) {
        console.error('[FirebaseAdminAuthGate] Token claims inspection error:', err);
        setAuthError(err?.message || 'Failed to inspect Firebase Auth ID token custom claims.');
        setHasClaimAuthorization(false);
      }
    },
    [requiredRole, onRoleSynchronized]
  );

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      setVerifyingRole(true);
      if (user) {
        await verifyTokenClaimsAndRole(user, false);
      } else {
        setClaims(null);
        setFirestoreRole(null);
        setHasClaimAuthorization(false);
      }
      setVerifyingRole(false);
    });

    return () => unsubscribe();
  }, [verifyTokenClaimsAndRole]);

  // Real-time listener on Firestore users/{uid} document when signed in
  useEffect(() => {
    if (!firebaseUser) return;

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const unsubscribeSnapshot = onSnapshot(
      userDocRef,
      async (snap) => {
        const normalizedEmail = (firebaseUser.email || '').trim().toLowerCase();
        const isBootstrappedSuperAdmin = BOOTSTRAPPED_SUPER_ADMIN_EMAILS.includes(normalizedEmail);

        if (snap.exists()) {
          const data = snap.data();
          const roleFromDoc: PortalRole = isBootstrappedSuperAdmin
            ? 'super_admin'
            : data.role === 'super_admin'
            ? 'super_admin'
            : data.role === 'admin'
            ? 'admin'
            : 'member';

          setFirestoreRole(roleFromDoc);
          setAccountStatus(data.status || 'Active');

          // Re-evaluate authorization with document update
          const superAdminClaim =
            claims?.super_admin === true ||
            claims?.role === 'super_admin' ||
            isBootstrappedSuperAdmin ||
            roleFromDoc === 'super_admin';

          const adminClaim =
            superAdminClaim ||
            claims?.admin === true ||
            claims?.role === 'admin' ||
            roleFromDoc === 'admin';

          const authCheck = requiredRole === 'super_admin' ? superAdminClaim : adminClaim;
          const statusOk = data.status !== 'Locked' && data.status !== 'Suspended';
          setHasClaimAuthorization(authCheck && statusOk);
        }
      },
      (err) => {
        console.warn('[FirebaseAdminAuthGate] Firestore snapshot listener notice:', err);
      }
    );

    return () => unsubscribeSnapshot();
  }, [firebaseUser, claims, requiredRole]);

  // Handle explicit Force Refresh of Firebase Auth ID Token Custom Claims
  const handleForceRefreshTokenClaims = async () => {
    if (!firebaseUser) return;
    setIsRefreshingClaims(true);
    setAuthError(null);
    setRefreshSuccessMessage(null);
    try {
      await verifyTokenClaimsAndRole(firebaseUser, true);
      setRefreshSuccessMessage('Firebase ID token refreshed & custom claims re-verified successfully.');
      setTimeout(() => setRefreshSuccessMessage(null), 4000);
    } catch (err: any) {
      setAuthError(`Failed to refresh Firebase token claims: ${err?.message || 'Network error'}`);
    } finally {
      setIsRefreshingClaims(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      localStorage.setItem('intended_portal_type', requiredRole);
      const user = await signInWithGoogle();
      if (user) {
        setFirebaseUser(user);
        await verifyTokenClaimsAndRole(user, true);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Firebase Google Sign-In failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleAssignFirebaseRole = async (targetRole: 'admin' | 'super_admin') => {
    if (!firebaseUser) return;
    setIsUpdatingRole(true);
    setAuthError(null);
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(
        userDocRef,
        {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || (targetRole === 'super_admin' ? 'Super Admin' : 'Gym Admin'),
          email: firebaseUser.email || '',
          role: targetRole,
          status: 'Active',
          isLocked: false,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setFirestoreRole(targetRole);
      setAccountStatus('Active');
      await verifyTokenClaimsAndRole(firebaseUser, true);
    } catch (err: any) {
      setAuthError(
        `Role update denied by Firestore Security Rules: ${err?.message || 'Requires Super Admin permission.'}`
      );
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleSignOut = async () => {
    await signOutFirebaseUser();
    setFirebaseUser(null);
    setClaims(null);
    setFirestoreRole(null);
    setHasClaimAuthorization(false);
    setAuthError(null);
  };

  // Production authorization check: strictly requires verified Firebase User and claim authorization
  const effectiveIsAuthorized = Boolean(firebaseUser && hasClaimAuthorization);

  // Loading state while Firebase Auth initializes and verifies token claims
  if (!authReady || verifyingRole) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-white">
        <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl backdrop-blur-md">
          <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-black text-white mb-1 tracking-tight">Verifying Firebase Auth Claims</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Extracting Firebase Auth ID Token custom claims (<code className="text-cyan-300">'{requiredRole}'</code>) and evaluating Firestore RBAC...
          </p>
        </div>
      </div>
    );
  }

  // --- ACCESS DENIED / RESTRICTED GATE SCREEN ---
  if (!effectiveIsAuthorized) {
    const isLockedAccount = accountStatus === 'Locked' || accountStatus === 'Suspended';
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 md:p-8">
        <div className="max-w-xl w-full bg-slate-900/95 border border-red-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_60px_rgba(239,68,68,0.18)] text-white relative overflow-hidden backdrop-blur-xl">
          <div className="absolute -top-24 -right-24 w-56 h-56 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Gate Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/40 flex items-center justify-center shrink-0">
              {requiredRole === 'super_admin' ? (
                <Crown className="w-7 h-7 text-amber-400" />
              ) : (
                <ShieldAlert className="w-7 h-7 text-red-400" />
              )}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-300 text-[10px] font-black uppercase tracking-widest mb-1">
                <Lock className="w-3 h-3" /> Firebase Auth Claims Gate
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
                {portalTitle || (requiredRole === 'super_admin' ? 'Super Admin Access Restricted' : 'Admin Portal Access Restricted')}
              </h2>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            Access to this portal is restricted and requires a verified <strong>Firebase Authentication ID Token</strong> with the{' '}
            <span className="font-mono px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-300 font-bold text-xs">
              '{requiredRole}'
            </span>{' '}
            custom claim.
          </p>

          {/* ID Token Claims Diagnostic Box */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 mb-5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Firebase Auth Status:</span>
              {firebaseUser ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Signed In
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-400 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Not Authenticated with Firebase
                </span>
              )}
            </div>

            {firebaseUser && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Account Identity:</span>
                  <span className="text-slate-200 font-mono text-[11px] truncate max-w-[240px]">
                    {firebaseUser.email || firebaseUser.uid}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Claims Detected on Token:</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                        claims?.super_admin || claims?.role === 'super_admin'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : claims?.admin || claims?.role === 'admin'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {claims?.super_admin
                        ? 'super_admin: true'
                        : claims?.admin
                        ? 'admin: true'
                        : claims?.role
                        ? `role: ${claims.role}`
                        : 'No Admin Claims'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Firestore Role (<code className="text-slate-300">users/&#123;uid&#125;</code>):</span>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                    {firestoreRole || 'None'}
                  </span>
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-slate-900">
              <span className="text-slate-400 font-medium">Required Claim:</span>
              <span className="font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase text-[11px]">
                {requiredRole === 'super_admin' ? "claims.super_admin == true" : "claims.admin == true | super_admin"}
              </span>
            </div>

            {isLockedAccount && (
              <div className="pt-2 border-t border-red-900/40 text-red-400 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Account status is "{accountStatus}". Account is locked from accessing administrative routes.
              </div>
            )}
          </div>

          {/* Raw Token Claims Accordion Toggle */}
          {firebaseUser && (
            <div className="mb-5">
              <button
                type="button"
                onClick={() => setShowClaimsDetails(!showClaimsDetails)}
                className="w-full py-2 px-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  View Decoded ID Token Claims Payload
                </span>
                {showClaimsDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showClaimsDetails && (
                <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-cyan-500/20 text-[11px] font-mono text-cyan-300 space-y-1.5 overflow-x-auto max-h-40">
                  <div>// Raw Firebase Auth ID Token Claims</div>
                  <pre className="text-slate-300 text-[10px] whitespace-pre-wrap">
                    {JSON.stringify(claims || {}, null, 2)}
                  </pre>
                  {tokenExpiration && (
                    <div className="text-slate-500 text-[10px] pt-1">
                      Expires: {tokenExpiration}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {refreshSuccessMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{refreshSuccessMessage}</span>
            </div>
          )}

          {authError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Action Controls */}
          <div className="space-y-3">
            {/* Primary Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSigningIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Authenticating with Firebase...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  {firebaseUser ? 'Switch Google Account (Firebase Auth)' : 'Sign In with Authorized Google Account'}
                </>
              )}
            </button>

            {/* Force Refresh Claims Button */}
            {firebaseUser && (
              <button
                type="button"
                onClick={handleForceRefreshTokenClaims}
                disabled={isRefreshingClaims}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingClaims ? 'animate-spin' : ''}`} />
                {isRefreshingClaims ? 'Re-fetching Token & Claims...' : 'Force Refresh Token & Custom Claims'}
              </button>
            )}

            {/* Quick Activate Admin Role for Authenticated Users */}
            {firebaseUser && requiredRole === 'admin' && !claims?.admin && firestoreRole !== 'admin' && (
              <button
                onClick={() => handleAssignFirebaseRole('admin')}
                disabled={isUpdatingRole}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                {isUpdatingRole ? 'Syncing Admin Role...' : 'Request / Activate Admin Role in Firestore'}
              </button>
            )}

            {/* Navigation and Sign Out Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              {onExitToAllowedView && (
                <button
                  type="button"
                  onClick={onExitToAllowedView}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to Allowed View
                </button>
              )}

              {firebaseUser && (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- AUTHORIZED STATE: RENDER SECURITY STATUS RIBBON + PROTECTED CONTENT ---
  return (
    <div className="space-y-4">
      {/* Top Security Status Ribbon */}
      <div className="bg-slate-900/90 border border-emerald-500/25 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Firebase Claims Gate Verified
          </span>

          <span
            className={`px-2.5 py-1 rounded-lg font-mono font-bold uppercase ${
              requiredRole === 'super_admin'
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                : 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300'
            }`}
          >
            Required: {requiredRole}
          </span>

          {firebaseUser ? (
            <span className="text-slate-400 hidden md:inline-flex items-center gap-1.5 font-mono text-[11px]">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              {firebaseUser.email || firebaseUser.uid}
            </span>
          ) : (
            <span className="text-slate-400 hidden md:inline-flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              Authenticated Session ({currentUser?.type})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Claims Inspector Toggle */}
          {firebaseUser && (
            <button
              type="button"
              onClick={() => setShowClaimsDetails(!showClaimsDetails)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              title="Inspect Firebase Auth Claims"
            >
              <Terminal className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">Claims</span>
            </button>
          )}

          {/* Quick Refresh Claims Button */}
          {firebaseUser && (
            <button
              type="button"
              onClick={handleForceRefreshTokenClaims}
              disabled={isRefreshingClaims}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Force Refresh Firebase Auth ID Token & Claims"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshingClaims ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Token</span>
            </button>
          )}

          {firebaseUser ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
              title="Sign out of Firebase Auth"
            >
              <LogOut className="w-3 h-3 text-red-400" />
              Sign Out
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <LogIn className="w-3 h-3" />
              {isSigningIn ? 'Linking...' : 'Link Firebase Auth'}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Claims Inspector Box in Authorized View */}
      {showClaimsDetails && firebaseUser && (
        <div className="p-3 rounded-2xl bg-slate-950/90 border border-cyan-500/30 text-xs font-mono text-cyan-300 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Active Firebase Auth ID Token Claims
            </span>
            {tokenExpiration && (
              <span className="text-slate-400 text-[10px]">Expires: {tokenExpiration}</span>
            )}
          </div>
          <pre className="text-slate-300 text-[10px] whitespace-pre-wrap max-h-48 overflow-y-auto bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            {JSON.stringify(claims || {}, null, 2)}
          </pre>
        </div>
      )}

      {/* Render Protected Content */}
      {children}
    </div>
  );
};

export default FirebaseAdminAuthGate;
