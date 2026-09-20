import sql from '@/lib/db';
import { json, readJson, serverError, NO_STORE } from '@/lib/api';
import { requireStaffAccess, actorName } from '@/lib/permissions';
import { writeAuditLog } from '@/lib/audit';
import { cleanText } from '@/lib/validators';
import { bustCatalog } from '@/lib/revalidate';
import { notifyBackInStock } from '@/lib/notify';

export const dynamic = 'force-dynamic';

// body field -> [column, coercer]  (whitelist: nothing else can ever be written)
const FIELDS = {
  stock:        ['stock',          (v) => { const n = Math.trunc(Number(v)); return Number.isFinite(n) && n >= 0 ? n : undefined; }],
  price:        ['price',          (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : undefined; }],
  originalPrice:['original_price', (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : undefined; }],
  is_archived:  ['is_archived',    (v) => (typeof v === 'boolean' ? v : undefined)],
  isOnSale:     ['is_on_sale',     (v) => (typeof v === 'boolean' ? v : undefined)],
  isFeatured:   ['is_featured',    (v) => (typeof v === 'boolean' ? v : undefined)],
  freeShipping: ['free_shipping',  (v) => (typeof v === 'boolean' ? v : undefined)],
  title:        ['title',          (v) => (cleanText(v, 200) || undefined)],
  description:  ['description',    (v) => (typeof v === 'string' ? cleanText(v, 5000) : undefined)],
  brand:        ['brand',          (v) => (typeof v === 'string' ? cleanText(v, 120) || null : undefined)],
  sku:          ['sku',            (v) => (typeof v === 'string' ? cleanText(v, 80) || null : undefined)],
  image:        ['image',          (v) => (cleanText(v, 2000) || undefined)],
  categoryId:   ['category_id',    (v) => (v === null || v === '' ? null : Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : undefined)],
  taxRate:      ['tax_rate',       (v) => (v === null || v === '' ? null : Number.isFinite(Number(v)) ? Math.min(100, Math.max(0, Number(v))) : undefined)],
};

export async function PATCH(request, { params }) {
  const access = await requireStaffAccess('inventory');
  if (!access.ok) return json({ error: access.error }, access.status, NO_STORE);
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (!Number.isFinite(id)) return json({ error: 'Invalid product.' }, 400, NO_STORE);
    const body = await readJson(request);
    if (!body) return json({ error: 'Invalid request.' }, 400, NO_STORE);

    const sets = []; const values = [];
    for (const [key, [col, coerce]] of Object.entries(FIELDS)) {
      if (!(key in body)) continue;
      const v = coerce(body[key]);
      if (v === undefined) return json({ error: `Invalid value for ${key}.` }, 400, NO_STORE);
      values.push(v); sets.push(`${col} = $${values.length}`);
    }
    const hasGallery = Array.isArray(body.images);
    if (!sets.length && !hasGallery && body.specs === undefined) return json({ error: 'Nothing to update.' }, 400, NO_STORE);

    // gallery (max 10 image URLs). The first one is also the main image.
    if (hasGallery) {
      const gallery = body.images.map((u) => cleanText(u, 2000)).filter(Boolean).slice(0, 10);
      values.push(JSON.stringify(gallery)); sets.push(`images = $${values.length}::jsonb`);
      if (gallery[0] && !('image' in body)) { values.push(gallery[0]); sets.push(`image = $${values.length}`); }
    } else if (typeof body.image === 'string' && cleanText(body.image, 2000)) {
      // only the main image was changed -> keep the gallery in sync
      values.push(JSON.stringify([cleanText(body.image, 2000)])); sets.push(`images = $${values.length}::jsonb`);
    }
    // specs: plain { "Key": "Value" } object
    if (body.specs !== undefined) {
      const specs = {};
      if (body.specs && typeof body.specs === 'object' && !Array.isArray(body.specs)) {
        for (const [k, v] of Object.entries(body.specs).slice(0, 40)) {
          const key = cleanText(k, 60); const val = cleanText(v, 200);
          if (key && val) specs[key] = val;
        }
      }
      values.push(JSON.stringify(specs)); sets.push(`specs = $${values.length}::jsonb`);
    }

    let prevStock = null;
    if ('stock' in body) {
      const prev = await sql`SELECT stock FROM products WHERE id = ${id}`;
      prevStock = prev[0] ? Number(prev[0].stock) : null;
    }

    values.push(id);
    const rows = await sql.query(`UPDATE products SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING id, stock`, values);
    if (!rows.length) return json({ error: 'Product not found.' }, 404, NO_STORE);

    // Product is available again -> e-mail everybody who asked to be notified
    let notified = null;
    if (prevStock !== null && prevStock <= 0 && Number(rows[0].stock) > 0) {
      notified = await notifyBackInStock(id);
    }

    await writeAuditLog({ actorUserId: access.user.id, actorName: actorName(access.user), action: 'product.updated', targetType: 'product', targetId: id, details: body });
    bustCatalog();
    return json({ success: true, notified }, 200, NO_STORE);
  } catch (err) {
    if (/products_sku_uq|duplicate key/i.test(String(err.message))) return json({ error: 'That SKU already exists on another product.' }, 409, NO_STORE);
    return serverError('admin/products PATCH', err, 'Could not update product.');
  }
}

export async function DELETE(_request, { params }) {
  const access = await requireStaffAccess('inventory');
  if (!access.ok) return json({ error: access.error }, access.status, NO_STORE);
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (!Number.isFinite(id)) return json({ error: 'Invalid product.' }, 400, NO_STORE);
    const [product] = await sql`SELECT id, title FROM products WHERE id = ${id}`;
    if (!product) return json({ error: 'Product not found.' }, 404, NO_STORE);

    try { await sql`DELETE FROM reviews WHERE product_id = ${id}`; } catch { /* no reviews table */ }
    await sql`DELETE FROM products WHERE id = ${id}`;

    await writeAuditLog({ actorUserId: access.user.id, actorName: actorName(access.user), action: 'product.deleted', targetType: 'product', targetId: id, details: { title: product.title } });
    bustCatalog();
    return json({ success: true }, 200, NO_STORE);
  } catch (err) {
    if (/foreign key|violates/i.test(String(err.message))) {
      return json({ error: 'Cannot delete - this product is referenced elsewhere. Use Archive instead.' }, 409, NO_STORE);
    }
    return serverError('admin/products DELETE', err, 'Failed to delete product.');
  }
}
