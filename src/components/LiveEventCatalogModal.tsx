import { useState, useEffect, useTransition, useCallback } from 'react';
import { 
  Search, 
  MapPin, 
  Clock, 
  Ticket, 
  Sparkles, 
  X, 
  ExternalLink, 
  Radio,
  Loader2,
  Calendar
} from 'lucide-react';
import cx from 'classnames';
import { searchLiveEventCatalog, getCachedLiveEvents } from '../services/liveEventCatalog';
import type { AutoPullEvent, EventSubType } from '../services/eventAutoPull';

interface LiveEventCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEvent: (event: AutoPullEvent) => void;
  initialCity?: string;
}

const POPULAR_CITIES = [
  'Austin',
  'Chicago',
  'New York',
  'Los Angeles',
  'Dallas',
  'Nashville',
  'Miami',
  'San Francisco',
  'London',
];

const CATEGORIES: { label: string; value: EventSubType | 'All' }[] = [
  { label: 'All Live', value: 'All' },
  { label: 'Concerts', value: 'Concert' },
  { label: 'Sports', value: 'Sports' },
  { label: 'Comedy', value: 'Comedy' },
  { label: 'Theater & Arts', value: 'Theater' },
];

export function LiveEventCatalogModal({
  isOpen,
  onClose,
  onSelectEvent,
  initialCity = 'Austin',
}: LiveEventCatalogModalProps) {
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState(initialCity);
  const [customCity, setCustomCity] = useState('');
  const [category, setCategory] = useState<EventSubType | 'All'>('All');
  const [events, setEvents] = useState<AutoPullEvent[]>(() => getCachedLiveEvents());
  const [isLoading, setIsLoading] = useState(false);
  const [, startTransition] = useTransition();

  const loadEvents = useCallback(
    async (kw: string, currentCity: string, cat: EventSubType | 'All') => {
      setIsLoading(true);
      try {
        const results = await searchLiveEventCatalog({
          keyword: kw,
          city: currentCity === 'All Cities' ? undefined : currentCity,
          subType: cat,
          size: 24,
        });

        startTransition(() => {
          setEvents(results);
          setIsLoading(false);
        });
      } catch {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch live events when modal is opened or filters change
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      loadEvents(keyword, city, category);
    }, keyword ? 350 : 0);

    return () => clearTimeout(timer);
  }, [isOpen, keyword, city, category, loadEvents]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Live Events Catalog"
    >
      <div className="bg-surface-lowest rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between gap-4 bg-surface-low/50">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="badge bg-primary text-white text-[10px] font-headline font-black uppercase tracking-wider">
                Live Global Catalog
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Ticketmaster &amp; SeatGeek Connected
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-headline font-black text-text-dark mt-1">
              Find &amp; Add Live Events
            </h2>
            <p className="text-xs text-text-medium mt-0.5">
              Pull official tour dates, showtimes, venues, and ticket links with 1 click.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-high text-text-medium hover:text-text-dark transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-surface flex flex-col gap-3.5">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none"
              />
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="Search artist, sports team, tour, or venue (e.g. Coldplay, Longhorns, Bargatze)..."
                className="input-field pl-10 pr-10 py-2.5 text-sm bg-surface-lowest shadow-2xs font-medium"
                autoFocus
              />
              {isLoading && (
                <Loader2
                  size={16}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary animate-spin"
                />
              )}
            </div>

            {/* City input / quick switcher */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="relative">
                <MapPin
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="City (e.g. Austin)"
                  value={customCity || city}
                  onChange={e => {
                    setCustomCity(e.target.value);
                    setCity(e.target.value || 'Austin');
                  }}
                  className="input-field pl-8 py-2.5 text-xs w-36 bg-surface-lowest font-bold"
                />
              </div>
            </div>
          </div>

          {/* Quick city pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <span className="text-[10px] font-headline font-bold text-text-light uppercase tracking-wider mr-1 shrink-0">
              Metro:
            </span>
            {POPULAR_CITIES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCity(c);
                  setCustomCity('');
                }}
                className={cx(
                  'px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0',
                  city === c && !customCity
                    ? 'bg-primary text-white shadow-2xs'
                    : 'bg-surface-low text-text-medium hover:bg-surface-high'
                )}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={cx(
                  'px-3.5 py-1.5 rounded-xl text-xs font-headline font-bold transition-all shrink-0 flex items-center gap-1.5',
                  category === cat.value
                    ? 'bg-text-dark text-white shadow-sm'
                    : 'bg-surface-lowest text-text-medium hover:bg-surface-high'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Event List / Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-surface-low/30">
          {events.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-high flex items-center justify-center text-text-light mb-3">
                <Calendar size={28} />
              </div>
              <h3 className="font-headline font-bold text-base text-text-dark">
                No events found for "{keyword || city}"
              </h3>
              <p className="text-xs text-text-medium mt-1 max-w-sm">
                Try searching for a different artist, tour name, or switch to a major metro area.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map(event => (
              <div
                key={event.id}
                className="card p-0 rounded-2xl overflow-hidden flex flex-col bg-surface-lowest shadow-sm hover:shadow-md transition-shadow border border-gray-100 group"
              >
                {/* Image Banner */}
                <div className="relative h-44 w-full bg-text-dark overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                  {/* Subtype Badge */}
                  <span className="badge absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white border border-white/20 text-[10px] uppercase font-bold tracking-wider">
                    {event.eventSubType}
                  </span>

                  {/* Source indicator */}
                  <span className="badge absolute top-3 right-3 bg-primary/90 text-white text-[9px] font-bold uppercase tracking-widest">
                    {event.id.startsWith('tm-') ? 'Ticketmaster' : 'SeatGeek'}
                  </span>

                  {/* Date overlay */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[11px] font-bold text-primary-fixed block uppercase tracking-wider">
                      📅 {event.date}
                    </span>
                    <h4 className="font-headline font-black text-base leading-tight text-white truncate drop-shadow-sm">
                      {event.title}
                    </h4>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div className="flex flex-col gap-1.5">
                    {/* Performer / Matchup */}
                    {event.performerOrTeam && (
                      <div className="text-xs font-headline font-bold text-primary">
                        ⭐ {event.performerOrTeam}
                      </div>
                    )}

                    {/* Venue & Location */}
                    <div className="text-xs text-text-medium flex items-center gap-1.5 truncate">
                      <MapPin size={13} className="text-primary shrink-0" />
                      <span className="truncate">{event.venue} ({event.city})</span>
                    </div>

                    {/* Dual-Time Matrix Pill */}
                    <div className="flex items-center gap-2 text-[11px] font-bold bg-primary-fixed/25 p-2 rounded-xl text-text-dark">
                      <span className="text-primary flex items-center gap-1">
                        <Clock size={12} /> Meet: {event.suggestedMeetupTime}
                      </span>
                      <span className="text-text-light">•</span>
                      <span className="text-secondary font-black">
                        Show: {event.showtime}
                      </span>
                    </div>

                    {/* Target seating / Price */}
                    <div className="flex items-center justify-between text-[11px] text-text-medium pt-1">
                      <span className="flex items-center gap-1 truncate max-w-[60%]">
                        <Ticket size={12} className="text-primary shrink-0" />
                        <span className="truncate">{event.ticketSectionInfo}</span>
                      </span>
                      <span className="font-bold text-text-dark shrink-0">
                        {event.priceRange}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectEvent(event);
                        onClose();
                      }}
                      className="btn btn-primary flex-1 text-xs py-2 px-3 flex items-center justify-center gap-1.5 font-headline font-bold"
                    >
                      <Sparkles size={14} />
                      <span>Host Group Outing</span>
                    </button>

                    {event.ticketUrl && (
                      <a
                        href={event.ticketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline text-xs py-2 px-2.5 text-text-medium hover:text-text-dark shrink-0"
                        title="View tickets on provider site"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 px-6 border-t border-gray-100 bg-surface-lowest flex items-center justify-between text-xs text-text-medium">
          <span className="flex items-center gap-1.5">
            <Radio size={14} className="text-primary animate-pulse" />
            <span>Constantly updating live from official ticketing networks</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-text-medium hover:text-text-dark"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
