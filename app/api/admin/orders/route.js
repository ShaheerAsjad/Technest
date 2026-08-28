import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireStaffAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const access = await requireStaffAccess('orders');
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const orders = await sql`
      SELECT o.*, u.email AS customer_email
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
      LIMIT 200
    `;

    return NextResponse.json(orders);
  } catch (err) {
    console.error('[admin/orders] Error:', err.message);
    return NextResponse.json({ error: 'Failed to load orders.' }, { status: 500 });
  }
}
