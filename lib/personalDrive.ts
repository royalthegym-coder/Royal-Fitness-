/**
 * Member PERSONAL data in the member's own Google Drive (hidden appDataFolder).
 *
 *  - Scope: https://www.googleapis.com/auth/drive.appdata (only this app's hidden folder; we cannot see
 *    any other file in the member's Drive). Requested incrementally — only when the member turns the
 *    feature on or opens a personal-data screen — via Firebase GoogleAuthProvider.addScope + popup.
 *  - The Google OAuth access token lives ONLY in memory (never localStorage/sessionStorage). Google access
 *    tokens last ~1 hour; on expiry (HTTP 401) the UI shows "Reconnect Google Drive" and the next tap
 *    re-prompts.
 *  - IndexedDB caches the JSON files and photo blobs so screens open instantly and work offline (read-only).
 *    The cache is wiped on sign-out.
 *  - Drive REST v3 from the browser. Free: uses the member's own 15 GB.
 */
import { GoogleAuthProvider, onAuthStateChanged, reauthenticateWithPopup } from 'firebase/auth';
import { auth } from './firebase';

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';

// ------------------------------------------------------------------ token (memory only)
let token: { value: string; exp: number; uid: string } | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
export const onDriveAuthChange = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export const hasGoogleSignIn = () => !!auth.currentUser?.providerData.some((p) => p.providerId === 'google.com');
export const hasDriveToken = () => !!token && token.uid === auth.currentUser?.uid && token.exp > Date.now() + 30_000;

export class DriveAuthError extends Error {
  constructor(message = 'Google Drive needs to be reconnected.') {
    super(message);
    this.name = 'DriveAuthError';
  }
}

/**
 * Get a Drive access token. If none is cached, opens the Google popup (must be called from a tap/click).
 * Throws DriveAuthError if the member declines or picks a different Google account.
 */
export async function connectDrive(): Promise<string> {
  if (hasDriveToken()) return token!.value;
  const user = auth.currentUser;
  if (!user) throw new DriveAuthError('Please sign in first.');
  if (!hasGoogleSignIn()) throw new DriveAuthError('Google Drive storage needs a Google sign-in.');
  const provider = new GoogleAuthProvider();
  provider.addScope(DRIVE_SCOPE);
  provider.setCustomParameters({ login_hint: user.email || '', include_granted_scopes: 'true' });
  try {
    const res = await reauthenticateWithPopup(user, provider);
    const cred = GoogleAuthProvider.credentialFromResult(res);
    if (!cred?.accessToken) throw new DriveAuthError('Google did not return Drive access.');
    token = { value: cred.accessToken, exp: Date.now() + 55 * 60_000, uid: user.uid };
    emit();
    return token.value;
  } catch (e: any) {
    if (e instanceof DriveAuthError) throw e;
    const code = e?.code || '';
    if (code === 'auth/user-mismatch') throw new DriveAuthError('Please choose the same Google account you use for the gym app.');
    if (code === 'auth/popup-blocked') throw new DriveAuthError('Your browser blocked the Google window. Allow pop-ups and try again.');
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') throw new DriveAuthError('Google Drive access was not granted.');
    throw new DriveAuthError(`Could not connect Google Drive (${code || e?.message || 'error'}).`);
  }
}

export function disconnectDrive() {
  token = null;
  emit();
}

