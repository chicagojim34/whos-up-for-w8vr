import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  CheckCircle2,
  Send,
  Lock,
  Globe,
  EyeOff,
  ChevronLeft,
  MessageSquare,
  Radio,
  Flag,
  Users,
  Sparkles,
  Share2,
  ExternalLink,
  ShieldOff,
  Video,
  Clock,
  Copy,
  Ticket,
} from 'lucide-react';
import cx from 'classnames';
import { useApp } from '../hooks/useApp';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { StatusRing } from '../components/StatusRing';
import { GlassModal } from '../components/GlassModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ShareSheet } from '../components/ShareSheet';
import { FloatingBar } from '../components/FloatingBar';
import { Avatar } from '../components/Avatar';
import { GameMark, GameModeChip, PlatformList } from '../components/GameBadge';
import { JOIN_LABEL, MODE_LABEL, findGame, playersInCircle } from '../lib/games';
import NotFound from './NotFound';
import { ME, type BroadcastTarget, type RsvpStatus } from '../types';
import {
  attendeesWith,
  canSeeExactAddress,
  capacityPct,
  confirmedCount,
  displayAddress,
  isFull,
  isHosting,
  maybeCount,
  myRsvp,
  spotsLeft,
  waitlistCount,
  waitlistQueue,
} from '../lib/events';
import { formatAgo, formatDistance, formatWhen, formatTime } from '../lib/datetime';

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or commercial advertisement' },
  { value: 'inappropriate', label: 'Inappropriate or unsafe content' },
  { value: 'fake', label: 'Fake or misleading event' },
  { value: 'harassment', label: 'Harassment or exclusionary behaviour' },
];

