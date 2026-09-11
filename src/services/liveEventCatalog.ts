import { 
  type AutoPullEvent, 
  type EventSubType, 
  computeEventRelevance, 
  parseEventDateToTimestamp,
  isEventUpcoming,
  searchAutoPullEvents,
  matchesCityFilter
} from './eventAutoPull';
import { resolveEventSchedule, type ResolvedSchedule } from './venueScheduleResolver';
import { deduplicateAndMergeEvents } from './eventDeduplication';
import { fetchDoStuffEvents } from './drivers/doStuffDriver';
import { fetchDmoEvents } from './drivers/simpleviewDmoDriver';
import { fetchPacEvents } from './drivers/tessituraPacDriver';
import { fetchDiningExperiences } from './drivers/diningExperienceDriver';

// Active API credentials provided by user
export const DEFAULT_TICKETMASTER_API_KEY = 'IIA8D5kIG6y4Oj7dT9hg0CGRbv4ZAIvQ';
export const DEFAULT_SEATGEEK_CLIENT_ID = 'NDc3Mzg3NXwxNzg4Mzc2NzkzLjg4ODM0Njc';

const STORAGE_KEY_TM = 'w8vr.v3.ticketmaster_key';
const STORAGE_KEY_SG = 'w8vr.v3.seatgeek_client_id';
const CACHE_STORAGE_KEY = 'w8vr.v3.live_catalog_cache';

export function getTicketmasterKey(): string {
  if (typeof window === 'undefined') return DEFAULT_TICKETMASTER_API_KEY;
  return localStorage.getItem(STORAGE_KEY_TM) || DEFAULT_TICKETMASTER_API_KEY;
}

export function setTicketmasterKey(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_TM, key.trim());
  }
}

export function getSeatGeekClientId(): string {
  if (typeof window === 'undefined') return DEFAULT_SEATGEEK_CLIENT_ID;
  return localStorage.getItem(STORAGE_KEY_SG) || DEFAULT_SEATGEEK_CLIENT_ID;
}

export function setSeatGeekClientId(id: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SG, id.trim());
  }
}

/**
 * Computes dual-time schedule using venue archetype intelligence
 * and explicit door times from venue manifests.
 */
function computeDualTimeSchedule(
  localTimeStr?: string,
  venueName?: string,
  apiDoorsTime?: string,
  promoterNotes?: string
): ResolvedSchedule {
  return resolveEventSchedule({
    venueName,
    rawShowtimeStr: localTimeStr || '7:00 PM',
    apiDoorsTime,
    promoterNotes,
  });
}

interface TmImage {
  ratio?: string;
  url: string;
  width?: number;
  height?: number;
}

interface TmVenue {
  name?: string;
  address?: { line1?: string };
  city?: { name?: string };
  state?: { stateCode?: string };
}

interface TmAttraction {
  name?: string;
}

interface TmRawEvent {
  id: string;
  name: string;
  url?: string;
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
    };
    doorsTimes?: {
      localTime?: string;
      dateTime?: string;
    };
  };
  _embedded?: {
    venues?: TmVenue[];
    attractions?: TmAttraction[];
  };
  images?: TmImage[];
  classifications?: Array<{
    segment?: { name?: string };
    genre?: { name?: string };
  }>;
  priceRanges?: Array<{
    min: number;
    max: number;
  }>;
  info?: string;
  pleaseNote?: string;
}

/**
 * Queries Ticketmaster Discovery API for live events.
 */
