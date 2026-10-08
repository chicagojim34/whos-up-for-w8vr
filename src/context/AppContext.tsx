import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ME,
  type AlertItem,
  type AlertTier,
  type Attendee,
  type BroadcastTarget,
  type CircleItem,
  type ContactItem,
  type EventItem,
  type NotificationTiers,
  type ReportItem,
  type RsvpStatus,
  type UserProfile,
} from '../types';
import {
  INITIAL_ALERTS,
  INITIAL_CIRCLES,
  INITIAL_CONTACTS,
  INITIAL_EVENTS,
  INITIAL_USER,
} from '../lib/seed';
import { clearAllSlices, isArray, loadSlice, saveSlice } from '../lib/storage';
import { attendeesWith, myRsvp, spotsLeft, waitlistQueue } from '../lib/events';
import { useAuth } from '../hooks/useAuth';
import { ApiUnavailable, createApi, type Api, type ServerState } from '../services/api';

export type RsvpIntent = 'going' | 'maybe' | 'no';

export interface RsvpOutcome {
  /** What the user ended up as. `null` when nothing changed. */
  status: RsvpStatus | null;
  /** Set when the event was full and the user joined the queue instead. */
  waitlisted: boolean;
  /** Set when vacating a seat promoted someone off the waitlist. */
  promoted?: string;
  /** Set when the event is full and has no waitlist to fall back on. */
  blocked?: boolean;
}

interface AppContextType {
  user: UserProfile;
  /** Events from hosts the user has not blocked. */
  events: EventItem[];
  circles: CircleItem[];
  alerts: AlertItem[];
  /** Alerts after mute and notification-tier suppression. */
  visibleAlerts: AlertItem[];
  contacts: ContactItem[];
  reports: ReportItem[];

  findEvent: (id: string | undefined) => EventItem | undefined;
  findCircle: (id: string | undefined) => CircleItem | undefined;

  rsvpEvent: (eventId: string, intent: RsvpIntent) => RsvpOutcome;
  muteEvent: (eventId: string) => void;
  unmuteEvent: (eventId: string) => void;
  createEvent: (draft: NewEventDraft) => EventItem;
  updateEvent: (
    eventId: string,
    patch: Partial<EventItem>,
    notifyAttendees?: boolean,
    changeSummary?: string
  ) => EventItem | undefined;
  addComment: (eventId: string, text: string) => void;
  sendHostBroadcast: (eventId: string, message: string, target: BroadcastTarget) => number;

  joinCircle: (circleId: string) => void;
  leaveCircle: (circleId: string) => void;
  createCircle: (draft: NewCircleDraft) => CircleItem;

  markAlertRead: (alertId: string) => void;
  markAllAlertsRead: () => void;
  dismissAlert: (alertId: string) => void;
  clearAlerts: () => void;

  inviteContact: (contactId: string) => void;
  blockUser: (userId: string, name: string) => void;
  unblockUser: (userId: string) => void;
  toggleCloseFriend: (userId: string) => void;
  linkGameAccount: (gameId: string, handle: string) => void;
  unlinkGameAccount: (gameId: string) => void;
  reportEvent: (eventId: string, reason: string, note: string) => void;
  updateNotifications: (patch: Partial<Omit<NotificationTiers, 'logistics'>>) => void;
  updateProfile: (patch: Partial<Pick<UserProfile, 'name' | 'tagline' | 'homeCity'>>) => void;

  resetToDefaults: () => void;

  /** True while signed in and talking to the shared backend. */
  isOnline: boolean;
  /** Fetches a private circle by its invite link so it can be previewed and joined. */
  openCircleInvite: (circleId: string, inviteCode: string) => Promise<boolean>;
}

export interface NewEventDraft {
  title: string;
  category: EventItem['category'];
  image: string;
  vibe: string;
  startsAt: string;
  location: string;
  exactAddress?: string;
  venueAddress?: string;
  isVirtual: boolean;
  virtualLink?: string;
  maxSpots: number;
  autoWaitlist: boolean;
  privacy: EventItem['privacy'];
  circleId?: string;
  game?: EventItem['game'];

  // Ticketed & Dual-Time Fields
  isTicketedEvent?: boolean;
  eventSubType?: EventItem['eventSubType'];
  performerOrTeam?: string;
  showtime?: string;
  doorsTime?: string;
  meetupTime?: string;
  meetupLocation?: string;
  ticketUrl?: string;
  ticketSectionInfo?: string;
  priceRange?: string;
  lineup?: string[];
  bagPolicy?: string;
  ageRestriction?: string;
  doorsTimeConfirmed?: boolean;
  doorsTimeSource?: string;
  venueGateInfo?: string;

