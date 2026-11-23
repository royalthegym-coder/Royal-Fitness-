import { useState, useEffect, useCallback, useRef } from 'react';

export type NetworkConnectivityStatus = 'online' | 'offline' | 'syncing';

export interface UseNetworkStatusOptions {
    detailed?: boolean;
    externalSyncing?: boolean;
    syncDurationMs?: number;
}

export interface NetworkStatusDetails {
    isOnline: boolean;
    isSyncing: boolean;
    status: NetworkConnectivityStatus;
    lastSyncedAt: string;
    latencyMs: number;
    simulatedStatus: NetworkConnectivityStatus | 'auto';
    setSimulatedStatus: (mode: NetworkConnectivityStatus | 'auto') => void;
    triggerSync: () => void;
}

export function useNetworkStatus(): boolean;
export function useNetworkStatus(options: UseNetworkStatusOptions & { detailed: true }): NetworkStatusDetails;
export function useNetworkStatus(options?: UseNetworkStatusOptions): boolean | NetworkStatusDetails {
    const [browserOnline, setBrowserOnline] = useState<boolean>(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );
    const [internalSyncing, setInternalSyncing] = useState<boolean>(false);
    const [simulatedStatus, setSimulatedStatus] = useState<NetworkConnectivityStatus | 'auto'>('auto');
    const [lastSyncedAt, setLastSyncedAt] = useState<string>(() =>
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
    const [latencyMs, setLatencyMs] = useState<number>(18);
    const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const syncDuration = options?.syncDurationMs ?? 1800;

    const triggerSync = useCallback(() => {
        if (syncTimerRef.current) {
            clearTimeout(syncTimerRef.current);
        }
        setInternalSyncing(true);
        syncTimerRef.current = setTimeout(() => {
            setInternalSyncing(false);
            setLastSyncedAt(
                new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            );
            setLatencyMs(Math.floor(12 + Math.random() * 14));
        }, syncDuration);
    }, [syncDuration]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleOnline = () => {
            setBrowserOnline(true);
            triggerSync();
        };

        const handleOffline = () => {
            if (syncTimerRef.current) {
                clearTimeout(syncTimerRef.current);
            }
            setInternalSyncing(false);
            setBrowserOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (syncTimerRef.current) {
                clearTimeout(syncTimerRef.current);
            }
        };
    }, [triggerSync]);

    const effectiveSyncing =
        simulatedStatus === 'syncing' ||
        (simulatedStatus === 'auto' && browserOnline && (internalSyncing || Boolean(options?.externalSyncing)));

    const effectiveOnline =
        simulatedStatus === 'offline'
            ? false
            : simulatedStatus === 'online' || simulatedStatus === 'syncing'
            ? true
            : browserOnline;

    const status: NetworkConnectivityStatus = !effectiveOnline
        ? 'offline'
        : effectiveSyncing
        ? 'syncing'
        : 'online';

    if (options?.detailed) {
        return {
            isOnline: effectiveOnline,
            isSyncing: effectiveSyncing,
            status,
            lastSyncedAt,
            latencyMs: effectiveOnline ? latencyMs : 0,
            simulatedStatus,
            setSimulatedStatus,
            triggerSync,
        };
    }

    return effectiveOnline;
}

