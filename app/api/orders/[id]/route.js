import { auth } from '@clerk/nextjs/server';
import sql from '@/lib/db';
import { json, serverError, NO_STORE, clientIp } from '@/lib/api';
import { normalizePkPhone } from '@/lib/validators';
import { rateLimit } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/orders/:id[?phone=03xxxxxxxxx]
 *  - The signed-in OWNER of the order can always read it.
 *  - Anyone else must supply the phone number used on the order.
 * (The old version returned every order, including name/phone/address, to anybody.)
 */
export async function GET(request, { params }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (!Number.isFinite(id) || id <= 0) return json({ error: 'Order not found.' }, 404, NO_STORE);

    let userId = null;
    try { userId = (await auth()).userId; } catch { /* not signed in */ }

    const phoneParam = new URL(request.url).searchParams.get('phone');

    const rows = await sql`SELECT * FROM orders WHERE id = ${id} LIMIT 1`;
    const order = rows[0];

    const isOwner = Boolean(order && userId && order.user_id === userId);
    let phoneOk = false;

    if (!isOwner) {
      if (!phoneParam) {
        return json({ error: 'Enter the phone number used for this order to view it.', needsPhone: true }, 403, NO_STORE);
      }
      if (!(await rateLimit(`order-lookup:${clientIp(request)}`, 20, 600))) {
        return json({ error: 'Too many lookups. Please try again in a few minutes.' }, 429, NO_STORE);
      }
      const given = normalizePkPhone(phoneParam);
      const stored = order ? normalizePkPhone(order.phone) : null;
      phoneOk = Boolean(order && given && stored && given === stored);
      if (!phoneOk) return json({ error: 'No order found with these details.' }, 404, NO_STORE);
    }

    let items = order.items;
    if (typeof items === 'string') { try { items = JSON.parse(items); } catch { items = []; } }

    return json(
      {
        id: order.id,
        status: order.status,
        created_at: order.created_at,
        payment_method: order.payment_method,
        items: Array.isArray(items) ? items : [],
        total_amount: Number(order.total_amount),
        subtotal: order.subtotal !== null && order.subtotal !== undefined ? Number(order.subtotal) : null,
        discount_amount: Number(order.discount_amount) || 0,
        shipping_fee: Number(order.shipping_fee) || 0,
        tax_amount: Number(order.tax_amount) || 0,
        cod_fee: Number(order.cod_fee) || 0,
        coupon_code: order.coupon_code || null,
        city: order.city,
        customer_name: order.customer_name,
        ...(isOwner ? { address: order.address, phone: order.phone } : {}),
      },
      200,
      NO_STORE
    );
  } catch (err) {
    return serverError('api/orders/[id]', err, 'Could not load this order.');
  }
}
