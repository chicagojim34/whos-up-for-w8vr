# W8VR — "Who's Up for Whatever?"

A front-end prototype of a social coordination app: broadcast an intent to a
circle of friends, collect RSVPs without the group-chat noise, and keep the
logistics in one place.

Built with React 19, TypeScript, Vite and Tailwind v4. Signed out, it is a
self-contained demo that keeps everything in the browser. Signed in, events,
circles, RSVPs and alerts are shared through a Cloudflare Worker backed by D1
(see [Backend](#backend)).

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npm run lint     # eslint
```

To run the shared backend too, in a second terminal:

```bash
npm run db:migrate:local   # once: creates the local D1 database
npm run dev:api            # the Worker on :8787; Vite proxies /api to it
npm run test:api           # end-to-end API checks against it
```

Then sign in (the simulated sign-in works locally) and the app syncs.

## How it is put together

```
src/
  lib/          Pure logic, no React
    events.ts     Derived capacity, counts, ranking, the address gate
    datetime.ts   ISO → display strings, day grouping, .ics export
    seed.ts       Demo data
    storage.ts    Versioned, fault-tolerant localStorage
    categories.ts The PRD's seven-category taxonomy
  context/      AppContext (events, circles, alerts, contacts, user, reports)
  hooks/        useApp, useToast, useConfirm, useDeviceMode
  components/   StatusRing, Avatar, GlassModal, ShareSheet, QrCode, …
  pages/        Feed, EventDetails, PostEvent, Circles, CircleDetail,
                Discovery, Alerts, Schedule, Settings, NotFound
```

### Derived, not stored

An event stores an `attendees[]` roster, an ISO `startsAt` and a numeric
`distanceMi`. Everything else the UI shows — confirmed/maybe/waitlist counts,
capacity percentage, spots left, the avatar stack, whether it is full — is
computed from that roster in `lib/events.ts`.

This is deliberate. An earlier version stored a `capacity` percentage
*alongside* the counts it could be derived from, and the two disagreed: an
event seeded at 75% was really 48/50, so the ring jumped 21 points the first
time anyone responded. If you add a field, check first whether it can be a
function of the roster instead.

Times are ISO strings, not `"Tomorrow"`. That is what makes the feed rankable
and the schedule groupable — and it keeps "Today" true tomorrow.

### Design tokens

`src/index.css` is the single source of truth. `@theme` declares the palette,
type, radii, shadows and motion; every token is emitted both as a CSS custom
property (`--color-primary`) and as Tailwind utilities (`bg-primary`,
`text-primary`). Component classes live in `@layer components`.

Two rules from `DESIGN.md` are load-bearing:

- **The No-Line rule.** Sections are separated by tonal background shifts and
  ambient, primary-tinted shadows — never a 1px rule. If you reach for a
  border, reach for a surface layer instead.
- **The surface ladder.** `surface` → `surface-low` → `surface-high` →
  `surface-highest`, with `surface-lowest` (white) for cards that should lift.

The capacity ring is green while there is room, brand indigo from 70%, and red
with an urgency pulse from 90% — the PRD's "green = open, red = full".

## Behaviour worth knowing

- **Smart muting.** Declining an event quiets it: it collapses out of the feed
  and stops producing alerts. `visibleAlerts` in `AppContext` applies both mute
  and notification-tier suppression; `alerts` is the unfiltered list.
- **Notification tiers.** Logistics for events you joined are always on.
  Close friends, circle activity and nearby public events are switchable in
  Settings, and the Alerts page says how many alerts were held back.
- **Address privacy.** `exactAddress` and virtual room links are only rendered
  to confirmed guests and the host — see `canSeeExactAddress`.
- **Auto-waitlist.** Vacating a seat promotes whoever queued first, and
  notifies the promoted guest and the host.
- **RSVP is idempotent.** Pressing "Going" twice is a no-op, not a toggle.

## Online games

`src/lib/games.ts` is the catalogue of games a circle can play together — NYT
Games, Words with Friends, Chess.com, Board Game Arena, Jackbox and others.
Each entry records how a session runs (`daily`, `async`, `live`), which
platforms it is on, and how people join each other (`handle`, `roomCode`,
`link`, `share`).

**On "linking accounts".** None of these services offer public OAuth or a
friend API to third parties — you cannot sign a user into Words with Friends
or read their NYT friend list from outside. So `gameHandles` is a *directory*,
not a connected login: you save the username you already use, your circles can
read it, and a tap opens the game. Anything that claimed to be a real account
link here would be lying to the user.

Game links are ordinary `https` URLs on purpose. On iOS and Android a
universal link opens the installed app and falls back to the web version,
which is more reliable than guessing at `scheme://` URLs that fail silently
when the app is not installed.

Circle recommendations (`recommendForCircle`) rank by how many members already
have a handle saved, then by how little coordination the game needs — daily
and turn-based games outrank live ones, because a circle that struggles to
pick a restaurant will not get eight people online at once.

`Online/Play` is an eighth category on top of the PRD's seven. An online game
is neither an in-person Entertainment outing nor a Home/Social game night — it
has no venue, and the async ones have no start time — so folding it into an
existing category would have made the feed filter lie.

## Backend

One Cloudflare Worker (`worker/src/index.ts`) serves both the built app and
`/api/*`, so the browser talks to one origin. Data lives in D1 (SQLite); the
schema is `worker/migrations/`. Everything is on free tiers:

| Service | Free limit that matters | First paid step |
| --- | --- | --- |
| Workers | 100k requests/day | Workers Paid ($5/mo) for 10M/month |
| D1 | 5 GB, 5M rows read/day, 100k rows written/day | Same $5 plan raises reads/writes |
| Firebase Auth | Email and Google sign-in, no cap that a small app hits | Phone/SMS auth, or Identity Platform at 50k MAU |

To stay well inside those, the client polls `/api/state` once a minute and
only while the tab is visible, returning users cost a read rather than a
write, and fan-out alerts are capped per action.

**Auth.** The app sends its Firebase ID token; the Worker verifies it against
Google's public keys (no Admin SDK). Roles are decided by the server: everyone
is `user` unless their email is listed in the `ADMIN_EMAILS` secret.
`npm run dev:api` also accepts unsigned dev tokens (`AUTH_MODE=dev`) so the
app works locally without a Firebase project; a deployed Worker never does.

**Privacy is enforced on the server.** Circle-only events are only returned
to members, private circles only to members or holders of the invite link,
and street addresses, room links and game room codes are stripped for anyone
who is not a confirmed guest. Seat claims are a single conditional insert, so
two people racing for the last spot cannot both get it.

**Local and shared, side by side.** Items from the server carry
`origin: 'server'`. They are merged with the local demo data, never written
to `localStorage`, and hidden again on sign-out. Changing one sends the change
to the API and re-syncs; local items behave exactly as before.

### Deploying

```bash
npx wrangler login
npx wrangler d1 create w8vr          # paste the database_id into wrangler.jsonc
# set FIREBASE_PROJECT_ID in wrangler.jsonc, and VITE_FIREBASE_* in .env.production
npx wrangler secret put ADMIN_EMAILS # optional, comma-separated
npm run deploy                       # build, migrate the remote DB, deploy
```

## Demo state

State persists to `localStorage` under `w8vr.v3.*`. Reads are guarded — a
corrupt or stale value is discarded rather than thrown, so a bad payload
cannot white-screen the app. Bump the version in `lib/storage.ts` when the
shape of a slice changes.

"Reset demo data" lives in the desktop sidebar and at the bottom of Settings.

## Layout modes

Layout follows the viewport via `matchMedia` (`useDeviceMode`). The
Auto/Mobile/Tablet/Desktop control in the header is a preview override for
demoing other widths; "Auto" hands control back to the window.

## Reference documents

`stitch_w8vr_project_prd/` holds the original PRD and the `DESIGN.md` design
system these were built against.
