import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Link as LinkIcon,
  Minus,
  Plus,
  Search,
  Globe,
  Lock,
  EyeOff,
  Image as ImageIcon,
  Rocket,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  Ticket,
} from 'lucide-react';
import cx from 'classnames';
import { useApp } from '../hooks/useApp';
import { useToast } from '../hooks/useToast';
import { SELECTABLE_CATEGORIES, type EventCategory } from '../lib/categories';
import { GAMES, JOIN_LABEL, MODE_LABEL, findGame, needsStartTime } from '../lib/games';
import { GameMark, GameModeChip, PlatformList } from '../components/GameBadge';
import { StatusRing } from '../components/StatusRing';
import { FloatingBar } from '../components/FloatingBar';
import { formatWhen } from '../lib/datetime';
import { 
  searchAutoPullEvents, 
  parseEventUrlOrText, 
  type AutoPullEvent,
  type EventSubType,
} from '../services/eventAutoPull';

const COVER_OPTIONS = [
  { id: 'neon', label: 'Neon midnight', url: '/neon_midnight_1774367472687.png' },
  { id: 'vanguard', label: 'Rooftop lounge', url: '/vanguard_social_1774367422848.png' },
  { id: 'trail', label: 'Mountain trail', url: '/morning_ridge_1774367438744.png' },
  { id: 'vinyl', label: 'Vinyl session', url: '/vinyl_set_1774367456136.png' },
  { id: 'lab', label: 'Studio lab', url: '/curator_lab.svg' },
  { id: 'riso', label: 'Print lab', url: '/print_lab.svg' },
  { id: 'river', label: 'Riverside', url: '/riverside_cleanup.svg' },
  { id: 'studio', label: 'Warm studio', url: '/studio_session.svg' },
];

const STEP_TITLES = ['The basics', 'When & where', 'Logistics & privacy'] as const;

