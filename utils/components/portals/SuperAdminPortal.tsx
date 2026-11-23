import React, { Suspense, useEffect, useState } from 'react';
import { collection, doc, onSnapshot, serverTimestamp, writeBatch, deleteDoc } from 'firebase/firestore';
import { Building2, LogOut, Plus, ShieldCheck, ArrowLeft, Trash2 } from 'lucide-react';
import { db, signOutFirebaseUser } from '../../../lib/firebase';
import { useSessionStore } from '../../../lib/session';
import { useGym } from '../../context/GymProvider';
import { useToast } from '../../hooks/useToast';
import { lazyWithRetry } from '../../lazyWithRetry';

const AdminPortal = lazyWithRetry(() => import('./AdminPortal'));

const box = 'bg-[#111318] border border-white/10 rounded-xl p-4 space-y-3';
const field = 'bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white';
const btn = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50';

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'gym';

/**
 * Platform owner portal (royalthegym@gmail.com + TOTP only; firestore.rules re-check both).
 * Creates gyms and invites each gym's owner (admin). Can open any gym's admin portal.
 */
export const SuperAdminPortal: React.FC = () => {
  const activeGymId = useSessionStore((s) => s.activeGymId);
  const setSession = useSessionStore((s) => s.set);
  const email = useSessionStore((s) => s.user?.email);
  const { availableGyms, currentGym } = useGym();
  const { addToast } = useToast();
  const [form, setForm] = useState({ gymName: '', city: '', ownerEmail: '' });
  const [busy, setBusy] = useState(false);
  const [adminInvites, setAdminInvites] = useState<any[]>([]);

  useEffect(() => {
    return onSnapshot(collection(db, 'invites'), (s) => setAdminInvites(s.docs.map((d) => d.data()).filter((i: any) => i.role === 'admin')), () => undefined);
  }, []);

  if (activeGymId) {
    return (
      <Suspense fallback={<div className="p-8 text-xs text-zinc-500">Loading gym…</div>}>
        <AdminPortal
          topBar={
            <div className="bg-violet-500/15 border-b border-violet-500/30 px-4 py-1.5 text-xs text-violet-200 flex items-center gap-3 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" /> Super Admin viewing <b>{currentGym?.gymName}</b>
              <button type="button" onClick={() => setSession({ activeGymId: null })} className="ml-auto inline-flex items-center gap-1 hover:text-white">
                <ArrowLeft className="w-3.5 h-3.5" /> All gyms
              </button>
            </div>
          }
        />
      </Suspense>
    );
  }

  const createGym = async () => {
    const ownerEmail = form.ownerEmail.trim().toLowerCase();
    if (form.gymName.trim().length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ownerEmail)) {
      addToast('Gym name and a valid owner email are required.', 'error');
      return;
    }
    setBusy(true);
    const gymId = `${slugify(form.gymName)}-${Math.random().toString(36).slice(2, 6)}`;
    const batch = writeBatch(db);
    batch.set(doc(db, 'gyms', gymId), {
      gymId, gymName: form.gymName.trim().slice(0, 120), address: form.city.trim().slice(0, 200), ownerEmail,
      email: ownerEmail, status: 'active', createdBy: email, createdAtMs: Date.now(),
      globalFees: { admissionFee: 0, receiptSignature: '' },
    });
    batch.set(doc(db, 'gymDirectory', gymId), { gymId, gymName: form.gymName.trim().slice(0, 120), city: form.city.trim().slice(0, 120) });
    batch.set(doc(db, 'invites', ownerEmail), { email: ownerEmail, role: 'admin', gymId, memberId: null, createdBy: email, createdAt: serverTimestamp() });
    try {
      await batch.commit();
      addToast(`Gym created. ${ownerEmail} becomes its admin on first sign-in.`, 'success');
      setForm({ gymName: '', city: '', ownerEmail: '' });
    } catch (e: any) {
      addToast(`Create failed: ${e.code || e.message}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#09090B] text-zinc-100">
      <header className="h-14 px-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="w-4 h-4 text-violet-400" /> Fitness Future · Super Admin</div>
        <button type="button" onClick={() => void signOutFirebaseUser()} className="p-2 rounded-lg text-zinc-400 hover:text-white" aria-label="Sign out"><LogOut className="w-4 h-4" /></button>
      </header>
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        <div className={box}>
          <h2 className="text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4 text-amber-400" /> New gym + owner (admin)</h2>
          <div className="flex flex-wrap gap-2">
            <input className={`${field} flex-1 min-w-[160px]`} placeholder="Gym name" value={form.gymName} onChange={(e) => setForm({ ...form, gymName: e.target.value })} />
            <input className={`${field} flex-1 min-w-[120px]`} placeholder="City / address" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input className={`${field} flex-1 min-w-[200px]`} placeholder="Owner email (Google or verified)" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} />
            <button type="button" className={`${btn} bg-amber-500 text-zinc-950`} disabled={busy} onClick={createGym}>Create</button>
          </div>
        </div>

        <div className={box}>
          <h2 className="text-sm font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-amber-400" /> Gyms ({availableGyms.length})</h2>
          <table className="w-full text-xs text-zinc-300">
            <thead className="text-left text-zinc-500"><tr><th className="py-1">Gym</th><th>Owner</th><th>ID</th><th /></tr></thead>
            <tbody>
              {availableGyms.map((g) => (
                <tr key={g.gymId} className="border-t border-white/5">
                  <td className="py-1.5">{g.gymName}<span className="block text-[11px] text-zinc-500">{g.address}</span></td>
                  <td>{(g as any).ownerEmail || g.email}</td>
                  <td className="font-mono text-[11px] text-zinc-500">{g.gymId}</td>
                  <td className="text-right"><button type="button" className={`${btn} bg-zinc-800 text-white`} onClick={() => setSession({ activeGymId: g.gymId })}>Open</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {adminInvites.length > 0 && (
          <div className={box}>
            <h2 className="text-sm font-semibold">Unclaimed owner invites</h2>
            <ul className="text-xs text-zinc-300 divide-y divide-white/5">
              {adminInvites.map((i) => (
                <li key={i.email} className="py-1.5 flex justify-between items-center">
                  <span>{i.email} → {i.gymId}</span>
                  <button type="button" className="text-zinc-400 hover:text-red-400" aria-label="Revoke" onClick={() => void deleteDoc(doc(db, 'invites', i.email))}><Trash2 className="w-3.5 h-3.5" /></button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminPortal;
