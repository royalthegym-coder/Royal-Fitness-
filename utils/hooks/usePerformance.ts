
import { useState, useEffect, useRef, useCallback } from 'react';

// --- Tool 1: Debounce (Delays execution until user stops typing) ---
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// --- Tool 2: Simple In-Memory Cache (Avoids recalculations) ---
const cache = new Map<string, any>();

export const performanceCache = {
  get: (key: string) => cache.get(key),
  set: (key: string, value: any) => cache.set(key, value),
  has: (key: string) => cache.has(key),
  clear: () => cache.clear(),
};

// --- Tool 3: Turbo Mode Manager ---
export const toggleTurboMode = (enable: boolean) => {
  if (enable) {
    document.body.classList.add('turbo-mode');
    localStorage.setItem('royal_perf_mode', 'turbo');
  } else {
    document.body.classList.remove('turbo-mode');
    localStorage.setItem('royal_perf_mode', 'quality');
  }
};

export const initPerformanceSettings = () => {
  const mode = localStorage.getItem('royal_perf_mode');
  if (mode === 'turbo') {
    document.body.classList.add('turbo-mode');
  }
};
