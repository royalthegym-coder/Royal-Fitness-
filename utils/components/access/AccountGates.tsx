import React, { useEffect, useState } from 'react';
import { TotpSecret } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, MailCheck, ShieldCheck, Clock, Ban, Building2 } from 'lucide-react';
import { auth, db, signOutFirebaseUser } from '../../../lib/firebase';
import { finishTotpEnrollment, requestGymMembership, resendVerification, startTotpEnrollment } from '../../../lib/authService';
import { useSessionStore } from '../../../lib/session';

const Card: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="min-h-screen w-screen bg-[#09090B] flex items-center justify-center p-4 text-zinc-100">
    <div className="w-full max-w-md bg-[#111318] border border-white/10 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">{icon}</div>
        <h1 className="text-base font-bold">{title}</h1>
      </div>
      {children}
      <button type="button" onClick={() => void signOutFirebaseUser()} className="w-full text-xs text-zinc-400 hover:text-white pt-2">
        Sign out
      </button>
    </div>
  </div>
);

const primary = 'w-full py-2.5 rounded-lg bg-amber-500 text-zinc-950 text-sm font-semibold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2';
const field = 'w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500';

export const VerifyEmailScreen: React.FC = () => {
  const email = useSessionStore((s) => s.user?.email);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Card icon={<MailCheck className="w-5 h-5" />} title="Verify your email">
      <p className="text-sm text-zinc-300">We sent a verification link to <b>{email}</b>. Open it, then press “I've verified”.</p>
      {msg && <p className="text-xs text-emerald-300">{msg}</p>}
      <button
        type="button"
        className={primary}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await auth.currentUser?.reload();
          await auth.currentUser?.getIdToken(true);
          // Re-run AuthProvider with the refreshed user.
          window.location.reload();
        }}
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" />} I've verified
      </button>
      <button type="button" className="w-full text-xs text-amber-400" onClick={async () => { await resendVerification(); setMsg('Verification email sent again.'); }}>
        Resend email
      </button>
    </Card>
  );
};

/** Super admin TOTP enrollment (Firebase Auth with Identity Platform, works on Spark). */
export const MfaEnrollmentScreen: React.FC = () => {
  const [secret, setSecret] = useState<TotpSecret | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const start = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setBusy(true);
    setError(null);
    const r = await startTotpEnrollment(user);
    setBusy(false);
    if (r.ok && r.secret) {
      setSecret(r.secret);
      setQrUrl(r.qrUrl || '');
    } else setError(r.error || 'Could not start enrollment.');
  };

  const finish = async () => {
    const user = auth.currentUser;
    if (!user || !secret) return;
    setBusy(true);
    setError(null);
    const r = await finishTotpEnrollment(user, secret, code);
    setBusy(false);
    if (r.ok) {
      setDone(true);
      setTimeout(() => void signOutFirebaseUser(), 1500);
    } else setError(r.error || 'Invalid code.');
  };

  return (
    <Card icon={<ShieldCheck className="w-5 h-5" />} title="Set up 2-step verification">
      <p className="text-sm text-zinc-300">
        The platform owner account must use an authenticator app (Google Authenticator, Microsoft Authenticator, Authy) before the Super Admin portal opens.
      </p>
      {error && <p className="text-xs text-red-300">{error}</p>}
      {done ? (
        <p className="text-sm text-emerald-300">Enrolled. Signing you out — sign in again and enter the 6-digit code.</p>
      ) : !secret ? (
        <button type="button" className={primary} disabled={busy} onClick={start}>
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Start setup
        </button>
      ) : (
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-lg w-fit mx-auto">
            <QRCodeSVG value={qrUrl} size={180} />
          </div>
          <p className="text-[11px] text-zinc-400 break-all">
            Can't scan? Enter this key manually: <span className="font-mono text-zinc-200">{secret.secretKey}</span>
          </p>
          <input className={field} inputMode="numeric" maxLength={6} placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          <button type="button" className={primary} disabled={busy || code.length !== 6} onClick={finish}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Verify & enroll
          </button>
        </div>
      )}
    </Card>
  );
};

/** Signed-in user without a profile and without an invite: request to join a gym as a member. */
export const JoinGymScreen: React.FC = () => {
  const user = useSessionStore((s) => s.user);
  const [gyms, setGyms] = useState<Array<{ gymId: string; gymName: string; city?: string }>>([]);
  const [gymId, setGymId] = useState('');
  const [name, setName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDocs(collection(db, 'gymDirectory'))
      .then((snap) => setGyms(snap.docs.map((d) => d.data() as any).sort((a, b) => String(a.gymName).localeCompare(String(b.gymName)))))
      .catch(() => setError('Could not load gyms.'));
  }, []);

  return (
    <Card icon={<Building2 className="w-5 h-5" />} title="Join your gym">
      <p className="text-sm text-zinc-300">
        No account is linked to <b>{user?.email || user?.phoneNumber}</b> yet. If your gym invited you, sign in with the invited email. Otherwise send a join request — the gym admin approves it.
      </p>
      {error && <p className="text-xs text-red-300">{error}</p>}
      <select className={field} value={gymId} onChange={(e) => setGymId(e.target.value)} aria-label="Select gym">
        <option value="">Select your gym…</option>
        {gyms.map((g) => (
          <option key={g.gymId} value={g.gymId}>
            {g.gymName}
            {g.city ? ` — ${g.city}` : ''}
          </option>
        ))}
      </select>
      <input className={field} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className={field} placeholder="Mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <button
        type="button"
        className={primary}
        disabled={busy || !gymId || name.trim().length < 2}
        onClick={async () => {
          if (!auth.currentUser) return;
          setBusy(true);
          setError(null);
          const r = await requestGymMembership(auth.currentUser, gymId, name, phone);
          setBusy(false);
          if (!r.ok) setError(r.error || 'Request failed.');
        }}
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" />} Send join request
      </button>
    </Card>
  );
};

export const PendingScreen: React.FC = () => (
  <Card icon={<Clock className="w-5 h-5" />} title="Waiting for approval">
    <p className="text-sm text-zinc-300">Your join request was sent to the gym. You'll get access as soon as the gym admin approves it.</p>
  </Card>
);

export const DisabledScreen: React.FC = () => (
  <Card icon={<Ban className="w-5 h-5" />} title="Account disabled">
    <p className="text-sm text-zinc-300">This account has been disabled by your gym. Please contact the gym front desk.</p>
  </Card>
);
