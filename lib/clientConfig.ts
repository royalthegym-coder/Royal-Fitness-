/**
 * Client Configuration Service - Secure Server-Side Fetching Mechanism
 * Fetches required configuration variables dynamically from the backend server (/api/config/client-env)
 * so sensitive environment variables and keys are never baked into the static client bundle.
 */

export interface ClientConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  edgeGatewayUrl: string;
  merchantUpi: string;
  razorpayKeyId: string;
}

const DEFAULT_CONFIG: ClientConfig = {
  supabaseUrl: 'https://placeholder-project.supabase.co',
  supabaseAnonKey: 'placeholder-anon-key',
  edgeGatewayUrl: 'https://fitness-future-edge.yourdomain.workers.dev',
  merchantUpi: 'your-upi@bank',
  razorpayKeyId: ''
};

let cachedConfig: ClientConfig = { ...DEFAULT_CONFIG };
let configPromise: Promise<ClientConfig> | null = null;
const listeners: Array<(config: ClientConfig) => void> = [];

export function getClientConfig(): ClientConfig {
  return cachedConfig;
}

export async function fetchClientConfig(): Promise<ClientConfig> {
  if (configPromise) return configPromise;

  configPromise = (async () => {
    try {
      const res = await fetch('/api/config/client-env');
      if (res.ok) {
        const data = await res.json();
        cachedConfig = {
          supabaseUrl: data.supabaseUrl || DEFAULT_CONFIG.supabaseUrl,
          supabaseAnonKey: data.supabaseAnonKey || DEFAULT_CONFIG.supabaseAnonKey,
          edgeGatewayUrl: data.edgeGatewayUrl || DEFAULT_CONFIG.edgeGatewayUrl,
          merchantUpi: data.merchantUpi || DEFAULT_CONFIG.merchantUpi,
          razorpayKeyId: data.razorpayKeyId || DEFAULT_CONFIG.razorpayKeyId,
        };
        listeners.forEach(fn => fn(cachedConfig));
      }
    } catch (err) {
      console.warn('[ClientConfig] Falling back to initial local configuration:', err);
    }
    return cachedConfig;
  })();

  return configPromise;
}

export function onConfigLoaded(listener: (config: ClientConfig) => void): () => void {
  listeners.push(listener);
  listener(cachedConfig);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

// Automatically trigger server-side fetch on load in browser environment
if (typeof window !== 'undefined') {
  fetchClientConfig().catch(() => {});
}
