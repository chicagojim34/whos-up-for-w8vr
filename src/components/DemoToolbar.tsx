import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  X
} from 'lucide-react';
import cx from 'classnames';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { useToast } from '../hooks/useToast';
import { Avatar } from './Avatar';
import { DEMO_PERSONAS, type DemoPersona } from '../lib/demo-personas';
import type { UserProfile } from '../types';

export function DemoToolbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, updateCurrentUserProfile } = useAuth();
  const { resetToDefaults } = useApp();
  const toast = useToast();

  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissedState, setDismissedState] = useState(() => {
    return localStorage.getItem('w8vr_demo_toolbar_dismissed') === 'true';
  });

  const isDemoRouteOrParam = location.pathname === '/demo' || location.search.includes('demo=1') || location.search.includes('demo=true');
  const isDismissed = !isDemoRouteOrParam && dismissedState;

  if (isDismissed) {
    return (
      <button
        onClick={() => {
          setDismissedState(false);
          localStorage.removeItem('w8vr_demo_toolbar_dismissed');
        }}
        className="fixed bottom-4 right-4 z-40 bg-gray-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg hover:bg-black transition-transform hover:scale-105 cursor-pointer"
        title="Open Demo Sandbox Toolbar"
      >
        <Sparkles size={13} className="text-amber-400" />
        <span>Demo Sandbox</span>
      </button>
    );
  }

  const switchPersona = (persona: DemoPersona) => {
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
    setIsExpanded(false);
  };

  const currentPersona = DEMO_PERSONAS.find(p => p.name === authUser.name) || {
    id: authUser.id,
    name: authUser.name,
    badge: authUser.role === 'admin' ? '👑 Admin' : authUser.role === 'moderator' ? '🛡️ Moderator' : '👤 Member',
    role: authUser.role,
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-md text-white border-t border-white/10 shadow-2xl transition-all">
      {/* Expanded Persona Picker */}
      {isExpanded && (
        <div className="max-w-4xl mx-auto p-4 border-b border-white/10 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <h3 className="font-headline font-bold text-sm text-white">
                Interactive Persona Sandbox Switcher
              </h3>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-white text-xs p-1 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {DEMO_PERSONAS.map(p => {
              const isSelected = authUser.name === p.name;
              return (
                <button
                  key={p.id}
                  onClick={() => switchPersona(p)}
                  className={cx(
                    'p-3 rounded-2xl text-left transition-all border flex items-start gap-3 cursor-pointer',
                    isSelected
                      ? 'bg-white/15 border-amber-400 ring-1 ring-amber-400'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  )}
                >
                  <Avatar name={p.avatarSeed} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-xs text-white truncate">{p.name}</p>
                      <span
                        className={cx(
                          'text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full',
                          p.role === 'admin' && 'bg-primary text-white',
                          p.role === 'moderator' && 'bg-secondary text-white',
                          p.role === 'user' && 'bg-white/20 text-gray-200'
                        )}
                      >
                        {p.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{p.tagline}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-xs">
        {/* Left: Persona trigger */}
        <button
          onClick={() => setIsExpanded(prev => !prev)}
          className="flex items-center gap-2 hover:bg-white/10 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer min-w-0"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-gray-400 font-medium hidden sm:inline">Active Persona:</span>
            <span className="font-bold text-white truncate">{currentPersona.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded font-bold">
              {currentPersona.badge}
            </span>
          </div>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/demo')}
            className="btn bg-white/10 hover:bg-white/20 text-white text-[11px] py-1 px-2.5 flex items-center gap-1 rounded-lg font-bold transition-colors cursor-pointer"
            title="Open Demo Playground with Scenarios & Checklist"
          >
            <Sparkles size={12} className="text-amber-400" />
            <span className="hidden sm:inline">Playground Hub</span>
            <span className="sm:hidden">Hub</span>
          </button>

          <button
            onClick={() => {
              resetToDefaults();
              toast.show('Demo sandbox reset to pristine state');
            }}
            className="btn bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white text-[11px] py-1 px-2 flex items-center gap-1 rounded-lg transition-colors cursor-pointer"
            title="Reset sandbox state"
          >
            <RotateCcw size={12} />
            <span className="hidden md:inline">Reset</span>
          </button>

          <button
            onClick={() => {
              setDismissedState(true);
              localStorage.setItem('w8vr_demo_toolbar_dismissed', 'true');
            }}
            className="text-gray-400 hover:text-white p-1 ml-1 cursor-pointer"
            title="Hide Demo Bar"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
