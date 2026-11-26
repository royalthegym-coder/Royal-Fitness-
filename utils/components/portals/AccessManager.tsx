import React, { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { UserPlus, Check, X, Users, Link2, Trash2 } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { useSessionStore } from '../../../lib/session';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import { Member } from '../../../types';

interface GymUser { uid: string; email?: string; displayName?: string; role: string; status: string; memberId?: number | null }
interface Invite { email: string; role: string; gymId: string; memberId?: number | null; createdAt?: any }
interface JoinRequest { uid: string; gymId: string; email?: string; phone?: string; displayName?: string }

const box = 'bg-surface border border-line rounded-2xl p-4 sm:p-5 space-y-3';
const field = 'h-11 bg-surface2 border border-line rounded-xl px-3 text-sm text-fg placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand/60';
const btn = 'inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50';

/**
 * Admin-only: invite trainers/members (by verified email), approve self-signup join requests,
 * link member logins to member records, assign members to trainers.
 * All writes are re-validated by firestore.rules (admin can only touch its own gymId,
 * can only grant trainer/member roles, never admin/super_admin).
 */
export const AccessManager: React.FC = () => {
  const gymId = useSessionStore((s) => s.activeGymId);
  const uid = useSessionStore((s) => s.user?.uid);
  const { members, addMember, updateMember } = useData();
  const { addToast } = useToast();

  const [users, setUsers] = useState<GymUser[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'trainer' | 'member'>('member');
  const [inviteMemberId, setInviteMemberId] = useState('');
  const [assignMemberId, setAssignMemberId] = useState('');
  const [assignTrainerUid, setAssignTrainerUid] = useState('');

  useEffect(() => {
    if (!gymId) return;
    const g = where('gymId', '==', gymId);
    const u1 = onSnapshot(query(collection(db, 'users'), g), (s) => setUsers(s.docs.map((d) => d.data() as GymUser)), (e) => console.warn(e.message));
    const u2 = onSnapshot(query(collection(db, 'invites'), g), (s) => setInvites(s.docs.map((d) => d.data() as Invite)), (e) => console.warn(e.message));
    const u3 = onSnapshot(query(collection(db, 'joinRequests'), g), (s) => setRequests(s.docs.map((d) => d.data() as JoinRequest)), (e) => console.warn(e.message));
    return () => { u1(); u2(); u3(); };
  }, [gymId]);

  const trainers = useMemo(() => users.filter((u) => u.role === 'trainer' && u.status === 'active'), [users]);
  const linkedMemberIds = useMemo(() => new Set(users.filter((u) => u.memberId != null).map((u) => u.memberId)), [users]);

  const sendInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!gymId || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      addToast('Enter a valid email.', 'error');
      return;
    }
    try {
      await setDoc(doc(db, 'invites', email), {
        email,
        role: inviteRole,
        gymId,
        memberId: inviteRole === 'member' && inviteMemberId ? Number(inviteMemberId) : null,
        createdBy: uid,
        createdAt: serverTimestamp(),
      });
      addToast(`Invite saved. ${email} can now sign in (Google or verified email) to join as ${inviteRole}.`, 'success');
      setInviteEmail('');
      setInviteMemberId('');
    } catch (e: any) {
      addToast(`Invite failed: ${e.code || e.message}`, 'error');
    }
  };

  const approve = async (r: JoinRequest, existingMemberId: number | null) => {
    try {
      let memberId = existingMemberId;
      if (!memberId) {
        memberId = Math.max(100, Date.now() % 1000000000, ...members.map((m) => m.id)) + 1;
        addMember({
          id: memberId, name: r.displayName || r.email || 'Member', email: r.email || '', phone: r.phone || '',
          joinDate: new Date().toISOString().split('T')[0], packageId: 0, status: 'Pending', avatar: '',
          whatsappConsent: true,
        } as unknown as Member);
      }
      await updateDoc(doc(db, 'users', r.uid), { status: 'active', memberId });
      await deleteDoc(doc(db, 'joinRequests', r.uid));
      addToast(`${r.displayName || r.email} approved.`, 'success');
    } catch (e: any) {
      addToast(`Approve failed: ${e.code || e.message}`, 'error');
    }
  };

  const reject = async (r: JoinRequest) => {
    try {
      await updateDoc(doc(db, 'users', r.uid), { status: 'disabled' });
      await deleteDoc(doc(db, 'joinRequests', r.uid));
    } catch (e: any) {
      addToast(`Reject failed: ${e.code || e.message}`, 'error');
    }
  };

  const setUserStatus = async (u: GymUser, status: 'active' | 'disabled') => {
    try {
      await updateDoc(doc(db, 'users', u.uid), { status });
    } catch (e: any) {
      addToast(`Update failed: ${e.code || e.message}`, 'error');
    }
  };

  const assign = () => {
    const m = members.find((x) => x.id === Number(assignMemberId));
    if (!m) return;
    updateMember({ ...m, assignedTrainerUid: assignTrainerUid || null });
    addToast(assignTrainerUid ? `${m.name} assigned to trainer.` : `${m.name} unassigned.`, 'success');
  };

  return (
    <div className="space-y-4">
      <div className={box}>
        <h2 className="text-[15px] font-semibold text-fg flex items-center gap-2"><UserPlus className="w-4 h-4 text-brand" /> Invite trainer or member</h2>
        <p className="text-xs text-muted">The person signs in with Google or a verified email matching the invite; their role and gym are applied automatically.</p>
        <div className="flex flex-wrap gap-2">
          <input className={`${field} flex-1 min-w-[200px]`} placeholder="email@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
          <select className={field} value={inviteRole} onChange={(e) => setInviteRole(e.target.value as any)} aria-label="Role">
            <option value="member">Member</option>
            <option value="trainer">Trainer</option>
          </select>
          {inviteRole === 'member' && (
            <select className={field} value={inviteMemberId} onChange={(e) => setInviteMemberId(e.target.value)} aria-label="Link to member record">
              <option value="">Link to member record…</option>
              {members.filter((m) => !linkedMemberIds.has(m.id)).map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
              ))}
            </select>
          )}
          <button type="button" className={`${btn} bg-brand text-brand-fg`} onClick={sendInvite}>Send invite</button>
        </div>
        {invites.length > 0 && (
          <ul className="text-sm text-fg divide-y divide-line">
            {invites.map((i) => (
              <li key={i.email} className="py-1.5 flex items-center justify-between">
                <span>{i.email} · {i.role}{i.memberId ? ` · member #${i.memberId}` : ''} <span className="text-subtle">(not claimed yet)</span></span>
                <button type="button" className="text-muted hover:text-red-400" onClick={() => void deleteDoc(doc(db, 'invites', i.email))} aria-label="Revoke invite"><Trash2 className="w-3.5 h-3.5" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={box}>
        <h2 className="text-[15px] font-semibold text-fg">Join requests ({requests.length})</h2>
        {requests.length === 0 && <p className="text-xs text-subtle">No pending requests.</p>}
        {requests.map((r) => (
          <JoinRow key={r.uid} r={r} members={members} linked={linkedMemberIds} onApprove={approve} onReject={reject} />
        ))}
      </div>

      <div className={box}>
        <h2 className="text-[15px] font-semibold text-fg flex items-center gap-2"><Link2 className="w-4 h-4 text-brand" /> Assign members to trainers</h2>
        <div className="flex flex-wrap gap-2">
          <select className={field} value={assignMemberId} onChange={(e) => setAssignMemberId(e.target.value)} aria-label="Member">
            <option value="">Member…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}{m.assignedTrainerUid ? ` (→ ${users.find((u) => u.uid === m.assignedTrainerUid)?.displayName || 'trainer'})` : ''}</option>
            ))}
          </select>
          <select className={field} value={assignTrainerUid} onChange={(e) => setAssignTrainerUid(e.target.value)} aria-label="Trainer">
            <option value="">No trainer</option>
            {trainers.map((t) => (
              <option key={t.uid} value={t.uid}>{t.displayName || t.email}</option>
            ))}
          </select>
          <button type="button" className={`${btn} bg-surface2 text-fg border border-line`} disabled={!assignMemberId} onClick={assign}>Save</button>
        </div>
      </div>

      <div className={box}>
        <h2 className="text-[15px] font-semibold text-fg flex items-center gap-2"><Users className="w-4 h-4 text-brand" /> People with app access</h2>
        {users.length === 0 ? <p className="text-xs text-subtle">Nobody has joined yet.</p> : (
          <ul className="divide-y divide-line">
            {users.map((u) => (
              <li key={u.uid} className="py-2.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-fg truncate">{u.displayName || u.email}</div>
                  <div className="text-[11px] text-subtle truncate">{u.email}{u.memberId != null ? ` · member #${u.memberId}` : ''}</div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full border border-line text-muted capitalize">{u.role}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${u.status === 'active' ? 'border-emerald-500/30 text-emerald-500' : 'border-rose-500/30 text-rose-500'}`}>{u.status}</span>
                {u.role !== 'admin' && (u.status === 'active'
                  ? <button type="button" className="text-xs font-semibold text-muted hover:text-rose-500 cursor-pointer px-2 h-9" onClick={() => void setUserStatus(u, 'disabled')}>Disable</button>
                  : <button type="button" className="text-xs font-semibold text-muted hover:text-emerald-500 cursor-pointer px-2 h-9" onClick={() => void setUserStatus(u, 'active')}>Enable</button>)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const JoinRow: React.FC<{
  r: JoinRequest;
  members: Member[];
  linked: Set<number | null | undefined>;
  onApprove: (r: JoinRequest, memberId: number | null) => void;
  onReject: (r: JoinRequest) => void;
}> = ({ r, members, linked, onApprove, onReject }) => {
  const suggestion = members.find((m) => (r.email && m.email?.toLowerCase() === r.email) || (r.phone && m.phone && m.phone.replace(/\D/g, '').slice(-10) === r.phone.replace(/\D/g, '').slice(-10)));
  const [memberId, setMemberId] = useState<string>(suggestion ? String(suggestion.id) : '');
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-fg border-t border-line pt-2">
      <span className="flex-1 min-w-[160px]">{r.displayName} · {r.email || r.phone}</span>
      <select className={field} value={memberId} onChange={(e) => setMemberId(e.target.value)} aria-label="Link member">
        <option value="">Create new member record</option>
        {members.filter((m) => !linked.has(m.id)).map((m) => (
          <option key={m.id} value={m.id}>Link to {m.name} ({m.phone})</option>
        ))}
      </select>
      <button type="button" className={`${btn} bg-emerald-500 text-zinc-950`} onClick={() => onApprove(r, memberId ? Number(memberId) : null)}><Check className="w-3.5 h-3.5" /> Approve</button>
      <button type="button" className={`${btn} bg-surface2 text-fg border border-line`} onClick={() => onReject(r)}><X className="w-3.5 h-3.5" /> Reject</button>
    </div>
  );
};

export default AccessManager;