  // Multi-Provider Ticketing & Deduplication Fields
  canonicalId?: string;
  ticketOptions?: EventItem['ticketOptions'];
  provenanceSources?: string[];
  confidenceScore?: number;
  marketRank?: number;
  metroArea?: string;
}

export interface NewCircleDraft {
  name: string;
  description: string;
  categoryTag: string;
  isPrivate: boolean;
  inviteIds: string[];
}

const SLICES = ['events', 'circles', 'alerts', 'contacts', 'user', 'reports'];

const AppContext = createContext<AppContextType | undefined>(undefined);

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const POLL_MS = 60_000;

type Synced = { id: string; origin?: 'server' };
const isLocal = (item: Synced) => item.origin !== 'server';

/** Server items replace every server item we had; local demo items stay. */
function mergeServer<T extends Synced>(prev: T[], server: T[]): T[] {
  const ids = new Set(server.map(s => s.id));
  return [...server, ...prev.filter(p => isLocal(p) && !ids.has(p.id))];
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateCurrentUserProfile, isAuthenticated } = useAuth();
  const [events, setEvents] = useState<EventItem[]>(() =>
    loadSlice('events', INITIAL_EVENTS, isArray)
  );
  const [circles, setCircles] = useState<CircleItem[]>(() =>
    loadSlice('circles', INITIAL_CIRCLES, isArray)
  );
  const [alerts, setAlerts] = useState<AlertItem[]>(() =>
    loadSlice('alerts', INITIAL_ALERTS, isArray)
  );
  const [contacts, setContacts] = useState<ContactItem[]>(() =>
    loadSlice('contacts', INITIAL_CONTACTS, isArray)
  );
  const [reports, setReports] = useState<ReportItem[]>(() => loadSlice('reports', [], isArray));

  // Only this browser's own items persist; server items are re-fetched.
  useEffect(() => saveSlice('events', events.filter(isLocal)), [events]);
  useEffect(() => saveSlice('circles', circles.filter(isLocal)), [circles]);
  useEffect(() => saveSlice('alerts', alerts.filter(isLocal)), [alerts]);
  useEffect(() => saveSlice('contacts', contacts), [contacts]);
  useEffect(() => saveSlice('reports', reports.filter(isLocal)), [reports]);

  // ---------------------------------------------------------------- Sync ---
  //
  // Signed in with a backend reachable: events, circles, alerts and reports
  // that live on the server merge in alongside the local demo world. Signed
  // out, or with no backend (plain `vite`), everything stays local as before.

  const api = useMemo(
    () => (isAuthenticated ? createApi({ uid: user.id, name: user.name, email: user.email }) : null),
    [isAuthenticated, user.id, user.name, user.email]
  );
  const [onlineApi, setOnlineApi] = useState<Api | null>(null);
  /** The API to send mutations to; null while offline or signed out. */
  const remote = onlineApi && onlineApi === api ? onlineApi : null;

  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const applyServerState = useCallback(
    (state: ServerState) => {
      setEvents(prev => mergeServer(prev, state.events));
      setCircles(prev => mergeServer(prev, state.circles));
      setAlerts(prev => mergeServer(prev, state.alerts).sort((a, b) => b.createdAt - a.createdAt));
      setReports(prev => mergeServer(prev, state.reports));

      // The server decides role, and holds the preferences other people see.
      const { role, tagline, homeCity, notifications, gameHandles, blockedIds, closeFriendIds } = state.me;
      const patch = { role, tagline, homeCity, notifications, gameHandles, blockedIds, closeFriendIds };
      const current = userRef.current;
      const changed = (Object.keys(patch) as (keyof typeof patch)[]).some(
        k => JSON.stringify(patch[k]) !== JSON.stringify(current[k])
      );
      if (changed) updateCurrentUserProfile(patch);
    },
    [updateCurrentUserProfile]
  );

  /** Set when this sign-in found no backend, so polling stops asking. */
  const unavailableFor = useRef<Api | null>(null);

  const refresh = useCallback(async () => {
    if (!api || unavailableFor.current === api) return;
    try {
      applyServerState(await api.state());
      setOnlineApi(api);
    } catch (err) {
      if (err instanceof ApiUnavailable) {
        unavailableFor.current = api;
        setOnlineApi(null);
      } else console.warn('W8VR: could not refresh from the server', err);
    }
  }, [api, applyServerState]);

  // Poll while the tab is visible. Free tier: one /api/state per minute per
  // open tab is far inside 100k Worker requests a day for a friends-scale app.
  useEffect(() => {
    if (!api) return;
    const tick = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    tick();
    const timer = window.setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [api, refresh]);

  /** Sends a mutation, applies its result, then re-syncs so server alerts arrive. */
  const sync = useCallback(
    <T,>(op: (a: Api) => Promise<T>, onResult?: (result: T) => void) => {
      if (!remote) return;
      op(remote)
        .then(result => onResult?.(result))
        .catch(err => console.warn('W8VR: change was not saved to the server', err))
        .finally(() => void refresh());
    },
    [remote, refresh]
  );

  const replaceEvent = useCallback((event: EventItem) => {
    setEvents(prev => prev.map(e => (e.id === event.id ? event : e)));
  }, []);

  const eventsRef = useRef(events);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);
  const isServerEvent = useCallback(
    (eventId: string) => eventsRef.current.some(e => e.id === eventId && e.origin === 'server'),
    []
  );

  const pushAlert = useCallback(
    (alert: Omit<AlertItem, 'id' | 'createdAt' | 'unread'> & { unread?: boolean }) => {
      setAlerts(prev => [
        { id: uid('alert'), createdAt: Date.now(), unread: true, ...alert },
        ...prev,
      ]);
    },
    []
  );

  // ---------------------------------------------------------------- RSVP ---

  const rsvpEvent = useCallback(
    (eventId: string, intent: RsvpIntent): RsvpOutcome => {
      const event = events.find(e => e.id === eventId);
      if (!event) return { status: null, waitlisted: false };

      const current = myRsvp(event);
      const open = spotsLeft(event) > 0;

      let next: RsvpStatus;
      if (intent === 'going') {
        if (current === 'going' || current === 'waitlist') {
          // Already committed. Pressing the button again must not toggle the
          // user out of the guest list or re-fire the confirmation.
          return { status: current, waitlisted: current === 'waitlist' };
        }
        if (open) next = 'going';
        else if (event.autoWaitlist) next = 'waitlist';
        else return { status: current, waitlisted: false, blocked: true };
      } else if (intent === 'maybe') {
        if (current === 'maybe') return { status: 'maybe', waitlisted: false };
        next = 'maybe';
      } else {
        if (current === 'declined') return { status: 'declined', waitlisted: false };
        next = 'declined';
      }

      const vacatedSeat = current === 'going' && next !== 'going';
      let promoted: Attendee | undefined;

      // Server events: show the change now, let the server decide for real.
      // Its alerts arrive on the re-sync, so none are made up here.
      const onServer = event.origin === 'server';
      if (onServer) sync(a => a.rsvp(eventId, intent), r => replaceEvent(r.event));

      setEvents(prev =>
        prev.map(e => {
          if (e.id !== eventId) return e;

          const others = e.attendees.filter(a => a.id !== ME);
          const mine: Attendee = {
            id: ME,
            name: user.name,
            status: next,
            joinedAt: e.attendees.find(a => a.id === ME)?.joinedAt ?? Date.now(),
          };
          let attendees = [...others, mine];

          // Auto-waitlist promotion: a freed seat goes to whoever queued first.
          if (vacatedSeat && e.autoWaitlist) {
            const queue = waitlistQueue({ ...e, attendees });
            const first = queue[0];
            if (first) {
              promoted = first;
              attendees = attendees.map(a =>
                a.id === first.id ? { ...a, status: 'going' as RsvpStatus } : a
              );
            }
          }

          return {
            ...e,
            attendees,
            // Declining quiets the event; committing un-quiets it.
            muted: next === 'declined' ? true : false,
          };
        })
      );

      if (onServer) {
        // no local alerts
      } else if (next === 'going') {
        pushAlert({
          type: 'confirm',
          tier: 'logistics',
          title: 'RSVP confirmed',
          desc: `You are going to "${event.title}". It is on your schedule.`,
          eventId,
        });
      } else if (next === 'waitlist') {
        pushAlert({
          type: 'waitlist',
          tier: 'logistics',
          title: 'You are on the waitlist',
          desc: `"${event.title}" is full. We will tell you the moment a spot opens.`,
          eventId,
        });
      }

      if (promoted && !onServer) {
        if (promoted.id === ME) {
          pushAlert({
            type: 'waitlist',
            tier: 'logistics',
            title: 'A spot opened — you are in',
            desc: `You moved off the waitlist for "${event.title}".`,
            eventId,
          });
        } else if (event.hostId === ME) {
          pushAlert({
            type: 'waitlist',
            tier: 'logistics',
            title: 'Waitlist promotion',
            desc: `${promoted.name} moved off the waitlist for "${event.title}" and now has your open seat.`,
            eventId,
          });
        }
      }

      return {
        status: next,
        waitlisted: next === 'waitlist',
        promoted: promoted && promoted.id !== ME ? promoted.name : undefined,
      };
    },
    [events, user.name, pushAlert, sync, replaceEvent]
  );

  const muteEvent = useCallback(
    (eventId: string) => {
      setEvents(prev => prev.map(e => (e.id === eventId ? { ...e, muted: true } : e)));
      if (isServerEvent(eventId)) sync(a => a.mute(eventId));
    },
    [isServerEvent, sync]
  );

  const unmuteEvent = useCallback((eventId: string) => {
    if (isServerEvent(eventId)) sync(a => a.unmute(eventId));
    setEvents(prev =>
      prev.map(e =>
        e.id === eventId
          ? {
              ...e,
              muted: false,
              // Un-quieting clears the decline so the event is open to RSVP again.
              attendees: e.attendees.filter(a => !(a.id === ME && a.status === 'declined')),
            }
          : e
      )
    );
  }, [isServerEvent, sync]);

  // -------------------------------------------------------------- Events ---

  const createEvent = useCallback(
    (draft: NewEventDraft): EventItem => {
      const id = uid('e');
      const created: EventItem = {
        id,
        title: draft.title.trim() || 'Untitled Gathering',
        description: draft.vibe.trim().slice(0, 140) || `${draft.category} gathering on W8VR.`,
        category: draft.category,
        image: draft.image,
        startsAt: draft.startsAt,
        distanceMi: 0.2,
        location: draft.location,
        exactAddress: draft.exactAddress,
        venueAddress: draft.venueAddress,
        isVirtual: draft.isVirtual,
        virtualLink: draft.virtualLink,
        game: draft.game,
        isTicketedEvent: draft.isTicketedEvent,
        eventSubType: draft.eventSubType,
        performerOrTeam: draft.performerOrTeam,
        showtime: draft.showtime,
        doorsTime: draft.doorsTime,
        meetupTime: draft.meetupTime,
        meetupLocation: draft.meetupLocation,
        ticketUrl: draft.ticketUrl,
        ticketSectionInfo: draft.ticketSectionInfo,
        priceRange: draft.priceRange,
        lineup: draft.lineup,
        bagPolicy: draft.bagPolicy,
        ageRestriction: draft.ageRestriction,
        doorsTimeConfirmed: draft.doorsTimeConfirmed,
        doorsTimeSource: draft.doorsTimeSource,
        venueGateInfo: draft.venueGateInfo,
        canonicalId: draft.canonicalId,
        ticketOptions: draft.ticketOptions,
        provenanceSources: draft.provenanceSources,
        confidenceScore: draft.confidenceScore,
        marketRank: draft.marketRank,
        metroArea: draft.metroArea,
        lastScheduleSync: {
          updatedAt: Date.now(),
          source: draft.doorsTimeSource || 'Initial Creation',
          notes: draft.doorsTimeConfirmed ? 'Verified schedule upon creation.' : 'Initial schedule set.',
        },
        maxSpots: draft.maxSpots,
        autoWaitlist: draft.autoWaitlist,
        attendees: [{ id: ME, name: user.name, status: 'going', joinedAt: Date.now() }],
        interested: 0,
        vibe: draft.vibe.trim() || 'Join us for this gathering on W8VR.',
        hostId: ME,
        hostName: user.name,
        privacy: draft.privacy,
        circleId: draft.circleId,
        coords: { x: 40 + Math.random() * 25, y: 35 + Math.random() * 30 },
        comments: [
          {
            id: uid('c'),
            authorId: ME,
            author: user.name,
            text: 'Welcome! Ask anything you need to know before the day.',
            createdAt: Date.now(),
            isHost: true,
          },
        ],
      };

      // Shared when signed in, unless it is for a demo circle the server has
      // never heard of.
      const circle = draft.circleId ? circles.find(c => c.id === draft.circleId) : undefined;
      const onServer = remote !== null && (draft.privacy !== 'circle' || circle?.origin === 'server');

      if (onServer) {
        created.origin = 'server';
        setEvents(prev => [created, ...prev]);
        remote
          .createEvent(created)
          .then(replaceEvent)
          .catch(err => {
            // Keep the plan on this device rather than lose it.
            console.warn('W8VR: event kept on this device only', err);
            setEvents(prev => prev.map(e => (e.id === id ? { ...e, origin: undefined } : e)));
          })
          .finally(() => void refresh());
        return created;
      }

      setEvents(prev => [created, ...prev]);
      pushAlert({
        type: 'confirm',
        tier: 'logistics',
        title: 'Your event is live',
        desc: `"${created.title}" is open for RSVPs.`,
        eventId: id,
      });
      return created;
    },
    [user.name, pushAlert, circles, remote, replaceEvent, refresh]
  );

  const updateEvent = useCallback(
    (
      eventId: string,
      patch: Partial<EventItem>,
      notifyAttendees: boolean = true,
      changeSummary?: string
    ): EventItem | undefined => {
      let updatedItem: EventItem | undefined;

      setEvents(prev => {
        const target = prev.find(e => e.id === eventId);
        if (!target) return prev;

        const updated: EventItem = {
          ...target,
          ...patch,
          lastScheduleSync: patch.lastScheduleSync || {
            updatedAt: Date.now(),
            source: patch.doorsTimeSource || target.doorsTimeSource || 'Live Venue Schedule Sync',
            notes: changeSummary || 'Schedule verified with venue operations.',
          },
        };

        if (notifyAttendees && changeSummary) {
          const commentText = `📢 SCHEDULE UPDATE: ${changeSummary}`;
          updated.comments = [
            ...updated.comments,
            {
              id: uid('c'),
              authorId: ME,
              author: user.name,
              text: commentText,
              createdAt: Date.now(),
              isHost: true,
            },
          ];
        }

        updatedItem = updated;
        return prev.map(e => (e.id === eventId ? updated : e));
      });

      if (isServerEvent(eventId)) {
        sync(a => a.updateEvent(eventId, patch, notifyAttendees, changeSummary), replaceEvent);
      } else if (notifyAttendees && changeSummary) {
        pushAlert({
          type: 'confirm',
          tier: 'logistics',
          title: 'Schedule Updated',
          desc: changeSummary,
          eventId,
        });
      }

      return updatedItem;
    },
    [user.name, pushAlert, isServerEvent, sync, replaceEvent]
  );

  const addComment = useCallback(
    (eventId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (isServerEvent(eventId)) sync(a => a.comment(eventId, trimmed), replaceEvent);
      setEvents(prev =>
        prev.map(e =>
          e.id === eventId
            ? {
                ...e,
                comments: [
                  ...e.comments,
                  {
                    id: uid('c'),
                    authorId: ME,
                    author: user.name,
                    text: trimmed,
                    createdAt: Date.now(),
                    isHost: e.hostId === ME,
                  },
                ],
              }
            : e
        )
      );
    },
    [user.name, isServerEvent, sync, replaceEvent]
  );

  /** Returns how many people the blast actually reached. */
  const sendHostBroadcast = useCallback(
    (eventId: string, message: string, target: BroadcastTarget): number => {
      const trimmed = message.trim();
      const event = events.find(e => e.id === eventId);
      if (!trimmed || !event) return 0;

      const recipients =
        target === 'going'
          ? attendeesWith(event, 'going')
          : target === 'waitlist'
            ? attendeesWith(event, 'waitlist')
            : event.attendees.filter(a => a.status !== 'declined');

      setEvents(prev =>
        prev.map(e =>
          e.id === eventId
            ? {
                ...e,
                comments: [
                  ...e.comments,
                  {
                    id: uid('blast'),
                    authorId: ME,
                    author: user.name,
                    text: trimmed,
                    createdAt: Date.now(),
                    isHost: true,
                    broadcastTo: target,
                  },
                ],
              }
            : e
        )
      );

      if (event.origin === 'server') {
        sync(a => a.broadcast(eventId, trimmed, target));
        return recipients.filter(r => r.id !== ME).length;
      }

      const audience =
        target === 'going'
          ? 'confirmed guests'
          : target === 'waitlist'
            ? 'the waitlist'
            : 'everyone invited';

      pushAlert({
        type: 'broadcast',
        tier: 'logistics',
        title: `Update sent to ${recipients.length} ${
          recipients.length === 1 ? 'person' : 'people'
        }`,
        desc: `"${trimmed}" — delivered to ${audience} on ${event.title}.`,
        eventId,
      });

      return recipients.length;
    },
    [events, user.name, pushAlert, sync]
  );

  // ------------------------------------------------------------- Circles ---

  const joinCircle = useCallback(
    (circleId: string) => {
      const circle = circles.find(c => c.id === circleId);
      if (circle?.origin === 'server') {
        sync(
          a => a.joinCircle(circleId, circle.inviteCode),
          joined => setCircles(prev => prev.map(c => (c.id === circleId ? joined : c)))
        );
      }
      setCircles(prev =>
        prev.map(c =>
          c.id !== circleId || c.isJoined
            ? c
            : {
                ...c,
                isJoined: true,
                memberList: [{ id: ME, name: user.name, role: 'Member' as const }, ...c.memberList],
              }
        )
      );
    },
    [user.name, circles, sync]
  );

  const leaveCircle = useCallback((circleId: string) => {
    if (circles.some(c => c.id === circleId && c.origin === 'server')) sync(a => a.leaveCircle(circleId));
    setCircles(prev =>
      prev.map(c =>
        c.id !== circleId
          ? c
          : {
              ...c,
              isJoined: false,
              memberList: c.memberList.filter(m => m.id !== ME),
            }
      )
    );
  }, [circles, sync]);

  const openCircleInvite = useCallback(
    async (circleId: string, code: string): Promise<boolean> => {
      if (!api) return false;
      try {
        const circle = await api.circle(circleId, code);
        // Non-members are not sent the code; keep the one from the link to join with.
        const withCode = { ...circle, inviteCode: circle.inviteCode ?? code };
        setCircles(prev => [withCode, ...prev.filter(c => c.id !== circleId)]);
        return true;
      } catch {
        return false;
      }
    },
    [api]
  );

  const createCircle = useCallback(
    (draft: NewCircleDraft): CircleItem => {
      const invited = contacts.filter(c => draft.inviteIds.includes(c.id));
      const created: CircleItem = {
        id: uid('c'),
        name: draft.name.trim() || 'New Circle',
        description: draft.description.trim() || 'Curated hangout circle',
        extraMembers: 0,
        color: '#5D5FEF',
        isJoined: true,
        isPrivate: draft.isPrivate,
        categoryTag: (draft.categoryTag || 'COMMUNITY').toUpperCase(),
        memberList: [
          { id: ME, name: user.name, role: 'Creator' as const },
          ...invited.map(c => ({ id: c.id, name: c.name, role: 'Member' as const })),
        ],
      };
      if (remote) {
        // Shared circles start with just you; everyone else joins by invite link.
        created.origin = 'server';
        created.memberList = created.memberList.slice(0, 1);
        remote
          .createCircle({
            id: created.id,
            name: created.name,
            description: created.description,
            categoryTag: created.categoryTag,
            isPrivate: created.isPrivate,
          })
          .then(saved => setCircles(prev => prev.map(c => (c.id === saved.id ? saved : c))))
          .catch(err => {
            console.warn('W8VR: circle kept on this device only', err);
            setCircles(prev => prev.map(c => (c.id === created.id ? { ...c, origin: undefined } : c)));
          });
      }
      setCircles(prev => [created, ...prev]);
      if (invited.length > 0) {
        setContacts(prev =>
          prev.map(c => (draft.inviteIds.includes(c.id) ? { ...c, isInvited: true } : c))
        );
      }
      return created;
    },
    [contacts, user.name, remote]
  );

  // -------------------------------------------------------------- Alerts ---

  const alertsRef = useRef(alerts);
  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);
  const isServerAlert = useCallback(
    (alertId: string) => alertsRef.current.some(a => a.id === alertId && a.origin === 'server'),
    []
  );

  const markAlertRead = useCallback(
    (alertId: string) => {
      if (isServerAlert(alertId)) sync(a => a.markAlertRead(alertId));
      setAlerts(prev => prev.map(a => (a.id === alertId ? { ...a, unread: false } : a)));
    },
    [isServerAlert, sync]
  );

  const markAllAlertsRead = useCallback(() => {
    sync(a => a.markAllAlertsRead());
    setAlerts(prev => prev.map(a => ({ ...a, unread: false })));
  }, [sync]);

  const dismissAlert = useCallback(
    (alertId: string) => {
      if (isServerAlert(alertId)) sync(a => a.dismissAlert(alertId));
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    },
    [isServerAlert, sync]
  );

  const clearAlerts = useCallback(() => {
    sync(a => a.clearAlerts());
    setAlerts([]);
  }, [sync]);

  // --------------------------------------------------- Contacts & safety ---

  const inviteContact = useCallback((contactId: string) => {
    setContacts(prev => prev.map(c => (c.id === contactId ? { ...c, isInvited: true } : c)));
  }, []);

  const blockUser = useCallback(
    (userId: string, name: string) => {
      if (!user.blockedIds.includes(userId)) {
        updateCurrentUserProfile({ blockedIds: [...user.blockedIds, userId] });
        sync(a => a.block(userId));
      }
      setEvents(prev =>
        prev.map(e =>
          e.hostId === userId
            ? { ...e, muted: true }
            : { ...e, comments: e.comments.filter(c => c.authorId !== userId) }
        )
      );
      pushAlert({
        type: 'circle',
        tier: 'logistics',
        title: `You blocked ${name}`,
        desc: 'Their events and messages are hidden from you. You can undo this in Settings.',
      });
    },
    [user.blockedIds, updateCurrentUserProfile, pushAlert, sync]
  );

  const unblockUser = useCallback(
    (userId: string) => {
      updateCurrentUserProfile({ blockedIds: user.blockedIds.filter((id: string) => id !== userId) });
      sync(a => a.unblock(userId));
    },
    [user.blockedIds, updateCurrentUserProfile, sync]
  );

  const toggleCloseFriend = useCallback(
    (userId: string) => {
      const wasFriend = user.closeFriendIds.includes(userId);
      sync(a => (wasFriend ? a.removeCloseFriend(userId) : a.addCloseFriend(userId)));
      updateCurrentUserProfile({
        closeFriendIds: wasFriend
          ? user.closeFriendIds.filter((id: string) => id !== userId)
          : [...user.closeFriendIds, userId],
      });
    },
    [user.closeFriendIds, updateCurrentUserProfile, sync]
  );

  /**
   * Saves the username you use on a service. Not an OAuth link — these games
   * have no public login for third parties — so it is a handle your circles
   * can read and act on.
   */
  const linkGameAccount = useCallback(
    (gameId: string, handle: string) => {
      const trimmed = handle.trim();
      if (!trimmed) return;
      updateCurrentUserProfile({ gameHandles: { ...user.gameHandles, [gameId]: trimmed } });
      sync(a => a.setGameHandle(gameId, trimmed));
    },
    [user.gameHandles, updateCurrentUserProfile, sync]
  );

  const unlinkGameAccount = useCallback(
    (gameId: string) => {
      const next = { ...user.gameHandles };
      delete next[gameId];
      updateCurrentUserProfile({ gameHandles: next });
      sync(a => a.removeGameHandle(gameId));
    },
    [user.gameHandles, updateCurrentUserProfile, sync]
  );

  const reportEvent = useCallback(
    (eventId: string, reason: string, note: string) => {
      const event = events.find(e => e.id === eventId);
      if (event?.origin === 'server') {
        // The server files it and sends the receipt alert.
        sync(a => a.report(eventId, reason, note.trim()));
        return;
      }
      const report: ReportItem = {
        id: uid('r'),
        eventId,
        eventTitle: event?.title ?? 'Unknown event',
        reason,
        note: note.trim(),
        createdAt: Date.now(),
      };
      setReports(prev => [report, ...prev]);
      pushAlert({
        type: 'circle',
        tier: 'logistics',
        title: 'Report received',
        desc: `Thanks — the safety team is reviewing "${report.eventTitle}". You can see your reports in Settings.`,
        eventId,
      });
    },
    [events, pushAlert, sync]
  );

  const updateNotifications = useCallback(
    (patch: Partial<Omit<NotificationTiers, 'logistics'>>) => {
      const notifications = { ...user.notifications, ...patch };
      updateCurrentUserProfile({ notifications });
      sync(a => a.updateMe({ notifications }));
    },
    [user.notifications, updateCurrentUserProfile, sync]
  );

  const updateProfile = useCallback(
    (patch: Partial<Pick<UserProfile, 'name' | 'tagline' | 'homeCity'>>) => {
      updateCurrentUserProfile(patch);
      sync(a => a.updateMe(patch));
    },
    [updateCurrentUserProfile, sync]
  );

  const resetToDefaults = useCallback(() => {
    clearAllSlices(SLICES);
    updateCurrentUserProfile(INITIAL_USER);
    setEvents(INITIAL_EVENTS);
    setCircles(INITIAL_CIRCLES);
    setAlerts(INITIAL_ALERTS);
    setContacts(INITIAL_CONTACTS);
    setReports([]);
    // Shared data is not demo data; bring it straight back.
    void refresh();
  }, [updateCurrentUserProfile, refresh]);

  // ---------------------------------------------------------- Selections ---

  /** Blocked hosts disappear from every browsing surface. */
  // Signed out, server items left over from the last session are hidden
  // until the next sign-in replaces them.
  const visibleEvents = useMemo(
    () =>
      events
        .filter(e => (api || isLocal(e)) && !user.blockedIds.includes(e.hostId))
        .map(e =>
          e.comments.some(c => user.blockedIds.includes(c.authorId))
            ? { ...e, comments: e.comments.filter(c => !user.blockedIds.includes(c.authorId)) }
            : e
        ),
    [events, user.blockedIds, api]
  );

  const visibleCircles = useMemo(() => (api ? circles : circles.filter(isLocal)), [api, circles]);
  const visibleAlertList = useMemo(() => (api ? alerts : alerts.filter(isLocal)), [api, alerts]);
  const visibleReports = useMemo(() => (api ? reports : reports.filter(isLocal)), [api, reports]);

  const mutedEventIds = useMemo(
    () => new Set(events.filter(e => e.muted).map(e => e.id)),
    [events]
  );

  /**
   * Smart muting, for real: a quieted event stops producing notifications, and
   * a disabled tier stops producing them too. Logistics for events the user
   * committed to are never suppressed — that is the product's core promise.
   */
  const visibleAlerts = useMemo(() => {
    const tierEnabled = (tier: AlertTier) => {
      if (tier === 'logistics') return true;
      if (tier === 'closeFriends') return user.notifications.closeFriends;
      if (tier === 'circleActivity') return user.notifications.circleActivity;
      return user.notifications.publicNearby;
    };
    return visibleAlertList.filter(a => {
      if (a.eventId && mutedEventIds.has(a.eventId)) return false;
      return tierEnabled(a.tier);
    });
  }, [visibleAlertList, mutedEventIds, user.notifications]);

  const findEvent = useCallback(
    (id: string | undefined) => (id ? visibleEvents.find(e => e.id === id) : undefined),
    [visibleEvents]
  );

  const findCircle = useCallback(
    (id: string | undefined) => (id ? visibleCircles.find(c => c.id === id) : undefined),
    [visibleCircles]
  );

  const value = useMemo<AppContextType>(
    () => ({
      user,
      events: visibleEvents,
      circles: visibleCircles,
      alerts: visibleAlertList,
      visibleAlerts,
      contacts,
      reports: visibleReports,
      findEvent,
      findCircle,
      rsvpEvent,
      muteEvent,
      unmuteEvent,
      createEvent,
      updateEvent,
      addComment,
      sendHostBroadcast,
      joinCircle,
      leaveCircle,
      createCircle,
      markAlertRead,
      markAllAlertsRead,
      dismissAlert,
      clearAlerts,
      inviteContact,
      blockUser,
      unblockUser,
      toggleCloseFriend,
      linkGameAccount,
      unlinkGameAccount,
      reportEvent,
      updateNotifications,
      updateProfile,
      resetToDefaults,
      isOnline: remote !== null,
      openCircleInvite,
    }),
    [
      user,
      visibleEvents,
      visibleCircles,
      visibleAlertList,
      visibleAlerts,
      contacts,
      visibleReports,
      findEvent,
      findCircle,
      rsvpEvent,
      muteEvent,
      unmuteEvent,
      createEvent,
      updateEvent,
      addComment,
      sendHostBroadcast,
      joinCircle,
      leaveCircle,
      createCircle,
      markAlertRead,
      markAllAlertsRead,
      dismissAlert,
      clearAlerts,
      inviteContact,
      blockUser,
      unblockUser,
      toggleCloseFriend,
      linkGameAccount,
      unlinkGameAccount,
      reportEvent,
      updateNotifications,
      updateProfile,
      resetToDefaults,
      remote,
      openCircleInvite,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
