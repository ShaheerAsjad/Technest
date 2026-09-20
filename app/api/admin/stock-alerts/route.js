import sql from '@/lib/db';
import { json, readJson, serverError, NO_STORE } from '@/lib/api';
import { requireStaffAccess } from '@/lib/permissions';
import { notifyBackInStock } from '@/lib/notify';

export const dynamic = 'force-dynamic';

// Admin > Stock Alerts : who is waiting for which out-of-stock product
export async function GET() {
  const access = await requireStaffAccess('inventory');
  if (!access.ok) return json({ error: access.error }, access.status, NO_STORE);
  try {
    const rows = await sql`
      SELECT n.product_id, p.title, p.slug, p.stock,
             COUNT(*)::int AS total,
             (COUNT(*) FILTER (WHERE n.notified_at IS NULL))::int AS pending,
             MAX(n.created_at) AS last_request
      FROM notify_subscribers n LEFT JOIN products p ON p.id = n.product_id
      GROUP BY n.product_id, p.title, p.slug, p.stock
      ORDER BY pending DESC, last_request DESC NULLS LAST
      LIMIT 200`;
    return json(rows, 200, NO_STORE);
  } catch (err) {
    return serverError('admin/stock-alerts GET', err, 'Could not load stock alerts.');
  }
}

// POST { productId }  -> send the "back in stock" e-mail now (only if the product has stock)
// DELETE { productId } -> forget the waiting list of that product
export async function POST(request) {
  const access = await requireStaffAccess('inventory');
  if (!access.ok) return json({ error: access.error }, access.status, NO_STORE);
  try {
    const b = await readJson(request);
    const id = parseInt(b?.productId, 10);
    if (!Number.isFinite(id)) return json({ error: 'Invalid product.' }, 400, NO_STORE);
    const result = await notifyBackInStock(id);
    return json({ success: true, ...result }, 200, NO_STORE);
  } catch (err) {
    return serverError('admin/stock-alerts POST', err, 'Could not send the notifications.');
  }
}

export async function DELETE(request) {
  const access = await requireStaffAccess('inventory');
  if (!access.ok) return json({ error: access.error }, access.status, NO_STORE);
  try {
    const b = await readJson(request);
    const id = parseInt(b?.productId, 10);
    if (!Number.isFinite(id)) return json({ error: 'Invalid product.' }, 400, NO_STORE);
    await sql`DELETE FROM notify_subscribers WHERE product_id = ${id}`;
    return json({ success: true }, 200, NO_STORE);
  } catch (err) {
    return serverError('admin/stock-alerts DELETE', err, 'Could not clear the list.');
  }
}
