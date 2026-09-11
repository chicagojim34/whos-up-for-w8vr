import { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Search, 
  Lock, 
  ExternalLink, 
  Loader2, 
  Edit3, 
  Building, 
  CheckCircle2 
} from 'lucide-react';
import { searchPlaces, type PlaceSuggestion } from '../services/googleMapsService';

interface SelectedPlaceData {
  name: string;
  address: string;
  city: string;
  state: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  mapsUrl?: string;
}

interface GooglePlacesVenuePickerProps {
  venue: string;
  address: string;
  cityContext?: string;
  onSelectPlace: (data: SelectedPlaceData) => void;
  onChangeVenue: (name: string) => void;
  onChangeAddress: (addr: string) => void;
}

export function GooglePlacesVenuePicker({
  venue,
  address,
  cityContext,
  onSelectPlace,
  onChangeVenue,
  onChangeAddress,
}: GooglePlacesVenuePickerProps) {
  const [query, setQuery] = useState(venue);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isManualMode, setIsManualMode] = useState(!venue && !address);
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(venue);
  }, [venue]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = async (val: string) => {
    setQuery(val);
    onChangeVenue(val);
    setSelectedPlace(null);

    if (val.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchPlaces(val, cityContext);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickPlace = (p: PlaceSuggestion) => {
    setSelectedPlace(p);
    setQuery(p.name);
    setIsOpen(false);
    onSelectPlace({
      name: p.name,
      address: p.formattedAddress,
      city: p.city,
      state: p.state,
      lat: p.latitude,
      lng: p.longitude,
      placeId: p.placeId,
      mapsUrl: p.googleMapsUrl,
    });
  };

  return (
    <div className="flex flex-col gap-4" ref={containerRef}>
      {/* Search / Select Bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="ev-venue-search" className="text-xs font-bold text-text-dark flex items-center gap-1.5">
            <span>VENUE OR LOCATION (VIA GOOGLE MAPS)</span>
            <span className="badge bg-primary/10 text-primary text-[9px] font-bold py-0.2 px-1.5 uppercase">
              Long-Tail Search
            </span>
          </label>
          <button
            type="button"
            onClick={() => setIsManualMode(!isManualMode)}
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Edit3 size={12} />
            <span>{isManualMode ? 'Use Google Maps Search' : 'Manual / Custom Venue'}</span>
          </button>
        </div>

        {!isManualMode ? (
          <div className="relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none"
              size={18}
              aria-hidden="true"
            />
            <input
              id="ev-venue-search"
              type="text"
              placeholder="Search any restaurant, bar, park, stadium, or street address..."
              value={query}
              onChange={e => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setIsOpen(true);
              }}
              className="input-field pl-10 pr-10 py-3 text-sm bg-surface-lowest shadow-2xs font-medium w-full"
            />
            {isLoading && (
              <Loader2
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary animate-spin"
              />
            )}

            {/* Suggestions Dropdown */}
            {isOpen && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-lowest rounded-2xl shadow-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden z-30 animate-slide-up">
                {suggestions.map(item => (
                  <button
                    key={item.placeId}
                    type="button"
                    onClick={() => handlePickPlace(item)}
                    className="w-full p-3.5 flex items-start gap-3 text-left hover:bg-surface-low transition-colors cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-white transition-colors">
                      <MapPin size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-headline font-bold text-sm text-text-dark group-hover:text-primary">
                          {item.name}
                        </span>
                        {item.category && (
                          <span className="badge bg-surface-high text-text-medium text-[9px] font-bold">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-medium mt-0.5 line-clamp-1">
                        {item.formattedAddress}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 shrink-0 self-center">
                      Select →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="relative">
              <Building
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none"
                size={18}
                aria-hidden="true"
              />
              <input
                id="ev-venue-custom"
                type="text"
                placeholder="Custom Venue Name (e.g. Grandma's Backyard, The Red Room Loft)"
                value={venue}
                onChange={e => onChangeVenue(e.target.value)}
                className="input-field pl-10 text-sm font-medium w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Selected Verified Place Card */}
      {selectedPlace && (
        <div className="p-3.5 bg-surface-lowest rounded-2xl border border-primary/25 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <span className="font-headline font-bold text-xs text-text-dark block truncate">
                {selectedPlace.name}
              </span>
              <span className="text-[11px] text-text-medium block truncate">
                📍 {selectedPlace.formattedAddress}
              </span>
            </div>
          </div>
          {selectedPlace.googleMapsUrl && (
            <a
              href={selectedPlace.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
            >
              <span>View on Maps</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}

      {/* Exact Address Input (Protected by Privacy Radius) */}
      <div>
        <label htmlFor="ev-address" className="text-xs font-bold text-text-dark mb-1.5 flex items-center gap-1.5">
          <Lock size={13} className="text-primary" />
          <span>EXACT STREET ADDRESS (REVEALED ONLY TO CONFIRMED RSVPS)</span>
        </label>
        <div className="relative">
          <Lock
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light pointer-events-none"
            size={16}
            aria-hidden="true"
          />
          <input
            id="ev-address"
            type="text"
            placeholder="e.g. 1401 Rainey St, Rooftop Level"
            value={address}
            onChange={e => onChangeAddress(e.target.value)}
            className="input-field pl-10 text-sm font-medium"
          />
        </div>
        <p className="text-[11px] text-text-light mt-1">
          Unconfirmed visitors and public maps only see an approximate radius (PRD §7).
        </p>
      </div>
    </div>
  );
}
