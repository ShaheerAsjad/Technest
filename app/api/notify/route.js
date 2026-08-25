import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/notify  { productId, email }
export async function POST(request) {
  try {
    const { productId, email } = await request.json();

    if (!productId || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    await sql`
      INSERT INTO notify_subscribers (product_id, email)
      VALUES (${productId}, ${email})
      ON CONFLICT (product_id, email) DO NOTHING
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notify POST error:', error);
    return NextResponse.json(
      { error: 'Could not save your request. Please try again shortly.' },
      { status: 500 }
    );
  }
}
