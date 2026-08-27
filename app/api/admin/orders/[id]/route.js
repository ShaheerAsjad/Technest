import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireStaffAccess } from '@/lib/permissions';
import { writeAuditLog } from '@/lib/audit';
import { sendOrderStatusEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['Order Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export async function PATCH(request, { params }) {
  const access = await requireStaffAccess('orders');
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { id } = await params;
  const { status } = await request.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  try {
    const [order] = await sql`
      UPDATE orders SET status = ${status} WHERE id = ${id}
      RETURNING id, user_id, customer_name
    `;

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    await writeAuditLog({
      actorUserId: access.user.id,
      actorName: `${access.user.first_name || ''} ${access.user.last_name || ''}`.trim(),
      action: 'order.status_changed',
      targetType: 'order',
      targetId: id,
      details: { status },
    });

    // Automated email trigger for Shipped / Delivered
    if (status === 'Shipped' || status === 'Delivered') {
      const [userRow] = await sql`SELECT email FROM users WHERE id = ${order.user_id}`;
      if (userRow?.email) {
        await sendOrderStatusEmail({
          to: userRow.email,
          customerName: order.customer_name,
          orderId: order.id,
          status: status.toLowerCase(),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Order status update error:', error);
    return NextResponse.json({ error: 'Could not update order status.' }, { status: 500 });
  }
}
