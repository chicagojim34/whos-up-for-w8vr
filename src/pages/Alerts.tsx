import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  UserPlus,
  Radio,
  Check,
  Clock,
  Users,
  Settings as SettingsIcon,
  X,
} from 'lucide-react';
import cx from 'classnames';
import { useApp } from '../hooks/useApp';
import { useToast } from '../hooks/useToast';
import { formatAgo } from '../lib/datetime';
import type { AlertType } from '../types';

type Filter = 'all' | AlertType;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'invite', label: 'Invites' },
  { key: 'broadcast', label: 'Host updates' },
  { key: 'confirm', label: 'RSVPs' },
  { key: 'waitlist', label: 'Waitlist' },
  { key: 'circle', label: 'Circles' },
];

const ICONS: Record<AlertType, typeof Bell> = {
  invite: UserPlus,
  confirm: CheckCircle2,
  broadcast: Radio,
  waitlist: Clock,
  circle: Users,
};

const ICON_TONES: Record<AlertType, string> = {
  invite: 'bg-primary-fixed text-primary-container',
  confirm: 'bg-secondary-container text-secondary',
  broadcast: 'bg-primary-fixed text-primary-container',
  waitlist: 'bg-error-container text-error',
  circle: 'bg-surface-high text-text-medium',
};

export default function Alerts() {
  const navigate = useNavigate();
  const {
    alerts,
    visibleAlerts,
    markAlertRead,
    markAllAlertsRead,
    dismissAlert,
    joinCircle,
    user,
  } = useApp();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = visibleAlerts.filter(a => filter === 'all' || a.type === filter);
  const unreadCount = visibleAlerts.filter(a => a.unread).length;
  const suppressedCount = alerts.length - visibleAlerts.length;

  const openAlert = (eventId?: string, circleId?: string) => {
    if (eventId) navigate(`/event/${eventId}`);
    else if (circleId) navigate(`/circle/${circleId}`);
  };

  return (
    <div className="flex flex-col pb-28 px-6 bg-surface animate-fade-in max-w-3xl mx-auto w-full">
      <header className="mt-4 mb-4 flex justify-between items-end gap-4 flex-wrap">
        <div>
          <h1 className="font-headline font-black text-3xl text-text-dark">Alerts</h1>
          <p className="text-text-medium text-sm mt-1">
            Logistics for what you said yes to, and not much else.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAlertsRead}
            className="text-xs font-headline font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
          >
            <Check size={14} aria-hidden="true" /> Mark all read
          </button>
        )}
      </header>

      <div
        className="flex gap-2 pb-3 mb-4 overflow-x-auto no-scrollbar"
        role="group"
        aria-label="Filter alerts"
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
            {f.key === 'all' && ` (${visibleAlerts.length})`}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-3 list-none">
        {filtered.map(item => {
          const Icon = ICONS[item.type];
          return (
            <li
              key={item.id}
              className={cx('card p-4 flex items-start gap-4 transition-all', {
                'bg-surface-lowest': item.unread,
                'bg-surface-low shadow-none': !item.unread,
              })}
            >
              <span
                className={cx(
                  'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0',
                  ICON_TONES[item.type]
                )}
                aria-hidden="true"
              >
                <Icon size={20} />
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-3">
                  <h2 className="font-headline font-bold text-sm text-text-dark">
                    {item.eventId || item.circleId ? (
                      <button
                        onClick={() => {
                          markAlertRead(item.id);
                          openAlert(item.eventId, item.circleId);
                        }}
                        className="text-left hover:text-primary transition-colors"
                      >
                        {item.title}
                      </button>
                    ) : (
                      item.title
                    )}
                  </h2>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-text-light">
                      {formatAgo(item.createdAt)}
                    </span>
                    {item.unread && (
                      <span className="w-2 h-2 rounded-full bg-primary" aria-label="Unread" />
                    )}
                    <button
                      onClick={() => dismissAlert(item.id)}
                      className="text-text-light hover:text-text-dark transition-colors"
                      aria-label={`Dismiss "${item.title}"`}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </span>
                </div>

                <p className="text-xs text-text-medium mt-1 leading-relaxed">{item.desc}</p>

                {item.type === 'invite' && item.circleId && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => {
                        joinCircle(item.circleId!);
                        markAlertRead(item.id);
                        toast.show('Circle joined');
                        navigate(`/circle/${item.circleId}`);
                      }}
                      className="btn btn-primary text-xs py-1.5 px-4"
                    >
                      {item.actionLabel ?? 'Accept invite'}
                    </button>
                    <button
                      onClick={() => dismissAlert(item.id)}
                      className="btn btn-ghost text-xs py-1.5 px-3"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <div className="mt-16 flex flex-col items-center justify-center text-center p-8">
          <span className="w-16 h-16 rounded-full bg-surface-high flex items-center justify-center text-text-light mb-4">
            <Bell size={32} aria-hidden="true" />
          </span>
          <h2 className="font-headline font-bold text-lg text-text-dark">All caught up</h2>
          <p className="text-xs text-text-medium mt-1 max-w-xs">
            Only logistics for events you joined, and the tiers you switched on, reach you here.
          </p>
        </div>
      )}

      {suppressedCount > 0 && (
        <p className="mt-8 text-xs text-text-light text-center flex items-center justify-center gap-1.5 flex-wrap">
          <SettingsIcon size={13} aria-hidden="true" />
          {suppressedCount} {suppressedCount === 1 ? 'alert was' : 'alerts were'} held back by your
          muted events and{' '}
          {[
            !user.notifications.closeFriends && 'close friends',
            !user.notifications.circleActivity && 'circle activity',
            !user.notifications.publicNearby && 'nearby public events',
          ]
            .filter(Boolean)
            .join(', ') || 'tier'}{' '}
          settings.{' '}
          <Link to="/settings" className="text-primary font-semibold hover:underline">
            Change what reaches you
          </Link>
        </p>
      )}
    </div>
  );
}
