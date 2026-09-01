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
} from 'lucide-react';
import cx from 'classnames';
import { useApp } from '../hooks/useApp';
import { useToast } from '../hooks/useToast';
import { SELECTABLE_CATEGORIES, type EventCategory } from '../lib/categories';
import { StatusRing } from '../components/StatusRing';
import { formatWhen } from '../lib/datetime';

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

  // Step 1
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('Active');
  const [coverImage, setCoverImage] = useState(COVER_OPTIONS[0].url);
  const [vibe, setVibe] = useState('');

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

  const joinedCircles = circles.filter(c => c.isJoined);
  const startsAt = useMemo(() => new Date(`${date}T${time}`).toISOString(), [date, time]);
  const validStart = !Number.isNaN(new Date(`${date}T${time}`).getTime());

  const stepErrors: Record<number, string | null> = {
    1: title.trim() ? null : 'Give the event a name first.',
    2: !validStart
      ? 'Pick a date and a start time.'
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
      location:
        locationType === 'physical' ? location.trim() : 'Online — link shared on RSVP',
      exactAddress: locationType === 'physical' ? exactAddress.trim() || undefined : undefined,
      isVirtual: locationType === 'virtual',
      virtualLink: locationType === 'virtual' ? virtualLink.trim() : undefined,
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

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Form */}
        <form
          className="md:col-span-7 flex flex-col gap-6"
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

              <fieldset className="border-0 p-0 m-0">
                <legend className="text-xs font-bold text-text-dark mb-2">Cover</legend>
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
        <aside className="md:col-span-5 flex flex-col gap-3">
          <p className="text-xs font-headline font-bold text-text-light uppercase tracking-wider flex items-center gap-1.5">
            <ImageIcon size={14} className="text-primary" aria-hidden="true" /> Live preview
          </p>

          <div className="card p-0 overflow-hidden md:sticky md:top-24">
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
      <div className="floating-bar">
        <div className="floating-bar-inner">
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
      </div>
    </div>
  );
}
