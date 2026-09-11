import { 
  type EventItem, 
  type CircleItem, 
  type UserProfile, 
  type Attendee, 
  type CanonicalTicketOption,
  ME 
} from '../types';
import type { EventCategory } from '../lib/categories';
import { 
  searchAutoPullEvents, 
  type AutoPullEvent,
  parseEventDateToTimestamp,
  matchesCityFilter
} from './eventAutoPull';
import { rankEvents } from '../lib/events';
import { 
  resolveCityCoordinates, 
  calculateDistanceMiles 
} from '../lib/usMsaDirectory';

export interface CircleAttendeeMatch {
  id: string;
  name: string;
  circleName?: string;
  isCloseFriend?: boolean;
}

export interface UnifiedSearchResultItem {
  id: string;
  kind: 'posted' | 'live_catalog';
  title: string;
  description: string;
  category: EventCategory;
  eventSubType?: string;
  image: string;
  startsAt?: string;
  date?: string;
  showtime?: string;
  doorsTime?: string;
  meetupTime?: string;
  meetupLocation?: string;
  location: string;
  exactAddress?: string;
  venueAddress?: string;
  distanceMi?: number;
  ticketUrl?: string;
  ticketSectionInfo?: string;
  priceRange?: string;
  performerOrTeam?: string;
  maxSpots?: number;
  attendees?: Attendee[];
  interested?: number;
  vibe?: string;
  hostId?: string;
  hostName?: string;
  privacy?: string;
  circleId?: string;
  muted?: boolean;
  ticketOptions?: CanonicalTicketOption[];
  provenanceSources?: string[];
  bagPolicy?: string;
  ageRestriction?: string;
  doorsTimeConfirmed?: boolean;

  // Circle match signals:
  hasCircleAttendeesGoing: boolean;
  circleAttendeesGoing: CircleAttendeeMatch[];
  circleNamesSummary?: string;

  // Search metrics:
  matchScore: number;
  originalPostedEvent?: EventItem;
  originalCatalogEvent?: AutoPullEvent;
}

export interface UnifiedSearchOptions {
  query: string;
  category?: EventCategory;
  user: UserProfile;
  circles: CircleItem[];
  postedEvents: EventItem[];
  userCity?: string;
  radiusMiles?: number | 'metro';
  userCoordinates?: { lat: number; lng: number };
  limit?: number;
}

/**
 * Builds a fast lookup map of circle members and close friends for the current user.
 */
export function buildCircleMemberGraph(circles: CircleItem[], user: UserProfile) {
  const joinedCircles = circles.filter(c => c.isJoined);
  const joinedCircleIds = new Set(joinedCircles.map(c => c.id));
  const memberMap = new Map<string, { id: string; name: string; circleNames: string[] }>();

  for (const circle of joinedCircles) {
    for (const member of circle.memberList) {
      if (member.id !== user.id && member.id !== ME) {
        const existing = memberMap.get(member.id);
        if (existing) {
          if (!existing.circleNames.includes(circle.name)) {
            existing.circleNames.push(circle.name);
          }
        } else {
          memberMap.set(member.id, {
            id: member.id,
            name: member.name,
            circleNames: [circle.name],
          });
        }
      }
    }
  }

  const closeFriendSet = new Set(user.closeFriendIds || []);

  return {
    joinedCircles,
    joinedCircleIds,
    memberMap,
    closeFriendSet,
  };
}

/**
 * Checks if any attendees from the user's circles or close friends are going to this event.
 */
export function evaluateCircleAttendance(
  event: EventItem,
  graph: ReturnType<typeof buildCircleMemberGraph>,
  currentUserId: string = ME
): {
  hasCircleGoing: boolean;
  circleAttendees: CircleAttendeeMatch[];
  circleNamesSummary?: string;
} {
  const going = event.attendees.filter(
    a => a.status === 'going' && a.id !== currentUserId && a.id !== ME
  );

  const matched: CircleAttendeeMatch[] = [];
  const circleNamesFound = new Set<string>();

  for (const a of going) {
    const memberInfo = graph.memberMap.get(a.id);
    const isClose = graph.closeFriendSet.has(a.id);

    if (memberInfo || isClose) {
      const circleName = memberInfo?.circleNames[0];
      if (circleName) circleNamesFound.add(circleName);
      matched.push({
        id: a.id,
        name: a.name,
        circleName,
        isCloseFriend: isClose,
      });
    } else if (event.circleId && graph.joinedCircleIds.has(event.circleId)) {
      const circle = graph.joinedCircles.find(c => c.id === event.circleId);
      if (circle) circleNamesFound.add(circle.name);
      matched.push({
        id: a.id,
        name: a.name,
        circleName: circle?.name,
      });
    }
  }

  // Also check if the event host is in the user's circles
  if (
    event.hostId !== currentUserId &&
    event.hostId !== ME &&
    (graph.memberMap.has(event.hostId) || graph.closeFriendSet.has(event.hostId))
  ) {
    if (!matched.some(m => m.id === event.hostId)) {
      const memberInfo = graph.memberMap.get(event.hostId);
      const circleName = memberInfo?.circleNames[0];
      if (circleName) circleNamesFound.add(circleName);
      matched.unshift({
        id: event.hostId,
        name: event.hostName,
        circleName,
        isCloseFriend: graph.closeFriendSet.has(event.hostId),
      });
    }
  }

  const hasCircleGoing = matched.length > 0;
  let circleNamesSummary: string | undefined;

  if (hasCircleGoing) {
    if (circleNamesFound.size > 0) {
      circleNamesSummary = Array.from(circleNamesFound).slice(0, 2).join(' & ');
    } else {
      circleNamesSummary = 'Your Circle';
    }
  }

  return {
    hasCircleGoing,
    circleAttendees: matched,
    circleNamesSummary,
  };
}

