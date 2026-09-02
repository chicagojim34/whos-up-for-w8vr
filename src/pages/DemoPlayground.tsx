import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Play, 
  RotateCcw, 
  Crown, 
  User, 
  Gamepad2, 
  Radio, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Flame, 
  Sliders, 
  Share2, 
  Users, 
  ExternalLink 
} from 'lucide-react';
import cx from 'classnames';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { useToast } from '../hooks/useToast';
import { Avatar } from '../components/Avatar';
import { DEMO_PERSONAS, type DemoPersona } from '../lib/demo-personas';
import type { UserProfile } from '../types';

export default function DemoPlayground() {
  const navigate = useNavigate();
  const { user: authUser, updateCurrentUserProfile, openAuthModal } = useAuth();
  const { resetToDefaults, createEvent } = useApp();
  const toast = useToast();

  const [copiedLink, setCopiedLink] = useState(false);

  const handleSwitchPersona = (persona: DemoPersona) => {
    const patch: Partial<UserProfile> = {
      id: persona.id,
      name: persona.name,
      email: persona.email,
      role: persona.role,
      tagline: persona.tagline,
      homeCity: persona.homeCity,
      gameHandles: persona.gameHandles || {},
      authProvider: 'demo',
    };
    updateCurrentUserProfile(patch);
    toast.show(`Switched persona to ${persona.name} (${persona.badge})`);
  };

  const handleShareDemo = () => {
    const url = `${window.location.origin}/demo`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.show('Demo Playground link copied to clipboard');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleLaunchConcertScenario = () => {
    handleSwitchPersona(DEMO_PERSONAS[4]); // Leo Chen - Concert Scout
    toast.show('Concert Rush Scenario activated! Redirecting to Discovery & Feed...');
    navigate('/');
  };

  const handleLaunchEsportsScenario = () => {
    handleSwitchPersona(DEMO_PERSONAS[3]); // Jordan Cruz - Esports Host
    toast.show('Esports & Gaming Night activated! Redirecting to Circles...');
    navigate('/circles');
  };

  const handleLaunchAdminScenario = () => {
    handleSwitchPersona(DEMO_PERSONAS[0]); // Felix Vance - Admin
    toast.show('Admin War Room activated! Redirecting to Admin Portal in Settings...');
    navigate('/settings');
  };

  const handleLaunchCalendarScenario = () => {
    toast.show('Calendar Sync Scenario activated! Redirecting to Schedule...');
    navigate('/schedule');
  };

  const handleSeedExtraEvents = () => {
    const sampleTitles = [
      'LCD Soundsystem Live at Aragon Ballroom',
      'Charli XCX - Brat Tour Experience',
      'Smash Ultimate Friday Fight Night',
      'Board Game Strategy & Catan Showdown',
      'Indie Film Premiere & Rooftop Social'
    ];
    
    sampleTitles.forEach((title, idx) => {
      createEvent({
        title,
        vibe: `High-energy community gathering with live RSVP tracking and automated sync.`,
        category: idx % 2 === 0 ? 'Entertainment' : 'Online/Play',
        image: `https://images.unsplash.com/photo-${1514525253161 + idx}?w=800&auto=format&fit=crop&q=80`,
        startsAt: new Date(Date.now() + (idx + 1) * 86400000).toISOString(),
        showtime: idx % 2 === 0 ? '8:00 PM' : undefined,
        location: 'The Metro Chicago',
        exactAddress: '3730 N Clark St, Chicago, IL 60613',
        maxSpots: 15 + idx * 5,
        privacy: 'public',
        autoWaitlist: true,
        isVirtual: false,
      });
    });

    toast.show('Seeded 5 extra live events to the feed');
    navigate('/');
  };

  return (
    <div className="flex flex-col pb-28 px-4 sm:px-6 bg-surface animate-fade-in max-w-4xl mx-auto w-full">
      {/* Header Banner */}
      <header className="mt-4 mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-gray-900 via-primary-container to-gray-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles size={160} />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="badge bg-amber-400 text-gray-900 font-black text-xs px-2.5 py-1 tracking-wider uppercase flex items-center gap-1 shadow-sm">
              <Sparkles size={12} /> Interactive Sandbox
            </span>
            <span className="badge bg-white/20 text-white text-xs font-bold px-2 py-1">
              W8VR Demo Environment
            </span>
          </div>

          <h1 className="font-headline font-black text-3xl sm:text-4xl text-white tracking-tight leading-tight">
            Explore W8VR in Real-Time
          </h1>
          <p className="text-gray-300 text-sm sm:text-base mt-2 leading-relaxed">
            Test live ticketing APIs (Ticketmaster &amp; SeatGeek), role-based administration, calendar subscriptions, quiet notification tiers, and interactive user personas.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={handleShareDemo}
              className="btn bg-white text-gray-950 hover:bg-gray-100 font-headline font-bold text-xs py-2 px-4 flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Share2 size={14} />
              <span>{copiedLink ? 'Link Copied!' : 'Share Demo Link'}</span>
            </button>
            <button
              onClick={() => {
                resetToDefaults();
                toast.show('Demo sandbox reset to default seed data');
              }}
              className="btn bg-white/10 hover:bg-white/20 text-white text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Reset Sandbox</span>
            </button>
          </div>
        </div>
      </header>

      {/* Section 1: Persona Switcher */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-headline font-black text-xl text-text-dark flex items-center gap-2">
            <Users size={20} className="text-primary" /> Interactive Persona Switcher
          </h2>
          <span className="text-xs text-text-light font-medium">Select a profile to test permissions</span>
        </div>
        <p className="text-xs text-text-medium mb-4">
          Switch between roles instantaneously to experience how W8VR adapts to different community members.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {DEMO_PERSONAS.map(persona => {
            const isActive = authUser.name === persona.name;
            return (
              <div
                key={persona.id}
                className={cx(
                  'p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3',
                  isActive
                    ? 'bg-primary-container/10 border-primary shadow-sm ring-1 ring-primary/40'
                    : 'bg-surface-lowest border-gray-200/80 hover:border-gray-300'
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar name={persona.avatarSeed} size={42} />
                      <div className="min-w-0">
                        <p className="font-headline font-bold text-sm text-text-dark truncate">
                          {persona.name}
                        </p>
                        <p className="text-[11px] text-text-light truncate">{persona.homeCity}</p>
                      </div>
                    </div>
                    <span
                      className={cx(
                        'text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0',
                        persona.role === 'admin' && 'bg-primary text-white',
                        persona.role === 'moderator' && 'bg-secondary text-white',
                        persona.role === 'user' && 'bg-surface-high text-text-dark'
                      )}
                    >
                      {persona.role}
                    </span>
                  </div>

                  <p className="text-xs text-text-medium font-medium mb-1">{persona.tagline}</p>
                  <p className="text-[11px] text-text-light leading-relaxed">{persona.description}</p>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">
                    {persona.badge}
                  </span>
                  {isActive ? (
                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                      <CheckCircle2 size={14} /> Active Persona
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSwitchPersona(persona)}
                      className="btn btn-outline text-xs py-1 px-2.5 font-bold cursor-pointer"
                    >
                      Switch Persona
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Interactive Scenarios */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-headline font-black text-xl text-text-dark flex items-center gap-2">
            <Play size={20} className="text-primary" /> Curated Demo Scenarios
          </h2>
          <span className="badge bg-secondary-container text-on-secondary-container text-[10px] font-bold">
            5 Ready to Run
          </span>
        </div>
        <p className="text-xs text-text-medium mb-4">
          One-click guided scenarios pre-configured to showcase specific features and workflows.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Scenario 1 */}
          <div className="p-5 bg-surface-lowest rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Radio size={18} />
                </span>
                <div>
                  <h3 className="font-headline font-bold text-base text-text-dark">
                    Live Concert Rush
                  </h3>
                  <span className="text-[10px] text-text-light uppercase font-bold tracking-wider">
                    Ticketmaster &amp; SeatGeek Live APIs
                  </span>
                </div>
              </div>
              <p className="text-xs text-text-medium leading-relaxed">
                Test real-time event auto-pulling. Search live tours, auto-populate venue details, showtimes, images, and test high-volume waitlists.
              </p>
            </div>
            <button
              onClick={handleLaunchConcertScenario}
              className="btn btn-primary text-xs py-2 px-3 w-full flex items-center justify-center gap-1.5 font-bold shadow-xs cursor-pointer"
            >
              <span>Launch Concert Rush</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Scenario 2 */}
          <div className="p-5 bg-surface-lowest rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <Gamepad2 size={18} />
                </span>
                <div>
                  <h3 className="font-headline font-bold text-base text-text-dark">
                    Esports &amp; Gaming Night
                  </h3>
                  <span className="text-[10px] text-text-light uppercase font-bold tracking-wider">
                    Game Handles &amp; Discord Sync
                  </span>
                </div>
              </div>
              <p className="text-xs text-text-medium leading-relaxed">
                Experience gamer coordination. Link Discord, Riot, and Steam handles, view game lobby codes, and organize casual tournament circles.
              </p>
            </div>
            <button
              onClick={handleLaunchEsportsScenario}
              className="btn btn-secondary text-xs py-2 px-3 w-full flex items-center justify-center gap-1.5 font-bold shadow-xs cursor-pointer"
            >
              <span>Launch Esports Night</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Scenario 3 */}
          <div className="p-5 bg-surface-lowest rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Crown size={18} />
                </span>
                <div>
                  <h3 className="font-headline font-bold text-base text-text-dark">
                    Admin &amp; Safety War Room
                  </h3>
                  <span className="text-[10px] text-text-light uppercase font-bold tracking-wider">
                    Role-Based Access Control (RBAC)
                  </span>
                </div>
              </div>
              <p className="text-xs text-text-medium leading-relaxed">
                Test community management as a System Admin. Assign Admin and Moderator roles to attendees and inspect the audit trail.
              </p>
            </div>
            <button
              onClick={handleLaunchAdminScenario}
              className="btn btn-outline text-xs py-2 px-3 w-full flex items-center justify-center gap-1.5 font-bold cursor-pointer"
            >
              <span>Launch Admin Console</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Scenario 4 */}
          <div className="p-5 bg-surface-lowest rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Calendar size={18} />
                </span>
                <div>
                  <h3 className="font-headline font-bold text-base text-text-dark">
                    Live Calendar Subscription
                  </h3>
                  <span className="text-[10px] text-text-light uppercase font-bold tracking-wider">
                    Apple, Google &amp; Outlook Sync
                  </span>
                </div>
              </div>
              <p className="text-xs text-text-medium leading-relaxed">
                Test subscribing to an ongoing schedule feed so calendar clients stay automatically updated as new events are added or updated.
              </p>
            </div>
            <button
              onClick={handleLaunchCalendarScenario}
              className="btn btn-outline text-xs py-2 px-3 w-full flex items-center justify-center gap-1.5 font-bold cursor-pointer"
            >
              <span>Launch Calendar Sync</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Section 3: Feature Tour & Checklist */}
      <section className="mb-10 p-6 bg-surface-low rounded-3xl border border-gray-200/60">
        <h2 className="font-headline font-black text-lg text-text-dark mb-1 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-primary" /> Key Feature Test Checklist
        </h2>
        <p className="text-xs text-text-medium mb-4">
          Click any feature below to navigate directly to its dedicated interface:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={() => navigate('/post')}
            className="p-3 bg-surface-lowest rounded-xl text-left hover:bg-surface-high transition-colors flex items-center justify-between gap-2 border border-gray-100 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="font-bold text-xs text-text-dark truncate">1. Live Event Auto-Pull</p>
              <p className="text-[10px] text-text-light truncate">Ticketmaster &amp; SeatGeek Catalog Integration</p>
            </div>
            <ExternalLink size={14} className="text-primary shrink-0" />
          </button>

          <button
            onClick={() => navigate('/schedule')}
            className="p-3 bg-surface-lowest rounded-xl text-left hover:bg-surface-high transition-colors flex items-center justify-between gap-2 border border-gray-100 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="font-bold text-xs text-text-dark truncate">2. Multi-Calendar Subscriptions</p>
              <p className="text-[10px] text-text-light truncate">Webcal, iCal, Google, Apple Calendar</p>
            </div>
            <ExternalLink size={14} className="text-primary shrink-0" />
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="p-3 bg-surface-lowest rounded-xl text-left hover:bg-surface-high transition-colors flex items-center justify-between gap-2 border border-gray-100 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="font-bold text-xs text-text-dark truncate">3. Admin Role Delegation &amp; RBAC</p>
              <p className="text-[10px] text-text-light truncate">👑 Admin, 🛡️ Moderator, 👤 Member</p>
            </div>
            <ExternalLink size={14} className="text-primary shrink-0" />
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="p-3 bg-surface-lowest rounded-xl text-left hover:bg-surface-high transition-colors flex items-center justify-between gap-2 border border-gray-100 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="font-bold text-xs text-text-dark truncate">4. Calm Notification Tiers</p>
              <p className="text-[10px] text-text-light truncate">Logistics, Close Friends, Smart Filters</p>
            </div>
            <ExternalLink size={14} className="text-primary shrink-0" />
          </button>
        </div>
      </section>

      {/* Section 4: Sandbox Controls */}
      <section className="p-6 bg-surface-lowest rounded-3xl border border-gray-200/80 shadow-xs">
        <h2 className="font-headline font-black text-lg text-text-dark mb-1 flex items-center gap-2">
          <Sliders size={18} className="text-primary" /> Sandbox Data Controls
        </h2>
        <p className="text-xs text-text-medium mb-4">
          Quickly reset data or generate rich test cases for live demonstrations.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSeedExtraEvents}
            className="btn btn-outline text-xs py-2 px-3 font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Flame size={14} className="text-primary" />
            <span>Seed 5 Busy Weekend Events</span>
          </button>

          <button
            onClick={openAuthModal}
            className="btn btn-outline text-xs py-2 px-3 font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <User size={14} />
            <span>Open Firebase Auth Modal</span>
          </button>

          <button
            onClick={() => {
              resetToDefaults();
              toast.show('All demo data reset to starting state');
            }}
            className="btn bg-error-container text-error hover:bg-error/20 text-xs py-2 px-3 font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </section>
    </div>
  );
}
