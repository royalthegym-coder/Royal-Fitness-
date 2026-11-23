/** Credentials are kept only in this page's memory, never in browser storage.
 * A server-side proxy is required for durable production credentials.
 */
export type RuntimeSecretName =
    | 'huggingface_api_key'
    | 'github_token'
    | 'whatsapp_access_token'
    | 'whatsapp_phone_id'
    | 'google_api_key'
    | 'openai_api_key';

const runtimeSecrets = new Map<RuntimeSecretName, string>();

export const setRuntimeSecret = (name: RuntimeSecretName, value: string): void => {
    if (value) runtimeSecrets.set(name, value);
    else runtimeSecrets.delete(name);
};

export const getRuntimeSecret = (name: RuntimeSecretName): string => runtimeSecrets.get(name) || '';

const LEGACY_SENSITIVE_KEYS = [
    'HUGGINGFACE_API_KEY',
    'github_token',
    'whatsapp_access_token',
    'whatsapp_phone_id',
    'google_api_key',
    'OPENAI_API_KEY',
    'royal_gym_lat',
    'royal_gym_lng',
];

/** Remove the exact legacy keys that this app previously stored in plaintext. */
export const clearLegacySensitiveStorage = (): void => {
    if (typeof window === 'undefined') return;
    try {
        LEGACY_SENSITIVE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    } catch {
        // Storage may be disabled by the browser; credentials still remain memory-only.
    }
};
