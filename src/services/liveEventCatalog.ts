import type { AutoPullEvent, EventSubType } from './eventAutoPull';

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
 * Normalizes 12-hour/24-hour time strings and computes the 3-stage dual-time matrix:
 * 1. Meetup Time (~1.5 to 2 hours before showtime)
 * 2. Doors Open (~1 hour before showtime)
 * 3. Showtime
 */
function computeDualTimeSchedule(localTimeStr?: string): {
  showtime: string;
  doorsTime: string;
  suggestedMeetupTime: string;
} {
  if (!localTimeStr) {
    return {
      showtime: '8:00 PM',
      doorsTime: '6:30 PM',
      suggestedMeetupTime: '5:30 PM',
    };
  }

  // Parse HH:mm:ss
  const parts = localTimeStr.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts.length > 1 ? parseInt(parts[1], 10) : 0;

  if (isNaN(hours)) hours = 20;

  const showtimeDate = new Date();
  showtimeDate.setHours(hours, minutes, 0, 0);

  const doorsDate = new Date(showtimeDate.getTime() - 60 * 60 * 1000); // 1h before
  const meetupDate = new Date(showtimeDate.getTime() - 2.5 * 60 * 60 * 1000); // 2.5h before (for dinner / drinks)

  const formatAmPm = (d: Date) => {
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    const mStr = m < 10 ? '0' + m : m;
    return `${h}:${mStr} ${ampm}`;
  };

  return {
    showtime: formatAmPm(showtimeDate),
    doorsTime: formatAmPm(doorsDate),
    suggestedMeetupTime: formatAmPm(meetupDate),
  };
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

  const params = new URLSearchParams({
    apikey: apiKey,
    size: String(query.size || 20),
    sort: 'date,asc',
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
      const dates = e.dates?.start || {};
      const localTime = dates.localTime;
      const { showtime, doorsTime, suggestedMeetupTime } = computeDualTimeSchedule(localTime);

      const venues = e._embedded?.venues || [];
      const venueObj = venues[0] || {};
      const venueName = venueObj.name || 'Arena / Music Hall';
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
        showtime,
        doorsTime,
        suggestedMeetupTime,
        suggestedMeetupLocation: `Meet outside ${venueName} (near Main Gate or nearby plaza/bar)`,
        image: bestImage,
        additionalImages: altImages,
        ticketUrl: e.url || '',
        ticketSectionInfo: 'Section 114 / Lower Bowl or GA Floor',
        priceRange,
        lineup: lineup.length > 0 ? lineup : [headliner],
        bagPolicy: 'Clear bags only (12"x6"x12") or clutches under 4.5"x6.5"',
        ageRestriction: 'All Ages',
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

  const params = new URLSearchParams({
    client_id: clientId,
    per_page: String(query.size || 20),
    sort: 'datetime_local.asc',
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
      const { showtime, doorsTime, suggestedMeetupTime } = computeDualTimeSchedule(timePart);

      const venueObj = e.venue || {};
      const venueName = venueObj.name || 'Arena';
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
        showtime,
        doorsTime,
        suggestedMeetupTime,
        suggestedMeetupLocation: `Meet near ${venueName} entrance or nearby pre-drinks gathering spot`,
        image: bestImage,
        additionalImages: altImages,
        ticketUrl: e.url || '',
        ticketSectionInfo: 'Section 100-Level or General Admission',
        priceRange,
        lineup: lineup.length > 0 ? lineup : [headliner],
        bagPolicy: 'Standard arena clear bag policy applies.',
        ageRestriction: 'All Ages',
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
  subType?: EventSubType | 'All';
  size?: number;
}): Promise<AutoPullEvent[]> {
  const keyword = params.keyword?.trim() || '';
  const city = params.city?.trim() || '';
  const subType = params.subType === 'All' ? undefined : params.subType;

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
  }

  // Query both APIs concurrently
  const [tmResults, sgResults] = await Promise.all([
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
  ]);

  // Combine and deduplicate by title/performer similarity
  const combined = [...tmResults, ...sgResults];
  const seenTitles = new Set<string>();
  const deduplicated: AutoPullEvent[] = [];

  for (const evt of combined) {
    const key = `${evt.performerOrTeam.toLowerCase()}-${evt.date}`;
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      deduplicated.push(evt);
    }
  }

  // Cache latest results locally for quick retrieval
  if (deduplicated.length > 0 && typeof window !== 'undefined') {
    try {
      const existingStr = localStorage.getItem(CACHE_STORAGE_KEY);
      const existing: AutoPullEvent[] = existingStr ? JSON.parse(existingStr) : [];
      const mergedMap = new Map<string, AutoPullEvent>();
      for (const e of [...deduplicated, ...existing]) {
        mergedMap.set(e.id, e);
      }
      localStorage.setItem(
        CACHE_STORAGE_KEY,
        JSON.stringify(Array.from(mergedMap.values()).slice(0, 100))
      );
    } catch {
      // ignore storage quota errors
    }
  }

  return deduplicated;
}

/**
 * Returns cached live events for instant offline/initial rendering.
 */
export function getCachedLiveEvents(): AutoPullEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const str = localStorage.getItem(CACHE_STORAGE_KEY);
    return str ? JSON.parse(str) : [];
  } catch {
    return [];
  }
}
