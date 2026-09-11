import { resolveDynamicOuting, searchAutoPullEvents } from '../eventAutoPull';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${msg}`);
}

console.log('--- Testing PostEvent Location Search & Scoping ---');

// 1. Dynamic outing location resolution
const stLouisOuting = resolveDynamicOuting('comedy', 'St. Louis, MO');
assert(!!stLouisOuting, 'Resolved dynamic outing for "comedy" in St. Louis, MO');
assert(stLouisOuting?.city === 'St. Louis, MO', `Outing city is "St. Louis, MO" (got: ${stLouisOuting?.city})`);
assert(Boolean(stLouisOuting?.venueAddress.includes('St. Louis, MO')), `Venue address includes "St. Louis, MO" (got: ${stLouisOuting?.venueAddress})`);
assert(!stLouisOuting?.venueAddress.includes('Austin'), `Venue address DOES NOT include Austin (got: ${stLouisOuting?.venueAddress})`);

const chicagoOuting = resolveDynamicOuting('comedy', 'Chicago, IL');
assert(!!chicagoOuting, 'Resolved dynamic outing for "comedy" in Chicago, IL');
assert(chicagoOuting?.city === 'Chicago, IL', `Outing city is "Chicago, IL" (got: ${chicagoOuting?.city})`);
assert(Boolean(chicagoOuting?.venueAddress.includes('Chicago, IL')), `Venue address includes "Chicago, IL" (got: ${chicagoOuting?.venueAddress})`);
assert(!chicagoOuting?.venueAddress.includes('Austin'), `Chicago outing DOES NOT include Austin (got: ${chicagoOuting?.venueAddress})`);

const austinOuting = resolveDynamicOuting('comedy', 'Austin, TX');
assert(!!austinOuting, 'Resolved dynamic outing for "comedy" in Austin, TX');
assert(austinOuting?.city === 'Austin, TX', `Outing city is "Austin, TX" (got: ${austinOuting?.city})`);
assert(Boolean(austinOuting?.venueAddress.includes('Austin, TX')), `Venue address includes "Austin, TX" (got: ${austinOuting?.venueAddress})`);

// 2. National / All US Markets does not default to Austin or Chicago
const nationalOuting = resolveDynamicOuting('comedy', 'All US Markets');
assert(!!nationalOuting, 'Resolved dynamic outing for "comedy" in All US Markets');
assert(nationalOuting?.city === 'Local Outing', `National outing city is "Local Outing" (got: ${nationalOuting?.city})`);
assert(!nationalOuting?.venueAddress.includes('Austin'), `National outing DOES NOT default to Austin (got: ${nationalOuting?.venueAddress})`);

// 3. City-scoped searches in searchAutoPullEvents
const stLouisResults = searchAutoPullEvents('comedy', 'St. Louis, MO', false);
assert(stLouisResults.length > 0, `Returned results for "comedy" in St. Louis (count: ${stLouisResults.length})`);
const topStLouis = stLouisResults[0];
assert(topStLouis.city === 'St. Louis, MO' || topStLouis.venueAddress.includes('St. Louis'), `Top result matches St. Louis (got city: ${topStLouis.city})`);
assert(!topStLouis.city.includes('Austin'), `Top St. Louis result DOES NOT have city Austin (got: ${topStLouis.city})`);

const chicagoResults = searchAutoPullEvents('comedy', 'Chicago, IL', false);
assert(chicagoResults.length > 0, `Returned results for "comedy" in Chicago (count: ${chicagoResults.length})`);
const topChicago = chicagoResults[0];
assert(topChicago.city === 'Chicago, IL' || topChicago.venueAddress.includes('Chicago'), `Top result matches Chicago (got city: ${topChicago.city})`);
assert(!topChicago.city.includes('Austin'), `Top Chicago result DOES NOT have city Austin (got: ${topChicago.city})`);

// 4. Verification of arbitrary dining / hangout spot in selected location
const stLouisDinner = resolveDynamicOuting('Imo\'s Pizza', 'St. Louis, MO');
assert(!!stLouisDinner, 'Resolved Imo\'s Pizza in St. Louis');
assert(stLouisDinner?.city === 'St. Louis, MO', `Imo's Pizza city is St. Louis, MO (got: ${stLouisDinner?.city})`);

const napervilleDinner = resolveDynamicOuting('Lou Malnati\'s', 'Naperville, IL');
assert(!!napervilleDinner, 'Resolved Lou Malnati\'s in Naperville');
assert(napervilleDinner?.city === 'Naperville, IL', `Lou Malnati's city is Naperville, IL (got: ${napervilleDinner?.city})`);

console.log('\nAll PostEvent Location Search tests passed successfully!');
