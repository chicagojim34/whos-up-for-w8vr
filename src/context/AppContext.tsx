import React, { createContext, useContext, useState, useEffect } from 'react';
import { type EventCategory } from '../components/CategoryChip';

export interface Comment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time: string;
  isHost?: boolean;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  type: string;
  category: EventCategory;
  image: string;
  timeLabel: string;
  date: string;
  time: string;
  distance: string;
  location: string;
  isVirtual?: boolean;
  virtualLink?: string;
  capacity: number; // percentage
  maxSpots: number;
  confirmed: number;
  maybe: number;
  interested: number;
  waitlist: number;
  status: 'Attending' | 'RSVP Now' | 'Pending RSVP' | 'Waitlisted' | 'Declined';
  fillingFast?: boolean;
  avatars: string[];
  vibe: string;
  isHost?: boolean;
  hostName?: string;
  privacy: 'public' | 'circle' | 'hidden';
  muted?: boolean;
  coords: { x: number; y: number }; // Relative coordinates for map (0-100%)
  comments: Comment[];
}

export interface CircleItem {
  id: string;
  name: string;
  description: string;
  members: number;
  fill: number;
  color: string;
  active?: boolean;
  isJoined: boolean;
  categoryTag: string;
  img?: string;
  memberList: { name: string; role: string }[];
}

export interface AlertItem {
  id: string;
  type: 'invite' | 'confirm' | 'broadcast' | 'waitlist';
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  eventId?: string;
  circleId?: string;
  actionLabel?: string;
}

export interface ContactItem {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  isOnW8VR: boolean;
  isInvited: boolean;
}

