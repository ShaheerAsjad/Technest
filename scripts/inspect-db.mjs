import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(join(__dirname, '../.env.local'), 'utf8');
const dbUrl = envFile.match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1];

const sql = neon(dbUrl);

try {
  const columns = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'products'
  `;
  console.log('Products Table Columns:', JSON.stringify(columns, null, 2));

  const categories = await sql`SELECT * FROM categories`;
  console.log('Categories:', JSON.stringify(categories, null, 2));
} catch (err) {
  console.error('Error inspecting DB:', err);
}