/**
 * Computes text relevance match score for a posted event.
 * Returns 0 if it does not match the search query.
 */
export function computePostedEventMatchScore(event: EventItem, query: string): number {
  if (!query || !query.trim()) return 100;

  const raw = query.trim().toLowerCase();
  const tokens = raw.split(/\s+/).filter(Boolean);

  const titleLower = event.title.toLowerCase();
  const performerLower = (event.performerOrTeam || '').toLowerCase();
  const locLower = event.location.toLowerCase();
  const addrLower = (event.exactAddress || event.venueAddress || '').toLowerCase();
  const descLower = event.description.toLowerCase();
  const vibeLower = event.vibe.toLowerCase();
  const catLower = event.category.toLowerCase();
  const subTypeLower = (event.eventSubType || '').toLowerCase();

  let score = 0;

  // Exact title match gets massive boost
  if (titleLower === raw) score += 1000;
  else if (titleLower.includes(raw)) score += 500;

  // Performer or team match
  if (performerLower === raw) score += 600;
  else if (performerLower && performerLower.includes(raw)) score += 400;

  // Location or venue
  if (locLower.includes(raw) || addrLower.includes(raw)) score += 350;

  // Category or sub-type
  if (catLower === raw || subTypeLower === raw) score += 200;

  // Description and vibe
  if (descLower.includes(raw) || vibeLower.includes(raw)) score += 100;

  // Check attendee names (e.g. searching "Aneka" or "Marcus")
  const attendeeMatch = event.attendees.some(a => a.name.toLowerCase().includes(raw));
  if (attendeeMatch) score += 300;

  const matchWordOrPrefix = (text: string, token: string) => {
    if (!text || !token) return false;
    if (token.length <= 2) {
      return new RegExp(`\\b${token}\\b`, 'i').test(text);
    }
    return text.includes(token);
  };

  // If multi-token query (e.g. "Au Cheval"), ensure significant tokens (>= 3 chars) match,
  // or that the full phrase matches, preventing accidental false positives on short substrings
  const significantTokens = tokens.filter(t => t.length >= 3);
  if (tokens.length > 1 && significantTokens.length > 0) {
    const hasSignificantMatch = significantTokens.some(t =>
      titleLower.includes(t) ||
      performerLower.includes(t) ||
      locLower.includes(t) ||
      descLower.includes(t) ||
      vibeLower.includes(t)
    );
    if (!hasSignificantMatch && !titleLower.includes(raw) && !descLower.includes(raw)) {
      return 0;
    }
  }

  // Token level matching
  for (const token of tokens) {
    if (matchWordOrPrefix(titleLower, token)) score += 150;
    else if (matchWordOrPrefix(performerLower, token)) score += 120;
    else if (matchWordOrPrefix(locLower, token)) score += 80;
    else if (matchWordOrPrefix(descLower, token)) score += 30;
  }

  return score;
}

/**
 * Unified Search Engine: Searches posted events and the live catalog (Ticketmaster,
 * SeatGeek, restaurants, art walks, architecture tours, PACs, and dynamic outings).
 *
 * Ranking guarantees:
 * 1. An event MUST actually match the search query (score > 0).
 * 2. Any matching event where people in your circle are going is placed AT THE VERY TOP.
 * 3. Other matching posted events appear next.
 * 4. Matching live catalog events appear next, ready for 1-click group hosting.
 */
