/**
 * Google Maps Places Service for Long-Tail Venue Search & Autocomplete
 * Uses the sitewide platform key (VITE_GOOGLE_MAPS_API_KEY) provided by the platform owner.
 * Includes graceful hybrid fallback to OpenStreetMap Nominatim and local metro venue database.
 */

export interface PlaceSuggestion {
  placeId: string;
  name: string;
  formattedAddress: string;
  city: string;
  state: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  category?: string;
  googleMapsUrl?: string;
  source: 'google_places' | 'nominatim_fallback' | 'local_catalog';
}

interface GooglePlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
  types?: string[];
}

interface GooglePlacesAutocompleteService {
  getPlacePredictions: (
    request: { input: string; componentRestrictions?: { country: string } },
    callback: (results: GooglePlacePrediction[] | null, status: string) => void
  ) => void;
}

interface GoogleMapsPlaces {
  AutocompleteService: new () => GooglePlacesAutocompleteService;
  PlacesServiceStatus: {
    OK: string;
  };
}

interface GoogleWindow {
  google?: {
    maps?: {
      places?: GoogleMapsPlaces;
    };
  };
}

interface OsmSearchItem {
  osm_id?: number | string;
  place_id?: number | string;
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
  };
}

const GOOGLE_MAPS_API_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GOOGLE_MAPS_API_KEY) ||
  (typeof process !== 'undefined' && (process as unknown as { env?: Record<string, string> }).env?.VITE_GOOGLE_MAPS_API_KEY) ||
  '';

let scriptLoadingPromise: Promise<boolean> | null = null;

/**
 * Dynamically loads the Google Maps JavaScript API with Places library if key is available.
 */
export function loadGoogleMapsScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as unknown as GoogleWindow).google?.maps?.places) return Promise.resolve(true);
  if (!GOOGLE_MAPS_API_KEY) return Promise.resolve(false);

  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise(resolve => {
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      GOOGLE_MAPS_API_KEY
    )}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Google Maps Places SDK failed to load; using OpenStreetMap Nominatim fallback.');
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

/**
 * Curated local fallback venues for popular and long-tail spots across major & secondary metros
 */
const CURATED_LOCAL_VENUES: PlaceSuggestion[] = [
  {
    placeId: 'loc-chi-au-cheval',
    name: 'Au Cheval',
    formattedAddress: '800 W Randolph St, Chicago, IL 60607',
    city: 'Chicago',
    state: 'IL',
    postalCode: '60607',
    latitude: 41.8841,
    longitude: -87.6479,
    category: 'Restaurant / Dining',
    googleMapsUrl: 'https://maps.google.com/?q=Au+Cheval+Chicago',
    source: 'local_catalog',
  },
  {
    placeId: 'loc-chi-soldier-field',
    name: 'Soldier Field',
    formattedAddress: '1410 Special Olympics Dr, Chicago, IL 60605',
    city: 'Chicago',
    state: 'IL',
    postalCode: '60605',
    latitude: 41.8623,
    longitude: -87.6167,
    category: 'Stadium / Sports',
    googleMapsUrl: 'https://maps.google.com/?q=Soldier+Field+Chicago',
    source: 'local_catalog',
  },
  {
    placeId: 'loc-stl-pappys',
    name: "Pappy's Smokehouse",
    formattedAddress: '3106 Olive St, St. Louis, MO 63103',
    city: 'St. Louis',
    state: 'MO',
    postalCode: '63103',
    latitude: 38.6358,
    longitude: -90.2248,
    category: 'Restaurant / BBQ',
    googleMapsUrl: 'https://maps.google.com/?q=Pappys+Smokehouse+St+Louis',
    source: 'local_catalog',
  },
  {
    placeId: 'loc-stl-fox',
    name: 'The Fabulous Fox Theatre',
    formattedAddress: '527 N Grand Blvd, St. Louis, MO 63103',
    city: 'St. Louis',
    state: 'MO',
    postalCode: '63103',
    latitude: 38.6385,
    longitude: -90.2312,
    category: 'Theater / Arts',
    googleMapsUrl: 'https://maps.google.com/?q=Fabulous+Fox+St+Louis',
    source: 'local_catalog',
  },
  {
    placeId: 'loc-atx-scholz',
    name: 'Scholz Garten',
    formattedAddress: '1607 San Jacinto Blvd, Austin, TX 78701',
    city: 'Austin',
    state: 'TX',
    postalCode: '78701',
    latitude: 30.2785,
    longitude: -97.7371,
    category: 'Beer Garden / Gathering',
    googleMapsUrl: 'https://maps.google.com/?q=Scholz+Garten+Austin',
    source: 'local_catalog',
  },
  {
    placeId: 'loc-atl-mercedes-benz',
    name: 'Mercedes-Benz Stadium',
    formattedAddress: '1 AMB Dr NW, Atlanta, GA 30313',
    city: 'Atlanta',
    state: 'GA',
    postalCode: '30313',
    latitude: 33.7553,
    longitude: -84.4008,
    category: 'Stadium / Arena',
    googleMapsUrl: 'https://maps.google.com/?q=Mercedes-Benz+Stadium+Atlanta',
    source: 'local_catalog',
  },
  {
    placeId: 'loc-msp-us-bank',
    name: 'U.S. Bank Stadium',
    formattedAddress: '401 Chicago Ave, Minneapolis, MN 55415',
    city: 'Minneapolis',
    state: 'MN',
    postalCode: '55415',
    latitude: 44.9735,
    longitude: -93.2575,
    category: 'Stadium / Arena',
    googleMapsUrl: 'https://maps.google.com/?q=US+Bank+Stadium+Minneapolis',
    source: 'local_catalog',
  },
  {
    placeId: 'loc-anc-pac',
    name: 'Alaska Center for the Performing Arts',
    formattedAddress: '621 W 6th Ave, Anchorage, AK 99501',
    city: 'Anchorage',
    state: 'AK',
    postalCode: '99501',
    latitude: 61.2163,
    longitude: -149.8967,
    category: 'Performing Arts Center',
    googleMapsUrl: 'https://maps.google.com/?q=Alaska+Center+for+the+Performing+Arts',
    source: 'local_catalog',
  },
];

