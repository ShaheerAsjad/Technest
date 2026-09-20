import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireStaffAccess } from '@/lib/permissions';
import { writeAuditLog } from '@/lib/audit';
import { sendOrderStatusEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['Order Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const VALID_PAYMENT = ['Pending', 'Paid', 'Refunded'];

export async function PATCH(request, { params }) {
  const access = await requireStaffAccess('orders');
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { id } = await params;
  let body = null;
  try { body = await request.json(); } catch { /* handled below */ }
  const { status, paymentStatus } = body || {};

  if (status === undefined && paymentStatus === undefined) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }
  if (paymentStatus !== undefined && !VALID_PAYMENT.includes(paymentStatus)) {
    return NextResponse.json({ error: 'Invalid payment status.' }, { status: 400 });
  }

  try {
    const orderId = parseInt(id, 10);
    if (!Number.isFinite(orderId)) {
      return NextResponse.json({ error: 'Invalid order.' }, { status: 400 });
    }

    // Payment-only update (e.g. bank transfer received)
    if (status === undefined) {
      const [paid] = await sql`UPDATE orders SET payment_status = ${paymentStatus} WHERE id = ${orderId} RETURNING id`;
      if (!paid) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      await writeAuditLog({
        actorUserId: access.user.id,
        actorName: `${access.user.first_name || ''} ${access.user.last_name || ''}`.trim(),
        action: 'order.payment_changed',
        targetType: 'order',
        targetId: orderId,
        details: { paymentStatus },
      });
      return NextResponse.json({ success: true });
    }

    const [order] = await sql`
      UPDATE orders SET status = ${status} WHERE id = ${orderId}
      RETURNING id, user_id, customer_name, items, stock_restored
    `;

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Cancelling an order puts the stock back - exactly once (guarded by stock_restored).
    if (status === 'Cancelled') {
      const claimed = await sql`
        UPDATE orders SET stock_restored = TRUE
        WHERE id = ${orderId} AND stock_restored = FALSE RETURNING items
      `;
      if (claimed[0]) {
        let items = claimed[0].items;
        if (typeof items === 'string') { try { items = JSON.parse(items); } catch { items = []; } }
        for (const it of Array.isArray(items) ? items : []) {
          const pid = parseInt(it.id, 10);
          const qty = Math.trunc(Number(it.quantity));
          if (Number.isFinite(pid) && qty > 0) {
            await sql`UPDATE products SET stock = stock + ${qty} WHERE id = ${pid}`;
          }
        }
      }
    } else if (order.stock_restored) {
      // Re-opening a cancelled order: take the stock out again (only if still available)
      let items = order.items;
      if (typeof items === 'string') { try { items = JSON.parse(items); } catch { items = []; } }
      const list = (Array.isArray(items) ? items : []).map((it) => ({ id: parseInt(it.id, 10), quantity: Math.trunc(Number(it.quantity)) }))
        .filter((it) => Number.isFinite(it.id) && it.quantity > 0);
      let ok = true;
      for (const it of list) {
        const r = await sql`UPDATE products SET stock = stock - ${it.quantity} WHERE id = ${it.id} AND stock >= ${it.quantity} RETURNING id`;
        if (!r[0]) ok = false;
      }
      await sql`UPDATE orders SET stock_restored = FALSE WHERE id = ${orderId}`;
      if (!ok) console.warn('[admin/orders] re-opened order', orderId, 'but some items had insufficient stock');
    }

    if (paymentStatus !== undefined) {
      await sql`UPDATE orders SET payment_status = ${paymentStatus} WHERE id = ${orderId}`;
    } else if (status === 'Delivered') {
      // Cash on Delivery: the money is collected at the door
      await sql`UPDATE orders SET payment_status = 'Paid'
                WHERE id = ${orderId} AND payment_status = 'Pending' AND payment_method ILIKE 'cash%'`;
    } else if (status === 'Cancelled') {
      await sql`UPDATE orders SET payment_status = 'Pending' WHERE id = ${orderId} AND payment_status <> 'Paid'`;
    }

    await writeAuditLog({
      actorUserId: access.user.id,
      actorName: `${access.user.first_name || ''} ${access.user.last_name || ''}`.trim(),
      action: 'order.status_changed',
      targetType: 'order',
      targetId: orderId,
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
