import sql from '@/lib/db';
import { json, readJson, serverError, NO_STORE, clientIp } from '@/lib/api';
import { cleanText, isValidEmail } from '@/lib/validators';
import { rateLimit } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

// Public endpoint used by the Contact page and the B2B quote form.
// Messages land in the admin Support Inbox where staff can reply by e-mail.
export async function POST(request) {
  try {
    const body = await readJson(request);
    if (!body) return json({ error: 'Invalid request.' }, 400, NO_STORE);

    // Honeypot: real users never fill the hidden "website" field.
    if (body.website) return json({ success: true }, 200, NO_STORE);

    if (!(await rateLimit(`support:${clientIp(request)}`, 6, 600))) {
      return json({ error: 'Too many messages. Please wait a few minutes and try again.' }, 429, NO_STORE);
    }

    const name = cleanText(body.name, 100);
    const email = cleanText(body.email, 150);
    const subject = cleanText(body.subject, 160) || 'Website Contact Form';
    const message = String(body.message ?? '').replace(/\u0000/g, '').trim().slice(0, 4000);

    if (!isValidEmail(email)) return json({ error: 'Please enter a valid email address.' }, 400, NO_STORE);
    if (message.length < 5) return json({ error: 'Please write a short message.' }, 400, NO_STORE);

    await sql`
      INSERT INTO support_messages (customer_name, customer_email, subject, message)
      VALUES (${name}, ${email}, ${subject}, ${message})
    `;
    return json({ success: true }, 200, NO_STORE);
  } catch (err) {
    return serverError('api/support', err, 'Could not send your message. Please try again.');
  }
}
