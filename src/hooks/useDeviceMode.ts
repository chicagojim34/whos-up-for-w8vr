import { useCallback, useEffect, useState } from 'react';

export type DeviceMode = 'mobile' | 'tablet' | 'desktop';

/** Breakpoints, in px. Mirrors the shell widths in index.css. */
export const BREAKPOINTS = { tablet: 640, desktop: 1024 } as const;

function readViewportMode(): DeviceMode {
  if (typeof window === 'undefined') return 'desktop';
  if (window.matchMedia(`(min-width: ${BREAKPOINTS.desktop}px)`).matches) return 'desktop';
  if (window.matchMedia(`(min-width: ${BREAKPOINTS.tablet}px)`).matches) return 'tablet';
  return 'mobile';
}

/**
 * Layout mode follows the real viewport. The device switcher in the header
 * sets a manual override for previewing other widths; clearing it hands
 * control back to the viewport.
 */
export function useDeviceMode() {
  const [viewportMode, setViewportMode] = useState<DeviceMode>(readViewportMode);
  const [override, setOverride] = useState<DeviceMode | null>(null);

  useEffect(() => {
    const queries = [
      window.matchMedia(`(min-width: ${BREAKPOINTS.tablet}px)`),
      window.matchMedia(`(min-width: ${BREAKPOINTS.desktop}px)`),
    ];
    const sync = () => setViewportMode(readViewportMode());
    queries.forEach(q => q.addEventListener('change', sync));
    sync();
    return () => queries.forEach(q => q.removeEventListener('change', sync));
  }, []);

  const mode = override ?? viewportMode;

  const setMode = useCallback((next: DeviceMode | null) => setOverride(next), []);

  return { mode, viewportMode, isOverridden: override !== null, setMode };
}
