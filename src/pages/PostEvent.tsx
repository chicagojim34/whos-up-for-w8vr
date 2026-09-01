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
  ChevronLeft
} from 'lucide-react';
import cx from 'classnames';
import { useApp } from '../context/AppContext';
import { CATEGORY_DEFINITIONS, type EventCategory } from '../components/CategoryChip';

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
  
  // Step 1: The Basics
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('Active');
  const [coverImage, setCoverImage] = useState(COVER_OPTIONS[0].url);
  const [vibe, setVibe] = useState('');

  // Step 2: When & Where
  const [date, setDate] = useState('Tomorrow');
  const [time, setTime] = useState('8:00 PM');
  const [locationType, setLocationType] = useState<'physical' | 'virtual'>('physical');
  const [location, setLocation] = useState('The Glass House Rooftop');
  const [virtualLink, setVirtualLink] = useState('');

  // Step 3: Logistics & Privacy
  const [capacity, setCapacity] = useState(12);
  const [autoWaitlist, setAutoWaitlist] = useState(true);
  const [privacy, setPrivacy] = useState<'public' | 'circle' | 'hidden'>('public');

  const handleCreate = () => {
    if (!title.trim()) {
      setStep(1);
      return;
    }

    const newEvent = createEvent({
      title: title.trim(),
      category,
      image: coverImage,
      vibe: vibe.trim() || 'Join us for this curated gathering on W8VR!',
      date,
      time,
      timeLabel: `${time} ${date}`,
      location: locationType === 'physical' ? (location.trim() || 'Downtown') : 'Online / Virtual Hub',
      isVirtual: locationType === 'virtual',
      virtualLink: locationType === 'virtual' ? virtualLink.trim() : undefined,
      maxSpots: capacity,
      privacy,
      description: vibe.trim() || `${category} gathering organized by You.`,
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
            {step === 1 ? 'THE BASICS' : step === 2 ? 'WHEN & WHERE' : 'LOGISTICS & PRIVACY'}
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
          {/* STEP 1: The Basics */}
          {step === 1 && (
            <div className="flex-col gap-6 animate-slide-up">
              <div>
                <h1 className="font-headline font-extrabold text-2xl text-text-dark">What's the vibe?</h1>
                <p className="text-sm text-text-medium mt-1">Give your event a punchy name and category.</p>
              </div>

              {/* Event Title */}
              <div>
                <label className="text-xs font-bold text-text-dark mb-1.5 block">EVENT TITLE *</label>
                <input
                  type="text"
                  placeholder="e.g., Midnight Padel Tournament"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="input-field font-headline font-bold text-lg"
                  autoFocus
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="text-xs font-bold text-text-dark mb-2 block">SELECT CATEGORY (7 Taxonomies)</label>
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
                          'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95',
                          isSelected
                            ? 'bg-primary text-white shadow-md shadow-primary/30'
                            : 'bg-surface-low text-text-medium hover:bg-surface-high'
                        )}
                      >
                        <Icon size={14} />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cover Photo Preset */}
              <div>
                <label className="text-xs font-bold text-text-dark mb-2 block">CHOOSE COVER AESTHETIC</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {COVER_OPTIONS.map(opt => (
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

              {/* Description / Vibe */}
              <div>
                <label className="text-xs font-bold text-text-dark mb-1.5 block">THE VIBE & DETAILS</label>
                <textarea
                  rows={3}
                  placeholder="What should guests expect? Any dress code or prep needed?"
                  value={vibe}
                  onChange={e => setVibe(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
            </div>
          )}

          {/* STEP 2: When & Where */}
          {step === 2 && (
            <div className="flex-col gap-6 animate-slide-up">
              <div>
                <h1 className="font-headline font-extrabold text-2xl text-text-dark">When & Where?</h1>
                <p className="text-sm text-text-medium mt-1">Set the schedule and choose venue or virtual link.</p>
              </div>

              {/* Date & Time Bento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-text-dark mb-1.5 block">DATE</label>
                  <div className="flex items-center bg-surface-low rounded-xl px-3 py-2.5 gap-2">
                    <Calendar size={18} className="text-primary" />
                    <input
                      type="text"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      placeholder="e.g. Sat, Oct 25"
                      className="bg-transparent border-none outline-none font-bold text-sm text-text-dark w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-dark mb-1.5 block">START TIME</label>
                  <div className="flex items-center bg-surface-low rounded-xl px-3 py-2.5 gap-2">
                    <Clock size={18} className="text-primary" />
                    <input
                      type="text"
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      placeholder="e.g. 8:00 PM"
                      className="bg-transparent border-none outline-none font-bold text-sm text-text-dark w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Location Type Switcher */}
              <div>
                <label className="text-xs font-bold text-text-dark mb-1.5 block">LOCATION TYPE</label>
                <div className="flex bg-surface-low p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setLocationType('physical')}
                    className={cx('flex-1 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all', {
                      'bg-surface-lowest shadow-sm text-primary': locationType === 'physical',
                      'text-text-medium hover:text-text-dark': locationType !== 'physical',
                    })}
                  >
                    <MapPin size={15} /> Physical Venue
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationType('virtual')}
                    className={cx('flex-1 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all', {
                      'bg-surface-lowest shadow-sm text-primary': locationType === 'virtual',
                      'text-text-medium hover:text-text-dark': locationType !== 'virtual',
                    })}
                  >
                    <LinkIcon size={15} /> Virtual / Link
                  </button>
                </div>
              </div>

              {/* Venue Search / Virtual Input */}
              {locationType === 'physical' ? (
                <div>
                  <label className="text-xs font-bold text-text-dark mb-1.5 block">VENUE OR ADDRESS</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" size={18} />
                    <input
                      type="text"
                      placeholder="Search venue or address..."
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      className="input-field pl-11 text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-text-dark mb-1.5 block">VIRTUAL LINK / ROOM</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" size={18} />
                    <input
                      type="text"
                      placeholder="https://zoom.us/j/... or Google Meet"
                      value={virtualLink}
                      onChange={e => setVirtualLink(e.target.value)}
                      className="input-field pl-11 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Logistics & Privacy */}
          {step === 3 && (
            <div className="flex-col gap-6 animate-slide-up">
              <div>
                <h1 className="font-headline font-extrabold text-2xl text-text-dark">Logistics & Privacy</h1>
                <p className="text-sm text-text-medium mt-1">Configure attendee capacity, waitlist, and audience access.</p>
              </div>

              {/* Maximum Capacity Control */}
              <div className="p-5 bg-surface-low rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-headline font-bold text-base text-text-dark">Maximum Capacity</h4>
                  <p className="text-xs text-text-medium">Limit how many people can join the event</p>
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
                    <p className="text-xs text-text-medium">Automatically promote waitlisted users when spots open</p>
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
            <div className="relative h-48 bg-black">
              <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

              <div className="absolute top-3 right-3 glass-panel badge text-[10px] font-bold text-white">
                0.1 MI AWAY
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
                <span className="absolute text-[9px] font-headline font-black text-primary">0/{capacity}</span>
              </div>

              <div className="absolute bottom-3 left-4 right-4 text-white">
                <span className="badge bg-white/20 backdrop-blur-md text-[9px] uppercase font-bold text-white mb-1.5 py-0.5 px-2">
                  {privacy === 'public' ? 'Public Event' : privacy === 'circle' ? 'Circle Only' : 'Hidden Link'}
                </span>
                <h3 className="font-headline font-black text-lg leading-tight text-white line-clamp-1">
                  {title || 'Midnight Padel Tournament'}
                </h3>
              </div>
            </div>

            <div className="p-5 pt-6 flex-col gap-3">
              <div className="flex justify-between items-center text-xs font-bold text-text-medium">
                <span className="badge bg-secondary-container text-on-secondary-container text-[10px]">
                  {category}
                </span>
                <span>{time} • {date}</span>
              </div>

              <div className="text-xs text-text-medium flex items-center gap-1.5">
                <MapPin size={13} className="text-primary shrink-0" />
                <span className="line-clamp-1">{locationType === 'physical' ? location : 'Virtual Session'}</span>
              </div>

              <p className="text-xs text-text-light line-clamp-2 mt-1">
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
              className="btn btn-ghost flex items-center gap-1 font-bold text-text-dark px-4 py-3"
            >
              <ChevronLeft size={18} /> Back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-ghost text-text-medium font-bold px-4 py-3"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s: number) => (s + 1) as 1 | 2 | 3)}
              className="btn btn-primary flex-1 flex items-center justify-center gap-2 py-3.5"
            >
              Next Step <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              className="btn btn-primary flex-1 flex items-center justify-center gap-2 py-3.5"
            >
              Publish Event <Rocket size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
