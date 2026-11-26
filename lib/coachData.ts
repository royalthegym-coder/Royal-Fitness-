/**
 * Firestore data for coaching features (Phase 2): progress logs, member plans, AI chat history.
 * Every query is gymId + memberId scoped so it matches firestore.rules (canSeeMember).
 */
import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDoc, limit, onSnapshot, orderBy, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { GYM_COLLECTIONS as C } from './config';
import type { ChatTurn, MemberPlanContent } from './apiClient';

export interface ProgressLog {
  id: string;
  gymId: string;
  memberId: number;
  date: string;
  weightKg?: number | null;
  bodyFatPct?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  hipsCm?: number | null;
  armsCm?: number | null;
  thighsCm?: number | null;
  notes?: string;
  createdBy: string;
  createdByRole: string;
  createdAtMs: number;
}

export interface MemberPlan extends MemberPlanContent {
  id: string;
  gymId: string;
  memberId: number;
  memberName?: string;
  trainerUid: string;
  trainerName?: string;
  status: 'active' | 'archived';
  source: 'ai' | 'manual';
  createdAtMs: number;
  updatedAtMs: number;
}

export interface StoredChatTurn extends ChatTurn {
  ts: number;
}

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;

interface Live<T> {
  rows: T[];
  loading: boolean;
  error: string | null;
}

function useLiveQuery<T>(key: string | null, build: () => ReturnType<typeof query> | null): Live<T> {
  const [state, setState] = useState<Live<T>>({ rows: [], loading: !!key, error: null });
  useEffect(() => {
    const q = key ? build() : null;
    if (!q) {
      setState({ rows: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    return onSnapshot(
      q,
      (snap) => setState({ rows: snap.docs.map((d) => d.data() as T), loading: false, error: null }),
      (err) => setState({ rows: [], loading: false, error: err.code || err.message })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}

// ------------------------------------------------------------------ progress
export function useProgressLogs(gymId: string | null, memberId: number | null | undefined, max = 60) {
  const key = gymId && memberId != null ? `${gymId}|${memberId}|${max}` : null;
  return useLiveQuery<ProgressLog>(key, () =>
    query(collection(db, C.progressLogs), where('gymId', '==', gymId), where('memberId', '==', memberId), orderBy('createdAtMs', 'desc'), limit(max))
  );
}

const num = (v: unknown, lo: number, hi: number): number | null => {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= lo && n <= hi ? Math.round(n * 10) / 10 : null;
};

export type ProgressInput = Partial<Record<'weightKg' | 'bodyFatPct' | 'chestCm' | 'waistCm' | 'hipsCm' | 'armsCm' | 'thighsCm', string | number>> & {
  date: string;
  notes?: string;
};

/** Validate + normalise an entry (throws if no measurement). Used for Firestore and Google Drive storage. */
export function buildProgressLog(gymId: string, memberId: number, uid: string, role: string, input: ProgressInput): ProgressLog {
  const id = newId('PRG');
  const log: ProgressLog = {
    id,
    gymId,
    memberId,
    date: input.date.slice(0, 10),
    weightKg: num(input.weightKg, 20, 350),
    bodyFatPct: num(input.bodyFatPct, 2, 70),
    chestCm: num(input.chestCm, 30, 250),
    waistCm: num(input.waistCm, 30, 250),
    hipsCm: num(input.hipsCm, 30, 250),
    armsCm: num(input.armsCm, 10, 100),
    thighsCm: num(input.thighsCm, 20, 150),
    notes: (input.notes || '').trim().slice(0, 500),
    createdBy: uid,
    createdByRole: role,
    createdAtMs: Date.now(),
  };
  const hasValue = ['weightKg', 'bodyFatPct', 'chestCm', 'waistCm', 'hipsCm', 'armsCm', 'thighsCm'].some((k) => (log as any)[k] != null);
  if (!hasValue) throw new Error('Enter at least one measurement (weight, body fat or a body measurement).');
  return log;
}

export async function addProgressLog(gymId: string, memberId: number, uid: string, role: string, input: ProgressInput) {
  const log = buildProgressLog(gymId, memberId, uid, role, input);
  await setDoc(doc(db, C.progressLogs, `${gymId}_${log.id}`), log);
  return log;
}

export const deleteProgressLog = (gymId: string, id: string) => deleteDoc(doc(db, C.progressLogs, `${gymId}_${id}`));

// ------------------------------------------------------------------ plans
export function useMemberPlans(gymId: string | null, memberId: number | null | undefined) {
  const key = gymId && memberId != null ? `${gymId}|${memberId}` : null;
  return useLiveQuery<MemberPlan>(key, () =>
    query(collection(db, C.plans), where('gymId', '==', gymId), where('memberId', '==', memberId), orderBy('createdAtMs', 'desc'), limit(20))
  );
}

/** Save an approved plan as the member's active plan and archive the previous active ones (one batch). */
export async function saveMemberPlan(
  gymId: string,
  memberId: number,
  trainer: { uid: string; name?: string },
  content: MemberPlanContent,
  source: 'ai' | 'manual',
  previousActive: MemberPlan[],
  memberName?: string
) {
  const id = newId('PLN');
  const now = Date.now();
  const plan: MemberPlan = {
    ...content,
    title: (content.title || 'Training plan').slice(0, 120),
    id,
    gymId,
    memberId,
    memberName: memberName?.slice(0, 120),
    trainerUid: trainer.uid,
    trainerName: trainer.name?.slice(0, 120),
    status: 'active',
    source,
    createdAtMs: now,
    updatedAtMs: now,
  };
  const batch = writeBatch(db);
  previousActive.filter((p) => p.status === 'active').forEach((p) => batch.update(doc(db, C.plans, `${gymId}_${p.id}`), { status: 'archived', updatedAtMs: now }));
  batch.set(doc(db, C.plans, `${gymId}_${id}`), JSON.parse(JSON.stringify(plan)));
  await batch.commit();
  return plan;
}

export const setPlanStatus = (gymId: string, id: string, status: 'active' | 'archived') =>
  updateDoc(doc(db, C.plans, `${gymId}_${id}`), { status, updatedAtMs: Date.now() });

// ------------------------------------------------------------------ AI chat history
const MAX_TURNS = 60;
export const chatDocId = (gymId: string, memberId: number, uid: string) => `${gymId}_${memberId}_${uid}`;

export async function loadChat(gymId: string, memberId: number, uid: string): Promise<StoredChatTurn[]> {
  try {
    const snap = await getDoc(doc(db, C.aiChats, chatDocId(gymId, memberId, uid)));
    const msgs = snap.exists() ? (snap.data().messages as StoredChatTurn[]) : [];
    return Array.isArray(msgs) ? msgs : [];
  } catch {
    return [];
  }
}

export async function saveChat(gymId: string, memberId: number, uid: string, role: string, messages: StoredChatTurn[]) {
  const trimmed = messages.slice(-MAX_TURNS).map((m) => ({ role: m.role, text: m.text.slice(0, 4000), ts: m.ts }));
  await setDoc(doc(db, C.aiChats, chatDocId(gymId, memberId, uid)), {
    gymId,
    memberId,
    ownerUid: uid,
    ownerRole: role,
    messages: trimmed,
    updatedAtMs: Date.now(),
  });
}

export const clearChat = (gymId: string, memberId: number, uid: string) => deleteDoc(doc(db, C.aiChats, chatDocId(gymId, memberId, uid)));
