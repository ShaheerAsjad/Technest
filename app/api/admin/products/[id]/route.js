import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireStaffAccess } from '@/lib/permissions';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const access = await requireStaffAccess('inventory');
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    if (typeof body.stock === 'number') {
      await sql`UPDATE products SET stock = ${body.stock} WHERE id = ${id}`;
    }
    if (typeof body.price === 'number') {
      await sql`UPDATE products SET price = ${body.price} WHERE id = ${id}`;
    }
    if (typeof body.is_archived === 'boolean') {
      await sql`UPDATE products SET is_archived = ${body.is_archived} WHERE id = ${id}`;
    }

    await writeAuditLog({
      actorUserId: access.user.id,
      actorName: `${access.user.first_name || ''} ${access.user.last_name || ''}`.trim(),
      action: 'product.updated',
      targetType: 'product',
      targetId: id,
      details: body,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product update error:', error);
    return NextResponse.json({ error: 'Could not update product.' }, { status: 500 });
  }
}
