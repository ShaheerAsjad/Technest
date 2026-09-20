// npm run db:backup  -> saves key tables as JSON in ./backups (git-ignored)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { neon } from '@neondatabase/serverless';
import { ROOT, loadEnv, c } from './_env.mjs';

loadEnv();
if (!process.env.DATABASE_URL) { console.error(c.red('DATABASE_URL missing')); process.exit(1); }
const sql = neon(process.env.DATABASE_URL);
const TABLES = ['products', 'categories', 'brands', 'orders', 'coupons', 'users', 'reviews', 'support_messages', 'notify_subscribers', 'audit_logs', 'store_settings'];
const out = {};
for (const t of TABLES) {
  try { out[t] = await sql.query(`SELECT * FROM ${t} LIMIT 100000`); } catch { /* table missing */ }
}
mkdirSync(join(ROOT, 'backups'), { recursive: true });
const file = join(ROOT, 'backups', `backup-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`);
writeFileSync(file, JSON.stringify({ createdAt: new Date().toISOString(), tables: out }, null, 1));
console.log(c.green('Backup saved:'), file, c.dim(Object.entries(out).map(([k, v]) => `${k}:${v.length}`).join(' ')));
