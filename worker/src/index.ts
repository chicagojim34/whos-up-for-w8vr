/**
 * W8VR API — a Cloudflare Worker over D1.
 *
 * One Worker serves both the built web app (static assets) and this API, so
 * the browser talks to a single origin. Everything below /api requires a
 * signed-in caller; see auth.ts.
 *
 * Responses are viewer-relative: the caller's own user id is rewritten to
 * `me` (the ME constant the client already uses for "you"), so the existing
 * selectors in src/lib/events.ts work unchanged on server data.
 */
import { authenticate, AuthError, type Caller } from './auth';
import { ME } from '../../src/types';
import { canSeeExactAddress } from '../../src/lib/events';
import type {
  AlertItem,
  AlertTier,
  AlertType,
  Attendee,
  CircleItem,
  Comment,
  EventItem,
  NotificationTiers,
  ReportItem,
  RsvpStatus,
} from '../../src/types';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  FIREBASE_PROJECT_ID: string;
  AUTH_MODE?: string;
  /** Comma-separated emails that are made admins on first sign-in. */
  ADMIN_EMAILS?: string;
}

// ---------------------------------------------------------------- helpers ---

class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const now = () => Date.now();
const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const MAX_BODY_BYTES = 64 * 1024;
const MAX_EVENT_DATA_BYTES = 24 * 1024;

async function readBody<T>(request: Request): Promise<T> {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new HttpError(413, 'Request body too large');
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(400, 'Body must be JSON');
  }
}

function str(value: unknown, field: string, { max = 500, min = 0 } = {}): string {
  if (typeof value !== 'string') throw new HttpError(400, `${field} must be text`);
  const v = value.trim();
  if (v.length < min) throw new HttpError(400, `${field} is required`);
  if (v.length > max) throw new HttpError(400, `${field} is too long (max ${max})`);
  return v;
}

function optStr(value: unknown, field: string, max = 500): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return str(value, field, { max });
}

/** Client-proposed ids let the app navigate to a new event before the round trip finishes. */
function acceptId(proposed: unknown, prefix: string): string {
  if (typeof proposed === 'string' && new RegExp(`^${prefix}-[A-Za-z0-9-]{6,64}$`).test(proposed)) {
    return proposed;
  }
  return newId(prefix);
}

/** Rewrites the caller's own id to ME. */
function me(id: string, viewer: string): string {
  return id === viewer ? ME : id;
}

// --------------------------------------------------------------- users ---

const DEFAULT_TIERS: NotificationTiers = {
  logistics: true,
  closeFriends: true,
  circleActivity: true,
  publicNearby: false,
};

async function ensureUser(env: Env, caller: Caller): Promise<void> {
  const admins = (env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  const role = caller.email && admins.includes(caller.email.toLowerCase()) ? 'admin' : 'user';
  // DO NOTHING on conflict: a returning user costs a read, not a write.
  await env.DB.prepare(
    `INSERT INTO users (id, name, email, photo_url, role, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6) ON CONFLICT(id) DO NOTHING`
  )
    .bind(caller.uid, caller.name, caller.email, caller.photoUrl, role, now())
    .run();
}

async function pushAlerts(
  env: Env,
  alerts: {
    userId: string;
    type: AlertType;
    tier: AlertTier;
    title: string;
    desc: string;
    eventId?: string;
    circleId?: string;
  }[]
): Promise<void> {
  if (alerts.length === 0) return;
  const stmt = env.DB.prepare(
    `INSERT INTO alerts (id, user_id, type, tier, title, descr, event_id, circle_id, unread, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1, ?9)`
  );
  const at = now();
  await env.DB.batch(
    alerts.map((a, i) =>
      stmt.bind(newId('a'), a.userId, a.type, a.tier, a.title, a.desc, a.eventId ?? null, a.circleId ?? null, at + i)
    )
  );
}

// -------------------------------------------------------------- events ---

/** Fields the server owns. A client can never set these through `data`. */
const SERVER_OWNED = new Set([
  'id',
  'hostId',
  'hostName',
  'attendees',
  'comments',
  'muted',
  'origin',
  'interested',
  'privacy',
  'circleId',
  'startsAt',
  'maxSpots',
  'autoWaitlist',
]);

function eventData(draft: Record<string, unknown>): string {
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(draft)) {
    if (!SERVER_OWNED.has(k)) data[k] = v;
  }
  const encoded = JSON.stringify(data);
  if (encoded.length > MAX_EVENT_DATA_BYTES) throw new HttpError(413, 'Event details are too large');
  return encoded;
}

interface EventRow {
  id: string;
  host_id: string;
  host_name: string;
  privacy: EventItem['privacy'];
  circle_id: string | null;
  starts_at: string;
  max_spots: number;
  auto_waitlist: number;
  interested: number;
  data: string;
}

interface AttendeeRow {
  event_id: string;
  user_id: string;
  name: string;
  status: RsvpStatus;
  joined_at: number;
}

interface CommentRow {
  id: string;
  event_id: string;
  author_id: string;
  author: string;
  text: string;
  is_host: number;
  broadcast_to: Comment['broadcastTo'] | null;
  created_at: number;
}

