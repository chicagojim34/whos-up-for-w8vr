import fs from 'node:fs';
import path from 'node:path';
import { searchAutoPullEvents, resolveDynamicOuting, computeEventRelevance } from '../eventAutoPull';
import { searchLiveEventCatalog } from '../liveEventCatalog';

async function runTests() {
  console.log('=== VERIFYING SEARCH SURFACING ON ENTER & SINGULAR SPORTS QUERY ===\n');
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

  // 1. Verify resolveDynamicOuting skips singular sports queries
  const fakeDiningSingular = resolveDynamicOuting('chicago bear', 'Chicago, IL');
  assert(fakeDiningSingular === null, 'resolveDynamicOuting returns null for singular "chicago bear"');

  const fakeDiningPlural = resolveDynamicOuting('chicago bears', 'Chicago, IL');
  assert(fakeDiningPlural === null, 'resolveDynamicOuting returns null for plural "chicago bears"');

  const fakeDiningPacker = resolveDynamicOuting('green bay packer');
  assert(fakeDiningPacker === null, 'resolveDynamicOuting returns null for singular "green bay packer"');

  const fakeDiningViking = resolveDynamicOuting('minnesota viking');
  assert(fakeDiningViking === null, 'resolveDynamicOuting returns null for singular "minnesota viking"');

  // 2. Real restaurants DO still create dynamic outings
  const realDining = resolveDynamicOuting('Au Cheval');
  assert(realDining !== null && realDining.category === 'Dining', 'resolveDynamicOuting creates dining outing for real restaurant "Au Cheval"');

  // 3. Singular sports query scores high relevance for sports team events
  const bearsSample = searchAutoPullEvents('chicago bear');
  assert(bearsSample.length >= 4, `searchAutoPullEvents("chicago bear") surfaces all games (got: ${bearsSample.length})`);
  assert(
    !bearsSample.some(e => e.title.includes('Hangout & Drinks at chicago bear')),
    'searchAutoPullEvents("chicago bear") DOES NOT contain fake dining hangout'
  );
  assert(
    bearsSample.every(e => e.eventSubType === 'Sports' || e.title.includes('Bears')),
    'Every surfaced event for "chicago bear" is an actual sports/team event'
  );

  const topMatch = bearsSample[0];
  const relevance = computeEventRelevance(topMatch, 'chicago bear');
  assert(relevance >= 1000, `computeEventRelevance for singular "chicago bear" gives primary matchup score (got: ${relevance})`);

  // 4. Verify PostEvent.tsx code does NOT select top result on Enter
  const postEventPath = path.resolve(process.cwd(), 'src/pages/PostEvent.tsx');
  const postEventContent = fs.readFileSync(postEventPath, 'utf-8');

  assert(
    !postEventContent.includes('handleSelectAutoEvent(autoSuggestions[0])'),
    'PostEvent.tsx DOES NOT automatically select autoSuggestions[0] on Enter'
  );
  assert(
    postEventContent.includes('handleSurfaceAllResults()'),
    'PostEvent.tsx calls handleSurfaceAllResults() on Enter'
  );
  assert(
    postEventContent.includes('isResultsSurfaced'),
    'PostEvent.tsx tracks isResultsSurfaced state to render all surfaced results'
  );
  assert(
    postEventContent.includes('All Surfaced Results for'),
    'PostEvent.tsx renders dedicated "All Surfaced Results" section'
  );
  assert(
    postEventContent.includes('initialKeyword={autoSearchQuery}'),
    'PostEvent.tsx passes initialKeyword into LiveEventCatalogModal'
  );

  // 5. Query live catalog across all markets for "chicago bear"
  console.log('\nQuerying searchLiveEventCatalog for singular "chicago bear"...');
  const liveBear = await searchLiveEventCatalog({ keyword: 'chicago bear', size: 30 });
  assert(liveBear.length > 0, `Returned ${liveBear.length} events for "chicago bear"`);
  assert(
    liveBear.some(e => e.venue.includes('Soldier Field')),
    'Surfaced results include home games at Soldier Field'
  );
  assert(
    liveBear.some(e => e.venue.includes('Mercedes-Benz') || e.city.includes('Atlanta')),
    'Surfaced results include road game at Mercedes-Benz Stadium'
  );
  assert(
    liveBear.some(e => e.venue.includes('U.S. Bank') || e.city.includes('Minneapolis')),
    'Surfaced results include road game at U.S. Bank Stadium'
  );

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
