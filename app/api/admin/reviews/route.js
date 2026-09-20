import sql from '@/lib/db';
import { json, serverError, NO_STORE } from '@/lib/api';
import { requireStaffAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

// Admin > Reviews : newest customer reviews (so spam / abusive ones can be removed)
export async function GET() {
  const access = await requireStaffAccess('inventory');
  if (!access.ok) return json({ error: access.error }, access.status, NO_STORE);
  try {
    const rows = await sql`
      SELECT r.id, r.product_id, r.user_name, r.rating, r.comment, r.created_at, p.title AS product_title, p.slug AS product_slug
      FROM reviews r LEFT JOIN products p ON p.id = r.product_id
      ORDER BY r.id DESC LIMIT 300`;
    return json(rows, 200, NO_STORE);
  } catch (err) {
    return serverError('admin/reviews GET', err, 'Could not load reviews.');
  }
}
