// Runs (1) automatic JSON backup, (2) pending SQL migrations, (3) one-time demo seed.
//   npm run db:migrate            (also runs automatically before `npm run dev` and `npm run build`)
// Env:  SKIP_DB_MIGRATE=1  -> skip everything (escape hatch)
import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { neon } from '@neondatabase/serverless';
import { ROOT, loadEnv, c, withRetry } from './_env.mjs';
import { runSeed } from './seed.mjs';

loadEnv();

if (process.env.SKIP_DB_MIGRATE === '1') {
  console.log(c.yellow('[migrate] SKIP_DB_MIGRATE=1 -> skipped.'));
  process.exit(0);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(c.red('\n[migrate] DATABASE_URL is missing.'));
  console.error('  Local : put it in .env.local (already provided in the zip).');
  console.error('  Vercel: Settings -> Environment Variables -> add DATABASE_URL.\n');
  process.exit(1);
}

const sql = neon(url);
const onVercel = Boolean(process.env.VERCEL);

const BACKUP_TABLES = ['products', 'categories', 'orders', 'coupons', 'users', 'reviews', 'support_messages', 'notify_subscribers', 'audit_logs'];

async function backup() {
  if (onVercel) return; // read-only filesystem; Neon keeps history anyway
  const dir = join(ROOT, 'backups');
  mkdirSync(dir, { recursive: true });
  const out = {};
  for (const t of BACKUP_TABLES) {
    try {
      out[t] = await sql.query(`SELECT * FROM ${t} LIMIT 100000`);
    } catch { /* table may not exist yet */ }
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const file = join(dir, `backup-${stamp}.json`);
  writeFileSync(file, JSON.stringify({ createdAt: new Date().toISOString(), tables: out }, null, 1));
  const counts = Object.entries(out).map(([k, v]) => `${k}:${v.length}`).join(' ');
  console.log(c.green(`[migrate] backup saved -> backups/backup-${stamp}.json`), c.dim(counts));
}

function splitStatements(text) {
  const parts = text.split(/^--;;[ \t]*(optional)?[ \t]*$/m);
  // split() with a capture group yields: [chunk0, cap1, chunk1, cap2, chunk2 ...]
  const stmts = [];
  let optionalNext = false;
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) { optionalNext = parts[i] === 'optional'; continue; }
    const body = parts[i]
      .split(/\r?\n/)
      .filter((l) => !/^\s*--/.test(l))
      .join('\n')
      .trim();
    if (body) stmts.push({ body, optional: i === 0 ? false : optionalNext });
    optionalNext = false;
  }
  return stmts;
}

async function main() {
  console.log(c.bold('[migrate] connecting to database...'));
  await withRetry(() => sql`SELECT 1`, 4);
  await sql`CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  const applied = new Set((await sql`SELECT name FROM schema_migrations`).map((r) => r.name));

  const files = readdirSync(join(ROOT, 'sql')).filter((f) => f.endsWith('.sql')).sort();
  const pending = files.filter((f) => !applied.has(f));
  const needSeed = !applied.has('seed:atlantic-demo-v1');

  if (pending.length === 0 && !needSeed) {
    console.log(c.green('[migrate] database is up to date.'));
    return;
  }

  if (pending.length > 0) {
    await backup();
    for (const file of pending) {
      const stmts = splitStatements(readFileSync(join(ROOT, 'sql', file), 'utf8'));
      console.log(c.bold(`[migrate] applying ${file} (${stmts.length} statements)`));
      let n = 0;
      for (const s of stmts) {
        try {
          await withRetry(() => sql.query(s.body), 3);
          n++;
        } catch (err) {
          if (s.optional) {
            console.warn(c.yellow(`  ~ optional statement skipped: ${String(err.message).slice(0, 120)}`));
          } else {
            console.error(c.red(`\n[migrate] FAILED in ${file}:`));
            console.error(c.dim(s.body.slice(0, 300)));
            console.error(c.red(String(err.message)));
            process.exit(1);
          }
        }
      }
      await sql`INSERT INTO schema_migrations (name) VALUES (${file}) ON CONFLICT (name) DO NOTHING`;
      console.log(c.green(`  ok ${file} (${n} statements)`));
    }
  }

  if (needSeed) {
    const res = await runSeed(sql, {});
    if (res.ok) {
      await sql`INSERT INTO schema_migrations (name) VALUES ('seed:atlantic-demo-v1') ON CONFLICT (name) DO NOTHING`;
    }
  }
  console.log(c.green('[migrate] done.'));
}

main().catch((err) => {
  console.error(c.red('\n[migrate] Error: ' + (err?.message || err)));
  console.error('  Check internet + DATABASE_URL. To bypass temporarily set SKIP_DB_MIGRATE=1');
  process.exit(1);
});
