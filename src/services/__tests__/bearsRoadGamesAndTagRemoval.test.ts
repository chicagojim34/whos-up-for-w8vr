import fs from 'node:fs';
import path from 'node:path';
import { searchLiveEventCatalog } from '../liveEventCatalog';
import { searchAutoPullEvents, resolveDynamicOuting, matchesCityFilter } from '../eventAutoPull';

async function runTests() {
  console.log('=== VERIFYING CHICAGO BEARS ROAD GAMES & MERGED TAG REMOVAL ===\n');
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

  // 1. Tag removal from LiveEventCatalogModal
  const modalPath = path.resolve(process.cwd(), 'src/components/LiveEventCatalogModal.tsx');
  const modalContent = fs.readFileSync(modalPath, 'utf-8');
  assert(!modalContent.includes('Merged ('), 'LiveEventCatalogModal does not contain "Merged (" tag');
  assert(!modalContent.includes('Feeds)'), 'LiveEventCatalogModal does not contain "Feeds)" tag');

  // 2. resolveDynamicOuting skips sports team queries
  const fakeDiningBears = resolveDynamicOuting('chicago bears', 'Chicago, IL');
  assert(fakeDiningBears === null, 'resolveDynamicOuting returns null for "chicago bears" (no fake restaurants)');
  const fakeDiningVikings = resolveDynamicOuting('minnesota vikings', 'Minneapolis, MN');
  assert(fakeDiningVikings === null, 'resolveDynamicOuting returns null for "minnesota vikings"');

  // 3. Local catalog has Chicago Bears games with road games
  const localBears = searchAutoPullEvents('chicago bears');
  assert(localBears.length >= 4, `Local catalog contains at least 4 Chicago Bears games (got: ${localBears.length})`);
  const localAtl = localBears.find(e => e.city.includes('Atlanta') || e.venue.includes('Mercedes-Benz'));
  assert(localAtl !== undefined, 'Local catalog includes Atlanta road game at Mercedes-Benz Stadium');
  const localMinn = localBears.find(e => e.city.includes('Minneapolis') || e.venue.includes('U.S. Bank Stadium'));
  assert(localMinn !== undefined, 'Local catalog includes Minneapolis road game at U.S. Bank Stadium');
  const localSoldier = localBears.find(e => e.venue.includes('Soldier Field'));
  assert(localSoldier !== undefined, 'Local catalog includes Soldier Field home games');

  // 4. searchLiveEventCatalog with "All Markets" includes road games (Atlanta & Minneapolis)
  console.log('\nQuerying searchLiveEventCatalog for "chicago bears" across All Markets...');
  const allBears = await searchLiveEventCatalog({ keyword: 'chicago bears', size: 40 });
  assert(allBears.length > 0, `Returned ${allBears.length} events for "chicago bears"`);

  const atlRoadGame = allBears.find(e => matchesCityFilter(e.city, e.venueAddress, 'Atlanta'));
  assert(atlRoadGame !== undefined, `Found Atlanta road game: "${atlRoadGame?.title}" in ${atlRoadGame?.city} (${atlRoadGame?.venue})`);

  const minnRoadGame = allBears.find(e => matchesCityFilter(e.city, e.venueAddress, 'Minneapolis'));
  assert(minnRoadGame !== undefined, `Found Minneapolis road game: "${minnRoadGame?.title}" in ${minnRoadGame?.city} (${minnRoadGame?.venue})`);

  const soldierHomeGames = allBears.filter(e => e.venue.includes('Soldier Field'));
  assert(soldierHomeGames.length >= 2, `Found multiple Soldier Field home games (got: ${soldierHomeGames.length})`);

  // 5. searchLiveEventCatalog specifically in Atlanta returns the road game
  console.log('\nQuerying searchLiveEventCatalog for "chicago bears" in Atlanta...');
  const atlBears = await searchLiveEventCatalog({ keyword: 'chicago bears', city: 'Atlanta', size: 20 });
  assert(atlBears.length > 0, `Returned ${atlBears.length} events in Atlanta`);
  const allAtlMatch = atlBears.every(e => matchesCityFilter(e.city, e.venueAddress, 'Atlanta'));
  assert(allAtlMatch, 'All events returned for Atlanta query strictly match Atlanta (no Chicago home game leaks)');
  const atlHasBears = atlBears.some(e => e.title.includes('Bears') || (e.lineup && e.lineup.some(l => l.includes('Bears'))));
  assert(atlHasBears, 'Atlanta results feature the Chicago Bears road game');

  // 6. searchLiveEventCatalog specifically in Minneapolis returns the road game
  console.log('\nQuerying searchLiveEventCatalog for "chicago bears" in Minneapolis...');
  const minnBears = await searchLiveEventCatalog({ keyword: 'chicago bears', city: 'Minneapolis', size: 20 });
  assert(minnBears.length > 0, `Returned ${minnBears.length} events in Minneapolis`);
  const allMinnMatch = minnBears.every(e => matchesCityFilter(e.city, e.venueAddress, 'Minneapolis'));
  assert(allMinnMatch, 'All events returned for Minneapolis query strictly match Minneapolis (no Chicago leaks)');
  const minnHasBears = minnBears.some(e => e.title.includes('Bears') || (e.lineup && e.lineup.some(l => l.includes('Bears'))));
  assert(minnHasBears, 'Minneapolis results feature the Chicago Bears road game');

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
