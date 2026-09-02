import { useMemo, useState } from 'react';
import { Bell, ShieldOff, Flag, UserCheck, RotateCcw, Gamepad2, Radio } from 'lucide-react';
import cx from 'classnames';
import { useApp } from '../hooks/useApp';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Avatar } from '../components/Avatar';
import { GameAccounts } from '../components/GameAccounts';
import { formatAgo } from '../lib/datetime';
import {
  getTicketmasterKey,
  setTicketmasterKey,
  getSeatGeekClientId,
  setSeatGeekClientId,
} from '../services/liveEventCatalog';

interface ToggleRowProps {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
}

const ToggleRow = ({ id, title, description, checked, disabled, onChange }: ToggleRowProps) => (
  <div className="flex items-start justify-between gap-4 p-4 bg-surface-low rounded-2xl">
    <div className="min-w-0">
      <label htmlFor={id} className="font-headline font-bold text-sm text-text-dark block">
        {title}
      </label>
      <p className="text-xs text-text-medium mt-0.5 leading-relaxed">{description}</p>
    </div>
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cx(
        'relative w-12 h-7 rounded-full shrink-0 transition-colors mt-0.5',
        checked ? 'bg-primary' : 'bg-surface-highest',
        disabled && 'opacity-60'
      )}
    >
      <span
        className={cx(
          'absolute top-1 w-5 h-5 rounded-full bg-surface-lowest shadow-sm transition-[left]',
          checked ? 'left-6' : 'left-1'
        )}
        aria-hidden="true"
      />
    </button>
  </div>
);

