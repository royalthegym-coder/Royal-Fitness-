/**
 * Firebase bootstrap (Spark / free plan only):
 *   - Firebase Auth (email+password, Google; phone OTP behind a flag because SMS needs Blaze)
 *   - Cloud Firestore with persistent offline cache (IndexedDB, multi-tab)
 * No Cloud Storage (requires Blaze since Feb 2026) and no Cloud Functions.
 *
 * The legacy helper exports at the bottom (syncToFirebase, subscribeToCollection, ...) are kept
 * so the many hidden experimental modules still compile. They no longer bypass security:
 * every read/write is checked by firestore.rules.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  browserPopupRedirectResolver,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  where,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { FIRESTORE_DATABASE_ID, SUPER_ADMIN_EMAIL, isSuperAdminEmail } from './config';
import { useSessionStore } from './session';

try {
  setLogLevel('error');
} catch {
  /* ignore */
}

const { firestoreDatabaseId: _ignoredDbId, oAuthClientId: _ignoredOAuth, recaptchaSiteKey: _ignoredRecaptcha, ...jsonFirebaseConfig } = firebaseConfig as any;

// Firebase web config is public by design (it identifies the project; security comes from
// Auth + Firestore rules). VITE_FIREBASE_* env vars override the bundled JSON when set.
const viteEnv = (import.meta as any).env || {};
const pick = (key: string, fallback: any) => (viteEnv[key] ? String(viteEnv[key]) : fallback);
const publicFirebaseConfig = {
  ...jsonFirebaseConfig,
  apiKey: pick('VITE_FIREBASE_API_KEY', jsonFirebaseConfig.apiKey),
  authDomain: pick('VITE_FIREBASE_AUTH_DOMAIN', jsonFirebaseConfig.authDomain),
  projectId: pick('VITE_FIREBASE_PROJECT_ID', jsonFirebaseConfig.projectId),
  storageBucket: pick('VITE_FIREBASE_STORAGE_BUCKET', jsonFirebaseConfig.storageBucket),
  messagingSenderId: pick('VITE_FIREBASE_MESSAGING_SENDER_ID', jsonFirebaseConfig.messagingSenderId),
  appId: pick('VITE_FIREBASE_APP_ID', jsonFirebaseConfig.appId),
  measurementId: pick('VITE_FIREBASE_MEASUREMENT_ID', jsonFirebaseConfig.measurementId),
};

export const app = getApps().length > 0 ? getApp() : initializeApp(publicFirebaseConfig);
export const auth = getAuth(app);

function initDb(): Firestore {
  const dbId = FIRESTORE_DATABASE_ID === '(default)' ? undefined : FIRESTORE_DATABASE_ID;
  try {
    const settings = {
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    };
    return dbId ? initializeFirestore(app, settings, dbId) : initializeFirestore(app, settings);
  } catch {
    return dbId ? getFirestore(app, dbId) : getFirestore(app);
  }
}

export const db = initDb();

/** Kept for type compatibility with older callers. */
export type PortalRole = 'super_admin' | 'admin' | 'trainer' | 'member';

/** Only the configured platform owner email. Never grants access by itself: rules re-check token + MFA. */
export const isVerifiedOwnerEmail = (email?: string | null): boolean => isSuperAdminEmail(email);

export function sanitizeFirestoreDocId(rawId: unknown): string {
  const str = String(rawId ?? '').trim();
  const cleaned = str.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned.length > 0 ? cleaned : `doc_${Date.now()}`;
}

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
  return result.user;
};

export const signOutFirebaseUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn('Firebase signOut warning:', error);
  }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => onAuthStateChanged(auth, callback);

/**
 * Read-only role lookup (never writes, never escalates).
 * super_admin is derived from the verified ID token; everybody else from users/{uid}.
 */
export const resolveUserPortalRole = async (
  user: User,
  _intendedPortal?: string | null
): Promise<{ role: PortalRole | 'none'; status: string; source: 'token' | 'firestore' | 'none'; userDoc: Record<string, any> | null }> => {
  if (isSuperAdminEmail(user.email) && user.emailVerified) {
    return { role: 'super_admin', status: 'active', source: 'token', userDoc: null };
  }
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) {
      const data = snap.data();
      return { role: data.role, status: data.status || 'pending', source: 'firestore', userDoc: data };
    }
  } catch (err) {
    console.warn('[auth] role lookup failed', err);
  }
  return { role: 'none', status: 'none', source: 'none', userDoc: null };
};