export function performUnifiedSearch(options: UnifiedSearchOptions): UnifiedSearchResultItem[] {
  const {
    query,
    category,
    user,
    circles,
    postedEvents,
    userCity = 'All US Markets',
    radiusMiles = 50,
    userCoordinates,
    limit = 40,
  } = options;

  const rawQuery = (query || '').trim();
  const graph = buildCircleMemberGraph(circles, user);

  const isSpecificCity = Boolean(
    userCity &&
    userCity !== 'All Cities' &&
    userCity !== 'All US Markets' &&
    userCity.toLowerCase() !== 'national'
  );

  const centerCoords = userCoordinates || (isSpecificCity ? resolveCityCoordinates(userCity) : undefined);

  const getEventDistance = (loc?: string, addr?: string): number | undefined => {
    if (!centerCoords) return undefined;
    const evtCoords = resolveCityCoordinates(loc ? `${loc} ${addr || ''}` : addr);
    if (!evtCoords) return undefined;
    return calculateDistanceMiles(centerCoords.lat, centerCoords.lng, evtCoords.lat, evtCoords.lng);
  };

  // Category filter predicate
  const matchesCategory = (cat: EventCategory) => {
    if (!category || category === 'All Events') return true;
    return cat === category;
  };

  // Case 1: Empty query -> return standard feed with circle events prioritized
  if (!rawQuery) {
    const unmuted = postedEvents.filter(e => {
      if (e.muted || !matchesCategory(e.category)) return false;
      if (isSpecificCity) {
        return matchesCityFilter(e.location, e.exactAddress || e.venueAddress, userCity, radiusMiles, centerCoords);
      }
      return true;
    });
    const ranked = rankEvents(unmuted, user.id || ME);

    return ranked.slice(0, limit).map(event => {
      const circleInfo = evaluateCircleAttendance(event, graph, user.id || ME);
      const computedDistance = getEventDistance(event.location, event.exactAddress || event.venueAddress);
      return {
        id: event.id,
        kind: 'posted',
        title: event.title,
        description: event.description,
        category: event.category,
        eventSubType: event.eventSubType,
        image: event.image,
        startsAt: event.startsAt,
        showtime: event.showtime,
        doorsTime: event.doorsTime,
        meetupTime: event.meetupTime,
        meetupLocation: event.meetupLocation,
        location: event.location,
        exactAddress: event.exactAddress,
        venueAddress: event.venueAddress,
        distanceMi: computedDistance ?? event.distanceMi,
        ticketUrl: event.ticketUrl,
        ticketSectionInfo: event.ticketSectionInfo,
        priceRange: event.priceRange,
        performerOrTeam: event.performerOrTeam,
        maxSpots: event.maxSpots,
        attendees: event.attendees,
        interested: event.interested,
        vibe: event.vibe,
        hostId: event.hostId,
        hostName: event.hostName,
        privacy: event.privacy,
        circleId: event.circleId,
        muted: event.muted,
        ticketOptions: event.ticketOptions,
        provenanceSources: event.provenanceSources,
        bagPolicy: event.bagPolicy,
        ageRestriction: event.ageRestriction,
        doorsTimeConfirmed: event.doorsTimeConfirmed,
        hasCircleAttendeesGoing: circleInfo.hasCircleGoing,
        circleAttendeesGoing: circleInfo.circleAttendees,
        circleNamesSummary: circleInfo.circleNamesSummary,
        matchScore: 100,
        originalPostedEvent: event,
      };
    });
  }

  // Case 2: Active query -> perform full search across all sources
  const postedMatches: UnifiedSearchResultItem[] = [];

  for (const event of postedEvents) {
    if (event.muted) continue;
    if (!matchesCategory(event.category)) continue;

    if (isSpecificCity) {
      const matchesCity = matchesCityFilter(event.location, event.exactAddress || event.venueAddress, userCity, radiusMiles, centerCoords);
      if (!matchesCity) continue;
    }

    const matchScore = computePostedEventMatchScore(event, rawQuery);
    // Strict requirement: MUST be an actual match to the search!
    if (matchScore <= 0) continue;

    const circleInfo = evaluateCircleAttendance(event, graph, user.id || ME);
    const computedDistance = getEventDistance(event.location, event.exactAddress || event.venueAddress);

    postedMatches.push({
      id: event.id,
      kind: 'posted',
      title: event.title,
      description: event.description,
      category: event.category,
      eventSubType: event.eventSubType,
      image: event.image,
      startsAt: event.startsAt,
      showtime: event.showtime,
      doorsTime: event.doorsTime,
      meetupTime: event.meetupTime,
      meetupLocation: event.meetupLocation,
      location: event.location,
      exactAddress: event.exactAddress,
      venueAddress: event.venueAddress,
      distanceMi: computedDistance ?? event.distanceMi,
      ticketUrl: event.ticketUrl,
      ticketSectionInfo: event.ticketSectionInfo,
      priceRange: event.priceRange,
      performerOrTeam: event.performerOrTeam,
      maxSpots: event.maxSpots,
      attendees: event.attendees,
      interested: event.interested,
      vibe: event.vibe,
      hostId: event.hostId,
      hostName: event.hostName,
      privacy: event.privacy,
      circleId: event.circleId,
      muted: event.muted,
      ticketOptions: event.ticketOptions,
      provenanceSources: event.provenanceSources,
      bagPolicy: event.bagPolicy,
      ageRestriction: event.ageRestriction,
      doorsTimeConfirmed: event.doorsTimeConfirmed,
      hasCircleAttendeesGoing: circleInfo.hasCircleGoing,
      circleAttendeesGoing: circleInfo.circleAttendees,
      circleNamesSummary: circleInfo.circleNamesSummary,
      matchScore,
      originalPostedEvent: event,
    });
  }

  // Search Live Catalog & Outings (Ticketmaster, SeatGeek, restaurants, art walks, tours, PACs, dynamic)
  const catalogResults = searchAutoPullEvents(
    rawQuery,
    isSpecificCity ? userCity : undefined,
    isSpecificCity,
    radiusMiles,
    centerCoords
  );
  const catalogMatches: UnifiedSearchResultItem[] = [];

  for (const catEvt of catalogResults) {
    if (!matchesCategory(catEvt.category)) continue;

    // Deduplication check against posted events
    const alreadyPosted = postedMatches.some(
      p => p.title.toLowerCase() === catEvt.title.toLowerCase() ||
           (p.performerOrTeam && p.performerOrTeam.toLowerCase() === catEvt.performerOrTeam.toLowerCase() &&
            p.location.toLowerCase().includes(catEvt.venue.toLowerCase()))
    );
    if (alreadyPosted) continue;

    catalogMatches.push({
      id: catEvt.id,
      kind: 'live_catalog',
      title: catEvt.title,
      description: catEvt.description,
      category: catEvt.category,
      eventSubType: catEvt.eventSubType,
      image: catEvt.image,
      date: catEvt.date,
      showtime: catEvt.showtime,
      doorsTime: catEvt.doorsTime,
      meetupTime: catEvt.suggestedMeetupTime,
      meetupLocation: catEvt.suggestedMeetupLocation,
      location: `${catEvt.venue}, ${catEvt.city}`,
      venueAddress: catEvt.venueAddress,
      distanceMi: catEvt.distanceMi ?? getEventDistance(catEvt.venue, catEvt.venueAddress),
      ticketUrl: catEvt.ticketUrl,
      ticketSectionInfo: catEvt.ticketSectionInfo,
      priceRange: catEvt.priceRange,
      performerOrTeam: catEvt.performerOrTeam,
      maxSpots: 20,
      attendees: [],
      interested: 12,
      vibe: catEvt.description,
      hostName: 'Live Outings & Guides',
      privacy: 'public',
      ticketOptions: catEvt.ticketOptions,
      provenanceSources: catEvt.provenanceSources || ['Live US Guides'],
      bagPolicy: catEvt.bagPolicy,
      ageRestriction: catEvt.ageRestriction,
      doorsTimeConfirmed: catEvt.doorsConfirmed,
      hasCircleAttendeesGoing: false,
      circleAttendeesGoing: [],
      matchScore: 300,
      originalCatalogEvent: catEvt,
    });
  }

  // Split posted matches into:
  // Group A: Actual matches where people in your circle are going -> TOP PRIORITY
  // Group B: Other matching posted events
  const circleMatches: UnifiedSearchResultItem[] = [];
  const otherPostedMatches: UnifiedSearchResultItem[] = [];

  for (const item of postedMatches) {
    if (item.hasCircleAttendeesGoing) {
      circleMatches.push(item);
    } else {
      otherPostedMatches.push(item);
    }
  }

  // Sort circle matches: most circle members going first, then score
  circleMatches.sort((a, b) => {
    if (b.circleAttendeesGoing.length !== a.circleAttendeesGoing.length) {
      return b.circleAttendeesGoing.length - a.circleAttendeesGoing.length;
    }
    return b.matchScore - a.matchScore;
  });

  // Sort other posted matches by matchScore then date
  otherPostedMatches.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    const aTime = a.startsAt ? new Date(a.startsAt).getTime() : 0;
    const bTime = b.startsAt ? new Date(b.startsAt).getTime() : 0;
    return aTime - bTime;
  });

  // Sort catalog matches
  catalogMatches.sort((a, b) => {
    return parseEventDateToTimestamp(a.date || '') - parseEventDateToTimestamp(b.date || '');
  });

  // Strict Unified Result Composition:
  // 1. Circle-attended matching events at the VERY TOP
  // 2. Other matching posted events
  // 3. Live catalog matching events
  const combined = [
    ...circleMatches,
    ...otherPostedMatches,
    ...catalogMatches,
  ];

  return combined.slice(0, limit);
}
