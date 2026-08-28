import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireStaffAccess } from '@/lib/permissions';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const access = await requireStaffAccess('inventory');
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    try {
      const products = await sql`
        SELECT p.id, p.title, p.price, p.stock, p.image, p.is_archived,
               p.description, p.original_price, p.is_on_sale, p.is_featured,
               p.category_id, c.name AS category
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.id DESC
      `;
      return NextResponse.json(products);
    } catch (fullSchemaErr) {
      console.warn('[admin/products GET] Full schema query failed, using base fallback:', fullSchemaErr.message);
      const fallbackProducts = await sql`
        SELECT p.id, p.title, p.price, p.stock, p.image,
               p.description, p.category_id, c.name AS category
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.id DESC
      `;
      return NextResponse.json(fallbackProducts);
    }
  } catch (err) {
    console.error('[admin/products GET] Error:', err.message);
    return NextResponse.json({ error: 'Failed to load products.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const access = await requireStaffAccess('inventory');
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const {
      title, description, price, originalPrice,
      stock, image, categoryId, isOnSale, isFeatured,
    } = await request.json();

    // Validate required fields
    if (!title || price === undefined || stock === undefined) {
      return NextResponse.json({ error: 'Title, price, and stock are required.' }, { status: 400 });
    }
    if (Number(price) <= 0) {
      return NextResponse.json({ error: 'Price must be greater than 0.' }, { status: 400 });
    }
    if (Number(stock) < 0) {
      return NextResponse.json({ error: 'Stock cannot be negative.' }, { status: 400 });
    }

    const parsedCategoryId = categoryId && !isNaN(Number(categoryId)) ? parseInt(categoryId, 10) : null;
    const numPrice = Number(price);
    const numOrigPrice = originalPrice ? Number(originalPrice) : numPrice;
    const numStock = Number(stock);

    // Sync PostgreSQL sequence for products table to avoid PK constraint collision
    try {
      await sql`SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1) + 1, false)`;
    } catch (seqErr) {
      // Sequence check warning ignored
    }

    let product;
    try {
      // Try full schema insert
      const [inserted] = await sql`
        INSERT INTO products (
          title, description, price, original_price,
          stock, image, category_id, is_on_sale, is_featured, is_archived
        ) VALUES (
          ${title.trim()},
          ${description || ''},
          ${numPrice},
          ${numOrigPrice},
          ${numStock},
          ${image || '/placeholder.png'},
          ${parsedCategoryId},
          ${Boolean(isOnSale)},
          ${Boolean(isFeatured)},
          false
        )
        RETURNING id, title, price, stock, image
      `;
      product = inserted;
    } catch (insertErr) {
      console.warn('[admin/products POST] Full schema insert failed, trying base schema:', insertErr.message);
      // Fallback for base schema
      const [baseInserted] = await sql`
        INSERT INTO products (
          title, description, price, stock, image, category_id
        ) VALUES (
          ${title.trim()},
          ${description || ''},
          ${numPrice},
          ${numStock},
          ${image || '/placeholder.png'},
          ${parsedCategoryId}
        )
        RETURNING id, title, price, stock, image
      `;
      product = baseInserted;
    }

    await writeAuditLog({
      actorUserId: access.user.id,
      actorName: `${access.user.first_name || ''} ${access.user.last_name || ''}`.trim(),
      action: 'product.created',
      targetType: 'product',
      targetId: product.id,
      details: { title, price },
    });

    return NextResponse.json({ product, message: 'Product created successfully and added to database!' }, { status: 201 });
  } catch (err) {
    console.error('[admin/products POST] Error:', err.message);
    return NextResponse.json({ error: `Database Error: ${err.message}` }, { status: 500 });
  }
}
