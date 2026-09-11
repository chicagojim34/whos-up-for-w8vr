/**
 * Permission-Based User Location Identification & Reverse Geocoding Service
 * Respects user privacy: only captures GPS coordinates upon explicit user permission.
 * Maps coordinates to local municipalities and official 387 US Metropolitan Statistical Areas (CBSAs).
 */

import { 
  findNearestMsa, 
  getMetroMarketForCity, 
  calculateDistanceMiles, 
  METRO_COORDINATES 
} from '../lib/usMsaDirectory';

export interface UserLocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface DetectedLocationDetails {
  city: string;
  state: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  parentMetroTitle?: string;
  cbsaCode?: string;
  isSuburb: boolean;
  distanceToMetroCentroidMiles?: number;
  source: 'gps_reverse_geocode' | 'nearest_msa_centroid' | 'cached';
}

const STORAGE_KEYS = {
  PERMISSION: 'w8vr.location_permission',
  COORDS: 'w8vr.user_coords',
  DETAILS: 'w8vr.detected_location',
};

/**
 * Checks if location permission has previously been granted
 */
export function hasLocationPermission(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.PERMISSION) === 'granted';
}

/**
 * Gets currently cached user location details from localStorage if available
 */
export function getStoredUserLocation(): DetectedLocationDetails | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEYS.DETAILS);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Clears stored user location and resets permission
 */
export function clearUserLocation(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.PERMISSION);
  localStorage.removeItem(STORAGE_KEYS.COORDS);
  localStorage.removeItem(STORAGE_KEYS.DETAILS);
  window.dispatchEvent(new CustomEvent('w8vr:location-changed', { detail: null }));
}

/**
 * Reverse geocodes GPS coordinates into city, state, and parent MSA.
 * Uses OpenStreetMap Nominatim with an offline nearest-MSA fallback.
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number
): Promise<DetectedLocationDetails> {
  const nearestMsaInfo = findNearestMsa(lat, lng);
  let detectedCity = nearestMsaInfo.msa.primaryCity;
  let detectedState = nearestMsaInfo.msa.primaryState;
  let formattedAddress = `${detectedCity}, ${detectedState}`;

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 
        'Accept-Language': 'en',
        'User-Agent': 'W8VR-App/1.0 (contact@w8vr.app)'
      },
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const localTown = addr.city || addr.town || addr.village || addr.suburb || addr.municipality;
      const stateCode = addr.state_code?.toUpperCase() || addr.state || detectedState;

      if (localTown) {
        detectedCity = localTown;
        detectedState = stateCode;
        formattedAddress = `${localTown}, ${stateCode}`;
      }
    }
  } catch {
    // Gracefully use nearest MSA fallback if network is offline
  }

  // Check if detected city is a suburb of an MSA
  const metroMarket = getMetroMarketForCity(`${detectedCity}, ${detectedState}`) ||
                      getMetroMarketForCity(detectedCity);

  const parentMetro = metroMarket?.metroLabel || nearestMsaInfo.metroLabel;
  const cbsaCode = metroMarket?.msa.cbsaCode || nearestMsaInfo.msa.cbsaCode;
  const isSuburb = metroMarket?.isSuburb ?? (nearestMsaInfo.distanceMiles > 10);

  const centerCoords = METRO_COORDINATES[nearestMsaInfo.msa.primaryCity.toLowerCase()];
  const distanceToCentroid = centerCoords
    ? calculateDistanceMiles(lat, lng, centerCoords.lat, centerCoords.lng)
    : nearestMsaInfo.distanceMiles;

  return {
    city: detectedCity,
    state: detectedState,
    formattedAddress,
    latitude: lat,
    longitude: lng,
    parentMetroTitle: parentMetro,
    cbsaCode,
    isSuburb,
    distanceToMetroCentroidMiles: Math.round(distanceToCentroid * 10) / 10,
    source: 'gps_reverse_geocode',
  };
}

/**
 * Prompts the browser Geolocation API for the user's position upon user request.
 * Resolves with complete location details mapped to local city and parent MSA.
 */
export function requestUserLocation(): Promise<DetectedLocationDetails> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude, accuracy } = pos.coords;
          const coords: UserLocationCoordinates = {
            latitude,
            longitude,
            accuracy,
            timestamp: Date.now(),
          };

          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.PERMISSION, 'granted');
            localStorage.setItem(STORAGE_KEYS.COORDS, JSON.stringify(coords));
          }

          const details = await reverseGeocodeCoordinates(latitude, longitude);

          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.DETAILS, JSON.stringify(details));
            window.dispatchEvent(new CustomEvent('w8vr:location-changed', { detail: details }));
          }

          resolve(details);
        } catch (err) {
          reject(err);
        }
      },
      (err) => {
        if (typeof window !== 'undefined') {
          if (err.code === err.PERMISSION_DENIED) {
            localStorage.setItem(STORAGE_KEYS.PERMISSION, 'denied');
          }
        }
        reject(err);
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  });
}
