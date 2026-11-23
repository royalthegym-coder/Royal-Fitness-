import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  getMultiFactorResolver,
  MultiFactorResolver,
  multiFactor,
  TotpMultiFactorGenerator,
  TotpSecret,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { auth, db, signInWithGoogle, signOutFirebaseUser } from './firebase';
import { isSuperAdminEmail } from './config';

export { signInWithGoogle, signOutFirebaseUser };

export type SignInResult = { ok: true } | { ok: false; mfaResolver: MultiFactorResolver } | { ok: false; error: string };

function friendly(err: any): string {
  const code: string = err?.code || '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/user-not-found': 'No account with this email.',
    'auth/email-already-in-use': 'An account already exists with this email. Sign in instead.',
    'auth/weak-password': 'Password must be at least 8 characters.',
    'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
    'auth/popup-closed-by-user': 'Google sign-in was closed.',
    'auth/invalid-verification-code': 'That code is not correct.',
    'auth/requires-recent-login': 'For security, sign out and sign in again, then retry.',
    'auth/billing-not-enabled': 'Phone sign-in needs the Firebase Blaze plan. Use email or Google.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase console.',
  };
  return map[code] || err?.message || 'Something went wrong.';
}

async function withMfa(fn: () => Promise<unknown>): Promise<SignInResult> {
  try {
    await fn();
    return { ok: true };
  } catch (err: any) {
    if (err?.code === 'auth/multi-factor-auth-required') {
      return { ok: false, mfaResolver: getMultiFactorResolver(auth, err) };
    }
    return { ok: false, error: friendly(err) };
  }
}

export const signInEmail = (email: string, password: string) =>
  withMfa(() => signInWithEmailAndPassword(auth, email.trim(), password));

export const signInGoogle = () => withMfa(() => signInWithGoogle());

export async function signUpEmail(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' };
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await sendEmailVerification(cred.user);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendly(err) };
  }
}

export async function resendVerification(): Promise<void> {
  if (auth.currentUser) await sendEmailVerification(auth.currentUser);
}

export async function resetPassword(email: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendly(err) };
  }
}

// ---------------- Phone OTP (Blaze only; behind ENABLE_PHONE_AUTH) ----------------
let recaptcha: RecaptchaVerifier | null = null;
export async function startPhoneSignIn(phoneE164: string, containerId: string): Promise<{ ok: boolean; confirmation?: ConfirmationResult; error?: string }> {
  try {
    if (!recaptcha) recaptcha = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
    const confirmation = await signInWithPhoneNumber(auth, phoneE164, recaptcha);
    return { ok: true, confirmation };
  } catch (err) {
    return { ok: false, error: friendly(err) };
  }
}

// ---------------- TOTP second factor (super admin) ----------------
export function hasTotpEnrolled(user: User): boolean {
  return multiFactor(user).enrolledFactors.some((f) => f.factorId === TotpMultiFactorGenerator.FACTOR_ID);
}

export async function signedInWithTotp(user: User): Promise<boolean> {
  const t = await user.getIdTokenResult();
  return t.signInSecondFactor === TotpMultiFactorGenerator.FACTOR_ID;
}

export async function startTotpEnrollment(user: User): Promise<{ ok: boolean; secret?: TotpSecret; qrUrl?: string; error?: string }> {
  try {
    const session = await multiFactor(user).getSession();
    const secret = await TotpMultiFactorGenerator.generateSecret(session);
    const qrUrl = secret.generateQrCodeUrl(user.email || 'owner', 'Fitness Future');
    return { ok: true, secret, qrUrl };
  } catch (err) {
    return { ok: false, error: friendly(err) };
  }
}

export async function finishTotpEnrollment(user: User, secret: TotpSecret, code: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, code.trim());
    await multiFactor(user).enroll(assertion, 'Authenticator app');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendly(err) };
  }
}

export async function resolveTotpSignIn(resolver: MultiFactorResolver, code: string): Promise<{ ok: boolean; error?: string }> {
  const hint = resolver.hints.find((h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID);
  if (!hint) return { ok: false, error: 'No authenticator app is enrolled on this account.' };
  try {
    const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code.trim());
    await resolver.resolveSignIn(assertion);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendly(err) };
  }
}

// ---------------- Profiles: invites + self-signup ----------------

/**
 * If an invite exists for this (verified) email, create users/{uid} from it.
 * Firestore rules re-check that role/gymId/memberId exactly match the invite.
 */
export async function claimInviteIfAny(user: User): Promise<boolean> {
  const email = (user.email || '').trim().toLowerCase();
  if (!email || !user.emailVerified || isSuperAdminEmail(email)) return false;
  try {
    const inviteSnap = await getDoc(doc(db, 'invites', email));
    if (!inviteSnap.exists()) return false;
    const invite = inviteSnap.data();
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email,
      displayName: user.displayName || invite.displayName || email.split('@')[0],
      role: invite.role,
      gymId: invite.gymId,
      status: 'active',
      memberId: invite.memberId ?? null,
      staffId: invite.staffId ?? null,
      createdBy: invite.createdBy,
      createdAt: serverTimestamp(),
    });
    await deleteDoc(doc(db, 'invites', email)).catch(() => undefined);
    return true;
  } catch (err) {
    console.warn('[auth] invite claim failed', err);
    return false;
  }
}

/** Self-signup as a member of an existing gym. Lands as status "pending" until a gym admin approves. */
export async function requestGymMembership(user: User, gymId: string, displayName: string, phone: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: (user.email || '').toLowerCase() || null,
      displayName: displayName.trim().slice(0, 80),
      role: 'member',
      gymId,
      status: 'pending',
      memberId: null,
      staffId: null,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'joinRequests', user.uid), {
      uid: user.uid,
      gymId,
      email: (user.email || '').toLowerCase() || null,
      phone: phone.replace(/[^\d+]/g, '').slice(0, 16),
      displayName: displayName.trim().slice(0, 80),
      createdAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendly(err) };
  }
}
