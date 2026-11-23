// Purge legacy, insecure client-side state from v0.0.x (forgeable sessions, plaintext
// member records, secrets/tokens). Sessions now come only from Firebase Auth.
try {
  const LEGACY_KEYS = [
    'member_session', 'fitness_admin_session', 'intended_portal_type', 'whatsapp_access_token',
    'HUGGINGFACE_API_KEY', 'branded_github_token', 'branded_apple_api_key_id', 'registered_admin_biometric',
    'webauthn_credential_id', 'webauthn_credential_raw_id', 'superadmin_global_override', 'superadmin_member_governance',
    'fitness_members', 'fitness_invoices', 'fitness_transactions', 'fitness_staff', 'fitness_expenses', 'fitness_leads',
    'fitness_attendance', 'fitness_offers', 'fitness_reviews', 'fitness_workout_templates', 'fitness_diet_plans',
    'fitness_packages_v5', 'fitness_audit_logs', 'fitness_whatsapp_logs', 'registered_gym_tenants', 'tenant_gym_config',
    'gyms_list_evolution',
  ];
  if (!localStorage.getItem('ff_v2_purged')) {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem('ff_v2_purged', '1');
  }
} catch {
  /* storage unavailable */
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from '../utils/components/App';
import '../index.css';

import {
  clearStaleServiceWorkersAndCaches,
  triggerGuardedModuleReload,
} from '../utils/lazyWithRetry';

// Recover automatically if Vite encounters a stale preloaded chunk after a rebuild/deploy
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    void triggerGuardedModuleReload();
  });
}

// Service Worker lifecycle:
// - In DEV mode, actively unregister any previously installed dev Service Worker and wipe stale caches
//   so Vite's raw ESM module requests (.tsx/.ts) are never hijacked or served stale HTML.
// - In PROD mode, register the auto-updating PWA Service Worker for Android, iOS & Offline-First Sync.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    void clearStaleServiceWorkersAndCaches();
  } else if (import.meta.env.PROD) {
    let hasTriggeredUpdate = false;
    const updateSW = registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;

        const checkForUpdates = () => {
          if (navigator.onLine) {
            registration.update().catch(() => {
              // Silent retry on next online cycle
            });
          }
        };

        // Auto-check whenever internet reconnects or app returns to foreground
        window.addEventListener('online', () => {
          checkForUpdates();
        });
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            checkForUpdates();
          }
        });

        // Periodic background update check every 15 minutes while online
        window.setInterval(checkForUpdates, 15 * 60 * 1000);
      },
      onNeedRefresh() {
        if (hasTriggeredUpdate) return;
        hasTriggeredUpdate = true;
        updateSW(true)
          .then(() => {
            window.dispatchEvent(new Event('fitness-app-updated'));
          })
          .catch(() => {
            hasTriggeredUpdate = false;
          });
      },
      onOfflineReady() {
        console.info('[Fitness Future] Offline cache ready.');
      },
    });

  }
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
