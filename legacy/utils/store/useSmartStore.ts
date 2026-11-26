import { createStore } from 'zustand/vanilla';
import { useSyncExternalStore, useCallback } from 'react';
import { useSaasNetworkStore } from './saasNetworkStore';

export interface WorkoutLog {
    id: string;
    memberId: string;
    exerciseName: string;
    weightLifted: number;
    repsDone: number;
    calculated1RM: number;
    loggedAt: string;
}

export interface CrowdMetrics {
    currentHeadcount: number;
    maxCapacity: number;
    status: 'optimal' | 'crowded' | 'full';
    branchName: string;
}

interface SmartStore {
    workoutLogs: WorkoutLog[];
    crowdMetrics: CrowdMetrics;
    addWorkoutLog: (log: Omit<WorkoutLog, 'id' | 'calculated1RM'>) => void;
    setWorkoutLogs: (logs: WorkoutLog[]) => void;
    updateCrowd: (count: number) => void;
}

// Epley Formula: 1RM = W * (1 + 0.0333 * R)
export const calculate1RM = (weight: number, reps: number): number => {
    return Math.round(weight * (1 + 0.0333 * reps) * 100) / 100;
};

export const smartStore = createStore<SmartStore>((set) => ({
    workoutLogs: [
        {
            id: '1',
            memberId: '22222222-2222-2222-2222-222222222222',
            exerciseName: 'Squats',
            weightLifted: 80,
            repsDone: 10,
            calculated1RM: 106.67,
            loggedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: '2',
            memberId: '22222222-2222-2222-2222-222222222222',
            exerciseName: 'Squats',
            weightLifted: 85,
            repsDone: 8,
            calculated1RM: 107.67,
            loggedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: '3',
            memberId: '22222222-2222-2222-2222-222222222222',
            exerciseName: 'Squats',
            weightLifted: 90,
            repsDone: 6,
            calculated1RM: 108.00,
            loggedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: '4',
            memberId: '22222222-2222-2222-2222-222222222222',
            exerciseName: 'Squats',
            weightLifted: 95,
            repsDone: 5,
            calculated1RM: 110.83,
            loggedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: '5',
            memberId: '22222222-2222-2222-2222-222222222222',
            exerciseName: 'Squats',
            weightLifted: 100,
            repsDone: 4,
            calculated1RM: 113.33,
            loggedAt: new Date().toISOString(),
        }
    ],
    crowdMetrics: {
        currentHeadcount: 18,
        maxCapacity: 40,
        status: 'optimal',
        branchName: 'FITNESS FUTURE - HQ'
    },
    addWorkoutLog: (log) => set((state) => {
        const calculated1RM = calculate1RM(log.weightLifted, log.repsDone);
        const newLog: WorkoutLog = {
            ...log,
            id: String(Date.now()),
            calculated1RM
        };
        return { workoutLogs: [...state.workoutLogs, newLog] };
    }),
    setWorkoutLogs: (logs) => set({ workoutLogs: logs }),
    updateCrowd: (count) => set((state) => {
        const capacity = state.crowdMetrics.maxCapacity;
        const status = count >= capacity ? 'full' : count > capacity * 0.8 ? 'crowded' : 'optimal';
        
        // Dynamic synchronization with SaaS Network Store to prevent layout drifts
        try {
            const saasStore = useSaasNetworkStore.getState();
            const hqBranch = saasStore.branches.find(b => b.id === 'branch-jjn-hq');
            if (hqBranch && hqBranch.currentCrowdCount !== count) {
                saasStore.updateCrowdCount('branch-jjn-hq', count);
            }
        } catch (e) {
            console.warn("SaaS Store sync skipped during early initialization:", e);
        }

        return {
            crowdMetrics: {
                ...state.crowdMetrics,
                currentHeadcount: count,
                status
            }
        };
    })
}));

export const useSmartStore = Object.assign(
    function useSmartStoreHook<U = SmartStore>(selector?: (state: SmartStore) => U): U {
        const sel = selector || ((s: SmartStore) => s as unknown as U);
        return useSyncExternalStore(
            smartStore.subscribe,
            useCallback(() => sel(smartStore.getState()), [sel]),
            useCallback(() => sel(smartStore.getInitialState()), [sel])
        );
    },
    smartStore
);