const ROSTER_TABS: { key: RsvpStatus; label: string }[] = [
  { key: 'going', label: 'Confirmed' },
  { key: 'maybe', label: 'Maybe' },
  { key: 'waitlist', label: 'Waitlist' },
];

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { findEvent, findCircle, user, rsvpEvent, addComment, sendHostBroadcast, reportEvent, blockUser } =
    useApp();
  const toast = useToast();
  const confirm = useConfirm();

  const event = findEvent(id);

  const [commentText, setCommentText] = useState('');
  const [rosterOpen, setRosterOpen] = useState(false);
  const [rosterTab, setRosterTab] = useState<RsvpStatus>('going');
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<BroadcastTarget>('all');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportNote, setReportNote] = useState('');
  const [shareOpen, setShareOpen] = useState(false);

  const roster = useMemo(() => {
    if (!event) return [];
    const list = rosterTab === 'waitlist' ? waitlistQueue(event) : attendeesWith(event, rosterTab);
    return [...list].sort((a, b) =>
      a.id === ME ? -1 : b.id === ME ? 1 : a.name.localeCompare(b.name)
    );
  }, [event, rosterTab]);

  // A stale deep link should say so, not silently show a different event.
  if (!event) {
    return (
      <NotFound
        title="That event is not here"
        body="The link may have expired, the host may have removed it, or it belongs to a circle you are not in."
      />
    );
  }

  const mine = myRsvp(event);
  const host = isHosting(event);
  const capacity = capacityPct(event);
  const left = spotsLeft(event);
  const full = isFull(event);
  const going = confirmedCount(event);
  const eventUrl = `${window.location.origin}/event/${event.id}`;
  const addressVisible = canSeeExactAddress(event);
  const game = findGame(event.game?.gameId);
  const eventCircle = findCircle(event.circleId);
  const gamePlayers =
    game && eventCircle ? playersInCircle(eventCircle, game.id, ME) : [];

  const counts: Record<RsvpStatus, number> = {
    going,
    maybe: maybeCount(event),
    waitlist: waitlistCount(event),
    declined: 0,
  };

  const handleRsvp = (intent: 'going' | 'maybe' | 'no') => {
    const outcome = rsvpEvent(event.id, intent);
    if (outcome.blocked) {
      toast.show('This event is full and the host closed the waitlist', 'warning');
    } else if (outcome.waitlisted) {
      toast.show(`You are #${counts.waitlist + 1} on the waitlist`, 'info');
    } else if (outcome.status === 'going') {
      toast.show('You are going — the address is now unlocked');
    } else if (outcome.status === 'declined') {
      toast.show('Muted. No more updates for this one.', 'info');
    } else if (outcome.status === 'maybe') {
      toast.show('Marked as maybe');
    }
    if (outcome.promoted) {
      toast.show(`${outcome.promoted} moved off the waitlist into your spot`, 'info');
    }
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    addComment(event.id, commentText);
    setCommentText('');
  };

  const handleSendBroadcast = () => {
    if (!broadcastMessage.trim()) return;
    const reached = sendHostBroadcast(event.id, broadcastMessage, broadcastTarget);
    setBroadcastMessage('');
    setBroadcastOpen(false);
    toast.show(`Update sent to ${reached} ${reached === 1 ? 'person' : 'people'}`);
  };

  const handleReport = () => {
    if (!reportReason) return;
    reportEvent(event.id, reportReason, reportNote);
    setReportOpen(false);
    setReportReason('');
    setReportNote('');
    toast.show('Report sent to the safety team');
  };

  const handleBlockHost = async () => {
    const ok = await confirm.ask({
      title: `Block ${event.hostName}?`,
      body: 'You will stop seeing their events and messages everywhere in W8VR. You can undo this in Settings.',
      confirmLabel: 'Block',
      tone: 'danger',
    });
    if (!ok) return;
    blockUser(event.hostId, event.hostName);
    toast.show(`${event.hostName} blocked`, 'info');
    navigate('/');
  };

  const broadcastReach =
    broadcastTarget === 'going'
      ? counts.going
      : broadcastTarget === 'waitlist'
        ? counts.waitlist
        : event.attendees.filter(a => a.status !== 'declined').length;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    displayAddress(event)
  )}`;

  return (
    <div className="flex flex-col pb-[210px] min-h-screen bg-surface animate-fade-in">
      {/* Hero */}
      <header className="hero-header">
        <img src={event.image} className="img-full" alt="" />

        <div className="hero-overlay">
          <div className="flex justify-between items-center w-full">
            <button onClick={() => navigate(-1)} className="back-btn-float" aria-label="Go back">
              <ChevronLeft size={24} strokeWidth={2.5} aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShareOpen(true)}
                className="back-btn-float"
                aria-label="Share this event"
              >
                <Share2 size={20} aria-hidden="true" />
              </button>
              {!host && (
                <>
                  <button
                    onClick={() => setReportOpen(true)}
                    className="back-btn-float"
                    aria-label="Report this event"
                  >
                    <Flag size={18} aria-hidden="true" />
                  </button>
                  <button
                    onClick={handleBlockHost}
                    className="back-btn-float"
                    aria-label={`Block ${event.hostName}`}
                  >
                    <ShieldOff size={18} aria-hidden="true" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="text-white">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="badge bg-white/20 backdrop-blur-md text-[10px] uppercase font-bold text-white tracking-widest px-3">
                {event.category}
              </span>
              <span className="badge bg-surface-lowest/95 text-[10px] uppercase font-bold text-text-dark tracking-widest px-3 flex items-center gap-1.5">
                {event.privacy === 'public' && (
                  <>
                    <Globe size={11} aria-hidden="true" /> Public event
                  </>
                )}
                {event.privacy === 'circle' && (
                  <>
                    <Lock size={11} aria-hidden="true" /> Circle only
                  </>
                )}
                {event.privacy === 'hidden' && (
                  <>
                    <EyeOff size={11} aria-hidden="true" /> Invite link only
                  </>
                )}
              </span>
            </div>

            {/* DESIGN.md reserves the display scale for event titles. */}
            <h1 className="text-display-sm font-headline font-black text-white drop-shadow-md text-balance">
              {event.title}
            </h1>

            {event.performerOrTeam && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white font-headline font-bold text-xs">
                <span>⭐ Headline: {event.performerOrTeam}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 text-xs opacity-95 font-semibold text-white">
              <span className="flex items-center gap-1.5">
                <Calendar size={15} className="text-primary-fixed" aria-hidden="true" />
                <time dateTime={event.startsAt}>{formatWhen(event.startsAt)}</time>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={15} className="text-primary-fixed" aria-hidden="true" />
                {event.location}
              </span>
              <span>Hosted by {host ? 'you' : event.hostName}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 mt-6 relative z-30 flex flex-col gap-8 max-w-4xl mx-auto w-full">
        {/* Host controls */}
        {host && (
          <section className="bg-primary-fixed rounded-2xl p-4 flex flex-wrap justify-between items-center gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                <Radio size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-headline font-bold text-sm text-text-dark">
                  You are hosting this
                </h2>
                <p className="text-xs text-text-medium">
                  Send an update to a specific group of guests
                </p>
              </div>
            </div>
            <button
              onClick={() => setBroadcastOpen(true)}
              className="btn btn-primary text-xs py-2 px-4"
            >
              Send update
            </button>
          </section>
        )}

        {/* Dual-Time Outing Schedule Matrix */}
        {(event.showtime || event.meetupTime || event.isTicketedEvent) && (
          <section className="bg-surface-lowest rounded-3xl p-6 shadow-sm border border-primary/15">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full" aria-hidden="true" />
                <h2 className="text-xl font-headline font-bold text-text-dark">Outing Schedule</h2>
              </div>
              <span className="badge bg-secondary-container text-on-secondary-container text-xs font-bold">
                Dual-Time Sync
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Step 1: Meetup */}
              <div className="p-4 bg-primary-fixed/30 rounded-2xl border border-primary/20">
                <div className="text-[10px] font-headline font-black text-primary uppercase tracking-widest">
                  STAGE 1 • PRE-EVENT MEETUP
                </div>
                <div className="font-headline font-black text-2xl text-primary mt-1">
                  {event.meetupTime || formatTime(event.startsAt)}
                </div>
                <div className="text-xs font-bold text-text-dark mt-1 flex items-center gap-1">
                  <MapPin size={13} className="text-primary shrink-0" />
                  <span>{event.meetupLocation || 'Nearby Gathering Spot'}</span>
                </div>
                <div className="text-[11px] text-text-medium mt-1">
                  Meet circle here for pre-drinks & food before entering.
                </div>
              </div>

              {/* Step 2: Doors */}
              <div className="p-4 bg-surface-low rounded-2xl border border-gray-100">
                <div className="text-[10px] font-headline font-bold text-text-light uppercase tracking-widest">
                  STAGE 2 • DOORS OPEN
                </div>
                <div className="font-headline font-black text-2xl text-text-dark mt-1">
                  {event.doorsTime || '1h before show'}
                </div>
                <div className="text-xs font-bold text-text-dark mt-1">
                  {event.location}
                </div>
                <div className="text-[11px] text-text-medium mt-1">
                  Venue security checkpoints & gates open.
                </div>
              </div>

              {/* Step 3: Showtime */}
              <div className="p-4 bg-surface-low rounded-2xl border border-gray-100">
                <div className="text-[10px] font-headline font-bold text-secondary uppercase tracking-widest">
                  STAGE 3 • SHOWTIME / KICKOFF
                </div>
                <div className="font-headline font-black text-2xl text-secondary mt-1">
                  {event.showtime || formatTime(event.startsAt)}
                </div>
                <div className="text-xs font-bold text-text-dark mt-1">
                  Main Event on Stage
                </div>
                <div className="text-[11px] text-text-medium mt-1">
                  {event.performerOrTeam ? `${event.performerOrTeam} begins` : 'Event begins promptly'}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Ticket & Seating Coordination Card */}
        {(event.ticketUrl || event.ticketSectionInfo || event.isTicketedEvent) && (
          <section className="bg-surface-lowest rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-6 bg-secondary rounded-full" aria-hidden="true" />
                <h2 className="text-xl font-headline font-bold text-text-dark">Tickets & Seating</h2>
              </div>
              {event.priceRange && (
                <span className="badge bg-surface-high font-bold text-xs text-text-dark">
                  {event.priceRange}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {event.ticketSectionInfo && (
                <div className="p-4 bg-surface-low rounded-2xl">
                  <span className="text-[10px] font-headline font-bold text-text-light uppercase tracking-wider block mb-1">
                    TARGET GROUP SEATING SECTION
                  </span>
                  <div className="font-headline font-bold text-base text-text-dark flex items-center gap-1.5">
                    <Ticket size={16} className="text-primary" />
                    <span>{event.ticketSectionInfo}</span>
                  </div>
                  <div className="text-[11px] text-text-medium mt-1">
                    Coordinate your seat purchases here so the circle sits together!
                  </div>
                </div>
              )}

              {event.ticketUrl && (
                <div className="p-4 bg-primary-fixed/20 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-headline font-bold text-primary uppercase tracking-wider block mb-1">
                      OFFICIAL TICKETS
                    </span>
                    <div className="text-xs text-text-medium mb-3">
                      Purchase through official vendor or resale portal.
                    </div>
                  </div>
                  <a
                    href={event.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary text-xs py-2.5 px-4 flex items-center justify-center gap-2"
                  >
                    <span>Buy Official Tickets</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>

            {(event.bagPolicy || event.ageRestriction) && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 text-xs text-text-medium">
                {event.bagPolicy && (
                  <span className="badge bg-surface-low text-text-dark text-xs py-1 px-2.5">
                    🎒 Bag Policy: {event.bagPolicy}
                  </span>
                )}
                {event.ageRestriction && (
                  <span className="badge bg-surface-low text-text-dark text-xs py-1 px-2.5">
                    🔞 Age: {event.ageRestriction}
                  </span>
                )}
              </div>
            )}
          </section>
        )}

        {/* The vibe */}
        <section className="bg-surface-lowest rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-6 bg-primary rounded-full" aria-hidden="true" />
            <h2 className="text-xl font-headline font-bold text-text-dark">The vibe</h2>
          </div>
          <p className="text-text-medium leading-relaxed text-sm">{event.vibe}</p>
        </section>

        {/* Capacity & response dashboard */}
        <section className="grid grid-cols-1 @2xl:grid-cols-12 gap-4">
          <h2 className="sr-only-text">Responses</h2>

          <div className="@2xl:col-span-5 bg-surface-lowest p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
            <StatusRing
              capacity={capacity}
              size={120}
              strokeWidth={9}
              label={full ? 'FULL' : String(left)}
              srLabel={`${going} of ${event.maxSpots} spots taken`}
              variant="bare"
            />
            <p className="text-[11px] font-headline font-bold text-text-light tracking-widest uppercase mt-3">
              {full ? 'No spots left' : left === 1 ? 'Spot left' : 'Spots left'}
            </p>
            <p className="text-xs font-semibold text-text-medium mt-1">
              {capacity}% full ({going}/{event.maxSpots})
            </p>
            {event.autoWaitlist && full && (
              <p className="text-[11px] text-text-light mt-2">
                Waitlist is open — freed spots are filled automatically
              </p>
            )}
          </div>

          <div className="@2xl:col-span-7 grid grid-cols-2 gap-3">
            {ROSTER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setRosterTab(tab.key);
                  setRosterOpen(true);
                }}
                className={cx(
                  'p-4 rounded-2xl flex flex-col justify-between text-left transition-all group',
                  tab.key === 'waitlist'
                    ? 'bg-error-container hover:brightness-95'
                    : 'bg-surface-low hover:bg-surface-high'
                )}
              >
                <span className="flex justify-between items-center gap-2">
                  <span
                    className={cx(
                      'text-[10px] font-bold uppercase tracking-wider',
                      tab.key === 'waitlist' ? 'text-error' : 'text-text-light'
                    )}
                  >
                    {tab.label}
                  </span>
                  <Users
                    size={14}
                    className={cx(
                      'opacity-0 group-hover:opacity-100 transition-opacity',
                      tab.key === 'waitlist' ? 'text-error' : 'text-primary'
                    )}
                    aria-hidden="true"
                  />
                </span>
                <span
                  className={cx(
                    'text-3xl font-headline font-black mt-2 tabular-nums',
                    tab.key === 'going'
                      ? 'text-primary'
                      : tab.key === 'waitlist'
                        ? 'text-error'
                        : 'text-text-medium'
                  )}
                >
                  {counts[tab.key]}
                </span>
              </button>
            ))}

            <div className="bg-surface-low p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">
                Interested
              </span>
              <span className="text-3xl font-headline font-black text-text-dark mt-2 tabular-nums">
                {event.interested}
              </span>
            </div>
          </div>
        </section>

        {/* The game */}
        {game && (
          <section className="bg-surface-lowest rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <GameMark game={game} size={48} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-headline font-bold text-lg text-text-dark">{game.name}</h2>
                  <GameModeChip label={MODE_LABEL[game.mode]} />
                </div>
                <p className="text-xs text-text-medium mt-0.5">
                  {game.publisher} · {game.players}
                </p>
                <PlatformList game={game} className="mt-1.5" />
              </div>
            </div>

            <p className="text-sm text-text-medium leading-relaxed">{game.blurb}</p>

            <p className="text-xs text-text-medium p-3 bg-surface-low rounded-xl">
              <span className="font-bold text-text-dark">{JOIN_LABEL[game.joinBy]}.</span>
              {game.caveat && <span className="block mt-1">{game.caveat}</span>}
            </p>

            {event.game?.roomCode && (
              <div className="flex items-center justify-between gap-3 p-3 bg-primary-fixed rounded-xl">
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold text-primary-container uppercase tracking-wider">
                    Room code
                  </span>
                  <span className="block font-mono font-black text-2xl text-text-dark tracking-[0.2em]">
                    {event.game.roomCode}
                  </span>
                </span>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(event.game!.roomCode!);
                      toast.show('Room code copied');
                    } catch {
                      toast.show('Could not copy — read it off the screen', 'warning');
                    }
                  }}
                  className="btn btn-secondary text-xs py-2 px-3 shrink-0 flex items-center gap-1.5"
                >
                  <Copy size={13} aria-hidden="true" /> Copy
                </button>
              </div>
            )}

            {gamePlayers.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-text-medium mb-2">
                  Usernames from this circle
                </h3>
                <ul className="flex flex-col gap-2 list-none">
                  {gamePlayers.map(person => (
                    <li
                      key={person.id}
                      className="flex items-center gap-3 p-2 bg-surface-low rounded-xl"
                    >
                      <Avatar name={person.name} size={28} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-xs text-text-dark truncate">
                          {person.name}
                        </span>
                        <span className="block font-mono text-[11px] text-text-medium truncate">
                          {person.handle}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <a
                href={event.game?.inviteUrl || game.url}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-primary flex-1 min-w-40 py-3 flex items-center justify-center gap-2"
              >
                <ExternalLink size={15} aria-hidden="true" />
                {event.game?.inviteUrl ? 'Join the table' : `Open ${game.name}`}
              </a>
              {game.handleLabel && !user.gameHandles[game.id] && (
                <Link to="/settings" className="btn btn-secondary py-3 px-4 text-sm">
                  Add your username
                </Link>
              )}
            </div>

            <p className="text-[11px] text-text-light text-center">
              Opens the app if you have it installed, the website if not.
            </p>
          </section>
        )}

        {/* Location */}
        <section className="bg-surface-lowest rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center gap-3">
            <h2 className="font-headline font-bold text-lg text-text-dark">Where</h2>
            {addressVisible && !event.isVirtual && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
              >
                <ExternalLink size={14} aria-hidden="true" /> Open in Maps
              </a>
            )}
          </div>

          <div className="p-4 bg-surface-low rounded-xl flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary-container shrink-0">
              {event.isVirtual ? (
                <Video size={20} aria-hidden="true" />
              ) : (
                <MapPin size={20} aria-hidden="true" />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-text-dark">{displayAddress(event)}</p>
              <p className="text-xs text-text-light">
                {event.isVirtual
                  ? 'Virtual — the room link appears here once you RSVP yes'
                  : addressVisible
                    ? formatDistance(event.distanceMi)
                    : `${formatDistance(event.distanceMi)} • exact address unlocks when you RSVP yes`}
              </p>
            </div>
            {!addressVisible && (
              <Lock size={16} className="text-text-light shrink-0" aria-hidden="true" />
            )}
          </div>

          {event.isVirtual && event.virtualLink && mine === 'going' && (
            <a
              href={event.virtualLink}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-secondary w-full py-3"
            >
              Join the room
            </a>
          )}
        </section>

        {/* Coordination thread */}
        <section className="thread-container">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={20} className="text-primary" aria-hidden="true" />
            <h2 className="font-headline font-bold text-lg text-text-dark">Coordination thread</h2>
            <span className="text-xs font-bold text-text-light ml-auto">
              {event.comments.length} {event.comments.length === 1 ? 'update' : 'updates'}
            </span>
          </div>

          <p className="text-xs text-text-light mb-4">
            Logistics only — for a longer conversation,{' '}
            <a
              href={`sms:&body=${encodeURIComponent(`${event.title} — ${eventUrl}`)}`}
              className="text-primary font-semibold hover:underline"
            >
              take it to Messages
            </a>
            .
          </p>

          <ol className="flex flex-col gap-4 list-none">
            {event.comments.map(msg => {
              const isMe = msg.authorId === ME;
              return (
                <li key={msg.id} className={cx('flex gap-3', { 'flex-row-reverse': isMe })}>
                  <Avatar name={msg.author} size={32} />
                  <div className={cx('flex flex-col min-w-0', { 'items-end': isMe })}>
                    <div
                      className={cx('message-bubble', {
                        sent: isMe && !msg.isHost,
                        host: msg.isHost,
                        received: !isMe && !msg.isHost,
                      })}
                    >
                      <span
                        className={cx('font-bold text-[10px] block mb-1 uppercase tracking-tight', {
                          'text-primary font-black': msg.isHost,
                          'text-white/80': isMe && !msg.isHost,
                          'text-text-medium': !isMe && !msg.isHost,
                        })}
                      >
                        {isMe ? 'You' : msg.author}
                        {msg.isHost && ' · Host'}
                        {msg.broadcastTo &&
                          ` · blast to ${msg.broadcastTo === 'all' ? 'everyone' : msg.broadcastTo}`}
                      </span>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-text-light font-medium mt-1 px-1">
                      {formatAgo(msg.createdAt)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>

          <form
            className="thread-input-wrapper"
            onSubmit={e => {
              e.preventDefault();
              handleSendComment();
            }}
          >
            <label htmlFor="thread-input" className="sr-only-text">
              Ask a question about logistics
            </label>
            <input
              id="thread-input"
              type="text"
              placeholder="Ask a logistics question…"
              className="thread-input"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
            />
            <button
              type="submit"
              className="thread-send-btn"
              disabled={!commentText.trim()}
              aria-label="Post message"
            >
              <Send size={16} aria-hidden="true" />
            </button>
          </form>
        </section>
      </div>

      {/* Sticky RSVP bar */}
      <FloatingBar aboveNav>
          <div className="rsvp-bar" role="group" aria-label="Your RSVP">
            <button
              onClick={() => handleRsvp('going')}
              className={cx('rsvp-btn', {
                'active-going': mine === 'going' || mine === 'waitlist',
              })}
              aria-pressed={mine === 'going' || mine === 'waitlist'}
            >
              {mine === 'going' ? (
                <>
                  <CheckCircle2 size={16} className="inline mr-1 mb-0.5" aria-hidden="true" /> Going
                </>
              ) : mine === 'waitlist' ? (
                <>
                  <Clock size={16} className="inline mr-1 mb-0.5" aria-hidden="true" /> Waitlisted
                </>
              ) : full && event.autoWaitlist ? (
                <>
                  <Sparkles size={16} className="inline mr-1 mb-0.5" aria-hidden="true" /> Join
                  waitlist
                </>
              ) : (
                'Going'
              )}
            </button>
            <button
              onClick={() => handleRsvp('maybe')}
              className={cx('rsvp-btn', { 'active-maybe': mine === 'maybe' })}
              aria-pressed={mine === 'maybe'}
            >
              Maybe
            </button>
            <button
              onClick={() => handleRsvp('no')}
              className={cx('rsvp-btn', { 'active-no': mine === 'declined' })}
              aria-pressed={mine === 'declined'}
            >
              No
            </button>
          </div>

          <p
            className="text-center text-[10px] font-black tracking-[0.18em] uppercase"
            role="status"
          >
            {mine === 'going' && (
              <span className="text-secondary flex items-center justify-center gap-1.5">
                <span
                  className="w-2 h-2 bg-secondary rounded-full animate-pulse"
                  aria-hidden="true"
                />
                Confirmed — see you there
              </span>
            )}
            {mine === 'waitlist' && (
              <span className="text-primary flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" aria-hidden="true" />
                On the waitlist — we will tell you if a spot opens
              </span>
            )}
            {mine === 'declined' && <span className="text-text-light">Muted for you</span>}
          </p>
      </FloatingBar>

      {/* Guest list */}
      <GlassModal
        isOpen={rosterOpen}
        onClose={() => setRosterOpen(false)}
        title="Who's coming"
        subtitle={`${event.title} • ${going} confirmed`}
        maxWidth="lg"
      >
        <div className="flex gap-2 mb-4" role="tablist" aria-label="RSVP groups">
          {ROSTER_TABS.map(tab => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={rosterTab === tab.key}
              onClick={() => setRosterTab(tab.key)}
              className={cx('px-4 py-1.5 rounded-full text-xs font-bold transition-all', {
                'bg-primary text-white': rosterTab === tab.key,
                'bg-surface-high text-text-medium': rosterTab !== tab.key,
              })}
            >
              {tab.label} ({counts[tab.key]})
            </button>
          ))}
        </div>

        <ol className="flex flex-col gap-2 max-h-[45vh] overflow-y-auto list-none pr-1">
          {roster.map((person, index) => (
            <li key={person.id} className="flex items-center gap-3 p-2 bg-surface-low rounded-xl">
              {rosterTab === 'waitlist' && (
                <span className="w-6 text-center text-xs font-headline font-black text-text-light tabular-nums">
                  {index + 1}
                </span>
              )}
              <Avatar name={person.name} size={32} />
              <span className="font-bold text-sm text-text-dark truncate">
                {person.id === ME ? 'You' : person.name}
              </span>
              {person.id === event.hostId && (
                <span className="badge bg-primary-fixed text-primary-container text-[9px] py-0 px-2 ml-auto">
                  HOST
                </span>
              )}
            </li>
          ))}
          {roster.length === 0 && (
            <li className="text-center py-8 text-sm text-text-light">
              {rosterTab === 'waitlist'
                ? 'Nobody is waiting — there is still room.'
                : `No ${ROSTER_TABS.find(t => t.key === rosterTab)?.label.toLowerCase()} responses yet.`}
            </li>
          )}
        </ol>
      </GlassModal>

      {/* Host broadcast */}
      <GlassModal
        isOpen={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        title="Send an update"
        subtitle="Reaches only the group you pick"
      >
        <div className="flex flex-col gap-4">
          <fieldset className="border-0 p-0 m-0">
            <legend className="text-xs font-bold text-text-medium mb-2">Who gets this</legend>
            <div className="flex gap-2">
              {(
                [
                  ['all', 'Everyone invited'],
                  ['going', 'Confirmed only'],
                  ['waitlist', 'Waitlist only'],
                ] as [BroadcastTarget, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setBroadcastTarget(key)}
                  aria-pressed={broadcastTarget === key}
                  className={cx(
                    'flex-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-colors',
                    {
                      'bg-primary text-white': broadcastTarget === key,
                      'bg-surface-high text-text-medium': broadcastTarget !== key,
                    }
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label
              htmlFor="broadcast-message"
              className="text-xs font-bold text-text-medium mb-1 block"
            >
              Message
            </label>
            <textarea
              id="broadcast-message"
              rows={3}
              placeholder="e.g. Moving to the second floor terrace — grab a seat near the lounge."
              value={broadcastMessage}
              onChange={e => setBroadcastMessage(e.target.value)}
              className="input-field text-sm"
            />
          </div>

          <button
            onClick={handleSendBroadcast}
            disabled={!broadcastMessage.trim() || broadcastReach === 0}
            className="btn btn-primary w-full py-3"
          >
            {broadcastReach === 0
              ? 'Nobody in that group yet'
              : `Send to ${broadcastReach} ${broadcastReach === 1 ? 'person' : 'people'}`}
          </button>
        </div>
      </GlassModal>

      <ShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Share this event"
        subtitle={
          event.privacy === 'public'
            ? 'Anyone with this link can RSVP'
            : 'Only people you send this to can see it'
        }
        url={eventUrl}
        shareText={`${event.title} — ${formatWhen(event.startsAt)}`}
      />

      {/* Report */}
      <GlassModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Report this event"
        subtitle="Reports go to the safety team"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="report-reason"
              className="text-xs font-bold text-text-medium mb-1 block"
            >
              What is wrong with it?
            </label>
            <select
              id="report-reason"
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              className="input-field text-sm"
            >
              <option value="">Choose a reason…</option>
              {REPORT_REASONS.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="report-note" className="text-xs font-bold text-text-medium mb-1 block">
              Anything else? (optional)
            </label>
            <textarea
              id="report-note"
              rows={3}
              value={reportNote}
              onChange={e => setReportNote(e.target.value)}
              placeholder="Details help the review go faster."
              className="input-field text-sm"
            />
          </div>

          <button
            disabled={!reportReason}
            onClick={handleReport}
            className="btn btn-primary w-full py-3"
          >
            Send report
          </button>

          <p className="text-xs text-text-light text-center">
            You can also{' '}
            <Link to="/settings" className="text-primary font-semibold hover:underline">
              manage blocked people
            </Link>{' '}
            in Settings.
          </p>
        </div>
      </GlassModal>

      <ConfirmDialog {...confirm.dialogProps} />
    </div>
  );
}
