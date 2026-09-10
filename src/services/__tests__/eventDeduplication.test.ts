import {
  normalizeTitle,
  normalizeVenueName,
  normalizeDate,
  tokenSortRatio,
  stringSimilarity,
  computeTimeProximity,
  evaluateEventMatch,
  mergeEventPair,
  deduplicateAndMergeEvents,
} from '../eventDeduplication';
import { type AutoPullEvent } from '../eventAutoPull';
import { US_TOP_50_MARKETS } from '../../lib/usMarkets';

console.log('=== RUNNING AUTOMATED VERIFICATION SUITE ===\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    testsFailed++;
  }
}

// 1. Normalization Tests
console.log('--- Test Group 1: Text & Attribute Normalization ---');
const rawTitle1 = 'Live Nation Presents: LCD Soundsystem - World Tour 2026 at Brooklyn Steel';
const normTitle1 = normalizeTitle(rawTitle1);
assert(normTitle1 === 'lcd soundsystem', `Title normalized correctly (Got: "${normTitle1}")`);

const rawTitle2 = 'An Evening with Foo Fighters w/ Queens of the Stone Age';
const normTitle2 = normalizeTitle(rawTitle2);
assert(normTitle2 === 'foo fighters', `Featuring and presentation stripped (Got: "${normTitle2}")`);

const normVenue1 = normalizeVenueName('Crypto.com Arena');
assert(normVenue1 === 'crypto arena los angeles', `Venue alias mapped correctly (Got: "${normVenue1}")`);

const normDate1 = normalizeDate('Tue, Sep 15, 2026');
assert(normDate1.includes('sep 15'), `Date normalized correctly (Got: "${normDate1}")`);

// 2. Metric & Similarity Tests
console.log('\n--- Test Group 2: Similarity & Distance Metrics ---');
const sim1 = tokenSortRatio('Chicago Cubs vs St. Louis Cardinals', 'St. Louis Cardinals vs Chicago Cubs');
assert(sim1 >= 0.95, `Token sort ratio handles reordered sports matchups (${sim1.toFixed(2)})`);

const simRaw = stringSimilarity('United Center Chicago', 'United Center Chicago');
assert(simRaw === 1.0, `Exact string similarity matches identically (${simRaw})`);

const timeScore1 = computeTimeProximity('7:00 PM', '8:30 PM');
assert(timeScore1 >= 0.75, `Time proximity handles 90min door-to-show gap (${timeScore1.toFixed(2)})`);

const timeScore2 = computeTimeProximity('8:00 PM', '8:00 PM');
assert(timeScore2 === 1.0, `Exact showtime match scores 1.0 (${timeScore2})`);

// 3. Match Evaluation & Entity Resolution
console.log('\n--- Test Group 3: Multi-Signal Entity Resolution ---');
const evtA: AutoPullEvent = {
  id: 'tm-101',
  title: 'Live Nation Presents: AC/DC – POWER UP TOUR 2026',
  performerOrTeam: 'AC/DC',
  eventSubType: 'Concert',
  category: 'Entertainment',
  venue: "The Dome at America's Center",
  venueAddress: '701 Convention Plaza, St. Louis, MO 63101',
  city: 'St. Louis, MO',
  date: '2026-09-15',
  showtime: '8:00 PM',
  doorsTime: '6:30 PM',
  suggestedMeetupTime: '6:00 PM',
  suggestedMeetupLocation: 'Main Gate Plaza',
  image: 'https://images.unsplash.com/tm.jpg',
  ticketUrl: 'https://www.ticketmaster.com/event/101',
  ticketSectionInfo: 'Section 114 / Lower Bowl',
  priceRange: '$85 - $325',
  lineup: ['AC/DC'],
  bagPolicy: 'Clear bags only',
  ageRestriction: 'All Ages',
  description: 'Official Live Nation concert.',
  doorsConfirmed: true,
};

const evtB: AutoPullEvent = {
  id: 'sg-202',
  title: 'AC/DC (Power Up Tour)',
  performerOrTeam: 'AC/DC',
  eventSubType: 'Concert',
  category: 'Entertainment',
  venue: 'The Dome at Americas Center',
  venueAddress: 'Convention Plaza, St. Louis',
  city: 'St. Louis, MO',
  date: '2026-09-15',
  showtime: '8:00 PM',
  doorsTime: '7:00 PM',
  suggestedMeetupTime: '6:30 PM',
  suggestedMeetupLocation: 'Plaza Pre-drinks',
  image: 'https://images.unsplash.com/sg.jpg',
  ticketUrl: 'https://seatgeek.com/ac-dc-tickets/202',
  ticketSectionInfo: 'Upper Deck GA',
  priceRange: '$65 - $190',
  lineup: ['AC/DC', 'Foo Fighters'],
  bagPolicy: 'Clear bags only',
  ageRestriction: 'All Ages',
  description: 'SeatGeek verified listing for AC/DC live.',
};

