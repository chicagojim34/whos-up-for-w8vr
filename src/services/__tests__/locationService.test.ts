import { reverseGeocodeCoordinates } from '../locationService';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${msg}`);
}

async function run() {
  console.log('--- Testing Location Service & Reverse Geocoding ---');

  // Test 1: Coordinates for Naperville, IL (41.7508, -88.1535)
  const napervilleResult = await reverseGeocodeCoordinates(41.7508, -88.1535);
  console.log('Naperville coordinates reverse geocode result:', napervilleResult);
  assert(napervilleResult.cbsaCode === '16980', `Naperville coords resolve to Chicago MSA 16980 (got: ${napervilleResult.cbsaCode})`);
  assert(napervilleResult.parentMetroTitle?.includes('Chicago') === true, `Parent metro includes Chicago (got: ${napervilleResult.parentMetroTitle})`);
  assert(napervilleResult.distanceToMetroCentroidMiles! >= 26 && napervilleResult.distanceToMetroCentroidMiles! <= 30, `Distance to centroid is ~28 mi (got: ${napervilleResult.distanceToMetroCentroidMiles})`);

  // Test 2: Coordinates for St. Louis, MO (38.6270, -90.1994)
  const stlResult = await reverseGeocodeCoordinates(38.6270, -90.1994);
  console.log('St. Louis coordinates reverse geocode result:', stlResult);
  assert(stlResult.cbsaCode === '41180', `St. Louis coords resolve to St. Louis MSA 41180 (got: ${stlResult.cbsaCode})`);
  assert(stlResult.parentMetroTitle?.includes('St. Louis') === true, `Parent metro includes St. Louis (got: ${stlResult.parentMetroTitle})`);

  // Test 3: Coordinates for Dallas / Fort Worth (32.7555, -97.3308)
  const ftwResult = await reverseGeocodeCoordinates(32.7555, -97.3308);
  console.log('Fort Worth coordinates reverse geocode result:', ftwResult);
  assert(ftwResult.cbsaCode === '19100', `Fort Worth coords resolve to Dallas-Fort Worth MSA 19100 (got: ${ftwResult.cbsaCode})`);

  console.log('\nAll Location Service tests passed successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
