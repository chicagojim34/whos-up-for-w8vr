import { matchesCityFilter } from '../eventAutoPull';
import { findMsaByCity } from '../../lib/usMsaDirectory';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${msg}`);
}

console.log('--- Testing Search Location Switcher & City Scoping ---');

// 1. National scope matches everything
assert(matchesCityFilter('Chicago, IL', '1410 S Museum Campus Dr', 'All US Markets') === true, 'All US Markets matches Chicago');
assert(matchesCityFilter('St. Louis, MO', 'Busch Stadium', 'All US Markets') === true, 'All US Markets matches St. Louis');
assert(matchesCityFilter('Atlanta, GA', 'Mercedes-Benz Stadium', 'All US Markets') === true, 'All US Markets matches Atlanta');
assert(matchesCityFilter('Minneapolis, MN', 'U.S. Bank Stadium', 'All US Markets') === true, 'All US Markets matches Minneapolis');
assert(matchesCityFilter('Anchorage, AK', 'Sullivan Arena', 'All US Markets') === true, 'All US Markets matches Anchorage');
assert(matchesCityFilter('Honolulu, HI', 'Waikiki Shell', 'All US Markets') === true, 'All US Markets matches Honolulu');
assert(matchesCityFilter(undefined, undefined, 'All US Markets') === true, 'All US Markets matches undefined city');

// 2. St. Louis filter matches St. Louis events strictly
assert(matchesCityFilter('St. Louis, MO', '1 Fine Arts Dr', 'St. Louis, MO') === true, 'St. Louis matches St. Louis, MO');
assert(matchesCityFilter('St. Louis', 'Forest Park', 'St. Louis') === true, 'St. Louis matches St. Louis');
assert(matchesCityFilter('Saint Louis, MO', 'Gateway Arch', 'St. Louis, MO') === true, 'Saint Louis matches St. Louis');
assert(matchesCityFilter('Chicago, IL', '4444 N Ravenswood Ave', 'St. Louis, MO') === false, 'St. Louis DOES NOT match Chicago');
assert(matchesCityFilter('Austin, TX', 'Rainey St', 'St. Louis, MO') === false, 'St. Louis DOES NOT match Austin');
assert(matchesCityFilter('Kansas City, MO', '1 Arrowhead Dr', 'St. Louis, MO') === false, 'St. Louis DOES NOT match Kansas City');

// 3. Chicago filter matches Chicago events strictly
assert(matchesCityFilter('Chicago, IL', '1410 S Museum Campus Dr', 'Chicago, IL') === true, 'Chicago matches Chicago, IL');
assert(matchesCityFilter('Chicago, IL', 'Soldier Field', 'Chicago') === true, 'Chicago matches Chicago');
assert(matchesCityFilter('Naperville, IL', 'Downtown Naperville', 'Chicago') === true, 'Chicago matches Naperville');
assert(matchesCityFilter('St. Louis, MO', 'Busch Stadium', 'Chicago, IL') === false, 'Chicago DOES NOT match St. Louis');

// 4. Resolving any of the 387 MSAs
const sampleCities = [
  'Cedar Rapids',
  'Duluth',
  'Fargo',
  'Green Bay',
  'Kalamazoo',
  'Lafayette',
  'Macon',
  'Oshkosh',
  'Pueblo',
  'Salisbury',
  'Walla Walla',
  'Yakima'
];

sampleCities.forEach(city => {
  const msa = findMsaByCity(city);
  assert(!!msa, `Successfully mapped secondary/tertiary city "${city}" to MSA: ${msa?.title}`);
});

console.log('\nAll Search Location Switcher & City Scoping tests passed successfully!');
