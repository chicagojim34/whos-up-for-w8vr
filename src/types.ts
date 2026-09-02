import type { EventCategory } from './lib/categories';

export type RsvpStatus = 'going' | 'maybe' | 'waitlist' | 'declined';

/** The current user is a real attendee like anyone else, id `me`. */
export const ME = 'me';

export interface Attendee {
  id: string;
  name: string;
  status: RsvpStatus;
  /** Order of arrival — decides who gets promoted off the waitlist first. */
  joinedAt: number;
}

export interface Comment {
  id: string;
  authorId: string;
  author: string;
  text: string;
  createdAt: number;
  isHost?: boolean;
  /** Set on host broadcasts; names who the blast was sent to. */
  broadcastTo?: BroadcastTarget;
}

export type BroadcastTarget = 'all' | 'going' | 'waitlist';

export type Privacy = 'public' | 'circle' | 'hidden';

/** An online game attached to an event. See lib/games.ts for the catalogue. */
export interface EventGame {
  gameId: string;
  /** Room code for live games (Jackbox and friends). */
  roomCode?: string;
  /** One-off table or party link, when the game issues one. */
  inviteUrl?: string;
}

/** gameId → the username that person uses on that service. */
export type GameHandles = Record<string, string>;

export interface EventItem {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  image: string;
  /** ISO 8601. The only source of truth for when this happens. */
  startsAt: string;
  /** Miles. Numeric so the feed can rank by proximity. */
  distanceMi: number;
  location: string;
  /** Street-level detail, revealed only to confirmed guests (PRD §7). */
  exactAddress?: string;
  isVirtual?: boolean;
  virtualLink?: string;
  /** Set when this event is a session of an online game. */
  game?: EventGame;
  maxSpots: number;
  autoWaitlist: boolean;
  attendees: Attendee[];
  /** Soft signal — people who looked, distinct from an RSVP. */
  interested: number;
  vibe: string;
  hostId: string;
  hostName: string;
  privacy: Privacy;
  circleId?: string;
  muted?: boolean;
  /** Percent coordinates on the discovery map. */
  coords: { x: number; y: number };
  comments: Comment[];

  // Ticketed & Dual-Time Properties
  isTicketedEvent?: boolean;
  eventSubType?: 'Concert' | 'Sports' | 'Comedy' | 'Theater' | 'Festival' | 'Other';
  performerOrTeam?: string;
  showtime?: string;
  doorsTime?: string;
  meetupTime?: string;
  meetupLocation?: string;
  ticketUrl?: string;
  ticketSectionInfo?: string;
  priceRange?: string;
  lineup?: string[];
  venueAddress?: string;
  bagPolicy?: string;
  ageRestriction?: string;
}

export interface CircleMember {
  id: string;
  name: string;
  role: 'Creator' | 'Admin' | 'Host' | 'Captain' | 'Member';
  /** Handles this person has shared with the circle. */
  gameHandles?: GameHandles;
}

export interface CircleItem {
  id: string;
  name: string;
  description: string;
  /** Members beyond the ones listed by name (large public communities). */
  extraMembers: number;
  color: string;
  isJoined: boolean;
  isPrivate: boolean;
  categoryTag: string;
  memberList: CircleMember[];
}

export type AlertType = 'invite' | 'confirm' | 'broadcast' | 'waitlist' | 'circle';

/**
 * Notification tiers (PRD 4.1 P1). Every alert declares its tier so the
 * user's settings can actually suppress it.
 */
export type AlertTier = 'logistics' | 'closeFriends' | 'circleActivity' | 'publicNearby';

export interface AlertItem {
  id: string;
  type: AlertType;
  tier: AlertTier;
  title: string;
  desc: string;
  createdAt: number;
  unread: boolean;
  eventId?: string;
  circleId?: string;
  actionLabel?: string;
}

export interface ContactItem {
  id: string;
  name: string;
  phone: string;
  isOnW8VR: boolean;
  isInvited: boolean;
}

export interface NotificationTiers {
  /** Logistics updates for events you said yes to. Always on — this is the
   *  product's core promise and turning it off would break coordination. */
  logistics: true;
  closeFriends: boolean;
  circleActivity: boolean;
  publicNearby: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  tagline: string;
  homeCity: string;
  notifications: NotificationTiers;
  blockedIds: string[];
  closeFriendIds: string[];
  /**
   * Your username on each service. These services have no public OAuth, so
   * this is a directory your circles can read — not a linked login.
   */
  gameHandles: GameHandles;
}

export interface ReportItem {
  id: string;
  eventId: string;
  eventTitle: string;
  reason: string;
  note: string;
  createdAt: number;
}
