-- W8VR schema, v1.
--
-- Free-tier notes (see CLAUDE.md): D1's free plan allows 5M rows read and
-- 100k rows written per day. Writes are the scarcer budget, so nothing here is
-- written on a read path, and the user upsert is a no-op on conflict.
--
-- Events keep their presentational fields in a JSON `data` column. The event
-- shape grows fast (ticketing, lineups, venue intel) and none of those fields
-- are queried by the server, so a JSON blob avoids a migration per field. Only
-- what the server filters or enforces on gets a real column.

CREATE TABLE users (
  id            TEXT PRIMARY KEY,          -- Firebase uid
  name          TEXT NOT NULL,
  email         TEXT,
  photo_url     TEXT,
  tagline       TEXT NOT NULL DEFAULT '',
  home_city     TEXT NOT NULL DEFAULT '',
  -- Roles are decided here, never by the client.
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  notifications TEXT NOT NULL DEFAULT '{"logistics":true,"closeFriends":true,"circleActivity":true,"publicNearby":false}',
  created_at    INTEGER NOT NULL
);

CREATE TABLE game_handles (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  handle  TEXT NOT NULL,
  PRIMARY KEY (user_id, game_id)
);

CREATE TABLE blocks (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id TEXT NOT NULL,
  PRIMARY KEY (user_id, blocked_id)
);

CREATE TABLE close_friends (
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id TEXT NOT NULL,
  PRIMARY KEY (user_id, friend_id)
);

CREATE TABLE circles (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  color        TEXT NOT NULL DEFAULT '#5D5FEF',
  category_tag TEXT NOT NULL DEFAULT 'COMMUNITY',
  is_private   INTEGER NOT NULL DEFAULT 1,
  -- Required to join a private circle. Rotating it revokes old links.
  invite_code  TEXT NOT NULL,
  created_by   TEXT NOT NULL REFERENCES users(id),
  created_at   INTEGER NOT NULL
);

CREATE TABLE circle_members (
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'Member',
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (circle_id, user_id)
);
CREATE INDEX idx_circle_members_user ON circle_members(user_id);

CREATE TABLE events (
  id            TEXT PRIMARY KEY,
  host_id       TEXT NOT NULL REFERENCES users(id),
  privacy       TEXT NOT NULL CHECK (privacy IN ('public', 'circle', 'hidden')),
  circle_id     TEXT REFERENCES circles(id) ON DELETE SET NULL,
  starts_at     TEXT NOT NULL,             -- ISO 8601
  max_spots     INTEGER NOT NULL,
  auto_waitlist INTEGER NOT NULL DEFAULT 1,
  interested    INTEGER NOT NULL DEFAULT 0,
  data          TEXT NOT NULL,             -- JSON: everything else on EventItem
  created_at    INTEGER NOT NULL
);
CREATE INDEX idx_events_starts ON events(starts_at);
CREATE INDEX idx_events_circle ON events(circle_id);
CREATE INDEX idx_events_host ON events(host_id);

CREATE TABLE attendees (
  event_id  TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status    TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'waitlist', 'declined')),
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (event_id, user_id)
);
CREATE INDEX idx_attendees_user ON attendees(user_id);

CREATE TABLE comments (
  id           TEXT PRIMARY KEY,
  event_id     TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  author_id    TEXT NOT NULL REFERENCES users(id),
  text         TEXT NOT NULL,
  is_host      INTEGER NOT NULL DEFAULT 0,
  broadcast_to TEXT,
  created_at   INTEGER NOT NULL
);
CREATE INDEX idx_comments_event ON comments(event_id, created_at);

-- Muting is per person, not per event: you quieting an event must not quiet
-- it for everyone else.
CREATE TABLE mutes (
  user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, event_id)
);

CREATE TABLE alerts (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  tier       TEXT NOT NULL,
  title      TEXT NOT NULL,
  descr      TEXT NOT NULL,
  event_id   TEXT,
  circle_id  TEXT,
  unread     INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_alerts_user ON alerts(user_id, created_at);

CREATE TABLE reports (
  id          TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL REFERENCES users(id),
  event_id    TEXT NOT NULL,
  event_title TEXT NOT NULL,
  reason      TEXT NOT NULL,
  note        TEXT NOT NULL DEFAULT '',
  created_at  INTEGER NOT NULL
);
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
