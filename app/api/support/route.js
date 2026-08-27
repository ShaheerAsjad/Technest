import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

// Public endpoint — the Contact page calls this in addition to
// Formspree, so the message also lands in the admin Support Inbox
// where staff can reply directly (and the reply is emailed back).
export async function POST(request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!email || !message) {
      return NextResponse.json({ error: 'Email and message are required.' }, { status: 400 });
    }

    await sql`
      INSERT INTO support_messages (customer_name, customer_email, subject, message)
      VALUES (${name || ''}, ${email}, ${subject || 'Website Contact Form'}, ${message})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Support message save error:', error);
    return NextResponse.json({ error: 'Could not save your message.' }, { status: 500 });
  }
}
