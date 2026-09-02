import React, { useState } from 'react';
import { 
  Check, 
  Copy, 
  Download, 
  ExternalLink, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2
} from 'lucide-react';
import cx from 'classnames';
import { GlassModal } from './GlassModal';
import { type EventItem } from '../types';
import { myRsvp } from '../lib/events';
import { 
  getCalendarSubscriptionUrls, 
  downloadIcsFile 
} from '../services/calendarFeedService';

interface CalendarSubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventItem[];
}

export const CalendarSubscribeModal: React.FC<CalendarSubscribeModalProps> = ({
  isOpen,
  onClose,
  events,
}) => {
  const [feedFilter, setFeedFilter] = useState<'attending' | 'all'>('attending');
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Filter events based on user selection
  const filteredEvents = events.filter(e => {
    const status = myRsvp(e);
    if (feedFilter === 'attending') return status === 'going';
    return status === 'going' || status === 'maybe' || status === 'waitlist';
  });

  const urls = getCalendarSubscriptionUrls(filteredEvents, feedFilter);

  const handleCopyUrl = (urlToCopy: string) => {
    navigator.clipboard?.writeText(urlToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    downloadIcsFile(filteredEvents, `w8vr-${feedFilter}-events.ics`);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleAppleSubscribe = () => {
    // Open webcal link directly - iOS and macOS automatically open Calendar.app with the subscribe prompt
    window.location.href = urls.webcalUrl;
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Live Calendar Subscription 📅"
      subtitle="Subscribe once in Apple Calendar, Google Calendar, or Outlook — always stays updated"
      maxWidth="lg"
    >
      <div className="flex flex-col gap-5 text-text-dark">
        {/* Live Sync Status Banner */}
        <div className="p-3.5 bg-gradient-to-r from-primary-fixed/50 to-secondary-container/40 border border-primary/20 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-xs">
              <RefreshCw size={16} className="animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <div className="font-headline font-bold text-xs text-text-dark">
                Live Dynamic Sync Active
              </div>
              <div className="text-[11px] text-text-medium">
                New RSVPs, showtime changes, and meetup spots sync automatically.
              </div>
            </div>
          </div>
          <span className="badge bg-green-100 text-green-900 font-bold text-[10px]">
            RFC 5545 Feed
          </span>
        </div>

        {/* Subscription Filter Toggle */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-text-dark flex items-center justify-between">
            <span>WHAT WOULD YOU LIKE TO SYNC?</span>
            <span className="text-[11px] font-normal text-text-light">
              {filteredEvents.length} events included
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2 bg-surface-low p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setFeedFilter('attending')}
              className={cx('py-2.5 px-3 rounded-xl font-headline font-bold text-xs transition-all cursor-pointer text-center', {
                'bg-surface-lowest shadow-sm text-primary': feedFilter === 'attending',
                'text-text-medium hover:text-text-dark': feedFilter !== 'attending',
              })}
            >
              Confirmed Events Only ({events.filter(e => myRsvp(e) === 'going').length})
            </button>
            <button
              type="button"
              onClick={() => setFeedFilter('all')}
              className={cx('py-2.5 px-3 rounded-xl font-headline font-bold text-xs transition-all cursor-pointer text-center', {
                'bg-surface-lowest shadow-sm text-primary': feedFilter === 'all',
                'text-text-medium hover:text-text-dark': feedFilter !== 'all',
              })}
            >
              All Scheduled + Waitlist ({events.filter(e => {
                const s = myRsvp(e);
                return s === 'going' || s === 'maybe' || s === 'waitlist';
              }).length})
            </button>
          </div>
        </div>

        {/* 1-CLICK 3 PLATFORM SUBSCRIPTION CARDS */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-text-dark">
            CHOOSE YOUR CALENDAR PLATFORM (1-CLICK SUBSCRIBE)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Apple Calendar */}
            <button
              type="button"
              onClick={handleAppleSubscribe}
              className="p-4 bg-surface-low hover:bg-surface-high border-2 border-transparent hover:border-primary/40 rounded-2xl flex flex-col justify-between text-left transition-all cursor-pointer group shadow-2xs"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-black text-sm">
                    
                  </div>
                  <ExternalLink size={14} className="text-text-light group-hover:text-primary transition-colors" />
                </div>
                <h4 className="font-headline font-bold text-sm text-text-dark">
                  Apple Calendar
                </h4>
                <p className="text-[11px] text-text-medium mt-1 leading-snug">
                  One-tap subscription for iPhone, iPad, and Mac.
                </p>
              </div>
              <span className="mt-3 text-[10px] font-headline font-black text-primary uppercase tracking-wider">
                Subscribe via Webcal →
              </span>
            </button>

            {/* Google Calendar */}
            <a
              href={urls.googleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-surface-low hover:bg-surface-high border-2 border-transparent hover:border-primary/40 rounded-2xl flex flex-col justify-between text-left transition-all cursor-pointer group shadow-2xs no-underline"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    G
                  </div>
                  <ExternalLink size={14} className="text-text-light group-hover:text-primary transition-colors" />
                </div>
                <h4 className="font-headline font-bold text-sm text-text-dark">
                  Google Calendar
                </h4>
                <p className="text-[11px] text-text-medium mt-1 leading-snug">
                  Adds to Google Web, Android & Google Calendar iOS app.
                </p>
              </div>
              <span className="mt-3 text-[10px] font-headline font-black text-primary uppercase tracking-wider">
                Add to Google Calendar →
              </span>
            </a>

            {/* Microsoft Outlook */}
            <a
              href={urls.outlookLiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-surface-low hover:bg-surface-high border-2 border-transparent hover:border-primary/40 rounded-2xl flex flex-col justify-between text-left transition-all cursor-pointer group shadow-2xs no-underline"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="w-9 h-9 rounded-xl bg-[#0078D4] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    O
                  </div>
                  <ExternalLink size={14} className="text-text-light group-hover:text-primary transition-colors" />
                </div>
                <h4 className="font-headline font-bold text-sm text-text-dark">
                  Microsoft Outlook
                </h4>
                <p className="text-[11px] text-text-medium mt-1 leading-snug">
                  Syncs to Outlook 365, Desktop, and Outlook Mobile.
                </p>
              </div>
              <span className="mt-3 text-[10px] font-headline font-black text-primary uppercase tracking-wider">
                Subscribe in Outlook →
              </span>
            </a>
          </div>
        </div>

        {/* Copy Live Feed URL */}
        <div className="p-4 bg-surface-low rounded-2xl flex flex-col gap-2 border border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-text-dark">
              OR COPY YOUR UNIQUE LIVE CALENDAR URL:
            </span>
            {copied && (
              <span className="text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded flex items-center gap-1 animate-fade-in">
                <Check size={12} /> Copied to clipboard!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={urls.webcalUrl}
              className="input-field text-xs py-2 bg-surface-lowest font-mono text-text-medium border-none select-all"
            />
            <button
              type="button"
              onClick={() => handleCopyUrl(urls.webcalUrl)}
              className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-neon"
              title="Copy webcal feed link"
            >
              <Copy size={13} /> Copy Feed URL
            </button>
          </div>
          <span className="text-[10px] text-text-light">
            Paste this URL into any calendar app under "New Calendar Subscription" or "Subscribe from Web".
          </span>
        </div>

        {/* Dual-Time Calendar Details Preview */}
        <div className="p-4 bg-primary/5 border border-primary/15 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <Sparkles size={14} />
            <span>Dual-Time Reminders Included in Each Synced Event</span>
          </div>
          <div className="text-xs text-text-medium leading-relaxed">
            Calendar entries are scheduled starting at your <strong>Host Meetup Time</strong> (with an alarm 1 hour before so you arrive on time for pre-drinks/tailgating), while the event notes detail the <strong>Doors Open</strong> time, <strong>Official Showtime / Kickoff</strong>, <strong>Seating Section</strong>, and <strong>Ticket Purchase Link</strong>.
          </div>
        </div>

        {/* Bottom Actions: Direct .ICS Download & Close */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleDownload}
            className="btn btn-ghost text-xs text-text-medium hover:text-primary flex items-center gap-1.5 font-bold cursor-pointer"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 size={14} className="text-green-600" /> .ICS Downloaded!
              </>
            ) : (
              <>
                <Download size={14} /> Download Offline .ICS File
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary text-xs py-2.5 px-6 rounded-xl cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </GlassModal>
  );
};
