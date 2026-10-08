import { auth } from './firebase';
import type {
  AlertItem,
  BroadcastTarget,
  CircleItem,
  EventItem,
  GameHandles,
  NotificationTiers,
  ReportItem,
  UserRole,
} from '../types';
import type { RsvpOutcome } from '../context/AppContext';

/**
 * Client for the W8VR Worker (worker/src/index.ts). Same origin in
 * production; in development Vite proxies /api to `wrangler dev`.
 *
 * Signed-in callers send their Firebase ID token. With VITE_DEV_AUTH=true
 * (see .env.development) the simulated sign-in sends a dev token instead,
 * which the Worker accepts only when started with AUTH_MODE=dev.
 */

export interface ServerState {
  me: {
    uid: string;
    name: string;
    email: string | null;
    photoURL?: string;
    tagline: string;
    homeCity: string;
    role: UserRole;
    notifications: NotificationTiers;
    gameHandles: GameHandles;
    blockedIds: string[];
    closeFriendIds: string[];
  };
  events: EventItem[];
  circles: CircleItem[];
  alerts: AlertItem[];
  reports: ReportItem[];
}

export interface ApiIdentity {
  uid: string;
  name: string;
  email?: string;
}

/** No backend answered: plain `vite` without `wrangler dev`, or a static host. */
export class ApiUnavailable extends Error {}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

function base64url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function authorization(identity: ApiIdentity): Promise<string | null> {
  if (auth.currentUser) return `Bearer ${await auth.currentUser.getIdToken()}`;
  if (import.meta.env.VITE_DEV_AUTH === 'true') {
    return `Dev ${base64url(JSON.stringify(identity))}`;
  }
  return null;
}

export function createApi(identity: ApiIdentity) {
  async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const authz = await authorization(identity);
    if (!authz) throw new ApiUnavailable('No credentials for the backend');
    let res: Response;
    try {
      res = await fetch(`/api${path}`, {
        method,
        headers: { authorization: authz, 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiUnavailable('Backend unreachable');
    }
    // A static host answers /api with index.html; a dead dev proxy with a 5xx page.
    if (!(res.headers.get('content-type') ?? '').includes('application/json')) {
      throw new ApiUnavailable('No backend at /api');
    }
    const data = (await res.json()) as T & { error?: string };
    if (!res.ok) throw new ApiError(res.status, data.error ?? `Request failed (${res.status})`);
    return data;
  }

  const enc = encodeURIComponent;
  return {
    state: () => call<ServerState>('GET', '/state'),

    updateMe: (patch: Partial<{ name: string; tagline: string; homeCity: string; notifications: NotificationTiers }>) =>
      call('PATCH', '/me', patch),
    setGameHandle: (gameId: string, handle: string) => call('PUT', `/me/games/${enc(gameId)}`, { handle }),
    removeGameHandle: (gameId: string) => call('DELETE', `/me/games/${enc(gameId)}`),
    block: (userId: string) => call('PUT', `/me/blocks/${enc(userId)}`),
    unblock: (userId: string) => call('DELETE', `/me/blocks/${enc(userId)}`),
    addCloseFriend: (userId: string) => call('PUT', `/me/close-friends/${enc(userId)}`),
    removeCloseFriend: (userId: string) => call('DELETE', `/me/close-friends/${enc(userId)}`),

    createEvent: (draft: Partial<EventItem>) => call<EventItem>('POST', '/events', draft),
    updateEvent: (id: string, patch: Partial<EventItem>, notify: boolean, changeSummary?: string) =>
      call<EventItem>('PATCH', `/events/${enc(id)}`, { patch, notify, changeSummary }),
    rsvp: (id: string, intent: 'going' | 'maybe' | 'no') =>
      call<{ outcome: RsvpOutcome; event: EventItem }>('POST', `/events/${enc(id)}/rsvp`, { intent }),
    mute: (id: string) => call('PUT', `/events/${enc(id)}/mute`),
    unmute: (id: string) => call('DELETE', `/events/${enc(id)}/mute`),
    comment: (id: string, text: string) => call<EventItem>('POST', `/events/${enc(id)}/comments`, { text }),
    broadcast: (id: string, message: string, target: BroadcastTarget) =>
      call<{ reached: number }>('POST', `/events/${enc(id)}/broadcast`, { message, target }),
    report: (id: string, reason: string, note: string) => call('POST', `/events/${enc(id)}/reports`, { reason, note }),

    createCircle: (draft: { id: string; name: string; description: string; categoryTag: string; isPrivate: boolean }) =>
      call<CircleItem>('POST', '/circles', draft),
    circle: (id: string, inviteCode?: string) =>
      call<CircleItem>('GET', `/circles/${enc(id)}${inviteCode ? `?invite=${enc(inviteCode)}` : ''}`),
    joinCircle: (id: string, inviteCode?: string) => call<CircleItem>('POST', `/circles/${enc(id)}/join`, { inviteCode }),
    leaveCircle: (id: string) => call('POST', `/circles/${enc(id)}/leave`),

    markAlertRead: (id: string) => call('POST', `/alerts/${enc(id)}/read`),
    markAllAlertsRead: () => call('POST', '/alerts/read-all'),
    dismissAlert: (id: string) => call('DELETE', `/alerts/${enc(id)}`),
    clearAlerts: () => call('DELETE', '/alerts'),
  };
}

export type Api = ReturnType<typeof createApi>;
