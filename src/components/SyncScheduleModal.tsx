import React, { useState } from 'react';
import {
  MapPin,
  RefreshCw,
  CheckCircle2,
  Bell,
  X,
  Building2,
} from 'lucide-react';
import type { EventItem } from '../types';
import { syncLiveEventSchedule } from '../services/liveEventCatalog';
import { detectVenueArchetype } from '../services/venueScheduleResolver';

interface SyncScheduleModalProps {
  event: EventItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    patch: Partial<EventItem>,
    notifyAttendees: boolean,
    changeSummary?: string
  ) => void;
}

export const SyncScheduleModal: React.FC<SyncScheduleModalProps> = ({
  event,
  isOpen,
  onClose,
  onSave,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [doorsTime, setDoorsTime] = useState(event.doorsTime || '5:00 PM');
  const [showtime, setShowtime] = useState(event.showtime || '7:00 PM');
  const [meetupTime, setMeetupTime] = useState(event.meetupTime || '4:30 PM');
  const [meetupLocation, setMeetupLocation] = useState(event.meetupLocation || '');
  const [venueGateInfo, setVenueGateInfo] = useState(event.venueGateInfo || '');
  const [doorsSource, setDoorsSource] = useState(
    event.doorsTimeSource || "Explore St. Louis / Venue Guide"
  );
  const [notifyAttendees, setNotifyAttendees] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const archetype = detectVenueArchetype(event.location);

  const handleRunLiveSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Querying live venue & promoter manifests...');
    try {
      const resolved = await syncLiveEventSchedule({
        venue: event.location,
        title: event.title,
        performerOrTeam: event.performerOrTeam,
        showtime: event.showtime,
      });

      setDoorsTime(resolved.doorsTime);
      setShowtime(resolved.showtime);
      setMeetupTime(resolved.suggestedMeetupTime);
      if (resolved.venueGateInfo) setVenueGateInfo(resolved.venueGateInfo);
      setDoorsSource(resolved.source);
      setSyncStatus(`Verified with ${resolved.source}: Doors open at ${resolved.doorsTime}`);
    } catch {
      setSyncStatus('Could not reach external manifest; preserved current values.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApply = () => {
    const isDoorsShifted = doorsTime !== event.doorsTime;
    const isShowShifted = showtime !== event.showtime;

    let summary = `Venue doors open verified at ${doorsTime} (Gates unlock).`;
    if (isDoorsShifted && event.doorsTime) {
      summary = `Venue doors open adjusted to ${doorsTime} (was ${event.doorsTime}). Group meetup set to ${meetupTime}.`;
    } else if (isShowShifted && event.showtime) {
      summary = `Official showtime adjusted to ${showtime} (was ${event.showtime}). Doors at ${doorsTime}.`;
    }

    onSave(
      {
        doorsTime,
        showtime,
        meetupTime,
        meetupLocation: meetupLocation.trim() || undefined,
        venueGateInfo: venueGateInfo.trim() || undefined,
        doorsTimeConfirmed: true,
        doorsTimeSource: doorsSource,
        lastScheduleSync: {
          updatedAt: Date.now(),
          source: doorsSource,
          notes: summary,
        },
      },
      notifyAttendees,
      summary
    );
    onClose();
  };

  const attendeeCount = event.attendees.filter(a => a.status === 'going' || a.status === 'waitlist').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface-lowest w-full max-w-xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-surface-lowest">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
            </div>
            <div>
              <h2 className="font-headline font-bold text-lg text-text-dark">
                Sync Live Venue Schedule
              </h2>
              <p className="text-xs text-text-medium">
                {event.location} • {archetype.label}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-low hover:bg-surface-high flex items-center justify-center text-text-medium transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Automated Fetch Banner */}
          <div className="p-4 bg-primary-fixed/30 border border-primary/20 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <Building2 size={18} className="text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-xs font-headline font-bold text-text-dark block">
                  Public Venue & Manifest Resolver
                </span>
                <p className="text-[11px] text-text-medium leading-relaxed">
                  Pulls directly from official venue guides (e.g. Explore St. Louis, Dome at America's Center) and live promoter manifests.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRunLiveSync}
              disabled={isSyncing}
              className="btn btn-primary text-xs py-2 px-3 shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Checking...' : 'Re-Check Now'}</span>
            </button>
          </div>

          {syncStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>{syncStatus}</span>
            </div>
          )}

          {/* Schedule Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Meetup */}
            <div className="p-3.5 bg-surface-low rounded-2xl border border-gray-100">
              <label className="text-[10px] font-headline font-bold text-primary uppercase tracking-wider block mb-1">
                1. Group Meetup
              </label>
              <input
                type="text"
                value={meetupTime}
                onChange={e => setMeetupTime(e.target.value)}
                placeholder="4:30 PM"
                className="font-headline font-bold text-base text-primary bg-transparent border-none outline-none w-full"
              />
              <span className="text-[10px] text-text-light block mt-0.5">Circle pre-event meet</span>
            </div>

            {/* 2. Doors Open */}
            <div className="p-3.5 bg-surface-low rounded-2xl border border-primary/30 ring-2 ring-primary/10">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-headline font-bold text-text-dark uppercase tracking-wider block">
                  2. Doors Open *
                </label>
                <CheckCircle2 size={12} className="text-emerald-600" />
              </div>
              <input
                type="text"
                value={doorsTime}
                onChange={e => {
                  setDoorsTime(e.target.value);
                  setDoorsSource('Manual Host Confirmation');
                }}
                placeholder="5:00 PM"
                className="font-headline font-black text-base text-text-dark bg-transparent border-none outline-none w-full"
              />
              <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                Venue gates unlock
              </span>
            </div>

            {/* 3. Showtime */}
            <div className="p-3.5 bg-surface-low rounded-2xl border border-gray-100">
              <label className="text-[10px] font-headline font-bold text-secondary uppercase tracking-wider block mb-1">
                3. Showtime
              </label>
              <input
                type="text"
                value={showtime}
                onChange={e => setShowtime(e.target.value)}
                placeholder="7:00 PM"
                className="font-headline font-bold text-base text-secondary bg-transparent border-none outline-none w-full"
              />
              <span className="text-[10px] text-text-light block mt-0.5">Main act on stage</span>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-text-medium mr-1">Quick presets:</span>
            <button
              type="button"
              onClick={() => {
                setDoorsTime('5:00 PM');
                setMeetupTime('4:30 PM');
                setDoorsSource("Explore St. Louis / Venue Guide");
              }}
              className="px-2.5 py-1 rounded-lg bg-surface-low hover:bg-surface-high text-xs font-bold text-text-dark transition-colors cursor-pointer"
            >
              🚪 5:00 PM (Stadium 2h standard)
            </button>
            <button
              type="button"
              onClick={() => {
                setDoorsTime('5:30 PM');
                setMeetupTime('4:45 PM');
              }}
              className="px-2.5 py-1 rounded-lg bg-surface-low hover:bg-surface-high text-xs font-bold text-text-dark transition-colors cursor-pointer"
            >
              🚪 5:30 PM (1.5h prior)
            </button>
            <button
              type="button"
              onClick={() => {
                setDoorsTime('6:00 PM');
                setMeetupTime('5:00 PM');
              }}
              className="px-2.5 py-1 rounded-lg bg-surface-low hover:bg-surface-high text-xs font-bold text-text-dark transition-colors cursor-pointer"
            >
              🚪 6:00 PM (1h prior)
            </button>
          </div>

          {/* Pre-event gathering spot */}
          <div>
            <label className="text-xs font-bold text-text-dark mb-1.5 block">
              Pre-Event Group Gathering Spot
            </label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
              <input
                type="text"
                value={meetupLocation}
                onChange={e => setMeetupLocation(e.target.value)}
                placeholder="e.g. Entry A Plaza or Broadway Central Entrance"
                className="input-field pl-10 text-xs font-medium"
              />
            </div>
          </div>

          {/* Venue Gate & Entrance Instructions */}
          <div>
            <label className="text-xs font-bold text-text-dark mb-1.5 block flex items-center justify-between">
              <span>Official Gate & Entrance Guidance</span>
              <span className="text-[10px] text-text-light font-normal">From venue guide</span>
            </label>
            <textarea
              rows={3}
              value={venueGateInfo}
              onChange={e => setVenueGateInfo(e.target.value)}
              placeholder="e.g. Entry through Entry A, Entry B, Broadway Central, Entry C and Entry D. Accessible entrances at Gate A. Floor tickets enter Gate A/B."
              className="input-field text-xs font-medium resize-none leading-relaxed"
            />
          </div>

          {/* Notify Attendees Box */}
          <label className="p-4 bg-surface-low rounded-2xl flex items-start gap-3 cursor-pointer select-none border border-gray-100">
            <input
              type="checkbox"
              checked={notifyAttendees}
              onChange={e => setNotifyAttendees(e.target.checked)}
              className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Bell size={14} className="text-primary" />
                <span className="text-xs font-bold text-text-dark">
                  Notify {attendeeCount} circle {attendeeCount === 1 ? 'member' : 'members'} of this update
                </span>
              </div>
              <p className="text-[11px] text-text-medium mt-0.5">
                Dispatches a schedule change alert to everyone Going/Waitlisted and automatically updates their Apple & Google Calendar feeds.
              </p>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-surface-lowest flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn bg-surface-low hover:bg-surface-high text-xs py-2.5 px-4 font-bold text-text-dark cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="btn btn-primary text-xs py-2.5 px-6 font-bold shadow-md cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            <span>Apply Schedule & Notify</span>
          </button>
        </div>
      </div>
    </div>
  );
};