// ---- Compatibility types/helpers for hidden legacy modules ----
export interface FirebaseTokenClaims {
  [key: string]: any;
}
/** Only one platform owner exists now; kept as an array for legacy imports. */
export const BOOTSTRAPPED_SUPER_ADMIN_EMAILS: string[] = [SUPER_ADMIN_EMAIL];
export const getVerifiedUserTokenClaims = async (user: User, forceRefresh = false) => {
  const tokenResult = await user.getIdTokenResult(forceRefresh);
  const claims = (tokenResult.claims || {}) as FirebaseTokenClaims;
  const isOwner = isSuperAdminEmail(user.email) && user.emailVerified;
  return {
    claims,
    hasAdminClaim: isOwner,
    hasSuperAdminClaim: isOwner,
    tokenResult,
    isBootstrappedSuperAdmin: isOwner,
  };
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const msg = error instanceof Error ? error.message : String(error);
  console.warn(`[Firestore] ${operationType} ${path ?? ''} failed: ${msg}`);
}

// ---------------------------------------------------------------------------
// Legacy compatibility helpers (used by hidden experimental modules).
// They automatically stamp the caller's gymId so tenant rules can evaluate.
// ---------------------------------------------------------------------------

function currentGymId(): string | null {
  return useSessionStore.getState().activeGymId;
}

export const syncToFirebase = async (collectionName: string, docId: string, data: any) => {
  const safeId = sanitizeFirestoreDocId(docId);
  const gymId = data?.gymId || currentGymId();
  try {
    await setDoc(doc(db, collectionName, safeId), { ...data, ...(gymId ? { gymId } : {}) }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${safeId}`);
  }
};

export const deleteFromFirebase = async (collectionName: string, docId: string) => {
  const safeId = sanitizeFirestoreDocId(docId);
  try {
    await deleteDoc(doc(db, collectionName, safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${safeId}`);
  }
};

export const getDocumentFromFirebase = async (collectionName: string, docId: string): Promise<any | null> => {
  const safeId = sanitizeFirestoreDocId(docId);
  try {
    const snap = await getDoc(doc(db, collectionName, safeId));
    return snap.exists() ? { ...snap.data(), id: snap.data().id ?? snap.id } : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${collectionName}/${safeId}`);
    return null;
  }
};

function gymScopedQuery(collectionName: string) {
  const gymId = currentGymId();
  const col = collection(db, collectionName);
  return gymId ? query(col, where('gymId', '==', gymId)) : col;
}

export const fetchCollectionFromFirebase = async (collectionName: string): Promise<any[]> => {
  try {
    const snapshot = await getDocs(gymScopedQuery(collectionName));
    return snapshot.docs.map((d) => ({ ...d.data(), id: d.data().id ?? d.id }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionName);
    return [];
  }
};

export const subscribeToDocument = (collectionName: string, docId: string, callback: (data: any) => void) => {
  const safeId = sanitizeFirestoreDocId(docId);
  return onSnapshot(
    doc(db, collectionName, safeId),
    (docSnap) => {
      if (docSnap.exists()) callback(docSnap.data());
    },
    (error) => handleFirestoreError(error, OperationType.GET, `${collectionName}/${safeId}`)
  );
};

export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void) =>
  onSnapshot(
    gymScopedQuery(collectionName),
    (snapshot) => callback(snapshot.docs.map((d) => ({ ...d.data(), id: d.data().id ?? d.id }))),
    (error) => handleFirestoreError(error, OperationType.LIST, collectionName)
  );

/**
 * Cloud Storage requires the Blaze plan (since Feb 2026), so avatars are kept as a
 * compressed data URL on the Firestore document instead. Returns the data URL unchanged.
 */
export const uploadProfilePicture = async (_userId: string, base64Image: string) => base64Image;
