import sql from '@/lib/db';
import { json, readJson, serverError, NO_STORE } from '@/lib/api';
import { requireStaffAccess, actorName } from '@/lib/permissions';
import { writeAuditLog } from '@/lib/audit';
import { slugify } from '@/lib/format';
import { cleanText } from '@/lib/validators';
import { bustCatalog } from '@/lib/revalidate';
import { DEPARTMENTS } from '@/lib/departments';

export const dynamic = 'force-dynamic';


export async function GET() {
  const access = await requireStaffAccess('inventory');
  if (!access.ok) return json({ error: access.error }, access.status, NO_STORE);
  try {
    const rows = await sql`
      SELECT c.id, c.name, c.slug, c.parent_id, c.department, c.sort_order, c.is_active,
             (SELECT COUNT(*)::int FROM products p WHERE p.category_id = c.id) AS product_count
      FROM categories c ORDER BY c.department, c.sort_order, c.name`;
    const byId = new Map(rows.map((r) => [r.id, r]));
    const out = rows.map((r) => {
      const parent = r.parent_id ? byId.get(r.parent_id) : null;
      const dept = DEPARTMENTS[r.department] || r.department;
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        parentId: r.parent_id,
        department: r.department,
        sortOrder: r.sort_order,
        isActive: r.is_active !== false,
        productCount: r.product_count,
        label: `${dept} › ${parent ? `${parent.name} › ` : ''}${r.name}`,
      };
    });
    return json(out, 200, NO_STORE);
  } catch (err) {
    console.error('[admin/categories GET]', err.message);
    return json([], 200, NO_STORE); // keep the product form usable
  }
}

export async function POST(request) {
  const access = await requireStaffAccess('inventory');
  if (!access.ok) return json({ error: access.error }, access.status, NO_STORE);
  try {
    const b = await readJson(request);
    const name = cleanText(b?.name, 100);
    if (name.length < 2) return json({ error: 'Category name is required.' }, 400, NO_STORE);
    const department = Object.keys(DEPARTMENTS).includes(b?.department) ? b.department : 'consumer';
    const parentId = b?.parentId ? parseInt(b.parentId, 10) : null;
    const sortOrder = Number.isFinite(Number(b?.sortOrder)) ? Math.trunc(Number(b.sortOrder)) : 0;

    let slug = slugify(b?.slug || name) || 'category';
    const taken = new Set((await sql`SELECT slug FROM categories`).map((r) => r.slug));
    const base = slug; let n = 2;
    while (taken.has(slug)) slug = `${base}-${n++}`;

    try { await sql`SELECT setval(pg_get_serial_sequence('categories','id'), COALESCE((SELECT MAX(id) FROM categories),0)+1, false)`; } catch { /* ignore */ }
    const [row] = await sql`
      INSERT INTO categories (name, slug, parent_id, department, sort_order, is_active)
      VALUES (${name}, ${slug}, ${parentId}, ${department}, ${sortOrder}, TRUE) RETURNING id, name, slug`;
    await writeAuditLog({ actorUserId: access.user.id, actorName: actorName(access.user), action: 'category.created', targetType: 'category', targetId: row.id, details: { name, department } });
    bustCatalog();
    return json({ category: row }, 201, NO_STORE);
  } catch (err) {
    if (/duplicate|unique/i.test(String(err.message))) return json({ error: 'A category with that name already exists.' }, 409, NO_STORE);
    return serverError('admin/categories POST', err, 'Could not create category.');
  }
}
