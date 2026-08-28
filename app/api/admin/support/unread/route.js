import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireStaffAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const access = await requireStaffAccess('support');
    if (!access.ok) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const [row] = await sql`
      SELECT COUNT(*) AS count
      FROM support_messages
      WHERE status = 'open'
    `;

    return NextResponse.json({ unreadCount: Number(row?.count || 0) });
  } catch (err) {
    console.error('[unread support count error]:', err.message);
    return NextResponse.json({ unreadCount: 0 });
  }
}
