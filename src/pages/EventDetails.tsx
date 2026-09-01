import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Send, 
  Lock, 
  Globe, 
  ChevronLeft, 
  MessageSquare, 
  Radio, 
  Flag, 
  Users, 
  Sparkles,
  Share2,
  ExternalLink
} from 'lucide-react';
import cx from 'classnames';
import { useApp } from '../context/AppContext';
import { StatusRing } from '../components/StatusRing';
import { GlassModal } from '../components/GlassModal';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, rsvpEvent, addComment, sendHostBroadcast } = useApp();

  const event = events.find(e => e.id === id) || events[0];
  const [commentText, setCommentText] = useState('');
  const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);
  const [attendeeTab, setAttendeeTab] = useState<'confirmed' | 'maybe' | 'waitlist'>('confirmed');
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'yes' | 'waitlist'>('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const spotsLeft = Math.max(0, event.maxSpots - event.confirmed);
  const isFull = spotsLeft === 0;

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    addComment(event.id, commentText);
    setCommentText('');
  };

  const handleSendBroadcast = () => {
    if (!broadcastMessage.trim()) return;
    sendHostBroadcast(event.id, broadcastMessage, broadcastTarget);
    setBroadcastMessage('');
    setIsBroadcastModalOpen(false);
  };

  const handleReportEvent = () => {
    alert('Thank you for your report. Our safety team has been notified.');
    setIsReportModalOpen(false);
    setReportReason('');
  };

  return (
    <div className="flex-col pb-[190px] min-h-screen bg-surface animate-fade-in">
      {/* Hero Header with Image */}
      <div className="hero-header">
        <img src={event.image} className="img-full" alt={event.title} />

        <div className="hero-overlay">
          {/* Top Row: Back Button & Actions */}
          <div className="flex justify-between items-center w-full">
            <button onClick={() => navigate('/')} className="back-btn-float" title="Go back">
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="back-btn-float"
                title="Share event"
              >
                <Share2 size={20} />
              </button>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="back-btn-float"
                title="Report event"
              >
                <Flag size={18} />
              </button>
            </div>
          </div>

          {/* Bottom Content: Title & Badges */}
          <div className="text-white">
            <div className="flex gap-2 mb-3">
              <span className="badge bg-white/20 backdrop-blur-md text-[10px] uppercase font-bold text-white tracking-widest px-3 border border-white/15">
                {event.category}
              </span>
              <span className="badge bg-green-100/95 text-[10px] uppercase font-bold text-green-900 tracking-widest px-3 flex items-center gap-1.5 border border-green-200/50">
                {event.privacy === 'public' ? (
                  <>
                    <Globe size={11} /> Public Event
                  </>
                ) : (
                  <>
                    <Lock size={11} /> {event.type.includes('CIRCLE') ? 'Circle Only' : 'Hidden Link'}
                  </>
                )}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-headline font-black leading-tight drop-shadow-md tracking-tight text-white">
              {event.title}
            </h1>

            <div className="flex flex-wrap gap-4 mt-4 text-xs opacity-95 font-semibold text-white">
              <div className="flex items-center gap-1.5">
                <Calendar size={15} className="text-primary-fixed" /> {event.timeLabel}
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={15} className="text-primary-fixed" /> {event.location}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content wrapper */}
      <div className="px-6 mt-6 relative z-30 flex-col gap-8 max-w-4xl mx-auto w-full">
        {/* Host Broadcast Banner (if user is host) */}
        {event.isHost && (
          <div className="bg-primary-fixed/40 border border-primary/20 rounded-2xl p-4 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                <Radio size={20} />
              </div>
              <div>
                <h4 className="font-headline font-bold text-sm text-text-dark">Host Controls Active</h4>
                <p className="text-xs text-text-medium">Send segmented broadcast updates to attendees</p>
              </div>
            </div>
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="btn btn-primary text-xs py-2 px-4"
            >
              📢 Broadcast
            </button>
          </div>
        )}

        {/* The Vibe Description */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-6 bg-primary rounded-full"></div>
            <h2 className="text-xl font-headline font-bold text-text-dark">The Vibe</h2>
          </div>
          <p className="text-text-medium leading-relaxed text-sm">{event.vibe}</p>
        </div>

        {/* Capacity & Stats Bento */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Capacity Ring Card */}
          <div className="md:col-span-5 bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
            <StatusRing capacity={event.capacity} size={110} strokeWidth={8} label={`${spotsLeft}`} />
            <div className="text-[11px] font-headline font-bold text-text-light tracking-widest uppercase mt-3">
              {isFull ? 'EVENT IS FULL' : 'SPOTS LEFT'}
            </div>
            <p className="text-xs font-semibold text-text-medium mt-1">
              {event.capacity}% Capacity Reached ({event.confirmed}/{event.maxSpots})
            </p>
          </div>

          {/* Stats Grid */}
          <div className="md:col-span-7 grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setAttendeeTab('confirmed');
                setIsAttendeesModalOpen(true);
              }}
              className="bg-surface-container-low hover:bg-surface-container-high transition-all p-4 rounded-2xl flex flex-col justify-between text-left cursor-pointer group"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">
                  Confirmed
                </span>
                <Users size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-3xl font-headline font-black text-primary mt-2">
                {event.confirmed}
              </div>
            </button>

            <button
              onClick={() => {
                setAttendeeTab('maybe');
                setIsAttendeesModalOpen(true);
              }}
              className="bg-surface-container-low hover:bg-surface-container-high transition-all p-4 rounded-2xl flex flex-col justify-between text-left cursor-pointer group"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">
                  Maybe
                </span>
                <Users size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-3xl font-headline font-black text-text-medium mt-2">
                {event.maybe}
              </div>
            </button>

            <div className="bg-surface-container-low p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">
                Interested
              </span>
              <div className="text-3xl font-headline font-black text-text-dark mt-2">
                {event.interested}
              </div>
            </div>

            <button
              onClick={() => {
                setAttendeeTab('waitlist');
                setIsAttendeesModalOpen(true);
              }}
              className="bg-red-50 hover:bg-red-100 transition-all p-4 rounded-2xl flex flex-col justify-between text-left cursor-pointer group"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                  Waitlist
                </span>
                <Users size={14} className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-3xl font-headline font-black text-red-600 mt-2">
                {event.waitlist}
              </div>
            </button>
          </div>
        </div>

        {/* Logistics & Location Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-headline font-bold text-lg text-text-dark">Location & Logistics</h3>
            <span className="text-xs font-bold text-primary flex items-center gap-1 cursor-pointer">
              <ExternalLink size={14} /> Open Maps
            </span>
          </div>

          <div className="p-4 bg-surface-container-low rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <MapPin size={20} />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-text-dark">{event.location}</div>
              <div className="text-xs text-text-light">{event.distance} • Address unlocked for confirmed RSVPs</div>
            </div>
          </div>
        </div>

        {/* Coordination Thread (Comments) */}
        <div className="thread-container">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={20} className="text-primary" />
            <h3 className="font-headline font-bold text-lg text-text-dark">Coordination Thread</h3>
            <span className="text-xs font-bold text-text-light ml-auto">
              {event.comments.length} updates
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {event.comments.map(msg => (
              <div
                key={msg.id}
                className={cx('flex gap-3', {
                  'flex-row-reverse': msg.isHost || msg.user === 'You',
                })}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm bg-slate-800">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(msg.avatar)}`}
                    alt={msg.user}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className={cx('flex flex-col', {
                    'items-end': msg.isHost || msg.user === 'You',
                  })}
                >
                  <div
                    className={cx('message-bubble', {
                      'bg-primary text-white': msg.user === 'You' && !msg.isHost,
                      'message-bubble host': msg.isHost,
                      'message-bubble received': msg.user !== 'You' && !msg.isHost,
                    })}
                  >
                    <span
                      className={cx('font-bold text-[10px] block mb-1 uppercase tracking-tight', {
                        'text-primary font-black': msg.isHost,
                        'text-white/80': msg.user === 'You' && !msg.isHost,
                        'text-text-medium': msg.user !== 'You' && !msg.isHost,
                      })}
                    >
                      {msg.user}
                    </span>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-text-light font-medium mt-1 inline-block px-1">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Comment Input */}
          <div className="thread-input-wrapper">
            <input
              type="text"
              placeholder="Ask a logistics question or share update..."
              className="thread-input"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSendComment();
              }}
            />
            <button onClick={handleSendComment} className="thread-send-btn" title="Post message">
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Sticky RSVP Action Bar */}
      <div className="floating-bar" style={{ bottom: '84px' }}>
        <div className="floating-bar-inner flex-col gap-3">
          <div className="rsvp-bar">
            <button
              onClick={() => rsvpEvent(event.id, 'going')}
              className={cx('rsvp-btn', {
                'active-going': event.status === 'Attending' || event.status === 'Waitlisted',
              })}
            >
              {event.status === 'Attending' ? (
                <>
                  <CheckCircle2 size={16} className="inline mr-1 mb-0.5" /> Going
                </>
              ) : isFull ? (
                <>
                  <Sparkles size={16} className="inline mr-1 mb-0.5" /> Join Waitlist
                </>
              ) : (
                'Going'
              )}
            </button>
            <button
              onClick={() => rsvpEvent(event.id, 'maybe')}
              className={cx('rsvp-btn', { 'active-maybe': event.status === 'Pending RSVP' })}
            >
              Maybe
            </button>
            <button
              onClick={() => rsvpEvent(event.id, 'no')}
              className={cx('rsvp-btn', { 'active-no': event.status === 'Declined' })}
            >
              No
            </button>
          </div>

          {event.status === 'Attending' && (
            <div className="text-center animate-fade-in">
              <span className="text-[10px] font-black text-green-700 tracking-[0.2em] uppercase flex items-center justify-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                CONFIRMED FOR THIS EVENT
              </span>
            </div>
          )}

          {event.status === 'Waitlisted' && (
            <div className="text-center animate-fade-in">
              <span className="text-[10px] font-black text-amber-700 tracking-[0.15em] uppercase flex items-center justify-center gap-1.5">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                ON WAITLIST • WE'LL NOTIFY YOU IF A SPOT OPENS
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Attendees Modal */}
      <GlassModal
        isOpen={isAttendeesModalOpen}
        onClose={() => setIsAttendeesModalOpen(false)}
        title="Guest List & RSVPs"
        subtitle={`${event.title} • ${event.confirmed} Confirmed`}
      >
        <div className="flex gap-2 border-b border-gray-100 pb-3 mb-4">
          <button
            onClick={() => setAttendeeTab('confirmed')}
            className={cx('px-4 py-1.5 rounded-full text-xs font-bold transition-all', {
              'bg-primary text-white': attendeeTab === 'confirmed',
              'bg-surface-high text-text-medium': attendeeTab !== 'confirmed',
            })}
          >
            Confirmed ({event.confirmed})
          </button>
          <button
            onClick={() => setAttendeeTab('maybe')}
            className={cx('px-4 py-1.5 rounded-full text-xs font-bold transition-all', {
              'bg-primary text-white': attendeeTab === 'maybe',
              'bg-surface-high text-text-medium': attendeeTab !== 'maybe',
            })}
          >
            Maybe ({event.maybe})
          </button>
          <button
            onClick={() => setAttendeeTab('waitlist')}
            className={cx('px-4 py-1.5 rounded-full text-xs font-bold transition-all', {
              'bg-primary text-white': attendeeTab === 'waitlist',
              'bg-surface-high text-text-medium': attendeeTab !== 'waitlist',
            })}
          >
            Waitlist ({event.waitlist})
          </button>
        </div>

        <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
          {attendeeTab === 'confirmed' && (
            <>
              {event.avatars.map((name, i) => (
                <div key={name + i} className="flex items-center gap-3 p-2 bg-surface-low rounded-xl">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="font-bold text-sm text-text-dark">{name}</div>
                  <span className="ml-auto text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                    GOING
                  </span>
                </div>
              ))}
            </>
          )}

          {attendeeTab === 'maybe' && (
            <div className="text-center py-6 text-xs text-text-medium">
              {event.maybe} people marked themselves as 'Maybe'
            </div>
          )}

          {attendeeTab === 'waitlist' && (
            <div className="text-center py-6 text-xs text-text-medium">
              {event.waitlist > 0
                ? `${event.waitlist} people on the automatic promotion waitlist`
                : 'No one is currently on the waitlist'}
            </div>
          )}
        </div>
      </GlassModal>

      {/* Host Broadcast Modal */}
      <GlassModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        title="Send Host Announcement 📢"
        subtitle="Broadcast an immediate update to attendees"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-text-medium mb-1 block">Target Audience</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBroadcastTarget('all')}
                className={cx('flex-1 py-2 rounded-xl text-xs font-bold', {
                  'bg-primary text-white': broadcastTarget === 'all',
                  'bg-surface-high text-text-medium': broadcastTarget !== 'all',
                })}
              >
                All Invited
              </button>
              <button
                type="button"
                onClick={() => setBroadcastTarget('yes')}
                className={cx('flex-1 py-2 rounded-xl text-xs font-bold', {
                  'bg-primary text-white': broadcastTarget === 'yes',
                  'bg-surface-high text-text-medium': broadcastTarget !== 'yes',
                })}
              >
                Only "Yes" RSVPs
              </button>
              <button
                type="button"
                onClick={() => setBroadcastTarget('waitlist')}
                className={cx('flex-1 py-2 rounded-xl text-xs font-bold', {
                  'bg-primary text-white': broadcastTarget === 'waitlist',
                  'bg-surface-high text-text-medium': broadcastTarget !== 'waitlist',
                })}
              >
                Waitlist Only
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-text-medium mb-1 block">Message</label>
            <textarea
              rows={3}
              placeholder="e.g., Moving to the second floor terrace! Grab a seat near the lounge."
              value={broadcastMessage}
              onChange={e => setBroadcastMessage(e.target.value)}
              className="input-field text-sm"
            />
          </div>

          <button onClick={handleSendBroadcast} className="btn btn-primary w-full py-3">
            Send Announcement
          </button>
        </div>
      </GlassModal>

      {/* Share Modal */}
      <GlassModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Share Event"
        subtitle="Invite friends into this coordination thread"
      >
        <div className="flex flex-col gap-4 text-center">
          <div className="w-44 h-44 mx-auto bg-surface-low rounded-2xl flex items-center justify-center p-4 border border-gray-100">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                window.location.href
              )}`}
              alt="QR Code"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="p-3 bg-surface-low rounded-xl text-xs font-mono text-text-medium break-all">
            {window.location.href}
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              alert('Link copied to clipboard!');
              setIsShareModalOpen(false);
            }}
            className="btn btn-primary w-full py-3"
          >
            Copy Invite Link
          </button>
        </div>
      </GlassModal>

      {/* Report Modal */}
      <GlassModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Report Event"
        subtitle="Help keep the W8VR community safe"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-text-medium mb-1 block">Reason for Report</label>
            <select
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              className="input-field text-sm"
            >
              <option value="">Select a reason...</option>
              <option value="spam">Spam or commercial advertisement</option>
              <option value="inappropriate">Inappropriate or unsafe content</option>
              <option value="fake">Fake or misleading event</option>
              <option value="harassment">Harassment or exclusionary behavior</option>
            </select>
          </div>
          <button
            disabled={!reportReason}
            onClick={handleReportEvent}
            className="btn btn-primary w-full py-3 disabled:opacity-50"
          >
            Submit Report
          </button>
        </div>
      </GlassModal>
    </div>
  );
}
