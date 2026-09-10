import { type AutoPullEvent } from './eventAutoPull';
import type { CanonicalTicketOption } from '../types';

// ============================================================================
// 1. TEXT NORMALIZATION & PREPROCESSING
// ============================================================================

/**
 * Normalizes an event title by stripping common promoter noise, tour suffixes,
 * featuring artist clauses, and punctuation to extract the core performance identity.
 */
export function normalizeTitle(rawTitle: string): string {
  if (!rawTitle) return '';

  let title = rawTitle.toLowerCase();

  // Strip promoter and presentation prefixes
  title = title.replace(/^(live nation presents:?|aeg presents:?|jam presents:?|c3 presents:?|bowery presents:?|presents:?)/gi, '');
  title = title.replace(/^(an evening with:?|an exclusive night with:?|in concert:?)/gi, '');

  // Strip "live at [venue]" or "at [venue]"
  title = title.replace(/\s+(live\s+at|at)\s+[\w\s&'-]+$/gi, '');

  // Strip "live in [city]" or "in [city]"
  title = title.replace(/\s+(live\s+in|in)\s+[\w\s&'-]+$/gi, '');

  // Strip tour suffixes like " - World Tour 2026", " (North American Tour)", "Power Up Tour 2026"
  title = title.replace(/\s*[-–—:]\s*[\w\s]+tour(\s+\d{4})?/gi, '');
  title = title.replace(/\s*\([\w\s]+tour(\s+\d{4})?\)/gi, '');

  // Strip special featuring markers (handled separately in performer parsing)
  title = title.replace(/\s+(w\/|with special guests?|featuring|feat\.|ft\.)\s+.*$/gi, '');

  // Normalize punctuation and extra spaces
  title = title.replace(/[^\w\s]/g, ' ');
  title = title.replace(/\s+/g, ' ').trim();

  return title;
}

/**
 * Normalizes performer or headliner string.
 */
export function normalizePerformer(rawPerformer: string): string {
  if (!rawPerformer) return '';
  let performer = rawPerformer.toLowerCase();
  performer = performer.replace(/^(the\s+)/gi, '');
  performer = performer.replace(/[^\w\s]/g, ' ');
  return performer.replace(/\s+/g, ' ').trim();
}

/**
 * Normalizes venue names by stripping institutional words ("Arena", "Theatre", etc.)
 * and resolving known metropolitan aliases.
 */
export function normalizeVenueName(rawVenue: string): string {
  if (!rawVenue) return '';

  let venue = rawVenue.toLowerCase();

  // Common metropolitan alias mappings
  if (venue.includes('crypto.com') || venue.includes('staples center')) return 'crypto arena los angeles';
  if (venue.includes('chastain park') || venue.includes('cadence bank')) return 'cadence bank amphitheatre atlanta';
  if (venue.includes('united center')) return 'united center chicago';
  if (venue.includes('madison square garden') || venue === 'msg') return 'madison square garden nyc';
  if (venue.includes('red rocks')) return 'red rocks amphitheatre morrison';
  if (venue.includes('first avenue') && !venue.includes('7th st')) return 'first avenue minneapolis';
  if (venue.includes('7th st entry')) return '7th st entry minneapolis';

  // Strip generic entity suffixes
  venue = venue.replace(/\b(the|center for the performing arts|performing arts center|amphitheater|amphitheatre|stadium|arena|hall|theatre|theater|pavilion|auditorium|ballroom|complex|center)\b/gi, '');
  venue = venue.replace(/[^\w\s]/g, ' ');
  return venue.replace(/\s+/g, ' ').trim();
}

/**
 * Extracts a normalized date string (YYYY-MM-DD or standard display date).
 */
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';
  // If ISO YYYY-MM-DD is present
  const isoMatch = dateStr.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (isoMatch) return isoMatch[0];

  // If text format like "Tue, Sep 15" or "September 15, 2026"
  const cleaned = dateStr.toLowerCase().replace(/^(mon|tue|wed|thu|fri|sat|sun),?\s*/i, '').trim();
  return cleaned;
}

// ============================================================================
// 2. SIMILARITY METRICS & SCORING ALGORITHMS
// ============================================================================

/**
 * Levenshtein distance between two strings.
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,       // deletion
        dp[i][j - 1] + 1,       // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Normalized string similarity based on Levenshtein (0.0 to 1.0).
 */
export function stringSimilarity(s1: string, s2: string): number {
  if (!s1 && !s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  if (s1 === s2) return 1.0;

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1, s2);
  return Math.max(0, 1.0 - dist / maxLen);
}

/**
 * Token Sort Ratio: Tokenizes both strings, sorts tokens alphabetically,
 * and computes similarity. Highly resilient to reordered words (e.g. "Chicago Cubs vs Cardinals" vs "Cardinals vs Chicago Cubs").
 */
export function tokenSortRatio(s1: string, s2: string): number {
  if (!s1 && !s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const tokens1 = s1.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');
  const tokens2 = s2.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');

  return stringSimilarity(tokens1, tokens2);
}

/**
 * Jaccard token overlap between two sets of strings.
 */
export function jaccardSimilarity(tokensA: string[], tokensB: string[]): number {
  const setA = new Set(tokensA.map(t => t.toLowerCase().trim()).filter(Boolean));
  const setB = new Set(tokensB.map(t => t.toLowerCase().trim()).filter(Boolean));

  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Time proximity score: Evaluates time difference with a Gaussian tolerance curve.
 * A difference of 1-2 hours (doors vs showtime) receives a score of ~0.80 - 0.95.
 */
export function computeTimeProximity(time1?: string, time2?: string): number {
  if (!time1 || !time2) return 0.85; // neutral when one time is missing
  if (time1 === time2) return 1.0;

  // Parse hours and minutes from "8:00 PM" or "20:00"
  const parseMinutes = (t: string): number | null => {
    const match = t.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const mer = match[3]?.toUpperCase();
    if (mer === 'PM' && hours < 12) hours += 12;
    if (mer === 'AM' && hours === 12) hours = 0;
    return hours * 60 + mins;
  };

  const m1 = parseMinutes(time1);
  const m2 = parseMinutes(time2);
  if (m1 === null || m2 === null) return 0.85;

  const diffMinutes = Math.abs(m1 - m2);
  // Within 30 minutes: 1.0 (virtually identical start time)
  if (diffMinutes <= 30) return 1.0;
  // Within 90 minutes (standard door-to-show window): decay 1.0 -> 0.85
  if (diffMinutes <= 90) {
    return 1.0 - ((diffMinutes - 30) / 60) * 0.15;
  }
  // Within 180 minutes (early doors vs late headliner): decay 0.85 -> 0.50
  if (diffMinutes <= 180) {
    return 0.85 - ((diffMinutes - 90) / 90) * 0.35;
  }
  return Math.max(0.2, 0.50 - ((diffMinutes - 180) / 180) * 0.3);
}

// ============================================================================
// 3. MULTI-SIGNAL COMPOSITE EVALUATION & MATCHING ENGINE
// ============================================================================

export interface MatchEvaluationResult {
  isMatch: boolean;
  isAmbiguous: boolean;
  compositeScore: number;
  breakdown: {
    titleScore: number;
    performerScore: number;
    venueScore: number;
    timeScore: number;
    categoryScore: number;
  };
  reason: string;
}

/**
 * Evaluates whether two events represent the same real-world occurrence across different sources.
 */
export function evaluateEventMatch(e1: AutoPullEvent, e2: AutoPullEvent): MatchEvaluationResult {
  // --- Stage 2: Temporal Blocking ---
  // If dates are non-empty and clearly different calendar days, instant mismatch
  const date1 = normalizeDate(e1.date);
  const date2 = normalizeDate(e2.date);
  if (date1 && date2 && date1 !== date2) {
    // If the strings don't match, check if one contains the other (e.g. "Sep 15" vs "2026-09-15")
    const d1Simple = date1.replace(/[^\w]/g, '');
    const d2Simple = date2.replace(/[^\w]/g, '');
    if (!d1Simple.includes(d2Simple) && !d2Simple.includes(d1Simple)) {
      return {
        isMatch: false,
        isAmbiguous: false,
        compositeScore: 0.0,
        breakdown: { titleScore: 0, performerScore: 0, venueScore: 0, timeScore: 0, categoryScore: 0 },
        reason: `Temporal block mismatch: ${e1.date} vs ${e2.date}`,
      };
    }
  }

  // --- Stage 3: Deterministic Hard Matches ---
  // If identical ticket URLs or exact ID link
  if (e1.ticketUrl && e2.ticketUrl && e1.ticketUrl === e2.ticketUrl) {
    return {
      isMatch: true,
      isAmbiguous: false,
      compositeScore: 1.0,
      breakdown: { titleScore: 1, performerScore: 1, venueScore: 1, timeScore: 1, categoryScore: 1 },
      reason: 'Deterministic match: identical ticket URL.',
    };
  }

  const normTitle1 = normalizeTitle(e1.title);
  const normTitle2 = normalizeTitle(e2.title);
  const normVenue1 = normalizeVenueName(e1.venue);
  const normVenue2 = normalizeVenueName(e2.venue);
  const normPerf1 = normalizePerformer(e1.performerOrTeam);
  const normPerf2 = normalizePerformer(e2.performerOrTeam);

  // Exact normalized title + exact normalized venue -> Deterministic match
  if (normTitle1 && normTitle2 && normTitle1 === normTitle2 && normVenue1 && normVenue2 && normVenue1 === normVenue2) {
    return {
      isMatch: true,
      isAmbiguous: false,
      compositeScore: 0.98,
      breakdown: { titleScore: 1.0, performerScore: 1.0, venueScore: 1.0, timeScore: 0.9, categoryScore: 1.0 },
      reason: 'Deterministic match: identical normalized title and venue.',
    };
  }

  // --- Stage 4: Multi-Signal Probabilistic Scoring ---
  // 1. Title Similarity (Token sort ratio + raw Levenshtein)
  const titleSortScore = tokenSortRatio(normTitle1, normTitle2);
  const titleRawScore = stringSimilarity(normTitle1, normTitle2);
  let titleScore = Math.max(titleSortScore, titleRawScore);

  // Substring containment bonus (e.g. "AC/DC" in "AC/DC - Power Up Tour")
  if (normTitle1 && normTitle2) {
    if (normTitle1.includes(normTitle2) || normTitle2.includes(normTitle1)) {
      titleScore = Math.max(titleScore, 0.88);
    }
  }

  // 2. Performer / Headliner Similarity
  const perfScore = normPerf1 && normPerf2
    ? Math.max(stringSimilarity(normPerf1, normPerf2), tokenSortRatio(normPerf1, normPerf2))
    : titleScore; // fallback to title if performer field is blank

  // Lineup overlap bonus
  const lineup1 = e1.lineup || (e1.performerOrTeam ? [e1.performerOrTeam] : []);
  const lineup2 = e2.lineup || (e2.performerOrTeam ? [e2.performerOrTeam] : []);
  const lineupJaccard = jaccardSimilarity(lineup1, lineup2);
  const finalPerformerScore = Math.max(perfScore, lineupJaccard);

  // 3. Venue & City Proximity
  let venueScore = 0.5; // neutral baseline
  if (normVenue1 && normVenue2) {
    const venueRawSim = stringSimilarity(normVenue1, normVenue2);
    const venueTokenSim = tokenSortRatio(normVenue1, normVenue2);
    venueScore = Math.max(venueRawSim, venueTokenSim);
    // Substring containment bonus (e.g. "Riviera" in "Riviera Theatre")
    if (normVenue1.includes(normVenue2) || normVenue2.includes(normVenue1)) {
      venueScore = Math.max(venueScore, 0.90);
    }
  }

  // City penalty if cities are specified and totally different
  if (e1.city && e2.city) {
    const c1 = e1.city.toLowerCase().split(',')[0].trim();
    const c2 = e2.city.toLowerCase().split(',')[0].trim();
    if (c1 && c2 && c1 !== c2 && !c1.includes(c2) && !c2.includes(c1)) {
      venueScore *= 0.4; // significant penalty for mismatched metro
    }
  }

  // Strong performer concordance boost:
  // If the normalized performer is identical and venue matches strongly, ensure titleScore reflects same event
  if (normPerf1 && normPerf2 && (normPerf1 === normPerf2 || normPerf1.includes(normPerf2) || normPerf2.includes(normPerf1))) {
    if (venueScore >= 0.85) {
      titleScore = Math.max(titleScore, 0.92);
    }
  }

  // 4. Time Proximity (Doors vs Showtime tolerance)
  const timeScore = computeTimeProximity(e1.showtime || e1.doorsTime, e2.showtime || e2.doorsTime);

  // 5. Category Agreement
  const categoryScore = e1.category === e2.category || e1.eventSubType === e2.eventSubType ? 1.0 : 0.4;

  // Weighted Composite Formula:
  // Title (0.35) + Performer (0.25) + Venue (0.20) + Time (0.15) + Category (0.05)
  const compositeScore =
    0.35 * titleScore +
    0.25 * finalPerformerScore +
    0.20 * venueScore +
    0.15 * timeScore +
    0.05 * categoryScore;

  // Thresholds:
  // >= 0.84: High-confidence merge
  // 0.65 - 0.83: Borderline / ambiguous
  // < 0.65: Distinct event
  const isMatch = compositeScore >= 0.84;
  const isAmbiguous = !isMatch && compositeScore >= 0.65;

  let reason = 'Distinct events';
  if (isMatch) {
    reason = `Multi-signal match (Score: ${compositeScore.toFixed(2)}) - High confidence title, performer & venue concordance.`;
  } else if (isAmbiguous) {
    reason = `Ambiguous boundary (Score: ${compositeScore.toFixed(2)}) - Flagged for review or cross-link representation.`;
  }

  return {
    isMatch,
    isAmbiguous,
    compositeScore: Math.round(compositeScore * 100) / 100,
    breakdown: {
      titleScore: Math.round(titleScore * 100) / 100,
      performerScore: Math.round(finalPerformerScore * 100) / 100,
      venueScore: Math.round(venueScore * 100) / 100,
      timeScore: Math.round(timeScore * 100) / 100,
      categoryScore: Math.round(categoryScore * 100) / 100,
    },
    reason,
  };
}

// ============================================================================
// 4. MASTER RECORD SYNTHESIS & MULTI-TICKET AGGREGATION
// ============================================================================

/**
 * Determines the ticket provider brand from a URL or source name.
 */
export function inferTicketProvider(url: string, fallbackName: string): { provider: string; type: CanonicalTicketOption['type'] } {
  const u = (url || '').toLowerCase();
  if (u.includes('ticketmaster.com') || u.includes('livenation.com')) {
    return { provider: 'Ticketmaster', type: 'primary' };
  }
  if (u.includes('seatgeek.com')) {
    return { provider: 'SeatGeek', type: 'official_resale' };
  }
  if (u.includes('axs.com')) {
    return { provider: 'AXS', type: 'primary' };
  }
  if (u.includes('dice.fm')) {
    return { provider: 'DICE', type: 'primary' };
  }
  if (u.includes('todaytix.com') || u.includes('hottix.org') || u.includes('tdf.org')) {
    return { provider: 'TodayTix / Rush', type: 'rush_discount' };
  }
  if (u.includes('eventbrite.com')) {
    return { provider: 'Eventbrite', type: 'community' };
  }
  if (u.includes('etix.com')) {
    return { provider: 'eTix', type: 'primary' };
  }
  if (u.includes('exploretock.com') || u.includes('resy.com') || u.includes('opentable.com')) {
    return { provider: 'Dining / Experience', type: 'experience' };
  }
  if (u.includes('stubhub.com') || u.includes('vividseats.com') || u.includes('gametime.co') || u.includes('tickpick.com')) {
    return { provider: 'Secondary Marketplace', type: 'secondary' };
  }
  return { provider: fallbackName || 'Official Ticketing', type: 'primary' };
}

/**
 * Merges two matching event records into a single consolidated Canonical Event.
 * Preserves both ticket portal links without data loss.
 */
export function mergeEventPair(primary: AutoPullEvent, secondary: AutoPullEvent, confidence: number): AutoPullEvent {
  // Initialize or copy ticketOptions
  const optionsMap = new Map<string, CanonicalTicketOption>();

  const addOption = (evt: AutoPullEvent, defaultLabel: string) => {
    if (!evt.ticketUrl) return;
    const { provider, type } = inferTicketProvider(evt.ticketUrl, defaultLabel);
    const key = evt.ticketUrl.toLowerCase().trim();
    if (!optionsMap.has(key)) {
      optionsMap.set(key, {
        id: `tkt-${Math.random().toString(36).slice(2, 8)}`,
        provider,
        type,
        url: evt.ticketUrl,
        sectionInfo: evt.ticketSectionInfo || 'General Admission / Reserved',
        sourceLabel: `${provider} (${type === 'primary' ? 'Primary Box Office' : type === 'rush_discount' ? 'Discount / Rush' : 'Verified Partner'})`,
      });
    }
  };

  // If primary already has structured ticketOptions, copy them
  if (primary.ticketOptions && primary.ticketOptions.length > 0) {
    primary.ticketOptions.forEach(opt => optionsMap.set(opt.url.toLowerCase().trim(), opt));
  } else if (primary.ticketUrl) {
    addOption(primary, 'Primary Source');
  }

  // Add secondary ticket option
  if (secondary.ticketOptions && secondary.ticketOptions.length > 0) {
    secondary.ticketOptions.forEach(opt => {
      const key = opt.url.toLowerCase().trim();
      if (!optionsMap.has(key)) optionsMap.set(key, opt);
    });
  } else if (secondary.ticketUrl) {
    addOption(secondary, 'Secondary Partner');
  }

  // Provenance Sources Tracking
  const provSet = new Set<string>(primary.provenanceSources || []);
  if (primary.doorsSource) provSet.add(primary.doorsSource);
  if (secondary.doorsSource) provSet.add(secondary.doorsSource);
  provSet.add(secondary.title);

  // Lineup merge
  const combinedLineup = Array.from(
    new Set([...(primary.lineup || []), ...(secondary.lineup || [])])
  );

  // Images: combine best images
  const allImages = Array.from(
    new Set([
      primary.image,
      secondary.image,
      ...(primary.additionalImages || []),
      ...(secondary.additionalImages || []),
    ].filter(Boolean))
  );

  // Dual-time synthesis: keep confirmed doorsTime, or earlier doorsTime
  const doorsConfirmed = primary.doorsConfirmed || secondary.doorsConfirmed || false;
  const doorsTime = primary.doorsTime || secondary.doorsTime || 'Doors TBA';
  const showtime = primary.showtime || secondary.showtime || '7:00 PM';

  return {
    ...primary,
    canonicalId: primary.canonicalId || `canon-${primary.id}`,
    // Prefer longer/more informative description
    description: (secondary.description?.length || 0) > (primary.description?.length || 0)
      ? secondary.description
      : primary.description,
    lineup: combinedLineup,
    additionalImages: allImages.slice(1, 6),
    doorsTime,
    doorsConfirmed,
    showtime,
    ticketOptions: Array.from(optionsMap.values()),
    provenanceSources: Array.from(provSet),
    confidenceScore: Math.max(primary.confidenceScore || 0.9, confidence),
  };
}

// ============================================================================
// 5. BATCH DEDUPLICATION & CLUSTERING PIPELINE
// ============================================================================

/**
 * Deduplicates and clusters an arbitrary list of raw events from multiple APIs,
 * syndication feeds, and scrapers into a unified, consolidated catalog.
 */
export function deduplicateAndMergeEvents(rawEvents: AutoPullEvent[]): AutoPullEvent[] {
  if (!rawEvents || rawEvents.length === 0) return [];

  const canonicalResults: AutoPullEvent[] = [];

  for (const candidate of rawEvents) {
    let matchedIndex = -1;
    let bestScore = 0;

    // Check candidate against existing canonical results
    for (let i = 0; i < canonicalResults.length; i++) {
      const existing = canonicalResults[i];
      const evaluation = evaluateEventMatch(existing, candidate);

      if (evaluation.isMatch && evaluation.compositeScore > bestScore) {
        bestScore = evaluation.compositeScore;
        matchedIndex = i;
      }
    }

    if (matchedIndex >= 0) {
      // Merge candidate into matching canonical result
      canonicalResults[matchedIndex] = mergeEventPair(
        canonicalResults[matchedIndex],
        candidate,
        bestScore
      );
    } else {
      // Initialize candidate with its initial ticket option and canonical ID
      const initialTicketOptions: CanonicalTicketOption[] = [];
      if (candidate.ticketUrl) {
        const { provider, type } = inferTicketProvider(candidate.ticketUrl, 'Primary Source');
        initialTicketOptions.push({
          id: `tkt-${Math.random().toString(36).slice(2, 8)}`,
          provider,
          type,
          url: candidate.ticketUrl,
          sectionInfo: candidate.ticketSectionInfo || 'General Admission',
          sourceLabel: `${provider} (${type === 'primary' ? 'Primary Box Office' : 'Partner Portal'})`,
        });
      }

      canonicalResults.push({
        ...candidate,
        canonicalId: `canon-${candidate.id}`,
        ticketOptions: candidate.ticketOptions || initialTicketOptions,
        provenanceSources: candidate.provenanceSources || [candidate.venue || 'Aggregated Feed'],
        confidenceScore: 1.0,
      });
    }
  }

  return canonicalResults;
}
