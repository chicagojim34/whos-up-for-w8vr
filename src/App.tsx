import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Compass,
  PlusCircle,
  Users,
  LayoutDashboard,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import cx from 'classnames';

import { AppProvider } from './context/AppContext';
import { useApp } from './hooks/useApp';
import { useDeviceMode, type DeviceMode } from './hooks/useDeviceMode';
import { Avatar } from './components/Avatar';
import { ConfirmDialog } from './components/ConfirmDialog';
import { useConfirm } from './hooks/useConfirm';
import Feed from './pages/Feed';
import PostEvent from './pages/PostEvent';
import Circles from './pages/Circles';
import CircleDetail from './pages/CircleDetail';
import EventDetails from './pages/EventDetails';
import Discovery from './pages/Discovery';
import Alerts from './pages/Alerts';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

const NAV_ITEMS = [
  { path: '/', label: 'FEED', icon: LayoutDashboard },
  { path: '/discovery', label: 'DISCOVERY', icon: Compass },
  { path: '/post', label: 'POST', icon: PlusCircle },
  { path: '/circles', label: 'CIRCLES', icon: Users },
  { path: '/schedule', label: 'SCHEDULE', icon: Calendar },
  { path: '/alerts', label: 'ALERTS', icon: Bell },
];

const Navigation = ({ isDesktop }: { isDesktop: boolean }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { alerts, user, resetToDefaults } = useApp();
  const confirm = useConfirm();

  const unreadAlertsCount = alerts.filter(a => a.unread).length;

  const handleReset = async () => {
    const ok = await confirm.ask({
      title: 'Reset demo data?',
      body: 'Every event, circle, RSVP and alert returns to its starting state. This cannot be undone.',
      confirmLabel: 'Reset everything',
      tone: 'danger',
    });
    if (ok) resetToDefaults();
  };

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {isDesktop && (
        <div className="flex flex-col gap-1 w-full px-2 mb-6">
          <button
            className="flex items-center gap-2.5 text-left"
            onClick={() => navigate('/')}
            aria-label="W8VR home"
          >
            <span className="w-9 h-9 rounded-2xl primary-gradient flex items-center justify-center text-white font-headline font-black text-sm shadow-md">
              W
            </span>
            <span className="font-headline font-black text-2xl text-primary tracking-tight">
              W8VR
            </span>
          </button>
          <span className="text-[10px] font-bold text-text-light uppercase tracking-widest pl-1 mt-0.5">
            Fluid Social Curator
          </span>
        </div>
      )}

      <div className={cx('flex w-full', isDesktop ? 'flex-col gap-2' : 'justify-around items-center')}>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const badge = item.path === '/alerts' ? unreadAlertsCount : 0;
          return (
            <button
              key={item.label}
              className={cx('nav-item', { active: isActive })}
              onClick={() => navigate(item.path)}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="relative flex items-center justify-center">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
                {badge > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 bg-error text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm"
                    aria-hidden="true"
                  >
                    {badge}
                  </span>
                )}
              </span>
              <span className="nav-label">{item.label}</span>
              {badge > 0 && <span className="sr-only-text">{badge} unread</span>}
            </button>
          );
        })}
      </div>

      {isDesktop && (
        <div className="flex flex-col gap-3 w-full mt-auto pt-4">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-surface-low hover:bg-surface-high transition-colors text-left w-full"
          >
            <Avatar name={user.name} size={36} />
            <span className="flex flex-col">
              <span className="font-headline font-bold text-xs text-text-dark">{user.name}</span>
              <span className="text-[10px] font-bold text-primary">{user.tagline}</span>
            </span>
          </button>

          <button
            onClick={handleReset}
            className="text-[10px] font-bold text-text-light hover:text-primary flex items-center justify-center gap-1.5 py-1.5 transition-colors"
          >
            <RotateCcw size={12} aria-hidden="true" /> Reset Demo Data
          </button>
        </div>
      )}

      <ConfirmDialog {...confirm.dialogProps} />
    </nav>
  );
};

const DeviceSwitcher = ({
  mode,
  isOverridden,
  setMode,
}: {
  mode: DeviceMode;
  isOverridden: boolean;
  setMode: (m: DeviceMode | null) => void;
}) => (
  <div className="device-switcher" role="group" aria-label="Preview layout at a different width">
    <button
      className={cx('switcher-btn', { active: !isOverridden })}
      onClick={() => setMode(null)}
      title="Follow this window's width"
      aria-pressed={!isOverridden}
    >
      Auto
    </button>
    {(['mobile', 'tablet', 'desktop'] as const).map(m => (
      <button
        key={m}
        className={cx('switcher-btn', { active: isOverridden && mode === m })}
        onClick={() => setMode(m)}
        aria-pressed={isOverridden && mode === m}
      >
        {m[0].toUpperCase() + m.slice(1)}
      </button>
    ))}
  </div>
);

const Header = ({
  mode,
  viewportMode,
  isOverridden,
  setMode,
}: {
  mode: DeviceMode;
  viewportMode: DeviceMode;
  isOverridden: boolean;
  setMode: (m: DeviceMode | null) => void;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useApp();
  const isPost = location.pathname === '/post';

  return (
    <header className="app-header">
      <button
        className="flex items-center gap-2.5"
        onClick={() => navigate('/')}
        aria-label="W8VR home"
      >
        <Avatar name={user.name} size={32} />
        <span className="logo">W8VR</span>
      </button>

      <div className="flex items-center gap-3">
        {viewportMode !== 'mobile' && (
          <DeviceSwitcher mode={mode} isOverridden={isOverridden} setMode={setMode} />
        )}
        {isPost ? (
          <span className="badge bg-primary-fixed text-primary-container text-[10px] font-bold">
            CREATOR MODE
          </span>
        ) : (
          <button
            onClick={() => navigate('/post')}
            className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shadow-sm"
          >
            <PlusCircle size={13} aria-hidden="true" /> Post
          </button>
        )}
      </div>
    </header>
  );
};

function AppContent() {
  const location = useLocation();
  const { mode, viewportMode, isOverridden, setMode } = useDeviceMode();
  const isPost = location.pathname === '/post';
  const isEventDetail = location.pathname.startsWith('/event/');

  useEffect(() => {
    document.documentElement.className = `mode-${mode}`;
  }, [mode]);

  // Route changes should start the reader at the top, not wherever the
  // previous page happened to be scrolled to.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className={cx('app-container', `mode-${mode}`)}>
      <a href="#main" className="sr-only-text">
        Skip to main content
      </a>

      {!isPost && <Navigation isDesktop={mode === 'desktop'} />}

      {/* `@container` makes page layouts respond to this column's width rather
          than the window's, so the device-preview modes show the layout a
          phone or tablet would really get. */}
      <div className={cx('content-area @container', { 'full-width': isPost })}>
        {!isEventDetail && (
          <Header
            mode={mode}
            viewportMode={viewportMode}
            isOverridden={isOverridden}
            setMode={setMode}
          />
        )}

        <main id="main" className="animate-fade-in flex flex-col flex-1">
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/discovery" element={<Discovery />} />
            <Route path="/post" element={<PostEvent />} />
            <Route path="/circles" element={<Circles />} />
            <Route path="/circle/:id" element={<CircleDetail />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/event/:id" element={<EventDetails />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}
