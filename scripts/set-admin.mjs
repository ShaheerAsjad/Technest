import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(join(__dirname, '../.env.local'), 'utf8');
const dbUrl = envFile.match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1];

const sql = neon(dbUrl);

// Set your user as admin
const userId = 'user_3IUYOtxNuLgSSdK7taUq9cWjs4z';

await sql`
  UPDATE users 
  SET role = 'admin', permissions = '[]'::jsonb
  WHERE id = ${userId}
`;

const [updated] = await sql`SELECT id, email, role FROM users WHERE id = ${userId}`;
console.log('Updated user:', JSON.stringify(updated, null, 2));
