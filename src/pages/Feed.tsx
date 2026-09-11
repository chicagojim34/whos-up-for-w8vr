import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  CheckCircle2, 
  X, 
  Zap, 
  Search, 
  VolumeX, 
  RotateCcw, 
  Clock, 
  Sparkles, 
  Users, 
  Globe, 
  ChevronDown,
  Compass,
  Check
} from 'lucide-react';
import cx from 'classnames';
import { useApp } from '../hooks/useApp';
import { useToast } from '../hooks/useToast';
import { CategoryChip } from '../components/CategoryChip';
import { CATEGORY_DEFINITIONS, type EventCategory } from '../lib/categories';
import { StatusRing } from '../components/StatusRing';
import { LiveEventCatalogModal } from '../components/LiveEventCatalogModal';
import { SearchLocationModal } from '../components/SearchLocationModal';
import { AvatarGroup } from '../components/AvatarGroup';

import {
  capacityPct,
  confirmedCount,
  eventKindLabel,
  goingNames,
  isFillingFast,
  isFull,
  myRsvp,
  waitlistCount,
} from '../lib/events';
import { formatDistance, formatWhen } from '../lib/datetime';
import { 
  performUnifiedSearch, 
  computePostedEventMatchScore, 
  type UnifiedSearchResultItem 
} from '../services/unifiedSearch';

