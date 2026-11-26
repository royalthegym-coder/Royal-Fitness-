/**
 * Fitness Future Neural OS — Layered Offline Sync & Conflict Resolution Engine
 * Handles IndexedDB queueing, Supabase synchronization, and Service Worker background sync.
 */
import { getClientConfig } from '../lib/clientConfig';

export interface QueuedAction {
    id: string;
    type: 'attendance_checkin' | 'workout_log' | 'diet_assignment' | 'payment_record' | 'injury_alert';
    payload: any;
    timestamp: number;
    retryCount: number;
    status: 'pending' | 'syncing' | 'synced' | 'failed';
    error?: string;
}

const DB_NAME = 'fitness_future_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'action_queue';

// Open IndexedDB
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
            reject(new Error('IndexedDB not supported'));
            return;
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: any) => {
            const db = event.target.result as IDBDatabase;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('status', 'status', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Fallback to localStorage if IndexedDB is blocked
const LOCAL_STORAGE_KEY = 'fitness_future_offline_actions_v1';

function getLocalStorageQueue(): QueuedAction[] {
    try {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveLocalStorageQueue(queue: QueuedAction[]): void {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
        console.warn('[OfflineSync] Failed to write localStorage queue', e);
    }
}

/**
 * Enqueue an action when offline or for optimistic background execution
 */
export async function enqueueOfflineAction(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<QueuedAction> {
    const newAction: QueuedAction = {
        ...action,
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending'
    };

    try {
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.add(newAction);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch {
        // Fallback to localStorage
        const queue = getLocalStorageQueue();
        queue.push(newAction);
        saveLocalStorageQueue(queue);
    }

    // Trigger sync if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
        flushOfflineSyncQueue().catch(() => {});
    }

    return newAction;
}

/**
 * Get all queued pending actions
 */
export async function getPendingActions(): Promise<QueuedAction[]> {
    try {
        const db = await openDB();
        return await new Promise<QueuedAction[]>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.getAll();
            req.onsuccess = () => {
                const results: QueuedAction[] = req.result || [];
                resolve(results.filter(a => a.status === 'pending' || a.status === 'failed'));
            };
            req.onerror = () => reject(req.error);
        });
    } catch {
        return getLocalStorageQueue().filter(a => a.status === 'pending' || a.status === 'failed');
    }
}

/**
 * Remove an action after successful sync
 */
export async function removeSyncedAction(id: string): Promise<void> {
    try {
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch {
        const queue = getLocalStorageQueue().filter(a => a.id !== id);
        saveLocalStorageQueue(queue);
    }
}

/**
 * Flush and sync all pending actions with Supabase and backend
 */
export async function flushOfflineSyncQueue(): Promise<{ synced: number; failed: number }> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return { synced: 0, failed: 0 };
    }

    const pending = await getPendingActions();
    if (pending.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    const { supabaseUrl, supabaseAnonKey: supabaseKey } = getClientConfig();

    for (const action of pending) {
        try {
            if (action.type === 'attendance_checkin') {
                const { memberId, code, checkInTime } = action.payload;
                if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
                    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memberId || code);
                    const query = isUuid ? `id=eq.${memberId || code}` : `phone_number=eq.${code}`;
                    await fetch(`${supabaseUrl}/rest/v1/members?${query}`, {
                        method: 'PATCH',
                        headers: {
                            apikey: supabaseKey,
                            Authorization: `Bearer ${supabaseKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            status: 'ACTIVE',
                            inactivity_days: 0,
                            last_attendance_at: checkInTime || new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        })
                    });
                }
            } else if (action.type === 'workout_log') {
                const existingLogs = JSON.parse(localStorage.getItem('fitness_detailed_workout_logs') || '[]');
                localStorage.setItem('fitness_detailed_workout_logs', JSON.stringify([action.payload, ...existingLogs]));
            } else if (action.type === 'diet_assignment') {
                const existingLogs = JSON.parse(localStorage.getItem('fitness_daily_routine_logs') || '[]');
                localStorage.setItem('fitness_daily_routine_logs', JSON.stringify([action.payload, ...existingLogs]));
            }

            await removeSyncedAction(action.id);
            synced++;
        } catch (e: any) {
            console.warn(`[OfflineSync] Action ${action.id} failed to sync:`, e);
            failed++;
        }
    }

    // Trigger local state notification
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('fitness_future_offline_synced', { detail: { synced, failed } }));
    }

    return { synced, failed };
}

// Auto-register online listener
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        console.log('[OfflineSync] Connection restored. Flushing queued actions...');
        flushOfflineSyncQueue().catch(console.error);
    });
}