const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'e1',
    title: 'Vanguard Social Dinner',
    description: 'Exclusive evening of curated networking at The Glass House Rooftop.',
    type: 'JOINED CIRCLE',
    category: 'Dining',
    image: '/vanguard_social_1774367422848.png',
    timeLabel: '7:30 PM Today',
    date: 'Today',
    time: '7:30 PM',
    distance: '0.8 MI AWAY',
    location: 'The Glass House Rooftop, Austin',
    capacity: 75,
    maxSpots: 50,
    status: 'Attending',
    avatars: ['Felix', 'Aneka', 'Jocelyn'],
    confirmed: 48,
    maybe: 15,
    interested: 102,
    waitlist: 3,
    vibe: "Exclusive evening of curated networking at The Glass House Rooftop. Join us for a night of meaningful connections and high-end dining. Reflective tones and elevated cyberpunk style encouraged.",
    isHost: false,
    hostName: 'Felix',
    privacy: 'circle',
    coords: { x: 28, y: 35 },
    comments: [
      {
        id: 'm1',
        user: 'Sarah M.',
        avatar: 'Sarah',
        text: 'Is there a specific dress code for tonight?',
        time: '2h ago',
        isHost: false,
      },
      {
        id: 'm2',
        user: 'Felix (Host)',
        avatar: 'Felix',
        text: "Check the invite link for the styling guide! Reflective tones and dark cyberpunk textures encouraged.",
        time: '1h ago',
        isHost: true,
      }
    ]
  },
  {
    id: 'e2',
    title: 'Morning Ridge Trail',
    description: 'Medium-intensity 5k hike followed by breakfast at the trailhead cafe.',
    type: 'PUBLIC EVENT',
    category: 'Active',
    image: '/morning_ridge_1774367438744.png',
    timeLabel: 'Sat, 9:00 AM',
    date: 'Sat, Oct 25',
    time: '9:00 AM',
    distance: '4.2 MI AWAY',
    location: 'Morning Ridge Trailhead, West Hills',
    capacity: 40,
    maxSpots: 20,
    status: 'RSVP Now',
    avatars: ['Marcus', 'Elena'],
    confirmed: 8,
    maybe: 4,
    interested: 45,
    waitlist: 0,
    vibe: "Start your weekend with crisp air, panoramic views, and great company. We'll hit the ridge trail loop, then regroup at the base cafe for coffee and pastries.",
    isHost: true,
    hostName: 'You',
    privacy: 'public',
    coords: { x: 68, y: 22 },
    comments: [
      {
        id: 'm3',
        user: 'Marcus',
        avatar: 'Marcus',
        text: 'Are dogs allowed on this specific trail?',
        time: '3h ago',
        isHost: false,
      },
      {
        id: 'm4',
        user: 'You (Host)',
        avatar: 'Felix',
        text: 'Yes! Leashed dogs are very welcome.',
        time: '2h ago',
        isHost: true,
      }
    ]
  },
  {
    id: 'e3',
    title: 'Underground Vinyl Set',
    description: 'A curated selection of rare soul and jazz imports in a cozy basement setting.',
    type: 'JAZZ COLLECTIVE',
    category: 'Entertainment',
    image: '/vinyl_set_1774367456136.png',
    timeLabel: 'Tomorrow, 9:00 PM',
    date: 'Tomorrow',
    time: '9:00 PM',
    distance: '1.5 MI AWAY',
    location: 'The Basement Studio, East Side',
    capacity: 95,
    maxSpots: 40,
    status: 'Pending RSVP',
    fillingFast: true,
    avatars: ['Miles', 'Nina', 'Julian'],
    confirmed: 38,
    maybe: 12,
    interested: 88,
    waitlist: 2,
    vibe: "Strictly vinyl. Strictly soul. Join us for an intimate listening session featuring rare Japanese jazz imports and guest selectors.",
    isHost: false,
    hostName: 'Miles',
    privacy: 'circle',
    coords: { x: 45, y: 62 },
    comments: [
      {
        id: 'm5',
        user: 'Nina',
        avatar: 'Nina',
        text: 'Will there be refreshments or BYOB?',
        time: '4h ago',
        isHost: false,
      }
    ]
  },
  {
    id: 'e4',
    title: 'Rooftop Board Game & BBQ',
    description: 'Casual Catan, Secret Hitler, and smoked brisket with craft sodas.',
    type: 'JOINED CIRCLE',
    category: 'Home/Social',
    image: '/neon_midnight_1774367472687.png',
    timeLabel: 'Sun, 4:00 PM',
    date: 'Sun, Oct 26',
    time: '4:00 PM',
    distance: '2.1 MI AWAY',
    location: 'Leo’s Terrace, Downtown',
    capacity: 60,
    maxSpots: 15,
    status: 'RSVP Now',
    avatars: ['Leo', 'Maya'],
    confirmed: 9,
    maybe: 3,
    interested: 28,
    waitlist: 0,
    vibe: "Low stakes, high fun. Bring your favorite board game or just come for the BBQ. Vegan options available!",
    isHost: false,
    hostName: 'Leo',
    privacy: 'circle',
    coords: { x: 55, y: 48 },
    comments: []
  },
  {
    id: 'e5',
    title: 'Generative AI & Design Jam',
    description: 'Hands-on prototyping session exploring tactile interfaces and autonomous agents.',
    type: 'PUBLIC EVENT',
    category: 'Professional',
    image: '/media__1774367125342.png',
    timeLabel: 'Tue, 6:30 PM',
    date: 'Tue, Oct 28',
    time: '6:30 PM',
    distance: '3.0 MI AWAY',
    location: 'Curator Lab, Suite 400',
    capacity: 85,
    maxSpots: 30,
    status: 'RSVP Now',
    avatars: ['Aneka', 'David', 'Chen'],
    confirmed: 26,
    maybe: 8,
    interested: 74,
    waitlist: 0,
    vibe: "Bring your laptop and ideas. We will build, critique, and ship interface experiments with live feedback.",
    isHost: false,
    hostName: 'Curator Lab',
    privacy: 'public',
    coords: { x: 75, y: 78 },
    comments: []
  }
];

const INITIAL_CIRCLES: CircleItem[] = [
  {
    id: 'c1',
    name: 'College Friends',
    description: 'Planning: Weekend Tahoe Trip',
    members: 15,
    fill: 85,
    color: '#4343D5',
    active: true,
    isJoined: true,
    categoryTag: 'FRIENDS',
    memberList: [
      { name: 'Felix', role: 'Host' },
      { name: 'Aneka', role: 'Member' },
      { name: 'Jocelyn', role: 'Member' },
      { name: 'Sarah', role: 'Member' },
      { name: 'Leo', role: 'Member' }
    ]
  },
  {
    id: 'c2',
    name: 'The Family',
    description: 'Weekly dinners and birthdays',
    members: 5,
    fill: 30,
    color: 'var(--primary)',
    isJoined: true,
    categoryTag: 'FAMILY',
    memberList: [
      { name: 'Mom', role: 'Admin' },
      { name: 'Dad', role: 'Member' },
      { name: 'Chloe', role: 'Member' }
    ]
  },
  {
    id: 'c3',
    name: 'Gym Squad',
    description: 'Morning HIIT & weekend runs',
    members: 8,
    fill: 60,
    color: '#059669',
    isJoined: true,
    categoryTag: 'FITNESS',
    memberList: [
      { name: 'Marcus', role: 'Captain' },
      { name: 'David', role: 'Member' },
      { name: 'Elena', role: 'Member' }
    ]
  },
  {
    id: 'c4',
    name: 'SF Design Collective',
    description: 'Bi-weekly meetups for local creators and engineers',
    members: 1240,
    fill: 95,
    color: '#6366F1',
    isJoined: false,
    categoryTag: 'CAMPUS',
    img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=200&h=200',
    memberList: []
  },
  {
    id: 'c5',
    name: 'Bay Area Trekkers',
    description: 'Exploring the best hidden trails together',
    members: 450,
    fill: 70,
    color: '#10B981',
    isJoined: false,
    categoryTag: 'NATURE',
    img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=200&h=200',
    memberList: []
  },
  {
    id: 'c6',
    name: 'Modern Lit Society',
    description: 'Monthly wine and discussion nights',
    members: 890,
    fill: 80,
    color: '#EC4899',
    isJoined: false,
    categoryTag: 'CULTURE',
    img: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=200&h=200',
    memberList: []
  }
];

