/**
 * The Worker applies its own migrations, so a deploy needs no manual
 * database step: Wrangler creates the D1 database on first deploy, and the
 * first request after that creates the tables.
 *
 * Applied migrations are recorded in `d1_migrations`, the same table
 * `wrangler d1 migrations apply` uses, so the CLI and the Worker agree on
 * what has run. Every migration must be safe to run twice (IF NOT EXISTS),
 * because two cold isolates can race to apply it.
 *
 * Add a migration: write worker/migrations/000N_name.sql and list it below.
 */
import m0001 from '../migrations/0001_init.sql';

const MIGRATIONS: [name: string, sql: string][] = [['0001_init.sql', m0001]];

/** Splits a migration into statements. Comments are dropped first; no statement contains a `;`. */
function statements(sql: string): string[] {
  return sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .map(line => line.replace(/\s--\s.*$/, ''))
    .join('\n')
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
}

async function migrate(db: D1Database): Promise<void> {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS d1_migrations (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         name TEXT UNIQUE,
         applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
       )`
    )
    .run();
  const applied = new Set(
    (await db.prepare(`SELECT name FROM d1_migrations`).all<{ name: string }>()).results.map(r => r.name)
  );
  for (const [name, sql] of MIGRATIONS) {
    if (applied.has(name)) continue;
    // One batch is one transaction: a migration lands whole or not at all.
    await db.batch([
      ...statements(sql).map(s => db.prepare(s)),
      db.prepare(`INSERT OR IGNORE INTO d1_migrations (name) VALUES (?1)`).bind(name),
    ]);
  }
}

let ready: Promise<void> | null = null;

/** Runs once per isolate; a failure is retried on the next request. */
export function ensureSchema(db: D1Database): Promise<void> {
  ready ??= migrate(db).catch(err => {
    ready = null;
    throw err;
  });
  return ready;
}
