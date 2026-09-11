import { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Globe, 
  X, 
  Navigation, 
  Home, 
  Check, 
  Building2
} from 'lucide-react';
import cx from 'classnames';
import { 
  searchMsas, 
  POPULAR_METRO_HUBS,
  getMetroMarketForCity
} from '../lib/usMsaDirectory';
import { 
  requestUserLocation
} from '../services/locationService';

interface SearchLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: string;
  onSelectLocation: (location: string, coordinates?: { lat: number; lng: number }) => void;
  userHomeCity?: string;
}

export function SearchLocationModal({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
  userHomeCity = 'Chicago, IL',
}: SearchLocationModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customCityInput, setCustomCityInput] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const filteredMsas = useMemo(() => {
    return searchMsas(searchQuery);
  }, [searchQuery]);

  const matchedSuburbMarket = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return undefined;
    return getMetroMarketForCity(searchQuery);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleClose = () => {
    setSearchQuery('');
    setCustomCityInput('');
    onClose();
  };

  const handleSelect = (loc: string, coords?: { lat: number; lng: number }) => {
    setSearchQuery('');
    setCustomCityInput('');
    onSelectLocation(loc, coords);
    onClose();
  };

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const details = await requestUserLocation();
      setIsDetectingLocation(false);
      handleSelect(details.formattedAddress, { lat: details.latitude, lng: details.longitude });
    } catch (err) {
      setIsDetectingLocation(false);
      console.warn('Geolocation detection failed or declined:', err);
      handleSelect(userHomeCity || 'All US Markets');
    }
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Select Search Location"
    >
      <div className="bg-surface-lowest rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4 bg-surface-low/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge bg-primary text-white text-[10px] font-headline font-black uppercase tracking-wider">
                Nationwide 387 Metros
              </span>
              <h2 className="font-headline font-black text-lg sm:text-xl text-text-dark">
                Choose Search Location
              </h2>
            </div>
            <p className="text-xs text-text-medium mt-1">
              Search events nationally across the United States or explore any of the 387 metropolitan areas.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-surface-high text-text-medium hover:text-text-dark transition-colors cursor-pointer"
            aria-label="Close location selector"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Quick Toggles */}
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-surface flex flex-col gap-3.5">
          {/* Search Input */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search 387 metro areas, cities, or state codes (e.g. St. Louis, Atlanta, MO, GA)..."
              className="input-field pl-10 pr-10 py-2.5 text-sm bg-surface-lowest shadow-2xs font-medium"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-light hover:text-text-dark"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Quick Scope Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelect('All US Markets')}
              className={cx(
                'px-3 py-1.5 rounded-xl text-xs font-headline font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs',
                currentLocation === 'All US Markets'
                  ? 'bg-primary text-white shadow-sm ring-2 ring-primary ring-offset-1'
                  : 'bg-surface-lowest text-text-dark hover:bg-primary/10 hover:text-primary border border-gray-100'
              )}
            >
              <Globe size={14} className={currentLocation === 'All US Markets' ? 'text-white' : 'text-primary'} />
              <span>🌐 All US Markets (National)</span>
              {currentLocation === 'All US Markets' && <Check size={13} className="ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
              className="px-3 py-1.5 rounded-xl text-xs font-headline font-bold bg-surface-lowest text-text-dark hover:bg-surface-high border border-gray-100 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Navigation size={13} className="text-secondary" />
              <span>{isDetectingLocation ? 'Detecting...' : 'Current Location'}</span>
            </button>

            {userHomeCity && (
              <button
                type="button"
                onClick={() => handleSelect(userHomeCity)}
                className={cx(
                  'px-3 py-1.5 rounded-xl text-xs font-headline font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs',
                  currentLocation.toLowerCase() === userHomeCity.toLowerCase()
                    ? 'bg-primary text-white shadow-sm ring-2 ring-primary ring-offset-1'
                    : 'bg-surface-lowest text-text-dark hover:bg-surface-high border border-gray-100'
                )}
              >
                <Home size={13} className={currentLocation.toLowerCase() === userHomeCity.toLowerCase() ? 'text-white' : 'text-primary'} />
                <span>Home ({userHomeCity})</span>
              </button>
            )}
          </div>

          {/* Popular Hubs */}
          <div>
            <span className="text-[10px] font-headline font-bold text-text-light uppercase tracking-wider block mb-1.5">
              Popular Metro Hubs:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_METRO_HUBS.map(hub => {
                const isSelected = currentLocation.toLowerCase().startsWith(hub.toLowerCase());
                return (
                  <button
                    key={hub}
                    type="button"
                    onClick={() => handleSelect(hub)}
                    className={cx(
                      'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                      isSelected
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-surface-lowest text-text-medium hover:bg-primary/10 hover:text-primary border border-gray-100'
                    )}
                  >
                    {hub}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scrollable 387 MSAs List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-gray-100/80">
          {/* Suburb -> Metro Area Callout */}
          {matchedSuburbMarket && matchedSuburbMarket.isSuburb && (
            <div className="mb-3 p-3.5 rounded-2xl bg-primary/10 border border-primary/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-headline font-bold text-text-dark">
                  <MapPin size={14} className="text-primary shrink-0" />
                  <span>{matchedSuburbMarket.suburbName}</span>
                  <span className="text-text-medium font-normal">· Part of <strong>{matchedSuburbMarket.metroLabel}</strong></span>
                </div>
                <p className="text-[11px] text-text-medium mt-0.5">
                  Located {matchedSuburbMarket.distanceToCentroidMiles ? `~${matchedSuburbMarket.distanceToCentroidMiles} miles from ` : ''}{matchedSuburbMarket.primaryCity} center
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleSelect(`${matchedSuburbMarket.suburbName}, ${matchedSuburbMarket.msa.primaryState}`)}
                  className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-surface-lowest border border-primary/30 text-xs font-headline font-bold text-text-dark hover:bg-surface-high transition-colors cursor-pointer text-center"
                >
                  {matchedSuburbMarket.suburbName} Only
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect(`${matchedSuburbMarket.msa.primaryCity}, ${matchedSuburbMarket.msa.primaryState}`)}
                  className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-headline font-bold shadow-xs hover:brightness-110 transition-all cursor-pointer text-center"
                >
                  {matchedSuburbMarket.primaryCity} Metro (+50 mi)
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-text-light uppercase tracking-wider">
              {searchQuery ? `Matching Metropolitan Areas (${filteredMsas.length})` : 'All 387 Metropolitan Statistical Areas'}
            </span>
            <span className="text-[11px] text-text-medium">
              Sorted alphabetically by city
            </span>
          </div>

          {filteredMsas.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center">
              <Building2 size={32} className="text-text-light mb-2" />
              <p className="font-headline font-bold text-text-dark text-sm">No metropolitan area found for "{searchQuery}"</p>
              <p className="text-xs text-text-medium mt-1">You can enter a custom town or city below.</p>
            </div>
          ) : (
            filteredMsas.map(msa => {
              const displayName = `${msa.primaryCity}, ${msa.primaryState}`;
              const isSelected = 
                currentLocation.toLowerCase() === displayName.toLowerCase() ||
                currentLocation.toLowerCase() === msa.primaryCity.toLowerCase();

              return (
                <button
                  key={msa.cbsaCode}
                  type="button"
                  onClick={() => handleSelect(displayName)}
                  className={cx(
                    'w-full py-3 px-2.5 flex items-center justify-between gap-3 text-left transition-colors rounded-xl cursor-pointer group',
                    isSelected ? 'bg-primary/10' : 'hover:bg-surface-low'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cx(
                        'font-headline font-black text-sm',
                        isSelected ? 'text-primary' : 'text-text-dark group-hover:text-primary'
                      )}>
                        {msa.primaryCity}, {msa.primaryState}
                      </span>
                      {msa.top50Rank && (
                        <span className="badge bg-amber-100 text-amber-900 border border-amber-200 text-[9px] font-bold py-0.2 px-1.5">
                          Top {msa.top50Rank} Hub
                        </span>
                      )}
                      <span className="text-[10px] text-text-light font-medium">
                        CBSA {msa.cbsaCode}
                      </span>
                    </div>

                    <p className="text-xs text-text-medium mt-0.5 truncate">
                      {msa.title}
                    </p>

                    {msa.componentCities && msa.componentCities.length > 0 && (
                      <p className="text-[11px] text-text-light mt-0.5 truncate">
                        Includes: {msa.componentCities.slice(0, 3).join(', ')}
                        {msa.componentCities.length > 3 && ` +${msa.componentCities.length - 3} more`}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {isSelected ? (
                      <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                        <Check size={14} />
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Select →
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Custom Town / Footer */}
        <div className="p-4 border-t border-gray-100 bg-surface-low/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <MapPin size={16} className="text-primary shrink-0" />
            <input
              type="text"
              placeholder="Or enter custom town/location..."
              value={customCityInput}
              onChange={e => setCustomCityInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && customCityInput.trim()) {
                  e.preventDefault();
                  handleSelect(customCityInput.trim());
                }
              }}
              className="input-field py-1.5 px-3 text-xs bg-surface-lowest font-medium w-full max-w-xs"
            />
            {customCityInput.trim() && (
              <button
                type="button"
                onClick={() => handleSelect(customCityInput.trim())}
                className="btn btn-primary py-1 px-3 text-xs font-bold shrink-0 cursor-pointer"
              >
                Apply
              </button>
            )}
          </div>

          <div className="text-[11px] text-text-light text-right">
            ⚡ 100% US coverage • 387 Metropolitan Areas
          </div>
        </div>
      </div>
    </div>
  );
}