async function driveFetch(url: string, init: RequestInit = {}): Promise<Response> {
  if (!hasDriveToken()) throw new DriveAuthError();
  const res = await fetch(url, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${token!.value}` } });
  if (res.status === 401) {
    token = null;
    emit();
    throw new DriveAuthError('Your Google Drive session expired. Tap “Reconnect” to continue.');
  }
  if (res.status === 403) {
    const j = await res.clone().json().catch(() => ({}) as any);
    const reason = j?.error?.errors?.[0]?.reason || '';
    if (reason === 'insufficientPermissions' || reason === 'insufficientScopes') {
      token = null;
      emit();
      throw new DriveAuthError('Drive permission was not granted. Tap “Connect Google Drive” and allow access.');
    }
  }
  if (!res.ok) throw new Error(`Google Drive error (${res.status}).`);
  return res;
}

// ------------------------------------------------------------------ IndexedDB cache
const IDB_NAME = 'ff_personal_cache';
let idbP: Promise<IDBDatabase> | null = null;
function idb(): Promise<IDBDatabase> {
  if (!idbP) {
    idbP = new Promise((resolve, reject) => {
      const r = indexedDB.open(IDB_NAME, 1);
      r.onupgradeneeded = () => {
        r.result.createObjectStore('json');
        r.result.createObjectStore('blobs');
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  return idbP;
}
async function idbOp<T>(store: 'json' | 'blobs', mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T | undefined> {
  try {
    const db = await idb();
    return await new Promise<T | undefined>((resolve, reject) => {
      const req = fn(db.transaction(store, mode).objectStore(store));
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}
const cacheKey = (name: string) => `${auth.currentUser?.uid || 'anon'}:${name}`;
export const cacheGet = <T>(name: string) => idbOp<T>('json', 'readonly', (s) => s.get(cacheKey(name)));
const cachePut = (name: string, v: unknown) => idbOp('json', 'readwrite', (s) => s.put(v, cacheKey(name)));
const blobGet = (id: string) => idbOp<Blob>('blobs', 'readonly', (s) => s.get(cacheKey(id)));
const blobPut = (id: string, b: Blob) => idbOp('blobs', 'readwrite', (s) => s.put(b, cacheKey(id)));

export async function clearPersonalCache() {
  try {
    const db = await idb();
    await Promise.all(
      (['json', 'blobs'] as const).map(
        (st) =>
          new Promise<void>((res) => {
            const r = db.transaction(st, 'readwrite').objectStore(st).clear();
            r.onsuccess = () => res();
            r.onerror = () => res();
          })
      )
    );
  } catch {
    /* ignore */
  }
}

// Privacy on shared phones: forget the token and the cached personal data on sign-out / user switch.
let lastUid: string | null = null;
onAuthStateChanged(auth, (u) => {
  if (!u || (lastUid && u.uid !== lastUid)) {
    token = null;
    emit();
    void clearPersonalCache();
  }
  lastUid = u?.uid || null;
});

// ------------------------------------------------------------------ JSON files
const fileIds = new Map<string, string>();
const q = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

async function findFileId(name: string): Promise<string | null> {
  if (fileIds.has(name)) return fileIds.get(name)!;
  const url = `${API}/files?spaces=appDataFolder&pageSize=1&fields=files(id,name)&q=${encodeURIComponent(`name='${q(name)}' and trashed=false`)}`;
  const j = await (await driveFetch(url)).json();
  const id = j?.files?.[0]?.id || null;
  if (id) fileIds.set(name, id);
  return id;
}

function multipart(meta: Record<string, unknown>, body: Blob | string, contentType: string) {
  const boundary = `ff${Date.now().toString(36)}`;
  const blob = new Blob(
    [`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`, body, `\r\n--${boundary}--`],
    { type: `multipart/related; boundary=${boundary}` }
  );
  return { blob, type: `multipart/related; boundary=${boundary}` };
}

/** Read a JSON file from the appDataFolder (null if it does not exist yet). Updates the cache. */
export async function readJson<T>(name: string): Promise<T | null> {
  const id = await findFileId(name);
  if (!id) return null;
  const data = (await (await driveFetch(`${API}/files/${id}?alt=media`)).json()) as T;
  await cachePut(name, data);
  return data;
}

/** Create or overwrite a JSON file in the appDataFolder. Updates the cache. */
export async function writeJson(name: string, data: unknown): Promise<void> {
  const text = JSON.stringify(data);
  const id = await findFileId(name);
  if (id) {
    await driveFetch(`${UPLOAD}/files/${id}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: text });
  } else {
    const { blob, type } = multipart({ name, parents: ['appDataFolder'], mimeType: 'application/json' }, text, 'application/json');
    const j = await (await driveFetch(`${UPLOAD}/files?uploadType=multipart&fields=id`, { method: 'POST', headers: { 'Content-Type': type }, body: blob })).json();
    if (j?.id) fileIds.set(name, j.id);
  }
  await cachePut(name, data);
}

// ------------------------------------------------------------------ photos
export interface DrivePhoto {
  id: string;
  date: string;
  createdTime: string;
}

export async function listPhotos(scope: string): Promise<DrivePhoto[]> {
  const query = `appProperties has { key='ffKind' and value='progress-photo' } and appProperties has { key='ffScope' and value='${q(scope)}' } and trashed=false`;
  const url = `${API}/files?spaces=appDataFolder&pageSize=200&orderBy=createdTime desc&fields=files(id,createdTime,appProperties)&q=${encodeURIComponent(query)}`;
  const j = await (await driveFetch(url)).json();
  const rows: DrivePhoto[] = (j?.files || []).map((f: any) => ({ id: f.id, createdTime: f.createdTime, date: f.appProperties?.ffDate || String(f.createdTime).slice(0, 10) }));
  await cachePut(`photos:${scope}`, rows);
  return rows;
}

/** Downscale to ≤1280px JPEG before upload (keeps Drive usage and data costs low). */
export async function compressImage(file: File, max = 1280, quality = 0.82): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Could not read image'))), 'image/jpeg', quality));
}

export async function uploadPhoto(scope: string, date: string, jpeg: Blob): Promise<DrivePhoto> {
  const meta = { name: `progress-${date}-${Date.now()}.jpg`, parents: ['appDataFolder'], mimeType: 'image/jpeg', appProperties: { ffKind: 'progress-photo', ffScope: scope, ffDate: date } };
  const { blob, type } = multipart(meta, jpeg, 'image/jpeg');
  const j = await (await driveFetch(`${UPLOAD}/files?uploadType=multipart&fields=id,createdTime`, { method: 'POST', headers: { 'Content-Type': type }, body: blob })).json();
  await blobPut(j.id, jpeg);
  return { id: j.id, date, createdTime: j.createdTime };
}

/** Photo bytes: IndexedDB first, then Drive. */
export async function getPhotoBlob(id: string): Promise<Blob> {
  const cached = await blobGet(id);
  if (cached) return cached;
  const b = await (await driveFetch(`${API}/files/${id}?alt=media`)).blob();
  await blobPut(id, b);
  return b;
}

export async function deleteDriveFile(id: string) {
  await driveFetch(`${API}/files/${id}`, { method: 'DELETE' });
  await idbOp('blobs', 'readwrite', (s) => s.delete(cacheKey(id)));
}
