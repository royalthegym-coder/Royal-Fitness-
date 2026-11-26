import crypto from 'crypto';

// Create in-memory Storage polyfill for Node test environment
class MemoryStorage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

const localStorageMock = new MemoryStorage();
const sessionStorageMock = new MemoryStorage();

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
}

if (typeof globalThis.sessionStorage === 'undefined') {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
    configurable: true,
  });
}

if (typeof globalThis.window === 'undefined') {
  Object.defineProperty(globalThis, 'window', {
    value: {
      crypto: crypto.webcrypto,
      localStorage: localStorageMock,
      sessionStorage: sessionStorageMock,
      innerWidth: 1280,
      innerHeight: 800,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
      location: { origin: 'http://localhost:3000', href: 'http://localhost:3000/' },
    },
    writable: true,
    configurable: true,
  });
} else if (!globalThis.window.crypto) {
  Object.defineProperty(globalThis.window, 'crypto', {
    value: crypto.webcrypto,
    writable: true,
    configurable: true,
  });
}

if (typeof globalThis.navigator === 'undefined') {
  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine: true, userAgent: 'vitest-node' },
    writable: true,
    configurable: true,
  });
}
