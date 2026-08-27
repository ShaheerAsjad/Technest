import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

// Clerk sends user.created / user.updated / user.deleted events here.
// Configure this URL in Clerk Dashboard → Webhooks → Add Endpoint:
//   https://yourdomain.com/api/webhooks/clerk
// Subscribe to: user.created, user.updated, user.deleted
// Copy the "Signing Secret" it gives you into CLERK_WEBHOOK_SECRET.
export async function POST(request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET is not set in environment variables.');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const body = await request.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Clerk webhook verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const eventType = evt.type;
  const data = evt.data;

  try {
    if (eventType === 'user.created' || eventType === 'user.updated') {
      const id = data.id;
      const email = data.email_addresses?.[0]?.email_address || '';
      const firstName = data.first_name || '';
      const lastName = data.last_name || '';
      const imageUrl = data.image_url || '';

      // Upsert: create the row on first sign-in, keep it fresh after.
      // Role/permissions are NEVER overwritten here — only an admin
      // (via the Staff page) can change those, so a profile edit in
      // Clerk never accidentally demotes/promotes anyone.
      await sql`
        INSERT INTO users (id, email, first_name, last_name, image_url, updated_at)
        VALUES (${id}, ${email}, ${firstName}, ${lastName}, ${imageUrl}, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          image_url = EXCLUDED.image_url,
          updated_at = CURRENT_TIMESTAMP
      `;
    }

    if (eventType === 'user.deleted') {
      const id = data.id;
      if (id) {
        await sql`DELETE FROM users WHERE id = ${id}`;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Clerk webhook DB sync error:', error);
    return NextResponse.json({ error: 'Database sync failed' }, { status: 500 });
  }
}
