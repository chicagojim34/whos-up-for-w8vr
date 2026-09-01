import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  Bell, 
  Compass, 
  PlusCircle, 
  Users, 
  LayoutDashboard, 
  Calendar, 
  RotateCcw
} from 'lucide-react';
import cx from 'classnames';

import { AppProvider, useApp } from './context/AppContext';
import Feed from './pages/Feed';
import PostEvent from './pages/PostEvent';
import Circles from './pages/Circles';
import EventDetails from './pages/EventDetails';
import Discovery from './pages/Discovery';
import Alerts from './pages/Alerts';
import Schedule from './pages/Schedule';

interface NavigationProps {
  isDesktop: boolean;
}

const Navigation = ({ isDesktop }: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { alerts, resetToDefaults } = useApp();

  const unreadAlertsCount = alerts.filter(a => a.unread).length;

  const navItems = [
    { path: '/', label: 'FEED', icon: LayoutDashboard },
    { path: '/discovery', label: 'DISCOVERY', icon: Compass },
    { path: '/post', label: 'POST', icon: PlusCircle },
    { path: '/circles', label: 'CIRCLES', icon: Users },
    { path: '/schedule', label: 'SCHEDULE', icon: Calendar },
    { path: '/alerts', label: 'ALERTS', icon: Bell, badge: unreadAlertsCount },
  ];

  return (
    <nav className="bottom-nav">
      {/* Desktop-only Branding in Sidebar */}
      {isDesktop && (
        <div className="flex flex-col gap-1 w-full px-2 mb-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white font-headline font-black text-sm shadow-md">
              W
            </div>
            <span className="font-headline font-black text-2xl text-primary tracking-tight">
              W8VR
            </span>
          </div>
          <span className="text-[10px] font-bold text-text-light uppercase tracking-widest pl-1 mt-0.5">
            Fluid Social Curator
          </span>
        </div>
      )}

      {/* Nav Links Container */}
      <div className={cx('flex w-full', isDesktop ? 'flex-col gap-2' : 'justify-around items-center')}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path === '/' && location.pathname === '/feed');
          return (
            <button
              key={item.label}
              className={cx('nav-item', { active: isActive })}
              onClick={() => navigate(item.path)}
            >
              <div className="relative flex items-center justify-center">
                <Icon size={isDesktop ? 20 : 20} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2.5 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop-only User Profile Card & Reset Demo at Bottom of Sidebar */}
      {isDesktop && (
        <div className="flex flex-col gap-3 w-full mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-surface-low">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 border-2 border-white shadow-sm shrink-0">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                  alt="Felix"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-headline font-bold text-xs text-text-dark">Felix Vance</span>
                <span className="text-[10px] font-bold text-primary">HOST • AUSTIN, TX</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (confirm('Reset demo state to original defaults?')) {
                resetToDefaults();
              }
            }}
            className="text-[10px] font-bold text-text-light hover:text-primary flex items-center justify-center gap-1.5 py-1.5 transition-colors cursor-pointer"
            title="Reset local mock database to defaults"
          >
            <RotateCcw size={12} /> Reset Demo Data
          </button>
        </div>
      )}
    </nav>
  );
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isPost = location.pathname === '/post';

  return (
    <header className="app-header">
      <div
        className="flex items-center gap-2.5 cursor-pointer"
        onClick={() => navigate('/')}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border-2 border-white shadow-sm">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
            alt="Felix"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="logo">W8VR</div>
      </div>

      <div className="flex items-center gap-2">
        {isPost ? (
          <span className="badge bg-primary-fixed text-primary text-[10px] font-bold">
            CREATOR MODE
          </span>
        ) : (
          <button
            onClick={() => navigate('/post')}
            className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shadow-sm"
          >
            <PlusCircle size={13} /> Post
          </button>
        )}
      </div>
    </header>
  );
};

const DeviceSwitcher = ({ mode, setMode }: { mode: string; setMode: (m: string) => void }) => {
  return (
    <div className="device-switcher-container" title="Toggle responsive preview width">
      <div className="device-switcher">
        <button
          className={cx('switcher-btn', { active: mode === 'mobile' })}
          onClick={() => setMode('mobile')}
        >
          Mobile
        </button>
        <button
          className={cx('switcher-btn', { active: mode === 'tablet' })}
          onClick={() => setMode('tablet')}
        >
          Tablet
        </button>
        <button
          className={cx('switcher-btn', { active: mode === 'desktop' })}
          onClick={() => setMode('desktop')}
        >
          Desktop
        </button>
      </div>
    </div>
  );
};

function AppContent() {
  const location = useLocation();
  const [mode, setMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const isPost = location.pathname === '/post';
  const isEventDetail = location.pathname.startsWith('/event/');

  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.className = `mode-${mode}`;
    }
  }, [mode]);

  return (
    <div className={cx('app-container', { [`mode-${mode}`]: true })}>
      <DeviceSwitcher mode={mode} setMode={m => setMode(m as 'mobile' | 'tablet' | 'desktop')} />

      {!isPost && <Navigation isDesktop={mode === 'desktop'} />}

      <div className={cx('content-area', { 'full-width': isPost })}>
        {!isEventDetail && <Header />}

        <main className="animate-fade-in flex-col flex-1">
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/discovery" element={<Discovery />} />
            <Route path="/post" element={<PostEvent />} />
            <Route path="/circles" element={<Circles />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/event/:id" element={<EventDetails />} />
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
