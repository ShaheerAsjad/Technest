import sql from '@/lib/db';
import { json, readJson, serverError, NO_STORE } from '@/lib/api';
import { requireStaffAccess, actorName } from '@/lib/permissions';
import { writeAuditLog } from '@/lib/audit';
import { slugify } from '@/lib/format';
import { cleanText } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function GET() {
  const access = await requireStaffAccess('inventory');
  if (!access.ok) return json({ error: access.error }, access.status, NO_STORE);
  try {
    const rows = await sql`
      SELECT b.id, b.name, b.slug, b.logo_url, b.sort_order, b.is_featured, b.is_active,
             (SELECT COUNT(*)::int FROM products p WHERE LOWER(p.brand) = LOWER(b.name)) AS product_count
      FROM brands b ORDER BY b.sort_order ASC, b.name ASC`;
    return json(rows, 200, NO_STORE);
  } catch (err) {
    return serverError('admin/brands GET', err, 'Could not load brands.');
  }
}

export async function POST(request) {
  const access = await requireStaffAccess('inventory');
  if (!access.ok) return json({ error: access.error }, access.status, NO_STORE);
  try {
    const b = await readJson(request);
    const name = cleanText(b?.name, 120);
    if (name.length < 2) return json({ error: 'Brand name is required.' }, 400, NO_STORE);
    const slug = slugify(name) || 'brand';
    const logo = cleanText(b?.logo, 2000) || null;
    try { await sql`SELECT setval(pg_get_serial_sequence('brands','id'), COALESCE((SELECT MAX(id) FROM brands),0)+1, false)`; } catch { /* ignore */ }
    const [row] = await sql`
      INSERT INTO brands (name, slug, logo_url, sort_order, is_featured, is_active)
      VALUES (${name}, ${slug}, ${logo}, ${Number.isFinite(Number(b?.sort)) ? Math.trunc(Number(b.sort)) : 50}, ${Boolean(b?.featured)}, TRUE)
      RETURNING id, name, slug`;
    await writeAuditLog({ actorUserId: access.user.id, actorName: actorName(access.user), action: 'brand.created', targetType: 'brand', targetId: row.id, details: { name } });
    return json({ brand: row }, 201, NO_STORE);
  } catch (err) {
    if (/duplicate|unique/i.test(String(err.message))) return json({ error: 'That brand already exists.' }, 409, NO_STORE);
    return serverError('admin/brands POST', err, 'Could not create the brand.');
  }
}