export default function Settings() {
  const {
    user,
    events,
    circles,
    reports,
    updateNotifications,
    unblockUser,
    toggleCloseFriend,
    resetToDefaults,
  } = useApp();
  const toast = useToast();
  const confirm = useConfirm();

  const [tmKey, setTmKey] = useState(getTicketmasterKey());
  const [sgClientId, setSgClientId] = useState(getSeatGeekClientId());

  const handleSaveApiKeys = () => {
    setTicketmasterKey(tmKey);
    setSeatGeekClientId(sgClientId);
    toast.show('Live Event API credentials saved');
  };

  /** Everyone the user could plausibly mark as a close friend. */
  const people = useMemo(() => {
    const seen = new Map<string, string>();
    for (const circle of circles.filter(c => c.isJoined)) {
      for (const m of circle.memberList) {
        if (m.id !== user.id) seen.set(m.id, m.name);
      }
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name })).slice(0, 12);
  }, [circles, user.id]);

  const blockedPeople = useMemo(() => {
    const names = new Map<string, string>();
    for (const e of events) names.set(e.hostId, e.hostName);
    for (const c of circles) for (const m of c.memberList) names.set(m.id, m.name);
    return user.blockedIds.map(id => ({ id, name: names.get(id) ?? 'Someone you blocked' }));
  }, [user.blockedIds, events, circles]);

  const handleReset = async () => {
    const ok = await confirm.ask({
      title: 'Reset demo data?',
      body: 'Every event, circle, RSVP, report and alert returns to its starting state. This cannot be undone.',
      confirmLabel: 'Reset everything',
      tone: 'danger',
    });
    if (ok) {
      resetToDefaults();
      toast.show('Demo data reset');
    }
  };

  return (
    <div className="flex flex-col pb-28 px-6 bg-surface animate-fade-in max-w-3xl mx-auto w-full">
      <header className="mt-4 mb-6">
        <h1 className="font-headline font-black text-3xl text-text-dark">Settings</h1>
        <p className="text-text-medium text-sm mt-1">
          Control what reaches you and who can reach you.
        </p>
      </header>

      <div className="flex items-center gap-4 p-4 bg-surface-lowest rounded-2xl shadow-sm mb-8">
        <Avatar name={user.name} size={52} />
        <div className="min-w-0">
          <p className="font-headline font-bold text-base text-text-dark">{user.name}</p>
          <p className="text-xs text-text-medium">{user.homeCity}</p>
        </div>
      </div>

      {/* Notification tiers */}
      <section className="mb-10">
        <h2 className="font-headline font-bold text-lg text-text-dark flex items-center gap-2 mb-1">
          <Bell size={18} className="text-primary" aria-hidden="true" /> Notifications
        </h2>
        <p className="text-xs text-text-medium mb-4 max-w-prose">
          W8VR exists to be quieter than a group chat. Every tier below is off by default unless it
          earns its place.
        </p>

        <div className="flex flex-col gap-2">
          <ToggleRow
            id="tier-logistics"
            title="Logistics for events you said yes to"
            description="Time changes, venue moves, waitlist promotions. Always on — this is the whole point."
            checked
            disabled
          />
          <ToggleRow
            id="tier-close"
            title="Close friends post something new"
            description={`Only the ${user.closeFriendIds.length} people you have marked below.`}
            checked={user.notifications.closeFriends}
            onChange={v => updateNotifications({ closeFriends: v })}
          />
          <ToggleRow
            id="tier-circle"
            title="Circle activity"
            description="New events and member changes in circles you have joined."
            checked={user.notifications.circleActivity}
            onChange={v => updateNotifications({ circleActivity: v })}
          />
          <ToggleRow
            id="tier-public"
            title="Public events near you"
            description="Anything happening within a few miles. Noisiest tier — off by default."
            checked={user.notifications.publicNearby}
            onChange={v => updateNotifications({ publicNearby: v })}
          />
        </div>
      </section>

      {/* Close friends */}
      <section className="mb-10">
        <h2 className="font-headline font-bold text-lg text-text-dark flex items-center gap-2 mb-1">
          <UserCheck size={18} className="text-primary" aria-hidden="true" /> Close friends
        </h2>
        <p className="text-xs text-text-medium mb-4">
          Tap to add or remove. Only these people can trigger the close-friends tier.
        </p>

        <ul className="flex flex-wrap gap-2 list-none">
          {people.map(person => {
            const active = user.closeFriendIds.includes(person.id);
            return (
              <li key={person.id}>
                <button
                  onClick={() => toggleCloseFriend(person.id)}
                  aria-pressed={active}
                  className={cx(
                    'flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full text-xs font-bold transition-colors',
                    active
                      ? 'bg-primary-fixed text-primary-container'
                      : 'bg-surface-low text-text-medium hover:bg-surface-high'
                  )}
                >
                  <Avatar name={person.name} size={24} ringColor="transparent" />
                  {person.name}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Game accounts */}
      <section className="mb-10">
        <h2 className="font-headline font-bold text-lg text-text-dark flex items-center gap-2 mb-1">
          <Gamepad2 size={18} className="text-primary" aria-hidden="true" /> Game accounts
        </h2>
        <GameAccounts />
      </section>

      {/* Live Event Catalog APIs */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-headline font-bold text-lg text-text-dark flex items-center gap-2">
            <Radio size={18} className="text-primary animate-pulse" aria-hidden="true" /> Live Event Catalog APIs
          </h2>
          <span className="badge bg-secondary-container text-on-secondary-container text-[10px] font-bold">
            2 Connected
          </span>
        </div>
        <p className="text-xs text-text-medium mb-4">
          Powers real-time live concert, sports, and comedy auto-pull directly from official ticketing networks.
        </p>

        <div className="flex flex-col gap-3.5 p-4 bg-surface-low rounded-2xl border border-primary/15">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="tm-key" className="text-xs font-bold text-text-dark">
                Ticketmaster Discovery API Key
              </label>
              <span className="text-[10px] font-bold text-success flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success" /> Active
              </span>
            </div>
            <input
              id="tm-key"
              type="text"
              value={tmKey}
              onChange={e => setTmKey(e.target.value)}
              className="input-field text-xs font-mono py-2 bg-surface-lowest"
              placeholder="Paste Ticketmaster Consumer Key"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="sg-client-id" className="text-xs font-bold text-text-dark">
                SeatGeek Platform Client ID
              </label>
              <span className="text-[10px] font-bold text-success flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success" /> Active
              </span>
            </div>
            <input
              id="sg-client-id"
              type="text"
              value={sgClientId}
              onChange={e => setSgClientId(e.target.value)}
              className="input-field text-xs font-mono py-2 bg-surface-lowest"
              placeholder="Paste SeatGeek client_id"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleSaveApiKeys}
              className="btn btn-outline text-xs py-1.5 px-3 font-bold"
            >
              Save API Credentials
            </button>
          </div>
        </div>
      </section>

      {/* Blocked */}
      <section className="mb-10">
        <h2 className="font-headline font-bold text-lg text-text-dark flex items-center gap-2 mb-1">
          <ShieldOff size={18} className="text-primary" aria-hidden="true" /> Blocked people
        </h2>
        <p className="text-xs text-text-medium mb-4">
          Their events and messages are hidden from you everywhere.
        </p>

        {blockedPeople.length === 0 ? (
          <p className="text-sm text-text-light p-4 bg-surface-low rounded-2xl">
            You have not blocked anyone.
          </p>
        ) : (
          <ul className="flex flex-col gap-2 list-none">
            {blockedPeople.map(person => (
              <li
                key={person.id}
                className="flex items-center justify-between gap-3 p-3 bg-surface-low rounded-2xl"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Avatar name={person.name} size={32} />
                  <span className="font-bold text-sm text-text-dark truncate">{person.name}</span>
                </span>
                <button
                  onClick={() => {
                    unblockUser(person.id);
                    toast.show(`${person.name} unblocked`);
                  }}
                  className="btn btn-ghost text-xs font-bold shrink-0"
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Reports */}
      <section className="mb-10">
        <h2 className="font-headline font-bold text-lg text-text-dark flex items-center gap-2 mb-1">
          <Flag size={18} className="text-primary" aria-hidden="true" /> Your reports
        </h2>
        <p className="text-xs text-text-medium mb-4">
          Everything you have flagged for the safety team.
        </p>

        {reports.length === 0 ? (
          <p className="text-sm text-text-light p-4 bg-surface-low rounded-2xl">
            You have not reported anything.
          </p>
        ) : (
          <ul className="flex flex-col gap-2 list-none">
            {reports.map(report => (
              <li key={report.id} className="p-4 bg-surface-low rounded-2xl">
                <div className="flex justify-between items-baseline gap-3">
                  <p className="font-bold text-sm text-text-dark truncate">{report.eventTitle}</p>
                  <span className="text-[10px] text-text-light shrink-0">
                    {formatAgo(report.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-text-medium mt-1 capitalize">{report.reason}</p>
                {report.note && (
                  <p className="text-xs text-text-light mt-1 italic">“{report.note}”</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <button
          onClick={handleReset}
          className="btn bg-error-container text-error w-full py-3.5 flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} aria-hidden="true" /> Reset demo data
        </button>
      </section>

      <ConfirmDialog {...confirm.dialogProps} />
    </div>
  );
}
