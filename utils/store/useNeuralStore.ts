import { useSyncExternalStore, useCallback } from 'react';
import { createStore } from 'zustand/vanilla';
import { pipeline, env } from '@xenova/transformers';

// Disable local models loading. Use Hugging Face Hub instead.
env.allowLocalModels = false;

interface WorkoutLogParams {
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
}

interface NeuralStoreState {
  isWebGPUSupported: boolean;
  isModelLoading: boolean;
  isModelReady: boolean;
  classificationEngine: any;
  checkWebGPUAndInit: () => Promise<void>;
  parseWorkoutLogLocal: (log: string) => Promise<WorkoutLogParams | null>;
  fallbackToN8nQueue: (log: string) => Promise<WorkoutLogParams | null>;
}

export const neuralStore = createStore<NeuralStoreState>((set, get) => ({
  isWebGPUSupported: false,
  isModelLoading: false,
  isModelReady: false,
  classificationEngine: null,

  checkWebGPUAndInit: async () => {
    // Check WebGPU Accessibility
    const gpuSupported = "gpu" in navigator;
    set({ isWebGPUSupported: gpuSupported });

    if (!gpuSupported) {
      console.warn("[NeuralStore] WebGPU is not supported on this device. Fallback to n8n router active.");
      return;
    }

    try {
      set({ isModelLoading: true });
      console.log("[NeuralStore] WebGPU Detected. Initializing Client-Side Transformers...");
      
      const classifier = await pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli', {
        device: 'webgpu' as any
      } as any).catch(e => {
         console.warn("[NeuralStore] WebGPU startup issue or model failed to load, falling back to WebGL/WASM", e);
         return pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli');
      });

      set({ 
        classificationEngine: classifier, 
        isModelReady: true,
        isModelLoading: false 
      });
      console.log("[NeuralStore] Local Neural Engine Loaded Successfully in Memory (Zero HTTP API usage).");
    } catch (error) {
      console.error("[NeuralStore] Failed to load local model:", error);
      set({ isModelLoading: false, isModelReady: false });
    }
  },

  parseWorkoutLogLocal: async (log: string) => {
    const { isModelReady, classificationEngine, fallbackToN8nQueue } = get();

    if (!isModelReady || !classificationEngine) {
      console.warn("[NeuralStore] Local engine not ready or WebGPU unavailable. Routing to Core AI N8N Fallback.");
      return fallbackToN8nQueue(log);
    }

    try {
      console.log("[NeuralStore] Processing workout log LOCALLY using Transformers.js...");
      const intentResponse = await classificationEngine(log, ['push', 'pull', 'legs', 'cardio', 'workout configuration']);
      console.log("[NeuralStore] Client-side tensor logic output:", intentResponse);

      let sets = 1, reps = 1, weight = 0;
      let exercise = log.replace(/\d+|sets?|reps?|kg|lbs|of|at|did|done/ig, '').trim();

      const setsMatch = log.match(/(\d+)\s*sets?/i);
      const repsMatch = log.match(/(\d+)\s*reps?/i);
      const weightMatch = log.match(/(\d+)\s*(kg|lbs)/i);

      if (setsMatch) sets = parseInt(setsMatch[1], 10);
      if (repsMatch) reps = parseInt(repsMatch[1], 10);
      if (weightMatch) weight = parseInt(weightMatch[1], 10);

      const parsedData = { exercise, sets, reps, weight };
      console.log("[NeuralStore] Extracted local data payload instantly: ", parsedData);
      
      return parsedData;
    } catch (error) {
      console.error("[NeuralStore] Local processing failed. Falling back to n8n.", error);
      return fallbackToN8nQueue(log);
    }
  },

  fallbackToN8nQueue: async (log: string) => {
    console.log("[N8N Router Fallback] Dispatching parsing queue to async backend...");
    try {
      await fetch('/api/webhooks/supabase/n8n-router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'whatsapp_or_voice',
          type: 'text_voice_intent',
          payload: { text: log, instruction: "PARSE_WORKOUT_LOG" }
        })
      });
      
      return {
        exercise: "Queued for N8N processing",
        sets: 0,
        reps: 0,
        weight: 0
      };
    } catch (e) {
      console.error('N8N router fallback failed:', e);
      return null;
    }
  }
}));

function useNeuralStoreHook(): NeuralStoreState;
function useNeuralStoreHook<T>(selector: (state: NeuralStoreState) => T): T;
function useNeuralStoreHook<T>(selector?: (state: NeuralStoreState) => T) {
  const getSnapshot = useCallback(
    () => (selector ? selector(neuralStore.getState()) : neuralStore.getState()),
    [selector]
  );
  return useSyncExternalStore(neuralStore.subscribe, getSnapshot, getSnapshot);
}

export const useNeuralStore = Object.assign(useNeuralStoreHook, {
  getState: neuralStore.getState,
  setState: neuralStore.setState,
  subscribe: neuralStore.subscribe,
});

