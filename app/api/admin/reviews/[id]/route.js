import sql from '@/lib/db';
import { json, serverError, NO_STORE } from '@/lib/api';
import { requireStaffAccess, actorName } from '@/lib/permissions';
import { writeAuditLog } from '@/lib/audit';
import { bustCatalog } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

export async function DELETE(_request, { params }) {
  const access = await requireStaffAccess('inventory');
  if (!access.ok) return json({ error: access.error }, access.status, NO_STORE);
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (!Number.isFinite(id)) return json({ error: 'Invalid review.' }, 400, NO_STORE);
    const rows = await sql`DELETE FROM reviews WHERE id = ${id} RETURNING id, product_id`;
    if (!rows[0]) return json({ error: 'Review not found.' }, 404, NO_STORE);
    await writeAuditLog({ actorUserId: access.user.id, actorName: actorName(access.user), action: 'review.deleted', targetType: 'review', targetId: id, details: { productId: rows[0].product_id } });
    bustCatalog();
    return json({ success: true }, 200, NO_STORE);
  } catch (err) {
    return serverError('admin/reviews DELETE', err, 'Could not delete the review.');
  }
}