function assembleEvent(
  row: EventRow,
  attendees: AttendeeRow[],
  comments: CommentRow[],
  muted: boolean,
  viewer: string
): EventItem {
  const data = JSON.parse(row.data) as Partial<EventItem>;
  const event: EventItem = {
    ...(data as EventItem),
    id: row.id,
    hostId: me(row.host_id, viewer),
    hostName: row.host_name,
    privacy: row.privacy,
    circleId: row.circle_id ?? undefined,
    startsAt: row.starts_at,
    maxSpots: row.max_spots,
    autoWaitlist: row.auto_waitlist === 1,
    interested: row.interested,
    muted,
    origin: 'server',
    coords: data.coords ?? { x: 50, y: 50 },
    distanceMi: data.distanceMi ?? 0,
    attendees: attendees.map<Attendee>(a => ({
      id: me(a.user_id, viewer),
      name: a.name,
      status: a.status,
      joinedAt: a.joined_at,
    })),
    comments: comments.map<Comment>(c => ({
      id: c.id,
      authorId: me(c.author_id, viewer),
      author: c.author,
      text: c.text,
      createdAt: c.created_at,
      isHost: c.is_host === 1,
      broadcastTo: c.broadcast_to ?? undefined,
    })),
  };

  // PRD §7: street address, room link and room codes are for confirmed guests.
  if (!canSeeExactAddress(event)) {
    delete event.exactAddress;
    delete event.virtualLink;
    if (event.game) event.game = { gameId: event.game.gameId };
  }
  return event;
}

/** The set of events a caller may list. Hidden events are reachable by id only. */
const VISIBLE_EVENT_IDS = `
  SELECT e.id FROM events e
  WHERE e.starts_at >= ?1 AND (
    e.host_id = ?2
    OR e.privacy = 'public'
    OR EXISTS (SELECT 1 FROM attendees a WHERE a.event_id = e.id AND a.user_id = ?2)
    OR (e.privacy = 'circle' AND EXISTS (
      SELECT 1 FROM circle_members m WHERE m.circle_id = e.circle_id AND m.user_id = ?2))
  )
  ORDER BY e.starts_at
  LIMIT 200`;

const EVENT_COLUMNS = `e.id, e.host_id, u.name AS host_name, e.privacy, e.circle_id, e.starts_at,
  e.max_spots, e.auto_waitlist, e.interested, e.data`;

async function loadEvents(env: Env, viewer: string, ids: 'visible' | string[]): Promise<EventItem[]> {
  // Show events from the last day too, so tonight's plans do not vanish at the start time.
  const since = new Date(now() - 86_400_000).toISOString();
  const filter =
    ids === 'visible' ? `IN (${VISIBLE_EVENT_IDS})` : `IN (${ids.map((_, i) => `?${i + 3}`).join(',') || "''"})`;
  const params: unknown[] = ids === 'visible' ? [since, viewer] : [since, viewer, ...ids];

  const [events, attendees, comments, mutes] = await env.DB.batch([
    env.DB.prepare(
      `SELECT ${EVENT_COLUMNS} FROM events e JOIN users u ON u.id = e.host_id
       WHERE e.id ${filter} ORDER BY e.starts_at`
    ).bind(...params),
    env.DB.prepare(
      `SELECT a.event_id, a.user_id, u.name, a.status, a.joined_at
       FROM attendees a JOIN users u ON u.id = a.user_id
       WHERE a.event_id ${filter} ORDER BY a.joined_at`
    ).bind(...params),
    env.DB.prepare(
      `SELECT c.id, c.event_id, c.author_id, u.name AS author, c.text, c.is_host, c.broadcast_to, c.created_at
       FROM comments c JOIN users u ON u.id = c.author_id
       WHERE c.event_id ${filter} ORDER BY c.created_at`
    ).bind(...params),
    env.DB.prepare(`SELECT event_id FROM mutes WHERE user_id = ?2 AND event_id ${filter}`).bind(...params),
  ]);

  const byEvent = <T extends { event_id: string }>(rows: T[]) => {
    const map = new Map<string, T[]>();
    for (const r of rows) {
      const list = map.get(r.event_id) ?? [];
      list.push(r);
      map.set(r.event_id, list);
    }
    return map;
  };
  const att = byEvent(attendees.results as unknown as AttendeeRow[]);
  const com = byEvent(comments.results as unknown as CommentRow[]);
  const muted = new Set((mutes.results as { event_id: string }[]).map(r => r.event_id));

  return (events.results as unknown as EventRow[]).map(row =>
    assembleEvent(row, att.get(row.id) ?? [], com.get(row.id) ?? [], muted.has(row.id), viewer)
  );
}

/** Loads one event the caller is allowed to see, by id, or throws 404. */
async function loadEventFor(env: Env, viewer: string, id: string): Promise<EventItem> {
  const row = await env.DB.prepare(
    `SELECT e.privacy, e.circle_id, e.host_id FROM events e WHERE e.id = ?1`
  )
    .bind(id)
    .first<{ privacy: string; circle_id: string | null; host_id: string }>();
  if (!row) throw new HttpError(404, 'That event is not here');

  if (row.privacy === 'circle' && row.host_id !== viewer) {
    const member = await env.DB.prepare(
      `SELECT 1 FROM circle_members WHERE circle_id = ?1 AND user_id = ?2
       UNION SELECT 1 FROM attendees WHERE event_id = ?3 AND user_id = ?2`
    )
      .bind(row.circle_id, viewer, id)
      .first();
    if (!member) throw new HttpError(404, 'That event is not here');
  }
  // 'public' and 'hidden' are both reachable by anyone holding the link.
  const [event] = await loadEvents(env, viewer, [id]);
  if (!event) throw new HttpError(404, 'That event is not here');
  return event;
}

