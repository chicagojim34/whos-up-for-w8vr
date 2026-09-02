import type { UserRole } from '../types';

export interface DemoPersona {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tagline: string;
  homeCity: string;
  avatarSeed: string;
  badge: string;
  description: string;
  gameHandles?: Record<string, string>;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: 'u0',
    name: 'Felix Vance',
    email: 'felix.vance@w8vr.app',
    role: 'admin',
    tagline: 'Community Creator & DJ',
    homeCity: 'Chicago, IL',
    avatarSeed: 'Felix Vance',
    badge: '👑 Admin / Host',
    description: 'Full administrative rights to delegate roles, manage circles, and create events.',
    gameHandles: { steam: 'felix_v', discord: 'felix#0001' },
  },
  {
    id: 'u1',
    name: 'Jocelyn Park',
    email: 'jocelyn.park@w8vr.app',
    role: 'moderator',
    tagline: 'Safety Lead & Board Game Enthusiast',
    homeCity: 'Chicago, IL',
    avatarSeed: 'Jocelyn Park',
    badge: '🛡️ Moderator',
    description: 'Elevated role to moderate content, handle reports, and assist circle management.',
    gameHandles: { discord: 'jocelyn_mod' },
  },
  {
    id: 'u2',
    name: 'Maya Lin',
    email: 'maya.lin@w8vr.app',
    role: 'user',
    tagline: 'Concert hopper & trivia regular',
    homeCity: 'Chicago, IL',
    avatarSeed: 'Maya Lin',
    badge: '👤 Close Friend',
    description: 'Active event attendee participating in RSVPs, waitlists, and calendar subscriptions.',
  },
  {
    id: 'u3',
    name: 'Jordan Cruz',
    email: 'jordan.cruz@w8vr.app',
    role: 'user',
    tagline: 'Diamond V Valorant & Rocket League Captain',
    homeCity: 'Austin, TX',
    avatarSeed: 'Jordan Cruz',
    badge: '🎮 Gamer / Esports Host',
    description: 'Online gamer with linked Discord, Riot, and Steam handles for multiplayer sessions.',
    gameHandles: { riot: 'Cruz#NA1', discord: 'cruz_esports', steam: 'cruz_striker' },
  },
  {
    id: 'u4',
    name: 'Leo Chen',
    email: 'leo.chen@w8vr.app',
    role: 'user',
    tagline: 'Live music curator & concert scout',
    homeCity: 'Chicago, IL',
    avatarSeed: 'Leo Chen',
    badge: '🎵 Live Event Scout',
    description: 'Specializes in finding and auto-pulling live concerts from Ticketmaster & SeatGeek.',
  },
];
