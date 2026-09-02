import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Clock, 
  ArrowRight, 
  CalendarCheck2,
  Calendar
} from 'lucide-react';
import cx from 'classnames';
import { useApp } from '../context/AppContext';
import { StatusRing } from '../components/StatusRing';
import { CalendarSubscribeModal } from '../components/CalendarSubscribeModal';

export default function Schedule() {
  const navigate = useNavigate();
  const { events } = useApp();
  const [filter, setFilter] = useState<'all' | 'attending' | 'pending'>('all');
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);

  const scheduledEvents = events.filter(e => {
    if (filter === 'attending') return e.status === 'Attending';
    if (filter === 'pending') return e.status === 'Pending RSVP' || e.status === 'Waitlisted';
    return e.status === 'Attending' || e.status === 'Pending RSVP' || e.status === 'Waitlisted';
  });

  return (
    <div className="flex-col pb-28 px-6 bg-surface animate-fade-in max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mt-4 mb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-headline font-black text-3xl text-text-dark">My Schedule</h1>
          <p className="text-text-medium text-sm mt-1">
            Upcoming hangouts and social commitments you've RSVP'd to.
          </p>
        </div>
        <button
          onClick={() => setIsSubscribeModalOpen(true)}
          className="btn btn-primary text-xs py-2.5 px-4 flex items-center gap-1.5 shrink-0 shadow-neon cursor-pointer self-start sm:self-auto"
          title="Subscribe in Apple Calendar, Google Calendar, or Outlook"
        >
          <Calendar size={15} /> Subscribe to Calendar
        </button>
      </div>

      {/* Live Subscription Banner */}
      <div
        onClick={() => setIsSubscribeModalOpen(true)}
        className="mb-4 p-3 bg-primary-fixed/30 border border-primary/20 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-primary-fixed/40 transition-colors shadow-2xs"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-text-dark">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>
            <strong>Live Calendar Feed:</strong> Syncs to Apple Calendar, Google Calendar & Outlook.
          </span>
        </div>
        <span className="text-[11px] font-bold text-primary flex items-center gap-1">
          Subscribe / Sync Feed →
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 pb-3 mb-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setFilter('all')}
          className={cx('px-4 py-1.5 rounded-full text-xs font-bold font-headline transition-all cursor-pointer', {
            'bg-primary text-white shadow-sm': filter === 'all',
            'bg-surface-high text-text-medium hover:bg-surface-highest': filter !== 'all',
          })}
        >
          All Scheduled ({scheduledEvents.length})
        </button>
        <button
          onClick={() => setFilter('attending')}
          className={cx('px-4 py-1.5 rounded-full text-xs font-bold font-headline transition-all cursor-pointer', {
            'bg-primary text-white shadow-sm': filter === 'attending',
            'bg-surface-high text-text-medium hover:bg-surface-highest': filter !== 'attending',
          })}
        >
          Confirmed (Attending)
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={cx('px-4 py-1.5 rounded-full text-xs font-bold font-headline transition-all cursor-pointer', {
            'bg-primary text-white shadow-sm': filter === 'pending',
            'bg-surface-high text-text-medium hover:bg-surface-highest': filter !== 'pending',
          })}
        >
          Pending / Waitlist
        </button>
      </div>

      {/* Schedule Timeline */}
      <div className="flex flex-col gap-4">
        {scheduledEvents.map(event => (
          <div
            key={event.id}
            onClick={() => navigate(`/event/${event.id}`)}
            className="card p-5 flex flex-col md:flex-row md:items-center gap-4 bg-surface-lowest shadow-sm hover:shadow-md transition-all cursor-pointer border border-white/80 group"
          >
            {/* Date Block */}
            <div className="flex md:flex-col items-center justify-center p-3 bg-surface-low rounded-2xl md:w-20 shrink-0 text-center">
              <span className="text-[10px] font-headline font-bold text-primary uppercase tracking-wider">
                {event.date}
              </span>
              <span className="font-headline font-black text-xl text-text-dark md:mt-0.5 ml-2 md:ml-0">
                {event.time.split(' ')[0]}
              </span>
              <span className="text-[9px] font-bold text-text-light md:mt-0.5 ml-1 md:ml-0">
                {event.time.split(' ')[1]}
              </span>
            </div>

            {/* Event Image */}
            <img
              src={event.image}
              alt={event.title}
              className="w-full md:w-28 h-32 md:h-20 rounded-xl object-cover shrink-0"
            />

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="badge bg-secondary-container text-on-secondary-container text-[9px] font-bold">
                  {event.category}
                </span>
                {event.eventSubType && (
                  <span className="badge bg-primary-fixed text-primary text-[9px] font-bold uppercase">
                    {event.eventSubType}
                  </span>
                )}
                <span
                  className={cx('badge text-[9px] font-bold', {
                    'bg-green-100 text-green-900': event.status === 'Attending',
                    'bg-amber-100 text-amber-900': event.status === 'Pending RSVP' || event.status === 'Waitlisted',
                  })}
                >
                  {event.status}
                </span>
              </div>

              <h3 className="font-headline font-bold text-lg text-text-dark group-hover:text-primary transition-colors truncate">
                {event.title}
              </h3>

              {event.performerOrTeam && (
                <div className="text-xs font-headline font-bold text-primary truncate">
                  ⭐ {event.performerOrTeam}
                </div>
              )}

              {/* Dual Time Pill in Schedule */}
              {event.showtime && event.meetupTime ? (
                <div className="flex items-center gap-2 mt-1 text-xs font-bold text-text-dark">
                  <span className="text-primary flex items-center gap-1">
                    <Clock size={12} /> Meet: {event.meetupTime}
                  </span>
                  <span className="text-text-light">•</span>
                  <span className="text-secondary font-extrabold">
                    Show: {event.showtime}
                  </span>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3 text-xs text-text-medium mt-1">
                <span className="flex items-center gap-1">
                  <MapPin size={13} className="text-primary" /> {event.location}
                </span>
                {event.meetupLocation && (
                  <span className="text-[11px] text-text-light truncate">
                    (Pre-meet: {event.meetupLocation})
                  </span>
                )}
                <span>• {event.confirmed} Guests going</span>
              </div>
            </div>

            {/* Capacity & Action Arrow */}
            <div className="flex items-center justify-between md:justify-end gap-3 mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-none border-gray-100">
              <StatusRing capacity={event.capacity} size={42} strokeWidth={3.5} />
              <button className="w-9 h-9 rounded-full bg-surface-high group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-colors">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {scheduledEvents.length === 0 && (
        <div className="mt-20 flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 rounded-full bg-surface-high flex items-center justify-center text-text-light mb-4">
            <CalendarCheck2 size={32} />
          </div>
          <h3 className="font-headline font-bold text-lg text-text-dark">No events in your schedule</h3>
          <p className="text-xs text-text-medium mt-1 max-w-xs">
            Browse the Unified Feed and RSVP to upcoming happenings to see them in your personal agenda.
          </p>
          <button onClick={() => navigate('/')} className="btn btn-primary mt-4">
            Explore Feed
          </button>
        </div>
      )}

      {/* Calendar Subscription Modal */}
      <CalendarSubscribeModal
        isOpen={isSubscribeModalOpen}
        onClose={() => setIsSubscribeModalOpen(false)}
        events={events}
      />
    </div>
  );
}
