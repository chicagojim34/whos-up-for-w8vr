import { ALPHABETICAL_US_MARKETS, US_TOP_50_MARKETS } from '../../lib/usMarkets';
import { matchesCityFilter, searchAutoPullEvents } from '../eventAutoPull';
import { searchLiveEventCatalog } from '../liveEventCatalog';

async function runTests() {
  console.log('=== VERIFYING ALPHABETICAL MARKETS & ST. LOUIS CITY FILTERING ===\n');
  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, name: string) {
    if (cond) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`);
      failed++;
    }
  }

  // 1. Markets alphabetical sort
  assert(ALPHABETICAL_US_MARKETS.length === US_TOP_50_MARKETS.length, 'ALPHABETICAL_US_MARKETS has all 50 markets');
  assert(ALPHABETICAL_US_MARKETS[0].city === 'Atlanta', `First alphabetical market is Atlanta (got: ${ALPHABETICAL_US_MARKETS[0].city})`);
  assert(ALPHABETICAL_US_MARKETS[1].city === 'Austin', `Second alphabetical market is Austin (got: ${ALPHABETICAL_US_MARKETS[1].city})`);
  assert(ALPHABETICAL_US_MARKETS[2].city === 'Baltimore', `Third alphabetical market is Baltimore (got: ${ALPHABETICAL_US_MARKETS[2].city})`);
  assert(ALPHABETICAL_US_MARKETS[ALPHABETICAL_US_MARKETS.length - 1].city === 'Washington', `Last alphabetical market is Washington (got: ${ALPHABETICAL_US_MARKETS[ALPHABETICAL_US_MARKETS.length - 1].city})`);

  let isSorted = true;
  for (let i = 0; i < ALPHABETICAL_US_MARKETS.length - 1; i++) {
    if (ALPHABETICAL_US_MARKETS[i].city.localeCompare(ALPHABETICAL_US_MARKETS[i + 1].city) > 0) {
      isSorted = false;
      break;
    }
  }
  assert(isSorted, 'ALPHABETICAL_US_MARKETS is strictly sorted alphabetically by city name');

  // 2. matchesCityFilter assertions
  assert(matchesCityFilter('St. Louis, MO', '1 Fine Arts Dr, St. Louis, MO', 'St. Louis'), 'matchesCityFilter matches "St. Louis, MO" with "St. Louis"');
  assert(matchesCityFilter('Saint Louis, MO', 'Forest Park', 'St. Louis'), 'matchesCityFilter matches "Saint Louis, MO" with "St. Louis"');
  assert(matchesCityFilter('St. Louis, MO', 'Busch Stadium', 'Saint Louis'), 'matchesCityFilter matches "St. Louis, MO" with "Saint Louis"');
  assert(matchesCityFilter('St. Louis, MO', '3106 Olive St, St. Louis, MO', 'St. Louis, MO'), 'matchesCityFilter matches "St. Louis, MO" with "St. Louis, MO"');

  // Rejections
  assert(!matchesCityFilter('Chicago, IL', '4444 N Ravenswood Ave, Chicago, IL', 'St. Louis'), 'matchesCityFilter rejects Chicago event when St. Louis is selected');
  assert(!matchesCityFilter('Chicago, IL', '1520 N Damen Ave, Chicago, IL', 'St. Louis'), 'matchesCityFilter rejects The Violet Hour Chicago when St. Louis is selected');
  assert(!matchesCityFilter('New York, NY', 'Houston St, New York', 'St. Louis'), 'matchesCityFilter rejects New York when St. Louis is selected');

  // "All Cities" allow-all
  assert(matchesCityFilter('Chicago, IL', 'Chicago, IL', 'All Cities'), 'matchesCityFilter allows Chicago on "All Cities"');
  assert(matchesCityFilter('St. Louis, MO', 'St. Louis, MO', 'All Cities'), 'matchesCityFilter allows St. Louis on "All Cities"');

  // 3. searchAutoPullEvents with strictCity=true
  const stlArtCatalog = searchAutoPullEvents('Art', 'St. Louis', true);
  assert(stlArtCatalog.length > 0, `searchAutoPullEvents("Art", "St. Louis", true) returned ${stlArtCatalog.length} events`);
  const hasChicagoLeak = stlArtCatalog.some(e => e.city.includes('Chicago') || e.venueAddress.includes('Chicago'));
  assert(!hasChicagoLeak, 'searchAutoPullEvents strictly excluded Chicago events (e.g. Ravenswood ArtWalk) when St. Louis selected');
  const hasStlArt = stlArtCatalog.some(e => e.city.includes('St. Louis'));
  assert(hasStlArt, 'searchAutoPullEvents returned St. Louis events (e.g. SLAM Museum / Forest Park Art Walk)');

  // 4. searchLiveEventCatalog for St. Louis with keyword 'Art'
  const liveStlArt = await searchLiveEventCatalog({
    keyword: 'Art',
    city: 'St. Louis',
    size: 20,
  });
  assert(liveStlArt.length > 0, `searchLiveEventCatalog returned ${liveStlArt.length} events for Art in St. Louis`);
  const liveChicagoLeak = liveStlArt.some(e => e.city.toLowerCase().includes('chicago') || e.venueAddress.toLowerCase().includes('chicago'));
  assert(!liveChicagoLeak, 'searchLiveEventCatalog strictly has ZERO Chicago events when St. Louis is selected');
  const allMatchStl = liveStlArt.every(e => matchesCityFilter(e.city, e.venueAddress, 'St. Louis'));
  assert(allMatchStl, 'Every event returned by searchLiveEventCatalog matches St. Louis');

  // 5. searchLiveEventCatalog browsing without keyword for St. Louis
  const liveStlBrowse = await searchLiveEventCatalog({
    city: 'St. Louis',
    size: 20,
  });
  assert(liveStlBrowse.length > 0, `searchLiveEventCatalog browsing returned ${liveStlBrowse.length} events for St. Louis`);
  const allBrowseMatchStl = liveStlBrowse.every(e => matchesCityFilter(e.city, e.venueAddress, 'St. Louis'));
  assert(allBrowseMatchStl, 'Every browsing event matches St. Louis');

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
