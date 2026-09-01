/**
 * Capacity ring colour.
 *
 * The PRD specifies green while there is room and red once it is full. The
 * brand indigo marks the "filling up" band in between, and red takes over at
 * 90% — the same threshold DESIGN.md uses for the urgency pulse, so the
 * colour and the animation say the same thing.
 */
export function ringTone(capacity: number): { stroke: string; text: string } {
  if (capacity >= 90) {
    return { stroke: 'var(--color-error)', text: 'var(--color-error)' };
  }
  if (capacity >= 70) {
    return { stroke: 'var(--color-primary)', text: 'var(--color-primary)' };
  }
  return { stroke: 'var(--color-secondary)', text: 'var(--color-secondary)' };
}
