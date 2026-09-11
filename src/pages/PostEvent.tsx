import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  ChevronDown,
  Check,
  Sparkles,
  Ticket,
  CheckCircle2,
  ShieldCheck,
  Upload,
  X,
  ExternalLink,
  Loader2,
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
  computeEventRelevance,
  parseEventDateToTimestamp,
  type AutoPullEvent,
  type EventSubType,
} from '../services/eventAutoPull';
import { searchLiveEventCatalog } from '../services/liveEventCatalog';
import { LiveEventCatalogModal } from '../components/LiveEventCatalogModal';
import { GooglePlacesVenuePicker } from '../components/GooglePlacesVenuePicker';
import { SearchLocationModal } from '../components/SearchLocationModal';


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
  const locationHook = useLocation();
  const prefill = (locationHook.state as { prefillEvent?: AutoPullEvent } | null)?.prefillEvent;

  const { createEvent, circles, user, updateProfile } = useApp();
  const toast = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Search Location & GPS State (synced across app via localStorage)
  const [searchLocation, setSearchLocation] = useState<string>(() => {
    try {
      return localStorage.getItem('w8vr.search_location') || user?.homeCity || 'All US Markets';
    } catch {
      return user?.homeCity || 'All US Markets';
    }
  });
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | undefined>(() => {
    try {
      const raw = localStorage.getItem('w8vr.user_coords');
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Auto-Pull & Ticketed Event State
  const [autoSearchQuery, setAutoSearchQuery] = useState('');
  const [autoSuggestions, setAutoSuggestions] = useState<AutoPullEvent[]>([]);
  const [isTicketedEvent, setIsTicketedEvent] = useState(Boolean(prefill));
  const [eventSubType, setEventSubType] = useState<EventSubType | undefined>(prefill?.eventSubType);
  const [performerOrTeam, setPerformerOrTeam] = useState(prefill?.performerOrTeam || '');
  const [showtime, setShowtime] = useState(prefill?.showtime || '8:00 PM');
  const [doorsTime, setDoorsTime] = useState(prefill?.doorsTime || '6:30 PM');
  const [meetupTime, setMeetupTime] = useState(prefill?.suggestedMeetupTime || '5:30 PM');
  const [meetupLocation, setMeetupLocation] = useState(prefill?.suggestedMeetupLocation || '');
  const [doorsConfirmed, setDoorsConfirmed] = useState(prefill?.doorsConfirmed || false);
  const [doorsSource, setDoorsSource] = useState(prefill?.doorsSource || '');
  const [venueGateInfo, setVenueGateInfo] = useState(prefill?.venueGateInfo || '');
  const [venueAddress, setVenueAddress] = useState(prefill?.venueAddress || '');
  const [ticketUrl, setTicketUrl] = useState(prefill?.ticketUrl || '');
  const [ticketSectionInfo, setTicketSectionInfo] = useState(prefill?.ticketSectionInfo || '');
  const [priceRange, setPriceRange] = useState(prefill?.priceRange || '');
  const [bagPolicy, setBagPolicy] = useState(prefill?.bagPolicy || '');
  const [ageRestriction, setAgeRestriction] = useState(prefill?.ageRestriction || 'All Ages');
  const [lineup, setLineup] = useState<string[]>(prefill?.lineup || []);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [localImageName, setLocalImageName] = useState<string | null>(null);
  const [pulledImagePresets, setPulledImagePresets] = useState<string[]>(
    prefill ? [prefill.image, ...(prefill.additionalImages || [])] : []
  );

  // Step 1
  const [title, setTitle] = useState(prefill?.title || '');
  const [category, setCategory] = useState<EventCategory>(prefill ? 'Entertainment' : 'Active');
  const [coverImage, setCoverImage] = useState(prefill?.image || COVER_OPTIONS[0].url);
  const [vibe, setVibe] = useState(prefill?.description || '');
  const [gameId, setGameId] = useState('');

  // Step 2
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('20:00');
  const [locationType, setLocationType] = useState<'physical' | 'virtual'>('physical');
  const [location, setLocation] = useState(prefill?.venue || '');
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

  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [surfacedResults, setSurfacedResults] = useState<AutoPullEvent[]>([]);
  const [isResultsSurfaced, setIsResultsSurfaced] = useState(false);
  const [isSearchingLive, setIsSearchingLive] = useState(false);

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

    if (loc !== 'All US Markets') {
      updateProfile({ homeCity: loc });
    }

    // Immediately re-run search if query is typed
    if (autoSearchQuery.trim()) {
      handleAutoSearchChange(autoSearchQuery, loc, coords);
      if (isResultsSurfaced) {
        handleSurfaceAllResults(autoSearchQuery, loc, coords);
      }
    }
  };

  const handleSurfaceAllResults = async (
    queryOverride?: string,
    locationOverride?: string,
    coordsOverride?: { lat: number; lng: number }
  ) => {
    const q = (queryOverride !== undefined ? queryOverride : autoSearchQuery).trim();
    if (!q) return;

    const activeLoc = locationOverride || searchLocation;
    const activeCoords = coordsOverride || userCoordinates;

    if (q.startsWith('http://') || q.startsWith('https://')) {
      handleParseUrl(q);
      return;
    }

    setIsSearchingLive(true);
    setIsResultsSurfaced(true);

    try {
      // 1. Search local curated & known outings across target market
      const localResults = searchAutoPullEvents(
        q,
        activeLoc === 'All US Markets' ? undefined : activeLoc,
        false,
        undefined,
        activeCoords
      );

      // 2. Query live events (Ticketmaster, SeatGeek, guides) across target market
      let liveResults: AutoPullEvent[] = [];
      try {
        liveResults = await searchLiveEventCatalog({
          keyword: q,
          city: activeLoc === 'All US Markets' ? undefined : activeLoc,
          size: 40,
        });
      } catch {
        // preserve local results
      }

      // 3. Deduplicate and merge
      const seen = new Set<string>();
      const combined: AutoPullEvent[] = [];

      const addEvent = (evt: AutoPullEvent) => {
        const key = `${evt.performerOrTeam.toLowerCase()}-${evt.title.toLowerCase()}-${evt.date}`;
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(evt);
        }
      };

      localResults.forEach(addEvent);
      liveResults.forEach(addEvent);

      // 4. Rank by relevance
      const ranked = combined
        .map(evt => ({
          evt,
          score: computeEventRelevance(evt, q, activeLoc === 'All US Markets' ? undefined : activeLoc),
        }))
        .filter(item => item.score > 0);

      ranked.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return parseEventDateToTimestamp(a.evt.date) - parseEventDateToTimestamp(b.evt.date);
      });

      const finalResults = ranked.map(r => r.evt);
      setSurfacedResults(finalResults.length > 0 ? finalResults : localResults);
    } finally {
      setIsSearchingLive(false);
    }
  };

  const handleAutoSearchChange = async (
    q: string,
    locationOverride?: string,
    coordsOverride?: { lat: number; lng: number }
  ) => {
    setAutoSearchQuery(q);
    if (!q.trim()) {
      setAutoSuggestions([]);
      setSurfacedResults([]);
      setIsResultsSurfaced(false);
      return;
    }

    const activeLoc = locationOverride || searchLocation;
    const activeCoords = coordsOverride || userCoordinates;

    const localResults = searchAutoPullEvents(
      q,
      activeLoc === 'All US Markets' ? undefined : activeLoc,
      false,
      undefined,
      activeCoords
    );
    setAutoSuggestions(localResults.slice(0, 8));

    if (q.trim().length >= 2) {
      try {
        const liveResults = await searchLiveEventCatalog({
          keyword: q,
          city: activeLoc === 'All US Markets' ? undefined : activeLoc,
          size: 12,
        });
        if (liveResults.length > 0) {
          const seen = new Set(localResults.map(e => `${e.performerOrTeam.toLowerCase()}-${e.date}`));
          const merged = [...localResults];
          for (const live of liveResults) {
            const key = `${live.performerOrTeam.toLowerCase()}-${live.date}`;
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(live);
            }
          }
          // Rank merged candidates by relevance first, then most recent/imminent date
          const ranked = merged
            .map(evt => ({
              evt,
              score: computeEventRelevance(evt, q, activeLoc === 'All US Markets' ? undefined : activeLoc),
            }))
            .filter(item => item.score > 0);

          ranked.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return parseEventDateToTimestamp(a.evt.date) - parseEventDateToTimestamp(b.evt.date);
          });

          setAutoSuggestions(ranked.map(r => r.evt).slice(0, 8));
          if (isResultsSurfaced) {
            setSurfacedResults(ranked.map(r => r.evt));
          }
        }
      } catch {
        // preserve local results
      }
    }
  };

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.show('Please select an image file (JPEG, PNG, WEBP, etc.).', 'warning');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.show('Image file exceeds 10MB limit. Please choose a smaller image.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCoverImage(dataUrl);
      setLocalImageName(file.name);
      setPulledImagePresets(prev => [dataUrl, ...prev.filter(p => p !== dataUrl)]);
      toast.show(`Uploaded ${file.name} as cover artwork!`, 'info');
    };
    reader.onerror = () => {
      toast.show('Failed to read image file from disk.', 'warning');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectAutoEvent = (autoEvt: AutoPullEvent) => {
    setTitle(autoEvt.title);
    if (autoEvt.category) {
      setCategory(autoEvt.category);
    } else if (autoEvt.eventSubType === 'Sports') {
      setCategory('Active');
    } else {
      setCategory('Entertainment');
    }

    // Only flag as ticketed if it has actual ticket options or a commercial ticket URL
    const isTicketed = Boolean(
      (autoEvt.ticketUrl && !autoEvt.ticketUrl.includes('google') && !autoEvt.ticketUrl.includes('maps')) ||
      (autoEvt.ticketOptions && autoEvt.ticketOptions.some(t => t.type === 'primary' || t.type === 'official_resale'))
    );
    setIsTicketedEvent(isTicketed);

    setEventSubType(autoEvt.eventSubType);
    setPerformerOrTeam(autoEvt.performerOrTeam);
    setLocation(autoEvt.venue);
    setVenueAddress(autoEvt.venueAddress || '');
    setShowtime(autoEvt.showtime);
    setDoorsTime(autoEvt.doorsTime || '');
    setMeetupTime(autoEvt.suggestedMeetupTime || '5:30 PM');
    setMeetupLocation(autoEvt.suggestedMeetupLocation || '');
    setDoorsConfirmed(autoEvt.doorsConfirmed ?? false);
    setDoorsSource(autoEvt.doorsSource || '');
    setVenueGateInfo(autoEvt.venueGateInfo || '');
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
    setSurfacedResults([]);
    setIsResultsSurfaced(false);
    toast.show(`Auto-pulled verified details for ${autoEvt.title}!`, 'info');
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
      doorsTimeConfirmed: isTicketedEvent ? doorsConfirmed : undefined,
      doorsTimeSource: isTicketedEvent ? doorsSource : undefined,
      venueGateInfo: isTicketedEvent ? venueGateInfo : undefined,
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
      canonicalId: prefill?.canonicalId,
      ticketOptions: prefill?.ticketOptions,
      provenanceSources: prefill?.provenanceSources,
      confidenceScore: prefill?.confidenceScore,
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-xs font-headline font-black text-primary uppercase tracking-wider">
                    <Sparkles size={15} />
                    <span>Auto-Pull Live Event Details</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Location Switcher Pill */}
                    <button
                      type="button"
                      onClick={() => setIsLocationModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-lowest hover:bg-surface-high border border-primary/25 text-xs font-headline font-bold text-text-dark cursor-pointer shadow-2xs transition-all hover:border-primary/50 active:scale-98"
                      aria-label={`Search location: ${searchLocation}. Click to change.`}
                    >
                      {searchLocation === 'All US Markets' ? (
                        <Globe size={13} className="text-primary shrink-0" />
                      ) : (
                        <MapPin size={13} className="text-primary shrink-0" />
                      )}
                      <span className="truncate max-w-[130px] sm:max-w-[170px]">
                        {searchLocation === 'All US Markets' ? 'All US Markets' : searchLocation}
                      </span>
                      <ChevronDown size={12} className="text-text-light shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCatalogModalOpen(true)}
                      className="badge bg-primary hover:bg-primary-dark text-white font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer py-1.5 px-2.5 shadow-2xs"
                    >
                      <Sparkles size={11} /> Browse Live Catalog
                    </button>
                  </div>
                </div>
                <p className="text-xs text-text-medium mb-3">
                  Search any restaurant, art walk, festival, tour, sports game, concert, or paste a link.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" size={16} />
                    <input
                      type="text"
                      placeholder="Search any restaurant, art walk, festival, tour, game, or concert (e.g. Au Cheval, Ravenswood, Architecture)..."
                      value={autoSearchQuery}
                      onChange={e => handleAutoSearchChange(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (autoSearchQuery.startsWith('http')) {
                            handleParseUrl(autoSearchQuery);
                          } else {
                            handleSurfaceAllResults();
                          }
                        }
                      }}
                      className="input-field pl-10 pr-28 py-2.5 text-xs bg-surface-lowest shadow-sm rounded-xl font-medium w-full"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      {autoSearchQuery.startsWith('http') ? (
                        <button
                          type="button"
                          onClick={() => handleParseUrl(autoSearchQuery)}
                          className="px-2.5 py-1 rounded-lg bg-primary text-white text-[11px] font-bold cursor-pointer"
                        >
                          Parse URL
                        </button>
                      ) : (
                        autoSearchQuery.trim().length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleSurfaceAllResults()}
                            className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-dark text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                            title="Surface all matching results"
                          >
                            <Search size={12} /> Surface All
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Dedicated Location Selector Button on Search Input Row */}
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="flex items-center justify-between gap-1.5 px-3.5 py-2 rounded-xl bg-surface-lowest hover:bg-surface-high border border-primary/30 text-xs font-headline font-bold text-text-dark shrink-0 cursor-pointer shadow-2xs transition-all hover:border-primary/60 active:scale-98"
                    title={`Search Location: ${searchLocation}. Click to switch city or metro.`}
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      {searchLocation === 'All US Markets' ? (
                        <Globe size={14} className="text-primary shrink-0" />
                      ) : (
                        <MapPin size={14} className="text-primary shrink-0" />
                      )}
                      <span className="truncate max-w-[110px] sm:max-w-[150px]">
                        {searchLocation === 'All US Markets' ? 'All US Markets' : searchLocation}
                      </span>
                    </span>
                    <ChevronDown size={13} className="text-text-light shrink-0" />
                  </button>
                </div>

                {/* Quick Metro Switcher Strip */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-text-light font-headline font-bold uppercase tracking-wider text-[10px] shrink-0 mr-0.5">
                    Location:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary font-bold transition-colors cursor-pointer shrink-0"
                  >
                    <MapPin size={11} />
                    <span>{searchLocation}</span>
                    <span className="text-[10px] underline">change</span>
                  </button>
                  <span className="text-text-light text-[10px] shrink-0">• Quick Switch:</span>
                  {['All US Markets', 'Chicago, IL', 'St. Louis, MO', 'Austin, TX', 'New York, NY'].map(loc => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => handleSelectLocation(loc)}
                      className={cx(
                        'px-2 py-0.5 rounded-md transition-all font-medium shrink-0 cursor-pointer text-[10px]',
                        searchLocation === loc
                          ? 'bg-primary text-white font-bold shadow-2xs'
                          : 'bg-surface-lowest text-text-medium hover:text-text-dark hover:bg-surface-high border border-gray-200'
                      )}
                    >
                      {loc === 'All US Markets' ? 'All US' : loc.split(',')[0]}
                    </button>
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-text-medium font-medium">
                    ⚡ Live sync: Restaurants, Art Walks, Tours, Festivals &amp; Arena APIs
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCatalogModalOpen(true)}
                    className="text-[11px] font-headline font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Open Live Catalog Browser →
                  </button>
                </div>

                {/* Auto Suggestions Dropdown (while typing, before hitting Enter) */}
                {!isResultsSurfaced && autoSuggestions.length > 0 && (
                  <div className="mt-2 bg-surface-lowest rounded-2xl shadow-xl border border-gray-100 overflow-hidden divide-y divide-gray-100 animate-slide-up z-20">
                    <div className="px-3.5 py-2 bg-surface-low/60 flex items-center justify-between text-[11px] text-text-medium border-b border-gray-100">
                      <span className="font-bold text-text-dark">
                        Quick Suggestions ({autoSuggestions.length})
                      </span>
                      <span className="text-[10px] text-text-light">
                        Press <kbd className="px-1.5 py-0.5 bg-surface-lowest border border-gray-200 rounded text-[9px] font-mono">Enter</kbd> to surface all results
                      </span>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                      {autoSuggestions.map(evt => (
                        <button
                          key={evt.id}
                          type="button"
                          onClick={() => handleSelectAutoEvent(evt)}
                          className="w-full p-3 flex items-center gap-3 text-left hover:bg-surface-low transition-colors cursor-pointer group"
                        >
                          <img
                            src={evt.image}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="badge bg-secondary-container text-on-secondary-container text-[9px] font-bold uppercase">
                                {evt.eventSubType}
                              </span>
                              <span className="font-headline font-bold text-xs text-text-dark truncate">
                                {evt.title}
                              </span>
                            </div>
                            <div className="text-[11px] text-text-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-primary">📅 {evt.date}</span>
                              <span>•</span>
                              <span className="truncate">📍 {evt.venue}{evt.city ? `, ${evt.city}` : ''}</span>
                              <span>•</span>
                              <span className="shrink-0">⚡ Show: {evt.showtime}</span>
                              {evt.doorsConfirmed && (
                                <span className="badge bg-success/15 text-success text-[9px] font-bold py-0.5 px-1.5 shrink-0">
                                  ✓ Doors {evt.doorsTime}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-primary shrink-0 group-hover:underline">
                            1-Click Fill →
                          </span>
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSurfaceAllResults()}
                      className="w-full py-2.5 px-4 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Search size={13} /> Surface all results for &ldquo;{autoSearchQuery}&rdquo; (Press Enter) →
                    </button>
                  </div>
                )}

                {/* Full Surfaced Results Section (when Enter is pressed or "Surface All" is clicked) */}
                {isResultsSurfaced && (
                  <div className="mt-3 bg-surface-lowest rounded-2xl shadow-xl border border-primary/20 overflow-hidden animate-slide-up z-20">
                    <div className="p-3.5 bg-primary/10 border-b border-primary/15 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-primary" />
                        <div>
                          <h4 className="font-headline font-black text-xs sm:text-sm text-text-dark">
                            All Surfaced Results for &ldquo;{autoSearchQuery}&rdquo;
                          </h4>
                          <p className="text-[11px] text-text-medium">
                            {isSearchingLive
                              ? 'Searching live feeds and all US markets...'
                              : `Found ${surfacedResults.length} matching events. Click any event to auto-fill details.`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCatalogModalOpen(true)}
                          className="badge bg-primary hover:bg-primary-dark text-white font-bold text-[10px] uppercase tracking-wider py-1 px-2.5 flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <ExternalLink size={11} /> Browse in Modal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsResultsSurfaced(false);
                            setSurfacedResults([]);
                          }}
                          className="w-7 h-7 rounded-full bg-surface-low hover:bg-surface-high text-text-medium flex items-center justify-center transition-colors cursor-pointer"
                          title="Close results"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    {isSearchingLive && (
                      <div className="p-8 flex flex-col items-center justify-center text-center">
                        <Loader2 size={24} className="text-primary animate-spin mb-2" />
                        <span className="text-xs font-bold text-text-dark">
                          Surfacing all results for &ldquo;{autoSearchQuery}&rdquo;...
                        </span>
                        <span className="text-[11px] text-text-medium mt-0.5">
                          Querying Ticketmaster, SeatGeek, and all US metro guides
                        </span>
                      </div>
                    )}

                    {!isSearchingLive && surfacedResults.length === 0 && (
                      <div className="p-8 text-center">
                        <p className="text-xs font-bold text-text-dark mb-1">
                          No events found matching &ldquo;{autoSearchQuery}&rdquo;
                        </p>
                        <p className="text-[11px] text-text-medium mb-3">
                          You can type a custom title and details below, or search across other cities.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsCatalogModalOpen(true)}
                          className="btn btn-primary text-xs py-1.5 px-4"
                        >
                          Open Full Catalog Browser
                        </button>
                      </div>
                    )}

                    {!isSearchingLive && surfacedResults.length > 0 && (
                      <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 p-1">
                        {surfacedResults.map(evt => (
                          <div
                            key={evt.id}
                            className="p-3.5 hover:bg-surface-low/80 rounded-xl transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <img
                                src={evt.image}
                                alt=""
                                className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-2xs"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="badge bg-secondary-container text-on-secondary-container text-[9px] font-bold uppercase">
                                    {evt.eventSubType || evt.category}
                                  </span>
                                  <span className="font-headline font-bold text-xs sm:text-sm text-text-dark">
                                    {evt.title}
                                  </span>
                                </div>
                                <div className="text-[11px] text-text-medium mt-1 flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-primary flex items-center gap-1">
                                    <Calendar size={12} /> {evt.date}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin size={12} /> {evt.venue}{evt.city ? `, ${evt.city}` : ''}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock size={12} /> Show: {evt.showtime}
                                  </span>
                                  {evt.doorsConfirmed && (
                                    <span className="badge bg-success/15 text-success text-[9px] font-bold py-0.5 px-1.5">
                                      ✓ Doors {evt.doorsTime}
                                    </span>
                                  )}
                                  {evt.ticketOptions && evt.ticketOptions.length > 0 && (
                                    <span className="badge bg-surface-high text-text-dark text-[9px] font-bold py-0.5 px-1.5 flex items-center gap-1">
                                      <Ticket size={10} /> {evt.ticketOptions.map(t => t.provider || t.sourceLabel || 'Verified').join(' & ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectAutoEvent(evt)}
                              className="btn btn-primary text-xs py-2 px-3.5 shrink-0 w-full sm:w-auto flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 transition-all"
                            >
                              <Sparkles size={12} /> Auto-Fill This Event →
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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

                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-text-light">
                      Custom artwork options:
                    </span>
                    {localImageName && (
                      <span className="text-[10px] font-bold text-success flex items-center gap-1">
                        <CheckCircle2 size={12} /> Local file: {localImageName}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Local Folder Upload Button */}
                    <div>
                      <input
                        type="file"
                        id="local-cover-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLocalImageUpload}
                      />
                      <label
                        htmlFor="local-cover-upload"
                        className="btn btn-outline w-full text-xs py-2 px-3 flex items-center justify-center gap-2 cursor-pointer hover:bg-surface-high transition-all border-dashed border-gray-300 hover:border-primary group"
                      >
                        <Upload size={14} className="text-primary group-hover:scale-110 transition-transform shrink-0" />
                        <span className="font-bold text-text-dark truncate">
                          {localImageName ? `Change: ${localImageName}` : 'Upload from folder / device'}
                        </span>
                      </label>
                    </div>

                    {/* URL Paste Input */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        placeholder="Or paste image URL..."
                        value={customImageUrl}
                        onChange={e => {
                          setCustomImageUrl(e.target.value);
                          if (e.target.value.startsWith('http')) {
                            setCoverImage(e.target.value);
                            setLocalImageName(null);
                          }
                        }}
                        className="input-field text-xs py-2 flex-1 min-w-0"
                      />
                      {customImageUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setCoverImage(customImageUrl);
                            setLocalImageName(null);
                          }}
                          className="btn btn-outline text-xs py-2 px-2.5 shrink-0"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
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
                        onChange={e => {
                          setDoorsTime(e.target.value);
                          setDoorsSource('Manual Host Adjustment');
                        }}
                        placeholder="e.g. 6:30 PM"
                        className="font-headline font-black text-base text-text-dark bg-transparent border-none outline-none w-full"
                      />
                      <div className="text-[10px] text-text-light mt-0.5">Venue gates unlock</div>
                      {doorsSource && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 mt-1 truncate" title={doorsSource}>
                          <CheckCircle2 size={11} className="shrink-0" />
                          <span className="truncate">{doorsSource}</span>
                        </div>
                      )}
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

                  {/* Venue Entry & Gate Access Instructions */}
                  {venueGateInfo && (
                    <div className="p-3 bg-surface-lowest rounded-2xl border border-primary/20 flex items-start gap-2.5">
                      <ShieldCheck size={16} className="text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-headline font-bold text-primary uppercase tracking-wider block">
                          Venue Entry & Gate Instructions
                        </span>
                        <p className="text-xs text-text-dark font-medium mt-0.5 leading-relaxed">
                          {venueGateInfo}
                        </p>
                      </div>
                    </div>
                  )}

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
                <GooglePlacesVenuePicker
                  venue={location}
                  address={exactAddress}
                  cityContext={searchLocation !== 'All US Markets' ? searchLocation : user?.homeCity}
                  onSelectPlace={place => {
                    setLocation(place.name);
                    setExactAddress(place.address);
                    setVenueAddress(place.address);
                  }}
                  onChangeVenue={val => setLocation(val)}
                  onChangeAddress={val => {
                    setExactAddress(val);
                    setVenueAddress(val);
                  }}
                />
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

      <LiveEventCatalogModal
        key={`${isCatalogModalOpen ? 'open' : 'closed'}-${searchLocation}-${autoSearchQuery}`}
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        onSelectEvent={handleSelectAutoEvent}
        initialCity={searchLocation === 'All US Markets' ? 'All Cities' : searchLocation}
        initialKeyword={autoSearchQuery}
      />

      <SearchLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={searchLocation}
        onSelectLocation={handleSelectLocation}
        userHomeCity={user?.homeCity || 'Chicago, IL'}
      />
    </div>
  );
}
