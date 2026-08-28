import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(join(__dirname, '../.env.local'), 'utf8');
const dbUrl = envFile.match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1];

const sql = neon(dbUrl);

// Restore both main accounts to admin
await sql`
  UPDATE users 
  SET role = 'admin', permissions = '[]'::jsonb
  WHERE email IN ('shaheerasjad.05@gmail.com', 'mshaf1122334455@gmail.com')
`;

const rows = await sql`SELECT id, email, role FROM users`;
console.log('Restored Users in DB:', JSON.stringify(rows, null, 2));
