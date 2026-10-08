// End-to-end checks against a running Worker in dev-auth mode:
//   npm run dev:api        (in one terminal)
//   npm run test:api       (in another)
// Each run uses fresh user ids, so it can be repeated against the same local DB.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.API_BASE ?? 'http://localhost:8787';
const run = Math.random().toString(36).slice(2, 8);

const devToken = user => Buffer.from(JSON.stringify(user)).toString('base64url');

function as(uid, name) {
  const user = { uid: `${uid}-${run}`, name, email: `${uid}-${run}@example.test` };
  return async (method, path, body) => {
    const res = await fetch(BASE + path, {
      method,
      headers: { authorization: `Dev ${devToken(user)}`, 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json();
    return { status: res.status, data };
  };
}

const host = as('host', 'Hana Host');
const ana = as('ana', 'Ana Guest');
const ben = as('ben', 'Ben Guest');
const inTwoDays = new Date(Date.now() + 2 * 86_400_000).toISOString();

test('rejects callers without a token', async () => {
  const res = await fetch(`${BASE}/api/state`);
  assert.equal(res.status, 401);
});

test('state bootstraps a new user as a plain user', async () => {
  const { status, data } = await host('GET', '/api/state');
  assert.equal(status, 200);
  assert.equal(data.me.role, 'user');
  assert.equal(data.me.notifications.logistics, true);
});

test('circle invite, circle-only events, address privacy, seat race and waitlist promotion', async () => {
  // Private circle: invisible without the code, joinable with it.
  const circle = (await host('POST', '/api/circles', { name: `Board games ${run}` })).data;
  assert.ok(circle.inviteCode, 'creator receives the invite code');
  assert.equal((await ana('GET', `/api/circles/${circle.id}`)).status, 404);
  assert.equal((await ana('POST', `/api/circles/${circle.id}/join`, { inviteCode: 'wrong' })).status, 403);
  const joined = await ana('POST', `/api/circles/${circle.id}/join`, { inviteCode: circle.inviteCode });
  assert.equal(joined.status, 200);
  assert.equal(joined.data.isJoined, true);

  // Ben cannot post into a circle he is not in.
  const denied = await ben('POST', '/api/events', {
    title: 'Sneaky',
    privacy: 'circle',
    circleId: circle.id,
    startsAt: inTwoDays,
    maxSpots: 4,
  });
  assert.equal(denied.status, 403);

  // One seat, auto-waitlist on.
  const created = await host('POST', '/api/events', {
    id: `e-test-${run}`,
    title: 'Catan night',
    privacy: 'circle',
    circleId: circle.id,
    startsAt: inTwoDays,
    maxSpots: 2,
    autoWaitlist: true,
    exactAddress: '12 Secret St',
    location: 'Logan Square',
    hostId: 'someone-else', // server-owned: must be ignored
  });
  assert.equal(created.status, 200);
  const event = created.data;
  assert.equal(event.id, `e-test-${run}`, 'client-proposed id is kept');
  assert.equal(event.hostId, 'me', 'host sees themselves as me');
  assert.equal(event.origin, 'server');
  assert.equal(event.exactAddress, '12 Secret St');

  // Circle members see it without the address; outsiders cannot see it at all.
  const anaView = (await ana('GET', `/api/events/${event.id}`)).data;
  assert.equal(anaView.exactAddress, undefined, 'address hidden until confirmed');
  assert.equal((await ben('GET', `/api/events/${event.id}`)).status, 404);
  assert.ok(!(await ben('GET', '/api/state')).data.events.some(e => e.id === event.id));

  // Ana takes the last seat (host holds the first); a second "going" is idempotent.
  const anaGoing = await ana('POST', `/api/events/${event.id}/rsvp`, { intent: 'going' });
  assert.equal(anaGoing.data.outcome.status, 'going');
  assert.equal(anaGoing.data.event.exactAddress, '12 Secret St', 'address revealed once going');
  const again = await ana('POST', `/api/events/${event.id}/rsvp`, { intent: 'going' });
  assert.equal(again.data.outcome.status, 'going');

  // Ben joins the circle, finds the event full, lands on the waitlist.
  await ben('POST', `/api/circles/${circle.id}/join`, { inviteCode: circle.inviteCode });
  const benRsvp = await ben('POST', `/api/events/${event.id}/rsvp`, { intent: 'going' });
  assert.equal(benRsvp.data.outcome.status, 'waitlist');

  // Ana drops out; Ben is promoted and told so.
  const anaOut = await ana('POST', `/api/events/${event.id}/rsvp`, { intent: 'no' });
  assert.equal(anaOut.data.outcome.promoted, 'Ben Guest');
  const benState = (await ben('GET', '/api/state')).data;
  const benEvent = benState.events.find(e => e.id === event.id);
  assert.equal(benEvent.attendees.find(a => a.id === 'me').status, 'going');
  assert.ok(benState.alerts.some(a => a.title.startsWith('A spot opened')));

  // Only the host can broadcast or edit, and the broadcast reaches the guest list.
  assert.equal((await ben('POST', `/api/events/${event.id}/broadcast`, { message: 'hi', target: 'all' })).status, 403);
  const sent = await host('POST', `/api/events/${event.id}/broadcast`, { message: 'Bring snacks', target: 'going' });
  assert.equal(sent.data.reached, 1);
  const edited = await host('PATCH', `/api/events/${event.id}`, {
    patch: { title: 'Catan + Ticket to Ride' },
    changeSummary: 'Second game added',
  });
  assert.equal(edited.data.title, 'Catan + Ticket to Ride');
  assert.equal((await ben('PATCH', `/api/events/${event.id}`, { patch: { title: 'mine now' } })).status, 403);
});

test('seat claims are atomic under a race', async () => {
  const event = (
    await host('POST', '/api/events', {
      title: 'One seat left',
      privacy: 'public',
      startsAt: inTwoDays,
      maxSpots: 2,
      autoWaitlist: true,
    })
  ).data;
  const racers = Array.from({ length: 6 }, (_, i) => as(`racer${i}`, `Racer ${i}`));
  const results = await Promise.all(racers.map(r => r('POST', `/api/events/${event.id}/rsvp`, { intent: 'going' })));
  const statuses = results.map(r => r.data.outcome.status);
  assert.equal(statuses.filter(s => s === 'going').length, 1, `exactly one racer gets the seat: ${statuses}`);
  const final = (await host('GET', `/api/events/${event.id}`)).data;
  assert.equal(final.attendees.filter(a => a.status === 'going').length, 2);
});

test('profile, handles and alerts belong to the caller', async () => {
  assert.equal((await ana('PATCH', '/api/me', { tagline: 'Always down for trivia', notifications: { logistics: false } })).status, 200);
  assert.equal((await ana('PUT', '/api/me/games/wordle', { handle: 'ana_w' })).status, 200);
  const state = (await ana('GET', '/api/state')).data;
  assert.equal(state.me.tagline, 'Always down for trivia');
  assert.equal(state.me.notifications.logistics, true, 'logistics alerts cannot be turned off');
  assert.equal(state.me.gameHandles.wordle, 'ana_w');

  assert.ok(state.alerts.length > 0);
  await ana('POST', '/api/alerts/read-all');
  assert.ok((await ana('GET', '/api/state')).data.alerts.every(a => !a.unread));
});
