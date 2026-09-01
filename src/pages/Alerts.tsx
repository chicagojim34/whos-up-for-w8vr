import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCircle2, 
  UserPlus, 
  Clock, 
  Radio, 
  Sparkles, 
  Check, 
  Trash2, 
  Calendar 
} from 'lucide-react';
import cx from 'classnames';
import { useApp } from '../context/AppContext';

export default function Alerts() {
  const navigate = useNavigate();
  const { alerts, markAlertRead, markAllAlertsRead, joinCircle } = useApp();
  const [filter, setFilter] = useState<'all' | 'invite' | 'confirm' | 'broadcast'>('all');

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'all') return true;
    return a.type === filter;
  });

  const unreadCount = alerts.filter(a => a.unread).length;

  return (
    <div className="flex-col pb-28 px-6 bg-surface animate-fade-in max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mt-4 mb-4 flex justify-between items-end">
        <div>
          <h1 className="font-headline font-black text-3xl text-text-dark">Alerts</h1>
          <p className="text-text-medium text-sm mt-1">
            Real-time logistical updates, circle invites, and RSVP confirmations.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAlertsRead}
            className="text-xs font-headline font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
          >
            <Check size={14} /> Mark all read
          </button>
        )}
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
          All ({alerts.length})
        </button>
        <button
          onClick={() => setFilter('invite')}
          className={cx('px-4 py-1.5 rounded-full text-xs font-bold font-headline transition-all cursor-pointer', {
            'bg-primary text-white shadow-sm': filter === 'invite',
            'bg-surface-high text-text-medium hover:bg-surface-highest': filter !== 'invite',
          })}
        >
          Invites
        </button>
        <button
          onClick={() => setFilter('broadcast')}
          className={cx('px-4 py-1.5 rounded-full text-xs font-bold font-headline transition-all cursor-pointer', {
            'bg-primary text-white shadow-sm': filter === 'broadcast',
            'bg-surface-high text-text-medium hover:bg-surface-highest': filter !== 'broadcast',
          })}
        >
          Host Updates 📢
        </button>
        <button
          onClick={() => setFilter('confirm')}
          className={cx('px-4 py-1.5 rounded-full text-xs font-bold font-headline transition-all cursor-pointer', {
            'bg-primary text-white shadow-sm': filter === 'confirm',
            'bg-surface-high text-text-medium hover:bg-surface-highest': filter !== 'confirm',
          })}
        >
          RSVPs
        </button>
      </div>

      {/* Alerts List */}
      <div className="flex flex-col gap-3">
        {filteredAlerts.map(item => (
          <div
            key={item.id}
            onClick={() => {
              markAlertRead(item.id);
              if (item.eventId) navigate(`/event/${item.eventId}`);
              else if (item.circleId) navigate('/circles');
            }}
            className={cx(
              'card p-4 flex items-start gap-4 transition-all cursor-pointer hover:bg-surface-lowest border',
              item.unread
                ? 'bg-surface-lowest border-primary/25 shadow-md'
                : 'bg-surface-low border-transparent opacity-85 hover:opacity-100'
            )}
          >
            {/* Icon Bubble */}
            <div
              className={cx('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', {
                'bg-primary-fixed text-primary': item.type === 'invite',
                'bg-secondary-container text-secondary': item.type === 'confirm',
                'bg-amber-100 text-amber-900': item.type === 'broadcast',
                'bg-gray-200 text-text-medium': !['invite', 'confirm', 'broadcast'].includes(item.type),
              })}
            >
              {item.type === 'invite' && <UserPlus size={20} />}
              {item.type === 'confirm' && <CheckCircle2 size={20} />}
              {item.type === 'broadcast' && <Radio size={20} />}
            </div>

            {/* Alert Content */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className="font-headline font-bold text-sm text-text-dark truncate">
                  {item.title}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-text-light">{item.time}</span>
                  {item.unread && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  )}
                </div>
              </div>

              <p className="text-xs text-text-medium mt-1 leading-relaxed">{item.desc}</p>

              {/* Action Buttons inside alert */}
              {item.type === 'invite' && item.circleId && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      joinCircle(item.circleId!);
                      markAlertRead(item.id);
                      window.alert('You joined the circle!');
                    }}
                    className="btn btn-primary text-xs py-1.5 px-4"
                  >
                    Accept Invite
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      markAlertRead(item.id);
                    }}
                    className="btn btn-ghost text-xs py-1.5 px-3"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="mt-20 flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 rounded-full bg-surface-high flex items-center justify-center text-text-light mb-4">
            <Bell size={32} />
          </div>
          <h3 className="font-headline font-bold text-lg text-text-dark">All caught up!</h3>
          <p className="text-xs text-text-medium mt-1 max-w-xs">
            We only send essential logistics and close-friend updates to keep your notifications quiet.
          </p>
        </div>
      )}
    </div>
  );
}
