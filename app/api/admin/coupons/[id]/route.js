import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireStaffAccess } from '@/lib/permissions';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const access = await requireStaffAccess('coupons');
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { id } = await params;
    const { active } = await request.json();

    await sql`UPDATE coupons SET active = ${active} WHERE id = ${id}`;

    await writeAuditLog({
      actorUserId: access.user.id,
      actorName: `${access.user.first_name || ''} ${access.user.last_name || ''}`.trim(),
      action: 'coupon.toggled',
      targetType: 'coupon',
      targetId: id,
      details: { active },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/coupons PATCH] Error:', err.message);
    return NextResponse.json({ error: 'Could not update coupon.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const access = await requireStaffAccess('coupons');
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { id } = await params;
    await sql`DELETE FROM coupons WHERE id = ${id}`;

    await writeAuditLog({
      actorUserId: access.user.id,
      actorName: `${access.user.first_name || ''} ${access.user.last_name || ''}`.trim(),
      action: 'coupon.deleted',
      targetType: 'coupon',
      targetId: id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/coupons DELETE] Error:', err.message);
    return NextResponse.json({ error: 'Could not delete coupon.' }, { status: 500 });
  }
}
