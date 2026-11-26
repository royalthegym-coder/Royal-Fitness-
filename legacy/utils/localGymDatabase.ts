/**
 * Persistent Local Database (IndexedDB with localStorage fallback) for Registered Gyms.
 * Stores gym identity, owner contact details, UPI ID, Google Maps location,
 * gym logo data URL, and owner digital signature data URL across browser sessions.
 */

export interface GymSocialLinks {
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
}

export interface RegisteredGymRecord {
  gymId: string;
  gymName: string;
  ownerName: string;
  email: string;
  mobileNumber: string;
  upiId: string;
  address: string;
  googleLocationUrl: string;
  logoDataUrl: string;
  signatureDataUrl: string;
  socialLinks?: GymSocialLinks;
  createdAt: string;
  updatedAt: string;
}

const DB_NAME = 'FitnessFutureGymDB';
const DB_VERSION = 1;
const STORE_NAME = 'registered_gyms';
const FALLBACK_STORAGE_KEY = 'fitness_future_local_gyms_db_v1';

const isIndexedDBAvailable = (): boolean =>
  typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

/**
 * Opens (or initializes) the IndexedDB database and ensures object store + indexes exist.
 */
const openGymDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'gymId' });
        store.createIndex('email', 'email', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error('Failed to open local gym database'));
  });
};

const readFallbackStorage = (): RegisteredGymRecord[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FALLBACK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeFallbackStorage = (records: RegisteredGymRecord[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // IndexedDB remains the primary store when localStorage reaches its 5 MB quota
  }
};

/**
 * Inserts or updates a registered gym record in IndexedDB (and mirrors to localStorage).
 */
export const saveRegisteredGymToLocalDB = async (
  record: RegisteredGymRecord
): Promise<RegisteredGymRecord> => {
  const nowIso = new Date().toISOString();
  const normalized: RegisteredGymRecord = {
    ...record,
    gymId:
      record.gymId || `gym_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: record.createdAt || nowIso,
    updatedAt: nowIso,
  };

  // Keep fallback mirror updated
  const fallbackList = readFallbackStorage();
  const existingIdx = fallbackList.findIndex((r) => r.gymId === normalized.gymId);
  if (existingIdx >= 0) {
    fallbackList[existingIdx] = normalized;
  } else {
    fallbackList.unshift(normalized);
  }
  writeFallbackStorage(fallbackList);

  if (!isIndexedDBAvailable()) {
    return normalized;
  }

  try {
    const db = await openGymDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(normalized);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    console.warn('IndexedDB write failed; kept record in localStorage fallback:', err);
  }

  return normalized;
};

/**
 * Loads all registered gym records sorted by most recently updated.
 */
export const getAllRegisteredGymsFromLocalDB = async (): Promise<
  RegisteredGymRecord[]
> => {
  if (!isIndexedDBAvailable()) {
    return readFallbackStorage();
  }

  try {
    const db = await openGymDB();
    const records = await new Promise<RegisteredGymRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve((req.result as RegisteredGymRecord[]) || []);
      req.onerror = () => reject(req.error);
    });
    db.close();

    const sorted = records.sort((a, b) =>
      (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt)
    );
    return sorted.length > 0 ? sorted : readFallbackStorage();
  } catch (err) {
    console.warn('IndexedDB read failed; falling back to localStorage:', err);
    return readFallbackStorage();
  }
};

/**
 * Fetches a single registered gym by its ID.
 */
export const getRegisteredGymByIdFromLocalDB = async (
  gymId: string
): Promise<RegisteredGymRecord | undefined> => {
  const all = await getAllRegisteredGymsFromLocalDB();
  return all.find((r) => r.gymId === gymId);
};

/**
 * Removes a registered gym record from IndexedDB and localStorage fallback.
 */
export const deleteRegisteredGymFromLocalDB = async (
  gymId: string
): Promise<void> => {
  const remaining = readFallbackStorage().filter((r) => r.gymId !== gymId);
  writeFallbackStorage(remaining);

  if (!isIndexedDBAvailable()) return;

  try {
    const db = await openGymDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(gymId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    console.warn('IndexedDB delete failed:', err);
  }
};
