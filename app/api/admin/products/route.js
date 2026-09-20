import sql from '@/lib/db';
import { json, readJson, serverError, NO_STORE } from '@/lib/api';
import { requireStaffAccess, actorName } from '@/lib/permissions';
import { writeAuditLog } from '@/lib/audit';
import { slugify } from '@/lib/format';
import { cleanText } from '@/lib/validators';
import { bustCatalog } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

export async function GET() {
  const access = await requireStaffAccess('inventory');
  if (!access.ok) return json({ error: access.error }, access.status, NO_STORE);
  try {
    const products = await sql`
      SELECT p.id, p.title, p.price, p.stock, p.image, p.is_archived,
             p.description, p.original_price, p.is_on_sale, p.is_featured,
             p.sku, p.brand, p.slug, p.free_shipping, p.tax_rate,
             p.category_id, c.name AS category, c.department
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id DESC
      LIMIT 1500
    `;
    return json(products, 200, NO_STORE);
  } catch (err) {
    return serverError('admin/products GET', err, 'Failed to load products.');
  }
}

export async function POST(request) {
  const access = await requireStaffAccess('inventory');
  if (!access.ok) return json({ error: access.error }, access.status, NO_STORE);
  try {
    const b = await readJson(request);
    if (!b) return json({ error: 'Invalid request.' }, 400, NO_STORE);

    const title = cleanText(b.title, 200);
    const numPrice = Number(b.price);
    const numStock = Math.trunc(Number(b.stock));
    if (!title || !Number.isFinite(numPrice) || !Number.isFinite(numStock)) {
      return json({ error: 'Title, price, and stock are required.' }, 400, NO_STORE);
    }
    if (numPrice <= 0) return json({ error: 'Price must be greater than 0.' }, 400, NO_STORE);
    if (numStock < 0) return json({ error: 'Stock cannot be negative.' }, 400, NO_STORE);

    const categoryId = b.categoryId && !isNaN(Number(b.categoryId)) ? parseInt(b.categoryId, 10) : null;
    const origPrice = b.originalPrice && Number(b.originalPrice) > 0 ? Number(b.originalPrice) : numPrice;
    const sku = cleanText(b.sku, 80) || null;
    const brand = cleanText(b.brand, 120) || null;
    const image = cleanText(b.image, 2000) || '/placeholder.svg';
    const taxRate = b.taxRate === '' || b.taxRate === null || b.taxRate === undefined ? null : Math.min(100, Math.max(0, Number(b.taxRate)));

    // unique slug
    const base = slugify(title) || 'product';
    const taken = new Set((await sql`SELECT slug FROM products WHERE slug LIKE ${base + '%'}`).map((r) => r.slug));
    let slug = base; let n = 2;
    while (taken.has(slug)) slug = `${base}-${n++}`;

    try { await sql`SELECT setval(pg_get_serial_sequence('products','id'), COALESCE((SELECT MAX(id) FROM products),0)+1, false)`; } catch { /* ignore */ }

    const [product] = await sql`
      INSERT INTO products (title, description, price, original_price, stock, image, images, category_id,
                            is_on_sale, is_featured, is_archived, sku, slug, brand, free_shipping, tax_rate, source)
      VALUES (${title}, ${cleanText(b.description, 5000)}, ${numPrice}, ${origPrice}, ${numStock}, ${image},
              ${JSON.stringify(image === '/placeholder.svg' ? [] : [image])}::jsonb, ${categoryId},
              ${Boolean(b.isOnSale)}, ${Boolean(b.isFeatured)}, false, ${sku}, ${slug}, ${brand},
              ${Boolean(b.freeShipping)}, ${Number.isFinite(taxRate) ? taxRate : null}, 'manual')
      RETURNING id, title, price, stock, image, slug
    `;

    await writeAuditLog({ actorUserId: access.user.id, actorName: actorName(access.user), action: 'product.created', targetType: 'product', targetId: product.id, details: { title, price: numPrice } });
    bustCatalog();
    return json({ product, message: 'Product created successfully.' }, 201, NO_STORE);
  } catch (err) {
    if (/products_sku_uq|duplicate key/i.test(String(err.message))) {
      return json({ error: 'That SKU already exists on another product.' }, 409, NO_STORE);
    }
    return serverError('admin/products POST', err, 'Could not create the product.');
  }
}
