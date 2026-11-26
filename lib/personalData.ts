/**
 * Hybrid storage for a member's PERSONAL data (Phase 2):
 *   - "drive"     : member signed in with Google and turned on "Store my personal data in my Google Drive"
 *                   -> AI chat history, progress logs, progress photos, food logs live in their Drive appDataFolder.
 *   - "firestore" : everyone else (email/password, declined, trainers/admins) -> Firestore collections
 *                   aiChats / progressLogs / foodLogs (gym-scoped, protected by firestore.rules).
 * Gym business data (membership, assigned plans, payments, attendance, dues, invites) always stays in Firestore.
 * Optional "share progress with my trainer": writes only a small summary to Firestore progressSummaries.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { GYM_COLLECTIONS as C } from './config';
import { useSessionStore } from './session';
import {
  DriveAuthError, cacheGet, connectDrive, hasDriveToken, hasGoogleSignIn, onDriveAuthChange, readJson, writeJson,
} from './personalDrive';
import { ProgressLog, StoredChatTurn, chatDocId } from './coachData';

export type PersonalMode = 'drive' | 'firestore';

export const driveFileName = (gymId: string, memberId: number, kind: 'progress' | 'food' | 'chat') => `ff-${gymId}-${memberId}-${kind}.json`;
export const photoScope = (gymId: string, memberId: number) => `${gymId}-${memberId}`;

/** Re-render when the in-memory Drive token appears/expires. */
export function useDriveConnected() {
  const [ok, setOk] = useState(hasDriveToken());
  useEffect(() => onDriveAuthChange(() => setOk(hasDriveToken())), []);
  useEffect(() => {
    const t = window.setInterval(() => setOk(hasDriveToken()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  return ok;
}

/** The signed-in member's storage choice (users/{uid}.personalStorage / shareProgress). */
export function usePersonalSettings() {
  const uid = useSessionStore((s) => s.user?.uid || '');
  const role = useSessionStore((s) => s.role);
  const profile = useSessionStore((s) => s.profile);
  const google = hasGoogleSignIn();
  const mode: PersonalMode = role === 'member' && google && profile?.personalStorage === 'drive' ? 'drive' : 'firestore';
  const shareProgress = profile?.shareProgress === true;
  const update = useCallback(
    (patch: { personalStorage?: PersonalMode; shareProgress?: boolean }) => updateDoc(doc(db, 'users', uid), patch),
    [uid]
  );
  return { mode, shareProgress, canUseDrive: role === 'member' && google, update };
}

// ------------------------------------------------------------------ generic Drive JSON doc
export interface DriveDoc<T> {
  data: T;
  loading: boolean;
  error: string | null;
  needsConnect: boolean;
  connect: () => Promise<void>;
  /** Writes the whole file (prompts for Google if the token expired — call from a tap). */
  save: (next: T) => Promise<void>;
}

export function useDriveJson<T>(name: string | null, empty: T): DriveDoc<T> {
  const connected = useDriveConnected();
  const [data, setData] = useState<T>(empty);
  const [loading, setLoading] = useState(!!name);
  const [error, setError] = useState<string | null>(null);
  const emptyRef = useRef(empty);

  useEffect(() => {
    let live = true;
    if (!name) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void cacheGet<T>(name).then((c) => {
      if (live && c !== undefined) {
        setData(c);
        setLoading(false);
      }
    });
    if (!connected) {
      setLoading(false);
      return;
    }
    readJson<T>(name)
      .then((d) => {
        if (!live) return;
        setData(d ?? emptyRef.current);
        setError(null);
      })
      .catch((e) => live && setError(e instanceof DriveAuthError ? null : e?.message || 'Could not read Google Drive.'))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [name, connected]);

  const connect = useCallback(async () => {
    try {
      await connectDrive();
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Could not connect Google Drive.');
    }
  }, []);

  const save = useCallback(
    async (next: T) => {
      if (!name) return;
      if (!hasDriveToken()) await connectDrive();
      await writeJson(name, next);
      setData(next);
    },
    [name]
  );

  return { data, loading, error, needsConnect: !connected, connect, save };
}

// ------------------------------------------------------------------ trainer summary
export interface ProgressSummary {
  gymId: string;
  memberId: number;
  ownerUid: string;
  latestWeightKg: number | null;
  latestDate: string | null;
  startWeightKg: number | null;
  targetWeightKg: number | null;
  goalProgressPct: number | null;
  entries: number;
  updatedAtMs: number;
}

export function buildSummary(gymId: string, memberId: number, uid: string, logs: ProgressLog[], targetWeightKg: number | null): ProgressSummary {
  const w = [...logs].filter((l) => typeof l.weightKg === 'number').sort((a, b) => a.date.localeCompare(b.date) || a.createdAtMs - b.createdAtMs);
  const start = w[0]?.weightKg ?? null;
  const latest = w[w.length - 1] ?? null;
  let pct: number | null = null;
  if (start != null && latest?.weightKg != null && targetWeightKg && targetWeightKg !== start) {
    pct = Math.round(Math.max(0, Math.min(100, ((start - latest.weightKg) / (start - targetWeightKg)) * 100)));
  }
  return {
    gymId,
    memberId,
    ownerUid: uid,
    latestWeightKg: latest?.weightKg ?? null,
    latestDate: latest?.date ?? null,
    startWeightKg: start,
    targetWeightKg: targetWeightKg || null,
    goalProgressPct: pct,
    entries: logs.length,
    updatedAtMs: Date.now(),
  };
}

const summaryRef = (gymId: string, memberId: number) => doc(db, C.progressSummaries, `${gymId}_${memberId}`);
export const writeProgressSummary = (s: ProgressSummary) => setDoc(summaryRef(s.gymId, s.memberId), s);
export const deleteProgressSummary = (gymId: string, memberId: number) => deleteDoc(summaryRef(gymId, memberId));

export function useProgressSummary(gymId: string | null, memberId: number | null) {
  const [s, setS] = useState<ProgressSummary | null>(null);
  useEffect(() => {
    if (!gymId || memberId == null) return;
    return onSnapshot(summaryRef(gymId, memberId), (d) => setS(d.exists() ? (d.data() as ProgressSummary) : null), () => setS(null));
  }, [gymId, memberId]);
  return s;
}

// ------------------------------------------------------------------ food logs
export interface FoodLog {
  id: string;
  date: string;
  meal: string;
  text: string;
  calories?: number | null;
  proteinG?: number | null;
  createdAtMs: number;
}

export function useFirestoreFoodLogs(gymId: string | null, memberId: number | null, enabled: boolean) {
  const [rows, setRows] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(enabled);
  useEffect(() => {
    if (!enabled || !gymId || memberId == null) {
      setLoading(false);
      return;
    }
    return onSnapshot(
      query(collection(db, C.foodLogs), where('gymId', '==', gymId), where('memberId', '==', memberId), orderBy('createdAtMs', 'desc'), limit(200)),
      (s) => {
        setRows(s.docs.map((d) => d.data() as FoodLog));
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [gymId, memberId, enabled]);
  return { rows, loading };
}

export const addFirestoreFoodLog = (gymId: string, memberId: number, uid: string, f: FoodLog) =>
  setDoc(doc(db, C.foodLogs, `${gymId}_${f.id}`), { ...f, gymId, memberId, createdBy: uid });
export const deleteFirestoreFoodLog = (gymId: string, id: string) => deleteDoc(doc(db, C.foodLogs, `${gymId}_${id}`));

// ------------------------------------------------------------------ migration Firestore -> Drive
/**
 * Copies the member's own Firestore progress logs, food logs and AI chat into their Drive files,
 * then deletes those Firestore documents. Entries written by the trainer stay in Firestore.
 */
export async function moveMyDataToDrive(gymId: string, memberId: number, uid: string): Promise<{ progress: number; food: number; chat: number }> {
  if (!hasDriveToken()) await connectDrive();
  const mine = (coll: string) =>
    getDocs(query(collection(db, coll), where('gymId', '==', gymId), where('memberId', '==', memberId), orderBy('createdAtMs', 'desc'), limit(500))).then((s) =>
      s.docs.filter((d) => d.data().createdBy === uid)
    );
  const [pDocs, fDocs] = await Promise.all([mine(C.progressLogs), mine(C.foodLogs).catch(() => [])]);

  const pName = driveFileName(gymId, memberId, 'progress');
  const existingP = (await readJson<ProgressLog[]>(pName)) || [];
  const pIds = new Set(existingP.map((x) => x.id));
  const pNew = pDocs.map((d) => d.data() as ProgressLog).filter((x) => !pIds.has(x.id));
  if (pNew.length) await writeJson(pName, [...pNew, ...existingP].sort((a, b) => b.createdAtMs - a.createdAtMs).slice(0, 1000));

  const fName = driveFileName(gymId, memberId, 'food');
  const existingF = (await readJson<FoodLog[]>(fName)) || [];
  const fIds = new Set(existingF.map((x) => x.id));
  const fNew = fDocs.map((d) => {
    const { gymId: _g, memberId: _m, createdBy: _c, ...rest } = d.data() as any;
    return rest as FoodLog;
  }).filter((x) => !fIds.has(x.id));
  if (fNew.length) await writeJson(fName, [...fNew, ...existingF].sort((a, b) => b.createdAtMs - a.createdAtMs).slice(0, 2000));

  let chat = 0;
  const chatSnap = await getDoc(doc(db, C.aiChats, chatDocId(gymId, memberId, uid))).catch(() => null);
  const chatDoc = chatSnap?.exists() ? chatSnap : null;
  if (chatDoc) {
    const msgs = (chatDoc.data().messages || []) as StoredChatTurn[];
    const cName = driveFileName(gymId, memberId, 'chat');
    const existingC = (await readJson<StoredChatTurn[]>(cName)) || [];
    await writeJson(cName, [...msgs, ...existingC].sort((a, b) => a.ts - b.ts).slice(-60));
    chat = msgs.length;
  }

  // Only after every Drive write succeeded: remove the Firestore copies.
  await Promise.all([
    ...pDocs.map((d) => deleteDoc(d.ref)),
    ...fDocs.map((d) => deleteDoc(d.ref)),
    chatDoc ? deleteDoc(doc(db, C.aiChats, chatDocId(gymId, memberId, uid))) : Promise.resolve(),
  ]);
  return { progress: pDocs.length, food: fDocs.length, chat };
}
