/**
 * Event times are stored as ISO strings so the feed can rank, the schedule can
 * group, and "Today"/"Tomorrow" stay true tomorrow. Display strings are
 * formatters over that value, never the stored value itself.
 */

const DAY_MS = 86_400_000;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Whole days between today and the given instant. 0 = today, 1 = tomorrow. */
export function daysFromToday(iso: string, now: Date = new Date()): number {
  return Math.round((startOfDay(new Date(iso)) - startOfDay(now)) / DAY_MS);
}

/** "Today" · "Tomorrow" · "Sat, Oct 25" */
export function formatDay(iso: string, now: Date = new Date()): string {
  const delta = daysFromToday(iso, now);
  if (delta === 0) return 'Today';
  if (delta === 1) return 'Tomorrow';
  if (delta === -1) return 'Yesterday';
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** "7:30 PM" */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "7:30 PM Today" · "9:00 AM Sat, Oct 25" */
export function formatWhen(iso: string, now: Date = new Date()): string {
  return `${formatTime(iso)} ${formatDay(iso, now)}`;
}

/** Heading for a schedule group: "Today · Mon, Sep 1" */
export function formatDayHeading(iso: string, now: Date = new Date()): string {
  const delta = daysFromToday(iso, now);
  const full = new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  if (delta === 0) return `Today · ${full}`;
  if (delta === 1) return `Tomorrow · ${full}`;
  return full;
}

/** ISO key for grouping by calendar day. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export function isPast(iso: string, now: Date = new Date()): boolean {
  return new Date(iso).getTime() < now.getTime();
}

/** "0.8 mi away" */
export function formatDistance(miles: number): string {
  if (miles < 0.1) return 'Right here';
  return `${miles.toFixed(1)} MI AWAY`;
}

/** Relative timestamp for comments and alerts: "just now", "2h ago". */
export function formatAgo(ts: number, now: number = Date.now()): string {
  const secs = Math.max(0, Math.round((now - ts) / 1000));
  if (secs < 60) return 'Just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Build a seed timestamp N days from today at a given local time. */
export function dayAt(offsetDays: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** An .ics calendar file for the events the user has committed to. */
export function buildIcs(
  events: { id: string; title: string; startsAt: string; location: string; vibe: string }[]
): string {
  const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, '');
  const escape = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//W8VR//Schedule//EN',
    'CALSCALE:GREGORIAN',
  ];
  for (const e of events) {
    const start = new Date(e.startsAt);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.id}@w8vr.app`,
      `DTSTAMP:${stamp(new Date().toISOString())}`,
      `DTSTART:${stamp(start.toISOString())}`,
      `DTEND:${stamp(end.toISOString())}`,
      `SUMMARY:${escape(e.title)}`,
      `LOCATION:${escape(e.location)}`,
      `DESCRIPTION:${escape(e.vibe)}`,
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
