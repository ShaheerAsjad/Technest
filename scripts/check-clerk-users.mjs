import { clerkClient } from '@clerk/nextjs/server';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(join(__dirname, '../.env.local'), 'utf8');

const client = await clerkClient();

try {
  const users = await client.users.getUserList();
  console.log('Clerk Users Count:', users.data.length);
  
  for (const u of users.data) {
    const email = u.emailAddresses[0]?.emailAddress;
    console.log(`User ID: ${u.id} | Email: ${email} | Metadata:`, u.publicMetadata);
  }
} catch (err) {
  console.error('Clerk fetch error:', err);
}
