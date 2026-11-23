import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { Dumbbell, LogOut, Utensils, ClipboardList, User } from 'lucide-react';
import { db, signOutFirebaseUser } from '../../../lib/firebase';
import { useSessionStore } from '../../../lib/session';
import { useData } from '../../context/DataProvider';
import { useGym } from '../../context/GymProvider';
import { useToast } from '../../hooks/useToast';

interface TrainerSession {
  id: string;
  gymId: string;
  trainerUid: string;
  memberId: number;
  memberName: string;
  date: string;
  durationMinutes: number;
  focus: string;
  rpe: number;
  notes: string;
  createdAtMs: number;
}

const box = 'bg-[#111318] border border-white/10 rounded-xl p-4 space-y-3';
const field = 'w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white';
const btn = 'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50';

/**
 * Trainer portal (real data):
 *  - sees ONLY members whose assignedTrainerUid == their uid (enforced by firestore.rules)
 *  - logs training sessions (trainerSessions collection)
 *  - assigns a workout template / diet plan to an assigned member
 */
export const TrainerPortal: React.FC = () => {
  const uid = useSessionStore((s) => s.user?.uid);
  const name = useSessionStore((s) => s.profile?.displayName || s.user?.email || 'Trainer');
  const gymId = useSessionStore((s) => s.activeGymId);
  const { currentGym } = useGym();
  const { members, workoutTemplates, dietPlans, updateMember, isHydrating } = useData();
  const { addToast } = useToast();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<TrainerSession[]>([]);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], durationMinutes: '60', focus: '', rpe: '7', notes: '' });

  const selected = useMemo(() => members.find((m) => m.id === selectedId) || null, [members, selectedId]);

  useEffect(() => {
    if (!selectedId && members.length) setSelectedId(members[0].id);
  }, [members, selectedId]);

  useEffect(() => {
    if (!gymId || !uid) return;
    return onSnapshot(
      query(collection(db, 'trainerSessions'), where('gymId', '==', gymId), where('trainerUid', '==', uid)),
      (snap) => setSessions(snap.docs.map((d) => d.data() as TrainerSession).sort((a, b) => b.createdAtMs - a.createdAtMs)),
      (err) => console.warn('[TrainerPortal] sessions', err.message)
    );
  }, [gymId, uid]);

  const memberSessions = sessions.filter((s) => s.memberId === selectedId);

  const logSession = async () => {
    if (!selected || !gymId || !uid) return;
    const id = `TS-${Date.now()}`;
    const session: TrainerSession = {
      id, gymId, trainerUid: uid, memberId: selected.id, memberName: selected.name, date: form.date,
      durationMinutes: Math.max(5, Math.min(300, Number(form.durationMinutes) || 60)),
      focus: form.focus.trim().slice(0, 120), rpe: Math.max(1, Math.min(10, Number(form.rpe) || 7)),
      notes: form.notes.trim().slice(0, 1000), createdAtMs: Date.now(),
    };
    try {
      await setDoc(doc(db, 'trainerSessions', `${gymId}_${id}`), session);
      addToast(`Session logged for ${selected.name}.`, 'success');
      setForm((f) => ({ ...f, focus: '', notes: '' }));
    } catch (e: any) {
      addToast(`Could not log session: ${e.code || e.message}`, 'error');
    }
  };

  const assignWorkout = (id: string) => {
    if (!selected) return;
    const w = workoutTemplates.find((x) => x.id === Number(id));
    updateMember({ ...selected, assignedWorkoutId: w ? w.id : null, approvedAiPlan: w ? w.name : undefined });
    addToast(w ? `Workout "${w.name}" assigned.` : 'Workout unassigned.', 'success');
  };

  const assignDiet = (id: string) => {
    if (!selected) return;
    const d = dietPlans.find((x) => x.id === Number(id));
    updateMember({ ...selected, assignedDietId: d ? d.id : null });
    addToast(d ? `Diet "${d.name}" assigned.` : 'Diet unassigned.', 'success');
  };

  return (
    <div className="min-h-screen w-screen bg-[#09090B] text-zinc-100">
      <header className="h-14 px-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="text-sm font-bold">{currentGym?.gymName || 'Gym'} · Trainer</div>
          <div className="text-[11px] text-zinc-400">{name}</div>
        </div>
        <button type="button" onClick={() => void signOutFirebaseUser()} className="p-2 rounded-lg text-zinc-400 hover:text-white" aria-label="Sign out">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <div className="max-w-6xl mx-auto p-4 grid gap-4 md:grid-cols-[260px_1fr]">
        <aside className={box}>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">My members ({members.length})</h2>
          {isHydrating && <p className="text-[11px] text-zinc-500">Loading…</p>}
          {!isHydrating && members.length === 0 && <p className="text-xs text-zinc-500">No members assigned yet. Ask the gym admin to assign members to you.</p>}
          <ul className="space-y-1">
            {members.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => setSelectedId(m.id)} className={`w-full text-left px-2.5 py-2 rounded-lg text-sm ${m.id === selectedId ? 'bg-amber-500/15 text-amber-300' : 'hover:bg-white/5 text-zinc-300'}`}>
                  {m.name}
                  <span className="block text-[11px] text-zinc-500">{m.status}{m.expiryDate ? ` · till ${m.expiryDate}` : ''}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {selected ? (
          <section className="space-y-4">
            <div className={box}>
              <h2 className="text-sm font-semibold flex items-center gap-2"><User className="w-4 h-4 text-amber-400" /> {selected.name}</h2>
              <p className="text-xs text-zinc-400">Goal: {selected.fitnessGoal || '—'} · Phone: {selected.phone || '—'}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="text-xs text-zinc-400 space-y-1">
                  <span className="flex items-center gap-1"><Dumbbell className="w-3.5 h-3.5" /> Workout plan</span>
                  <select className={field} value={selected.assignedWorkoutId ?? ''} onChange={(e) => assignWorkout(e.target.value)}>
                    <option value="">None</option>
                    {workoutTemplates.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.level})</option>)}
                  </select>
                </label>
                <label className="text-xs text-zinc-400 space-y-1">
                  <span className="flex items-center gap-1"><Utensils className="w-3.5 h-3.5" /> Diet plan</span>
                  <select className={field} value={selected.assignedDietId ?? ''} onChange={(e) => assignDiet(e.target.value)}>
                    <option value="">None</option>
                    {dietPlans.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className={box}>
              <h2 className="text-sm font-semibold flex items-center gap-2"><ClipboardList className="w-4 h-4 text-amber-400" /> Log a session</h2>
              <div className="grid sm:grid-cols-4 gap-2">
                <input type="date" className={field} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} aria-label="Date" />
                <input className={field} inputMode="numeric" placeholder="Minutes" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} aria-label="Duration minutes" />
                <input className={field} placeholder="Focus (e.g. Legs)" value={form.focus} onChange={(e) => setForm({ ...form, focus: e.target.value })} />
                <select className={field} value={form.rpe} onChange={(e) => setForm({ ...form, rpe: e.target.value })} aria-label="RPE">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>RPE {n}</option>)}
                </select>
              </div>
              <textarea className={field} rows={3} placeholder="Notes: exercises, loads, form cues…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <button type="button" className={`${btn} bg-amber-500 text-zinc-950`} onClick={logSession}>Save session</button>
            </div>

            <div className={box}>
              <h2 className="text-sm font-semibold">Session history ({memberSessions.length})</h2>
              {memberSessions.length === 0 && <p className="text-xs text-zinc-500">No sessions logged yet.</p>}
              <ul className="divide-y divide-white/5 text-xs">
                {memberSessions.map((s) => (
                  <li key={s.id} className="py-2">
                    <div className="text-zinc-200">{s.date} · {s.focus || 'Session'} · {s.durationMinutes} min · RPE {s.rpe}</div>
                    {s.notes && <div className="text-zinc-400 whitespace-pre-wrap">{s.notes}</div>}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : (
          <section className={box}><p className="text-xs text-zinc-500">Select a member.</p></section>
        )}
      </div>
    </div>
  );
};

export default TrainerPortal;
