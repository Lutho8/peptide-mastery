import "@testing-library/jest-dom";

Object.defineProperty(window, "scrollTo", { configurable: true, value: () => {} });

class IO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
(globalThis as unknown as { IntersectionObserver: typeof IO }).IntersectionObserver = IO;
(globalThis as unknown as { ResizeObserver: typeof IO }).ResizeObserver = IO;


Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// ---- Test helpers for PWA install verification ----

type CacheEntry = { name: string; keys: string[]; match: Record<string, boolean> };

export interface PwaMockState {
  ua: string;
  standaloneMedia: boolean;
  iosStandalone: boolean;
  swSupported: boolean;
  swBlocked: boolean;
  swController: object | null;
  swRegistration: object | null;
  caches: CacheEntry[];
  cacheMatchFailsFor: string[];
  privateBrowsing: boolean;
  online: boolean;
  ipadDesktopUa: boolean;
  reloads: number;
  unregistered: number;
  cacheDeletes: string[];
}

export const pwaMock: { state: PwaMockState } = {
  state: createInitial(),
};

function createInitial(): PwaMockState {
  return {
    ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    standaloneMedia: false,
    iosStandalone: false,
    swSupported: true,
    swBlocked: false,
    swController: { state: 'activated' },
    swRegistration: {},
    caches: [],
    cacheMatchFailsFor: [],
    privateBrowsing: false,
    online: true,
    ipadDesktopUa: false,
    reloads: 0,
    unregistered: 0,
    cacheDeletes: [],
  };
}

export function resetPwaMock(patch: Partial<PwaMockState> = {}) {
  pwaMock.state = { ...createInitial(), ...patch };
  applyMocks();
}

function applyMocks() {
  const s = pwaMock.state;

  // iPad desktop-UA shortcut: Safari on iPadOS sometimes reports a Mac UA
  // and exposes touch points. detectPlatform() treats that as iOS.
  if (s.ipadDesktopUa) {
    s.ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
  }

  // userAgent
  Object.defineProperty(window.navigator, 'userAgent', {
    configurable: true, get: () => s.ua,
  });
  Object.defineProperty(window.navigator, 'platform', {
    configurable: true,
    get: () => {
      if (s.ipadDesktopUa) return 'MacIntel';
      return /iPad|iPhone|iPod/.test(s.ua) ? 'iPhone' : 'Linux';
    },
  });
  Object.defineProperty(window.navigator, 'maxTouchPoints', {
    configurable: true, get: () => (s.ipadDesktopUa ? 5 : 0),
  });

  // navigator.onLine
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true, get: () => s.online,
  });

  // iOS Safari standalone flag
  Object.defineProperty(window.navigator, 'standalone', {
    configurable: true, get: () => s.iosStandalone,
  });

  // matchMedia: only the standalone query is meaningful
  (window as unknown as { matchMedia: (q: string) => MediaQueryList }).matchMedia = (query: string) => ({
    matches: query.includes('standalone') ? s.standaloneMedia : false,
    media: query, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;

  // serviceWorker
  if (s.swSupported) {
    const regs = s.swRegistration ? [{ unregister: async () => { s.unregistered++; return true; } }] : [];
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: {
        controller: s.swController,
        getRegistration: async () => {
          if (s.swBlocked) throw new DOMException('Blocked by policy', 'SecurityError');
          return s.swRegistration ? { unregister: async () => { s.unregistered++; return true; } } : undefined;
        },
        getRegistrations: async () => {
          if (s.swBlocked) throw new DOMException('Blocked by policy', 'SecurityError');
          return regs;
        },
        register: async () => regs[0] ?? {},
        addEventListener: () => {}, removeEventListener: () => {},
        ready: Promise.resolve(regs[0] ?? {}),
      },
    });
  } else {
    // Actually remove the property so `'serviceWorker' in navigator` is false
    try { delete (window.navigator as unknown as { serviceWorker?: unknown }).serviceWorker; } catch { /* noop */ }
  }

  // CacheStorage
  Object.defineProperty(window, 'caches', {
    configurable: true,
    value: {
      keys: async () => (s.privateBrowsing ? [] : s.caches.map(c => c.name)),
      open: async (name: string) => {
        if (s.privateBrowsing) throw new DOMException('Quota exceeded', 'QuotaExceededError');
        const entry = s.caches.find(c => c.name === name) ?? { name, keys: [], match: {} };
        return { keys: async () => entry.keys.map(k => new Request(k)) };
      },
      match: async (req: RequestInfo) => {
        if (s.privateBrowsing) return undefined;
        const url = typeof req === 'string' ? req : (req as Request).url;
        if (s.cacheMatchFailsFor.some(p => url.includes(p))) return undefined;
        for (const c of s.caches) if (c.match[url] || c.keys.includes(url)) return new Response('');
        return undefined;
      },
      delete: async (name: string) => {
        s.cacheDeletes.push(name);
        s.caches = s.caches.filter(c => c.name !== name);
        return true;
      },
    },
  });

  // location.reload spy
  const loc = window.location;
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...loc, reload: () => { s.reloads++; }, assign: () => {} },
  });
}

export function goOffline() {
  pwaMock.state.online = false;
  try { window.dispatchEvent(new Event('offline')); } catch { /* noop */ }
}

export function goOnline() {
  pwaMock.state.online = true;
  try { window.dispatchEvent(new Event('online')); } catch { /* noop */ }
}

applyMocks();
