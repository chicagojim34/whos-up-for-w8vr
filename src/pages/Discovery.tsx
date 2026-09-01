import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Compass, Layers, Lock, Globe, ArrowRight, Eye } from 'lucide-react';
import cx from 'classnames';
import { useApp } from '../context/AppContext';
import { CATEGORY_DEFINITIONS, type EventCategory } from '../components/CategoryChip';
import { StatusRing } from '../components/StatusRing';

export default function Discovery() {
  const navigate = useNavigate();
  const { events } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('All Events');
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || 'e1');

  const visibleEvents = events.filter(e => {
    if (selectedCategory === 'All Events') return true;
    return e.category === selectedCategory;
  });

  const selectedEvent = events.find(e => e.id === selectedEventId) || visibleEvents[0] || events[0];

  return (
    <div className="flex-col pb-28 px-6 bg-surface animate-fade-in max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mt-4 mb-4">
        <h1 className="font-headline font-black text-3xl text-text-dark">Discovery Map</h1>
        <p className="text-text-medium text-sm mt-1">
          Explore nearby happenings with real-time capacity and privacy obfuscation.
        </p>
      </div>

      {/* Category Pills on Map */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
        {CATEGORY_DEFINITIONS.map(cat => (
          <button
            key={cat.label}
            onClick={() => setSelectedCategory(cat.label)}
            className={cx(
              'px-3.5 py-1.5 rounded-full text-xs font-headline font-bold shrink-0 transition-all cursor-pointer',
              selectedCategory === cat.label
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-lowest text-text-medium hover:bg-surface-high'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Interactive Styled Map View */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg border-4 border-white h-[440px] bg-[#E2E8F0] select-none">
        {/* Map Grid / Aesthetic Vector Layout */}
        <div className="absolute inset-0 bg-[#f1f5f9]">
          {/* Stylized River Vector */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
            <path
              d="M -50,180 C 150,220 220,100 450,260 C 600,340 750,200 900,280"
              fill="none"
              stroke="#93C5FD"
              strokeWidth="48"
              strokeLinecap="round"
            />
            {/* Grid Streets */}
            <line x1="0" y1="90" x2="1000" y2="90" stroke="#CBD5E1" strokeWidth="6" />
            <line x1="0" y1="210" x2="1000" y2="210" stroke="#CBD5E1" strokeWidth="8" />
            <line x1="0" y1="330" x2="1000" y2="330" stroke="#CBD5E1" strokeWidth="6" />
            <line x1="180" y1="0" x2="180" y2="600" stroke="#CBD5E1" strokeWidth="8" />
            <line x1="380" y1="0" x2="380" y2="600" stroke="#CBD5E1" strokeWidth="6" />
            <line x1="600" y1="0" x2="600" y2="600" stroke="#CBD5E1" strokeWidth="8" />
          </svg>

          {/* District Labels */}
          <div className="absolute top-8 left-8 text-[11px] font-bold text-slate-400 tracking-widest uppercase">
            DOWNTOWN ARTS DISTRICT
          </div>
          <div className="absolute bottom-12 right-12 text-[11px] font-bold text-slate-400 tracking-widest uppercase">
            EAST RIVERWALK
          </div>
          <div className="absolute top-20 right-20 text-[11px] font-bold text-slate-400 tracking-widest uppercase">
            WEST RIDGE PARK
          </div>
        </div>

        {/* User Location Radar */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: '42%', top: '48%' }}
        >
          <div className="w-12 h-12 bg-primary/20 rounded-full animate-ping" />
          <div className="absolute inset-0 m-auto w-4 h-4 bg-primary border-2 border-white rounded-full shadow-lg" />
        </div>

        {/* Dynamic Pins */}
        {visibleEvents.map((evt, idx) => {
          const isSelected = selectedEvent?.id === evt.id;
          const isPrivate = evt.privacy === 'circle' || evt.privacy === 'hidden';

          // Fixed distributed coordinates based on event index
          const pinPositions = [
            { x: 30, y: 38 },
            { x: 74, y: 24 },
            { x: 50, y: 64 },
            { x: 62, y: 52 },
            { x: 78, y: 76 },
          ];
          const pos = pinPositions[idx % pinPositions.length];

          return (
            <div
              key={evt.id}
              onClick={() => setSelectedEventId(evt.id)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-20 group"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              {/* Privacy Obfuscation Radius Glow if Private */}
              {isPrivate && (
                <div
                  className={cx(
                    'absolute -inset-4 rounded-full border border-dashed transition-all pointer-events-none',
                    isSelected
                      ? 'border-primary bg-primary/10 animate-pulse'
                      : 'border-slate-400 bg-slate-300/20 opacity-60'
                  )}
                  style={{ width: '64px', height: '64px', margin: '-14px 0 0 -14px' }}
                />
              )}

              {/* Pin Icon Bubble */}
              <div
                className={cx(
                  'rounded-full p-2.5 flex items-center justify-center border-2 border-white shadow-xl transition-all',
                  isSelected
                    ? 'scale-125 bg-primary text-white shadow-primary/40'
                    : isPrivate
                    ? 'bg-secondary text-white group-hover:scale-110'
                    : 'bg-surface-lowest text-primary group-hover:scale-110'
                )}
              >
                {isPrivate ? <Lock size={15} /> : <MapPin size={16} />}
              </div>

              {/* Tooltip Label */}
              <div
                className={cx(
                  'absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold shadow-md pointer-events-none transition-all',
                  isSelected ? 'opacity-100 scale-100 text-primary' : 'opacity-0 scale-90 group-hover:opacity-100'
                )}
              >
                {evt.title}
              </div>
            </div>
          );
        })}

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <button
            onClick={() => alert('Recentering map on your location (Austin, TX)')}
            className="w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-text-dark hover:text-primary transition-colors cursor-pointer"
            title="My Location"
          >
            <Navigation size={18} />
          </button>
        </div>

        {/* Selected Event Bottom Drawer Overlay */}
        {selectedEvent && (
          <div className="absolute bottom-4 left-4 right-4 z-30 animate-slide-up">
            <div
              onClick={() => navigate(`/event/${selectedEvent.id}`)}
              className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/80 flex items-center gap-4 cursor-pointer hover:bg-white transition-all group"
            >
              <img
                src={selectedEvent.image}
                alt={selectedEvent.title}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="badge bg-secondary-container text-on-secondary-container text-[9px] py-0 px-1.5 font-bold uppercase">
                    {selectedEvent.category}
                  </span>
                  <span className="text-[11px] font-bold text-text-medium">
                    {selectedEvent.distance}
                  </span>
                </div>
                <h3 className="font-headline font-bold text-base text-text-dark truncate group-hover:text-primary transition-colors">
                  {selectedEvent.title}
                </h3>
                <p className="text-xs text-text-light truncate">
                  {selectedEvent.timeLabel} • {selectedEvent.location}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <StatusRing capacity={selectedEvent.capacity} size={38} strokeWidth={3.5} />
                <button className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-sm group-hover:translate-x-1 transition-transform">
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend & Privacy Note */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 p-4 bg-surface-low rounded-2xl text-xs text-text-medium">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Public Event</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-secondary" />
            <span>Circle Event</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border-2 border-dashed border-slate-400" />
            <span>Privacy Obfuscated</span>
          </div>
        </div>
        <span className="text-text-light italic">
          Private residence pins show approx. 500m radius
        </span>
      </div>
    </div>
  );
}
