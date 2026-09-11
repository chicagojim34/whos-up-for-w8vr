import { searchPlaces } from '../googleMapsService';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${msg}`);
}

async function run() {
  console.log('--- Testing Google Maps & Places Venue Service ---');

  // 1. Minimum query length handling
  const emptyRes = await searchPlaces('');
  assert(emptyRes.length === 0, 'Empty query returns empty array');

  const shortRes = await searchPlaces('a');
  assert(shortRes.length === 0, 'Single character query returns empty array');

  // 2. Curated venue catalog search (Chicago dining)
  const auCheval = await searchPlaces('Au Cheval', 'Chicago');
  assert(auCheval.length > 0, 'Finds Au Cheval in Chicago');
  assert(auCheval[0].name === 'Au Cheval', `Name is Au Cheval (got: ${auCheval[0].name})`);
  assert(auCheval[0].city === 'Chicago', `City is Chicago (got: ${auCheval[0].city})`);
  assert(auCheval[0].state === 'IL', `State is IL (got: ${auCheval[0].state})`);
  assert(auCheval[0].formattedAddress.includes('800 W Randolph St'), `Address includes 800 W Randolph St`);
  assert(!!auCheval[0].googleMapsUrl, `Includes valid googleMapsUrl`);

  // 3. St. Louis venue search (Pappy's Smokehouse)
  const pappys = await searchPlaces("Pappy's", 'St. Louis');
  assert(pappys.length > 0, "Finds Pappy's Smokehouse in St. Louis");
  assert(pappys[0].city === 'St. Louis', `City is St. Louis (got: ${pappys[0].city})`);
  assert(pappys[0].state === 'MO', `State is MO (got: ${pappys[0].state})`);

  // 4. Stadiums & Arenas across other markets (Atlanta Mercedes-Benz & Minneapolis U.S. Bank)
  const atlStadium = await searchPlaces('Mercedes-Benz', 'Atlanta');
  assert(atlStadium.length > 0, 'Finds Mercedes-Benz Stadium in Atlanta');
  assert(atlStadium[0].state === 'GA', 'State is GA');

  const usBank = await searchPlaces('U.S. Bank Stadium', 'Minneapolis');
  assert(usBank.length > 0, 'Finds U.S. Bank Stadium in Minneapolis');
  assert(usBank[0].state === 'MN', 'State is MN');

  // 5. National / All US Markets scope works without city filtering restriction
  const nationalSearch = await searchPlaces('Soldier Field', 'All US Markets');
  assert(nationalSearch.length > 0, 'Finds Soldier Field on All US Markets search');
  assert(nationalSearch[0].name === 'Soldier Field', 'Matches Soldier Field');

  // 6. City isolation check: searching Chicago venue when scoped to St. Louis should return 0 local catalog matches
  const crossCitySearch = await searchPlaces('Au Cheval', 'St. Louis');
  const hasAuChevalStl = crossCitySearch.some(r => r.name === 'Au Cheval' && r.city === 'Chicago');
  assert(!hasAuChevalStl, 'Does not leak Chicago Au Cheval into St. Louis search');

  console.log('\nAll Google Maps & Places Venue Service tests passed successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