/** Tomorrow at 8pm, in the format the native date/time inputs want. */
function defaultDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export default function PostEvent() {
  const navigate = useNavigate();
  const { createEvent, circles } = useApp();
  const toast = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Auto-Pull & Ticketed Event State
  const [autoSearchQuery, setAutoSearchQuery] = useState('');
  const [autoSuggestions, setAutoSuggestions] = useState<AutoPullEvent[]>([]);
  const [isTicketedEvent, setIsTicketedEvent] = useState(false);
  const [eventSubType, setEventSubType] = useState<EventSubType | undefined>();
  const [performerOrTeam, setPerformerOrTeam] = useState('');
  const [showtime, setShowtime] = useState('8:00 PM');
  const [doorsTime, setDoorsTime] = useState('6:30 PM');
  const [meetupTime, setMeetupTime] = useState('5:30 PM');
  const [meetupLocation, setMeetupLocation] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const [ticketSectionInfo, setTicketSectionInfo] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [bagPolicy, setBagPolicy] = useState('');
  const [ageRestriction, setAgeRestriction] = useState('');
  const [lineup, setLineup] = useState<string[]>([]);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [pulledImagePresets, setPulledImagePresets] = useState<string[]>([]);

  // Step 1
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('Active');
  const [coverImage, setCoverImage] = useState(COVER_OPTIONS[0].url);
  const [vibe, setVibe] = useState('');
  const [gameId, setGameId] = useState('');

  // Step 2
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('20:00');
  const [locationType, setLocationType] = useState<'physical' | 'virtual'>('physical');
  const [location, setLocation] = useState('');
  const [exactAddress, setExactAddress] = useState('');
  const [virtualLink, setVirtualLink] = useState('');

  // Step 3
  const [capacity, setCapacity] = useState(12);
  const [autoWaitlist, setAutoWaitlist] = useState(true);
  const [privacy, setPrivacy] = useState<'public' | 'circle' | 'hidden'>('public');
  const [circleId, setCircleId] = useState<string>('');
  const [roomCode, setRoomCode] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');

  const joinedCircles = circles.filter(c => c.isJoined);
  const isOnline = category === 'Online/Play';
  const game = findGame(gameId);
  /** An online game is played in the game, so there is no venue to collect. */
  const skipVenue = Boolean(game);
  const startsAt = useMemo(() => new Date(`${date}T${time}`).toISOString(), [date, time]);
  const validStart = !Number.isNaN(new Date(`${date}T${time}`).getTime());

  const stepErrors: Record<number, string | null> = {
    1: !title.trim()
      ? 'Give the event a name first.'
      : isOnline && !gameId
        ? 'Pick which game you are playing.'
        : null,
    2: !validStart
      ? 'Pick a date and a start time.'
      : skipVenue
        ? null
        : locationType === 'physical'
          ? location.trim()
            ? null
            : 'Say where it is happening.'
          : virtualLink.trim()
            ? null
            : 'Paste the room link.',
    3: privacy === 'circle' && !circleId ? 'Choose which circle can see it.' : null,
  };

  const goNext = () => {
    if (stepErrors[step]) {
      toast.show(stepErrors[step]!, 'warning');
      return;
    }
    setStep(s => (s + 1) as 1 | 2 | 3);
  };

  const handleAutoSearchChange = (q: string) => {
    setAutoSearchQuery(q);
    if (!q.trim()) {
      setAutoSuggestions([]);
      return;
    }
    const results = searchAutoPullEvents(q);
    setAutoSuggestions(results);
  };

  const handleSelectAutoEvent = (autoEvt: AutoPullEvent) => {
    setTitle(autoEvt.title);
    setCategory('Entertainment');
    setIsTicketedEvent(true);
    setEventSubType(autoEvt.eventSubType);
    setPerformerOrTeam(autoEvt.performerOrTeam);
    setLocation(autoEvt.venue);
    setVenueAddress(autoEvt.venueAddress || '');
    setShowtime(autoEvt.showtime);
    setDoorsTime(autoEvt.doorsTime || '');
    setMeetupTime(autoEvt.suggestedMeetupTime || '5:30 PM');
    setMeetupLocation(autoEvt.suggestedMeetupLocation || '');
    setTicketUrl(autoEvt.ticketUrl || '');
    setTicketSectionInfo(autoEvt.ticketSectionInfo || '');
    setPriceRange(autoEvt.priceRange || '');
    setBagPolicy(autoEvt.bagPolicy || '');
    setAgeRestriction(autoEvt.ageRestriction || 'All Ages');
    setLineup(autoEvt.lineup || []);
    setVibe(autoEvt.description);
    setCoverImage(autoEvt.image);
    setPulledImagePresets([autoEvt.image, ...(autoEvt.additionalImages || [])]);
    setAutoSearchQuery('');
    setAutoSuggestions([]);
    toast.show(`Auto-pulled details for ${autoEvt.title}!`, 'info');
  };

  const handleParseUrl = (input: string) => {
    const parsed = parseEventUrlOrText(input);
    if (parsed) {
      handleSelectAutoEvent(parsed);
    } else {
      toast.show('Could not automatically parse details from that link/text.', 'warning');
    }
  };

  const handleCreate = () => {
    for (const s of [1, 2, 3] as const) {
      if (stepErrors[s]) {
        setStep(s);
        toast.show(stepErrors[s]!, 'warning');
        return;
      }
    }

    const created = createEvent({
      title,
      category,
      image: coverImage,
      vibe,
      startsAt,
      location: game
        ? `Online — ${game.name}`
        : locationType === 'physical'
          ? location.trim()
          : 'Online — link shared on RSVP',
      exactAddress:
        !game && locationType === 'physical' ? exactAddress.trim() || undefined : undefined,
      venueAddress: venueAddress.trim() || undefined,
      isVirtual: Boolean(game) || locationType === 'virtual',
      virtualLink: game ? game.url : locationType === 'virtual' ? virtualLink.trim() : undefined,
      game: game
        ? {
            gameId: game.id,
            roomCode: roomCode.trim() || undefined,
            inviteUrl: inviteUrl.trim() || undefined,
          }
        : undefined,
      isTicketedEvent,
      eventSubType,
      performerOrTeam: performerOrTeam.trim() || undefined,
      showtime: isTicketedEvent ? showtime : undefined,
      doorsTime: isTicketedEvent ? doorsTime : undefined,
      meetupTime: isTicketedEvent ? meetupTime : undefined,
      meetupLocation: isTicketedEvent ? meetupLocation.trim() || undefined : undefined,
      ticketUrl: ticketUrl.trim() || undefined,
      ticketSectionInfo: ticketSectionInfo.trim() || undefined,
      priceRange: priceRange.trim() || undefined,
      lineup: lineup.length > 0 ? lineup : undefined,
      bagPolicy: bagPolicy.trim() || undefined,
      ageRestriction: ageRestriction.trim() || undefined,
      maxSpots: capacity,
      autoWaitlist,
      privacy,
      circleId: privacy === 'circle' ? circleId : undefined,
    });

    toast.show('Your event is live');
    navigate(`/event/${created.id}`);
  };

  return (
    <div className="flex flex-col pb-40 px-6 pt-2 bg-surface min-h-screen animate-fade-in max-w-5xl mx-auto w-full">
      {/* Step indicator */}
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex justify-between items-center gap-3 text-xs font-headline font-bold text-primary tracking-widest uppercase">
          <span>Step {step} of 3</span>
          <span className="text-text-medium">{STEP_TITLES[step - 1]}</span>
        </div>
        <div
          className="w-full bg-surface-high h-2 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-label="Creation progress"
        >
          <div
            className="bg-primary h-full transition-[width] duration-300 rounded-full"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 @2xl:grid-cols-12 gap-8">
        {/* Form */}
        <form
          className="@2xl:col-span-7 flex flex-col gap-6"
          onSubmit={e => {
            e.preventDefault();
            if (step < 3) goNext();
            else handleCreate();
          }}
        >
          {step === 1 && (
            <div className="flex flex-col gap-6 animate-slide-up">
              <div>
                <h1 className="font-headline font-extrabold text-2xl text-text-dark">
                  What's the vibe?
                </h1>
                <p className="text-sm text-text-medium mt-1">
                  A punchy name and the right category do most of the work.
                </p>
              </div>

              {/* Auto-Pull Box */}
              <div className="p-4 bg-gradient-to-br from-primary-fixed/40 via-surface-low to-secondary-container/30 border border-primary/25 rounded-3xl relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-headline font-black text-primary uppercase tracking-wider">
                    <Sparkles size={15} />
                    <span>Auto-Pull Live Event Details</span>
                  </div>
                  <span className="badge bg-primary text-white font-bold text-[9px] uppercase tracking-widest">
                    Live Catalog
                  </span>
                </div>
                <p className="text-xs text-text-medium mb-3">
                  Search concerts, sports, comedy, festivals, or paste a Ticketmaster / SeatGeek / AXS URL.
                </p>

                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" size={16} />
                  <input
                    type="text"
                    placeholder="Search artist, team, tour, or paste ticket link..."
                    value={autoSearchQuery}
                    onChange={e => handleAutoSearchChange(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (autoSearchQuery.startsWith('http')) {
                          handleParseUrl(autoSearchQuery);
                        } else if (autoSuggestions.length > 0) {
                          handleSelectAutoEvent(autoSuggestions[0]);
                        }
                      }
                    }}
                    className="input-field pl-10 pr-20 py-2.5 text-xs bg-surface-lowest shadow-sm rounded-xl font-medium"
                  />
                  {autoSearchQuery.startsWith('http') && (
                    <button
                      type="button"
                      onClick={() => handleParseUrl(autoSearchQuery)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-primary text-white text-[11px] font-bold"
                    >
                      Parse URL
                    </button>
                  )}
                </div>

                {/* Auto Suggestions Dropdown */}
                {autoSuggestions.length > 0 && (
                  <div className="mt-2 bg-surface-lowest rounded-2xl shadow-xl border border-gray-100 overflow-hidden divide-y divide-gray-100 animate-slide-up z-20">
                    {autoSuggestions.map(evt => (
                      <button
                        key={evt.id}
                        type="button"
                        onClick={() => handleSelectAutoEvent(evt)}
                        className="w-full p-3 flex items-center gap-3 text-left hover:bg-surface-low transition-colors cursor-pointer"
                      >
                        <img
                          src={evt.image}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="badge bg-secondary-container text-on-secondary-container text-[9px] font-bold uppercase">
                              {evt.eventSubType}
                            </span>
                            <span className="font-headline font-bold text-xs text-text-dark truncate">
                              {evt.title}
                            </span>
                          </div>
                          <div className="text-[11px] text-text-medium mt-0.5 truncate">
                            📍 {evt.venue} • ⚡ Show: {evt.showtime}
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-primary shrink-0">
                          1-Click Fill →
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="ev-title" className="text-xs font-bold text-text-dark mb-1.5 block">
                  Event title
                </label>
                <input
                  id="ev-title"
                  type="text"
                  required
                  placeholder="e.g. Midnight Padel Tournament"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="input-field font-headline font-bold text-lg"
                  autoFocus
                />
              </div>

              {/* Event Subtype & Performer / Matchup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-text-dark mb-1.5 block">
                    EVENT TYPE / SUBTYPE
                  </label>
                  <select
                    value={eventSubType || ''}
                    onChange={e => {
                      const val = e.target.value as EventSubType | '';
                      setEventSubType(val || undefined);
                      if (val) setIsTicketedEvent(true);
                    }}
                    className="input-field text-xs font-bold"
                  >
                    <option value="">General Gathering</option>
                    <option value="Concert">Concert / Live Music</option>
                    <option value="Sports">Sports Match / Game</option>
                    <option value="Comedy">Comedy Show</option>
                    <option value="Theater">Theater / Arts</option>
                    <option value="Festival">Music / Food Festival</option>
                    <option value="Other">Other Ticketed Event</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-dark mb-1.5 block">
                    PERFORMER / TEAMS / HEADLINER
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Billie Eilish, Austin FC vs LA Galaxy"
                    value={performerOrTeam}
                    onChange={e => {
                      setPerformerOrTeam(e.target.value);
                      if (e.target.value) setIsTicketedEvent(true);
                    }}
                    className="input-field text-xs font-bold"
                  />
                </div>
              </div>

              <fieldset className="border-0 p-0 m-0">
                <legend className="text-xs font-bold text-text-dark mb-2">Category</legend>
                <div className="flex flex-wrap gap-2">
                  {SELECTABLE_CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const selected = category === cat.label;
                    return (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => setCategory(cat.label)}
                        aria-pressed={selected}
                        title={cat.desc}
                        className={cx(
                          'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95',
                          selected
                            ? 'bg-primary text-white shadow-md shadow-primary/30'
                            : 'bg-surface-low text-text-medium hover:bg-surface-high'
                        )}
                      >
                        <Icon size={14} aria-hidden="true" />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {isOnline && (
                <fieldset className="border-0 p-0 m-0 animate-slide-up">
                  <legend className="text-xs font-bold text-text-dark mb-1">Which game?</legend>
                  <p className="text-[11px] text-text-light mb-2">
                    Daily and turn-based games do not need everyone free at the same time.
                  </p>
                  <div className="grid grid-cols-1 @xl:grid-cols-2 gap-2">
                    {GAMES.map(g => {
                      const selected = gameId === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setGameId(selected ? '' : g.id)}
                          aria-pressed={selected}
                          className={cx(
                            'p-3 rounded-2xl flex items-start gap-3 text-left transition-all',
                            selected
                              ? 'bg-primary-fixed ring-2 ring-primary'
                              : 'bg-surface-low hover:bg-surface-high'
                          )}
                        >
                          <GameMark game={g} size={36} />
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-headline font-bold text-xs text-text-dark">
                                {g.name}
                              </span>
                              <GameModeChip label={MODE_LABEL[g.mode]} />
                            </span>
                            <span className="block text-[11px] text-text-medium mt-0.5 line-clamp-2">
                              {g.blurb}
                            </span>
                            <PlatformList game={g} className="mt-1" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              <fieldset className="border-0 p-0 m-0">
                <legend className="text-xs font-bold text-text-dark mb-2">Cover Artwork</legend>

                {pulledImagePresets.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[11px] font-bold text-primary block mb-1.5">
                      🌟 Official Tour &amp; Performer Posters:
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {pulledImagePresets.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCoverImage(imgUrl)}
                          className={cx(
                            'relative rounded-xl overflow-hidden aspect-[4/3] transition-all cursor-pointer',
                            coverImage === imgUrl
                              ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface scale-[1.02]'
                              : 'opacity-75 hover:opacity-100'
                          )}
                        >
                          <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                          {coverImage === imgUrl && (
                            <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                              <Check size={12} aria-hidden="true" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <span className="text-[11px] font-bold text-text-light block mb-1.5">
                  Or pick a curated style:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {COVER_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCoverImage(opt.url)}
                      aria-pressed={coverImage === opt.url}
                      aria-label={opt.label}
                      className={cx(
                        'relative rounded-xl overflow-hidden aspect-[4/3] transition-all',
                        coverImage === opt.url
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface'
                          : 'opacity-75 hover:opacity-100'
                      )}
                    >
                      <img
                        src={opt.url}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {coverImage === opt.url && (
                        <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                          <Check size={12} aria-hidden="true" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="Or paste a custom image URL..."
                    value={customImageUrl}
                    onChange={e => {
                      setCustomImageUrl(e.target.value);
                      if (e.target.value.startsWith('http')) setCoverImage(e.target.value);
                    }}
                    className="input-field text-xs py-2"
                  />
                  {customImageUrl && (
                    <button
                      type="button"
                      onClick={() => setCoverImage(customImageUrl)}
                      className="btn btn-outline text-xs py-2 px-3 shrink-0"
                    >
                      Apply
                    </button>
                  )}
                </div>
              </fieldset>

              <div>
                <label htmlFor="ev-vibe" className="text-xs font-bold text-text-dark mb-1.5 block">
                  The vibe & details
                </label>
                <textarea
                  id="ev-vibe"
                  rows={3}
                  placeholder="What should guests expect? Dress code, what to bring, how it ends."
                  value={vibe}
                  onChange={e => setVibe(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6 animate-slide-up">
              <div>
                <h1 className="font-headline font-extrabold text-2xl text-text-dark">
                  When &amp; where?
                </h1>
                <p className="text-sm text-text-medium mt-1">
                  Guests see the neighbourhood right away; the street address unlocks when they say
                  yes.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ev-date" className="text-xs font-bold text-text-dark mb-1.5 block">
                    Date
                  </label>
                  <div className="flex items-center bg-surface-low rounded-xl px-3 gap-2 focus-within:bg-surface-lowest transition-colors">
                    <Calendar size={18} className="text-primary shrink-0" aria-hidden="true" />
                    <input
                      id="ev-date"
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="bg-transparent border-none outline-none font-bold text-sm text-text-dark w-full py-2.5"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="ev-time" className="text-xs font-bold text-text-dark mb-1.5 block">
                    Start time
                  </label>
                  <div className="flex items-center bg-surface-low rounded-xl px-3 gap-2 focus-within:bg-surface-lowest transition-colors">
                    <Clock size={18} className="text-primary shrink-0" aria-hidden="true" />
                    <input
                      id="ev-time"
                      type="time"
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      className="bg-transparent border-none outline-none font-bold text-sm text-text-dark w-full py-2.5"
                    />
                  </div>
                </div>
              </div>

              {/* Dual-Time Coordination Matrix */}
              {(isTicketedEvent || eventSubType) && (
                <div className="p-4 bg-surface-low rounded-3xl border border-primary/20 flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-headline font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                      <Clock size={14} /> Dual-Time Outing Schedule
                    </span>
                    <span className="badge bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                      Meetup vs. Showtime
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Host Meetup Time */}
                    <div className="p-3 bg-surface-lowest rounded-2xl shadow-xs border border-primary/20">
                      <span className="text-[10px] font-headline font-bold text-primary uppercase tracking-wider block mb-1">
                        1. HOST MEETUP TIME *
                      </span>
                      <input
                        type="text"
                        value={meetupTime}
                        onChange={e => setMeetupTime(e.target.value)}
                        placeholder="e.g. 5:30 PM"
                        className="font-headline font-black text-base text-primary bg-transparent border-none outline-none w-full"
                      />
                      <div className="text-[10px] text-text-light mt-0.5">When your group meets</div>
                    </div>

                    {/* Venue Doors Open */}
                    <div className="p-3 bg-surface-lowest rounded-2xl shadow-xs border border-gray-100">
                      <span className="text-[10px] font-headline font-bold text-text-medium uppercase tracking-wider block mb-1">
                        2. DOORS OPEN
                      </span>
                      <input
                        type="text"
                        value={doorsTime}
                        onChange={e => setDoorsTime(e.target.value)}
                        placeholder="e.g. 6:30 PM"
                        className="font-headline font-black text-base text-text-dark bg-transparent border-none outline-none w-full"
                      />
                      <div className="text-[10px] text-text-light mt-0.5">Venue gates unlock</div>
                    </div>

                    {/* Official Showtime */}
                    <div className="p-3 bg-surface-lowest rounded-2xl shadow-xs border border-gray-100">
                      <span className="text-[10px] font-headline font-bold text-secondary uppercase tracking-wider block mb-1">
                        3. OFFICIAL SHOWTIME
                      </span>
                      <input
                        type="text"
                        value={showtime}
                        onChange={e => setShowtime(e.target.value)}
                        placeholder="e.g. 8:00 PM"
                        className="font-headline font-black text-base text-secondary bg-transparent border-none outline-none w-full"
                      />
                      <div className="text-[10px] text-text-light mt-0.5">Main act on stage</div>
                    </div>
                  </div>

                  {/* Quick Meetup Offset Buttons */}
                  <div>
                    <span className="text-[11px] font-bold text-text-medium block mb-1.5">
                      Quick adjust meetup time relative to {showtime || 'showtime'}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMeetupTime('5:00 PM')}
                        className="px-2.5 py-1 rounded-lg bg-surface-lowest hover:bg-primary hover:text-white text-xs font-bold text-text-medium transition-colors shadow-2xs cursor-pointer"
                      >
                        🍺 -2.5h (Dinner / Tailgate)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMeetupTime('5:30 PM')}
                        className="px-2.5 py-1 rounded-lg bg-surface-lowest hover:bg-primary hover:text-white text-xs font-bold text-text-medium transition-colors shadow-2xs cursor-pointer"
                      >
                        🍻 -1.5h (Pre-Drinks)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMeetupTime(doorsTime || '6:30 PM')}
                        className="px-2.5 py-1 rounded-lg bg-surface-lowest hover:bg-primary hover:text-white text-xs font-bold text-text-medium transition-colors shadow-2xs cursor-pointer"
                      >
                        🚪 At Doors Open
                      </button>
                      <button
                        type="button"
                        onClick={() => setMeetupTime(showtime)}
                        className="px-2.5 py-1 rounded-lg bg-surface-lowest hover:bg-primary hover:text-white text-xs font-bold text-text-medium transition-colors shadow-2xs cursor-pointer"
                      >
                        ⚡ Directly at Showtime
                      </button>
                    </div>
                  </div>

                  {/* Pre-Event Gathering Spot */}
                  <div>
                    <label className="text-xs font-bold text-text-dark mb-1.5 block">
                      PRE-EVENT GATHERING SPOT (BEFORE ENTERING VENUE)
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" size={16} />
                      <input
                        type="text"
                        placeholder="e.g. Scholz Garten across the street, Gate 3, or Lot B Tailgate"
                        value={meetupLocation}
                        onChange={e => setMeetupLocation(e.target.value)}
                        className="input-field pl-10 text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {skipVenue && game ? (
                <div className="p-4 bg-surface-low rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <GameMark game={game} size={40} />
                    <div className="min-w-0">
                      <p className="font-headline font-bold text-sm text-text-dark">{game.name}</p>
                      <p className="text-xs text-text-medium">{JOIN_LABEL[game.joinBy]}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-text-light">
                    {needsStartTime(game)
                      ? 'Everyone plays at once, so the time above is the one that matters.'
                      : 'No fixed start — the time above is just when you are kicking it off.'}
                  </p>
                </div>
              ) : (
                <>
              <fieldset className="border-0 p-0 m-0">
                <legend className="text-xs font-bold text-text-dark mb-1.5">Location type</legend>
                <div className="flex bg-surface-low p-1 rounded-xl gap-1">
                  {(
                    [
                      ['physical', 'Physical venue', MapPin],
                      ['virtual', 'Virtual / link', LinkIcon],
                    ] as const
                  ).map(([key, label, Icon]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setLocationType(key)}
                      aria-pressed={locationType === key}
                      className={cx(
                        'flex-1 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all',
                        {
                          'bg-surface-lowest shadow-sm text-primary': locationType === key,
                          'text-text-medium hover:text-text-dark': locationType !== key,
                        }
                      )}
                    >
                      <Icon size={15} aria-hidden="true" /> {label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {locationType === 'physical' ? (
                <>
                  <div>
                    <label htmlFor="ev-venue" className="text-xs font-bold text-text-dark mb-1.5 block">
                      Venue or neighbourhood
                    </label>
                    <div className="relative">
                      <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light pointer-events-none"
                        size={18}
                        aria-hidden="true"
                      />
                      <input
                        id="ev-venue"
                        type="text"
                        placeholder="The Glass House Rooftop, Austin"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="input-field pl-11 text-sm"
                      />
                    </div>
                    <p className="text-[11px] text-text-light mt-1.5">
                      Everyone can see this, including people who have not RSVP'd.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="ev-address"
                      className="text-xs font-bold text-text-dark mb-1.5 block"
                    >
                      Exact address (optional)
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light pointer-events-none"
                        size={16}
                        aria-hidden="true"
                      />
                      <input
                        id="ev-address"
                        type="text"
                        placeholder="1401 Rainey St, Rooftop Level"
                        value={exactAddress}
                        onChange={e => setExactAddress(e.target.value)}
                        className="input-field pl-11 text-sm"
                      />
                    </div>
                    <p className="text-[11px] text-text-light mt-1.5">
                      Only shown to confirmed guests. Use it if you are hosting from home.
                    </p>
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="ev-link" className="text-xs font-bold text-text-dark mb-1.5 block">
                    Room link
                  </label>
                  <div className="relative">
                    <LinkIcon
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light pointer-events-none"
                      size={18}
                      aria-hidden="true"
                    />
                    <input
                      id="ev-link"
                      type="url"
                      placeholder="https://meet.google.com/…"
                      value={virtualLink}
                      onChange={e => setVirtualLink(e.target.value)}
                      className="input-field pl-11 text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-text-light mt-1.5">
                    Revealed only to guests who RSVP yes.
                  </p>
                </div>
              )}
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6 animate-slide-up">
              <div>
                <h1 className="font-headline font-extrabold text-2xl text-text-dark">
                  Logistics &amp; privacy
                </h1>
                <p className="text-sm text-text-medium mt-1">
                  How many people, and who gets to see it.
                </p>
              </div>

              {/* Ticket & Seating Coordination Card */}
              {(isTicketedEvent || eventSubType) && (
                <div className="p-4 bg-surface-low rounded-3xl border border-primary/20 flex flex-col gap-3.5 animate-slide-up">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-headline font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                      <Ticket size={14} /> Tickets &amp; Seating Coordination
                    </span>
                    <span className="badge bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                      Group Seating
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-text-dark mb-1 block">
                        OFFICIAL TICKET PURCHASE LINK
                      </label>
                      <input
                        type="url"
                        placeholder="https://ticketmaster.com/event/..."
                        value={ticketUrl}
                        onChange={e => setTicketUrl(e.target.value)}
                        className="input-field text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-text-dark mb-1 block">
                        TARGET SEATING SECTION
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Section 114 Rows 12-16 (or GA Floor)"
                        value={ticketSectionInfo}
                        onChange={e => setTicketSectionInfo(e.target.value)}
                        className="input-field text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-text-dark mb-1 block">
                        PRICE RANGE
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. $65 - $185"
                        value={priceRange}
                        onChange={e => setPriceRange(e.target.value)}
                        className="input-field text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-text-dark mb-1 block">
                        BAG POLICY
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Clear bags only (12x6x12)"
                        value={bagPolicy}
                        onChange={e => setBagPolicy(e.target.value)}
                        className="input-field text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-text-dark mb-1 block">
                        AGE RESTRICTION
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. All Ages, 18+, or 21+"
                        value={ageRestriction}
                        onChange={e => setAgeRestriction(e.target.value)}
                        className="input-field text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-5 bg-surface-low rounded-2xl flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-headline font-bold text-base text-text-dark">
                    Maximum capacity
                  </h2>
                  <p className="text-xs text-text-medium">How many people can hold a spot</p>
                </div>
                <div className="flex items-center gap-3 bg-surface-lowest rounded-xl p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setCapacity(c => Math.max(2, c - 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-primary hover:bg-surface-low"
                    aria-label="One fewer spot"
                  >
                    <Minus size={16} strokeWidth={3} aria-hidden="true" />
                  </button>
                  <output className="font-headline font-black text-lg w-10 text-center tabular-nums">
                    {capacity}
                  </output>
                  <button
                    type="button"
                    onClick={() => setCapacity(c => Math.min(500, c + 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-primary hover:bg-surface-low"
                    aria-label="One more spot"
                  >
                    <Plus size={16} strokeWidth={3} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 p-4 bg-surface-low rounded-2xl">
                <div className="flex gap-3 items-center min-w-0">
                  <span className="w-10 h-10 bg-primary-fixed rounded-xl flex items-center justify-center text-primary-container shrink-0">
                    <Clock size={20} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <label
                      htmlFor="ev-waitlist"
                      className="font-headline font-bold text-sm text-text-dark block"
                    >
                      Auto-waitlist
                    </label>
                    <p className="text-xs text-text-medium">
                      When someone drops out, the next person in line takes the spot.
                    </p>
                  </div>
                </div>
                <button
                  id="ev-waitlist"
                  type="button"
                  role="switch"
                  aria-checked={autoWaitlist}
                  onClick={() => setAutoWaitlist(v => !v)}
                  className={cx(
                    'relative w-12 h-7 rounded-full shrink-0 transition-colors',
                    autoWaitlist ? 'bg-primary' : 'bg-surface-highest'
                  )}
                >
                  <span
                    className={cx(
                      'absolute top-1 w-5 h-5 rounded-full bg-surface-lowest shadow-sm transition-[left]',
                      autoWaitlist ? 'left-6' : 'left-1'
                    )}
                    aria-hidden="true"
                  />
                </button>
              </div>

              {game && (game.joinBy === 'roomCode' || game.joinBy === 'link') && (
                <div className="flex flex-col gap-3 animate-slide-up">
                  {game.joinBy === 'roomCode' ? (
                    <div>
                      <label htmlFor="ev-room" className="text-xs font-bold text-text-dark mb-1.5 block">
                        Room code (optional)
                      </label>
                      <input
                        id="ev-room"
                        type="text"
                        value={roomCode}
                        onChange={e => setRoomCode(e.target.value.toUpperCase())}
                        placeholder="WXYZ"
                        maxLength={8}
                        className="input-field text-sm font-mono uppercase"
                      />
                      <p className="text-[11px] text-text-light mt-1.5">
                        Add it now or later — guests see it on the event page.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="ev-invite" className="text-xs font-bold text-text-dark mb-1.5 block">
                        Party link (optional)
                      </label>
                      <input
                        id="ev-invite"
                        type="url"
                        value={inviteUrl}
                        onChange={e => setInviteUrl(e.target.value)}
                        placeholder="https://..."
                        className="input-field text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              <fieldset className="border-0 p-0 m-0">
                <legend className="text-xs font-bold text-text-dark mb-2">Who can see it</legend>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ['public', 'Public', 'Anyone nearby', Globe],
                      ['circle', 'Circle only', 'One of your circles', Lock],
                      ['hidden', 'Hidden', 'Invite link only', EyeOff],
                    ] as const
                  ).map(([key, label, hint, Icon]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPrivacy(key)}
                      aria-pressed={privacy === key}
                      className={cx(
                        'p-4 rounded-2xl flex flex-col items-center gap-2 text-center transition-all',
                        {
                          'bg-primary text-white shadow-md': privacy === key,
                          'bg-surface-low text-text-medium hover:bg-surface-high': privacy !== key,
                        }
                      )}
                    >
                      <Icon size={22} aria-hidden="true" />
                      <span>
                        <span className="block font-bold text-xs">{label}</span>
                        <span className="block text-[10px] opacity-80 mt-0.5">{hint}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>

              {privacy === 'circle' && (
                <div className="animate-slide-up">
                  <label htmlFor="ev-circle" className="text-xs font-bold text-text-dark mb-1.5 block">
                    Which circle?
                  </label>
                  <select
                    id="ev-circle"
                    value={circleId}
                    onChange={e => setCircleId(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="">Choose a circle…</option>
                    {joinedCircles.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Live preview */}
        <aside className="@2xl:col-span-5 flex flex-col gap-3">
          <p className="text-xs font-headline font-bold text-text-light uppercase tracking-wider flex items-center gap-1.5">
            <ImageIcon size={14} className="text-primary" aria-hidden="true" /> Live preview
          </p>

          <div className="card p-0 overflow-hidden @2xl:sticky @2xl:top-24">
            <div className="relative h-48 bg-text-dark">
              <img
                src={coverImage}
                alt=""
                className="w-full h-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-text-dark/90 via-text-dark/20 to-transparent" />

              <StatusRing
                capacity={Math.round((1 / capacity) * 100)}
                size={54}
                strokeWidth={5}
                label={`1/${capacity}`}
                srLabel={`1 of ${capacity} spots taken`}
                variant="glass"
                className="absolute -bottom-5 right-5 z-10"
              />

              <div className="absolute bottom-3 left-4 right-20 text-white">
                <span className="badge bg-white/20 backdrop-blur-md text-[9px] uppercase font-bold text-white mb-1.5 py-0.5 px-2">
                  {privacy === 'public'
                    ? 'Public event'
                    : privacy === 'circle'
                      ? 'Circle only'
                      : 'Invite link only'}
                </span>
                <p className="font-headline font-black text-lg leading-tight text-white line-clamp-2">
                  {title || 'Your event name'}
                </p>
              </div>
            </div>

            <div className="p-5 pt-7 flex flex-col gap-3">
              <div className="flex justify-between items-center gap-2 text-xs font-bold text-text-medium">
                <span className="badge bg-secondary-container text-on-secondary-container text-[10px]">
                  {category}
                </span>
                <span className="text-right">
                  {validStart ? formatWhen(startsAt) : 'Pick a date'}
                </span>
              </div>

              {performerOrTeam && (
                <div className="text-xs font-headline font-bold text-primary">
                  ⭐ {performerOrTeam}
                </div>
              )}

              {isTicketedEvent && meetupTime && showtime && (
                <div className="flex items-center gap-2 text-xs font-bold text-text-dark bg-primary-fixed/20 p-2 rounded-xl">
                  <span className="text-primary flex items-center gap-1">
                    <Clock size={11} /> Meet: {meetupTime}
                  </span>
                  <span className="text-text-light">•</span>
                  <span className="text-secondary font-extrabold">
                    Show: {showtime}
                  </span>
                </div>
              )}

              {ticketSectionInfo && (
                <div className="mt-0.5">
                  <span className="badge bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                    🎟️ {ticketSectionInfo}
                  </span>
                </div>
              )}

              <p className="text-xs text-text-medium flex items-center gap-1.5">
                <MapPin size={13} className="text-primary shrink-0" aria-hidden="true" />
                <span className="line-clamp-1">
                  {locationType === 'physical'
                    ? location || 'Where is it?'
                    : 'Online — link on RSVP'}
                </span>
              </p>

              <p className="text-xs text-text-light line-clamp-3">
                {vibe || 'Tell people what to expect and they will show up.'}
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Action bar */}
      <FloatingBar>
        <div className="flex items-center justify-between gap-4 w-full">
          <button
            type="button"
            onClick={() => (step > 1 ? setStep(s => (s - 1) as 1 | 2 | 3) : navigate('/'))}
            className="btn btn-ghost flex items-center gap-1 font-bold text-text-dark px-4 py-3"
          >
            {step > 1 ? (
              <>
                <ChevronLeft size={18} aria-hidden="true" /> Back
              </>
            ) : (
              'Cancel'
            )}
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              className="btn btn-primary flex-1 flex items-center justify-center gap-2 py-3.5"
            >
              Next step <ChevronRight size={18} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              className="btn btn-primary flex-1 flex items-center justify-center gap-2 py-3.5"
            >
              Publish event <Rocket size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </FloatingBar>
    </div>
  );
}
