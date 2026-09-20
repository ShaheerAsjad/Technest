// Pre-flight check:  npm run verify   (also runs as part of `npm run check`)
// Prints a clear PASS / WARN / FAIL list. Exit code 1 only on FAIL.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { neon } from '@neondatabase/serverless';
import { ROOT, loadEnv, c } from './_env.mjs';

loadEnv();
let fails = 0, warns = 0;
const ok = (m) => console.log(`  ${c.green('PASS')}  ${m}`);
const warn = (m) => { warns++; console.log(`  ${c.yellow('WARN')}  ${m}`); };
const fail = (m) => { fails++; console.log(`  ${c.red('FAIL')}  ${m}`); };

console.log(c.bold('\nTechNest pre-flight check\n'));

// --- Node / packages -------------------------------------------------------
const [maj, min] = process.versions.node.split('.').map(Number);
(maj > 18 || (maj === 18 && min >= 18)) ? ok(`Node ${process.versions.node}`) : fail(`Node ${process.versions.node} is too old - install Node 18.18+ (20 or 22 recommended)`);
for (const pkg of ['next', '@clerk/nextjs', '@neondatabase/serverless']) {
  existsSync(join(ROOT, 'node_modules', pkg)) ? ok(`package installed: ${pkg}`) : fail(`package missing: ${pkg}  ->  run: npm install`);
}
existsSync(join(ROOT, '.npmrc')) ? ok('.npmrc present (legacy-peer-deps)') : warn('.npmrc missing - npm install may complain about Clerk/Next peer versions');

// --- environment --------------------------------------------------------------
const env = process.env;
const need = ['DATABASE_URL', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'];
for (const k of need) env[k] ? ok(`env ${k} is set`) : fail(`env ${k} is MISSING (check .env.local)`);
if (env.DATABASE_URL && !/^postgres(ql)?:\/\//.test(env.DATABASE_URL)) fail('DATABASE_URL does not look like a postgres:// connection string');
const pk = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '', sk = env.CLERK_SECRET_KEY || '';
if (pk && !pk.startsWith('pk_')) fail('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY should start with pk_');
if (sk && !sk.startsWith('sk_')) fail('CLERK_SECRET_KEY should start with sk_');
if (pk.startsWith('pk_test') && sk.startsWith('sk_live') || pk.startsWith('pk_live') && sk.startsWith('sk_test')) fail('Clerk keys mix test and live modes - they must match');
if (pk.startsWith('pk_test')) warn('Clerk is in TEST/development mode (fine for demo; use live keys for real launch)');
env.ADMIN_EMAILS ? ok(`ADMIN_EMAILS: ${env.ADMIN_EMAILS}`) : warn('ADMIN_EMAILS not set (admins then come only from the users table)');
env.RESEND_API_KEY ? ok('RESEND_API_KEY set (order e-mails on)') : warn('RESEND_API_KEY not set - status e-mails are skipped (optional)');

// --- database -------------------------------------------------------------------
async function db() {
  if (!env.DATABASE_URL) return;
  const sql = neon(env.DATABASE_URL);
  try {
    await sql`SELECT 1`;
    ok('database connection works');
  } catch (e) {
    fail(`cannot connect to the database: ${String(e.message).slice(0, 140)}`);
    return;
  }
  try {
    const applied = (await sql`SELECT name FROM schema_migrations`).map((r) => r.name);
    applied.includes('001_upgrade.sql') ? ok('migration 001_upgrade.sql applied') : warn('migration not applied yet - it runs automatically on `npm run dev` / `npm run build` (or: npm run db:migrate)');
    applied.includes('seed:atlantic-demo-v1') ? ok('demo catalogue seeded') : warn('demo catalogue not seeded yet (runs with the migration)');
  } catch {
    warn('schema_migrations table not found - run: npm run db:migrate');
    return;
  }
  const one = async (q, ...a) => (await sql.query(q, a))[0];
  const cols = await sql`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('products','categories','orders','coupons')`;
  const have = new Set(cols.map((x) => `${x.table_name}.${x.column_name}`));
  const need2 = ['products.slug', 'products.sku', 'products.brand', 'categories.department', 'categories.slug', 'orders.pricing_snapshot', 'coupons.min_order_amount'];
  const missing = need2.filter((x) => !have.has(x));
  missing.length ? fail(`missing columns: ${missing.join(', ')}  ->  run: npm run db:migrate`) : ok('all new columns exist');

  if (!missing.length) {
    const p = await one(`SELECT COUNT(*)::int AS n, COUNT(*) FILTER (WHERE COALESCE(is_archived,false)=false)::int AS live, COUNT(*) FILTER (WHERE category_id IS NULL)::int AS nocat FROM products`);
    ok(`products: ${p.live} live (${p.n} total)`);
    if (p.nocat) warn(`${p.nocat} product(s) have no category (they still show on /products)`);
    const cat = await sql`SELECT department, COUNT(*)::int AS n FROM categories GROUP BY department ORDER BY department`;
    ok(`categories: ${cat.map((x) => `${x.department}=${x.n}`).join(', ') || 'none'}`);
    const dupS = await one(`SELECT COUNT(*)::int AS n FROM (SELECT slug FROM products GROUP BY slug HAVING COUNT(*)>1) t`);
    dupS.n ? fail(`${dupS.n} duplicate product slug(s)`) : ok('product slugs are unique');
    const noImg = await one(`SELECT COUNT(*)::int AS n FROM products WHERE image IS NULL OR image = '' OR image = '/placeholder.svg'`);
    noImg.n ? warn(`${noImg.n} product(s) use the placeholder image`) : ok('all products have an image');
    const st = await one(`SELECT data FROM store_settings WHERE id = 1`).catch(() => null);
    st && st.data && Object.keys(st.data).length ? ok('store settings saved (Admin -> Store Settings)') : warn('store settings use defaults (open Admin -> Store Settings and save once)');
  }
  const admins = await sql`SELECT email, role FROM users WHERE role IN ('admin','employee') ORDER BY role, email`;
  console.log(c.dim(`        staff in database: ${admins.map((a) => `${a.email} (${a.role})`).join(', ') || 'none yet'}`));
  const allow = String(env.ADMIN_EMAILS || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
  const unknown = admins.filter((a) => a.role === 'admin' && !allow.includes(String(a.email || '').toLowerCase()));
  if (unknown.length) warn(`admin role held by e-mails NOT in ADMIN_EMAILS: ${unknown.map((a) => a.email).join(', ')}  -> review in Admin -> Staff & Roles`);
}

await db();

console.log('');
if (fails) { console.log(c.red(`  ${fails} problem(s) must be fixed before deploying.\n`)); process.exit(1); }
console.log(c.green(`  All good${warns ? ` (${warns} warning${warns > 1 ? 's' : ''} above are informational)` : ''}.\n`));
