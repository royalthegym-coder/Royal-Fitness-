import React, { useState } from 'react';
import { ConfirmationResult, MultiFactorResolver } from 'firebase/auth';
import { Dumbbell, Mail, Lock, Phone, KeyRound, Loader2 } from 'lucide-react';
import { ENABLE_PHONE_AUTH } from '../../lib/config';
import {
  signInEmail,
  signInGoogle,
  signUpEmail,
  resetPassword,
  resolveTotpSignIn,
  startPhoneSignIn,
  SignInResult,
} from '../../lib/authService';
import { useSessionStore } from '../../lib/session';

/**
 * Real authentication only: Firebase email/password, Google, phone OTP (Blaze-only flag).
 * No passwords are compared in the browser, no face-scan, no localStorage sessions.
 * Role/portal is decided afterwards by AuthProvider from the ID token + Firestore.
 */
type Mode = 'signin' | 'signup' | 'reset' | 'phone' | 'mfa';

const input =
  'w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500';
const btn =
  'w-full py-2.5 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

export const LoginScreen: React.FC = () => {
  const sessionError = useSessionStore((s) => s.error);
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('+91');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resolver, setResolver] = useState<MultiFactorResolver | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  const handleResult = (r: SignInResult) => {
    if (r.ok) return;
    if ('mfaResolver' in r) {
      setResolver(r.mfaResolver);
      setMode('mfa');
      setCode('');
      return;
    }
    if ('error' in r) setError(r.error);
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const onEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      if (mode === 'signin') handleResult(await signInEmail(email, password));
      else if (mode === 'signup') {
        const r = await signUpEmail(email, password);
        if (!r.ok) setError(r.error || 'Sign up failed.');
      } else if (mode === 'reset') {
        const r = await resetPassword(email);
        if (r.ok) setInfo('Password reset email sent. Check your inbox.');
        else setError(r.error || 'Could not send reset email.');
      }
    });
  };

  const onMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolver) return;
    void run(async () => {
      const r = await resolveTotpSignIn(resolver, code);
      if (!r.ok) setError(r.error || 'Invalid code.');
    });
  };

  const onPhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      if (!confirmation) {
        const r = await startPhoneSignIn(phone.trim(), 'recaptcha-container');
        if (r.ok && r.confirmation) {
          setConfirmation(r.confirmation);
          setInfo('OTP sent. Enter the 6-digit code.');
        } else setError(r.error || 'Could not send OTP.');
      } else {
        try {
          await confirmation.confirm(code.trim());
        } catch {
          setError('That code is not correct.');
        }
      }
    });
  };

  return (
    <div className="min-h-screen w-screen bg-[#09090B] flex items-center justify-center p-4 text-zinc-100">
      <div className="w-full max-w-sm bg-[#111318] border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Fitness Future</h1>
            <p className="text-xs text-zinc-400">
              {mode === 'signup' ? 'Create your account' : mode === 'mfa' ? 'Two-step verification' : mode === 'reset' ? 'Reset password' : 'Sign in to continue'}
            </p>
          </div>
        </div>

        {(error || sessionError) && (
          <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-2.5">{error || sessionError}</div>
        )}
        {info && <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5">{info}</div>}

        {mode === 'mfa' ? (
          <form onSubmit={onMfaSubmit} className="space-y-3">
            <p className="text-xs text-zinc-400">Open your authenticator app and enter the 6-digit code for Fitness Future.</p>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input className={input} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} autoFocus />
            </div>
            <button type="submit" disabled={busy || code.length !== 6} className={`${btn} bg-amber-500 text-zinc-950`}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Verify
            </button>
            <button type="button" onClick={() => { setMode('signin'); setResolver(null); }} className="w-full text-xs text-zinc-400 hover:text-white">Back</button>
          </form>
        ) : mode === 'phone' ? (
          <form onSubmit={onPhoneSubmit} className="space-y-3">
            <div className="relative">
              <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input className={input} type="tel" placeholder="+919876543210" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={Boolean(confirmation)} />
            </div>
            {confirmation && (
              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input className={input} inputMode="numeric" maxLength={6} placeholder="OTP" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
              </div>
            )}
            <button type="submit" disabled={busy} className={`${btn} bg-amber-500 text-zinc-950`}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} {confirmation ? 'Verify OTP' : 'Send OTP'}
            </button>
            <button type="button" onClick={() => { setMode('signin'); setConfirmation(null); }} className="w-full text-xs text-zinc-400 hover:text-white">Use email instead</button>
            <div id="recaptcha-container" />
          </form>
        ) : (
          <>
            <form onSubmit={onEmailSubmit} className="space-y-3">
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input className={input} type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              {mode !== 'reset' && (
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input className={input} type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder={mode === 'signup' ? 'Password (min 8 characters)' : 'Password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === 'signup' ? 8 : 1} />
                </div>
              )}
              <button type="submit" disabled={busy} className={`${btn} bg-amber-500 text-zinc-950`}>
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
              </button>
            </form>

            {mode !== 'reset' && (
              <>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                  <div className="h-px flex-1 bg-white/10" /> or <div className="h-px flex-1 bg-white/10" />
                </div>
                <button type="button" disabled={busy} onClick={() => void run(async () => handleResult(await signInGoogle()))} className={`${btn} bg-white text-zinc-900`}>
                  Continue with Google
                </button>
                {ENABLE_PHONE_AUTH && (
                  <button type="button" disabled={busy} onClick={() => setMode('phone')} className={`${btn} bg-zinc-800 text-white border border-white/10`}>
                    <Phone className="w-4 h-4" /> Sign in with phone OTP
                  </button>
                )}
              </>
            )}

            <div className="flex justify-between text-xs text-zinc-400">
              {mode === 'signin' ? (
                <>
                  <button type="button" onClick={() => setMode('signup')} className="hover:text-white">New member? Create account</button>
                  <button type="button" onClick={() => setMode('reset')} className="hover:text-white">Forgot password?</button>
                </>
              ) : (
                <button type="button" onClick={() => setMode('signin')} className="hover:text-white">Back to sign in</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