async function fetchTicketmasterEvents(query: {
  keyword?: string;
  city?: string;
  classificationName?: string;
  size?: number;
}): Promise<AutoPullEvent[]> {
  const apiKey = getTicketmasterKey();
  if (!apiKey) return [];

  const now = new Date();
  const startDateTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0))
    .toISOString()
    .split('.')[0] + 'Z';

  const params = new URLSearchParams({
    apikey: apiKey,
    size: String(query.size || 20),
    sort: 'date,asc',
    startDateTime,
  });

  if (query.keyword?.trim()) {
    params.append('keyword', query.keyword.trim());
  }
  if (query.city?.trim()) {
    params.append('city', query.city.trim());
  }
  if (query.classificationName?.trim()) {
    params.append('classificationName', query.classificationName.trim());
  }

  try {
    const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`);
    if (!res.ok) return [];

    const data = await res.json();
    const rawEvents: TmRawEvent[] = data._embedded?.events || [];

    return rawEvents.map((e: TmRawEvent): AutoPullEvent => {
      const venues = e._embedded?.venues || [];
      const venueObj = venues[0] || {};
      const venueName = venueObj.name || 'Arena / Music Hall';

      const dates = e.dates?.start || {};
      const localTime = dates.localTime;
      const apiDoors = e.dates?.doorsTimes?.localTime;
      const notes = `${e.pleaseNote || ''} ${e.info || ''}`.trim();
      const sched = computeDualTimeSchedule(localTime, venueName, apiDoors, notes);

      const address = venueObj.address?.line1 || venueObj.name || 'Downtown';
      const city = venueObj.city?.name || query.city || 'Metro Area';
      const state = venueObj.state?.stateCode || '';
      const fullAddress = `${address}, ${city}${state ? `, ${state}` : ''}`;

      // Pick high-resolution 16:9 or 3:2 image
      const images: TmImage[] = e.images || [];
      const bestImage =
        images.find((img: TmImage) => img.ratio === '16_9' && (img.width ?? 0) >= 1024)?.url ||
        images.find((img: TmImage) => img.ratio === '16_9')?.url ||
        images[0]?.url ||
        'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=1200';

      const altImages = images
        .filter((img: TmImage) => img.url !== bestImage && (img.width ?? 0) >= 600)
        .slice(0, 4)
        .map((img: TmImage) => img.url);

      // Classifications
      const segName = e.classifications?.[0]?.segment?.name || '';
      let subType: EventSubType = 'Concert';
      if (segName.toLowerCase().includes('sport')) subType = 'Sports';
      else if (segName.toLowerCase().includes('theatre') || segName.toLowerCase().includes('arts')) {
        const genre = e.classifications?.[0]?.genre?.name || '';
        if (genre.toLowerCase().includes('comedy')) subType = 'Comedy';
        else subType = 'Theater';
      }

      // Attractions / performers
      const attractions = e._embedded?.attractions || [];
      const headliner = attractions[0]?.name || e.name;
      const lineup = attractions.map((a: TmAttraction) => a.name || '').filter(Boolean);

      // Price ranges
      const priceRangeObj = e.priceRanges?.[0];
      const priceRange = priceRangeObj
        ? `$${Math.round(priceRangeObj.min)} - $${Math.round(priceRangeObj.max)}`
        : '$45 - $165';

      return {
        id: `tm-${e.id}`,
        title: e.name,
        performerOrTeam: headliner,
        eventSubType: subType,
        category: subType === 'Sports' ? 'Active' : 'Entertainment',
        venue: venueName,
        venueAddress: fullAddress,
        city: `${city}${state ? `, ${state}` : ''}`,
        date: dates.localDate || 'Upcoming Date',
        showtime: sched.showtime,
        doorsTime: sched.doorsTime,
        suggestedMeetupTime: sched.suggestedMeetupTime,
        suggestedMeetupLocation: `Meet outside ${venueName} (near Main Gate or nearby plaza/bar)`,
        image: bestImage,
        additionalImages: altImages,
        ticketUrl: e.url || '',
        ticketSectionInfo: 'Section 114 / Lower Bowl or GA Floor',
        priceRange,
        lineup: lineup.length > 0 ? lineup : [headliner],
        bagPolicy: sched.bagPolicy || 'Clear bags only (12"x6"x12") or clutches under 4.5"x6.5"',
        ageRestriction: 'All Ages',
        doorsConfirmed: sched.doorsConfirmed,
        doorsSource: sched.source,
        venueGateInfo: sched.venueGateInfo,
        description:
          e.info ||
          e.pleaseNote ||
          `Official live ${subType.toLowerCase()} event featuring ${headliner} at ${venueName}. Group outing organized with W8VR.`,
      };
    });
  } catch (err) {
    console.warn('[liveEventCatalog] Ticketmaster query failed:', err);
    return [];
  }
}

interface SgPerformer {
  name?: string;
  image?: string;
  images?: { huge?: string };
  primary?: boolean;
}

interface SgVenue {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
}

interface SgRawEvent {
  id: number;
  title: string;
  url?: string;
  datetime_local?: string;
  venue?: SgVenue;
  performers?: SgPerformer[];
  type?: string;
  stats?: {
    lowest_price?: number;
    highest_price?: number;
    average_price?: number;
  };
  description?: string;
}

/**
 * Queries SeatGeek Platform API for live events.
 */
async function fetchSeatGeekEvents(query: {
  keyword?: string;
  city?: string;
  type?: string;
  size?: number;
}): Promise<AutoPullEvent[]> {
  const clientId = getSeatGeekClientId();
  if (!clientId) return [];

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const params = new URLSearchParams({
    client_id: clientId,
    per_page: String(query.size || 20),
    sort: 'datetime_local.asc',
    'datetime_local.gte': todayIso,
  });

  if (query.keyword?.trim()) {
    params.append('q', query.keyword.trim());
  }
  if (query.city?.trim()) {
    params.append('venue.city', query.city.trim());
  }
  if (query.type?.trim()) {
    params.append('taxonomies.name', query.type.trim());
  }

  try {
    const res = await fetch(`https://api.seatgeek.com/2/events?${params.toString()}`);
    if (!res.ok) return [];

    const data = await res.json();
    const rawEvents: SgRawEvent[] = data.events || [];

    return rawEvents.map((e: SgRawEvent): AutoPullEvent => {
      const dtLocal = e.datetime_local || '';
      const [datePart, timePart] = dtLocal.split('T');
      const venueObj = e.venue || {};
      const venueName = venueObj.name || 'Arena';
      const sched = computeDualTimeSchedule(timePart, venueName);

      const address = venueObj.address || venueName;
      const city = venueObj.city || query.city || 'Metro Area';
      const state = venueObj.state || '';
      const fullAddress = `${address}, ${city}${state ? `, ${state}` : ''}`;

      // Performers
      const performers: SgPerformer[] = e.performers || [];
      const primaryPerformer = performers.find((p: SgPerformer) => p.primary) || performers[0] || {};
      const headliner = primaryPerformer.name || e.title;
      const lineup = performers.map((p: SgPerformer) => p.name || '').filter(Boolean);

      // Best image
      const bestImage =
        primaryPerformer.image ||
        primaryPerformer.images?.huge ||
        'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=1200';

      const altImages = performers
        .filter((p: SgPerformer) => p.image && p.image !== bestImage)
        .slice(0, 3)
        .map((p: SgPerformer) => p.image || '')
        .filter(Boolean);

      // Taxonomies / Type
      let subType: EventSubType = 'Concert';
      const typeStr = (e.type || '').toLowerCase();
      if (typeStr.includes('sports') || typeStr.includes('hockey') || typeStr.includes('basketball') || typeStr.includes('football')) {
        subType = 'Sports';
      } else if (typeStr.includes('comedy')) {
        subType = 'Comedy';
      } else if (typeStr.includes('theater') || typeStr.includes('broadway')) {
        subType = 'Theater';
      }

      // Lowest & Average price
      let priceRange = '$55 - $175';
      if (e.stats?.lowest_price) {
        priceRange = `$${e.stats.lowest_price} - $${e.stats.average_price || e.stats.lowest_price * 2}`;
      }

      return {
        id: `sg-${e.id}`,
        title: e.title,
        performerOrTeam: headliner,
        eventSubType: subType,
        category: subType === 'Sports' ? 'Active' : 'Entertainment',
        venue: venueName,
        venueAddress: fullAddress,
        city: `${city}${state ? `, ${state}` : ''}`,
        date: datePart || 'Upcoming Date',
        showtime: sched.showtime,
        doorsTime: sched.doorsTime,
        suggestedMeetupTime: sched.suggestedMeetupTime,
        suggestedMeetupLocation: `Meet near ${venueName} entrance or nearby pre-drinks gathering spot`,
        image: bestImage,
        additionalImages: altImages,
        ticketUrl: e.url || '',
        ticketSectionInfo: 'Section 100-Level or General Admission',
        priceRange,
        lineup: lineup.length > 0 ? lineup : [headliner],
        bagPolicy: sched.bagPolicy || 'Standard arena clear bag policy applies.',
        ageRestriction: 'All Ages',
        doorsConfirmed: sched.doorsConfirmed,
        doorsSource: sched.source,
        venueGateInfo: sched.venueGateInfo,
        description: `SeatGeek verified live ${subType.toLowerCase()} event for ${headliner} at ${venueName}. Group outing on W8VR.`,
      };
    });
  } catch (err) {
    console.warn('[liveEventCatalog] SeatGeek query failed:', err);
    return [];
  }
}

