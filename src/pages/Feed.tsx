import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle2, X, Zap, Search, VolumeX, RotateCcw, Clock } from 'lucide-react';
import cx from 'classnames';
import { useApp } from '../hooks/useApp';
import { useToast } from '../hooks/useToast';
import { CategoryChip } from '../components/CategoryChip';
import { CATEGORY_DEFINITIONS, type EventCategory } from '../lib/categories';
import { StatusRing } from '../components/StatusRing';
import { AvatarGroup } from '../components/AvatarGroup';
import {
  capacityPct,
  confirmedCount,
  eventKindLabel,
  goingNames,
  isFillingFast,
  isFull,
  myRsvp,
  rankEvents,
  waitlistCount,
} from '../lib/events';
import { formatDistance, formatWhen } from '../lib/datetime';

export default function Feed() {
  const { events, rsvpEvent, unmuteEvent } = useApp();
  const toast = useToast();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState<EventCategory>('All Events');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMuted, setShowMuted] = useState(false);

  const query = searchQuery.trim().toLowerCase();

  const { live, muted } = useMemo(() => {
    const matches = events.filter(event => {
      const matchesCategory = activeCategory === 'All Events' || event.category === activeCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      return [
        event.title,
        event.location,
        event.description,
        event.vibe,
        event.category,
        event.performerOrTeam || '',
        event.eventSubType || '',
      ].some(field => field.toLowerCase().includes(query));
    });
    return {
      live: rankEvents(matches.filter(e => !e.muted)),
      muted: matches.filter(e => e.muted),
    };
  }, [events, activeCategory, query]);

  const handleRsvp = (eventId: string, title: string) => {
    const outcome = rsvpEvent(eventId, 'going');
    if (outcome.blocked) {
      toast.show(`"${title}" is full and the host closed the waitlist`, 'warning');
    } else if (outcome.waitlisted) {
      toast.show(`"${title}" is full — you are on the waitlist`, 'info');
    } else if (outcome.status === 'going') {
      toast.show(`You are going to "${title}"`);
    }
  };

  const handleQuiet = (eventId: string, title: string) => {
    rsvpEvent(eventId, 'no');
    toast.show(`"${title}" muted — no more updates for it`, 'info');
  };

  return (
    <div className="flex flex-col pb-24 animate-fade-in">
      {/* Search & categories */}
      <div className="px-6 pt-2 pb-4 flex flex-col gap-3">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light pointer-events-none"
            size={18}
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search events"
            placeholder="Search events, artists, teams, vibes, or venues..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field pl-11 py-3 text-sm rounded-full bg-surface-high border-none focus:bg-surface-lowest"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-light hover:text-text-dark p-1"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-1 no-scrollbar"
          role="region"
          aria-label="Filter by category"
        >
          {CATEGORY_DEFINITIONS.map(cat => (
            <CategoryChip
              key={cat.label}
              category={cat.label}
              active={activeCategory === cat.label}
              onClick={() => setActiveCategory(cat.label)}
              size="md"
            />
          ))}
        </div>
      </div>

      {/* Grid */}
      <ul className="grid gap-6 px-6 list-none grid-cols-1 md:grid-cols-2">
        {live.map(event => {
          const capacity = capacityPct(event);
          const going = confirmedCount(event);
          const full = isFull(event);
          const mine = myRsvp(event);
          const names = goingNames(event);

          return (
            <li key={event.id}>
              <article
                className="card p-0 overflow-hidden relative rounded-3xl flex flex-col group h-full"
              >
              {/* Image banner */}
              <div className="relative h-56 w-full">
                <img
                  src={event.image}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                <span className="glass-panel badge flex items-center gap-1 text-xs absolute top-3.5 right-3.5">
                  <MapPin size={13} className="text-primary" aria-hidden="true" />
                  <span className="font-bold">{formatDistance(event.distanceMi)}</span>
                </span>

                <div className="absolute top-3.5 left-3.5 flex flex-col gap-1">
                  {isFillingFast(event) && (
                    <span className="badge bg-error text-white flex items-center gap-1 font-black tracking-widest text-[9px]">
                      <Zap size={11} fill="currentColor" aria-hidden="true" /> FILLING FAST
                    </span>
                  )}
                  {full && (
                    <span className="badge bg-text-dark text-white font-black tracking-widest text-[9px]">
                      FULL
                    </span>
                  )}
                  {event.eventSubType && (
                    <span className="badge bg-black/70 backdrop-blur-md text-white font-bold tracking-widest text-[9px] uppercase">
                      {event.eventSubType}
                    </span>
                  )}
                </div>

                <StatusRing
                  capacity={capacity}
                  size={46}
                  strokeWidth={4}
                  variant="glass"
                  srLabel={`${going} of ${event.maxSpots} spots taken`}
                  className="absolute bottom-3 right-3.5 z-10"
                />
              </div>

              {/* Body */}
              <div className="px-8 pb-8 pt-6 flex flex-col gap-4">
                <div className="flex justify-between items-center gap-3 text-xs font-bold">
                  <span
                    className={cx(
                      'px-2.5 py-1 rounded-md text-[10px] uppercase font-headline tracking-widest',
                      event.privacy === 'circle'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-surface-high text-text-medium'
                    )}
                  >
                    {eventKindLabel(event)}
                  </span>
                  <time
                    dateTime={event.startsAt}
                    className="text-text-dark font-headline font-extrabold opacity-85 text-right"
                  >
                    {formatWhen(event.startsAt)}
                  </time>
                </div>

                <div>
                  <h3 className="font-headline font-black text-2xl leading-[1.2] tracking-tight text-text-dark">
                    <button
                      onClick={() => navigate(`/event/${event.id}`)}
                      className="text-left group-hover:text-primary transition-colors after:absolute after:inset-0 after:content-['']"
                    >
                      {event.title}
                    </button>
                  </h3>

                  {event.performerOrTeam && (
                    <div className="text-xs font-headline font-bold text-primary mt-1">
                      ⭐ {event.performerOrTeam}
                    </div>
                  )}

                  {event.showtime && event.meetupTime ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary mt-1">
                      <Clock size={12} />
                      <span>Meet {event.meetupTime} • Show {event.showtime}</span>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-1.5 text-xs text-text-medium mt-1">
                    <MapPin size={12} className="text-primary shrink-0" aria-hidden="true" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>

                  <p className="text-sm text-text-medium leading-relaxed mt-2 line-clamp-2">
                    {event.description}
                  </p>

                  {event.ticketSectionInfo && (
                    <div className="mt-2.5">
                      <span className="badge bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                        🎟️ {event.ticketSectionInfo}
                      </span>
                    </div>
                  )}
                </div>

                  <div className="flex justify-between items-center gap-3 mt-auto pt-5">
                    {names.length > 0 ? (
                      <span className="flex items-center gap-2">
                        <AvatarGroup names={names} size={30} max={3} label={`${going} going`} />
                        <span className="text-xs font-semibold text-text-medium">{going} going</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-text-light uppercase tracking-wider">
                        {going} going • {event.interested} interested
                      </span>
                    )}

                    {/* Sits above the card-wide title link. */}
                    <span className="flex items-center gap-2 relative z-10">
                      {mine === 'going' && (
                        <span className="flex items-center gap-1.5 text-secondary font-headline font-bold text-sm bg-secondary-container px-3 py-1.5 rounded-full">
                          <CheckCircle2 size={16} aria-hidden="true" /> Going
                        </span>
                      )}
                      {mine === 'waitlist' && (
                        <span className="badge bg-primary-fixed text-primary-container font-bold text-xs flex items-center gap-1.5">
                          <Clock size={13} aria-hidden="true" /> Waitlisted #{waitlistCount(event)}
                        </span>
                      )}
                      {(mine === 'maybe' || mine === null) && (
                        <>
                          <button
                            onClick={() => handleQuiet(event.id, event.title)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-quiet hover:text-error hover:bg-error-container transition-colors"
                            aria-label={`Not going to ${event.title} — mute it`}
                          >
                            <X size={18} aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => handleRsvp(event.id, event.title)}
                            className={cx(
                              mine === 'maybe'
                                ? 'btn btn-outline py-[0.45rem] px-4 text-sm rounded-full'
                                : 'btn btn-primary py-2 px-5 text-sm'
                            )}
                          >
                            {mine === 'maybe' ? "I'm in" : full ? 'Join waitlist' : 'RSVP now'}
                          </button>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      {/* Quieted events, collapsed out of the way */}
      {muted.length > 0 && (
        <section className="px-6 mt-10">
          <button
            onClick={() => setShowMuted(v => !v)}
            className="flex items-center gap-2 text-xs font-headline font-bold text-text-light hover:text-text-dark transition-colors"
            aria-expanded={showMuted}
          >
            <VolumeX size={15} aria-hidden="true" />
            {muted.length} quieted {muted.length === 1 ? 'event' : 'events'}
            <span className="text-primary">{showMuted ? 'Hide' : 'Show'}</span>
          </button>

          {showMuted && (
            <ul className="mt-4 flex flex-col gap-2 list-none">
              {muted.map(event => (
                <li
                  key={event.id}
                  className="card card-muted flex items-center justify-between gap-4 p-5"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-full bg-surface-high flex items-center justify-center text-text-light shrink-0">
                      <VolumeX size={20} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-bold text-sm text-text-medium truncate">
                        {event.title}
                      </span>
                      <span className="block text-xs text-text-light">
                        Muted — no updates for this one
                      </span>
                    </span>
                  </span>
                  <button
                    onClick={() => unmuteEvent(event.id)}
                    className="btn btn-ghost flex items-center gap-1 text-xs font-bold shrink-0"
                  >
                    <RotateCcw size={14} aria-hidden="true" /> Unmute
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {live.length === 0 && muted.length === 0 && (
        <div className="mt-20 flex flex-col items-center justify-center text-center p-8">
          <span className="w-16 h-16 rounded-full bg-surface-high flex items-center justify-center text-text-light mb-4">
            <Search size={32} aria-hidden="true" />
          </span>
          <h3 className="font-headline font-bold text-lg">No events found</h3>
          <p className="text-sm text-text-medium mt-1">
            Try a different category, or search for something else.
          </p>
          <button
            onClick={() => {
              setActiveCategory('All Events');
              setSearchQuery('');
            }}
            className="btn btn-outline mt-4"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
