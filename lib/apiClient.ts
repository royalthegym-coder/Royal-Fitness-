/**
 * The ONE client for server-side actions. Every call goes to the Cloudflare Worker
 * (VITE_WORKER_URL) with the caller's Firebase ID token; the Worker verifies the token,
 * reads the role from Firestore and rate-limits per user before touching any secret.
 * No API keys or tokens ever live in the browser or localStorage.
 */
import { auth } from './firebase';
import { WORKER_URL } from './config';

export interface WorkerResult<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export async function workerFetch<T = any>(
  path: string,
  init: { method?: 'GET' | 'POST'; body?: unknown; timeoutMs?: number } = {}
): Promise<WorkerResult<T>> {
  if (!WORKER_URL) {
    return { ok: false, status: 503, error: 'Server functions are not configured (VITE_WORKER_URL is empty).' };
  }
  const user = auth.currentUser;
  if (!user) return { ok: false, status: 401, error: 'Please sign in first.' };

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), init.timeoutMs ?? 20000);
  try {
    const token = await user.getIdToken();
    const res = await fetch(`${WORKER_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      method: init.method || (init.body !== undefined ? 'POST' : 'GET'),
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, status: res.status, data: json, error: json?.error || `Request failed (${res.status})` };
    }
    return { ok: true, status: res.status, data: json as T };
  } catch (err: any) {
    return { ok: false, status: 0, error: err?.name === 'AbortError' ? 'Request timed out.' : 'Unable to reach the server.' };
  } finally {
    window.clearTimeout(timer);
  }
}