const matchResult = evaluateEventMatch(evtA, evtB);
assert(matchResult.isMatch, `AC/DC event across Ticketmaster & SeatGeek detected as duplicate (Score: ${matchResult.compositeScore})`);
assert(matchResult.compositeScore >= 0.85, `Composite score above high-confidence threshold`);

// Negative Test: Different Metro Area
const evtC: AutoPullEvent = {
  ...evtB,
  id: 'sg-303',
  city: 'Chicago, IL',
  venue: 'United Center',
};
const crossCityMatch = evaluateEventMatch(evtA, evtC);
assert(!crossCityMatch.isMatch, `Cross-city event correctly rejected as non-duplicate (Score: ${crossCityMatch.compositeScore})`);

// Negative Test: Mismatched Dates
const evtD: AutoPullEvent = {
  ...evtB,
  id: 'sg-404',
  date: '2026-09-20',
};
const dateMismatch = evaluateEventMatch(evtA, evtD);
assert(!dateMismatch.isMatch, `Date-mismatched event correctly rejected by temporal blocking`);

// 4. Record Merging & Multi-Ticket Options
console.log('\n--- Test Group 4: Master Record Merging & Ticket Portals ---');
const merged = mergeEventPair(evtA, evtB, matchResult.compositeScore);
assert(Boolean(merged.canonicalId), `Canonical ID generated (${merged.canonicalId})`);
assert(merged.ticketOptions?.length === 2, `Both Ticketmaster and SeatGeek ticket options preserved (Count: ${merged.ticketOptions?.length})`);
assert(merged.lineup.includes('Foo Fighters'), `Lineup union includes support act from secondary source`);
assert(merged.doorsConfirmed === true, `Confirmed doors status preserved`);

// 5. Batch Deduplication Test
console.log('\n--- Test Group 5: Batch Deduplication Pipeline ---');
const rawBatch: AutoPullEvent[] = [
  evtA,
  evtB,
  {
    id: 'dostuff-stlouis-1',
    title: 'AC/DC in St. Louis',
    performerOrTeam: 'AC/DC',
    eventSubType: 'Concert',
    category: 'Entertainment',
    venue: "The Dome at America's Center",
    venueAddress: 'St. Louis, MO',
    city: 'St. Louis, MO',
    date: '2026-09-15',
    showtime: '8:00 PM',
    doorsTime: '6:30 PM',
    suggestedMeetupTime: '6:00 PM',
    suggestedMeetupLocation: 'Entry A',
    image: 'https://images.unsplash.com/dostuff.jpg',
    ticketUrl: 'https://dostuff.com/event/acdc',
    ticketSectionInfo: 'VIP Box',
    priceRange: '$120 - $350',
    lineup: ['AC/DC'],
    bagPolicy: 'Clear bags only',
    ageRestriction: 'All Ages',
    description: 'Local music guide editor pick.',
  },
  {
    id: 'tm-505-jazz',
    title: 'Blue Note Jazz Quintet',
    performerOrTeam: 'Blue Note Quintet',
    eventSubType: 'Concert',
    category: 'Entertainment',
    venue: 'Jazz Bistro St. Louis',
    venueAddress: '3536 Washington Ave, St. Louis, MO',
    city: 'St. Louis, MO',
    date: '2026-09-15',
    showtime: '7:30 PM',
    doorsTime: '6:30 PM',
    suggestedMeetupTime: '6:30 PM',
    suggestedMeetupLocation: 'Bistro Bar',
    image: 'https://images.unsplash.com/jazz.jpg',
    ticketUrl: 'https://ticketmaster.com/jazz',
    ticketSectionInfo: 'Table Seating',
    priceRange: '$35',
    lineup: ['Blue Note Quintet'],
    bagPolicy: 'No bags over 14 inches',
    ageRestriction: '21+',
    description: 'Intimate evening of live jazz.',
  }
];

const deduplicatedBatch = deduplicateAndMergeEvents(rawBatch);
assert(deduplicatedBatch.length === 2, `Raw stream of 4 events deduplicated down to 2 distinct events (Got: ${deduplicatedBatch.length})`);
const acdcCanonical = deduplicatedBatch.find(e => e.performerOrTeam === 'AC/DC');
assert(acdcCanonical?.ticketOptions?.length === 3, `AC/DC canonical event consolidated 3 ticket portals (Got: ${acdcCanonical?.ticketOptions?.length})`);

// 6. US Top 50 Markets Registry
console.log('\n--- Test Group 6: US Top 50 Markets Registry ---');
assert(US_TOP_50_MARKETS.length === 50, `All 50 top US metro markets registered (Count: ${US_TOP_50_MARKETS.length})`);
assert(US_TOP_50_MARKETS[0].city === 'New York' && US_TOP_50_MARKETS[0].rank === 1, `Rank 1 is New York`);
assert(US_TOP_50_MARKETS[49].city === 'Birmingham' && US_TOP_50_MARKETS[49].rank === 50, `Rank 50 is Birmingham`);

console.log(`\n=== TEST RESULTS: ${testsPassed} Passed, ${testsFailed} Failed ===`);
if (testsFailed > 0) {
  process.exit(1);
}
