import sql from '@/lib/db';
import { json, readJson, serverError, NO_STORE } from '@/lib/api';
import { requireStaffAccess, actorName } from '@/lib/permissions';
import { writeAuditLog } from '@/lib/audit';
import { cleanText } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const access = await requireStaffAccess('inventory');
  if (!access.ok) return json({ error: access.error }, access.status, NO_STORE);
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (!Number.isFinite(id)) return json({ error: 'Invalid brand.' }, 400, NO_STORE);
    const b = await readJson(request);
    if (!b) return json({ error: 'Invalid request.' }, 400, NO_STORE);

    if (typeof b.name === 'string' && cleanText(b.name, 120).length >= 2) await sql`UPDATE brands SET name = ${cleanText(b.name, 120)} WHERE id = ${id}`;
    if (b.logo !== undefined) await sql`UPDATE brands SET logo_url = ${cleanText(b.logo, 2000) || null} WHERE id = ${id}`;
    if (typeof b.featured === 'boolean') await sql`UPDATE brands SET is_featured = ${b.featured} WHERE id = ${id}`;
    if (typeof b.isActive === 'boolean') await sql`UPDATE brands SET is_active = ${b.isActive} WHERE id = ${id}`;
    if (b.sort !== undefined && Number.isFinite(Number(b.sort))) await sql`UPDATE brands SET sort_order = ${Math.trunc(Number(b.sort))} WHERE id = ${id}`;

    await writeAuditLog({ actorUserId: access.user.id, actorName: actorName(access.user), action: 'brand.updated', targetType: 'brand', targetId: id, details: { ...b, logo: b.logo ? '(set)' : undefined } });
    return json({ success: true }, 200, NO_STORE);
  } catch (err) {
    return serverError('admin/brands PATCH', err, 'Could not update the brand.');
  }
}

export async function DELETE(_request, { params }) {
  const access = await requireStaffAccess('inventory');
  if (!access.ok) return json({ error: access.error }, access.status, NO_STORE);
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (!Number.isFinite(id)) return json({ error: 'Invalid brand.' }, 400, NO_STORE);
    await sql`DELETE FROM brands WHERE id = ${id}`;
    await writeAuditLog({ actorUserId: access.user.id, actorName: actorName(access.user), action: 'brand.deleted', targetType: 'brand', targetId: id });
    return json({ success: true }, 200, NO_STORE);
  } catch (err) {
    return serverError('admin/brands DELETE', err, 'Could not delete the brand.');
  }
}