/**
 * Unified search querying both Ticketmaster and SeatGeek in parallel,
 * deduplicating, caching results, and returning a full live catalog.
 */
export async function searchLiveEventCatalog(params: {
  keyword?: string;
  city?: string;
  subType?: EventSubType | 'Dining' | 'All';
  size?: number;
}): Promise<AutoPullEvent[]> {
  const keyword = params.keyword?.trim() || '';
  const city = params.city?.trim() || '';
  const subType = params.subType === 'All' ? undefined : params.subType;
  const isSpecificCity = Boolean(city && city !== 'All Cities' && city.trim());

  // Map subType to classification names
  let tmClass: string | undefined = undefined;
  let sgType: string | undefined = undefined;

  if (subType === 'Concert') {
    tmClass = 'Music';
    sgType = 'concert';
  } else if (subType === 'Sports') {
    tmClass = 'Sports';
    sgType = 'sports';
  } else if (subType === 'Comedy') {
    tmClass = 'Arts & Theatre';
    sgType = 'comedy';
  } else if (subType === 'Theater') {
    tmClass = 'Arts & Theatre';
    sgType = 'theater';
  } else if (subType === 'Festival') {
    tmClass = 'Festival';
    sgType = 'festival';
  }

  // Get local verified community events, tours, dining outings, and art walks
  const localCatalogEvents = searchAutoPullEvents(keyword, city, isSpecificCity);

  // Query primary APIs and syndicated multi-market drivers concurrently
  const [tmResults, sgResults, doStuffResults, dmoResults, pacResults, diningResults] = await Promise.all([
    fetchTicketmasterEvents({
      keyword,
      city,
      classificationName: tmClass,
      size: params.size || 15,
    }),
    fetchSeatGeekEvents({
      keyword,
      city,
      type: sgType,
      size: params.size || 15,
    }),
    fetchDoStuffEvents(city),
    fetchDmoEvents(city),
    fetchPacEvents(city),
    fetchDiningExperiences(city),
  ]);

  // Combine raw streams and filter out past events
  let combinedRaw = [
    ...localCatalogEvents,
    ...tmResults,
    ...sgResults,
    ...doStuffResults,
    ...dmoResults,
    ...pacResults,
    ...diningResults,
  ].filter(evt => isEventUpcoming(evt.date));

  // If a specific city filter is selected, strictly retain events matching that city/metro
  if (isSpecificCity) {
    combinedRaw = combinedRaw.filter(evt => matchesCityFilter(evt.city, evt.venueAddress, city));
  }

  // Apply subtype / category filter if requested
  if (subType) {
    if (subType === 'Dining') {
      combinedRaw = combinedRaw.filter(e => e.category === 'Dining');
    } else if (subType === 'Festival') {
      combinedRaw = combinedRaw.filter(e => e.eventSubType === 'Festival' || e.category === 'Community');
    } else {
      combinedRaw = combinedRaw.filter(e => e.eventSubType === subType);
    }
  }

  // Run 5-Stage Entity Resolution & Deduplication Engine
  const deduplicated: AutoPullEvent[] = deduplicateAndMergeEvents(combinedRaw);

  // Relevance ranking and chronological date sorting
  let ranked = deduplicated;
  if (keyword) {
    const scored = deduplicated
      .map(evt => ({ evt, score: computeEventRelevance(evt, keyword, city) }))
      .filter(item => item.score > 0);

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Most recent / imminent date first
      return parseEventDateToTimestamp(a.evt.date) - parseEventDateToTimestamp(b.evt.date);
    });

    ranked = scored.map(item => item.evt);
  } else {
    // When browsing without keyword, sort by most recent/imminent date first with city boost
    ranked.sort((a, b) => {
      const aCity = city && a.city.toLowerCase().includes(city.toLowerCase()) ? 1 : 0;
      const bCity = city && b.city.toLowerCase().includes(city.toLowerCase()) ? 1 : 0;
      if (aCity !== bCity) return bCity - aCity;
      return parseEventDateToTimestamp(a.date) - parseEventDateToTimestamp(b.date);
    });
  }

  // Cache latest results locally for quick retrieval, ensuring only upcoming events remain cached
  if (ranked.length > 0 && typeof window !== 'undefined') {
    try {
      const existingStr = localStorage.getItem(CACHE_STORAGE_KEY);
      const existing: AutoPullEvent[] = existingStr ? JSON.parse(existingStr) : [];
      const mergedMap = new Map<string, AutoPullEvent>();
      for (const e of [...ranked, ...existing]) {
        if (isEventUpcoming(e.date)) {
          mergedMap.set(e.id, e);
        }
      }
      localStorage.setItem(
        CACHE_STORAGE_KEY,
        JSON.stringify(Array.from(mergedMap.values()).slice(0, 100))
      );
    } catch {
      // ignore storage quota errors
    }
  }

  return ranked;
}

