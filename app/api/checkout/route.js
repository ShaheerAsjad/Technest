import { auth } from '@clerk/nextjs/server';
import sql from '@/lib/db';
import { json, readJson, serverError, NO_STORE, clientIp } from '@/lib/api';
import { getStoreSettings } from '@/lib/settings';
import { computePricing } from '@/lib/pricing';
import { loadCartLines, findCouponByCode, reserveStock, releaseStock, PAYMENT_LABELS } from '@/lib/checkout';
import { normalizePkPhone, cleanText, isValidEmail } from '@/lib/validators';
import { rateLimit } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/checkout
 * The server is the single source of truth: prices, stock, shipping, tax and coupon are ALL
 * recomputed here from the database. Anything the browser sends about money is ignored.
 */
export async function POST(request) {
  let reservedLines = [];
  let reservedIds = [];
  try {
    const { userId } = await auth();
    if (!userId) return json({ error: 'Please sign in to place an order.' }, 401, NO_STORE);

    if (!(await rateLimit(`checkout:${userId}`, 12, 600)) || !(await rateLimit(`checkout-ip:${clientIp(request)}`, 30, 600))) {
      return json({ error: 'Too many attempts. Please wait a few minutes and try again.' }, 429, NO_STORE);
    }

    const body = await readJson(request);
    if (!body) return json({ error: 'Invalid request.' }, 400, NO_STORE);

    // ---- validate customer details ---------------------------------------
    const name = cleanText(body.name, 100);
    const address = cleanText(body.address, 300);
    const city = cleanText(body.city, 60);
    const notes = cleanText(body.notes, 500);
    const phone = normalizePkPhone(body.phone);
    const email = cleanText(body.email, 120);
    const idem = /^[A-Za-z0-9_-]{8,80}$/.test(String(body.idempotencyKey || '')) ? String(body.idempotencyKey) : null;

    if (name.length < 2) return json({ error: 'Please enter your full name.' }, 400, NO_STORE);
    if (!phone) return json({ error: 'Enter a valid Pakistani mobile number (e.g. 03001234567).' }, 400, NO_STORE);
    if (address.length < 6) return json({ error: 'Please enter your full delivery address.' }, 400, NO_STORE);
    if (city.length < 2) return json({ error: 'Please enter your city.' }, 400, NO_STORE);
    if (email && !isValidEmail(email)) return json({ error: 'Email address looks invalid.' }, 400, NO_STORE);

    const settings = await getStoreSettings({ fresh: true });
    const paymentMethod = body.paymentMethod === 'bank' ? 'bank' : 'cod';
    if (paymentMethod === 'cod' && !settings.payment.codEnabled) {
      return json({ error: 'Cash on Delivery is currently unavailable.' }, 400, NO_STORE);
    }
    if (paymentMethod === 'bank' && !settings.payment.bankTransferEnabled) {
      return json({ error: 'Bank transfer is currently unavailable.' }, 400, NO_STORE);
    }

    // ---- idempotency: double click / retry returns the SAME order --------
    if (idem) {
      const dup = await sql`SELECT id, total_amount FROM orders WHERE idempotency_key = ${idem} AND user_id = ${userId} LIMIT 1`;
      if (dup[0]) return json({ success: true, orderId: dup[0].id, total: Number(dup[0].total_amount), duplicate: true }, 200, NO_STORE);
    }

    // ---- authoritative cart + pricing -------------------------------------
    const { lines, problems } = await loadCartLines(body.items ?? body.cartItems, { clip: false });
    if (problems.length) return json({ error: problems[0].message, problems }, 409, NO_STORE);
    if (!lines.length) return json({ error: 'Your cart is empty.' }, 400, NO_STORE);

    const { coupon, error: couponLookupError } = await findCouponByCode(body.coupon);
    if (String(body.coupon || '').trim() && (couponLookupError || !coupon)) {
      return json({ error: couponLookupError || 'Invalid coupon code.' }, 400, NO_STORE);
    }
    const pricing = computePricing({ items: lines, settings, city, coupon, paymentMethod });
    if (pricing.couponError) return json({ error: pricing.couponError }, 400, NO_STORE);
    if (pricing.minOrderProblem) return json({ error: pricing.minOrderProblem }, 400, NO_STORE);

    // ---- 1) reserve stock atomically ---------------------------------------
    const reservation = await reserveStock(lines);
    reservedLines = lines;
    reservedIds = reservation.reserved;
    if (!reservation.ok) {
      await releaseStock(lines, reservedIds);
      reservedIds = [];
      return json({ error: 'Sorry, one of the items just went out of stock. Please review your cart.' }, 409, NO_STORE);
    }

    // ---- 2) create the order ----------------------------------------------
    const orderItems = lines.map((l) => ({
      id: l.id, name: l.name, sku: l.sku, price: l.price, quantity: l.quantity, image: l.image, slug: l.slug,
    }));
    const snapshot = { ...pricing, items: undefined, city, paymentMethod };
    let orderId;
    try {
      const rows = await sql`
        INSERT INTO orders (user_id, customer_name, phone, address, city, items, total_amount, payment_method, status,
                            subtotal, discount_amount, coupon_code, shipping_fee, tax_amount, cod_fee, pricing_snapshot,
                            notes, idempotency_key)
        VALUES (${userId}, ${name}, ${phone}, ${address}, ${city}, ${JSON.stringify(orderItems)}::jsonb,
                ${pricing.total}, ${PAYMENT_LABELS[paymentMethod]}, 'Order Placed',
                ${pricing.subtotal}, ${pricing.discount}, ${pricing.couponCode}, ${pricing.shipping}, ${pricing.tax}, ${pricing.codFee},
                ${JSON.stringify(snapshot)}::jsonb, ${notes || null}, ${idem})
        RETURNING id
      `;
      orderId = rows[0]?.id;
      if (!orderId) throw new Error('Order insert returned no id');
    } catch (insertErr) {
      await releaseStock(lines, reservedIds).catch((e) => console.error('[checkout] release after insert failure:', e?.message));
      reservedIds = [];
      if (String(insertErr?.message).includes('orders_idem_uq')) {
        const dup = await sql`SELECT id, total_amount FROM orders WHERE idempotency_key = ${idem} LIMIT 1`;
        if (dup[0]) return json({ success: true, orderId: dup[0].id, total: Number(dup[0].total_amount), duplicate: true }, 200, NO_STORE);
      }
      throw insertErr;
    }

    // ---- 3) count the coupon use (respecting max_uses) ------------------------
    if (pricing.couponCode) {
      const used = await sql`
        UPDATE coupons SET used_count = used_count + 1
        WHERE UPPER(code) = ${pricing.couponCode} AND (max_uses IS NULL OR used_count < max_uses)
        RETURNING id
      `;
      if (!used[0]) {
        await sql`DELETE FROM orders WHERE id = ${orderId}`;
        await releaseStock(lines, reservedIds);
        reservedIds = [];
        return json({ error: 'This coupon has just reached its usage limit. Please remove it and try again.' }, 409, NO_STORE);
      }
    }

    reservedIds = []; // committed - nothing to roll back any more
    return json({ success: true, orderId, total: pricing.total }, 200, NO_STORE);
  } catch (err) {
    if (reservedLines.length && reservedIds.length) {
      await releaseStock(reservedLines, reservedIds).catch((e) => console.error('[checkout] rollback failed:', e?.message));
    }
    return serverError('api/checkout', err, 'We could not place your order. Nothing was charged. Please try again.');
  }
}
