import { ME, type Attendee, type EventItem, type RsvpStatus } from '../types';

/**
 * Everything the UI needs about an event's capacity is derived here, never
 * stored. The previous model kept a `capacity` percentage alongside the
 * counts it could be computed from, and the two drifted apart.
 */

export function attendeesWith(event: EventItem, status: RsvpStatus): Attendee[] {
  return event.attendees.filter(a => a.status === status);
}

export function confirmedCount(event: EventItem): number {
  return attendeesWith(event, 'going').length;
}

export function maybeCount(event: EventItem): number {
  return attendeesWith(event, 'maybe').length;
}

export function waitlistCount(event: EventItem): number {
  return attendeesWith(event, 'waitlist').length;
}

export function spotsLeft(event: EventItem): number {
  return Math.max(0, event.maxSpots - confirmedCount(event));
}

export function capacityPct(event: EventItem): number {
  if (event.maxSpots <= 0) return 0;
  return Math.min(100, Math.round((confirmedCount(event) / event.maxSpots) * 100));
}

export function isFull(event: EventItem): boolean {
  return spotsLeft(event) === 0;
}

export function isFillingFast(event: EventItem): boolean {
  return capacityPct(event) >= 90 && !isFull(event);
}

/** The waitlist in promotion order — first to join is first promoted. */
export function waitlistQueue(event: EventItem): Attendee[] {
  return attendeesWith(event, 'waitlist').sort((a, b) => a.joinedAt - b.joinedAt);
}

export function myRsvp(event: EventItem, userId: string = ME): RsvpStatus | null {
  return event.attendees.find(a => a.id === userId)?.status ?? null;
}

export function isHosting(event: EventItem, userId: string = ME): boolean {
  return event.hostId === userId;
}

/** Names for the avatar stack — the user first, so they see themselves. */
export function goingNames(event: EventItem, userId: string = ME): string[] {
  const going = attendeesWith(event, 'going');
  const me = going.find(a => a.id === userId);
  const others = going.filter(a => a.id !== userId).map(a => a.name);
  return me ? ['You', ...others] : others;
}

/** The badge above the card title. */
export function eventKindLabel(event: EventItem): string {
  if (event.privacy === 'circle') return 'JOINED CIRCLE';
  if (event.privacy === 'hidden') return 'INVITE ONLY';
  return 'PUBLIC EVENT';
}

/**
 * Feed ranking (PRD 4.1 P0 "ranked list"). Circle events outrank public ones,
 * then sooner outranks later, then nearer outranks further. Events the user
 * has already committed to float to the top so their evening is visible first.
 */
export function rankEvents(events: EventItem[], userId: string = ME): EventItem[] {
  const score = (e: EventItem) => {
    const mine = myRsvp(e, userId);
    if (mine === 'going' || mine === 'waitlist') return 0;
    if (e.privacy === 'circle') return 1;
    if (e.privacy === 'hidden') return 2;
    return 3;
  };
  return [...events].sort((a, b) => {
    const s = score(a) - score(b);
    if (s !== 0) return s;
    const t = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    if (t !== 0) return t;
    return a.distanceMi - b.distanceMi;
  });
}

/**
 * The address gate from PRD §7: street-level detail is withheld until the
 * viewer is confirmed. Hosts always see their own venue.
 */
export function canSeeExactAddress(event: EventItem, userId: string = ME): boolean {
  if (isHosting(event, userId)) return true;
  if (event.privacy === 'public') return true;
  return myRsvp(event, userId) === 'going';
}

export function displayAddress(event: EventItem, userId: string = ME): string {
  if (canSeeExactAddress(event, userId) && event.exactAddress) return event.exactAddress;
  return event.location;
}