export default function Feed() {
  const { events, circles, user, rsvpEvent, unmuteEvent, createEvent } = useApp();
  const toast = useToast();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState<EventCategory>('All Events');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMuted, setShowMuted] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [searchLocation, setSearchLocation] = useState<string>(() => {
    try {
      return localStorage.getItem('w8vr.search_location') || 'All US Markets';
    } catch {
      return 'All US Markets';
    }
  });
  const [searchRadiusMiles, setSearchRadiusMiles] = useState<number | 'metro'>(() => {
    try {
      const saved = localStorage.getItem('w8vr.search_radius');
      if (saved === 'metro') return 'metro';
      if (saved) return parseInt(saved, 10);
      return 50;
    } catch {
      return 50;
    }
  });
  const [isRadiusDropdownOpen, setIsRadiusDropdownOpen] = useState(false);
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | undefined>(() => {
    try {
      const raw = localStorage.getItem('w8vr.user_coords');
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const handleSelectLocation = (loc: string, coords?: { lat: number; lng: number }) => {
    setSearchLocation(loc);
    if (coords) {
      setUserCoordinates(coords);
      try {
        localStorage.setItem('w8vr.user_coords', JSON.stringify(coords));
      } catch (e) {
        console.debug('Failed to cache user coordinates', e);
      }
    } else if (loc === 'All US Markets') {
      setUserCoordinates(undefined);
      try {
        localStorage.removeItem('w8vr.user_coords');
      } catch (e) {
        console.debug('Failed to clear cached user coordinates', e);
      }
    }
    try {
      localStorage.setItem('w8vr.search_location', loc);
    } catch (e) {
      console.debug('Failed to cache search location', e);
    }
  };

  const query = searchQuery.trim().toLowerCase();

  // One Unified Search: Searches posted events, circle activity & live catalog across 387 markets
  const unifiedResults = useMemo(() => {
    return performUnifiedSearch({
      query: searchQuery,
      category: activeCategory,
      user,
      circles,
      postedEvents: events,
      userCity: searchLocation,
      radiusMiles: searchRadiusMiles,
      userCoordinates,
    });
  }, [events, circles, user, activeCategory, searchQuery, searchLocation, searchRadiusMiles, userCoordinates]);

  const live = useMemo(() => {
    return unifiedResults.filter(r => !r.muted);
  }, [unifiedResults]);

  const muted = useMemo(() => {
    if (!query) return events.filter(e => e.muted);
    return events.filter(e => e.muted && computePostedEventMatchScore(e, query) > 0);
  }, [events, query]);

  const hasCircleMatches = useMemo(() => {
    return live.some(item => item.hasCircleAttendeesGoing);
  }, [live]);

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

  const handleQuickHostCatalogEvent = (item: UnifiedSearchResultItem) => {
    if (item.originalCatalogEvent) {
      navigate('/post', { state: { prefillEvent: item.originalCatalogEvent } });
    }
  };

  const handleQuickRsvpCatalogEvent = (item: UnifiedSearchResultItem) => {
    const cat = item.originalCatalogEvent;
    if (!cat) return;

    const startsAtIso = new Date(Date.now() + 86400000 * 2).toISOString();
    const created = createEvent({
      title: cat.title,
      category: cat.category,
      image: cat.image,
      vibe: cat.description,
      startsAt: startsAtIso,
      isVirtual: false,
      location: `${cat.venue}, ${cat.city}`,
      venueAddress: cat.venueAddress,
      exactAddress: cat.venueAddress,
      isTicketedEvent: Boolean(cat.ticketUrl),
      eventSubType: cat.eventSubType,
      performerOrTeam: cat.performerOrTeam,
      showtime: cat.showtime,
      doorsTime: cat.doorsTime,
      meetupTime: cat.suggestedMeetupTime,
      meetupLocation: cat.suggestedMeetupLocation,
      ticketUrl: cat.ticketUrl,
      ticketSectionInfo: cat.ticketSectionInfo,
      priceRange: cat.priceRange,
      lineup: cat.lineup,
      bagPolicy: cat.bagPolicy,
      ageRestriction: cat.ageRestriction,
      doorsTimeConfirmed: cat.doorsConfirmed,
      doorsTimeSource: cat.doorsSource,
      venueGateInfo: cat.venueGateInfo,
      canonicalId: cat.id,
      ticketOptions: cat.ticketOptions,
      provenanceSources: cat.provenanceSources,
      maxSpots: 20,
      autoWaitlist: true,
      privacy: 'public',
    });

    toast.show(`Outing created! You are going to "${created.title}"`);
  };

  return (
    <div className="flex flex-col pb-24 animate-fade-in">
      {/* Unified Search & Location Toolbar */}
      <div className="px-6 pt-2 pb-4 flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light pointer-events-none"
              size={18}
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search events"
              placeholder="Search any restaurant, art walk, festival, tour, game, or circle event..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field pl-11 pr-9 py-3 text-sm rounded-full bg-surface-high border-none focus:bg-surface-lowest w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-light hover:text-text-dark p-1 cursor-pointer"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Location Switcher Pill */}
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-full bg-surface-high hover:bg-surface-low border border-primary/25 text-xs font-headline font-bold text-text-dark shrink-0 cursor-pointer shadow-2xs transition-all hover:border-primary/50 active:scale-98"
            aria-label={`Search location: ${searchLocation}. Click to change.`}
          >
            <span className="flex items-center gap-1.5 min-w-0">
              {searchLocation === 'All US Markets' ? (
                <Globe size={15} className="text-primary shrink-0" />
              ) : (
                <MapPin size={15} className="text-primary shrink-0" />
              )}
              <span className="truncate max-w-[140px] sm:max-w-[180px]">
                {searchLocation === 'All US Markets' ? 'All US Markets' : searchLocation}
              </span>
            </span>
            <ChevronDown size={14} className="text-text-light shrink-0 ml-0.5" />
          </button>

          {/* Distance Radius Selector Pill */}
          {searchLocation !== 'All US Markets' && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsRadiusDropdownOpen(!isRadiusDropdownOpen)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-surface-high hover:bg-surface-low border border-primary/25 text-xs font-headline font-bold text-text-dark shrink-0 cursor-pointer shadow-2xs transition-all hover:border-primary/50 active:scale-98"
                aria-label={`Search radius: ${searchRadiusMiles === 'metro' ? 'Full Metro Area' : `${searchRadiusMiles} miles`}`}
              >
                <Compass size={14} className="text-primary shrink-0" />
                <span>{searchRadiusMiles === 'metro' ? 'Full Metro' : `+${searchRadiusMiles} mi`}</span>
                <ChevronDown size={13} className="text-text-light shrink-0 ml-0.5" />
              </button>

              {isRadiusDropdownOpen && (
                <div 
                  className="absolute right-0 top-full mt-2 z-50 bg-surface-lowest rounded-2xl shadow-xl border border-gray-100 p-2 min-w-[210px] animate-fade-in flex flex-col gap-1"
                  role="menu"
                >
                  <div className="px-2.5 py-1 text-[10px] font-headline font-bold text-text-light uppercase tracking-wider">
                    Search Distance Radius
                  </div>
                  {[
                    { label: '10 mi (City Core Only)', value: 10 },
                    { label: '25 mi (Inner Suburbs)', value: 25 },
                    { label: '50 mi (Full Metro · Default)', value: 50 },
                    { label: '100 mi (Regional Market)', value: 100 },
                    { label: 'Entire Metro Area (CBSA)', value: 'metro' },
                  ].map(opt => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setSearchRadiusMiles(opt.value as number | 'metro');
                        try {
                          localStorage.setItem('w8vr.search_radius', String(opt.value));
                        } catch (e) {
                          console.debug('Failed to cache search radius', e);
                        }
                        setIsRadiusDropdownOpen(false);
                      }}
                      className={cx(
                        'px-2.5 py-2 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors cursor-pointer',
                        searchRadiusMiles === opt.value
                          ? 'bg-primary text-white shadow-2xs'
                          : 'text-text-dark hover:bg-surface-high'
                      )}
                    >
                      <span>{opt.label}</span>
                      {searchRadiusMiles === opt.value && <Check size={13} className="shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Location Scope Indicator */}
        <div className="flex items-center justify-between px-1 text-[11px] text-text-medium">
          <div className="flex items-center gap-1.5 truncate">
            {searchLocation === 'All US Markets' ? (
              <span className="flex items-center gap-1 text-text-light">
                <Globe size={12} className="text-primary" />
                <span>National search across all 387 US metropolitan areas</span>
              </span>
            ) : (
              <span>
                📍 Filtered to <strong>{searchLocation}</strong> {searchRadiusMiles === 'metro' ? '(Entire Metro Area)' : `(+${searchRadiusMiles} mi radius)`}
                <button
                  type="button"
                  onClick={() => handleSelectLocation('All US Markets')}
                  className="ml-2 text-primary font-bold hover:underline cursor-pointer"
                >
                  Show All US Markets
                </button>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="text-primary font-bold hover:underline shrink-0 ml-2 cursor-pointer"
          >
            Change location →
          </button>
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-1 no-scrollbar pt-1"
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

      {/* Discovery & Search Status Banner */}
      <div className="px-6 mb-4">
        {searchQuery ? (
          <div className="p-3 bg-surface-low rounded-2xl border border-primary/20 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles size={16} className="text-primary shrink-0 animate-pulse" />
              <span className="text-text-medium truncate">
                Searching <strong>all sources</strong>: circles, community, dining &amp; live guides
                {hasCircleMatches && (
                  <strong className="text-primary font-bold ml-1.5">• Circle events prioritized</strong>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsCatalogOpen(true)}
              className="font-headline font-bold text-primary text-xs hover:underline shrink-0"
            >
              Full 50 Markets →
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsCatalogOpen(true)}
            className="w-full p-3.5 bg-gradient-to-r from-primary-fixed/50 via-surface-low to-secondary-container/40 rounded-2xl border border-primary/20 flex items-center justify-between gap-3 text-left hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Sparkles size={18} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-headline font-bold text-xs text-text-dark truncate">
                    Looking for outings, restaurants, or live shows?
                  </span>
                  <span className="badge bg-primary text-white text-[9px] uppercase font-bold tracking-wider shrink-0">
                    50 US Markets
                  </span>
                </div>
                <p className="text-[11px] text-text-medium mt-0.5 truncate">
                  Explore restaurants, art walks, tours, festivals &amp; arena events across 50 markets
                </p>
              </div>
            </div>
            <span className="text-xs font-headline font-bold text-primary shrink-0 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Browse All →
            </span>
          </button>
        )}
      </div>

      {/* Grid */}
      <ul className="grid gap-6 px-6 list-none grid-cols-1 md:grid-cols-2">
        {live.map(event => {
          const isPosted = event.kind === 'posted' && event.originalPostedEvent;
          const postedEvt = event.originalPostedEvent;

          const capacity = postedEvt ? capacityPct(postedEvt) : 0;
          const going = postedEvt ? confirmedCount(postedEvt) : 0;
          const full = postedEvt ? isFull(postedEvt) : false;
          const mine = postedEvt ? myRsvp(postedEvt) : null;
          const names = postedEvt ? goingNames(postedEvt) : [];

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
                    <span className="font-bold">
                      {event.distanceMi !== undefined ? formatDistance(event.distanceMi) : 'Nearby'}
                    </span>
                  </span>

                  <div className="absolute top-3.5 left-3.5 flex flex-col gap-1">
                    {event.hasCircleAttendeesGoing && (
                      <span className="badge bg-primary text-white flex items-center gap-1 font-headline font-black tracking-wider text-[9px] shadow-sm">
                        <Users size={10} /> CIRCLE GOING ({event.circleAttendeesGoing.length})
                      </span>
                    )}
                    {postedEvt && isFillingFast(postedEvt) && (
                      <span className="badge bg-error text-white flex items-center gap-1 font-black tracking-widest text-[9px]">
                        <Zap size={11} fill="currentColor" aria-hidden="true" /> FILLING FAST
                      </span>
                    )}
                    {full && (
                      <span className="badge bg-text-dark text-white font-black tracking-widest text-[9px]">
                        FULL
                      </span>
                    )}
                    {event.kind === 'live_catalog' && (
                      <span className="badge bg-primary-fixed text-primary-container font-headline font-black tracking-widest text-[9px] uppercase">
                        ⚡ LIVE GUIDE
                      </span>
                    )}
                    {event.eventSubType && (
                      <span className="badge bg-black/70 backdrop-blur-md text-white font-bold tracking-widest text-[9px] uppercase">
                        {event.eventSubType}
                      </span>
                    )}
                  </div>

                  {postedEvt && (
                    <StatusRing
                      capacity={capacity}
                      size={46}
                      strokeWidth={4}
                      variant="glass"
                      srLabel={`${going} of ${postedEvt.maxSpots} spots taken`}
                      className="absolute bottom-3 right-3.5 z-10"
                    />
                  )}
                </div>

                {/* Body */}
                <div className="px-8 pb-8 pt-6 flex flex-col gap-4 flex-1">
                  {/* Highlight when circle attendees are going */}
                  {event.hasCircleAttendeesGoing && (
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
                      <Users size={14} className="text-primary shrink-0" />
                      <span className="truncate">
                        In your circle: <strong>{event.circleAttendeesGoing.map(c => c.name).slice(0, 2).join(', ')}{event.circleAttendeesGoing.length > 2 ? ` +${event.circleAttendeesGoing.length - 2} more` : ''}</strong> going
                        {event.circleNamesSummary ? ` (${event.circleNamesSummary})` : ''}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center gap-3 text-xs font-bold">
                    <span
                      className={cx(
                        'px-2.5 py-1 rounded-md text-[10px] uppercase font-headline tracking-widest',
                        event.hasCircleAttendeesGoing || event.privacy === 'circle'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : event.kind === 'live_catalog'
                          ? 'bg-primary-fixed text-primary-container'
                          : 'bg-surface-high text-text-medium'
                      )}
                    >
                      {event.kind === 'live_catalog'
                        ? `LIVE • ${event.category}`
                        : postedEvt
                        ? eventKindLabel(postedEvt)
                        : 'COMMUNITY'}
                    </span>
                    <time
                      dateTime={event.startsAt}
                      className="text-text-dark font-headline font-extrabold opacity-85 text-right"
                    >
                      {event.startsAt ? formatWhen(event.startsAt) : (event.date || 'Upcoming')}
                    </time>
                  </div>

                  <div>
                    <h3 className="font-headline font-black text-2xl leading-[1.2] tracking-tight text-text-dark">
                      {isPosted ? (
                        <button
                          onClick={() => navigate(`/event/${event.id}`)}
                          className="text-left group-hover:text-primary transition-colors after:absolute after:inset-0 after:content-['']"
                        >
                          {event.title}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (event.originalCatalogEvent) {
                              navigate('/post', { state: { prefillEvent: event.originalCatalogEvent } });
                            }
                          }}
                          className="text-left group-hover:text-primary transition-colors"
                        >
                          {event.title}
                        </button>
                      )}
                    </h3>

                    {event.performerOrTeam && (
                      <div className="text-xs font-headline font-bold text-primary mt-1">
                        ⭐ {event.performerOrTeam}
                      </div>
                    )}

                    {event.showtime ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-primary mt-1">
                        <Clock size={12} />
                        <span>
                          {event.meetupTime ? `Meet ${event.meetupTime} • ` : ''}
                          {event.category === 'Dining' ? 'Table:' : 'Show/Start:'} {event.showtime}
                        </span>
                      </div>
                    ) : null}

                    <div className="flex items-center gap-1.5 text-xs text-text-medium mt-1">
                      <MapPin size={12} className="text-primary shrink-0" aria-hidden="true" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>

                    <p className="text-sm text-text-medium leading-relaxed mt-2 line-clamp-2">
                      {event.description}
                    </p>

                    {(event.ticketSectionInfo || event.priceRange) && (
                      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                        {event.ticketSectionInfo && (
                          <span className="badge bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                            🎟️ {event.ticketSectionInfo}
                          </span>
                        )}
                        {event.priceRange && (
                          <span className="badge bg-surface-high text-text-dark text-[10px] font-bold">
                            💰 {event.priceRange}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex justify-between items-center gap-3 mt-auto pt-5">
                    {isPosted ? (
                      <>
                        {names.length > 0 ? (
                          <span className="flex items-center gap-2">
                            <AvatarGroup names={names} size={30} max={3} label={`${going} going`} />
                            <span className="text-xs font-semibold text-text-medium">{going} going</span>
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-text-light uppercase tracking-wider">
                            {going} going • {event.interested || 0} interested
                          </span>
                        )}

                        <span className="flex items-center gap-2 relative z-10">
                          {mine === 'going' && (
                            <span className="flex items-center gap-1.5 text-secondary font-headline font-bold text-sm bg-secondary-container px-3 py-1.5 rounded-full">
                              <CheckCircle2 size={16} aria-hidden="true" /> Going
                            </span>
                          )}
                          {mine === 'waitlist' && postedEvt && (
                            <span className="badge bg-primary-fixed text-primary-container font-bold text-xs flex items-center gap-1.5">
                              <Clock size={13} aria-hidden="true" /> Waitlisted #{waitlistCount(postedEvt)}
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
                      </>
                    ) : (
                      /* Live Catalog Card Actions */
                      <div className="w-full flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-text-medium flex items-center gap-1">
                          <Sparkles size={13} className="text-primary" /> Live Guide Outing
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickRsvpCatalogEvent(event)}
                            className="btn btn-outline py-1.5 px-3 text-xs font-bold"
                          >
                            Quick RSVP
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickHostCatalogEvent(event)}
                            className="btn btn-primary py-1.5 px-3.5 text-xs font-headline font-bold flex items-center gap-1 shadow-xs"
                          >
                            <Sparkles size={12} /> Who's Up for This?
                          </button>
                        </div>
                      </div>
                    )}
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
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => {
                setActiveCategory('All Events');
                setSearchQuery('');
              }}
              className="btn btn-outline"
            >
              Clear filters
            </button>
            <button
              onClick={() => setIsCatalogOpen(true)}
              className="btn btn-primary flex items-center gap-1.5"
            >
              <Sparkles size={14} /> Browse 50-Market Catalog
            </button>
          </div>
        </div>
      )}

      <LiveEventCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelectEvent={event => {
          setIsCatalogOpen(false);
          navigate('/post', { state: { prefillEvent: event } });
        }}
      />

      <SearchLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={searchLocation}
        onSelectLocation={handleSelectLocation}
        userHomeCity={user?.homeCity}
      />
    </div>
  );
}
