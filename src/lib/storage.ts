/**
 * Versioned, fault-tolerant localStorage.
 *
 * The previous implementation called JSON.parse inside a useState initialiser
 * with no guard, so a single malformed value threw during the first render and
 * left a blank page with no way to recover. Reads here never throw: a corrupt
 * or stale value is discarded and the caller gets its defaults.
 */

const NAMESPACE = 'w8vr';
const VERSION = 'v3';

const keyFor = (slice: string) => `${NAMESPACE}.${VERSION}.${slice}`;

export function loadSlice<T>(slice: string, fallback: T, isValid?: (v: unknown) => boolean): T {
  try {
    const raw = window.localStorage.getItem(keyFor(slice));
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || parsed === undefined) return fallback;
    if (isValid && !isValid(parsed)) {
      window.localStorage.removeItem(keyFor(slice));
      return fallback;
    }
    return parsed as T;
  } catch {
    // Corrupt JSON, a schema that no longer parses, or storage being
    // unavailable (Safari private browsing). Drop it and carry on.
    try {
      window.localStorage.removeItem(keyFor(slice));
    } catch {
      /* storage is unavailable entirely — nothing to clean up */
    }
    return fallback;
  }
}

export function saveSlice(slice: string, value: unknown): void {
  try {
    window.localStorage.setItem(keyFor(slice), JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled. The app stays fully usable for this
    // session; only persistence across reloads is lost.
  }
}

export function clearAllSlices(slices: string[]): void {
  for (const slice of slices) {
    try {
      window.localStorage.removeItem(keyFor(slice));
    } catch {
      /* nothing to do */
    }
  }
  // Sweep any older schema versions left behind by previous releases.
  try {
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(`${NAMESPACE}`) && !k.startsWith(`${NAMESPACE}.${VERSION}.`)) {
        window.localStorage.removeItem(k);
      }
      if (k && k.startsWith('w8vr_')) window.localStorage.removeItem(k); // pre-v3 keys
    }
  } catch {
    /* nothing to do */
  }
}

export const isArray = (v: unknown) => Array.isArray(v);
export const isObject = (v: unknown) => typeof v === 'object' && v !== null && !Array.isArray(v);
