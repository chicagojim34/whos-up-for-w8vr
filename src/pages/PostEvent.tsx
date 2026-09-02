import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Link as LinkIcon, 
  Minus, 
  Plus, 
  ToggleLeft, 
  ToggleRight, 
  Search, 
  Globe, 
  Lock, 
  EyeOff, 
  Image as ImageIcon,
  Rocket,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Ticket,
  Check,
  RotateCcw,
  Upload,
  Info,
  ShieldCheck
} from 'lucide-react';
import cx from 'classnames';
import { useApp } from '../context/AppContext';
import { CATEGORY_DEFINITIONS, type EventCategory } from '../components/CategoryChip';
import { 
  searchAutoPullEvents, 
  parseEventUrlOrText, 
  type AutoPullEvent, 
  type EventSubType 
} from '../services/eventAutoPull';

const COVER_OPTIONS = [
  { id: 'neon', label: 'Neon Cyberpunk', url: '/neon_midnight_1774367472687.png' },
  { id: 'vanguard', label: 'Rooftop Lounge', url: '/vanguard_social_1774367422848.png' },
  { id: 'trail', label: 'Mountain Trail', url: '/morning_ridge_1774367438744.png' },
  { id: 'vinyl', label: 'Vinyl Session', url: '/vinyl_set_1774367456136.png' },
  { id: 'design', label: 'Creative Studio', url: '/media__1774367125342.png' },
];

