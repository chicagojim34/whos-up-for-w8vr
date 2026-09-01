import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Download, ArrowRight, CalendarCheck2, Clock } from 'lucide-react';
import cx from 'classnames';
import { useApp } from '../hooks/useApp';
import { useToast } from '../hooks/useToast';
import { StatusRing } from '../components/StatusRing';
import { capacityPct, confirmedCount, myRsvp } from '../lib/events';
import { buildIcs, dayKey, formatDayHeading, formatTime, isPast } from '../lib/datetime';
import type { EventItem } from '../types';

type Filter = 'all' | 'going' | 'pending';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Everything' },
  { key: 'going', label: 'Confirmed' },
  { key: 'pending', label: 'Maybe & waitlist' },
];

export default function Schedule() {
  const navigate = useNavigate();
  const { events } = useApp();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('all');

  /** Chronological, grouped by calendar day — possible only now that
   *  startsAt is a real timestamp rather than the string "Tomorrow". */
  const { groups, committed } = useMemo(() => {
    const mine = events.filter(e => {
      const status = myRsvp(e);
      if (status === null || status === 'declined') return false;
      if (isPast(e.startsAt)) return false;
      if (filter === 'going') return status === 'going';
      if (filter === 'pending') return status === 'maybe' || status === 'waitlist';
      return true;
    });

    const sorted = [...mine].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );

    const byDay = new Map<string, EventItem[]>();
    for (const e of sorted) {
      const key = dayKey(e.startsAt);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(e);
    }

    return {
      groups: [...byDay.entries()],
      committed: events.filter(e => myRsvp(e) === 'going' && !isPast(e.startsAt)),
    };
  }, [events, filter]);

  const total = groups.reduce((sum, [, list]) => sum + list.length, 0);

  const handleExport = () => {
    if (committed.length === 0) {
      toast.show('Nothing confirmed yet — RSVP to something first', 'warning');
      return;
    }
    const ics = buildIcs(committed);
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'w8vr-schedule.ics';
    link.click();
    URL.revokeObjectURL(url);
    toast.show(`${committed.length} events exported to your calendar`);
  };

  return (
    <div className="flex flex-col pb-28 px-6 bg-surface animate-fade-in max-w-4xl mx-auto w-full">
      <header className="mt-4 mb-4 flex justify-between items-end gap-4 flex-wrap">
        <div>
          <h1 className="font-headline font-black text-3xl text-text-dark">My schedule</h1>
          <p className="text-text-medium text-sm mt-1">
            Everything you have committed to, in the order it happens.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="btn btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 shrink-0"
        >
          <Download size={14} aria-hidden="true" /> Export .ics
        </button>
      </header>

      <div
        className="flex gap-2 pb-3 mb-4 overflow-x-auto no-scrollbar"
        role="group"
        aria-label="Filter schedule"
      >
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={cx(
              'px-4 py-1.5 rounded-full text-xs font-bold font-headline transition-all shrink-0',
              {
                'bg-primary text-white shadow-sm': filter === f.key,
                'bg-surface-high text-text-medium hover:bg-surface-highest': filter !== f.key,
              }
            )}
          >
            {f.label}
            {f.key === 'all' && ` (${total})`}
          </button>
        ))}
      </div>

      {groups.map(([key, dayEvents]) => (
        <section key={key} className="mb-8">
          <h2 className="font-headline font-bold text-sm text-text-light uppercase tracking-widest mb-3">
            {formatDayHeading(dayEvents[0].startsAt)}
          </h2>

          <ul className="flex flex-col gap-3 list-none">
            {dayEvents.map(event => {
              const status = myRsvp(event);
              return (
                <li key={event.id}>
                  <button
                    onClick={() => navigate(`/event/${event.id}`)}
                    className="card w-full p-5 flex flex-col @2xl:flex-row @2xl:items-center gap-4 text-left group"
                  >
                    <span className="flex @2xl:flex-col items-center justify-center p-3 bg-surface-low rounded-2xl @2xl:w-20 shrink-0 text-center gap-1 @2xl:gap-0">
                      <span className="font-headline font-black text-xl text-text-dark tabular-nums">
                        {formatTime(event.startsAt).replace(/\s?[AP]M/i, '')}
                      </span>
                      <span className="text-[10px] font-bold text-text-light">
                        {formatTime(event.startsAt).match(/[AP]M/i)?.[0] ?? ''}
                      </span>
                    </span>

                    <img
                      src={event.image}
                      alt=""
                      className="w-full @2xl:w-28 h-32 @2xl:h-20 rounded-xl object-cover shrink-0"
                      loading="lazy"
                    />

                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="badge bg-secondary-container text-on-secondary-container text-[9px] font-bold">
                          {event.category}
                        </span>
                        <span
                          className={cx('badge text-[9px] font-bold flex items-center gap-1', {
                            'bg-secondary-fixed text-on-secondary-container': status === 'going',
                            'bg-surface-high text-text-medium': status === 'maybe',
                            'bg-error-container text-error': status === 'waitlist',
                          })}
                        >
                          {status === 'waitlist' && <Clock size={10} aria-hidden="true" />}
                          {status === 'going'
                            ? 'Going'
                            : status === 'maybe'
                              ? 'Maybe'
                              : 'Waitlisted'}
                        </span>
                      </span>

                      <span className="block font-headline font-bold text-lg text-text-dark group-hover:text-primary transition-colors truncate">
                        {event.title}
                      </span>

                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-medium mt-1">
                        <span className="flex items-center gap-1 min-w-0">
                          <MapPin size={13} className="text-primary shrink-0" aria-hidden="true" />
                          <span className="truncate">{event.location}</span>
                        </span>
                        <span>{confirmedCount(event)} going</span>
                      </span>
                    </span>

                    <span className="flex items-center justify-between @2xl:justify-end gap-3 shrink-0">
                      <StatusRing
                        capacity={capacityPct(event)}
                        size={42}
                        strokeWidth={3.5}
                        variant="bare"
                        srLabel={`${confirmedCount(event)} of ${event.maxSpots} spots taken`}
                      />
                      <span className="w-9 h-9 rounded-full bg-surface-high group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-colors">
                        <ArrowRight size={16} aria-hidden="true" />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {total === 0 && (
        <div className="mt-16 flex flex-col items-center justify-center text-center p-8">
          <span className="w-16 h-16 rounded-full bg-surface-high flex items-center justify-center text-text-light mb-4">
            <CalendarCheck2 size={32} aria-hidden="true" />
          </span>
          <h2 className="font-headline font-bold text-lg text-text-dark">Nothing booked yet</h2>
          <p className="text-xs text-text-medium mt-1 max-w-xs">
            RSVP to something in the feed and it shows up here, sorted by when it happens.
          </p>
          <button onClick={() => navigate('/')} className="btn btn-primary mt-4">
            Explore the feed
          </button>
        </div>
      )}
    </div>
  );
}
