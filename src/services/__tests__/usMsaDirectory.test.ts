import { 
  US_387_METROPOLITAN_AREAS, 
  ALPHABETICAL_387_MSAS, 
  POPULAR_METRO_HUBS, 
  searchMsas, 
  findMsaByCity, 
  findMsaByCode 
} from '../../lib/usMsaDirectory';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${msg}`);
}

console.log('=== VERIFYING 387 METROPOLITAN STATISTICAL AREAS DIRECTORY ===\n');

// 1. Total Count Verification
assert(US_387_METROPOLITAN_AREAS.length === 387, `Total MSAs must be exactly 387 (got: ${US_387_METROPOLITAN_AREAS.length})`);
assert(ALPHABETICAL_387_MSAS.length === 387, `Alphabetical MSAs must be exactly 387 (got: ${ALPHABETICAL_387_MSAS.length})`);

// 2. Alphabetical Ordering Verification
for (let i = 0; i < ALPHABETICAL_387_MSAS.length - 1; i++) {
  const curr = ALPHABETICAL_387_MSAS[i].primaryCity;
  const next = ALPHABETICAL_387_MSAS[i + 1].primaryCity;
  assert(curr.localeCompare(next) <= 0, `Order check at index ${i}: "${curr}" <= "${next}"`);
}

// 3. State Coverage Verification
const states = new Set(US_387_METROPOLITAN_AREAS.map(m => m.primaryState));
assert(states.size >= 50, `Must cover at least 50 US States + DC (got: ${states.size} unique state codes)`);
assert(states.has('AK'), 'Includes Alaska (AK)');
assert(states.has('HI'), 'Includes Hawaii (HI)');
assert(states.has('DC'), 'Includes District of Columbia (DC)');
assert(states.has('IL'), 'Includes Illinois (IL)');
assert(states.has('MO'), 'Includes Missouri (MO)');
assert(states.has('TX'), 'Includes Texas (TX)');

// 4. Anchor Metro Verification
const chicago = findMsaByCity('Chicago');
assert(Boolean(chicago), 'Finds Chicago MSA');
assert(chicago?.cbsaCode === '16980', `Chicago CBSA code is 16980 (got: ${chicago?.cbsaCode})`);
assert(Boolean(chicago?.title.includes('Chicago-Naperville-Elgin')), 'Chicago full title includes Naperville and Elgin');

const stLouis = findMsaByCity('St. Louis');
assert(Boolean(stLouis), 'Finds St. Louis MSA');
assert(stLouis?.primaryState === 'MO', `St. Louis primary state is MO (got: ${stLouis?.primaryState})`);

const anchorage = findMsaByCity('Anchorage');
assert(Boolean(anchorage), 'Finds Anchorage, AK MSA');
assert(anchorage?.primaryState === 'AK', 'Anchorage is in AK');

const boise = findMsaByCity('Boise');
assert(Boolean(boise), 'Finds Boise City, ID MSA');

// 5. Component City Lookup
const napervilleMatch = searchMsas('Naperville');
assert(napervilleMatch.some(m => m.primaryCity === 'Chicago'), 'Searching "Naperville" finds Chicago MSA');

const fortWorthMatch = searchMsas('Fort Worth');
assert(fortWorthMatch.some(m => m.primaryCity === 'Dallas'), 'Searching "Fort Worth" finds Dallas MSA');

const stPaulMatch = searchMsas('St. Paul');
assert(stPaulMatch.some(m => m.primaryCity === 'Minneapolis'), 'Searching "St. Paul" finds Minneapolis MSA');

// 6. Popular Hubs Verification
assert(POPULAR_METRO_HUBS.length === 16, `Popular hubs has 16 items (got: ${POPULAR_METRO_HUBS.length})`);
assert(POPULAR_METRO_HUBS.includes('Chicago'), 'Popular hubs includes Chicago');
assert(POPULAR_METRO_HUBS.includes('St. Louis'), 'Popular hubs includes St. Louis');
assert(POPULAR_METRO_HUBS.includes('Atlanta'), 'Popular hubs includes Atlanta');
assert(POPULAR_METRO_HUBS.includes('Minneapolis'), 'Popular hubs includes Minneapolis');

// 7. CBSA Code Lookup
const nyByCode = findMsaByCode('35620');
assert(Boolean(nyByCode), 'Finds New York by CBSA code 35620');
assert(nyByCode?.primaryCity === 'New York', `CBSA 35620 is New York (got: ${nyByCode?.primaryCity})`);

console.log('\nAll 387 MSA Directory tests passed successfully!');
