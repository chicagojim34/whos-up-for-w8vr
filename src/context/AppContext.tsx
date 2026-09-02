import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
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
import { clearAllSlices, isArray, isObject, loadSlice, saveSlice } from '../lib/storage';
import { attendeesWith, myRsvp, spotsLeft, waitlistQueue } from '../lib/events';

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
}

export interface NewEventDraft {
  title: string;
  category: EventItem['category'];
  image: string;
  vibe: string;
  startsAt: string;
  location: string;
  exactAddress?: string;
  isVirtual: boolean;
  virtualLink?: string;
  maxSpots: number;
  autoWaitlist: boolean;
  privacy: EventItem['privacy'];
  circleId?: string;
  game?: EventItem['game'];
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() =>
    loadSlice('user', INITIAL_USER, isObject)
  );
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

  useEffect(() => saveSlice('user', user), [user]);
  useEffect(() => saveSlice('events', events), [events]);
  useEffect(() => saveSlice('circles', circles), [circles]);
  useEffect(() => saveSlice('alerts', alerts), [alerts]);
  useEffect(() => saveSlice('contacts', contacts), [contacts]);
  useEffect(() => saveSlice('reports', reports), [reports]);

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

      if (next === 'going') {
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

      if (promoted) {
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
    [events, user.name, pushAlert]
  );

  const muteEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.map(e => (e.id === eventId ? { ...e, muted: true } : e)));
  }, []);

  const unmuteEvent = useCallback((eventId: string) => {
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
  }, []);

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
        isVirtual: draft.isVirtual,
        virtualLink: draft.virtualLink,
        game: draft.game,
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
    [user.name, pushAlert]
  );

  const addComment = useCallback(
    (eventId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
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
    [user.name]
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
    [events, user.name, pushAlert]
  );

  // ------------------------------------------------------------- Circles ---

  const joinCircle = useCallback(
    (circleId: string) => {
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
    [user.name]
  );

  const leaveCircle = useCallback((circleId: string) => {
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
  }, []);

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
      setCircles(prev => [created, ...prev]);
      if (invited.length > 0) {
        setContacts(prev =>
          prev.map(c => (draft.inviteIds.includes(c.id) ? { ...c, isInvited: true } : c))
        );
      }
      return created;
    },
    [contacts, user.name]
  );

  // -------------------------------------------------------------- Alerts ---

  const markAlertRead = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => (a.id === alertId ? { ...a, unread: false } : a)));
  }, []);

  const markAllAlertsRead = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, unread: false })));
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  const clearAlerts = useCallback(() => setAlerts([]), []);

  // --------------------------------------------------- Contacts & safety ---

  const inviteContact = useCallback((contactId: string) => {
    setContacts(prev => prev.map(c => (c.id === contactId ? { ...c, isInvited: true } : c)));
  }, []);

  const blockUser = useCallback(
    (userId: string, name: string) => {
      setUser(prev =>
        prev.blockedIds.includes(userId)
          ? prev
          : {
              ...prev,
              blockedIds: [...prev.blockedIds, userId],
              closeFriendIds: prev.closeFriendIds.filter(id => id !== userId),
            }
      );
      pushAlert({
        type: 'circle',
        tier: 'logistics',
        title: `You blocked ${name}`,
        desc: 'Their events and messages are hidden from you. You can undo this in Settings.',
      });
    },
    [pushAlert]
  );

  const unblockUser = useCallback((userId: string) => {
    setUser(prev => ({ ...prev, blockedIds: prev.blockedIds.filter(id => id !== userId) }));
  }, []);

  const toggleCloseFriend = useCallback((userId: string) => {
    setUser(prev => ({
      ...prev,
      closeFriendIds: prev.closeFriendIds.includes(userId)
        ? prev.closeFriendIds.filter(id => id !== userId)
        : [...prev.closeFriendIds, userId],
    }));
  }, []);

  /**
   * Saves the username you use on a service. Not an OAuth link — these games
   * have no public login for third parties — so it is a handle your circles
   * can read and act on.
   */
  const linkGameAccount = useCallback((gameId: string, handle: string) => {
    const trimmed = handle.trim();
    if (!trimmed) return;
    setUser(prev => ({ ...prev, gameHandles: { ...prev.gameHandles, [gameId]: trimmed } }));
  }, []);

  const unlinkGameAccount = useCallback((gameId: string) => {
    setUser(prev => {
      const next = { ...prev.gameHandles };
      delete next[gameId];
      return { ...prev, gameHandles: next };
    });
  }, []);

  const reportEvent = useCallback(
    (eventId: string, reason: string, note: string) => {
      const event = events.find(e => e.id === eventId);
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
    [events, pushAlert]
  );

  const updateNotifications = useCallback(
    (patch: Partial<Omit<NotificationTiers, 'logistics'>>) => {
      setUser(prev => ({ ...prev, notifications: { ...prev.notifications, ...patch } }));
    },
    []
  );

  const updateProfile = useCallback(
    (patch: Partial<Pick<UserProfile, 'name' | 'tagline' | 'homeCity'>>) => {
      setUser(prev => ({ ...prev, ...patch }));
    },
    []
  );

  const resetToDefaults = useCallback(() => {
    clearAllSlices(SLICES);
    setUser(INITIAL_USER);
    setEvents(INITIAL_EVENTS);
    setCircles(INITIAL_CIRCLES);
    setAlerts(INITIAL_ALERTS);
    setContacts(INITIAL_CONTACTS);
    setReports([]);
  }, []);

  // ---------------------------------------------------------- Selections ---

  /** Blocked hosts disappear from every browsing surface. */
  const visibleEvents = useMemo(
    () =>
      events
        .filter(e => !user.blockedIds.includes(e.hostId))
        .map(e =>
          e.comments.some(c => user.blockedIds.includes(c.authorId))
            ? { ...e, comments: e.comments.filter(c => !user.blockedIds.includes(c.authorId)) }
            : e
        ),
    [events, user.blockedIds]
  );

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
    return alerts.filter(a => {
      if (a.eventId && mutedEventIds.has(a.eventId)) return false;
      return tierEnabled(a.tier);
    });
  }, [alerts, mutedEventIds, user.notifications]);

  const findEvent = useCallback(
    (id: string | undefined) => (id ? events.find(e => e.id === id) : undefined),
    [events]
  );

  const findCircle = useCallback(
    (id: string | undefined) => (id ? circles.find(c => c.id === id) : undefined),
    [circles]
  );

  const value = useMemo<AppContextType>(
    () => ({
      user,
      events: visibleEvents,
      circles,
      alerts,
      visibleAlerts,
      contacts,
      reports,
      findEvent,
      findCircle,
      rsvpEvent,
      muteEvent,
      unmuteEvent,
      createEvent,
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
    }),
    [
      user,
      visibleEvents,
      circles,
      alerts,
      visibleAlerts,
      contacts,
      reports,
      findEvent,
      findCircle,
      rsvpEvent,
      muteEvent,
      unmuteEvent,
      createEvent,
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
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