const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'a1',
    type: 'invite',
    title: 'Felix invited you',
    desc: 'Join the "Midweek Padel" circle for weekly games.',
    time: '2 mins ago',
    unread: true,
    circleId: 'c1',
    actionLabel: 'Accept Invite'
  },
  {
    id: 'a2',
    type: 'confirm',
    title: 'RSVP Confirmed',
    desc: 'You are going to Vanguard Social Dinner tonight at 7:30 PM.',
    time: '1 hour ago',
    unread: false,
    eventId: 'e1'
  },
  {
    id: 'a3',
    type: 'broadcast',
    title: 'Host Update • Morning Ridge Trail',
    desc: 'Weather looks fantastic! Meeting right at the trailhead cafe sign.',
    time: '3 hours ago',
    unread: true,
    eventId: 'e2'
  }
];

const INITIAL_CONTACTS: ContactItem[] = [
  { id: 'ct1', name: 'Maya Lin', phone: '+1 (415) 890-1234', avatar: 'Maya', isOnW8VR: true, isInvited: false },
  { id: 'ct2', name: 'Julian Vance', phone: '+1 (415) 345-6789', avatar: 'Julian', isOnW8VR: true, isInvited: false },
  { id: 'ct3', name: 'Sarah Miller', phone: '+1 (510) 678-9012', avatar: 'Sarah', isOnW8VR: true, isInvited: true },
  { id: 'ct4', name: 'David Park', phone: '+1 (415) 234-5678', avatar: 'David', isOnW8VR: false, isInvited: false },
  { id: 'ct5', name: 'Elena Rostova', phone: '+1 (650) 901-2345', avatar: 'Elena', isOnW8VR: false, isInvited: false },
];

