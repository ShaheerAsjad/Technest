import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(join(__dirname, '../.env.local'), 'utf8');
const dbUrl = envFile.match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1];

const sql = neon(dbUrl);

const rows = await sql`SELECT id, email, role, permissions FROM users`;
console.log('Users in DB:', JSON.stringify(rows, null, 2));
