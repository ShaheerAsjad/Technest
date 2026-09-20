// npm run make-admin -- someone@example.com   -> gives that (already signed-up) user the admin role.
// Safe replacement for the old public /api/setup-admin route (which has been removed).
import { neon } from '@neondatabase/serverless';
import { loadEnv, c } from './_env.mjs';

loadEnv();
const email = String(process.argv[2] || '').trim().toLowerCase();
if (!email || !email.includes('@')) {
  console.error('Usage: npm run make-admin -- someone@example.com');
  process.exit(1);
}
if (!process.env.DATABASE_URL) { console.error(c.red('DATABASE_URL missing (.env.local)')); process.exit(1); }
const sql = neon(process.env.DATABASE_URL);
const rows = await sql`UPDATE users SET role = 'admin', permissions = '[]'::jsonb WHERE LOWER(email) = ${email} RETURNING id, email, role`;
if (rows.length) {
  console.log(c.green(`OK: ${rows[0].email} is now admin.`));
} else {
  console.log(c.yellow(`No user with e-mail ${email} yet.`));
  console.log('Either sign in to the site once with that e-mail, then run this command again,');
  console.log(`or add it to ADMIN_EMAILS in .env.local / Vercel env (comma separated) - that also works immediately.`);
}
