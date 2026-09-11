import { 
  calculateDistanceMiles, 
  getMetroMarketForCity, 
  findNearestMsa
} from '../../lib/usMsaDirectory';
import { 
  matchesCityFilter, 
  searchAutoPullEvents 
} from '../eventAutoPull';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${msg}`);
}

console.log('--- 1. Testing Haversine Distance Engine ---');
const chiCoords = { lat: 41.8781, lng: -87.6298 }; // Chicago Loop
const napCoords = { lat: 41.7508, lng: -88.1535 }; // Naperville
const roseCoords = { lat: 41.9868, lng: -87.8722 }; // Rosemont
const milwCoords = { lat: 43.0389, lng: -87.9065 }; // Milwaukee
const stlCoords = { lat: 38.6270, lng: -90.1994 }; // St. Louis

const distNap = calculateDistanceMiles(chiCoords.lat, chiCoords.lng, napCoords.lat, napCoords.lng);
console.log(`Chicago to Naperville distance: ${distNap} miles`);
assert(distNap >= 27 && distNap <= 30, `Naperville is ~28 miles from Chicago (got: ${distNap})`);

const distRose = calculateDistanceMiles(chiCoords.lat, chiCoords.lng, roseCoords.lat, roseCoords.lng);
console.log(`Chicago to Rosemont distance: ${distRose} miles`);
assert(distRose >= 13 && distRose <= 17, `Rosemont is ~15 miles from Chicago (got: ${distRose})`);

const distMilw = calculateDistanceMiles(chiCoords.lat, chiCoords.lng, milwCoords.lat, milwCoords.lng);
console.log(`Chicago to Milwaukee distance: ${distMilw} miles`);
assert(distMilw >= 78 && distMilw <= 86, `Milwaukee is ~81 miles from Chicago (got: ${distMilw})`);

const distStl = calculateDistanceMiles(chiCoords.lat, chiCoords.lng, stlCoords.lat, stlCoords.lng);
console.log(`Chicago to St. Louis distance: ${distStl} miles`);
assert(distStl > 250, `St. Louis is >250 miles from Chicago (got: ${distStl})`);

console.log('\n--- 2. Testing Metro Market & Suburb Resolution ---');
const napMetro = getMetroMarketForCity('Naperville');
assert(!!napMetro, 'Naperville maps to a metro market');
assert(napMetro?.msa.cbsaCode === '16980', `Naperville belongs to CBSA 16980 (got: ${napMetro?.msa.cbsaCode})`);
assert(napMetro?.isSuburb === true, 'Naperville is correctly flagged as a suburb');
assert(napMetro?.primaryCity === 'Chicago', `Naperville primary city is Chicago (got: ${napMetro?.primaryCity})`);
assert(Boolean(napMetro?.metroLabel.includes('Chicago')), `Metro label includes Chicago (got: ${napMetro?.metroLabel})`);

const ftwMetro = getMetroMarketForCity('Fort Worth');
assert(ftwMetro?.primaryCity === 'Dallas', `Fort Worth maps to Dallas-Fort Worth (got: ${ftwMetro?.primaryCity})`);
assert(ftwMetro?.isSuburb === true, 'Fort Worth is flagged as component suburb');

const stpMetro = getMetroMarketForCity('St. Paul');
assert(stpMetro?.primaryCity === 'Minneapolis', `St. Paul maps to Minneapolis (got: ${stpMetro?.primaryCity})`);

console.log('\n--- 3. Testing Nearest MSA GPS Resolution ---');
const nearestFromNapervilleGps = findNearestMsa(41.7508, -88.1535);
assert(nearestFromNapervilleGps.msa.cbsaCode === '16980', `GPS in Naperville resolves to Chicago MSA (got: ${nearestFromNapervilleGps.msa.title})`);

const nearestFromStlGps = findNearestMsa(38.6270, -90.1994);
assert(nearestFromStlGps.msa.cbsaCode === '41180', `GPS in St. Louis resolves to St. Louis MSA (got: ${nearestFromStlGps.msa.title})`);

console.log('\n--- 4. Testing Radius Filter (matchesCityFilter) ---');
// Chicago + 50 mi radius (Default)
assert(matchesCityFilter('Naperville, IL', '400 S Eagle St', 'Chicago', 50) === true, 'Chicago + 50 mi includes Naperville');
assert(matchesCityFilter('Rosemont, IL', '6920 Mannheim Rd', 'Chicago', 50) === true, 'Chicago + 50 mi includes Rosemont');
assert(matchesCityFilter('Chicago, IL', '800 W Randolph St', 'Chicago', 50) === true, 'Chicago + 50 mi includes Downtown Chicago');
assert(matchesCityFilter('Milwaukee, WI', '1001 N 4th St', 'Chicago', 50) === false, 'Chicago + 50 mi EXCLUDES Milwaukee');
assert(matchesCityFilter('St. Louis, MO', 'Busch Stadium', 'Chicago', 50) === false, 'Chicago + 50 mi EXCLUDES St. Louis');

// Chicago + 10 mi radius (City Core only)
assert(matchesCityFilter('Chicago, IL', '800 W Randolph St', 'Chicago', 10) === true, 'Chicago + 10 mi includes Downtown Chicago');
assert(matchesCityFilter('Naperville, IL', '400 S Eagle St', 'Chicago', 10) === false, 'Chicago + 10 mi EXCLUDES Naperville (28 mi > 10 mi)');

// St. Louis + 50 mi radius
assert(matchesCityFilter('St. Louis, MO', 'Forest Park', 'St. Louis', 50) === true, 'St. Louis + 50 mi includes St. Louis');
assert(matchesCityFilter('Chesterfield, MO', 'Chesterfield Mall', 'St. Louis', 50) === true, 'St. Louis + 50 mi includes Chesterfield, MO');
assert(matchesCityFilter('Chicago, IL', 'Soldier Field', 'St. Louis', 50) === false, 'St. Louis + 50 mi EXCLUDES Chicago');

console.log('\n--- 5. Testing Live Catalog Search with Metro & Radius ---');
// 5a. Chicago with 50 mi radius should return both Ravenswood (Chicago) and Naperville Art Walks!
const chi50ArtWalks = searchAutoPullEvents('Art Walk', 'Chicago', true, 50);
const hasRavenswood = chi50ArtWalks.some(e => e.id === 'evt-ravenswood-artwalk');
const hasNaperville = chi50ArtWalks.some(e => e.id === 'evt-naperville-artwalk');
const hasStlArt = chi50ArtWalks.some(e => e.city.includes('St. Louis'));

assert(hasRavenswood, 'Chicago + 50 mi search finds Ravenswood ArtWalk');
assert(hasNaperville, 'Chicago + 50 mi search finds Naperville Riverwalk Wine & Art Walk');
assert(!hasStlArt, 'Chicago + 50 mi search DOES NOT include St. Louis SLAM Art Walk');

// Verify distanceMi is calculated
const napEvent = chi50ArtWalks.find(e => e.id === 'evt-naperville-artwalk');
assert(typeof napEvent?.distanceMi === 'number', `Naperville event has distanceMi (got: ${napEvent?.distanceMi})`);
assert(napEvent!.distanceMi! >= 26 && napEvent!.distanceMi! <= 30, `Naperville distance is ~28 mi (got: ${napEvent?.distanceMi})`);

// 5b. Chicago with 10 mi radius should include Ravenswood but exclude Naperville!
const chi10ArtWalks = searchAutoPullEvents('Art Walk', 'Chicago', true, 10);
const hasRavenswood10 = chi10ArtWalks.some(e => e.id === 'evt-ravenswood-artwalk');
const hasNaperville10 = chi10ArtWalks.some(e => e.id === 'evt-naperville-artwalk');

assert(hasRavenswood10, 'Chicago + 10 mi search includes Ravenswood ArtWalk');
assert(!hasNaperville10, 'Chicago + 10 mi search EXCLUDES Naperville ArtWalk (since 28 mi > 10 mi)');

console.log('\nAll Metro Market & Radius Search tests passed successfully!');