async function requireHost(env: Env, viewer: string, eventId: string) {
  const row = await env.DB.prepare(`SELECT host_id, data FROM events WHERE id = ?1`)
    .bind(eventId)
    .first<{ host_id: string; data: string }>();
  if (!row) throw new HttpError(404, 'That event is not here');
  if (row.host_id !== viewer) throw new HttpError(403, 'Only the host can do that');
  return row;
}

async function createEvent(env: Env, caller: Caller, body: Record<string, unknown>) {
  const title = str(body.title, 'title', { min: 1, max: 120 });
  const privacy = body.privacy;
  if (privacy !== 'public' && privacy !== 'circle' && privacy !== 'hidden') {
    throw new HttpError(400, 'privacy must be public, circle or hidden');
  }
  const startsAt = str(body.startsAt, 'startsAt', { max: 40 });
  if (Number.isNaN(Date.parse(startsAt))) throw new HttpError(400, 'startsAt must be a date');
  const maxSpots = Number(body.maxSpots);
  if (!Number.isInteger(maxSpots) || maxSpots < 1 || maxSpots > 1000) {
    throw new HttpError(400, 'maxSpots must be between 1 and 1000');
  }
  const circleId = optStr(body.circleId, 'circleId', 80) ?? null;
  if (privacy === 'circle') {
    if (!circleId) throw new HttpError(400, 'Pick which circle can see it');
    const member = await env.DB.prepare(`SELECT 1 FROM circle_members WHERE circle_id = ?1 AND user_id = ?2`)
      .bind(circleId, caller.uid)
      .first();
    if (!member) throw new HttpError(403, 'You can only post to circles you are in');
  }

  const id = acceptId(body.id, 'e');
  const exists = await env.DB.prepare(`SELECT 1 FROM events WHERE id = ?1`).bind(id).first();
  if (exists) throw new HttpError(409, 'An event with that id already exists');

  const at = now();
  const data = eventData({ ...body, title });
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO events (id, host_id, privacy, circle_id, starts_at, max_spots, auto_waitlist, interested, data, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 0, ?8, ?9)`
    ).bind(id, caller.uid, privacy, circleId, startsAt, maxSpots, body.autoWaitlist === false ? 0 : 1, data, at),
    env.DB.prepare(
      `INSERT INTO attendees (event_id, user_id, status, joined_at) VALUES (?1, ?2, 'going', ?3)`
    ).bind(id, caller.uid, at),
    env.DB.prepare(
      `INSERT INTO comments (id, event_id, author_id, text, is_host, created_at) VALUES (?1, ?2, ?3, ?4, 1, ?5)`
    ).bind(newId('m'), id, caller.uid, 'Welcome! Ask anything you need to know before the day.', at),
  ]);

  const alerts: Parameters<typeof pushAlerts>[1] = [
    {
      userId: caller.uid,
      type: 'confirm',
      tier: 'logistics',
      title: 'Your event is live',
      desc: `"${title}" is open for RSVPs.`,
      eventId: id,
    },
  ];
  if (privacy === 'circle' && circleId) {
    // Capped so one post to a huge circle cannot spend the day's write budget.
    const members = await env.DB.prepare(
      `SELECT user_id FROM circle_members WHERE circle_id = ?1 AND user_id != ?2 LIMIT 200`
    )
      .bind(circleId, caller.uid)
      .all<{ user_id: string }>();
    for (const m of members.results) {
      alerts.push({
        userId: m.user_id,
        type: 'circle',
        tier: 'circleActivity',
        title: `${caller.name} posted something new`,
        desc: `"${title}" — ${new Date(startsAt).toUTCString().slice(0, 16)}`,
        eventId: id,
        circleId,
      });
    }
  }
  await pushAlerts(env, alerts);
  return loadEventFor(env, caller.uid, id);
}

async function updateEvent(env: Env, caller: Caller, id: string, body: Record<string, unknown>) {
  const row = await requireHost(env, caller.uid, id);
  const patch = (body.patch ?? {}) as Record<string, unknown>;
  const merged = { ...JSON.parse(row.data), ...JSON.parse(eventData(patch)) };
  const stmts: D1PreparedStatement[] = [
    env.DB.prepare(`UPDATE events SET data = ?1 WHERE id = ?2`).bind(JSON.stringify(merged), id),
  ];
  if (typeof patch.startsAt === 'string' && !Number.isNaN(Date.parse(patch.startsAt))) {
    stmts.push(env.DB.prepare(`UPDATE events SET starts_at = ?1 WHERE id = ?2`).bind(patch.startsAt, id));
  }
  if (Number.isInteger(patch.maxSpots) && (patch.maxSpots as number) >= 1) {
    stmts.push(env.DB.prepare(`UPDATE events SET max_spots = ?1 WHERE id = ?2`).bind(patch.maxSpots, id));
  }

  const summary = optStr(body.changeSummary, 'changeSummary', 300);
  if (summary && body.notify !== false) {
    stmts.push(
      env.DB.prepare(
        `INSERT INTO comments (id, event_id, author_id, text, is_host, created_at) VALUES (?1, ?2, ?3, ?4, 1, ?5)`
      ).bind(newId('m'), id, caller.uid, `📢 SCHEDULE UPDATE: ${summary}`, now())
    );
  }
  await env.DB.batch(stmts);

  if (summary && body.notify !== false) {
    const guests = await env.DB.prepare(
      `SELECT user_id FROM attendees WHERE event_id = ?1 AND status != 'declined' AND user_id != ?2 LIMIT 500`
    )
      .bind(id, caller.uid)
      .all<{ user_id: string }>();
    await pushAlerts(
      env,
      guests.results.map(g => ({
        userId: g.user_id,
        type: 'broadcast' as const,
        tier: 'logistics' as const,
        title: 'Schedule updated',
        desc: summary,
        eventId: id,
      }))
    );
  }
  return loadEventFor(env, caller.uid, id);
}

type RsvpIntent = 'going' | 'maybe' | 'no';

async function rsvp(env: Env, caller: Caller, id: string, intent: RsvpIntent) {
  if (intent !== 'going' && intent !== 'maybe' && intent !== 'no') {
    throw new HttpError(400, 'intent must be going, maybe or no');
  }
  const event = await loadEventFor(env, caller.uid, id);
  const title = (event as { title?: string }).title ?? 'this event';
  const mine = event.attendees.find(a => a.id === ME);
  const current = mine?.status ?? null;
  const going = event.attendees.filter(a => a.status === 'going').length;
  const at = now();

  // Idempotent: repeating your current answer changes nothing and sends nothing.
  if (intent === 'going' && (current === 'going' || current === 'waitlist')) {
    return { outcome: { status: current, waitlisted: current === 'waitlist' }, event };
  }
  if (intent === 'maybe' && current === 'maybe') return { outcome: { status: 'maybe', waitlisted: false }, event };
  if (intent === 'no' && current === 'declined') return { outcome: { status: 'declined', waitlisted: false }, event };

  let next: RsvpStatus;
  if (intent === 'going') {
    if (going < event.maxSpots) {
      // Claim the seat atomically: the WHERE re-counts inside the statement, so
      // two people racing for the last spot cannot both get it.
      const res = await env.DB.prepare(
        `INSERT INTO attendees (event_id, user_id, status, joined_at)
         SELECT ?1, ?2, 'going', ?3
         WHERE (SELECT COUNT(*) FROM attendees WHERE event_id = ?1 AND status = 'going' AND user_id != ?2)
             < (SELECT max_spots FROM events WHERE id = ?1)
         ON CONFLICT(event_id, user_id) DO UPDATE SET status = 'going'`
      )
        .bind(id, caller.uid, at)
        .run();
      next = res.meta.changes > 0 ? 'going' : event.autoWaitlist ? 'waitlist' : 'blocked' as RsvpStatus;
    } else {
      next = event.autoWaitlist ? 'waitlist' : ('blocked' as RsvpStatus);
    }
    if ((next as string) === 'blocked') {
      return { outcome: { status: current, waitlisted: false, blocked: true }, event };
    }
  } else {
    next = intent === 'maybe' ? 'maybe' : 'declined';
  }

  const stmts: D1PreparedStatement[] = [];
  if (next !== 'going') {
    stmts.push(
      env.DB.prepare(
        `INSERT INTO attendees (event_id, user_id, status, joined_at) VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(event_id, user_id) DO UPDATE SET status = excluded.status`
      ).bind(id, caller.uid, next, at)
    );
  }
  stmts.push(
    next === 'declined'
      ? env.DB.prepare(`INSERT INTO mutes (user_id, event_id) VALUES (?1, ?2) ON CONFLICT DO NOTHING`).bind(caller.uid, id)
      : env.DB.prepare(`DELETE FROM mutes WHERE user_id = ?1 AND event_id = ?2`).bind(caller.uid, id)
  );
  await env.DB.batch(stmts);

  const alerts: Parameters<typeof pushAlerts>[1] = [];
  if (next === 'going') {
    alerts.push({
      userId: caller.uid,
      type: 'confirm',
      tier: 'logistics',
      title: 'RSVP confirmed',
      desc: `You are going to "${title}". It is on your schedule.`,
      eventId: id,
    });
  } else if (next === 'waitlist') {
    alerts.push({
      userId: caller.uid,
      type: 'waitlist',
      tier: 'logistics',
      title: 'You are on the waitlist',
      desc: `"${title}" is full. We will tell you the moment a spot opens.`,
      eventId: id,
    });
  }

  // A freed seat goes to whoever queued first.
  let promotedName: string | undefined;
  if (current === 'going' && next !== 'going' && event.autoWaitlist) {
    const first = await env.DB.prepare(
      `SELECT a.user_id, u.name FROM attendees a JOIN users u ON u.id = a.user_id
       WHERE a.event_id = ?1 AND a.status = 'waitlist' AND a.user_id != ?2
       ORDER BY a.joined_at LIMIT 1`
    )
      .bind(id, caller.uid)
      .first<{ user_id: string; name: string }>();
    if (first) {
      await env.DB.prepare(`UPDATE attendees SET status = 'going' WHERE event_id = ?1 AND user_id = ?2`)
        .bind(id, first.user_id)
        .run();
      promotedName = first.name;
      alerts.push({
        userId: first.user_id,
        type: 'waitlist',
        tier: 'logistics',
        title: 'A spot opened — you are in',
        desc: `You moved off the waitlist for "${title}".`,
        eventId: id,
      });
      const hostId = event.hostId === ME ? caller.uid : event.hostId;
      if (hostId !== first.user_id) {
        alerts.push({
          userId: hostId,
          type: 'waitlist',
          tier: 'logistics',
          title: 'Waitlist promotion',
          desc: `${first.name} moved off the waitlist for "${title}" and now has the open seat.`,
          eventId: id,
        });
      }
    }
  }
  await pushAlerts(env, alerts);

  return {
    outcome: { status: next, waitlisted: next === 'waitlist', promoted: promotedName },
    event: await loadEventFor(env, caller.uid, id),
  };
}

async function broadcast(env: Env, caller: Caller, id: string, body: Record<string, unknown>) {
  const row = await requireHost(env, caller.uid, id);
  const message = str(body.message, 'message', { min: 1, max: 1000 });
  const target = body.target;
  if (target !== 'all' && target !== 'going' && target !== 'waitlist') {
    throw new HttpError(400, 'target must be all, going or waitlist');
  }
  const statusFilter =
    target === 'going' ? `status = 'going'` : target === 'waitlist' ? `status = 'waitlist'` : `status != 'declined'`;
  const recipients = await env.DB.prepare(
    `SELECT user_id FROM attendees WHERE event_id = ?1 AND ${statusFilter} AND user_id != ?2 LIMIT 500`
  )
    .bind(id, caller.uid)
    .all<{ user_id: string }>();

  const title = (JSON.parse(row.data) as { title?: string }).title ?? 'your event';
  await env.DB.prepare(
    `INSERT INTO comments (id, event_id, author_id, text, is_host, broadcast_to, created_at)
     VALUES (?1, ?2, ?3, ?4, 1, ?5, ?6)`
  )
    .bind(newId('m'), id, caller.uid, message, target, now())
    .run();

  const reached = recipients.results.length;
  await pushAlerts(env, [
    ...recipients.results.map(r => ({
      userId: r.user_id,
      type: 'broadcast' as const,
      tier: 'logistics' as const,
      title: `Update · ${title}`,
      desc: message,
      eventId: id,
    })),
    {
      userId: caller.uid,
      type: 'broadcast',
      tier: 'logistics',
      title: `Update sent to ${reached} ${reached === 1 ? 'person' : 'people'}`,
      desc: `"${message}" — on ${title}.`,
      eventId: id,
    },
  ]);
  return { reached };
}

// ------------------------------------------------------------- circles ---

interface CircleRow {
  id: string;
  name: string;
  description: string;
  color: string;
  category_tag: string;
  is_private: number;
  invite_code: string;
  is_member: number;
}

interface MemberRow {
  circle_id: string;
  user_id: string;
  name: string;
  role: string;
}

async function loadCircles(env: Env, viewer: string, onlyId?: string): Promise<CircleItem[]> {
  const where = onlyId
    ? `c.id = ?2`
    : `(EXISTS (SELECT 1 FROM circle_members m WHERE m.circle_id = c.id AND m.user_id = ?1) OR c.is_private = 0)`;
  const circleSql = `SELECT c.id, c.name, c.description, c.color, c.category_tag, c.is_private, c.invite_code,
      EXISTS (SELECT 1 FROM circle_members m WHERE m.circle_id = c.id AND m.user_id = ?1) AS is_member
    FROM circles c WHERE ${where} ORDER BY is_member DESC, c.created_at DESC LIMIT 100`;
  const params = onlyId ? [viewer, onlyId] : [viewer];

  const [circles, members, handles] = await env.DB.batch([
    env.DB.prepare(circleSql).bind(...params),
    env.DB.prepare(
      `SELECT m.circle_id, m.user_id, u.name, m.role FROM circle_members m JOIN users u ON u.id = m.user_id
       WHERE m.circle_id IN (SELECT id FROM (${circleSql}))
       ORDER BY m.joined_at`
    ).bind(...params),
    env.DB.prepare(
      `SELECT h.user_id, h.game_id, h.handle FROM game_handles h
       WHERE h.user_id IN (SELECT m.user_id FROM circle_members m WHERE m.circle_id IN (SELECT id FROM (${circleSql})))`
    ).bind(...params),
  ]);

  const handlesByUser = new Map<string, Record<string, string>>();
  for (const h of handles.results as { user_id: string; game_id: string; handle: string }[]) {
    const m = handlesByUser.get(h.user_id) ?? {};
    m[h.game_id] = h.handle;
    handlesByUser.set(h.user_id, m);
  }
  const membersByCircle = new Map<string, MemberRow[]>();
  for (const m of members.results as unknown as MemberRow[]) {
    const list = membersByCircle.get(m.circle_id) ?? [];
    list.push(m);
    membersByCircle.set(m.circle_id, list);
  }

  return (circles.results as unknown as CircleRow[]).map(c => {
    const isMember = c.is_member === 1;
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      extraMembers: 0,
      color: c.color,
      isJoined: isMember,
      isPrivate: c.is_private === 1,
      categoryTag: c.category_tag,
      origin: 'server',
      // Only members see the invite code; it is the key to a private circle.
      inviteCode: isMember ? c.invite_code : undefined,
      // A private circle you are not in shows nobody.
      memberList:
        c.is_private === 1 && !isMember
          ? []
          : (membersByCircle.get(c.id) ?? []).map(m => ({
              id: me(m.user_id, viewer),
              name: m.name,
              role: m.role as CircleItem['memberList'][number]['role'],
              gameHandles: handlesByUser.get(m.user_id),
            })),
    } as CircleItem;
  });
}

function inviteCode(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
}

// --------------------------------------------------------------- state ---

async function loadState(env: Env, caller: Caller) {
  const v = caller.uid;
  const [userRow, handles, blocks, friends, alerts, reports] = await env.DB.batch([
    env.DB.prepare(`SELECT name, email, photo_url, tagline, home_city, role, notifications FROM users WHERE id = ?1`).bind(v),
    env.DB.prepare(`SELECT game_id, handle FROM game_handles WHERE user_id = ?1`).bind(v),
    env.DB.prepare(`SELECT blocked_id FROM blocks WHERE user_id = ?1`).bind(v),
    env.DB.prepare(`SELECT friend_id FROM close_friends WHERE user_id = ?1`).bind(v),
    env.DB.prepare(
      `SELECT id, type, tier, title, descr, event_id, circle_id, unread, created_at FROM alerts
       WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 100`
    ).bind(v),
    env.DB.prepare(
      `SELECT id, event_id, event_title, reason, note, created_at FROM reports
       WHERE reporter_id = ?1 ORDER BY created_at DESC LIMIT 50`
    ).bind(v),
  ]);

  const u = userRow.results[0] as
    | { name: string; email: string | null; photo_url: string | null; tagline: string; home_city: string; role: string; notifications: string }
    | undefined;
  if (!u) throw new HttpError(500, 'Profile missing');

  const [events, circles] = await Promise.all([loadEvents(env, v, 'visible'), loadCircles(env, v)]);

  return {
    me: {
      uid: v,
      name: u.name,
      email: u.email,
      photoURL: u.photo_url ?? undefined,
      tagline: u.tagline,
      homeCity: u.home_city,
      role: u.role,
      notifications: { ...DEFAULT_TIERS, ...JSON.parse(u.notifications), logistics: true },
      gameHandles: Object.fromEntries((handles.results as { game_id: string; handle: string }[]).map(h => [h.game_id, h.handle])),
      blockedIds: (blocks.results as { blocked_id: string }[]).map(b => b.blocked_id),
      closeFriendIds: (friends.results as { friend_id: string }[]).map(f => f.friend_id),
    },
    events,
    circles,
    alerts: (alerts.results as Record<string, unknown>[]).map<AlertItem>(a => ({
      id: a.id as string,
      type: a.type as AlertType,
      tier: a.tier as AlertTier,
      title: a.title as string,
      desc: a.descr as string,
      eventId: (a.event_id as string) ?? undefined,
      circleId: (a.circle_id as string) ?? undefined,
      unread: a.unread === 1,
      createdAt: a.created_at as number,
      origin: 'server',
    })),
    reports: (reports.results as Record<string, unknown>[]).map<ReportItem>(r => ({
      id: r.id as string,
      eventId: r.event_id as string,
      eventTitle: r.event_title as string,
      reason: r.reason as string,
      note: r.note as string,
      createdAt: r.created_at as number,
      origin: 'server',
    })),
  };
}

// -------------------------------------------------------------- router ---

type Handler = (ctx: {
  env: Env;
  caller: Caller;
  request: Request;
  params: string[];
  url: URL;
}) => Promise<unknown>;

const routes: [string, RegExp, Handler][] = [
  ['GET', /^\/api\/state$/, async ({ env, caller }) => loadState(env, caller)],

  // --- me
  [
    'PATCH',
    /^\/api\/me$/,
    async ({ env, caller, request }) => {
      const body = await readBody<Record<string, unknown>>(request);
      const sets: string[] = [];
      const vals: unknown[] = [];
      const set = (column: string, value: unknown) => {
        sets.push(`${column} = ?`);
        vals.push(value);
      };
      if (body.name !== undefined) set('name', str(body.name, 'name', { min: 1, max: 80 }));
      if (body.tagline !== undefined) set('tagline', str(body.tagline, 'tagline', { max: 120 }));
      if (body.homeCity !== undefined) set('home_city', str(body.homeCity, 'homeCity', { max: 80 }));
      if (body.notifications !== undefined) {
        const n = body.notifications as Record<string, unknown>;
        const tiers: NotificationTiers = {
          logistics: true, // never switchable — see Settings
          closeFriends: n.closeFriends !== false,
          circleActivity: n.circleActivity !== false,
          publicNearby: n.publicNearby === true,
        };
        set('notifications', JSON.stringify(tiers));
      }
      if (sets.length) {
        await env.DB.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).bind(...vals, caller.uid).run();
      }
      return { ok: true };
    },
  ],
  [
    'PUT',
    /^\/api\/me\/games\/([a-z0-9]{2,32})$/,
    async ({ env, caller, request, params }) => {
      const { handle } = await readBody<{ handle?: unknown }>(request);
      await env.DB.prepare(
        `INSERT INTO game_handles (user_id, game_id, handle) VALUES (?1, ?2, ?3)
         ON CONFLICT(user_id, game_id) DO UPDATE SET handle = excluded.handle`
      )
        .bind(caller.uid, params[0], str(handle, 'handle', { min: 1, max: 64 }))
        .run();
      return { ok: true };
    },
  ],
  [
    'DELETE',
    /^\/api\/me\/games\/([a-z0-9]{2,32})$/,
    async ({ env, caller, params }) => {
      await env.DB.prepare(`DELETE FROM game_handles WHERE user_id = ?1 AND game_id = ?2`).bind(caller.uid, params[0]).run();
      return { ok: true };
    },
  ],
  [
    'PUT',
    /^\/api\/me\/blocks\/([\w.-]{1,128})$/,
    async ({ env, caller, params }) => {
      if (params[0] === caller.uid) throw new HttpError(400, 'You cannot block yourself');
      await env.DB.batch([
        env.DB.prepare(`INSERT INTO blocks (user_id, blocked_id) VALUES (?1, ?2) ON CONFLICT DO NOTHING`).bind(caller.uid, params[0]),
        env.DB.prepare(`DELETE FROM close_friends WHERE user_id = ?1 AND friend_id = ?2`).bind(caller.uid, params[0]),
      ]);
      return { ok: true };
    },
  ],
  [
    'DELETE',
    /^\/api\/me\/blocks\/([\w.-]{1,128})$/,
    async ({ env, caller, params }) => {
      await env.DB.prepare(`DELETE FROM blocks WHERE user_id = ?1 AND blocked_id = ?2`).bind(caller.uid, params[0]).run();
      return { ok: true };
    },
  ],
  [
    'PUT',
    /^\/api\/me\/close-friends\/([\w.-]{1,128})$/,
    async ({ env, caller, params }) => {
      await env.DB.prepare(`INSERT INTO close_friends (user_id, friend_id) VALUES (?1, ?2) ON CONFLICT DO NOTHING`)
        .bind(caller.uid, params[0])
        .run();
      return { ok: true };
    },
  ],
  [
    'DELETE',
    /^\/api\/me\/close-friends\/([\w.-]{1,128})$/,
    async ({ env, caller, params }) => {
      await env.DB.prepare(`DELETE FROM close_friends WHERE user_id = ?1 AND friend_id = ?2`).bind(caller.uid, params[0]).run();
      return { ok: true };
    },
  ],

  // --- events
  [
    'POST',
    /^\/api\/events$/,
    async ({ env, caller, request }) => createEvent(env, caller, await readBody(request)),
  ],
  ['GET', /^\/api\/events\/([\w-]{3,80})$/, async ({ env, caller, params }) => loadEventFor(env, caller.uid, params[0])],
  [
    'PATCH',
    /^\/api\/events\/([\w-]{3,80})$/,
    async ({ env, caller, request, params }) => updateEvent(env, caller, params[0], await readBody(request)),
  ],
  [
    'POST',
    /^\/api\/events\/([\w-]{3,80})\/rsvp$/,
    async ({ env, caller, request, params }) => {
      const { intent } = await readBody<{ intent?: RsvpIntent }>(request);
      return rsvp(env, caller, params[0], intent as RsvpIntent);
    },
  ],
  [
    'PUT',
    /^\/api\/events\/([\w-]{3,80})\/mute$/,
    async ({ env, caller, params }) => {
      await loadEventFor(env, caller.uid, params[0]);
      await env.DB.prepare(`INSERT INTO mutes (user_id, event_id) VALUES (?1, ?2) ON CONFLICT DO NOTHING`)
        .bind(caller.uid, params[0])
        .run();
      return { ok: true };
    },
  ],
  [
    'DELETE',
    /^\/api\/events\/([\w-]{3,80})\/mute$/,
    async ({ env, caller, params }) => {
      // Un-quieting also clears a decline, so the event is open to RSVP again.
      await env.DB.batch([
        env.DB.prepare(`DELETE FROM mutes WHERE user_id = ?1 AND event_id = ?2`).bind(caller.uid, params[0]),
        env.DB.prepare(`DELETE FROM attendees WHERE user_id = ?1 AND event_id = ?2 AND status = 'declined'`).bind(
          caller.uid,
          params[0]
        ),
      ]);
      return { ok: true };
    },
  ],
  [
    'POST',
    /^\/api\/events\/([\w-]{3,80})\/comments$/,
    async ({ env, caller, request, params }) => {
      const event = await loadEventFor(env, caller.uid, params[0]);
      const { text } = await readBody<{ text?: unknown }>(request);
      await env.DB.prepare(
        `INSERT INTO comments (id, event_id, author_id, text, is_host, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
      )
        .bind(newId('m'), params[0], caller.uid, str(text, 'text', { min: 1, max: 1000 }), event.hostId === ME ? 1 : 0, now())
        .run();
      return loadEventFor(env, caller.uid, params[0]);
    },
  ],
  [
    'POST',
    /^\/api\/events\/([\w-]{3,80})\/broadcast$/,
    async ({ env, caller, request, params }) => broadcast(env, caller, params[0], await readBody(request)),
  ],
  [
    'POST',
    /^\/api\/events\/([\w-]{3,80})\/reports$/,
    async ({ env, caller, request, params }) => {
      const event = await loadEventFor(env, caller.uid, params[0]);
      const body = await readBody<{ reason?: unknown; note?: unknown }>(request);
      const title = (event as { title?: string }).title ?? 'Unknown event';
      await env.DB.prepare(
        `INSERT INTO reports (id, reporter_id, event_id, event_title, reason, note, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
      )
        .bind(newId('r'), caller.uid, params[0], title, str(body.reason, 'reason', { min: 1, max: 40 }), optStr(body.note, 'note', 1000) ?? '', now())
        .run();
      await pushAlerts(env, [
        {
          userId: caller.uid,
          type: 'circle',
          tier: 'logistics',
          title: 'Report received',
          desc: `Thanks — the safety team is reviewing "${title}". You can see your reports in Settings.`,
          eventId: params[0],
        },
      ]);
      return { ok: true };
    },
  ],

  // --- circles
  [
    'POST',
    /^\/api\/circles$/,
    async ({ env, caller, request }) => {
      const body = await readBody<Record<string, unknown>>(request);
      const id = acceptId(body.id, 'c');
      const at = now();
      await env.DB.batch([
        env.DB.prepare(
          `INSERT INTO circles (id, name, description, color, category_tag, is_private, invite_code, created_by, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
        ).bind(
          id,
          str(body.name, 'name', { min: 1, max: 60 }),
          optStr(body.description, 'description', 300) ?? 'Curated hangout circle',
          '#5D5FEF',
          (optStr(body.categoryTag, 'categoryTag', 20) ?? 'COMMUNITY').toUpperCase(),
          body.isPrivate === false ? 0 : 1,
          inviteCode(),
          caller.uid,
          at
        ),
        env.DB.prepare(`INSERT INTO circle_members (circle_id, user_id, role, joined_at) VALUES (?1, ?2, 'Creator', ?3)`).bind(
          id,
          caller.uid,
          at
        ),
      ]);
      return (await loadCircles(env, caller.uid, id))[0];
    },
  ],
  [
    'GET',
    /^\/api\/circles\/([\w-]{3,80})$/,
    async ({ env, caller, params, url }) => {
      const [circle] = await loadCircles(env, caller.uid, params[0]);
      if (!circle) throw new HttpError(404, 'That circle is not here');
      if (circle.isPrivate && !circle.isJoined) {
        // A private circle is visible only to someone holding its invite code.
        const row = await env.DB.prepare(`SELECT invite_code FROM circles WHERE id = ?1`)
          .bind(params[0])
          .first<{ invite_code: string }>();
        if (!row || url.searchParams.get('invite') !== row.invite_code) {
          throw new HttpError(404, 'That circle is not here');
        }
      }
      return circle;
    },
  ],
  [
    'POST',
    /^\/api\/circles\/([\w-]{3,80})\/join$/,
    async ({ env, caller, request, params }) => {
      const body = await readBody<{ inviteCode?: unknown }>(request);
      const circle = await env.DB.prepare(`SELECT name, is_private, invite_code, created_by FROM circles WHERE id = ?1`)
        .bind(params[0])
        .first<{ name: string; is_private: number; invite_code: string; created_by: string }>();
      if (!circle) throw new HttpError(404, 'That circle is not here');
      if (circle.is_private === 1 && body.inviteCode !== circle.invite_code) {
        throw new HttpError(403, 'You need an invite to join this circle');
      }
      const res = await env.DB.prepare(
        `INSERT INTO circle_members (circle_id, user_id, role, joined_at) VALUES (?1, ?2, 'Member', ?3) ON CONFLICT DO NOTHING`
      )
        .bind(params[0], caller.uid, now())
        .run();
      if (res.meta.changes > 0 && circle.created_by !== caller.uid) {
        await pushAlerts(env, [
          {
            userId: circle.created_by,
            type: 'circle',
            tier: 'circleActivity',
            title: `${caller.name} joined ${circle.name}`,
            desc: 'Say hi in the next plan you post.',
            circleId: params[0],
          },
        ]);
      }
      return (await loadCircles(env, caller.uid, params[0]))[0];
    },
  ],
  [
    'POST',
    /^\/api\/circles\/([\w-]{3,80})\/leave$/,
    async ({ env, caller, params }) => {
      await env.DB.prepare(`DELETE FROM circle_members WHERE circle_id = ?1 AND user_id = ?2`).bind(params[0], caller.uid).run();
      return { ok: true };
    },
  ],

  // --- alerts
  [
    'POST',
    /^\/api\/alerts\/read-all$/,
    async ({ env, caller }) => {
      await env.DB.prepare(`UPDATE alerts SET unread = 0 WHERE user_id = ?1 AND unread = 1`).bind(caller.uid).run();
      return { ok: true };
    },
  ],
  [
    'POST',
    /^\/api\/alerts\/([\w-]{3,80})\/read$/,
    async ({ env, caller, params }) => {
      await env.DB.prepare(`UPDATE alerts SET unread = 0 WHERE id = ?1 AND user_id = ?2`).bind(params[0], caller.uid).run();
      return { ok: true };
    },
  ],
  [
    'DELETE',
    /^\/api\/alerts\/([\w-]{3,80})$/,
    async ({ env, caller, params }) => {
      await env.DB.prepare(`DELETE FROM alerts WHERE id = ?1 AND user_id = ?2`).bind(params[0], caller.uid).run();
      return { ok: true };
    },
  ],
  [
    'DELETE',
    /^\/api\/alerts$/,
    async ({ env, caller }) => {
      await env.DB.prepare(`DELETE FROM alerts WHERE user_id = ?1`).bind(caller.uid).run();
      return { ok: true };
    },
  ],
];

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  if (url.pathname === '/api/health') return json({ ok: true });

  const caller = await authenticate(request, env);
  await ensureUser(env, caller);

  for (const [method, pattern, handler] of routes) {
    if (method !== request.method) continue;
    const match = pattern.exec(url.pathname);
    if (!match) continue;
    return json(await handler({ env, caller, request, params: match.slice(1), url }));
  }
  throw new HttpError(404, 'No such endpoint');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      // Static app; wrangler.jsonc routes unknown paths to index.html for the SPA.
      return env.ASSETS.fetch(request);
    }
    try {
      return await handleApi(request, env, url);
    } catch (err) {
      if (err instanceof AuthError) return json({ error: err.message }, 401);
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      console.error(err);
      return json({ error: 'Something went wrong on our side' }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