/**
 * Searches places via Google Places Autocomplete when API key is present,
 * or OpenStreetMap Nominatim and local catalog when operating in demo/fallback mode.
 */
export async function searchPlaces(
  query: string,
  cityContext?: string
): Promise<PlaceSuggestion[]> {
  const cleanQ = (query || '').trim();
  if (!cleanQ || cleanQ.length < 2) return [];

  const isGoogleAvailable = await loadGoogleMapsScript();

  const places = (window as unknown as GoogleWindow).google?.maps?.places;
  if (isGoogleAvailable && places?.AutocompleteService) {
    try {
      const service = new places.AutocompleteService();

      const request = {
        input: cleanQ + (cityContext && cityContext !== 'All US Markets' ? ` ${cityContext}` : ''),
        componentRestrictions: { country: 'us' },
      };

      const predictions = await new Promise<GooglePlacePrediction[]>(resolve => {
        service.getPlacePredictions(request, (results, status) => {
          if (status === places.PlacesServiceStatus.OK && results) {
            resolve(results);
          } else {
            resolve([]);
          }
        });
      });

      if (predictions.length > 0) {
        return predictions.map(p => {
          const mainText = p.structured_formatting?.main_text || p.description.split(',')[0];
          const secondaryText = p.structured_formatting?.secondary_text || '';
          const parts = secondaryText.split(',').map((s: string) => s.trim());
          const stateZip = parts[parts.length - 2] || '';
          const state = stateZip.split(' ')[0] || '';

          return {
            placeId: p.place_id,
            name: mainText,
            formattedAddress: p.description,
            city: parts[0] || cityContext || '',
            state: state || 'US',
            latitude: 0,
            longitude: 0,
            category: p.types?.[0]?.replace(/_/g, ' ') || 'Venue',
            googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
            source: 'google_places',
          };
        });
      }
    } catch (e) {
      console.warn('Google Places autocomplete query failed, falling back:', e);
    }
  }

  // Fallback 1: Curated local venue matching
  const qLower = cleanQ.toLowerCase();
  const localMatches = CURATED_LOCAL_VENUES.filter(v => {
    const matchesName = v.name.toLowerCase().includes(qLower);
    const matchesAddress = v.formattedAddress.toLowerCase().includes(qLower);
    const matchesCity = cityContext && cityContext !== 'All US Markets' 
      ? v.city.toLowerCase() === cityContext.toLowerCase() 
      : true;
    return (matchesName || matchesAddress) && matchesCity;
  });

  // Fallback 2: OpenStreetMap Nominatim Live Geocoding
  try {
    const geoQuery = cleanQ + (cityContext && cityContext !== 'All US Markets' ? `, ${cityContext}` : ', USA');
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      geoQuery
    )}&format=json&addressdetails=1&countrycodes=us&limit=5`;

    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
    });

    if (res.ok) {
      const items = (await res.json()) as OsmSearchItem[];
      const osmResults: PlaceSuggestion[] = items.map((item: OsmSearchItem) => {
        const addr = item.address || {};
        const name = item.name || item.display_name.split(',')[0];
        const city = addr.city || addr.town || addr.village || addr.county || cityContext || '';
        const state = addr.state || '';
        const postcode = addr.postcode || '';

        return {
          placeId: `osm-${item.osm_id || item.place_id}`,
          name: name.trim(),
          formattedAddress: item.display_name,
          city,
          state,
          postalCode: postcode,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          category: item.type?.replace(/_/g, ' ') || 'Point of Interest',
          googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(item.display_name)}`,
          source: 'nominatim_fallback',
        };
      });

      // Combine local catalog matches with OSM results, deduplicating by name
      const seen = new Set(localMatches.map(m => m.name.toLowerCase()));
      const combined = [...localMatches];
      for (const osm of osmResults) {
        if (!seen.has(osm.name.toLowerCase())) {
          seen.add(osm.name.toLowerCase());
          combined.push(osm);
        }
      }
      return combined.slice(0, 6);
    }
  } catch {
    // Return local matches if offline
  }

  return localMatches;
}
