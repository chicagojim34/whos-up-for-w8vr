import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Lock, ArrowRight } from 'lucide-react';
import cx from 'classnames';
import { useApp } from '../hooks/useApp';
import { useToast } from '../hooks/useToast';
import { CATEGORY_DEFINITIONS, type EventCategory } from '../lib/categories';
import { StatusRing } from '../components/StatusRing';
import { capacityPct, confirmedCount, rankEvents } from '../lib/events';
import { formatDistance, formatWhen } from '../lib/datetime';

export default function Discovery() {
  const navigate = useNavigate();
  const { events } = useApp();
  const toast = useToast();

  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('All Events');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const visibleEvents = useMemo(() => {
    const list = events.filter(
      e => !e.muted && (selectedCategory === 'All Events' || e.category === selectedCategory)
    );
    return rankEvents(list);
  }, [events, selectedCategory]);

  // Derived, not synced: if the filter hides the pinned event, fall back to
  // the top-ranked one that is still on the map.
  const selectedEvent =
    visibleEvents.find(e => e.id === selectedEventId) ?? visibleEvents[0] ?? null;

  return (
    <div className="flex flex-col pb-28 px-6 bg-surface animate-fade-in max-w-4xl mx-auto w-full">
      <header className="mt-4 mb-4">
        <h1 className="font-headline font-black text-3xl text-text-dark">Discovery map</h1>
        <p className="text-text-medium text-sm mt-1">
          What is happening nearby, with capacity at a glance.
        </p>
      </header>

      <div
        className="flex gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar"
        role="group"
        aria-label="Filter map by category"
      >
        {CATEGORY_DEFINITIONS.map(cat => (
          <button
            key={cat.label}
            onClick={() => setSelectedCategory(cat.label)}
            aria-pressed={selectedCategory === cat.label}
            className={cx(
              'px-3.5 py-1.5 rounded-full text-xs font-headline font-bold shrink-0 transition-all',
              selectedCategory === cat.label
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-lowest text-text-medium hover:bg-surface-high'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg h-[440px] bg-surface-high select-none">
        <div className="absolute inset-0 bg-surface-low">
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1000 440"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M -50,180 C 150,220 220,100 450,260 C 600,340 750,200 1050,280"
              fill="none"
              stroke="var(--color-primary)"
              strokeOpacity="0.16"
              strokeWidth="48"
              strokeLinecap="round"
            />
            <g stroke="var(--color-surface-highest)" strokeLinecap="round">
              <path d="M0 90H1000" strokeWidth="7" />
              <path d="M0 210H1000" strokeWidth="9" />
              <path d="M0 330H1000" strokeWidth="7" />
              <path d="M180 0V440" strokeWidth="9" />
              <path d="M380 0V440" strokeWidth="6" />
              <path d="M600 0V440" strokeWidth="9" />
              <path d="M820 0V440" strokeWidth="6" />
            </g>
          </svg>

          <span className="absolute top-8 left-8 text-[11px] font-bold text-text-light tracking-widest uppercase">
            Downtown arts district
          </span>
          <span className="absolute bottom-24 right-10 text-[11px] font-bold text-text-light tracking-widest uppercase">
            East riverwalk
          </span>
          <span className="absolute top-20 right-20 text-[11px] font-bold text-text-light tracking-widest uppercase">
            West ridge park
          </span>
        </div>

        {/* You are here */}
        <span
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: '42%', top: '48%' }}
          aria-hidden="true"
        >
          <span className="block w-12 h-12 bg-primary/20 rounded-full animate-ping" />
          <span className="absolute inset-0 m-auto w-4 h-4 bg-primary rounded-full shadow-lg ring-2 ring-white" />
        </span>

        {/* Pins */}
        {visibleEvents.map(event => {
          const isSelected = selectedEvent?.id === event.id;
          const isPrivate = event.privacy !== 'public';

          return (
            <button
              key={event.id}
              onClick={() => setSelectedEventId(event.id)}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-20 group"
              style={{ left: `${event.coords.x}%`, top: `${event.coords.y}%` }}
              aria-pressed={isSelected}
              aria-label={`${event.title}, ${
                isPrivate ? 'approximate location' : formatDistance(event.distanceMi)
              }`}
            >
              {/* Privacy obfuscation: private venues get a radius, not a point. */}
              {isPrivate && (
                <span
                  className={cx(
                    'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-dashed transition-all pointer-events-none',
                    isSelected
                      ? 'border-primary bg-primary/10 animate-pulse'
                      : 'border-text-light/60 bg-text-light/10'
                  )}
                  aria-hidden="true"
                />
              )}

              <span
                className={cx(
                  'relative rounded-full p-2.5 flex items-center justify-center ring-2 ring-white shadow-xl transition-all',
                  isSelected
                    ? 'scale-125 bg-primary text-white'
                    : isPrivate
                      ? 'bg-secondary text-white group-hover:scale-110'
                      : 'bg-surface-lowest text-primary group-hover:scale-110'
                )}
              >
                {isPrivate ? (
                  <Lock size={15} aria-hidden="true" />
                ) : (
                  <MapPin size={16} aria-hidden="true" />
                )}
              </span>

              <span
                className={cx(
                  'absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-surface-lowest/95 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold shadow-md pointer-events-none transition-all',
                  isSelected
                    ? 'opacity-100 scale-100 text-primary'
                    : 'opacity-0 scale-90 group-hover:opacity-100 text-text-dark'
                )}
                aria-hidden="true"
              >
                {event.title}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => toast.show('Centred on Austin, TX', 'info')}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-2xl bg-surface-lowest/90 backdrop-blur-md shadow-md flex items-center justify-center text-text-dark hover:text-primary transition-colors"
          aria-label="Centre the map on my location"
        >
          <Navigation size={18} aria-hidden="true" />
        </button>

        {/* Selected event drawer */}
        {selectedEvent && (
          <div className="absolute bottom-4 left-4 right-4 z-30 animate-slide-up">
            <button
              onClick={() => navigate(`/event/${selectedEvent.id}`)}
              className="w-full bg-surface-lowest/95 backdrop-blur-xl p-4 rounded-2xl shadow-xl flex items-center gap-4 text-left hover:bg-surface-lowest transition-all group"
            >
              <img
                src={selectedEvent.image}
                alt=""
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />

              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="badge bg-secondary-container text-on-secondary-container text-[9px] py-0 px-1.5 font-bold uppercase">
                    {selectedEvent.category}
                  </span>
                  <span className="text-[11px] font-bold text-text-medium">
                    {selectedEvent.privacy === 'public'
                      ? formatDistance(selectedEvent.distanceMi)
                      : 'Approx. 500m radius'}
                  </span>
                </span>
                <span className="block font-headline font-bold text-base text-text-dark truncate group-hover:text-primary transition-colors">
                  {selectedEvent.title}
                </span>
                <span className="block text-xs text-text-light truncate">
                  {formatWhen(selectedEvent.startsAt)} • {selectedEvent.location}
                </span>
              </span>

              <span className="flex items-center gap-2 shrink-0">
                <StatusRing
                  capacity={capacityPct(selectedEvent)}
                  size={38}
                  strokeWidth={3.5}
                  variant="bare"
                  srLabel={`${confirmedCount(selectedEvent)} of ${selectedEvent.maxSpots} spots taken`}
                />
                <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-sm group-hover:translate-x-1 transition-transform">
                  <ArrowRight size={16} aria-hidden="true" />
                </span>
              </span>
            </button>
          </div>
        )}

        {visibleEvents.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-text-light font-semibold">
            Nothing in this category nearby.
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 p-4 bg-surface-low rounded-2xl text-xs text-text-medium">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-primary" aria-hidden="true" /> Public event
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-secondary" aria-hidden="true" /> Circle event
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full border-2 border-dashed border-text-light"
              aria-hidden="true"
            />{' '}
            Location approximate
          </span>
        </div>
        <span className="text-text-light">
          Private venues show a 500m radius until you RSVP yes
        </span>
      </div>
    </div>
  );
}
