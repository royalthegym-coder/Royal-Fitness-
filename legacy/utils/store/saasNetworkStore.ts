import { createStore } from 'zustand/vanilla';
import { useSyncExternalStore, useCallback } from 'react';
import { useSmartStore } from './useSmartStore';

export interface GymBranch {
  id: string;
  name: string;
  currentCrowdCount: number;
  maxCapacity: number;
  status: 'optimal' | 'crowded' | 'full';
  location: string;
  activeCoachesCount: number;
}

interface SaasNetworkState {
  branches: GymBranch[];
  activeBranchId: string | null;
  setActiveBranch: (id: string) => void;
  updateCrowdCount: (id: string, count: number) => void;
  addNewBranch: (name: string, location: string, maxCapacity: number) => void;
}

export const saasNetworkStore = createStore<SaasNetworkState>((set) => ({
  branches: [
    { id: 'branch-ff-hq', name: 'FITNESS FUTURE - Primary HQ', currentCrowdCount: 0, maxCapacity: 60, status: 'optimal', location: 'Configure branch address in Settings', activeCoachesCount: 0 }
  ],
  activeBranchId: 'branch-ff-hq',
  setActiveBranch: (id) => set({ activeBranchId: id }),
  updateCrowdCount: (id, count) => set((state) => {
    // Bidirectional sync with Neural Crowd Radar
    try {
      if (id === 'branch-ff-hq') {
        const neuralStore = useSmartStore.getState();
        if (neuralStore.crowdMetrics.currentHeadcount !== count) {
          neuralStore.updateCrowd(count);
        }
      }
    } catch (e) {
      console.warn("Neural Store sync skipped during early initialization:", e);
    }

    return {
      branches: state.branches.map((b) => {
        if (b.id === id) {
          const status = count >= b.maxCapacity ? 'full' : count > b.maxCapacity * 0.8 ? 'crowded' : 'optimal';
          return { ...b, currentCrowdCount: count, status };
        }
        return b;
      })
    };
  }),
  addNewBranch: (name, location, maxCapacity) => set((state) => {
    const id = `branch-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.floor(Math.random() * 1000)}`;
    const newBranch: GymBranch = {
      id,
      name,
      location,
      currentCrowdCount: 0,
      maxCapacity,
      status: 'optimal',
      activeCoachesCount: 1
    };
    return {
      branches: [...state.branches, newBranch]
    };
  })
}));

export const useSaasNetworkStore = Object.assign(
  function useSaasNetworkStoreHook<U = SaasNetworkState>(selector?: (state: SaasNetworkState) => U): U {
    const sel = selector || ((s: SaasNetworkState) => s as unknown as U);
    return useSyncExternalStore(
      saasNetworkStore.subscribe,
      useCallback(() => sel(saasNetworkStore.getState()), [sel]),
      useCallback(() => sel(saasNetworkStore.getInitialState()), [sel])
    );
  },
  saasNetworkStore
);
