import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireStaffAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const access = await requireStaffAccess('orders');
    if (!access.ok) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get('since');

    let row;
    if (sinceParam && !isNaN(Number(sinceParam)) && Number(sinceParam) > 0) {
      const sinceDate = new Date(Number(sinceParam)).toISOString();
      [row] = await sql`
        SELECT COUNT(*) AS count
        FROM orders
        WHERE created_at > ${sinceDate}::timestamp
      `;
    } else {
      [row] = await sql`
        SELECT COUNT(*) AS count
        FROM orders
        WHERE status = 'Order Placed'
      `;
    }

    return NextResponse.json({ unreadCount: Number(row?.count || 0) });
  } catch (err) {
    console.error('[unread orders count error]:', err.message);
    return NextResponse.json({ unreadCount: 0 });
  }
}
