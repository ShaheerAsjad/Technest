import sql from '@/lib/db';
import { json, readJson, serverError, NO_STORE } from '@/lib/api';
import { requireStaffAccess, actorName } from '@/lib/permissions';
import { writeAuditLog } from '@/lib/audit';
import { cleanText } from '@/lib/validators';
import { bustCatalog } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const access = await requireStaffAccess('inventory');
  if (!access.ok) return json({ error: access.error }, access.status, NO_STORE);
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (!Number.isFinite(id)) return json({ error: 'Invalid category.' }, 400, NO_STORE);
    const b = await readJson(request);
    if (!b) return json({ error: 'Invalid request.' }, 400, NO_STORE);

    if (typeof b.name === 'string' && cleanText(b.name, 100).length >= 2) {
      await sql`UPDATE categories SET name = ${cleanText(b.name, 100)} WHERE id = ${id}`;
    }
    if (['networking', 'consumer'].includes(b.department)) {
      await sql`UPDATE categories SET department = ${b.department} WHERE id = ${id}`;
    }
    if (b.sortOrder !== undefined && Number.isFinite(Number(b.sortOrder))) {
      await sql`UPDATE categories SET sort_order = ${Math.trunc(Number(b.sortOrder))} WHERE id = ${id}`;
    }
    if (typeof b.isActive === 'boolean') {
      await sql`UPDATE categories SET is_active = ${b.isActive} WHERE id = ${id}`;
    }
    if (b.parentId !== undefined) {
      const parentId = b.parentId ? parseInt(b.parentId, 10) : null;
      if (parentId === id) return json({ error: 'A category cannot be its own parent.' }, 400, NO_STORE);
      await sql`UPDATE categories SET parent_id = ${parentId} WHERE id = ${id}`;
    }
    await writeAuditLog({ actorUserId: access.user.id, actorName: actorName(access.user), action: 'category.updated', targetType: 'category', targetId: id, details: b });
    bustCatalog();
    return json({ success: true }, 200, NO_STORE);
  } catch (err) {
    return serverError('admin/categories PATCH', err, 'Could not update category.');
  }
}

export async function DELETE(_request, { params }) {
  const access = await requireStaffAccess('inventory');
  if (!access.ok) return json({ error: access.error }, access.status, NO_STORE);
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (!Number.isFinite(id)) return json({ error: 'Invalid category.' }, 400, NO_STORE);
    const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM products WHERE category_id = ${id}`;
    if (n > 0) return json({ error: `This category still has ${n} product(s). Move or archive them first (or just disable the category).` }, 409, NO_STORE);
    const [{ k }] = await sql`SELECT COUNT(*)::int AS k FROM categories WHERE parent_id = ${id}`;
    if (k > 0) return json({ error: 'This category has sub-categories. Remove or move them first.' }, 409, NO_STORE);
    await sql`DELETE FROM categories WHERE id = ${id}`;
    await writeAuditLog({ actorUserId: access.user.id, actorName: actorName(access.user), action: 'category.deleted', targetType: 'category', targetId: id });
    bustCatalog();
    return json({ success: true }, 200, NO_STORE);
  } catch (err) {
    return serverError('admin/categories DELETE', err, 'Could not delete category.');
  }
}