interface AppContextType {
  events: EventItem[];
  circles: CircleItem[];
  alerts: AlertItem[];
  contacts: ContactItem[];
  rsvpEvent: (eventId: string, status: 'going' | 'maybe' | 'no') => void;
  muteEvent: (eventId: string) => void;
  unmuteEvent: (eventId: string) => void;
  createEvent: (newEvent: Partial<EventItem>) => EventItem;
  addComment: (eventId: string, text: string) => void;
  sendHostBroadcast: (eventId: string, message: string, targetGroup: 'all' | 'yes' | 'waitlist') => void;
  joinCircle: (circleId: string) => void;
  leaveCircle: (circleId: string) => void;
  createCircle: (name: string, description: string, categoryTag: string) => CircleItem;
  markAlertRead: (alertId: string) => void;
  markAllAlertsRead: () => void;
  inviteContact: (contactId: string) => void;
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<EventItem[]>(() => {
    const saved = localStorage.getItem('w8vr_events_v2');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  const [circles, setCircles] = useState<CircleItem[]>(() => {
    const saved = localStorage.getItem('w8vr_circles_v2');
    return saved ? JSON.parse(saved) : INITIAL_CIRCLES;
  });

  const [alerts, setAlerts] = useState<AlertItem[]>(() => {
    const saved = localStorage.getItem('w8vr_alerts_v2');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  const [contacts, setContacts] = useState<ContactItem[]>(() => {
    const saved = localStorage.getItem('w8vr_contacts_v2');
    return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
  });

  useEffect(() => {
    localStorage.setItem('w8vr_events_v2', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('w8vr_circles_v2', JSON.stringify(circles));
  }, [circles]);

  useEffect(() => {
    localStorage.setItem('w8vr_alerts_v2', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('w8vr_contacts_v2', JSON.stringify(contacts));
  }, [contacts]);

  const rsvpEvent = (eventId: string, status: 'going' | 'maybe' | 'no') => {
    setEvents(prev =>
      prev.map(event => {
        if (event.id !== eventId) return event;

        let newStatus: EventItem['status'] = 'RSVP Now';
        let confirmedDelta = 0;
        let maybeDelta = 0;
        let waitlistDelta = 0;

        const prevStatus = event.status;

        if (status === 'going') {
          if (event.confirmed >= event.maxSpots) {
            newStatus = 'Waitlisted';
            waitlistDelta = prevStatus === 'Waitlisted' ? 0 : 1;
          } else {
            newStatus = 'Attending';
            confirmedDelta = prevStatus === 'Attending' ? 0 : 1;
            if (prevStatus === 'Waitlisted') waitlistDelta = -1;
          }
        } else if (status === 'maybe') {
          newStatus = 'Pending RSVP';
          maybeDelta = prevStatus === 'Pending RSVP' ? 0 : 1;
          if (prevStatus === 'Attending') confirmedDelta = -1;
          if (prevStatus === 'Waitlisted') waitlistDelta = -1;
        } else if (status === 'no') {
          newStatus = 'Declined';
          if (prevStatus === 'Attending') {
            confirmedDelta = -1;
            // Waitlist promotion simulation
            if (event.waitlist > 0) {
              waitlistDelta = -1;
              confirmedDelta = 0; // Promoted person takes the spot!
            }
          }
          if (prevStatus === 'Waitlisted') waitlistDelta = -1;
        }

        const newConfirmed = Math.max(0, event.confirmed + confirmedDelta);
        const newMaybe = Math.max(0, event.maybe + maybeDelta);
        const newWaitlist = Math.max(0, event.waitlist + waitlistDelta);
        const newCapacity = Math.min(100, Math.round((newConfirmed / event.maxSpots) * 100));

        return {
          ...event,
          status: newStatus,
          confirmed: newConfirmed,
          maybe: newMaybe,
          waitlist: newWaitlist,
          capacity: newCapacity,
          fillingFast: newCapacity >= 90,
          avatars: newStatus === 'Attending' && !event.avatars.includes('You')
            ? ['You', ...event.avatars]
            : event.avatars.filter(a => a !== 'You')
        };
      })
    );

    // Trigger confirmation notification if going
    if (status === 'going') {
      const targetEvent = events.find(e => e.id === eventId);
      if (targetEvent) {
        const newAlert: AlertItem = {
          id: 'alert-' + Date.now(),
          type: 'confirm',
          title: 'RSVP Confirmed',
          desc: `You are attending "${targetEvent.title}". We've added it to your schedule.`,
          time: 'Just now',
          unread: true,
          eventId
        };
        setAlerts(prev => [newAlert, ...prev]);
      }
    }
  };

  const muteEvent = (eventId: string) => {
    setEvents(prev =>
      prev.map(e => (e.id === eventId ? { ...e, muted: true } : e))
    );
  };

  const unmuteEvent = (eventId: string) => {
    setEvents(prev =>
      prev.map(e => (e.id === eventId ? { ...e, muted: false } : e))
    );
  };

  const createEvent = (newEventData: Partial<EventItem>): EventItem => {
    const id = 'e' + (events.length + 1) + '-' + Date.now();
    const created: EventItem = {
      id,
      title: newEventData.title || 'Untitled Gathering',
      description: newEventData.description || 'Community hangout on W8VR.',
      type: newEventData.privacy === 'circle' ? 'JOINED CIRCLE' : 'PUBLIC EVENT',
      category: newEventData.category || 'Active',
      image: newEventData.image || '/neon_midnight_1774367472687.png',
      timeLabel: `${newEventData.time || '8:00 PM'} ${newEventData.date || 'Today'}`,
      date: newEventData.date || 'Today',
      time: newEventData.time || '8:00 PM',
      distance: '0.2 MI AWAY',
      location: newEventData.location || 'Downtown Hub',
      isVirtual: newEventData.isVirtual || false,
      virtualLink: newEventData.virtualLink,
      capacity: 0,
      maxSpots: newEventData.maxSpots || 12,
      confirmed: 1, // Host is confirmed
      maybe: 0,
      interested: 1,
      waitlist: 0,
      status: 'Attending',
      fillingFast: false,
      avatars: ['You'],
      vibe: newEventData.vibe || 'Join us for this exciting hangout!',
      isHost: true,
      hostName: 'You',
      privacy: newEventData.privacy || 'public',
      coords: { x: 50 + (Math.random() * 20 - 10), y: 50 + (Math.random() * 20 - 10) },
      comments: [
        {
          id: 'cm-' + Date.now(),
          user: 'You (Host)',
          avatar: 'Felix',
          text: 'Welcome everyone! Let me know if you have any questions before the event.',
          time: 'Just now',
          isHost: true,
        }
      ]
    };

    setEvents(prev => [created, ...prev]);

    // Create notification
    const alertItem: AlertItem = {
      id: 'alert-' + Date.now(),
      type: 'confirm',
      title: 'Event Created Successfully 🚀',
      desc: `"${created.title}" is live and open for RSVPs.`,
      time: 'Just now',
      unread: true,
      eventId: id
    };
    setAlerts(prev => [alertItem, ...prev]);

    return created;
  };

  const addComment = (eventId: string, text: string) => {
    if (!text.trim()) return;
    const newComment: Comment = {
      id: 'c-' + Date.now(),
      user: 'You',
      avatar: 'Felix',
      text: text.trim(),
      time: 'Just now',
      isHost: false,
    };

    setEvents(prev =>
      prev.map(e => {
        if (e.id !== eventId) return e;
        return {
          ...e,
          comments: [...e.comments, newComment]
        };
      })
    );
  };

  const sendHostBroadcast = (eventId: string, message: string, targetGroup: 'all' | 'yes' | 'waitlist') => {
    if (!message.trim()) return;
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const blastComment: Comment = {
      id: 'blast-' + Date.now(),
      user: `You (Host Blast 📢)`,
      avatar: 'Felix',
      text: message.trim(),
      time: 'Just now',
      isHost: true,
    };

    setEvents(prev =>
      prev.map(e => {
        if (e.id !== eventId) return e;
        return {
          ...e,
          comments: [...e.comments, blastComment]
        };
      })
    );

    const targetDesc = targetGroup === 'yes' ? 'to Confirmed Attendees' : targetGroup === 'waitlist' ? 'to Waitlist' : 'to All Invited';
    const newAlert: AlertItem = {
      id: 'alert-' + Date.now(),
      type: 'broadcast',
      title: `Host Update sent ${targetDesc}`,
      desc: `"${message.trim()}" posted on ${event.title}`,
      time: 'Just now',
      unread: true,
      eventId
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const joinCircle = (circleId: string) => {
    setCircles(prev =>
      prev.map(c => {
        if (c.id !== circleId) return c;
        return {
          ...c,
          isJoined: true,
          members: c.members + 1,
          memberList: [...c.memberList, { name: 'You', role: 'Member' }]
        };
      })
    );
  };

  const leaveCircle = (circleId: string) => {
    setCircles(prev =>
      prev.map(c => {
        if (c.id !== circleId) return c;
        return {
          ...c,
          isJoined: false,
          members: Math.max(1, c.members - 1),
          memberList: c.memberList.filter(m => m.name !== 'You')
        };
      })
    );
  };

  const createCircle = (name: string, description: string, categoryTag: string): CircleItem => {
    const newCircle: CircleItem = {
      id: 'c' + (circles.length + 1) + '-' + Date.now(),
      name: name.trim() || 'New Circle',
      description: description.trim() || 'Curated hangout circle',
      members: 1,
      fill: 20,
      color: '#4343D5',
      active: true,
      isJoined: true,
      categoryTag: categoryTag.toUpperCase() || 'COMMUNITY',
      memberList: [{ name: 'You', role: 'Creator' }]
    };

    setCircles(prev => [newCircle, ...prev]);
    return newCircle;
  };

  const markAlertRead = (alertId: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === alertId ? { ...a, unread: false } : a))
    );
  };

  const markAllAlertsRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, unread: false })));
  };

  const inviteContact = (contactId: string) => {
    setContacts(prev =>
      prev.map(c => (c.id === contactId ? { ...c, isInvited: true } : c))
    );
  };

  const resetToDefaults = () => {
    localStorage.removeItem('w8vr_events_v2');
    localStorage.removeItem('w8vr_circles_v2');
    localStorage.removeItem('w8vr_alerts_v2');
    localStorage.removeItem('w8vr_contacts_v2');
    setEvents(INITIAL_EVENTS);
    setCircles(INITIAL_CIRCLES);
    setAlerts(INITIAL_ALERTS);
    setContacts(INITIAL_CONTACTS);
  };

  return (
    <AppContext.Provider
      value={{
        events,
        circles,
        alerts,
        contacts,
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
        inviteContact,
        resetToDefaults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