export default function PostEvent() {
  const navigate = useNavigate();
  const { createEvent } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Auto-Pull State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [pulledEvent, setPulledEvent] = useState<AutoPullEvent | null>(null);
  const [isAutoPulled, setIsAutoPulled] = useState(false);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [showCustomImageInput, setShowCustomImageInput] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Step 1: The Basics
  const [title, setTitle] = useState('');
  const [performerOrTeam, setPerformerOrTeam] = useState('');
  const [eventSubType, setEventSubType] = useState<EventSubType>('Concert');
  const [isTicketedEvent, setIsTicketedEvent] = useState(false);
  const [category, setCategory] = useState<EventCategory>('Entertainment');
  const [coverImage, setCoverImage] = useState(COVER_OPTIONS[0].url);
  const [vibe, setVibe] = useState('');

  // Step 2: When & Where (Dual-Time Support)
  const [date, setDate] = useState('Fri, Nov 14');
  const [showtime, setShowtime] = useState('8:00 PM');
  const [doorsTime, setDoorsTime] = useState('6:30 PM');
  const [meetupTime, setMeetupTime] = useState('5:30 PM');
  const [time, setTime] = useState('5:30 PM'); // Fallback / Primary
  const [meetupLocation, setMeetupLocation] = useState('Scholz Garten (pre-drinks & food)');
  const [locationType, setLocationType] = useState<'physical' | 'virtual'>('physical');
  const [location, setLocation] = useState('Moody Center ATX');
  const [venueAddress, setVenueAddress] = useState('2001 Robert Dedman Dr, Austin, TX 78712');
  const [virtualLink, setVirtualLink] = useState('');

  // Step 3: Logistics & Privacy & Tickets
  const [ticketUrl, setTicketUrl] = useState('https://www.ticketmaster.com');
  const [ticketSectionInfo, setTicketSectionInfo] = useState('Section 114, Rows 12-16 (or GA Floor)');
  const [priceRange, setPriceRange] = useState('$95 - $285');
  const [bagPolicy, setBagPolicy] = useState('Clear bags only (max 12"x6"x12") or small clutches under 4.5"x6.5"');
  const [ageRestriction, setAgeRestriction] = useState('All Ages');
  const [capacity, setCapacity] = useState(14);
  const [autoWaitlist, setAutoWaitlist] = useState(true);
  const [privacy, setPrivacy] = useState<'public' | 'circle' | 'hidden'>('public');

  // Search Results
  const searchResults = searchAutoPullEvents(searchQuery);

  const applyAutoPulledEvent = (evt: AutoPullEvent) => {
    setPulledEvent(evt);
    setIsAutoPulled(true);
    setIsTicketedEvent(true);
    setTitle(evt.title);
    setPerformerOrTeam(evt.performerOrTeam);
    setEventSubType(evt.eventSubType);
    setCategory(evt.category);
    setCoverImage(evt.image);
    setAvailableImages([evt.image, ...(evt.additionalImages || [])]);
    setVibe(evt.description);
    setDate(evt.date);
    setShowtime(evt.showtime);
    setDoorsTime(evt.doorsTime);
    setMeetupTime(evt.suggestedMeetupTime);
    setTime(evt.suggestedMeetupTime);
    setLocation(evt.venue);
    setVenueAddress(evt.venueAddress);
    setMeetupLocation(evt.suggestedMeetupLocation);
    setTicketUrl(evt.ticketUrl);
    setTicketSectionInfo(evt.ticketSectionInfo);
    setPriceRange(evt.priceRange);
    setBagPolicy(evt.bagPolicy);
    setAgeRestriction(evt.ageRestriction);
    setIsSearchFocused(false);
    setSearchQuery('');
  };

  const handleParseInput = () => {
    if (!searchQuery.trim()) return;
    const parsed = parseEventUrlOrText(searchQuery);
    if (parsed) {
      applyAutoPulledEvent(parsed as AutoPullEvent);
    }
  };

  const handleResetAutoPull = () => {
    setIsAutoPulled(false);
    setPulledEvent(null);
    setIsTicketedEvent(false);
    setTitle('');
    setPerformerOrTeam('');
    setCoverImage(COVER_OPTIONS[0].url);
    setAvailableImages([]);
    setLocation('The Glass House Rooftop');
    setMeetupLocation('');
    setVibe('');
  };

  const handleApplyCustomImage = () => {
    if (customImageUrl.trim()) {
      setCoverImage(customImageUrl.trim());
      setShowCustomImageInput(false);
    }
  };

  const handleCreate = () => {
    if (!title.trim()) {
      setStep(1);
      return;
    }

    const effectiveTimeLabel = isTicketedEvent && showtime && meetupTime
      ? `Meet ${meetupTime} • Show ${showtime}`
      : `${meetupTime || time || '8:00 PM'} ${date || 'Today'}`;

    const newEvent = createEvent({
      title: title.trim(),
      category,
      image: coverImage,
      vibe: vibe.trim() || 'Join us for this curated gathering on W8VR!',
      date,
      time: meetupTime || time,
      timeLabel: effectiveTimeLabel,
      location: locationType === 'physical' ? (location.trim() || 'Downtown') : 'Online / Virtual Hub',
      isVirtual: locationType === 'virtual',
      virtualLink: locationType === 'virtual' ? virtualLink.trim() : undefined,
      maxSpots: capacity,
      privacy,
      description: vibe.trim() || `${category} gathering organized by You.`,
      // Auto-pulled & Ticketed fields
      isTicketedEvent,
      eventSubType: isTicketedEvent ? eventSubType : undefined,
      performerOrTeam: isTicketedEvent ? performerOrTeam.trim() : undefined,
      showtime: isTicketedEvent ? showtime.trim() : undefined,
      doorsTime: isTicketedEvent ? doorsTime.trim() : undefined,
      meetupTime: isTicketedEvent ? meetupTime.trim() : undefined,
      meetupLocation: isTicketedEvent ? meetupLocation.trim() : undefined,
      venueAddress: locationType === 'physical' ? venueAddress.trim() : undefined,
      ticketUrl: isTicketedEvent ? ticketUrl.trim() : undefined,
      ticketSectionInfo: isTicketedEvent ? ticketSectionInfo.trim() : undefined,
      priceRange: isTicketedEvent ? priceRange.trim() : undefined,
      bagPolicy: isTicketedEvent ? bagPolicy.trim() : undefined,
      ageRestriction: isTicketedEvent ? ageRestriction.trim() : undefined,
    });

    navigate(`/event/${newEvent.id}`);
  };

  return (
    <div className="flex-col pb-36 px-6 pt-2 bg-surface min-h-screen animate-fade-in max-w-4xl mx-auto w-full">
      {/* Step Indicator Header */}
      <div className="mb-6 flex-col gap-2">
        <div className="flex justify-between items-center text-xs font-headline font-bold text-primary tracking-widest uppercase">
          <span>STEP {step} OF 3</span>
          <span className="text-text-medium">
            {step === 1 ? 'THE BASICS & AUTO-PULL' : step === 2 ? 'SCHEDULE & VENUE' : 'TICKETS, LOGISTICS & PRIVACY'}
          </span>
        </div>
        {/* Animated Progress Bar */}
        <div className="w-full bg-surface-high h-2 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-400 rounded-full"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Steps & Live Preview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Form Inputs Left Column */}
        <div className="md:col-span-7 flex-col gap-6">
          {/* STEP 1: The Basics & Auto-Pull */}
          {step === 1 && (
            <div className="flex-col gap-6 animate-slide-up">
              {/* Auto-Pull Header Box */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-surface-container-low rounded-3xl p-5 border border-primary/25 shadow-sm relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
                      <Sparkles size={15} />
                    </div>
                    <span className="font-headline font-black text-sm text-text-dark">
                      Auto-Pull Live Event Details
                    </span>
                  </div>
                  {isAutoPulled && (
                    <button
                      type="button"
                      onClick={handleResetAutoPull}
                      className="text-[11px] font-bold text-quiet hover:text-red-600 flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw size={12} /> Clear Auto-Fill
                    </button>
                  )}
                </div>

                <p className="text-xs text-text-medium leading-relaxed mb-3">
                  Search concerts, sports, comedy, festivals, or paste a link from Ticketmaster, SeatGeek, or AXS to automatically fetch venue, showtime, performer, and poster artwork.
                </p>

                {/* Search Bar Input */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" size={16} />
                  <input
                    type="text"
                    placeholder="Search 'Billie Eilish', 'Warriors', 'Dave Chappelle' or paste link..."
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setIsSearchFocused(true);
                    }}
                    onFocus={() => setIsSearchFocused(true)}
                    className="input-field pl-10 pr-24 py-2.5 text-xs bg-surface-lowest shadow-sm border border-primary/20 focus:border-primary font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleParseInput}
                      className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-primary text-[10px] py-1 px-2.5 rounded-lg shadow-sm"
                    >
                      Auto-Pull
                    </button>
                  )}
                </div>

                {/* Live Search Suggestions Dropdown */}
                {isSearchFocused && (
                  <div className="mt-2 bg-surface-lowest rounded-2xl shadow-xl border border-gray-100 p-2 max-h-72 overflow-y-auto flex flex-col gap-1 z-30">
                    <div className="text-[10px] font-headline font-bold text-text-light px-2.5 py-1 uppercase tracking-wider flex justify-between">
                      <span>Live Catalog Suggestions</span>
                      <button
                        type="button"
                        onClick={() => setIsSearchFocused(false)}
                        className="text-text-medium hover:text-primary"
                      >
                        ✕ Close
                      </button>
                    </div>

                    {searchResults.map(evt => (
                      <button
                        key={evt.id}
                        type="button"
                        onClick={() => applyAutoPulledEvent(evt)}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-low transition-colors text-left group w-full cursor-pointer"
                      >
                        <img
                          src={evt.image}
                          alt={evt.title}
                          className="w-12 h-12 rounded-lg object-cover shrink-0 shadow-xs"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="badge bg-primary-fixed text-primary text-[9px] py-0 px-1.5 font-bold uppercase">
                              {evt.eventSubType}
                            </span>
                            <span className="text-[10px] font-bold text-text-light truncate">
                              {evt.date} • {evt.showtime}
                            </span>
                          </div>
                          <div className="font-headline font-bold text-xs text-text-dark group-hover:text-primary transition-colors truncate">
                            {evt.title}
                          </div>
                          <div className="text-[10px] text-text-medium truncate flex items-center gap-1 mt-0.5">
                            <MapPin size={10} className="text-primary" /> {evt.venue}, {evt.city}
                          </div>
                        </div>
                        <span className="btn btn-ghost text-[10px] py-1 px-2 font-bold group-hover:bg-primary group-hover:text-white rounded-lg transition-all shrink-0">
                          Select
                        </span>
                      </button>
                    ))}

                    {searchResults.length === 0 && (
                      <div className="p-4 text-center text-xs text-text-medium">
                        No catalog match found for "{searchQuery}". Click "Auto-Pull" above to parse as a custom link or title.
                      </div>
                    )}
                  </div>
                )}

                {/* Auto-Pulled Success Banner */}
                {isAutoPulled && pulledEvent && (
                  <div className="mt-3 p-3 bg-secondary-container/40 border border-secondary/30 rounded-2xl flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
                        <Check size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-on-secondary-container">
                          Details Loaded: {pulledEvent.performerOrTeam}
                        </div>
                        <div className="text-[10px] text-secondary">
                          {pulledEvent.venue} • Showtime: {pulledEvent.showtime}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-headline font-bold text-secondary bg-white/70 px-2 py-1 rounded-lg">
                      Synced ✨
                    </span>
                  </div>
                )}
              </div>

              {/* Event Title */}
              <div>
                <label className="text-xs font-bold text-text-dark mb-1.5 block">EVENT TITLE *</label>
                <input
                  type="text"
                  placeholder="e.g., Billie Eilish: Hit Me Hard and Soft Tour"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="input-field font-headline font-bold text-base"
                />
              </div>

              {/* Performer / Team & Subtype Row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-7">
                  <label className="text-xs font-bold text-text-dark mb-1.5 block">
                    PERFORMER, ARTIST, OR TEAM
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Billie Eilish, or Warriors vs. Lakers"
                    value={performerOrTeam}
                    onChange={e => {
                      setPerformerOrTeam(e.target.value);
                      if (e.target.value) setIsTicketedEvent(true);
                    }}
                    className="input-field text-sm"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="text-xs font-bold text-text-dark mb-1.5 block">
                    EVENT TYPE
                  </label>
                  <select
                    value={eventSubType}
                    onChange={e => {
                      const st = e.target.value as EventSubType;
                      setEventSubType(st);
                      setIsTicketedEvent(true);
                      if (st === 'Sports') setCategory('Active');
                      else setCategory('Entertainment');
                    }}
                    className="input-field text-xs font-bold py-3.5"
                  >
                    <option value="Concert">🎵 Concert / Tour</option>
                    <option value="Sports">🏀 Sporting Event</option>
                    <option value="Comedy">🎙️ Comedy Show</option>
                    <option value="Festival">🎪 Festival</option>
                    <option value="Theater">🎭 Theater / Arts</option>
                    <option value="Other">✨ Other Outing</option>
                  </select>
                </div>
              </div>

              {/* Category Taxonomy Chips */}
              <div>
                <label className="text-xs font-bold text-text-dark mb-2 block">
                  CATEGORY (W8VR TAXONOMY)
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_DEFINITIONS.filter(c => c.label !== 'All Events').map(cat => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.label;
                    return (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => setCategory(cat.label)}
                        className={cx(
                          'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95',
                          isSelected
                            ? 'bg-primary text-white shadow-md shadow-primary/30'
                            : 'bg-surface-low text-text-medium hover:bg-surface-high'
                        )}
                      >
                        <Icon size={13} />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cover Photo Selection (Pulled Poster + Alternatives + Custom) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-text-dark block">
                    EVENT COVER IMAGE
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCustomImageInput(!showCustomImageInput)}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Upload size={12} /> Custom Image URL
                  </button>
                </div>

                {showCustomImageInput && (
                  <div className="flex gap-2 mb-3 animate-slide-up">
                    <input
                      type="text"
                      placeholder="Paste image URL (https://...)"
                      value={customImageUrl}
                      onChange={e => setCustomImageUrl(e.target.value)}
                      className="input-field text-xs py-2 flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomImage}
                      className="btn btn-primary text-xs px-3"
                    >
                      Apply
                    </button>
                  </div>
                )}

                {/* Available Auto-Pulled Images or Presets */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {availableImages.length > 0
                    ? availableImages.map((imgUrl, i) => (
                        <button
                          key={imgUrl + i}
                          type="button"
                          onClick={() => setCoverImage(imgUrl)}
                          className={cx(
                            'relative rounded-xl overflow-hidden aspect-[4/3] border-2 transition-all cursor-pointer group',
                            coverImage === imgUrl
                              ? 'border-primary shadow-md scale-105 ring-2 ring-primary/20'
                              : 'border-transparent opacity-75 hover:opacity-100'
                          )}
                        >
                          <img src={imgUrl} alt={`Cover option ${i + 1}`} className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-[8px] text-white font-bold px-1 rounded">
                            {i === 0 ? 'Official' : `Alt ${i}`}
                          </span>
                        </button>
                      ))
                    : COVER_OPTIONS.map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setCoverImage(opt.url)}
                          className={cx(
                            'relative rounded-xl overflow-hidden aspect-[4/3] border-2 transition-all cursor-pointer',
                            coverImage === opt.url
                              ? 'border-primary shadow-md scale-105'
                              : 'border-transparent opacity-75 hover:opacity-100'
                          )}
                        >
                          <img src={opt.url} alt={opt.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                </div>
              </div>

              {/* Description / The Vibe */}
              <div>
                <label className="text-xs font-bold text-text-dark mb-1.5 block">THE VIBE & DETAILS</label>
                <textarea
                  rows={3}
                  placeholder="What should guests expect? Pre-show hangout plan, attire, or energy?"
                  value={vibe}
                  onChange={e => setVibe(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
            </div>
          )}

          {/* STEP 2: When & Where (Dual-Time Coordination) */}
          {step === 2 && (
            <div className="flex-col gap-6 animate-slide-up">
              <div>
                <h1 className="font-headline font-extrabold text-2xl text-text-dark">Schedule & Venue</h1>
                <p className="text-sm text-text-medium mt-1">
                  Coordinate both the official showtime and the time your group gathers.
                </p>
              </div>

              {/* Date Input */}
              <div>
                <label className="text-xs font-bold text-text-dark mb-1.5 block">EVENT DATE</label>
                <div className="flex items-center bg-surface-low rounded-xl px-3.5 py-3 gap-2.5">
                  <Calendar size={18} className="text-primary" />
                  <input
                    type="text"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    placeholder="e.g. Fri, Nov 14"
                    className="bg-transparent border-none outline-none font-bold text-sm text-text-dark w-full"
                  />
                </div>
              </div>

              {/* DUAL-TIME MATRIX BENTO BOX */}
              <div className="bg-primary-fixed/20 border border-primary/20 rounded-3xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-primary" />
                  <h3 className="font-headline font-bold text-base text-text-dark">
                    Dual-Time Coordination
                  </h3>
                </div>
                <p className="text-xs text-text-medium -mt-2">
                  Concerts and sports start at official times, but friend groups gather beforehand. Both times will be clearly highlighted.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Host Meetup Time */}
                  <div className="p-3.5 bg-surface-lowest rounded-2xl shadow-sm border-2 border-primary">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-headline font-black text-primary uppercase tracking-wider">
                        HOST MEETUP TIME
                      </span>
                      <span className="badge bg-primary text-white text-[9px] py-0.2 px-1 font-bold">Group</span>
                    </div>
                    <input
                      type="text"
                      value={meetupTime}
                      onChange={e => {
                        setMeetupTime(e.target.value);
                        setTime(e.target.value);
                      }}
                      placeholder="e.g. 5:30 PM"
                      className="font-headline font-black text-lg text-text-dark bg-transparent border-none outline-none w-full"
                    />
                    <div className="text-[10px] text-text-light mt-0.5">When we meet up</div>
                  </div>

                  {/* Doors Open Time */}
                  <div className="p-3.5 bg-surface-lowest rounded-2xl shadow-sm border border-gray-100">
                    <span className="text-[10px] font-headline font-bold text-text-light uppercase tracking-wider block mb-1">
                      VENUE DOORS OPEN
                    </span>
                    <input
                      type="text"
                      value={doorsTime}
                      onChange={e => setDoorsTime(e.target.value)}
                      placeholder="e.g. 6:30 PM"
                      className="font-headline font-bold text-lg text-text-medium bg-transparent border-none outline-none w-full"
                    />
                    <div className="text-[10px] text-text-light mt-0.5">Gates / Doors unlock</div>
                  </div>

                  {/* Official Showtime */}
                  <div className="p-3.5 bg-surface-lowest rounded-2xl shadow-sm border border-gray-100">
                    <span className="text-[10px] font-headline font-bold text-secondary uppercase tracking-wider block mb-1">
                      OFFICIAL SHOWTIME / KICKOFF
                    </span>
                    <input
                      type="text"
                      value={showtime}
                      onChange={e => setShowtime(e.target.value)}
                      placeholder="e.g. 8:00 PM"
                      className="font-headline font-black text-lg text-secondary bg-transparent border-none outline-none w-full"
                    />
                    <div className="text-[10px] text-text-light mt-0.5">Main act on stage</div>
                  </div>
                </div>

                {/* Quick Meetup Offset Buttons */}
                <div>
                  <span className="text-[11px] font-bold text-text-medium block mb-1.5">
                    Quick adjust meetup time relative to {showtime || 'showtime'}:
                  </span>
                  <div className="flex flex-wrap gap-2">
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
                      onClick={() => setMeetupTime('6:30 PM')}
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
              </div>

              {/* Pre-Event Meetup Spot (Where group gathers first) */}
              <div>
                <label className="text-xs font-bold text-text-dark mb-1.5 block">
                  PRE-EVENT GATHERING SPOT (BEFORE ENTERING VENUE)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                  <input
                    type="text"
                    placeholder="e.g. Scholz Garten across the street, Gate 3, or Lot B Tailgate"
                    value={meetupLocation}
                    onChange={e => setMeetupLocation(e.target.value)}
                    className="input-field pl-11 text-sm font-medium"
                  />
                </div>
              </div>

              {/* Location Type Switcher */}
              <div>
                <label className="text-xs font-bold text-text-dark mb-1.5 block">LOCATION TYPE</label>
                <div className="flex bg-surface-low p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setLocationType('physical')}
                    className={cx('flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer', {
                      'bg-surface-lowest shadow-sm text-primary': locationType === 'physical',
                      'text-text-medium hover:text-text-dark': locationType !== 'physical',
                    })}
                  >
                    <MapPin size={14} /> Physical Venue
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationType('virtual')}
                    className={cx('flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer', {
                      'bg-surface-lowest shadow-sm text-primary': locationType === 'virtual',
                      'text-text-medium hover:text-text-dark': locationType !== 'virtual',
                    })}
                  >
                    <LinkIcon size={14} /> Virtual / Watch Party
                  </button>
                </div>
              </div>

              {locationType === 'virtual' && (
                <div>
                  <label className="text-xs font-bold text-text-dark mb-1.5 block">VIRTUAL STREAM / ROOM LINK</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" size={16} />
                    <input
                      type="text"
                      placeholder="https://zoom.us/... or Discord stream link"
                      value={virtualLink}
                      onChange={e => setVirtualLink(e.target.value)}
                      className="input-field pl-11 text-sm"
                    />
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-bold text-text-dark mb-1.5 block">
                    OFFICIAL VENUE NAME *
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" size={18} />
                    <input
                      type="text"
                      placeholder="e.g., Moody Center ATX, Chase Center, Bass Concert Hall"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      className="input-field pl-11 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-dark mb-1.5 block">
                    VENUE PHYSICAL ADDRESS
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2001 Robert Dedman Dr, Austin, TX 78712"
                    value={venueAddress}
                    onChange={e => setVenueAddress(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Logistics, Tickets & Privacy */}
          {step === 3 && (
            <div className="flex-col gap-6 animate-slide-up">
              <div>
                <h1 className="font-headline font-extrabold text-2xl text-text-dark">Tickets & Logistics</h1>
                <p className="text-sm text-text-medium mt-1">
                  Seating section notes, ticketing links, and audience capacity.
                </p>
              </div>

              {/* Ticket & Seating Coordination Card */}
              <div className="p-5 bg-surface-low rounded-3xl flex flex-col gap-4 border border-gray-100">
                <div className="flex items-center gap-2">
                  <Ticket size={18} className="text-primary" />
                  <h4 className="font-headline font-bold text-base text-text-dark">
                    Ticket & Seating Coordination
                  </h4>
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-bold text-text-dark mb-1 block">
                      OFFICIAL TICKET PURCHASE URL
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" size={15} />
                      <input
                        type="text"
                        placeholder="https://www.ticketmaster.com/... or SeatGeek link"
                        value={ticketUrl}
                        onChange={e => setTicketUrl(e.target.value)}
                        className="input-field pl-10 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-text-dark mb-1 block">
                        TARGET SEATING SECTION
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sec 114, Rows 12-16 or GA Pit"
                        value={ticketSectionInfo}
                        onChange={e => setTicketSectionInfo(e.target.value)}
                        className="input-field text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-text-dark mb-1 block">
                        ESTIMATED PRICE RANGE
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. $85 - $220"
                        value={priceRange}
                        onChange={e => setPriceRange(e.target.value)}
                        className="input-field text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Venue Rules & Bag Policy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-surface-low rounded-2xl">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-text-dark mb-1">
                    <ShieldCheck size={15} className="text-primary" /> BAG POLICY & ENTRY
                  </div>
                  <input
                    type="text"
                    value={bagPolicy}
                    onChange={e => setBagPolicy(e.target.value)}
                    placeholder="e.g. Clear bags only (12x6x12)"
                    className="bg-transparent border-none outline-none text-xs text-text-medium w-full font-medium"
                  />
                </div>

                <div className="p-4 bg-surface-low rounded-2xl">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-text-dark mb-1">
                    <Info size={15} className="text-primary" /> AGE RESTRICTION
                  </div>
                  <input
                    type="text"
                    value={ageRestriction}
                    onChange={e => setAgeRestriction(e.target.value)}
                    placeholder="e.g. All Ages, 18+, or 21+"
                    className="bg-transparent border-none outline-none text-xs text-text-medium w-full font-medium"
                  />
                </div>
              </div>

              {/* Maximum Capacity Control */}
              <div className="p-5 bg-surface-low rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-headline font-bold text-base text-text-dark">Maximum Capacity</h4>
                  <p className="text-xs text-text-medium">Limit group size for this outing</p>
                </div>
                <div className="flex items-center gap-3 bg-surface-lowest rounded-xl p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setCapacity(c => Math.max(2, c - 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-primary hover:bg-surface-low cursor-pointer"
                  >
                    <Minus size={16} strokeWidth={3} />
                  </button>
                  <span className="font-headline font-black text-lg w-8 text-center">{capacity}</span>
                  <button
                    type="button"
                    onClick={() => setCapacity(c => c + 1)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-primary hover:bg-surface-low cursor-pointer"
                  >
                    <Plus size={16} strokeWidth={3} />
                  </button>
                </div>
              </div>

              {/* Auto-Waitlist Toggle */}
              <div className="flex items-center justify-between p-4 bg-surface-low rounded-2xl">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 bg-primary-fixed rounded-xl flex items-center justify-center text-primary">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-sm text-text-dark">Auto-Waitlist Promotion</h4>
                    <p className="text-xs text-text-medium">Automatically promote waitlisted friends when spots open</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoWaitlist(!autoWaitlist)}
                  className="cursor-pointer"
                >
                  {autoWaitlist ? (
                    <ToggleRight size={38} className="text-primary" />
                  ) : (
                    <ToggleLeft size={38} className="text-quiet" />
                  )}
                </button>
              </div>

              {/* Privacy Toggles (3-way) */}
              <div>
                <label className="text-xs font-bold text-text-dark mb-2 block">PRIVACY & AUDIENCE ACCESS</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPrivacy('public')}
                    className={cx('p-4 rounded-2xl flex flex-col items-center gap-2 text-center transition-all border', {
                      'bg-primary text-white border-primary shadow-md': privacy === 'public',
                      'bg-surface-low text-text-medium border-transparent hover:bg-surface-high': privacy !== 'public',
                    })}
                  >
                    <Globe size={22} />
                    <div>
                      <div className="font-bold text-xs">Public</div>
                      <div className="text-[10px] opacity-80 mt-0.5">Open enrollment</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrivacy('circle')}
                    className={cx('p-4 rounded-2xl flex flex-col items-center gap-2 text-center transition-all border', {
                      'bg-primary text-white border-primary shadow-md': privacy === 'circle',
                      'bg-surface-low text-text-medium border-transparent hover:bg-surface-high': privacy !== 'circle',
                    })}
                  >
                    <Lock size={22} />
                    <div>
                      <div className="font-bold text-xs">Circle Only</div>
                      <div className="text-[10px] opacity-80 mt-0.5">Private friends</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrivacy('hidden')}
                    className={cx('p-4 rounded-2xl flex flex-col items-center gap-2 text-center transition-all border', {
                      'bg-primary text-white border-primary shadow-md': privacy === 'hidden',
                      'bg-surface-low text-text-medium border-transparent hover:bg-surface-high': privacy !== 'hidden',
                    })}
                  >
                    <EyeOff size={22} />
                    <div>
                      <div className="font-bold text-xs">Hidden</div>
                      <div className="text-[10px] opacity-80 mt-0.5">Invite link only</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Dynamic Preview Card (Right Column) */}
        <div className="md:col-span-5 flex-col gap-3">
          <div className="text-xs font-headline font-bold text-text-light uppercase tracking-wider flex items-center gap-1.5">
            <ImageIcon size={14} className="text-primary" /> Live Preview Card
          </div>

          <div className="card p-0 overflow-hidden shadow-lg border border-white/80 sticky top-24">
            <div className="relative h-52 bg-black">
              <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover opacity-85" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              <div className="absolute top-3 right-3 glass-panel badge text-[10px] font-bold text-white">
                0.2 MI AWAY
              </div>

              {/* Status Ring overlay */}
              <div className="absolute -bottom-5 right-5 w-14 h-14 bg-surface-lowest rounded-full flex items-center justify-center shadow-md p-1">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="24" cy="24" r="20" fill="transparent" stroke="#E5E7EB" strokeWidth="4" />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="transparent"
                    stroke="var(--primary)"
                    strokeWidth="4"
                    strokeDasharray="125.6"
                    strokeDashoffset="115"
                  />
                </svg>
                <span className="absolute text-[9px] font-headline font-black text-primary">1/{capacity}</span>
              </div>

              <div className="absolute bottom-3 left-4 right-4 text-white">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="badge bg-white/20 backdrop-blur-md text-[9px] uppercase font-bold text-white py-0.5 px-2">
                    {privacy === 'public' ? 'Public Event' : privacy === 'circle' ? 'Circle Only' : 'Hidden Link'}
                  </span>
                  {performerOrTeam && (
                    <span className="badge bg-secondary text-white text-[9px] font-bold py-0.5 px-2">
                      {eventSubType}
                    </span>
                  )}
                </div>
                <h3 className="font-headline font-black text-lg leading-tight text-white line-clamp-1">
                  {title || 'Midnight Padel Tournament'}
                </h3>
              </div>
            </div>

            <div className="p-5 pt-6 flex-col gap-3">
              {/* Dual Time Badge in Preview */}
              <div className="p-2.5 bg-primary-fixed/30 rounded-xl flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-1.5 text-primary">
                  <Clock size={14} />
                  <span>Meet: {meetupTime || time}</span>
                </div>
                {isTicketedEvent && showtime && (
                  <div className="text-secondary font-headline font-black">
                    Show: {showtime}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-xs font-bold text-text-medium">
                <span className="badge bg-secondary-container text-on-secondary-container text-[10px]">
                  {category}
                </span>
                <span>{date}</span>
              </div>

              <div className="text-xs text-text-medium flex items-center gap-1.5">
                <MapPin size={13} className="text-primary shrink-0" />
                <span className="line-clamp-1 font-semibold">{location || 'Downtown Venue'}</span>
              </div>

              {meetupLocation && (
                <div className="text-[11px] text-text-light flex items-center gap-1 line-clamp-1">
                  <span className="font-bold text-primary">Meetup Spot:</span> {meetupLocation}
                </div>
              )}

              {ticketSectionInfo && (
                <div className="text-[11px] text-secondary flex items-center gap-1 line-clamp-1 font-bold">
                  <Ticket size={12} /> {ticketSectionInfo}
                </div>
              )}

              <p className="text-xs text-text-light line-clamp-2 mt-0.5">
                {vibe || 'Low stakes, high fun. Come through and meet the crew!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="floating-bar">
        <div className="floating-bar-inner">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s: number) => (s - 1) as 1 | 2 | 3)}
              className="btn btn-ghost flex items-center gap-1 font-bold text-text-dark px-4 py-3 cursor-pointer"
            >
              <ChevronLeft size={18} /> Back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-ghost text-text-medium font-bold px-4 py-3 cursor-pointer"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s: number) => (s + 1) as 1 | 2 | 3)}
              className="btn btn-primary flex-1 flex items-center justify-center gap-2 py-3.5 cursor-pointer"
            >
              Next Step <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              className="btn btn-primary flex-1 flex items-center justify-center gap-2 py-3.5 cursor-pointer shadow-neon"
            >
              Publish Event <Rocket size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
