import { 
  performUnifiedSearch, 
  buildCircleMemberGraph, 
  evaluateCircleAttendance
} from '../unifiedSearch';
import { INITIAL_CIRCLES, INITIAL_EVENTS, INITIAL_USER } from '../../lib/seed';

console.log('=== RUNNING UNIFIED SEARCH VERIFICATION SUITE ===\n');

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

// 1. Circle Graph Verification
console.log('--- Test Group 1: Circle & Friend Graph Resolution ---');
const graph = buildCircleMemberGraph(INITIAL_CIRCLES, INITIAL_USER);
assert(graph.joinedCircles.length === 3, `Joined circles count is 3 (Got: ${graph.joinedCircles.length})`);
assert(graph.memberMap.has('u0'), 'Aneka Rao (u0) mapped from College Friends');
assert(graph.memberMap.has('u2'), 'Marcus Bell (u2) mapped from Gym Squad');
assert(graph.closeFriendSet.has('u0'), 'u0 is in close friend set');

// 2. Circle Going Detection on Posted Events
console.log('\n--- Test Group 2: Circle Going Evaluation ---');
const e1 = INITIAL_EVENTS.find(e => e.id === 'e1')!;
const e1Circle = evaluateCircleAttendance(e1, graph, INITIAL_USER.id);
assert(e1Circle.hasCircleGoing === true, 'e1 (Vanguard Social Dinner) detected circle attendees going');
assert(e1Circle.circleAttendees.length > 0, `e1 has ${e1Circle.circleAttendees.length} circle attendees`);
console.log(`   Sample attendees: ${e1Circle.circleAttendees.map(a => `${a.name} (${a.circleName || 'Friend'})`).slice(0, 3).join(', ')}`);

const e2 = INITIAL_EVENTS.find(e => e.id === 'e2')!;
const e2Circle = evaluateCircleAttendance(e2, graph, INITIAL_USER.id);
assert(e2Circle.hasCircleGoing === true, 'e2 (Morning Ridge Trail) detected Marcus Bell in Gym Squad going');

// 3. Search: "Ravens" (The exact scenario from the user screenshot)
console.log('\n--- Test Group 3: Cross-Source Live Search ("Ravens") ---');
const ravensResults = performUnifiedSearch({
  query: 'Ravens',
  user: INITIAL_USER,
  circles: INITIAL_CIRCLES,
  postedEvents: INITIAL_EVENTS,
  userCity: 'Chicago',
});

assert(ravensResults.length > 0, `Search "Ravens" returned results (Got: ${ravensResults.length})`);
const hasRavenswoodArtWalk = ravensResults.some(r => r.title.toLowerCase().includes('ravenswood'));
assert(hasRavenswoodArtWalk, 'Ravenswood ArtWalk found in unified search results');
const ravensArtWalk = ravensResults.find(r => r.title.includes('Ravenswood ArtWalk'));
assert(ravensArtWalk?.kind === 'live_catalog', 'Ravenswood ArtWalk identified as live catalog source');

// 4. Search: "Au Cheval" (Dining Outing)
console.log('\n--- Test Group 4: Dining Outing Search ("Au Cheval") ---');
const auChevalResults = performUnifiedSearch({
  query: 'Au Cheval',
  user: INITIAL_USER,
  circles: INITIAL_CIRCLES,
  postedEvents: INITIAL_EVENTS,
  userCity: 'Chicago',
});

assert(auChevalResults.length > 0, `Search "Au Cheval" returned results (Got: ${auChevalResults.length})`);
assert(auChevalResults[0].title.includes('Au Cheval'), `Top result is Au Cheval (Got: "${auChevalResults[0].title}")`);
assert(auChevalResults[0].category === 'Dining', `Category is Dining (Got: "${auChevalResults[0].category}")`);

// 5. Circle-Going Prioritization: "Dinner"
console.log('\n--- Test Group 5: Circle-Going Prioritization ("Dinner") ---');
const dinnerResults = performUnifiedSearch({
  query: 'Dinner',
  user: INITIAL_USER,
  circles: INITIAL_CIRCLES,
  postedEvents: INITIAL_EVENTS,
  userCity: 'Chicago',
});

assert(dinnerResults.length > 0, `Search "Dinner" returned results (Got: ${dinnerResults.length})`);
assert(dinnerResults[0].id === 'e1', `Top result is e1 (Vanguard Social Dinner) due to circle attendance (Got: ${dinnerResults[0].id})`);
assert(dinnerResults[0].hasCircleAttendeesGoing === true, 'Top result hasCircleAttendeesGoing is true');
assert(dinnerResults[0].circleAttendeesGoing.length >= 2, `Circle attendees going count >= 2 (Got: ${dinnerResults[0].circleAttendeesGoing.length})`);

// 6. Strict Match Requirement: Non-matching circle event is NOT returned
console.log('\n--- Test Group 6: Strict Match Requirement ---');
const footballResults = performUnifiedSearch({
  query: 'Classic',
  user: INITIAL_USER,
  circles: INITIAL_CIRCLES,
  postedEvents: INITIAL_EVENTS,
  userCity: 'Chicago',
});

assert(footballResults.length > 0, 'Search "Classic" returned results');
assert(!footballResults.some(r => r.id === 'e1'), 'Non-matching circle event e1 is excluded from "Classic" search');
assert(footballResults.some(r => r.title.includes('Chicago Football Classic')), 'Chicago Football Classic is present in results');

// 7. Category Filter
console.log('\n--- Test Group 7: Category Filtering ---');
const diningOnly = performUnifiedSearch({
  query: '',
  category: 'Dining',
  user: INITIAL_USER,
  circles: INITIAL_CIRCLES,
  postedEvents: INITIAL_EVENTS,
  userCity: 'Chicago',
});

assert(diningOnly.every(r => r.category === 'Dining'), 'All results in Dining filter have category Dining');

console.log(`\n=== VERIFICATION RESULTS: ${passed} Passed, ${failed} Failed ===`);
if (failed > 0) process.exit(1);
