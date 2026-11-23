import React from 'react';

const CHUNK_RELOAD_STORAGE_KEY = 'ff_chunk_auto_reload_ts';
const CHUNK_RELOAD_COOLDOWN_MS = 30_000;

/**
 * Detects browser errors thrown when a dynamically imported ES module or Vite chunk
 * fails to fetch (e.g. dev-server hiccup, stale deployment hash, or hijacked SW cache).
 */
export function isDynamicImportError(error: unknown): boolean {
  if (!error) return false;
  const message =
    typeof error === 'string'
      ? error
      : (error as { message?: string; name?: string })?.message ||
        (error as { name?: string })?.name ||
        String(error);

  const normalized = message.toLowerCase();
  return (
    normalized.includes('failed to fetch dynamically imported module') ||
    normalized.includes('importing a module script failed') ||
    normalized.includes('error loading dynamically imported module') ||
    normalized.includes('loading chunk') ||
    normalized.includes('chunkloaderror') ||
    normalized.includes('unable to preload css')
  );
}

/**
 * Unregisters any lingering Service Workers and removes stale CacheStorage entries
 * without touching IndexedDB (so registered gyms, logos, and signatures stay intact).
 */
export async function clearStaleServiceWorkersAndCaches(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map((reg) => reg.unregister().catch(() => false))
      );
    }
  } catch {
    // Ignore SW unregister errors in restricted iframes
  }

  try {
    if ('caches' in window) {
      const cacheKeys = await window.caches.keys();
      await Promise.all(
        cacheKeys.map((key) => window.caches.delete(key).catch(() => false))
      );
    }
  } catch {
    // Ignore CacheStorage errors
  }
}

/**
 * Triggers a single guarded page reload to fetch fresh module URLs.
 * Enforces a 30-second cooldown via sessionStorage so an infinite reload loop is impossible.
 */
export async function triggerGuardedModuleReload(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const lastReloadRaw = window.sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY);
    const lastReloadTs = lastReloadRaw ? Number(lastReloadRaw) : 0;
    const now = Date.now();

    if (lastReloadTs && now - lastReloadTs < CHUNK_RELOAD_COOLDOWN_MS) {
      return false;
    }

    window.sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, String(now));
  } catch {
    // Proceed even if sessionStorage is unavailable
  }

  await clearStaleServiceWorkersAndCaches();
  window.location.reload();
  return true;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Drop-in replacement for React.lazy with automatic exponential-backoff retries
 * and self-healing cache recovery if a dynamically imported module fails to fetch.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 3
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    let lastError: unknown;
    const backoffMs = [250, 700, 1400];

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await factory();
      } catch (err) {
        lastError = err;
        const canRetry = attempt < retries;
        if (!canRetry) break;

        if (isDynamicImportError(err)) {
          await clearStaleServiceWorkersAndCaches();
        }
        await wait(backoffMs[attempt] ?? 1000);
      }
    }

    if (isDynamicImportError(lastError)) {
      const reloaded = await triggerGuardedModuleReload();
      if (reloaded) {
        // Keep Suspense mounted briefly while the browser reloads
        return new Promise<{ default: T }>(() => {});
      }
    }

    throw lastError;
  });
}
