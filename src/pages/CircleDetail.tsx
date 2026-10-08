import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Share2, Users, LogOut, Lock, Globe, CalendarDays, Plus } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { useAuth } from '../hooks/useAuth';
import { circleInviteUrl } from '../lib/circles';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ShareSheet } from '../components/ShareSheet';
import { Avatar } from '../components/Avatar';
import { CirclePlaySection } from '../components/CirclePlaySection';
import { StatusRing } from '../components/StatusRing';
import NotFound from './NotFound';
import { ME } from '../types';
import { capacityPct, confirmedCount, rankEvents } from '../lib/events';
import { formatWhen } from '../lib/datetime';

export default function CircleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invite = searchParams.get('invite');
  const { findCircle, events, joinCircle, leaveCircle, openCircleInvite } = useApp();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [inviteFailedFor, setInviteFailedFor] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();
  const [shareOpen, setShareOpen] = useState(false);

  const circle = findCircle(id);

  // An invite link to a shared circle this device has not seen yet.
  const needsInviteLookup = !circle && Boolean(id && invite && isAuthenticated) && inviteFailedFor !== id;
  useEffect(() => {
    if (!needsInviteLookup || !id || !invite) return;
    let cancelled = false;
    openCircleInvite(id, invite).then(found => {
      if (!found && !cancelled) setInviteFailedFor(id);
    });
    return () => {
      cancelled = true;
    };
  }, [needsInviteLookup, id, invite, openCircleInvite]);

  const circleEvents = useMemo(
    () => (circle ? rankEvents(events.filter(e => e.circleId === circle.id && !e.muted)) : []),
    [events, circle]
  );

  if (!circle && invite && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center text-center gap-4 px-6 py-24 max-w-md mx-auto animate-fade-in">
        <Users size={40} className="text-primary" aria-hidden="true" />
        <h1 className="font-headline font-bold text-2xl text-text-dark">You have a circle invite</h1>
        <p className="text-sm text-text-light max-w-sm">Sign in to see who is in it and join.</p>
        <button onClick={openAuthModal} className="btn btn-primary py-2.5 px-6 text-sm">
          Sign in to join
        </button>
      </div>
    );
  }

  if (!circle && needsInviteLookup) {
    return (
      <div className="px-6 py-24 text-center text-sm text-text-light" role="status">
        Opening your invite…
      </div>
    );
  }

  if (!circle) {
    return (
      <NotFound
        title="That circle is not here"
        body="The invite may have expired, or the circle may have been closed by its creator."
      />
    );
  }

  const memberCount = circle.memberList.length + circle.extraMembers;
  const circleUrl = circleInviteUrl(circle);

  const handleLeave = async () => {
    const ok = await confirm.ask({
      title: `Leave ${circle.name}?`,
      body: "You will stop seeing this circle's events and updates. You can rejoin if someone invites you again.",
      confirmLabel: 'Leave circle',
      tone: 'danger',
    });
    if (!ok) return;
    leaveCircle(circle.id);
    toast.show(`You left ${circle.name}`, 'info');
    navigate('/circles');
  };

  return (
    <div className="flex flex-col pb-28 px-6 bg-surface animate-fade-in max-w-4xl mx-auto w-full">
      <button
        onClick={() => navigate('/circles')}
        className="btn btn-ghost self-start mt-2 -ml-2 flex items-center gap-1 text-sm"
      >
        <ChevronLeft size={18} aria-hidden="true" /> All circles
      </button>

      {/* Circle header */}
      <header
        className="rounded-3xl p-8 mt-3 mb-8 text-white relative overflow-hidden shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${circle.color} 0%, color-mix(in srgb, ${circle.color} 55%, #191c1d) 100%)`,
        }}
      >
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="badge bg-white/20 text-white text-[10px] uppercase font-bold tracking-widest">
            {circle.categoryTag}
          </span>
          <span className="badge bg-white/20 text-white text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5">
            {circle.isPrivate ? (
              <>
                <Lock size={11} aria-hidden="true" /> Private
              </>
            ) : (
              <>
                <Globe size={11} aria-hidden="true" /> Open to join
              </>
            )}
          </span>
        </div>

        <h1 className="font-headline font-black text-3xl text-white text-balance">{circle.name}</h1>
        <p className="text-sm text-white/90 mt-2 max-w-prose">{circle.description}</p>

        <p className="flex items-center gap-1.5 text-xs font-bold text-white/90 mt-4">
          <Users size={14} aria-hidden="true" /> {memberCount}{' '}
          {memberCount === 1 ? 'member' : 'members'}
        </p>

        <div className="flex flex-wrap gap-2 mt-6">
          {circle.isJoined ? (
            <>
              <button
                onClick={() => setShareOpen(true)}
                className="btn bg-surface-lowest text-primary-container py-2.5 px-5 text-sm flex items-center gap-2"
              >
                <Share2 size={15} aria-hidden="true" /> Invite people
              </button>
              <button
                onClick={handleLeave}
                className="btn bg-white/15 text-white py-2.5 px-5 text-sm flex items-center gap-2 hover:bg-white/25"
              >
                <LogOut size={15} aria-hidden="true" /> Leave circle
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                joinCircle(circle.id);
                toast.show(`You joined ${circle.name}`);
              }}
              className="btn bg-surface-lowest text-primary-container py-2.5 px-5 text-sm flex items-center gap-2"
            >
              <Plus size={15} aria-hidden="true" /> Join circle
            </button>
          )}
        </div>
      </header>

      {/* Circle events */}
      <section className="mb-10">
        <h2 className="font-headline font-bold text-xl text-text-dark flex items-center gap-2 mb-4">
          <CalendarDays size={19} className="text-primary" aria-hidden="true" /> What this circle is
          planning
        </h2>

        {circleEvents.length === 0 ? (
          <p className="text-sm text-text-light p-6 bg-surface-low rounded-2xl text-center">
            Nothing on the calendar yet.{' '}
            <button
              onClick={() => navigate('/post')}
              className="text-primary font-semibold hover:underline"
            >
              Post the first one
            </button>
            .
          </p>
        ) : (
          <ul className="flex flex-col gap-3 list-none">
            {circleEvents.map(event => (
              <li key={event.id}>
                <button
                  onClick={() => navigate(`/event/${event.id}`)}
                  className="card w-full p-4 flex items-center gap-4 text-left group"
                >
                  <img
                    src={event.image}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                    loading="lazy"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block font-headline font-bold text-base text-text-dark truncate group-hover:text-primary transition-colors">
                      {event.title}
                    </span>
                    <span className="block text-xs text-text-medium mt-0.5 truncate">
                      {formatWhen(event.startsAt)} • {event.location}
                    </span>
                    <span className="block text-xs text-text-light mt-0.5">
                      {confirmedCount(event)} going
                    </span>
                  </span>
                  <StatusRing
                    capacity={capacityPct(event)}
                    size={40}
                    strokeWidth={3.5}
                    variant="bare"
                    srLabel={`${confirmedCount(event)} of ${event.maxSpots} spots taken`}
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {circle.isJoined && <CirclePlaySection circle={circle} />}

      {/* Members */}
      <section>
        <h2 className="font-headline font-bold text-xl text-text-dark flex items-center gap-2 mb-4">
          <Users size={19} className="text-primary" aria-hidden="true" /> Members
        </h2>

        <ul className="grid grid-cols-1 @xl:grid-cols-2 gap-2 list-none">
          {circle.memberList.map(member => (
            <li
              key={member.id}
              className="flex items-center gap-3 p-3 bg-surface-lowest rounded-2xl shadow-sm"
            >
              <Avatar name={member.name} size={38} />
              <span className="min-w-0">
                <span className="block font-bold text-sm text-text-dark truncate">
                  {member.id === ME ? 'You' : member.name}
                </span>
                <span className="block text-[10px] font-bold text-text-light uppercase tracking-wider">
                  {member.role}
                </span>
              </span>
            </li>
          ))}
        </ul>

        {circle.extraMembers > 0 && (
          <p className="text-xs text-text-light mt-3">
            + {circle.extraMembers} more {circle.extraMembers === 1 ? 'member' : 'members'} not shown
          </p>
        )}
      </section>

      <ShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        title={`Invite to ${circle.name}`}
        subtitle="Anyone with this link can ask to join"
        url={circleUrl}
        shareText={`Join ${circle.name} on W8VR`}
      />

      <ConfirmDialog {...confirm.dialogProps} />
    </div>
  );
}