/**
 * Returns cached live events for instant offline/initial rendering,
 * strictly filtering out any events that occurred in the past.
 */
export function getCachedLiveEvents(): AutoPullEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const str = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!str) return [];
    const events: AutoPullEvent[] = JSON.parse(str);
    return events.filter(e => isEventUpcoming(e.date));
  } catch {
    return [];
  }
}

/**
 * Re-queries live promoter and venue feeds to detect if door times,
 * gate info, or show schedules were updated after publication.
 */
export async function syncLiveEventSchedule(params: {
  venue: string;
  title: string;
  performerOrTeam?: string;
  showtime?: string;
}): Promise<ResolvedSchedule> {
  const keyword = params.performerOrTeam || params.title;
  try {
    const events = await fetchTicketmasterEvents({ keyword, size: 6 });
    const venueLower = params.venue.toLowerCase();
    const matched = events.find(e => 
      e.venue.toLowerCase().includes(venueLower) ||
      venueLower.includes(e.venue.toLowerCase()) ||
      venueLower.includes('the dome') && e.venue.toLowerCase().includes('dome')
    );
    if (matched) {
      return {
        showtime: matched.showtime,
        doorsTime: matched.doorsTime,
        suggestedMeetupTime: matched.suggestedMeetupTime,
        doorsConfirmed: matched.doorsConfirmed ?? true,
        source: matched.doorsSource ?? 'Ticketmaster Live Manifest',
        venueGateInfo: matched.venueGateInfo,
        bagPolicy: matched.bagPolicy,
        verificationNotes: `Verified live with ${matched.venue} event manifest.`,
      };
    }
  } catch (err) {
    console.warn('[liveEventCatalog] syncLiveEventSchedule API error:', err);
  }

  // Fallback to venue archetype intelligence and known profiles
  return resolveEventSchedule({
    venueName: params.venue,
    rawShowtimeStr: params.showtime,
  });
}

