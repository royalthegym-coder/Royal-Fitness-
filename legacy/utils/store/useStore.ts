import { useSyncExternalStore, useCallback } from 'react';
import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';

export interface TenantConfig {
    gymId: string;
    gymName: string;
    logoUrl: string;
    themeColor: string;
    upiId: string;
}

interface AppState {
    tenant: TenantConfig | null;
    setTenant: (tenant: TenantConfig) => void;
    isSidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
    activeComponent: string;
    setActiveComponent: (comp: string) => void;
}

export const appStore = createStore<AppState>()(
    persist(
        (set) => ({
            tenant: null,
            setTenant: (tenant) => set({ tenant }),
            
            isSidebarOpen: false,
            setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),

            activeComponent: 'Dashboard',
            setActiveComponent: (activeComponent) => set({ activeComponent })
        }),
        {
            name: 'fitness-fitness-storage',
            partialize: (state) => ({ tenant: state.tenant }),
        }
    )
);

function useStoreHook(): AppState;
function useStoreHook<T>(selector: (state: AppState) => T): T;
function useStoreHook<T>(selector?: (state: AppState) => T) {
    const getSnapshot = useCallback(
        () => (selector ? selector(appStore.getState()) : appStore.getState()),
        [selector]
    );
    return useSyncExternalStore(appStore.subscribe, getSnapshot, getSnapshot);
}

export const useStore = Object.assign(useStoreHook, {
    getState: appStore.getState,
    setState: appStore.setState,
    subscribe: appStore.subscribe,
});

