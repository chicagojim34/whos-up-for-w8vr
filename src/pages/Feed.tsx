import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle2, X, Zap, Search, VolumeX, RotateCcw } from 'lucide-react';
import cx from 'classnames';
import { useApp } from '../context/AppContext';
import { CategoryChip, CATEGORY_DEFINITIONS, type EventCategory } from '../components/CategoryChip';
import { StatusRing } from '../components/StatusRing';
import { AvatarGroup } from '../components/AvatarGroup';

export default function Feed() {
  const { events, rsvpEvent, muteEvent, unmuteEvent } = useApp();
  const [activeCategory, setActiveCategory] = useState<EventCategory>('All Events');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const filteredEvents = events.filter(event => {
    const matchesCategory = activeCategory === 'All Events' || event.category === activeCategory;
    const matchesSearch = 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-col pb-12 animate-fade-in">
      {/* Search & Category Filter Bar */}
      <div className="px-6 pt-2 pb-4 flex-col gap-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" size={18} />
          <input
            type="text"
            placeholder="Search events, vibes, or locations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field pl-11 py-3 text-sm rounded-full bg-surface-high border-none focus:bg-surface-lowest"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-light hover:text-text-dark"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Categories Chips */}
        <div
          className="flex gap-2 overflow-x-auto pb-1 no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {CATEGORY_DEFINITIONS.map(cat => (
            <CategoryChip
              key={cat.label}
              category={cat.label}
              active={activeCategory === cat.label}
              onClick={() => setActiveCategory(cat.label)}
              size="md"
            />
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div
        className="grid gap-8 px-6"
        style={{
          display: 'grid',
          gridGap: '2rem',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        }}
      >
        {filteredEvents.map(event => {
          if (event.muted) {
            return (
              <div
                key={event.id}
                className="card card-muted flex items-center justify-between p-5 border-dashed border-gray-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-text-light">
                    <VolumeX size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-text-medium">{event.title}</h4>
                    <p className="text-xs text-text-light">Event muted & hidden from feed</p>
                  </div>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    unmuteEvent(event.id);
                  }}
                  className="btn btn-ghost flex items-center gap-1 text-xs font-bold"
                >
                  <RotateCcw size={14} /> Unmute
                </button>
              </div>
            );
          }

          return (
            <div
              key={event.id}
              className="card cursor-pointer group"
              style={{
                padding: 0,
                overflow: 'hidden',
                position: 'relative',
                borderRadius: '1.5rem',
              }}
              onClick={() => navigate(`/event/${event.id}`)}
            >
              {/* Image Section */}
              <div style={{ position: 'relative', height: '230px' }}>
                <img
                  src={event.image}
                  alt={event.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Distance Badge */}
                <div
                  className="glass-panel badge flex items-center gap-1 text-xs"
                  style={{ position: 'absolute', top: 14, right: 14 }}
                >
                  <MapPin size={13} className="text-primary" />
                  <span className="font-bold">{event.distance}</span>
                </div>

                {/* Filling Fast Banner */}
                {event.fillingFast && (
                  <div
                    style={{ position: 'absolute', top: 14, left: 14 }}
                    className="badge bg-red-600 text-white flex items-center gap-1 font-black tracking-widest text-[9px]"
                  >
                    <Zap size={11} fill="white" /> FILLING FAST
                  </div>
                )}

                {/* Signature Status Ring in Bottom Right of Image */}
                <div style={{ position: 'absolute', bottom: 12, right: 14, zIndex: 10 }}>
                  <StatusRing capacity={event.capacity} size={46} strokeWidth={4} variant="glass" />
                </div>
              </div>

              {/* Content Section */}
              <div className="px-8 pb-8 pt-6 flex-col gap-4">
                {/* Meta Row */}
                <div className="flex justify-between items-center text-xs font-bold">
                  <span
                    className={cx('px-2.5 py-1 rounded-md text-[10px] uppercase font-headline tracking-widest', {
                      'bg-secondary-container text-on-secondary-container': event.type === 'JOINED CIRCLE',
                      'bg-surface-high text-text-medium': event.type !== 'JOINED CIRCLE',
                    })}
                  >
                    {event.type}
                  </span>
                  <span className="text-text-dark font-headline font-extrabold opacity-85">
                    {event.timeLabel}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3
                    className="font-headline font-black text-2xl tracking-tight text-text-dark group-hover:text-primary transition-colors"
                    style={{ lineHeight: '1.2' }}
                  >
                    {event.title}
                  </h3>
                  <p className="text-sm text-text-medium leading-relaxed mt-2 line-clamp-2">
                    {event.description}
                  </p>
                </div>

                {/* Action & Attendees Row */}
                <div className="flex justify-between items-center mt-3 pt-5 border-t border-gray-100/70">
                  {/* Avatars */}
                  {event.avatars.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <AvatarGroup names={event.avatars} size={30} max={3} />
                      <span className="text-xs font-semibold text-text-medium">
                        {event.confirmed} going
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-text-light uppercase tracking-wider">
                      {event.confirmed} Going • {event.interested} Interested
                    </div>
                  )}

                  {/* Status Actions */}
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {event.status === 'Attending' && (
                      <div className="flex items-center gap-1.5 text-primary font-headline font-bold text-sm bg-primary-fixed/40 px-3 py-1.5 rounded-full">
                        <CheckCircle2 size={16} /> Attending
                      </div>
                    )}
                    {event.status === 'RSVP Now' && (
                      <button
                        onClick={() => rsvpEvent(event.id, 'going')}
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
                      >
                        RSVP Now
                      </button>
                    )}
                    {event.status === 'Pending RSVP' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => muteEvent(event.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-quiet hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Mute/Decline event"
                        >
                          <X size={18} />
                        </button>
                        <button
                          onClick={() => rsvpEvent(event.id, 'going')}
                          className="btn btn-outline"
                          style={{
                            padding: '0.45rem 1rem',
                            fontSize: '0.875rem',
                            borderRadius: '9999px',
                          }}
                        >
                          I'm In
                        </button>
                      </div>
                    )}
                    {event.status === 'Waitlisted' && (
                      <span className="badge bg-amber-100 text-amber-900 font-bold text-xs">
                        Waitlisted (#{event.waitlist})
                      </span>
                    )}
                    {event.status === 'Declined' && (
                      <span className="text-xs font-bold text-quiet">Declined</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="mt-20 flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 rounded-full bg-surface-high flex items-center justify-center text-text-light mb-4">
            <Search size={32} />
          </div>
          <h3 className="font-headline font-bold text-lg">No events found</h3>
          <p className="text-sm text-text-medium mt-1">
            Try adjusting your category filter or search keywords.
          </p>
          <button
            onClick={() => {
              setActiveCategory('All Events');
              setSearchQuery('');
            }}
            className="btn btn-outline mt-4"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
